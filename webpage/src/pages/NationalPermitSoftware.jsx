import ProductLanding from '../components/ProductLanding'
import { IconWhatsApp, IconRenewal, IconDocument, IconWallet, IconCar, IconClock, IconChart, IconBell } from '../components/Icons'
import { nationalPermitFaqs } from '../data/nationalPermit'

const s = (t) => <strong className="text-slate-700">{t}</strong>

export default function NationalPermitSoftware() {
  return (
    <ProductLanding
      hero={{
        label: 'RTO Sarthi — National Permit Software',
        title: 'National Permit Renewal Reminder Software — Track Part A & Part B Validity',
        intro:
          'Manage every national permit with Part A and Part B validity, renew each part on time and send automatic WhatsApp reminders to transporters before the permit or authorisation expires.',
        tags: ['Part A Validity', 'Part B Authorisation', 'WhatsApp Reminders', 'State & Bus Permit', 'Temporary Permit', 'Fee & Balance'],
      }}
      overview={{
        title: 'Keep every truck’s national permit valid',
        description: 'Permit software made for RTO agents who handle transporter work.',
        paragraphs: [
          <>
            A goods vehicle on national permit has two dates to watch: the {s('Part A')} permit
            from the home state and the {s('Part B')} national authorisation, which has to be renewed
            every year. If either one lapses, the truck cannot legally run across states, and the
            transporter faces penalties and lost trips.
          </>,
          <>
            {s('RTO Sarthi national permit renewal reminder software')} stores Part A and Part B
            validity separately, reminds the transporter on WhatsApp before each one expires, and
            lets you renew Part A or Part B on its own. State permit, bus permit and temporary permit
            are managed in the same software.
          </>,
        ],
      }}
      features={{
        title: 'Features of national permit reminder software',
        description: 'Everything you need to manage permit work for transporters.',
        items: [
          { icon: <IconCar />, variant: 'brand', title: 'Part A & Part B tracking', description: 'Store permit number, authorisation number, permit holder and Part A / Part B valid from and valid to dates.' },
          { icon: <IconWhatsApp />, variant: 'whatsapp', title: 'WhatsApp renewal reminders', description: 'Automatic WhatsApp reminders to the transporter before Part A or Part B expires, in Hindi or English.' },
          { icon: <IconRenewal />, variant: 'success', title: 'Renew Part A or Part B', description: 'Renew each part separately when it is due, with Smart Renew to update validity quickly.' },
          { icon: <IconDocument />, variant: 'accent', title: 'Permit documents', description: 'Upload Part A and Part B documents so the permit file is always ready to share.' },
          { icon: <IconWallet />, variant: 'accent', title: 'Fee, paid & balance', description: 'Record permit fee and payments, and see which transporter still owes money.' },
          { icon: <IconClock />, variant: 'brand', title: 'Flexible reminder timing', description: 'Choose days before expiry, a reminder on the expiry day, and follow-ups after expiry.' },
          { icon: <IconBell />, variant: 'success', title: 'All permit types', description: 'National permit, state permit, bus permit, temporary permit and other state temporary permit.' },
          { icon: <IconChart />, variant: 'brand', title: 'Due list on dashboard', description: 'See all permits expiring this week and this month in one list.' },
        ],
      }}
      checklist={{
        label: 'One truck, every document',
        title: 'Track the full truck, not only the permit',
        description: 'Transporters get reminders for every document from one agent.',
        listTitle: 'For the same vehicle RTO Sarthi also tracks',
        items: ['National permit Part A', 'National permit Part B', 'Road tax', 'Fitness', 'PUC', 'Insurance', 'GPS', 'Speed governor'],
      }}
      audiences={{
        title: 'Who uses national permit renewal reminder software?',
        description: 'Made for permit work on goods and passenger vehicles.',
        items: ['RTO agents handling permit work', 'Transport companies', 'Truck and trailer owners', 'Fleet operators', 'Bus operators', 'Logistics companies'],
      }}
      related={[
        { to: '/vehicle-document-expiry-reminder-software', label: 'Vehicle expiry reminder software' },
        { to: '/rto-management-software', label: 'RTO management software' },
      ]}
      faq={{
        title: 'National permit renewal reminder software — FAQ',
        description: 'Answers about Part A, Part B and permit reminders.',
        items: nationalPermitFaqs,
      }}
      cta={{
        title: 'Never let a national permit expire again',
        text: 'Try RTO Sarthi free and send automatic permit renewal reminders to your transporters.',
      }}
    />
  )
}
