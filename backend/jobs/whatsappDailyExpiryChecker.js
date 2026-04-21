const cron = require('node-cron')
const WhatsAppSetting = require('../models/WhatsAppSetting')
const MessageLog = require('../models/MessageLog')
const Tax = require('../models/Tax')
const Fitness = require('../models/Fitness')
const Puc = require('../models/Puc')
const Gps = require('../models/Gps')
const Insurance = require('../models/Insurance')
const NationalPermit = require('../models/NationalPermit')
const CgPermit = require('../models/CgPermit')
const BusPermit = require('../models/BusPermit')
const { normalizeAlertSettings } = require('../utils/whatsappAlertSettings')

const parseDocDate = (dateStr) => {
  if (!dateStr) return null
  const s = String(dateStr).trim()
  const parts = s.split(/[-/]/)
  if (parts.length !== 3) return null

  const yearFirst = parts[0].length === 4
  const year = Number(yearFirst ? parts[0] : parts[2])
  const month = Number(parts[1]) - 1
  const day = Number(yearFirst ? parts[2] : parts[0])
  const date = new Date(year, month, day)

  return Number.isNaN(date.getTime()) ? null : date
}

const alertSources = [
  { key: 'fitness', name: 'Fitness', documentType: 'Fitness', model: Fitness, dateField: 'validTo', ownerField: 'ownerName' },
  { key: 'tax', name: 'Tax', documentType: 'Tax', model: Tax, dateField: 'taxTo', ownerField: 'ownerName' },
  { key: 'puc', name: 'PUC', documentType: 'Puc', model: Puc, dateField: 'validTo', ownerField: 'ownerName' },
  { key: 'gps', name: 'GPS', documentType: 'Gps', model: Gps, dateField: 'validTo', ownerField: 'ownerName' },
  { key: 'insurance', name: 'Insurance', documentType: 'Insurance', model: Insurance, dateField: 'validTo', ownerField: 'ownerName' },
  { key: 'nationalPermit', name: 'NP', documentType: 'NationalPermit', model: NationalPermit, dateField: 'partBValidTo', ownerField: 'permitHolder', query: { isRenewed: false } },
  { key: 'statePermit', name: 'State Permit', documentType: 'CgPermit', model: CgPermit, dateField: 'validTo', ownerField: 'permitHolder', query: { isRenewed: false } },
  { key: 'busPermit', name: 'Bus Permit', documentType: 'BusPermit', model: BusPermit, dateField: 'validTo', ownerField: 'permitHolder', query: { isRenewed: false } }
]

const getAlertForDay = (diffDays, rule) => {
  const beforeDays = (rule.beforeDays || []).map(Number)
  const afterDays = (rule.afterDays || []).map(Number)

  if (diffDays > 0 && beforeDays.includes(diffDays)) {
    return {
      type: 'upcoming',
      key: `before-${diffDays}`,
      label: `expires in ${diffDays} day${diffDays === 1 ? '' : 's'}`
    }
  }

  if (diffDays === 0 && rule.sendOnExpiryDay === true) {
    return {
      type: 'today',
      key: 'today-0',
      label: 'expires TODAY'
    }
  }

  if (diffDays < 0 && rule.sendAfterExpiry === true) {
    const daysPast = Math.abs(diffDays)
    if (afterDays.includes(daysPast)) {
      return {
        type: 'expired',
        key: `after-${daysPast}`,
        label: `expired ${daysPast} days ago`
      }
    }
  }

  return null
}

const buildMessage = ({ alert, serviceName, vehicleNo, expiryDate }) => {
  if (alert.type === 'upcoming') {
    return `Dear Customer,\n\nYour *${serviceName}* document for vehicle *${vehicleNo}* will expire on *${expiryDate}* (${alert.label}).\n\nPlease renew it soon to avoid penalties.\n\n- RTO Services`
  }

  if (alert.type === 'today') {
    return `Dear Customer,\n\nYour *${serviceName}* document for vehicle *${vehicleNo}* *expires TODAY* (${expiryDate}).\n\nPlease renew urgently to avoid fines.\n\n- RTO Services`
  }

  return `Dear Customer,\n\nYour *${serviceName}* document for vehicle *${vehicleNo}* expired on *${expiryDate}* (${alert.label}).\n\nPlease renew immediately to avoid heavy fines.\n\n- RTO Services`
}

const checkUserAndQueueAlerts = async (specificUserId = null) => {
  try {
    console.log(`[WHATSAPP-CRON] Starting document expiry scan ${specificUserId ? `for user ${specificUserId}` : 'globally'}`)

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    let queuedCount = 0
    const userSettings = new Map()

    const getSettingForUser = async (uid) => {
      if (userSettings.has(uid)) return userSettings.get(uid)

      const setting = await WhatsAppSetting.findOne({ userId: uid }).lean()
      const normalized = normalizeAlertSettings(setting || {})
      userSettings.set(uid, normalized)
      return normalized
    }

    for (const source of alertSources) {
      const query = {
        ...(source.query || {}),
        mobileNumber: { $exists: true, $nin: [null, '', undefined] }
      }
      if (specificUserId) query.userId = specificUserId

      const docs = await source.model.find(query).lean()
      console.log(`[WHATSAPP-CRON] ${source.name}: checking ${docs.length} docs with mobile numbers`)

      for (const doc of docs) {
        if (!doc.userId) continue

        const docUserId = doc.userId.toString()
        const setting = await getSettingForUser(docUserId)
        const rule = setting.alertRules[source.key]

        if (!rule || rule.enabled === false) continue

        const expiryDate = parseDocDate(doc[source.dateField])
        if (!expiryDate) continue

        const diffDays = Math.round((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        const alert = getAlertForDay(diffDays, rule)
        if (!alert) continue

        const alreadyQueued = await MessageLog.findOne({
          userId: docUserId,
          documentId: doc._id,
          documentType: source.documentType,
          status: { $in: ['pending', 'sent'] },
          alertKey: alert.key
        })

        if (alreadyQueued) continue

        const vehicleNo = doc.vehicleNumber || 'your vehicle'
        const mobileNumber = String(doc.mobileNumber).trim()
        const messageBody = buildMessage({
          alert,
          serviceName: source.name,
          vehicleNo,
          expiryDate: doc[source.dateField]
        })

        await MessageLog.create({
          userId: docUserId,
          documentId: doc._id,
          documentType: source.documentType,
          targetNumber: mobileNumber,
          ownerName: doc[source.ownerField] || doc.ownerName || doc.partyName || 'Unknown Owner',
          messageBody,
          alertKey: alert.key,
          status: 'pending',
          scheduledFor: new Date()
        })

        queuedCount++
        console.log(`[WHATSAPP-CRON:${docUserId}] Queued: ${source.name} | ${vehicleNo} | ${mobileNumber} | ${alert.label}`)
      }
    }

    console.log(`[WHATSAPP-CRON] Scan complete: ${queuedCount} new alerts queued`)
    return queuedCount
  } catch (error) {
    console.error('[WHATSAPP-CRON] Error during expiry scan:', error)
    throw error
  }
}

const initWhatsAppDailyChecker = () => {
  cron.schedule('30 8 * * *', () => {
    checkUserAndQueueAlerts(null)
  })
  console.log('[CRON] WhatsApp Daily Expiry Checker initiated (runs at 08:30 AM daily)')
}

module.exports = {
  initWhatsAppDailyChecker,
  checkUserAndQueueAlerts
}
