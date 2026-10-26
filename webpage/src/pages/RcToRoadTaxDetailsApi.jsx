import { Link } from 'react-router-dom'
import ProductLanding from '../components/ProductLanding'
import { IconShield, IconCheck, IconWallet, IconCar, IconCode, IconMapPin, IconDocument, IconSearch } from '../components/Icons'
import { roadTaxDetailsApiFaqs } from '../data/roadTaxDetailsApi'
import { LOOKUP_PRICE } from '../data/vehicleInfo'

const s = (t) => <strong className="text-slate-700">{t}</strong>
const linkClass = 'font-semibold text-brand-800 hover:underline'

const responseExample = `{
  "success": true,
  "message": "Vehicle details fetched successfully",
  "vehicleNumber": "MP09HG5823",
  "data": {
    "REGN_NO": "MP09HG5823",
    "STATUS": "ACTIVE",
    "VEHICLE_CLASS": "GOODS CARRIER (MGV)",
    "MAKER_MODEL": "ASHOK LEYLAND ECOMET 1615",
    "REGISTERED_AT": "INDORE RTO, MADHYA PRADESH",
    "TAX_UPTO": "31-Dec-2026",
    "PERMIT_NO": "MP2022-NP-8831C",
    "FIT_UPTO": "19-Jul-2027",
    "INSURANCE_UPTO": "04-Jul-2027",
    "PUCC_UPTO": "11-Jan-2027"
  },
  "usage": { "limit": 2000, "used": 655, "remaining": 1345 }
}`

