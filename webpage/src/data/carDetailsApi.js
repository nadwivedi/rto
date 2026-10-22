import { LOOKUP_PRICE } from './vehicleInfo'

export const CAR_DETAILS_API_PATH = '/car-details-api'

export const carDetailsApiFaqs = [
  {
    q: 'What is a car details API?',
    a: `A car details API gives your software the details of a car from its registration number. The RTO Sarthi car details API returns the maker, model and variant, fuel, engine CC, seating, colour, manufacturing year, owner serial number, chassis and engine number, insurance, PUC and registration validity as JSON, from ${LOOKUP_PRICE} per successful search.`,
  },
  {
    q: 'Can I get the car model and variant from the number plate?',
    a: 'Yes. The API returns the maker (for example Maruti Suzuki, Hyundai, Tata) and the model and variant as registered (for example SWIFT VXI or CRETA SX 1.5), with fuel type, CC and emission norms, wherever they are available on the vehicle record.',
  },
  {
    q: 'Can I see how many owners a car has had?',
    a: 'Yes. The owner serial number shows whether the car is with its first, second or later owner, which is useful for used car pricing and listings.',
  },
  {
    q: 'Does the API show car insurance details?',
    a: 'Yes. The insurance company, policy number and insurance valid-up-to date are returned wherever they are available, along with PUC, fitness and road tax validity.',
  },
  {
    q: 'Does it work for bikes and commercial vehicles too?',
    a: 'Yes. The same API works for two-wheelers, autos, buses, trucks and tractors as well as cars, from every state of India including BH series.',
  },
  {
    q: 'How do I add the car details API to my website or app?',
    a: 'Get a private API key from RTO Sarthi, connect it to your backend with our integration guide, and send the car number your user enters. The car details come back as JSON in seconds, ready to auto-fill your form or listing.',
  },
  {
    q: 'What does the car details API cost?',
    a: `Pricing starts at ${LOOKUP_PRICE} per search. You buy a prepaid search limit, there is no monthly fee, and searches where the car is not found are not counted.`,
  },
  {
    q: 'Can I check car details without writing code?',
    a: `Yes. Use the vehicle number search in the RTO Sarthi app to see the same details and download the RC PDF, at ${LOOKUP_PRICE} per search.`,
  },
  {
    q: 'Is RTO Sarthi a government API?',
    a: 'No. RTO Sarthi is an independent private software company from Raipur. It is not the Vahan or Parivahan portal and is not part of the Ministry of Road Transport and Highways or NIC.',
  },
]
