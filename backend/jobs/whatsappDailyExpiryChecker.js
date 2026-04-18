const cron = require('node-cron')
const WhatsAppSetting = require('../models/WhatsAppSetting')
const MessageLog = require('../models/MessageLog')
const Tax = require('../models/Tax')
const Fitness = require('../models/Fitness')
const Puc = require('../models/Puc')
const Gps = require('../models/Gps')
const Insurance = require('../models/Insurance')

const parseDocDate = (dateStr) => {
    if (!dateStr) return null
    const s = String(dateStr).trim()
    const parts = s.split(/[-\/]/)
    if (parts.length !== 3) return null
    let day, month, year
    if (parts[0].length === 4) {
        year = parseInt(parts[0])
        month = parseInt(parts[1]) - 1
        day = parseInt(parts[2])
    } else {
        day = parseInt(parts[0])
        month = parseInt(parts[1]) - 1
        year = parseInt(parts[2])
    }
    const d = new Date(year, month, day)
    return isNaN(d.getTime()) ? null : d
}

// Scans documents. If specificUserId is provided, it only scans docs for that user.
// Otherwise, it scans all documents across all users.
const checkUserAndQueueAlerts = async (specificUserId = null) => {
    try {
        console.log(`[WHATSAPP-CRON] ── Starting document expiry scan ${specificUserId ? `for user ${specificUserId}` : 'globally'} ──`)

        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const startOfDay = new Date(today)
        const endOfDay = new Date(today)
        endOfDay.setHours(23, 59, 59, 999)

        const models = [
            { name: 'Fitness', model: Fitness, dateField: 'validTo' },
            { name: 'Tax',     model: Tax,     dateField: 'taxTo'   },
            { name: 'Puc',     model: Puc,     dateField: 'validTo' },
            { name: 'Gps',     model: Gps,     dateField: 'validTo' },
            { name: 'Insurance', model: Insurance, dateField: 'validTo' }
        ]

        let queuedCount = 0

        // Fetch settings per user and cache them
        const userSettings = new Map()
        const getSettingForUser = async (uid) => {
            if (userSettings.has(uid)) return userSettings.get(uid)
            let setting = await WhatsAppSetting.findOne({ userId: uid })
            if (!setting) {
                setting = { daysBeforeExpiry: 7, sendOnExpiryDay: true, enableGracePeriodAlerts: false, gracePeriodDays: [] }
            }
            userSettings.set(uid, setting)
            return setting
        }

        for (const { name, model, dateField } of models) {
            const query = { mobileNumber: { $exists: true, $nin: [null, '', undefined] } }
            if (specificUserId) query.userId = specificUserId

            const docs = await model.find(query).lean()
            console.log(`[WHATSAPP-CRON] ${name}: checking ${docs.length} docs with mobile numbers ${specificUserId ? `for ${specificUserId}` : ''}`)

            for (const doc of docs) {
                if (!doc.userId) continue // Cannot queue without a user

                const docUserId = doc.userId.toString()
                const setting = await getSettingForUser(docUserId)

                const daysBeforeExpiry = setting.daysBeforeExpiry || 7
                const sendOnExpiryDay = setting.sendOnExpiryDay !== false
                const enableGrace = setting.enableGracePeriodAlerts === true
                const graceDays = (setting.gracePeriodDays || []).map(Number)

                const expiryDate = parseDocDate(doc[dateField])
                if (!expiryDate) continue

                const diffDays = Math.round((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

                let alertType = null
                let alertLabel = ''

                if (diffDays >= 0 && diffDays <= daysBeforeExpiry) {
                    if (diffDays === 0) {
                        if (sendOnExpiryDay) {
                            alertType = 'today'
                            alertLabel = 'expires TODAY'
                        }
                    } else {
                        alertType = 'upcoming'
                        alertLabel = `expires in ${diffDays} day${diffDays === 1 ? '' : 's'}`
                    }
                } else if (diffDays < 0 && enableGrace) {
                    const daysPast = Math.abs(diffDays)
                    if (graceDays.includes(daysPast)) {
                        alertType = 'grace'
                        alertLabel = `expired ${daysPast} days ago (grace period)`
                    }
                }

                if (!alertType) continue

                const vehicleNo = doc.vehicleNumber || 'your vehicle'
                const mobileNumber = String(doc.mobileNumber).trim()

                let msg = ''
                if (alertType === 'upcoming') {
                    msg = `Dear Customer,\n\nYour *${name}* document for vehicle *${vehicleNo}* will expire on *${doc[dateField]}* (${alertLabel}).\n\nPlease renew it soon to avoid penalties.\n\n— RTO Services`
                } else if (alertType === 'today') {
                    msg = `Dear Customer,\n\n⚠️ Your *${name}* document for vehicle *${vehicleNo}* *expires TODAY* (${doc[dateField]}).\n\nPlease renew urgently to avoid fines.\n\n— RTO Services`
                } else if (alertType === 'grace') {
                    msg = `Dear Customer,\n\n🚨 Your *${name}* document for vehicle *${vehicleNo}* expired on *${doc[dateField]}* (${alertLabel}).\n\nPlease renew immediately to avoid heavy fines.\n\n— RTO Services`
                }

                let startOfCheck = startOfDay;
                let messagePattern = null;

                if (alertType === 'upcoming') {
                    // Find if any "upcoming" message was sent/queued AT ALL in the entire X day window
                    startOfCheck = new Date(today);
                    startOfCheck.setDate(startOfCheck.getDate() - daysBeforeExpiry);
                    startOfCheck.setHours(0, 0, 0, 0);
                    messagePattern = /will expire on/i;
                } else if (alertType === 'today') {
                    messagePattern = /expires TODAY/i;
                } else if (alertType === 'grace') {
                    messagePattern = /expired.*ago/i;
                }

                const alreadyQueued = await MessageLog.findOne({
                    userId: docUserId,
                    documentId: doc._id,
                    documentType: name,
                    status: { $in: ['pending', 'sent'] }, // count pending or successful attempts
                    createdAt: { $gte: startOfCheck, $lte: endOfDay },
                    messageBody: messagePattern ? { $regex: messagePattern } : { $exists: true }
                })

                if (alreadyQueued) {
                    continue
                }

                await MessageLog.create({
                    userId: docUserId,
                    documentId: doc._id,
                    documentType: name,
                    targetNumber: mobileNumber,
                    ownerName: doc.ownerName || doc.partyName || 'Unknown Owner',
                    messageBody: msg,
                    status: 'pending',
                    scheduledFor: new Date()
                })

                queuedCount++
                console.log(`[WHATSAPP-CRON:${docUserId}]   ✓ Queued: ${name} | ${vehicleNo} | ${mobileNumber} | ${alertLabel}`)
            }
        }

        console.log(`[WHATSAPP-CRON] ── Scan complete: ${queuedCount} new alerts queued ──`)
        return queuedCount

    } catch (err) {
        console.error('[WHATSAPP-CRON] Error during expiry scan:', err)
        throw err
    }
}

const initWhatsAppDailyChecker = () => {
    // Run globally for all users every day at 08:30 AM
    cron.schedule('30 8 * * *', () => {
        checkUserAndQueueAlerts(null)
    })
    console.log('[CRON] WhatsApp Daily Expiry Checker initiated (runs at 08:30 AM daily)')
}

module.exports = {
    initWhatsAppDailyChecker,
    checkUserAndQueueAlerts
}
