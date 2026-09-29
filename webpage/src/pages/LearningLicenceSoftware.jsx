import ProductLanding from '../components/ProductLanding'
import { IconUsers, IconWhatsApp, IconWallet, IconRenewal, IconChart, IconUpload, IconClock, IconCar } from '../components/Icons'
import { learningLicenceFaqs } from '../data/learningLicence'

const s = (t) => <strong className="text-slate-700">{t}</strong>

export default function LearningLicenceSoftware() {
  return (
    <ProductLanding
      hero={{
        label: 'RTO Sarthi — Learning Licence Software for RTO Agents',
        title: 'Learning Licence Software for RTO Agents — Manage LL & DL Work Easily with RTO Sarthi',
        intro:
          'RTO Sarthi is learning licence software for RTO agents. Manage every learner licence and driving licence applicant in one place, send an automatic WhatsApp message 30 days after LL issue for full DL eligibility, track pending balance and see every expiring LL on one dashboard.',
        tags: ['Learning Licence', 'Driving Licence', '30-Day DL WhatsApp', 'LL Expiry Dashboard', 'Pending Balance', 'All RTO Work'],
      }}
      overview={{
        title: 'Learning licence software for RTO agents: never lose a DL after the LL',
        description: 'Made for RTO agents who handle learner licence and driving licence work every day.',
        paragraphs: [
          <>
            Every learning licence you make is the start of a second job: the permanent driving licence. But once the
            LL is issued, applicants forget, the 30-day waiting period passes, the LL comes close to expiry, and the DL
            work often goes to someone else. Keeping track of all this in a register or on WhatsApp chats is not
            possible when you handle dozens of applicants every month.
          </>,
          <>
            With {s('RTO Sarthi learning licence software')}, you add the applicant once and the software does the
            follow-up for you. {s('30 days after the learning licence is issued, RTO Sarthi automatically sends a WhatsApp message')}{' '}
            to the applicant that they are now eligible for the full driving licence, so they come back to you for the
            DL test.
          </>,
          <>
            The {s('learning licence expiry dashboard')} shows every LL that is about to expire, and the{' '}
            {s('pending balance')} view shows which applicants still have to pay. And because RTO Sarthi is complete RTO
            agent software, you manage your vehicle, tax, permit, PUC and insurance work in the same place.
          </>,
        ],
      }}
      steps={{
        title: 'How learning licence work runs in RTO Sarthi',
        description: 'From LL application to permanent DL, with automatic follow-up.',
        items: [
          { title: 'Add the LL applicant', description: 'Save name, date of birth, father’s name, mobile, address and licence class. Upload Aadhaar, photo and signature, and record the fee.' },
          { title: 'Save LL issue date', description: 'Enter the LL number with issue and expiry date. RTO Sarthi sends an automatic WhatsApp message after 30 days for full DL eligibility.' },
          { title: 'Complete the DL', description: 'When the applicant comes back, save the DL number and expiry in the same record, and collect the pending balance.' },
        ],
      }}
      features={{
        title: 'Features of RTO Sarthi learning licence software',
        description: 'Everything an RTO agent needs to manage LL and DL work easily.',
        items: [
          { icon: <IconWhatsApp />, variant: 'whatsapp', title: 'Automatic WhatsApp after 30 days', description: '30 days after LL issue, the applicant automatically gets a WhatsApp message that they are eligible for the full driving licence.' },
          { icon: <IconClock />, variant: 'accent', title: 'Learning licence expiry dashboard', description: 'See all learner licences expiring soon in one dashboard and follow up before the LL lapses.' },
          { icon: <IconWallet />, variant: 'brand', title: 'Pending balance tracking', description: 'Track total fee, paid amount and pending balance for every applicant, with profit per application.' },
          { icon: <IconRenewal />, variant: 'success', title: 'LL to DL in one record', description: 'Learning licence, permanent DL and DL renewal stay in the same applicant history.' },
          { icon: <IconUpload />, variant: 'brand', title: 'Document storage', description: 'Upload Aadhaar, photo, signature, LL, DL and other documents for each applicant.' },
          { icon: <IconUsers />, variant: 'accent', title: 'Referral tracking', description: 'Record the driving school or sub-agent who referred the applicant.' },
          { icon: <IconChart />, variant: 'success', title: 'Fast search', description: 'Find any applicant instantly by name, mobile, LL number or DL number.' },
          { icon: <IconCar />, variant: 'brand', title: 'Manage all other RTO work', description: 'Registration, transfer, tax, fitness, permit, PUC and insurance work in the same RTO agent software.' },
        ],
      }}
      checklist={{
        label: 'Why it matters',
        title: 'What RTO Sarthi does for your learning licence work',
        description: 'Automatic follow-up means more DL work and fewer missed payments.',
        listTitle: 'With RTO Sarthi you get',
        items: [
          'Automatic WhatsApp for DL eligibility', 'Message sent 30 days after LL issue', 'LL expiry dashboard', 'Follow-up before LL lapses',
          'Pending balance for every applicant', 'Profit per application', 'LL & DL numbers with validity', 'Aadhaar, photo & signature storage',
          'New LL, new DL & DL renewal', 'Referred-by name & mobile', 'Works on mobile & computer', 'Vehicle, tax, permit & PUC work too',
        ],
        note: 'A learner licence is valid for 6 months. Applicants can apply for the permanent DL 30 days after the LL is issued.',
      }}
      audiences={{
        title: 'Who uses learning licence software?',
        description: 'For everyone who handles learner licence and DL paperwork.',
        items: ['RTO agents and consultants', 'Driving licence consultants', 'Driving schools doing LL / DL work', 'Multi-agent RTO offices', 'CSC and online service centers', 'Sub-agents working with RTO agents'],
      }}
      related={[
        { to: '/driving-licence-software', label: 'Driving licence software' },
        { to: '/driving-school-software', label: 'Driving school software' },
        { to: '/rto-management-software', label: 'RTO management software' },
      ]}
      faq={{
        title: 'Learning licence software for RTO agents — FAQ',
        description: 'Answers about managing LL and DL work with RTO Sarthi.',
        items: learningLicenceFaqs,
      }}
      cta={{
        title: 'Manage learning licence work easily with RTO Sarthi',
        text: 'Start a free trial and let RTO Sarthi send DL eligibility reminders, track LL expiry and pending balance for you.',
      }}
    />
  )
}
