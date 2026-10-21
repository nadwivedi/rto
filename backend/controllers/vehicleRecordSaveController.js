const mongoose = require('mongoose')
const User = require('../models/User')
const VehicleRegistration = require('../models/VehicleRegistration')
const Fitness = require('../models/Fitness')
const Insurance = require('../models/Insurance')
const Puc = require('../models/Puc')
const VehicleSearchHistory = require('../models/VehicleSearchHistory')
const { checkUserAndQueueAlerts } = require('../jobs/whatsappDailyExpiryChecker')
const { parseExpiryDate } = require('../utils/vehicleExpiry')

// RC lookup values come back as text; 'NA' / '-' mean "not available"
const clean = (value) => {
  const text = String(value ?? '').trim()
  return !text || /^(NA|N\/A|-|NULL)$/i.test(text) ? '' : text
}

const firstOf = (data, keys) => keys.map(key => clean(data[key])).find(Boolean) || ''

const toNumber = (value) => {
  const n = Number(String(value ?? '').replace(/[^\d.]/g, ''))
  return Number.isFinite(n) && n > 0 ? n : undefined
}

// Masked numbers like XXXXXX1234 are useless for reminders, so only a full 10-digit mobile is kept
const cleanMobile = (value) => {
  const digits = String(value || '').replace(/\D/g, '').slice(-10)
  return /^[6-9]\d{9}$/.test(digits) ? digits : ''
}

// 'YYYY-MM-DD' <-> the DD-MM-YYYY text the app stores
const isoToDmy = (iso) => {
  const [y, m, d] = iso.split('-')
  return `${d}-${m}-${y}`
}
const dmyToTime = (dmy) => {
  const [d, m, y] = String(dmy || '').split(/[-/]/).map(Number)
  const time = Date.UTC(y, m - 1, d)
  return Number.isNaN(time) ? NaN : time
}

// Start of a validity period that ends on `iso`, e.g. 1 year ending 14-06-2027 starts 15-06-2026
const periodStart = (iso, { years = 0, months = 0 }) => {
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(Date.UTC(y - years, m - 1 - months, d))
  date.setUTCDate(date.getUTCDate() + 1)
  return isoToDmy(date.toISOString().slice(0, 10))
}

// Same rule as the fitness / insurance / PUC controllers: expired, within 30 days, or active
const statusFor = (validTo) => {
  const today = new Date()
  const todayTime = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
  const daysLeft = (dmyToTime(validTo) - todayTime) / 86400000
  if (daysLeft < 0) return 'expired'
  if (daysLeft <= 30) return 'expiring_soon'
  return 'active'
}

