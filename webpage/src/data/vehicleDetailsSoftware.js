import { LOOKUP_PRICE } from './vehicleInfo'

export const VEHICLE_DETAILS_SOFTWARE_PATH = '/vehicle-details-software'

export const vehicleDetailsSoftwareFaqs = [
  {
    q: 'What is vehicle details software?',
    a: `Vehicle details software lets you type any vehicle number and see its registration details on screen, without writing code. In RTO Sarthi you get owner, maker and model, chassis and engine number, registration, insurance, PUC, fitness and tax validity, financer, blacklist and NOC details, from ${LOOKUP_PRICE} per search.`,
  },
  {
    q: 'What can I do after I search a vehicle?',
    a: 'Download the RC PDF and the Vehicle Particulars PDF, print Form 23, Temporary RC and NL Particulars filled with the vehicle details, and keep every search in your search history so you can open it again later.',
  },
  {
    q: 'Can I save a searched vehicle into my records?',
    a: 'Yes. With Save, the searched vehicle is added to your Vehicle Registration, Fitness, Insurance and PUC records in RTO Sarthi using the dates from the RC, so you do not type them again. Save is switched on for your account on request.',
  },
  {
    q: 'Will I get reminders for saved vehicles?',
    a: 'Yes. Once a vehicle is in your records, RTO Sarthi tracks its expiry dates and can send automatic WhatsApp reminders to your client before insurance, PUC, fitness or tax expires.',
  },
  {
    q: 'Does the search history show expiring documents?',
    a: 'Yes. Each vehicle in your search history shows insurance, fitness and PUC validity, in red when expired and amber when due within 30 days, so you can spot renewal work at a glance.',
  },
  {
    q: 'Do I need to install anything?',
    a: 'No. RTO Sarthi works in the browser on PC and as an app on Android and iPhone. Your search history and records stay in your account on every device.',
  },
  {
    q: 'What does a vehicle search cost?',
    a: `Each successful search starts at ${LOOKUP_PRICE}. There is a free trial of the software, and searches where the vehicle is not found are not counted.`,
  },
  {
    q: 'I want the vehicle details in my own software. Is there an API?',
    a: 'Yes. Developers can get the same details as JSON with the RTO Sarthi vehicle details API.',
  },
  {
    q: 'Is RTO Sarthi a government website?',
    a: 'No. RTO Sarthi is an independent private software company from Raipur. It is not the Vahan or Parivahan portal and is not part of the Ministry of Road Transport and Highways or NIC.',
  },
]
