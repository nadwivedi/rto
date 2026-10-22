/** SEO constants — update SITE_URL when deploying to production domain */
export const SITE_URL = 'https://rtosarthi.com'
export const SITE_NAME = 'RTO Sarthi'
export const TAGLINE = "India's Best RTO Agent Software"
export const DEFAULT_TITLE = `RTO Sarthi - ${TAGLINE}`

export const DEFAULT_DESCRIPTION =
  'RTO Sarthi is India\'s best RTO agent software: WhatsApp expiry alerts for tax, fitness, permit, PUC & insurance, RC search at ₹1.5 and client balances. Free trial.'

export const DEFAULT_KEYWORDS = [
  'RTO Sarthi',
  'RTO agent software',
  'RTO agent software India',
  'best RTO agent software',
  'best RTO software India',
  'RTO desk software',
  'vehicle expiry WhatsApp alert',
  'RTO Sarthi software',
  'RTO digital software',
  'tax fitness PUC insurance reminder',
  'RTO agent software for small business',
  'RTO agent management software',
  'RTO management software',
  'RTO management software India',
  'RTO management system',
  'PUC agent software',
  'PUC agent software India',
  'PUC center software',
  'PUC certificate management software',
  'PUC center management software',
  'PUC expiry reminder software',
  'RTO agent Raipur',
  'SoftwareBytes',
  'RTOSarthi',
].join(', ')

