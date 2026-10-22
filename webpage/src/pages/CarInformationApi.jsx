import { Link } from 'react-router-dom'
import ProductLanding from '../components/ProductLanding'
import { IconCar, IconShield, IconWallet, IconClock, IconCode, IconChart, IconMapPin, IconCheck } from '../components/Icons'
import { carInformationApiFaqs } from '../data/carInformationApi'
import { LOOKUP_PRICE } from '../data/vehicleInfo'

const s = (t) => <strong className="text-slate-700">{t}</strong>
const linkClass = 'font-semibold text-brand-800 hover:underline'

const responseExample = `{
  "success": true,
  "message": "Vehicle details fetched successfully",
  "vehicleNumber": "RJ14CX5532",
  "data": {
    "REGN_NO": "RJ14CX5532",
    "STATUS": "ACTIVE",
    "REGISTERED_AT": "JAIPUR RTO, RAJASTHAN",
    "REGN_DT": "27-Feb-2019",
    "REGN_UPTO": "26-Feb-2034",
    "OWNER_NAME": "VIKRAM SINGH",
    "OWNER_SERIAL_NO": "2",
    "MAKER_DESC": "MAHINDRA & MAHINDRA LTD",
    "MAKER_MODEL": "XUV500 W7",
    "CHASI_NO": "MA1TA2YAXK2B12345",
    "ENG_NO": "YAK4B12345",
    "INSURANCE_COMP": "HDFC ERGO GENERAL INSURANCE CO. LTD.",
    "INSURANCE_UPTO": "26-Feb-2027",
    "PUCC_UPTO": "10-Mar-2027",
    "TAX_UPTO": "LTT",
    "FINANCER_DETAILS": "AU SMALL FINANCE BANK LTD",
    "BLACKLIST_STATUS": "NA",
    "NOC_DETAILS": "NA"
  },
  "usage": { "limit": 3000, "used": 1204, "remaining": 1796 }
}`

