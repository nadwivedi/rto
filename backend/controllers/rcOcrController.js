const axios = require('axios');
const pdfParse = require('pdf-parse');

let groqKeyIndex = 0;
const rateLimitedKeys = new Map();
const RATE_LIMIT_DURATION = 12 * 60 * 60 * 1000; // 12 hours

const getGroqApiKeyInfo = () => {
  const allKeys = [process.env.GROQ_API_KEY, process.env.GROQ_API_KEY_2, process.env.GROQ_API_KEY_3, process.env.GROQ_API_KEY_4].filter(Boolean);
  const now = Date.now();
  for (const [key, timestamp] of rateLimitedKeys.entries()) {
    if (now - timestamp > RATE_LIMIT_DURATION) rateLimitedKeys.delete(key);
  }
  const availableKeys = allKeys.filter(key => !rateLimitedKeys.has(key));
  const keysToUse = availableKeys.length > 0 ? availableKeys : allKeys;
  groqKeyIndex = (groqKeyIndex + 1) % keysToUse.length;
  return { key: keysToUse[groqKeyIndex], totalAvailable: allKeys.length };
}

const markKeyRateLimited = (key) => {
  rateLimitedKeys.set(key, Date.now());
  console.warn(`Groq API key starting with ${key.substring(0, 8)} rate limited. Cooldown for 12 hours.`);
}

