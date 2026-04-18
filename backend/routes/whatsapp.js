const express = require('express')
const router = express.Router()
const whatsappService = require('../services/whatsappService')
const MessageLog = require('../models/MessageLog')

// GET current WA status
router.get('/status', async (req, res) => {
  try {
    const session = await whatsappService.getStatus()

    // If DB shows authenticated/initializing but client is gone (server restart), auto-restore
    if ((session?.status === 'authenticated' || session?.status === 'initializing') && !whatsappService.isClientConnected()) {
      console.log('[WHATSAPP] Status endpoint: DB=authenticated/initializing but client null — auto-restoring...')
      whatsappService.startClient()
    }

    res.json({
      ...(session ? session.toObject() : {}),
      isStopped: whatsappService.isStopped,
      clientActive: whatsappService.isClientConnected()
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// POST Start/resume session (will use saved auth if available — no QR needed)
router.post('/start', async (req, res) => {
  try {
    whatsappService.startClient() // async, non-blocking
    res.json({ message: 'Session start initiated. Check status for QR or connection update.' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// POST Stop: destroys browser, keeps auth on disk, pauses message sender
router.post('/stop', async (req, res) => {
  try {
    await whatsappService.stopClient()
    res.json({ message: 'WhatsApp session stopped. Auth saved. Tap Start to resume.' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// POST Logout: destroys browser AND wipes saved auth from disk (forces QR rescan)
router.post('/logout', async (req, res) => {
  try {
    await whatsappService.logoutClient()
    res.json({ message: 'Logged out and session data cleared. You will need to scan QR again.' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// POST Manual trigger — immediately scan + send (for testing, one-click from UI)
router.post('/trigger-check', async (req, res) => {
  try {
    const { checkAndQueueAlerts } = require('../jobs/whatsappDailyExpiryChecker')
    const { sendPendingMessages } = require('../jobs/whatsappMessageSender')

    // Reset ALL today's failed messages back to pending before scan
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)
    const reset = await MessageLog.updateMany(
      { status: 'failed', createdAt: { $gte: startOfDay } },
      { $set: { status: 'pending', errorReason: null, scheduledFor: new Date() } }
    )

    const queued = await checkAndQueueAlerts()
    await sendPendingMessages()

    res.json({
      message: `Scan done. ${queued || 0} new alerts queued. ${reset.modifiedCount} failed messages reset. Sender processed pending.`
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// GET fetch recently sent/failed logs, limited to 100
router.get('/logs', async (req, res) => {
  try {
    const logs = await MessageLog.find()
      .sort({ createdAt: -1 })
      .limit(100)
    res.json(logs)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

module.exports = router
