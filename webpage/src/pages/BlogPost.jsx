import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'

const API_URL = import.meta.env.VITE_BACKEND_URL || 'https://api.rtosarthi.com'

const formatDate = (value) => {
  if (!value) return ''
  const d = new Date(value)
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
}

const BlogPost = () => {
  const { slug } = useParams()
  const [blog, setBlog] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchBlog()
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
        document.title = data.data.seoTitle || data.data.title + ' - RTO Sarthi'
        const metaDesc = document.querySelector('meta[name="description"]')
        if (metaDesc) metaDesc.content = data.data.seoDescription || data.data.excerpt || ''
      } else {
        setError('Blog post not found')
      }
    } catch (err) {
      setError('Failed to load blog post')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
    <div className='max-w-3xl mx-auto px-4 pt-[calc(3.5rem+1.5rem)] pb-10 sm:pt-[calc(3.75rem+2rem)] lg:pt-[calc(4rem+2rem)]'>
        <div className='animate-pulse space-y-4'>
          <div className='h-8 bg-gray-200 rounded w-3/4' />
          <div className='h-4 bg-gray-200 rounded w-1/4' />
          <div className='h-64 bg-gray-200 rounded' />
          <div className='space-y-2'>
            <div className='h-4 bg-gray-200 rounded w-full' />
            <div className='h-4 bg-gray-200 rounded w-5/6' />
            <div className='h-4 bg-gray-200 rounded w-4/5' />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className='max-w-3xl mx-auto px-4 pt-[calc(3.5rem+1.5rem)] pb-20 sm:pt-[calc(3.75rem+2rem)] lg:pt-[calc(4rem+2rem)] text-center'>
        <div className='text-6xl mb-4'>🔍</div>
        <h1 className='text-2xl font-bold text-gray-800 mb-2'>Post Not Found</h1>
        <p className='text-gray-500 mb-6'>{error}</p>
        <Link to='/blog' className='inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-semibold transition-colors'>
          ← Back to Blog
        </Link>
      </div>
    )
  }

  return (
    <div className='max-w-3xl mx-auto px-4 pt-[calc(3.5rem+1.5rem)] pb-10 sm:pt-[calc(3.75rem+2rem)] lg:pt-[calc(4rem+2rem)]'>
      <Link to='/blog' className='inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 font-semibold mb-6 transition-colors'>
        <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 19l-7-7 7-7' />
        </svg>
        Back to Blog
      </Link>

      <article>
        <div className='flex items-center gap-3 text-sm text-gray-500 mb-3'>
          <span className='font-medium text-indigo-600'>{blog.author}</span>
          <span>•</span>
          <time>{formatDate(blog.publishedAt)}</time>
        </div>

        <h1 className='text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight'>
          {blog.title}
        </h1>

        {blog.excerpt && (
          <p className='text-lg text-gray-600 mb-6 leading-relaxed'>{blog.excerpt}</p>
        )}

        {blog.coverImage && (
          <div className='mb-8 rounded-2xl overflow-hidden shadow-sm'>
            <img src={blog.coverImage} alt={blog.title} className='w-full h-auto' />
          </div>
        )}

        {blog.tags && blog.tags.length > 0 && (
          <div className='flex flex-wrap gap-2 mb-6'>
            {blog.tags.map((tag) => (
              <span key={tag} className='px-3 py-1 bg-indigo-50 text-indigo-600 text-xs font-semibold rounded-full'>
                {tag}
              </span>
            ))}
          </div>
        )}

        <div
          className='blog-content text-gray-800 leading-relaxed text-base space-y-4 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-gray-900 [&_h2]:mt-8 [&_h3]:text-xl [&_h3]:font-bold [&_h3]:text-gray-900 [&_h3]:mt-6 [&_p]:leading-relaxed [&_a]:text-indigo-600 [&_a]:font-medium hover:[&_a]:underline [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:mb-1 [&_img]:rounded-xl [&_img]:w-full [&_blockquote]:border-l-4 [&_blockquote]:border-indigo-300 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-gray-600 [&_pre]:bg-gray-900 [&_pre]:text-gray-100 [&_pre]:p-4 [&_pre]:rounded-xl [&_pre]:overflow-x-auto [&_code]:bg-gray-100 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm [&_pre_code]:bg-transparent [&_pre_code]:p-0'
          dangerouslySetInnerHTML={{ __html: blog.content }}
        />
      </article>

      <div className='mt-12 pt-8 border-t border-gray-200 text-center'>
        <Link to='/blog' className='inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-semibold transition-colors'>
          ← Back to Blog
        </Link>
      </div>
    </div>
  )
}

export default BlogPost
