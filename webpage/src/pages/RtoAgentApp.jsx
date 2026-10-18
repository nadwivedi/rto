import { Link } from 'react-router-dom'
import ProductLanding from '../components/ProductLanding'
import {
  IconWhatsApp,
  IconSearch,
  IconWallet,
  IconUsers,
  IconUpload,
  IconClock,
  IconTarget,
  IconPhone,
} from '../components/Icons'
import { rtoAgentAppFaqs } from '../data/rtoAgentApp'
import { APP_URL } from '../data/freeDownload'
import { whatsappUrl } from '../data/contact'
import { LOOKUP_PRICE } from '../data/vehicleInfo'

const s = (t) => <strong className="text-slate-700">{t}</strong>
const linkClass = 'font-semibold text-brand-800 hover:underline'

export default function RtoAgentApp() {
  return (
    <ProductLanding
      hero={{
        label: 'RTO Sarthi — RTO Agent App',
        title: 'RTO Agent App — Run Your Whole RTO Work from Your Phone with RTO Sarthi',
        intro: `RTO Sarthi is the RTO agent app for India. Keep every client and vehicle in your pocket, send automatic WhatsApp reminders before tax, fitness, permit, PUC and insurance expiry, track pending balance, manage LL and DL work and search any vehicle number at ${LOOKUP_PRICE}, on Android, iPhone and computer.`,
        tags: ['Android & iPhone', 'WhatsApp Reminders', `RC Search at ${LOOKUP_PRICE}`, 'Pending Balance', 'LL & DL Work', 'Free Trial'],
      }}
      buttons={[
        { label: 'Start Free Trial', href: whatsappUrl },
        { label: 'Open the App', href: APP_URL },
      ]}
      overview={{
        title: 'The RTO agent app made for the way RTO agents work',
        description: 'Your work happens at the RTO, at the client’s door and at the desk. Your app should go with you.',
        paragraphs: [
          <>
            An RTO agent is rarely sitting at one desk. You are at the RTO counter, meeting a transporter, or
            answering a call about a permit renewal. A register or an Excel file in the office does not help when
            a client asks “when does my fitness expire?” on the road.
          </>,
          <>
            {s('RTO Sarthi is an RTO agent app built only for RTO agents')}. Every client, vehicle, document
            expiry date, payment and pending balance is on your phone, and the same data opens on your office
            computer. Search a vehicle number, check a client’s history or record a payment in seconds.
          </>,
          <>
            The app also brings work back to you. Vehicle owners get{' '}
            {s('automatic WhatsApp reminders before tax, fitness, permit, PUC and insurance expiry')}, and learner
            licence applicants get a WhatsApp message 30 days after the LL for DL eligibility. Install it free
            from the browser, see{' '}
            <Link to="/rto-agent-software-free-download" className={linkClass}>how to download RTO Sarthi</Link>, or
            read about the full{' '}
            <Link to="/rto-management-software" className={linkClass}>RTO management software</Link>.
          </>,
        ],
      }}
      steps={{
        title: 'Get the RTO agent app in 3 steps',
        description: 'No APK file, no setup on your side. Start the same day.',
        items: [
          { title: 'Get your free account', description: 'Message us on WhatsApp or call. We create your RTO Sarthi trial account the same day.' },
          { title: 'Install on your phone', description: 'Android: open app.rtosarthi.com in Chrome and tap Install App. iPhone: Safari → Share → Add to Home Screen.' },
          { title: 'Add vehicles & go', description: 'Upload RC or insurance copies or import Excel, and WhatsApp reminders start going out automatically.' },
        ],
      }}
      features={{
        title: 'RTO agent app features',
        description: 'Everything an RTO agent needs, on mobile and computer.',
        items: [
          { icon: <IconWhatsApp />, variant: 'whatsapp', title: 'Automatic WhatsApp reminders', description: 'Clients get reminders before tax, fitness, permit, PUC, insurance and GPS expiry, without you typing a message.' },
          { icon: <IconSearch />, variant: 'brand', title: `Vehicle search at ${LOOKUP_PRICE}`, description: 'Enter any vehicle number for RC details, RC and Vehicle Particulars PDF, and tax, fitness, PUC and insurance status.' },
          { icon: <IconUsers />, variant: 'accent', title: 'Clients & vehicles in your pocket', description: 'Search by vehicle number, owner name or mobile and open the full client history at the RTO counter.' },
          { icon: <IconWallet />, variant: 'success', title: 'Payments & pending balance', description: 'Record work and payments on the spot and see who owes how much, so no dues are forgotten.' },
          { icon: <IconClock />, variant: 'brand', title: 'LL & DL work', description: 'Learner and driving licence applicants with LL expiry dashboard and 30-day DL eligibility WhatsApp.' },
          { icon: <IconUpload />, variant: 'accent', title: 'Auto document entry', description: 'Photograph or upload an RC, insurance or permit copy and vehicle and owner details are filled for you.' },
          { icon: <IconTarget />, variant: 'success', title: 'Leads & follow-ups', description: 'Track enquiries for permit, tax, fitness, PUC and insurance with follow-up lists, one-tap call and WhatsApp.' },
          { icon: <IconPhone />, variant: 'brand', title: 'Android, iPhone, Windows & Mac', description: 'One account on every device. Data stays safe online and updates are automatic.' },
        ],
      }}
      checklist={{
        label: 'Why RTO Sarthi',
        title: 'What makes RTO Sarthi the best RTO agent app',
        description: 'Built for Indian RTO work, not a generic business app.',
        listTitle: 'With the RTO Sarthi app you get',
        items: [
          'Works on Android & iPhone', 'Works on Windows & Mac', 'No APK or .exe file needed', 'Automatic updates',
          'WhatsApp expiry reminders', `RC details at ${LOOKUP_PRICE}`, 'Client balance & ledger', 'LL & DL applicants',
          'Bulk Excel import', 'Staff & sub-agent logins', 'Data stored safely online', 'Setup help from our team',
        ],
      }}
      audiences={{
        title: 'Who uses the RTO Sarthi app?',
        description: 'Everyone who handles vehicle and licence work.',
        items: ['RTO agents and consultants', 'Multi-agent RTO offices', 'Insurance agents', 'PUC centers', 'Driving schools', 'Transport & fleet owners'],
      }}
      related={[
        { to: '/rto-agent-software-free-download', label: 'RTO agent software free download' },
        { to: '/rto-agent-crm-software', label: 'RTO agent CRM software' },
        { to: '/vehicle-information-software', label: 'Vehicle information software' },
        { to: '/vehicle-document-expiry-reminder-software', label: 'Vehicle document expiry reminder' },
      ]}
      faq={{
        title: 'RTO agent app — FAQ',
        description: 'Answers about installing and using the RTO Sarthi app.',
        items: rtoAgentAppFaqs,
      }}
      cta={{
        title: 'Get India’s RTO agent app today',
        text: 'Start a free trial of RTO Sarthi, install it on your phone and computer, and let WhatsApp reminders bring every client back.',
      }}
    />
  )
}
