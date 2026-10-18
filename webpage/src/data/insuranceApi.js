import { LOOKUP_PRICE } from './vehicleInfo'

export const INSURANCE_API_PATH = '/vehicle-insurance-api'

export const insuranceApiFaqs = [
  {
    q: 'What is a vehicle insurance API?',
    a: `A vehicle insurance API lets your software check a vehicle’s current insurance from its vehicle number. The RTO Sarthi API returns the insurance company, policy number and insurance valid-up-to date as JSON, along with maker, model, fuel, registration and PUC, fitness and tax details, from ${LOOKUP_PRICE} per successful search.`,
  },
  {
    q: 'How do I check vehicle insurance status by vehicle number through an API?',
    a: 'Send the vehicle number to the RTO Sarthi API and read INSURANCE_COMP (insurer), INS_POLICY_NO (policy number) and INSURANCE_UPTO (valid up to) in the response. Compare the date with today to know if the insurance is active, expiring soon or expired.',
  },
  {
    q: 'Can I get the insurance expiry date of any vehicle?',
    a: 'Yes, wherever the insurance details are available on the vehicle’s registration record. The API returns the date up to which the current policy is valid, for vehicles from every state of India.',
  },
  {
    q: 'Does the API give insurance premium quotes or issue policies?',
    a: 'No. The API returns the vehicle’s existing insurance details from its registration record. It does not calculate premiums or sell policies. Insurance platforms use the vehicle details it returns, such as maker, model, fuel, CC and registration date, to prepare their own quotes faster.',
  },
  {
    q: 'How do insurance agents use a vehicle insurance API?',
    a: 'Agents and POSPs check when a customer’s policy expires and who the current insurer is, then contact them before renewal. Insurance platforms auto-fill the vehicle details for a quote from just the vehicle number.',
  },
  {
    q: 'What does the vehicle insurance API cost?',
    a: `Pricing starts at ${LOOKUP_PRICE} per search. You buy a prepaid search limit, there is no monthly fee, and searches where the vehicle is not found are not counted.`,
  },
  {
    q: 'Can I check insurance for a whole fleet?',
    a: 'Yes. Your software can send each vehicle number in turn and flag every vehicle whose insurance has expired or will expire soon. Each successful search is counted from your limit and every response shows your remaining searches.',
  },
  {
    q: 'I am an RTO or insurance agent without software. What can I use?',
    a: `Use RTO Sarthi itself. Search any vehicle number at ${LOOKUP_PRICE} to see insurance validity, save the vehicle, and RTO Sarthi sends the owner an automatic WhatsApp reminder before the insurance expires.`,
  },
  {
    q: 'Is RTO Sarthi a government or insurance company API?',
    a: 'No. RTO Sarthi is an independent private software company from Raipur. It is not the Vahan or Parivahan portal, not part of the Ministry of Road Transport and Highways or NIC, and not an insurance company.',
  },
  {
    q: 'How do I get an API key?',
    a: 'Contact RTO Sarthi on call or WhatsApp. We create your private API key with the search limit you need and help your developer test it, usually the same day.',
  },
]
