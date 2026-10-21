import { Link } from 'react-router-dom'
import ProductLanding from '../components/ProductLanding'
import { IconSearch, IconCheck, IconDocument, IconChart, IconClock, IconMapPin, IconWallet, IconShield } from '../components/Icons'
import { lookupApiFaqs } from '../data/lookupApi'
import { LOOKUP_PRICE } from '../data/vehicleInfo'

const s = (t) => <strong className="text-slate-700">{t}</strong>
const linkClass = 'font-semibold text-brand-800 hover:underline'

const responseExample = `{
  "success": true,
  "message": "Vehicle details fetched successfully",
  "vehicleNumber": "UP32HK9087",
  "data": {
    "REGN_NO": "UP32HK9087",
    "STATUS": "ACTIVE",
    "REGISTERED_AT": "LUCKNOW RTO, UTTAR PRADESH",
    "OWNER_NAME": "MOHD IRFAN",
    "OWNER_SERIAL_NO": "2",
    "MAKER_DESC": "TATA MOTORS PASSENGER VEHICLES LTD",
    "MAKER_MODEL": "NEXON XZ PLUS",
    "VEHICLE_CLASS": "MOTOR CAR (LMV)",
    "FUEL_DESC": "PETROL",
    "CHASI_NO": "MAT627123LPA54321",
    "ENG_NO": "RN12CB5432100",
    "REGN_DT": "02-Aug-2020",
    "REGN_UPTO": "01-Aug-2035",
    "FINANCER_DETAILS": "TATA CAPITAL LTD",
    "INSURANCE_UPTO": "01-Aug-2026",
    "PUCC_UPTO": "05-Feb-2027",
    "BLACKLIST_STATUS": "NA",
    "NOC_DETAILS": "NA"
  },
  "usage": { "limit": 5000, "used": 2011, "remaining": 2989 }
}`

