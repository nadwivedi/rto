import { Link } from 'react-router-dom'
import ProductLanding from '../components/ProductLanding'
import { IconShield, IconClock, IconWhatsApp, IconChart, IconCar, IconMapPin, IconCheck, IconCode } from '../components/Icons'
import { insuranceApiFaqs } from '../data/insuranceApi'
import { LOOKUP_PRICE } from '../data/vehicleInfo'

const s = (t) => <strong className="text-slate-700">{t}</strong>
const linkClass = 'font-semibold text-brand-800 hover:underline'

const responseExample = `{
  "success": true,
  "message": "Vehicle details fetched successfully",
  "vehicleNumber": "GJ01RT2468",
  "data": {
    "REGN_NO": "GJ01RT2468",
    "MAKER_DESC": "MAHINDRA & MAHINDRA LTD",
    "MAKER_MODEL": "BOLERO PIK-UP",
    "VEHICLE_CLASS": "GOODS CARRIER",
    "FUEL_DESC": "DIESEL",
    "REGN_DT": "21-Jan-2020",
    "INSURANCE_COMP": "THE NEW INDIA ASSURANCE CO. LTD.",
    "INS_POLICY_NO": "21010031230100004567",
    "INSURANCE_UPTO": "20-Jan-2027",
    "PUCC_UPTO": "14-Jul-2026",
    "FIT_UPTO": "20-Jan-2027",
    "TAX_UPTO": "31-Mar-2027"
  },
  "usage": { "limit": 1000, "used": 412, "remaining": 588 }
}`

