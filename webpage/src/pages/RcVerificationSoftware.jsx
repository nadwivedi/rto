import ProductLanding from '../components/ProductLanding'
import { IconCheck, IconExcel, IconWallet, IconShield, IconDocument, IconClock } from '../components/Icons'
import { rcVerificationFaqs } from '../data/rcVerification'
import { LOOKUP_PRICE } from '../data/vehicleInfo'

const s = (t) => <strong className="text-slate-700">{t}</strong>

export default function RcVerificationSoftware() {
  return (
    <ProductLanding
      hero={{
        label: 'RTO Sarthi — RC Verification Software',
        title: `RC Verification Software at Just ${LOOKUP_PRICE} per Vehicle`,
        intro: `Verify the RC of any vehicle by number: owner, chassis, engine, registration validity, hypothecation and blacklist status. Single and bulk RC verification for RTO agents, insurance agents, dealers and financers at just ${LOOKUP_PRICE} per vehicle.`,
        tags: [`${LOOKUP_PRICE} per RC`, 'Bulk RC Verification', 'All States', 'HP & Blacklist Check', 'RC PDF Download'],
      }}
      overview={{
        title: `RC verification at ${LOOKUP_PRICE}, built into RTO Sarthi`,
        description: 'Check a vehicle before transfer, purchase, finance or insurance.',
        paragraphs: [
          <>
            A fake or mismatched RC can cause a rejected transfer, a bad loan or a wrong insurance
            policy. Before taking up the work, RTO agents, dealers, financers and insurance agents
            need to confirm the registration details against the current record.
          </>,
          <>
            {s('RTO Sarthi RC verification software')} lets you verify the RC of any vehicle at
            just {s(`${LOOKUP_PRICE} per vehicle`)}, which is lower than many RC verification services. It is
            part of RTO Sarthi, the software made for RTO agents, so a verified vehicle can go
            straight into your client records with expiry reminders.
          </>,
        ],
      }}
      steps={{
        title: 'How to verify RC by vehicle number',
        description: 'Verify an RC in under a minute.',
        items: [
          { title: 'Enter vehicle number', description: 'Open Vehicle Details (RC Lookup) and type the vehicle number.' },
          { title: 'Match the details', description: 'Compare owner, chassis and engine number with the RC and documents you have.' },
          { title: 'Check status', description: 'Confirm registration validity, HP and blacklist status, then download the RC or Particular PDF.' },
        ],
      }}
      features={{
        title: 'Why choose RTO Sarthi for RC verification',
        description: 'Low price, complete details and bulk verification.',
        items: [
          { icon: <IconWallet />, variant: 'success', title: `Just ${LOOKUP_PRICE} per vehicle`, description: 'Pay per verification. No monthly minimum and no charge per field.' },
          { icon: <IconExcel />, variant: 'success', title: 'Bulk RC verification', description: 'Verify a whole list of vehicle numbers together instead of searching one by one.' },
          { icon: <IconCheck />, variant: 'brand', title: 'Owner, chassis & engine match', description: 'See registered owner, chassis number and engine number to match with the physical RC.' },
          { icon: <IconShield />, variant: 'accent', title: 'HP & blacklist status', description: 'Find hypothecation (financer) and blacklist details before transfer or purchase.' },
          { icon: <IconDocument />, variant: 'brand', title: 'RC & Particular PDF', description: 'Download the RC and Vehicle Particulars PDF from the same search, for your file.' },
          { icon: <IconClock />, variant: 'accent', title: 'Saved verification history', description: 'Every verified vehicle is saved, and re-downloading its PDFs does not use another lookup.' },
        ],
      }}
      checklist={{
        id: 'pricing',
        label: 'Pricing',
        title: `RC verification at just ${LOOKUP_PRICE}`,
        description: 'What each verification includes.',
        price: {
          caption: 'Per vehicle verification',
          amount: LOOKUP_PRICE,
          text: 'Complete RC details plus tax, fitness, PUC and insurance status.',
        },
        listTitle: 'What you can verify',
        items: [
          'Registered owner name', 'Registration number & date', 'Registration valid upto', 'Chassis number',
          'Engine number', 'Vehicle class, maker & model', 'Hypothecation / financer', 'Blacklist details',
          'Road tax paid upto', 'Fitness valid upto', 'PUC valid upto', 'Insurance validity',
        ],
      }}
      audiences={{
        title: 'Who needs RC verification software?',
        description: 'Anyone who must trust a vehicle’s registration before doing business.',
        items: ['RTO agents and consultants', 'Insurance agents and POSPs', 'Used car and bike dealers', 'Vehicle financers and NBFC agents', 'Fleet and transport operators', 'Vehicle dealers'],
      }}
      related={[
        { to: '/rc-download-software', label: 'RC download software' },
        { to: '/vehicle-information-software', label: 'Vehicle information software' },
      ]}
      faq={{
        title: 'RC verification software — FAQ',
        description: 'Answers about verifying RC by vehicle number, bulk verification and pricing.',
        items: rcVerificationFaqs,
      }}
      cta={{
        title: `Verify RC of any vehicle at just ${LOOKUP_PRICE}`,
        text: 'Start your free trial of RTO Sarthi and verify your first vehicle today.',
      }}
    />
  )
}
