import { Link } from 'react-router-dom'
import ProductLanding from '../components/ProductLanding'
import {
  IconShield,
  IconPhone,
  IconWhatsApp,
  IconUsers,
  IconRenewal,
  IconSearch,
  IconWallet,
  IconChart,
} from '../components/Icons'
import { cloudRtoFaqs } from '../data/cloudRto'
import { whatsappUrl } from '../data/contact'
import { LOOKUP_PRICE } from '../data/vehicleInfo'

const s = (t) => <strong className="text-slate-700">{t}</strong>
const linkClass = 'font-semibold text-brand-800 hover:underline'

export default function CloudRtoSoftware() {
  return (
    <ProductLanding
      hero={{
        label: 'RTO Sarthi — Cloud RTO Software',
        title: 'Cloud RTO Software — RTO Sarthi, Your RTO Office Online on Every Device',
        intro: `RTO Sarthi is cloud RTO software for RTO agents in India. Your clients, vehicles, expiry dates and payments are stored safely online and open on any computer or mobile, WhatsApp reminders go out automatically from the cloud, and you can search any vehicle number at ${LOOKUP_PRICE}.`,
        tags: ['100% Cloud-Based', 'Automatic Backup', 'PC + Mobile', 'Staff Logins', 'WhatsApp Reminders', 'Auto Updates'],
      }}
      buttons={[
        { label: 'Start Free Trial', href: whatsappUrl },
        { label: 'Book Demo', href: '/contact' },
      ]}
      overview={{
        title: 'Why RTO agents are moving to cloud RTO software',
        description: 'Your records should not depend on one computer in one office.',
        paragraphs: [
          <>
            Most RTO work used to live in registers, Excel files or{' '}
            <Link to="/rto-offline-software" className={linkClass}>offline RTO software</Link> on one office PC.
            When that PC crashes, gets a virus or is replaced, years of vehicle and client records can be lost. And
            when a client calls while you are at the RTO, the data is back at the office.
          </>,
          <>
            {s('Cloud RTO software stores your data securely online')}. You log in from the office computer, from
            home or from your phone at the RTO and see the same records. Every staff member works on the same data
            at the same time, backups happen automatically and there is never a setup file to update.
          </>,
          <>
            {s('RTO Sarthi is cloud-based RTO software built in India for RTO agents')}. Because it runs in the
            cloud, it sends{' '}
            <Link to="/vehicle-document-expiry-reminder-software" className={linkClass}>automatic WhatsApp expiry reminders</Link>{' '}
            even when your computer is off, keeps client balances up to date across every device, and works as the{' '}
            <Link to="/rto-agent-app" className={linkClass}>RTO agent app</Link> on your mobile. It is also the{' '}
            <Link to="/best-rto-office-software" className={linkClass}>best RTO office software</Link> for offices with
            many staff.
          </>,
        ],
      }}
      steps={{
        title: 'Move your RTO work to the cloud in 3 steps',
        description: 'No server, no installation CD, no IT person needed.',
        items: [
          { title: 'Get your cloud account', description: 'Message us on WhatsApp or call. We create your RTO Sarthi account and staff logins the same day.' },
          { title: 'Upload your records', description: 'Import Excel, or upload RC, insurance and permit copies and RTO Sarthi fills the details.' },
          { title: 'Work from anywhere', description: 'Log in on any computer or phone. Reminders and backups run in the cloud automatically.' },
        ],
      }}
      features={{
        title: 'Cloud RTO software features',
        description: 'What you get because RTO Sarthi runs in the cloud.',
        items: [
          { icon: <IconShield />, variant: 'brand', title: 'Automatic cloud backup', description: 'Records are stored securely online. A crashed, stolen or replaced computer never loses your work.' },
          { icon: <IconPhone />, variant: 'accent', title: 'Any device, same data', description: 'Windows, Mac, Android and iPhone all open the same account. Check a client from the desk or the RTO.' },
          { icon: <IconWhatsApp />, variant: 'whatsapp', title: 'Reminders from the cloud', description: 'WhatsApp reminders for tax, fitness, permit, PUC, insurance and GPS expiry go out even when your PC is off.' },
          { icon: <IconUsers />, variant: 'success', title: 'Whole office, one account', description: 'Logins for staff, sub-agents, insurance agents and PUC centers, all working on the same records live.' },
          { icon: <IconRenewal />, variant: 'brand', title: 'Automatic updates', description: 'New features arrive in the cloud. No setup file, and everyone always uses the latest version.' },
          { icon: <IconSearch />, variant: 'accent', title: `Vehicle search at ${LOOKUP_PRICE}`, description: 'RC details, RC and Vehicle Particulars PDF, and tax, fitness, PUC and insurance status by vehicle number.' },
          { icon: <IconWallet />, variant: 'success', title: 'Live payments & balances', description: 'A payment recorded on one device shows on every other device instantly, so dues are never missed.' },
          { icon: <IconChart />, variant: 'brand', title: 'Dashboard from anywhere', description: 'See what expires this week, reminders sent, LL and DL work and pending revenue from your phone.' },
        ],
      }}
      checklist={{
        label: 'Cloud vs offline',
        title: 'Cloud RTO software vs offline RTO software',
        description: 'What you gain when your RTO office runs on RTO Sarthi in the cloud.',
        listTitle: 'With cloud RTO software from RTO Sarthi',
        items: [
          'Data backed up online', 'Safe from PC crash or theft', 'Works on PC and mobile', 'Multiple staff at once',
          'Reminders while PC is off', 'Windows, Android & iPhone apps', 'Automatic updates', 'No server or IT cost',
          `RC search at ${LOOKUP_PRICE}`, 'Works on mobile data & hotspot', 'Excel import of old records', 'Setup help from our team',
        ],
        note: 'Cloud software needs an internet connection. RTO Sarthi is light enough for 4G or a phone hotspot.',
      }}
      audiences={{
        title: 'Who uses RTO Sarthi cloud RTO software?',
        description: 'Anyone who wants RTO records safe and available everywhere.',
        items: ['RTO agents and consultants', 'Multi-staff RTO offices', 'Agents with more than one branch', 'Insurance agents', 'PUC centers', 'Driving schools doing RTO work'],
      }}
      related={[
        { to: '/rto-offline-software', label: 'RTO offline software' },
        { to: '/best-rto-office-software', label: 'Best RTO office software' },
        { to: '/rto-management-software', label: 'RTO management software' },
        { to: '/rto-agent-app', label: 'RTO agent app' },
      ]}
      faq={{
        title: 'Cloud RTO software — FAQ',
        description: 'Answers about running your RTO work in the cloud with RTO Sarthi.',
        items: cloudRtoFaqs,
      }}
      cta={{
        title: 'Move your RTO office to the cloud',
        text: 'Start a free trial of RTO Sarthi and keep every client and vehicle safe online, on every device, with automatic WhatsApp reminders.',
      }}
    />
  )
}
