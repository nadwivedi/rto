import { LOOKUP_PRICE } from './vehicleInfo'

export const PUC_DETAILS_API_PATH = '/vehicle-puc-details-api'

export const pucDetailsApiFaqs = [
  {
    q: 'What is a vehicle PUC details API?',
    a: `A vehicle PUC details API gives your software the PUC (Pollution Under Control) certificate details of a vehicle from its number. The RTO Sarthi API returns the PUC certificate number and PUC valid-up-to date as JSON, with maker, model, fuel, emission norms and insurance, fitness and tax validity, from ${LOOKUP_PRICE} per successful search.`,
  },
  {
    q: 'What is an RC to PUC details API?',
    a: 'It is the same thing: you send the RC (registration) number and get the PUC details back. With RTO Sarthi, one request with the vehicle number returns the PUC certificate number and validity from the registration record.',
  },
  {
    q: 'How do I check PUC validity by vehicle number?',
    a: 'Send the vehicle number to the RTO Sarthi API with your private API key. The response includes PUCC_NO (PUC certificate number) and PUCC_UPTO (PUC valid up to), wherever they are available on the vehicle record. Compare PUCC_UPTO with today’s date to see if the PUC is valid, expiring or expired.',
  },
  {
    q: 'Why does PUC validity matter?',
    a: 'Driving without a valid PUC certificate can lead to a fine, and a valid PUC is generally needed when renewing motor insurance. Checking PUC validity lets you remind the owner before it expires.',
  },
  {
    q: 'Can I check PUC for many vehicles at once?',
    a: 'Yes. Your software can send vehicle numbers one after another, for example to check a whole fleet or a customer list. Every response shows your remaining searches.',
  },
  {
    q: 'Which vehicles are covered?',
    a: 'Two-wheelers, cars, autos, buses, trucks and other registered vehicles from every state and union territory of India, including BH series. PUC details are returned wherever they are recorded for the vehicle.',
  },
  {
    q: 'What does the PUC details API cost?',
    a: `Pricing starts at ${LOOKUP_PRICE} per search. You buy a prepaid search limit, there is no monthly fee, and searches where the vehicle is not found are not counted.`,
  },
  {
    q: 'I run a PUC centre. Is there software for me?',
    a: 'Yes. RTO Sarthi PUC agent software lets PUC centres upload PUC records in bulk from Excel and send automatic WhatsApp reminders to customers before their PUC expires, without writing code.',
  },
  {
    q: 'Is RTO Sarthi a government API?',
    a: 'No. RTO Sarthi is an independent private software company from Raipur. It does not issue PUC certificates, is not the Vahan or Parivahan portal and is not part of the Ministry of Road Transport and Highways or NIC.',
  },
]
