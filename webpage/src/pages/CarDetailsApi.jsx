import { Link } from 'react-router-dom'
import ProductLanding from '../components/ProductLanding'
import { IconCar, IconShield, IconWallet, IconClock, IconCode, IconChart, IconMapPin, IconCheck } from '../components/Icons'
import { carDetailsApiFaqs } from '../data/carDetailsApi'
import { LOOKUP_PRICE } from '../data/vehicleInfo'

const s = (t) => <strong className="text-slate-700">{t}</strong>
const linkClass = 'font-semibold text-brand-800 hover:underline'

const responseExample = `{
  "success": true,
  "message": "Vehicle details fetched successfully",
  "vehicleNumber": "TS09FK6210",
  "data": {
    "REGN_NO": "TS09FK6210",
    "STATUS": "ACTIVE",
    "MAKER_DESC": "KIA INDIA PRIVATE LIMITED",
    "MAKER_MODEL": "SELTOS HTX 1.5",
    "VEHICLE_CLASS": "MOTOR CAR (LMV)",
    "BODY_TYPE": "SALOON",
    "FUEL_DESC": "PETROL",
    "NORMS_DESC": "BHARAT STAGE VI",
    "CUBIC_CAP": "1497",
    "SEAT_CAP": "5",
    "COLOR": "GRAVITY GREY",
    "MANU_MONTH_YR": "04/2021",
    "REGN_DT": "12-May-2021",
    "OWNER_SERIAL_NO": "2",
    "CHASI_NO": "MZBEN813LMN123456",
    "ENG_NO": "G4FLMU123456",
    "INSURANCE_COMP": "BAJAJ ALLIANZ GENERAL INSURANCE CO. LTD.",
    "INSURANCE_UPTO": "11-May-2027",
    "PUCC_UPTO": "20-Jan-2027"
  },
  "usage": { "limit": 3000, "used": 975, "remaining": 2025 }
}`

