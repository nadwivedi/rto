import { LOOKUP_PRICE } from './vehicleInfo'

export const MAKE_MODEL_API_PATH = '/vehicle-make-and-model-api'

export const makeModelApiFaqs = [
  {
    q: 'What is a vehicle make and model API?',
    a: 'A vehicle make and model API tells your software who made a vehicle and which model it is. With the RTO Sarthi API you send an Indian vehicle number and get the maker, model, vehicle class, body type, fuel, emission norms, cubic capacity, seating, colour and manufacturing month and year back as JSON.',
  },
  {
    q: 'How do I find the make and model of a vehicle from its number?',
    a: `Send the vehicle number to the RTO Sarthi API and read the MAKER_DESC (maker) and MAKER_MODEL (model) fields in the response. Without software, enter the number in the RTO Sarthi app’s vehicle search. Both start at ${LOOKUP_PRICE} per successful search.`,
  },
  {
    q: 'Does the API return the variant too?',
    a: 'The model is returned exactly as it is written on the vehicle’s registration record. For many vehicles this includes the variant, for example “SWIFT VXI” or “ACTIVA 6G”, but the format depends on how the maker registered it.',
  },
  {
    q: 'Is this a catalog of all vehicle makes and models in India?',
    a: 'No. The RTO Sarthi API looks up one registered vehicle by its vehicle number and returns that vehicle’s make and model with its other registration details. It is not a list of every make, model and variant sold in India.',
  },
  {
    q: 'Which other vehicle details come with make and model?',
    a: 'Vehicle class, body type, fuel and emission norms, colour, cubic capacity, seating capacity, manufacturing month and year, registration date, chassis and engine number, and insurance, PUC, fitness and tax validity, wherever they are available on the vehicle record. Owner and financer details are included too.',
  },
  {
    q: 'What does the vehicle make and model API cost?',
    a: `Pricing starts at ${LOOKUP_PRICE} per search. You buy a prepaid search limit, there is no monthly fee, and searches where the vehicle is not found are not counted.`,
  },
  {
    q: 'Does it work for two-wheelers, cars and commercial vehicles?',
    a: 'Yes. It works for motorcycles and scooters, cars, autos, buses, trucks, tractors and other registered vehicles from every state and union territory of India.',
  },
  {
    q: 'Who uses a make and model API?',
    a: 'Motor insurance platforms for quotes, used car marketplaces and dealers, spare parts, tyre and accessories sellers for fitment, garages and service centres, vehicle loan companies, fleet operators and app developers.',
  },
  {
    q: 'Is RTO Sarthi a government API?',
    a: 'No. RTO Sarthi is an independent private software company from Raipur. It is not the Vahan or Parivahan portal and is not part of the Ministry of Road Transport and Highways or NIC.',
  },
  {
    q: 'How do I get an API key?',
    a: 'Contact RTO Sarthi on call or WhatsApp. We create your private API key with the search limit you need and help your developer test it with real vehicle numbers, usually the same day.',
  },
]
