import { rtoManagementFaqs, RTO_MANAGEMENT_PATH, VIDEO_ID } from '../data/rtoManagement'
import { vehicleInfoFaqs, VEHICLE_INFO_PATH } from '../data/vehicleInfo'
import { vehicleInfoApiFaqs, VEHICLE_INFO_API_PATH } from '../data/vehicleInfoApi'
import { vahanApiFaqs, VAHAN_API_PATH } from '../data/vahanApi'
import { parivahanApiFaqs, PARIVAHAN_API_PATH } from '../data/parivahanApi'
import { lookupApiFaqs, LOOKUP_API_PATH } from '../data/lookupApi'
import { insuranceApiFaqs, INSURANCE_API_PATH } from '../data/insuranceApi'
import { rcVerificationApiFaqs, RC_VERIFICATION_API_PATH } from '../data/rcVerificationApi'
import { vehicleVerificationApiFaqs, VEHICLE_VERIFICATION_API_PATH } from '../data/vehicleVerificationApi'
import { rcToChassisApiFaqs, RC_TO_CHASSIS_API_PATH } from '../data/rcToChassisApi'
import { rcToRegistrationDateApiFaqs, RC_TO_REGISTRATION_DATE_API_PATH } from '../data/rcToRegistrationDateApi'
import { pucDetailsApiFaqs, PUC_DETAILS_API_PATH } from '../data/pucDetailsApi'
import { fitnessDetailsApiFaqs, FITNESS_DETAILS_API_PATH } from '../data/fitnessDetailsApi'
import { roadTaxDetailsApiFaqs, ROAD_TAX_DETAILS_API_PATH } from '../data/roadTaxDetailsApi'
import { registrationDetailsApiFaqs, REGISTRATION_DETAILS_API_PATH } from '../data/registrationDetailsApi'
import { vehicleDetailsApiIndiaFaqs, VEHICLE_DETAILS_API_INDIA_PATH } from '../data/vehicleDetailsApiIndia'
import { makeModelApiFaqs, MAKE_MODEL_API_PATH } from '../data/makeModelApi'
import { vehicleDataApiFaqs, VEHICLE_DATA_API_PATH } from '../data/vehicleDataApi'
import { carDetailsApiFaqs, CAR_DETAILS_API_PATH } from '../data/carDetailsApi'
import { carInformationApiFaqs, CAR_INFORMATION_API_PATH } from '../data/carInformationApi'
import { motorcycleApiFaqs, MOTORCYCLE_API_PATH } from '../data/motorcycleApi'
import { homeFaqs } from '../data/home'
import { rcDownloadFaqs, RC_DOWNLOAD_PATH } from '../data/rcDownload'
import { freeDownloadFaqs, FREE_DOWNLOAD_PATH } from '../data/freeDownload'
import { drivingSchoolFaqs, DRIVING_SCHOOL_PATH } from '../data/drivingSchool'
import { documentExpiryFaqs, DOCUMENT_EXPIRY_PATH } from '../data/documentExpiry'
import { expiryReminderFaqs, EXPIRY_REMINDER_PATH } from '../data/expiryReminder'
import { rcVerificationFaqs, RC_VERIFICATION_PATH } from '../data/rcVerification'
import { vehicleDetailsSoftwareFaqs, VEHICLE_DETAILS_SOFTWARE_PATH } from '../data/vehicleDetailsSoftware'
import { nationalPermitFaqs, NATIONAL_PERMIT_PATH } from '../data/nationalPermit'
import { drivingLicenceFaqs, DRIVING_LICENCE_PATH } from '../data/drivingLicence'
import { learningLicenceFaqs, LEARNING_LICENCE_PATH } from '../data/learningLicence'
import { dlManagementSystemFaqs, DL_MANAGEMENT_SYSTEM_PATH } from '../data/dlManagementSystem'
import { drivingSchoolManagementFaqs, DRIVING_SCHOOL_MANAGEMENT_PATH } from '../data/drivingSchoolManagement'
import { drivingSchoolSystemFaqs, DRIVING_SCHOOL_SYSTEM_PATH } from '../data/drivingSchoolSystem'
import { bestDrivingSchoolFaqs, BEST_DRIVING_SCHOOL_PATH } from '../data/bestDrivingSchool'
import { drivingSchoolCrmFaqs, DRIVING_SCHOOL_CRM_PATH } from '../data/drivingSchoolCrm'
import { rtoAgentCrmFaqs, RTO_AGENT_CRM_PATH } from '../data/rtoAgentCrm'
import { rtoAgentLeadFaqs, RTO_AGENT_LEAD_PATH } from '../data/rtoAgentLeadManagement'
import { rtoAgentAppFaqs, RTO_AGENT_APP_PATH } from '../data/rtoAgentApp'
import { rtoOfflineFaqs, RTO_OFFLINE_PATH } from '../data/rtoOfflineSoftware'
import { bestRtoOfficeFaqs, BEST_RTO_OFFICE_PATH } from '../data/bestRtoOffice'
import { cloudRtoFaqs, CLOUD_RTO_PATH } from '../data/cloudRto'
import {
  SITE_URL,
  SITE_NAME,
  DEFAULT_KEYWORDS,
  getPageSeo,
  absoluteUrl,
} from './seo'

