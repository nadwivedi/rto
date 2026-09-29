import ProductLanding from '../components/ProductLanding'
import { IconUsers, IconWhatsApp, IconWallet, IconUpload, IconClock, IconCar, IconRenewal, IconChart } from '../components/Icons'
import { bestDrivingSchoolFaqs } from '../data/bestDrivingSchool'

const s = (t) => <strong className="text-slate-700">{t}</strong>

export default function BestDrivingSchoolSoftwareIndia() {
  return (
    <ProductLanding
      hero={{
        label: 'RTO Sarthi — Best Driving School Software in India',
        title: 'Best Driving School Software in India — How to Choose, and Why Schools Pick RTO Sarthi',
        intro:
          'Indian driving schools do more than training: admissions, fee instalments, learner licence, the 30-day wait, permanent DL and RTO work. The best driving school software in India should handle all of it. Here is what to look for.',
        tags: ['Made for India', 'LL & DL Work', 'WhatsApp Follow-ups', 'Fee Dues', 'Mobile + Multi-User', 'RTO Work'],
      }}
      overview={{
        title: 'What makes driving school software “best” for India?',
        description: 'Indian schools need software that understands licence work, not just attendance.',
        paragraphs: [
          <>
            Many driving school software products are built around class schedules and instructors. But for most
            Indian driving schools, the real work, and the real income, is in {s('admissions, fee collection and licence work')}:
            the learner licence, the 30-day waiting period, the permanent DL, and often RTO work for vehicles.
          </>,
          <>
            So the best driving school software in India should keep every student’s documents, fees and LL and DL
            records together, and should {s('follow up on WhatsApp automatically')}, because that is where Indian
            students actually read their messages. It should run on a mobile phone, let staff work together, and
            handle the RTO desk as well.
          </>,
          <>
            {s('RTO Sarthi was built from RTO agent software')}, so it understands this work. It sends an automatic
            WhatsApp message 30 days after the learning licence for DL eligibility, shows an LL expiry dashboard,
            tracks pending balance for every student, and manages registration, transfer, insurance and PUC work in
            the same place.
          </>,
        ],
      }}
      steps={{
        label: 'How to choose',
        title: 'How to choose the best driving school software',
        description: 'Three questions to ask before you buy.',
        items: [
          { title: 'Does it handle LL & DL?', description: 'Look for learner licence and DL numbers with validity, and a reminder when the student becomes eligible for the DL.' },
          { title: 'Does it track money?', description: 'Fee instalments, pending balance and profit per student should be visible without a separate notebook.' },
          { title: 'Does it follow up for you?', description: 'Automatic WhatsApp messages and an LL expiry dashboard save calls and bring students back for the DL.' },
        ],
      }}
      features={{
        title: 'How RTO Sarthi meets each requirement',
        description: 'The features Indian driving schools ask for most.',
        items: [
          { icon: <IconRenewal />, variant: 'brand', title: 'LL, DL & renewal records', description: 'Learner licence and driving licence numbers with issue and expiry dates, in one student record.' },
          { icon: <IconWhatsApp />, variant: 'whatsapp', title: 'Automatic WhatsApp at 30 days', description: 'Students are messaged automatically when they become eligible for the permanent DL.' },
          { icon: <IconClock />, variant: 'accent', title: 'LL expiry dashboard', description: 'Every learner licence close to its 6-month validity in one list.' },
          { icon: <IconWallet />, variant: 'success', title: 'Fee instalments & pending balance', description: 'Total fee, payments, balance and profit for every student.' },
          { icon: <IconUpload />, variant: 'brand', title: 'Student documents', description: 'Aadhaar, photo, signature, LL and DL copies with each student.' },
          { icon: <IconUsers />, variant: 'accent', title: 'Mobile & multi-user', description: 'Works on phone and computer, with owner and staff on the same records.' },
          { icon: <IconChart />, variant: 'success', title: 'Referral tracking & search', description: 'Know who referred each student and find anyone by name or licence number.' },
          { icon: <IconCar />, variant: 'brand', title: 'RTO work included', description: 'Registration, transfer, tax, fitness, permit, insurance and PUC with WhatsApp expiry reminders.' },
        ],
      }}
      checklist={{
        label: 'Buyer checklist',
        title: 'Driving school software checklist for India',
        description: 'Use this list to compare any software. RTO Sarthi covers all of it.',
        listTitle: 'The best driving school software in India should have',
        items: [
          'Student admission records', 'Document upload', 'Fee instalments', 'Pending balance view',
          'LL number & validity', 'DL number & validity', 'Automatic 30-day DL WhatsApp', 'LL expiry dashboard',
          'Referral tracking', 'Mobile access', 'Multiple staff users', 'RTO work in the same software',
        ],
        note: 'RTO Sarthi does not include class scheduling or instructor attendance. If those are your main need, ask us before you decide.',
      }}
      audiences={{
        title: 'Which Indian driving schools choose RTO Sarthi?',
        description: 'Schools where licence and RTO work are a big part of the business.',
        items: ['Motor driving school owners', 'Two-wheeler & car training schools', 'Heavy vehicle training schools', 'Driving schools doing RTO work', 'Driving schools with multiple staff', 'RTO agents who run a driving school'],
      }}
      related={[
        { to: '/driving-school-software', label: 'Driving school software' },
        { to: '/driving-school-management-system', label: 'Driving school management system' },
        { to: '/driving-school-crm', label: 'Driving school CRM' },
      ]}
      faq={{
        title: 'Best driving school software in India — FAQ',
        description: 'Common questions when choosing driving school software.',
        items: bestDrivingSchoolFaqs,
      }}
      cta={{
        title: 'Try the driving school software made for Indian licence work',
        text: 'Start a free trial of RTO Sarthi and check it against the checklist above for your own school.',
      }}
    />
  )
}
