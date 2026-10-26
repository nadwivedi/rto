import { Link } from 'react-router-dom'
import ProductLanding from '../components/ProductLanding'
import { IconShield, IconCheck, IconWallet, IconCar, IconCode, IconMapPin, IconDocument, IconSearch } from '../components/Icons'
import { fitnessDetailsApiFaqs } from '../data/fitnessDetailsApi'
import { LOOKUP_PRICE } from '../data/vehicleInfo'

const s = (t) => <strong className="text-slate-700">{t}</strong>
const linkClass = 'font-semibold text-brand-800 hover:underline'

const responseExample = `{
  "success": true,
  "message": "Vehicle details fetched successfully",
  "vehicleNumber": "CG04NK7316",
  "data": {
    "REGN_NO": "CG04NK7316",
    "STATUS": "ACTIVE",
    "VEHICLE_CLASS": "GOODS CARRIER (HGV)",
    "MAKER_MODEL": "TATA SIGNA 3518.T",
    "REGN_DT": "14-Sep-2021",
    "FIT_UPTO": "13-Sep-2027",
    "PERMIT_NO": "CG2021-NP-4417B",
    "INSURANCE_UPTO": "10-Sep-2027",
    "PUCC_UPTO": "02-Mar-2027",
    "TAX_UPTO": "30-Nov-2026"
  },
  "usage": { "limit": 2000, "used": 412, "remaining": 1588 }
}`

