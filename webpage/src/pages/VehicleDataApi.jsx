import { Link } from 'react-router-dom'
import ProductLanding from '../components/ProductLanding'
import { IconCode, IconChart, IconShield, IconWallet, IconCar, IconClock, IconMapPin, IconCheck } from '../components/Icons'
import { vehicleDataApiFaqs } from '../data/vehicleDataApi'
import { LOOKUP_PRICE } from '../data/vehicleInfo'

const s = (t) => <strong className="text-slate-700">{t}</strong>
const linkClass = 'font-semibold text-brand-800 hover:underline'

const responseExample = `{
  "success": true,
  "message": "Vehicle details fetched successfully",
  "vehicleNumber": "KA03MN7788",
  "data": {
    "REGN_NO": "KA03MN7788",
    "STATUS": "ACTIVE",
    "REGISTERED_AT": "BANGALORE (EAST) RTO, KARNATAKA",
    "REGN_DT": "09-Nov-2022",
    "OWNER_NAME": "ANITHA R",
    "OWNER_SERIAL_NO": "1",
    "MAKER_DESC": "HYUNDAI MOTOR INDIA LTD",
    "MAKER_MODEL": "CRETA SX 1.5",
    "VEHICLE_CLASS": "MOTOR CAR (LMV)",
    "BODY_TYPE": "SALOON",
    "FUEL_DESC": "DIESEL",
    "NORMS_DESC": "BHARAT STAGE VI",
    "CUBIC_CAP": "1493",
    "SEAT_CAP": "5",
    "COLOR": "TITAN GREY",
    "MANU_MONTH_YR": "10/2022",
    "CHASI_NO": "MALPC81BLNM123456",
    "ENG_NO": "D4FAN1234567",
    "FINANCER_DETAILS": "ICICI BANK LTD",
    "INSURANCE_COMP": "TATA AIG GENERAL INSURANCE CO. LTD.",
    "INSURANCE_UPTO": "08-Nov-2026",
    "PUCC_UPTO": "08-Nov-2026",
    "TAX_UPTO": "LTT",
    "BLACKLIST_STATUS": "NA",
    "NOC_DETAILS": "NA"
  },
  "usage": { "limit": 10000, "used": 3120, "remaining": 6880 }
}`

