import { LOOKUP_PRICE } from './vehicleInfo'

export const VEHICLE_DATA_API_PATH = '/vehicle-data-api'

export const vehicleDataApiFaqs = [
  {
    q: 'What is a vehicle data API in India?',
    a: `A vehicle data API gives your software the registration data of an Indian vehicle from its number. The RTO Sarthi vehicle data API returns registration, owner, maker and model, chassis and engine, insurance, PUC, fitness, tax, financer, blacklist and NOC data as JSON, from ${LOOKUP_PRICE} per successful search.`,
  },
  {
    q: 'What vehicle data does the API return?',
    a: 'Registration number, status, registering RTO, registration date and validity, owner name and serial number, maker, model, vehicle class, body type, fuel, emission norms, cubic capacity, seating, colour, manufacturing date, chassis and engine number, insurance company, policy number and validity, PUC, fitness and tax validity, financer, blacklist status and NOC details, wherever they are available on the vehicle record.',
  },
  {
    q: 'How do I get vehicle data in my software?',
    a: 'Get a private API key from RTO Sarthi, connect it to your website, app or backend with our integration guide, and send the vehicle number. The vehicle data comes back as JSON in seconds, ready to show or save in your database.',
  },
  {
    q: 'Can I fetch vehicle data in bulk?',
    a: 'Yes. Your software can send vehicle numbers one after another, for example to enrich a customer list, a fleet or a loan portfolio. Every response shows your remaining searches.',
  },
  {
    q: 'Does the API cover all states of India?',
    a: 'Yes. Two-wheelers, cars, autos, buses, trucks, tractors and other registered vehicles from every state and union territory, including BH series numbers.',
  },
  {
    q: 'What does the vehicle data API cost?',
    a: `Pricing starts at ${LOOKUP_PRICE} per search. You buy a prepaid search limit, there is no monthly or setup fee, you get a GST invoice, and searches where the vehicle is not found are not counted.`,
  },
  {
    q: 'Is there a free trial?',
    a: 'Contact us on call or WhatsApp. We can share sample responses and help you test the API before you buy a larger limit.',
  },
  {
    q: 'Can I see vehicle data without writing code?',
    a: `Yes. Use the vehicle number search in the RTO Sarthi app to see the same data and download the RC and Vehicle Particulars PDF, at ${LOOKUP_PRICE} per search.`,
  },
  {
    q: 'Is RTO Sarthi a government API?',
    a: 'No. RTO Sarthi is an independent private software company from Raipur. It is not the Vahan or Parivahan portal and is not part of the Ministry of Road Transport and Highways or NIC.',
  },
]
