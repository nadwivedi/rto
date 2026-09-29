import ProductLanding from '../components/ProductLanding'
import { IconUsers, IconWhatsApp, IconWallet, IconUpload, IconClock, IconCar, IconChart, IconExcel } from '../components/Icons'
import { rtoAgentCrmFaqs } from '../data/rtoAgentCrm'

const s = (t) => <strong className="text-slate-700">{t}</strong>

export default function RtoAgentCrmSoftware() {
  return (
    <ProductLanding
      hero={{
        label: 'RTO Sarthi — RTO Agent CRM Software',
        title: 'RTO Agent CRM Software — Keep Every Client Coming Back with RTO Sarthi',
        intro:
          'RTO Sarthi is CRM software built for RTO agents. Every client, vehicle, licence, payment and document in one place, with automatic WhatsApp reminders before tax, fitness, permit, PUC and insurance expiry so clients return to you for every renewal.',
        tags: ['Client & Vehicle Records', 'WhatsApp Reminders', 'Pending Balance', 'LL & DL Clients', 'Auto Document Entry', 'Multi-Agent'],
      }}
      overview={{
        title: 'A CRM built for RTO agents, not adapted from sales software',
        description: 'Your clients are vehicle owners and licence applicants, not sales leads.',
        paragraphs: [
          <>
            An RTO agent’s business runs on repeat clients. The same vehicle owner comes back every year for
            insurance, PUC, tax, fitness and permit renewals, and a licence applicant comes back for the DL after the
            LL. The agent who reminds the client first gets the work. The agent who forgets loses it.
          </>,
          <>
            Generic CRM software is made for sales teams and does not understand vehicle numbers, tax cycles or
            learner licences. {s('RTO Sarthi is CRM software made only for RTO agents')}: one record for every
            client with their vehicles, every document’s expiry date, payments and pending balance, LL and DL work,
            and full history.
          </>,
          <>
            The follow-ups are automatic. Clients get {s('WhatsApp reminders before tax, fitness, permit, PUC and insurance expiry')},
            licence applicants get a {s('WhatsApp message 30 days after the learning licence')} for DL eligibility,
            and your dashboard shows which vehicles need attention this week and how much revenue is pending.
          </>,
        ],
      }}
      steps={{
        title: 'How RTO Sarthi works as your CRM',
        description: 'Add the client once. The software keeps the relationship going.',
        items: [
          { title: 'Add clients & vehicles', description: 'Upload RC, insurance or permit copies and let RTO Sarthi fill details, or import PUC and insurance records from Excel.' },
          { title: 'Automatic follow-ups', description: 'Clients get WhatsApp reminders before every expiry, and LL applicants get the 30-day DL eligibility message.' },
          { title: 'Renew, bill & repeat', description: 'Do the renewal, record the payment and pending balance, and the next reminder is already set.' },
        ],
      }}
      features={{
        title: 'RTO agent CRM software features',
        description: 'Everything an RTO agent needs to manage clients and keep them.',
        items: [
          { icon: <IconUsers />, variant: 'brand', title: 'Client & vehicle hub', description: 'Parties, vehicles, payments and documents in one place. Search by vehicle number, owner name or mobile.' },
          { icon: <IconWhatsApp />, variant: 'whatsapp', title: 'WhatsApp expiry reminders', description: 'Automatic reminders to clients before tax, fitness, permit, PUC and insurance expiry.' },
          { icon: <IconWallet />, variant: 'accent', title: 'Pending balance & ledger', description: 'Work, payments and pending balance for every client, so no dues are forgotten.' },
          { icon: <IconClock />, variant: 'success', title: 'LL & DL clients', description: 'Licence applicants with LL expiry dashboard and automatic 30-day DL eligibility WhatsApp.' },
          { icon: <IconUpload />, variant: 'brand', title: 'Smart document entry', description: 'Upload RC, insurance or permit copies and vehicle and owner details are filled automatically.' },
          { icon: <IconExcel />, variant: 'success', title: 'Bulk Excel import', description: 'Import hundreds of PUC or insurance records at once with ready Excel templates.' },
          { icon: <IconChart />, variant: 'accent', title: 'Dashboard analytics', description: 'See what expires this week, which reminders went out and what revenue is pending.' },
          { icon: <IconCar />, variant: 'brand', title: 'Multi-agent access', description: 'Separate logins for RTO agents, insurance agents and PUC centers on the same data.' },
        ],
      }}
      checklist={{
        label: 'Client record',
        title: 'What RTO Sarthi remembers about every client',
        description: 'The full relationship, not just a name and phone number.',
        listTitle: 'Each client record in the CRM includes',
        items: [
          'Name, mobile & address', 'All vehicles of the client', 'Tax expiry', 'Fitness expiry',
          'Permit expiry', 'PUC expiry', 'Insurance expiry', 'LL & DL work',
          'RC, insurance & other documents', 'Payments & pending balance', 'WhatsApp reminders sent', 'Complete work history',
        ],
      }}
      audiences={{
        title: 'Who uses RTO Sarthi as a CRM?',
        description: 'For everyone who serves vehicle owners and licence applicants.',
        items: ['RTO agents and consultants', 'Multi-agent RTO offices', 'Insurance agents', 'PUC centers', 'Transport consultants', 'Driving schools doing RTO work'],
      }}
      related={[
        { to: '/rto-management-software', label: 'RTO management software' },
        { to: '/vehicle-document-expiry-reminder-software', label: 'Vehicle document expiry reminder' },
        { to: '/driving-licence-management-system', label: 'Driving licence management system' },
      ]}
      faq={{
        title: 'RTO agent CRM software — FAQ',
        description: 'Answers about using RTO Sarthi to manage and keep your clients.',
        items: rtoAgentCrmFaqs,
      }}
      cta={{
        title: 'The CRM made for RTO agents',
        text: 'Start a free trial of RTO Sarthi and let automatic WhatsApp reminders bring every client back for renewals.',
      }}
    />
  )
}
