import { Link } from 'react-router-dom'
import ProductLanding from '../components/ProductLanding'
import { IconShield, IconCar, IconWallet, IconSearch, IconCode, IconMapPin, IconCheck, IconChart } from '../components/Icons'
import { makeModelApiFaqs } from '../data/makeModelApi'
import { LOOKUP_PRICE } from '../data/vehicleInfo'

const s = (t) => <strong className="text-slate-700">{t}</strong>
const linkClass = 'font-semibold text-brand-800 hover:underline'

const responseExample = `{
  "success": true,
  "vehicleNumber": "DL3CAB7788",
  "data": {
    "REGN_NO": "DL3CAB7788",
    "MAKER_DESC": "HYUNDAI MOTOR INDIA LTD",
    "MAKER_MODEL": "CRETA SX 1.5 MT",
    "VEHICLE_CLASS": "MOTOR CAR (LMV)",
    "BODY_TYPE_DESC": "SUV",
    "FUEL_DESC": "DIESEL",
    "FUEL_NORMS": "BHARAT STAGE VI",
    "COLOR": "PHANTOM BLACK",
    "CUBIC_CAPACITY": "1493",
    "SEATING_CAPACITY": "5",
    "MANU_MONTH_YR": "09/2021",
    "REGN_DT": "18-Oct-2021",
    "CHASI_NO": "MALPC81BLMM123456",
    "ENG_NO": "D4FAMM123456",
    "INSURANCE_UPTO": "17-Oct-2026"
  },
  "usage": { "limit": 3000, "used": 870, "remaining": 2130 }
}`

