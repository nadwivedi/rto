const express = require('express')
const router = express.Router()
const whatsappService = require('../services/whatsappService')
const MessageLog = require('../models/MessageLog')
const { istBoundaries } = require('../jobs/whatsappMessageSender')

// GET current WA status. The WhatsApp page passes ?watch=1 — that keeps a pending QR alive;
// other pages (dashboard badge) only read the status.
router.get('/status', async (req, res) => {
  try {
    const userId = req.user.id
    const status = await whatsappService.getStatus(userId, { watching: req.query.watch === '1' })
    const pendingCount = await MessageLog.countDocuments({ userId, status: 'pending' })
    res.json({ ...status, pendingCount })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// POST Connect / resume. Uses the saved login if there is one, otherwise shows a QR code.
const connect = async (req, res) => {
  try {
    await whatsappService.connect(req.user.id)
    res.json({ message: 'Connecting to WhatsApp...' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
router.post('/connect', connect)
router.post('/start', connect)

// POST Stop: pause sending and close the browser. The login stays saved.
router.post('/stop', async (req, res) => {
  try {
    await whatsappService.stop(req.user.id)
    res.json({ message: 'WhatsApp paused. Click Connect to resume.' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// POST Cancel an in-progress connection / QR scan.
router.post('/cancel', async (req, res) => {
  try {
    await whatsappService.cancel(req.user.id)
    res.json({ message: 'Connection cancelled.' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// POST Logout: unlink the device and delete the saved login (a QR scan is needed afterwards).
router.post('/logout', async (req, res) => {
  try {
    await whatsappService.logout(req.user.id)
    res.json({ message: 'Logged out. Scan the QR code to connect again.' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// POST Restart the browser and show a fresh QR code.
router.post('/renew-qr', async (req, res) => {
  try {
    await whatsappService.renewQr(req.user.id)
    res.json({ message: 'Getting a new QR code...' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// POST Start the session in the background from the saved login (never shows a QR).
router.post('/auto-reconnect', async (req, res) => {
  try {
    await whatsappService.ensureRunning(req.user.id, 'auto-reconnect')
    res.json({ message: 'OK', ...(await whatsappService.getStatus(req.user.id)) })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// POST Send a single message right away
router.post('/send', async (req, res) => {
  try {
    const { chatId, text } = req.body
    if (!chatId || !text) {
      return res.status(400).json({ message: 'Please provide chatId/targetNumber and text payload' })
    }
    const result = await whatsappService.sendWhatsAppMessage(req.user.id, chatId, text)
    res.json({ message: 'Message sent', result })
  } catch (error) {
    const code = error instanceof whatsappService.WaUnavailableError ? 409
      : error instanceof whatsappService.WaRecipientError ? 400 : 500
    res.status(code).json({ message: error.message })
  }
})

// POST Manual trigger — immediately scan + send (for testing, one-click from UI)
router.post('/trigger-check', async (req, res) => {
  try {
    const userId = req.user.id
    const { checkUserAndQueueAlerts } = require('../jobs/whatsappDailyExpiryChecker')
    const { processPendingMessagesForUser } = require('../jobs/whatsappMessageSender')

    const queued = await checkUserAndQueueAlerts(userId)
    // Sending can take minutes (rate limits, human-like delays) — don't hold the request open.
    processPendingMessagesForUser(userId)

    res.json({
      message: `Scan done. ${queued || 0} new alert(s) queued. Sending has started in the background.`
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// GET fetch recently sent/failed logs with pagination
router.get('/logs', async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const logs = await MessageLog.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalLogs = await MessageLog.countDocuments({ userId });
    const totalPages = Math.ceil(totalLogs / limit);

    const todaySentCount = await MessageLog.countDocuments({
      userId,
      status: 'sent',
      sentAt: { $gte: istBoundaries().dayStart }
    });

    res.json({ logs, totalPages, currentPage: page, totalLogs, todaySentCount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
})

// POST bulk-delete multiple logs at once
router.post('/logs/bulk-delete', async (req, res) => {
  try {
    const userId = req.user.id
    const { ids } = req.body

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'Please provide an array of log ids to delete' })
    }

    const result = await MessageLog.deleteMany({ _id: { $in: ids }, userId })
    res.json({ message: `${result.deletedCount} message log(s) deleted successfully`, deletedCount: result.deletedCount })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// DELETE a specific log
router.delete('/logs/:id', async (req, res) => {
  try {
    const userId = req.user.id
    const logId = req.params.id
    
    const result = await MessageLog.findOneAndDelete({ _id: logId, userId })
    if (!result) {
      return res.status(404).json({ message: 'Log not found or not authorized' })
    }
    res.json({ message: 'Message log deleted successfully' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})


// GET Live RAM & System Diagnostic Status
router.get('/ram-status', async (req, res) => {
  try {
    const waLog = require('../utils/whatsappLogger')
    const sysRam = waLog.getSystemRamStats()
    const serverMb = Math.round(process.memoryUsage().rss / 1024 / 1024)
    res.json({
      timestamp: new Date().toISOString(),
      systemRam: sysRam,
      serverProcessMb: serverMb, // WhatsApp connections run inside this process (no browser)
      isSlowWarning: sysRam.freePercent < 15,
      message: sysRam.freePercent < 15
        ? '⚠️ System free RAM is low (<15%).'
        : '✅ System RAM is in normal range.'
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

module.exports = router
