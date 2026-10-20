import { LOOKUP_PRICE } from './vehicleInfo'

export const PARIVAHAN_API_PATH = '/parivahan-api'

export const parivahanApiFaqs = [
  {
    q: 'What is a Parivahan API?',
    a: 'Parivahan is the Government of India’s transport portal, built on the Vahan vehicle registration system used by RTOs. A Parivahan API lets your software send a vehicle number and get that vehicle’s registration (RC) details back automatically, instead of searching the Parivahan website by hand.',
  },
  {
    q: 'How can I use a Parivahan API to get vehicle details?',
    a: `Contact RTO Sarthi for a private API key. Your software sends a vehicle number and gets the owner, maker and model, chassis and engine number, insurance, PUC, fitness, tax, financer and blacklist details back as JSON in seconds, from ${LOOKUP_PRICE} per successful search.`,
  },
  {
    q: 'What is the Parivahan API cost?',
    a: `With RTO Sarthi the Parivahan API cost starts at ${LOOKUP_PRICE} per successful search. There is no monthly fee and no setup fee, you pay in rupees for a prepaid search limit, and searches where the vehicle is not found are not counted.`,
  },
  {
    q: 'How much will 10,000 vehicle searches cost?',
    a: `At the starting rate of ${LOOKUP_PRICE} per search, 10,000 successful searches cost ₹15,000 plus GST. Your exact rate depends on the search limit you buy, so contact us for a quote for your volume.`,
  },
  {
    q: 'Is there a free Parivahan API?',
    a: 'The Parivahan website lets anyone check one vehicle at a time by hand, but it does not give businesses a free API for their own software. RTO Sarthi charges only for successful searches, so you never pay for vehicles that are not found.',
  },
  {
    q: 'Can I get an official Parivahan API key from the government?',
    a: 'Direct access to Parivahan and Vahan data is given by the government only to approved organisations through a formal process, which most businesses cannot use. RTO Sarthi gives your business an API key the same day, with no approval process.',
  },
  {
    q: 'What vehicle details does the Parivahan API return?',
    a: 'Owner name, father’s name and address, registering RTO and status, vehicle class, maker and model, fuel and emission norms, chassis and engine number, registration date and validity, financer, insurance company and validity, PUC, fitness and road tax validity, blacklist and NOC status, wherever they are available on the vehicle record.',
  },
  {
    q: 'Does it work for every state of India?',
    a: 'Yes. Vehicle numbers from every state and union territory work, including Bharat (BH) series numbers, with the same integration.',
  },
  {
    q: 'Is RTO Sarthi the government Parivahan portal?',
    a: 'No. RTO Sarthi is an independent private software company from Raipur, Chhattisgarh. It is not the Parivahan or Vahan portal and is not part of the Ministry of Road Transport and Highways or NIC.',
  },
  {
    q: 'How fast can I start?',
    a: 'Usually the same day. Contact us on call or WhatsApp, we create your API key, and our team helps your developer test it with real vehicle numbers.',
  },
]
