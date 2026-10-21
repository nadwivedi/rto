import { Link } from 'react-router-dom'
import ProductLanding from '../components/ProductLanding'
import { IconWallet, IconCheck, IconShield, IconChart, IconCar, IconClock, IconDocument, IconMapPin } from '../components/Icons'
import { vehicleInfoApiFaqs } from '../data/vehicleInfoApi'
import { LOOKUP_PRICE } from '../data/vehicleInfo'
import { requestBlock } from '../data/vehicleApi'

const s = (t) => <strong className="text-slate-700">{t}</strong>

const responseExample = `{
  "success": true,
  "message": "Vehicle details fetched successfully",
  "vehicleNumber": "CG04AB1234",
  "data": {
    "OWNER_NAME": "RAM KUMAR",
    "PRESENT_ADDRESS": "WARD NO 12, TELIBANDHA, RAIPUR, CHHATTISGARH 492001",
    "MAKER_DESC": "TATA MOTORS LTD",
    "MAKER_MODEL": "ACE GOLD",
    "FUEL_DESC": "DIESEL",
    "COLOR": "WHITE",
    "CHASI_NO": "MAT445123K1A12345",
    "ENG_NO": "275IDI12ABC345",
    "REGN_DT": "15-Jun-2019",
    "REGN_UPTO": "14-Jun-2034",
    "INSURANCE_COMP": "TATA AIG GENERAL INSURANCE CO. LTD.",
    "INS_POLICY_NO": "0164123456",
    "INSURANCE_UPTO": "12-Mar-2027",
    "PUCC_NO": "CG01200030012345",
    "PUCC_UPTO": "20-Dec-2026",
    "FIT_UPTO": "14-Jun-2027",
    "TAX_UPTO": "31-Mar-2027"
  },
  "usage": { "limit": 1000, "used": 101, "remaining": 899 }
}`

export default function VehicleInformationApi() {
  return (
    <ProductLanding
      hero={{
        title: `Vehicle Information API — RC Details by Vehicle Number from ${LOOKUP_PRICE} per Search`,
        intro: `RTO Sarthi is a vehicle information API provider for India. Send a vehicle number, get the complete RC details as JSON: owner, model, chassis, engine, registration, insurance, tax, fitness and PUC. Pricing starts at just ${LOOKUP_PRICE} per search.`,
      }}
      buttons={[
        { label: 'Get API Key', href: '/contact' },
        { label: 'Talk to Us', href: '/contact' },
      ]}
      overview={{
        title: `Vehicle information API starting at ${LOOKUP_PRICE} per search`,
        description: 'RC details for your software, website or app.',
        paragraphs: [
          <>
            Insurance, used car, finance, fleet and parking software all need the same thing: the
            correct details of a vehicle from its registration number. Typing them in by hand is
            slow and full of mistakes.
          </>,
          <>
            With the {s('RTO Sarthi Vehicle Information API')} your system sends a vehicle number
            and gets the RC details back in seconds as clean JSON. Pricing starts at{' '}
            {s(`${LOOKUP_PRICE} per search`)}, you pay only for successful searches, and every
            response tells you how many searches you have left. See every field the API returns on
            our <Link to="/vahan-api" className="font-semibold text-brand-800 hover:underline">Vahan API for vehicle details</Link> page.
          </>,
        ],
      }}
      steps={{
        title: 'How to start with the vehicle information API',
        description: 'Three steps from API key to your first search.',
        items: [
          { title: 'Get your API key', description: 'Contact us and choose your search limit. We create your API key and share the integration guide.' },
          { title: 'Connect your software', description: 'Our team helps you connect the API to your software, website or app.' },
          { title: 'Use the details', description: 'Read the JSON response in your software and recharge when your remaining searches run low.' },
        ],
      }}
      code={{
        label: 'API demo',
        title: 'Complete vehicle details in one JSON response',
        description: 'Owner and address, chassis and engine number, insurance, PUC, fitness and tax.',
        blocks: [requestBlock('CG04AB1234'), { label: 'JSON response', code: responseExample }],
        note: 'Sample data. Details are returned wherever they are available on the vehicle record.',
      }}
      features={{
        title: 'Why choose RTO Sarthi as your vehicle information API provider',
        description: 'Low price, complete details and simple integration.',
        items: [
          { icon: <IconWallet />, variant: 'success', title: `From ${LOOKUP_PRICE} per search`, description: 'Prepaid searches with no monthly fee. Recharge whenever you need more.' },
          { icon: <IconCheck />, variant: 'brand', title: 'Pay only for successful searches', description: 'If the vehicle is not found or the service is busy, the search goes back to your limit.' },
          { icon: <IconCar />, variant: 'accent', title: 'Complete RC details', description: 'Owner and address, maker and model, chassis and engine number, insurance, PUC, fitness and tax in one response.' },
          { icon: <IconMapPin />, variant: 'brand', title: 'All states of India', description: 'Search vehicles registered in any state or union territory.' },
          { icon: <IconChart />, variant: 'success', title: 'Usage in every response', description: 'Limit, used and remaining searches come back with each call, so you always know your balance.' },
          { icon: <IconClock />, variant: 'accent', title: 'Fast JSON response', description: 'Vehicle details come back in seconds, ready to show or save in your system.' },
          { icon: <IconShield />, variant: 'brand', title: 'Secure API key', description: 'Every customer gets a private API key. A leaked key can be switched off and replaced at once.' },
          { icon: <IconDocument />, variant: 'success', title: 'Integration help & support', description: 'We share the integration guide with your API key, and our Raipur team helps you connect it.' },
        ],
      }}
      checklist={{
        id: 'pricing',
        label: 'Pricing',
        title: `Vehicle information API pricing from ${LOOKUP_PRICE}`,
        description: 'What every search gives you.',
        price: {
          caption: 'Starting at',
          amount: LOOKUP_PRICE,
          text: 'per successful search · no monthly fee',
        },
        listTitle: 'Details returned by the API',
        items: [
          'Owner name & address', 'Maker & model', 'Vehicle class & fuel', 'Chassis & engine number',
          'Registration date & validity', 'Insurance company & validity', 'Road tax validity', 'Fitness validity',
          'PUC validity', 'Financer (HP) details', 'PUC number', 'Insurance policy number',
        ],
        note: 'Details are returned wherever they are available on the vehicle record.',
      }}
      audiences={{
        title: 'Who uses the vehicle information API?',
        description: 'Any business that works with vehicle numbers.',
        items: [
          'Insurance companies & agents', 'Used car platforms & dealers', 'Loan & vehicle finance companies',
          'Fleet & logistics companies', 'Parking, toll & security systems', 'Software & app developers',
        ],
      }}
      related={[
        { to: '/vehicle-information-software', label: 'Vehicle information software' },
        { to: '/rc-verification-software', label: 'RC verification software' },
        { to: '/rc-download-software', label: 'RC download software' },
        { to: '/vahan-api', label: 'Vahan API for vehicle details' },
        { to: '/vehicle-details-api', label: 'Vehicle details API India' },
        { to: '/vehicle-make-and-model-api', label: 'Vehicle make and model API' },
        { to: '/vehicle-lookup-api', label: 'Vehicle lookup API' },
      ]}
      faq={{
        title: 'Vehicle information API — FAQ',
        description: 'Pricing, data and API keys.',
        items: vehicleInfoApiFaqs,
      }}
      cta={{
        title: `Get vehicle details in your software from ${LOOKUP_PRICE} per search`,
        text: 'Contact RTO Sarthi for your API key and start calling the vehicle information API today.',
      }}
    />
  )
}
