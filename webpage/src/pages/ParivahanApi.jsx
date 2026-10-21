import { Link } from 'react-router-dom'
import ProductLanding from '../components/ProductLanding'
import { IconWallet, IconCheck, IconClock, IconDocument, IconChart, IconShield, IconMapPin, IconCode } from '../components/Icons'
import { parivahanApiFaqs } from '../data/parivahanApi'
import { LOOKUP_PRICE } from '../data/vehicleInfo'
import { requestBlock } from '../data/vehicleApi'

const s = (t) => <strong className="text-slate-700">{t}</strong>
const linkClass = 'font-semibold text-brand-800 hover:underline'

const responseExample = `{
  "success": true,
  "message": "Vehicle details fetched successfully",
  "vehicleNumber": "DL3CBX7781",
  "data": {
    "REGN_NO": "DL3CBX7781",
    "STATUS": "ACTIVE",
    "REGISTERED_AT": "SHEIKH SARAI RTO, DELHI",
    "OWNER_NAME": "RAHUL VERMA",
    "VEHICLE_CLASS": "MOTOR CAR (LMV)",
    "MAKER_DESC": "HYUNDAI MOTOR INDIA LTD",
    "MAKER_MODEL": "CRETA SX",
    "FUEL_DESC": "DIESEL",
    "CHASI_NO": "MALPC81DLNM123456",
    "ENG_NO": "D4FALM123456",
    "REGN_DT": "21-Jun-2022",
    "FINANCER_DETAILS": "AXIS BANK LTD",
    "INSURANCE_COMP": "TATA AIG GENERAL INSURANCE CO. LTD.",
    "INSURANCE_UPTO": "20-Jun-2027",
    "PUCC_UPTO": "11-Jan-2027",
    "TAX_UPTO": "LTT",
    "BLACKLIST_STATUS": "NA"
  },
  "usage": { "limit": 5000, "used": 870, "remaining": 4130 }
}`

