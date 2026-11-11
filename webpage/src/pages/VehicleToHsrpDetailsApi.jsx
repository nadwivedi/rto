import { Link } from 'react-router-dom'
import ProductLanding from '../components/ProductLanding'
import { IconShield, IconCheck, IconWallet, IconCar, IconCode, IconMapPin, IconDocument, IconSearch } from '../components/Icons'
import { hsrpDetailsApiFaqs, HSRP_PRICE } from '../data/hsrpDetailsApi'

const s = (t) => <strong className="text-slate-700">{t}</strong>
const linkClass = 'font-semibold text-brand-800 hover:underline'

const responseExample = `{
  "success": true,
  "message": "HSRP details fetched successfully",
  "vehicleNumber": "CG04MK7712",
  "data": {
    "regno": "CG04MK7712",
    "chassis": "MA3EWDE1S00XXXXXX",
    "engine": "K12MN41XXXXX",
    "hsrp_response": {
      "maker": "MARUTI SUZUKI INDIA LTD",
      "fuel": "PETROL",
      "vchType": "PRIVATE",
      "vchCatg": "LMV",
      "norms": "BHARAT STAGE VI",
      "regnDate": "14-Mar-2021",
      "hsrpFrontLaserCode": "CG0412345678",
      "hsrpRearLaserCode": "CG0412345679",
      "stateCd": "CG",
      "offCd": "4"
    }
  }
}`