export default function VehicleMakeModelApi() {
  return (
    <ProductLanding
      hero={{
        title: `Vehicle Make and Model API — Find Maker, Model & Specs from a Vehicle Number at ${LOOKUP_PRICE}`,
        intro: `The RTO Sarthi vehicle make and model API turns any Indian vehicle number into its maker, model, vehicle class, body type, fuel, emission norms, CC, seating, colour and manufacturing year as JSON in seconds, from ${LOOKUP_PRICE} per successful search.`,
      }}
      buttons={[
        { label: 'Get API Key', href: '/contact' },
        { label: 'Talk to Us', href: '/contact' },
      ]}
      overview={{
        label: 'Make & model lookup',
        title: 'Know exactly which vehicle it is, from the number plate',
        description: 'Stop asking customers to pick their maker and model from a long dropdown.',
        paragraphs: [
          <>
            Insurance quotes, spare parts, tyres, service bookings and used car prices all depend on one question:
            {s(' which make and model is this vehicle?')} Customers often pick the wrong model, variant or fuel from a
            dropdown, and the quote, part or price comes out wrong.
          </>,
          <>
            With the {s('RTO Sarthi vehicle make and model API')} your software sends the vehicle number and gets
            the maker and model exactly as on the registration record, along with vehicle class, body type, fuel,
            emission norms, cubic capacity, seating, colour and manufacturing month and year. It works for
            two-wheelers, cars and commercial vehicles from {s('every state of India')}, from{' '}
            {s(`${LOOKUP_PRICE} per successful search`)}.
          </>,
          <>
            The same search also returns chassis and engine number, owner and insurance, PUC, fitness and tax
            validity. See every field on the{' '}
            <Link to="/vahan-api" className={linkClass}>Vahan API</Link> page, use cases on the{' '}
            <Link to="/api-for-vehicle-details" className={linkClass}>API for getting vehicle details</Link> page, or
            look up vehicles without code in{' '}
            <Link to="/vehicle-information-software" className={linkClass}>vehicle information software</Link>.
          </>,
          <span className="text-sm">
            RTO Sarthi is an independent private software company. It is not the Vahan or Parivahan portal and is
            not affiliated with the Ministry of Road Transport and Highways or NIC.
          </span>,
        ],
      }}
      steps={{
        title: 'How the make and model API works',
        description: 'Live in your software, usually the same day.',
        items: [
          { title: 'Get an API key', description: 'Contact us and choose your search limit. We create a private API key for your business.' },
          { title: 'Send a vehicle number', description: 'Your website, app or CRM sends the vehicle number the customer typed.' },
          { title: 'Use make, model & specs', description: 'Fill the maker, model, fuel, CC and year automatically and show the right quote, part or price.' },
        ],
      }}
      code={{
        label: 'Sample response',
        title: 'Make and model in the API response',
        description: 'MAKER_DESC is the maker and MAKER_MODEL is the model, followed by class, body, fuel, CC, seating and year.',
        blocks: [{ label: 'JSON response (make & model fields)', code: responseExample }],
        note: 'Sample data, shortened to the make and model fields. Owner, financer, PUC, fitness and tax details are also returned wherever available.',
      }}
      features={{
        label: 'Use cases',
        title: 'What businesses do with a vehicle make and model API',
        description: 'Get the vehicle right first time, from the number plate.',
        items: [
          { icon: <IconShield />, variant: 'brand', title: 'Accurate insurance quotes', description: 'Pick the correct make, model, fuel and CC for the premium, instead of trusting the customer’s dropdown choice.' },
          { icon: <IconCar />, variant: 'accent', title: 'Used car pricing & listings', description: 'Auto-fill maker, model, fuel, colour and manufacturing year to price and list a used car correctly.' },
          { icon: <IconSearch />, variant: 'success', title: 'Spare parts & tyre fitment', description: 'Show only the parts, tyres and accessories that fit the customer’s exact model and fuel type.' },
          { icon: <IconChart />, variant: 'brand', title: 'Garage & service bookings', description: 'Know the model and age of the vehicle before it arrives, and plan service, parts and labour.' },
          { icon: <IconWallet />, variant: 'accent', title: 'Vehicle loan checks', description: 'Confirm the make, model and manufacturing year match the loan application before approval.' },
          { icon: <IconCode />, variant: 'success', title: 'Fleet & app developers', description: 'Build fleet registers, EV and fuel reports or vehicle apps with clean make and model data.' },
          { icon: <IconMapPin />, variant: 'brand', title: 'All vehicle types & states', description: 'Two-wheelers, cars, autos, buses, trucks and tractors from any state or union territory.' },
          { icon: <IconCheck />, variant: 'accent', title: `From ${LOOKUP_PRICE}, pay on success`, description: 'Prepaid search limit with no monthly fee. Vehicles not found are returned to your limit.' },
        ],
      }}
      checklist={{
        id: 'pricing',
        label: 'Pricing',
        title: `Vehicle make and model API from ${LOOKUP_PRICE} per search`,
        description: 'Make, model and specification fields in every successful search.',
        price: {
          caption: 'Starting at',
          amount: LOOKUP_PRICE,
          text: 'per successful search · no monthly fee',
        },
        listTitle: 'Make & model details returned',
        items: [
          'Maker / manufacturer', 'Model (often with variant)', 'Vehicle class', 'Body type',
          'Fuel type', 'Emission norms (BS IV / BS VI)', 'Cubic capacity (CC)', 'Seating capacity',
          'Colour', 'Manufacturing month & year', 'Registration date', 'Chassis & engine number',
        ],
        note: 'Details are returned exactly as on the vehicle record, wherever available.',
      }}
      audiences={{
        title: 'Who needs a vehicle make and model API?',
        description: 'Any business that needs to know the exact vehicle.',
        items: [
          'Motor insurance platforms & agents', 'Used car marketplaces & dealers', 'Spare parts, tyre & accessory sellers',
          'Garages & service centres', 'Vehicle loan & NBFC companies', 'Fleet operators & app developers',
        ],
      }}
      related={[
        { to: '/api-for-vehicle-details', label: 'API for getting vehicle details' },
        { to: '/vehicle-information-api', label: 'Vehicle information API' },
        { to: '/vahan-api', label: 'Vahan API' },
      ]}
      faq={{
        title: 'Vehicle make and model API — FAQ',
        description: 'Make, model, variant, price and coverage.',
        items: makeModelApiFaqs,
      }}
      cta={{
        title: `Get make and model from any vehicle number at ${LOOKUP_PRICE}`,
        text: 'Contact RTO Sarthi on call or WhatsApp for your API key and fill maker, model and specs automatically in your software.',
      }}
    />
  )
}
