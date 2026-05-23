import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const API_URL = import.meta.env.VITE_BACKEND_URL || 'https://api.rtosarthi.com'

const formatDate = (value) => {
  if (!value) return ''
  const d = new Date(value)
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
}

const Blog = () => {
  const [blogs, setBlogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    fetchBlogs()
  }, [page])

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
    if (!str) return ''
    const div = document.createElement('div')
    div.innerHTML = str
    const text = div.textContent || div.innerText || ''
    return text.length > len ? text.substring(0, len) + '...' : text
  }

  return (
    <div className='max-w-6xl mx-auto px-4 pt-[calc(3.5rem+1.5rem)] pb-10 sm:pt-[calc(3.75rem+2rem)] lg:pt-[calc(4rem+2rem)]'>
      <div className='text-center mb-12'>
        <h1 className='text-4xl font-bold text-gray-900 mb-3'>Our Blog</h1>
        <p className='text-lg text-gray-600 max-w-2xl mx-auto'>
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
                <div className='h-48 bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center overflow-hidden'>
                  {blog.coverImage ? (
                    <img src={blog.coverImage} alt={blog.title} className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-500' />
                  ) : (
                    <svg className='w-16 h-16 text-indigo-300' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1.5} d='M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z' />
                    </svg>
                  )}
                </div>
                <div className='p-5'>
                  <div className='flex items-center gap-3 text-xs text-gray-500 mb-2'>
                    <span>{blog.author}</span>
                    <span>•</span>
                    <span>{formatDate(blog.publishedAt)}</span>
                  </div>
                  <h2 className='text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors mb-2 line-clamp-2'>
                    {blog.title}
                  </h2>
                  <p className='text-sm text-gray-600 line-clamp-3'>
                    {blog.excerpt || truncate(blog.content, 120)}
                  </p>
                  {blog.tags && blog.tags.length > 0 && (
                    <div className='flex flex-wrap gap-1.5 mt-3'>
                      {blog.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className='px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-semibold rounded-full'>
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
                className='px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer'
              >
                Previous
              </button>
              <span className='text-sm text-gray-600'>
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className='px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer'
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
