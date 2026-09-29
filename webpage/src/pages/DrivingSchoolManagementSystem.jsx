import ProductLanding from '../components/ProductLanding'
import { IconUsers, IconWhatsApp, IconWallet, IconChart, IconUpload, IconClock, IconCar, IconRenewal } from '../components/Icons'
import { drivingSchoolSystemFaqs } from '../data/drivingSchoolSystem'

const s = (t) => <strong className="text-slate-700">{t}</strong>

export default function DrivingSchoolManagementSystem() {
  return (
    <ProductLanding
      hero={{
        label: 'RTO Sarthi — Driving School Management System',
        title: 'Driving School Management System — From Admission to Driving Licence',
        intro:
          'One connected system for your driving school. RTO Sarthi follows every student from admission and fees to learner licence and permanent DL, with automatic WhatsApp follow-ups, an LL expiry dashboard and pending balance tracking.',
        tags: ['Admission → DL', 'Fee Instalments', 'Auto WhatsApp', 'LL Expiry Dashboard', 'Multi-User', 'RTO Work'],
      }}
      overview={{
        title: 'A complete system, not just a digital register',
        description: 'Every step of the student journey connected in one place.',
        paragraphs: [
          <>
            In most driving schools, each step lives in a different place: admissions in one register, fees in a
            notebook, documents in a file, LL dates on the phone, and follow-ups in the owner’s memory. When one step
            is missed, the school loses the DL work, the pending fee, or both.
          </>,
          <>
            {s('RTO Sarthi is a driving school management system')} that connects all of these steps. A student is
            admitted once, and the same record carries their documents, fee instalments, learner licence, permanent
            DL and final payment.
          </>,
          <>
            The system does the reminding for you: {s('30 days after LL issue the student gets an automatic WhatsApp message')}{' '}
            for full DL eligibility, the {s('LL expiry dashboard')} shows learner licences about to lapse, and{' '}
            {s('pending balance')} is visible on every student. Owner and staff work in the same system, and your RTO
            work runs alongside it.
          </>,
        ],
      }}
      steps={{
        title: 'The student journey in the RTO Sarthi system',
        description: 'Each stage connected, with the system handling follow-ups.',
        items: [
          { title: 'Admission & documents', description: 'Student details, licence class, Aadhaar, photo and signature, total fee and first instalment, recorded once.' },
          { title: 'LL & automatic follow-up', description: 'Save the LL issue date. The system sends the 30-day DL eligibility WhatsApp and shows the LL on the expiry dashboard.' },
          { title: 'DL & final payment', description: 'Save the DL number and validity and collect the balance. The complete history stays in the student record.' },
        ],
      }}
      features={{
        title: 'What the driving school management system includes',
        description: 'The parts that make it a system: records, automation, dashboards and access.',
        items: [
          { icon: <IconRenewal />, variant: 'brand', title: 'Connected student lifecycle', description: 'Admission, fees, LL, DL and renewal in one record instead of separate registers.' },
          { icon: <IconWhatsApp />, variant: 'whatsapp', title: 'Automated WhatsApp follow-up', description: 'The system messages students 30 days after LL issue when they are eligible for the permanent DL.' },
          { icon: <IconClock />, variant: 'accent', title: 'LL expiry dashboard', description: 'All learner licences close to their 6-month validity, in one view.' },
          { icon: <IconWallet />, variant: 'success', title: 'Fee instalments & dues', description: 'Every payment recorded, with pending balance and profit per student.' },
          { icon: <IconChart />, variant: 'brand', title: 'Search & overview', description: 'Find any student by name or licence number and see their full status instantly.' },
          { icon: <IconUsers />, variant: 'accent', title: 'Owner, staff & referrals', description: 'Multiple users on the same records, with the referral source saved for each student.' },
          { icon: <IconUpload />, variant: 'success', title: 'Central document store', description: 'Student documents attached to their record, available on mobile and computer.' },
          { icon: <IconCar />, variant: 'brand', title: 'RTO desk in the same system', description: 'Registration, transfer, tax, fitness, permit, insurance and PUC with WhatsApp expiry reminders.' },
        ],
      }}
      checklist={{
        label: 'Manual vs system',
        title: 'Manual process vs RTO Sarthi driving school management system',
        description: 'What the system takes off the owner’s mind.',
        listTitle: 'With the RTO Sarthi system you no longer need',
        items: [
          'A separate admissions register', 'A fee notebook', 'Paper document files', 'LL dates saved on your phone',
          'Manual 30-day reminders', 'Calling to check LL expiry', 'Asking who still owes fees', 'Separate RTO work records',
          'One person to remember everything', 'Searching through pages', 'Visiting the office to check records', 'Guessing where admissions came from',
        ],
        note: 'RTO Sarthi covers admissions, fees, documents, licence work and follow-ups. It does not manage class schedules or instructor attendance.',
      }}
      audiences={{
        title: 'Which driving schools use this management system?',
        description: 'For schools that want their office work on one system.',
        items: ['Motor driving school owners', 'Two-wheeler & car training schools', 'Heavy vehicle training schools', 'Driving schools with multiple staff', 'Driving schools doing RTO work', 'RTO agents who run a driving school'],
      }}
      related={[
        { to: '/driving-school-management-software', label: 'Driving school management software' },
        { to: '/driving-school-software', label: 'Driving school software' },
        { to: '/driving-licence-management-system', label: 'Driving licence management system' },
      ]}
      faq={{
        title: 'Driving school management system — FAQ',
        description: 'Questions driving school owners ask before moving to a management system.',
        items: drivingSchoolSystemFaqs,
      }}
      cta={{
        title: 'Move your driving school onto one management system',
        text: 'Start a free trial of RTO Sarthi and connect admissions, fees, licences and follow-ups in one place.',
      }}
    />
  )
}
