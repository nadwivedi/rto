const axios = require('axios');
const pdfParse = require('pdf-parse');

// ─── OCR Provider Configuration ───────────────────────────────────────────────
// Set OCR_PROVIDER=auto   → Tries Groq free-tier keys first; automatically falls back to OpenAI when exhausted (Default)
// Set OCR_PROVIDER=groq   → Uses Groq with OpenAI fallback on limit
// Set OCR_PROVIDER=openai → Uses OpenAI (gpt-4o-mini) directly
const getOcrProvider = () => (process.env.OCR_PROVIDER || 'auto').toLowerCase();

// ─── Groq key management & 12-hour cooldown ──────────────────────────────────
let groqKeyIndex = 0;
const rateLimitedKeys = new Map(); // keyString -> { timestamp, name, preview }
const RATE_LIMIT_DURATION = 12 * 60 * 60 * 1000; // 12 hours cooldown

const getAllGroqKeys = () => {
  return Object.keys(process.env)
    .filter(k => /^GROQ_API_KEY(_\d+)?$/i.test(k) && process.env[k])
    .sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, '') || '1', 10);
      const numB = parseInt(b.replace(/\D/g, '') || '1', 10);
      return numA - numB;
    })
    .map(k => {
      const val = process.env[k].trim();
      return {
        name: k,
        key: val,
        preview: val.substring(0, 8) + '...' + val.substring(val.length - 4)
      };
    })
    .filter(item => Boolean(item.key));
};

const cleanupExpiredRateLimits = () => {
  const now = Date.now();
  for (const [key, info] of rateLimitedKeys.entries()) {
    if (now - info.timestamp > RATE_LIMIT_DURATION) {
      rateLimitedKeys.delete(key);
      console.log(`[OCR/Groq] ♻️ COOLDOWN EXPIRED: ${info.name} (${info.preview}) is re-enabled for free tier!`);
    }
  }
};

const hasAvailableGroqKeys = () => {
  cleanupExpiredRateLimits();
  const allKeys = getAllGroqKeys();
  if (allKeys.length === 0) return false;
  const availableKeys = allKeys.filter(item => !rateLimitedKeys.has(item.key));
  return availableKeys.length > 0;
};

const getGroqApiKeyInfo = () => {
  cleanupExpiredRateLimits();
  const allKeys = getAllGroqKeys();
  const availableKeys = allKeys.filter(item => !rateLimitedKeys.has(item.key));

  if (availableKeys.length === 0) {
    return { keyObj: null, totalAvailable: allKeys.length, availableCount: 0 };
  }

  groqKeyIndex = (groqKeyIndex + 1) % availableKeys.length;
  const chosenKeyObj = availableKeys[groqKeyIndex];
  return { keyObj: chosenKeyObj, totalAvailable: allKeys.length, availableCount: availableKeys.length };
};

const markKeyRateLimited = (keyObj) => {
  rateLimitedKeys.set(keyObj.key, { timestamp: Date.now(), name: keyObj.name, preview: keyObj.preview });
  const allKeys = getAllGroqKeys();
  const remaining = allKeys.filter(item => !rateLimitedKeys.has(item.key)).length;
  console.warn(`[OCR/Groq] ⚠️ RATE LIMIT HIT on ${keyObj.name} (${keyObj.preview}). Marked for 12h cooldown. Active Groq keys: ${remaining}/${allKeys.length}`);
};

const executeWithRetry = async (url, body, retryCount = 0) => {
  const keyInfo = getGroqApiKeyInfo();
  if (!keyInfo.keyObj || keyInfo.availableCount === 0 || retryCount >= keyInfo.totalAvailable) {
    throw new Error('All Groq API keys are currently rate-limited (12h cooldown).');
  }
  const currentKeyObj = keyInfo.keyObj;
  console.log(`[OCR/Groq] 🔑 Calling Groq with ${currentKeyObj.name} (${currentKeyObj.preview} | Active keys: ${keyInfo.availableCount}/${keyInfo.totalAvailable})`);
  try {
    return await axios.post(url, body, {
      headers: {
        'Authorization': `Bearer ${currentKeyObj.key}`,
        'Content-Type': 'application/json'
      },
      timeout: 60000 // 60s timeout to avoid hanging on overloaded endpoints
    });
  } catch (error) {
    const status = error.response?.status;
    if (status === 429) {
      // Hard rate limit — mark this key as exhausted for 12 hours
      markKeyRateLimited(currentKeyObj);
      return executeWithRetry(url, body, retryCount + 1);
    }
    if (status === 503 || status === 502 || status === 500 || status === 529) {
      // Transient server overload — do NOT blacklist the key, just try the next one
      const errMsg = error.response?.data?.error?.message || error.message || status;
      console.warn(`[OCR/Groq] ${currentKeyObj.name} got ${status} (${errMsg}). Retrying with next key...`);
      await new Promise(r => setTimeout(r, 1000 * (retryCount + 1))); // 1s, 2s, 3s... backoff
      return executeWithRetry(url, body, retryCount + 1);
    }
    throw error;
  }
};


// ─── OpenAI API (gpt-4o-mini) ────────────────────────────────────────────────
// Image OCR  → gpt-4o-mini with image_url vision input
// PDF OCR    → gpt-4o-mini in text-only mode (extracted PDF text)
// Retries on 429 / 5xx with exponential backoff: 2s → 4s → 8s → 16s

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';
const OPENAI_OCR_MODEL = 'gpt-4o-mini';
const MAX_OPENAI_RETRIES = 4;

const openaiPostWithRetry = async (body, attempt = 0) => {
  const OPENAI_API_KEY = (process.env.OPENAI_API_KEY || '').trim();
  if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY is not set in environment variables.');
  try {
    return await axios.post(OPENAI_URL, body, {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 90000
    });
  } catch (err) {
    const httpStatus = err.response?.status || 0;
    const errCode    = String(err.response?.data?.error?.code || '');
    const errMsg     = err.response?.data?.error?.message || err.message;
    const isRateLimit = httpStatus === 429;
    const isServer5xx = httpStatus >= 500 && httpStatus < 600;
    if ((isRateLimit || isServer5xx) && attempt < MAX_OPENAI_RETRIES) {
      const waitMs = Math.pow(2, attempt + 1) * 1000; // 2s, 4s, 8s, 16s
      console.warn(`[OCR/OpenAI] Transient error (${httpStatus}${errCode ? '/' + errCode : ''}, "${errMsg}"). Retry ${attempt + 1}/${MAX_OPENAI_RETRIES} in ${waitMs / 1000}s...`);
      await new Promise(r => setTimeout(r, waitMs));
      return openaiPostWithRetry(body, attempt + 1);
    }
    console.error(`[OCR/OpenAI] Request failed after ${attempt + 1} attempt(s): ${httpStatus}${errCode ? '/' + errCode : ''}, "${errMsg}"`);
    throw err;
  }
};

