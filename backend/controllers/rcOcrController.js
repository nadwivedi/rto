const axios = require('axios');
const pdfParse = require('pdf-parse');

let groqKeyIndex = 0;
const getGroqApiKey = () => {
  const keys = [process.env.GROQ_API_KEY, process.env.GROQ_API_KEY_2, process.env.GROQ_API_KEY_3].filter(Boolean)
  groqKeyIndex = (groqKeyIndex + 1) % keys.length
  return keys[groqKeyIndex]
}

const callGroqAPI = async (imageBase64, textPrompt, isPdf = false, backImageBase64 = null) => {
  if (isPdf) {
    // imageBase64 here is actually sanitized PDF text (extracted by pdf-parse + extractRelevantPdfText)

    // Step 1: Sanitize PDF ligature characters that confuse LLMs
    const sanitizedText = imageBase64
      .replace(/ﬀ/g, 'ff').replace(/ﬁ/g, 'fi').replace(/ﬂ/g, 'fl')
      .replace(/ﬃ/g, 'ffi').replace(/ﬄ/g, 'ffl').replace(/ﬅ/g, 'st')
      .replace(/\u0000/g, ' ')  // null bytes
      .replace(/[^\x09\x0A\x0D\x20-\x7E\u00A0-\uFFFF]/g, ' ') // strip other control chars
      .replace(/[ \t]{3,}/g, '  ') // collapse excessive whitespace
      .trim();

    // Step 2: Use a 3-message structure to clearly separate document from extraction task.
    // This prevents the model from treating the document text as a prompt to generate examples.
    const messages = [
      {
        role: 'system',
        content: 'You are a strict data extraction assistant. When given an insurance document, you extract ONLY values that literally appear in the document text. You never guess, infer, or invent values. You output only valid JSON.'
      },
      {
        // Present the document as raw source data first
        role: 'user',
        content: 'I am sharing the raw text extracted from an insurance PDF document. This is the SOURCE DATA:\n\n<DOCUMENT>\n' + sanitizedText + '\n</DOCUMENT>\n\nConfirm you have received the document.'
      },
      {
        // Simulate assistant acknowledgement so the next user turn is clearly the extraction task
        role: 'assistant',
        content: 'I have received the insurance document text. I will extract only values that actually appear in it.'
      },
      {
        role: 'user',
        content: textPrompt
      }
    ];

    const makeRequest = (withFormat) => {
      const body = {
        model: 'llama-3.3-70b-versatile',
        messages,
        temperature: 0,
        max_tokens: 2048
      };
      if (withFormat) body.response_format = { type: 'json_object' };
      return axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        body,
        {
          headers: {
            'Authorization': `Bearer ${getGroqApiKey()}`,
            'Content-Type': 'application/json'
          }
        }
      );
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

    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'qwen/qwen3.6-27b',
        messages: [
          {
            role: 'user',
            content: contentArray
          }
        ],
        temperature: 0.1,
        max_completion_tokens: 4000,
        response_format: { type: 'json_object' },
        reasoning_format: 'hidden'
      },
      {
        headers: {
          'Authorization': `Bearer ${getGroqApiKey()}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response;
  }
};

/**
 * Smartly extracts the most relevant portions of PDF text for OCR.
 * Rather than a blind character slice, it:
 *   1. Splits the text into page-like segments (on "Page X of Y" markers)
 *   2. Scores each segment by how many insurance/vehicle keywords it contains
 *   3. Returns the top-scoring segments up to ~5000 chars
 * This ensures we capture the Policy Schedule (page 4) even in 12-page TATA AIG PDFs.
 */
const extractRelevantPdfText = (fullText, maxPages = 0) => {
  // Keywords that indicate a relevant section (vehicle details, schedule, receipt, proposal)
  const HIGH_VALUE_KEYWORDS = [
    'registration no', 'vehicle no', 'engine number', 'chassis', 'make', 'model',
    'policy no', 'policy number', 'valid from', 'valid till', 'period of insurance',
    'premium', 'total premium', 'insured', 'insured name', 'receipt', 'proposal',
    'certificate of insurance', 'policy schedule', 'fuel type', 'seating capacity',
    'mfg. year', 'manufacture year', 'date of registration', 'body type'
  ];

  // Split into page segments using common page markers
  const segments = fullText.split(/Page \d+ of \d+/i).filter(s => s.trim().length > 50);

  if (segments.length <= 1) {
    // No page markers — just return up to 5000 chars
    return fullText.slice(0, 5000);
  }

  // Score each segment
  const scored = segments.map((seg, i) => {
    const lower = seg.toLowerCase();
    const score = HIGH_VALUE_KEYWORDS.reduce((acc, kw) => acc + (lower.includes(kw) ? 1 : 0), 0);
    return { seg, score, i };
  });

  // Sort by score descending, pick top segments, then re-sort by original order
  const topSegments = scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .sort((a, b) => a.i - b.i);

  let result = topSegments.map(s => s.seg.trim()).join('\n\n---\n\n');

  // Final safety cap: 5500 chars to stay under token limits
  return result.slice(0, 5500);
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
        payload = extractRelevantPdfText(pdfData.text, maxPages);
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
  const prompt = `Extract the details from this vehicle insurance policy document.
- Extract the vehicle registration number (remove any hyphens/spaces, e.g. CG-23-J-8800 should become CG23J8800).
- Extract the policy number, policy holder name, insurance company name (e.g. HDFC ERGO, ICICI Lombard).
- Extract valid from date and valid to date in DD-MM-YYYY format.
- Extract the policy holder / owner's address if present in the document.
- Extract the total premium amount after GST (look for "Total Premium", "Gross Premium", "Premium After GST", or "Total Amount" on the document). Return only the numeric value, e.g. "12500" or "12500.50". Do not include currency symbols or commas.
- Also extract as many of these RC/vehicle details as available in the document: chassis number, engine number, make/manufacturer name, model name, year of manufacture, cubic capacity (CC), seating capacity, body type.
- If a field is not present, return empty string "".
- If multiple policy holder names or owners are mentioned, pick the primary one.`;
  const template = `{
  "vehicleNumber": "",
  "policyNumber": "",
  "policyHolderName": "",
  "validFrom": "",
  "validTo": "",
  "insuranceCompany": "",
  "totalPremium": "",
  "address": "",
  "chassisNumber": "",
  "engineNumber": "",
  "makerName": "",
  "makerModel": "",
  "manufactureYear": "",
  "cubicCapacity": "",
  "seatingCapacity": "",
  "bodyType": ""
}`;
  // Parse all pages — TATA AIG vehicle schedule appears on page 4+
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