const todayDmy = () => {
  const d = new Date()
  return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`
}

// RC details -> Vehicle Registration fields
const registrationFields = (data) => ({
  dateOfRegistration: parseExpiryDate(clean(data.REGN_DT)) ? isoToDmy(parseExpiryDate(clean(data.REGN_DT))) : '',
  chassisNumber: clean(data.CHASI_NO),
  engineNumber: clean(data.ENG_NO),
  ownerName: clean(data.OWNER_NAME),
  sonWifeDaughterOf: clean(data.F_NAME),
  address: firstOf(data, ['PRESENT_ADDRESS', 'PERMANENT_ADDRESS']),
  mobileNumber: cleanMobile(data.MOBILE_NO),
  makerName: clean(data.MAKER_DESC),
  makerModel: clean(data.MAKER_MODEL),
  colour: clean(data.COLOR),
  seatingCapacity: toNumber(data.SEATING_CAPACITY),
  vehicleClass: clean(data.VEHICLE_CLASS),
  vehicleCategory: clean(data.VEHICLE_CATEGORY),
  unladenWeight: toNumber(data.UNLADEN_WEIGHT),
  manufactureYear: (clean(data.MANU_MONTH_YR).match(/\d{4}/) || [''])[0],
  cubicCapacity: toNumber(data.CUBIC_CAPACITY),
  fuelType: clean(data.FUEL_DESC),
  bodyType: clean(data.BODY_TYPE_DESC)
})

// Creates the vehicle, or fills in only the fields that are still blank on an existing one
const saveRegistration = async (userId, vehicleNumber, data) => {
  const fields = registrationFields(data)
  const existing = await VehicleRegistration.findOne({ userId, registrationNumber: vehicleNumber })

  if (!existing) {
    const vehicle = await VehicleRegistration.create({
      ...Object.fromEntries(Object.entries(fields).filter(([, value]) => value !== '' && value !== undefined)),
      chassisNumber: fields.chassisNumber || 'N/A',
      registrationNumber: vehicleNumber,
      userId
    })
    return { vehicle, result: { status: 'created' } }
  }

  let filled = 0
  Object.entries(fields).forEach(([key, value]) => {
    const current = existing[key]
    const isBlank = current === undefined || current === null || current === '' || (key === 'chassisNumber' && current === 'N/A')
    if (isBlank && value !== '' && value !== undefined) {
      existing[key] = value
      filled++
    }
  })
  if (filled) await existing.save()
  return { vehicle: existing, result: { status: filled ? 'updated' : 'exists' } }
}

// Adds a fee-free document record (fitness / insurance / PUC) for the RC's validity,
// unless the vehicle already has a record valid up to that date or later
const saveDocument = async (Model, { userId, vehicleNumber, validToIso, validFrom, fields }) => {
  if (!validToIso) return { status: 'skipped', message: 'No valid upto date on RC' }

  const validTo = isoToDmy(validToIso)
  const newTime = dmyToTime(validTo)
  const existing = await Model.find({ userId, vehicleNumber }).select('validTo').lean()
  if (existing.some(record => dmyToTime(record.validTo) >= newTime)) {
    return { status: 'exists', validTo }
  }

  // Same as adding a record by hand: older records for this vehicle count as renewed
  await Model.updateMany(
    { userId, vehicleNumber, isRenewed: false },
    { $set: { status: 'expired', isRenewed: true } }
  )

  await Model.create({
    ...fields,
    vehicleNumber,
    validFrom,
    validTo,
    totalFee: 0,
    paid: 0,
    balance: 0,
    status: statusFor(validTo),
    userId
  })
  return { status: 'created', validFrom, validTo }
}

/**
 * Saves the RC details on screen into the user's own sections (NO API call):
 * Vehicle Registration, Fitness, Insurance and PUC, with every fee set to 0.
 * Switched on per user from the admin panel (features.saveVehicleRecords).
 */
const saveVehicleRecords = async (req, res) => {
  try {
    const userId = req.user.id
    const userDoc = await User.findById(userId).select('features').lean()
    if (!userDoc?.features?.saveVehicleRecords) {
      return res.status(403).json({ success: false, message: 'Save vehicle records is not enabled for your account. Please contact admin.' })
    }

    // RC details on screen, or a saved search history record (by id)
    let data = req.body?.data
    if (req.body?.historyId) {
      if (!mongoose.isValidObjectId(req.body.historyId)) {
        return res.status(400).json({ success: false, message: 'Invalid history record' })
      }
      const record = await VehicleSearchHistory.findOne({ _id: req.body.historyId, userId }).select('vehicleNumber rawResponse').lean()
      data = record?.rawResponse && { ...record.rawResponse, REGN_NO: record.rawResponse.REGN_NO || record.vehicleNumber }
    }
    const vehicleNumber = String(data?.REGN_NO || '').replace(/[\s-]/g, '').toUpperCase()
    if (!data || typeof data !== 'object' || vehicleNumber.length < 4) {
      return res.status(400).json({ success: false, message: 'Vehicle details are required' })
    }

    const { vehicle, result: registration } = await saveRegistration(userId, vehicleNumber, data)

    const ownerName = clean(data.OWNER_NAME)
    const mobileNumber = cleanMobile(data.MOBILE_NO)
    const common = { userId, vehicleNumber }
    const shared = { ownerName, mobileNumber, partyId: vehicle.partyId || undefined, date: todayDmy() }

    const fitnessUpto = parseExpiryDate(clean(data.FIT_UPTO))
    const fitness = await saveDocument(Fitness, {
      ...common,
      validToIso: fitnessUpto,
      validFrom: fitnessUpto && periodStart(fitnessUpto, { years: 1 }),
      fields: shared
    })

    const insuranceUpto = parseExpiryDate(clean(data.INSURANCE_UPTO))
    const insuranceFrom = parseExpiryDate(clean(data.INSURANCE_FROM))
    const insurance = await saveDocument(Insurance, {
      ...common,
      validToIso: insuranceUpto,
      validFrom: insuranceFrom ? isoToDmy(insuranceFrom) : insuranceUpto && periodStart(insuranceUpto, { years: 1 }),
      fields: {
        policyNumber: firstOf(data, ['INS_POLICY_NO', 'POLICY_NO']),
        policyHolderName: ownerName,
        insuranceCompany: clean(data.INSURANCE_COMP),
        mobileNumber,
        partyId: shared.partyId,
        date: shared.date
      }
    })

    const pucUpto = parseExpiryDate(firstOf(data, ['PUCC_UPTO', 'PUC_UPTO']))
    const pucFrom = parseExpiryDate(firstOf(data, ['PUCC_FROM', 'PUC_FROM']))
    const puc = await saveDocument(Puc, {
      ...common,
      validToIso: pucUpto,
      validFrom: pucFrom ? isoToDmy(pucFrom) : pucUpto && periodStart(pucUpto, { months: 6 }),
      fields: { ...shared, vehicleModel: clean(data.MAKER_MODEL) }
    })

    if ([fitness, insurance, puc].some(r => r.status === 'created')) {
      try { checkUserAndQueueAlerts(userId) } catch (e) { console.error('[WhatsApp] Trigger error (save vehicle records):', e) }
    }

    return res.status(200).json({
      success: true,
      message: `Records saved for ${vehicleNumber}`,
      data: { vehicleNumber, registration, fitness, insurance, puc }
    })
  } catch (error) {
    console.error('Save vehicle records error:', error)
    return res.status(500).json({ success: false, message: 'Failed to save vehicle records', error: error.message })
  }
}

module.exports = { saveVehicleRecords }
