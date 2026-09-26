import ProductLanding from '../components/ProductLanding'
import { IconDocument, IconWhatsApp, IconClock, IconBell, IconChart, IconUsers, IconShield, IconRenewal } from '../components/Icons'
import { documentExpiryFaqs } from '../data/documentExpiry'

const s = (t) => <strong className="text-slate-700">{t}</strong>

export default function DocumentExpiryReminderSoftware() {
  return (
    <ProductLanding
      hero={{
        label: 'RTO Sarthi — Document Expiry Reminder Software',
        title: 'Document Expiry Reminder Software — Automatic WhatsApp Reminders for Every Document',
        intro:
          'Track the expiry date of any document, for yourself or your clients, and let RTO Sarthi send automatic WhatsApp reminders before it expires. Licences, insurance, registrations, agreements, certificates and vehicle documents in one place.',
        tags: ['Any Document Type', 'WhatsApp Reminders', 'Hindi & English', 'Custom Reminder Days', 'Client Reminders', 'Expiry Dashboard'],
      }}
      overview={{
        title: 'One simple software for every expiry date',
        description: 'Not only vehicles: every document with a renewal date.',
        paragraphs: [
          <>
            Licences, insurance policies, registrations, agreements and certificates all expire on
            different dates. When one is missed you pay a penalty, lose cover or lose a client. Keeping
            them in a diary, calendar or Excel sheet means you have to remember to check every day.
          </>,
          <>
            {s('RTO Sarthi document expiry reminder software')} keeps the expiry date of{' '}
            {s('every type of document')} in one place and sends {s('automatic WhatsApp reminders')}{' '}
            before the due date, on the expiry day and after expiry if it is still pending. Use it for
            your own documents or for all your clients’ documents.
          </>,
        ],
      }}
      steps={{
        title: 'How document expiry reminders work',
        description: 'Set it once, reminders go automatically.',
        items: [
          { title: 'Add the document', description: 'Enter the document name or type, the client and their mobile number, and the expiry date.' },
          { title: 'Choose reminder timing', description: 'Pick how many days before expiry to remind, and whether to remind on and after the expiry day.' },
          { title: 'Reminders go automatically', description: 'RTO Sarthi sends WhatsApp reminders on time, and your dashboard shows everything expiring soon.' },
        ],
      }}
      features={{
        title: 'Features of document expiry reminder software',
        description: 'Simple to use, works for any document.',
        items: [
          { icon: <IconDocument />, variant: 'brand', title: 'Any type of document', description: 'Licences, registrations, insurance, agreements, certificates, warranties, vehicle papers and more.' },
          { icon: <IconWhatsApp />, variant: 'whatsapp', title: 'Automatic WhatsApp reminders', description: 'Reminders go on WhatsApp automatically, with no daily checking and no phone calls.' },
          { icon: <IconClock />, variant: 'accent', title: 'Custom reminder days', description: 'Remind 30, 15, 7 or 1 day before expiry, on the expiry day and after expiry. You decide.' },
          { icon: <IconBell />, variant: 'success', title: 'Hindi & English', description: 'Send reminder messages in English, Hindi or both.' },
          { icon: <IconUsers />, variant: 'brand', title: 'Reminders to your clients', description: 'Save the client’s mobile number and the reminder reaches them directly, bringing renewal work back to you.' },
          { icon: <IconChart />, variant: 'accent', title: 'Expiry dashboard', description: 'See every document expiring this week and this month across all clients.' },
          { icon: <IconRenewal />, variant: 'success', title: 'Renewal tracking', description: 'Update the new expiry date after renewal and the next reminder is set automatically.' },
          { icon: <IconShield />, variant: 'brand', title: 'Safe online storage', description: 'Your data is stored securely online and available on computer and mobile.' },
        ],
      }}
      checklist={{
        label: 'Document types',
        title: 'Expiry reminders for every type of document',
        description: 'If it has an expiry date, RTO Sarthi can remind you.',
        listTitle: 'Examples of documents you can track',
        items: [
          'Driving licence', 'Passport', 'Vehicle tax, fitness & PUC', 'Vehicle permits',
          'Motor insurance', 'Health & life insurance', 'Trade licence', 'Shop & establishment licence',
          'FSSAI licence', 'GST & business registrations', 'Rent & lease agreements', 'AMC & warranties',
          'Certificates & approvals', 'Employee documents',
        ],
      }}
      audiences={{
        title: 'Who uses document expiry reminder software?',
        description: 'Anyone who manages renewal dates for themselves or for clients.',
        items: ['RTO agents and consultants', 'Insurance agents and POSPs', 'CA and tax consultants', 'Licence and registration consultants', 'CSC and online service centers', 'Small businesses and HR teams'],
      }}
      related={[
        { to: '/vehicle-document-expiry-reminder-software', label: 'Vehicle document expiry reminder' },
        { to: '/rto-management-software', label: 'RTO management software' },
      ]}
      faq={{
        title: 'Document expiry reminder software — FAQ',
        description: 'Answers about tracking any document and sending WhatsApp expiry reminders.',
        items: documentExpiryFaqs,
      }}
      cta={{
        title: 'Never miss a document renewal again',
        text: 'Try RTO Sarthi free and send automatic WhatsApp reminders for every document.',
      }}
    />
  )
}