export const PAGE_SEO = {
  '/': {
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    path: '/',
  },
  '/features': {
    title: `Features | RTO Sarthi - ${TAGLINE}`,
    description:
      'Explore RTO Sarthi features: AI document entry, WhatsApp API alerts for tax, PUC, insurance & permit expiry, bulk Excel upload, client management, pending balance alerts, and multi-agent support.',
    path: '/features',
  },
  '/about': {
    title: `About Us | RTO Sarthi - ${TAGLINE}`,
    description:
      'Learn about RTO Sarthi — 3+ years of trusted RTO agent software in India. Built by SoftwareBytes, Raipur. AI-powered workflows and WhatsApp API for faster, simpler RTO desk work.',
    path: '/about',
  },
  '/contact': {
    title: `Contact | RTO Sarthi - ${TAGLINE}`,
    description:
      'Contact RTO Sarthi for free trial and demo. Call, WhatsApp, or email SoftwareBytes, Raipur. Simplify your RTO workflow with India\'s best RTO agent software.',
    path: '/contact',
  },
  '/blog': {
    title: `Blog - RTO Agent Software Tips & Guides | RTO Sarthi`,
    description:
      'Read the latest blogs on RTO agent software, PUC center management, vehicle registration tips, insurance renewal guides, and WhatsApp alert strategies. Stay updated with RTO Sarthi.',
    path: '/blog',
    keywords: 'RTO blog, RTO agent tips, PUC center guide, vehicle registration blog, RTO software blog, RTO Sarthi blog, insurance renewal tips',
  },
  '/puc-agent-software': {
    title: `PUC Agent Software India - Best PUC Center Management Software | RTO Sarthi`,
    description:
      'Best PUC agent software India for PUC centers and agents. Bulk Excel upload, PDF auto-entry with data extraction, automatic WhatsApp PUC expiry reminders, and complete RTO & insurance management — all in one platform. Simplify your PUC center with RTO Sarthi. Start free trial.',
    path: '/puc-agent-software',
    keywords: 'PUC agent software India, PUC center software, PUC certificate management software, PUC expiry reminder software, PUC agent management software, best PUC software India, PUC center management system, RTO Sarthi PUC software',
  },
  '/rto-management-software': {
    title: `RTO Management Software India - Vehicle, DL & Transfer | RTO Sarthi`,
    description:
      'RTO management software for agents: manage vehicle, driving licence and vehicle transfer records, track tax, fitness, PUC & insurance expiry, and send WhatsApp alerts. Free trial.',
    path: '/rto-management-software',
    keywords: 'RTO management software, RTO management software India, RTO agent driving licence record software, driving licence management software, vehicle transfer management software, RTO agent software, RTO management system, best RTO management software, RTO software, RTO agent software, vehicle registration management software, RTO consultant software, vehicle expiry reminder software, RTO Sarthi',
  },
  '/vehicle-information-software': {
    title: `Vehicle Information Software for RTO Agents - RC, Tax, Challan, Fitness | RTO Sarthi`,
    description:
      'Vehicle information software for RTO agents by RTO Sarthi: search any vehicle number for RC download, Particular download, road tax, e-challan, fitness, PUC & insurance status. RC & bulk RC verification. Just ₹1.5 per search.',
    path: '/vehicle-information-software',
    keywords: 'vehicle information software for RTO agents, vehicle information software for RTO agent, vehicle details software for RTO agents, vehicle number search software for RTO agents, RC download software for RTO agents, RC verification software for RTO agents, bulk RC verification software for RTO agents, vehicle particular download software for RTO agents, e-challan check software for RTO agents, vehicle information software for insurance agents, vehicle information software for vehicle dealers, best vehicle information software for RTO agents, vehicle information software India, vehicle information software, vehicle details by number, vehicle number search software, RC download, RC verification, bulk RC verification, vehicle particulars download, road tax status check, e-challan status check, fitness status check, PUC status check, insurance status by vehicle number, vehicle owner details software, RTO agent vehicle search, RTO Sarthi vehicle information',
  },
  '/vehicle-information-api': {
    title: `Vehicle Information API India - RC Details from ₹1.5 per Search | RTO Sarthi`,
    description:
      'Vehicle information API provider for India: get RC details by vehicle number as JSON - owner, model, chassis, engine, insurance, tax, fitness & PUC. From ₹1.5 per search.',
    path: '/vehicle-information-api',
    keywords: 'vehicle information API, vehicle information API India, vehicle details API, vehicle number API, RC details API, RC API, RC verification API, vehicle RC API, vehicle registration API India, vehicle owner details API, vehicle API provider, vehicle information API provider, cheapest vehicle information API, vehicle information API price, vehicle number search API, chassis number API, insurance validity API, vehicle data API, RTO API, RTO vehicle API, RTO Sarthi vehicle information API',
  },
  '/vahan-api': {
    title: `Vahan API for Vehicle Details - RC Data from ₹1.5 per Search | RTO Sarthi`,
    description:
      'Vahan API for vehicle details by vehicle number: owner, address, chassis, engine, financer, insurance, PUC, fitness & tax as JSON. All states. From ₹1.5 per search.',
    path: '/vahan-api',
    keywords: 'vahan API, vahan API for vehicle details, vahan vehicle details API, vahan API India, vahan RC API, vahan API price, vahan API provider, vahan database API, vahan vehicle API, vahan API for vehicle owner details, vahan API for chassis number, vahan API for insurance details, vehicle details API by vehicle number, RC details API India, vehicle registration details API, cheapest vahan API, RTO Sarthi vahan API',
  },
  '/vehicle-details-api': {
    title: `Vehicle Details API India - API for Getting Vehicle Details from ₹1.5 | RTO Sarthi`,
    description:
      'Vehicle details API India: API for getting vehicle details by vehicle number - owner, model, chassis, engine, insurance, PUC, fitness & tax as JSON. All states & BH series. From ₹1.5.',
    path: '/vehicle-details-api',
    keywords: 'vehicle details API India, vehicle details API, vehicle detail API, API for getting vehicle details, API for vehicle details, API to get vehicle details, get vehicle details by vehicle number API, vehicle number to details API, API for RC details, vehicle details API for insurance, vehicle details API for used cars, vehicle details API for loan verification, fleet vehicle details API, vehicle details API provider in India, vehicle details API price in India, vehicle details by number API, vehicle number details API, vehicle registration details API India, RC details API India, car details API India, bike details API India, truck details API, BH series vehicle details API, vehicle owner details API India, vehicle details JSON API, vehicle details API for developers, all India vehicle details API, cheapest vehicle details API India, best vehicle details API India, gaadi number se details API, RTO Sarthi vehicle details API',
  },
  '/vehicle-data-api': {
    title: `Vehicle Data API India - Complete Vehicle Data by Number from ₹1.5 | RTO Sarthi`,
    description:
      'Vehicle data API India: complete vehicle data by registration number as JSON - owner, model, specs, chassis, engine, insurance, PUC, fitness, tax, financer & NOC. All states. From ₹1.5.',
    path: '/vehicle-data-api',
    keywords: 'vehicle data API India, vehicle data API, Indian vehicle data API, vehicle data API by registration number, vehicle registration data API, RTO vehicle data API, vehicle database API India, vehicle data JSON API, car data API India, bike data API India, vehicle owner data API, vehicle specification data API, vehicle data API for insurance, vehicle data API for loans, vehicle data API for used cars, fleet vehicle data API, bulk vehicle data API, vehicle data API price India, vehicle data API provider India, RTO Sarthi vehicle data API',
  },
  '/vehicle-make-and-model-api': {
    title: `Vehicle Make and Model API - by Vehicle Number from ₹1.5 | RTO Sarthi`,
    description:
      'Vehicle make and model API for India: get maker, model, class, body type, fuel, BS norms, CC, seating, colour & manufacturing year from a vehicle number. From ₹1.5 per search.',
    path: '/vehicle-make-and-model-api',
    keywords: 'vehicle make and model API, vehicle make model API, car make and model API, car make and model API India, vehicle make and model by registration number, make and model lookup API, vehicle model API, vehicle manufacturer API, vehicle number to make and model, find car model by number plate API, bike make and model API, vehicle specification API, vehicle fuel type API, vehicle CC API, vehicle manufacturing year API, vehicle make model API for insurance, vehicle make model API for spare parts, RTO Sarthi make and model API',
  },
  '/vehicle-insurance-api': {
    title: `Vehicle Insurance API - Check Insurance Status by Vehicle Number | RTO Sarthi`,
    description:
      'Vehicle insurance API: check insurance company, policy number & expiry date of any Indian vehicle number as JSON, plus model, PUC, fitness & tax. From ₹1.5 per search.',
    path: '/vehicle-insurance-api',
    keywords: 'vehicle insurance API, vehicle insurance details API, vehicle insurance status API, check vehicle insurance by vehicle number API, vehicle insurance expiry API, insurance validity API, car insurance API India, bike insurance details API, motor insurance API, vehicle insurance check API, vehicle insurance policy number API, insurance expiry date by vehicle number, previous insurer API, vehicle insurance API for agents, fleet insurance check API, vehicle insurance API price, RTO Sarthi insurance API',
  },
  '/vehicle-rc-verification-api': {
    title: `Vehicle RC Verification API - Verify RC by Vehicle Number from ₹1.5 | RTO Sarthi`,
    description:
      'Vehicle RC verification API for India: verify RC by vehicle number - owner, chassis, engine, model, status, financer, blacklist & NOC as JSON. All states. From ₹1.5 per verification.',
    path: '/vehicle-rc-verification-api',
    keywords: 'vehicle RC verification API, RC verification API, RC verification API India, vehicle RC verification, RC check API, verify RC by vehicle number API, RC details verification API, RC owner verification API, chassis number verification API, engine number verification API, RC status check API, RC verification API for loan, RC verification API for insurance, RC verification API for used cars, bulk RC verification API, RC verification API price, RC verification API provider, RTO Sarthi RC verification API',
  },
  '/vehicle-verification-api': {
    title: `Vehicle Verification API India - Verify Vehicle by Number from ₹1.5 | RTO Sarthi`,
    description:
      'Vehicle verification API for India: verify any vehicle by number - registration status, chassis, engine, owner, insurance, PUC, fitness, tax, financer, blacklist & NOC as JSON. From ₹1.5.',
    path: '/vehicle-verification-api',
    keywords: 'vehicle verification API, vehicle verification API India, vehicle check API, vehicle verification by number API, vehicle number verification API, vehicle registration verification API, vehicle background check API, vehicle onboarding verification API, fleet vehicle verification API, driver vehicle verification API, vehicle KYC API, commercial vehicle verification API, vehicle insurance verification API, vehicle fitness verification API, vehicle blacklist check API, vehicle hypothecation check API, bulk vehicle verification API, vehicle verification API price, vehicle verification API provider India, RTO Sarthi vehicle verification API',
  },
  '/parivahan-api': {
    title: `Parivahan API to Get Vehicle Details - Cost from ₹1.5 per Search | RTO Sarthi`,
    description:
      'Parivahan API to get vehicle details by vehicle number: owner, model, chassis, engine, insurance, PUC, fitness & tax as JSON. Parivahan API cost from ₹1.5 per search, no monthly fee.',
    path: '/parivahan-api',
    keywords: 'parivahan API, parivahan API to get vehicle details, parivahan API for vehicle details, parivahan vehicle details API, parivahan API cost, parivahan API price, parivahan API pricing, parivahan API charges, parivahan API India, parivahan RC API, parivahan API key, how to get parivahan API, parivahan API provider, parivahan API free, mparivahan API, parivahan vehicle API, parivahan API for owner details, RTO Sarthi parivahan API',
  },
  '/vehicle-lookup-api': {
    title: `Vehicle Lookup API - Registration Number Lookup India from ₹1.5 | RTO Sarthi`,
    description:
      'Vehicle lookup API for India: look up any registration number for status, RTO, owner, model, chassis, engine, insurance, PUC, fitness, financer, blacklist & NOC. From ₹1.5.',
    path: '/vehicle-lookup-api',
    keywords: 'vehicle lookup API, vehicle lookup API India, vehicle registration lookup API, registration number lookup API, vehicle number lookup API, number plate lookup API, licence plate lookup API India, car lookup API, bike lookup API, chassis number verification API, vehicle hypothecation check API, bulk vehicle lookup API, RC lookup API, vehicle lookup API price, RTO Sarthi vehicle lookup API',
  },
  '/rc-download-software': {
    title: `RC Download Software for RTO Agents - Download RC at ₹1.5 | RTO Sarthi`,
    description:
      'RC download software for RTO agents: download RC of any vehicle at just ₹1.5. Enter vehicle number, get smart card style RC PDF, Vehicle Particulars PDF and complete vehicle details for any state. Free trial.',
    path: '/rc-download-software',
    keywords: 'RC download software for RTO agents, RC download software for RTO agent, RC download software, download RC of any vehicle, download RC at 1.5 rs, RC download by vehicle number, RC PDF download, RC PDF download by vehicle number, vehicle RC download, online RC download software, RC details by vehicle number, RC copy download, smart card RC download, RC download software for insurance agents, RC download software for vehicle dealers, best RC download software for RTO agents, cheapest RC download software, RC download software India, RTO Sarthi RC download',
  },
  '/rto-agent-software-free-download': {
    title: `RTO Agent Software Free Download - Free Trial for PC & Mobile | RTO Sarthi`,
    description:
      'RTO agent software free download: RTO Sarthi provides a free trial, so you can download and use RTO agent software free of cost on PC and mobile. Vehicle records, expiry tracking, WhatsApp alerts and more.',
    path: '/rto-agent-software-free-download',
    keywords: 'RTO agent software free download, RTO software free download, RTO agent software free, RTO agent software free trial, free RTO agent software, RTO Sarthi free download, RTO Sarthi free trial, RTO agent app free download, RTO agent software download for PC, RTO agent software for Windows, RTO agent software for Android, RTO software download, RTO management software free download, RTO consultant software free download, free RTO software India, best free RTO agent software',
  },
  '/rto-agent-app': {
    title: `RTO Agent App for Android, iPhone & PC - WhatsApp Reminders | RTO Sarthi`,
    description:
      'RTO agent app for India: clients & vehicles on your phone, WhatsApp reminders for tax, fitness, permit, PUC & insurance, RC search at ₹1.5, balances & LL/DL. Free trial.',
    path: '/rto-agent-app',
    keywords: 'RTO agent app, RTO agent app India, best RTO agent app, RTO agent mobile app, RTO agent app for Android, RTO agent app for iPhone, RTO agent app download, RTO agent app free, RTO agent app free download, RTO app for agents, RTO consultant app, RTO work app, app for RTO agents, RTO agent application, RTO agent app with WhatsApp reminder, vehicle expiry reminder app, RTO Sarthi app, RTOSarthi app',
  },
  '/rto-offline-software': {
    title: `RTO Offline Software vs Online - Install on PC, No Data Loss | RTO Sarthi`,
    description:
      'Looking for RTO offline software? RTO Sarthi installs on your PC like desktop software, keeps data backed up online, works on mobile too & sends WhatsApp reminders. Free trial.',
    path: '/rto-offline-software',
    keywords: 'RTO offline software, offline RTO software, RTO software offline, RTO agent offline software, RTO offline software for PC, RTO offline software download, RTO desktop software, RTO software for PC, RTO software for Windows, RTO agent desktop software, RTO software offline vs online, online RTO software, RTO software with backup, RTO computer software, RTO agent software for computer, RTO Sarthi',
  },
  '/best-rto-office-software': {
    title: `Best RTO Office Software in India - RTO Sarthi`,
    description:
      'RTO Sarthi is the best RTO office software in India: staff logins, WhatsApp reminders for tax, fitness, permit, PUC & insurance, client balances, LL/DL & RC search at ₹1.5. Free trial.',
    path: '/best-rto-office-software',
    keywords: 'best RTO office software, best RTO office software India, RTO office software, RTO office software India, RTO office management software, RTO office management system, software for RTO office, RTO agent office software, RTO consultant office software, best RTO software, best RTO software India, top RTO software, RTO office software with WhatsApp reminder, multi user RTO software, RTO Sarthi, best RTO office software RTO Sarthi',
  },
  '/cloud-rto-software': {
    title: `Cloud RTO Software for RTO Agents - RTO Sarthi`,
    description:
      'RTO Sarthi is cloud RTO software: data backed up online, works on PC & mobile, staff logins, WhatsApp reminders for tax, fitness, permit, PUC & insurance, RC search at ₹1.5. Free trial.',
    path: '/cloud-rto-software',
    keywords: 'cloud RTO software, cloud based RTO software, RTO cloud software, cloud RTO software India, online RTO software, RTO software online, web based RTO software, cloud RTO management software, cloud software for RTO agents, RTO agent cloud software, SaaS RTO software, RTO software with cloud backup, cloud RTO office software, best cloud RTO software, RTO Sarthi, RTOSarthi cloud',
  },
  '/vehicle-document-expiry-reminder-software': {
    title: `Vehicle Document Expiry Reminder Software - Tax, Fitness, Permit, PUC | RTO Sarthi`,
    description:
      'Vehicle document expiry reminder software for RTO agents and transporters. Track road tax, fitness, permit, PUC, insurance and GPS expiry and send automatic WhatsApp reminders in Hindi or English. Free trial.',
    path: '/vehicle-document-expiry-reminder-software',
    keywords: 'vehicle document expiry reminder software, vehicle expiry reminder software, vehicle document expiry reminder, road tax expiry reminder, fitness expiry reminder, permit expiry reminder, PUC expiry reminder, insurance expiry reminder, vehicle renewal reminder software, WhatsApp vehicle expiry reminder, fleet document expiry reminder, transporter document management software, vehicle document management software, expiry reminder software for RTO agents, RTO Sarthi',
  },
  '/rc-verification-software': {
    title: `RC Verification Software at ₹1.5 - Bulk RC Verification for RTO Agents | RTO Sarthi`,
    description:
      'RC verification software at just ₹1.5 per vehicle. Verify owner, chassis, engine, registration validity, hypothecation and blacklist status by vehicle number. Single and bulk RC verification for RTO agents, insurance agents and dealers.',
    path: '/rc-verification-software',
    keywords: 'RC verification software, RC verification at 1.5 rs, RC verification for RTO agents, bulk RC verification, bulk RC verification software, RC verification online, verify RC by vehicle number, cheapest RC verification, RC verification for insurance agents, RC verification for dealers, RC verification for financers, vehicle RC verification, RC check software, vehicle verification software, RTO Sarthi RC verification',
  },
  '/national-permit-renewal-reminder-software': {
    title: `National Permit Renewal Reminder Software - Part A & Part B | RTO Sarthi`,
    description:
      'National permit renewal reminder software for RTO agents and transporters. Track Part A and Part B validity, renew each part, record fees and send automatic WhatsApp reminders before permit expiry. Free trial.',
    path: '/national-permit-renewal-reminder-software',
    keywords: 'national permit renewal reminder software, national permit renewal reminder, national permit software, national permit management software, national permit Part B renewal reminder, national permit authorisation renewal, NP Part A Part B tracking, permit expiry reminder software, state permit renewal reminder, bus permit software, temporary permit software, transporter permit management software, RTO agent permit software, RTO Sarthi',
  },
  '/driving-licence-software': {
    title: `Driving Licence Software for RTO Agents - LL & DL Management | RTO Sarthi`,
    description:
      'Driving licence software for RTO agents by RTO Sarthi. RTO agents manage learner licence and DL applications, documents, LL and DL validity, fees and balance, with WhatsApp alert when LL becomes eligible for DL. Free trial of RTO Sarthi.',
    path: '/driving-licence-software',
    keywords: 'driving licence software for RTO agents, driving licence software for RTO agent, driving license software for RTO agents, DL software for RTO agents, driving licence management software for RTO agents, LL DL software for RTO agents, best driving licence software for RTO agents, driving licence software, driving license software, DL management software, driving licence record software, learner licence management software, LL DL record software, DL renewal software, driving licence application management, driving licence consultant software, RTO agent driving licence software, manage driving licence work, RTO Sarthi driving licence',
  },
  '/learning-licence-software': {
    title: `Learning Licence Software for RTO Agents | LL to DL | RTO Sarthi`,
    description:
      'Learning licence software for RTO agents: auto WhatsApp 30 days after LL for DL eligibility, LL expiry dashboard, pending balance & all RTO work. Free trial.',
    path: '/learning-licence-software',
    keywords: 'learning licence software, learning licence software for RTO agents, learning license software, learner licence software, learner license software, LL software, LL management software, learning licence management software, LL DL software for RTO agents, learning licence and driving licence software, LL to DL reminder, learning licence 30 days DL eligibility, DL eligibility WhatsApp reminder, learning licence expiry reminder, learner licence expiry dashboard, LL expiry tracking, RTO agent pending balance software, RTO agent software, RTO agent LL DL management, best learning licence software India, RTO Sarthi learning licence',
  },
  '/driving-licence-management-system': {
    title: `Driving Licence Management System for RTO Agents | RTO Sarthi`,
    description:
      'Driving licence management system for RTO agents: LL & DL records, auto WhatsApp for DL eligibility, LL expiry dashboard, pending balance. Free trial.',
    path: '/driving-licence-management-system',
    keywords: 'driving licence management system, driving license management system, driving licence management system for RTO agents, DL management system, driving licence management software, driving license management software, licence management system for RTO agents, LL DL management system, learner licence management system, driving licence record management system, online driving licence management system, RTO agent driving licence system, driving licence tracking system, DL application tracking, RTO Sarthi driving licence management',
  },
  '/driving-school-management-software': {
    title: `Driving School Management Software India | RTO Sarthi`,
    description:
      'Driving school management software: admissions, fee dues, student documents, LL & DL tracking, auto WhatsApp for DL eligibility & LL expiry dashboard.',
    path: '/driving-school-management-software',
    keywords: 'driving school management software, driving school management software India, motor driving school management software, driving school admission management software, driving school fee management software, driving school student management software, driving school billing software, driving school record software, driving school software with WhatsApp, learner licence tracking for driving schools, best driving school management software, online driving school management software, RTO Sarthi driving school management',
  },
  '/driving-school-management-system': {
    title: `Driving School Management System - Admission to DL | RTO Sarthi`,
    description:
      'Driving school management system: admission, fee instalments, LL & DL in one record, auto WhatsApp for DL eligibility, LL expiry dashboard & multi-user.',
    path: '/driving-school-management-system',
    keywords: 'driving school management system, driving school management system India, motor driving school management system, driving school system, online driving school management system, driving school student management system, driving school admission system, driving school fee management system, driving school record management system, driving school ERP, driving school automation, learner licence follow-up system, best driving school management system, RTO Sarthi driving school system',
  },
  '/best-driving-school-software-india': {
    title: `Best Driving School Software in India (2026) | RTO Sarthi`,
    description:
      'Best driving school software in India for LL & DL work, fee dues, auto WhatsApp follow-ups and RTO work. See the buyer checklist and start a free trial.',
    path: '/best-driving-school-software-india',
    keywords: 'best driving school software India, best driving school software, best driving school management software India, top driving school software India, driving school software India, driving school software for Indian driving schools, which driving school software is best, driving school software comparison, driving school software checklist, driving school software with WhatsApp, driving school software with licence tracking, affordable driving school software India, RTO Sarthi best driving school software',
  },
  '/driving-school-crm': {
    title: `Driving School CRM with WhatsApp Follow-ups | RTO Sarthi`,
    description:
      'Driving school CRM: student records, automatic WhatsApp follow-ups for DL eligibility, LL expiry dashboard, fee dues, referral sources & repeat RTO work.',
    path: '/driving-school-crm',
    keywords: 'driving school CRM, CRM for driving schools, driving school CRM software, driving school CRM India, best CRM for driving school, driving school customer management software, driving school student follow-up software, driving school WhatsApp CRM, driving school WhatsApp follow-up, driving school referral tracking, driving school student relationship management, driving school customer retention, RTO Sarthi driving school CRM',
  },
  '/rto-agent-crm-software': {
    title: `RTO Agent CRM Software with WhatsApp Reminders | RTO Sarthi`,
    description:
      'RTO agent CRM software: client & vehicle records, WhatsApp reminders for tax, fitness, permit, PUC & insurance, pending balance and LL/DL clients. Free trial.',
    path: '/rto-agent-crm-software',
    keywords: 'RTO agent CRM software, RTO agent CRM, CRM for RTO agents, RTO CRM software, RTO CRM, best CRM for RTO agents, RTO agent client management software, RTO agent customer management software, RTO consultant CRM, RTO agent WhatsApp CRM, CRM with WhatsApp reminders for RTO agents, vehicle owner CRM, RTO agent follow-up software, RTO agent client follow-up, RTO agent CRM India, RTO Sarthi CRM',
  },
  '/rto-agent-lead-management-software': {
    title: `RTO Agent Lead Management Software - Follow-ups & Conversions | RTO Sarthi`,
    description:
      'RTO agent lead management software: track permit, tax, fitness, PUC & insurance enquiries, follow-up reminders, one-tap call & WhatsApp, and leads from RC search. Free trial.',
    path: '/rto-agent-lead-management-software',
    keywords: 'RTO agent lead management software, RTO lead management software, lead management software for RTO agents, RTO agent lead tracking, RTO agent enquiry management, RTO agent follow-up software, RTO lead follow-up, insurance lead management for RTO agents, permit renewal leads, RTO agent sales pipeline, RTO consultant lead management, RTO Sarthi leads',
  },
  '/driving-school-software': {
    title: `Driving School Software - Admissions, Fees, Licence & RTO Work | RTO Sarthi`,
    description:
      'Driving school software for driving school owners: manage student admissions, fees and documents, track learner licence and DL, and manage RTO work like registration, transfer, insurance and PUC in one software. Free trial.',
    path: '/driving-school-software',
    keywords: 'driving school software, driving school software India, driving school admission software, driving school fees management software, motor driving school software, driving school software with RTO work, driving school and RTO software, driving school licence management software, learner licence tracking software, driving school app, RTO Sarthi driving school',
  },
  '/document-expiry-reminder-software': {
    title: `Document Expiry Reminder Software - WhatsApp Reminders for Any Document | RTO Sarthi`,
    description:
      'Document expiry reminder software for every type of document: licences, insurance, registrations, agreements, certificates and vehicle papers. Automatic WhatsApp reminders to you and your clients in Hindi or English. Free trial.',
    path: '/document-expiry-reminder-software',
    keywords: 'document expiry reminder software, document expiry reminder, document expiry tracking software, document renewal reminder software, expiry date reminder software, expiry reminder app, licence expiry reminder software, certificate expiry reminder, insurance policy expiry reminder, agreement expiry reminder, WhatsApp expiry reminder software, document expiry alert software, document management with expiry reminder, expiry reminder software India, RTO Sarthi',
  },
  '/sitemap': {
    title: `Sitemap | RTO Sarthi - ${TAGLINE}`,
    description: 'Sitemap of RTO Sarthi website — Home, Features, RTO Management Software, Vehicle Information Software, RC Download Software, RTO Agent Software Free Download, Vehicle Document Expiry Reminder Software, RC Verification Software, National Permit Renewal Reminder Software, Driving Licence Software, Learning Licence Software, Driving Licence Management System, Driving School Software, Driving School Management Software, Driving School Management System, Best Driving School Software India, Driving School CRM, RTO Agent CRM Software, Document Expiry Reminder Software, PUC Agent Software, About, and Contact pages.',
    path: '/sitemap',
  },
}

export function getPageSeo(pathname) {
  return PAGE_SEO[pathname] ?? PAGE_SEO['/']
}

export function absoluteUrl(path = '/') {
  const p = path.startsWith('/') ? path : `/${path}`
  return `${SITE_URL}${p}`
}
