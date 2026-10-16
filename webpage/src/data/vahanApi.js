import { LOOKUP_PRICE } from './vehicleInfo'

export const VAHAN_API_PATH = '/vahan-api'

export const vahanApiFaqs = [
  {
    q: 'What is a Vahan API?',
    a: 'Vahan is the national vehicle registration system used by RTOs across India. A Vahan API lets your software send a vehicle number and get that vehicle\'s registration (RC) details back automatically, instead of searching and copying them by hand.',
  },
  {
    q: 'How can I get vehicle details using a Vahan API?',
    a: `Get an API key from RTO Sarthi, connect it to your software with our integration guide, and send a vehicle number. The vehicle details come back as JSON in seconds, from ${LOOKUP_PRICE} per successful search.`,
  },
  {
    q: 'What vehicle details does the Vahan API return?',
    a: 'Owner name, father\'s name, owner serial number and address, maker and model, vehicle class, body type, fuel and emission norms, colour, chassis and engine number, cubic capacity and seating, registration date, RTO and validity, financer (hypothecation), insurance company, policy number and validity, PUC number and validity, fitness and road tax validity, blacklist and NOC status, wherever they are available on the vehicle record.',
  },
  {
    q: 'What is the price of the Vahan API?',
    a: `RTO Sarthi Vahan API pricing starts at ${LOOKUP_PRICE} per search. You buy a prepaid search limit, there is no monthly fee, and only successful searches are counted.`,
  },
  {
    q: 'Is RTO Sarthi the official government Vahan API?',
    a: 'No. RTO Sarthi is an independent private software company from Raipur. It is not the Vahan or Parivahan portal and is not part of the Ministry of Road Transport and Highways or NIC. We provide an API that returns vehicle registration details for business use.',
  },
  {
    q: 'Can I get details of vehicles from any state?',
    a: 'Yes. Vehicle numbers registered in any state or union territory of India can be searched, like CG, MH, DL, UP, GJ, KA, TN and others.',
  },
  {
    q: 'Can I search vehicles in bulk with the Vahan API?',
    a: 'Yes. Your software can send one vehicle number after another, and each successful search is counted from your limit. Every response shows your remaining searches.',
  },
  {
    q: 'Who needs a Vahan API for vehicle details?',
    a: 'Insurance companies and agents, used car platforms and dealers, vehicle loan and finance companies, fleet and transport companies, parking, toll and society security systems, RTO agent software and app developers.',
  },
  {
    q: 'Is the vehicle data safe to use?',
    a: 'Every customer gets a private API key, and the details should be used only for genuine business work such as insurance, finance or vehicle verification. If a key leaks, we switch it off and issue a new one.',
  },
]
