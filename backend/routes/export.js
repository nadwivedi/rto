const express = require('express')
const router = express.Router()
const exportController = require('../controllers/exportController')
const adminAuthMiddleware = require('../middleware/adminAuth')
const fs = require('fs')
const path = require('path')

router.use(adminAuthMiddleware)

// Get export statistics
router.get('/statistics', exportController.getExportStatistics)

// Export all data combined in one zip file
router.get('/all-combined', exportController.exportAllDataCombined)

// Export all data organized by user in separate folders
router.get('/all-user-wise', exportController.exportAllDataUserWise)

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

    const filePath = path.join(__dirname, '../logs/whatsapp', fileName)

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
