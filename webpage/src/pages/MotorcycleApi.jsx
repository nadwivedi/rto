import { Link } from 'react-router-dom'
import ProductLanding from '../components/ProductLanding'
import { IconCar, IconShield, IconWallet, IconClock, IconCode, IconChart, IconMapPin, IconCheck } from '../components/Icons'
import { motorcycleApiFaqs } from '../data/motorcycleApi'
import { LOOKUP_PRICE } from '../data/vehicleInfo'

const s = (t) => <strong className="text-slate-700">{t}</strong>
const linkClass = 'font-semibold text-brand-800 hover:underline'

const responseExample = `{
  "success": true,
  "message": "Vehicle details fetched successfully",
  "vehicleNumber": "UP16DK4512",
  "data": {
    "REGN_NO": "UP16DK4512",
    "REGN_DT": "09-Mar-2023",
    "OWNER_NAME": "AMIT YADAV",
    "OWNER_SERIAL_NO": 1,
    "REGISTERED_AT": "Noida RTO, Uttar Pradesh",
    "MAKER_DESC": "HERO MOTOCORP LTD",
    "MAKER_MODEL": "SPLENDOR PLUS",
    "VEHICLE_CLASS": "M-Cycle/Scooter(2WN)",
    "BODY_TYPE_DESC": "SOLO WITH PILLION (MOTORCYCLE)",
    "FUEL_DESC": "PETROL(E20)",
    "FUEL_NORMS": "BHARAT STAGE VI",
    "CUBIC_CAPACITY": "97.20",
    "MANU_MONTH_YR": "2/2023",
    "CHASI_NO": "MBLHAW236P9A12345",
    "ENG_NO": "HA11EVP9A54321",
    "INSURANCE_COMP": "ACKO GENERAL INSURANCE LIMITED",
    "INSURANCE_UPTO": "08-Mar-2028",
    "PUCC_UPTO": "14-Apr-2027",
    "FINANCER_DETAILS": "HERO FINCORP LTD",
    "BLACKLIST_STATUS": "NA"
  },
  "source": "rtosarthi_api1",
  "usage": { "limit": 5000, "used": 1630, "remaining": 3370 }
}`