// Product landing pages: SoftwareApplication, FAQ and breadcrumb structured data
const PRODUCT_PAGES = {
  '/puc-agent-software': { name: 'PUC Agent Software' },
  [RTO_MANAGEMENT_PATH]: { name: 'RTO Management Software', faqs: rtoManagementFaqs, video: true },
  [VEHICLE_INFO_PATH]: { name: 'Vehicle Information Software', faqs: vehicleInfoFaqs },
  [VEHICLE_INFO_API_PATH]: {
    name: 'Vehicle Information API',
    faqs: vehicleInfoApiFaqs,
    alternateName: ['Vehicle Details API', 'RC Details API'],
    category: 'DeveloperApplication',
    offer: { price: '1.5', description: 'Starting price per successful vehicle search' },
    features: [
      'RC details by vehicle number as JSON',
      'Owner, maker and model, chassis and engine number',
      'Registration, insurance, tax, fitness and PUC validity',
      'Pay only for successful searches',
      'Usage and remaining searches in every response',
      'Vehicles from all states of India',
    ],
  },
  [VAHAN_API_PATH]: {
    name: 'Vahan API for Vehicle Details',
    faqs: vahanApiFaqs,
    alternateName: ['RTO Sarthi Vahan API', 'Vehicle Details API', 'Vahan RC API'],
    category: 'DeveloperApplication',
    offer: { price: '1.5', description: 'Starting price per successful vehicle search' },
    features: [
      'Vehicle details by vehicle number as JSON',
      'Owner name, father\'s name and address',
      'Maker, model, vehicle class, body type, fuel and emission norms',
      'Chassis and engine number, cubic capacity and seating',
      'Financer, insurance, PUC, fitness and road tax details',
      'Blacklist and NOC status',
      'Pay only for successful searches',
      'Vehicles from all states of India',
    ],
  },
  [VEHICLE_DETAILS_API_INDIA_PATH]: {
    name: 'Vehicle Details API India',
    faqs: vehicleDetailsApiIndiaFaqs,
    alternateName: ['Vehicle Details API', 'API for Getting Vehicle Details', 'Vehicle Detail API', 'All India Vehicle Details API'],
    category: 'DeveloperApplication',
    offer: { price: '1.5', description: 'Starting price per successful vehicle search' },
    features: [
      'Vehicle details for any Indian vehicle number as JSON',
      'All 36 states and union territories, including BH series',
      'Owner, RTO, maker and model, chassis and engine number',
      'Insurance, PUC, fitness and road tax validity',
      'Financer, blacklist and NOC status',
      'Cars, bikes, trucks, buses and tractors',
      'Prepaid in rupees with GST invoice',
      'Pay only for successful searches',
    ],
  },
  [MAKE_MODEL_API_PATH]: {
    name: 'Vehicle Make and Model API',
    faqs: makeModelApiFaqs,
    alternateName: ['Car Make and Model API', 'Vehicle Make Model Lookup API'],
    category: 'DeveloperApplication',
    offer: { price: '1.5', description: 'Starting price per successful vehicle search' },
    features: [
      'Maker and model by vehicle number as JSON',
      'Vehicle class and body type',
      'Fuel type and emission norms',
      'Cubic capacity and seating capacity',
      'Colour and manufacturing month and year',
      'Two-wheelers, cars and commercial vehicles from all states of India',
      'Pay only for successful searches',
    ],
  },
  [PARIVAHAN_API_PATH]: {
    name: 'Parivahan API for Vehicle Details',
    faqs: parivahanApiFaqs,
    alternateName: ['RTO Sarthi Parivahan API', 'Parivahan Vehicle Details API', 'Parivahan RC API'],
    category: 'DeveloperApplication',
    offer: { price: '1.5', description: 'Starting price per successful vehicle search' },
    features: [
      'Vehicle details by vehicle number as JSON',
      'Owner, RTO, maker and model, chassis and engine number',
      'Insurance, PUC, fitness and road tax validity',
      'Financer, blacklist and NOC status',
      'All states of India, including BH series',
      'No monthly or setup fee, GST invoice',
      'Pay only for successful searches',
    ],
  },
  [VEHICLE_DATA_API_PATH]: {
    name: 'Vehicle Data API India',
    faqs: vehicleDataApiFaqs,
    alternateName: ['Vehicle Data API', 'Vehicle Registration Data API'],
    category: 'DeveloperApplication',
    offer: { price: '1.5', description: 'Starting price per successful vehicle search' },
    features: [
      'Complete vehicle data by registration number as JSON',
      'Registration, owner, maker, model and specifications',
      'Chassis and engine number',
      'Insurance, PUC, fitness and road tax validity',
      'Financer, blacklist and NOC status',
      'Vehicles from all states of India, including BH series',
      'No monthly or setup fee, GST invoice',
      'Pay only for successful searches',
    ],
  },
  [CAR_DETAILS_API_PATH]: {
    name: 'Car Details API',
    faqs: carDetailsApiFaqs,
    alternateName: ['Car Details API India', 'Car Number Details API'],
    category: 'DeveloperApplication',
    offer: { price: '1.5', description: 'Starting price per successful car search' },
    features: [
      'Car details by registration number as JSON',
      'Maker, model and variant, body type and fuel',
      'Engine CC, emission norms, seating, colour and manufacturing year',
      'Owner count, chassis and engine number',
      'Insurance and PUC validity',
      'Cars from all states of India, including BH series',
      'Pay only for successful searches',
    ],
  },
  [CAR_INFORMATION_API_PATH]: {
    name: 'Car Information API',
    faqs: carInformationApiFaqs,
    alternateName: ['Car Info API', 'Car Information API India'],
    category: 'DeveloperApplication',
    offer: { price: '1.5', description: 'Starting price per successful car search' },
    features: [
      'Full car record by registration number as JSON',
      'Registration date, validity, status and registering RTO',
      'Owner name and owner count, chassis and engine number',
      'Insurance, PUC, fitness and road tax validity',
      'Financer, blacklist and NOC status',
      'Cars from all states of India, including BH series',
      'Pay only for successful searches',
    ],
  },
  [MOTORCYCLE_API_PATH]: {
    name: 'Motorcycle API India',
    faqs: motorcycleApiFaqs,
    alternateName: ['Bike Details API India', 'Two Wheeler Details API'],
    category: 'DeveloperApplication',
    offer: { price: '1.5', description: 'Starting price per successful vehicle search' },
    features: [
      'Bike and scooter details by registration number as JSON',
      'Maker, model, engine CC, fuel and emission norms',
      'Manufacturing date, owner name and owner count',
      'Chassis and engine number',
      'Insurance and PUC validity, financer and blacklist',
      'Petrol and electric two-wheelers from all states, including BH series',
      'Pay only for successful searches',
    ],
  },
  [INSURANCE_API_PATH]: {
    name: 'Vehicle Insurance API',
    faqs: insuranceApiFaqs,
    alternateName: ['Vehicle Insurance Details API', 'Vehicle Insurance Status API'],
    category: 'DeveloperApplication',
    offer: { price: '1.5', description: 'Starting price per successful vehicle search' },
    features: [
      'Insurance company, policy number and valid-up-to date by vehicle number',
      'Maker, model, vehicle class, fuel and registration date',
      'PUC, fitness and road tax validity',
      'Vehicles from all states of India',
      'Pay only for successful searches',
      'Usage and remaining searches in every response',
    ],
  },
  [RC_VERIFICATION_API_PATH]: {
    name: 'Vehicle RC Verification API',
    faqs: rcVerificationApiFaqs,
    alternateName: ['RC Verification API', 'RC Check API'],
    category: 'DeveloperApplication',
    offer: { price: '1.5', description: 'Starting price per successful RC verification' },
    features: [
      'RC details by vehicle number as JSON',
      'Owner name, chassis and engine number to match the RC',
      'Registration status, date and validity',
      'Financer, blacklist and NOC status',
      'Insurance, PUC, fitness and road tax validity',
      'Vehicles from all states of India, including BH series',
      'Pay only for successful verifications',
    ],
  },
  [VEHICLE_VERIFICATION_API_PATH]: {
    name: 'Vehicle Verification API',
    faqs: vehicleVerificationApiFaqs,
    alternateName: ['Vehicle Check API', 'Vehicle Verification API India'],
    category: 'DeveloperApplication',
    offer: { price: '1.5', description: 'Starting price per successful vehicle verification' },
    features: [
      'Vehicle verification by registration number as JSON',
      'Registration status, validity and registering RTO',
      'Chassis and engine number, owner, maker and model',
      'Insurance, PUC, fitness and road tax validity',
      'Financer, blacklist and NOC status',
      'Bulk verification with remaining searches in every response',
      'Vehicles from all states of India, including BH series',
      'Pay only for successful verifications',
    ],
  },
  [RC_TO_CHASSIS_API_PATH]: {
    name: 'RC to Chassis Number API',
    faqs: rcToChassisApiFaqs,
    alternateName: ['Vehicle Number to Chassis Number API', 'Chassis Number Lookup API'],
    category: 'DeveloperApplication',
    offer: { price: '1.5', description: 'Starting price per successful vehicle search' },
    features: [
      'Chassis number (VIN) and engine number by vehicle number as JSON',
      'Maker, model, class, fuel and manufacturing date',
      'Registration date and status',
      'Vehicles from all states of India, including BH series',
      'Pay only for successful searches',
    ],
  },
  [RC_TO_REGISTRATION_DATE_API_PATH]: {
    name: 'RC to Registration Date API',
    faqs: rcToRegistrationDateApiFaqs,
    alternateName: ['Vehicle Number to Registration Date API', 'Vehicle Registration Date API'],
    category: 'DeveloperApplication',
    offer: { price: '1.5', description: 'Starting price per successful vehicle search' },
    features: [
      'Registration date and registration valid up to date by vehicle number as JSON',
      'Manufacturing month and year for vehicle age',
      'Registering RTO and registration status',
      'Maker, model, class and fuel',
      'Vehicles from all states of India, including BH series',
      'Pay only for successful searches',
    ],
  },
  [PUC_DETAILS_API_PATH]: {
    name: 'Vehicle PUC Details API',
    faqs: pucDetailsApiFaqs,
    alternateName: ['RC to PUC Details API', 'PUC Status API'],
    category: 'DeveloperApplication',
    offer: { price: '1.5', description: 'Starting price per successful vehicle search' },
    features: [
      'PUC certificate number and PUC valid-up-to date by vehicle number as JSON',
      'Maker, model, class, fuel and emission norms',
      'Insurance, fitness and road tax validity',
      'Vehicles from all states of India, including BH series',
      'Pay only for successful searches',
    ],
  },
  [FITNESS_DETAILS_API_PATH]: {
    name: 'Vehicle Fitness Details API',
    faqs: fitnessDetailsApiFaqs,
    alternateName: ['Vehicle Fitness API', 'Fitness Status API', 'Fitness Check by Vehicle Number API'],
    category: 'DeveloperApplication',
    offer: { price: '1.5', description: 'Starting price per successful vehicle search' },
    features: [
      'Fitness valid-up-to date by vehicle number as JSON',
      'Vehicle class, registration status and permit number',
      'Insurance, PUC and road tax validity',
      'Vehicles from all states of India, including BH series',
      'Pay only for successful searches',
    ],
  },
  [ROAD_TAX_DETAILS_API_PATH]: {
    name: 'RC to Road Tax Details API',
    faqs: roadTaxDetailsApiFaqs,
    alternateName: ['Vehicle Road Tax API', 'Road Tax Status API', 'Road Tax Check by Vehicle Number API'],
    category: 'DeveloperApplication',
    offer: { price: '1.5', description: 'Starting price per successful vehicle search' },
    features: [
      'Road tax paid-up-to date or lifetime tax (LTT) by vehicle number as JSON',
      'Vehicle class, registering RTO and permit number',
      'Fitness, insurance and PUC validity',
      'Vehicles from all states of India, including BH series',
      'Pay only for successful searches',
    ],
  },
  [REGISTRATION_DETAILS_API_PATH]: {
    name: 'Vehicle Registration Details API',
    faqs: registrationDetailsApiFaqs,
    alternateName: ['Vehicle Registration Details API India', 'Vehicle Registration API'],
    category: 'DeveloperApplication',
    offer: { price: '1.5', description: 'Starting price per successful vehicle search' },
    features: [
      'Vehicle registration record by registration number as JSON',
      'Registration date, valid-up-to date and status',
      'Registering RTO and state, including BH series',
      'Owner name and owner count',
      'Class, maker, model, chassis and engine number',
      'Financer, blacklist and NOC status',
      'Pay only for successful searches',
    ],
  },
  [LOOKUP_API_PATH]: {
    name: 'Vehicle Lookup API',
    faqs: lookupApiFaqs,
    alternateName: ['Vehicle Registration Lookup API', 'Registration Number Lookup API'],
    category: 'DeveloperApplication',
    offer: { price: '1.5', description: 'Starting price per successful vehicle search' },
    features: [
      'Vehicle record by registration number as JSON',
      'Registration status, registering RTO, owner and owner serial number',
      'Maker, model, chassis and engine number for verification',
      'Insurance, PUC, fitness and road tax validity',
      'Financer, blacklist and NOC status',
      'Bulk lookups with remaining searches in every response',
      'Vehicles from all states of India',
      'Pay only for successful lookups',
    ],
  },
  [RC_DOWNLOAD_PATH]: { name: 'RC Download Software', faqs: rcDownloadFaqs },
  [FREE_DOWNLOAD_PATH]: { name: 'RTO Agent Software Free Download', faqs: freeDownloadFaqs },
  [RTO_AGENT_APP_PATH]: {
    name: 'RTO Agent App',
    faqs: rtoAgentAppFaqs,
    alternateName: ['RTO Sarthi App', 'RTO Agent Mobile App', 'App for RTO Agents'],
    features: [
      'Works on Android, iPhone, Windows, Mac and web with one account',
      'Automatic WhatsApp reminders for tax, fitness, permit, PUC, insurance and GPS expiry',
      'RC details by vehicle number at ₹1.5 per search',
      'Client and vehicle records with search by vehicle number, owner or mobile',
      'Payments and pending balance',
      'Learner licence and driving licence work with 30-day DL eligibility WhatsApp',
      'Automatic document entry from RC, insurance and permit copies',
      'Lead follow-ups with one-tap call and WhatsApp',
      'Staff and sub-agent logins',
    ],
  },
  [CLOUD_RTO_PATH]: {
    name: 'Cloud RTO Software',
    faqs: cloudRtoFaqs,
    alternateName: ['Cloud Based RTO Software', 'Online RTO Software', 'RTO Sarthi Cloud'],
    features: [
      'Data stored securely online with automatic backup',
      'Same account on Windows, Mac, Android, iPhone and web',
      'Automatic WhatsApp reminders for tax, fitness, permit, PUC, insurance and GPS expiry, sent from the cloud',
      'Staff, sub-agent, insurance agent and PUC center logins on the same records',
      'Automatic updates with no installation file',
      'RC details by vehicle number at ₹1.5 per search',
      'Client payments and pending balance in real time',
      'Excel import from existing records',
    ],
  },
  [BEST_RTO_OFFICE_PATH]: {
    name: 'Best RTO Office Software',
    faqs: bestRtoOfficeFaqs,
    alternateName: ['RTO Office Software', 'RTO Office Management Software'],
    features: [
      'Staff and sub-agent logins on the same records',
      'Automatic WhatsApp reminders for tax, fitness, permit, PUC, insurance and GPS expiry',
      'Client payments and pending balance',
      'RC details by vehicle number at ₹1.5 per search',
      'Learner licence and driving licence work with 30-day DL eligibility WhatsApp',
      'Automatic document entry and bulk Excel import',
      'Lead and enquiry follow-ups',
      'Owner dashboard',
      'Works on Windows, Mac, Android and iPhone with online backup',
    ],
  },
  [RTO_OFFLINE_PATH]: {
    name: 'RTO Offline Software Alternative',
    faqs: rtoOfflineFaqs,
    alternateName: ['RTO Desktop Software', 'RTO Software for PC'],
    features: [
      'Installs on Windows and Mac with a desktop and taskbar icon',
      'Data stored online with automatic backup',
      'Same data on Android and iPhone',
      'Automatic WhatsApp reminders for tax, fitness, permit, PUC and insurance expiry',
      'Multiple staff logins on the same records',
      'RC details by vehicle number at ₹1.5 per search',
      'Automatic updates',
      'Excel import from existing records',
    ],
  },
  [DRIVING_SCHOOL_PATH]: { name: 'Driving School Software', faqs: drivingSchoolFaqs },
  [DOCUMENT_EXPIRY_PATH]: { name: 'Document Expiry Reminder Software', faqs: documentExpiryFaqs },
  [EXPIRY_REMINDER_PATH]: { name: 'Vehicle Document Expiry Reminder Software', faqs: expiryReminderFaqs },
  [RC_VERIFICATION_PATH]: { name: 'RC Verification Software', faqs: rcVerificationFaqs },
  [VEHICLE_DETAILS_SOFTWARE_PATH]: { name: 'Vehicle Details Software', faqs: vehicleDetailsSoftwareFaqs },
  [NATIONAL_PERMIT_PATH]: { name: 'National Permit Renewal Reminder Software', faqs: nationalPermitFaqs },
  [DRIVING_LICENCE_PATH]: { name: 'Driving Licence Software', faqs: drivingLicenceFaqs },
  [LEARNING_LICENCE_PATH]: {
    name: 'Learning Licence Software',
    faqs: learningLicenceFaqs,
    alternateName: ['Learner Licence Software', 'LL DL Software for RTO Agents'],
    features: [
      'Automatic WhatsApp message 30 days after learning licence for DL eligibility',
      'Learning licence expiry dashboard',
      'Pending balance and profit tracking',
      'Learning licence to driving licence in one record',
      'Aadhaar, photo and signature document storage',
      'Vehicle, tax, permit, PUC and insurance RTO work',
    ],
  },
  [DL_MANAGEMENT_SYSTEM_PATH]: {
    name: 'Driving Licence Management System',
    faqs: dlManagementSystemFaqs,
    alternateName: ['DL Management System', 'Driving License Management System for RTO Agents'],
    features: [
      'Learner licence, driving licence and DL renewal records',
      'Automatic WhatsApp message 30 days after learning licence for DL eligibility',
      'Learning licence expiry dashboard',
      'Fees, pending balance and profit tracking',
      'Multi-agent access',
      'Applicant document storage',
      'Vehicle, tax, permit, PUC and insurance RTO work',
    ],
  },
  [DRIVING_SCHOOL_MANAGEMENT_PATH]: {
    name: 'Driving School Management Software',
    faqs: drivingSchoolManagementFaqs,
    alternateName: ['Motor Driving School Software', 'Driving School Admission & Fee Software'],
    features: [
      'Digital student admissions register',
      'Fee collection, pending dues and profit tracking',
      'Automatic WhatsApp message 30 days after learning licence for DL eligibility',
      'Learning licence expiry dashboard',
      'Student document storage',
      'Referral tracking',
      'Multi-user access for owner and staff',
      'Vehicle registration, transfer, insurance and PUC RTO work',
    ],
  },
  [DRIVING_SCHOOL_SYSTEM_PATH]: {
    name: 'Driving School Management System',
    faqs: drivingSchoolSystemFaqs,
    alternateName: ['Driving School System', 'Motor Driving School Management System'],
    features: [
      'Connected student lifecycle from admission to permanent driving licence',
      'Automatic WhatsApp message 30 days after learning licence for DL eligibility',
      'Learning licence expiry dashboard',
      'Fee instalments, pending balance and profit tracking',
      'Multi-user access with referral tracking',
      'Central student document storage',
      'Vehicle RTO work with WhatsApp expiry reminders',
    ],
  },
  [BEST_DRIVING_SCHOOL_PATH]: {
    name: 'Best Driving School Software India',
    faqs: bestDrivingSchoolFaqs,
    alternateName: ['Top Driving School Software India'],
    features: [
      'Learner licence and driving licence records',
      'Automatic WhatsApp message 30 days after learning licence for DL eligibility',
      'Learning licence expiry dashboard',
      'Fee instalments and pending balance',
      'Mobile and multi-user access',
      'RTO work with WhatsApp expiry reminders',
    ],
  },
  [DRIVING_SCHOOL_CRM_PATH]: {
    name: 'Driving School CRM',
    faqs: drivingSchoolCrmFaqs,
    alternateName: ['CRM for Driving Schools', 'Driving School WhatsApp CRM'],
    features: [
      'Complete student record with contact, documents, fees and licence history',
      'Automatic WhatsApp message 30 days after learning licence for DL eligibility',
      'Learning licence expiry dashboard',
      'Referral source tracking',
      'Pending fee follow-up',
      'WhatsApp renewal reminders for tax, fitness, permit, insurance and PUC',
    ],
  },
  [RTO_AGENT_CRM_PATH]: {
    name: 'RTO Agent CRM Software',
    faqs: rtoAgentCrmFaqs,
    alternateName: ['CRM for RTO Agents', 'RTO CRM Software'],
    features: [
      'Client and vehicle records with search by vehicle number, owner or mobile',
      'Automatic WhatsApp reminders for tax, fitness, permit, PUC and insurance expiry',
      'Client payments and pending balance',
      'Learner licence and driving licence clients with 30-day DL eligibility WhatsApp',
      'Automatic document entry from RC, insurance and permit copies',
      'Bulk Excel import for PUC and insurance records',
      'Dashboard analytics',
      'Multi-agent access for RTO agents, insurance agents and PUC centers',
    ],
  },
  [RTO_AGENT_LEAD_PATH]: {
    name: 'RTO Agent Lead Management Software',
    faqs: rtoAgentLeadFaqs,
    alternateName: ['RTO Lead Management Software', 'Lead Management for RTO Agents'],
    features: [
      'Leads for permit, tax, fitness, PUC and insurance work with vehicle number and expiry date',
      'Follow-up Today, Overdue, New and Upcoming lists with date and time',
      'One-tap call and WhatsApp with follow-up notes and history',
      'Move vehicles from RC search history into leads with document expiry dates',
      'Status pipeline from New to Converted or Lost with lost reasons',
      'Hot, warm and cold priority with expected amount',
      'Lead source tracking',
      'Staff access control for the leads section',
    ],
  },
}