export default function VehicleToHsrpDetailsApi() {
  return (
    <ProductLanding
      hero={{
        title: `Vehicle to HSRP Details API — HSRP Laser Codes by Vehicle Number from ${HSRP_PRICE}`,
        intro: `The RTO Sarthi vehicle to HSRP details API takes any Indian vehicle number and returns its High Security Registration Plate (HSRP) details as JSON: front and rear HSRP laser codes, maker, fuel, vehicle type and category, emission norms, registration date, chassis and engine number and state / RTO office, from ${HSRP_PRICE} per successful search.`,
      }}
      buttons={[
        { label: 'Get API Key', href: '/contact' },
        { label: 'Talk to Us', href: '/contact' },
      ]}
      overview={{
        label: 'HSRP details by API',
        title: 'HSRP plate details of any vehicle, from its number',
        description: 'Check the front and rear plate laser codes in seconds.',
        paragraphs: [
          <>
            Every {s('High Security Registration Plate (HSRP)')} carries a unique laser-etched code, one on the front
            plate and one on the rear. The code ties the plate to the vehicle, so it is how you tell a genuine plate
            from a fake or swapped one.
          </>,
          <>
            The {s('RTO Sarthi vehicle to HSRP details API')} gives your software the {s('front and rear HSRP laser codes')}{' '}
            from the vehicle number, with the {s('maker, fuel, vehicle type, norms and registration date')} needed for
            HSRP booking, so you can {s('verify number plates automatically')}. It works for vehicles from{' '}
            {s('every state of India')} and starts at {s(`${HSRP_PRICE} per successful search`)}.
          </>,
          <>
            Need the full RC record too? See the{' '}
            <Link to="/vehicle-details-api" className={linkClass}>vehicle details API</Link> or the{' '}
            <Link to="/rc-to-chassis-number-api" className={linkClass}>RC to chassis number API</Link>. Not a
            developer? Search HSRP details in the app with{' '}
            <Link to="/vehicle-information-software" className={linkClass}>vehicle information software</Link>.
          </>,
          <span className="text-sm">
            RTO Sarthi is an independent private software company. It is not the Vahan, Parivahan or official HSRP
            booking portal, is not an HSRP manufacturer, and is not affiliated with the Ministry of Road Transport
            and Highways or NIC.
          </span>,
        ],
      }}
      steps={{
        title: 'How the vehicle to HSRP details API works',
        description: 'Live in your software, usually the same day.',
        items: [
          { title: 'Get an API key', description: 'Contact us and choose your HSRP search limit. We create a private API key for your business.' },
          { title: 'Send the vehicle number', description: 'Your app, inspection tool or backend sends the vehicle registration number.' },
          { title: 'Get the HSRP details', description: 'Read hsrpFrontLaserCode and hsrpRearLaserCode with the vehicle details from the JSON response.' },
        ],
      }}
      code={{
        label: 'Sample response',
        title: 'HSRP details in the API response',
        description: 'hsrpFrontLaserCode and hsrpRearLaserCode are the laser codes of the front and rear HSRP plates.',
        blocks: [{ label: 'JSON response (HSRP fields)', code: responseExample }],
        note: 'Sample data. Details are returned wherever they are available on the vehicle record.',
      }}
      features={{
        label: 'Use cases',
        title: 'What you can do with a vehicle to HSRP details API',
        description: 'HSRP plate details by vehicle number, for every business that checks vehicles.',
        items: [
          { icon: <IconShield />, variant: 'brand', title: 'Number plate verification', description: 'Match the laser codes on the plates with the vehicle record to spot fake or swapped plates.' },
          { icon: <IconDocument />, variant: 'accent', title: 'HSRP booking help', description: 'RTO agents and dealers get the maker, fuel, type and registration date needed to book HSRP or a replacement plate.' },
          { icon: <IconCheck />, variant: 'success', title: 'Vehicle onboarding', description: 'Check HSRP before accepting a vehicle on a fleet, rental, taxi or logistics platform.' },
          { icon: <IconWallet />, variant: 'brand', title: 'Loans, insurance & resale', description: 'Confirm the plates belong to the vehicle before you finance, insure or buy it.' },
          { icon: <IconSearch />, variant: 'accent', title: 'Inspection & recovery', description: 'Field teams verify plate laser codes during vehicle inspection, repossession or parking checks.' },
          { icon: <IconCar />, variant: 'success', title: 'Chassis & engine match', description: 'Chassis and engine number come with the HSRP details, so the plate, body and record can be matched.' },
          { icon: <IconCode />, variant: 'brand', title: 'For app developers', description: 'Add HSRP checks by vehicle number to dealer, insurance, fleet and RTO apps with a simple JSON API.' },
          { icon: <IconMapPin />, variant: 'accent', title: 'All states of India', description: 'Vehicles from any state, with the state code and RTO office code of the vehicle.' },
        ],
      }}
      checklist={{
        id: 'pricing',
        label: 'Pricing',
        title: `Vehicle to HSRP details API from ${HSRP_PRICE} per search`,
        description: 'Both HSRP laser codes and the vehicle details in every successful search.',
        price: {
          caption: 'Starting at',
          amount: HSRP_PRICE,
          text: 'per successful search · no monthly fee',
        },
        listTitle: 'Returned with the HSRP details',
        items: [
          'Front HSRP laser code', 'Rear HSRP laser code', 'Maker', 'Fuel type',
          'Vehicle type', 'Vehicle category', 'Emission norms', 'Registration date',
          'Chassis number', 'Engine number', 'State code', 'RTO office code',
        ],
        note: 'Details are returned wherever they are available on the vehicle record.',
      }}
      audiences={{
        title: 'Who uses a vehicle to HSRP details API?',
        description: 'Anyone who needs to trust the number plate on a vehicle.',
        items: [
          'RTO agents & consultants', 'Used car & bike dealers', 'Vehicle loan, NBFC & recovery agencies',
          'Insurance companies & agents', 'Fleet, rental & logistics platforms', 'Vehicle inspection & parking apps',
        ],
      }}
      related={[
        { to: '/vehicle-details-api', label: 'Vehicle details API India' },
        { to: '/rc-to-chassis-number-api', label: 'RC to chassis number API' },
        { to: '/vehicle-verification-api', label: 'Vehicle verification API' },
      ]}
      faq={{
        title: 'Vehicle to HSRP details API — FAQ',
        description: 'Laser codes, use cases, coverage and price.',
        items: hsrpDetailsApiFaqs,
      }}
      cta={{
        title: `Get HSRP details by vehicle number from ${HSRP_PRICE}`,
        text: 'Contact RTO Sarthi on call or WhatsApp for your API key and get the HSRP laser codes of any vehicle in seconds.',
      }}
    />
  )
}
