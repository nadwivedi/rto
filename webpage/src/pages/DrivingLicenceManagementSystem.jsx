import ProductLanding from '../components/ProductLanding'
import { IconUsers, IconWhatsApp, IconWallet, IconRenewal, IconChart, IconUpload, IconClock, IconCar } from '../components/Icons'
import { dlManagementSystemFaqs } from '../data/dlManagementSystem'

const s = (t) => <strong className="text-slate-700">{t}</strong>

export default function DrivingLicenceManagementSystem() {
  return (
    <ProductLanding
      hero={{
        label: 'RTO Sarthi — Driving Licence Management System',
        title: 'Driving Licence Management System for RTO Agents — RTO Sarthi',
        intro:
          'Run all your learner licence and driving licence work from one system. RTO Sarthi keeps every applicant, document, LL and DL validity and payment in one place, and sends automatic WhatsApp follow-ups so no DL work is missed.',
        tags: ['LL & DL Records', 'Auto WhatsApp', 'LL Expiry Dashboard', 'Pending Balance', 'Multi-Agent', 'All RTO Work'],
      }}
      overview={{
        title: 'Why RTO agents need a driving licence management system',
        description: 'Move from registers, files and WhatsApp chats to one organised system.',
        paragraphs: [
          <>
            Most RTO agents still manage driving licence work with a register, an Excel sheet and a phone full of
            WhatsApp chats. It works for ten applicants, but not for a hundred. Documents get misplaced, applicants
            are not called back after their learning licence, LLs expire, and small pending payments add up to a big
            loss.
          </>,
          <>
            {s('RTO Sarthi is a driving licence management system built for RTO agents.')} Every applicant gets one
            digital record that follows the complete journey: learner licence application, LL number and validity,
            permanent DL, and later DL renewal, with documents and payments attached.
          </>,
          <>
            The system also does the follow-up for you. {s('30 days after the learning licence is issued, it sends an automatic WhatsApp message')}{' '}
            to the applicant for full DL eligibility. The {s('LL expiry dashboard')} shows every learner licence about
            to lapse, and the {s('pending balance')} view shows who still has to pay. Your vehicle, tax, permit, PUC
            and insurance work runs in the same system.
          </>,
        ],
      }}
      steps={{
        title: 'How the driving licence management system works',
        description: 'One record per applicant, from LL to DL renewal.',
        items: [
          { title: 'Register the applicant', description: 'Add personal details, application type and licence class, upload documents and record the fee in under a minute.' },
          { title: 'Let the system follow up', description: 'Save the LL issue date. RTO Sarthi sends the DL eligibility WhatsApp after 30 days and shows the LL on the expiry dashboard before it lapses.' },
          { title: 'Close the DL & collect', description: 'Save the DL number and validity in the same record and clear the pending balance. Renewals continue in the same history.' },
        ],
      }}
      features={{
        title: 'Driving licence management system features',
        description: 'Built around how an RTO agent’s licence desk actually works.',
        items: [
          { icon: <IconRenewal />, variant: 'brand', title: 'Complete LL → DL → renewal cycle', description: 'New learner licence, new DL and DL renewal in one applicant record with full history.' },
          { icon: <IconWhatsApp />, variant: 'whatsapp', title: 'Automatic WhatsApp follow-up', description: 'Applicants get a WhatsApp message 30 days after LL issue for full driving licence eligibility.' },
          { icon: <IconClock />, variant: 'accent', title: 'LL expiry dashboard', description: 'See every learner licence expiring soon and follow up before the applicant has to apply again.' },
          { icon: <IconWallet />, variant: 'success', title: 'Fees, pending balance & profit', description: 'Total fee, paid amount, balance and profit for every LL and DL application.' },
          { icon: <IconChart />, variant: 'brand', title: 'Dashboard & quick search', description: 'Get an overview of your licence work and open any applicant by name or licence number.' },
          { icon: <IconUsers />, variant: 'accent', title: 'Multi-agent & referrals', description: 'Staff and sub-agents work in the same system, and you record who referred each applicant.' },
          { icon: <IconUpload />, variant: 'success', title: 'Digital document file', description: 'Aadhaar, photo, signature, LL and DL copies stored with each applicant, available on mobile.' },
          { icon: <IconCar />, variant: 'brand', title: 'All RTO work in one system', description: 'Registration, transfer, tax, fitness, permit, PUC and insurance work alongside licences.' },
        ],
      }}
      checklist={{
        label: 'Register vs system',
        title: 'What changes when you switch from a register to RTO Sarthi',
        description: 'The same work, with the system doing the remembering.',
        listTitle: 'With the RTO Sarthi driving licence management system',
        items: [
          'No lost applicant files', 'Documents stored with each record', 'Auto WhatsApp for DL eligibility', 'No forgotten 30-day follow-ups',
          'LL expiry dashboard', 'No learner licence lapses unnoticed', 'Pending balance for every applicant', 'Profit per application',
          'Search by name or licence number', 'Multiple agents in one account', 'Works on mobile & computer', 'Vehicle & RTO work in the same place',
        ],
        note: 'A learner licence is valid for 6 months. The applicant can apply for the permanent driving licence 30 days after the LL is issued.',
      }}
      audiences={{
        title: 'Who is this driving licence management system for?',
        description: 'For every office that handles licence paperwork.',
        items: ['RTO agents and consultants', 'Multi-agent RTO offices', 'Driving licence consultants', 'Driving schools doing LL / DL work', 'CSC and online service centers', 'Sub-agents working with RTO agents'],
      }}
      related={[
        { to: '/driving-licence-software', label: 'Driving licence software' },
        { to: '/learning-licence-software', label: 'Learning licence software' },
        { to: '/rto-management-software', label: 'RTO management software' },
      ]}
      faq={{
        title: 'Driving licence management system — FAQ',
        description: 'Common questions from RTO agents about managing DL work with RTO Sarthi.',
        items: dlManagementSystemFaqs,
      }}
      cta={{
        title: 'Put your driving licence desk on one system',
        text: 'Start a free trial of RTO Sarthi and manage LL, DL, follow-ups and payments without registers.',
      }}
    />
  )
}
