import ProductLanding from '../components/ProductLanding'
import { IconUsers, IconWhatsApp, IconWallet, IconClock, IconCar, IconChart, IconBell, IconRenewal } from '../components/Icons'
import { rtoAgentLeadFaqs } from '../data/rtoAgentLeadManagement'

const s = (t) => <strong className="text-slate-700">{t}</strong>

export default function RtoAgentLeadManagementSoftware() {
  return (
    <ProductLanding
      hero={{
        title: 'RTO Agent Lead Management Software — Follow Up Every Enquiry and Win More RTO Work',
        intro:
          'RTO Sarthi keeps every permit, tax, fitness, PUC and insurance enquiry in one list with the vehicle, expiry date, expected amount and next follow-up, so your desk knows exactly who to call today and no lead is forgotten.',
      }}
      overview={{
        title: 'Why RTO agents lose leads, and how to stop it',
        description: 'Most lost work is not lost to price. It is lost to a missed follow-up.',
        paragraphs: [
          <>
            An RTO agent gets enquiries all day: a walk-in asking about permit renewal, a call about insurance, a
            WhatsApp message about fitness. Most of them are not ready the same day. They say “call me next week”,
            and that enquiry lives in a notebook or on a phone’s call log until it is forgotten.
          </>,
          <>
            {s('RTO Sarthi lead management software')} gives every enquiry a record: name, mobile, vehicle number,
            the work they want, its expiry date, the expected amount and {s('the next follow-up date and time')}. The
            leads screen groups them into {s('Follow-up Today, Overdue, New and Upcoming')}, so the day starts with a
            clear call list.
          </>,
          <>
            You can also create leads from your own data. Every vehicle you search is saved with its document expiry
            dates, and you can {s('move vehicles with expired insurance, PUC or fitness straight into leads')}. That
            turns a vehicle search into new work.
          </>,
        ],
      }}
      steps={{
        title: 'How lead management works in RTO Sarthi',
        description: 'From the first enquiry to paid work in three steps.',
        items: [
          { title: 'Capture the enquiry', description: 'Add a walk-in, call or WhatsApp enquiry in seconds, or move vehicles from your RC search history into leads.' },
          { title: 'Follow up on time', description: 'Call or WhatsApp in one tap, log what was said, and set the next follow-up date. Today and Overdue lists keep you on track.' },
          { title: 'Convert and track', description: 'Send the quotation, mark the lead converted, or record why it was lost, so you learn what wins work.' },
        ],
      }}
      features={{
        title: 'RTO agent lead management features',
        description: 'Built around the work an RTO desk actually sells.',
        items: [
          { icon: <IconCar />, variant: 'brand', title: 'Leads by RTO work type', description: 'Tag every lead as permit, tax, fitness, PUC or insurance, with the vehicle number and the current expiry date.' },
          { icon: <IconBell />, variant: 'accent', title: 'Today, Overdue & Upcoming', description: 'Follow-ups are grouped by date and time, so the desk sees today’s calls first and nothing slips past its date.' },
          { icon: <IconWhatsApp />, variant: 'whatsapp', title: 'One-tap Call & WhatsApp', description: 'Call or message any lead from the list, then log the note, outcome and next follow-up in the same step.' },
          { icon: <IconRenewal />, variant: 'success', title: 'Leads from RC search', description: 'Move searched vehicles with expired or expiring documents into leads, with every document’s expiry filled in.' },
          { icon: <IconChart />, variant: 'brand', title: 'Status pipeline', description: 'New, In Progress, Call Back, Not Connected, Waiting for Quotation, Quotation Sent, Converted and Lost.' },
          { icon: <IconWallet />, variant: 'accent', title: 'Hot, warm & cold with expected amount', description: 'Set priority and expected value for each lead, so you spend time on the work that is worth the most.' },
          { icon: <IconClock />, variant: 'success', title: 'Full follow-up history', description: 'Every call and note is saved on the lead, so anyone at the desk can pick up where the last person stopped.' },
          { icon: <IconUsers />, variant: 'brand', title: 'Sources & lost reasons', description: 'See which source brings leads (walk-in, referral, WhatsApp, RC search) and why leads are lost.' },
        ],
      }}
      checklist={{
        label: 'Lead record',
        title: 'What every lead in RTO Sarthi holds',
        description: 'Everything you need to make the next call count.',
        listTitle: 'Each lead includes',
        items: [
          'Name, mobile, email & city', 'Vehicle number', 'Work type: permit, tax, fitness, PUC or insurance', 'Current expiry date',
          'Expiry of every document (RC search leads)', 'Expected amount', 'Hot, warm or cold priority', 'Lead source',
          'Status & lost reason', 'Next follow-up date & time', 'Follow-up history with notes', 'One-tap Call & WhatsApp',
        ],
      }}
      audiences={{
        title: 'Who uses RTO Sarthi for lead management?',
        description: 'For every desk that gets more enquiries than it can remember.',
        items: ['RTO agents and consultants', 'Multi-agent RTO offices', 'Insurance agents', 'PUC centers', 'Permit and transport consultants', 'Vehicle dealers handling RTO work'],
      }}
      related={[
        { to: '/rto-agent-crm-software', label: 'RTO agent CRM software' },
        { to: '/vehicle-information-software', label: 'Vehicle information software' },
        { to: '/vehicle-document-expiry-reminder-software', label: 'Vehicle document expiry reminder' },
      ]}
      faq={{
        title: 'RTO agent lead management software — FAQ',
        description: 'Answers about managing enquiries and follow-ups with RTO Sarthi.',
        items: rtoAgentLeadFaqs,
      }}
      cta={{
        title: 'Stop losing RTO work to missed follow-ups',
        text: 'Start a free trial of RTO Sarthi and see every lead, follow-up and conversion in one place.',
      }}
    />
  )
}
