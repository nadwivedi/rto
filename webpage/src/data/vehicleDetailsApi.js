import { LOOKUP_PRICE } from './vehicleInfo'

export const VEHICLE_DETAILS_API_PATH = '/api-for-vehicle-details'

export const vehicleDetailsApiFaqs = [
  {
    q: 'Which API can I use for getting vehicle details?',
    a: `You can use the RTO Sarthi vehicle details API. Your software sends an Indian vehicle number and gets the vehicle’s registration details back as JSON: owner, address, maker and model, chassis and engine number, registration, insurance, PUC, fitness, tax, financer, blacklist and NOC, from ${LOOKUP_PRICE} per successful search.`,
  },
  {
    q: 'How do I get vehicle details by vehicle number through an API?',
    a: 'Contact RTO Sarthi for a private API key and choose a search limit. We share the integration guide, your developer connects it to your website, app or CRM, and from then on every vehicle number your software sends returns the vehicle details in seconds.',
  },
  {
    q: 'What vehicle details can I get from the API?',
    a: 'Owner name, father’s name and address, registering RTO and status, vehicle class and body type, maker and model, fuel and emission norms, colour, chassis and engine number, cubic capacity and seating, manufacturing date, registration date and validity, financer (hypothecation), insurance company, policy number and validity, PUC number and validity, fitness and road tax validity, blacklist status and NOC details, wherever they are available on the vehicle record.',
  },
  {
    q: 'How much does an API for vehicle details cost?',
    a: `RTO Sarthi pricing starts at ${LOOKUP_PRICE} per search. You buy a prepaid search limit, there is no monthly fee, and searches where the vehicle is not found are not counted.`,
  },
  {
    q: 'Can I get vehicle details of any state in India?',
    a: 'Yes. The same API works for vehicle numbers registered in any state or union territory of India.',
  },
  {
    q: 'Can I get owner details from a vehicle number with the API?',
    a: 'Yes. The response includes the registered owner’s name, father’s name, owner serial number and address wherever they are on the vehicle record. Use these details only for genuine business work such as insurance, finance or vehicle verification.',
  },
  {
    q: 'Can I check insurance, PUC and fitness validity with the API?',
    a: 'Yes. The response includes insurance company, policy number and validity, PUC number and validity, fitness validity and road tax validity, so your software can check whether a vehicle’s documents are valid.',
  },
  {
    q: 'Can I check a large number of vehicles?',
    a: 'Yes. Your software can send vehicle numbers one after another, for example to check a whole fleet. Each successful search is counted from your limit and every response shows the remaining searches.',
  },
  {
    q: 'I do not have software. Can I still get vehicle details?',
    a: `Yes. Use the vehicle number search inside the RTO Sarthi app: enter a vehicle number to see the details and download the RC and Vehicle Particulars PDF at ${LOOKUP_PRICE} per search, with no coding.`,
  },
  {
    q: 'Is RTO Sarthi a government API?',
    a: 'No. RTO Sarthi is an independent private software company from Raipur. It is not the Vahan or Parivahan portal and is not part of the Ministry of Road Transport and Highways or NIC.',
  },
  {
    q: 'How fast can I start?',
    a: 'Usually the same day. Contact us on call or WhatsApp, we create your API key, and our team helps your developer test it with real vehicle numbers.',
  },
]
