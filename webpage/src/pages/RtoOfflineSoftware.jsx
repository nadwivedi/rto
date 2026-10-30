import { Link } from 'react-router-dom'
import ProductLanding from '../components/ProductLanding'
import {
  IconShield,
  IconPhone,
  IconWhatsApp,
  IconUsers,
  IconSearch,
  IconRenewal,
  IconExcel,
  IconWallet,
} from '../components/Icons'
import { rtoOfflineFaqs } from '../data/rtoOfflineSoftware'
import { whatsappUrl } from '../data/contact'
import { LOOKUP_PRICE } from '../data/vehicleInfo'

const s = (t) => <strong className="text-slate-700">{t}</strong>
const linkClass = 'font-semibold text-brand-800 hover:underline'

export default function RtoOfflineSoftware() {
  return (
    <ProductLanding
      hero={{
        label: 'RTO Sarthi — RTO Offline Software Alternative',
        title: 'RTO Offline Software vs Online — Desktop-Style RTO Software Without the Data Loss Risk',
        intro:
          'Looking for RTO offline software for your PC? RTO Sarthi installs on your Windows or Mac computer like desktop software, but keeps your data safe online, so a hard disk crash never wipes your records, your mobile shows the same data, and WhatsApp expiry reminders go out even when the office PC is off.',
        tags: ['Installs on PC', 'Automatic Backup', 'Mobile + Computer', 'WhatsApp Reminders', 'Works on Slow Internet', 'Free Trial'],
      }}
      buttons={[
        { label: 'Start Free Trial', href: whatsappUrl },
        { label: 'Book Demo', href: '/contact' },
      ]}
      overview={{
        title: 'Why RTO agents look for offline software, and what it costs them',
        description: 'Offline software feels safe. The risk is that everything sits on one hard disk.',
        paragraphs: [
          <>
            Many RTO agents search for {s('RTO offline software')} because they want software installed on
            their own computer that opens from a desktop icon, does not depend on a website, and keeps working when
            the internet is slow. That makes sense: the desk computer is where most RTO work is done.
          </>,
          <>
            The problem is where the data lives. Offline software keeps years of vehicle, client and payment records
            on {s('one hard disk')}. A crash, virus, theft or Windows reinstall can wipe them. You cannot check a
            client’s fitness date on your phone at the RTO, staff on another computer cannot work on the same
            records, reminders only go out if someone opens the software, and every update means a new setup file.
          </>,
          <>
            {s('RTO Sarthi gives you the desktop feel without that risk')}. It is{' '}
            <Link to="/cloud-rto-software" className={linkClass}>cloud RTO software</Link>: install it on your PC from the
            browser and it opens in its own window from the taskbar. Your data is stored online and backed up, the
            same account opens on your{' '}
            <Link to="/rto-agent-app" className={linkClass}>RTO agent app</Link> on mobile, and{' '}
            <Link to="/vehicle-document-expiry-reminder-software" className={linkClass}>WhatsApp expiry reminders</Link>{' '}
            go to clients automatically. RTO Sarthi does need internet, but it is light enough for mobile data or a
            phone hotspot. See the full{' '}
            <Link to="/rto-management-software" className={linkClass}>RTO management software</Link>.
          </>,
        ],
      }}
      steps={{
        title: 'Install RTO Sarthi on your PC like desktop software',
        description: 'Dedicated Windows software, installed by our team, with automatic updates.',
        items: [
          { title: 'Get your free account', description: 'Message us on WhatsApp or call. We create your RTO Sarthi trial account the same day.' },
          { title: 'We install it on your PC', description: 'Our team installs the RTO Sarthi Windows software with a desktop and taskbar icon. Mac works in the browser.' },
          { title: 'Bring your records', description: 'Import Excel or upload RC and insurance copies. Our team helps move data from your old software.' },
        ],
      }}
      features={{
        title: 'Everything offline RTO software does, plus what it cannot',
        description: 'Desktop convenience with the safety and reach of online software.',
        items: [
          { icon: <IconShield />, variant: 'brand', title: 'No data loss from a PC crash', description: 'Records are stored online and backed up. A broken, stolen or replaced computer does not lose your work.' },
          { icon: <IconPhone />, variant: 'accent', title: 'Same data on PC and mobile', description: 'Work at the desk on Windows or Mac, and check any client or vehicle on Android or iPhone at the RTO.' },
          { icon: <IconWhatsApp />, variant: 'whatsapp', title: 'Reminders while the PC is off', description: 'WhatsApp reminders for tax, fitness, permit, PUC and insurance expiry go out automatically from the server.' },
          { icon: <IconUsers />, variant: 'success', title: 'Staff on many computers', description: 'Separate logins for staff and sub-agents, all working on the same records at the same time.' },
          { icon: <IconSearch />, variant: 'brand', title: `Vehicle search at ${LOOKUP_PRICE}`, description: 'RC details, RC and Vehicle Particulars PDF, and tax, fitness, PUC and insurance status by vehicle number.' },
          { icon: <IconRenewal />, variant: 'accent', title: 'Automatic updates', description: 'No new setup file for every version. You always open the latest RTO Sarthi.' },
          { icon: <IconExcel />, variant: 'success', title: 'Easy move from old software', description: 'Bulk Excel import for PUC and insurance records, and auto entry from RC, insurance and permit copies.' },
          { icon: <IconWallet />, variant: 'brand', title: 'Balances, LL & DL work', description: 'Client payments and pending balance, plus learner and driving licence applicants with DL eligibility WhatsApp.' },
        ],
      }}
      checklist={{
        label: 'Offline vs online',
        title: 'RTO offline software vs RTO Sarthi',
        description: 'What changes when you move from offline desktop software.',
        listTitle: 'With RTO Sarthi instead of offline software',
        items: [
          'Installs on Windows & Mac', 'Desktop & taskbar icon', 'Data backed up online', 'Safe from hard disk crash',
          'Same data on mobile', 'Multiple staff logins', 'Automatic WhatsApp reminders', 'No setup file for updates',
          `RC search at ${LOOKUP_PRICE}`, 'Works on mobile data & hotspot', 'Excel import from old records', 'Setup help from our team',
        ],
        note: 'RTO Sarthi needs an internet connection. It does not run fully offline.',
      }}
      audiences={{
        title: 'Who switches from offline RTO software to RTO Sarthi?',
        description: 'Offices that cannot afford to lose their records.',
        items: ['RTO agents using desktop software', 'RTO offices with many computers', 'Agents working from Excel registers', 'Insurance agents', 'PUC centers', 'Driving schools doing RTO work'],
      }}
      related={[
        { to: '/rto-agent-software-free-download', label: 'RTO agent software free download' },
        { to: '/rto-agent-app', label: 'RTO agent app' },
        { to: '/cloud-rto-software', label: 'Cloud RTO software' },
        { to: '/rto-management-software', label: 'RTO management software' },
      ]}
      faq={{
        title: 'RTO offline software — FAQ',
        description: 'Answers about offline and online RTO software.',
        items: rtoOfflineFaqs,
      }}
      cta={{
        title: 'Desktop-style RTO software, with your data safe',
        text: 'Start a free trial of RTO Sarthi, install it on your PC and mobile, and never lose your RTO records to a crashed computer again.',
      }}
    />
  )
}
