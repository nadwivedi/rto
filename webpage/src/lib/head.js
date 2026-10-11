/**
 * A page's <head> as plain data, so the same description can be applied in the browser
 * (applyHead) and written into prerendered HTML at build time (headToElements).
 *
 * head = {
 *   title,
 *   meta:   [{ attr: 'name' | 'property', key, content }],  // repeat a key for multiple tags (article:tag)
 *   links:  [{ rel, href }],
 *   jsonLd: [{ id, data }],
 * }
 */

export function applyHead(head) {
  if (head.title) document.title = head.title

  const byKey = new Map()
  for (const m of head.meta || []) {
    if (!m.content) continue
    const k = `${m.attr}|${m.key}`
    if (!byKey.has(k)) byKey.set(k, [])
    byKey.get(k).push(m)
  }
  for (const metas of byKey.values()) {
    const { attr, key } = metas[0]
    const existing = document.querySelectorAll(`meta[${attr}="${key}"]`)
    if (metas.length === 1 && existing.length <= 1) {
      upsertMeta(attr, key, metas[0].content)
      continue
    }
    existing.forEach((el) => el.remove())
    for (const m of metas) {
      const el = document.createElement('meta')
      el.setAttribute(attr, key)
      el.setAttribute('content', m.content)
      document.head.appendChild(el)
    }
  }

  for (const l of head.links || []) upsertLink(l.rel, l.href)
  for (const j of head.jsonLd || []) upsertJsonLd(j.id, j.data)
}

export function upsertMeta(attr, key, content) {
  if (!content) return
  let el = document.querySelector(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

export function removeMeta(attr, key) {
  document.querySelectorAll(`meta[${attr}="${key}"]`).forEach((el) => el.remove())
}

export function upsertLink(rel, href) {
  if (!href) return
  let el = document.querySelector(`link[rel="${rel}"]`)
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', rel)
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

export function removeLink(rel) {
  const el = document.querySelector(`link[rel="${rel}"]`)
  if (el) el.remove()
}

export function upsertJsonLd(id, data) {
  let el = document.querySelector(`script[data-jsonld="${id}"]`)
  if (!el) {
    el = document.createElement('script')
    el.setAttribute('type', 'application/ld+json')
    el.setAttribute('data-jsonld', id)
    document.head.appendChild(el)
  }
  el.textContent = JSON.stringify(data)
}

export function removeJsonLd(id) {
  const el = document.querySelector(`script[data-jsonld="${id}"]`)
  if (el) el.remove()
}

/** JSON that is safe to place inside a <script> tag */
export function scriptJson(data) {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}

/** Elements for vite-prerender-plugin's head.elements (build time only) */
export function headToElements(head) {
  const elements = []
  for (const m of head.meta || []) {
    if (m.content) elements.push({ type: 'meta', props: { [m.attr]: m.key, content: m.content } })
  }
  for (const l of head.links || []) {
    if (l.href) elements.push({ type: 'link', props: { rel: l.rel, href: l.href } })
  }
  for (const j of head.jsonLd || []) {
    elements.push({
      type: 'script',
      props: { type: 'application/ld+json', 'data-jsonld': j.id, textContent: scriptJson(j.data) },
    })
  }
  return elements
}

/** Plain text from an HTML string without touching the DOM, so it renders the same at build time */
export function htmlToText(html) {
  if (!html) return ''
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}