function getSoftwareJsonLd(name, description, url, { alternateName, features, category, offer } = {}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name,
    ...(alternateName && { alternateName }),
    ...(features && { featureList: features }),
    applicationCategory: category || 'BusinessApplication',
    operatingSystem: 'Android, iOS, Windows, macOS, Web',
    description,
    url,
    offers: {
      '@type': 'Offer',
      price: offer?.price || '0',
      priceCurrency: 'INR',
      description: offer?.description || 'Free trial available',
    },
    provider: {
      '@type': 'Organization',
      name: 'SoftwareBytes',
      url: 'https://softwarebytes.in',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Raipur',
        addressRegion: 'Chhattisgarh',
        addressCountry: 'IN',
      },
    },
    areaServed: { '@type': 'Country', name: 'India' },
  }
}

function getFaqJsonLd(faqs) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  }
}

function getVideoJsonLd(url) {
  return {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: 'RTO management software demo — RTO Sarthi',
    description:
      'Demo of RTO Sarthi RTO management software: vehicle management, WhatsApp expiry alerts and renewal tracking from one dashboard.',
    thumbnailUrl: [`https://i.ytimg.com/vi/${VIDEO_ID}/hqdefault.jpg`],
    uploadDate: '2026-05-22',
    embedUrl: `https://www.youtube.com/embed/${VIDEO_ID}`,
    contentUrl: `https://www.youtube.com/watch?v=${VIDEO_ID}`,
    url,
  }
}

