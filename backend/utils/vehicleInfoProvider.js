const axios = require('axios')
const ApiUsage = require('../models/ApiUsage')
const { raiseAlert, autoResolveAlerts } = require('./adminAlerts')

const toNumber = (value) => {
  const n = Number(value)
  return value !== null && value !== '' && Number.isFinite(n) ? n : undefined
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
// (API 1 – Nikhil API was removed; its keys and users were moved to API 5, see utils/migrateApi1ToApi5)
const PROVIDERS = {
  api5: 'API 5',
  api2: 'API 2',
  api3: 'API 3 – Parzival API',
  api4: 'API 4 – PeriOne API',
  // Both at once: API 2 for the vehicle details, API 4 for the latest insurance / PUC / tax / fitness
  api24: 'API 2 + API 4 – details + latest status',
  // Both at once: everything from API 3, only the mobile number from API 2
  api32: 'API 3 + API 2 – API 3 details + API 2 mobile'
}

// The fields every reply has, in the order the old API 1 used (API 5 sends the same names). Every
// API's reply is turned into exactly these fields, so a customer gets the same JSON from all of them.
// The permit fields after PERMIT_ISSUE_DATE and PURCHASE_DT / SALE_AMT are filled where the API
// sends them, VEHICLE_AGE .. RTO_PHONE only by API 2. IS_COMMERCIAL is 'TRUE' / 'FALSE'.
const API1_FIELDS = [
  'REGN_NO', 'REGN_DT', 'REGN_UPTO', 'OWNER_NAME', 'F_NAME', 'STATE_CD', 'RTO_CD', 'PRESENT_ADDRESS',
  'PERMANENT_ADDRESS', 'MOBILE_NO', 'CHASI_NO', 'ENG_NO', 'MAKER_DESC', 'MAKER_MODEL', 'BODY_TYPE_DESC',
  'FUEL_DESC', 'COLOR', 'FIT_UPTO', 'INSURANCE_COMP', 'INSURANCE_UPTO', 'MANU_MONTH_YR', 'POLICY_NO',
  'PUC_UPTO', 'INS_POLICY_NO', 'FINANCER_DETAILS', 'PERMIT_NO', 'PERMIT_ISSUE_DATE',
  'PERMIT_TYPE', 'PERMIT_CATEGORY', 'PERMIT_VALID_FROM', 'PERMIT_VALID_UPTO', 'PERMIT_ISSUING_AUTHORITY', 'RC_NP_NO',
  'REGISTERED_AT', 'STATUS_AS_ON', 'PUCC_UPTO', 'PUCC_NO', 'STATUS', 'VEHICLE_SURRENDERED_TO_DEALER',
  'CURRENTADD_STATENAME', 'CURRENTADD_DISTRICTCODE', 'CURRENTADD_PINCODE', 'VEHICLE_CLASS',
  'VEHICLE_CATEGORY', 'SEATING_CAPACITY', 'SLEEPER_CAPACITY', 'STANDING_CAPACITY', 'OWNER_SERIAL_NO',
  'UNLADEN_WEIGHT', 'LADEN_WEIGHT', 'WHEELBASE', 'NO_OF_CYLINDERS', 'CUBIC_CAPACITY', 'FUEL_NORMS',
  'TAX_UPTO', 'BLACKLIST_STATUS', 'NOC_DETAILS', 'IS_COMMERCIAL', 'PURCHASE_DT', 'SALE_AMT',
  'VEHICLE_AGE', 'CLAIM_MADE', 'PREV_NCB', 'RTO_ADDRESS', 'RTO_PHONE',
  'RTO_CITY', 'RTO_WEBSITE', 'INSURANCE_STATUS', 'OWNERSHIP_CHANGE'
]

// API 1 field <- API 2 field names (any case), first one with a real value wins.
// API 2's `status` is the request result (Success / Failed), not the RC status. A reply without a
// vehicle is dropped before these are read (hasVehicleDetails), so capacities are safe to use.
const API2_FIELDS = {
  REGN_NO: ['regno', 'registration_number', 'vehicle_number'],
  REGN_DT: ['registration_date', 'registrationdate', 'regdate', 'reg_date'],
  REGN_UPTO: ['regn_upto', 'registration_upto'],
  F_NAME: ['father_name'],
  RTO_CD: ['rtocode'],
  MOBILE_NO: ['mobile_no'],
  CHASI_NO: ['chassisno', 'chassis_no'],
  ENG_NO: ['engineno', 'engine_no'],
  MAKER_DESC: ['make', 'maker'],
  MAKER_MODEL: ['maker_model', 'model', 'modal_name'],
  BODY_TYPE_DESC: ['body_type'],
  FUEL_DESC: ['fuel_type', 'fueltype'],
  COLOR: ['color', 'colour'],
  FIT_UPTO: ['fitness_upto', 'fit_upto'],
  INSURANCE_COMP: ['insurance_company', 'ins_company'],
  INSURANCE_UPTO: ['insurance_upto', 'insurance_expiry', 'prevpolicyexpirydate', 'f_prevpolicyexpirydate'],
  MANU_MONTH_YR: ['mfg_mnth_yr'],
  POLICY_NO: ['policy_no', 'insurance_policy_no'],
  INS_POLICY_NO: ['policy_no', 'insurance_policy_no'],
  PUC_UPTO: ['puc_upto', 'pucc_upto'],
  PUCC_UPTO: ['puc_upto', 'pucc_upto'],
  PUCC_NO: ['pucc_no', 'puc_no'],
  FINANCER_DETAILS: ['financer_name', 'hypo'],
  PERMIT_NO: ['permit_no', 'permit_number'],
  PERMIT_ISSUE_DATE: ['permit_issue_date'],
  PERMIT_TYPE: ['permit_type'],
  PERMIT_CATEGORY: ['permit_category'],
  PERMIT_VALID_FROM: ['permit_valid_from', 'permit_from'],
  PERMIT_VALID_UPTO: ['permit_valid_upto', 'permit_upto'],
  PERMIT_ISSUING_AUTHORITY: ['permit_issuing_authority'],
  REGISTERED_AT: ['registered_rto'],
  STATUS: ['rc_status', 'vehicle_status'],
  VEHICLE_CLASS: ['vehicle_class'],
  OWNER_SERIAL_NO: ['owner_serial_no'],
  CUBIC_CAPACITY: ['engine_cc', 'cc', 'enginecc', 'enginecapacity'],
  FUEL_NORMS: ['fuel_norms', 'norms_desc'],
  TAX_UPTO: ['tax_upto'],
  BLACKLIST_STATUS: ['blacklist_status'],
  NOC_DETAILS: ['noc_details'],
  // Only API 2 sends these; 'address' / 'phone' are the RTO office's, from its "Vehicle Header" section
  VEHICLE_AGE: ['vehicle_age', 'vehicleage'],
  CLAIM_MADE: ['claimmade', 'claim_made'],
  PREV_NCB: ['prevncb', 'prev_ncb'],
  RTO_ADDRESS: ['address'],
  RTO_PHONE: ['phone'],
  RTO_CITY: ['city_name'],
  RTO_WEBSITE: ['website'],
  INSURANCE_STATUS: ['insurance_status'],
  OWNERSHIP_CHANGE: ['ownershipchange', 'ownership_change'],
  SEATING_CAPACITY: ['seating_capacity']
}
const API2_DATE_FIELDS = [
  'REGN_DT', 'REGN_UPTO', 'FIT_UPTO', 'INSURANCE_UPTO', 'PUC_UPTO', 'PUCC_UPTO',
  'PERMIT_ISSUE_DATE', 'PERMIT_VALID_FROM', 'PERMIT_VALID_UPTO', 'TAX_UPTO'
]

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

// A value worth sending: not empty, not the provider's 'NA' placeholder and not masked (N*****N)
const isReal = (v) => v !== undefined && v !== null && !/^(|na|n\/a|null|none|-)$/i.test(String(v).trim()) && !String(v).includes('*')

// API 2 also sends a second record with `sections`: { 'Important Dates & Validity': { 'Fitness Upto': ... }, ... }
// (now under additional_info.data_2, earlier under a key like "2"). Its labels become snake_case names
// ('Fitness Upto' -> fitness_upto) so the aliases above pick up fitness, tax, PUC, insurance, vehicle class,
// fuel norms, the registered RTO and the RTO office. A field of the main record with the same name wins.
const findSections = (value, depth = 0, out = []) => {
  if (!value || typeof value !== 'object' || depth > 3) return out
  if (value.sections && typeof value.sections === 'object') out.push(value.sections)
  for (const [key, child] of Object.entries(value)) if (key !== 'sections') findSections(child, depth + 1, out)
  return out
}
const api2SectionEntries = (raw) => {
  const entries = []
  for (const sections of findSections(raw)) {
    for (const section of Object.values(sections)) {
      if (!section || typeof section !== 'object') continue
      for (const [label, v] of Object.entries(section)) {
        if (v !== null && typeof v === 'object') continue
        entries.push([label.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, ''), v])
      }
    }
  }
  return entries
}

