import { Link } from 'react-router-dom'
import ProductLanding from '../components/ProductLanding'
import { IconClock, IconWhatsApp, IconShield, IconChart, IconCode, IconMapPin, IconCheck, IconBell } from '../components/Icons'
import { pucDetailsApiFaqs } from '../data/pucDetailsApi'
import { LOOKUP_PRICE } from '../data/vehicleInfo'

const s = (t) => <strong className="text-slate-700">{t}</strong>
const linkClass = 'font-semibold text-brand-800 hover:underline'

const responseExample = `{
  "success": true,
  "message": "Vehicle details fetched successfully",
  "vehicleNumber": "MP09ZK4471",
  "data": {
    "REGN_NO": "MP09ZK4471",
    "STATUS": "ACTIVE",
    "MAKER_DESC": "HONDA MOTORCYCLE AND SCOOTER INDIA (P) LTD",
    "MAKER_MODEL": "ACTIVA 6G",
    "VEHICLE_CLASS": "M-CYCLE/SCOOTER",
    "FUEL_DESC": "PETROL",
    "NORMS_DESC": "BHARAT STAGE VI",
    "PUCC_NO": "MP00900120034567",
    "PUCC_UPTO": "14-Feb-2027",
    "INSURANCE_UPTO": "03-Jan-2027",
    "FIT_UPTO": "02-Jan-2037"
  },
  "usage": { "limit": 5000, "used": 2275, "remaining": 2725 }
}`

