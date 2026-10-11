import { SITE_NAME, absoluteUrl } from './seo'

export const API_URL = import.meta.env.VITE_BACKEND_URL || 'https://api.rtosarthi.com'

export const blogImageUrl = (src) => (src?.startsWith('/uploads') ? `${API_URL}${src}` : src)

// Fixed time zone so the date is the same in the build output and in every visitor's browser
export const formatDate = (value) => {
  if (!value) return ''
  const d = new Date(value)
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' })
}

export function getBlogPostHead(blog, slug) {
  const url = absoluteUrl(`/blog/${slug}`)
  const title = blog.seoTitle || `${blog.title} - RTO Sarthi`
  const desc = blog.seoDescription || blog.excerpt || ''
  const image = blog.coverImage ? blogImageUrl(blog.coverImage) : absoluteUrl('/rtosarthi.avif')

  const meta = [
    ['name', 'description', desc],
    ['name', 'keywords', `RTO blog, ${blog.tags?.join(', ') || ''}, RTO Sarthi, RTO agent software`],
    ['name', 'robots', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'],
    ['property', 'og:title', title],
    ['property', 'og:description', desc],
    ['property', 'og:url', url],
    ['property', 'og:type', 'article'],
    ['property', 'og:locale', 'en_IN'],
    ['property', 'og:image', image],
    ['property', 'article:published_time', blog.publishedAt || ''],
    ['property', 'article:modified_time', blog.updatedAt || ''],
    ...(blog.tags || []).map((tag) => ['property', 'article:tag', tag]),
    ['name', 'twitter:card', 'summary_large_image'],
    ['name', 'twitter:title', title],
    ['name', 'twitter:description', desc],
    ['name', 'twitter:image', image],
  ].map(([attr, key, content]) => ({ attr, key, content }))

  const jsonLd = [
    {
      id: 'breadcrumb',
      data: {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: absoluteUrl('/') },
          { '@type': 'ListItem', position: 2, name: 'Blog', item: absoluteUrl('/blog') },
          { '@type': 'ListItem', position: 3, name: blog.title, item: url },
        ],
      },
    },
    {
      id: 'blogposting',
      data: {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: blog.title,
        description: blog.excerpt || '',
        author: {
          '@type': 'Person',
          name: blog.author || 'RTO Sarthi',
        },
        datePublished: blog.publishedAt || '',
        dateModified: blog.updatedAt || blog.publishedAt || '',
        image: blogImageUrl(blog.coverImage),
        publisher: {
          '@type': 'Organization',
          name: SITE_NAME,
        },
        mainEntityOfPage: url,
      },
    },
  ]

  return { title, meta, links: [{ rel: 'canonical', href: url }], jsonLd }
}
