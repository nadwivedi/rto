const Bookmark = require('../models/Bookmark')
const { logError, getUserFriendlyError } = require('../utils/errorLogger')

const DEFAULT_BOOKMARKS = [
  { name: 'BG Remover', url: 'https://www.photoroom.com/tools/background-remover' },
  { name: 'Image to PDF', url: 'https://www.ilovepdf.com/jpg_to_pdf' },
  { name: 'ChatGPT', url: 'https://chatgpt.com/' },
  { name: 'Parivahan', url: 'https://parivahan.gov.in/' },
  { name: 'WhatsApp', url: 'https://web.whatsapp.com/' }
]

exports.getAll = async (req, res) => {
  try {
    let bookmarks = await Bookmark.find({ userId: req.user.id }).sort({ createdAt: -1 })

    if (bookmarks.length === 0) {
      const defaultBms = DEFAULT_BOOKMARKS.map(b => ({ userId: req.user.id, name: b.name, url: b.url }))
      bookmarks = await Bookmark.insertMany(defaultBms)
      bookmarks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    }

    res.status(200).json({
      success: true,
      data: bookmarks
    })
  } catch (error) {
    logError(error, req)
    const userError = getUserFriendlyError(error)
    res.status(500).json({
      success: false,
      message: userError.message
    })
  }
}

exports.create = async (req, res) => {
  try {
    const { name, url } = req.body

    if (!name || !url) {
      return res.status(400).json({
        success: false,
        message: 'Name and URL are required'
      })
    }

    const bookmark = new Bookmark({ userId: req.user.id, name, url })
    await bookmark.save()

    res.status(201).json({
      success: true,
      message: 'Bookmark created successfully',
      data: bookmark
    })
  } catch (error) {
    logError(error, req)
    const userError = getUserFriendlyError(error)
    res.status(500).json({
      success: false,
      message: userError.message
    })
  }
}

exports.remove = async (req, res) => {
  try {
    const bookmark = await Bookmark.findOneAndDelete({ _id: req.params.id, userId: req.user.id })

    if (!bookmark) {
      return res.status(404).json({
        success: false,
        message: 'Bookmark not found'
      })
    }

    res.status(200).json({
      success: true,
      message: 'Bookmark deleted successfully'
    })
  } catch (error) {
    logError(error, req)
    const userError = getUserFriendlyError(error)
    res.status(500).json({
      success: false,
      message: userError.message
    })
  }
}