const mapApi2Fields = (raw) => {
  // The main record is now under `vehicle` (earlier at the top level); its fields win over the sections
  const main = { ...raw, ...(raw.vehicle && typeof raw.vehicle === 'object' ? raw.vehicle : {}) }
  const byName = new Map(Object.entries(main).filter(([, v]) => v === null || typeof v !== 'object').map(([k, v]) => [k.toLowerCase(), v]))
  for (const [name, v] of api2SectionEntries(raw)) if (!isReal(byName.get(name)) && isReal(v)) byName.set(name, v)
  const get = (...names) => names.map((n) => byName.get(n)).find(isReal)
  const data = {}
  for (const [field, names] of Object.entries(API2_FIELDS)) {
    const value = get(...names)
    if (value !== undefined) data[field] = typeof value === 'string' ? value.trim().replace(/\s{2,}/g, ' ') : value
  }

  // API 2 masks owner_name but sends the full name split in firstname / lastname
  const owner = [get('firstname', 'first_name'), get('lastname', 'last_name')].filter(Boolean).join(' ').trim()
  if (owner) data.OWNER_NAME = owner
  else if (get('owner_name')) data.OWNER_NAME = String(get('owner_name')).trim()

  if (!data.REGISTERED_AT && get('rto_name')) {
    data.REGISTERED_AT = get('rto_state') ? `${get('rto_name')} RTO, ${get('rto_state')}` : `${get('rto_name')} RTO`
  }
  // 'CG12' / 'CG-12' -> state CG, RTO 12
  const rto = String(get('rto', 'code') || '').match(/^([A-Za-z]{2})-?(\d+)/)
  if (rto) {
    data.STATE_CD = rto[1].toUpperCase()
    if (!data.RTO_CD) data.RTO_CD = rto[2]
  }
  // No ownership change means the first owner
  if (data.OWNER_SERIAL_NO === undefined && /^no$/i.test(String(get('ownershipchange') || ''))) data.OWNER_SERIAL_NO = 1
  if (data.CUBIC_CAPACITY !== undefined) {
    const cc = Number(String(data.CUBIC_CAPACITY).replace(/\s*cc$/i, ''))
    if (Number.isFinite(cc)) data.CUBIC_CAPACITY = cc.toFixed(2)
  }
  const variant = get('variant')
  if (data.MAKER_MODEL && variant && !String(data.MAKER_MODEL).includes(variant)) data.MAKER_MODEL = `${data.MAKER_MODEL} ${variant}`
  for (const field of API2_DATE_FIELDS) if (data[field]) data[field] = toApi1Date(data[field])
  return data
}

// The reply API 1 sends: its fields in its order, every value a string, 'NA' where there is none.
// API 2 and API 3 replies go through this so a user or API key customer gets the same JSON from all 3.
const toApi1Reply = (data) => {
  const filled = {}
  for (const field of API1_FIELDS) {
    const value = data[field]
    filled[field] = value === undefined || value === null || value === '' ? 'NA' : String(value)
  }
  return filled
}

// API 2 replies end with usage: { key_label, total_searches, avg_response_ms, this_request_ms, ... }.
// total_searches is every search made on our key; the admin sets the plan size (e.g. 2000 bought),
// so the panel shows used / left. Never throws.
const API2_USAGE_PROVIDER = 'api2'
const API2_LOW_LEFT = Number(process.env.API2_LOW_SEARCHES_ALERT) || 100