export default function VehicleLookupApi() {
  return (
    <ProductLanding
      hero={{
        title: `Vehicle Lookup API — Look Up Any Indian Registration Number from ${LOOKUP_PRICE}`,
        intro: `The RTO Sarthi vehicle lookup API looks up any Indian registration number and returns the vehicle record as JSON in seconds: status, RTO, owner, maker and model, chassis and engine number, insurance, PUC, fitness, tax, financer, blacklist and NOC, from ${LOOKUP_PRICE} per successful lookup.`,
      }}
      buttons={[
        { label: 'Get API Key', href: '/contact' },
        { label: 'Talk to Us', href: '/contact' },
      ]}
      overview={{
        label: 'Vehicle lookup',
        title: 'Look up and verify any vehicle from its registration number',
        description: 'One registration number in, the full vehicle record out.',
        paragraphs: [
          <>
            Before you insure, finance, buy, rent out or let in a vehicle, you need to know that it is what the
            customer says it is. Is the registration active? Does the chassis number match? Is it financed or
            blacklisted? Checking this by hand for every vehicle does not scale.
          </>,
          <>
            The {s('RTO Sarthi vehicle lookup API')} does the check inside your software. Send the registration
            number and get the vehicle record back: {s('status, registering RTO, owner and owner serial number, maker and model, chassis and engine number')},
            registration validity, insurance, PUC, fitness and tax, financer, blacklist and NOC. It works for every
            state of India and starts at {s(`${LOOKUP_PRICE} per successful lookup`)}.
          </>,
          <>
            Need only the make and model? See the{' '}
            <Link to="/vehicle-make-and-model-api" className={linkClass}>vehicle make and model API</Link>. Need insurance
            status? See the <Link to="/vehicle-insurance-api" className={linkClass}>vehicle insurance API</Link>. For
            every field, see the <Link to="/vahan-api" className={linkClass}>Vahan API</Link> page.
          </>,
          <span className="text-sm">
            RTO Sarthi is an independent private software company. It is not the Vahan or Parivahan portal and is
            not affiliated with the Ministry of Road Transport and Highways or NIC.
          </span>,
        ],
      }}
      steps={{
        title: 'How the vehicle lookup API works',
        description: 'Live in your software, usually the same day.',
        items: [
          { title: 'Get an API key', description: 'Contact us and choose your lookup limit. We create a private API key for your business.' },
          { title: 'Send a registration number', description: 'Your website, app, CRM or ERP sends the vehicle number to look up.' },
          { title: 'Use the vehicle record', description: 'Show it, save it, or compare chassis, engine and owner with what the customer gave you.' },
        ],
      }}
      code={{
        label: 'Sample response',
        title: 'What a vehicle lookup returns',
        description: 'Status, RTO, owner, maker, model, chassis, engine, validity, financer, blacklist and NOC.',
        blocks: [{ label: 'JSON response', code: responseExample }],
        note: 'Sample data. Details are returned wherever they are available on the vehicle record.',
      }}
      features={{
        title: 'Why use the RTO Sarthi vehicle lookup API',
        description: 'Fast, low cost lookups for every kind of vehicle check.',
        items: [
          { icon: <IconSearch />, variant: 'brand', title: 'Lookup by registration number', description: 'Any format of Indian vehicle number, from two-wheelers to trucks and tractors.' },
          { icon: <IconCheck />, variant: 'accent', title: 'Verify chassis & engine', description: 'Match the chassis and engine number on record with the customer’s documents and flag mismatches.' },
          { icon: <IconDocument />, variant: 'success', title: 'Financer, blacklist & NOC', description: 'See hypothecation, blacklist and NOC status before you buy, finance or insure a vehicle.' },
          { icon: <IconShield />, variant: 'brand', title: 'Document validity', description: 'Registration, insurance, PUC, fitness and road tax validity in the same lookup.' },
          { icon: <IconChart />, variant: 'accent', title: 'Bulk lookups', description: 'Look up a whole fleet or vehicle list one number after another, with remaining searches in every response.' },
          { icon: <IconClock />, variant: 'success', title: 'Results in seconds', description: 'Clean JSON comes back fast, ready to show on screen or save in your database.' },
          { icon: <IconMapPin />, variant: 'brand', title: 'Every state of India', description: 'Vehicles registered in any state or union territory with the same integration.' },
          { icon: <IconWallet />, variant: 'accent', title: `From ${LOOKUP_PRICE}, pay on success`, description: 'Prepaid lookup limit with no monthly fee. Vehicles not found are returned to your limit.' },
        ],
      }}
      checklist={{
        id: 'pricing',
        label: 'Pricing',
        title: `Vehicle lookup API from ${LOOKUP_PRICE} per lookup`,
        description: 'The vehicle record in every successful lookup.',
        price: {
          caption: 'Starting at',
          amount: LOOKUP_PRICE,
          text: 'per successful lookup · no monthly fee',
        },
        listTitle: 'Returned in a vehicle lookup',
        items: [
          'Registration status', 'Registering RTO', 'Owner & serial number', 'Owner address',
          'Maker & model', 'Vehicle class & fuel', 'Chassis & engine number', 'Registration date & validity',
          'Insurance & PUC validity', 'Fitness & tax validity', 'Financer (hypothecation)', 'Blacklist & NOC status',
        ],
        note: 'Details are returned wherever they are available on the vehicle record.',
      }}
      audiences={{
        title: 'Who uses a vehicle lookup API?',
        description: 'Any business that needs to check a vehicle quickly.',
        items: [
          'Motor insurance companies & agents', 'Used car platforms & dealers', 'Vehicle loan & NBFC companies',
          'Self-drive rental & cab operators', 'Parking, toll & society security', 'Software & app developers',
        ],
      }}
      related={[
        { to: '/vahan-api', label: 'Vahan API' },
        { to: '/vehicle-insurance-api', label: 'Vehicle insurance API' },
        { to: '/vehicle-make-and-model-api', label: 'Vehicle make and model API' },
      ]}
      faq={{
        title: 'Vehicle lookup API — FAQ',
        description: 'Lookups, verification, bulk, price and coverage.',
        items: lookupApiFaqs,
      }}
      cta={{
        title: `Look up any vehicle by API from ${LOOKUP_PRICE}`,
        text: 'Contact RTO Sarthi on call or WhatsApp for your API key and start looking up registration numbers inside your software today.',
      }}
    />
  )
}
