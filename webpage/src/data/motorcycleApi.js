import { LOOKUP_PRICE } from './vehicleInfo'

export const MOTORCYCLE_API_PATH = '/motorcycle-api-india'

export const motorcycleApiFaqs = [
  {
    q: 'What is a motorcycle API in India?',
    a: `A motorcycle API gives your software the details of a bike or scooter from its registration number. The RTO Sarthi motorcycle API returns the maker, model, engine CC, fuel, emission norms, manufacturing date, owner and owner count, chassis and engine number, insurance, PUC and registration validity, financer, blacklist and NOC as JSON, from ${LOOKUP_PRICE} per successful search.`,
  },
  {
    q: 'Does it work for scooters and electric two-wheelers?',
    a: 'Yes. It works for every registered two-wheeler: motorcycles, scooters, mopeds and electric scooters and bikes, from any state of India including BH series. The fuel field shows PETROL, PETROL(E20) or ELECTRIC(BOV).',
  },
  {
    q: 'Can I get the bike model and engine CC from the number plate?',
    a: 'Yes. MAKER_DESC is the manufacturer (for example HERO MOTOCORP, HONDA, ROYAL-ENFIELD), MAKER_MODEL the model (for example SPLENDOR PLUS or BULLET 350) and CUBIC_CAPACITY the engine CC, wherever they are available on the vehicle record.',
  },
  {
    q: 'Can I check bike insurance and PUC by number?',
    a: 'Yes. The response includes the insurance company and insurance valid-up-to date, and PUC valid-up-to, so you can quote a renewal or remind the owner before they expire.',
  },
  {
    q: 'Can I see if a used bike is under loan or blacklisted?',
    a: 'Yes. Financer (hypothecation), blacklist and NOC details are returned wherever available, with the owner count, so you can check a used bike before you buy, sell or finance it.',
  },
  {
    q: 'How do I add the motorcycle API to my app?',
    a: 'Get a private API key from RTO Sarthi, connect it to your backend with our integration guide, and send the bike number. The details come back as JSON in seconds, ready to auto-fill your form or listing.',
  },
  {
    q: 'What does the motorcycle API cost?',
    a: `Pricing starts at ${LOOKUP_PRICE} per search. You buy a prepaid search limit, there is no monthly fee, and searches where the vehicle is not found are not counted.`,
  },
  {
    q: 'Can I check bike details without writing code?',
    a: `Yes. Use the vehicle number search in the RTO Sarthi app to see the same details and download the RC PDF, at ${LOOKUP_PRICE} per search.`,
  },
  {
    q: 'Is RTO Sarthi a government API?',
    a: 'No. RTO Sarthi is an independent private software company from Raipur. It is not the Vahan or Parivahan portal and is not part of the Ministry of Road Transport and Highways or NIC.',
  },
]
