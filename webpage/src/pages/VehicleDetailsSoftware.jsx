import { Link } from 'react-router-dom'
import ProductLanding from '../components/ProductLanding'
import { IconSearch, IconDocument, IconRenewal, IconClock, IconWhatsApp, IconShield, IconCar, IconCheck } from '../components/Icons'
import { vehicleDetailsSoftwareFaqs } from '../data/vehicleDetailsSoftware'
import { LOOKUP_PRICE } from '../data/vehicleInfo'

const s = (t) => <strong className="text-slate-700">{t}</strong>
const linkClass = 'font-semibold text-brand-800 hover:underline'

export default function VehicleDetailsSoftware() {
  return (
    <ProductLanding
      hero={{
        title: `Vehicle Details Software — Search Any Vehicle Number, Save It & Get Reminders from ${LOOKUP_PRICE}`,
        intro: `RTO Sarthi vehicle details software shows the full details of any Indian vehicle number on screen, from ${LOOKUP_PRICE} per search. Download the RC and Particulars PDF, print RC forms, keep every search in your history, and save the vehicle into your records for automatic expiry reminders.`,
      }}
      overview={{
        label: 'Vehicle details software',
        title: 'From vehicle number to client record in one search',
        description: 'Search, download, save and get reminded, all in the same software.',
        paragraphs: [
          <>
            Most vehicle search tools stop at showing the details. Then you copy the owner, model and expiry dates
            into a register or another software by hand, and the search is lost.
          </>,
          <>
            {s('RTO Sarthi vehicle details software')} keeps going. Search any vehicle number to see owner, model,
            chassis and engine, registration and {s('insurance, PUC, fitness and tax validity')}. Download the RC and
            Particulars PDF, print {s('Form 23, Temporary RC and NL Particulars')} already filled, and{' '}
            {s('save the vehicle into your records')} so RTO Sarthi can remind your client before anything expires.
          </>,
          <>
            Built for RTO agents, insurance agents, dealers and financers. Developers who want the same data in their
            own software can use the{' '}
            <Link to="/vehicle-details-api" className={linkClass}>vehicle details API</Link>. For the full list of
            search features, see{' '}
            <Link to="/vehicle-information-software" className={linkClass}>vehicle information software</Link>.
          </>,
          <span className="text-sm">
            RTO Sarthi is an independent private software company. It is not the Vahan or Parivahan portal and is
            not affiliated with the Ministry of Road Transport and Highways or NIC.
          </span>,
        ],
      }}
      steps={{
        title: 'How the vehicle details software works',
        description: 'No code, no installation. Works on PC and mobile.',
        items: [
          { title: 'Search the vehicle number', description: 'Type any Indian vehicle number and see its details on screen in seconds.' },
          { title: 'Download or print', description: 'Get the RC PDF and Particulars PDF, or print RC forms filled with the vehicle details.' },
          { title: 'Save & get reminded', description: 'Save the vehicle into your records and RTO Sarthi tracks its expiry dates for you.' },
        ],
      }}
      features={{
        label: 'Features',
        title: 'More than a vehicle number search',
        description: 'Everything you need after you search a vehicle.',
        items: [
          { icon: <IconSearch />, variant: 'brand', title: 'Full vehicle details', description: 'Owner, maker and model, class, fuel, chassis and engine number, RTO and registration dates.' },
          { icon: <IconShield />, variant: 'accent', title: 'Validity at a glance', description: 'Insurance, PUC, fitness and tax validity, with financer, blacklist and NOC details.' },
          { icon: <IconDocument />, variant: 'success', title: 'RC & Particulars PDF', description: 'Download an RC-style PDF and the Vehicle Particulars PDF for the client file or WhatsApp.' },
          { icon: <IconDocument />, variant: 'brand', title: 'Filled RC forms', description: 'Print Form 23, Temporary RC and NL Particulars already filled with the vehicle details.' },
          { icon: <IconClock />, variant: 'accent', title: 'Search history', description: 'Every search is saved. Expired documents show in red and those due in 30 days in amber.' },
          { icon: <IconRenewal />, variant: 'success', title: 'Save to your records', description: 'Add the vehicle to Vehicle Registration, Fitness, Insurance and PUC with dates from the RC.' },
          { icon: <IconWhatsApp />, variant: 'whatsapp', title: 'WhatsApp reminders', description: 'Saved vehicles get automatic WhatsApp reminders to your client before documents expire.' },
          { icon: <IconCheck />, variant: 'brand', title: `From ${LOOKUP_PRICE} per search`, description: 'Pay only for successful searches. Vehicles not found are not counted.' },
        ],
      }}
      checklist={{
        id: 'pricing',
        label: 'Pricing',
        title: `Vehicle details from ${LOOKUP_PRICE} per search`,
        description: 'Free trial of the software. Pay only for successful searches.',
        price: {
          caption: 'Starting at',
          amount: LOOKUP_PRICE,
          text: 'per successful vehicle search',
        },
        listTitle: 'Details shown for every vehicle',
        items: [
          'Owner name', 'Registration date & RTO', 'Maker & model', 'Class, fuel & colour',
          'Chassis & engine number', 'Registration validity', 'Insurance company & validity', 'PUC validity',
          'Fitness validity', 'Road tax validity', 'Financer (hypothecation)', 'Blacklist & NOC status',
        ],
        note: 'Details are shown wherever they are available on the vehicle record. Save to records is switched on for your account on request.',
      }}
      audiences={{
        title: 'Who uses vehicle details software?',
        description: 'Anyone who searches vehicle numbers every day.',
        items: [
          'RTO agents & consultants', 'Insurance agents & POSPs', 'PUC centres',
          'New & used vehicle dealers', 'Vehicle financers & loan agents', 'Fleet & transport operators',
        ],
      }}
      related={[
        { to: '/vehicle-information-software', label: 'Vehicle information software' },
        { to: '/rc-download-software', label: 'RC download software' },
        { to: '/vehicle-document-expiry-reminder-software', label: 'Expiry reminder software' },
      ]}
      faq={{
        title: 'Vehicle details software — FAQ',
        description: 'Search, save, reminders and price.',
        items: vehicleDetailsSoftwareFaqs,
      }}
      cta={{
        title: `Search vehicle details from ${LOOKUP_PRICE}`,
        text: 'Start your free trial of RTO Sarthi and search any vehicle number, download the RC and save it to your records.',
      }}
    />
  )
}
