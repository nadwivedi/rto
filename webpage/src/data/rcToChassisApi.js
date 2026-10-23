import { LOOKUP_PRICE } from './vehicleInfo'

export const RC_TO_CHASSIS_API_PATH = '/rc-to-chassis-number-api'

export const rcToChassisApiFaqs = [
  {
    q: 'What is an RC to chassis number API?',
    a: `An RC to chassis number API takes a vehicle’s RC (registration) number and returns the chassis number on its registration record. The RTO Sarthi API returns the chassis number with the engine number, maker, model, manufacturing date and registration status as JSON, from ${LOOKUP_PRICE} per successful search.`,
  },
  {
    q: 'How do I get the chassis number from a vehicle number?',
    a: 'Send the vehicle number to the RTO Sarthi API with your private API key. The response includes CHASI_NO (chassis number) and ENG_NO (engine number), wherever they are available on the vehicle record.',
  },
  {
    q: 'Is the chassis number the same as the VIN?',
    a: 'In India the chassis number on the RC is the vehicle’s VIN (vehicle identification number), usually 17 characters. It is stamped on the vehicle body and printed on the RC.',
  },
  {
    q: 'Why would I need the chassis number from an RC number?',
    a: 'To check that the vehicle in front of you is the one on the RC, to fill insurance proposals and claims, to order the right spare parts, to verify a vehicle before a loan or purchase, and to match a vehicle with its manufacturer and model year.',
  },
  {
    q: 'Can I check if the chassis number matches the RC?',
    a: 'Yes. Compare the CHASI_NO in the response with the chassis number on the vehicle or on the customer’s RC copy. A mismatch is a warning sign of a wrong, tampered or fake RC.',
  },
  {
    q: 'Can I get the vehicle number from a chassis number?',
    a: 'No. The API works from the vehicle registration number. Send the vehicle number and it returns the chassis number with the rest of the record.',
  },
  {
    q: 'What does it cost?',
    a: `Pricing starts at ${LOOKUP_PRICE} per search. You buy a prepaid search limit, there is no monthly fee, and searches where the vehicle is not found are not counted.`,
  },
  {
    q: 'Can I see the chassis number without writing code?',
    a: `Yes. Use the vehicle number search in the RTO Sarthi app to see the chassis and engine number and download the RC PDF, at ${LOOKUP_PRICE} per search.`,
  },
  {
    q: 'Is RTO Sarthi a government API?',
    a: 'No. RTO Sarthi is an independent private software company from Raipur. It is not the Vahan or Parivahan portal and is not part of the Ministry of Road Transport and Highways or NIC.',
  },
]
