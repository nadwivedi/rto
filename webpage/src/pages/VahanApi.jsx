import { Link } from 'react-router-dom'
import ProductLanding from '../components/ProductLanding'
import { IconWallet, IconCheck, IconShield, IconChart, IconCar, IconClock, IconDocument, IconMapPin } from '../components/Icons'
import { vahanApiFaqs } from '../data/vahanApi'
import { LOOKUP_PRICE } from '../data/vehicleInfo'

const s = (t) => <strong className="text-slate-700">{t}</strong>
const linkClass = 'font-semibold text-brand-800 hover:underline'

const responseExample = `{
  "success": true,
  "vehicleNumber": "MH12AB1234",
  "data": {
    "REGN_NO": "MH12AB1234",
    "STATUS": "ACTIVE",
    "REGISTERED_AT": "PUNE RTO, MAHARASHTRA",
    "OWNER_NAME": "SUNITA PATIL",
    "F_NAME": "RAJESH PATIL",
    "OWNER_SERIAL_NO": "1",
    "PRESENT_ADDRESS": "FLAT 204, SHIVAJI NAGAR, PUNE, MAHARASHTRA 411005",
    "VEHICLE_CLASS": "MOTOR CAR (LMV)",
    "MAKER_DESC": "MARUTI SUZUKI INDIA LTD",
    "MAKER_MODEL": "SWIFT VXI",
    "BODY_TYPE_DESC": "HATCHBACK",
    "FUEL_DESC": "PETROL",
    "FUEL_NORMS": "BHARAT STAGE VI",
    "COLOR": "PEARL ARCTIC WHITE",
    "CHASI_NO": "MA3EWDE1S00123456",
    "ENG_NO": "K12NP1234567",
    "CUBIC_CAPACITY": "1197",
    "SEATING_CAPACITY": "5",
    "MANU_MONTH_YR": "03/2022",
    "REGN_DT": "12-Apr-2022",
    "REGN_UPTO": "11-Apr-2037",
    "FINANCER_DETAILS": "HDFC BANK LTD",
    "INSURANCE_COMP": "ICICI LOMBARD GENERAL INSURANCE CO. LTD.",
    "INS_POLICY_NO": "3001/123456789/00/000",
    "INSURANCE_UPTO": "11-Apr-2027",
    "PUCC_NO": "MH01200040056789",
    "PUCC_UPTO": "10-Apr-2027",
    "FIT_UPTO": "11-Apr-2037",
    "TAX_UPTO": "LTT",
    "BLACKLIST_STATUS": "NA",
    "NOC_DETAILS": "NA"
  },
  "usage": { "limit": 5000, "used": 1240, "remaining": 3760 }
}`