export default function RcToRoadTaxDetailsApi() {
  return (
    <ProductLanding
      hero={{
        title: `RC to Road Tax Details API — Check Road Tax Validity by Vehicle Number from ${LOOKUP_PRICE}`,
        intro: `The RTO Sarthi RC to road tax details API takes any Indian vehicle (RC) number and returns the date its road tax is paid up to, or LTT for lifetime tax, as JSON, with vehicle class, registering RTO, permit number and fitness, insurance and PUC validity, from ${LOOKUP_PRICE} per successful search.`,
      }}
      buttons={[
        { label: 'Get API Key', href: '/contact' },
        { label: 'Talk to Us', href: '/contact' },
      ]}
      overview={{
        label: 'Road tax details by API',
        title: 'Road tax validity of any vehicle, from its RC number',
        description: 'See whose tax is paid, due or overdue, in seconds.',
        paragraphs: [
          <>
            Commercial vehicles pay {s('road tax')} every quarter or year. A truck, bus or taxi running with overdue
            tax can be stopped and fined, and its permit, transfer or loan can be held up until the tax and penalty
            are cleared.
          </>,
          <>
            The {s('RTO Sarthi RC to road tax details API')} gives your software the {s('tax paid up to date')}{' '}
            from the vehicle number, or {s('LTT')} when lifetime tax is paid, along with fitness, insurance and PUC
            validity, so you can {s('flag due and overdue tax automatically')}. It works for vehicles from{' '}
            {s('every state of India')} and starts at {s(`${LOOKUP_PRICE} per successful search`)}.
          </>,
          <>
            Need fitness validity too? See the{' '}
            <Link to="/vehicle-fitness-details-api" className={linkClass}>vehicle fitness details API</Link>. Not a
            developer? Check road tax and get WhatsApp reminders in the app with{' '}
            <Link to="/vehicle-information-software" className={linkClass}>vehicle information software</Link>.
          </>,
          <span className="text-sm">
            RTO Sarthi is an independent private software company. It is not the Vahan or Parivahan portal and is
            not affiliated with the Ministry of Road Transport and Highways or NIC.
          </span>,
        ],
      }}
      steps={{
        title: 'How the RC to road tax details API works',
        description: 'Live in your software, usually the same day.',
        items: [
          { title: 'Get an API key', description: 'Contact us and choose your search limit. We create a private API key for your business.' },
          { title: 'Send the RC number', description: 'Your app, fleet system or backend sends the vehicle registration number.' },
          { title: 'Get the tax validity', description: 'Read TAX_UPTO from the response and mark the vehicle paid, due, overdue or lifetime tax.' },
        ],
      }}
      code={{
        label: 'Sample response',
        title: 'Road tax details in the API response',
        description: 'TAX_UPTO is the date road tax is paid up to. It shows LTT when lifetime tax is paid.',
        blocks: [{ label: 'JSON response (road tax and validity fields)', code: responseExample }],
        note: 'Sample data, shortened. Details are returned wherever they are available on the vehicle record.',
      }}
      features={{
        label: 'Use cases',
        title: 'What you can do with an RC to road tax details API',
        description: 'Road tax validity by RC number, for every business that runs or checks vehicles.',
        items: [
          { icon: <IconCar />, variant: 'brand', title: 'Fleet tax compliance', description: 'Check road tax of every truck, bus and taxi in your fleet and see which are due or overdue.' },
          { icon: <IconDocument />, variant: 'accent', title: 'Tax renewal reminders', description: 'RTO agents can find vehicles whose tax is due and remind customers before penalties start.' },
          { icon: <IconCheck />, variant: 'success', title: 'Vehicle onboarding', description: 'Accept a commercial vehicle on your platform only when its tax is paid.' },
          { icon: <IconWallet />, variant: 'brand', title: 'Vehicle loans & purchase', description: 'Check for unpaid road tax before you finance or buy a used commercial vehicle.' },
          { icon: <IconShield />, variant: 'accent', title: 'Permit & transfer checks', description: 'See if tax is clear before applying for a permit, NOC or ownership transfer.' },
          { icon: <IconSearch />, variant: 'success', title: 'All documents in one call', description: 'Road tax, fitness, insurance and PUC validity together, so nothing due is missed.' },
          { icon: <IconCode />, variant: 'brand', title: 'For app developers', description: 'Add road tax checks by vehicle number to fleet, logistics and RTO apps with a simple JSON API.' },
          { icon: <IconMapPin />, variant: 'accent', title: 'All states of India', description: 'Commercial and private vehicles from any state, including BH series.' },
        ],
      }}
      checklist={{
        id: 'pricing',
        label: 'Pricing',
        title: `RC to road tax details API from ${LOOKUP_PRICE} per search`,
        description: 'Road tax validity and the full record in every successful search.',
        price: {
          caption: 'Starting at',
          amount: LOOKUP_PRICE,
          text: 'per successful search · no monthly fee',
        },
        listTitle: 'Returned with the road tax details',
        items: [
          'Tax paid up to', 'Lifetime tax (LTT)', 'Vehicle class', 'Registering RTO',
          'Registration status', 'Permit number', 'Fitness validity', 'Insurance validity',
          'PUC validity', 'Maker & model', 'Owner name', 'Financer (hypothecation)',
        ],
        note: 'Details are returned wherever they are available on the vehicle record.',
      }}
      audiences={{
        title: 'Who uses an RC to road tax details API?',
        description: 'Anyone who needs vehicles to stay tax-compliant.',
        items: [
          'Fleet & transport operators', 'RTO agents & consultants', 'Logistics & aggregator platforms',
          'Commercial vehicle loan & NBFC companies', 'Used commercial vehicle dealers', 'Bus, taxi & school transport operators',
        ],
      }}
      related={[
        { to: '/vehicle-fitness-details-api', label: 'Vehicle fitness details API' },
        { to: '/vehicle-puc-details-api', label: 'Vehicle PUC details API' },
        { to: '/vehicle-insurance-api', label: 'Vehicle insurance API' },
      ]}
      faq={{
        title: 'RC to road tax details API — FAQ',
        description: 'Tax validity, lifetime tax, use cases and price.',
        items: roadTaxDetailsApiFaqs,
      }}
      cta={{
        title: `Check road tax by RC number from ${LOOKUP_PRICE}`,
        text: 'Contact RTO Sarthi on call or WhatsApp for your API key and get the road tax validity of any vehicle in seconds.',
      }}
    />
  )
}
