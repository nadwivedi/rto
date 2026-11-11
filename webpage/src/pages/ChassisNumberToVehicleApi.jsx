import { Link } from 'react-router-dom'
import ProductLanding from '../components/ProductLanding'
import { IconShield, IconCheck, IconWallet, IconCar, IconCode, IconMapPin, IconDocument, IconSearch } from '../components/Icons'
import { chassisToVehicleApiFaqs } from '../data/chassisToVehicleApi'

const s = (t) => <strong className="text-slate-700">{t}</strong>
const linkClass = 'font-semibold text-brand-800 hover:underline'

const requestExample = `{
  "chassisNumber": "MA3EWDE1S00XXXXXX"
}`

const responseExample = `{
  "success": true,
  "message": "Vehicle details fetched successfully",
  "chassisNumber": "MA3EWDE1S00XXXXXX",
  "data": {
    "REGN_NO": "CG04MK7712",
    "CHASI_NO": "MA3EWDE1S00XXXXXX",
    "ENG_NO": "K12MN41XXXXX",
    "STATUS": "ACTIVE",
    "MAKER": "MARUTI SUZUKI INDIA LTD",
    "MAKER_MODEL": "SWIFT VXI",
    "VEHICLE_CLASS": "MOTOR CAR (LMV)",
    "FUEL_TYPE": "PETROL",
    "REGN_DT": "14-Mar-2021",
    "REGISTERED_AT": "RAIPUR RTO, CHHATTISGARH"
  }
}`