export default function MotorcycleApi() {
  return (
    <ProductLanding
      hero={{
        title: `Motorcycle API in India — Bike Details by Number: Model, CC, Owner & Insurance from ${LOOKUP_PRICE}`,
        intro: `The RTO Sarthi motorcycle API takes any Indian bike or scooter number and returns the maker, model, engine CC, fuel, emission norms, manufacturing date, owner count, chassis and engine number, insurance and PUC validity, financer and blacklist as JSON in seconds, from ${LOOKUP_PRICE} per successful search.`,
      }}
      buttons={[
        { label: 'Get API Key', href: '/contact' },
        { label: 'Talk to Us', href: '/contact' },
      ]}
      overview={{
        label: 'Motorcycle API',
        title: 'Every bike and scooter in India, from its number plate',
        description: 'Two-wheelers are most of India’s vehicles. Get their details in one request.',
        paragraphs: [
          <>
            Most vehicles on Indian roads are {s('two-wheelers')}: motorcycles, scooters and, more and more,
            electric scooters. Bike insurance platforms, used bike marketplaces, two-wheeler lenders and service
            apps all need the same details, and customers rarely know their exact model or engine CC.
          </>,
          <>
            The {s('RTO Sarthi motorcycle API')} gives your software those details from the registration number:
            {s(' maker, model, engine CC, fuel and BS norms, manufacturing date, owner count, chassis and engine number')},
            plus insurance, PUC, financer and blacklist. It covers bikes from {s('every state of India, including BH series')},
            and starts at {s(`${LOOKUP_PRICE} per successful search`)}.
          </>,
          <>
            Building for cars too? See the{' '}
            <Link to="/car-details-api" className={linkClass}>car details API</Link>. For every vehicle type and every
            field, see the{' '}
            <Link to="/vehicle-details-api" className={linkClass}>vehicle details API</Link>.
          </>,
          <span className="text-sm">
            RTO Sarthi is an independent private software company. It is not the Vahan or Parivahan portal and is
            not affiliated with the Ministry of Road Transport and Highways or NIC.
          </span>,
        ],
      }}
      steps={{
        title: 'How the motorcycle API works',
        description: 'Live in your website or app, usually the same day.',
        items: [
          { title: 'Get an API key', description: 'Contact us and choose your search limit. We create a private API key for your business.' },
          { title: 'Send the bike number', description: 'Your user types their bike or scooter number instead of picking make, model and CC.' },
          { title: 'Auto-fill bike details', description: 'Fill your quote, listing or service booking with model, CC, fuel, year and insurance.' },
        ],
      }}
      code={{
        label: 'Sample response',
        title: 'Motorcycle details in the API response',
        description: 'MAKER_MODEL is the model, CUBIC_CAPACITY the engine CC, MANU_MONTH_YR the manufacturing month and OWNER_SERIAL_NO the owner count.',
        blocks: [{ label: 'JSON response (two-wheeler fields)', code: responseExample }],
        note: 'Sample data, shortened. Details are returned wherever they are available on the vehicle record; a field with no value is "NA".',
      }}
      features={{
        label: 'Use cases',
        title: 'What you can build with a motorcycle API',
        description: 'Bike details from the number plate, for every two-wheeler business.',
        items: [
          { icon: <IconShield />, variant: 'brand', title: 'Bike insurance quotes', description: 'Get model, CC and registration date for the quote, and see the current insurer and expiry.' },
          { icon: <IconCar />, variant: 'accent', title: 'Used bike marketplaces', description: 'Fill a listing from the number: model, CC, fuel, year and number of owners.' },
          { icon: <IconWallet />, variant: 'success', title: 'Two-wheeler loans', description: 'Check owner, existing financer and blacklist before you lend against a bike.' },
          { icon: <IconClock />, variant: 'brand', title: 'Service & spare parts', description: 'Show the right service plan and parts for the exact model, CC and fuel.' },
          { icon: <IconChart />, variant: 'accent', title: 'Rental & delivery fleets', description: 'Verify every bike in your rental or delivery fleet and track insurance and PUC.' },
          { icon: <IconCode />, variant: 'success', title: 'EV & mobility apps', description: 'Identify petrol and electric two-wheelers with a simple JSON API.' },
          { icon: <IconMapPin />, variant: 'brand', title: 'All states of India', description: 'Bikes and scooters registered in any state or union territory, including BH series.' },
          { icon: <IconCheck />, variant: 'accent', title: `From ${LOOKUP_PRICE}, pay on success`, description: 'Prepaid limit with no monthly fee. Vehicles not found are returned to your limit.' },
        ],
      }}
      checklist={{
        id: 'pricing',
        label: 'Pricing',
        title: `Motorcycle API from ${LOOKUP_PRICE} per search`,
        description: 'Full two-wheeler details in every successful search.',
        price: {
          caption: 'Starting at',
          amount: LOOKUP_PRICE,
          text: 'per successful search · no monthly fee',
        },
        listTitle: 'Bike details returned',
        items: [
          'Maker', 'Model', 'Engine CC', 'Fuel & BS norms',
          'Body type & class', 'Manufacturing month & year', 'Registration date & RTO', 'Owner name & owner count',
          'Chassis & engine number', 'Insurance company & validity', 'PUC validity', 'Financer & blacklist',
        ],
        note: 'Details are returned wherever they are available on the vehicle record.',
      }}
      audiences={{
        title: 'Who uses a motorcycle API in India?',
        description: 'Any business that works with bikes and scooters.',
        items: [
          'Two-wheeler insurance platforms & agents', 'Used bike dealers & marketplaces', 'Two-wheeler loan & NBFC companies',
          'Bike service centres & parts sellers', 'Bike rental & delivery fleets', 'EV & mobility app developers',
        ],
      }}
      related={[
        { to: '/car-details-api', label: 'Car details API' },
        { to: '/vehicle-make-and-model-api', label: 'Vehicle make and model API' },
        { to: '/vehicle-insurance-api', label: 'Vehicle insurance API' },
      ]}
      faq={{
        title: 'Motorcycle API India — FAQ',
        description: 'Bikes, scooters, EVs, price and integration.',
        items: motorcycleApiFaqs,
      }}
      cta={{
        title: `Get motorcycle details by API from ${LOOKUP_PRICE}`,
        text: 'Contact RTO Sarthi on call or WhatsApp for your API key and get model, CC, owner and insurance for any bike number in India.',
      }}
    />
  )
}
