import {
  IconDocument,
  IconWhatsApp,
  IconUsers,
  IconChart,
  IconCar,
  IconBell,
  IconWallet,
  IconExcel,
  IconRenewal,
  IconShield,
  IconSearch,
  IconCode,
  IconTarget,
} from '../components/Icons'
import { LOOKUP_PRICE } from './vehicleInfo'

/** Every main feature with the page that explains it. Shown on the homepage and the features page. */
export const coreFeatures = [
  {
    icon: <IconWhatsApp />,
    iconVariant: 'whatsapp',
    title: 'WhatsApp Expiry Alerts',
    description:
      'Automatic reminders for Tax, Fitness, PUC, Insurance, Permit and GPS expiry, sent to clients on WhatsApp before deadlines are missed.',
    to: '/vehicle-document-expiry-reminder-software',
  },
  {
    icon: <IconSearch />,
    iconVariant: 'brand',
    title: 'Vehicle Search & RC Download',
    description: `Search any vehicle number for RC details, download the RC and Particulars PDF, and check tax, fitness, PUC, insurance and e-challan status at ${LOOKUP_PRICE}.`,
    to: '/vehicle-information-software',
  },
  {
    icon: <IconCode />,
    iconVariant: 'slate',
    title: 'Vehicle Information API',
    description: `Get RC details by vehicle number as JSON inside your own software or app, from ${LOOKUP_PRICE} per successful search.`,
    to: '/vehicle-information-api',
  },
  {
    icon: <IconTarget />,
    iconVariant: 'accent',
    title: 'Lead Management',
    description:
      'Track permit, tax, fitness, PUC and insurance enquiries with follow-up lists, one-tap call and WhatsApp, and leads from RC search.',
    to: '/rto-agent-lead-management-software',
  },
  {
    icon: <IconWallet />,
    iconVariant: 'accent',
    title: 'Client CRM & Pending Balance',
    description:
      'Every client with their vehicles, work and payments. See who owes what and send pending balance reminders on WhatsApp.',
    to: '/rto-agent-crm-software',
  },
  {
    icon: <IconDocument />,
    iconVariant: 'brand',
    title: 'Smart Document Entry',
    description:
      'Upload RC, insurance papers or permit copies and let RTO Sarthi auto-fill vehicle and owner details: fewer typos, faster entry.',
    to: '/features#documents',
  },
  {
    icon: <IconExcel />,
    iconVariant: 'success',
    title: 'Bulk Excel Uploads',
    description:
      'Import hundreds of PUC or insurance records in one go using Excel templates built for Indian RTO and PUC workflows.',
    to: '/puc-agent-software',
  },
  {
    icon: <IconShield />,
    iconVariant: 'violet',
    title: 'Permit, Tax & Fitness',
    description:
      'National, state, bus and temporary permits, road tax, green tax, professional tax, fitness, GPS and speed governor records in one place.',
    to: '/national-permit-renewal-reminder-software',
  },
  {
    icon: <IconCar />,
    iconVariant: 'brand',
    title: 'Transfer, NOC & HPA Work',
    description:
      'Manage vehicle transfer, NOC, HPA / HPT and registration renewal work with documents, fees and status for every file.',
    to: '/rto-management-software',
  },
  {
    icon: <IconRenewal />,
    iconVariant: 'success',
    title: 'Driving Licence & School',
    description:
      'Learner licence to permanent DL with an automatic WhatsApp when the student becomes eligible, plus admissions and fees for driving schools.',
    to: '/driving-licence-software',
  },
  {
    icon: <IconChart />,
    iconVariant: 'brand',
    title: 'Dashboard, Bills & Reports',
    description:
      'See what expires this week, make dealer bills, and track cashflow and insurance reports from one clean dashboard.',
    to: '/features#dashboard',
  },
  {
    icon: <IconUsers />,
    iconVariant: 'violet',
    title: 'Multi-Agent & Staff Access',
    description:
      'Separate logins for staff, RTO agents, insurance agents and PUC centres, with control over who sees what.',
    to: '/features#multi-agent',
  },
]

