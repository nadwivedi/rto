import { Link } from 'react-router-dom'
import ProductLanding from '../components/ProductLanding'
import { IconMapPin, IconCar, IconSearch, IconWallet, IconDocument, IconCode, IconClock, IconShield, IconChart, IconUsers, IconCheck } from '../components/Icons'
import { vehicleDetailsApiIndiaFaqs } from '../data/vehicleDetailsApiIndia'
import { LOOKUP_PRICE } from '../data/vehicleInfo'
import { requestBlock } from '../data/vehicleApi'

const s = (t) => <strong className="text-slate-700">{t}</strong>
const linkClass = 'font-semibold text-brand-800 hover:underline'

const responseExample = `{
  "success": true,
  "message": "Vehicle details fetched successfully",
  "vehicleNumber": "23BH4512AB",
  "data": {
    "REGN_NO": "23BH4512AB",
    "STATUS": "ACTIVE",
    "REGISTERED_AT": "PUNE RTO, MAHARASHTRA",
    "OWNER_NAME": "PRIYA SHARMA",
    "OWNER_SERIAL_NO": "1",
    "VEHICLE_CLASS": "MOTOR CAR (LMV)",
    "MAKER_DESC": "MARUTI SUZUKI INDIA LTD",
    "MAKER_MODEL": "BREZZA ZXI",
    "FUEL_DESC": "PETROL/CNG",
    "NORMS_DESC": "BHARAT STAGE VI",
    "CHASI_NO": "MA3NYFB1SPA123456",
    "ENG_NO": "K15CN1234567",
    "REGN_DT": "14-Mar-2023",
    "FINANCER_DETAILS": "HDFC BANK LTD",
    "INSURANCE_COMP": "ICICI LOMBARD GENERAL INSURANCE CO. LTD.",
    "INSURANCE_UPTO": "13-Mar-2027",
    "PUCC_UPTO": "13-Mar-2027",
    "FIT_UPTO": "13-Mar-2038",
    "TAX_UPTO": "LTT",
    "BLACKLIST_STATUS": "NA"
  },
  "usage": { "limit": 10000, "used": 4120, "remaining": 5880 }
}`