export default function CarDetailsApi() {
  return (
    <ProductLanding
      hero={{
        title: `Car Details API — Get Car Model, Variant, Fuel & Insurance by Number from ${LOOKUP_PRICE}`,
        intro: `The RTO Sarthi car details API takes any Indian car number and returns the maker, model and variant, fuel, CC, seating, colour, manufacturing year, owner count, chassis and engine number, insurance and PUC validity as JSON in seconds, from ${LOOKUP_PRICE} per successful search.`,
      }}
      buttons={[
        { label: 'Get API Key', href: '/contact' },
        { label: 'Talk to Us', href: '/contact' },
      ]}
      overview={{
        label: 'Car details by API',
        title: 'Everything about a car, from its number plate',
        description: 'Model, variant, specs, owners and insurance in one request.',
        paragraphs: [
          <>
            Used car sellers, car insurance platforms, rental companies and car service apps all start with the
            same question: {s('which car is this?')} Asking customers to pick the make, model, variant, fuel and
            year from long dropdowns is slow, and they often pick the wrong one.
          </>,
          <>
            The {s('RTO Sarthi car details API')} answers it from the registration number. Your software gets the
            {s(' maker, model and variant, fuel, CC, seating, colour and manufacturing year')}, plus the owner count,
            chassis and engine number and insurance details. It works for cars from {s('every state of India')} and
            starts at {s(`${LOOKUP_PRICE} per successful search`)}.
          </>,
          <>
            Only need make and model? See the{' '}
            <Link to="/vehicle-make-and-model-api" className={linkClass}>vehicle make and model API</Link>. For bikes,
            trucks and every other vehicle, see the{' '}
            <Link to="/vehicle-details-api" className={linkClass}>vehicle details API</Link>.
          </>,
          <span className="text-sm">
            RTO Sarthi is an independent private software company. It is not the Vahan or Parivahan portal and is
            not affiliated with the Ministry of Road Transport and Highways or NIC.
          </span>,
        ],
      }}
      steps={{
        title: 'How the car details API works',
        description: 'Live in your website or app, usually the same day.',
        items: [
          { title: 'Get an API key', description: 'Contact us and choose your search limit. We create a private API key for your business.' },
          { title: 'Send the car number', description: 'Your user types their car number instead of picking make, model and year.' },
          { title: 'Auto-fill car details', description: 'Fill your form, quote or listing with model, variant, fuel, year and insurance from the JSON.' },
        ],
      }}
      code={{
        label: 'Sample response',
        title: 'Car details in the API response',
        description: 'MAKER_MODEL is the model and variant, MANU_MONTH_YR the manufacturing date and OWNER_SERIAL_NO the owner count.',
        blocks: [{ label: 'JSON response (car fields)', code: responseExample }],
        note: 'Sample data, shortened. Details are returned wherever they are available on the vehicle record.',
      }}
      features={{
        label: 'Use cases',
        title: 'What you can build with a car details API',
        description: 'Car details from the number plate, for every kind of car business.',
        items: [
          { icon: <IconCar />, variant: 'brand', title: 'Used car listings', description: 'Fill a listing from the car number: model, variant, fuel, year, colour and number of owners.' },
          { icon: <IconShield />, variant: 'accent', title: 'Car insurance quotes', description: 'Get model, variant, CC and registration date for the quote, and see the previous insurer.' },
          { icon: <IconWallet />, variant: 'success', title: 'Car loans & valuation', description: 'Check model, year, owner count and financer before you value or lend against a car.' },
          { icon: <IconClock />, variant: 'brand', title: 'Car service & accessories', description: 'Show the right service plan, parts and accessories for the exact model and fuel.' },
          { icon: <IconChart />, variant: 'accent', title: 'Car rental & subscription', description: 'Verify every car in your fleet and track insurance and PUC validity.' },
          { icon: <IconCode />, variant: 'success', title: 'Car apps & startups', description: 'Add car number lookup to your app with a simple JSON API and help on WhatsApp.' },
          { icon: <IconMapPin />, variant: 'brand', title: 'All states of India', description: 'Cars registered in any state or union territory, including BH series.' },
          { icon: <IconCheck />, variant: 'accent', title: `From ${LOOKUP_PRICE}, pay on success`, description: 'Prepaid limit with no monthly fee. Cars not found are returned to your limit.' },
        ],
      }}
      checklist={{
        id: 'pricing',
        label: 'Pricing',
        title: `Car details API from ${LOOKUP_PRICE} per search`,
        description: 'Full car details in every successful search.',
        price: {
          caption: 'Starting at',
          amount: LOOKUP_PRICE,
          text: 'per successful search · no monthly fee',
        },
        listTitle: 'Car details returned',
        items: [
          'Maker', 'Model & variant', 'Body type & class', 'Fuel type',
          'Engine CC & emission norms', 'Seating capacity', 'Colour', 'Manufacturing month & year',
          'Registration date & status', 'Owner count', 'Chassis & engine number', 'Insurance & PUC validity',
        ],
        note: 'Details are returned wherever they are available on the vehicle record.',
      }}
      audiences={{
        title: 'Who uses a car details API?',
        description: 'Any business that works with cars.',
        items: [
          'Used car dealers & marketplaces', 'Car insurance platforms & brokers', 'Car loan & valuation companies',
          'Car rental & subscription companies', 'Car service, parts & accessories sellers', 'Automotive app developers',
        ],
      }}
      related={[
        { to: '/motorcycle-api-india', label: 'Motorcycle API India' },
        { to: '/car-information-api', label: 'Car information API' },
        { to: '/vehicle-make-and-model-api', label: 'Vehicle make and model API' },
        { to: '/vehicle-details-api', label: 'Vehicle details API India' },
        { to: '/vehicle-insurance-api', label: 'Vehicle insurance API' },
      ]}
      faq={{
        title: 'Car details API — FAQ',
        description: 'Car model, owners, insurance, price and integration.',
        items: carDetailsApiFaqs,
      }}
      cta={{
        title: `Get car details by API from ${LOOKUP_PRICE}`,
        text: 'Contact RTO Sarthi on call or WhatsApp for your API key and get model, variant, fuel, year and insurance for any car number.',
      }}
    />
  )
}
