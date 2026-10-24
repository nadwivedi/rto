import { Link } from 'react-router-dom'
import ProductLanding from '../components/ProductLanding'
import { IconDocument, IconMapPin, IconUsers, IconShield, IconWallet, IconCar, IconCode, IconCheck } from '../components/Icons'
import { registrationDetailsApiFaqs } from '../data/registrationDetailsApi'
import { LOOKUP_PRICE } from '../data/vehicleInfo'

const s = (t) => <strong className="text-slate-700">{t}</strong>
const linkClass = 'font-semibold text-brand-800 hover:underline'

const responseExample = `{
  "success": true,
  "message": "Vehicle details fetched successfully",
  "vehicleNumber": "HR26DQ8814",
  "data": {
    "REGN_NO": "HR26DQ8814",
    "STATUS": "ACTIVE",
    "REGISTERED_AT": "GURUGRAM RTO, HARYANA",
    "REGN_DT": "18-Aug-2018",
    "REGN_UPTO": "17-Aug-2033",
    "OWNER_NAME": "NEHA MALHOTRA",
    "OWNER_SERIAL_NO": "2",
    "VEHICLE_CLASS": "MOTOR CAR (LMV)",
    "MAKER_DESC": "HONDA CARS INDIA LTD",
    "MAKER_MODEL": "CITY 1.5 V MT",
    "CHASI_NO": "MAKGM652JJN123456",
    "ENG_NO": "L15Z11234567",
    "FINANCER_DETAILS": "NA",
    "BLACKLIST_STATUS": "NA",
    "NOC_DETAILS": "NA"
  },
  "usage": { "limit": 5000, "used": 1342, "remaining": 3658 }
}`

