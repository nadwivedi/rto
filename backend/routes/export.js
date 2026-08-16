const express = require('express')
const router = express.Router()
const exportController = require('../controllers/exportController')
const adminAuthMiddleware = require('../middleware/adminAuth')
const fs = require('fs')
const path = require('path')
const archiver = require('archiver')

const WHATSAPP_LOGS_DIR = path.join(__dirname, '../logs/whatsapp')

router.use(adminAuthMiddleware)

// Get export statistics
router.get('/statistics', exportController.getExportStatistics)

// Export all data combined in one zip file
router.get('/all-combined', exportController.exportAllDataCombined)

// Export all data organized by user in separate folders
router.get('/all-user-wise', exportController.exportAllDataUserWise)

// List available WhatsApp system log files (admin only)
router.get('/whatsapp-log/list', (req, res) => {
  try {
    if (!fs.existsSync(WHATSAPP_LOGS_DIR)) {
      return res.json({ success: true, data: [] })
    }

    const files = fs.readdirSync(WHATSAPP_LOGS_DIR)
      .filter((name) => /^whatsapp-\d{4}-\d{2}-\d{2}\.log$/.test(name))
      .map((name) => {
        const stat = fs.statSync(path.join(WHATSAPP_LOGS_DIR, name))
        const dateMatch = name.match(/^whatsapp-(\d{4}-\d{2}-\d{2})\.log$/)
        return {
          date: dateMatch ? dateMatch[1] : null,
          fileName: name,
          sizeBytes: stat.size,
          lastModified: stat.mtime
        }
      })
      .sort((a, b) => (a.date < b.date ? 1 : -1))

    res.json({ success: true, data: files })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Download all WhatsApp system log files as a single ZIP (admin only)
router.get('/whatsapp-log/all', (req, res) => {
  try {
    if (!fs.existsSync(WHATSAPP_LOGS_DIR)) {
      return res.status(404).json({ message: 'No WhatsApp log files found' })
    }

    const files = fs.readdirSync(WHATSAPP_LOGS_DIR)
      .filter((name) => /^whatsapp-\d{4}-\d{2}-\d{2}\.log$/.test(name))
      .sort()

    if (files.length === 0) {
      return res.status(404).json({ message: 'No WhatsApp log files found' })
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
    res.setHeader('Content-Type', 'application/zip')
    res.setHeader('Content-Disposition', `attachment; filename=whatsapp-logs-all-${timestamp}.zip`)

    const archive = archiver('zip', { zlib: { level: 9 } })
    archive.on('error', (err) => {
      console.error('WhatsApp logs archive error:', err)
      res.status(500).json({ message: err.message })
    })

    archive.pipe(res)

    for (const name of files) {
      archive.file(path.join(WHATSAPP_LOGS_DIR, name), { name })
    }

    archive.finalize()
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Download WhatsApp system log file (admin only)
router.get('/whatsapp-log', async (req, res) => {
  try {
    const targetDate = req.query.date // optional YYYY-MM-DD
    let fileName
    if (targetDate && /^\d{4}-\d{2}-\d{2}$/.test(targetDate)) {
      fileName = `whatsapp-${targetDate}.log`
    } else {
      const now = new Date(new Date().getTime() + 5.5 * 60 * 60 * 1000)
      const yyyy = now.getUTCFullYear()
      const mm = String(now.getUTCMonth() + 1).padStart(2, '0')
      const dd = String(now.getUTCDate()).padStart(2, '0')
      fileName = `whatsapp-${yyyy}-${mm}-${dd}.log`
    }

    const filePath = path.join(WHATSAPP_LOGS_DIR, fileName)

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: `No WhatsApp log file found for date (${fileName})` })
    }

    res.setHeader('Content-Type', 'text/plain; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`)
    const fileStream = fs.createReadStream(filePath)
    fileStream.pipe(res)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

module.exports = router
