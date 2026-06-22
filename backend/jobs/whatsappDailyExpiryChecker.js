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
const TemporaryPermit = require('../models/TemporaryPermit')
const User = require('../models/User')
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

const escapeRegExp = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const alertSources = [
  { key: 'fitness', name: 'Fitness', documentType: 'Fitness', model: Fitness, dateField: 'validTo', ownerField: 'ownerName' },
  { key: 'tax', name: 'Tax', documentType: 'Tax', model: Tax, dateField: 'taxTo', ownerField: 'ownerName', query: { isRenewed: { $ne: true } } },
  { key: 'puc', name: 'PUC', documentType: 'Puc', model: Puc, dateField: 'validTo', ownerField: 'ownerName', query: { isRenewed: { $ne: true } } },
  { key: 'gps', name: 'GPS', documentType: 'Gps', model: Gps, dateField: 'validTo', ownerField: 'ownerName' },
  { key: 'insurance', name: 'Insurance', documentType: 'Insurance', model: Insurance, dateField: 'validTo', ownerField: 'policyHolderName', query: { isRenewed: { $ne: true } } },
  { key: 'statePermit', name: 'State Permit', documentType: 'CgPermit', model: CgPermit, dateField: 'validTo', ownerField: 'permitHolder', query: { isRenewed: false } },
  { key: 'busPermit', name: 'Bus Permit', documentType: 'BusPermit', model: BusPermit, dateField: 'validTo', ownerField: 'permitHolder', query: { isRenewed: false } },
  { key: 'temporaryPermit', name: 'Temp Permit', documentType: 'TemporaryPermit', model: TemporaryPermit, dateField: 'validTo', ownerField: 'permitHolder', query: { isRenewed: false } }
]

const nationalPermitParts = [
  { partKey: 'partA', partLabel: 'Part A', dateField: 'partAValidTo' },
  { partKey: 'partB', partLabel: 'Part B', dateField: 'partBValidTo' }
]

