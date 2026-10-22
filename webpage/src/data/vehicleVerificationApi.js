import { LOOKUP_PRICE } from './vehicleInfo'

export const VEHICLE_VERIFICATION_API_PATH = '/vehicle-verification-api'

export const vehicleVerificationApiFaqs = [
  {
    q: 'What is a vehicle verification API?',
    a: `A vehicle verification API lets your software check a vehicle from its registration number before you accept it. The RTO Sarthi vehicle verification API returns registration status, chassis and engine number, owner, insurance, PUC, fitness and tax validity, financer, blacklist and NOC details as JSON, from ${LOOKUP_PRICE} per successful verification.`,
  },
  {
    q: 'What can I verify about a vehicle?',
    a: 'That the registration is active and valid, that the chassis and engine number match, who the registered owner is, whether insurance, PUC, fitness and road tax are valid, whether the vehicle is under finance, and whether it is blacklisted or has an NOC issued, wherever these are available on the vehicle record.',
  },
  {
    q: 'How do I add vehicle verification to my software?',
    a: 'Get a private API key from RTO Sarthi, connect it to your app, onboarding flow or backend with our integration guide, and send the vehicle number. The verification data comes back in seconds, so your software can approve the vehicle or flag it for review.',
  },
  {
    q: 'How is this different from the RC verification API?',
    a: 'Both use the same vehicle record. The RC verification API is about matching an RC copy with the registration record. Vehicle verification is the wider check before onboarding: registration status, validity of insurance, PUC, fitness and tax, finance, blacklist and NOC.',
  },
  {
    q: 'Can I verify vehicles in bulk?',
    a: 'Yes. Your software can send vehicle numbers one after another, for example to verify a whole fleet, a list of drivers or a loan portfolio. Every response shows your remaining verifications.',
  },
  {
    q: 'Which vehicles can I verify?',
    a: 'Two-wheelers, cars, autos, buses, trucks, tractors and other registered vehicles from every state and union territory of India, including BH series.',
  },
  {
    q: 'What does the vehicle verification API cost?',
    a: `Pricing starts at ${LOOKUP_PRICE} per verification. You buy a prepaid limit, there is no monthly fee, and verifications where the vehicle is not found are not counted.`,
  },
  {
    q: 'Can I verify a vehicle without writing code?',
    a: `Yes. Use the vehicle number search in the RTO Sarthi app to see the same details and download the RC and Vehicle Particulars PDF, at ${LOOKUP_PRICE} per search.`,
  },
  {
    q: 'Is RTO Sarthi a government API?',
    a: 'No. RTO Sarthi is an independent private software company from Raipur. It is not the Vahan or Parivahan portal and is not part of the Ministry of Road Transport and Highways or NIC.',
  },
]
