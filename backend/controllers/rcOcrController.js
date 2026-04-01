const axios = require('axios');

exports.rcOcr = async (req, res) => {
  try {
    const { imageBase64 } = req.body;
    
    if (!imageBase64) {
      return res.status(400).json({ success: false, message: 'Image is required' });
    }

    const GROQ_API_KEY = process.env.GROQ_API_KEY;

    // Ensure the image string contains the correct prefix if not already
    // The Groq API vision models typically require a format like: data:image/jpeg;base64,...
    const formattedImage = imageBase64.startsWith('data:image') 
      ? imageBase64 
      : `data:image/jpeg;base64,${imageBase64}`;

    // Call Groq API
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
                text: `Extract the details from this vehicle registration certificate (RC).
Respond ONLY with a valid JSON object matching this structure exactly (use empty string "" if a field is not found):
{
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
}`
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
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const messageContent = response.data.choices[0].message.content;
    
    // Parse out potential markdown blocks from Groq's response
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
