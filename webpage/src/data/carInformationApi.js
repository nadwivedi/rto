import { LOOKUP_PRICE } from './vehicleInfo'

export const CAR_INFORMATION_API_PATH = '/car-information-api'

export const carInformationApiFaqs = [
  {
    q: 'What is a car information API?',
    a: `A car information API (also called a car info API) gives your software the full registration record of a car from its number. The RTO Sarthi car information API returns registration status and validity, registering RTO, owner and owner count, model, chassis and engine number, insurance, PUC, fitness and road tax validity, financer, blacklist and NOC as JSON, from ${LOOKUP_PRICE} per successful search.`,
  },
  {
    q: 'Is a car info API the same as a car information API?',
    a: 'Yes. Car info API is the short name for the same thing. With RTO Sarthi it is one API: send the car number and get the full car information back.',
  },
  {
    q: 'What car information can I get from the number plate?',
    a: 'Registration date, validity and status, registering RTO, owner name and owner count, maker and model, chassis and engine number, insurance company and validity, PUC, fitness and road tax validity, financer (hypothecation), blacklist status and NOC details, wherever they are available on the vehicle record.',
  },
  {
    q: 'Can I find out if a car is under loan or blacklisted?',
    a: 'Yes. The financer (hypothecation), blacklist status and NOC details are returned wherever they are available, so you can spot a car that is still under finance or has a problem before you buy, lend or list it.',
  },
  {
    q: 'How is this different from the car details API?',
    a: 'They use the same record. The car details API page focuses on the car’s model, variant and specifications. The car information API page focuses on the car’s full record: registration, owners, validity dates, finance, blacklist and NOC.',
  },
  {
    q: 'How do I add the car information API to my software?',
    a: 'Get a private API key from RTO Sarthi, connect it to your backend with our integration guide, and send the car number. The car information comes back as JSON in seconds.',
  },
  {
    q: 'What does the car information API cost?',
    a: `Pricing starts at ${LOOKUP_PRICE} per search. You buy a prepaid search limit, there is no monthly fee, and searches where the car is not found are not counted.`,
  },
  {
    q: 'Does it cover cars from every state?',
    a: 'Yes. Cars registered in any state or union territory of India, including BH series. The same API also works for bikes and commercial vehicles.',
  },
  {
    q: 'Is RTO Sarthi a government API?',
    a: 'No. RTO Sarthi is an independent private software company from Raipur. It is not the Vahan or Parivahan portal and is not part of the Ministry of Road Transport and Highways or NIC.',
  },
]
