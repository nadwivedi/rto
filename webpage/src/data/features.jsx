import {
  IconDocument,
  IconWhatsApp,
  IconUpload,
  IconUsers,
  IconChart,
  IconCar,
  IconBell,
  IconWallet,
  IconExcel,
  IconRenewal,
} from '../components/Icons'

export const coreFeatures = [
  {
    icon: <IconDocument />,
    iconVariant: 'brand',
    title: 'Smart Document Entry',
    description:
      'Upload RC, insurance papers, or permit copies and let RTO Sarthi auto-fill vehicle and owner details — fewer typos, faster registrations.',
  },
  {
    icon: <IconWhatsApp />,
    iconVariant: 'whatsapp',
    title: 'WhatsApp Expiry Alerts',
    description:
      'Automatic reminders for Tax, Fitness, PUC, Insurance, and Permit expiry — sent to clients on WhatsApp before deadlines are missed.',
  },
  {
    icon: <IconExcel />,
    iconVariant: 'success',
    title: 'Bulk Excel Uploads',
    description:
      'Import hundreds of PUC or Insurance records in one go using standardized Excel templates built for Indian RTO workflows.',
  },
  {
    icon: <IconUsers />,
    iconVariant: 'violet',
    title: 'Client & Vehicle Hub',
    description:
      'One place for parties, vehicles, payments, and documents — search by number plate, owner name, or mobile in seconds.',
  },
  {
    icon: <IconChart />,
    iconVariant: 'brand',
    title: 'Dashboard Analytics',
    description:
      'See what expires this week, track renewals, and monitor alert delivery from a clean dashboard designed for busy agents.',
  },
  {
    icon: <IconCar />,
    iconVariant: 'accent',
    title: 'Multi-Agent Support',
    description:
      'Separate logins and workflows for RTO agents, insurance agents, and PUC centers — everyone works on the same accurate data.',
  },
]

export const detailedFeatures = [
  {
    id: 'documents',
    title: 'Automated Document Entry',
    description:
      'Stop retyping details from scanned RC books and uploaded PDFs. RTO Sarthi reads uploaded files and maps fields into your vehicle register.',
    points: [
      'OCR-assisted data capture from uploaded documents',
      'Consistent vehicle and owner records across modules',
      'Faster new vehicle registration and transfer workflows',
    ],
    icon: <IconDocument />,
    iconVariant: 'brand',
  },
  {
    id: 'whatsapp',
    title: 'WhatsApp Alerts for Every Expiry',
    description:
      "Clients forget renewal dates — you should not have to chase them on calls. Configure alerts for Tax, Fitness, PUC, Insurance, and Permit expiry automatically.",
    points: [
      'Configurable reminder days before each expiry type',
      'Professional message templates in Hindi and English',
      'Track which alerts were sent and when',
    ],
    icon: <IconWhatsApp />,
    iconVariant: 'whatsapp',
    reverse: true,
  },
  {
    id: 'bulk',
    title: 'Bulk PUC & Insurance Upload',
    description:
      'PUC centers and insurance agents can update thousands of records using Excel — no manual entry row by row.',
    points: [
      'Download ready-made Excel templates',
      'Preview imports before saving to the database',
      'Validation for vehicle numbers and date formats',
    ],
    icon: <IconExcel />,
    iconVariant: 'success',
  },
  {
    id: 'management',
    title: 'Complete Client & Vehicle Management',
    description:
      'Manage parties, ledgers, vehicle history, NOC, permits, tax, fitness, and more — everything an RTO desk needs in one system.',
    points: [
      'Party-wise payment and document tracking',
      'Vehicle lifecycle from registration to transfer',
      'Role-based access for staff and partner agents',
    ],
    icon: <IconUsers />,
    iconVariant: 'violet',
    reverse: true,
  },
  {
    id: 'dashboard',
    title: 'Analytics & Expiry Tracking',
    description:
      'Your morning starts with clarity: which vehicles need attention today, which alerts went out, and what revenue is pending.',
    points: [
      'Expiry calendar and weekly summary cards',
      'Filter by document type, agent, or location',
      'Export reports for office review',
    ],
    icon: <IconChart />,
    iconVariant: 'brand',
  },
  {
    id: 'multi-agent',
    title: 'Built for Every Partner in the Chain',
    description:
      'RTO Sarthi is not only for RTO desks — insurance agents and PUC centers get tailored views while sharing the same vehicle truth.',
    points: [
      'Dedicated modules for RTO, Insurance, and PUC roles',
      'Centralized vehicle database across partners',
      'Scales from single desk to multi-branch operations',
    ],
    icon: <IconBell />,
    iconVariant: 'accent',
    reverse: true,
  },
]
