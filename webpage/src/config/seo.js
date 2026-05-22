/** SEO constants — update SITE_URL when deploying to production domain */
export const SITE_URL = 'https://rtosarthi.com'
export const SITE_NAME = 'RTO Sarthi'
export const TAGLINE = "India's Best RTO Agent Software"
export const DEFAULT_TITLE = `RTO Sarthi - ${TAGLINE}`

export const DEFAULT_DESCRIPTION =
  'RTO Sarthi is India\'s best RTO agent software. Digitize your RTO desk with AI document entry, WhatsApp expiry alerts, bulk Excel uploads, client pending balance tracking, and dashboard analytics. Built by SoftwareBytes, Raipur.'

export const DEFAULT_KEYWORDS = [
  'RTO Sarthi',
  'RTO agent software',
  'RTO agent software India',
  'best RTO software India',
  'RTO desk software',
  'vehicle expiry WhatsApp alert',
  'RTO Sarthi software',
  'RTO digital software',
  'tax fitness PUC insurance reminder',
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
  '/sitemap': {
    title: `Sitemap | RTO Sarthi - ${TAGLINE}`,
    description: 'Sitemap of RTO Sarthi website — Home, Features, About, and Contact pages.',
    path: '/sitemap',
  },
}

export function getPageSeo(pathname) {
  return PAGE_SEO[pathname] ?? PAGE_SEO['/']
}

export function absoluteUrl(path = '/') {
  const p = path.startsWith('/') ? path : `/${path}`
  return `${SITE_URL}${p === '/' ? '' : p}` || SITE_URL
}
