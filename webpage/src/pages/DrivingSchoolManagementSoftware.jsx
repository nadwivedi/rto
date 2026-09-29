import ProductLanding from '../components/ProductLanding'
import { IconUsers, IconWhatsApp, IconWallet, IconChart, IconUpload, IconClock, IconCar, IconDocument } from '../components/Icons'
import { drivingSchoolManagementFaqs } from '../data/drivingSchoolManagement'

const s = (t) => <strong className="text-slate-700">{t}</strong>

export default function DrivingSchoolManagementSoftware() {
  return (
    <ProductLanding
      hero={{
        label: 'RTO Sarthi — Driving School Management Software',
        title: 'Driving School Management Software — Admissions, Fees & Licence Follow-ups',
        intro:
          'Manage your driving school without registers. RTO Sarthi keeps every student’s admission, documents, fees and pending dues, and LL and DL progress in one place, and follows up with students on WhatsApp automatically.',
        tags: ['Admissions Register', 'Fee Dues', 'Student Documents', 'Auto WhatsApp', 'LL Expiry Dashboard', 'Multi-User'],
      }}
      overview={{
        title: 'Manage your driving school’s office work in one software',
        description: 'Admissions, money and follow-ups: the work that decides whether a school grows.',
        paragraphs: [
          <>
            Running a driving school is not only about training. Every day the owner has to take admissions, keep
            student documents safe, collect fees in parts, remember who still owes money, and follow up with students
            for their learner licence and permanent DL. When all this lives in a register and on WhatsApp, dues get
            missed and students drift away after the LL.
          </>,
          <>
            {s('RTO Sarthi driving school management software')} gives every student one digital record: personal
            details, licence class, documents, fee and payments, LL and DL numbers with validity, and who referred
            them. You always know {s('how much fee is pending')} and from whom.
          </>,
          <>
            Follow-ups run automatically. {s('30 days after the learning licence is issued, the student gets a WhatsApp message')}{' '}
            that they are eligible for the permanent DL, and the {s('LL expiry dashboard')} shows every student whose
            learner licence is close to lapsing. If your school also does RTO work, manage it in the same software.
          </>,
        ],
      }}
      steps={{
        title: 'How to manage your driving school with RTO Sarthi',
        description: 'Admission to driving licence, with fees tracked throughout.',
        items: [
          { title: 'Take the admission', description: 'Add the student with details, licence class and documents, and record the total fee and first payment.' },
          { title: 'Track fees & LL', description: 'Record each instalment and see pending dues. Save the LL issue date so the 30-day WhatsApp goes out automatically.' },
          { title: 'Complete the DL', description: 'Save the DL number and validity, collect the remaining fee and keep the complete student file.' },
        ],
      }}
      features={{
        title: 'Driving school management software features',
        description: 'Everything the driving school office needs, in one place.',
        items: [
          { icon: <IconDocument />, variant: 'brand', title: 'Digital admissions register', description: 'Every student’s name, date of birth, father’s name, mobile, address and licence class, searchable in seconds.' },
          { icon: <IconWallet />, variant: 'accent', title: 'Fee collection & pending dues', description: 'Total fee, instalments paid, pending balance and profit for every student.' },
          { icon: <IconWhatsApp />, variant: 'whatsapp', title: 'Automatic WhatsApp to students', description: 'Students get a WhatsApp message 30 days after LL issue when they are eligible for the permanent DL.' },
          { icon: <IconClock />, variant: 'success', title: 'LL expiry dashboard', description: 'See every student whose learner licence is expiring soon and call them before it lapses.' },
          { icon: <IconUpload />, variant: 'brand', title: 'Student document storage', description: 'Aadhaar, photo, signature, LL and DL copies stored with each student.' },
          { icon: <IconChart />, variant: 'accent', title: 'Referral & admission sources', description: 'Record who referred each student to see which sources bring admissions.' },
          { icon: <IconUsers />, variant: 'success', title: 'Owner & staff access', description: 'Multiple users can work on the same student records from mobile or computer.' },
          { icon: <IconCar />, variant: 'brand', title: 'RTO work for customers', description: 'Registration, transfer, tax, fitness, permit, insurance and PUC with WhatsApp expiry reminders.' },
        ],
      }}
      checklist={{
        label: 'Student record',
        title: 'What you store for every driving school student',
        description: 'A complete digital file instead of a register entry.',
        listTitle: 'Each student record includes',
        items: [
          'Name, date of birth & gender', 'Father’s name', 'Mobile, email & address', 'Licence class',
          'Total fee & instalments', 'Pending balance & profit', 'LL number, issue & expiry', 'DL number, issue & expiry',
          'Aadhaar, photo & signature', 'Referred by (name & mobile)', 'Auto WhatsApp for DL eligibility', 'Full history in one place',
        ],
        note: 'RTO Sarthi focuses on admissions, fees, licence work and follow-ups. It does not manage class schedules or instructor attendance.',
      }}
      audiences={{
        title: 'Who uses this driving school management software?',
        description: 'Built for motor driving schools across India.',
        items: ['Motor driving school owners', 'Two-wheeler & car training schools', 'Heavy vehicle training schools', 'Driving schools doing RTO work', 'Driving schools with multiple staff', 'RTO agents who run a driving school'],
      }}
      related={[
        { to: '/driving-school-software', label: 'Driving school software' },
        { to: '/driving-school-management-system', label: 'Driving school management system' },
        { to: '/driving-school-crm', label: 'Driving school CRM' },
        { to: '/learning-licence-software', label: 'Learning licence software' },
        { to: '/driving-licence-management-system', label: 'Driving licence management system' },
      ]}
      faq={{
        title: 'Driving school management software — FAQ',
        description: 'Answers for driving school owners about managing their school with RTO Sarthi.',
        items: drivingSchoolManagementFaqs,
      }}
      cta={{
        title: 'Manage your driving school from one software',
        text: 'Start a free trial of RTO Sarthi and track admissions, fee dues and student licences without registers.',
      }}
    />
  )
}
