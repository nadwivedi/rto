import { Link } from 'react-router-dom'
import ProductLanding from '../components/ProductLanding'
import { IconShield, IconCheck, IconWallet, IconCar, IconCode, IconMapPin, IconDocument, IconSearch } from '../components/Icons'
import { rcToRegistrationDateApiFaqs } from '../data/rcToRegistrationDateApi'
import { LOOKUP_PRICE } from '../data/vehicleInfo'

const s = (t) => <strong className="text-slate-700">{t}</strong>
const linkClass = 'font-semibold text-brand-800 hover:underline'

const responseExample = `{
  "success": true,
  "message": "Vehicle details fetched successfully",
  "vehicleNumber": "MH12QW4471",
  "data": {
    "REGN_NO": "MH12QW4471",
    "STATUS": "ACTIVE",
    "REGN_DT": "18-Aug-2020",
    "REGN_UPTO": "17-Aug-2035",
    "MANU_MONTH_YR": "07/2020",
    "REGISTERED_AT": "PUNE RTO, MAHARASHTRA",
    "MAKER_DESC": "MARUTI SUZUKI INDIA LTD",
    "MAKER_MODEL": "SWIFT VXI",
    "VEHICLE_CLASS": "MOTOR CAR (LMV)",
    "FUEL_DESC": "PETROL"
  },
  "usage": { "limit": 2000, "used": 734, "remaining": 1266 }
}`

export default function RcToRegistrationDateApi() {
  return (
    <ProductLanding
      hero={{
        title: `RC to Registration Date API — Get Vehicle Registration Date by Vehicle Number from ${LOOKUP_PRICE}`,
        intro: `The RTO Sarthi RC to registration date API takes any Indian vehicle (RC) number and returns the date it was first registered, with registration validity, manufacturing month and year, registering RTO and status as JSON, from ${LOOKUP_PRICE} per successful search.`,
      }}
      buttons={[
        { label: 'Get API Key', href: '/contact' },
        { label: 'Talk to Us', href: '/contact' },
      ]}
      overview={{
        label: 'Registration date by API',
        title: 'The registration date of any vehicle, from its RC number',
        description: 'Registration date and validity in seconds, ready to use.',
        paragraphs: [
          <>
            The {s('registration date')} tells you how old a vehicle really is on the road. It drives insurance
            premium and IDV, loan eligibility, used vehicle price and whether the vehicle is close to the end of its
            15-year registration.
          </>,
          <>
            The {s('RTO Sarthi RC to registration date API')} gives your software the registration date and{' '}
            {s('registration valid up to')} date from the vehicle number, along with the manufacturing month and
            year, so you can {s('work out vehicle age automatically')} instead of reading it off an RC copy. It works
            for vehicles from {s('every state of India')} and starts at {s(`${LOOKUP_PRICE} per successful search`)}.
          </>,
          <>
            Need the full registration record, including owner, financer and validity dates? See the{' '}
            <Link to="/vehicle-registration-details-api" className={linkClass}>vehicle registration details API</Link>.
            Not a developer? See the registration date in the app with{' '}
            <Link to="/vehicle-information-software" className={linkClass}>vehicle information software</Link>.
          </>,
          <span className="text-sm">
            RTO Sarthi is an independent private software company. It is not the Vahan or Parivahan portal and is
            not affiliated with the Ministry of Road Transport and Highways or NIC.
          </span>,
        ],
      }}
      steps={{
        title: 'How the RC to registration date API works',
        description: 'Live in your software, usually the same day.',
        items: [
          { title: 'Get an API key', description: 'Contact us and choose your search limit. We create a private API key for your business.' },
          { title: 'Send the RC number', description: 'Your app, form or backend sends the vehicle registration number.' },
          { title: 'Get the registration date', description: 'Read REGN_DT and REGN_UPTO from the response and calculate age, store or fill them.' },
        ],
      }}
      code={{
        label: 'Sample response',
        title: 'Registration date in the API response',
        description: 'REGN_DT is the registration date and REGN_UPTO the date the registration is valid up to.',
        blocks: [{ label: 'JSON response (registration date fields)', code: responseExample }],
        note: 'Sample data, shortened. Details are returned wherever they are available on the vehicle record.',
      }}
      features={{
        label: 'Use cases',
        title: 'What you can do with an RC to registration date API',
        description: 'Registration date from the RC number, for every kind of vehicle business.',
        items: [
          { icon: <IconShield />, variant: 'brand', title: 'Insurance premium & IDV', description: 'Use the registration date to find vehicle age for premium, IDV and add-on eligibility.' },
          { icon: <IconWallet />, variant: 'accent', title: 'Vehicle loans', description: 'Check vehicle age against your loan policy before you approve a used vehicle loan.' },
          { icon: <IconCar />, variant: 'success', title: 'Used vehicle pricing', description: 'Price a used car or bike by its real age on the road, not the seller’s word.' },
          { icon: <IconCheck />, variant: 'brand', title: 'End-of-life checks', description: 'Flag vehicles near the end of their 15-year registration or past age limits.' },
          { icon: <IconDocument />, variant: 'accent', title: 'Catch edited RC copies', description: 'Compare the registration date on the customer’s RC copy with the record.' },
          { icon: <IconSearch />, variant: 'success', title: 'Registration renewal leads', description: 'Find vehicles whose registration is due for renewal from REGN_UPTO.' },
          { icon: <IconCode />, variant: 'brand', title: 'For app developers', description: 'Add registration date lookup by vehicle number with a simple JSON API.' },
          { icon: <IconMapPin />, variant: 'accent', title: 'All states of India', description: 'Two-wheelers, cars and commercial vehicles from any state, including BH series.' },
        ],
      }}
      checklist={{
        id: 'pricing',
        label: 'Pricing',
        title: `RC to registration date API from ${LOOKUP_PRICE} per search`,
        description: 'Registration date and the full record in every successful search.',
        price: {
          caption: 'Starting at',
          amount: LOOKUP_PRICE,
          text: 'per successful search · no monthly fee',
        },
        listTitle: 'Returned with the registration date',
        items: [
          'Registration date', 'Registration valid up to', 'Manufacturing month & year', 'Registering RTO',
          'Registration status', 'Maker', 'Model & variant', 'Vehicle class & fuel',
          'Chassis & engine number', 'Owner name', 'Insurance & PUC validity', 'Financer (hypothecation)',
        ],
        note: 'Details are returned wherever they are available on the vehicle record.',
      }}
      audiences={{
        title: 'Who uses an RC to registration date API?',
        description: 'Anyone who needs to know how old a vehicle really is.',
        items: [
          'Motor insurance companies & agents', 'Vehicle loan & NBFC companies', 'Used car dealers & marketplaces',
          'Vehicle valuation & inspection firms', 'Fleet & transport operators', 'RTO agents & consultants',
        ],
      }}
      related={[
        { to: '/vehicle-registration-details-api', label: 'Vehicle registration details API' },
        { to: '/rc-to-chassis-number-api', label: 'RC to chassis number API' },
        { to: '/vehicle-details-api', label: 'Vehicle details API India' },
      ]}
      faq={{
        title: 'RC to registration date API — FAQ',
        description: 'Registration date, vehicle age, validity and price.',
        items: rcToRegistrationDateApiFaqs,
      }}
      cta={{
        title: `Get registration date by RC number from ${LOOKUP_PRICE}`,
        text: 'Contact RTO Sarthi on call or WhatsApp for your API key and get the registration date of any vehicle in seconds.',
      }}
    />
  )
}
