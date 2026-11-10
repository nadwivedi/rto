// Decides whether an expiry reminder is still needed for a document.
// A vehicle can have an old record that is expiring / expired and a newer record of the same
// document (renewal, or a record added later) that is still valid. The reminder is only for the
// record with the latest expiry date — older ones are covered by the newer record.
const Tax = require('../models/Tax')
const Fitness = require('../models/Fitness')
const Puc = require('../models/Puc')
const Gps = require('../models/Gps')
const Insurance = require('../models/Insurance')
const NationalPermit = require('../models/NationalPermit')
const CgPermit = require('../models/CgPermit')
const BusPermit = require('../models/BusPermit')
const TemporaryPermit = require('../models/TemporaryPermit')

// documentType (as stored in MessageLog) -> model + expiry date field(s)
const EXPIRY_DOCUMENTS = {
  Tax: { model: Tax, dateFields: ['taxTo'] },
  Fitness: { model: Fitness, dateFields: ['validTo'] },
  Puc: { model: Puc, dateFields: ['validTo'] },
  Gps: { model: Gps, dateFields: ['validTo'] },
  Insurance: { model: Insurance, dateFields: ['validTo'] },
  CgPermit: { model: CgPermit, dateFields: ['validTo'] },
  BusPermit: { model: BusPermit, dateFields: ['validTo'] },
  TemporaryPermit: { model: TemporaryPermit, dateFields: ['validTo'] },
  NationalPermit: { model: NationalPermit, dateFields: ['partAValidTo', 'partBValidTo'] }
}

const normalizeVehicle = (value) => String(value || '').replace(/[\s-]/g, '').toUpperCase()

// 'DD-MM-YYYY', 'DD/MM/YYYY' or 'YYYY-MM-DD' -> ms timestamp (NaN when unreadable)
const docDateTime = (value) => {
  if (!value) return NaN
  if (value instanceof Date) return value.getTime()
  const parts = String(value).trim().split(/[-/]/)
  if (parts.length !== 3) return NaN
  const yearFirst = parts[0].length === 4
  const year = Number(yearFirst ? parts[0] : parts[2])
  const month = Number(parts[1]) - 1
  const day = Number(yearFirst ? parts[2] : parts[0].slice(0, 2))
  return Date.UTC(year, month, day)
}

const vehicleKey = (userId, vehicleNumber) => `${String(userId)}:${normalizeVehicle(vehicleNumber)}`

// Latest expiry date per user + vehicle, for one date field of one document type.
// Returns a lookup: (doc) => true when another record of the vehicle expires later than `doc`.
const buildSupersededCheck = async (documentType, dateField, userId = null) => {
  const { model } = EXPIRY_DOCUMENTS[documentType]
  const query = userId ? { userId } : {}
  const records = await model.find(query).select(`userId vehicleNumber ${dateField}`).lean()

  const latest = new Map()
  for (const record of records) {
    if (!record.userId || !record.vehicleNumber) continue
    const time = docDateTime(record[dateField])
    if (Number.isNaN(time)) continue
    const key = vehicleKey(record.userId, record.vehicleNumber)
    if (!latest.has(key) || time > latest.get(key)) latest.set(key, time)
  }

  return (doc) => {
    if (!doc?.userId || !doc.vehicleNumber) return false
    const time = docDateTime(doc[dateField])
    if (Number.isNaN(time)) return false
    const newest = latest.get(vehicleKey(doc.userId, doc.vehicleNumber))
    return newest !== undefined && newest > time
  }
}

const escapeRegExp = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// For a queued reminder: true when the vehicle now has a newer record of the same document,
// so the reminder should not go out. Unknown types / missing documents return false.
const isReminderSuperseded = async ({ documentType, documentId, alertKey }) => {
  const config = EXPIRY_DOCUMENTS[documentType]
  if (!config || !documentId) return false

  const doc = await config.model.findById(documentId).lean()
  if (!doc || !doc.userId || !doc.vehicleNumber) return false
  if (doc.isRenewed === true) return true

  // National Permit reminders name their part(s) in the alert key ('partA-before-7__partB-...')
  let dateFields = config.dateFields
  if (documentType === 'NationalPermit' && alertKey) {
    const named = dateFields.filter((field) => alertKey.includes(field.replace('ValidTo', '')))
    if (named.length) dateFields = named
  }

  const others = await config.model.find({
    _id: { $ne: doc._id },
    userId: doc.userId,
    vehicleNumber: { $regex: `^${normalizeVehicle(doc.vehicleNumber).split('').map(escapeRegExp).join('[\\s-]*')}$`, $options: 'i' }
  }).select(`${dateFields.join(' ')} status`).lean()

  // Another record of the vehicle is marked active (not used for NP, which has a status per part)
  if (documentType !== 'NationalPermit' && others.some((other) => other.status === 'active')) return true

  // Every part the reminder is about must be covered by a newer record
  return dateFields.every((field) => {
    const time = docDateTime(doc[field])
    if (Number.isNaN(time)) return true
    return others.some((other) => docDateTime(other[field]) > time)
  })
}

module.exports = {
  EXPIRY_DOCUMENTS,
  normalizeVehicle,
  docDateTime,
  buildSupersededCheck,
  isReminderSuperseded
}
