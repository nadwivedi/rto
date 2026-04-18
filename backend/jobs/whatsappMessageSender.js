const cron = require('node-cron')
const WhatsAppSetting = require('../models/WhatsAppSetting')
const MessageLog = require('../models/MessageLog')
const whatsappService = require('../services/whatsappService')

const processPendingMessagesForUser = async (userId) => {
    try {
        const uid = userId.toString()
        if (!whatsappService.isClientConnected(uid)) {
            console.log(`[WHATSAPP-SENDER:${uid}] Client not connected yet, skipping this run.`)
            return
        }

        console.log(`[WHATSAPP-SENDER:${uid}] Checking for pending messages...`)

        let setting = await WhatsAppSetting.findOne({ userId: uid })
        const maxPerDay = setting ? setting.maxMessagesPerDay : 30
        const maxPerHour = setting ? setting.maxMessagesPerHour : 5

        const startOfDay = new Date()
        startOfDay.setHours(0, 0, 0, 0)

        // Reset today's failed messages back to pending for retry on connection issues
        const resetResult = await MessageLog.updateMany(
            {
                userId: uid,
                status: 'failed',
                createdAt: { $gte: startOfDay },
                errorReason: { $regex: /not initialized|paused|State: null|State: undefined|not found.*@lid|not found @lid/i }
            },
            { $set: { status: 'pending', errorReason: null, scheduledFor: new Date() } }
        )
        if (resetResult.modifiedCount > 0) {
            console.log(`[WHATSAPP-SENDER:${uid}] Reset ${resetResult.modifiedCount} failed message(s) back to pending for retry.`)
        }

        const sentTodayCount = await MessageLog.countDocuments({
            userId: uid,
            status: 'sent',
            sentAt: { $gte: startOfDay }
        })

        if (sentTodayCount >= maxPerDay) {
            console.log(`[WHATSAPP-SENDER:${uid}] Daily limit reached (${sentTodayCount}/${maxPerDay}). Skipping.`)
            return
        }

        const remainingQuota = maxPerDay - sentTodayCount
        const limitToFetch = Math.min(maxPerHour, remainingQuota)

        if (limitToFetch <= 0) return

        const messages = await MessageLog.find({
            userId: uid,
            status: 'pending',
            scheduledFor: { $lte: new Date() }
        }).sort({ scheduledFor: 1 }).limit(limitToFetch)

        if (messages.length === 0) return

        console.log(`[WHATSAPP-SENDER:${uid}] Found ${messages.length} pending message(s). Sending...`)

        for (const msg of messages) {
            try {
                const result = await whatsappService.sendMessage(uid, msg.targetNumber, msg.messageBody)
                msg.status = 'sent'
                msg.sentAt = new Date()
                msg.whatsappMessageId = result.messageId
                await msg.save()
                console.log(`[WHATSAPP-SENDER:${uid}] Successfully sent message to ${msg.targetNumber}`)
                await new Promise(r => setTimeout(r, 2000))
            } catch (err) {
                console.error(`[WHATSAPP-SENDER:${uid}] Failed to send message to ${msg.targetNumber}:`, err.message)
                msg.status = 'failed'
                msg.errorReason = err.message
                await msg.save()
            }
        }
    } catch (error) {
        console.error(`[WHATSAPP-SENDER:${userId}] Error in message sender:`, error)
    }
}

const processAllPendingMessages = async () => {
    try {
        console.log('[WHATSAPP-SENDER] Checking all users for pending messages...')
        // Find all distinct users who have pending messages right now
        const userIds = await MessageLog.distinct('userId', {
            status: 'pending',
            scheduledFor: { $lte: new Date() }
        })

        for (const userId of userIds) {
            await processPendingMessagesForUser(userId)
        }
    } catch (err) {
        console.error('[WHATSAPP-SENDER] Global process error:', err)
    }
}

const initWhatsAppMessageSender = () => {
    cron.schedule('*/5 * * * *', () => {
        processAllPendingMessages()
    })
    console.log('[CRON] WhatsApp Message Sender initiated (runs every 5 minutes)')
}

module.exports = {
    initWhatsAppMessageSender,
    processPendingMessagesForUser,
    processAllPendingMessages
}
