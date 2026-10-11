/**
 * Build-time prerendering (vite-prerender-plugin, see vite.config.js).
 *
 * For every page the plugin calls prerender({ url }) and writes the returned HTML and <head> tags
 * into a copy of index.html, so crawlers get the full page content, title, description, canonical
 * and structured data without running JavaScript.
 *
 * Routes are requested as "/<path>.html" so the output is dist/<path>.html (flat files), served by
 * nginx with:  try_files $uri $uri.html /spa.html;
 */
import { StaticRouter } from 'react-router-dom'
import AppRoutes from './AppRoutes'
import { getPageHead } from './config/pageHead'
import { API_URL, getBlogPostHead } from './config/blog'
import { headToElements, scriptJson } from './lib/head'
import { setServerData } from './lib/initialData'

async function getJson(path) {
  try {
    const res = await fetch(`${API_URL}${path}`)
    const data = await res.json()
    return data.success ? data : null
  } catch (err) {
    console.warn(`[prerender] could not fetch ${API_URL}${path}: ${err.message}`)
    return null
  }
}

async function getAllBlogs() {
  const blogs = []
  for (let page = 1; ; page++) {
    const data = await getJson(`/api/blogs?page=${page}&limit=50`)
    if (!data) break
    blogs.push(...data.data)
    if (page >= (data.pagination?.totalPages ?? 1)) break
  }
  return blogs
}

// Loaded only at build time: a static import would add it to the browser bundle. The edge build is
// used because react-dom/server's browser build opens a MessageChannel that keeps the build from exiting.
async function render(pathname) {
  const { renderToString } = await import('react-dom/server.edge')
  return renderToString(
    <StaticRouter location={pathname}>
      <AppRoutes />
    </StaticRouter>,
  )
}

function result(html, head, data) {
  const elements = headToElements(head)
  if (data) {
    elements.push({
      type: 'script',
      props: { type: 'application/json', id: 'prerender-data', textContent: scriptJson(data) },
    })
  }
  return { html, head: { lang: 'en-IN', title: head.title, elements: new Set(elements) } }
}

export async function prerender({ url }) {
  // Fallback for routes that aren't prerendered: no page content and no canonical
  if (url === '/spa.html') return { html: '' }

  const pathname = url === '/' ? '/' : url.replace(/\.html$/, '')
  let data = null
  let head = getPageHead(pathname)
  let links

  if (pathname === '/blog') {
    const list = await getJson('/api/blogs?page=1&limit=12')
    if (list) {
      data = { url: '/blog', blogs: list.data, totalPages: list.pagination?.totalPages ?? 1 }
      // Queue every blog post for prerendering
      links = new Set((await getAllBlogs()).map((b) => `/blog/${b.slug}.html`))
    }
  } else if (pathname.startsWith('/blog/')) {
    const slug = decodeURIComponent(pathname.slice('/blog/'.length))
    const [post, sidebar] = await Promise.all([
      getJson(`/api/blogs/${encodeURIComponent(slug)}`),
      getJson('/api/blogs?page=1&limit=6'),
    ])
    if (!post) return null // not written; nginx serves spa.html for it
    data = { url: `/blog/${slug}`, blog: post.data, sidebarBlogs: sidebar?.data ?? [] }
    head = getBlogPostHead(post.data, slug)
  }

  setServerData(data)
  const html = await render(pathname)
  setServerData(null)

  return { ...result(html, head, data), ...(links && { links }) }
}