const executeWithRetry = async (url, body, retryCount = 0) => {
  const keyInfo = getGroqApiKeyInfo();
  if (retryCount >= keyInfo.totalAvailable) {
    throw new Error('All Groq API keys are currently rate-limited or max retries reached.');
  }
  const currentKey = keyInfo.key;
  try {
    return await axios.post(url, body, {
      headers: {
        'Authorization': `Bearer ${currentKey}`,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    if (error.response?.status === 429) {
      markKeyRateLimited(currentKey);
      return executeWithRetry(url, body, retryCount + 1);
    }
    throw error;
  }
}

const callGroqAPI = async (imageBase64, textPrompt, isPdf = false, backImageBase64 = null) => {
  if (isPdf) {
    // imageBase64 here is actually cleaned PDF text (extracted by pdf-parse + extractRelevantPdfText)

    // Sanitize PDF ligature characters and control chars that confuse LLMs
    const sanitizedText = imageBase64
      .replace(/ﬀ/g, 'ff').replace(/ﬁ/g, 'fi').replace(/ﬂ/g, 'fl')
      .replace(/ﬃ/g, 'ffi').replace(/ﬄ/g, 'ffl').replace(/ﬅ/g, 'st')
      .replace(/\u0000/g, ' ')  // null bytes
      .replace(/[^\x09\x0A\x0D\x20-\x7E\u00A0-\uFFFF]/g, ' ') // strip control chars
      .replace(/[ \t]{3,}/g, '  ') // collapse excessive whitespace
      .trim();

    // Efficient single-turn structure: system sets role, user provides document + task in one shot
    // This saves ~100 tokens vs the old 4-message round-trip while achieving identical accuracy
    const messages = [
      {
        role: 'system',
        content: 'You are a precise insurance document data extractor. Extract ONLY values that literally appear in the document text. Never guess or invent values. Output valid JSON only.'
      },
      {
        role: 'user',
        content: `<DOCUMENT>\n${sanitizedText}\n</DOCUMENT>\n\n${textPrompt}`
      }
    ];

    const makeRequest = (withFormat) => {
      const body = {
        model: 'llama-3.3-70b-versatile',
        messages,
        temperature: 0,
        max_tokens: 512
      };
      if (withFormat) body.response_format = { type: 'json_object' };
      return executeWithRetry('https://api.groq.com/openai/v1/chat/completions', body);
    };

    try {
      const response = await makeRequest(true);
      return response;
    } catch (firstErr) {
      const errCode = firstErr.response?.data?.error?.code;
      if (errCode === 'json_validate_failed' || errCode === 'invalid_request_error') {
        console.warn('Groq json_object mode failed, retrying in free-text mode...');
        return await makeRequest(false);
      }
      throw firstErr;
    }
  } else {
    // Standard vision model - support front + optional back image
    const formattedImage = imageBase64.startsWith('data:image')
      ? imageBase64
      : `data:image/jpeg;base64,${imageBase64}`;

    const contentArray = [
      {
        type: 'text',
        text: textPrompt
      },
      {
        type: 'image_url',
        image_url: { url: formattedImage }
      }
    ];

    // If back image is provided, append it to the content
    if (backImageBase64) {
      const formattedBack = backImageBase64.startsWith('data:image')
        ? backImageBase64
        : `data:image/jpeg;base64,${backImageBase64}`;
      contentArray.push({
        type: 'image_url',
        image_url: { url: formattedBack }
      });
    }

    const makeVisionRequest = (withFormat) => {
      const body = {
        model: 'qwen/qwen3.6-27b',
        messages: [{ role: 'user', content: contentArray }],
        temperature: 0.1,
        max_completion_tokens: 2048,
        reasoning_format: 'hidden'
      };
      if (withFormat) body.response_format = { type: 'json_object' };
      return executeWithRetry('https://api.groq.com/openai/v1/chat/completions', body);
    };

    try {
      return await makeVisionRequest(true);
    } catch (firstErr) {
      const errCode = firstErr.response?.data?.error?.code;
      if (errCode === 'json_validate_failed' || errCode === 'invalid_request_error') {
        console.warn('Groq json_object mode failed for vision, retrying in free-text mode...');
        return await makeVisionRequest(false);
      }
      throw firstErr;
    }
  }
};

/**
 * Smartly extracts the most relevant portions of PDF text for OCR.
 * Pipeline:
 *   1. Strip Hindi/Devanagari script (bilingual PDFs like NIC/TATA AIG — saves 30-45% tokens)
 *   2. Strip legal boilerplate paragraphs (Motor Vehicles Act, IRDAI notices, etc.)
 *   3. Collapse whitespace
 *   4. Split into page segments using page-number markers
 *   5. Score each segment by insurance/vehicle keyword density
 *   6. Return top-scoring segments up to 7000 chars
 */
const extractRelevantPdfText = (fullText, maxPages = 0) => {
  const HIGH_VALUE_KEYWORDS = [
    'registration no', 'vehicle no', 'engine number', 'chassis', 'make', 'model',
    'policy no', 'policy number', 'valid from', 'valid till', 'period of insurance',
    'premium', 'total premium', 'insured', 'insured name', 'receipt', 'proposal',
    'certificate of insurance', 'policy schedule', 'fuel type', 'seating capacity',
    'mfg. year', 'manufacture year', 'date of registration', 'body type'
  ];

  // Step 1: Strip Hindi/Devanagari — NIC, TATA AIG, Bajaj etc. embed bilingual text.
  // Hindi chars tokenize ~3x less efficiently than English. Removing them saves 30-45% tokens.
  let cleaned = fullText.replace(/[\u0900-\u097F]+/g, '').trim();

  // Step 2: Strip standard legal/regulatory boilerplate blocks that never contain extractable fields
  const BOILERPLATE = [
    /Motor Vehicles? Act[^\n]{0,300}/gi,
    /Central Motor Vehicle[^\n]{0,250}/gi,
    /amended from time to time[^\n]{0,200}/gi,
    /Arbitration Clause[^\n]{0,200}/gi,
    /AVOIDANCE OF CERTAIN[^\n]{0,300}/gi,
    /RIGHT OF RECOVERY[^\n]{0,300}/gi,
    /Office of the Insurance Ombudsman[^\n]{0,400}/gi,
    /IN WITNESS WHEREOF[^\n]{0,400}/gi,
    /PersonsorClassofPersons[^\n]{0,400}/gi,
    /Usein connection[^\n]{0,400}/gi,
    /Thepolicydoesnot[^\n]{0,400}/gi,
    /IRDAI\/NL\/CIR[^\n]{0,300}/gi,
  ];
  for (const pattern of BOILERPLATE) cleaned = cleaned.replace(pattern, '');

  // Step 3: Collapse whitespace noise
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n').replace(/[ \t]{2,}/g, ' ').trim();

  // Step 4: Split into page segments
  const segments = cleaned.split(/(?:Page\s*(?:no\.?|number)?\s*[:\-]?\s*\d+\s*(?:of\s*\d+)?)/i)
    .filter(s => s.trim().length > 50);

  if (segments.length <= 1) {
    // No page markers — return first 6000 chars of cleaned text
    return cleaned.slice(0, 6000);
  }

  // Step 5: Score each segment by keyword density
  const scored = segments.map((seg, i) => {
    const lower = seg.toLowerCase();
    const score = HIGH_VALUE_KEYWORDS.reduce((acc, kw) => acc + (lower.includes(kw) ? 1 : 0), 0);
    return { seg, score, i };
  });

  // Step 6: Pick top 4 segments (by score), re-sort by original page order
  const topSegments = scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .sort((a, b) => a.i - b.i);

  const result = topSegments.map(s => s.seg.trim()).join('\n\n---\n\n');

  // Final cap: 7000 chars — sufficient after cleaning (was 12000 before cleaning was added)
  return result.slice(0, 7000);
};

const processOcrRequest = async (req, res, promptText, jsonTemplate, maxPages = 0) => {
  try {
    const { imageBase64, backImageBase64 } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ success: false, message: 'Document base64 string is required' });
    }

    let isPdf = false;
    let payload = imageBase64;

    if (imageBase64.startsWith('data:application/pdf')) {
        isPdf = true;
        const base64Data = imageBase64.replace(/^data:application\/pdf;base64,/, "");
        const buffer = Buffer.from(base64Data, 'base64');
        // Always parse ALL pages — vehicle schedule data can appear on page 4+ in multi-page PDFs
        const pdfData = await pdfParse(buffer);
        const extractedText = extractRelevantPdfText(pdfData.text, maxPages);

        // Detect scanned/image-only PDFs — pdf-parse returns near-empty text for these
        if (extractedText.trim().length < 100) {
          console.warn('PDF appears to be scanned (image-only) — no text extracted. Pages:', pdfData.numpages);
          return res.status(422).json({
            success: false,
            message: 'This PDF appears to be a scanned image. Please convert it to a text-based PDF or upload a photo of the document instead.',
            isScannedPdf: true
          });
        }

        payload = extractedText;
    }

    const fullPrompt = `${promptText}
Respond ONLY with a valid JSON object matching this structure exactly (use empty string "" if a field is not found):
${jsonTemplate}`;

    const response = await callGroqAPI(payload, fullPrompt, isPdf, backImageBase64);

    let messageContent = response.data.choices[0].message.content;

    // Strip out the <think>...</think> block if present
    messageContent = messageContent.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

    let jsonStr = messageContent;
    const jsonMatch = messageContent.match(/```(?:json)?\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    } else {
        const objMatch = messageContent.match(/\{[\s\S]*\}/);
        if (objMatch) {
            jsonStr = objMatch[0];
        }
    }

    let extractedData = {};
    try {
        extractedData = JSON.parse(jsonStr);
    } catch (parseError) {
        console.error('Failed to parse Groq response to JSON:', jsonStr);
        return res.status(500).json({
          success: false,
          message: 'Failed to parse AI response into valid format',
          rawResponse: messageContent
        });
    }

    if (typeof extractedData.registrationNumber === 'string') {
      extractedData.registrationNumber = extractedData.registrationNumber.replace(/[\s-]/g, '');
    }
    if (typeof extractedData.vehicleNumber === 'string') {
      extractedData.vehicleNumber = extractedData.vehicleNumber.replace(/[\s-]/g, '');
    }

    res.json({
      success: true,
      data: extractedData
    });

  } catch (error) {
    console.error('OCR Error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to extract document data',
      error: error.response?.data || error.message
    });
  }
};

exports.rcOcr = async (req, res) => {
  const prompt = "Extract the details from this vehicle registration certificate (RC). If two images are provided, they are the front and back of the same RC - extract data from both. For manufactureYear, extract the exact manufacturing month/year or date string as it appears on the document (e.g., '10/2018' or '2018'). For fuelType, extract the fuel used or fuel type (e.g., Petrol, Diesel, CNG, LPG, etc.). For vehicleCategory, extract the class of vehicle or vehicle class (e.g., Goods Carrier, PCV, LMV, HMV, Tractor, etc.).";
  const template = `{
  "registrationNumber": "", 
  "dateOfRegistration": "", 
  "chassisNumber": "",
  "engineNumber": "",
  "ownerName": "",
  "sonWifeDaughterOf": "",
  "address": "",
  "makerName": "",
  "makerModel": "",
  "colour": "",
  "seatingCapacity": "",
  "vehicleType": "",
  "ladenWeight": "",
  "unladenWeight": "",
  "manufactureYear": "",
  "vehicleCategory": "",
  "numberOfCylinders": "",
  "cubicCapacity": "",
  "fuelType": "",
  "bodyType": "",
  "wheelBase": ""
}`;
  return processOcrRequest(req, res, prompt, template);
};

exports.taxOcr = async (req, res) => {
  const prompt = "Extract the details from this vehicle tax receipt/document. DO NOT extract or pick up the tax amount, fine, or total paid. Leave them blank.";
  const template = `{
  "vehicleNumber": "", 
  "ownerName": "", 
  "taxFrom": "",
  "taxTo": ""
}`;
  return processOcrRequest(req, res, prompt, template);
};

exports.fitnessOcr = async (req, res) => {
  const prompt = "Extract the details from this vehicle fitness certificate/document. DO NOT extract or pick up the tax amount, fine, or total paid. Leave them blank.";
  const template = `{
  "vehicleNumber": "", 
  "ownerName": "", 
  "validFrom": "",
  "validTo": ""
}`;
  return processOcrRequest(req, res, prompt, template);
};

exports.pucOcr = async (req, res) => {
  const prompt = 'Extract the details from this vehicle PUC certificate/document. Extract vehicle number, owner name, valid from date, and valid to date only.';
  const template = `{
  "vehicleNumber": "",
  "ownerName": "",
  "validFrom": "",
  "validTo": ""
}`;
  return processOcrRequest(req, res, prompt, template);
};

exports.gpsOcr = async (req, res) => {
  const prompt = 'Extract the details from this vehicle GPS or VLTD fitment certificate/document. Extract vehicle number, owner name, valid from date, and valid to date only. Map "VLTD Fitment Date" to "validFrom". Map "Valid Upto" or "Valid Up to" to "validTo". Preserve the actual date value even when it appears in formats like "03 Apr 2026" or "Mon Apr 03 06:09:38 UTC 2028". Do not invent dates.';
  const template = `{
  "vehicleNumber": "",
  "ownerName": "",
  "validFrom": "",
  "validTo": ""
}`;
  return processOcrRequest(req, res, prompt, template);
};

exports.llOcr = async (req, res) => {
  const prompt = "Extract the details from this learning license/driving license document. Map the tracking number or application no to learningLicenseApplicationNumber if present. Map the license number or LL number to learningLicenseNumber. Map the issue date/from date to learningLicenseIssueDate. Map the expiry/valid till date to learningLicenseExpiryDate.";
  const template = `{
  "name": "",
  "dateOfBirth": "",
  "fatherName": "",
  "address": "",
  "learningLicenseApplicationNumber": "",
  "learningLicenseNumber": "",
  "learningLicenseIssueDate": "",
  "learningLicenseExpiryDate": ""
}`;
  return processOcrRequest(req, res, prompt, template);
};

exports.insuranceOcr = async (req, res) => {
  const prompt = `Extract fields from this vehicle insurance policy document.
- vehicleNumber: remove hyphens/spaces (e.g. CG-23-J-8800 → CG23J8800)
- policyNumber: as printed
- policyHolderName: primary insured person/company name
- validFrom / validTo: DD-MM-YYYY format
- issueDate: the date the policy document was issued. Look for "Policy Issue Date", "Date of Issue", "Invoice Date", "Policy Date", "Issue Date". Format: DD-MM-YYYY.
- insuranceCompany: full insurer name as it appears (e.g. "HDFC ERGO", "National Insurance Company Limited")
- totalPremium: numeric value only after GST — look for "Total Premium", "Gross Premium", "Total Amount", "Premium After GST". No currency symbols or commas.
- productType: the class/type of the insured vehicle or policy. Look for it in the "UIN No." field, "Policy Type", "Vehicle Class", or product name header. Common values: "Private Car", "Two-Wheeler", "Goods Carrying Vehicle", "GCV", "Passenger Carrying Vehicle", "PCV", "Taxi", "Commercial Vehicle", "Health", "Fire", "Marine", "Travel". For example "Digit Two-Wheeler Insurance" → return "Two-Wheeler". Return only the vehicle/product class keyword, not the full brand name.
- address: policy holder / owner address if present
- chassisNumber, engineNumber, makerName, makerModel, manufactureYear, cubicCapacity, seatingCapacity, bodyType: from vehicle details section
- Use empty string "" for any absent field`;
  const template = `{"vehicleNumber":"","policyNumber":"","policyHolderName":"","validFrom":"","validTo":"","issueDate":"","insuranceCompany":"","totalPremium":"","productType":"","address":"","chassisNumber":"","engineNumber":"","makerName":"","makerModel":"","manufactureYear":"","cubicCapacity":"","seatingCapacity":"","bodyType":""}`;
  return processOcrRequest(req, res, prompt, template, 0);
};

exports.temporaryPermitOcr = async (req, res) => {
  const prompt = `Extract the details from this temporary permit / trip permit document.
- Extract the vehicle registration number (remove any hyphens/spaces).
- Extract the valid from date and valid to date in DD-MM-YYYY format.
- Determine if the vehicle type is Commercial Vehicle (CV) or Passenger Vehicle (PV) based on the document content. Look for keywords like "COMMERCIAL", "GOODS", "FREIGHT", "CARGO" for CV, and "PASSENGER", "PV", "PRIVATE", "PERSONAL" for PV. If not clear, return empty string.
- Extract the permit holder name if present.
- If a field is not present, return empty string "".`;
  const template = `{
  "vehicleNumber": "",
  "validFrom": "",
  "validTo": "",
  "vehicleType": "",
  "permitHolderName": ""
}`;
  return processOcrRequest(req, res, prompt, template, 1);
};

exports.dlOcr = async (req, res) => {
  const prompt = "Extract the details from this Driving Licence document. Extract driving licence number, valid from date, and valid to date only. Map the valid from date to 'validFrom' and the valid to date or expiry date to 'validTo'. Remove any spaces or hyphens from the driving licence number.";
  const template = `{
  "drivingLicenceNumber": "",
  "validFrom": "",
  "validTo": ""
}`;
  return processOcrRequest(req, res, prompt, template);
};
