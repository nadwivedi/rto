const Blog = require('../models/Blog')
const fs = require('fs')
const path = require('path')

const blogUploadsDir = path.join(__dirname, '..', 'uploads', 'blog-images')
if (!fs.existsSync(blogUploadsDir)) {
  fs.mkdirSync(blogUploadsDir, { recursive: true })
}

const generateSlug = (title) => {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 100)
}

const makeUniqueSlug = async (slug, excludeId) => {
  let uniqueSlug = slug
  let counter = 1
  const query = excludeId ? { slug: uniqueSlug, _id: { $ne: excludeId } } : { slug: uniqueSlug }
  while (await Blog.findOne(query)) {
    uniqueSlug = `${slug}-${counter}`
    counter++
    query.slug = uniqueSlug
  }
  return uniqueSlug
}

exports.getAll = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, published } = req.query
    const query = {}
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { excerpt: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } }
      ]
    }
    if (published !== undefined) {
      query.published = published === 'true'
    }

    const pageNum = parseInt(page, 10)
    const limitNum = parseInt(limit, 10)
    const skip = (pageNum - 1) * limitNum
    const totalRecords = await Blog.countDocuments(query)
    const totalPages = Math.ceil(totalRecords / limitNum)

    const blogs = await Blog.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)

    res.json({
      success: true,
      count: blogs.length,
      data: blogs,
      pagination: { currentPage: pageNum, totalPages, totalRecords, limit: limitNum }
    })
  } catch (error) {
    console.error('Get blogs error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

exports.getById = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id)
    if (!blog) {
      return res.status(404).json({ success: false, message: 'Blog not found' })
    }
    res.json({ success: true, data: blog })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

exports.getBySlug = async (req, res) => {
  try {
    const blog = await Blog.findOne({ slug: req.params.slug, published: true })
    if (!blog) {
      return res.status(404).json({ success: false, message: 'Blog not found' })
    }
    res.json({ success: true, data: blog })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

exports.create = async (req, res) => {
  try {
    const { title, content, excerpt, coverImage, author, tags, published, seoTitle, seoDescription } = req.body

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Title is required' })
    }
    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Content is required' })
    }

    let slug = req.body.slug || generateSlug(title)
    slug = await makeUniqueSlug(slug)

    const blogData = {
      title: title.trim(),
      slug,
      content,
      excerpt: excerpt ? excerpt.trim() : '',
      coverImage: coverImage || '',
      author: author || 'Admin',
      tags: tags || [],
      published: published || false,
      publishedAt: published ? new Date() : null,
      seoTitle: seoTitle || title.trim(),
      seoDescription: seoDescription || excerpt ? excerpt.trim() : '',
      createdBy: req.admin?.id
    }

    const blog = await Blog.create(blogData)
    res.status(201).json({ success: true, message: 'Blog created successfully', data: blog })
  } catch (error) {
    console.error('Create blog error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

exports.uploadImage = async (req, res) => {
  try {
    const { image } = req.body
    if (!image) {
      return res.status(400).json({ success: false, message: 'Image data is required' })
    }

    const matches = image.match(/^data:image\/(\w+);base64,(.+)$/)
    if (!matches) {
      return res.status(400).json({ success: false, message: 'Invalid image format. Use base64 data URI.' })
    }

    const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1]
    const data = Buffer.from(matches[2], 'base64')
    const filename = `blog-${Date.now()}-${Math.round(Math.random() * 1e9)}.${ext}`
    const filePath = path.join(blogUploadsDir, filename)

    fs.writeFileSync(filePath, data)

    const url = `/uploads/blog-images/${filename}`

    res.json({ success: true, message: 'Image uploaded successfully', data: { url } })
  } catch (error) {
    console.error('Upload image error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

exports.update = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id)
    if (!blog) {
      return res.status(404).json({ success: false, message: 'Blog not found' })
    }

    const { title, content, excerpt, coverImage, author, tags, published, seoTitle, seoDescription } = req.body

    if (title !== undefined) {
      if (!title.trim()) {
        return res.status(400).json({ success: false, message: 'Title cannot be empty' })
      }
      blog.title = title.trim()
      if (req.body.slug) {
        blog.slug = await makeUniqueSlug(req.body.slug, blog._id)
      } else if (title.trim() !== blog.title.split(' ').join('-').toLowerCase()) {
        const newSlug = generateSlug(title)
        blog.slug = await makeUniqueSlug(newSlug, blog._id)
      }
    }
    if (content !== undefined) blog.content = content
    if (excerpt !== undefined) blog.excerpt = excerpt.trim()
    if (coverImage !== undefined) blog.coverImage = coverImage
    if (author !== undefined) blog.author = author
    if (tags !== undefined) blog.tags = tags
    if (published !== undefined) {
      blog.published = published
      if (published && !blog.publishedAt) {
        blog.publishedAt = new Date()
      }
    }
    if (seoTitle !== undefined) blog.seoTitle = seoTitle
    if (seoDescription !== undefined) blog.seoDescription = seoDescription

    await blog.save()
    res.json({ success: true, message: 'Blog updated successfully', data: blog })
  } catch (error) {
    console.error('Update blog error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

exports.delete = async (req, res) => {
  try {
    const blog = await Blog.findByIdAndDelete(req.params.id)
    if (!blog) {
      return res.status(404).json({ success: false, message: 'Blog not found' })
    }
    res.json({ success: true, message: 'Blog deleted successfully' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

exports.getPublicBlogs = async (req, res) => {
  try {
    const { page = 1, limit = 12, tag } = req.query
    const query = { published: true }
    if (tag) {
      query.tags = { $regex: tag, $options: 'i' }
    }

    const pageNum = parseInt(page, 10)
    const limitNum = parseInt(limit, 10)
    const skip = (pageNum - 1) * limitNum
    const totalRecords = await Blog.countDocuments(query)
    const totalPages = Math.ceil(totalRecords / limitNum)

    const blogs = await Blog.find(query)
      .select('title slug excerpt coverImage author tags publishedAt updatedAt')
      .sort({ publishedAt: -1 })
      .skip(skip)
      .limit(limitNum)

    res.json({
      success: true,
      count: blogs.length,
      data: blogs,
      pagination: { currentPage: pageNum, totalPages, totalRecords, limit: limitNum }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

exports.getPublicBlogBySlug = async (req, res) => {
  try {
    const blog = await Blog.findOne({ slug: req.params.slug, published: true })
    if (!blog) {
      return res.status(404).json({ success: false, message: 'Blog not found' })
    }
    res.json({ success: true, data: blog })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}
