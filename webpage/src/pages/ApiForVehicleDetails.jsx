import { Link } from 'react-router-dom'
import ProductLanding from '../components/ProductLanding'
import { IconShield, IconCar, IconWallet, IconUsers, IconMapPin, IconCode, IconCheck, IconChart } from '../components/Icons'
import { vehicleDetailsApiFaqs } from '../data/vehicleDetailsApi'
import { LOOKUP_PRICE } from '../data/vehicleInfo'

const s = (t) => <strong className="text-slate-700">{t}</strong>
const linkClass = 'font-semibold text-brand-800 hover:underline'

const responseExample = `{
  "success": true,
  "vehicleNumber": "KA05MN4321",
  "data": {
    "REGN_NO": "KA05MN4321",
    "STATUS": "ACTIVE",
    "REGISTERED_AT": "BANGALORE (SOUTH) RTO, KARNATAKA",
    "OWNER_NAME": "ARJUN RAO",
    "PRESENT_ADDRESS": "12, 4TH CROSS, JAYANAGAR, BENGALURU, KARNATAKA 560041",
    "VEHICLE_CLASS": "M-CYCLE/SCOOTER (2WN)",
    "MAKER_DESC": "HONDA MOTORCYCLE AND SCOOTER INDIA (P) LTD",
    "MAKER_MODEL": "ACTIVA 6G",
    "FUEL_DESC": "PETROL",
    "CHASI_NO": "ME4JF91ABN8012345",
    "ENG_NO": "JF91E8012345",
    "REGN_DT": "08-Nov-2023",
    "FINANCER_DETAILS": "NA",
    "INSURANCE_COMP": "BAJAJ ALLIANZ GENERAL INSURANCE CO. LTD.",
    "INSURANCE_UPTO": "07-Nov-2026",
    "PUCC_UPTO": "07-May-2027",
    "TAX_UPTO": "LTT",
    "BLACKLIST_STATUS": "NA"
  },
  "usage": { "limit": 2000, "used": 314, "remaining": 1686 }
}`