export const detailedFeatures = [
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
    link: { to: '/vehicle-document-expiry-reminder-software', label: 'Vehicle document expiry reminder software' },
  },
  {
    id: 'vehicle-search',
    title: 'Vehicle Search, RC Download & Verification',
    description: `Search any vehicle number and get the complete RC details in seconds, at just ${LOOKUP_PRICE} per search. Download the RC and Vehicle Particulars PDF and verify the vehicle before transfer, finance or insurance.`,
    points: [
      'Owner, chassis, engine, registration and financer details',
      'Tax, fitness, PUC, insurance and e-challan status',
      'Single and bulk RC verification, saved search history',
    ],
    icon: <IconSearch />,
    iconVariant: 'brand',
    reverse: true,
    link: { to: '/vehicle-information-software', label: 'Vehicle information software' },
  },
  {
    id: 'api',
    title: 'Vehicle Information API',
    description: `Businesses can get the same vehicle data inside their own software, website or app. Send a vehicle number, get RC details back as JSON, from ${LOOKUP_PRICE} per successful search.`,
    points: [
      'Owner and address, chassis and engine number, insurance, PUC and fitness',
      'Pay only for successful searches, no monthly fee',
      'Remaining searches shown in every response',
    ],
    icon: <IconCode />,
    iconVariant: 'slate',
    link: { to: '/vehicle-information-api', label: 'Vehicle information API' },
  },
  {
    id: 'leads',
    title: 'Lead Management for RTO Work',
    description:
      'Every enquiry for permit, tax, fitness, PUC or insurance work becomes a lead with a follow-up date, so no customer is forgotten.',
    points: [
      'Follow-up Today, Overdue, New and Upcoming lists',
      'One-tap call and WhatsApp with follow-up notes',
      'Move vehicles from RC search into leads with their expiry dates',
    ],
    icon: <IconTarget />,
    iconVariant: 'accent',
    reverse: true,
    link: { to: '/rto-agent-lead-management-software', label: 'RTO agent lead management software' },
  },
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
    reverse: true,
    link: { to: '/puc-agent-software', label: 'PUC agent software' },
  },
  {
    id: 'management',
    title: 'Complete Client & Vehicle Management',
    description:
      'Manage parties, ledgers, vehicle history, NOC, permits, tax, fitness, and more — everything an RTO desk needs in one system.',
    points: [
      'Party-wise payment and pending balance tracking',
      'Permits, road / green / professional tax, fitness, GPS and speed governor',
      'Vehicle transfer, NOC, HPA / HPT and registration renewal',
    ],
    icon: <IconUsers />,
    iconVariant: 'violet',
    link: { to: '/rto-agent-crm-software', label: 'RTO agent CRM software' },
  },
  {
    id: 'driving-licence',
    title: 'Driving Licence & Driving School',
    description:
      'Follow every learner licence to the permanent DL, and run driving school admissions and fees in the same software.',
    points: [
      'Automatic WhatsApp 30 days after LL for DL eligibility',
      'Learning licence expiry dashboard',
      'Student admissions, documents, fees and pending balance',
    ],
    icon: <IconRenewal />,
    iconVariant: 'success',
    reverse: true,
    link: { to: '/driving-school-software', label: 'Driving school software' },
  },
  {
    id: 'dashboard',
    title: 'Analytics, Bills & Reports',
    description:
      'Your morning starts with clarity: which vehicles need attention today, which alerts went out, and what revenue is pending.',
    points: [
      'Expiry calendar and weekly summary cards',
      'Dealer bills, cashflow and insurance reports',
      'Export reports for office review',
    ],
    icon: <IconChart />,
    iconVariant: 'brand',
    link: { to: '/rto-management-software', label: 'RTO management software' },
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
