import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { SITE_NAME, absoluteUrl } from '../config/seo'

const API_URL = import.meta.env.VITE_BACKEND_URL || 'https://api.rtosarthi.com'

const formatDate = (value) => {
  if (!value) return ''
  const d = new Date(value)
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
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

function removeLink(rel) {
  const el = document.querySelector(`link[rel="${rel}"]`)
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

const getReadingTime = (html) => {
  if (!html) return 1
  const div = document.createElement('div')
  div.innerHTML = html
  const text = div.textContent || ''
  const words = text.trim() ? text.trim().split(/\s+/).length : 0
  return Math.max(1, Math.ceil(words / 200))
}

const BlogPost = () => {
  const { slug } = useParams()
  const [blog, setBlog] = useState(null)
  const [sidebarBlogs, setSidebarBlogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchBlog()
    fetchSidebarBlogs()
    window.scrollTo(0, 0)
  }, [slug])

  const fetchBlog = async () => {
    try {
      setLoading(true)
      setError('')
      const res = await fetch(`${API_URL}/api/blogs/${slug}`)
      const data = await res.json()
      if (data.success) {
        setBlog(data.data)
        const title = data.data.seoTitle || `${data.data.title} - RTO Sarthi`
        const desc = data.data.seoDescription || data.data.excerpt || ''
        document.title = title
        upsertMeta('name', 'description', desc)
        upsertMeta('name', 'keywords', `RTO blog, ${data.data.tags?.join(', ') || ''}, RTO Sarthi, RTO agent software`)
        upsertMeta('property', 'og:title', title)
        upsertMeta('property', 'og:description', desc)
        upsertMeta('property', 'og:url', absoluteUrl(`/blog/${slug}`))
        upsertMeta('property', 'og:type', 'article')
        upsertMeta('property', 'article:published_time', data.data.publishedAt || '')
        if (data.data.tags) {
          data.data.tags.forEach(tag => {
            const el = document.createElement('meta')
            el.setAttribute('property', 'article:tag')
            el.setAttribute('content', tag)
            document.head.appendChild(el)
          })
        }
        if (data.data.coverImage) {
          const img = data.data.coverImage.startsWith('/uploads') ? `${API_URL}${data.data.coverImage}` : data.data.coverImage
          upsertMeta('property', 'og:image', img)
          upsertMeta('name', 'twitter:image', img)
        }
        upsertMeta('name', 'twitter:title', title)
        upsertMeta('name', 'twitter:description', desc)
        upsertMeta('name', 'twitter:card', 'summary_large_image')
        upsertMeta('property', 'og:locale', 'en_IN')
        upsertMeta('property', 'article:modified_time', data.data.updatedAt || '')
        upsertLink('canonical', absoluteUrl(`/blog/${slug}`))
        removeLink('prev')
        removeLink('next')
        upsertJsonLd('breadcrumb', {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: absoluteUrl('/') },
            { '@type': 'ListItem', position: 2, name: 'Blog', item: absoluteUrl('/blog') },
            { '@type': 'ListItem', position: 3, name: data.data.title, item: absoluteUrl(`/blog/${slug}`) },
          ],
        })
        upsertJsonLd('blogposting', {
          '@context': 'https://schema.org',
          '@type': 'BlogPosting',
          headline: data.data.title,
          description: data.data.excerpt || '',
          author: {
            '@type': 'Person',
            name: data.data.author || 'RTO Sarthi',
          },
          datePublished: data.data.publishedAt || '',
          dateModified: data.data.updatedAt || data.data.publishedAt || '',
          image: data.data.coverImage?.startsWith('/uploads') ? `${API_URL}${data.data.coverImage}` : data.data.coverImage,
          publisher: {
            '@type': 'Organization',
            name: SITE_NAME,
          },
          mainEntityOfPage: absoluteUrl(`/blog/${slug}`),
        })
      } else {
        setError('Blog post not found')
      }
    } catch (err) {
      setError('Failed to load blog post')
    } finally {
      setLoading(false)
    }
  }

  const fetchSidebarBlogs = async () => {
    try {
      const res = await fetch(`${API_URL}/api/blogs?page=1&limit=6`)
      const data = await res.json()
      if (data.success) setSidebarBlogs(data.data)
    } catch (err) {
      console.error('Error fetching sidebar blogs:', err)
    }
  }

  if (loading) {
    return (
      <div className='mx-auto px-4 w-full max-w-[95%] sm:max-w-2xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl pt-[calc(3.5rem+1.5rem)] pb-8 sm:pt-[calc(3.75rem+2rem)] lg:pt-[calc(4rem+2rem)]'>
        <div className='animate-pulse space-y-3 sm:space-y-4'>
          <div className='h-5 sm:h-6 md:h-7 lg:h-8 bg-gray-200 rounded w-3/4' />
          <div className='h-3 sm:h-3.5 bg-gray-200 rounded w-1/4' />
          <div className='h-40 sm:h-48 md:h-56 lg:h-64 bg-gray-200 rounded-xl' />
          <div className='space-y-2'>
            <div className='h-3 sm:h-3.5 bg-gray-200 rounded w-full' />
            <div className='h-3 sm:h-3.5 bg-gray-200 rounded w-5/6' />
            <div className='h-3 sm:h-3.5 bg-gray-200 rounded w-4/5' />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className='mx-auto px-4 w-full max-w-[95%] sm:max-w-2xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl pt-[calc(3.5rem+1.5rem)] pb-16 sm:pt-[calc(3.75rem+2rem)] lg:pt-[calc(4rem+2rem)] text-center'>
        <div className='text-4xl sm:text-5xl md:text-6xl mb-3 sm:mb-4'>🔍</div>
        <h1 className='text-xl sm:text-2xl font-bold text-gray-800 mb-2'>Post Not Found</h1>
        <p className='text-sm sm:text-base text-gray-500 mb-5 sm:mb-6'>{error}</p>
        <Link to='/blog' className='inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 text-sm sm:text-base bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-semibold transition-colors'>
          ← Back to Blog
        </Link>
      </div>
    )
  }

  return (
    <div className='mx-auto px-3 sm:px-4 w-full max-w-[95%] sm:max-w-2xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl pt-[calc(3.5rem+1rem)] pb-8 sm:pb-10 md:pb-12 sm:pt-[calc(3.75rem+1rem)] lg:pt-[calc(4rem+0.75rem)]'>
      <Link to='/blog' className='lg:hidden inline-flex items-center gap-1.5 text-xs sm:text-sm text-indigo-600 hover:text-indigo-800 font-semibold mb-2 sm:mb-3 md:mb-4 -ml-0 sm:-ml-1 md:-ml-2 transition-colors'>
        <svg className='w-3.5 h-3.5 sm:w-4 sm:h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 19l-7-7 7-7' />
        </svg>
        Back to Blog
      </Link>

      <div className='lg:flex lg:gap-8 xl:gap-10'>
        <div className='lg:flex-1 lg:max-w-[68%] xl:max-w-[70%]'>
          <article>
            {blog.coverImage && (
              <div className='mb-4 sm:mb-5 md:mb-6 rounded-xl sm:rounded-2xl overflow-hidden shadow-sm max-w-full md:max-w-[75%] lg:max-w-[100%] mx-auto'>
                <img src={blog.coverImage?.startsWith('/uploads') ? `${API_URL}${blog.coverImage}` : blog.coverImage} alt={`${blog.title} - ${SITE_NAME}`} className='w-full h-auto' />
              </div>
            )}

            <div className='flex items-center gap-2 sm:gap-3 text-[8.5px] sm:text-[10px] text-gray-500 mb-1 sm:mb-2'>
              <span className='font-medium text-indigo-600'>Written by {blog.author}</span>
              <span>•</span>
              <time>{formatDate(blog.publishedAt)}</time>
              <span>•</span>
              <span>{getReadingTime(blog.content)} min read</span>
            </div>

            <h1 className='text-lg sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold text-gray-900 mb-2 sm:mb-3 leading-tight'>
              {blog.title}
            </h1>

            {blog.excerpt && (
              <p className='text-sm sm:text-base text-gray-600 mb-4 sm:mb-5 md:mb-6 leading-relaxed'>{blog.excerpt}</p>
            )}

            {blog.tags && blog.tags.length > 0 && (
              <div className='flex flex-wrap gap-1.5 sm:gap-2 mb-4 sm:mb-5 md:mb-6'>
                {blog.tags.map((tag) => (
                  <span key={tag} className='px-2 sm:px-3 py-0.5 sm:py-1 bg-indigo-50 text-indigo-600 text-[10px] sm:text-xs font-semibold rounded-full'>
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div
              className='blog-content text-gray-800 leading-relaxed text-sm sm:text-sm md:text-base [&_h2]:text-base sm:[&_h2]:text-lg md:[&_h2]:text-xl lg:[&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-gray-900 [&_h2]:mt-5 sm:[&_h2]:mt-6 md:[&_h2]:mt-8 [&_h2]:mb-2 sm:[&_h2]:mb-3 [&_h3]:text-sm sm:[&_h3]:text-base md:[&_h3]:text-lg lg:[&_h3]:text-xl [&_h3]:font-bold [&_h3]:text-gray-900 [&_h3]:mt-4 sm:[&_h3]:mt-5 md:[&_h3]:mt-6 [&_h3]:mb-1.5 sm:[&_h3]:mb-2 [&_p]:mb-2 sm:[&_p]:mb-3 [&_p]:leading-relaxed [&_a]:text-indigo-600 [&_a]:font-medium hover:[&_a]:underline [&_ul]:list-disc [&_ul]:pl-4 sm:[&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-4 sm:[&_ol]:pl-6 [&_li]:mb-1 [&_img]:rounded-lg sm:[&_img]:rounded-xl [&_img]:w-full [&_blockquote]:border-l-3 sm:[&_blockquote]:border-l-4 [&_blockquote]:border-indigo-300 [&_blockquote]:pl-3 sm:[&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-gray-600 [&_blockquote]:text-sm sm:[&_blockquote]:text-sm [&_pre]:bg-gray-900 [&_pre]:text-gray-100 [&_pre]:p-3 sm:[&_pre]:p-4 [&_pre]:rounded-lg sm:[&_pre]:rounded-xl [&_pre]:overflow-x-auto [&_pre]:text-xs sm:[&_pre]:text-xs [&_code]:bg-gray-100 [&_code]:px-1 sm:[&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs sm:[&_code]:text-xs [&_pre_code]:bg-transparent [&_pre_code]:p-0'
              dangerouslySetInnerHTML={{ __html: blog.content }}
            />
          </article>
        </div>

        <aside className='hidden lg:block lg:w-[32%] xl:w-[30%] lg:sticky lg:top-[calc(4rem+1.5rem)] lg:self-start'>
          <div className='bg-white rounded-xl border border-gray-200 p-4 xl:p-5'>
            <h3 className='text-sm xl:text-base font-bold text-gray-900 mb-3 xl:mb-4 pb-2 xl:pb-3 border-b border-gray-200'>
              Latest Blogs
            </h3>
            {sidebarBlogs.length > 0 ? (
              <ul className='space-y-2.5 xl:space-y-3'>
                {sidebarBlogs.filter(b => b._id !== blog._id).slice(0, 5).map(b => (
                  <li key={b._id}>
                    <Link to={`/blog/${b.slug}`} className='group block'>
                      <div className='flex gap-2.5 xl:gap-3'>
                        {b.coverImage && (
                          <div className='w-14 h-14 xl:w-16 xl:h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100'>
                            <img src={b.coverImage?.startsWith('/uploads') ? `${API_URL}${b.coverImage}` : b.coverImage} alt={b.title} loading='lazy' className='w-full h-full object-cover' />
                          </div>
                        )}
                        <div className='flex-1 min-w-0'>
                          <p className='text-[11px] xl:text-xs font-semibold text-gray-800 group-hover:text-indigo-600 leading-snug transition-colors line-clamp-2'>
                            {b.title}
                          </p>
                          <p className='text-[9px] xl:text-[10px] text-gray-500 mt-0.5'>{formatDate(b.publishedAt)}</p>
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className='text-[11px] xl:text-xs text-gray-400'>No blogs found.</p>
            )}
            <div className='mt-3 xl:mt-4 pt-2 xl:pt-3 border-t border-gray-100'>
              <Link to='/blog' className='text-[11px] xl:text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors'>
                View all blogs →
              </Link>
            </div>
          </div>
        </aside>
      </div>

      {sidebarBlogs.filter(b => b._id !== blog._id).length > 0 && (
        <div className='mt-8 sm:mt-10 md:mt-12 pt-5 sm:pt-6 md:pt-8 border-t border-gray-200'>
          <h2 className='text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-5'>Related Blogs</h2>
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5'>
            {sidebarBlogs.filter(b => b._id !== blog._id).slice(0, 3).map(b => (
              <Link key={b._id} to={`/blog/${b.slug}`} className='group bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-300'>
                {b.coverImage && (
                  <div className='h-36 sm:h-40 bg-gray-100 overflow-hidden'>
                    <img src={b.coverImage?.startsWith('/uploads') ? `${API_URL}${b.coverImage}` : b.coverImage} alt={b.title} loading='lazy' className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-500' />
                  </div>
                )}
                <div className='p-3 sm:p-4'>
                  <p className='text-xs sm:text-sm font-semibold text-gray-800 group-hover:text-indigo-600 leading-snug transition-colors line-clamp-2'>{b.title}</p>
                  <p className='text-[10px] sm:text-xs text-gray-500 mt-1'>{formatDate(b.publishedAt)}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className='mt-6 sm:mt-8 pt-4 sm:pt-5 border-t border-gray-200 text-center'>
        <Link to='/blog' className='inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 text-sm sm:text-base bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-semibold transition-colors'>
          ← Back to Blog
        </Link>
      </div>
    </div>
  )
}

export default BlogPost
