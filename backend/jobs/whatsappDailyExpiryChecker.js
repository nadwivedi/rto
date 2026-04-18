const cron = require('node-cron')
const WhatsAppSetting = require('../models/WhatsAppSetting')
const MessageLog = require('../models/MessageLog')
const Tax = require('../models/Tax')
const Fitness = require('../models/Fitness')
const Puc = require('../models/Puc')
const Gps = require('../models/Gps')
const Insurance = require('../models/Insurance')

/**
 * Parse a date string stored in Fitness/Tax/PUC/GPS/Insurance docs.
 * Supports: "DD-MM-YYYY", "DD/MM/YYYY", "YYYY-MM-DD"
 * Returns a Date object at midnight, or null if unparseable.
 */
const parseDocDate = (dateStr) => {
    if (!dateStr) return null
    const s = String(dateStr).trim()
    const parts = s.split(/[-\/]/)
    if (parts.length !== 3) return null
    let day, month, year
    if (parts[0].length === 4) {
        // YYYY-MM-DD
        year = parseInt(parts[0])
        month = parseInt(parts[1]) - 1
        day = parseInt(parts[2])
    } else {
        // DD-MM-YYYY or DD/MM/YYYY
        day = parseInt(parts[0])
        month = parseInt(parts[1]) - 1
        year = parseInt(parts[2])
    }
    const d = new Date(year, month, day)
    return isNaN(d.getTime()) ? null : d
}

/**
 * Main job: scan all documents, queue WhatsApp alerts for expiries.
 * Uses doc.mobileNumber directly (simplest approach).
 */
const checkAndQueueAlerts = async () => {
    try {
        console.log('[WHATSAPP-CRON] ── Starting document expiry scan ──')

        // Load settings (use defaults if none configured)
        let setting = await WhatsAppSetting.findOne()
        if (!setting) {
            console.log('[WHATSAPP-CRON] No settings found, using defaults.')
            setting = {
                daysBeforeExpiry: 7,
                sendOnExpiryDay: true,
                enableGracePeriodAlerts: false,
                gracePeriodDays: []
            }
        }

        const daysBeforeExpiry = setting.daysBeforeExpiry || 7
        const sendOnExpiryDay = setting.sendOnExpiryDay !== false
        const enableGrace = setting.enableGracePeriodAlerts === true
        const graceDays = (setting.gracePeriodDays || []).map(Number)

        // Today at midnight for clean date math
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

        for (const { name, model, dateField } of models) {
            // Fetch all docs that have a mobile number — use lean() for speed
            const docs = await model.find({
                mobileNumber: { $exists: true, $nin: [null, '', undefined] }
            }).lean()

            console.log(`[WHATSAPP-CRON] ${name}: checking ${docs.length} docs with mobile numbers`)

            for (const doc of docs) {
                const expiryDate = parseDocDate(doc[dateField])
                if (!expiryDate) {
                    console.log(`[WHATSAPP-CRON]   Skipping doc ${doc._id}: unparseable date "${doc[dateField]}"`)
                    continue
                }

                // diffDays = positive means expires in future, negative means already expired
                const diffDays = Math.round((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

                let alertType = null
                let alertLabel = ''

                // Should alert?
                if (diffDays >= 0 && diffDays <= daysBeforeExpiry) {
                    // Expires within the alert window (e.g. 0–7 days)
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

                // Build WhatsApp message
                let msg = ''
                if (alertType === 'upcoming') {
                    msg = `Dear Customer,\n\nYour *${name}* document for vehicle *${vehicleNo}* will expire on *${doc[dateField]}* (${alertLabel}).\n\nPlease renew it soon to avoid penalties.\n\n— RTO Services`
                } else if (alertType === 'today') {
                    msg = `Dear Customer,\n\n⚠️ Your *${name}* document for vehicle *${vehicleNo}* *expires TODAY* (${doc[dateField]}).\n\nPlease renew urgently to avoid fines.\n\n— RTO Services`
                } else if (alertType === 'grace') {
                    msg = `Dear Customer,\n\n🚨 Your *${name}* document for vehicle *${vehicleNo}* expired on *${doc[dateField]}* (${alertLabel}).\n\nPlease renew immediately to avoid heavy fines.\n\n— RTO Services`
                }

                // Skip if already queued today for this exact document
                const alreadyQueued = await MessageLog.findOne({
                    documentId: doc._id,
                    documentType: name,
                    createdAt: { $gte: startOfDay, $lte: endOfDay }
                })

                if (alreadyQueued) {
                    console.log(`[WHATSAPP-CRON]   Already queued today for ${name} doc ${doc._id} (${vehicleNo})`)
                    continue
                }

                await MessageLog.create({
                    documentId: doc._id,
                    documentType: name,
                    targetNumber: mobileNumber,
                    messageBody: msg,
                    status: 'pending',
                    scheduledFor: new Date()
                })

                queuedCount++
                console.log(`[WHATSAPP-CRON]   ✓ Queued: ${name} | ${vehicleNo} | ${mobileNumber} | ${alertLabel}`)
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
    // Run every day at 08:30 AM
    cron.schedule('30 8 * * *', () => {
        checkAndQueueAlerts()
    })
    console.log('[CRON] WhatsApp Daily Expiry Checker initiated (runs at 08:30 AM daily)')
}

module.exports = {
    initWhatsAppDailyChecker,
    checkAndQueueAlerts
}
