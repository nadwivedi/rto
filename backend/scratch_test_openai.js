const axios = require('axios');
require('dotenv').config();

async function testOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  console.log('Testing OpenAI key:', apiKey ? apiKey.substring(0, 15) + '...' : 'NONE');
  try {
    const res = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: 'Respond with JSON: {"status": "ok"}' }],
      response_format: { type: 'json_object' }
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('OpenAI Response:', res.data.choices[0].message.content);
  } catch (err) {
    console.error('OpenAI Error:', err.response?.status, err.response?.data || err.message);
  }
}

testOpenAI();
