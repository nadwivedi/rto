import { LOOKUP_PRICE } from './vehicleInfo'

export const VEHICLE_DETAILS_API_INDIA_PATH = '/vehicle-details-api'

export const vehicleDetailsApiIndiaFaqs = [
  {
    q: 'Which is the best vehicle details API in India?',
    a: `Look for an API that covers every state, returns the full RC record as JSON, charges only for successful searches and gives you a GST invoice. The RTO Sarthi vehicle details API does all of this from ${LOOKUP_PRICE} per search, with no monthly fee and support on call and WhatsApp.`,
  },
  {
    q: 'What is a vehicle detail API?',
    a: 'A vehicle detail API is a service your website, app or CRM calls with an Indian vehicle number. It returns the vehicle’s registration details, such as owner, maker and model, chassis and engine number, insurance, PUC, fitness and tax validity, as JSON your software can use straight away.',
  },
  {
    q: 'Which API can I use for getting vehicle details?',
    a: `You can use the RTO Sarthi vehicle details API. Your software sends an Indian vehicle number and gets the vehicle’s registration details back as JSON: owner, address, maker and model, chassis and engine number, registration, insurance, PUC, fitness, tax, financer, blacklist and NOC, from ${LOOKUP_PRICE} per successful search.`,
  },
  {
    q: 'How do I get vehicle details by vehicle number through an API?',
    a: 'Contact RTO Sarthi for a private API key and choose a search limit. We share the integration guide, your developer connects it to your website, app or CRM, and from then on every vehicle number your software sends returns the vehicle details in seconds.',
  },
  {
    q: 'What vehicle details can I get from the API?',
    a: 'Owner name, father’s name and address, registering RTO and status, vehicle class and body type, maker and model, fuel and emission norms, colour, chassis and engine number, cubic capacity and seating, manufacturing date, registration date and validity, financer (hypothecation), insurance company, policy number and validity, PUC number and validity, fitness and road tax validity, blacklist status and NOC details, wherever they are available on the vehicle record.',
  },
  {
    q: 'Does the API work for vehicles from every state of India?',
    a: 'Yes. It works for vehicle numbers registered in every state and union territory, from Delhi, Maharashtra, Uttar Pradesh and Karnataka to the North East, J&K and Andaman, with the same integration.',
  },
  {
    q: 'Does it work for BH series vehicle numbers?',
    a: 'Yes. Old and new state numbers like MH12AB1234 and Bharat series numbers like 23BH4512AB both work. Send the number with or without spaces and dashes.',
  },
  {
    q: 'Can I get car, bike, truck and tractor details?',
    a: 'Yes. Two-wheelers, cars, autos, e-rickshaws, taxis, buses, trucks, tractors and other registered vehicles all return the same set of fields.',
  },
  {
    q: 'What is the price of a vehicle details API in India?',
    a: `RTO Sarthi starts at ${LOOKUP_PRICE} per successful search. You buy a prepaid search limit in rupees, there is no monthly or setup fee, searches where the vehicle is not found are not counted, and you get a GST invoice for every recharge.`,
  },
  {
    q: 'Can I get vehicle owner details by vehicle number through the API?',
    a: 'Yes. The owner name, father’s name, owner serial number and address are returned wherever they are on the vehicle record. Use them only for genuine business work such as insurance, finance or vehicle verification, as required by Indian data protection law.',
  },
  {
    q: 'Can I check a large number of vehicles?',
    a: 'Yes. Your software can send vehicle numbers one after another, for example to check a whole fleet. Each successful search is counted from your limit and every response shows the remaining searches.',
  },
  {
    q: 'I do not have software. Can I still get vehicle details?',
    a: `Yes. Use the vehicle number search inside the RTO Sarthi app: enter a vehicle number to see the details and download the RC and Vehicle Particulars PDF at ${LOOKUP_PRICE} per search, with no coding.`,
  },
  {
    q: 'Gaadi number se vehicle details nikalne ka API kaise milega?',
    a: `RTO Sarthi ko call ya WhatsApp karein. Hum aapke business ke liye private API key banate hain. Aapka software gaadi number bhejta hai aur owner, model, chassis, engine, insurance, PUC, fitness aur tax ki details JSON mein turant mil jaati hain, sirf ${LOOKUP_PRICE} per search se.`,
  },
  {
    q: 'Is RTO Sarthi a government Vahan or Parivahan API?',
    a: 'No. RTO Sarthi is an independent private software company from Raipur, Chhattisgarh. It is not the Vahan or Parivahan portal and is not part of the Ministry of Road Transport and Highways or NIC.',
  },
  {
    q: 'How fast can I start using the API?',
    a: 'Usually the same day. Contact us, we create your API key and share the integration guide, and our team helps your developer test it with real vehicle numbers.',
  },
]