export default function ApiForVehicleDetails() {
  return (
    <ProductLanding
      hero={{
        title: `API for Getting Vehicle Details — Vehicle Number to Full RC Data from ${LOOKUP_PRICE}`,
        intro: `Looking for an API for getting vehicle details? With RTO Sarthi your software sends any Indian vehicle number and gets the owner, address, model, chassis and engine number, insurance, PUC, fitness, tax, financer and blacklist status back as JSON in seconds, from ${LOOKUP_PRICE} per successful search.`,
      }}
      buttons={[
        { label: 'Get API Key', href: '/contact' },
        { label: 'Talk to Us', href: '/contact' },
      ]}
      overview={{
        label: 'Vehicle details by API',
        title: 'Get vehicle details automatically instead of copying them by hand',
        description: 'One vehicle number in, complete vehicle details out.',
        paragraphs: [
          <>
            Many businesses start with only a vehicle number: an insurance quote, a used car listing, a loan
            application, a fleet check or a parking entry. Someone then opens a website, searches the number and
            types the owner, model, chassis and insurance details into the system. It is slow and every typing
            mistake costs money.
          </>,
          <>
            An {s('API for getting vehicle details')} does this inside your own software. Your system sends the
            vehicle number, and the RTO Sarthi API returns the registration details as clean JSON that fills your
            form, verifies the customer or saves to your database automatically. It works for vehicles from{' '}
            {s('every state of India')} and starts at {s(`${LOOKUP_PRICE} per successful search`)} with no monthly fee.
          </>,
          <>
            See the full list of fields on the{' '}
            <Link to="/vahan-api" className={linkClass}>Vahan API for vehicle details</Link> page, or the product
            overview on the <Link to="/vehicle-information-api" className={linkClass}>vehicle information API</Link>{' '}
            page. Without software of your own, get the same details in the app with{' '}
            <Link to="/vehicle-information-software" className={linkClass}>vehicle information software</Link>.
          </>,
          <span className="text-sm">
            RTO Sarthi is an independent private software company. It is not the Vahan or Parivahan portal and is
            not affiliated with the Ministry of Road Transport and Highways or NIC.
          </span>,
        ],
      }}
      steps={{
        title: 'How to start getting vehicle details through the API',
        description: 'Usually live the same day.',
        items: [
          { title: 'Get an API key', description: 'Contact us and choose your search limit. We create a private API key for your business.' },
          { title: 'Connect your system', description: 'Your developer adds the API to your website, app, CRM or ERP with our guide. We help you test it.' },
          { title: 'Send vehicle numbers', description: 'Every vehicle number returns its details as JSON. Recharge when the remaining searches run low.' },
        ],
      }}
      code={{
        label: 'Sample response',
        title: 'What your software gets back for a vehicle number',
        description: 'A sample two-wheeler response. Cars, commercial vehicles and tractors return the same fields.',
        blocks: [{ label: 'JSON response', code: responseExample }],
        note: 'Sample data. Details are returned wherever they are available on the vehicle record.',
      }}
      features={{
        label: 'Use cases',
        title: 'What you can build with a vehicle details API',
        description: 'Ways businesses use vehicle details from a vehicle number.',
        items: [
          { icon: <IconShield />, variant: 'brand', title: 'Instant motor insurance quotes', description: 'Customer types the vehicle number, and maker, model, fuel, registration date and current insurer fill automatically.' },
          { icon: <IconCar />, variant: 'accent', title: 'Used car listings & inspections', description: 'Auto-fill listings and check owner serial number, financer, blacklist and NOC before you buy or sell.' },
          { icon: <IconWallet />, variant: 'success', title: 'Vehicle loan verification', description: 'Match chassis, engine and owner with the application and see existing hypothecation before approving a loan.' },
          { icon: <IconChart />, variant: 'brand', title: 'Fleet document compliance', description: 'Check insurance, PUC, fitness and tax validity of every truck or cab in your fleet on a schedule.' },
          { icon: <IconUsers />, variant: 'accent', title: 'Parking, society & toll systems', description: 'Show vehicle model and status at the gate from the number plate, for visitor and resident vehicles.' },
          { icon: <IconCode />, variant: 'success', title: 'RTO, dealer & garage software', description: 'Add vehicle number search to your own product so your users never type vehicle details again.' },
          { icon: <IconMapPin />, variant: 'brand', title: 'All states, one API', description: 'Vehicle numbers from any state or union territory of India with the same integration.' },
          { icon: <IconCheck />, variant: 'accent', title: 'Pay only for results', description: `From ${LOOKUP_PRICE} per search, prepaid, with searches not found returned to your limit.` },
        ],
      }}
      checklist={{
        id: 'pricing',
        label: 'Pricing',
        title: `Vehicle details API from ${LOOKUP_PRICE} per search`,
        description: 'Details you can get from a vehicle number.',
        price: {
          caption: 'Starting at',
          amount: LOOKUP_PRICE,
          text: 'per successful search · no monthly fee',
        },
        listTitle: 'Vehicle details returned by the API',
        items: [
          'Owner name & address', 'Registering RTO & status', 'Vehicle class & body type', 'Maker & model',
          'Fuel & emission norms', 'Chassis & engine number', 'Registration date & validity', 'Financer (hypothecation)',
          'Insurance company & validity', 'PUC validity', 'Fitness & road tax validity', 'Blacklist & NOC status',
        ],
        note: 'Details are returned wherever they are available on the vehicle record.',
      }}
      audiences={{
        title: 'Who needs an API for getting vehicle details?',
        description: 'Any business whose work starts with a vehicle number.',
        items: [
          'Insurance companies & POSP agents', 'Used car platforms & dealers', 'Vehicle loan & NBFC companies',
          'Fleet, cab & logistics operators', 'Parking, toll & society security', 'Software & app developers',
        ],
      }}
      related={[
        { to: '/vehicle-information-api', label: 'Vehicle information API' },
        { to: '/vahan-api', label: 'Vahan API' },
        { to: '/vehicle-details-api', label: 'Vehicle details API India' },
        { to: '/vehicle-make-and-model-api', label: 'Vehicle make and model API' },
        { to: '/vehicle-insurance-api', label: 'Vehicle insurance API' },
        { to: '/rc-verification-software', label: 'RC verification software' },
      ]}
      faq={{
        title: 'API for getting vehicle details — FAQ',
        description: 'How it works, what you get, price and states.',
        items: vehicleDetailsApiFaqs,
      }}
      cta={{
        title: `Get vehicle details by API from ${LOOKUP_PRICE} per search`,
        text: 'Contact RTO Sarthi on call or WhatsApp for your API key and start getting vehicle details inside your software today.',
      }}
    />
  )
}
