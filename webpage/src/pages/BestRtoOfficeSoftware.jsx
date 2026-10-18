import { Link } from 'react-router-dom'
import ProductLanding from '../components/ProductLanding'
import {
  IconWhatsApp,
  IconUsers,
  IconWallet,
  IconSearch,
  IconClock,
  IconUpload,
  IconChart,
  IconShield,
} from '../components/Icons'
import { bestRtoOfficeFaqs } from '../data/bestRtoOffice'
import { whatsappUrl } from '../data/contact'
import { LOOKUP_PRICE } from '../data/vehicleInfo'

const s = (t) => <strong className="text-slate-700">{t}</strong>
const linkClass = 'font-semibold text-brand-800 hover:underline'

export default function BestRtoOfficeSoftware() {
  return (
    <ProductLanding
      hero={{
        label: 'RTO Sarthi — Best RTO Office Software',
        title: 'Best RTO Office Software in India — RTO Sarthi',
        intro: `RTO Sarthi is the best RTO office software for RTO agents and RTO offices in India. Every client, vehicle, renewal, payment and staff member in one system, with automatic WhatsApp reminders before tax, fitness, permit, PUC and insurance expiry and vehicle number search at ${LOOKUP_PRICE}.`,
        tags: ['Whole Office in One Place', 'Staff Logins', 'WhatsApp Reminders', 'Pending Balance', 'LL & DL Work', `RC Search at ${LOOKUP_PRICE}`],
      }}
      buttons={[
        { label: 'Start Free Trial', href: whatsappUrl },
        { label: 'Book Demo', href: '/contact' },
      ]}
      overview={{
        title: 'What makes RTO office software the best?',
        description: 'An RTO office has many desks, many clients and hundreds of renewal dates. The software must hold all of it.',
        paragraphs: [
          <>
            A busy RTO office runs on registers, diaries, Excel sheets and the owner’s memory. Renewal dates get
            missed, staff do not know what the other desk did, and pending payments are forgotten. Every missed
            date is a client who goes to another agent.
          </>,
          <>
            The best RTO office software brings the whole office into {s('one system that every staff member uses')}:
            vehicle-wise expiry dates for tax, fitness, permit, PUC and insurance, client payments and balances, LL
            and DL applicants, enquiries and follow-ups, and a dashboard that shows the owner what needs attention
            this week.
          </>,
          <>
            {s('RTO Sarthi is built only for RTO work in India')}. It sends{' '}
            <Link to="/vehicle-document-expiry-reminder-software" className={linkClass}>automatic WhatsApp expiry reminders</Link>,
            gives every staff member a login, keeps a{' '}
            <Link to="/rto-agent-crm-software" className={linkClass}>client CRM</Link> with pending balance, and{' '}
            <Link to="/vehicle-information-software" className={linkClass}>searches any vehicle number</Link> at{' '}
            {LOOKUP_PRICE}. It runs on office computers and on the{' '}
            <Link to="/rto-agent-app" className={linkClass}>RTO agent app</Link> on mobile.
          </>,
        ],
      }}
      steps={{
        title: 'Set up your RTO office on RTO Sarthi',
        description: 'Our team helps you go live the same week.',
        items: [
          { title: 'Get your office account', description: 'Message us on WhatsApp or call. We create your RTO Sarthi account and staff logins.' },
          { title: 'Bring in your records', description: 'Import Excel, or upload RC, insurance and permit copies and let RTO Sarthi fill the details.' },
          { title: 'Run the office', description: 'Staff do the work, WhatsApp reminders go out automatically, and you watch the dashboard.' },
        ],
      }}
      features={{
        title: 'RTO office software features',
        description: 'Everything an RTO office needs, from the front desk to the owner.',
        items: [
          { icon: <IconUsers />, variant: 'brand', title: 'Staff & sub-agent logins', description: 'Each staff member and sub-agent works on the same records from their own computer or mobile.' },
          { icon: <IconWhatsApp />, variant: 'whatsapp', title: 'Automatic WhatsApp reminders', description: 'Clients get reminders before tax, fitness, permit, PUC, insurance and GPS expiry without anyone typing.' },
          { icon: <IconWallet />, variant: 'accent', title: 'Payments & pending balance', description: 'Work, payments and dues for every client, with pending balance messages on WhatsApp.' },
          { icon: <IconSearch />, variant: 'success', title: `Vehicle search at ${LOOKUP_PRICE}`, description: 'RC details, RC and Vehicle Particulars PDF, and tax, fitness, PUC and insurance status by vehicle number.' },
          { icon: <IconClock />, variant: 'brand', title: 'LL & DL desk', description: 'Learner and driving licence applicants with LL expiry dashboard and 30-day DL eligibility WhatsApp.' },
          { icon: <IconUpload />, variant: 'accent', title: 'Auto document entry & Excel import', description: 'Upload RC, insurance or permit copies, or import PUC and insurance records in bulk from Excel.' },
          { icon: <IconChart />, variant: 'success', title: 'Owner dashboard', description: 'What expires this week, which reminders went out, open leads and pending revenue at a glance.' },
          { icon: <IconShield />, variant: 'brand', title: 'Safe online backup', description: 'Records stored securely online, not on one PC. Automatic updates on every device.' },
        ],
      }}
      checklist={{
        label: 'Buyer checklist',
        title: 'Best RTO office software checklist',
        description: 'Compare any RTO office software against this list. RTO Sarthi ticks every box.',
        listTitle: 'The best RTO office software must have',
        items: [
          'Vehicle-wise expiry tracking', 'Automatic WhatsApp reminders', 'Client payments & balance', 'Staff & sub-agent logins',
          'LL & DL applicant records', 'Lead & enquiry follow-ups', `RC search at ${LOOKUP_PRICE}`, 'Auto entry from RC copies',
          'Bulk Excel import', 'Computer & mobile access', 'Online backup', 'Setup & support team in India',
        ],
      }}
      audiences={{
        title: 'Which offices use RTO Sarthi?',
        description: 'From one-desk agents to multi-staff RTO offices.',
        items: ['RTO agent offices', 'Multi-staff RTO consultancies', 'Insurance agent offices', 'PUC centers', 'Driving schools doing RTO work', 'Transport & fleet offices'],
      }}
      related={[
        { to: '/rto-management-software', label: 'RTO management software' },
        { to: '/rto-agent-lead-management-software', label: 'RTO agent lead management' },
        { to: '/rto-offline-software', label: 'RTO offline software' },
        { to: '/rto-agent-software-free-download', label: 'Free download' },
      ]}
      faq={{
        title: 'Best RTO office software — FAQ',
        description: 'Answers about choosing and using RTO office software.',
        items: bestRtoOfficeFaqs,
      }}
      cta={{
        title: 'Run your RTO office on RTO Sarthi',
        text: 'Start a free trial, give every staff member a login, and let WhatsApp reminders bring every renewal back to your office.',
      }}
    />
  )
}
