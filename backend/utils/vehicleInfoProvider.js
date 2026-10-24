const axios = require('axios')
const ApiUsage = require('../models/ApiUsage')
const ProviderCharge = require('../models/ProviderCharge')

const VEHICLE_INFO_PROVIDER = 'vehicleInfo'

const toNumber = (value) => {
  const n = Number(value)
  return value !== null && value !== '' && Number.isFinite(n) ? n : undefined
}

/**
 * Did this lookup use one of our provider credits? The provider's `used` counter goes up by
 * one for every credit, so each new value is saved once (unique index). Seeing a value that
 * is already saved means the provider did not charge for this call.
 * Resolves to true / false, or null when the reply has no counter (caller decides).
 */
const providerCharged = async (usage, vehicleNumber) => {
  const used = toNumber(usage?.used)
  if (used === undefined) return null
  const totalLimit = toNumber(usage.total_limit)
  try {
    await ProviderCharge.create({
      provider: VEHICLE_INFO_PROVIDER,
      totalLimit: totalLimit ?? null,
      used,
      remaining: toNumber(usage.remaining),
      vehicleNumber
    })
    return true
  } catch (err) {
    if (err?.code === 11000) return false
    console.error('Failed to check provider charge:', err.message)
    return null
  }
}

/**
 * The provider reports its own account quota on every response as
 * `_usage: { total_limit, used, remaining }`. Keep the latest snapshot so the
 * admin panel can show how many searches are left. Never throws - a failure
 * here must not break the vehicle lookup.
 */
const recordProviderUsage = async (usage, { vehicleNumber, userId } = {}) => {
  if (!usage || typeof usage !== 'object') return

  const totalLimit = toNumber(usage.total_limit)
  const used = toNumber(usage.used)
  const remaining = toNumber(usage.remaining)
  if (totalLimit === undefined && used === undefined && remaining === undefined) return

  // Only write the fields the provider actually sent, so a partial reply can't blank the rest
  const snapshot = { checkedAt: new Date() }
  if (totalLimit !== undefined) snapshot.totalLimit = totalLimit
  if (used !== undefined) snapshot.used = used
  if (remaining !== undefined) snapshot.remaining = remaining
  if (vehicleNumber) snapshot.lastVehicleNumber = vehicleNumber
  if (userId) snapshot.lastUserId = userId

  try {
    await ApiUsage.findOneAndUpdate(
      { provider: VEHICLE_INFO_PROVIDER },
      { $set: snapshot },
      { upsert: true, setDefaultsOnInsert: true }
    )
  } catch (err) {
    console.error('Failed to record vehicle API usage:', err.message)
  }
}

const NOT_FOUND_TEXT = /not\s*found|no\s*record|invalid/i
const DETAIL_FIELDS = ['OWNER_NAME', 'MAKER_DESC', 'MAKER_MODEL', 'VEHICLE_CLASS', 'CHASI_NO', 'ENG_NO', 'REGN_DT']

/**
 * The provider answers an unknown number with a normal-looking reply such as
 * { REGN_NO: 'Vehicle Details not Found' } and no error flag. Treat a reply as a
 * real vehicle only when at least one detail field holds a real value.
 */
const hasVehicleDetails = (data) =>
  DETAIL_FIELDS.some((field) => {
    const value = String(data[field] ?? '').trim()
    return value !== '' && !NOT_FOUND_TEXT.test(value)
  })

// 'cg 04-ab 1234' -> 'CG04AB1234'
const cleanVehicleNumber = (raw) => String(raw || '').replace(/[\s-]/g, '').toUpperCase()

// The vehicle info sources an API key can be set to use (ApiKey.provider)
const PROVIDERS = {
  api1: 'API 1 (informationapi.shop)',
  api2: 'API 2'
}