export default function VehicleDetailsApiIndia() {
  return (
    <ProductLanding
      hero={{
        title: `Vehicle Details API India — API for Getting Vehicle Details by Vehicle Number from ${LOOKUP_PRICE}`,
        intro: `Looking for an API for getting vehicle details? RTO Sarthi is a vehicle details API provider in India. Send any Indian vehicle number, including BH series, and get the owner, model, chassis and engine number, insurance, PUC, fitness, tax, financer and blacklist status back as JSON in seconds, from ${LOOKUP_PRICE} per successful search with a GST invoice.`,
      }}
      buttons={[
        { label: 'Get API Key', href: '/contact' },
        { label: 'Talk to Us', href: '/contact' },
      ]}
      overview={{
        label: 'Vehicle details API',
        title: 'One vehicle details API for every vehicle number in India',
        description: 'Built for Indian number plates, Indian businesses and Indian pricing.',
        paragraphs: [
          <>
            India has more than 1,300 RTOs across 36 states and union territories, old and new number formats,
            and Bharat series plates that are not tied to any state. A {s('vehicle details API for India')} has
            to handle all of them with one integration, so your software never needs to know where a vehicle was
            registered.
          </>,
          <>
            The {s('RTO Sarthi vehicle details API')} takes a vehicle number in any format and returns the RC
            record as JSON: {s('owner, registering RTO, maker and model, fuel and BS norms, chassis and engine number')},
            registration date, financer, insurance, PUC, fitness, road tax, blacklist and NOC. It works for cars,
            bikes, trucks, buses and tractors, and starts at {s(`${LOOKUP_PRICE} per successful search`)}, paid in
            rupees with no monthly fee.
          </>,
          <>
            Most businesses start with only a vehicle number: an insurance quote, a used car listing, a loan
            application or a fleet check. Instead of someone searching the number and typing the details by hand,
            an {s('API for getting vehicle details')} fills your form, verifies the customer or saves to your
            database automatically, with no typing mistakes.
          </>,
          <>
            For every field, see the <Link to="/vahan-api" className={linkClass}>Vahan API</Link> page. To verify a vehicle, use
            the <Link to="/vehicle-lookup-api" className={linkClass}>vehicle lookup API</Link>, and for model data only,
            the <Link to="/vehicle-make-and-model-api" className={linkClass}>vehicle make and model API</Link>. Without
            software of your own, get the same details in the app with{' '}
            <Link to="/vehicle-information-software" className={linkClass}>vehicle information software</Link>.
          </>,
          <span className="text-sm">
            RTO Sarthi is an independent private software company. It is not the Vahan or Parivahan portal and is
            not affiliated with the Ministry of Road Transport and Highways or NIC.
          </span>,
        ],
      }}
      steps={{
        title: 'How to get the vehicle details API in India',
        description: 'Usually live the same day.',
        items: [
          { title: 'Contact RTO Sarthi', description: 'Call or WhatsApp us and choose a search limit. Pay in rupees and get a GST invoice.' },
          { title: 'Get your API key', description: 'We create a private API key and share the integration guide for your developer.' },
          { title: 'Send vehicle numbers', description: 'Any Indian vehicle number returns its details as JSON. Recharge when the remaining searches run low.' },
        ],
      }}
      code={{
        label: 'API demo',
        title: 'Vehicle details API response for a BH series car',
        description: 'State numbers, BH series, two-wheelers and commercial vehicles all return the same fields.',
        blocks: [requestBlock('23BH4512AB'), { label: 'JSON response', code: responseExample }],
        note: 'Sample data. Details are returned wherever they are available on the vehicle record.',
      }}
      features={[{
        label: 'Use cases',
        title: 'What you can build with an API for getting vehicle details',
        description: 'Ways Indian businesses use vehicle details from a vehicle number.',
        items: [
          { icon: <IconShield />, variant: 'brand', title: 'Instant motor insurance quotes', description: 'Customer types the vehicle number, and maker, model, fuel, registration date and current insurer fill automatically.' },
          { icon: <IconCar />, variant: 'accent', title: 'Used car listings & inspections', description: 'Auto-fill listings and check owner serial number, financer, blacklist and NOC before you buy or sell.' },
          { icon: <IconWallet />, variant: 'success', title: 'Vehicle loan verification', description: 'Match chassis, engine and owner with the application and see existing hypothecation before approving a loan.' },
          { icon: <IconChart />, variant: 'brand', title: 'Fleet document compliance', description: 'Check insurance, PUC, fitness and tax validity of every truck or cab in your fleet on a schedule.' },
          { icon: <IconUsers />, variant: 'accent', title: 'Parking, society & toll systems', description: 'Show vehicle model and status at the gate from the number plate, for visitor and resident vehicles.' },
          { icon: <IconCheck />, variant: 'success', title: 'RTO, dealer & garage software', description: 'Add vehicle number search to your own product so your users never type vehicle details again.' },
        ],
      }, {
        title: 'Why Indian businesses choose this vehicle details API',
        description: 'What to look for in a vehicle details API provider in India.',
        items: [
          { icon: <IconMapPin />, variant: 'brand', title: 'All 36 states & UTs', description: 'Vehicle numbers from every RTO in India with one integration, from Delhi to the North East and Andaman.' },
          { icon: <IconSearch />, variant: 'accent', title: 'Every number format', description: 'Old and new state numbers and Bharat (BH) series, with or without spaces and dashes.' },
          { icon: <IconCar />, variant: 'success', title: 'Car, bike, truck & tractor', description: 'Two-wheelers, cars, autos, taxis, buses, goods vehicles and tractors return the same fields.' },
          { icon: <IconDocument />, variant: 'brand', title: 'Full RC record', description: 'Owner, RTO, model, chassis, engine, financer, insurance, PUC, fitness, tax, blacklist and NOC.' },
          { icon: <IconWallet />, variant: 'accent', title: `From ${LOOKUP_PRICE}, GST invoice`, description: 'Prepaid in rupees, no monthly or setup fee. Vehicles not found are returned to your limit.' },
          { icon: <IconCode />, variant: 'success', title: 'Simple JSON for developers', description: 'Works with PHP, Node.js, Python, Java, .NET and no-code tools, with usage in every response.' },
          { icon: <IconClock />, variant: 'brand', title: 'Results in seconds', description: 'Fast enough to fill a form while your customer waits on screen.' },
          { icon: <IconShield />, variant: 'accent', title: 'Indian support team', description: 'Talk to us on call or WhatsApp in Hindi or English, and get help testing with real vehicle numbers.' },
        ],
      }]}
      checklist={{
        id: 'pricing',
        label: 'Pricing',
        title: `Vehicle details API price in India: from ${LOOKUP_PRICE} per search`,
        description: 'Everything in the RC record, for one low price per search.',
        price: {
          caption: 'Starting at',
          amount: LOOKUP_PRICE,
          text: 'per successful search · no monthly fee · GST invoice',
        },
        listTitle: 'Vehicle details returned for any Indian number',
        items: [
          'Owner name & address', 'Registering RTO & state', 'Registration status', 'Maker & model',
          'Vehicle class & fuel', 'BS emission norms', 'Chassis & engine number', 'Registration date',
          'Financer (hypothecation)', 'Insurance company & validity', 'PUC, fitness & tax validity', 'Blacklist & NOC status',
        ],
        note: 'Details are returned wherever they are available on the vehicle record.',
      }}
      audiences={{
        title: 'Who uses a vehicle details API in India?',
        description: 'Indian businesses whose work starts with a vehicle number.',
        items: [
          'Motor insurance companies & POSP agents', 'Used car platforms & dealers', 'Vehicle loan, bank & NBFC teams',
          'Fleet, logistics & cab operators', 'RTO agents & consultants', 'Software & app developers',
        ],
      }}
      related={[
        { to: '/vahan-api', label: 'Vahan API' },
        { to: '/parivahan-api', label: 'Parivahan API' },
        { to: '/vehicle-information-api', label: 'Vehicle information API' },
        { to: '/vehicle-lookup-api', label: 'Vehicle lookup API' },
        { to: '/vehicle-make-and-model-api', label: 'Vehicle make and model API' },
        { to: '/rc-verification-software', label: 'RC verification software' },
      ]}
      faq={{
        title: 'Vehicle details API India — FAQ',
        description: 'How it works, what you get, states, number formats and price.',
        items: vehicleDetailsApiIndiaFaqs,
      }}
      cta={{
        title: `Get the vehicle details API for India from ${LOOKUP_PRICE}`,
        text: 'Contact RTO Sarthi on call or WhatsApp for your API key and start getting vehicle details for any Indian vehicle number today.',
      }}
    />
  )
}