export default function VehicleRegistrationDetailsApi() {
  return (
    <ProductLanding
      hero={{
        title: `Vehicle Registration Details API — Registration Date, Validity, RTO & Owner by Number from ${LOOKUP_PRICE}`,
        intro: `The RTO Sarthi vehicle registration details API takes any Indian registration number and returns the vehicle’s registration record as JSON: registration date and valid-up-to date, registering RTO, status, owner and owner count, class, maker and model, chassis and engine, financer, blacklist and NOC, from ${LOOKUP_PRICE} per successful search.`,
      }}
      buttons={[
        { label: 'Get API Key', href: '/contact' },
        { label: 'Talk to Us', href: '/contact' },
      ]}
      overview={{
        label: 'Registration details by API',
        title: 'The registration record of any vehicle, from its number',
        description: 'When, where and to whom it is registered, and whether it is still valid.',
        paragraphs: [
          <>
            Every vehicle in India has a registration record at its RTO. It says {s('when and where the vehicle was registered, until when the registration is valid, who owns it and how many owners it has had')}.
            Businesses need these details to onboard, insure, finance or buy a vehicle.
          </>,
          <>
            The {s('RTO Sarthi vehicle registration details API')} gives your software that record from the
            registration number in seconds: {s('REGN_DT, REGN_UPTO, REGISTERED_AT, STATUS and OWNER_SERIAL_NO')}, plus
            class, model, chassis and engine, financer, blacklist and NOC. It works for vehicles from{' '}
            {s('every state of India, including BH series')}, and starts at {s(`${LOOKUP_PRICE} per successful search`)}.
          </>,
          <>
            Need everything on the vehicle, including insurance, PUC, fitness and tax? See the{' '}
            <Link to="/vehicle-details-api" className={linkClass}>vehicle details API</Link> or the{' '}
            <Link to="/vahan-api" className={linkClass}>Vahan API</Link> page for every field.
          </>,
          <span className="text-sm">
            RTO Sarthi is an independent private software company. It does not register vehicles, is not the Vahan
            or Parivahan portal and is not affiliated with the Ministry of Road Transport and Highways or NIC.
          </span>,
        ],
      }}
      steps={{
        title: 'How the vehicle registration details API works',
        description: 'Live in your software, usually the same day.',
        items: [
          { title: 'Get an API key', description: 'Contact us and choose your search limit. We create a private API key for your business.' },
          { title: 'Send the registration number', description: 'Your app, form or backend sends any Indian vehicle registration number.' },
          { title: 'Use the registration details', description: 'Check registration validity, RTO, status and owner count, or save them to your records.' },
        ],
      }}
      code={{
        label: 'Sample response',
        title: 'Registration details in the API response',
        description: 'REGN_DT is the registration date, REGN_UPTO the validity, REGISTERED_AT the RTO and OWNER_SERIAL_NO the owner count.',
        blocks: [{ label: 'JSON response (registration fields)', code: responseExample }],
        note: 'Sample data, shortened. Details are returned wherever they are available on the vehicle record.',
      }}
      features={{
        label: 'Use cases',
        title: 'What you can do with a vehicle registration details API',
        description: 'Registration details from the number, for every kind of business.',
        items: [
          { icon: <IconDocument />, variant: 'brand', title: 'Registration validity checks', description: 'See if a vehicle’s registration is active and when it must be renewed.' },
          { icon: <IconMapPin />, variant: 'accent', title: 'Registering RTO & state', description: 'Know which RTO and state a vehicle belongs to, including BH series numbers.' },
          { icon: <IconUsers />, variant: 'success', title: 'Owner & owner count', description: 'See the registered owner and how many owners the vehicle has had.' },
          { icon: <IconShield />, variant: 'brand', title: 'Insurance onboarding', description: 'Fill registration date, RTO and class in proposals without asking the customer.' },
          { icon: <IconWallet />, variant: 'accent', title: 'Loans & NBFCs', description: 'Check registration status, owner and financer before you lend against a vehicle.' },
          { icon: <IconCar />, variant: 'success', title: 'Used vehicle checks', description: 'Check registration age, owners, blacklist and NOC before you buy or list a vehicle.' },
          { icon: <IconCode />, variant: 'brand', title: 'For app developers', description: 'Add registration lookup to your website or app with a simple JSON API.' },
          { icon: <IconCheck />, variant: 'accent', title: `From ${LOOKUP_PRICE}, pay on success`, description: 'Prepaid limit with no monthly fee. Vehicles not found are returned to your limit.' },
        ],
      }}
      checklist={{
        id: 'pricing',
        label: 'Pricing',
        title: `Vehicle registration details API from ${LOOKUP_PRICE} per search`,
        description: 'The full registration record in every successful search.',
        price: {
          caption: 'Starting at',
          amount: LOOKUP_PRICE,
          text: 'per successful search · no monthly fee',
        },
        listTitle: 'Registration details returned',
        items: [
          'Registration number', 'Registration date', 'Registration valid up to', 'Registering RTO & state',
          'Registration status', 'Owner name', 'Owner count', 'Vehicle class',
          'Maker & model', 'Chassis & engine number', 'Financer (hypothecation)', 'Blacklist & NOC status',
        ],
        note: 'Details are returned wherever they are available on the vehicle record.',
      }}
      audiences={{
        title: 'Who uses a vehicle registration details API?',
        description: 'Any business that needs a vehicle’s registration record.',
        items: [
          'Motor insurance platforms & brokers', 'Vehicle loan & NBFC companies', 'Used car dealers & marketplaces',
          'Fleet, cab & logistics operators', 'RTO agents & consultants', 'Software & app developers',
        ],
      }}
      related={[
        { to: '/vehicle-details-api', label: 'Vehicle details API India' },
        { to: '/vahan-api', label: 'Vahan API' },
        { to: '/vehicle-lookup-api', label: 'Vehicle lookup API' },
      ]}
      faq={{
        title: 'Vehicle registration details API — FAQ',
        description: 'Registration date, validity, RTO, price and coverage.',
        items: registrationDetailsApiFaqs,
      }}
      cta={{
        title: `Get vehicle registration details by API from ${LOOKUP_PRICE}`,
        text: 'Contact RTO Sarthi on call or WhatsApp for your API key and get the registration record of any vehicle number in seconds.',
      }}
    />
  )
}
