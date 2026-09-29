import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { rtoManagementFaqs, RTO_MANAGEMENT_PATH, VIDEO_ID } from '../data/rtoManagement'
import { vehicleInfoFaqs, VEHICLE_INFO_PATH } from '../data/vehicleInfo'
import { rcDownloadFaqs, RC_DOWNLOAD_PATH } from '../data/rcDownload'
import { freeDownloadFaqs, FREE_DOWNLOAD_PATH } from '../data/freeDownload'
import { drivingSchoolFaqs, DRIVING_SCHOOL_PATH } from '../data/drivingSchool'
import { documentExpiryFaqs, DOCUMENT_EXPIRY_PATH } from '../data/documentExpiry'
import { expiryReminderFaqs, EXPIRY_REMINDER_PATH } from '../data/expiryReminder'
import { rcVerificationFaqs, RC_VERIFICATION_PATH } from '../data/rcVerification'
import { nationalPermitFaqs, NATIONAL_PERMIT_PATH } from '../data/nationalPermit'
import { drivingLicenceFaqs, DRIVING_LICENCE_PATH } from '../data/drivingLicence'
import { learningLicenceFaqs, LEARNING_LICENCE_PATH } from '../data/learningLicence'
import { dlManagementSystemFaqs, DL_MANAGEMENT_SYSTEM_PATH } from '../data/dlManagementSystem'
import { drivingSchoolManagementFaqs, DRIVING_SCHOOL_MANAGEMENT_PATH } from '../data/drivingSchoolManagement'
import { drivingSchoolSystemFaqs, DRIVING_SCHOOL_SYSTEM_PATH } from '../data/drivingSchoolSystem'
import { bestDrivingSchoolFaqs, BEST_DRIVING_SCHOOL_PATH } from '../data/bestDrivingSchool'
import { drivingSchoolCrmFaqs, DRIVING_SCHOOL_CRM_PATH } from '../data/drivingSchoolCrm'
import {
  SITE_URL,
  SITE_NAME,
  TAGLINE,
  DEFAULT_KEYWORDS,
  getPageSeo,
  absoluteUrl,
} from '../config/seo'

// Product landing pages: SoftwareApplication, FAQ and breadcrumb structured data
const PRODUCT_PAGES = {
  '/puc-agent-software': { name: 'PUC Agent Software' },
  [RTO_MANAGEMENT_PATH]: { name: 'RTO Management Software', faqs: rtoManagementFaqs, video: true },
  [VEHICLE_INFO_PATH]: { name: 'Vehicle Information Software', faqs: vehicleInfoFaqs },
  [RC_DOWNLOAD_PATH]: { name: 'RC Download Software', faqs: rcDownloadFaqs },
  [FREE_DOWNLOAD_PATH]: { name: 'RTO Agent Software Free Download', faqs: freeDownloadFaqs },
  [DRIVING_SCHOOL_PATH]: { name: 'Driving School Software', faqs: drivingSchoolFaqs },
  [DOCUMENT_EXPIRY_PATH]: { name: 'Document Expiry Reminder Software', faqs: documentExpiryFaqs },
  [EXPIRY_REMINDER_PATH]: { name: 'Vehicle Document Expiry Reminder Software', faqs: expiryReminderFaqs },
  [RC_VERIFICATION_PATH]: { name: 'RC Verification Software', faqs: rcVerificationFaqs },
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
}

function upsertMeta(attr, key, content) {
  if (!content) return
  let el = document.querySelector(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function removeMeta(attr, key) {
  const el = document.querySelector(`meta[${attr}="${key}"]`)
  if (el) el.remove()
}

function upsertLink(rel, href) {
  if (!href) return
  let el = document.querySelector(`link[rel="${rel}"]`)
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', rel)
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

function upsertJsonLd(id, data) {
  let el = document.querySelector(`script[data-jsonld="${id}"]`)
  if (!el) {
    el = document.createElement('script')
    el.setAttribute('type', 'application/ld+json')
    el.setAttribute('data-jsonld', id)
    document.head.appendChild(el)
  }
  el.textContent = JSON.stringify(data)
}

function removeJsonLd(id) {
  const el = document.querySelector(`script[data-jsonld="${id}"]`)
  if (el) el.remove()
}

function getSoftwareJsonLd(name, description, url, { alternateName, features } = {}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name,
    ...(alternateName && { alternateName }),
    ...(features && { featureList: features }),
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    description,
    url,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'INR',
      description: 'Free trial available',
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

export default function Seo() {
  const { pathname } = useLocation()
  const seo = getPageSeo(pathname)
  const url = absoluteUrl(seo.path)

  useEffect(() => {
    document.title = seo.title

    const keywords = seo.keywords || DEFAULT_KEYWORDS
    upsertMeta('name', 'description', seo.description)
    upsertMeta('name', 'keywords', keywords)
    upsertMeta('name', 'robots', 'index, follow')
    upsertMeta('name', 'author', 'SoftwareBytes, Raipur')

    upsertLink('canonical', url)

    upsertMeta('property', 'og:type', 'website')
    upsertMeta('property', 'og:site_name', SITE_NAME)
    upsertMeta('property', 'og:title', seo.title)
    upsertMeta('property', 'og:description', seo.description)
    upsertMeta('property', 'og:url', url)
    upsertMeta('property', 'og:locale', 'en_IN')
    upsertMeta('property', 'og:image', absoluteUrl('/rtosarthi.avif'))

    upsertMeta('name', 'twitter:card', 'summary_large_image')
    upsertMeta('name', 'twitter:title', seo.title)
    upsertMeta('name', 'twitter:description', seo.description)
    upsertMeta('name', 'twitter:image', absoluteUrl('/rtosarthi.avif'))

    const product = PRODUCT_PAGES[pathname]
    if (product) {
      upsertJsonLd('software', getSoftwareJsonLd(`RTO Sarthi - ${product.name}`, seo.description, url, product))
    } else {
      removeJsonLd('software')
    }

    if (product?.faqs) {
      upsertJsonLd('faq', getFaqJsonLd(product.faqs))
      upsertJsonLd('breadcrumb', getBreadcrumbJsonLd(product.name, url))
    } else {
      removeJsonLd('faq')
      removeJsonLd('breadcrumb')
    }

    if (product?.video) {
      upsertJsonLd('video', getVideoJsonLd(url))
    } else {
      removeJsonLd('video')
    }
  }, [seo.title, seo.description, url, pathname])

  return null
}

export { TAGLINE, SITE_NAME }
