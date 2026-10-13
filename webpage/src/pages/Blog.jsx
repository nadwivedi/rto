import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { SITE_NAME, absoluteUrl } from '../config/seo'
import { API_URL, blogImageUrl, formatDate } from '../config/blog'
import { htmlToText, removeLink, upsertLink, upsertMeta } from '../lib/head'
import { getInitialData } from '../lib/initialData'

const PAGE_DESC = 'Read the latest blogs on RTO agent software, PUC center management, vehicle registration tips, insurance renewal guides, and WhatsApp alert strategies. Stay updated with RTO Sarthi.'

const Blog = () => {
  // Prerendered with the first page of posts (see src/prerender.jsx)
  const initial = getInitialData('/blog')
  const [blogs, setBlogs] = useState(initial?.blogs ?? [])
  const [loading, setLoading] = useState(!initial)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(initial?.totalPages ?? 1)
  const skipFirstFetch = useRef(!!initial)

  useEffect(() => {
    if (skipFirstFetch.current) {
      skipFirstFetch.current = false
      return
    }
    fetchBlogs()
  }, [page])

  useEffect(() => {
    const baseTitle = 'Blog - RTO Agent Software Tips & Guides | RTO Sarthi'
    const title = page > 1 ? `${baseTitle} - Page ${page}` : baseTitle
    document.title = title
    upsertMeta('name', 'description', PAGE_DESC)
    upsertMeta('property', 'og:title', title)
    upsertMeta('property', 'og:description', PAGE_DESC)
    upsertMeta('property', 'og:url', absoluteUrl('/blog'))
    upsertMeta('property', 'og:type', 'website')
    upsertMeta('property', 'og:locale', 'en_IN')
    upsertMeta('property', 'og:site_name', SITE_NAME)
    upsertMeta('name', 'twitter:title', title)
    upsertMeta('name', 'twitter:description', PAGE_DESC)
    upsertMeta('name', 'twitter:card', 'summary_large_image')
    upsertLink('canonical', absoluteUrl('/blog'))
    if (page > 1) upsertLink('prev', absoluteUrl(`/blog?page=${page - 1}`))
    else removeLink('prev')
    if (page < totalPages) upsertLink('next', absoluteUrl(`/blog?page=${page + 1}`))
    else removeLink('next')
  }, [page, totalPages])

  const fetchBlogs = async () => {
    try {
      setLoading(true)
      const res = await fetch(`${API_URL}/api/blogs?page=${page}&limit=12`)
      const data = await res.json()
      if (data.success) {
        setBlogs(data.data)
        setTotalPages(data.pagination.totalPages)
      }
    } catch (err) {
      console.error('Error fetching blogs:', err)
    } finally {
      setLoading(false)
    }
  }

  const truncate = (str, len) => {
    const text = htmlToText(str)
    return text.length > len ? text.substring(0, len) + '...' : text
  }

  return (
    <div className='max-w-6xl mx-auto px-4 pt-[calc(3.5rem+1.5rem)] pb-10 sm:pt-[calc(3.75rem+2rem)] lg:pt-[calc(4rem+2rem)]'>
      <div className='text-center mb-10'>
        <h1 className='font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-3'>Our Blog</h1>
        <p className='text-base sm:text-base lg:text-lg text-gray-600 max-w-2xl mx-auto'>
          Stay updated with the latest news, guides, and insights about RTO services, vehicle registration, and more.
        </p>
      </div>

      {loading ? (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className='animate-pulse bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden'>
              <div className='h-48 bg-gray-200' />
              <div className='p-5 space-y-3'>
                <div className='h-4 bg-gray-200 rounded w-1/4' />
                <div className='h-5 bg-gray-200 rounded w-3/4' />
                <div className='h-4 bg-gray-200 rounded w-full' />
              </div>
            </div>
          ))}
        </div>
      ) : blogs.length === 0 ? (
        <div className='text-center py-16'>
          <div className='text-6xl mb-4'>📝</div>
          <h2 className='text-2xl font-bold text-gray-800 mb-2'>No blogs yet</h2>
          <p className='text-gray-500'>Check back soon for new articles!</p>
        </div>
      ) : (
        <>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {blogs.map((blog) => (
              <Link
                key={blog._id}
                to={`/blog/${blog.slug}`}
                className='group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300'
              >
                <div className='h-48 bg-gradient-to-br from-brand-100 to-accent-50 flex items-center justify-center overflow-hidden'>
                  {blog.coverImage ? (
                    <img src={blogImageUrl(blog.coverImage)} alt={`${blog.title} - RTO Sarthi`} loading='lazy' className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-500' />
                  ) : (
                    <svg className='w-16 h-16 text-brand-200' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1.5} d='M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z' />
                    </svg>
                  )}
                </div>
                <div className='p-5'>
                  <div className='flex items-center gap-3 text-sm text-gray-500 mb-2'>
                    <span>{blog.author}</span>
                    <span>•</span>
                    <span>{formatDate(blog.publishedAt)}</span>
                  </div>
                  <h2 className='font-display text-lg font-semibold leading-snug text-gray-900 group-hover:text-brand-700 transition-colors mb-2 line-clamp-2'>
                    {blog.title}
                  </h2>
                  <p className='text-base text-gray-600 line-clamp-3'>
                    {blog.excerpt || truncate(blog.content, 120)}
                  </p>
                  {blog.tags && blog.tags.length > 0 && (
                    <div className='flex flex-wrap gap-1.5 mt-3'>
                      {blog.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className='px-2 py-0.5 bg-brand-50 text-brand-700 text-xs font-semibold rounded-full'>
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>

          {totalPages > 1 && (
            <div className='flex justify-center items-center gap-3 mt-10'>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className='px-4 py-2 text-base border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer'
              >
                Previous
              </button>
              <span className='text-base text-gray-600'>
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className='px-4 py-2 text-base border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer'
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default Blog
