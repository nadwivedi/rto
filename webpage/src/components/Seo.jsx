import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import {
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

export default function Seo() {
  const { pathname } = useLocation()
  const seo = getPageSeo(pathname)
  const url = absoluteUrl(seo.path)

  useEffect(() => {
    document.title = seo.title

    upsertMeta('name', 'description', seo.description)
    upsertMeta('name', 'keywords', DEFAULT_KEYWORDS)
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
  }, [seo.title, seo.description, url])

  return null
}

export { TAGLINE, SITE_NAME }