export default function VahanApi() {
  return (
    <ProductLanding
      hero={{
        title: `Vahan API for Vehicle Details — Complete RC Data by Vehicle Number from ${LOOKUP_PRICE}`,
        intro: `Get complete vehicle details from a vehicle number with the RTO Sarthi Vahan API: owner and address, chassis and engine number, financer, insurance, PUC, fitness, tax, blacklist and NOC status, as JSON in seconds. Pricing starts at just ${LOOKUP_PRICE} per search.`,
      }}
      buttons={[
        { label: 'Get Vahan API Key', href: '/contact' },
        { label: 'Talk to Us', href: '/contact' },
      ]}
      overview={{
        label: 'What is Vahan API',
        title: 'What is a Vahan API for vehicle details?',
        description: 'Vehicle registration details inside your own software.',
        paragraphs: [
          <>
            {s('Vahan')} is the national vehicle registration system that RTOs across India use to
            record every vehicle: its owner, model, chassis and engine number, registration,
            insurance, PUC, fitness and tax. When a business needs these details for a vehicle number,
            opening a website and copying them by hand is slow and full of typing mistakes.
          </>,
          <>
            A {s('Vahan API')} solves this. Your software sends the vehicle number and gets the
            vehicle details back automatically as JSON, ready to fill a form, verify a customer or save
            in your records. RTO Sarthi provides this vehicle details API for every state of India,
            starting at {s(`${LOOKUP_PRICE} per successful search`)} with no monthly fee.
          </>,
          <>
            Need vehicle details without writing code? RTO agents and dealers can use the same search
            in the app with our{' '}
            <Link to="/vehicle-information-software" className={linkClass}>vehicle information software</Link>, and
            download the RC with{' '}
            <Link to="/rc-download-software" className={linkClass}>RC download software</Link>. For a
            shorter overview of the API, see the{' '}
            <Link to="/vehicle-information-api" className={linkClass}>vehicle information API</Link> page. The same
            Vahan API powers our{' '}
            <Link to="/vehicle-lookup-api" className={linkClass}>vehicle lookup API</Link>,{' '}
            <Link to="/vehicle-insurance-api" className={linkClass}>vehicle insurance API</Link> and{' '}
            <Link to="/vehicle-make-and-model-api" className={linkClass}>vehicle make and model API</Link>.
          </>,
          <span className="text-sm">
            RTO Sarthi is an independent private software company. It is not the Vahan or Parivahan
            portal and is not affiliated with the Ministry of Road Transport and Highways or NIC.
          </span>,
        ],
      }}
      steps={{
        title: 'How to get vehicle details with the Vahan API',
        description: 'From API key to your first vehicle search.',
        items: [
          { title: 'Get your Vahan API key', description: 'Contact us and choose your search limit. We create a private API key for your business and share the integration guide.' },
          { title: 'Connect your software', description: 'Add the API to your website, app, CRM or ERP. Our team helps you test it with real vehicle numbers.' },
          { title: 'Get vehicle details', description: 'Send any vehicle number and use the RC details in your software. Recharge when remaining searches run low.' },
        ],
      }}
      code={{
        label: 'Sample response',
        title: 'Vahan API sample response with complete vehicle details',
        description: 'Owner, address, chassis, engine, financer, insurance, PUC, fitness, tax, blacklist and NOC.',
        blocks: [{ label: 'JSON response', code: responseExample }],
        note: 'Sample data. Details are returned wherever they are available on the vehicle record.',
      }}
      features={{
        title: 'Why businesses choose the RTO Sarthi Vahan API',
        description: 'Low price per search, detailed vehicle data and help when you need it.',
        items: [
          { icon: <IconWallet />, variant: 'success', title: `From ${LOOKUP_PRICE} per search`, description: 'One of the lowest prices for a vehicle details API in India. Prepaid, with no monthly fee.' },
          { icon: <IconCheck />, variant: 'brand', title: 'Charged only on success', description: 'If a vehicle is not found or the service is busy, the search goes back to your limit.' },
          { icon: <IconCar />, variant: 'accent', title: 'Detailed vehicle data', description: 'More than 30 fields: owner, address, vehicle class, body type, fuel norms, chassis, engine, CC, seating and more.' },
          { icon: <IconDocument />, variant: 'brand', title: 'Financer, blacklist & NOC', description: 'See hypothecation, blacklist and NOC status before you insure, finance or buy a vehicle.' },
          { icon: <IconMapPin />, variant: 'success', title: 'Every state of India', description: 'Search vehicle numbers of any state or union territory with the same API.' },
          { icon: <IconClock />, variant: 'accent', title: 'Results in seconds', description: 'Clean JSON comes back fast, ready to show on screen or save in your database.' },
          { icon: <IconChart />, variant: 'brand', title: 'Usage in every response', description: 'Limit, used and remaining searches come with each result, so your system knows when to recharge.' },
          { icon: <IconShield />, variant: 'success', title: 'Private API key & support', description: 'Each business gets its own key, which we can switch off and replace at once. Our Raipur team helps you integrate.' },
        ],
      }}
      checklist={{
        id: 'pricing',
        label: 'Pricing',
        title: `Vahan API price from ${LOOKUP_PRICE} per search`,
        description: 'Vehicle details returned in every successful search.',
        price: {
          caption: 'Starting at',
          amount: LOOKUP_PRICE,
          text: 'per successful search · no monthly fee',
        },
        listTitle: 'Vehicle details in the Vahan API response',
        items: [
          'Owner & father\'s name', 'Present address', 'Owner serial number', 'Registering RTO & status',
          'Vehicle class & body type', 'Maker & model', 'Fuel & emission norms', 'Chassis & engine number',
          'Cubic capacity & seating', 'Manufacturing month & year', 'Registration date & validity', 'Financer (hypothecation)',
          'Insurance company, policy & validity', 'PUC number & validity', 'Fitness validity', 'Road tax validity',
          'Blacklist status', 'NOC details',
        ],
        note: 'Details are returned wherever they are available on the vehicle record.',
      }}
      audiences={{
        title: 'Who uses a Vahan API for vehicle details?',
        description: 'Any business that starts with a vehicle number.',
        items: [
          'Motor insurance companies & agents', 'Used car platforms & dealers', 'Vehicle loan & NBFC finance companies',
          'Fleet, transport & logistics companies', 'Parking, toll & society security', 'RTO software & app developers',
        ],
      }}
      related={[
        { to: '/vehicle-information-api', label: 'Vehicle information API' },
        { to: '/api-for-vehicle-details', label: 'API for getting vehicle details' },
        { to: '/vehicle-details-api', label: 'Vehicle details API India' },
        { to: '/vehicle-make-and-model-api', label: 'Vehicle make and model API' },
        { to: '/vehicle-lookup-api', label: 'Vehicle lookup API' },
        { to: '/vehicle-insurance-api', label: 'Vehicle insurance API' },
        { to: '/rc-verification-software', label: 'RC verification software' },
        { to: '/vehicle-information-software', label: 'Vehicle information software' },
      ]}
      faq={{
        title: 'Vahan API for vehicle details — FAQ',
        description: 'Data, price, states and API keys.',
        items: vahanApiFaqs,
      }}
      cta={{
        title: `Start using the Vahan API from ${LOOKUP_PRICE} per search`,
        text: 'Contact RTO Sarthi on call or WhatsApp for your API key and get vehicle details inside your software today.',
      }}
    />
  )
}