// API 2 field names (any case) -> the names API 1 uses, so every customer gets the same JSON.
// Its cubic_capacity and seating_capacity are left out: they come back with the same values
// even when no vehicle is found.
const API2_FIELDS = {
  REGN_NO: ['regno', 'vehicle_number'],
  STATUS: ['rc_status', 'vehicle_status'],
  REGISTERED_AT: [],
  REGN_DT: ['registrationdate', 'regdate', 'reg_date'],
  REGN_UPTO: ['regn_upto', 'registration_upto'],
  OWNER_NAME: ['owner_name'],
  OWNER_SERIAL_NO: ['owner_serial_no'],
  MAKER_DESC: ['make', 'maker'],
  MAKER_MODEL: ['model'],
  VEHICLE_CLASS: ['vehicle_class'],
  BODY_TYPE: ['body_type'],
  FUEL_DESC: ['fuel_type', 'fueltype'],
  NORMS_DESC: ['norms_desc', 'fuel_norms'],
  CUBIC_CAP: ['engine_cc', 'cc', 'enginecc', 'enginecapacity'],
  SEAT_CAP: [],
  COLOR: ['color', 'colour'],
  MANU_MONTH_YR: ['mfg_mnth_yr'],
  CHASI_NO: ['chassisno', 'chassis_no'],
  ENG_NO: ['engineno', 'engine_no'],
  FINANCER_DETAILS: ['financer_name', 'hypo'],
  INSURANCE_COMP: ['ins_company', 'insurance_company'],
  INS_POLICY_NO: ['policy_no', 'insurance_policy_no'],
  INSURANCE_UPTO: ['prevpolicyexpirydate', 'f_prevpolicyexpirydate', 'insurance_upto'],
  PUCC_NO: ['pucc_no', 'puc_no'],
  PUCC_UPTO: ['pucc_upto', 'puc_upto'],
  FIT_UPTO: ['fitness_upto', 'fit_upto'],
  TAX_UPTO: ['tax_upto'],
  PERMIT_TYPE: ['permit_type'],
  BLACKLIST_STATUS: ['blacklist_status'],
  NOC_DETAILS: ['noc_details']
}
const API2_DATE_FIELDS = ['REGN_DT', 'REGN_UPTO', 'INSURANCE_UPTO', 'PUCC_UPTO', 'FIT_UPTO', 'TAX_UPTO']

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
// '2023-02-14' or '14/02/2023' -> '14-Feb-2023', the date format API 1 uses
const toApi1Date = (value) => {
  const s = String(value).trim()
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (m) return MONTHS[Number(m[2]) - 1] ? `${m[3]}-${MONTHS[Number(m[2]) - 1]}-${m[1]}` : s
  m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (m) return MONTHS[Number(m[2]) - 1] ? `${m[1]}-${MONTHS[Number(m[2]) - 1]}-${m[3]}` : s
  return s
}

// A value worth sending: not empty and not the provider's 'NA' placeholder
const isReal = (v) => v !== undefined && v !== null && !/^(|na|n\/a|null|none|-)$/i.test(String(v).trim())

const mapApi2Fields = (raw) => {
  const byName = new Map(Object.entries(raw).map(([k, v]) => [k.toLowerCase(), v]))
  const get = (...names) => names.map((n) => byName.get(n)).find(isReal)
  const data = {}
  for (const [field, names] of Object.entries(API2_FIELDS)) {
    const value = get(...names)
    if (value !== undefined) data[field] = typeof value === 'string' ? value.trim() : value
  }

  const owner = [get('firstname', 'first_name'), get('lastname', 'last_name')].filter(Boolean).join(' ').trim()
  if (!data.OWNER_NAME && owner) data.OWNER_NAME = owner
  const rtoName = get('rto_name')
  const rtoState = get('rto_state')
  if (rtoName) data.REGISTERED_AT = rtoState ? `${rtoName} RTO, ${rtoState}` : `${rtoName} RTO`
  const variant = get('variant')
  if (data.MAKER_MODEL && variant && !String(data.MAKER_MODEL).includes(variant)) data.MAKER_MODEL = `${data.MAKER_MODEL} ${variant}`
  for (const field of API2_DATE_FIELDS) if (data[field]) data[field] = toApi1Date(data[field])
  return data
}

