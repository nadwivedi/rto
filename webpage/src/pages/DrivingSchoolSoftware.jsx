import ProductLanding from '../components/ProductLanding'
import { IconUsers, IconWallet, IconUpload, IconWhatsApp, IconClock, IconCar, IconShield, IconChart } from '../components/Icons'
import { drivingSchoolFaqs } from '../data/drivingSchool'

const s = (t) => <strong className="text-slate-700">{t}</strong>

export default function DrivingSchoolSoftware() {
  return (
    <ProductLanding
      hero={{
        label: 'RTO Sarthi — Driving School Software',
        title: 'Driving School Software — Manage Admissions, Fees, Licence & RTO Work in One Place',
        intro:
          'RTO Sarthi helps driving school owners manage student admissions, fees and documents, track learner licence and DL progress, and handle the RTO work their school does, all from one software.',
        tags: ['Student Admissions', 'Fees & Balance', 'Documents', 'LL & DL Tracking', 'LL → DL Alert', 'RTO Work'],
      }}
      overview={{
        title: 'Driving school software with RTO work built in',
        description: 'For driving schools that also make licences and do RTO work.',
        paragraphs: [
          <>
            A driving school owner handles two kinds of work every day. First the{' '}
            {s('admissions')}: new students, their documents, fees and pending payments. Then the{' '}
            {s('licence and RTO work')}: learner licence, permanent DL, and often vehicle
            registration, transfer, insurance and PUC for customers.
          </>,
          <>
            With {s('RTO Sarthi driving school software')} both live in one place. Admit a student,
            store their documents, collect fees, and follow their learner licence to the permanent
            driving licence with a WhatsApp alert when the DL test is due. If your school also does
            RTO work, manage it in the same software with automatic expiry reminders.
          </>,
        ],
      }}
      steps={{
        title: 'How a driving school uses RTO Sarthi',
        description: 'From admission to driving licence.',
        items: [
          { title: 'Take the admission', description: 'Add the student with personal details, licence class and documents (Aadhaar, photo, signature). Record the admission fee.' },
          { title: 'Learner licence', description: 'Save the LL application and learner licence number with validity. Get a WhatsApp alert when the student is eligible for the DL.' },
          { title: 'Driving licence', description: 'Record the permanent DL number and expiry, collect the balance fee and keep the complete file.' },
        ],
      }}
      features={{
        title: 'Features for driving school owners',
        description: 'Admissions, fees, licences and RTO work in one software.',
        items: [
          { icon: <IconUsers />, variant: 'brand', title: 'Student admissions', description: 'Every student’s name, date of birth, father’s name, mobile, address and licence class in one searchable record.' },
          { icon: <IconWallet />, variant: 'accent', title: 'Fees, balance & profit', description: 'Record admission fee and payments, see pending balance and profit for every student.' },
          { icon: <IconUpload />, variant: 'brand', title: 'Student documents', description: 'Upload Aadhaar, photo, signature, learner licence and driving licence for each student.' },
          { icon: <IconClock />, variant: 'success', title: 'LL & DL tracking', description: 'Learner licence and driving licence numbers with issue and expiry dates.' },
          { icon: <IconWhatsApp />, variant: 'whatsapp', title: 'DL test due alert', description: 'WhatsApp alert when a student’s learner licence becomes eligible for the permanent DL.' },
          { icon: <IconChart />, variant: 'accent', title: 'Referral tracking', description: 'Save who referred each student to see where admissions come from.' },
          { icon: <IconCar />, variant: 'brand', title: 'RTO work for customers', description: 'Vehicle registration, transfer, HPA / HPT, NOC, tax, fitness and permit work in the same software.' },
          { icon: <IconShield />, variant: 'success', title: 'Insurance & PUC', description: 'Manage insurance and PUC for customers with automatic WhatsApp renewal reminders.' },
        ],
      }}
      checklist={{
        label: 'One software',
        title: 'Driving school + RTO work, managed together',
        description: 'No separate register for the school and the RTO desk.',
        listTitle: 'What you can manage in RTO Sarthi',
        items: [
          'Student admissions', 'Admission fees & balance', 'Student documents', 'Learner licence',
          'Permanent DL', 'DL renewal', 'Vehicle registration', 'Vehicle transfer',
          'Insurance & PUC', 'Tax, fitness & permit', 'WhatsApp reminders', 'Client pending balance',
        ],
      }}
      audiences={{
        title: 'Who uses RTO Sarthi driving school software?',
        description: 'Made for motor driving schools of every size.',
        items: ['Motor driving school owners', 'Driving schools doing RTO work', 'Two-wheeler & car training schools', 'Heavy vehicle training schools', 'RTO agents running a driving school', 'Driving schools with multiple staff'],
      }}
      related={[
        { to: '/driving-licence-software', label: 'Driving licence software' },
        { to: '/rto-management-software', label: 'RTO management software' },
      ]}
      faq={{
        title: 'Driving school software — FAQ',
        description: 'Answers about managing admissions, fees, licences and RTO work.',
        items: drivingSchoolFaqs,
      }}
      cta={{
        title: 'Run your driving school and RTO work from one software',
        text: 'Try RTO Sarthi free and manage admissions, fees and licence work without paper registers.',
      }}
    />
  )
}