const recordApi2Usage = async (usage, { vehicleNumber, userId } = {}) => {
  if (!usage || typeof usage !== 'object') return
  const used = toNumber(usage.total_searches)
  if (used === undefined) return
  const snapshot = { checkedAt: new Date(), used }
  const avg = toNumber(usage.avg_response_ms)
  const last = toNumber(usage.this_request_ms)
  if (avg !== undefined) snapshot.avgResponseMs = avg
  if (last !== undefined) snapshot.lastResponseMs = last
  if (vehicleNumber) snapshot.lastVehicleNumber = vehicleNumber
  if (userId) snapshot.lastUserId = userId
  try {
    const doc = await ApiUsage.findOneAndUpdate(
      { provider: API2_USAGE_PROVIDER },
      { $set: snapshot },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean()
    // Left = plan size - used, once the admin has set the plan size
    if (doc?.totalLimit > 0) {
      const left = doc.totalLimit - used
      await ApiUsage.updateOne({ provider: API2_USAGE_PROVIDER }, { $set: { remaining: left } })
      if (left <= API2_LOW_LEFT) {
        await raiseAlert({
          key: 'api2:low-balance',
          severity: left <= 0 ? 'critical' : 'warning',
          source: 'api2',
          code: 'LOW_BALANCE',
          title: left <= 0 ? 'API 2: plan used up' : 'API 2: searches running low',
          message: `${used} of ${doc.totalLimit} API 2 searches used, ${Math.max(0, left)} left. Buy more and update the plan size in the admin panel.`,
          vehicleNumber,
          userId
        })
      } else {
        await autoResolveAlerts('api2:low-balance')
      }
    }
  } catch (err) {
    console.error('Failed to record API 2 usage:', err.message)
  }
}

// API 2: VEHICLE_INFO_API2_URL is the full URL up to the vehicle number, e.g.
// https://host/vehicle?key=xxx&no= , and the number is added at the end. It answers an unknown
// number with HTTP 404 and status 'Failed'.
const fetchFromApi2 = async (vehicleNumber, { userId } = {}) => {
  const apiUrl = process.env.VEHICLE_INFO_API2_URL
  if (!apiUrl) throw new Error('API 2 is not set up (VEHICLE_INFO_API2_URL)')
  // Shown in pm2 logs (key hidden) so the URL actually used can be checked
  console.log(`[API 2] ${vehicleNumber} -> ${String(apiUrl).replace(/([?&]key=)[^&]*/i, '$1***')}`)

  // API 2 sometimes takes 40s+ to answer (even for a number it does not have), so it gets a long wait
  const response = await axios.get(`${apiUrl}${encodeURIComponent(vehicleNumber)}`, {
    timeout: 60000,
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

  // Recorded before the checks so a "not found" reply still updates the count
  await recordApi2Usage(raw?.usage, { vehicleNumber, userId })

  const failed = !raw || typeof raw !== 'object' || response.status >= 400 || /fail|error/i.test(String(raw.status || ''))
  const data = failed ? null : mapApi2Fields(raw)
  if (!data || !hasVehicleDetails(data)) {
    return { found: false, charged: null, message: 'Vehicle details not found. Please check registration number.' }
  }
  if (!data.REGN_NO) data.REGN_NO = vehicleNumber
  return { found: true, data: toApi1Reply(data), charged: null }
}

// API 3 (ParzivalHub): POST { vehicle_number } with the key as a Bearer token. It replies
// { success, status: 'found', data: {...}, meta: { charged } } or { success: false, error: { code, message } }.
const API3_URL = 'https://api.parzivalhub.com/v1/rc-details'

// API 1 field <- API 3 field. API 3 sends clean snake_case names, so one name per field.
const API3_FIELDS = {
  REGN_NO: 'registration_number',
  REGN_DT: 'registration_date',
  REGN_UPTO: 'registration_upto',
  OWNER_NAME: 'owner_name',
  F_NAME: 'father_name',
  STATE_CD: 'state_code',
  RTO_CD: 'rto_code',
  PRESENT_ADDRESS: 'present_address',
  PERMANENT_ADDRESS: 'permanent_address',
  MOBILE_NO: 'mobile_number',
  CHASI_NO: 'chassis_number',
  ENG_NO: 'engine_number',
  MAKER_DESC: 'maker',
  MAKER_MODEL: 'model',
  BODY_TYPE_DESC: 'body_type',
  FUEL_DESC: 'fuel_type',
  COLOR: 'color',
  FIT_UPTO: 'fitness_upto',
  INSURANCE_COMP: 'insurance_company',
  INSURANCE_UPTO: 'insurance_upto',
  MANU_MONTH_YR: 'manufacturing_date',
  POLICY_NO: 'insurance_policy_number',
  INS_POLICY_NO: 'insurance_policy_number',
  PUC_UPTO: 'puc_upto',
  PUCC_UPTO: 'puc_upto',
  PUCC_NO: 'puc_number',
  FINANCER_DETAILS: 'financier',
  PERMIT_NO: 'permit_number',
  PERMIT_ISSUE_DATE: 'permit_issue_date',
  PERMIT_TYPE: 'permit_type',
  PERMIT_CATEGORY: 'permit_category',
  PERMIT_VALID_FROM: 'permit_valid_from',
  PERMIT_VALID_UPTO: 'permit_valid_upto',
  PERMIT_ISSUING_AUTHORITY: 'permit_issuing_authority',
  REGISTERED_AT: 'rto',
  STATUS_AS_ON: 'status_as_on',
  STATUS: 'rc_status',
  CURRENTADD_STATENAME: 'state',
  CURRENTADD_DISTRICTCODE: 'district_code',
  CURRENTADD_PINCODE: 'present_address_pincode',
  VEHICLE_CLASS: 'vehicle_class',
  VEHICLE_CATEGORY: 'vehicle_category',
  SEATING_CAPACITY: 'seating_capacity',
  SLEEPER_CAPACITY: 'sleeper_capacity',
  STANDING_CAPACITY: 'standing_capacity',
  OWNER_SERIAL_NO: 'owner_serial',
  UNLADEN_WEIGHT: 'unladen_weight',
  LADEN_WEIGHT: 'gross_vehicle_weight',
  WHEELBASE: 'wheelbase',
  NO_OF_CYLINDERS: 'cylinders',
  CUBIC_CAPACITY: 'cubic_capacity',
  FUEL_NORMS: 'emission_norms',
  TAX_UPTO: 'tax_upto',
  BLACKLIST_STATUS: 'blacklist_status',
  NOC_DETAILS: 'noc_details',
  IS_COMMERCIAL: 'is_commercial'
}
const API3_DATE_FIELDS = [...API2_DATE_FIELDS, 'STATUS_AS_ON']

const mapApi3Fields = (raw) => {
  const data = {}
  for (const [field, name] of Object.entries(API3_FIELDS)) {
    const value = raw[name]
    // A live key gets full, unmasked values (only the pzk_test_ sandbox key masks them); they are
    // passed on exactly as sent, only blanks are dropped
    if (value === undefined || value === null || /^(|na|n\/a|null|none|-)$/i.test(String(value).trim())) continue
    data[field] = typeof value === 'string' ? value.trim().replace(/\s{2,}/g, ' ') : value
  }
  if (typeof data.IS_COMMERCIAL === 'boolean' || /^(true|false)$/i.test(String(data.IS_COMMERCIAL ?? ''))) {
    data.IS_COMMERCIAL = String(data.IS_COMMERCIAL).toUpperCase()
  }
  // API 3 sends permit_category -1 when there is no category
  if (String(data.PERMIT_CATEGORY) === '-1') delete data.PERMIT_CATEGORY
  if (data.CUBIC_CAPACITY !== undefined && Number.isFinite(Number(data.CUBIC_CAPACITY))) {
    data.CUBIC_CAPACITY = Number(data.CUBIC_CAPACITY).toFixed(2)
  }
  // '3/2024' -> '03/2024'
  const mfg = String(data.MANU_MONTH_YR || '').match(/^(\d{1,2})\/(\d{4})$/)
  if (mfg) data.MANU_MONTH_YR = `${mfg[1].padStart(2, '0')}/${mfg[2]}`
  for (const field of API3_DATE_FIELDS) if (data[field]) data[field] = toApi1Date(data[field])
  return data
}

const API3_USAGE_PROVIDER = 'parzivalhub'
// The same ParzivalHub account (one wallet) also serves Chassis -> RC: its own quota / charge are kept here
const API3_CHASSIS_USAGE_PROVIDER = 'parzivalhubchassis'
// Below this wallet balance (₹) the admin gets a "running low" alert, before lookups start failing
const API3_LOW_BALANCE = Number(process.env.PARZIVAL_LOW_BALANCE_ALERT) || 100

// A problem with our provider account (bad key, empty wallet, rate limit), not with the vehicle number
class ProviderError extends Error {
  constructor (message, code) {
    super(message)
    this.providerCode = code
  }
}

/**
 * Every API 3 reply ends with meta: { charged, wallet_balance, quota_remaining, access_expires_at }.
 * Keep the latest so the admin panel can show the wallet, quota and expiry. Never throws.
 * `api: 'chassis'` (Chassis -> RC): the quota, charge and expiry are that API's own and go to its own
 * row; the wallet is the account's, so it still goes to the API 3 row.
 */
const recordApi3Usage = async (meta, { vehicleNumber, userId, api = 'rc' } = {}) => {
  if (!meta || typeof meta !== 'object') return
  const snapshot = { checkedAt: new Date() }
  const wallet = toNumber(meta.wallet_balance)
  const quota = toNumber(meta.quota_remaining)
  const charge = toNumber(meta.charged)
  const expires = meta.access_expires_at ? new Date(meta.access_expires_at) : null
  if (wallet !== undefined) snapshot.walletBalance = wallet
  if (quota !== undefined) snapshot.remaining = quota
  if (charge !== undefined) snapshot.lastCharge = charge
  if (expires && !Number.isNaN(expires.getTime())) snapshot.accessExpiresAt = expires
  if (Object.keys(snapshot).length === 1) return
  if (vehicleNumber) snapshot.lastVehicleNumber = vehicleNumber
  if (userId) snapshot.lastUserId = userId

  const upsert = (provider, set) =>
    ApiUsage.findOneAndUpdate({ provider }, { $set: set }, { upsert: true, setDefaultsOnInsert: true })
  try {
    if (api === 'chassis') {
      await upsert(API3_CHASSIS_USAGE_PROVIDER, snapshot)
      if (wallet !== undefined) await upsert(API3_USAGE_PROVIDER, { checkedAt: snapshot.checkedAt, walletBalance: wallet })
    } else {
      await upsert(API3_USAGE_PROVIDER, snapshot)
    }
  } catch (err) {
    console.error('Failed to record API 3 usage:', err.message)
  }

  if (wallet !== undefined) {
    if (wallet < API3_LOW_BALANCE) {
      await raiseAlert({
        key: 'api3:low-balance',
        severity: 'warning',
        source: 'api3',
        code: 'LOW_BALANCE',
        title: 'Parzival API (API 3) wallet running low',
        message: `Wallet balance is ₹${wallet}${charge ? ` (₹${charge} per search)` : ''}. Add money from the ParzivalHub dashboard before searches start failing.`,
        vehicleNumber,
        userId
      })
    } else {
      await autoResolveAlerts('api3:low-balance')
    }
  }
}

const fetchFromApi3 = async (vehicleNumber, { userId } = {}) => {
  const apiKey = process.env.PARZIVAL_API_KEY
  if (!apiKey) throw new Error('API 3 is not set up (PARZIVAL_API_KEY)')

  const response = await axios.post(API3_URL, { vehicle_number: vehicleNumber }, {
    timeout: 30000,
    validateStatus: (status) => status < 500,
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json', Accept: 'application/json' }
  })

  const raw = response.data
  // Recorded before the error checks so a "not found" reply still updates the wallet
  await recordApi3Usage(raw?.meta, { vehicleNumber, userId })
  // meta.charged is what the lookup cost from the ParzivalHub wallet (e.g. 4), 0 when it was free
  const charged = raw?.meta?.charged === undefined ? null : Boolean(Number(raw.meta.charged))

  if (!raw || typeof raw !== 'object' || !raw.success) {
    // A bad key, an empty wallet or a rate limit is our problem, not the vehicle number, so it is
    // thrown like a network error: the admin gets an alert and the user a plain "unavailable"
    if ([401, 402, 403, 429].includes(response.status)) {
      const code = raw?.error?.code || `HTTP_${response.status}`
      throw new ProviderError(`API 3 refused the request: ${code} ${raw?.error?.message || ''}`.trim(), code)
    }
    return { found: false, charged, message: raw?.error?.message || 'Vehicle details not found. Please check registration number.' }
  }

  const data = raw.data && typeof raw.data === 'object' ? mapApi3Fields(raw.data) : null
  if (!data || !hasVehicleDetails(data)) {
    return { found: false, charged, message: 'Vehicle details not found. Please check registration number.' }
  }
  if (!data.REGN_NO) data.REGN_NO = vehicleNumber
  return { found: true, data: toApi1Reply(data), charged }
}

// API 3 Chassis -> RC (ParzivalHub): POST /v1/chassis-to-rc { chassis_number } with the same key and the
// same reply envelope as rc-details ({ success, data, meta } / { success: false, error: { code, message } }).
// The data is read with the rc-details field names (registration_number, owner_name, maker, ...); a reply
// with several vehicles (an array, or data.matches / results / records / vehicles) gives each of them.
const API3_CHASSIS_URL = 'https://api.parzivalhub.com/v1/chassis-to-rc'
const CHASSIS_NOT_FOUND = 'No vehicle found for this chassis number. Please check the chassis number.'

// 'MA3 EWB-22S00 123456' -> 'MA3EWB22S00123456'
const cleanChassisNumber = (raw) => String(raw || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase()

// Other names the registration / chassis number may come under, if not the rc-details ones
const CHASSIS_REGN_ALIASES = ['vehicle_number', 'rc_number', 'registration_no', 'regn_no', 'reg_no', 'regno']
const CHASSIS_NO_ALIASES = ['chassis_no', 'chassis', 'chasi_no']

const chassisRecordsOf = (data) => {
  if (Array.isArray(data)) return data
  if (!data || typeof data !== 'object') return []
  for (const key of ['matches', 'results', 'records', 'vehicles', 'items']) if (Array.isArray(data[key])) return data[key]
  return [data]
}

const mapChassisRecord = (raw) => {
  const data = mapApi3Fields(raw)
  const pick = (names) => names.map((n) => raw[n]).find(isReal)
  if (!data.REGN_NO && pick(CHASSIS_REGN_ALIASES)) data.REGN_NO = cleanVehicleNumber(pick(CHASSIS_REGN_ALIASES))
  if (!data.CHASI_NO && pick(CHASSIS_NO_ALIASES)) data.CHASI_NO = String(pick(CHASSIS_NO_ALIASES)).trim()
  return data
}

const fetchChassisFromApi3 = async (chassisNumber, { userId } = {}) => {
  const apiKey = process.env.PARZIVAL_API_KEY
  if (!apiKey) throw new Error('API 3 is not set up (PARZIVAL_API_KEY)')

  // 502 / 503 / 504 (their source down or slow) are thrown by axios like a network error
  const response = await axios.post(API3_CHASSIS_URL, { chassis_number: chassisNumber }, {
    timeout: 30000,
    validateStatus: (status) => status < 500,
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json', Accept: 'application/json' }
  })

  const raw = response.data
  await recordApi3Usage(raw?.meta, { vehicleNumber: chassisNumber, userId, api: 'chassis' })
  const charged = raw?.meta?.charged === undefined ? null : Boolean(Number(raw.meta.charged))

  if (!raw || typeof raw !== 'object' || !raw.success) {
    const code = raw?.error?.code || `HTTP_${response.status}`
    // Bad key, not subscribed to this API, empty wallet, quota or rate limit: our problem, not the number
    if ([401, 402, 403, 429].includes(response.status)) {
      throw new ProviderError(`Chassis to RC (API 3) refused the request: ${code} ${raw?.error?.message || ''}`.trim(), code)
    }
    if (response.status !== 404) console.warn(`[Chassis to RC] ${chassisNumber}: HTTP ${response.status} ${code} ${raw?.error?.message || ''}`)
    const message = response.status === 400 || response.status === 422
      ? 'Invalid chassis number. Please check the chassis number.'
      : CHASSIS_NOT_FOUND
    return { found: false, charged, message }
  }

  const matches = chassisRecordsOf(raw.data)
    .filter((r) => r && typeof r === 'object')
    .map(mapChassisRecord)
    .filter((d) => isReal(d.REGN_NO) || hasVehicleDetails(d))
  if (!matches.length) return { found: false, charged, message: CHASSIS_NOT_FOUND }
  return { found: true, data: { chassisNumber, matches: matches.map(toApi1Reply) }, charged }
}

// API 4 (PeriOne VAHAN): POST https://api.perione.in/vahan/vehicleno?email=<registered email> with
// client_id / client_secret headers and { vehiclenumber }. Transport (commercial) vehicles only.
// It replies { code: '200', message: 'Success', response: [{ response: { rcRegnNo, ... }, responseStatus: 'SUCCESS' }] }
// and sends no owner name, chassis, engine or mobile for transport vehicles, so those come back as NA.
const API4_URL = 'https://api.perione.in/vahan/vehicleno'
const API4_NOT_FOUND = 'Vehicle details not found. API 4 (PeriOne) only has transport vehicles; please check the registration number.'

// API 1 field <- PeriOne field (VAHAN's rc* names, any case). Everything down to PURCHASE_DT / SALE_AMT
// is in the replies seen so far (plus rcVhType, read below); the rest are the standard VAHAN names,
// picked up if PeriOne ever sends them, e.g. laden weight (rcGvw), which it has not sent yet.
const API4_FIELDS = {
  REGN_NO: 'rcRegnNo',
  REGN_DT: 'rcRegnDt',
  MAKER_DESC: 'rcMakerDesc',
  MAKER_MODEL: 'rcMakerModel',
  BODY_TYPE_DESC: 'rcBodyTypeDesc',
  FUEL_DESC: 'rcFuelDesc',
  COLOR: 'rcColor',
  FIT_UPTO: 'rcFitUpto',
  INSURANCE_COMP: 'rcInsuranceComp',
  INSURANCE_UPTO: 'rcInsuranceUpto',
  POLICY_NO: 'rcInsurancePolicyNo',
  INS_POLICY_NO: 'rcInsurancePolicyNo',
  MANU_MONTH_YR: 'rcManuMonthYr',
  FINANCER_DETAILS: 'rcFinancer',
  STATUS: 'rcStatus',
  UNLADEN_WEIGHT: 'rcUnldWt',
  SEATING_CAPACITY: 'rcSeatCap',
  PRESENT_ADDRESS: 'rcPresentAddress',
  PERMANENT_ADDRESS: 'rcPermanentAddress',
  TAX_UPTO: 'rcTaxUpto',
  PUC_UPTO: 'rcPuccUpto',
  PUCC_UPTO: 'rcPuccUpto',
  REGISTERED_AT: 'rcRegisteredAt',
  VEHICLE_CLASS: 'rcVhClassDesc',
  NO_OF_CYLINDERS: 'rcNoCyl',
  WHEELBASE: 'rcWheelbase',
  PURCHASE_DT: 'rcPurchaseDt',
  SALE_AMT: 'rcSaleAmt',
  REGN_UPTO: 'rcRegnUpto',
  OWNER_NAME: 'rcOwnerName',
  F_NAME: 'rcFName',
  MOBILE_NO: 'rcMobileNo',
  CHASI_NO: 'rcChasiNo',
  ENG_NO: 'rcEngNo',
  PUCC_NO: 'rcPuccNo',
  LADEN_WEIGHT: 'rcGvw',
  CUBIC_CAPACITY: 'rcCubicCap',
  FUEL_NORMS: 'rcNormsDesc',
  SLEEPER_CAPACITY: 'rcSleeperCap',
  STANDING_CAPACITY: 'rcStandCap',
  OWNER_SERIAL_NO: 'rcOwnerSr',
  STATUS_AS_ON: 'rcStatusAsOn',
  VEHICLE_CATEGORY: 'rcVchCatg',
  BLACKLIST_STATUS: 'rcBlacklistStatus',
  NOC_DETAILS: 'rcNocDetails',
  PERMIT_NO: 'rcPermitNo',
  PERMIT_ISSUE_DATE: 'rcPermitIssueDt',
  PERMIT_TYPE: 'rcPermitType',
  PERMIT_VALID_FROM: 'rcPermitValidFrom',
  PERMIT_VALID_UPTO: 'rcPermitValidUpto',
  RC_NP_NO: 'rcNpNo'
}

const mapApi4Fields = (raw) => {
  const byName = new Map(Object.entries(raw).map(([k, v]) => [k.toLowerCase(), v]))
  const data = {}
  for (const [field, name] of Object.entries(API4_FIELDS)) {
    const value = byName.get(name.toLowerCase())
    if (!isReal(value)) continue
    data[field] = typeof value === 'string' ? value.trim().replace(/\s{2,}/g, ' ') : value
  }
  // rcVhType: T = transport, N = non-transport
  const type = String(byName.get('rcvhtype') || '').trim().toUpperCase()
  if (type === 'T' || type === 'N') data.IS_COMMERCIAL = type === 'T' ? 'TRUE' : 'FALSE'
  // 'BRICK_RED' -> 'BRICK RED', 'TILT_CAB_HSD' -> 'TILT CAB HSD'
  for (const field of ['COLOR', 'BODY_TYPE_DESC']) {
    if (typeof data[field] === 'string') data[field] = data[field].replace(/_+/g, ' ').trim()
  }
  // '2739846.0' -> '2739846'
  if (data.SALE_AMT !== undefined && Number.isFinite(Number(data.SALE_AMT))) data.SALE_AMT = String(Number(data.SALE_AMT))
  const state = String(data.REGN_NO || '').match(/^([A-Z]{2})\d/i)
  if (state) data.STATE_CD = state[1].toUpperCase()
  // '5/2016' -> '05/2016'
  const mfg = String(data.MANU_MONTH_YR || '').match(/^(\d{1,2})\/(\d{4})$/)
  if (mfg) data.MANU_MONTH_YR = `${mfg[1].padStart(2, '0')}/${mfg[2]}`
  if (data.CUBIC_CAPACITY !== undefined && Number.isFinite(Number(data.CUBIC_CAPACITY))) {
    data.CUBIC_CAPACITY = Number(data.CUBIC_CAPACITY).toFixed(2)
  }
  for (const field of [...API3_DATE_FIELDS, 'PURCHASE_DT']) if (data[field]) data[field] = toApi1Date(data[field])
  return data
}

// Words in a PeriOne error that mean our account or setup is the problem, not the vehicle number
const API4_ACCOUNT_ERROR = /client|secret|email|unauthori[sz]ed|forbidden|balance|wallet|credit|recharge|limit|plan|expired|inactive|blocked/i

const fetchFromApi4 = async (vehicleNumber) => {
  const { PERIONE_CLIENT_ID, PERIONE_CLIENT_SECRET, PERIONE_EMAIL } = process.env
  if (!PERIONE_CLIENT_ID || !PERIONE_CLIENT_SECRET || !PERIONE_EMAIL) {
    throw new Error('API 4 is not set up (PERIONE_CLIENT_ID, PERIONE_CLIENT_SECRET, PERIONE_EMAIL)')
  }

  const response = await axios.post(`${API4_URL}?email=${encodeURIComponent(PERIONE_EMAIL)}`, { vehiclenumber: vehicleNumber }, {
    timeout: 30000,
    validateStatus: (status) => status < 500,
    headers: {
      client_id: PERIONE_CLIENT_ID,
      client_secret: PERIONE_CLIENT_SECRET,
      'Content-Type': 'application/json',
      Accept: 'application/json'
    }
  })

  const raw = response.data && typeof response.data === 'object' ? response.data : null
  const entry = Array.isArray(raw?.response) ? raw.response[0] : null
  const rc = entry?.response && typeof entry.response === 'object' ? entry.response : null

  if (response.status >= 400 || !rc || !/success/i.test(String(entry?.responseStatus || ''))) {
    // An error about the key, email or balance is ours to fix: thrown so the admin gets an alert
    const reason = String(entry?.message || raw?.message || '').trim()
    const status = Number(raw?.status || raw?.code) || response.status
    const refused = [401, 402, 403, 429]
    if (refused.includes(response.status) || refused.includes(status) || (status === 400 && API4_ACCOUNT_ERROR.test(reason))) {
      throw new ProviderError(`API 4 refused the request: ${status} ${reason}`.trim(), `HTTP_${status}`)
    }
    return { found: false, charged: null, message: API4_NOT_FOUND }
  }

  const data = mapApi4Fields(rc)
  if (!hasVehicleDetails(data)) return { found: false, charged: null, message: API4_NOT_FOUND }
  if (!data.REGN_NO) data.REGN_NO = vehicleNumber
  return { found: true, data: toApi1Reply(data), charged: null }
}

// API 5 (parzivalapi.online): GET /v1/vehicle?number=<no> with the key in the X-API-Key header.
// It replies { success: true, api, charged, remaining, calls_left: { vehicle, hsrp }, data: { REGN_NO, ... } }
// with data in the same field names this module sends, or { success: false, error, calls_left? } with
// 400 bad number, 401 bad key, 402 no calls left, 404 no record, 429 over 60 a minute, 502 / 503 down.
// Errors are never charged.
const API5_BASE = 'https://api.parzivalapi.online/v1'
const API5_URL = `${API5_BASE}/vehicle`
// The same key also serves HSRP (number plate) details: GET /v1/hsrp?number=<no>, its own calls_left.hsrp
const API5_HSRP_URL = `${API5_BASE}/hsrp`
// ApiUsage rows: Vehicle Info calls left, HSRP calls left
const API5_USAGE_PROVIDER = 'parzivalapi5'
const API5_HSRP_USAGE_PROVIDER = 'parzivalapi5hsrp'
// At or below this many calls left the admin gets a "running low" alert, before lookups start failing
const API5_LOW_CALLS = Number(process.env.PARZIVAL5_LOW_CALLS_ALERT) || 25
const API5_HSRP_LOW_CALLS = Number(process.env.PARZIVAL5_HSRP_LOW_CALLS_ALERT) || 10
const API5_APIS = {
  vehicle: { usage: API5_USAGE_PROVIDER, low: API5_LOW_CALLS, alertKey: 'api5:low-balance', name: 'Vehicle Info' },
  hsrp: { usage: API5_HSRP_USAGE_PROVIDER, low: API5_HSRP_LOW_CALLS, alertKey: 'api5:hsrp-low-balance', name: 'HSRP' }
}

const mapApi5Fields = (raw) => {
  const data = {}
  for (const field of API1_FIELDS) {
    const value = raw[field]
    if (value === undefined || value === null || /^(|na|n\/a|null|none|-)$/i.test(String(value).trim())) continue
    data[field] = typeof value === 'string' ? value.trim().replace(/\s{2,}/g, ' ') : value
  }
  // 'Y' / 'N' (or true / false) -> 'TRUE' / 'FALSE', as the other APIs send it
  const commercial = String(data.IS_COMMERCIAL ?? '').trim().toUpperCase()
  if (['Y', 'YES', 'TRUE'].includes(commercial)) data.IS_COMMERCIAL = 'TRUE'
  else if (['N', 'NO', 'FALSE'].includes(commercial)) data.IS_COMMERCIAL = 'FALSE'
  if (data.CUBIC_CAPACITY !== undefined && Number.isFinite(Number(data.CUBIC_CAPACITY))) {
    data.CUBIC_CAPACITY = Number(data.CUBIC_CAPACITY).toFixed(2)
  }
  const mfg = String(data.MANU_MONTH_YR || '').match(/^(\d{1,2})\/(\d{4})$/)
  if (mfg) data.MANU_MONTH_YR = `${mfg[1].padStart(2, '0')}/${mfg[2]}`
  for (const field of [...API3_DATE_FIELDS, 'PURCHASE_DT']) if (data[field]) data[field] = toApi1Date(data[field])
  return data
}

/**
 * Every API 5 reply (success or 402) has calls_left for each of its APIs ({ vehicle, hsrp }); keep the
 * latest of both for the admin panel, and alert when the API that was just called runs low. Never throws.
 */
const recordApi5Usage = async (raw, { vehicleNumber, userId, api = 'vehicle' } = {}) => {
  if (!raw || typeof raw !== 'object') return
  const left = { ...(raw.calls_left && typeof raw.calls_left === 'object' ? raw.calls_left : {}) }
  // `remaining` is the API that was called
  if (raw.remaining !== undefined) left[raw.api || api] = raw.remaining

  for (const [name, cfg] of Object.entries(API5_APIS)) {
    const remaining = toNumber(left[name])
    if (remaining === undefined) continue
    const snapshot = { checkedAt: new Date(), remaining }
    if (name === api) {
      const charge = toNumber(raw.charged)
      if (charge !== undefined) snapshot.lastCharge = charge
      if (vehicleNumber) snapshot.lastVehicleNumber = vehicleNumber
      if (userId) snapshot.lastUserId = userId
    }
    try {
      await ApiUsage.findOneAndUpdate({ provider: cfg.usage }, { $set: snapshot }, { upsert: true, setDefaultsOnInsert: true })
    } catch (err) {
      console.error(`Failed to record API 5 ${cfg.name} usage:`, err.message)
    }

    if (name !== api) continue
    if (remaining <= cfg.low) {
      await raiseAlert({
        key: cfg.alertKey,
        severity: remaining <= 0 ? 'critical' : 'warning',
        source: 'api5',
        code: 'LOW_BALANCE',
        title: remaining <= 0 ? `API 5: no ${cfg.name} calls left` : `API 5: ${cfg.name} calls running low`,
        message: `${remaining} ${cfg.name} call${remaining === 1 ? '' : 's'} left on parzivalapi.online. Buy more calls before searches start failing.`,
        vehicleNumber,
        userId
      })
    } else {
      await autoResolveAlerts(cfg.alertKey)
    }
  }
}

const fetchFromApi5 = async (vehicleNumber, { userId } = {}) => {
  const apiKey = process.env.PARZIVAL5_API_KEY
  if (!apiKey) throw new Error('API 5 is not set up (PARZIVAL5_API_KEY)')

  // 502 / 503 (their data source down) are thrown by axios like a network error
  const response = await axios.get(API5_URL, {
    params: { number: vehicleNumber },
    timeout: 30000,
    validateStatus: (status) => status < 500,
    headers: { 'X-API-Key': apiKey, Accept: 'application/json' }
  })

  const raw = response.data && typeof response.data === 'object' ? response.data : null
  // Recorded before the error checks so a 402 "no calls left" still updates the count
  await recordApi5Usage(raw, { vehicleNumber, userId, api: 'vehicle' })

  if (!raw || !raw.success) {
    // A bad key, no calls left or a rate limit is our problem, not the vehicle number
    if ([401, 402, 403, 429].includes(response.status)) {
      throw new ProviderError(`API 5 refused the request: HTTP ${response.status} ${raw?.error || ''}`.trim(), `HTTP_${response.status}`)
    }
    const message = response.status === 400
      ? 'Invalid vehicle number. Please check registration number.'
      : 'Vehicle details not found. Please check registration number.'
    return { found: false, charged: false, message }
  }

  const data = raw.data && typeof raw.data === 'object' ? mapApi5Fields(raw.data) : null
  const charged = raw.charged === undefined ? true : Boolean(Number(raw.charged))
  if (!data || !hasVehicleDetails(data)) {
    return { found: false, charged, message: 'Vehicle details not found. Please check registration number.' }
  }
  if (!data.REGN_NO) data.REGN_NO = vehicleNumber
  return { found: true, data: toApi1Reply(data), charged }
}

// API 5 HSRP: GET /v1/hsrp?number=<no> with the same key. data is
// { status, regno, chassis, engine, hsrp_response: { message, fuel, maker, vchType, norms, vchCatg, regnDate,
//   hsrpFrontLaserCode, hsrpRearLaserCode, stateCd, offCd, ... } }, sent on as it is.
const HSRP_NOT_FOUND = 'HSRP details not found for this vehicle number. Please check the number.'

const fetchHsrpFromApi5 = async (vehicleNumber, { userId } = {}) => {
  const apiKey = process.env.PARZIVAL5_API_KEY
  if (!apiKey) throw new Error('API 5 is not set up (PARZIVAL5_API_KEY)')

  const response = await axios.get(API5_HSRP_URL, {
    params: { number: vehicleNumber },
    timeout: 30000,
    validateStatus: (status) => status < 500,
    headers: { 'X-API-Key': apiKey, Accept: 'application/json' }
  })

  const raw = response.data && typeof response.data === 'object' ? response.data : null
  await recordApi5Usage(raw, { vehicleNumber, userId, api: 'hsrp' })

  if (!raw || !raw.success) {
    if ([401, 402, 403, 429].includes(response.status)) {
      throw new ProviderError(`API 5 HSRP refused the request: HTTP ${response.status} ${raw?.error || ''}`.trim(), `HTTP_${response.status}`)
    }
    const message = response.status === 400 ? 'Invalid vehicle number. Please check the number.' : HSRP_NOT_FOUND
    return { found: false, charged: false, message }
  }

  const data = raw.data && typeof raw.data === 'object' ? raw.data : null
  const charged = raw.charged === undefined ? true : Boolean(Number(raw.charged))
  const hsrp = data?.hsrp_response && typeof data.hsrp_response === 'object' ? data.hsrp_response : null
  const hasDetails = hsrp && ['hsrpFrontLaserCode', 'hsrpRearLaserCode', 'maker', 'regnDate'].some((k) => isReal(hsrp[k]))
  if (!data || (!hasDetails && /fail|not\s*found|invalid/i.test(String(data.status || hsrp?.message || '')))) {
    return { found: false, charged, message: HSRP_NOT_FOUND }
  }
  return { found: true, data: { ...data, regno: data.regno || vehicleNumber }, charged }
}

/**
 * HSRP details for a vehicle from API 5, with admin alerts like fetchVehicleInfo:
 * { found: true, data, charged } or { found: false, message, charged }; when API 5 fails an error with
 * `providerUnavailable: true` and a message safe to show users is thrown.
 */
const fetchHsrpInfo = async (vehicleNumber, { userId, via } = {}) => {
  try {
    const result = await fetchHsrpFromApi5(vehicleNumber, { userId })
    await autoResolveAlerts('api5hsrp:error:')
    return result
  } catch (err) {
    const code = alertCodeOf(err)
    console.error('API 5 HSRP lookup failed:', err?.response?.data || err.message)
    await raiseAlert({
      key: `api5hsrp:error:${code}`,
      severity: err.providerCode || code === 'NOT_SET_UP' ? 'critical' : 'warning',
      source: 'api5',
      code,
      title: (ALERT_TITLES[code] || ((n) => (err.providerCode ? `${n} refused the request (${code})` : `${n} is not responding`)))('API 5 HSRP'),
      message: String(err.message || '').slice(0, 500),
      vehicleNumber,
      userId,
      via
    })
    const unavailable = new Error('HSRP service is temporarily unavailable. Please try again after some time.')
    unavailable.providerUnavailable = true
    unavailable.detail = err.message
    throw unavailable
  }
}

/**
 * Vehicle(s) for a chassis number from ParzivalHub (API 3), with admin alerts like fetchHsrpInfo:
 * { found: true, data: { chassisNumber, matches: [record, ...] }, charged } or { found: false, message, charged };
 * when the provider fails an error with `providerUnavailable: true` and a message safe to show users is thrown.
 */
const fetchChassisInfo = async (chassisNumber, { userId, via } = {}) => {
  try {
    const result = await fetchChassisFromApi3(chassisNumber, { userId })
    await autoResolveAlerts('api3chassis:error:')
    return result
  } catch (err) {
    const code = alertCodeOf(err)
    console.error('Chassis to RC lookup failed:', err?.response?.data || err.message)
    await raiseAlert({
      key: `api3chassis:error:${code}`,
      severity: err.providerCode || code === 'NOT_SET_UP' ? 'critical' : 'warning',
      source: 'api3',
      code,
      title: (ALERT_TITLES[code] || ((n) => (err.providerCode ? `${n} refused the request (${code})` : `${n} is not responding`)))('Chassis to RC (API 3)'),
      message: String(err.message || '').slice(0, 500),
      vehicleNumber: chassisNumber,
      userId,
      via
    })
    const unavailable = new Error('Chassis search is temporarily unavailable. Please try again after some time.')
    unavailable.providerUnavailable = true
    unavailable.detail = err.message
    throw unavailable
  }
}

// What a user or API key customer sees when a provider fails. The real reason goes to the admin alerts.
const UNAVAILABLE_MESSAGE = 'Vehicle information service is temporarily unavailable. Please try again after some time.'

const ALERT_TITLES = {
  INSUFFICIENT_BALANCE: (name) => `${name}: wallet balance too low`,
  NOT_SET_UP: (name) => `${name} is not set up`
}

const alertCodeOf = (err) => {
  if (err.providerCode) return String(err.providerCode)
  if (/is not set up/.test(err.message)) return 'NOT_SET_UP'
  if (err.response?.status) return `HTTP_${err.response.status}`
  return err.code || 'NO_RESPONSE'
}

/**
 * One live lookup at a vehicle info provider: API 5 unless `provider` says 'api2', 'api3' or 'api4'.
 * Resolves to { found: true, data, charged } or { found: false, message, charged }, where
 * `charged` says whether the provider used one of our credits (null when it did not say).
 * When the provider fails (down, timeout, 5xx, bad key, empty wallet) an admin alert is raised
 * and an error with `providerUnavailable: true` and a message safe to show users is thrown;
 * the provider's own reason is in `error.detail`.
 */
const fetchVehicleInfo = async (vehicleNumber, { userId, provider, via } = {}) => {
  if (COMBINED[provider]) return fetchCombined(vehicleNumber, COMBINED[provider], { userId, via })
  return lookupOne(PROVIDERS[provider] ? provider : 'api5', vehicleNumber, { userId, via })
}

// One provider, with its own admin alerts (see fetchVehicleInfo)
const lookupOne = async (source, vehicleNumber, { userId, via } = {}) => {
  try {
    const result = await fetchFromProvider(vehicleNumber, { userId, provider: source })
    // The provider answered, so any earlier "it failed" alert for it is over
    await autoResolveAlerts(`${source}:error:`)
    return result
  } catch (err) {
    const code = alertCodeOf(err)
    const name = PROVIDERS[source]
    console.error(`${name} lookup failed:`, err?.response?.data || err.message)
    await raiseAlert({
      key: `${source}:error:${code}`,
      severity: err.providerCode || code === 'NOT_SET_UP' ? 'critical' : 'warning',
      source,
      code,
      title: (ALERT_TITLES[code] || ((n) => (err.providerCode ? `${n} refused the request (${code})` : `${n} is not responding`)))(name),
      message: String(err.message || '').slice(0, 500),
      vehicleNumber,
      userId,
      via
    })
    const unavailable = new Error(UNAVAILABLE_MESSAGE)
    unavailable.providerUnavailable = true
    unavailable.detail = err.message
    throw unavailable
  }
}

// Combined sources: two providers asked at once, one reply. `base` gives the record; each `groups`
// entry is taken whole from `extra` when `extra` has the group's first field; with `fillGaps`, any
// other field `base` left empty is filled from `extra`. When one of the two finds nothing, fails or
// (for `extra`) is too slow, the other one's reply is sent as it is, and each raises its own admin alerts.
const COMBINED = {
  // API 2 has the full record (owner, mobile, chassis, engine, address) but its insurance / PUC /
  // tax / fitness dates are often old; API 4 (PeriOne) has them up to date, for transport vehicles
  // only. A whole group comes from API 4, so an old policy number never sits next to a new expiry.
  api24: {
    base: 'api2',
    extra: 'api4',
    groups: [
      ['INSURANCE_UPTO', 'INSURANCE_COMP', 'POLICY_NO', 'INS_POLICY_NO'],
      ['PUCC_UPTO', 'PUC_UPTO', 'PUCC_NO'],
      ['TAX_UPTO'],
      ['FIT_UPTO'],
      ['STATUS']
    ],
    fillGaps: true,
    // Private vehicles are not on API 4, so API 2's record is not held back long for it
    extraWaitMs: Number(process.env.COMBINED_EXTRA_WAIT_MS) || 8000
  },
  // API 3 has every detail except the mobile number, which comes from API 2
  api32: {
    base: 'api3',
    extra: 'api2',
    groups: [['MOBILE_NO']],
    fillGaps: false
  }
}
const filled = (value) => value !== undefined && value !== null && value !== '' && value !== 'NA'

const settle = (promise) => promise.then(
  (value) => ({ status: 'fulfilled', value }),
  (reason) => ({ status: 'rejected', reason })
)

// With `extraWaitMs`, once `base` has the vehicle `extra` gets at most that long more (ms), so a slow
// extra never holds the reply back: the user then gets `base`'s record alone
const fetchCombined = async (vehicleNumber, { base, extra, groups, fillGaps, extraWaitMs }, { userId, via } = {}) => {
  const asked = settle(lookupOne(extra, vehicleNumber, { userId, via }))
  const first = await settle(lookupOne(base, vehicleNumber, { userId, via }))
  let timer
  const second = extraWaitMs && first.status === 'fulfilled' && first.value.found
    ? await Promise.race([
      asked,
      new Promise((resolve) => { timer = setTimeout(() => resolve({ status: 'fulfilled', value: { found: false } }), extraWaitMs) })
    ])
    : await asked
  clearTimeout(timer)
  const main = first.status === 'fulfilled' && first.value.found ? first.value : null
  const more = second.status === 'fulfilled' && second.value.found ? second.value : null

  if (!main && !more) {
    // Nothing found: when one of them could not be asked, say the service is unavailable
    const failed = [first, second].find((r) => r.status === 'rejected')
    if (failed) throw failed.reason
    return { found: false, charged: null, message: 'Vehicle details not found. Please check registration number.' }
  }
  // `charged` follows the provider whose record is sent (API 3 says when a search was free)
  if (!main || !more) return main || more

  const data = { ...main.data }
  for (const group of groups) {
    if (filled(more.data[group[0]])) for (const field of group) data[field] = more.data[field]
  }
  if (fillGaps) for (const field of API1_FIELDS) if (!filled(data[field]) && filled(more.data[field])) data[field] = more.data[field]
  return { found: true, data, charged: main.charged }
}

const fetchFromProvider = async (vehicleNumber, { userId, provider } = {}) => {
  if (provider === 'api2') return fetchFromApi2(vehicleNumber, { userId })
  if (provider === 'api3') return fetchFromApi3(vehicleNumber, { userId })
  if (provider === 'api4') return fetchFromApi4(vehicleNumber)
  return fetchFromApi5(vehicleNumber, { userId })
}

module.exports = { fetchVehicleInfo, fetchHsrpInfo, fetchChassisInfo, cleanVehicleNumber, cleanChassisNumber, PROVIDERS, API2_USAGE_PROVIDER, API3_USAGE_PROVIDER, API3_CHASSIS_USAGE_PROVIDER, API5_USAGE_PROVIDER, API5_HSRP_USAGE_PROVIDER, mapApi2Fields }
