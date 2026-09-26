import ProductLanding from '../components/ProductLanding'
import { IconWhatsApp, IconBell, IconClock, IconChart, IconExcel, IconRenewal, IconShield, IconCar } from '../components/Icons'
import { expiryReminderFaqs } from '../data/expiryReminder'

const s = (t) => <strong className="text-slate-700">{t}</strong>

export default function ExpiryReminderSoftware() {
  return (
    <ProductLanding
      hero={{
        label: 'RTO Sarthi — Expiry Reminder Software',
        title: 'Vehicle Document Expiry Reminder Software — Tax, Fitness, Permit, PUC & Insurance',
        intro:
          'RTO Sarthi tracks the expiry of every vehicle document and sends automatic WhatsApp reminders to your clients before road tax, fitness, permit, PUC, insurance or GPS expires. No missed renewals, no penalties.',
        tags: ['Road Tax', 'Fitness', 'National Permit', 'State Permit', 'PUC', 'Insurance', 'GPS', 'WhatsApp Alerts'],
      }}
      overview={{
        title: 'Never miss a vehicle document renewal again',
        description: 'Expiry reminder software made for RTO agents, fleet owners and transporters.',
        paragraphs: [
          <>
            Every commercial vehicle carries many documents that expire on different dates: road
            tax, fitness, permit, PUC, insurance and GPS. When one expires, the owner pays a penalty
            or the vehicle stops running, and the RTO agent loses the renewal work.
          </>,
          <>
            {s('RTO Sarthi vehicle document expiry reminder software')} keeps every expiry date in
            one place and sends {s('automatic WhatsApp reminders')} to the vehicle owner before the
            due date, on the expiry day and after expiry if the work is still pending. You see
            everything due this week and this month on your dashboard.
          </>,
        ],
      }}
      features={{
        title: 'Reminders for every vehicle document',
        description: 'One software for all expiry dates and all your clients.',
        items: [
          { icon: <IconWhatsApp />, variant: 'whatsapp', title: 'Automatic WhatsApp reminders', description: 'Clients get a WhatsApp message before each document expires. No more calling every client one by one.' },
          { icon: <IconClock />, variant: 'brand', title: 'You choose when to remind', description: 'Set days before expiry (like 15, 7 and 1 day), a reminder on the expiry day, and follow-ups after expiry for pending renewals.' },
          { icon: <IconRenewal />, variant: 'success', title: 'Tax, fitness & PUC expiry', description: 'Track road tax paid upto, fitness valid upto and PUC validity for every vehicle.' },
          { icon: <IconShield />, variant: 'brand', title: 'Insurance expiry', description: 'Insurance renewal reminders bring the client back to you before the policy lapses.' },
          { icon: <IconCar />, variant: 'accent', title: 'Permit & GPS expiry', description: 'National permit, state permit, bus permit, temporary permit and GPS expiry, each with its own reminder.' },
          { icon: <IconBell />, variant: 'accent', title: 'Hindi & English messages', description: 'Send reminders in Hindi, English or both, and customise the message for each document.' },
          { icon: <IconChart />, variant: 'brand', title: 'Due this week dashboard', description: 'See what expires this week and this month, colour-coded, so you plan your renewal work.' },
          { icon: <IconExcel />, variant: 'success', title: 'Excel bulk upload', description: 'Upload tax, PUC and insurance records from Excel instead of typing them one by one.' },
        ],
      }}
      checklist={{
        label: 'Documents covered',
        title: 'Which expiry dates does RTO Sarthi track?',
        description: 'Every document an RTO agent renews, with WhatsApp reminders.',
        listTitle: 'Expiry reminders available for',
        items: [
          'Road tax', 'Fitness certificate', 'PUC certificate', 'Motor insurance',
          'National permit', 'State permit', 'Bus permit', 'Temporary permit',
          'GPS', 'Learner licence eligible for DL',
        ],
      }}
      audiences={{
        title: 'Who uses vehicle expiry reminder software?',
        description: 'Anyone who has to renew vehicle documents on time.',
        items: ['RTO agents and consultants', 'Transporters and fleet owners', 'Truck and bus operators', 'Insurance agents', 'PUC centers', 'Vehicle dealers'],
      }}
      related={[
        { to: '/national-permit-renewal-reminder-software', label: 'National permit reminder' },
        { to: '/rto-management-software', label: 'RTO management software' },
      ]}
      faq={{
        title: 'Vehicle document expiry reminder software — FAQ',
        description: 'Answers about WhatsApp expiry reminders for tax, fitness, permit, PUC and insurance.',
        items: expiryReminderFaqs,
      }}
      cta={{
        title: 'Start sending expiry reminders automatically',
        text: 'Try RTO Sarthi free and let WhatsApp reminders bring your clients back for every renewal.',
      }}
    />
  )
}