function getBreadcrumbJsonLd(name, url) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
      { '@type': 'ListItem', position: 2, name, item: url },
    ],
  }
}

/** JSON-LD ids getPageHead may set; ones a page doesn't use are removed on navigation */
export const PAGE_JSONLD_IDS = ['software', 'faq', 'breadcrumb', 'video', 'blogposting']

export function getPageHead(pathname) {
  const seo = getPageSeo(pathname)
  const url = absoluteUrl(seo.path)
  const image = absoluteUrl('/rtosarthi.avif')

  const meta = [
    ['name', 'description', seo.description],
    ['name', 'keywords', seo.keywords || DEFAULT_KEYWORDS],
    ['name', 'robots', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'],
    ['name', 'author', 'SoftwareBytes, Raipur'],
    ['property', 'og:type', 'website'],
    ['property', 'og:site_name', SITE_NAME],
    ['property', 'og:title', seo.title],
    ['property', 'og:description', seo.description],
    ['property', 'og:url', url],
    ['property', 'og:locale', 'en_IN'],
    ['property', 'og:image', image],
    ['name', 'twitter:card', 'summary_large_image'],
    ['name', 'twitter:title', seo.title],
    ['name', 'twitter:description', seo.description],
    ['name', 'twitter:image', image],
  ].map(([attr, key, content]) => ({ attr, key, content }))

  const jsonLd = []
  const product = PRODUCT_PAGES[pathname]
  if (product) {
    jsonLd.push({ id: 'software', data: getSoftwareJsonLd(`RTO Sarthi - ${product.name}`, seo.description, url, product) })
  }
  if (product?.faqs) {
    jsonLd.push({ id: 'faq', data: getFaqJsonLd(product.faqs) })
    jsonLd.push({ id: 'breadcrumb', data: getBreadcrumbJsonLd(product.name, url) })
  }
  if (pathname === '/') {
    jsonLd.push({ id: 'faq', data: getFaqJsonLd(homeFaqs) })
  }
  if (product?.video) {
    jsonLd.push({ id: 'video', data: getVideoJsonLd(url) })
  }

  return { title: seo.title, meta, links: [{ rel: 'canonical', href: url }], jsonLd }
}
