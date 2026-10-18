import { LOOKUP_PRICE } from './vehicleInfo'

export const LOOKUP_API_PATH = '/vehicle-lookup-api'

export const lookupApiFaqs = [
  {
    q: 'What is a vehicle lookup API?',
    a: `A vehicle lookup API lets your software look up a vehicle by its registration number and get its record back automatically. The RTO Sarthi vehicle lookup API returns the registration status, registering RTO, owner, maker and model, chassis and engine number, insurance, PUC, fitness and tax validity, financer, blacklist and NOC details as JSON, from ${LOOKUP_PRICE} per successful search.`,
  },
  {
    q: 'How do I look up a vehicle by registration number in my software?',
    a: 'Get a private API key from RTO Sarthi, connect it to your website, app or CRM with our integration guide, and send the registration number. The vehicle record comes back in seconds.',
  },
  {
    q: 'Can I verify that a vehicle number matches the chassis and engine number?',
    a: 'Yes. The lookup returns the chassis and engine number on the registration record, so your software can compare them with what the customer gave you and flag a mismatch.',
  },
  {
    q: 'Can the lookup tell me if a vehicle is blacklisted or financed?',
    a: 'Yes. The response includes registration status, financer (hypothecation), blacklist status and NOC details wherever they are available on the vehicle record.',
  },
  {
    q: 'Can I look up vehicles in bulk?',
    a: 'Yes. Your software can send registration numbers one after another, for example to check a fleet or a list of vehicles. Every successful lookup is counted from your limit and every response shows the remaining searches.',
  },
  {
    q: 'Which vehicles can I look up?',
    a: 'Two-wheelers, cars, autos, buses, trucks, tractors and other registered vehicles from every state and union territory of India.',
  },
  {
    q: 'What does the vehicle lookup API cost?',
    a: `Pricing starts at ${LOOKUP_PRICE} per lookup. You buy a prepaid search limit, there is no monthly fee, and lookups where the vehicle is not found are not counted.`,
  },
  {
    q: 'How fast is a vehicle lookup?',
    a: 'Results usually come back in a few seconds, ready to show on screen or save in your database.',
  },
  {
    q: 'Can I look up vehicles without writing code?',
    a: `Yes. Use the vehicle number search in the RTO Sarthi app to see the same details and download the RC and Vehicle Particulars PDF, at ${LOOKUP_PRICE} per search.`,
  },
  {
    q: 'Is RTO Sarthi a government API?',
    a: 'No. RTO Sarthi is an independent private software company from Raipur. It is not the Vahan or Parivahan portal and is not part of the Ministry of Road Transport and Highways or NIC.',
  },
]
