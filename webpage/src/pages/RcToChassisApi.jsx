import { Link } from 'react-router-dom'
import ProductLanding from '../components/ProductLanding'
import { IconShield, IconCheck, IconWallet, IconCar, IconCode, IconMapPin, IconDocument, IconSearch } from '../components/Icons'
import { rcToChassisApiFaqs } from '../data/rcToChassisApi'
import { LOOKUP_PRICE } from '../data/vehicleInfo'

const s = (t) => <strong className="text-slate-700">{t}</strong>
const linkClass = 'font-semibold text-brand-800 hover:underline'

const responseExample = `{
  "success": true,
  "message": "Vehicle details fetched successfully",
  "vehicleNumber": "GJ05KP1928",
  "data": {
    "REGN_NO": "GJ05KP1928",
    "STATUS": "ACTIVE",
    "CHASI_NO": "MALB341CLMM654321",
    "ENG_NO": "G4LAMM654321",
    "MAKER_DESC": "HYUNDAI MOTOR INDIA LTD",
    "MAKER_MODEL": "I20 ASTA 1.2",
    "VEHICLE_CLASS": "MOTOR CAR (LMV)",
    "FUEL_DESC": "PETROL",
    "MANU_MONTH_YR": "11/2021",
    "REGN_DT": "06-Dec-2021"
  },
  "usage": { "limit": 2000, "used": 518, "remaining": 1482 }
}`

export default function RcToChassisApi() {
  return (
    <ProductLanding
      hero={{
        title: `RC to Chassis Number API — Get Chassis & Engine Number by Vehicle Number from ${LOOKUP_PRICE}`,
        intro: `The RTO Sarthi RC to chassis number API takes any Indian vehicle (RC) number and returns the chassis number and engine number on its registration record as JSON, with maker, model, manufacturing date and registration status, from ${LOOKUP_PRICE} per successful search.`,
      }}
      buttons={[
        { label: 'Get API Key', href: '/contact' },
        { label: 'Talk to Us', href: '/contact' },
      ]}
      overview={{
        label: 'Chassis number by API',
        title: 'The chassis number of any vehicle, from its RC number',
        description: 'Chassis and engine number in seconds, ready to match.',
        paragraphs: [
          <>
            The {s('chassis number')} (the vehicle’s VIN) is what really identifies a vehicle. Number plates can be
            swapped and RC copies can be edited, but the chassis number stamped on the body and recorded on the
            registration does not change.
          </>,
          <>
            The {s('RTO Sarthi RC to chassis number API')} gives your software the chassis and engine number from the
            vehicle number, so you can {s('match them with the vehicle or the customer’s RC')}, fill insurance and
            loan forms, or order the right parts. It works for vehicles from {s('every state of India')} and starts at{' '}
            {s(`${LOOKUP_PRICE} per successful search`)}.
          </>,
          <>
            Need to verify the whole RC, including owner, financer and blacklist? See the{' '}
            <Link to="/vehicle-rc-verification-api" className={linkClass}>RC verification API</Link>. Not a developer?
            See the chassis number in the app with{' '}
            <Link to="/vehicle-information-software" className={linkClass}>vehicle information software</Link>.
          </>,
          <span className="text-sm">
            RTO Sarthi is an independent private software company. It is not the Vahan or Parivahan portal and is
            not affiliated with the Ministry of Road Transport and Highways or NIC.
          </span>,
        ],
      }}
      steps={{
        title: 'How the RC to chassis number API works',
        description: 'Live in your software, usually the same day.',
        items: [
          { title: 'Get an API key', description: 'Contact us and choose your search limit. We create a private API key for your business.' },
          { title: 'Send the RC number', description: 'Your app, form or backend sends the vehicle registration number.' },
          { title: 'Get the chassis number', description: 'Read CHASI_NO and ENG_NO from the response and match, store or fill them.' },
        ],
      }}
      code={{
        label: 'Sample response',
        title: 'Chassis number in the API response',
        description: 'CHASI_NO is the chassis number (VIN) and ENG_NO the engine number.',
        blocks: [{ label: 'JSON response (chassis fields)', code: responseExample }],
        note: 'Sample data, shortened. Details are returned wherever they are available on the vehicle record.',
      }}
      features={{
        label: 'Use cases',
        title: 'What you can do with an RC to chassis number API',
        description: 'Chassis number from the RC number, for every kind of vehicle business.',
        items: [
          { icon: <IconCheck />, variant: 'brand', title: 'Physical vehicle checks', description: 'Match the chassis number on the vehicle with the registration record before you accept it.' },
          { icon: <IconDocument />, variant: 'accent', title: 'Catch fake RC copies', description: 'Compare the chassis number on the customer’s RC copy with the record and flag a mismatch.' },
          { icon: <IconShield />, variant: 'success', title: 'Insurance proposals & claims', description: 'Fill chassis and engine number in proposals, inspections and claim forms automatically.' },
          { icon: <IconWallet />, variant: 'brand', title: 'Vehicle loans', description: 'Record the correct chassis and engine number on loan and hypothecation papers.' },
          { icon: <IconSearch />, variant: 'accent', title: 'Spare parts & service', description: 'Use the chassis number, model and manufacturing date to find the right parts.' },
          { icon: <IconCar />, variant: 'success', title: 'Used car buying', description: 'Confirm the car you are buying is the one on the RC before you pay.' },
          { icon: <IconCode />, variant: 'brand', title: 'For app developers', description: 'Add chassis number lookup by vehicle number with a simple JSON API.' },
          { icon: <IconMapPin />, variant: 'accent', title: 'All states of India', description: 'Two-wheelers, cars and commercial vehicles from any state, including BH series.' },
        ],
      }}
      checklist={{
        id: 'pricing',
        label: 'Pricing',
        title: `RC to chassis number API from ${LOOKUP_PRICE} per search`,
        description: 'Chassis number and the full record in every successful search.',
        price: {
          caption: 'Starting at',
          amount: LOOKUP_PRICE,
          text: 'per successful search · no monthly fee',
        },
        listTitle: 'Returned with the chassis number',
        items: [
          'Chassis number (VIN)', 'Engine number', 'Maker', 'Model & variant',
          'Vehicle class & fuel', 'Manufacturing month & year', 'Registration date', 'Registration status',
          'Owner name', 'Insurance & PUC validity', 'Financer (hypothecation)', 'Blacklist & NOC status',
        ],
        note: 'Details are returned wherever they are available on the vehicle record.',
      }}
      audiences={{
        title: 'Who uses an RC to chassis number API?',
        description: 'Anyone who needs to know which vehicle is really in front of them.',
        items: [
          'Motor insurance companies & surveyors', 'Vehicle loan & NBFC companies', 'Used car dealers & marketplaces',
          'Spare parts sellers & garages', 'Fleet & transport operators', 'Vehicle inspection & verification firms',
        ],
      }}
      related={[
        { to: '/vehicle-rc-verification-api', label: 'Vehicle RC verification API' },
        { to: '/vehicle-verification-api', label: 'Vehicle verification API' },
        { to: '/vehicle-make-and-model-api', label: 'Vehicle make and model API' },
      ]}
      faq={{
        title: 'RC to chassis number API — FAQ',
        description: 'Chassis number, VIN, matching and price.',
        items: rcToChassisApiFaqs,
      }}
      cta={{
        title: `Get chassis number by RC number from ${LOOKUP_PRICE}`,
        text: 'Contact RTO Sarthi on call or WhatsApp for your API key and get the chassis and engine number of any vehicle in seconds.',
      }}
    />
  )
}