const callOpenAIAPI = async (imageBase64, textPrompt, isPdf = false, backImageBase64 = null) => {
  console.log(`[OCR/OpenAI] 🌐 Sending ${isPdf ? 'PDF text' : 'Image vision'} OCR request to OpenAI (${OPENAI_OCR_MODEL})...`);
  if (isPdf) {
    // PDF: imageBase64 is extracted text — send as text-only message
    const sanitizedText = imageBase64
      .replace(/\uFB00/g, 'ff').replace(/\uFB01/g, 'fi').replace(/\uFB02/g, 'fl')
      .replace(/\uFB03/g, 'ffi').replace(/\uFB04/g, 'ffl').replace(/\uFB05/g, 'st')
      .replace(/\u0000/g, ' ')
      .replace(/[^\x09\x0A\x0D\x20-\x7E\u00A0-\uFFFF]/g, ' ')
      .replace(/[ \t]{3,}/g, '  ')
      .trim();
    return openaiPostWithRetry({
      model: OPENAI_OCR_MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are a precise document OCR extractor. Extract literal values from document text into the requested JSON schema. Never guess. Return valid JSON only.'
        },
        {
          role: 'user',
          content: `<DOCUMENT>\n${sanitizedText}\n</DOCUMENT>\n\n${textPrompt}`
        }
      ],
      temperature: 0,
      max_tokens: 1024,
      response_format: { type: 'json_object' }
    });
  } else {
    // Image OCR — vision request with base64 image(s)
    const formattedImage = imageBase64.startsWith('data:image')
      ? imageBase64
      : `data:image/jpeg;base64,${imageBase64}`;
    const contentArray = [
      { type: 'text', text: textPrompt },
      { type: 'image_url', image_url: { url: formattedImage, detail: 'high' } }
    ];
    if (backImageBase64) {
      const formattedBack = backImageBase64.startsWith('data:image')
        ? backImageBase64
        : `data:image/jpeg;base64,${backImageBase64}`;
      contentArray.push({ type: 'image_url', image_url: { url: formattedBack, detail: 'high' } });
    }
    return openaiPostWithRetry({
      model: OPENAI_OCR_MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are a precise document OCR extractor. Extract literal values from document images into the requested JSON schema. Never guess. Return valid JSON only.'
        },
        { role: 'user', content: contentArray }
      ],
      temperature: 0,
      max_tokens: 1536,
      response_format: { type: 'json_object' }
    });
  }
};


