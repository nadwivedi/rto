import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import {
  SITE_URL,
  SITE_NAME,
  TAGLINE,
  DEFAULT_KEYWORDS,
  getPageSeo,
  absoluteUrl,
} from '../config/seo'

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

function getSoftwareJsonLd(name, description, url) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name,
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

    if (pathname === '/puc-agent-software') {
      upsertJsonLd('software', getSoftwareJsonLd('RTO Sarthi - PUC Agent Software', seo.description, url))
    } else {
      removeJsonLd('software')
    }
  }, [seo.title, seo.description, url, pathname])

  return null
}

export { TAGLINE, SITE_NAME }
