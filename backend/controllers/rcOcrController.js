const axios = require('axios');
const pdfParse = require('pdf-parse');

const callGroqAPI = async (imageBase64, textPrompt, isPdf = false) => {
  if (isPdf) {
    // If PDF, imageBase64 is actually raw text extracted by pdf-parse
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
             role: 'system',
             content: 'You are a document extraction assistant. Respond ONLY with a raw JSON object string. Do not include markdown formatting or explanations.'
          },
          {
            role: 'user',
            content: `${textPrompt}\n\nHere is the raw text from the document:\n\n${imageBase64}`
          }
        ],
        temperature: 0.1,
        max_tokens: 1024
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response;
  } else {
    // Standard vision model
    const formattedImage = imageBase64.startsWith('data:image') 
      ? imageBase64 
      : `data:image/jpeg;base64,${imageBase64}`;

    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: textPrompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: formattedImage
                }
              }
            ]
          }
        ],
        temperature: 0.1,
        max_tokens: 1024
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response;
  }
};

const processOcrRequest = async (req, res, promptText, jsonTemplate) => {
  try {
    const { imageBase64 } = req.body;
    
    if (!imageBase64) {
      return res.status(400).json({ success: false, message: 'Document base64 string is required' });
    }

    let isPdf = false;
    let payload = imageBase64;

    if (imageBase64.startsWith('data:application/pdf')) {
        isPdf = true;
        // extract base64 part
        const base64Data = imageBase64.replace(/^data:application\/pdf;base64,/, "");
        const buffer = Buffer.from(base64Data, 'base64');
        const pdfData = await pdfParse(buffer);
        payload = pdfData.text; // replace the payload with raw text
    }

    const fullPrompt = `${promptText}
Respond ONLY with a valid JSON object matching this structure exactly (use empty string "" if a field is not found):
${jsonTemplate}`;

    const response = await callGroqAPI(payload, fullPrompt, isPdf);

    const messageContent = response.data.choices[0].message.content;
    
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
      extractedData.registrationNumber = extractedData.registrationNumber.replace(/\s+/g, '');
    }
    if (typeof extractedData.vehicleNumber === 'string') {
      extractedData.vehicleNumber = extractedData.vehicleNumber.replace(/\s+/g, '');
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
  const prompt = "Extract the details from this vehicle registration certificate (RC).";
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
