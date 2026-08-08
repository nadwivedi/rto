const express = require('express')
const router = express.Router()
const whatsappService = require('../services/whatsappService')
const MessageLog = require('../models/MessageLog')

// GET current WA status
router.get('/status', async (req, res) => {
  try {
    const userId = req.user.id
    const session = await whatsappService.getSessionStatus(userId)

    // Signals "someone is actually looking at the QR page right now" — keeps the pending
    // handshake alive while polled, so it only gets torn down after real inactivity.
    whatsappService.touchPoll(userId)

    // Restore in-memory isStopped from DB when the client has no active browser.
    // This covers server restarts — e.g. if WhatsApp sent LOGOUT before restart,
    // isStopped is persisted in DB but the new in-memory instance starts at false.
    const instance = whatsappService.getInstance(userId)
    if (!instance.client && !instance.isInitializing && session?.isStopped && !instance.isStopped) {
      instance.isStopped = true
    }

    res.json({
      ...(session ? session.toObject() : {}),
      isStopped: whatsappService.isClientStopped(userId),
      clientActive: whatsappService.isClientConnected(userId),
      isInitializing: whatsappService.getIsInitializing(userId) // true while browser is actually launching
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})


// POST Start/resume session (will use saved auth if available — no QR needed)
router.post('/start', async (req, res) => {
  try {
    const userId = req.user.id
    whatsappService.initializeSession(userId) // non-blocking queue initiation
    res.json({ message: 'Session start initiated. Check status for QR or connection update.' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// POST Send a singular ad-hoc message manually easily
router.post('/send', async (req, res) => {
  try {
    const userId = req.user.id
    const { chatId, text } = req.body
    
    if (!chatId || !text) {
      return res.status(400).json({ message: 'Please provide chatId/targetNumber and text payload' })
    }

    // Call the robust queued sender (which cold starts if needed)
    const result = await whatsappService.sendWhatsAppMessage(userId, chatId, text)
    res.json({ message: 'Dynamic send successful', result })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// POST Stop: destroys browser, keeps auth on disk, pauses message sender
router.post('/stop', async (req, res) => {
  try {
    const userId = req.user.id
    await whatsappService.destroySession(userId, true) // Pass true to manually pause it permanently
    res.json({ message: 'WhatsApp session stopped. Auth saved. Tap Start to resume.' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// POST Logout: destroys browser AND wipes saved auth from disk (forces QR rescan)
router.post('/logout', async (req, res) => {
  try {
    const userId = req.user.id
    await whatsappService.logoutSession(userId)
    res.json({ message: 'Logged out and session data cleared. You will need to scan QR again.' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// POST Renew QR: Restarts the session to get a fresh QR code.
// IMPORTANT: We MUST await destroySession() before calling initializeSession() so the old
// Chrome process is fully dead before launching a new one. Failing to do so caused two
// Chrome instances to fight each other, resulting in the "perpetually Connecting" spinner.
router.post('/renew-qr', async (req, res) => {
  try {
    const userId = req.user.id
    await whatsappService.destroySession(userId)  // Wait for Chrome to fully die first
    whatsappService.initializeSession(userId)     // Then start fresh (non-blocking queue)
    res.json({ message: 'QR renewal initiated. New QR will appear shortly.' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// POST Manual trigger — immediately scan + send (for testing, one-click from UI)
router.post('/trigger-check', async (req, res) => {
  try {
    const userId = req.user.id
    const { checkUserAndQueueAlerts } = require('../jobs/whatsappDailyExpiryChecker')
    const { processPendingMessagesForUser } = require('../jobs/whatsappMessageSender')

    // Reset ALL today's failed messages back to pending before scan
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)
    const failedReset = await MessageLog.updateMany(
      { userId, status: 'failed', createdAt: { $gte: startOfDay } },
      { $set: { status: 'pending', errorReason: null, scheduledFor: new Date() } }
    )

    // Also reset stale pending messages older than 1 hour (so re-check can re-queue if needed)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    const stalePendingReset = await MessageLog.updateMany(
      { userId, status: 'pending', scheduledFor: { $lt: oneHourAgo } },
      { $set: { status: 'failed', errorReason: 'Stale — reset by manual trigger' } }
    )

    // Delete old 'failed' stale logs so they can be re-queued fresh
    await MessageLog.deleteMany(
      { userId, status: 'failed', errorReason: 'Stale — reset by manual trigger' }
    )

    const queued = await checkUserAndQueueAlerts(userId)
    await processPendingMessagesForUser(userId)

    res.json({
      message: `Scan done. ${queued || 0} new alerts queued. ${failedReset.modifiedCount} failed messages reset. ${stalePendingReset.modifiedCount} stale pending cleared. Sender processed pending.`
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

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const todaySentCount = await MessageLog.countDocuments({
      userId,
      status: 'sent',
      createdAt: { $gte: startOfDay }
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

// GET Download today's system log file
router.get('/download-system-log', async (req, res) => {
  try {
    const fs = require('fs')
    const path = require('path')
    const now = new Date(new Date().getTime() + 5.5 * 60 * 60 * 1000)
    const yyyy = now.getUTCFullYear()
    const mm = String(now.getUTCMonth() + 1).padStart(2, '0')
    const dd = String(now.getUTCDate()).padStart(2, '0')
    const fileName = `whatsapp-${yyyy}-${mm}-${dd}.log`
    const filePath = path.join(__dirname, '../logs/whatsapp', fileName)

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: `No log file found for today (${fileName})` })
    }

    res.setHeader('Content-Type', 'text/plain; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`)
    const fileStream = fs.createReadStream(filePath)
    fileStream.pipe(res)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// GET Live RAM & System Diagnostic Status
router.get('/ram-status', async (req, res) => {
  try {
    const waLog = require('../utils/whatsappLogger')
    const userId = req.user.id
    const instance = whatsappService.getInstance(userId)
    const pid = instance ? instance._chromePid : null

    const sysRam = waLog.getSystemRamStats()
    const chromeRamMb = pid ? waLog.getProcessRamMb(pid) : null

    // Also log this check into the file
    waLog.logRamStatus(userId, 'MANUAL_RAM_DIAGNOSTIC', pid)

    res.json({
      timestamp: new Date().toISOString(),
      systemRam: sysRam,
      chromePid: pid,
      chromeRamMb: chromeRamMb,
      isSlowWarning: sysRam.freePercent < 15 || (chromeRamMb && chromeRamMb > 400),
      message: sysRam.freePercent < 15
        ? '⚠️ System free RAM is low (<15%). This can cause Chromium or WhatsApp Web to freeze/timeout.'
        : '✅ System RAM is in normal range.'
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

module.exports = router
