/**
 * Every solution page, grouped by topic. Used by the homepage hub, the sitemap page and the
 * "related solutions" block, so a new page added here is linked from all of them.
 * The first page of each group is its main (hub) page.
 */
export const SOLUTION_GROUPS = [
  {
    key: 'rto',
    title: 'RTO Agent Software',
    description: 'Run the whole RTO desk: vehicles, clients, renewals, balances and leads.',
    items: [
      { to: '/rto-management-software', label: 'RTO Management Software', desc: 'Expiry tracking, WhatsApp alerts, client balances & demo video for RTO agents' },
      { to: '/rto-agent-crm-software', label: 'RTO Agent CRM Software', desc: 'Client & vehicle CRM for RTO agents with WhatsApp expiry reminders, pending balance and LL / DL clients' },
      { to: '/rto-agent-lead-management-software', label: 'RTO Agent Lead Management Software', desc: 'Track permit, tax, fitness, PUC & insurance enquiries with follow-up lists, one-tap call & WhatsApp' },
      { to: '/puc-agent-software', label: 'PUC Agent Software', desc: 'Bulk Excel upload, PDF auto-entry, WhatsApp PUC reminders & complete RTO/insurance management' },
      { to: '/rto-agent-app', label: 'RTO Agent App', desc: 'RTO Sarthi app for Android, iPhone & PC: clients, WhatsApp reminders, RC search & balances on your phone' },
      { to: '/rto-offline-software', label: 'RTO Offline Software', desc: 'Offline vs online: install RTO Sarthi on your PC like desktop software, with data backed up online' },
      { to: '/rto-agent-software-free-download', label: 'RTO Agent Software Free Download', desc: 'Free trial: use RTO Sarthi free on Android, iPhone, Windows and web' },
    ],
  },
  {
    key: 'vehicle',
    title: 'Vehicle Information & RC',
    description: 'Search any vehicle number for RC details, from ₹1.5 per search.',
    items: [
      { to: '/vehicle-information-software', label: 'Vehicle Information Software', desc: 'Vehicle number search: RC & Particular download, tax, e-challan, fitness, PUC & insurance status' },
      { to: '/rc-download-software', label: 'RC Download Software', desc: 'Download RC of any vehicle at just ₹1.5: smart card style RC PDF for RTO agents' },
      { to: '/rc-verification-software', label: 'RC Verification Software', desc: 'Verify RC of any vehicle at ₹1.5: owner, chassis, engine, HP & blacklist, plus bulk verification' },
      { to: '/vehicle-information-api', label: 'Vehicle Information API', desc: 'RC details by vehicle number for your software as JSON, from ₹1.5 per successful search' },
      { to: '/vahan-api', label: 'Vahan API for Vehicle Details', desc: 'Owner, chassis, engine, financer, insurance, PUC, fitness, blacklist & NOC by vehicle number' },
    ],
  },
  {
    key: 'reminders',
    title: 'Expiry Reminder Software',
    description: 'Automatic WhatsApp reminders before any document expires.',
    items: [
      { to: '/vehicle-document-expiry-reminder-software', label: 'Vehicle Document Expiry Reminder Software', desc: 'Automatic WhatsApp reminders for tax, fitness, permit, PUC, insurance and GPS expiry' },
      { to: '/document-expiry-reminder-software', label: 'Document Expiry Reminder Software', desc: 'Automatic WhatsApp reminders for every type of document with an expiry date' },
      { to: '/national-permit-renewal-reminder-software', label: 'National Permit Renewal Reminder Software', desc: 'Track national permit Part A & Part B validity with WhatsApp renewal reminders' },
    ],
  },
  {
    key: 'driving-school',
    title: 'Driving School Software',
    description: 'Admissions, fees, LL / DL tracking and RTO work for driving schools.',
    items: [
      { to: '/driving-school-software', label: 'Driving School Software', desc: 'Manage driving school admissions, fees, documents, LL / DL and RTO work' },
      { to: '/driving-school-management-software', label: 'Driving School Management Software', desc: 'Admissions register, fee dues, student documents, auto WhatsApp for DL eligibility' },
      { to: '/driving-school-management-system', label: 'Driving School Management System', desc: 'Connected system from admission to DL with fee instalments and WhatsApp follow-ups' },
      { to: '/driving-school-crm', label: 'Driving School CRM', desc: 'Student records, automatic WhatsApp follow-ups, referral sources and fee dues' },
      { to: '/best-driving-school-software-india', label: 'Best Driving School Software India', desc: 'Buyer guide: what the best driving school software in India needs' },
    ],
  },
  {
    key: 'licence',
    title: 'Driving Licence Software',
    description: 'Learner licence to permanent DL, with automatic WhatsApp follow-ups.',
    items: [
      { to: '/driving-licence-software', label: 'Driving Licence Software', desc: 'Manage learner licence and DL applications, documents, fees and LL to DL alerts' },
      { to: '/learning-licence-software', label: 'Learning Licence Software', desc: 'Automatic WhatsApp 30 days after LL for DL eligibility and LL expiry dashboard' },
      { to: '/driving-licence-management-system', label: 'Driving Licence Management System', desc: 'One system for LL, DL and renewals with WhatsApp follow-ups and multi-agent access' },
    ],
  },
]

export const groupOfPath = (path) => SOLUTION_GROUPS.find((g) => g.items.some((i) => i.to === path))
