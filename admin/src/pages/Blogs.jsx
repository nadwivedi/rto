import { useState, useEffect, useRef, useCallback } from 'react'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://api.rtosarthi.com'

const formatDate = (value) => {
  if (!value) return '-'
  const d = new Date(value)
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

const Skeleton = ({ rows = 3 }) => (
  <div className='p-6 space-y-4'>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className='animate-pulse flex gap-4'>
        <div className='h-4 bg-gray-200 rounded w-3/4'></div>
        <div className='h-4 bg-gray-200 rounded w-1/4'></div>
      </div>
    ))}
  </div>
)

const RichTextEditor = ({ value, onChange }) => {
  const editorRef = useRef(null)
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [linkText, setLinkText] = useState('')
  const [linkRel, setLinkRel] = useState('follow')

  const exec = (command, val = null) => {
    document.execCommand(command, false, val)
    editorRef.current?.focus()
    emitChange()
  }

  const emitChange = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML)
    }
  }

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || ''
    }
  }, [])

  const handleInsertLink = () => {
    if (!linkUrl) return
    const anchor = `<a href="${linkUrl}" target="_blank" rel="${linkRel === 'nofollow' ? 'nofollow noopener noreferrer' : 'noopener noreferrer'}">${linkText || linkUrl}</a>`
    exec('insertHTML', anchor)
    setShowLinkModal(false)
    setLinkUrl('')
    setLinkText('')
    setLinkRel('follow')
  }

  const ToolbarBtn = ({ cmd, val, title, icon }) => (
    <button
      type='button'
      title={title}
      onMouseDown={(e) => { e.preventDefault(); exec(cmd, val) }}
      className='p-1.5 hover:bg-gray-200 rounded text-gray-700 text-sm font-semibold min-w-[28px] flex items-center justify-center'
      dangerouslySetInnerHTML={{ __html: icon }}
    />
  )

  return (
    <div className='border border-gray-300 rounded-lg overflow-hidden'>
      <div className='flex flex-wrap items-center gap-0.5 px-2 py-1.5 bg-gray-50 border-b border-gray-200'>
        <ToolbarBtn cmd='bold' title='Bold' icon='<b>B</b>' />
        <ToolbarBtn cmd='italic' title='Italic' icon='<i>I</i>' />
        <ToolbarBtn cmd='underline' title='Underline' icon='<u>U</u>' />
        <div className='w-px h-5 bg-gray-300 mx-1' />
        <ToolbarBtn cmd='formatBlock' val='h2' title='Heading 2' icon='H2' />
        <ToolbarBtn cmd='formatBlock' val='h3' title='Heading 3' icon='H3' />
        <ToolbarBtn cmd='formatBlock' val='p' title='Paragraph' icon='¶' />
        <div className='w-px h-5 bg-gray-300 mx-1' />
        <ToolbarBtn cmd='insertUnorderedList' title='Bullet list' icon='&#8226;' />
        <ToolbarBtn cmd='insertOrderedList' title='Numbered list' icon='1.' />
        <div className='w-px h-5 bg-gray-300 mx-1' />
        <button
          type='button'
          title='Insert Link'
          onMouseDown={(e) => {
            e.preventDefault()
            const sel = window.getSelection()
            setLinkText(sel ? sel.toString() : '')
            setShowLinkModal(true)
          }}
          className='p-1.5 hover:bg-gray-200 rounded text-gray-700 text-sm min-w-[28px] flex items-center justify-center'
        >
          <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1' />
          </svg>
        </button>
        <ToolbarBtn cmd='unlink' title='Remove Link' icon='✕' />
      </div>

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={emitChange}
        className='min-h-[300px] p-4 text-sm text-gray-800 focus:outline-none prose prose-sm max-w-none'
        data-placeholder='Write your blog content here...'
      />

      {showLinkModal && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/30' onClick={() => setShowLinkModal(false)}>
          <div className='bg-white rounded-xl shadow-xl p-5 w-full max-w-sm mx-3' onClick={(e) => e.stopPropagation()}>
            <h3 className='font-bold text-gray-800 mb-3'>Insert Link</h3>
            <div className='space-y-2.5'>
              <div>
                <label className='text-xs font-semibold text-gray-600'>URL</label>
                <input type='text' value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder='https://...' className='w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent' autoFocus />
              </div>
              <div>
                <label className='text-xs font-semibold text-gray-600'>Link Text</label>
                <input type='text' value={linkText} onChange={(e) => setLinkText(e.target.value)} placeholder='Display text' className='w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent' />
              </div>
              <div>
                <label className='text-xs font-semibold text-gray-600'>Link Type</label>
                <div className='flex gap-2 mt-1'>
                  <label className='flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 text-sm'>
                    <input type='radio' name='linkRel' value='follow' checked={linkRel === 'follow'} onChange={() => setLinkRel('follow')} />
                    Follow
                  </label>
                  <label className='flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 text-sm'>
                    <input type='radio' name='linkRel' value='nofollow' checked={linkRel === 'nofollow'} onChange={() => setLinkRel('nofollow')} />
                    No Follow
                  </label>
                </div>
              </div>
            </div>
            <div className='flex gap-2 mt-4'>
              <button type='button' onClick={() => setShowLinkModal(false)} className='flex-1 px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 cursor-pointer'>Cancel</button>
              <button type='button' onClick={handleInsertLink} className='flex-1 px-3 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold cursor-pointer'>Insert</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const Blogs = () => {
  const [blogs, setBlogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    coverImage: '',
    author: 'Admin',
    tags: '',
    published: false,
    seoTitle: '',
    seoDescription: ''
  })

  const fetchBlogs = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`${BACKEND_URL}/api/admin/blogs`, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      })
      const data = await res.json()
      if (data.success) setBlogs(data.data)
    } catch (err) {
      console.error('Fetch blogs error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchBlogs() }, [fetchBlogs])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!formData.title.trim()) { setError('Title is required'); return }
    if (!formData.content.trim()) { setError('Content is required'); return }

    try {
      const body = {
        ...formData,
        tags: formData.tags ? formData.tags.split(',').map((t) => t.trim()).filter(Boolean) : []
      }
      const url = isEditMode
        ? `${BACKEND_URL}/api/admin/blogs/${editingId}`
        : `${BACKEND_URL}/api/admin/blogs`
      const method = isEditMode ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const data = await res.json()
      if (data.success) {
        setSuccess(isEditMode ? 'Blog updated successfully!' : 'Blog created successfully!')
        setShowModal(false)
        resetForm()
        fetchBlogs()
      } else {
        setError(data.message || 'Failed to save blog')
      }
    } catch (err) {
      setError('Failed to save blog')
    }
  }

  const resetForm = () => {
    setIsEditMode(false)
    setEditingId(null)
    setFormData({ title: '', slug: '', content: '', excerpt: '', coverImage: '', author: 'Admin', tags: '', published: false, seoTitle: '', seoDescription: '' })
  }

  const handleEdit = (blog) => {
    setIsEditMode(true)
    setEditingId(blog._id)
    setFormData({
      title: blog.title,
      slug: blog.slug,
      content: blog.content,
      excerpt: blog.excerpt || '',
      coverImage: blog.coverImage || '',
      author: blog.author || 'Admin',
      tags: (blog.tags || []).join(', '),
      published: blog.published,
      seoTitle: blog.seoTitle || '',
      seoDescription: blog.seoDescription || ''
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this blog post?')) return
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/blogs/${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      })
      const data = await res.json()
      if (data.success || res.ok) {
        setSuccess('Blog deleted successfully!')
        fetchBlogs()
      } else {
        setError('Failed to delete blog')
      }
    } catch (err) {
      setError('Failed to delete blog')
    }
  }

  const truncate = (str, len) => {
    if (!str) return ''
    return str.length > len ? str.substring(0, len) + '...' : str
  }

  return (
    <div>
      <div className='flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6'>
        <div>
          <h1 className='text-2xl sm:text-3xl font-bold text-gray-800'>Manage Blogs</h1>
          <p className='text-sm text-gray-600 mt-1'>Create and manage blog posts for your website</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowModal(true) }}
          className='px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-semibold flex items-center justify-center gap-2 text-sm shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transition-all cursor-pointer'
        >
          <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 4v16m8-8H4' />
          </svg>
          New Blog Post
        </button>
      </div>

      {success && (
        <div className='mb-5 p-4 bg-green-50 border border-green-200 rounded-xl text-green-800 text-sm font-medium flex items-center gap-2'>
          <svg className='w-5 h-5 flex-shrink-0' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' />
          </svg>
          {success}
        </div>
      )}

      <div className='bg-white rounded-xl shadow-sm border border-gray-100'>
        {loading ? (
          <Skeleton rows={6} />
        ) : blogs.length === 0 ? (
          <div className='p-12 text-center'>
            <svg className='w-12 h-12 mx-auto text-gray-300 mb-3' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1.5} d='M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z' />
            </svg>
            <p className='text-gray-500 font-medium'>No blog posts yet</p>
            <p className='text-gray-400 text-sm mt-1'>Click "New Blog Post" to create your first post</p>
          </div>
        ) : (
          <div className='overflow-x-auto'>
            <table className='w-full'>
              <thead>
                <tr className='border-b border-gray-100 bg-gray-50/50'>
                  <th className='px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider'>Title</th>
                  <th className='px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider'>Status</th>
                  <th className='px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider'>Author</th>
                  <th className='px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider'>Published</th>
                  <th className='px-5 py-3.5 text-right text-xs font-bold text-gray-500 uppercase tracking-wider'>Actions</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-gray-50'>
                {blogs.map((blog) => (
                  <tr key={blog._id} className='hover:bg-indigo-50/30 transition-colors'>
                    <td className='px-5 py-3.5'>
                      <div className='text-sm font-semibold text-gray-900'>{truncate(blog.title, 60)}</div>
                      <div className='text-[10px] text-gray-400 font-mono mt-0.5'>/{blog.slug}</div>
                    </td>
                    <td className='px-5 py-3.5'>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                        blog.published
                          ? 'bg-green-50 text-green-700 border border-green-200'
                          : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${blog.published ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                        {blog.published ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className='px-5 py-3.5 text-sm text-gray-700'>{blog.author}</td>
                    <td className='px-5 py-3.5 text-xs text-gray-500'>{blog.publishedAt ? formatDate(blog.publishedAt) : '-'}</td>
                    <td className='px-5 py-3.5'>
                      <div className='flex items-center justify-end gap-1.5'>
                        <button
                          onClick={() => handleEdit(blog)}
                          className='p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer'
                          title='Edit blog'
                        >
                          <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(blog._id)}
                          className='p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer'
                          title='Delete blog'
                        >
                          <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className='fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto' onClick={() => setShowModal(false)}>
          <div className='flex items-start justify-center min-h-full px-2 sm:px-4 py-4 sm:py-8' onClick={(e) => e.stopPropagation()}>
            <div className='bg-white rounded-xl shadow-xl w-full max-w-3xl p-4 sm:p-6'>
              <div className='flex justify-between items-center mb-4'>
                <h2 className='text-lg sm:text-xl font-bold text-gray-800'>
                  {isEditMode ? 'Edit Blog Post' : 'New Blog Post'}
                </h2>
                <button onClick={() => { setShowModal(false); resetForm() }} className='text-gray-500 hover:text-gray-700 p-1 cursor-pointer'>
                  <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                  </svg>
                </button>
              </div>

              {error && (
                <div className='mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-xs sm:text-sm text-red-800'>{error}</div>
              )}

              <form onSubmit={handleSubmit} className='space-y-4'>
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                  <div className='sm:col-span-2'>
                    <label className='block text-sm font-semibold text-gray-700 mb-1'>Title <span className='text-red-500'>*</span></label>
                    <input type='text' name='title' value={formData.title} onChange={handleChange} placeholder='Enter blog title' className='w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent' required />
                  </div>
                  <div>
                    <label className='block text-sm font-semibold text-gray-700 mb-1'>Slug <span className='text-gray-400'>(Auto-generated)</span></label>
                    <input type='text' name='slug' value={formData.slug} onChange={handleChange} placeholder='leave blank to auto-generate' className='w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent' />
                  </div>
                  <div>
                    <label className='block text-sm font-semibold text-gray-700 mb-1'>Author</label>
                    <input type='text' name='author' value={formData.author} onChange={handleChange} placeholder='Admin' className='w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent' />
                  </div>
                  <div className='sm:col-span-2'>
                    <label className='block text-sm font-semibold text-gray-700 mb-1'>Excerpt <span className='text-gray-400'>(Short summary)</span></label>
                    <textarea name='excerpt' value={formData.excerpt} onChange={handleChange} placeholder='Brief summary of the blog post...' rows={2} className='w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none' />
                  </div>
                  <div className='sm:col-span-2'>
                    <label className='block text-sm font-semibold text-gray-700 mb-1'>Cover Image URL</label>
                    <input type='text' name='coverImage' value={formData.coverImage} onChange={handleChange} placeholder='https://example.com/image.jpg' className='w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent' />
                  </div>
                  <div>
                    <label className='block text-sm font-semibold text-gray-700 mb-1'>Tags <span className='text-gray-400'>(Comma separated)</span></label>
                    <input type='text' name='tags' value={formData.tags} onChange={handleChange} placeholder='e.g. RTO, vehicle, license' className='w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent' />
                  </div>
                  <div className='flex items-end pb-2'>
                    <label className='flex items-center gap-2 cursor-pointer'>
                      <input type='checkbox' name='published' checked={formData.published} onChange={handleChange} className='w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500' />
                      <span className='text-sm font-semibold text-gray-700'>Published</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className='block text-sm font-semibold text-gray-700 mb-1'>Content <span className='text-red-500'>*</span></label>
                  <RichTextEditor value={formData.content} onChange={(html) => setFormData((prev) => ({ ...prev, content: html }))} />
                </div>

                <div className='border-t border-gray-200 pt-4'>
                  <h3 className='text-sm font-bold text-gray-700 mb-3'>SEO Settings</h3>
                  <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                    <div>
                      <label className='block text-sm font-semibold text-gray-700 mb-1'>SEO Title</label>
                      <input type='text' name='seoTitle' value={formData.seoTitle} onChange={handleChange} placeholder='Meta title' className='w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent' />
                    </div>
                    <div>
                      <label className='block text-sm font-semibold text-gray-700 mb-1'>SEO Description</label>
                      <input type='text' name='seoDescription' value={formData.seoDescription} onChange={handleChange} placeholder='Meta description' className='w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent' />
                    </div>
                  </div>
                </div>

                <div className='flex gap-3 pt-2'>
                  <button type='button' onClick={() => { setShowModal(false); resetForm() }} className='flex-1 px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 cursor-pointer'>Cancel</button>
                  <button type='submit' className='flex-1 px-3 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold cursor-pointer'>
                    {isEditMode ? 'Update Blog' : 'Create Blog'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Blogs