// ─── Groq API (kept intact for fallback / switching) ──────────────────────────
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

    const candidateModels = [
      'openai/gpt-oss-20b',
      'qwen/qwen3.6-27b',
      'groq/compound-mini',
      'groq/compound'
    ];

    const makeRequest = async (withFormat) => {
      let lastErr = null;
      for (const model of candidateModels) {
        try {
          const body = {
            model,
            messages,
            temperature: 0,
            max_completion_tokens: 1024
          };
          if (withFormat) body.response_format = { type: 'json_object' };
          return await executeWithRetry('https://api.groq.com/openai/v1/chat/completions', body);
        } catch (err) {
          lastErr = err;
          const errCode = err.response?.data?.error?.code;
          const errType = err.response?.data?.error?.type;
          console.warn(`Groq text model '${model}' failed (${errCode || errType || err.message}). Trying fallback...`);
        }
      }
      throw lastErr;
    };

    try {
      const response = await makeRequest(true);
      return response;
    } catch (firstErr) {
      console.warn('Groq json_object mode failed across models, retrying in free-text mode...');
      return await makeRequest(false);
    }
  } else {
    // Standard vision model - support front + optional back image
    const formattedImage = imageBase64.startsWith('data:image')
      ? imageBase64
      : `data:image/jpeg;base64,${imageBase64}`;

    // Prepend /no_think to suppress Qwen's chain-of-thought reasoning.
    // Without this, Qwen emits a <think>...</think> block before JSON output.
    // If max_completion_tokens is too low, the think block truncates mid-way,
    // leaving no JSON in the response at all — causing the parse failure.
    const noThinkPrompt = '/no_think\n' + textPrompt;

    const contentArray = [
      {
        type: 'text',
        text: noThinkPrompt
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
        // Increased from 2048 → 4096: at 2048 the think block can consume all tokens
        // before the model outputs any JSON, causing a truncated response with no valid JSON.
        max_completion_tokens: 4096
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

const extractIffcoTokioPolicyNumber = (rawText) => {
  if (!rawText) return null
  const lines = rawText.split('\n')
  for (const line of lines) {
    const matches = [...line.matchAll(/Policy\s*#\s*:?\s*([^\s]+)/gi)]
    if (matches.length >= 2) {
      const actualPolicyNo = matches[matches.length - 1][1].trim()
      if (actualPolicyNo) {
        console.log('[IFFCO-Tokio] Detected dual Policy# line. Overriding policy number to:', actualPolicyNo)
        return actualPolicyNo
      }
    }
  }
  return null
}

const extractBajajFinalPremium = (rawText) => {
  if (!rawText) return null
  const finalMatch = rawText.match(/Final\s*Premium\s*Rs\.?\s*([\d,]+(?:\.\d{1,2})?)/i)
  if (!finalMatch) return null
  const finalPremium = Number(finalMatch[1].replace(/,/g, ''))
  if (!finalPremium || isNaN(finalPremium)) return null
  const netMatch = rawText.match(/Net\s*Premium\s*([\d,]+(?:\.\d{1,2})?)/i)
  const netPremium = netMatch ? Number(netMatch[1].replace(/,/g, '')) : null
  if (netPremium != null && finalPremium <= netPremium) {
    console.log('[Bajaj] Final Premium not > Net Premium — skipping override:', finalPremium, 'vs', netPremium)
    return null
  }
  console.log('[Bajaj] Extracted Final Premium:', finalPremium, '| Net Premium:', netPremium)
  return { finalPremium, netPremium }
}

const extractNetGrossPremiumFromEndorsementTable = (rawText) => {
  if (!rawText) return null
  const match = rawText.match(/Net\s*Premium\s*Igst\s*Cgst\s*Sgst\s*Utgst\s*Cess\s*Gross\s*Premium[\s\S]{0,60}?\d{4}-\d{2}-\d{2}((?:\d+\.\d{2}){7})/i)
  if (!match) return null
  const numbers = match[1].match(/\d+\.\d{2}/g)
  if (!numbers || numbers.length !== 7) return null
  const [netPremium, , , , , , grossPremium] = numbers
  return { netPremium: Number(netPremium), premium: Number(grossPremium) }
}

const extractDigitOdTpPremium = (rawText, knownNetPremium) => {
  if (!rawText) return null
  const match = rawText.match(/\(`\)\s*(\d+\.\d{2})\s*(\d+\.\d{2})\s*(\d+\.\d{2})\s*Note:\s*The above total OD premium/i)
  if (!match) return null
  const odPremium = Number(match[1])
  const tpPremium = Number(match[3])
  if (knownNetPremium != null) {
    const diff = Math.abs(odPremium + tpPremium - knownNetPremium)
    if (diff > 2) return null
  }
  return { odPremium, tpPremium }
}

const MONTH_MAP = {
  jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
  jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
}

const normaliseDateDDMMYYYY = (dateStr) => {
  if (!dateStr) return null
  if (/^\d{2}[-/]\d{2}[-/]\d{4}$/.test(dateStr)) {
    return dateStr.replace(/\//g, '-')
  }
  const m = dateStr.match(/^(\d{1,2})[-\s]([A-Za-z]{3})[-\s](\d{4})$/)
  if (m) {
    const mm = MONTH_MAP[m[2].toLowerCase()]
    if (!mm) return null
    return `${m[1].padStart(2, '0')}-${mm}-${m[3]}`
  }
  return null
}

const extractDigitPolicyDates = (rawText) => {
  if (!rawText) return null
  const blockMatch = rawText.match(
    /Period\s+of\s+Policy[^\n]*(?:Own\s+Damage|OD)[^\n]*((?:\n[^\n]*)*)/i
  )
  if (!blockMatch) return null
  const block = blockMatch[0]
  const datePattern = /\b(\d{1,2}-(?:[A-Za-z]{3}|\d{2})-\d{4})\b/g
  const dates = []
  let m
  while ((m = datePattern.exec(block)) !== null) {
    const normalised = normaliseDateDDMMYYYY(m[1])
    if (normalised) dates.push(normalised)
    if (dates.length === 4) break
  }
  if (dates.length < 2) return null
  const result = {}
  if (dates.length >= 4) {
    result.validFrom = dates[0]
    result.validTo = dates[2]
    result.tpValidFrom = dates[1]
    result.tpValidTo = dates[3]
  } else if (dates.length === 3) {
    result.validFrom = dates[0]
    result.validTo = dates[1]
    result.tpValidFrom = dates[0]
    result.tpValidTo = dates[2]
  } else {
    result.validFrom = dates[0]
    result.validTo = dates[1]
  }
  console.log('[GoDigit] Extracted policy dates from Period-of-Policy block:', result)
  return result
}

const extractHdfcErgoPremiums = (rawText) => {
  if (!rawText) return null
  const isHdfc = /HDFC\s*ERGO/i.test(rawText)
  if (!isHdfc) return null
  const isStandaloneOd = /Standalone\s*OD/i.test(rawText) || /Own\s*Damage\s*Only/i.test(rawText)
  const netOdMatch = rawText.match(/Net\s*Own\s*Damage\s*Premium\s*\(a\)[^\d]*(\d+(?:\.\d{1,2})?)/i)
  const odPremium = netOdMatch ? Number(netOdMatch[1]) : null
  const totalNetMatch = rawText.match(/Total\s*Premium\s*\(a\+b\)[^\d]*(\d+(?:\.\d{1,2})?)/i)
  const netPremium = totalNetMatch ? Number(totalNetMatch[1]) : (odPremium ?? null)
  let grossPremium = null
  const grossMatch = rawText.match(/Net\s*Own\s*Damage\s*Premium[\s\S]{0,100}?Total\s*Premium[^\d]*(\d+(?:\.\d{1,2})?)/i)
    || rawText.match(/Total\s*Premium\s*\(a\+b\)[\s\S]{0,150}?Total\s*Premium[^\d]*(\d+(?:\.\d{1,2})?)/i)
  if (grossMatch) {
    grossPremium = Number(grossMatch[1])
  }
  let tpPremium = ''
  if (!isStandaloneOd) {
    const liabMatch = rawText.match(/(?:Net|Total)\s*Liability\s*Premium\s*\(b\)[^\d]*(\d+(?:\.\d{1,2})?)/i)
    if (liabMatch) {
      tpPremium = Number(liabMatch[1])
    }
  }
  return {
    odPremium,
    tpPremium,
    netPremium,
    premium: grossPremium,
    isStandaloneOd
  }
}

const extractIffcoTokioPremiums = (rawText) => {
  if (!rawText) return null
  const isIffco = /IFFCO\s*[-–]?\s*TOKIO/i.test(rawText)
  if (!isIffco) return null
  const isStandaloneOd = /Stand\s*Alone\s*OD/i.test(rawText)
    || /Standalone\s*OD/i.test(rawText)
    || /Own\s*Damage\s*Only/i.test(rawText)
    || /TP\s*Insurer\s*Name\s*:/i.test(rawText)
  const bifMatch = rawText.match(/Premium\s*Bifurcation[\s\S]{0,150}?((?:\d+\.\d{2}){5})/i)
    || rawText.match(/Section\s*1\s*\(Rs\.\)[\s\S]{0,150}?((?:\d+\.\d{2}){5})/i)
  let sec1 = null, sec2 = null, taxableValue = null, totalGst = null, grossVal = null
  if (bifMatch) {
    const nums = bifMatch[1].match(/\d+\.\d{2}/g)
    if (nums && nums.length === 5) {
      sec1 = Number(nums[0])
      sec2 = Number(nums[1])
      taxableValue = Number(nums[2])
      totalGst = Number(nums[3])
      grossVal = Number(nums[4])
    }
  }
  const netPremium = taxableValue ?? (sec1 != null ? sec1 + (sec2 || 0) : null)
  const odPremium = isStandaloneOd ? netPremium : (sec1 ?? netPremium)
  const tpPremium = isStandaloneOd ? '' : null
  return {
    isStandaloneOd,
    sec1,
    sec2,
    taxableValue,
    totalGst,
    grossVal,
    odPremium,
    netPremium,
    premium: grossVal,
    tpPremium
  }
}

const INDIAN_REG_NO_PATTERN = /\b([A-Z]{2}\d{2}[A-Z]{1,3}\d{4})\b/g

const isValidIndianVehicleNumber = (val) => {
  if (!val) return false
  const stripped = val.replace(/[\s-]/g, '').toUpperCase()
  return /^[A-Z]{2}\d{2}[A-Z]{1,3}\d{4}$/.test(stripped)
}

const isNewVehicleRegistration = (rawText, val) => {
  if (val) {
    const clean = val.trim().toUpperCase().replace(/[\s.-]/g, '')
    if (clean.startsWith('NEW') || clean.includes('UNREGISTERED') || clean.includes('APPLIEDFOR') || clean.includes('NOTREGISTERED') || clean.includes('TOBEREGISTERED') || clean === 'TBR' || clean === 'NA' || clean === 'PROVISIONAL') {
      return true
    }
  }
  if (rawText) {
    const match = rawText.match(/(?:Registration\s*(?:Mark\s*(?:&|AND)?\s*Place|Mark|Number|No\.?)|Reg(?:istration)?\s*(?:Number|No\.?)|Vehicle\s*(?:Number|No\.?))\s*[:\-]?\s*(NEW|UNREGISTERED|APPLIED\s*FOR|NOT\s*REGISTERED|TO\s*BE\s*REGISTERED|T\.?B\.?R\.?|N\/?A|PROVISIONAL)/i)
    if (match) {
      return true
    }
    const newPlaceMatch = rawText.match(/(?:^|\n)\s*NEW\s*&\s*[A-Z]{2,}/im)
    if (newPlaceMatch) {
      return true
    }
    const regNumNewConcatMatch = rawText.match(/REGISTRATION\s*(?:NUMBER|MARK|NO)?\s*[:\-]?\s*NEW/i)
    if (regNumNewConcatMatch) {
      return true
    }
    const regMarkPlaceMatch = rawText.match(/REGISTRATION\s*MARK\s*(?:&|AND)?\s*PLACE[\s\S]{0,200}?\bNEW\b/i)
    if (regMarkPlaceMatch) {
      return true
    }
  }
  return false
}

const extractValidIndianVehicleNumber = (rawText) => {
  if (!rawText) return null
  if (isNewVehicleRegistration(rawText, null)) {
    console.log('[VehicleNo] Document indicates New/Unregistered vehicle. Returning empty vehicleNumber.')
    return ''
  }
  const labeledPattern = /(?:Registration\s*(?:Mark\s*&?\s*)?No\.?|Reg(?:istration)?\s*No\.?|Vehicle\s*No\.?)\s*[:\-]?\s*([A-Z]{2}[\s-]?\d{2}[\s-]?[A-Z]{1,3}[\s-]?\d{4})/gi
  const labeledMatch = rawText.match(labeledPattern)
  if (labeledMatch) {
    for (const m of labeledMatch) {
      const numMatch = m.match(/([A-Z]{2}[\s-]?\d{2}[\s-]?[A-Z]{1,3}[\s-]?\d{4})/i)
      if (numMatch) {
        const candidate = numMatch[1].replace(/[\s-]/g, '').toUpperCase()
        if (isValidIndianVehicleNumber(candidate)) {
          console.log('[VehicleNo] Extracted from label:', candidate)
          return candidate
        }
      }
    }
  }
  const candidates = []
  let m
  const re = new RegExp(INDIAN_REG_NO_PATTERN.source, 'g')
  while ((m = re.exec(rawText.replace(/[\s-]/g, ' ').replace(/ /g, ''))) !== null) {
    candidates.push(m[1])
  }
  const lines = rawText.split('\n')
  for (const line of lines) {
    const stripped = line.replace(/[\s-]/g, '').toUpperCase()
    const lineMatch = stripped.match(/^([A-Z]{2}\d{2}[A-Z]{1,3}\d{4})(\d{4})?/)
    if (lineMatch && isValidIndianVehicleNumber(lineMatch[1])) {
      candidates.push(lineMatch[1])
    }
  }
  if (candidates.length > 0) {
    const unique = [...new Set(candidates)]
    console.log('[VehicleNo] Candidates found:', unique)
    return unique[0]
  }
  return null
}

const extractIssueDateFromRawText = (rawText) => {
  if (!rawText) return null
  const MONTHS = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 }
  const normalize = (d, m, y) => {
    let dd = String(d).padStart(2, '0')
    let mm
    if (/^\d+$/.test(String(m))) {
      mm = String(m).padStart(2, '0')
    } else {
      const mo = MONTHS[String(m).slice(0, 3).toLowerCase()]
      mm = mo ? String(mo).padStart(2, '0') : null
    }
    if (!mm) return null
    const yyyy = String(y)
    if (yyyy.length !== 4) return null
    return `${dd}-${mm}-${yyyy}`
  }
  const LABEL_PATTERNS = [
    /(?:Invoice|GST\s+Invoice)\s*Date\s*[:\-]?\s*(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})/i,
    /(?:Receipt|Reciept|Collection|Payment)\s*Date\s*[:\-]?\s*(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})/i,
    /(?:Receipt|Reciept|Collection|Payment)\s*[\s\S]{0,30}?Date\s*[:\-]?\s*(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})/i,
    /(?:Policy\s+Issue|Issue|Date\s+of\s+(?:Issue|Issuance|Collection|Receipt))\s*Date\s*[:\-]?\s*(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})/i,
    /(?:Policy\s*Date|Issue\s*Date|Proposal\s*Date)\s*[:\-]?\s*(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})/i,
    /signed\s+at\s+\S+\s+on\s+(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})/i,
    /Vehicle\s+purchased\s+on\s+(?:dated\s*)?[:\-]?\s*(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})/i,
  ]
  for (const pattern of LABEL_PATTERNS) {
    const m = rawText.match(pattern)
    if (m) {
      if (m[3] && m[3].length === 4) {
        const result = normalize(m[1], m[2], m[3])
        if (result) return result
      } else if (m[1] && m[1].length === 4) {
        const result = normalize(m[3], m[2], m[1])
        if (result) return result
      }
    }
  }
  return null
}

const extractNationalInsurancePremiums = (rawText) => {
  if (!rawText) return null
  if (!/National\s+Insurance/i.test(rawText)) return null
  const extractLastAmtOnLine = (pattern, text) => {
    const m = text.match(pattern)
    if (!m) return null
    const nums = m[0].match(/([\d,]+\.\d{2})/g)
    if (!nums) return null
    const n = parseFloat(nums[nums.length - 1].replace(/,/g, ''))
    return isNaN(n) ? null : n
  }
  const isLiabilityOnly = /Liability\s+Only|Third\s+Party\s+Only/i.test(rawText)
  const isStandaloneOd = /Standalone\s+OD|Own\s+Damage\s+Only/i.test(rawText)
  const tpTotal = extractLastAmtOnLine(/TP\s+Total\s*\(?Rounded\s*Off\)?[^\n]*/i, rawText)
  const odTotal = extractLastAmtOnLine(/OD\s+Total\s*\(?Rounded\s*Off\)?[^\n]*/i, rawText)
  const netPremium = extractLastAmtOnLine(/TOTAL\s+PREMIUM[^\n]*/i, rawText)
  const premium = extractLastAmtOnLine(/NET\s+PAYABLE[^\n]*/i, rawText)
  if (tpTotal == null && netPremium == null && odTotal == null) return null
  let insuranceClass = 'Comprehensive'
  if (isLiabilityOnly) insuranceClass = 'Third Party'
  else if (isStandaloneOd) insuranceClass = 'Standalone OD'
  const result = {
    insuranceClass,
    odPremium: odTotal,
    tpPremium: isLiabilityOnly ? netPremium : tpTotal,
    netPremium,
    premium,
  }
  console.log('[NIC] Extracted premiums:', result)
  return result
}

const extractRoyalSundaramPremiums = (rawText) => {
  if (!rawText) return null
  if (!/Royal\s+Sundaram/i.test(rawText)) return null
  const parseAmt = (str) => {
    if (str == null) return null
    const n = parseFloat(String(str).replace(/,/g, '').trim())
    return isNaN(n) ? null : n
  }
  let odPremium = null
  const odMatch = rawText.match(/TOTAL\s+OWN\s+DAMAGE\s+PREMIUM\s*\(?A\)?[^\n]*\n([^\n]+)/i)
  if (odMatch) odPremium = parseAmt(odMatch[1].match(/([\d,]+\.?\d*)/)?.[0])
  let tpPremium = null
  const tpMatch = rawText.match(/TOTAL\s+LIABILITY\s+PREMIUM\s*\(?B\)?[^\n]*\n([^\n]+)/i)
  if (tpMatch) tpPremium = parseAmt(tpMatch[1].match(/([\d,]+\.?\d*)/)?.[0])
  let netPremium = null
  const netMatch = rawText.match(/NET\s+PREMIUM\s*\(?A\s*\+\s*B\)?([^\n]+)/i)
  if (netMatch) {
    const nums = netMatch[1].match(/([\d,]+\.?\d*)/g)
    if (nums) netPremium = parseAmt(nums[nums.length - 1])
  }
  let premium = null
  const grossMatch = rawText.match(/(?:Gross\s+Premium|TOTAL\s+PREMIUM\s+PAYABLE)([^\n]*)(?:\n([^\n]*))?/i)
  if (grossMatch) {
    const sameLine = grossMatch[1].match(/([\d,]+\.\d{2})/g)
    if (sameLine) premium = parseAmt(sameLine[sameLine.length - 1])
    else if (grossMatch[2]) {
      const nextLine = grossMatch[2].match(/([\d,]+\.\d{2})/g)
      if (nextLine) premium = parseAmt(nextLine[0])
    }
  }
  if (odPremium == null && tpPremium == null && netPremium == null) return null
  const result = { odPremium, tpPremium, netPremium, premium }
  console.log('[RoyalSundaram] Extracted premiums:', result)
  return result
}

const parsePdfWithFallback = async (buffer, options = {}) => {
  try {
    return await pdfParse(buffer, options)
  } catch (primaryErr) {
    console.warn('[PDF] pdf-parse failed (' + (primaryErr.message || primaryErr) + '), trying pdftotext fallback...')
    const { execFile } = require('child_process')
    const fs = require('fs')
    const os = require('os')
    const path = require('path')
    const tmpIn = path.join(os.tmpdir(), 'ocr_tmp_' + Date.now() + '.pdf')
    const tmpOut = path.join(os.tmpdir(), 'ocr_tmp_' + Date.now() + '.txt')
    try {
      fs.writeFileSync(tmpIn, buffer)
      await new Promise((resolve, reject) => {
        execFile('pdftotext', ['-layout', tmpIn, tmpOut], (err) => {
          if (err) reject(err); else resolve();
        })
      })
      const text = fs.readFileSync(tmpOut, 'utf8')
      return { text, numpages: (text.match(/\f/g) || []).length + 1 }
    } finally {
      try { fs.unlinkSync(tmpIn) } catch (_) { }
      try { fs.unlinkSync(tmpOut) } catch (_) { }
    }
  }
}

const INSURANCE_COMPANIES = [
  'ACKO', 'BAJAJ GENERAL INSURANCE', 'BHARTI AXA', 'CHOLAMANDALAM MS',
  'EDELWEISS', 'FUTURE GENERALI', 'GO DIGIT', 'HDFC ERGO',
  'ICICI LOMBARD', 'IFFCO TOKIO', 'INDUSIND', 'KOTAK MAHINDRA',
  'KSHEMA', 'LIBERTY GENERAL INSURANCE', 'MAGMA GENERAL INSURANCE', 'NATIONAL INSURANCE',
  'NAVI INSURANCE', 'NEW INDIA ASSURANCE', 'ORIENTAL INSURANCE', 'RAHEJA QBE',
  'RELIANCE GENERAL INSURANCE', 'ROYAL SUNDARAM', 'SBI GENERAL INSURANCE', 'SHRIRAM GENERAL INSURANCE',
  'TATA AIG GENERAL INSURANCE', 'UNITED INDIA INSURANCE', 'UNIVERSAL SOMPO', 'ZUNO', 'ZURICH KOTAK'
]

const normalizeInsuranceCompanyLocal = (companyName) => {
  if (!companyName) return ''
  const cleanStr = (str) => {
    return (str || '')
      .trim()
      .replace(/[-\/]/g, ' ')
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .replace(/\s+/g, ' ')
      .toLowerCase();
  }
  const cleaned = cleanStr(companyName)
  const exactMatch = INSURANCE_COMPANIES.find(c => {
    const cCleaned = cleanStr(c)
    return cleaned.includes(cCleaned) || cCleaned.includes(cleaned)
  })
  if (exactMatch) return exactMatch
  const ocrWords = new Set(cleaned.split(/\s+/).filter(w => w.length > 2))
  const stopwords = new Set(['general', 'insurance', 'company', 'limited', 'ltd', 'services', 'co'])
  const filteredOcrWords = new Set([...ocrWords].filter(w => !stopwords.has(w)))
  let bestMatch = null
  let bestScore = 0
  for (const c of INSURANCE_COMPANIES) {
    const cCleaned = cleanStr(c)
    const cWords = cCleaned.split(/\s+/).filter(w => w.length > 2)
    const filteredCWords = cWords.filter(w => !stopwords.has(w))
    if (filteredCWords.length === 0) continue
    const overlap = filteredCWords.filter(w => filteredOcrWords.has(w)).length
    const score = overlap / filteredCWords.length
    if (overlap >= 1 && score > bestScore) {
      bestScore = score
      bestMatch = c
    }
  }
  return bestMatch || ''
}

/**
 * Custom pdf-parse page renderer that reconstructs text in visual reading order
 * (row by row, left to right) using each text item's actual (x, y) position,
 * instead of pdf-parse's default content-stream order.
 *
 * Some government-issued certificates (e.g. Learner's Licence PDFs) render static
 * labels ("Name", "Guardian Name", ...) and their dynamically-filled values as two
 * separate groups of drawing commands. pdf-parse's default linear text() then dumps
 * all labels first, followed by all values — completely decoupling a label from the
 * value actually printed next to it on the page, and silently misassigning fields
 * like the licence holder's name vs. the guardian/father's name. Grouping items by
 * shared y-coordinate (i.e. same visual row) keeps a label next to its value.
 */
const renderPageWithLayout = (pageData) => {
  return pageData.getTextContent().then((textContent) => {
    const items = textContent.items
      .filter(it => it.str && it.str.trim().length > 0)
      .map(it => ({ str: it.str, x: it.transform[4], y: it.transform[5] }));

    items.sort((a, b) => b.y - a.y || a.x - b.x);

    const LINE_TOLERANCE = 4;
    const rows = [];
    for (const item of items) {
      let row = rows.find(r => Math.abs(r.y - item.y) <= LINE_TOLERANCE);
      if (!row) {
        row = { y: item.y, items: [] };
        rows.push(row);
      }
      row.items.push(item);
    }

    rows.sort((a, b) => b.y - a.y);
    return rows
      .map(row => row.items.sort((a, b) => a.x - b.x).map(it => it.str).join('   '))
      .join('\n');
  });
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

const processOcrRequest = async (req, res, promptText, jsonTemplate, maxPages = 0, useLayoutAwareExtraction = false, postProcessor = null) => {
  try {
    const { imageBase64, backImageBase64 } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ success: false, message: 'Document base64 string is required' });
    }

    let isPdf = false;
    let payload = imageBase64;
    req._rawPdfText = null;

    if (imageBase64.startsWith('data:application/pdf')) {
        isPdf = true;
        const base64Data = imageBase64.replace(/^data:application\/pdf;base64,/, "");
        const buffer = Buffer.from(base64Data, 'base64');
        // Always parse ALL pages — vehicle schedule data can appear on page 4+ in multi-page PDFs
        const pdfData = useLayoutAwareExtraction
          ? await parsePdfWithFallback(buffer, { pagerender: renderPageWithLayout })
          : await parsePdfWithFallback(buffer);
        req._rawPdfText = pdfData.text;
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

    const fullPrompt = `${promptText}\nRespond ONLY with valid JSON matching this schema (use "" if absent):\n${jsonTemplate}`;

    const configuredProvider = getOcrProvider();
    let response = null;
    let usedProvider = 'groq';

    if (configuredProvider === 'openai') {
      console.log('[OCR] Provider configured to OPENAI directly');
      response = await callOpenAIAPI(payload, fullPrompt, isPdf, backImageBase64);
      usedProvider = 'openai';
    } else {
      // Default / 'auto' / 'groq': Try Groq free tier first across all active keys
      if (hasAvailableGroqKeys()) {
        try {
          console.log('[OCR] Using provider: GROQ (Free Tier round-robin)');
          response = await callGroqAPI(payload, fullPrompt, isPdf, backImageBase64);
          usedProvider = 'groq';
        } catch (groqErr) {
          console.warn(`[OCR] Groq request failed (${groqErr.message}). Seamlessly falling back to OpenAI (gpt-4o-mini)...`);
          response = await callOpenAIAPI(payload, fullPrompt, isPdf, backImageBase64);
          usedProvider = 'openai';
        }
      } else {
        console.log('[OCR] All Groq keys are currently rate-limited (12h cooldown). Seamlessly using OpenAI (gpt-4o-mini)...');
        response = await callOpenAIAPI(payload, fullPrompt, isPdf, backImageBase64);
        usedProvider = 'openai';
      }
    }

    let messageContent = response.data.choices[0].message.content;

    // Strip out <think>...</think> blocks — handles BOTH properly closed and truncated (no </think>) blocks.
    // The Qwen reasoning model sometimes hits max_tokens mid-think, leaving an unclosed <think> tag.
    // Lazy match: try closed form first, then strip everything from <think> onward if unclosed.
    messageContent = messageContent.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
    // If a <think> tag still exists (unclosed/truncated), strip everything from <think> to end of content,
    // then look for any JSON that may have been emitted BEFORE the think block started.
    if (/<think>/i.test(messageContent)) {
      const beforeThink = messageContent.replace(/<think>[\s\S]*/i, '').trim();
      messageContent = beforeThink;
    }

    // If messageContent is empty after stripping (think block consumed ALL tokens),
    // retry without json_object format — free-form fallback.
    if (!messageContent.trim()) {
      console.warn(`[OCR] Response was empty from ${usedProvider.toUpperCase()}. Retrying in free-text mode...`);
      const fallbackBody = {
        model: usedProvider === 'groq' ? 'qwen/qwen3.6-27b' : OPENAI_OCR_MODEL,
        messages: [{ role: 'user', content: fullPrompt }],
        temperature: 0.1,
        max_tokens: usedProvider === 'groq' ? 4096 : 1024
      };
      try {
        const fallbackResp = usedProvider === 'groq'
          ? await executeWithRetry('https://api.groq.com/openai/v1/chat/completions', fallbackBody)
          : await openaiPostWithRetry(fallbackBody);
        let fallbackContent = fallbackResp.data.choices[0].message.content || '';
        fallbackContent = fallbackContent.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
        if (/<think>/i.test(fallbackContent)) {
          fallbackContent = fallbackContent.replace(/<think>[\s\S]*/i, '').trim();
        }
        if (fallbackContent.trim()) {
          messageContent = fallbackContent;
        }
      } catch (retryErr) {
        console.error(`[OCR] Fallback retry also failed on ${usedProvider.toUpperCase()}:`, retryErr.message);
        // If Groq fallback fails, try OpenAI once as emergency backup
        if (usedProvider === 'groq') {
          try {
            console.log('[OCR] Attempting emergency fallback to OpenAI...');
            const emergencyResp = await callOpenAIAPI(payload, fullPrompt, isPdf, backImageBase64);
            messageContent = emergencyResp.data.choices[0].message.content || '';
          } catch (emergErr) {
            console.error('[OCR] Emergency OpenAI fallback also failed:', emergErr.message);
          }
        }
      }
    }

    let jsonStr = messageContent;
    const jsonMatch = messageContent.match(/```(?:json)?\n?([\s\S]*?)\n?```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    } else {
        // Find the LAST valid JSON object in the response (model sometimes emits text before the JSON)
        const allObjMatches = [...messageContent.matchAll(/\{[\s\S]*?\}/g)];
        if (allObjMatches.length > 0) {
            // Try largest match first (most complete JSON object)
            const sorted = allObjMatches.slice().sort((a, b) => b[0].length - a[0].length);
            jsonStr = sorted[0][0];
        }
    }

    let extractedData = {};
    try {
        extractedData = JSON.parse(jsonStr);
    } catch (parseError) {
        console.error(`[OCR/${getOcrProvider().toUpperCase()}] Failed to parse AI response to JSON:`, jsonStr);
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

    if (extractedData.insuranceCompany) {
      extractedData.insuranceCompany = normalizeInsuranceCompanyLocal(extractedData.insuranceCompany)
    }

    // Run any caller-supplied post-processor (e.g. IFFCO Tokio policy# correction)
    if (typeof postProcessor === 'function') {
      extractedData = postProcessor(extractedData) || extractedData
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
  const template = `{"registrationNumber":"","dateOfRegistration":"","chassisNumber":"","engineNumber":"","ownerName":"","sonWifeDaughterOf":"","address":"","makerName":"","makerModel":"","colour":"","seatingCapacity":"","vehicleType":"","ladenWeight":"","unladenWeight":"","manufactureYear":"","vehicleCategory":"","numberOfCylinders":"","cubicCapacity":"","fuelType":"","bodyType":"","wheelBase":""}`;
  return processOcrRequest(req, res, prompt, template);
};

exports.taxOcr = async (req, res) => {
  const prompt = "Extract the details from this vehicle tax receipt/document. DO NOT extract or pick up the tax amount, fine, or total paid. Leave them blank.";
  const template = `{"vehicleNumber":"","ownerName":"","taxFrom":"","taxTo":""}`;
  return processOcrRequest(req, res, prompt, template);
};

exports.fitnessOcr = async (req, res) => {
  const prompt = "Extract the details from this vehicle fitness certificate/document. DO NOT extract or pick up the tax amount, fine, or total paid. Leave them blank.";
  const template = `{"vehicleNumber":"","ownerName":"","validFrom":"","validTo":""}`;
  return processOcrRequest(req, res, prompt, template);
};

exports.pucOcr = async (req, res) => {
  const prompt = 'Extract the details from this vehicle PUC certificate/document. Extract vehicle number, owner name, valid from date, and valid to date only.';
  const template = `{"vehicleNumber":"","ownerName":"","validFrom":"","validTo":""}`;
  return processOcrRequest(req, res, prompt, template);
};

exports.gpsOcr = async (req, res) => {
  const prompt = 'Extract the details from this vehicle GPS or VLTD fitment certificate/document. Extract vehicle number, owner name, valid from date, valid to date, fitted by (installer / technician / fitment center name), and company name (GPS device manufacturer or company name). Map "VLTD Fitment Date" to "validFrom". Map "Valid Upto" or "Valid Up to" to "validTo". Preserve the actual date value even when it appears in formats like "03 Apr 2026" or "Mon Apr 03 06:09:38 UTC 2028". Do not invent dates.';
  const template = `{"vehicleNumber":"","ownerName":"","validFrom":"","validTo":"","fittedBy":"","companyName":""}`;
  return processOcrRequest(req, res, prompt, template);
};

exports.llOcr = async (req, res) => {
  const prompt = `Extract the details from this learning license/driving license document. The text below is laid out line by line as it visually appears on the document, so each field's label and its printed value are on the same line, in this order: a serial number (e.g. "1.", "2."), then the field label, then the field's value.
- name: the value on the line whose label is "Name" (the licence HOLDER/applicant/learner's own name). Do NOT use the value from the "Guardian Name" or "Father's Name" line for this field, even if that line appears earlier or looks more prominent.
- fatherName: the value on the line whose label is "Guardian Name", "Father's Name", "Father Name", "Guardian's Name", "S/O", "D/O", or "W/O" — whichever of these labels is present. This is always a different person from "name" above.
- Map the tracking number or application no to learningLicenseApplicationNumber if present.
- Map the license number or LL number to learningLicenseNumber.
- Map the issue date/from date to learningLicenseIssueDate.
- Map the expiry/valid till date to learningLicenseExpiryDate.
- If only a guardian/father name line is present and there is no separate "Name" line, leave "name" empty rather than copying the guardian's name into it.`;
  const template = `{"name":"","dateOfBirth":"","fatherName":"","address":"","learningLicenseApplicationNumber":"","learningLicenseNumber":"","learningLicenseIssueDate":"","learningLicenseExpiryDate":""}`;
  return processOcrRequest(req, res, prompt, template, 0, true);
};

exports.insuranceOcr = async (req, res) => {
  const prompt = `Extract fields from this vehicle insurance policy document.
- vehicleNumber: the vehicle registration number — EXACTLY 9 or 10 characters after removing hyphens/spaces (format: 2 state letters + 2 district digits + 1-3 series letters + 4 digits, e.g. MH12AB1234, DL01CA9999). Remove hyphens/spaces. Do NOT return engine numbers, chassis numbers, or any value longer than 10 characters. CRITICAL: If the document says "NEW" / "UNREGISTERED" / "APPLIED FOR" / "NOT REGISTERED" / "TO BE REGISTERED" or if the vehicle is new and has no registration mark yet, leave vehicleNumber as empty string "". Do NOT pick up engine numbers or chassis numbers as vehicleNumber!
- policyNumber: the OFFICIAL policy number issued by the insurer. IMPORTANT: Some documents (e.g. IFFCO Tokio) show TWO "Policy #" values on the same line — the first is an internal transaction/invoice reference (often starts with "1-" or looks like "1-XXXXXXXX"), and the SECOND is the actual policy number. Always use the LAST/SECOND "Policy #" value as the policyNumber. The "Tax Invoice No" field is NOT the policy number. CRITICAL for Go Digit policies: Go Digit prints the real policy number in the format "D[9 digits] / [DDMMYYYY]" (e.g. "D282367063 / 28072026") — use the FULL string including the " / DDMMYYYY" part as policyNumber. Go Digit also shows an Invoice Number starting with "IA" (e.g. "IA278149378") — this is NOT the policy number, NEVER use the IA-prefixed number as policyNumber.
- policyHolderName: primary insured person/company name
- validFrom / validTo: the main policy period (Own Damage section if present, otherwise overall policy period). DD-MM-YYYY format.
- thirdPartyValidFrom / thirdPartyValidTo: the Third Party / Act Liability cover period. Many long-term two-wheeler/private-car policies have a separate, longer TP validity period than the OD period (e.g. OD valid for 1 year but TP valid for 5 years) — look for a distinct "Third Party" or "Liability" or "Act" section with its own "Period of Insurance" / "From" / "To" dates. If the document has only one policy period (no separate TP period), leave thirdPartyValidFrom/thirdPartyValidTo as empty strings. DD-MM-YYYY format.
- issueDate: the date the policy document was issued or receipt date. Look for "Policy Issue Date", "Date of Issue", "Invoice Date", "Receipt Date", "Reciept Date", "Collection Date", "Proposal Date", "Policy Date", "Issue Date". Format: DD-MM-YYYY.
- odPremium: numeric value of the "Total OD Premium" (own damage), the FINAL own-damage figure AFTER NCB discount is applied. IMPORTANT: many policies (e.g. Digit, ICICI Lombard) show a table with an intermediate "Own Damage Premium" subtotal (before NCB discount) plus a separate "NCB (xx%)" deduction line, and then a "Total OD Premium" line which is the final figure (Own Damage Premium minus NCB) — you MUST use the "Total OD Premium" value, NOT the intermediate "Own Damage Premium" subtotal. Do NOT use the Final/Gross Premium value here even if it appears near this section. Empty string if the policy has no OD component (Third Party only policy).
- tpPremium: numeric value of the "Total Act Premium" / "Total Liability Premium" / "Total TP Premium" — the final total of the Liability/Act premium section (Basic Third-Party Liability + Legal Liability add-ons + PA cover add-ons, if any). If the document has no separate add-ons, this equals "Basic Third-Party Liability". Do NOT use the Final/Gross Premium value here. CRITICAL: If the document is a "Standalone OD" / "Own Damage Only" policy, or if Liability Premium is 0 or blank, leave tpPremium as empty string "". NEVER put GST/Tax (such as 18% tax = 168) as tpPremium!
- netPremium: numeric value labeled exactly "Net Premium" or "Total Premium (a+b)" — this is odPremium + tpPremium (before GST/taxes). It is a DISTINCT, smaller number than the Final/Gross Premium — do not confuse the two.
- totalPremium: numeric value of the Gross Premium — labeled "Final Premium" or "Gross Premium", the LARGEST of the four premium figures, equal to Net Premium + GST/CGST+SGST/IGST (roughly netPremium × 1.18). Return the exact decimal value including paise/cents if present (e.g., 1182.71). Do not omit the decimal or round. If only one premium figure exists on the document (no OD/TP/Net split), put that value here as totalPremium and leave odPremium/tpPremium/netPremium empty.
- SELF-CHECK before answering: odPremium + tpPremium should be close to netPremium (within a few rupees, allowing for small add-ons), and netPremium should be meaningfully smaller than totalPremium (totalPremium ≈ netPremium × 1.18 for 18% GST). If your extracted values don't satisfy this, re-examine the document for the correct "Total OD Premium" / "Total Act Premium" / "Net Premium" / "Final Premium" labels rather than reusing the same number for multiple fields.
- insuranceCompany: full insurer name as it appears (e.g. "HDFC ERGO", "National Insurance Company Limited")
- productType: the class/type of the insured vehicle or policy. Look for it in the "UIN No." field, "Policy Type", "Vehicle Class", or product name header. Common values: "Private Car", "Two-Wheeler", "Goods Carrying Vehicle", "GCV", "Passenger Carrying Vehicle", "PCV", "Taxi", "Commercial Vehicle", "Health", "Fire", "Marine", "Travel". For example "Digit Two-Wheeler Insurance" → return "Two-Wheeler". Return only the vehicle/product class keyword, not the full brand name.
- address: policy holder / owner address if present
- chassisNumber, engineNumber, makerName, makerModel, manufactureYear, cubicCapacity, seatingCapacity, bodyType: from vehicle details section
- Use empty string "" for any absent field`;
  const template = `{"vehicleNumber":"","policyNumber":"","policyHolderName":"","validFrom":"","validTo":"","issueDate":"","thirdPartyValidFrom":"","thirdPartyValidTo":"","insuranceCompany":"","totalPremium":"","odPremium":"","tpPremium":"","netPremium":"","productType":"","address":"","chassisNumber":"","engineNumber":"","makerName":"","makerModel":"","manufactureYear":"","cubicCapacity":"","seatingCapacity":"","bodyType":""}`;

  return processOcrRequest(req, res, prompt, template, 0, false, (extractedData) => {
    if (req._rawPdfText) {
      // 1. Fix IFFCO Tokio dual-Policy# line — pick the actual (last) policy number
      const correctedPolicyNo = extractIffcoTokioPolicyNumber(req._rawPdfText)
      if (correctedPolicyNo) {
        extractedData.policyNumber = correctedPolicyNo
      }

      // 1b. Fix Go Digit policy number — Go Digit PDFs print the real policy number
      if (/go.?digit/i.test(req._rawPdfText) || /\bD\d{9}\s*\/\s*\d{8}\b/.test(req._rawPdfText)) {
        const digitPolicyMatch = req._rawPdfText.match(/\b(D\d{7,12}\s*\/\s*\d{6,8})\b/)
        if (digitPolicyMatch) {
          const realPolicyNo = digitPolicyMatch[1].trim()
          if (realPolicyNo !== extractedData.policyNumber) {
            console.log('[GoDigit] Overriding policyNumber:', extractedData.policyNumber, '->', realPolicyNo)
            extractedData.policyNumber = realPolicyNo
          }
        }
      }

      // 2. Fix vehicle number — Indian reg nos are 9-10 chars.
      const currentVehicle = (extractedData.vehicleNumber || '').replace(/[\s-]/g, '')
      if (isNewVehicleRegistration(req._rawPdfText, currentVehicle)) {
        console.log('[VehicleNo] New/Unregistered vehicle detected. Setting vehicleNumber to empty string.')
        extractedData.vehicleNumber = ''
      } else if (!isValidIndianVehicleNumber(currentVehicle)) {
        const correctedVehicleNo = extractValidIndianVehicleNumber(req._rawPdfText)
        if (correctedVehicleNo !== null && correctedVehicleNo !== undefined) {
          console.log('[VehicleNo] Overriding', currentVehicle, '->', correctedVehicleNo)
          extractedData.vehicleNumber = correctedVehicleNo
        }
      }

      // 3. Fix Net Premium / Gross Premium using the clean ENDORSEMENT invoice table
      const endorsementPremiums = extractNetGrossPremiumFromEndorsementTable(req._rawPdfText)
      if (endorsementPremiums) {
        console.log('[Premium] Overriding netPremium/totalPremium from ENDORSEMENT table:', endorsementPremiums)
        extractedData.netPremium = String(endorsementPremiums.netPremium)
        extractedData.totalPremium = String(endorsementPremiums.premium)
      }

      // 4. Fix OD/TP premium split for Go Digit-style scrambled breakdown tables
      const knownNetPremium = endorsementPremiums?.netPremium ?? (extractedData.netPremium ? Number(extractedData.netPremium) : null)
      const digitOdTp = extractDigitOdTpPremium(req._rawPdfText, knownNetPremium)
      if (digitOdTp) {
        console.log('[Premium] Overriding odPremium/tpPremium from Go Digit summary row:', digitOdTp)
        extractedData.odPremium = String(digitOdTp.odPremium)
        extractedData.tpPremium = String(digitOdTp.tpPremium)
      }

      // 5. Fix Gross Premium for Bajaj Allianz policies.
      if (!endorsementPremiums) {
        const bajajPremiums = extractBajajFinalPremium(req._rawPdfText)
        if (bajajPremiums) {
          const currentPremium = extractedData.totalPremium ? Number(extractedData.totalPremium) : null
          const aiGotWrongGross = currentPremium == null ||
            currentPremium === bajajPremiums.netPremium ||
            (bajajPremiums.netPremium != null && Math.abs(currentPremium - bajajPremiums.netPremium) < 2)
          if (aiGotWrongGross) {
            console.log('[Bajaj] Overriding totalPremium:', currentPremium, '->', bajajPremiums.finalPremium)
            extractedData.totalPremium = String(bajajPremiums.finalPremium)
          }
          if (bajajPremiums.netPremium != null) {
            const currentNet = extractedData.netPremium ? Number(extractedData.netPremium) : null
            const netIsWrong = currentNet == null ||
              Math.abs(currentNet - bajajPremiums.finalPremium) < 2
            if (netIsWrong) {
              console.log('[Bajaj] Overriding netPremium:', currentNet, '->', bajajPremiums.netPremium)
              extractedData.netPremium = String(bajajPremiums.netPremium)
            }
          }
        }
      }

      // 6. Fix policy dates for Go Digit PDFs.
      const digitDates = extractDigitPolicyDates(req._rawPdfText)
      if (digitDates) {
        if (digitDates.validFrom && digitDates.validFrom !== extractedData.validFrom) {
          console.log('[GoDigit] Overriding validFrom:', extractedData.validFrom, '->', digitDates.validFrom)
          extractedData.validFrom = digitDates.validFrom
        }
        if (digitDates.validTo && digitDates.validTo !== extractedData.validTo) {
          console.log('[GoDigit] Overriding validTo:', extractedData.validTo, '->', digitDates.validTo)
          extractedData.validTo = digitDates.validTo
        }
        if (digitDates.tpValidFrom && digitDates.tpValidFrom !== extractedData.thirdPartyValidFrom) {
          console.log('[GoDigit] Overriding thirdPartyValidFrom:', extractedData.thirdPartyValidFrom, '->', digitDates.tpValidFrom)
          extractedData.thirdPartyValidFrom = digitDates.tpValidFrom
        }
        if (digitDates.tpValidTo && digitDates.tpValidTo !== extractedData.thirdPartyValidTo) {
          console.log('[GoDigit] Overriding thirdPartyValidTo:', extractedData.thirdPartyValidTo, '->', digitDates.tpValidTo)
          extractedData.thirdPartyValidTo = digitDates.tpValidTo
        }
      }

      // 7. Fix premiums for HDFC ERGO policies (especially Standalone OD)
      const hdfcPremiums = extractHdfcErgoPremiums(req._rawPdfText)
      if (hdfcPremiums) {
        if (hdfcPremiums.isStandaloneOd) {
          extractedData.tpPremium = ''
          extractedData.thirdPartyValidFrom = ''
          extractedData.thirdPartyValidTo = ''
        }
        if (hdfcPremiums.odPremium != null) extractedData.odPremium = String(hdfcPremiums.odPremium)
        if (hdfcPremiums.tpPremium !== null && hdfcPremiums.tpPremium !== undefined) extractedData.tpPremium = String(hdfcPremiums.tpPremium)
        if (hdfcPremiums.netPremium != null) extractedData.netPremium = String(hdfcPremiums.netPremium)
        if (hdfcPremiums.premium != null) extractedData.totalPremium = String(hdfcPremiums.premium)
      }

      // 8. General tax misclassification guard:
      if (extractedData.tpPremium && extractedData.totalPremium && (extractedData.netPremium || extractedData.odPremium)) {
        const gross = Number(extractedData.totalPremium)
        const tp = Number(extractedData.tpPremium)
        const od = extractedData.odPremium ? Number(extractedData.odPremium) : null
        const net = extractedData.netPremium ? Number(extractedData.netPremium) : od

        if (gross && tp && net && gross > net) {
          const tax = Math.round(gross - net)
          if (Math.abs(tp - tax) <= 2 || (od != null && Math.abs(od - net) <= 2 && Math.abs(od + tp - gross) <= 2)) {
            console.log('[TaxGuard] tpPremium', tp, 'matches Tax (gross - net =', tax, '). Clearing misclassified tpPremium.')
            extractedData.tpPremium = ''
            if (od != null) extractedData.netPremium = String(od)
          }
        }
      }

      // 9. Fix premiums and reference TP dates for IFFCO Tokio
      const iffcoPremiums = extractIffcoTokioPremiums(req._rawPdfText)
      if (iffcoPremiums) {
        if (iffcoPremiums.isStandaloneOd) {
          extractedData.tpPremium = ''
          extractedData.thirdPartyValidFrom = ''
          extractedData.thirdPartyValidTo = ''
        }
        if (iffcoPremiums.odPremium != null) extractedData.odPremium = String(iffcoPremiums.odPremium)
        if (iffcoPremiums.netPremium != null) extractedData.netPremium = String(iffcoPremiums.netPremium)
        if (iffcoPremiums.premium != null) extractedData.totalPremium = String(iffcoPremiums.premium)
      }

      // 10. General Guard for External Reference TP policies:
      const tpInsurerMatch = req._rawPdfText.match(/TP\s*Insurer\s*Name\s*:\s*([^\n]+)/i)
        || req._rawPdfText.match(/Third\s*Party\s*Insurer\s*:\s*([^\n]+)/i)
      if (tpInsurerMatch) {
        const tpInsurer = tpInsurerMatch[1].trim().toLowerCase()
        const currentComp = (extractedData.insuranceCompany || '').toLowerCase()
        const cleanTp = tpInsurer.replace(/[^a-z0-9]/g, '')
        const cleanCur = currentComp.replace(/[^a-z0-9]/g, '')
        if (cleanTp && cleanCur && !cleanTp.includes(cleanCur) && !cleanCur.includes(cleanTp)) {
          console.log('[ExternalTPGuard] Reference TP policy from external insurer (' + tpInsurerMatch[1].trim() + '). Clearing TP dates & TP premium.')
          extractedData.thirdPartyValidFrom = ''
          extractedData.thirdPartyValidTo = ''
          extractedData.tpPremium = ''
        }
      }

      // 11. Fix premiums and class for National Insurance Company (NIC) policies.
      const nicPremiums = extractNationalInsurancePremiums(req._rawPdfText)
      if (nicPremiums) {
        if (nicPremiums.odPremium != null) extractedData.odPremium = String(nicPremiums.odPremium)
        else extractedData.odPremium = ''
        if (nicPremiums.tpPremium != null) extractedData.tpPremium = String(nicPremiums.tpPremium)
        if (nicPremiums.netPremium != null) extractedData.netPremium = String(nicPremiums.netPremium)
        if (nicPremiums.premium != null) extractedData.totalPremium = String(nicPremiums.premium)
        if (nicPremiums.insuranceClass === 'Third Party') {
          extractedData.thirdPartyValidFrom = extractedData.thirdPartyValidFrom || extractedData.validFrom
          extractedData.thirdPartyValidTo = extractedData.thirdPartyValidTo || extractedData.validTo
        }
      }

      // 12. Fix premiums for Royal Sundaram policies.
      const rsPremiums = extractRoyalSundaramPremiums(req._rawPdfText)
      if (rsPremiums) {
        if (rsPremiums.odPremium != null) extractedData.odPremium = String(rsPremiums.odPremium)
        if (rsPremiums.tpPremium != null) extractedData.tpPremium = String(rsPremiums.tpPremium)
        if (rsPremiums.netPremium != null) extractedData.netPremium = String(rsPremiums.netPremium)
        if (rsPremiums.premium != null) extractedData.totalPremium = String(rsPremiums.premium)
      }

      // 13. Fix issueDate — AI sometimes hallucinates today's date or picks the wrong date
      const rawIssueDate = extractIssueDateFromRawText(req._rawPdfText)
      if (rawIssueDate && rawIssueDate !== extractedData.issueDate) {
        console.log('[IssueDate] Overriding issueDate:', extractedData.issueDate, '->', rawIssueDate)
        extractedData.issueDate = rawIssueDate
      }
    }
    return extractedData
  });
};

exports.temporaryPermitOcr = async (req, res) => {
  const prompt = `Extract the details from this temporary permit / trip permit document.
- Extract the vehicle registration number (remove any hyphens/spaces).
- Extract the valid from date and valid to date in DD-MM-YYYY format.
- Determine if the vehicle type is Commercial Vehicle (CV) or Passenger Vehicle (PV) based on the document content. Look for keywords like "COMMERCIAL", "GOODS", "FREIGHT", "CARGO" for CV, and "PASSENGER", "PV", "PRIVATE", "PERSONAL" for PV. If not clear, return empty string.
- Extract the permit holder name if present.
- If a field is not present, return empty string "".`;
  const template = `{"vehicleNumber":"","validFrom":"","validTo":"","vehicleType":"","permitHolderName":""}`;
  return processOcrRequest(req, res, prompt, template, 1);
};

exports.dlOcr = async (req, res) => {
  const prompt = "Extract the details from this Driving Licence document. Extract driving licence number, valid from date, and valid to date only. Map the valid from date to 'validFrom' and the valid to date or expiry date to 'validTo'. Remove any spaces or hyphens from the driving licence number.";
  const template = `{"drivingLicenceNumber":"","validFrom":"","validTo":""}`;
  return processOcrRequest(req, res, prompt, template);
};
