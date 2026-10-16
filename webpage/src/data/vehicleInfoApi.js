import { LOOKUP_PRICE } from './vehicleInfo'

export const VEHICLE_INFO_API_PATH = '/vehicle-information-api'

export const API_ENDPOINT = 'https://api.rtosarthi.com/api/v1/vehicle-info'

export const vehicleInfoApiFaqs = [
  {
    q: 'What is the RTO Sarthi Vehicle Information API?',
    a: `It is a REST API that returns vehicle (RC) details for any Indian vehicle number: owner, maker and model, chassis and engine number, registration, insurance, tax, fitness and PUC validity and more. You call it from your own software with an API key, starting at ${LOOKUP_PRICE} per search.`,
  },
  {
    q: 'How much does the vehicle information API cost?',
    a: `Pricing starts at ${LOOKUP_PRICE} per search. You buy a prepaid search limit for your API key and recharge when it runs low. There is no monthly fee.`,
  },
  {
    q: 'Am I charged when a vehicle is not found?',
    a: 'No. Only successful searches use up your limit. If the vehicle is not found or the service is busy, the search is given back to your limit.',
  },
  {
    q: 'What details does the API return?',
    a: 'Owner name, maker and model, vehicle class, fuel, colour, chassis and engine number, registration date and validity, insurance company, policy and validity, road tax, fitness and PUC validity, financer (hypothecation), permit and blacklist details, wherever they are available on the vehicle record.',
  },
  {
    q: 'How do I call the API?',
    a: `Send a GET request to ${API_ENDPOINT}?vno=VEHICLE_NUMBER with your key in the x-api-key header. The response is JSON with the vehicle details and how many searches you have left.`,
  },
  {
    q: 'Does the API work for vehicles from every state?',
    a: 'Yes. You can search vehicle numbers registered in any state or union territory of India.',
  },
  {
    q: 'Who uses a vehicle information API?',
    a: 'Insurance companies and agents, used car platforms and dealers, loan and finance companies, fleet and logistics companies, parking and toll systems, and software companies building vehicle or RTO products.',
  },
  {
    q: 'How do I get an API key?',
    a: 'Contact RTO Sarthi on call or WhatsApp. We create your API key with the search limit you need and share the integration guide.',
  },
  {
    q: 'Can I see how many searches I have left?',
    a: 'Yes. Every successful response includes usage with your limit, used and remaining searches, so your software always knows when to recharge.',
  },
  {
    q: 'Is my API key safe?',
    a: 'Keep your API key secret and call the API from your server, not from browser or app code that users can see. If a key leaks, we can switch it off and issue a new one.',
  },
]
