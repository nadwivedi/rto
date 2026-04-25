const express = require('express')
const router = express.Router()
const whatsappService = require('../services/whatsappService')
const MessageLog = require('../models/MessageLog')

// GET current WA status
router.get('/status', async (req, res) => {
  try {
    const userId = req.user.id
    const session = await whatsappService.getSessionStatus(userId)

    // With the new low-memory architecture, the client might purposely be null (sleeping)
    // We do NOT auto-restore here to save RAM. It will auto-restore on the next send request.
    
    res.json({
      ...(session ? session.toObject() : {}),
      isStopped: whatsappService.isClientStopped(userId),
      clientActive: whatsappService.isClientConnected(userId)
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

// POST Manual trigger — immediately scan + send (for testing, one-click from UI)
router.post('/trigger-check', async (req, res) => {
  try {
    const userId = req.user.id
    const { checkUserAndQueueAlerts } = require('../jobs/whatsappDailyExpiryChecker')
    const { processPendingMessagesForUser } = require('../jobs/whatsappMessageSender')

    // Reset ALL today's failed messages back to pending before scan
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)
    const reset = await MessageLog.updateMany(
      { userId, status: 'failed', createdAt: { $gte: startOfDay } },
      { $set: { status: 'pending', errorReason: null, scheduledFor: new Date() } }
    )

    const queued = await checkUserAndQueueAlerts(userId)
    await processPendingMessagesForUser(userId)

    res.json({
      message: `Scan done. ${queued || 0} new alerts queued. ${reset.modifiedCount} failed messages reset. Sender processed pending.`
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

module.exports = router
