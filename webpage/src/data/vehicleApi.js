// The public vehicle info API (backend/controllers/publicVehicleApiController.js), shown in the
// API docs page and in the request / response samples on every API landing page.

export const API_DOCS_PATH = '/vehicle-api-documentation'
export const API_ENDPOINT = 'https://api.rtosarthi.com/api/v1/vehicle-info'
export const DEMO_VEHICLE_NO = 'CG04AB1234'

// Request sample block for a landing page, using that page's own demo vehicle number
export const requestBlock = (vno) => ({
  label: 'GET request',
  code: `GET ${API_ENDPOINT}?vno=${vno}
x-api-key: YOUR_API_KEY

# or with cURL
curl -H "x-api-key: YOUR_API_KEY" \\
  "${API_ENDPOINT}?vno=${vno}"`,
})

export const apiDocsFaqs = [
  {
    q: 'What is the RTO Sarthi vehicle API endpoint?',
    a: `Send a GET request to ${API_ENDPOINT}?vno=VEHICLE_NUMBER with your API key in the x-api-key header. The vehicle details come back as JSON.`,
  },
  {
    q: 'How do I send my API key?',
    a: 'Send it in the x-api-key request header. Keep it secret and call the API from your server, never from browser or app code that customers can see.',
  },
  {
    q: 'Which calls are counted from my limit?',
    a: 'Only calls that return vehicle details (HTTP 200). Invalid numbers, vehicles not found and service errors are not counted, and every response shows your limit, used and remaining calls.',
  },
  {
    q: 'In which format should I send the vehicle number?',
    a: 'Any Indian registration number, including BH series. Spaces and dashes are removed and letters are made upper case, so "cg 04-ab 1234" and "CG04AB1234" are the same.',
  },
  {
    q: 'Can I use POST instead of GET?',
    a: 'Yes. POST to the same URL with a JSON body like {"vno": "CG04AB1234"} and the same x-api-key header.',
  },
  {
    q: 'How do I get an API key?',
    a: 'Contact RTO Sarthi on call or WhatsApp. We create a private key for your business, usually the same day, and add the number of calls you buy to it.',
  },
]
