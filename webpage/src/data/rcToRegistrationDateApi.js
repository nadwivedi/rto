import { LOOKUP_PRICE } from './vehicleInfo'

export const RC_TO_REGISTRATION_DATE_API_PATH = '/rc-to-registration-date-api'

export const rcToRegistrationDateApiFaqs = [
  {
    q: 'What is an RC to registration date API?',
    a: `An RC to registration date API takes a vehicle’s RC (registration) number and returns the date it was first registered at the RTO. The RTO Sarthi API returns the registration date with the registration validity, manufacturing month and year, registering RTO and status as JSON, from ${LOOKUP_PRICE} per successful search.`,
  },
  {
    q: 'How do I get the registration date from a vehicle number?',
    a: 'Send the vehicle number to the RTO Sarthi API with your private API key. The response includes REGN_DT (registration date) and REGN_UPTO (registration valid up to), wherever they are available on the vehicle record.',
  },
  {
    q: 'What is the difference between registration date and manufacturing date?',
    a: 'The manufacturing date (MANU_MONTH_YR) is when the vehicle was built. The registration date (REGN_DT) is when it was first registered at an RTO, usually a few days or weeks after purchase. Both are returned in the same response.',
  },
  {
    q: 'How can I find the age of a vehicle from its RC number?',
    a: 'Use REGN_DT from the response. The time from the registration date to today is the vehicle’s age on the road, which is what insurers, lenders and buyers usually mean by vehicle age.',
  },
  {
    q: 'What is REGN_UPTO?',
    a: 'REGN_UPTO is the date the registration is valid up to. Private vehicles are registered for 15 years and can be renewed after that. For transport vehicles, validity is linked to the fitness certificate.',
  },
  {
    q: 'Why would I need the registration date of a vehicle?',
    a: 'To find the vehicle’s age for insurance premium and IDV, loan eligibility and used vehicle pricing, to check if the vehicle is close to the end of its 15-year registration, and to apply age limits such as end-of-life vehicle rules.',
  },
  {
    q: 'What does it cost?',
    a: `Pricing starts at ${LOOKUP_PRICE} per search. You buy a prepaid search limit, there is no monthly fee, and searches where the vehicle is not found are not counted.`,
  },
  {
    q: 'Can I see the registration date without writing code?',
    a: `Yes. Use the vehicle number search in the RTO Sarthi app to see the registration date and download the RC PDF, at ${LOOKUP_PRICE} per search.`,
  },
  {
    q: 'Is RTO Sarthi a government API?',
    a: 'No. RTO Sarthi is an independent private software company from Raipur. It is not the Vahan or Parivahan portal and is not part of the Ministry of Road Transport and Highways or NIC.',
  },
]
