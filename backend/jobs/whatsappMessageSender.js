const cron = require('node-cron')
const WhatsAppSetting = require('../models/WhatsAppSetting')
const MessageLog = require('../models/MessageLog')
const whatsappService = require('../services/whatsappService')

const sendPendingMessages = async () => {
    try {
        // If WhatsApp client is not connected yet, skip this run silently
        if (!whatsappService.isClientConnected()) {
            console.log('[WHATSAPP-SENDER] Client not connected yet, skipping this run.')
            return
        }

        console.log('[WHATSAPP-SENDER] Checking for pending messages...')

        let setting = await WhatsAppSetting.findOne()
        const maxPerDay = setting ? setting.maxMessagesPerDay : 30
        const maxPerHour = setting ? setting.maxMessagesPerHour : 5

        const startOfDay = new Date()
        startOfDay.setHours(0, 0, 0, 0)

        // ── Auto-retry: reset today's failed messages back to pending ──────
        // (Failed due to client being null during server restart — retry now)
        const resetResult = await MessageLog.updateMany(
            {
                status: 'failed',
                createdAt: { $gte: startOfDay },
                errorReason: { $regex: /not initialized|paused|State: null|State: undefined|not found.*@lid|not found @lid/i }
            },
            { $set: { status: 'pending', errorReason: null, scheduledFor: new Date() } }
        )
        if (resetResult.modifiedCount > 0) {
            console.log(`[WHATSAPP-SENDER] Reset ${resetResult.modifiedCount} failed message(s) back to pending for retry.`)
        }

        // Count how many sent today
        const sentTodayCount = await MessageLog.countDocuments({
            status: 'sent',
            sentAt: { $gte: startOfDay }
        })

        if (sentTodayCount >= maxPerDay) {
            console.log(`[WHATSAPP-SENDER] Daily limit reached (${sentTodayCount}/${maxPerDay}). Skipping.`)
            return
        }

        const remainingQuota = maxPerDay - sentTodayCount
        const limitToFetch = Math.min(maxPerHour, remainingQuota)

        if (limitToFetch <= 0) return

        // Fetch up to 'limitToFetch' pending messages
        const messages = await MessageLog.find({
            status: 'pending',
            scheduledFor: { $lte: new Date() }
        }).sort({ scheduledFor: 1 }).limit(limitToFetch)

        if (messages.length === 0) {
            return
        }

        console.log(`[WHATSAPP-SENDER] Found ${messages.length} pending message(s). Sending...`)

        for (const msg of messages) {
            try {
                // Actual send call
                const result = await whatsappService.sendMessage(msg.targetNumber, msg.messageBody)
                
                msg.status = 'sent'
                msg.sentAt = new Date()
                msg.whatsappMessageId = result.messageId
                await msg.save()
                console.log(`[WHATSAPP-SENDER] Successfully sent message to ${msg.targetNumber}`)
                
                // small delay between sends just to be safe
                await new Promise(r => setTimeout(r, 2000))
            } catch (err) {
                console.error(`[WHATSAPP-SENDER] Failed to send message to ${msg.targetNumber}:`, err.message)
                msg.status = 'failed'
                msg.errorReason = err.message
                await msg.save()
            }
        }
    } catch (error) {
        console.error('[WHATSAPP-SENDER] Error in message sender:', error)
    }
}

const initWhatsAppMessageSender = () => {
    // Run every 5 minutes so alerts go out promptly after check
    cron.schedule('*/5 * * * *', () => {
        sendPendingMessages()
    })
    console.log('[CRON] WhatsApp Message Sender initiated (runs every 5 minutes)')
}

module.exports = {
    initWhatsAppMessageSender,
    sendPendingMessages
}
