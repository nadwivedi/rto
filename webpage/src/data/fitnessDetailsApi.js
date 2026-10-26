import { LOOKUP_PRICE } from './vehicleInfo'

export const FITNESS_DETAILS_API_PATH = '/vehicle-fitness-details-api'

export const fitnessDetailsApiFaqs = [
  {
    q: 'What is a vehicle fitness details API?',
    a: `A vehicle fitness details API takes a vehicle registration number and returns the fitness validity on its record. The RTO Sarthi API returns the fitness valid up to date (FIT_UPTO) with vehicle class, registration status, permit number, insurance, PUC and road tax validity as JSON, from ${LOOKUP_PRICE} per successful search.`,
  },
  {
    q: 'How do I check vehicle fitness by vehicle number?',
    a: 'Send the vehicle number to the RTO Sarthi API with your private API key. Read FIT_UPTO from the response and compare it with today’s date: if the date has passed, the fitness certificate has expired.',
  },
  {
    q: 'Which vehicles need a fitness certificate?',
    a: 'Every transport (commercial) vehicle such as trucks, buses, taxis, auto rickshaws and goods carriers needs a valid fitness certificate, renewed regularly. For private vehicles, the registration validity works as the fitness validity, and FIT_UPTO usually matches the registration valid up to date.',
  },
  {
    q: 'Does the API return the fitness certificate number?',
    a: 'The API returns the fitness valid up to date, which is what you need to check if a vehicle is fit to run and when its fitness is due. It does not return the fitness certificate number or inspection details.',
  },
  {
    q: 'Can I get fitness, insurance, PUC and tax validity together?',
    a: 'Yes. Every successful search returns fitness, insurance, PUC and road tax validity in one response, so one API call tells you every document that is expired or due.',
  },
  {
    q: 'Can I check fitness for many vehicles at once?',
    a: 'Yes. Call the API for each vehicle number in your fleet or customer list. Every response includes how many searches are left on your limit, so you can run bulk fitness checks safely.',
  },
  {
    q: 'What does it cost?',
    a: `Pricing starts at ${LOOKUP_PRICE} per search. You buy a prepaid search limit, there is no monthly fee, and searches where the vehicle is not found are not counted.`,
  },
  {
    q: 'Can I check fitness without writing code?',
    a: `Yes. Use the vehicle number search in the RTO Sarthi app to see fitness, insurance, PUC and tax validity, save the vehicle and get WhatsApp reminders before the fitness expires, at ${LOOKUP_PRICE} per search.`,
  },
  {
    q: 'Is RTO Sarthi a government API?',
    a: 'No. RTO Sarthi is an independent private software company from Raipur. It is not the Vahan or Parivahan portal and is not part of the Ministry of Road Transport and Highways or NIC.',
  },
]