export default function ChassisNumberToVehicleApi() {
  return (
    <ProductLanding
      hero={{
        title: 'Chassis Number to Vehicle API — Find Vehicle Number by Chassis Number',
        intro: 'The RTO Sarthi chassis number to vehicle API takes a vehicle’s chassis number (VIN) and returns the registration number it is registered under, as JSON, with maker, model, engine number, vehicle class, fuel, registration date, registering RTO and status. For vehicles from every state of India.',
      }}
      buttons={[
        { label: 'Get API Key', href: '/contact' },
        { label: 'Talk to Us', href: '/contact' },
      ]}
      overview={{
        label: 'Chassis number to vehicle by API',
        title: 'The vehicle number of any vehicle, from its chassis number',
        description: 'Identify a vehicle even when its number plate is missing.',
        paragraphs: [
          <>
            The {s('chassis number (VIN)')} is stamped on the vehicle body and stays the same for its whole life. Number
            plates can be removed, damaged or faked, so the chassis number is often the only reliable way to know which
            registered vehicle you are looking at.
          </>,
          <>
            The {s('RTO Sarthi chassis number to vehicle API')} gives your software the {s('vehicle registration number')}{' '}
            for a chassis number, with the {s('maker, model, engine number, registration date and status')} from the
            registration record, so you can {s('trace and verify vehicles by chassis')}. It works for vehicles from{' '}
            {s('every state of India')}.
          </>,
          <>
            Have the vehicle number instead? Use the{' '}
            <Link to="/rc-to-chassis-number-api" className={linkClass}>RC to chassis number API</Link> for the reverse
            search, or the <Link to="/vehicle-details-api" className={linkClass}>vehicle details API</Link> for the full
            RC record.
          </>,
          <span className="text-sm">
            RTO Sarthi is an independent private software company. It is not the Vahan or Parivahan portal and is
            not affiliated with the Ministry of Road Transport and Highways or NIC.
          </span>,
        ],
      }}
      steps={{
        title: 'How the chassis number to vehicle API works',
        description: 'Talk to us, get your key, start searching.',
        items: [
          { title: 'Get an API key', description: 'Contact us and choose your chassis search limit. We create a private API key for your business.' },
          { title: 'Send the chassis number', description: 'Your app, recovery tool or backend sends the full chassis number (VIN) of the vehicle.' },
          { title: 'Get the vehicle number', description: 'Read REGN_NO and the vehicle details from the JSON response.' },
        ],
      }}
      code={{
        label: 'Sample request & response',
        title: 'Chassis number in, vehicle number out',
        description: 'REGN_NO is the vehicle registration number the chassis is registered under.',
        blocks: [
          { label: 'Request body', code: requestExample },
          { label: 'JSON response (vehicle fields)', code: responseExample },
        ],
        note: 'Sample data, shortened. Details are returned wherever they are available on the vehicle record.',
      }}
      features={{
        label: 'Use cases',
        title: 'What you can do with a chassis number to vehicle API',
        description: 'Vehicle number and details by chassis number, for every business that traces or checks vehicles.',
        items: [
          { icon: <IconSearch />, variant: 'brand', title: 'Vehicle recovery & tracing', description: 'Recovery agents and NBFCs find the registration number of repossessed, seized or abandoned vehicles from the chassis.' },
          { icon: <IconShield />, variant: 'accent', title: 'Fake plate detection', description: 'Read the chassis on the vehicle and check it is registered under the number shown on its plate.' },
          { icon: <IconWallet />, variant: 'success', title: 'Loans & used vehicle purchase', description: 'Confirm the chassis belongs to the vehicle number on the RC before you finance or buy it.' },
          { icon: <IconDocument />, variant: 'brand', title: 'Insurance claims', description: 'Match total-loss, theft and accident vehicles to their registration record by chassis number.' },
          { icon: <IconCheck />, variant: 'accent', title: 'Already registered check', description: 'See whether a chassis is already registered before a new registration, re-registration or transfer.' },
          { icon: <IconCar />, variant: 'success', title: 'Dealers & service centres', description: 'Find the vehicle number of a car or bike in the workshop from its VIN for service records and parts.' },
          { icon: <IconCode />, variant: 'brand', title: 'For app developers', description: 'Add chassis number search to recovery, insurance, dealer and RTO apps with a simple JSON API.' },
          { icon: <IconMapPin />, variant: 'accent', title: 'All states of India', description: 'Cars, two-wheelers and commercial vehicles registered in any state.' },
        ],
      }}
      checklist={{
        id: 'pricing',
        label: 'Pricing',
        title: 'Chassis number to vehicle API pricing',
        description: 'Prepaid searches, lower rates for higher volumes, no monthly fee.',
        price: {
          caption: 'Pricing',
          amount: 'On request',
          text: 'pay only for successful searches · no monthly fee',
        },
        listTitle: 'Returned for the chassis number',
        items: [
          'Vehicle registration number', 'Chassis number', 'Engine number', 'Registration status',
          'Maker', 'Model', 'Vehicle class', 'Fuel type',
          'Registration date', 'Registering RTO', 'Owner name', 'Financer (hypothecation)',
        ],
        note: 'Details are returned wherever they are available on the vehicle record.',
      }}
      audiences={{
        title: 'Who uses a chassis number to vehicle API?',
        description: 'Anyone who needs to identify a vehicle without trusting its number plate.',
        items: [
          'Vehicle loan, NBFC & recovery agencies', 'Insurance companies & claim surveyors', 'Used car & bike dealers',
          'RTO agents & consultants', 'Service centres & spare-part dealers', 'Fleet, auction & scrapping platforms',
        ],
      }}
      related={[
        { to: '/rc-to-chassis-number-api', label: 'RC to chassis number API' },
        { to: '/vehicle-rc-verification-api', label: 'Vehicle RC verification API' },
        { to: '/vehicle-to-hsrp-details-api', label: 'Vehicle to HSRP details API' },
      ]}
      faq={{
        title: 'Chassis number to vehicle API — FAQ',
        description: 'Vehicle number by chassis, use cases, coverage and price.',
        items: chassisToVehicleApiFaqs,
      }}
      cta={{
        title: 'Find the vehicle number from any chassis number',
        text: 'Contact RTO Sarthi on call or WhatsApp for pricing and your API key, and start searching vehicles by chassis number.',
      }}
    />
  )
}