const getAlertForDay = (diffDays, rule) => {
  // Sort ascending so we match the SMALLEST threshold that diffDays fits within
  // e.g. beforeDays=[7,3], diffDays=4: 4 ≤ 3? No → 4 ≤ 7? Yes → key 'before-7'
  // e.g. beforeDays=[7,3], diffDays=3: 3 ≤ 3? Yes → key 'before-3' (new key = fallback sends)
  const beforeDays = [...(rule.beforeDays || [])].map(Number).sort((a, b) => a - b)
  const afterDays = [...(rule.afterDays || [])].map(Number).sort((a, b) => a - b)

  if (diffDays > 0) {
    for (const threshold of beforeDays) {
      if (diffDays <= threshold) {
        return {
          type: 'upcoming',
          key: `before-${threshold}`,
          label: `expires in ${diffDays} day${diffDays === 1 ? '' : 's'}`
        }
      }
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
    for (const threshold of afterDays) {
      if (daysPast <= threshold) {
        return {
          type: 'expired',
          key: `after-${threshold}`,
          label: `expired ${daysPast} days ago`
        }
      }
    }
  }

  return null
}

const formatMessageFooter = (signature, address) => {
  let footer = `\n\n────────────────\n*${signature}*`
  if (address) footer += `\n\n📍 ${address}`
  return footer
}

const buildMessage = ({ alert, serviceName, vehicleNo, expiryDate, signature = 'RTO Services', address = '', customTemplate = null }) => {
  let alertLabel = ''
  if (alert.type === 'upcoming') alertLabel = `Expires on *${expiryDate}* _(${alert.label})_`
  else if (alert.type === 'today') alertLabel = `🔴 *Expires TODAY*`
  else alertLabel = `❌ Expired on *${expiryDate}* _(${alert.label})_`

  if (customTemplate) {
    let msg = customTemplate
    msg = msg.replace(/\{serviceName\}/g, serviceName)
    msg = msg.replace(/\{vehicleNo\}/g, vehicleNo)
    msg = msg.replace(/\{expiryDate\}/g, expiryDate)
    msg = msg.replace(/\{alertLabel\}/g, alertLabel)
    msg = msg.replace(/\{signature\}/g, signature)
    if (address && address.trim() !== '') {
      msg = msg.replace(/\{address\}/g, `📍 ${address}`)
    } else {
      msg = msg.replace(/\{address\}/g, '')
    }
    return msg
  }

  const footer = formatMessageFooter(signature, address)
  const docLine = `📄 *${serviceName}* · 🚗 *${vehicleNo}*`

  if (alert.type === 'upcoming') {
    return `Dear Customer,\n\n${docLine}\n📅 Expires on *${expiryDate}* _(${alert.label})_\n\n⚠️ Please visit for renewal to avoid penalties.${footer}`
  }

  if (alert.type === 'today') {
    return `Dear Customer,\n\n${docLine}\n🔴 *Expires TODAY* · *${expiryDate}*\n\n⚠️ Please renew urgently to avoid fines.${footer}`
  }

  return `Dear Customer,\n\n${docLine}\n❌ Expired on *${expiryDate}* _(${alert.label})_\n\n⚠️ Please renew immediately to avoid heavy fines.${footer}`
}

const getNationalPermitPartLine = ({ partLabel, alert, expiryText }) => {
  if (alert.type === 'upcoming') {
    return `- *${partLabel}* will expire on *${expiryText}* (${alert.label})`
  }

  if (alert.type === 'today') {
    return `- *${partLabel}* expires TODAY (*${expiryText}*)`
  }

  return `- *${partLabel}* expired on *${expiryText}* (${alert.label})`
}

const buildNationalPermitMessage = ({ partAlerts, vehicleNo, signature = 'RTO Services', address = '', customTemplate = null }) => {
  const lines = partAlerts.map(getNationalPermitPartLine).join('\n')

  if (partAlerts.length > 1) {
    if (customTemplate) {
      let msg = customTemplate
      msg = msg.replace(/\{serviceName\}/g, 'National Permit')
      msg = msg.replace(/\{vehicleNo\}/g, vehicleNo)
      msg = msg.replace(/\{expiryDate\}/g, '')
      msg = msg.replace(/\{alertLabel\}/g, `Both *Part A* and *Part B* are due:\n${lines}`)
      msg = msg.replace(/\{signature\}/g, signature)
      if (address && address.trim() !== '') {
        msg = msg.replace(/\{address\}/g, `📍 ${address}`)
      } else {
        msg = msg.replace(/\{address\}/g, '')
      }
      return msg
    }

    const footer = formatMessageFooter(signature, address)
    return `Dear Customer,\n\n📄 *National Permit* · 🚗 *${vehicleNo}*\nBoth *Part A* and *Part B* are due:\n${lines}\n\n⚠️ Please visit for renewal to avoid penalties.${footer}`
  }

  const part = partAlerts[0]
  const serviceName = `NP ${part.partLabel}`
  return buildMessage({
    alert: part.alert,
    serviceName,
    vehicleNo,
    expiryDate: part.expiryText,
    signature,
    address,
    customTemplate
  })
}

const checkUserAndQueueAlerts = async (specificUserId = null) => {
  try {
    console.log(`[WHATSAPP-CRON] Starting document expiry scan ${specificUserId ? `for user ${specificUserId}` : 'globally'}`)

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    let queuedCount = 0
    const userSettings = new Map()
    const userInfos = new Map()

    const getSettingForUser = async (uid) => {
      if (userSettings.has(uid)) return userSettings.get(uid)

      const setting = await WhatsAppSetting.findOne({ userId: uid }).lean()
      const normalized = normalizeAlertSettings(setting || {})
      userSettings.set(uid, normalized)
      return normalized
    }

    const getUserInfo = async (uid) => {
      if (userInfos.has(uid)) return userInfos.get(uid)
      const user = await User.findById(uid).lean()
      const info = {
        signature: user?.billName || user?.name || 'RTO Services',
        address: user?.address?.trim() || ''
      }
      userInfos.set(uid, info)
      return info
    }

    for (const source of alertSources) {
      const query = {
        ...(source.query || {}),
        mobileNumber: { $exists: true, $nin: [null, '', undefined] }
      }
      if (specificUserId) query.userId = specificUserId

      const docs = await source.model.find(query).lean()
      console.log(`[WHATSAPP-CRON] ${source.name}: checking ${docs.length} docs with mobile numbers`)

      // For services with active-status tracking, exclude vehicles that already have an active record
      const activeCheckModels = {
        insurance: Insurance,
        tax: Tax,
        puc: Puc
      }
      let vehiclesWithActiveService = null
      if (activeCheckModels[source.key]) {
        const Model = activeCheckModels[source.key]
        const activeQuery = { status: 'active' }
        if (specificUserId) activeQuery.userId = specificUserId
        const activeRecords = await Model.find(activeQuery).select('vehicleNumber userId').lean()
        vehiclesWithActiveService = new Set(
          activeRecords.map(r => `${r.userId.toString()}:${r.vehicleNumber}`)
        )
      }

      for (const doc of docs) {
        if (!doc.userId) continue

        // Skip records for vehicles that have an active record of the same service
        if (activeCheckModels[source.key] && vehiclesWithActiveService) {
          const key = `${doc.userId.toString()}:${doc.vehicleNumber}`
          if (vehiclesWithActiveService.has(key)) {
            continue
          }
        }

        const docUserId = doc.userId.toString()
        const setting = await getSettingForUser(docUserId)
        const rule = setting.alertRules[source.key]

        if (!rule || rule.enabled === false) continue

        const expiryDate = parseDocDate(doc[source.dateField])
        if (!expiryDate) continue

        const diffDays = Math.round((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        const alert = getAlertForDay(diffDays, rule)
        if (!alert) continue

        const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000)

        // Clear stale pending for this specific bucket — if WhatsApp was down
        // and the message stayed pending for 2+ hours, delete it so we can retry today
        await MessageLog.deleteMany({
          userId: docUserId,
          documentId: doc._id,
          documentType: source.documentType,
          status: 'pending',
          alertKey: alert.key,
          scheduledFor: { $lt: twoHoursAgo }
        })

        // Now check if this bucket already has a sent or recently-pending message
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
        const userInfo = await getUserInfo(docUserId)
        const messageBody = buildMessage({
          alert,
          serviceName: source.name,
          vehicleNo,
          expiryDate: doc[source.dateField],
          signature: userInfo.signature,
          address: userInfo.address,
          customTemplate: rule.customMessage
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

    const nationalPermitQuery = {
      isRenewed: false,
      mobileNumber: { $exists: true, $nin: [null, '', undefined] }
    }
    if (specificUserId) nationalPermitQuery.userId = specificUserId

    const nationalPermits = await NationalPermit.find(nationalPermitQuery).lean()
    console.log(`[WHATSAPP-CRON] NP: checking ${nationalPermits.length} docs with mobile numbers`)

    for (const doc of nationalPermits) {
      if (!doc.userId) continue

      const docUserId = doc.userId.toString()
      const setting = await getSettingForUser(docUserId)
      const rule = setting.alertRules.nationalPermit

      if (!rule || rule.enabled === false) continue

      const partAlerts = nationalPermitParts
        .map((part) => {
          const expiryDate = parseDocDate(doc[part.dateField])
          if (!expiryDate) return null

          const diffDays = Math.round((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
          const alert = getAlertForDay(diffDays, rule)
          if (!alert) return null

          return {
            ...part,
            alert,
            alertKey: `${part.partKey}-${alert.key}`,
            expiryText: doc[part.dateField]
          }
        })
        .filter(Boolean)

      if (!partAlerts.length) continue

      const missingPartAlerts = []

      for (const partAlert of partAlerts) {
        const alreadyQueued = await MessageLog.findOne({
          userId: docUserId,
          documentId: doc._id,
          documentType: 'NationalPermit',
          status: { $in: ['pending', 'sent'] },
          alertKey: { $regex: `(^|__)${escapeRegExp(partAlert.alertKey)}($|__)` }
        })

        if (!alreadyQueued) {
          missingPartAlerts.push(partAlert)
        }
      }

      if (!missingPartAlerts.length) continue

      const alertKey = missingPartAlerts.map((partAlert) => partAlert.alertKey).join('__')
      const alreadyQueuedCombined = await MessageLog.findOne({
        userId: docUserId,
        documentId: doc._id,
        documentType: 'NationalPermit',
        status: { $in: ['pending', 'sent'] },
        alertKey
      })

      if (alreadyQueuedCombined) continue

      const vehicleNo = doc.vehicleNumber || 'your vehicle'
      const mobileNumber = String(doc.mobileNumber).trim()
      const userInfo = await getUserInfo(docUserId)
      const messageBody = buildNationalPermitMessage({
        partAlerts: missingPartAlerts,
        vehicleNo,
        signature: userInfo.signature,
        address: userInfo.address,
        customTemplate: rule.customMessage
      })

      await MessageLog.create({
        userId: docUserId,
        documentId: doc._id,
        documentType: 'NationalPermit',
        targetNumber: mobileNumber,
        ownerName: doc.permitHolder || doc.ownerName || doc.partyName || 'Unknown Owner',
        messageBody,
        alertKey,
        status: 'pending',
        scheduledFor: new Date()
      })

      queuedCount++
      const partLabels = missingPartAlerts.map((partAlert) => partAlert.partLabel).join(' + ')
      console.log(`[WHATSAPP-CRON:${docUserId}] Queued: NP ${partLabels} | ${vehicleNo} | ${mobileNumber}`)
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
