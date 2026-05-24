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
  'best RTO agent software',
  'best RTO software India',
  'RTO desk software',
  'vehicle expiry WhatsApp alert',
  'RTO Sarthi software',
  'RTO digital software',
  'tax fitness PUC insurance reminder',
  'RTO agent software for small business',
  'RTO agent management software',
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
  '/rto-agent-software': {
    title: `RTO Agent Software India - India's Best RTO Agent Software | RTO Sarthi`,
    description:
      'India\'s best RTO agent software for RTO agents, PUC centers, and insurance partners. AI-powered document entry, automated WhatsApp expiry alerts, bulk Excel upload, employee panel with limited access, pending balance alerts, and smart dashboard. Built for Indian RTO workflows by SoftwareBytes, Raipur. Start free trial today.',
    path: '/rto-agent-software',
    keywords: 'RTO agent software India, best RTO agent software, RTO software for agents, RTO desk software India, RTO management software, RTO Sarthi, RTO agent software Raipur, best RTO software India 2026',
  },
  '/puc-agent-software': {
    title: `PUC Agent Software India - Best PUC Center Management Software | RTO Sarthi`,
    description:
      'Best PUC agent software India for PUC centers and agents. Bulk Excel upload, PDF auto-entry with data extraction, automatic WhatsApp PUC expiry reminders, and complete RTO & insurance management — all in one platform. Simplify your PUC center with RTO Sarthi. Start free trial.',
    path: '/puc-agent-software',
    keywords: 'PUC agent software India, PUC center software, PUC certificate management software, PUC expiry reminder software, PUC agent management software, best PUC software India, PUC center management system, RTO Sarthi PUC software',
  },
  '/sitemap': {
    title: `Sitemap | RTO Sarthi - ${TAGLINE}`,
    description: 'Sitemap of RTO Sarthi website — Home, Features, PUC Agent Software, About, and Contact pages.',
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