export default function VehiclePucDetailsApi() {
  return (
    <ProductLanding
      hero={{
        title: `Vehicle PUC Details API — RC to PUC Details API for Any Vehicle Number from ${LOOKUP_PRICE}`,
        intro: `The RTO Sarthi vehicle PUC details API (RC to PUC details API) takes any Indian vehicle number and returns the PUC certificate number and PUC valid-up-to date as JSON in seconds, with maker, model, fuel, emission norms and insurance and fitness validity, from ${LOOKUP_PRICE} per successful search.`,
      }}
      buttons={[
        { label: 'Get API Key', href: '/contact' },
        { label: 'Talk to Us', href: '/contact' },
      ]}
      overview={{
        label: 'PUC by API',
        title: 'Know any vehicle’s PUC status from its RC number',
        description: 'Valid, expiring soon or expired, checked automatically in your software.',
        paragraphs: [
          <>
            Every vehicle on Indian roads needs a valid {s('PUC (Pollution Under Control) certificate')}. Owners
            forget the date, and an expired PUC can mean a fine on the road and trouble at insurance renewal.
          </>,
          <>
            The {s('RTO Sarthi vehicle PUC details API')} gives your software the {s('PUC certificate number and PUC valid-up-to date')}{' '}
            from the vehicle number, so you can show PUC status, flag expired vehicles or remind owners before
            the date. It works for vehicles from {s('every state of India')} and starts at{' '}
            {s(`${LOOKUP_PRICE} per successful search`)}.
          </>,
          <>
            Run a PUC centre? Use{' '}
            <Link to="/puc-agent-software" className={linkClass}>PUC agent software</Link> for bulk PUC uploads and
            automatic{' '}
            <Link to="/vehicle-document-expiry-reminder-software" className={linkClass}>WhatsApp PUC expiry reminders</Link>,
            no code needed.
          </>,
          <span className="text-sm">
            RTO Sarthi is an independent private software company. It does not issue PUC certificates, is not the
            Vahan or Parivahan portal and is not affiliated with the Ministry of Road Transport and Highways or NIC.
          </span>,
        ],
      }}
      steps={{
        title: 'How the RC to PUC details API works',
        description: 'Live in your software, usually the same day.',
        items: [
          { title: 'Get an API key', description: 'Contact us and choose your search limit. We create a private API key for your business.' },
          { title: 'Send the RC number', description: 'Your app, CRM or backend sends the vehicle registration number.' },
          { title: 'Read the PUC details', description: 'Use PUCC_NO and PUCC_UPTO to show PUC status, flag expired vehicles or send reminders.' },
        ],
      }}
      code={{
        label: 'Sample response',
        title: 'PUC details in the API response',
        description: 'PUCC_NO is the PUC certificate number and PUCC_UPTO the date the PUC is valid up to.',
        blocks: [{ label: 'JSON response (PUC fields)', code: responseExample }],
        note: 'Sample data, shortened. Details are returned wherever they are available on the vehicle record.',
      }}
      features={{
        label: 'Use cases',
        title: 'What you can do with a vehicle PUC details API',
        description: 'PUC status from the RC number, for every kind of business.',
        items: [
          { icon: <IconBell />, variant: 'brand', title: 'PUC expiry reminders', description: 'Find vehicles whose PUC expires soon and remind the owner before the date.' },
          { icon: <IconShield />, variant: 'accent', title: 'Insurance renewals', description: 'Check PUC validity along with insurance expiry before you renew a motor policy.' },
          { icon: <IconChart />, variant: 'success', title: 'Fleet compliance', description: 'Check PUC for every truck, bus, cab or bike in your fleet and flag expired ones.' },
          { icon: <IconClock />, variant: 'brand', title: 'Vehicle & car care apps', description: 'Show owners their PUC status next to insurance and service dates.' },
          { icon: <IconWhatsApp />, variant: 'whatsapp', title: 'Leads for PUC centres', description: 'Spot customers with expired or expiring PUC and invite them for a test.' },
          { icon: <IconCode />, variant: 'accent', title: 'For app developers', description: 'Add PUC status by vehicle number to your app with a simple JSON API.' },
          { icon: <IconMapPin />, variant: 'success', title: 'All states of India', description: 'Two-wheelers, cars and commercial vehicles from any state, including BH series.' },
          { icon: <IconCheck />, variant: 'brand', title: `From ${LOOKUP_PRICE}, pay on success`, description: 'Prepaid limit with no monthly fee. Vehicles not found are returned to your limit.' },
        ],
      }}
      checklist={{
        id: 'pricing',
        label: 'Pricing',
        title: `Vehicle PUC details API from ${LOOKUP_PRICE} per search`,
        description: 'PUC details and the full record in every successful search.',
        price: {
          caption: 'Starting at',
          amount: LOOKUP_PRICE,
          text: 'per successful search · no monthly fee',
        },
        listTitle: 'Returned with the PUC details',
        items: [
          'PUC certificate number', 'PUC valid up to', 'Fuel type', 'Emission norms (BS)',
          'Maker & model', 'Vehicle class', 'Registration status', 'Insurance validity',
          'Fitness validity', 'Road tax validity', 'Chassis & engine number', 'Registration date',
        ],
        note: 'Details are returned wherever they are available on the vehicle record.',
      }}
      audiences={{
        title: 'Who uses a vehicle PUC details API?',
        description: 'Anyone who needs to know if a vehicle’s PUC is valid.',
        items: [
          'Motor insurance platforms & agents', 'Fleet, cab & logistics operators', 'Vehicle & car care apps',
          'PUC centres & testing networks', 'Dealers & service centres', 'Software & app developers',
        ],
      }}
      related={[
        { to: '/vehicle-fitness-details-api', label: 'Vehicle fitness details API' },
        { to: '/vehicle-insurance-api', label: 'Vehicle insurance API' },
        { to: '/puc-agent-software', label: 'PUC agent software' },
        { to: '/vahan-api', label: 'Vahan API' },
      ]}
      faq={{
        title: 'Vehicle PUC details API — FAQ',
        description: 'PUC status, RC to PUC lookup, price and coverage.',
        items: pucDetailsApiFaqs,
      }}
      cta={{
        title: `Check vehicle PUC details by API from ${LOOKUP_PRICE}`,
        text: 'Contact RTO Sarthi on call or WhatsApp for your API key and get the PUC certificate number and validity of any vehicle number.',
      }}
    />
  )
}
