import { LOOKUP_PRICE } from './vehicleInfo'

export const RC_VERIFICATION_API_PATH = '/vehicle-rc-verification-api'

export const rcVerificationApiFaqs = [
  {
    q: 'What is a vehicle RC verification API?',
    a: `A vehicle RC verification API lets your software check a vehicle's registration certificate (RC) from its vehicle number. The RTO Sarthi RC verification API returns the RC details as JSON: registration status, owner name, maker and model, chassis and engine number, registration date and validity, financer, insurance, PUC, fitness, blacklist and NOC, from ${LOOKUP_PRICE} per successful verification.`,
  },
  {
    q: 'How do I verify an RC in my software?',
    a: 'Get a private API key from RTO Sarthi, connect it to your website, app or CRM with our integration guide, and send the vehicle number. The RC details come back in seconds, so your software can compare them with what the customer submitted.',
  },
  {
    q: 'Can I check that the RC matches the chassis and engine number?',
    a: 'Yes. The response includes the chassis and engine number on the registration record. Compare them with the customer’s RC copy or the vehicle itself and flag any mismatch.',
  },
  {
    q: 'Can I verify the owner name on an RC?',
    a: 'Yes. The owner name and owner serial number are returned wherever they are available on the vehicle record, so you can match the RC owner with the customer’s KYC.',
  },
  {
    q: 'Does the API show if a vehicle is blacklisted, financed or has an NOC?',
    a: 'Yes. Registration status, financer (hypothecation), blacklist status and NOC details are returned wherever they are available on the vehicle record.',
  },
  {
    q: 'Can I verify RCs in bulk?',
    a: 'Yes. Your software can send vehicle numbers one after another, for example to verify a fleet or a loan portfolio. Every response shows your remaining verifications.',
  },
  {
    q: 'Which vehicles can I verify?',
    a: 'Two-wheelers, cars, autos, buses, trucks, tractors and other registered vehicles from every state and union territory of India, including BH series.',
  },
  {
    q: 'What does the RC verification API cost?',
    a: `Pricing starts at ${LOOKUP_PRICE} per verification. You buy a prepaid limit, there is no monthly fee, and verifications where the vehicle is not found are not counted.`,
  },
  {
    q: 'Can I verify an RC without writing code?',
    a: `Yes. RTO agents and dealers can use the RC verification software in the RTO Sarthi app to see the same details and download the RC PDF, at ${LOOKUP_PRICE} per search.`,
  },
  {
    q: 'Is RTO Sarthi a government API?',
    a: 'No. RTO Sarthi is an independent private software company from Raipur. It is not the Vahan or Parivahan portal and is not part of the Ministry of Road Transport and Highways or NIC.',
  },
]
