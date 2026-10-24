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

// API 2 field names (any case) -> the names API 1 uses, so every customer gets the same JSON
const API2_FIELDS = {
  REGN_NO: ['regno', 'reg_no', 'vehicle_number', 'registration_number'],
  STATUS: ['rc_status', 'vehicle_status', 'registration_status'],
  REGISTERED_AT: ['registered_at', 'rto', 'rto_name', 'registering_authority'],
  REGN_DT: ['regn_dt', 'reg_date', 'registration_date'],
  REGN_UPTO: ['regn_upto', 'reg_upto', 'registration_upto', 'registration_valid_upto'],
  OWNER_NAME: ['owner_name', 'owner', 'ownername'],
  OWNER_SERIAL_NO: ['owner_serial_no', 'owner_sr_no', 'owner_count', 'ownership'],
  F_NAME: ['father_name', 'f_name'],
  MAKER_DESC: ['maker_desc', 'maker', 'manufacturer', 'maker_name'],
  MAKER_MODEL: ['maker_model', 'model', 'vehicle_model', 'model_name'],
  VEHICLE_CLASS: ['vehicle_class', 'vehicle_class_desc', 'class', 'vh_class'],
  BODY_TYPE: ['body_type', 'body_type_desc'],
  FUEL_DESC: ['fuel_desc', 'fuel_type', 'fuel'],
  NORMS_DESC: ['norms_desc', 'fuel_norms', 'norms', 'emission_norms'],
  CUBIC_CAP: ['cubic_capacity', 'cubic_cap', 'cc'],
  SEAT_CAP: ['seating_capacity', 'seat_cap', 'seats'],
  COLOR: ['color', 'colour', 'vehicle_color'],
  MANU_MONTH_YR: ['manu_month_yr', 'manufacturing_date', 'manufacture_date', 'mfg_date'],
  CHASI_NO: ['chasi_no', 'chassis_no', 'chassis_number', 'chassis'],
  ENG_NO: ['eng_no', 'engine_no', 'engine_number', 'engine'],
  FINANCER_DETAILS: ['financer_details', 'financer_name', 'financer', 'financier'],
  INSURANCE_COMP: ['insurance_comp', 'insurance_company', 'insurer'],
  INS_POLICY_NO: ['ins_policy_no', 'insurance_policy_no', 'policy_no', 'policy_number'],
  INSURANCE_UPTO: ['insurance_upto', 'insurance_valid_upto', 'insurance_expiry', 'insurance_validity'],
  PUCC_NO: ['pucc_no', 'puc_no', 'puc_number'],
  PUCC_UPTO: ['pucc_upto', 'puc_upto', 'puc_valid_upto', 'puc_validity'],
  FIT_UPTO: ['fit_upto', 'fitness_upto', 'fitness_valid_upto', 'fitness_validity'],
  TAX_UPTO: ['tax_upto', 'tax_paid_upto', 'tax_valid_upto'],
  PERMIT_TYPE: ['permit_type'],
  BLACKLIST_STATUS: ['blacklist_status', 'blacklisted'],
  NOC_DETAILS: ['noc_details', 'noc']
}

const mapApi2Fields = (raw) => {
  const byName = new Map(Object.entries(raw).map(([k, v]) => [k.toLowerCase(), v]))
  const data = {}
  for (const [field, names] of Object.entries(API2_FIELDS)) {
    const value = names.map((n) => byName.get(n)).find((v) => v !== undefined && v !== null && String(v).trim() !== '')
    if (value !== undefined) data[field] = typeof value === 'string' ? value.trim() : value
  }
  return data
}

// API 2: GET <VEHICLE_INFO_API2_URL>?key=<VEHICLE_INFO_API2_KEY>&no=<vehicle number>. It answers
// an unknown number with HTTP 404 and status 'Failed', and sends no usage counter.
const fetchFromApi2 = async (vehicleNumber) => {
  const apiUrl = process.env.VEHICLE_INFO_API2_URL
  const apiKey = process.env.VEHICLE_INFO_API2_KEY
  if (!apiUrl || !apiKey) throw new Error('API 2 is not set up (VEHICLE_INFO_API2_URL / VEHICLE_INFO_API2_KEY)')

  const response = await axios.get(apiUrl, {
    params: { key: apiKey, no: vehicleNumber },
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
  return { found: true, data, charged: null }
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
