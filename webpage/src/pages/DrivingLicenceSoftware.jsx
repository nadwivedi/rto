import ProductLanding from '../components/ProductLanding'
import { IconUsers, IconDocument, IconWhatsApp, IconWallet, IconRenewal, IconChart, IconUpload, IconClock } from '../components/Icons'
import { drivingLicenceFaqs } from '../data/drivingLicence'

const s = (t) => <strong className="text-slate-700">{t}</strong>

export default function DrivingLicenceSoftware() {
  return (
    <ProductLanding
      hero={{
        label: 'RTO Sarthi — Driving Licence Software for RTO Agents',
        title: 'Driving Licence Software for RTO Agents — Manage LL & DL Work with RTO Sarthi',
        intro:
          'RTO Sarthi is driving licence software for RTO agents. Manage every learner licence and driving licence application in one place: applicant details, documents, LL and DL numbers, expiry dates, fees and balance, with a WhatsApp alert when the LL becomes eligible for DL.',
        tags: ['Learner Licence', 'New DL', 'DL Renewal', 'Documents', 'Fee & Balance', 'LL → DL Alert'],
      }}
      overview={{
        title: 'Driving licence software for RTO agents: how to manage DL work with RTO Sarthi',
        description: 'Made specifically for RTO agents who handle LL and DL applications every day.',
        paragraphs: [
          <>
            For an RTO agent, driving licence work comes every day: a new learner licence, a permanent DL after the
            LL, a DL renewal. Each applicant has documents, application numbers, test dates and
            payments, and keeping them in files or a register means lost papers and forgotten
            follow-ups.
          </>,
          <>
            With {s('RTO Sarthi, the driving licence software for RTO agents')}, you add the applicant once and keep the
            whole LL and DL journey in one record: personal details, documents, learner licence
            number and validity, driving licence number and expiry, licence class, fee and balance.
            When the learner licence becomes eligible for the permanent DL, RTO Sarthi can send a
            {s(' WhatsApp alert')} so the applicant comes back to you for the DL.
          </>,
        ],
      }}
      steps={{
        title: 'Driving licence workflow for RTO agents in RTO Sarthi',
        description: 'From learner licence to permanent DL in one record.',
        items: [
          { title: 'Add the applicant', description: 'Name, date of birth, father’s name, mobile, address, application type and licence class. Upload Aadhaar, photo and signature.' },
          { title: 'Record LL, then DL', description: 'Save LL application and licence number with issue and expiry date. Get an alert when the LL is eligible for DL, then save the DL number and expiry.' },
          { title: 'Track payment', description: 'Record total fee and payments. See pending balance and your profit on every application.' },
        ],
      }}
      features={{
        title: 'Features of driving licence software for RTO agents',
        description: 'Everything an RTO agent needs for LL and DL work.',
        items: [
          { icon: <IconUsers />, variant: 'brand', title: 'Applicant records', description: 'Complete applicant profile with personal details, address and who referred the applicant.' },
          { icon: <IconRenewal />, variant: 'success', title: 'New LL, new DL & DL renewal', description: 'Choose the application type and licence class and keep every stage in the same record.' },
          { icon: <IconClock />, variant: 'accent', title: 'LL & DL validity', description: 'Store learner licence and driving licence numbers with issue and expiry dates.' },
          { icon: <IconWhatsApp />, variant: 'whatsapp', title: 'LL eligible for DL alert', description: 'WhatsApp alert when the learner licence becomes eligible for the permanent driving licence.' },
          { icon: <IconUpload />, variant: 'brand', title: 'Document storage', description: 'Upload Aadhaar, photo, signature, LL, DL and other documents for each applicant.' },
          { icon: <IconWallet />, variant: 'accent', title: 'Fee, balance & profit', description: 'Track total amount, paid amount, balance and profit for each DL application.' },
          { icon: <IconDocument />, variant: 'success', title: 'Quick DL application form', description: 'Add a new application in seconds with the quick form, and complete details later.' },
          { icon: <IconChart />, variant: 'brand', title: 'Fast search', description: 'Find any applicant instantly by name or DL number.' },
        ],
      }}
      checklist={{
        label: 'Applicant record',
        title: 'What RTO agents can store for every DL applicant',
        description: 'A complete digital file instead of paper folders.',
        listTitle: 'Driving licence record includes',
        items: [
          'Name, date of birth & gender', 'Father’s name', 'Mobile, email & address', 'Application type',
          'Licence class', 'LL application number', 'LL number, issue & expiry', 'DL number, issue & expiry',
          'Aadhaar, photo & signature', 'Referred by (name & mobile)', 'Total fee, paid & balance', 'Profit per application',
        ],
      }}
      audiences={{
        title: 'Who uses driving licence software for RTO agents?',
        description: 'For everyone who handles LL and DL paperwork.',
        items: ['RTO agents and consultants', 'Driving licence consultants', 'Driving schools doing LL / DL paperwork', 'Multi-agent RTO offices', 'CSC and online service centers', 'Sub-agents working with RTO agents'],
      }}
      related={[
        { to: '/rto-management-software', label: 'RTO management software' },
        { to: '/driving-school-software', label: 'Driving school software' },
      ]}
      faq={{
        title: 'Driving licence software for RTO agents — FAQ',
        description: 'Answers about managing LL and DL work with RTO Sarthi.',
        items: drivingLicenceFaqs,
      }}
      cta={{
        title: 'The driving licence software built for RTO agents',
        text: 'Try RTO Sarthi free and move your LL and DL files from paper to software made for RTO agents.',
      }}
    />
  )
}