export default function VehicleInsuranceApi() {
  return (
    <ProductLanding
      hero={{
        title: `Vehicle Insurance API — Check Insurer, Policy Number & Expiry by Vehicle Number from ${LOOKUP_PRICE}`,
        intro: `The RTO Sarthi vehicle insurance API checks any Indian vehicle number and returns the insurance company, policy number and insurance valid-up-to date as JSON, with maker, model, fuel, registration and PUC, fitness and tax validity, from ${LOOKUP_PRICE} per successful search.`,
      }}
      buttons={[
        { label: 'Get API Key', href: '/contact' },
        { label: 'Talk to Us', href: '/contact' },
      ]}
      overview={{
        label: 'Insurance by API',
        title: 'Know any vehicle’s insurance status from its number',
        description: 'Active, expiring soon or expired, checked automatically in your software.',
        paragraphs: [
          <>
            Insurance agents, platforms, fleet owners and dealers all ask the same question about a vehicle:
            {s(' is it insured, with whom, and until when?')} Asking the customer for a policy copy is slow, and the
            copy is often old.
          </>,
          <>
            The {s('RTO Sarthi vehicle insurance API')} answers it from the vehicle number. Your software gets the
            current insurer, policy number and valid-up-to date from the registration record, plus the maker,
            model, fuel and registration date you need to prepare a renewal quote. It works for vehicles from{' '}
            {s('every state of India')} and starts at {s(`${LOOKUP_PRICE} per successful search`)}.
          </>,
          <>
            Not a developer? RTO and insurance agents can check insurance in the app with{' '}
            <Link to="/vehicle-information-software" className={linkClass}>vehicle information software</Link> and send
            automatic{' '}
            <Link to="/vehicle-document-expiry-reminder-software" className={linkClass}>WhatsApp insurance expiry reminders</Link>.
            For every field the API returns, see the{' '}
            <Link to="/vahan-api" className={linkClass}>Vahan API</Link> page.
          </>,
          <span className="text-sm">
            RTO Sarthi is an independent private software company, not an insurance company. It is not the Vahan or
            Parivahan portal and is not affiliated with the Ministry of Road Transport and Highways or NIC. The API
            returns existing insurance details and does not give premium quotes or issue policies.
          </span>,
        ],
      }}
      steps={{
        title: 'How the vehicle insurance API works',
        description: 'Live in your software, usually the same day.',
        items: [
          { title: 'Get an API key', description: 'Contact us and choose your search limit. We create a private API key for your business.' },
          { title: 'Send the vehicle number', description: 'Your app, CRM or insurance platform sends the number the customer entered.' },
          { title: 'Read insurance status', description: 'Use insurer, policy number and expiry date to verify cover, plan the renewal or flag expired vehicles.' },
        ],
      }}
      code={{
        label: 'Sample response',
        title: 'Insurance details in the API response',
        description: 'INSURANCE_COMP is the insurer, INS_POLICY_NO the policy number and INSURANCE_UPTO the expiry date.',
        blocks: [{ label: 'JSON response (insurance fields)', code: responseExample }],
        note: 'Sample data, shortened. Details are returned wherever they are available on the vehicle record.',
      }}
      features={{
        label: 'Use cases',
        title: 'What you can do with a vehicle insurance API',
        description: 'Insurance status from the number plate, for every kind of business.',
        items: [
          { icon: <IconClock />, variant: 'brand', title: 'Renewal leads for agents', description: 'See when a policy expires and who the current insurer is, and contact the customer before renewal.' },
          { icon: <IconShield />, variant: 'accent', title: 'Faster insurance quotes', description: 'Auto-fill maker, model, fuel and registration date from the number, plus the previous insurer.' },
          { icon: <IconChart />, variant: 'success', title: 'Fleet insurance compliance', description: 'Check every truck, bus or cab in your fleet and flag vehicles with expired or expiring insurance.' },
          { icon: <IconCar />, variant: 'brand', title: 'Used car & dealer checks', description: 'Confirm a vehicle is insured before you buy, sell or hand it over to a customer.' },
          { icon: <IconWhatsApp />, variant: 'whatsapp', title: 'Expiry reminders', description: 'Feed insurance dates into your reminder system, or use RTO Sarthi’s automatic WhatsApp reminders.' },
          { icon: <IconCode />, variant: 'accent', title: 'Insurtech & app developers', description: 'Add insurance status by vehicle number to your insurance, fleet or vehicle app.' },
          { icon: <IconMapPin />, variant: 'success', title: 'All states of India', description: 'Two-wheelers, cars and commercial vehicles registered in any state or union territory.' },
          { icon: <IconCheck />, variant: 'brand', title: `From ${LOOKUP_PRICE}, pay on success`, description: 'Prepaid search limit with no monthly fee. Vehicles not found are returned to your limit.' },
        ],
      }}
      checklist={{
        id: 'pricing',
        label: 'Pricing',
        title: `Vehicle insurance API from ${LOOKUP_PRICE} per search`,
        description: 'Insurance and related details in every successful search.',
        price: {
          caption: 'Starting at',
          amount: LOOKUP_PRICE,
          text: 'per successful search · no monthly fee',
        },
        listTitle: 'Insurance details returned',
        items: [
          'Insurance company', 'Policy number', 'Insurance valid up to', 'Maker & model',
          'Vehicle class & fuel', 'Registration date', 'Cubic capacity & seating', 'PUC validity',
          'Fitness validity', 'Road tax validity', 'Financer (hypothecation)', 'Owner name & address',
        ],
        note: 'Details are returned wherever they are available on the vehicle record.',
      }}
      audiences={{
        title: 'Who uses a vehicle insurance API?',
        description: 'Anyone who needs to know if a vehicle is insured.',
        items: [
          'Motor insurance platforms & brokers', 'Insurance agents & POSPs', 'Fleet, cab & logistics operators',
          'Used car dealers & marketplaces', 'Vehicle loan & NBFC companies', 'Insurtech & app developers',
        ],
      }}
      related={[
        { to: '/vahan-api', label: 'Vahan API' },
        { to: '/vehicle-lookup-api', label: 'Vehicle lookup API' },
        { to: '/vehicle-details-api', label: 'Vehicle details API India' },
      ]}
      faq={{
        title: 'Vehicle insurance API — FAQ',
        description: 'Insurance status, expiry, price and coverage.',
        items: insuranceApiFaqs,
      }}
      cta={{
        title: `Check vehicle insurance by API from ${LOOKUP_PRICE}`,
        text: 'Contact RTO Sarthi on call or WhatsApp for your API key and see insurer, policy number and expiry for any vehicle number.',
      }}
    />
  )
}
