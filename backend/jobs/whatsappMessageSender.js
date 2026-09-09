const cron = require('node-cron')
const WhatsAppSetting = require('../models/WhatsAppSetting')
const MessageLog = require('../models/MessageLog')
const whatsappService = require('../services/whatsappService')
const waLog = require('../utils/whatsappLogger')

const processPendingMessagesForUser = async (userId) => {
    try {
        const uid = userId.toString()
        
        // Removed the early exit `if (!whatsappService.isClientConnected()) return` 
        // because whatsappService now starts completely on-demand.
        if (whatsappService.isClientStopped(uid)) {
            console.log(`[WHATSAPP-SENDER:${uid}] User has manually stopped sending. Skipping...`)
            waLog.cronUserSkip(uid, 'User has manually stopped sending')
            return
        }

        console.log(`[WHATSAPP-SENDER:${uid}] Checking for pending messages...`)

        let setting = await WhatsAppSetting.findOne({ userId: uid })
        const maxPerDay = setting ? setting.maxMessagesPerDay : 25
        const maxPerHour = setting ? setting.maxMessagesPerHour : 4

        // 1. Check strict IST time window (7 AM to 9 PM)
        const now = new Date()
        // Convert to IST (UTC + 5:30)
        const istTime = new Date(now.getTime() + (5.5 * 60 * 60 * 1000))
        const hourIST = istTime.getUTCHours()

        if (hourIST < 7 || hourIST >= 21) {
            console.log(`[WHATSAPP-SENDER:${uid}] Outside sending window (7 AM - 9 PM IST). Current IST hour: ${hourIST}. Skipping.`)
            waLog.cronUserSkip(uid, `Outside IST sending window (hour: ${hourIST})`)
            return
        }

        const startOfDay = new Date()
        startOfDay.setHours(0, 0, 0, 0)

        // Reset today's failed messages back to pending for retry — ONLY 1 per (documentId, alertKey)
        const failedToday = await MessageLog.find({
            userId: uid,
            status: 'failed',
            createdAt: { $gte: startOfDay },
            errorReason: { $regex: /not initialized|paused|State: null|State: undefined|not found.*@lid|not found @lid|not ready|will retry|connection lost/i }
        }).sort({ createdAt: -1 })

        const resetDocKeys = new Set()
        let resetCount = 0

        for (const fMsg of failedToday) {
            const key = fMsg.documentId ? `${fMsg.documentId.toString()}:${fMsg.alertKey || ''}` : fMsg._id.toString()
            if (!resetDocKeys.has(key)) {
                resetDocKeys.add(key)
                fMsg.status = 'pending'
                fMsg.errorReason = null
                fMsg.scheduledFor = new Date()
                await fMsg.save()
                resetCount++
            } else {
                // Mark older duplicate failed message so it won't be retried
                fMsg.errorReason = 'Duplicate failed log ignored'
                await fMsg.save()
            }
        }

        if (resetCount > 0) {
            console.log(`[WHATSAPP-SENDER:${uid}] Reset ${resetCount} unique failed message(s) back to pending for retry.`)
        }

        // 2. Check Daily Limit
        const sentTodayCount = await MessageLog.countDocuments({
            userId: uid,
            status: 'sent',
            sentAt: { $gte: startOfDay }
        })

        if (sentTodayCount >= maxPerDay) {
            console.log(`[WHATSAPP-SENDER:${uid}] Daily limit reached (${sentTodayCount}/${maxPerDay}). Skipping until tomorrow.`)
            waLog.cronUserSkip(uid, `Daily limit reached (${sentTodayCount}/${maxPerDay})`)
            return
        }

        // 3. Check Hourly Limit
        const startOfHourIST = new Date(istTime)
        startOfHourIST.setUTCMinutes(0, 0, 0) 
        // Convert back to UTC for MongoDB $gte query
        const startOfHourUTC = new Date(startOfHourIST.getTime() - (5.5 * 60 * 60 * 1000))

        const sentThisHourCount = await MessageLog.countDocuments({
            userId: uid,
            status: 'sent',
            sentAt: { $gte: startOfHourUTC }
        })

        if (sentThisHourCount >= maxPerHour) {
            console.log(`[WHATSAPP-SENDER:${uid}] Hourly limit reached (${sentThisHourCount}/${maxPerHour}). Waiting for next hour.`)
            waLog.cronUserSkip(uid, `Hourly limit reached (${sentThisHourCount}/${maxPerHour})`)
            return
        }

        const remainingQuotaDay = maxPerDay - sentTodayCount
        const remainingQuotaHour = maxPerHour - sentThisHourCount
        
        // Fetch up to the remaining hourly/daily limit
        const limitToFetch = Math.min(remainingQuotaHour, remainingQuotaDay)

        if (limitToFetch <= 0) return

        const rawPendingMessages = await MessageLog.find({
            userId: uid,
            status: 'pending',
            scheduledFor: { $lte: new Date() }
        }).sort({ scheduledFor: 1 })

        if (rawPendingMessages.length === 0) return

        // In-memory deduplication by documentId + alertKey
        const seenDocAlertKeys = new Set()
        const messagesToProcess = []

        for (const pMsg of rawPendingMessages) {
            const key = pMsg.documentId ? `${pMsg.documentId.toString()}:${pMsg.alertKey || ''}` : pMsg._id.toString()
            if (!seenDocAlertKeys.has(key)) {
                seenDocAlertKeys.add(key)
                messagesToProcess.push(pMsg)
            } else {
                // Cancel duplicate pending log to prevent re-sending
                pMsg.status = 'failed'
                pMsg.errorReason = 'Duplicate pending alert cancelled'
                await pMsg.save()
            }
        }

        const messages = messagesToProcess.slice(0, limitToFetch)
        if (messages.length === 0) return

        console.log(`[WHATSAPP-SENDER:${uid}] Found ${messages.length} pending message(s) within cycle limit. Queueing...`)
        waLog.cronUserQueued(uid, messages.length)

        // The sendWhatsAppMessage call will internally queue them up one by one and cold-start browser if needed
        for (const msg of messages) {
            try {
                const result = await whatsappService.sendWhatsAppMessage(uid, msg.targetNumber, msg.messageBody, msg.mediaPath)
                msg.status = 'sent'
                msg.sentAt = new Date()
                msg.whatsappMessageId = result.messageId
                await msg.save()
                console.log(`[WHATSAPP-SENDER:${uid}] Successfully sent message to ${msg.targetNumber}`)
                waLog.messageSent(uid, msg.targetNumber, msg.whatsappMessageId)
                await new Promise(r => setTimeout(r, 2000))
            } catch (err) {
                console.error(`[WHATSAPP-SENDER:${uid}] Failed to send message to ${msg.targetNumber}:`, err.message)
                waLog.messageFailed(uid, msg.targetNumber, err instanceof Error ? err : null)
                msg.status = 'failed'
                msg.errorReason = err.message
                await msg.save()
            }
        }
        
        // Session stays alive for at least 2 minutes after batch finishes before destroying session
        const instance = whatsappService.getInstance(uid)
        if (!instance.hasActiveUiUser()) {
            console.log(`[WHATSAPP-SENDER:${uid}] Batch complete. Keeping Chrome session open for 2 minutes before cleanup...`)
            await new Promise(r => setTimeout(r, 120000))
            if (!instance.hasActiveUiUser()) {
                console.log(`[WHATSAPP-SENDER:${uid}] 2-minute pause elapsed. Destroying Chrome gracefully to free RAM.`)
                waLog.cronBatchDone(uid, true)
                await whatsappService.destroySession(uid)
            } else {
                console.log(`[WHATSAPP-SENDER:${uid}] UI user active after pause — leaving session open.`)
                waLog.cronBatchDone(uid, false)
            }
        } else {
            console.log(`[WHATSAPP-SENDER:${uid}] Batch complete. UI user active — idle timer will clean up.`)
            waLog.cronBatchDone(uid, false)
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

        if (userIds.length > 0) {
            waLog.separator('CRON RUN')
            waLog.cronStart(userIds.length)
        }

        for (const userId of userIds) {
            await processPendingMessagesForUser(userId)
        }
    } catch (err) {
        console.error('[WHATSAPP-SENDER] Global process error:', err)
        waLog.error('', 'CRON_GLOBAL_ERR', 'processAllPendingMessages threw an error', err instanceof Error ? err : null)
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
