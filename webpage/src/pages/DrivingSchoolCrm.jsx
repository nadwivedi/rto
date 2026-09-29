import ProductLanding from '../components/ProductLanding'
import { IconUsers, IconWhatsApp, IconWallet, IconUpload, IconClock, IconCar, IconChart, IconBell } from '../components/Icons'
import { drivingSchoolCrmFaqs } from '../data/drivingSchoolCrm'

const s = (t) => <strong className="text-slate-700">{t}</strong>

export default function DrivingSchoolCrm() {
  return (
    <ProductLanding
      hero={{
        label: 'RTO Sarthi — Driving School CRM',
        title: 'Driving School CRM — Follow Up With Every Student on WhatsApp, Automatically',
        intro:
          'RTO Sarthi keeps every student’s details, documents, fees and licence history in one place and follows up for you on WhatsApp, so students come back for the DL, pay their dues and return for RTO work.',
        tags: ['Student Records', 'Auto WhatsApp', 'LL Expiry Dashboard', 'Referral Sources', 'Fee Follow-up', 'Repeat RTO Work'],
      }}
      overview={{
        title: 'Why a driving school needs a CRM',
        description: 'The relationship with a student does not end at admission.',
        paragraphs: [
          <>
            A driving school’s income depends on relationships. A student joins, gets a learner licence, needs to
            come back after 30 days for the permanent DL, has to clear the remaining fee, and later may need a
            vehicle registered, transferred or insured. Every one of these is a follow-up, and every missed follow-up
            is lost income.
          </>,
          <>
            {s('RTO Sarthi works as a CRM for driving schools.')} Each student has one record with contact details,
            documents, fees, LL and DL history and who referred them. You always know where each student is and
            what they need next.
          </>,
          <>
            The follow-ups run on their own: {s('an automatic WhatsApp message 30 days after LL issue')} for DL
            eligibility, an {s('LL expiry dashboard')} for students who have not returned, and{' '}
            {s('WhatsApp expiry reminders')} for customers whose vehicle work you manage.
          </>,
        ],
      }}
      steps={{
        title: 'The student relationship in RTO Sarthi',
        description: 'From first admission to repeat customer.',
        items: [
          { title: 'Capture the student', description: 'Contact details, documents, licence class, fee and who referred them, in one record.' },
          { title: 'Automatic follow-ups', description: 'WhatsApp at 30 days for DL eligibility, LL expiry dashboard for calls, and pending fee visible on the record.' },
          { title: 'Repeat business', description: 'After the DL, manage their registration, transfer, insurance and PUC work with WhatsApp renewal reminders.' },
        ],
      }}
      features={{
        title: 'Driving school CRM features',
        description: 'Everything you need to stay in touch with students and customers.',
        items: [
          { icon: <IconUsers />, variant: 'brand', title: '360° student record', description: 'Contact details, documents, fees, LL and DL history, all in one profile.' },
          { icon: <IconWhatsApp />, variant: 'whatsapp', title: 'Automatic WhatsApp follow-up', description: 'Students are messaged 30 days after LL issue when they become eligible for the permanent DL.' },
          { icon: <IconClock />, variant: 'accent', title: 'LL expiry dashboard', description: 'See which students’ learner licences are close to expiry and call them first.' },
          { icon: <IconChart />, variant: 'success', title: 'Referral source tracking', description: 'Record who referred each student and see which sources bring admissions.' },
          { icon: <IconWallet />, variant: 'brand', title: 'Fee follow-up', description: 'Pending balance on every student record, so collecting dues is part of the follow-up.' },
          { icon: <IconBell />, variant: 'accent', title: 'Renewal reminders for customers', description: 'WhatsApp reminders before tax, fitness, permit, insurance and PUC expiry.' },
          { icon: <IconCar />, variant: 'success', title: 'Repeat RTO work', description: 'Handle registration, transfer and other RTO work for the same customers.' },
          { icon: <IconUpload />, variant: 'brand', title: 'Documents on hand', description: 'Student and customer documents stored with their record, on mobile and computer.' },
        ],
      }}
      checklist={{
        label: 'Follow-ups',
        title: 'Follow-ups the CRM handles for your school',
        description: 'The contact points that bring students and customers back.',
        listTitle: 'With RTO Sarthi you never miss',
        items: [
          'DL eligibility after 30 days', 'Learner licences near expiry', 'Pending fee from students', 'Who referred each student',
          'Students who did not return', 'DL renewal for past students', 'Vehicle tax expiry', 'Fitness & permit expiry',
          'Insurance renewal', 'PUC renewal', 'Customer contact details', 'Full history of every customer',
        ],
        note: 'RTO Sarthi focuses on admitted students and customers. Ask us if you need enquiry or lead tracking before admission.',
      }}
      audiences={{
        title: 'Who uses RTO Sarthi as a driving school CRM?',
        description: 'Schools that want more students to come back.',
        items: ['Motor driving school owners', 'Driving schools doing RTO work', 'Two-wheeler & car training schools', 'Heavy vehicle training schools', 'Driving schools with multiple staff', 'RTO agents who run a driving school'],
      }}
      related={[
        { to: '/driving-school-management-system', label: 'Driving school management system' },
        { to: '/best-driving-school-software-india', label: 'Best driving school software India' },
        { to: '/learning-licence-software', label: 'Learning licence software' },
        { to: '/rto-agent-crm-software', label: 'RTO agent CRM software' },
      ]}
      faq={{
        title: 'Driving school CRM — FAQ',
        description: 'Answers about using RTO Sarthi to manage student relationships.',
        items: drivingSchoolCrmFaqs,
      }}
      cta={{
        title: 'Turn every student into a repeat customer',
        text: 'Start a free trial of RTO Sarthi and let automatic WhatsApp follow-ups bring students back for the DL and more.',
      }}
    />
  )
}
