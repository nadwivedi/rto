const ApiKey = require('../models/ApiKey')
const ApiKeyCall = require('../models/ApiKeyCall')
const { fetchVehicleInfo, cleanVehicleNumber } = require('../utils/vehicleInfoProvider')

const todayIST = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })

const usageOf = (apiKey) => ({
  limit: apiKey.callLimit || 0,
  used: apiKey.callCount || 0,
  remaining: Math.max(0, (apiKey.callLimit || 0) - (apiKey.callCount || 0))
})

// Save one call in the key's log. Never throws: a failure here must not break the reply.
const logCall = async (apiKey, req, startedAt, entry) => {
  const usage = usageOf(apiKey)
  try {
    await ApiKeyCall.create({
      apiKeyId: apiKey._id,
      date: todayIST(),
      callLimit: usage.limit,
      remaining: usage.remaining,
      durationMs: Date.now() - startedAt,
      ip: String(req.headers['x-forwarded-for'] || req.ip || '').split(',')[0].trim(),
      userAgent: String(req.headers['user-agent'] || '').slice(0, 300),
      ...entry
    })
  } catch (err) {
    console.error('Failed to log API key call:', err.message)
  }
}

/**
 * GET/POST /api/v1/vehicle-info?vno=CG04AB1234
 * Key in the `x-api-key` header (or `key` in the query / body).
 * Only calls that return vehicle details use up the key's limit.
 */
exports.lookupVehicle = async (req, res) => {
  const startedAt = Date.now()
  const body = req.body || {}
  const key = String(req.headers['x-api-key'] || req.query.key || body.key || '').trim()

  if (!key) {
    return res.status(401).json({ success: false, message: 'API key is required. Send it in the x-api-key header.' })
  }

  let apiKey = await ApiKey.findOne({ key }).catch(() => null)
  if (!apiKey) {
    return res.status(401).json({ success: false, message: 'Invalid API key' })
  }

  const reply = async (statusCode, payload, entry = {}) => {
    await logCall(apiKey, req, startedAt, { statusCode, success: statusCode === 200, message: payload.message, ...entry })
    return res.status(statusCode).json({ ...payload, usage: usageOf(apiKey) })
  }

  if (!apiKey.active) {
    return reply(403, { success: false, message: 'This API key is disabled. Please contact RTO Sarthi.' })
  }

  const rawVno = req.query.vno || body.vno
  const vehicleNumber = typeof rawVno === 'string' ? cleanVehicleNumber(rawVno) : ''
  if (vehicleNumber.length < 4) {
    return reply(400, { success: false, message: 'A valid vehicle registration number is required (vno=CG04AB1234).' }, { vehicleNumber })
  }

  // Take one call off the limit up front, so two calls at the same moment can't both use the last one
  const reserved = await ApiKey.findOneAndUpdate(
    { _id: apiKey._id, active: true, $expr: { $lt: ['$callCount', '$callLimit'] } },
    { $inc: { callCount: 1 }, $set: { lastUsedAt: new Date() } },
    { new: true }
  )
  if (!reserved) {
    apiKey = (await ApiKey.findById(apiKey._id)) || apiKey
    return reply(403, { success: false, limitExhausted: true, message: 'API call limit exhausted. Please recharge to continue.' }, { vehicleNumber })
  }
  apiKey = reserved

  // Give the reserved call back when no vehicle details are sent
  const refund = async () => {
    apiKey = (await ApiKey.findByIdAndUpdate(apiKey._id, { $inc: { callCount: -1 } }, { new: true }).catch(() => null)) || apiKey
  }

  try {
    const result = await fetchVehicleInfo(vehicleNumber, { userId: apiKey.userId })
    if (!result.found) {
      await refund()
      return reply(404, { success: false, message: result.message }, { vehicleNumber })
    }

    // The provider's own account quota is ours, not the customer's
    const { _usage, ...data } = result.data
    return reply(
      200,
      { success: true, message: 'Vehicle details fetched successfully', vehicleNumber, data },
      {
        vehicleNumber,
        response: data,
        ownerName: data.OWNER_NAME || '',
        makerModel: `${data.MAKER_DESC || ''} ${data.MAKER_MODEL || ''}`.trim()
      }
    )
  } catch (error) {
    console.error('API key vehicle lookup failed:', error?.response?.data || error.message)
    await refund()
    return reply(502, { success: false, message: 'Vehicle information service is not responding. Please try again.' }, {
      vehicleNumber,
      message: `Provider error: ${error.message}`.slice(0, 300)
    })
  }
}