export default function VehicleDataApi() {
  return (
    <ProductLanding
      hero={{
        title: `Vehicle Data API India — Complete Vehicle Data by Number as JSON from ${LOOKUP_PRICE}`,
        intro: `The RTO Sarthi vehicle data API returns the complete registration data of any Indian vehicle number as clean JSON: registration, owner, maker and model, specifications, chassis and engine, insurance, PUC, fitness, tax, financer, blacklist and NOC, from ${LOOKUP_PRICE} per successful search.`,
      }}
      buttons={[
        { label: 'Get API Key', href: '/contact' },
        { label: 'Talk to Us', href: '/contact' },
      ]}
      overview={{
        label: 'Vehicle data by API',
        title: 'All the data on a vehicle, from just its number',
        description: 'One request, 25+ fields, ready for your database.',
        paragraphs: [
          <>
            Insurance, lending, used car, fleet and mobility businesses all need reliable vehicle data. Typing it in
            from RC copies is slow and full of mistakes, and the copy is often out of date.
          </>,
          <>
            The {s('RTO Sarthi vehicle data API for India')} returns the vehicle record as structured JSON from the
            vehicle number: {s('registration, owner, specifications, chassis and engine, validity dates and status')}.
            Save it straight to your database, auto-fill forms or run checks in your backend. It covers{' '}
            {s('every state of India, including BH series')}, and starts at {s(`${LOOKUP_PRICE} per successful search`)}.
          </>,
          <>
            Need only some of the data? See the{' '}
            <Link to="/vehicle-make-and-model-api" className={linkClass}>make and model API</Link>,{' '}
            <Link to="/vehicle-insurance-api" className={linkClass}>vehicle insurance API</Link> or{' '}
            <Link to="/vehicle-rc-verification-api" className={linkClass}>RC verification API</Link>. Not a developer? Use{' '}
            <Link to="/vehicle-information-software" className={linkClass}>vehicle information software</Link> in the app.
          </>,
          <span className="text-sm">
            RTO Sarthi is an independent private software company. It is not the Vahan or Parivahan portal and is
            not affiliated with the Ministry of Road Transport and Highways or NIC.
          </span>,
        ],
      }}
      steps={{
        title: 'How the vehicle data API works',
        description: 'Live in your software, usually the same day.',
        items: [
          { title: 'Get an API key', description: 'Contact us and choose your search limit. We create a private API key for your business.' },
          { title: 'Send the vehicle number', description: 'Your app, website or backend sends any Indian registration number.' },
          { title: 'Use the JSON data', description: 'Save the vehicle data to your database, auto-fill forms or run your own checks.' },
        ],
      }}
      code={{
        label: 'Sample response',
        title: 'Vehicle data in the API response',
        description: 'One JSON object per vehicle, with usage and remaining searches in every response.',
        blocks: [{ label: 'JSON response', code: responseExample }],
        note: 'Sample data. Fields are returned wherever they are available on the vehicle record.',
      }}
      features={{
        label: 'Use cases',
        title: 'What you can build with vehicle data',
        description: 'Vehicle data for every kind of business in India.',
        items: [
          { icon: <IconShield />, variant: 'brand', title: 'Motor insurance', description: 'Auto-fill quotes with model, fuel, CC and registration date, and see the previous insurer.' },
          { icon: <IconWallet />, variant: 'accent', title: 'Vehicle loans & NBFCs', description: 'Check owner, financer, chassis and engine before you lend against a vehicle.' },
          { icon: <IconCar />, variant: 'success', title: 'Used car platforms', description: 'Fill listings automatically and show buyers verified vehicle data.' },
          { icon: <IconChart />, variant: 'brand', title: 'Fleet & logistics', description: 'Keep every vehicle’s data and validity dates up to date across your fleet.' },
          { icon: <IconClock />, variant: 'accent', title: 'Renewal & reminder apps', description: 'Use insurance, PUC, fitness and tax dates to plan renewals and send reminders.' },
          { icon: <IconCode />, variant: 'success', title: 'Developers & startups', description: 'Simple REST API with JSON, an integration guide and help on WhatsApp.' },
          { icon: <IconMapPin />, variant: 'brand', title: 'All India coverage', description: 'Any state or union territory, two-wheelers to trucks, including BH series.' },
          { icon: <IconCheck />, variant: 'accent', title: `From ${LOOKUP_PRICE}, pay on success`, description: 'Prepaid limit with no monthly fee. Vehicles not found are returned to your limit.' },
        ],
      }}
      checklist={{
        id: 'pricing',
        label: 'Pricing',
        title: `Vehicle data API from ${LOOKUP_PRICE} per search`,
        description: 'Full vehicle data in every successful search.',
        price: {
          caption: 'Starting at',
          amount: LOOKUP_PRICE,
          text: 'per successful search · no monthly fee',
        },
        listTitle: 'Vehicle data returned',
        items: [
          'Registration status & RTO', 'Registration date & validity', 'Owner name & serial number', 'Maker & model',
          'Class, body type & fuel', 'Emission norms, CC & seating', 'Colour & manufacturing date', 'Chassis & engine number',
          'Insurance company & validity', 'PUC, fitness & tax validity', 'Financer (hypothecation)', 'Blacklist & NOC status',
        ],
        note: 'Details are returned wherever they are available on the vehicle record.',
      }}
      audiences={{
        title: 'Who uses a vehicle data API in India?',
        description: 'Any business that works with vehicle numbers.',
        items: [
          'Insurance companies & brokers', 'Vehicle loan & NBFC companies', 'Used car dealers & marketplaces',
          'Fleet, cab & logistics operators', 'Automotive & mobility startups', 'Software & app developers',
        ],
      }}
      related={[
        { to: '/vehicle-details-api', label: 'Vehicle details API India' },
        { to: '/vahan-api', label: 'Vahan API' },
        { to: '/vehicle-lookup-api', label: 'Vehicle lookup API' },
      ]}
      faq={{
        title: 'Vehicle data API India — FAQ',
        description: 'Data fields, coverage, price and integration.',
        items: vehicleDataApiFaqs,
      }}
      cta={{
        title: `Get vehicle data by API from ${LOOKUP_PRICE}`,
        text: 'Contact RTO Sarthi on call or WhatsApp for your API key and get complete data for any Indian vehicle number in seconds.',
      }}
    />
  )
}
