import { LOOKUP_PRICE } from './vehicleInfo'

export const ROAD_TAX_DETAILS_API_PATH = '/rc-to-road-tax-details-api'

export const roadTaxDetailsApiFaqs = [
  {
    q: 'What is an RC to road tax details API?',
    a: `An RC to road tax details API takes a vehicle’s RC (registration) number and returns how long its road tax is paid. The RTO Sarthi API returns the tax paid up to date (TAX_UPTO) with vehicle class, registering RTO, permit number and fitness, insurance and PUC validity as JSON, from ${LOOKUP_PRICE} per successful search.`,
  },
  {
    q: 'How do I check road tax by vehicle number?',
    a: 'Send the vehicle number to the RTO Sarthi API with your private API key. Read TAX_UPTO from the response: a date means tax is paid up to that date, and LTT means lifetime tax has been paid.',
  },
  {
    q: 'What does LTT mean in TAX_UPTO?',
    a: 'LTT means lifetime tax (one-time tax). Most private cars and two-wheelers pay road tax once at registration, so their TAX_UPTO shows LTT and never expires. Commercial vehicles usually pay tax quarterly or yearly, so they show a date.',
  },
  {
    q: 'Does the API return the tax amount or receipt?',
    a: 'The API returns the date tax is paid up to (or LTT), which is what you need to see if tax is due or overdue. It does not return the tax amount, payment receipt or penalty.',
  },
  {
    q: 'Why would I need road tax details of a vehicle?',
    a: 'To check that commercial vehicles in a fleet are not running with overdue tax, to verify a vehicle before a loan, purchase or onboarding, to remind customers before their tax is due, and to check tax before applying for a permit or transfer.',
  },
  {
    q: 'Can I get tax, fitness, insurance and PUC validity together?',
    a: 'Yes. Every successful search returns road tax, fitness, insurance and PUC validity in one response, so one API call shows every document that is due.',
  },
  {
    q: 'What does it cost?',
    a: `Pricing starts at ${LOOKUP_PRICE} per search. You buy a prepaid search limit, there is no monthly fee, and searches where the vehicle is not found are not counted.`,
  },
  {
    q: 'Can I check road tax without writing code?',
    a: `Yes. Use the vehicle number search in the RTO Sarthi app to see road tax validity with fitness, insurance and PUC, save the vehicle and get WhatsApp reminders before tax is due, at ${LOOKUP_PRICE} per search.`,
  },
  {
    q: 'Is RTO Sarthi a government API?',
    a: 'No. RTO Sarthi is an independent private software company from Raipur. It is not the Vahan or Parivahan portal and is not part of the Ministry of Road Transport and Highways or NIC.',
  },
]