// Same set of fields on every API 2 reply, 'NA' where API 2 has no value, so customers' code
// never meets a missing field
const fillApi2Fields = (data) => {
  const filled = {}
  for (const field of Object.keys(API2_FIELDS)) filled[field] = data[field] ?? 'NA'
  return filled
}

// API 2: VEHICLE_INFO_API2_URL is the full URL up to the vehicle number, e.g.
// https://host/vehicle?key=xxx&no= , and the number is added at the end. It answers an unknown
// number with HTTP 404 and status 'Failed', and sends no usage counter.
const fetchFromApi2 = async (vehicleNumber) => {
  const apiUrl = process.env.VEHICLE_INFO_API2_URL
  if (!apiUrl) throw new Error('API 2 is not set up (VEHICLE_INFO_API2_URL)')

  const response = await axios.get(`${apiUrl}${encodeURIComponent(vehicleNumber)}`, {
    timeout: 20000,
    validateStatus: (status) => status < 500,
    headers: { Accept: 'application/json, text/plain, */*' }
  })

  let raw = response.data
  if (typeof raw === 'string') {
    try {
      raw = JSON.parse(raw)
    } catch (err) {
      return { found: false, charged: null, message: 'No vehicle information found for this registration number.' }
    }
  }

  const failed = !raw || typeof raw !== 'object' || response.status >= 400 || /fail|error/i.test(String(raw.status || ''))
  const data = failed ? null : mapApi2Fields(raw)
  if (!data || !hasVehicleDetails(data)) {
    return { found: false, charged: null, message: 'Vehicle details not found. Please check registration number.' }
  }
  if (!data.REGN_NO) data.REGN_NO = vehicleNumber
  return { found: true, data: fillApi2Fields(data), charged: null }
}

/**
 * One live lookup at a vehicle info provider: API 1 unless `provider` says 'api2'.
 * Resolves to { found: true, data, charged } or { found: false, message, charged }, where
 * `charged` says whether the provider used one of our credits (null when it did not say).
 * Throws when the provider can't be reached (network error, timeout, 5xx).
 */
const fetchVehicleInfo = async (vehicleNumber, { userId, provider } = {}) => {
  if (provider === 'api2') return fetchFromApi2(vehicleNumber)

  const apiUrl = process.env.VEHICLE_INFO_API_URL || 'https://informationapi.shop/rtosathi767/api.php'
  const apiKey = process.env.VEHICLE_INFO_API_KEY || 'xxnxxxxx8000'

  const response = await axios.get(`${apiUrl}?key=${apiKey}&vno=${encodeURIComponent(vehicleNumber)}`, {
    timeout: 20000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      Accept: 'application/json, text/plain, */*'
    }
  })

  let data = response.data
  // The provider sometimes answers with plain text instead of JSON
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data)
    } catch (err) {
      return { found: false, message: response.data || 'No vehicle information found for this registration number.' }
    }
  }

  // Recorded before the error check so a "not found" reply still updates the quota
  await recordProviderUsage(data?._usage, { vehicleNumber, userId })
  const charged = await providerCharged(data?._usage, vehicleNumber)

  if (!data || typeof data !== 'object' || data.error || data.status === 'error' || data.status === false) {
    return {
      found: false,
      charged,
      message: data?.message || data?.error || 'Vehicle details not found. Please check registration number.'
    }
  }

  if (!hasVehicleDetails(data)) {
    return { found: false, charged, message: 'Vehicle details not found. Please check registration number.' }
  }

  return { found: true, data, charged }
}

module.exports = { fetchVehicleInfo, recordProviderUsage, cleanVehicleNumber, PROVIDERS }
