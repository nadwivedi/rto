import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { getPageHead, PAGE_JSONLD_IDS } from '../config/pageHead'
import { applyHead, removeJsonLd, removeMeta } from '../lib/head'

/**
 * Keeps <head> in sync on client-side navigation. The first load already has the right
 * tags in the prerendered HTML (see src/prerender.jsx).
 */
export default function Seo() {
  const { pathname } = useLocation()

  useEffect(() => {
    // Blog posts set their own head once the post is loaded (BlogPost.jsx)
    if (pathname.startsWith('/blog/')) return

    const head = getPageHead(pathname)
    applyHead(head)
    for (const id of PAGE_JSONLD_IDS) {
      if (!head.jsonLd.some((j) => j.id === id)) removeJsonLd(id)
    }
    for (const key of ['article:tag', 'article:published_time', 'article:modified_time']) removeMeta('property', key)
  }, [pathname])

  return null
}