export default function VehicleFitnessDetailsApi() {
  return (
    <ProductLanding
      hero={{
        title: `Vehicle Fitness Details API — Check Fitness Validity by Vehicle Number from ${LOOKUP_PRICE}`,
        intro: `The RTO Sarthi vehicle fitness details API takes any Indian vehicle number and returns its fitness valid up to date as JSON, with vehicle class, registration status, permit number, insurance, PUC and road tax validity, from ${LOOKUP_PRICE} per successful search.`,
      }}
      buttons={[
        { label: 'Get API Key', href: '/contact' },
        { label: 'Talk to Us', href: '/contact' },
      ]}
      overview={{
        label: 'Fitness details by API',
        title: 'Fitness validity of any vehicle, from its number',
        description: 'Know which vehicles are fit to run, and which are due.',
        paragraphs: [
          <>
            A transport vehicle without a valid {s('fitness certificate')} cannot legally run. It can be stopped,
            fined, refused a permit, and its insurance claim can be disputed. Fleets, transporters and lenders need to
            know the fitness date of every vehicle, not just the ones on paper.
          </>,
          <>
            The {s('RTO Sarthi vehicle fitness details API')} gives your software the{' '}
            {s('fitness valid up to date')} from the vehicle number, along with insurance, PUC and road tax validity,
            so you can {s('flag expired and due fitness automatically')}. It works for vehicles from{' '}
            {s('every state of India')} and starts at {s(`${LOOKUP_PRICE} per successful search`)}.
          </>,
          <>
            Need PUC details too? See the{' '}
            <Link to="/vehicle-puc-details-api" className={linkClass}>vehicle PUC details API</Link>. Not a developer?
            Check fitness and get WhatsApp reminders in the app with{' '}
            <Link to="/vehicle-information-software" className={linkClass}>vehicle information software</Link>.
          </>,
          <span className="text-sm">
            RTO Sarthi is an independent private software company. It is not the Vahan or Parivahan portal and is
            not affiliated with the Ministry of Road Transport and Highways or NIC.
          </span>,
        ],
      }}
      steps={{
        title: 'How the vehicle fitness details API works',
        description: 'Live in your software, usually the same day.',
        items: [
          { title: 'Get an API key', description: 'Contact us and choose your search limit. We create a private API key for your business.' },
          { title: 'Send the vehicle number', description: 'Your app, fleet system or backend sends the vehicle registration number.' },
          { title: 'Get the fitness date', description: 'Read FIT_UPTO from the response and mark the vehicle valid, due or expired.' },
        ],
      }}
      code={{
        label: 'Sample response',
        title: 'Fitness details in the API response',
        description: 'FIT_UPTO is the date the vehicle’s fitness is valid up to.',
        blocks: [{ label: 'JSON response (fitness and validity fields)', code: responseExample }],
        note: 'Sample data, shortened. Details are returned wherever they are available on the vehicle record.',
      }}
      features={{
        label: 'Use cases',
        title: 'What you can do with a vehicle fitness details API',
        description: 'Fitness validity by vehicle number, for every business that runs or checks vehicles.',
        items: [
          { icon: <IconCar />, variant: 'brand', title: 'Fleet compliance', description: 'Check the fitness of every truck, bus and taxi in your fleet and see which are expired or due.' },
          { icon: <IconCheck />, variant: 'accent', title: 'Vehicle onboarding', description: 'Accept a vehicle on your platform only when its fitness is valid.' },
          { icon: <IconShield />, variant: 'success', title: 'Insurance underwriting & claims', description: 'Confirm a commercial vehicle had valid fitness before you issue a policy or settle a claim.' },
          { icon: <IconWallet />, variant: 'brand', title: 'Commercial vehicle loans', description: 'Check fitness and road tax before you finance or refinance a commercial vehicle.' },
          { icon: <IconDocument />, variant: 'accent', title: 'Fitness renewal leads', description: 'RTO agents and fitness centres can find vehicles whose fitness is due and reach them first.' },
          { icon: <IconSearch />, variant: 'success', title: 'All documents in one call', description: 'Fitness, insurance, PUC and tax validity together, so nothing expired is missed.' },
          { icon: <IconCode />, variant: 'brand', title: 'For app developers', description: 'Add fitness checks by vehicle number to fleet, logistics and transport apps with a simple JSON API.' },
          { icon: <IconMapPin />, variant: 'accent', title: 'All states of India', description: 'Commercial and private vehicles from any state, including BH series.' },
        ],
      }}
      checklist={{
        id: 'pricing',
        label: 'Pricing',
        title: `Vehicle fitness details API from ${LOOKUP_PRICE} per search`,
        description: 'Fitness validity and the full record in every successful search.',
        price: {
          caption: 'Starting at',
          amount: LOOKUP_PRICE,
          text: 'per successful search · no monthly fee',
        },
        listTitle: 'Returned with the fitness details',
        items: [
          'Fitness valid up to', 'Vehicle class', 'Registration status', 'Registration date',
          'Permit number', 'Insurance validity', 'PUC validity', 'Road tax validity',
          'Maker & model', 'Owner name', 'Chassis & engine number', 'Financer (hypothecation)',
        ],
        note: 'Details are returned wherever they are available on the vehicle record.',
      }}
      audiences={{
        title: 'Who uses a vehicle fitness details API?',
        description: 'Anyone who needs commercial vehicles to be road-legal.',
        items: [
          'Fleet & transport operators', 'Logistics & aggregator platforms', 'Motor insurance companies',
          'Commercial vehicle loan & NBFC companies', 'RTO agents & fitness centres', 'Bus, taxi & school transport operators',
        ],
      }}
      related={[
        { to: '/rc-to-road-tax-details-api', label: 'RC to road tax details API' },
        { to: '/vehicle-puc-details-api', label: 'Vehicle PUC details API' },
        { to: '/vehicle-insurance-api', label: 'Vehicle insurance API' },
        { to: '/vehicle-verification-api', label: 'Vehicle verification API' },
      ]}
      faq={{
        title: 'Vehicle fitness details API — FAQ',
        description: 'Fitness validity, which vehicles need it, bulk checks and price.',
        items: fitnessDetailsApiFaqs,
      }}
      cta={{
        title: `Check vehicle fitness by number from ${LOOKUP_PRICE}`,
        text: 'Contact RTO Sarthi on call or WhatsApp for your API key and get the fitness validity of any vehicle in seconds.',
      }}
    />
  )
}