export default function ParivahanApi() {
  return (
    <ProductLanding
      hero={{
        title: `Parivahan API to Get Vehicle Details — Cost from ${LOOKUP_PRICE} per Search`,
        intro: `Use the RTO Sarthi Parivahan API to get vehicle details from any Indian vehicle number: owner, model, chassis and engine number, insurance, PUC, fitness, tax, financer and blacklist status, as JSON in seconds. The Parivahan API cost starts at just ${LOOKUP_PRICE} per successful search, with no monthly fee.`,
      }}
      buttons={[
        { label: 'Get API Key', href: '/contact' },
        { label: 'Ask for a Quote', href: '/contact' },
      ]}
      overview={{
        label: 'Parivahan API',
        title: 'A Parivahan API to get vehicle details inside your software',
        description: 'Vehicle details from Parivahan data, without searching the website by hand.',
        paragraphs: [
          <>
            {s('Parivahan')} is the Government of India’s transport portal, and its vehicle records come from Vahan,
            the registration system every RTO uses. Anyone can search one vehicle at a time on the website, but a
            business that checks hundreds of vehicles needs those details inside its own software.
          </>,
          <>
            The {s('RTO Sarthi Parivahan API')} does that. Your website, app or CRM sends a vehicle number and gets
            the RC details back as JSON: {s('owner, RTO, maker and model, chassis and engine number')}, registration
            date, financer, insurance, PUC, fitness, tax, blacklist and NOC, for every state of India.
          </>,
          <>
            Getting direct access from the government means a formal approval process that most businesses cannot
            use. With RTO Sarthi you get an API key {s('the same day')}, and the cost starts at{' '}
            {s(`${LOOKUP_PRICE} per successful search`)}.
          </>,
          <>
            See every field on the <Link to="/vahan-api" className={linkClass}>Vahan API</Link> page, or use cases on
            the <Link to="/vehicle-details-api" className={linkClass}>vehicle details API India</Link> page. Without
            software of your own, use{' '}
            <Link to="/vehicle-information-software" className={linkClass}>vehicle information software</Link>.
          </>,
          <span className="text-sm">
            RTO Sarthi is an independent private software company. It is not the Parivahan or Vahan portal and is
            not affiliated with the Ministry of Road Transport and Highways or NIC.
          </span>,
        ],
      }}
      steps={{
        title: 'How to get vehicle details with the Parivahan API',
        description: 'Usually live the same day.',
        items: [
          { title: 'Get your API key', description: 'Contact us, choose your search limit and pay in rupees. We create a private API key for your business.' },
          { title: 'Connect your software', description: 'Your developer adds the API to your website, app or CRM with our guide. We help you test it.' },
          { title: 'Send vehicle numbers', description: 'Every vehicle number returns its details as JSON, with remaining searches in each response.' },
        ],
      }}
      code={{
        label: 'API demo',
        title: 'Parivahan API response for a vehicle number',
        description: 'Cars, bikes, commercial vehicles and BH series numbers return the same fields.',
        blocks: [requestBlock('DL3CBX7781'), { label: 'JSON response', code: responseExample }],
        note: 'Sample data. Details are returned wherever they are available on the vehicle record.',
      }}
      features={[{
        id: 'cost',
        label: 'Parivahan API cost',
        title: `Parivahan API cost: what you pay and why it stays low`,
        description: 'Simple, prepaid pricing with no hidden charges.',
        items: [
          { icon: <IconWallet />, variant: 'brand', title: `From ${LOOKUP_PRICE} per search`, description: 'One of the lowest Parivahan API prices in India. Your rate depends on the search limit you buy.' },
          { icon: <IconCheck />, variant: 'accent', title: 'Pay only for successful searches', description: 'Vehicles not found are returned to your limit, so you never pay for an empty result.' },
          { icon: <IconClock />, variant: 'success', title: 'No monthly or setup fee', description: 'Buy a prepaid search limit and use it at your own pace. Recharge only when it runs low.' },
          { icon: <IconDocument />, variant: 'brand', title: 'GST invoice', description: 'Pay in rupees and get a GST invoice for every recharge, ready for your accounts.' },
        ],
      }, {
        title: 'Why use the RTO Sarthi Parivahan API',
        description: 'Everything you need to get vehicle details from a vehicle number.',
        items: [
          { icon: <IconShield />, variant: 'accent', title: 'No government approval process', description: 'Get your API key the same day instead of waiting on a formal application.' },
          { icon: <IconMapPin />, variant: 'success', title: 'All states & BH series', description: 'Vehicle numbers from every state and union territory of India, including Bharat series.' },
          { icon: <IconCode />, variant: 'brand', title: 'Clean JSON', description: 'Works with PHP, Node.js, Python, Java, .NET and no-code tools.' },
          { icon: <IconChart />, variant: 'accent', title: 'Usage in every response', description: 'Every response shows your limit, used and remaining searches, so cost is always clear.' },
        ],
      }]}
      checklist={{
        id: 'pricing',
        label: 'Pricing',
        title: `Parivahan API price from ${LOOKUP_PRICE} per search`,
        description: `At ${LOOKUP_PRICE}, 10,000 successful searches cost ₹15,000 plus GST.`,
        price: {
          caption: 'Starting at',
          amount: LOOKUP_PRICE,
          text: 'per successful search · no monthly fee · GST invoice',
        },
        listTitle: 'Vehicle details in every Parivahan API search',
        items: [
          'Owner name & address', 'Registering RTO & status', 'Maker & model', 'Vehicle class & fuel',
          'Chassis & engine number', 'Registration date & validity', 'Financer (hypothecation)', 'Insurance company & validity',
          'PUC validity', 'Fitness & road tax validity', 'Blacklist status', 'NOC details',
        ],
        note: 'Details are returned wherever they are available on the vehicle record.',
      }}
      audiences={{
        title: 'Who uses a Parivahan API for vehicle details?',
        description: 'Businesses that check vehicles every day.',
        items: [
          'Motor insurance companies & agents', 'Used car platforms & dealers', 'Vehicle loan & NBFC companies',
          'Fleet, logistics & cab operators', 'RTO agents & consultants', 'Software & app developers',
        ],
      }}
      related={[
        { to: '/vahan-api', label: 'Vahan API' },
        { to: '/vehicle-details-api', label: 'Vehicle details API India' },
        { to: '/vehicle-lookup-api', label: 'Vehicle lookup API' },
        { to: '/vehicle-information-api', label: 'Vehicle information API' },
      ]}
      faq={{
        title: 'Parivahan API — FAQ',
        description: 'Vehicle details, cost, official access and getting started.',
        items: parivahanApiFaqs,
      }}
      cta={{
        title: `Get the Parivahan API from ${LOOKUP_PRICE} per search`,
        text: 'Contact RTO Sarthi on call or WhatsApp for your API key or a quote for your search volume, and start getting vehicle details today.',
      }}
    />
  )
}