export default function CarInformationApi() {
  return (
    <ProductLanding
      hero={{
        title: `Car Information API — Car Info API for Any Indian Car Number from ${LOOKUP_PRICE}`,
        intro: `The RTO Sarthi car information API (car info API) takes any Indian car number and returns the car’s full record as JSON: registration status and validity, owner count, model, chassis and engine number, insurance, PUC, fitness and tax validity, financer, blacklist and NOC, from ${LOOKUP_PRICE} per successful search.`,
      }}
      buttons={[
        { label: 'Get API Key', href: '/contact' },
        { label: 'Talk to Us', href: '/contact' },
      ]}
      overview={{
        label: 'Car info by API',
        title: 'The full story of a car, from its number',
        description: 'Registration, owners, validity, finance and status in one request.',
        paragraphs: [
          <>
            Before you buy, sell, insure, finance or rent a car, you need more than its model name. You need to know
            {s(' how many owners it has had, whether its papers are valid, and whether it is still under a loan or blacklisted.')}
          </>,
          <>
            The {s('RTO Sarthi car information API')}, also called a {s('car info API')}, gives you that full record
            from the car number: registration date, validity and RTO, owner count, chassis and engine, insurance, PUC,
            fitness and tax validity, financer, blacklist and NOC. It covers cars from {s('every state of India')} and
            starts at {s(`${LOOKUP_PRICE} per successful search`)}.
          </>,
          <>
            Need the model, variant and specifications for a form or listing? See the{' '}
            <Link to="/car-details-api" className={linkClass}>car details API</Link>. Not a developer? Check any car in
            the app with{' '}
            <Link to="/vehicle-information-software" className={linkClass}>vehicle information software</Link>.
          </>,
          <span className="text-sm">
            RTO Sarthi is an independent private software company. It is not the Vahan or Parivahan portal and is
            not affiliated with the Ministry of Road Transport and Highways or NIC.
          </span>,
        ],
      }}
      steps={{
        title: 'How the car info API works',
        description: 'Live in your software, usually the same day.',
        items: [
          { title: 'Get an API key', description: 'Contact us and choose your search limit. We create a private API key for your business.' },
          { title: 'Send the car number', description: 'Your website, app or backend sends any Indian car registration number.' },
          { title: 'Get the car information', description: 'Use owners, validity dates, finance and status to decide, list or price the car.' },
        ],
      }}
      code={{
        label: 'Sample response',
        title: 'Car information in the API response',
        description: 'OWNER_SERIAL_NO is the owner count, *_UPTO fields are validity dates and FINANCER_DETAILS shows an active loan.',
        blocks: [{ label: 'JSON response (car information)', code: responseExample }],
        note: 'Sample data, shortened. Details are returned wherever they are available on the vehicle record.',
      }}
      features={{
        label: 'Use cases',
        title: 'What you can do with a car information API',
        description: 'Car info from the number plate, for every kind of car business.',
        items: [
          { icon: <IconCar />, variant: 'brand', title: 'Used car checks', description: 'See owner count, finance, blacklist and NOC before you buy, sell or list a car.' },
          { icon: <IconWallet />, variant: 'accent', title: 'Car loans & refinance', description: 'Check the registered owner and any existing financer before you lend against a car.' },
          { icon: <IconShield />, variant: 'success', title: 'Car insurance', description: 'Confirm the car is registered and active and see the current insurer and expiry.' },
          { icon: <IconClock />, variant: 'brand', title: 'Renewal reminders', description: 'Use insurance, PUC and tax dates to remind customers before their papers expire.' },
          { icon: <IconChart />, variant: 'accent', title: 'Car rental & fleets', description: 'Keep every car’s registration and validity dates up to date across your fleet.' },
          { icon: <IconCode />, variant: 'success', title: 'Car apps & startups', description: 'Add a car info lookup to your app with a simple JSON API and help on WhatsApp.' },
          { icon: <IconMapPin />, variant: 'brand', title: 'All states of India', description: 'Cars registered in any state or union territory, including BH series.' },
          { icon: <IconCheck />, variant: 'accent', title: `From ${LOOKUP_PRICE}, pay on success`, description: 'Prepaid limit with no monthly fee. Cars not found are returned to your limit.' },
        ],
      }}
      checklist={{
        id: 'pricing',
        label: 'Pricing',
        title: `Car information API from ${LOOKUP_PRICE} per search`,
        description: 'The full car record in every successful search.',
        price: {
          caption: 'Starting at',
          amount: LOOKUP_PRICE,
          text: 'per successful search · no monthly fee',
        },
        listTitle: 'Car information returned',
        items: [
          'Registration date & status', 'Registration validity', 'Registering RTO', 'Owner name & owner count',
          'Maker & model', 'Chassis & engine number', 'Insurance company & validity', 'PUC validity',
          'Fitness validity', 'Road tax validity', 'Financer (hypothecation)', 'Blacklist & NOC status',
        ],
        note: 'Details are returned wherever they are available on the vehicle record.',
      }}
      audiences={{
        title: 'Who uses a car info API?',
        description: 'Anyone who needs to know a car’s full record.',
        items: [
          'Used car dealers & marketplaces', 'Car loan & NBFC companies', 'Car insurance platforms & brokers',
          'Car rental & subscription companies', 'RTO agents & car consultants', 'Automotive app developers',
        ],
      }}
      related={[
        { to: '/car-details-api', label: 'Car details API' },
        { to: '/vehicle-verification-api', label: 'Vehicle verification API' },
        { to: '/vehicle-information-api', label: 'Vehicle information API' },
      ]}
      faq={{
        title: 'Car information API — FAQ',
        description: 'Car info, owners, finance, price and coverage.',
        items: carInformationApiFaqs,
      }}
      cta={{
        title: `Get car information by API from ${LOOKUP_PRICE}`,
        text: 'Contact RTO Sarthi on call or WhatsApp for your API key and get the full record of any car number in seconds.',
      }}
    />
  )
}
