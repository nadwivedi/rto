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

/**
 * One live lookup at the vehicle info provider.
 * Resolves to { found: true, data, charged } or { found: false, message, charged }, where
 * `charged` says whether the provider used one of our credits (null when it did not say).
 * Throws when the provider can't be reached (network error, timeout, 5xx).
 */
const fetchVehicleInfo = async (vehicleNumber, { userId } = {}) => {
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

module.exports = { fetchVehicleInfo, recordProviderUsage, cleanVehicleNumber }
