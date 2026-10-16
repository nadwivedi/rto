import ProductLanding from '../components/ProductLanding'
import { IconWallet, IconCheck, IconShield, IconChart, IconCar, IconClock, IconDocument, IconMapPin } from '../components/Icons'
import { vehicleInfoApiFaqs, API_ENDPOINT } from '../data/vehicleInfoApi'
import { LOOKUP_PRICE } from '../data/vehicleInfo'

const s = (t) => <strong className="text-slate-700">{t}</strong>

const curlExample = `curl -H "x-api-key: YOUR_API_KEY" \\
  "${API_ENDPOINT}?vno=CG12BU5574"`

const responseExample = `{
  "success": true,
  "vehicleNumber": "CG12BU5574",
  "data": {
    "OWNER_NAME": "RAM KUMAR",
    "MAKER_MODEL": "ACE GOLD",
    "FUEL_DESC": "DIESEL",
    "REGN_DT": "15-Jun-2019",
    "INSURANCE_UPTO": "12-Mar-2027",
    ...
  },
  "usage": { "limit": 1000, "used": 101, "remaining": 899 }
}`

const nodeExample = `const res = await fetch('${API_ENDPOINT}?vno=CG12BU5574', {
  headers: { 'x-api-key': process.env.RTO_SARTHI_API_KEY }
})
const body = await res.json()

if (body.success) console.log(body.data, body.usage.remaining)
else console.log(body.message)`

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
            response tells you how many searches you have left.
          </>,
        ],
      }}
      steps={{
        title: 'How to start with the vehicle information API',
        description: 'Three steps from API key to your first search.',
        items: [
          { title: 'Get your API key', description: 'Contact us and choose your search limit. We create your API key and share the integration guide.' },
          { title: 'Call the API', description: 'Send a GET request with the vehicle number and your key in the x-api-key header.' },
          { title: 'Use the details', description: 'Read the JSON response in your software and recharge when your remaining searches run low.' },
        ],
      }}
      code={{
        title: 'Simple REST API, one request',
        description: 'Send the vehicle number, get JSON back.',
        blocks: [
          { label: 'Request (curl)', code: curlExample },
          { label: 'Response', code: responseExample },
          { label: 'Node.js', code: nodeExample },
        ],
        note: 'Errors return success: false with a message: 400 invalid number, 401 wrong key, 403 limit used up, 404 vehicle not found, 502 try again.',
      }}
      features={{
        title: 'Why choose RTO Sarthi as your vehicle information API provider',
        description: 'Low price, complete details and simple integration.',
        items: [
          { icon: <IconWallet />, variant: 'success', title: `From ${LOOKUP_PRICE} per search`, description: 'Prepaid searches with no monthly fee. Recharge whenever you need more.' },
          { icon: <IconCheck />, variant: 'brand', title: 'Pay only for successful searches', description: 'If the vehicle is not found or the service is busy, the search goes back to your limit.' },
          { icon: <IconCar />, variant: 'accent', title: 'Complete RC details', description: 'Owner, maker and model, chassis and engine number, registration, insurance, tax, fitness and PUC in one response.' },
          { icon: <IconMapPin />, variant: 'brand', title: 'All states of India', description: 'Search vehicles registered in any state or union territory.' },
          { icon: <IconChart />, variant: 'success', title: 'Usage in every response', description: 'Limit, used and remaining searches come back with each call, so you always know your balance.' },
          { icon: <IconClock />, variant: 'accent', title: 'Fast JSON response', description: 'One GET request returns the details in seconds, ready to show or save in your system.' },
          { icon: <IconShield />, variant: 'brand', title: 'Secure API key', description: 'Your key is sent in a header. A leaked key can be switched off and replaced at once.' },
          { icon: <IconDocument />, variant: 'success', title: 'Clear guide & support', description: 'Short integration guide with curl and code examples, and direct support from our Raipur team.' },
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
          'Owner name', 'Maker & model', 'Vehicle class & fuel', 'Chassis & engine number',
          'Registration date & validity', 'Insurance company & validity', 'Road tax validity', 'Fitness validity',
          'PUC validity', 'Financer (HP) details', 'Permit details', 'Blacklist status',
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
      ]}
      faq={{
        title: 'Vehicle information API — FAQ',
        description: 'Pricing, data and integration.',
        items: vehicleInfoApiFaqs,
      }}
      cta={{
        title: `Get vehicle details in your software from ${LOOKUP_PRICE} per search`,
        text: 'Contact RTO Sarthi for your API key and start calling the vehicle information API today.',
      }}
    />
  )
}
