import { LOOKUP_PRICE } from './vehicleInfo'

export const REGISTRATION_DETAILS_API_PATH = '/vehicle-registration-details-api'

export const registrationDetailsApiFaqs = [
  {
    q: 'What is a vehicle registration details API?',
    a: `A vehicle registration details API gives your software the registration record of a vehicle from its registration number. The RTO Sarthi vehicle registration details API returns registration date and validity, registering RTO, registration status, owner name and owner count, vehicle class, maker and model, chassis and engine number, NOC and blacklist details as JSON, from ${LOOKUP_PRICE} per successful search.`,
  },
  {
    q: 'What registration details does the API return?',
    a: 'Registration number, registration date (REGN_DT), registration valid up to (REGN_UPTO), registering RTO (REGISTERED_AT), registration status (STATUS), owner name and owner serial number, vehicle class, maker and model, chassis and engine number, financer, blacklist and NOC details, wherever they are available on the vehicle record.',
  },
  {
    q: 'Can I check if a vehicle’s registration is still valid?',
    a: 'Yes. REGN_UPTO is the date the registration is valid up to and STATUS shows whether the registration is active. Private vehicles are usually registered for 15 years and then need renewal.',
  },
  {
    q: 'Can I find which RTO a vehicle is registered at?',
    a: 'Yes. REGISTERED_AT returns the registering RTO office and state, for example "PUNE RTO, MAHARASHTRA". It also works for BH series numbers.',
  },
  {
    q: 'Does it show if a vehicle was transferred or has an NOC?',
    a: 'The owner serial number shows how many times ownership has changed, and NOC details are returned wherever an NOC is recorded, for example when a vehicle moves to another state.',
  },
  {
    q: 'How do I add the API to my software?',
    a: 'Get a private API key from RTO Sarthi, connect it to your backend with our integration guide, and send the registration number. The registration details come back as JSON in seconds.',
  },
  {
    q: 'What does the vehicle registration details API cost?',
    a: `Pricing starts at ${LOOKUP_PRICE} per search. You buy a prepaid search limit, there is no monthly fee, and searches where the vehicle is not found are not counted.`,
  },
  {
    q: 'Which vehicles are covered?',
    a: 'Two-wheelers, cars, autos, buses, trucks, tractors and other registered vehicles from every state and union territory of India, including BH series.',
  },
  {
    q: 'Is RTO Sarthi a government API?',
    a: 'No. RTO Sarthi is an independent private software company from Raipur. It does not register vehicles, is not the Vahan or Parivahan portal and is not part of the Ministry of Road Transport and Highways or NIC.',
  },
]
