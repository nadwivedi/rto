const ApiKey = require('../models/ApiKey')
const ApiKeyCall = require('../models/ApiKeyCall')
const {
  fetchVehicleInfo,
  fetchChassisInfo,
  cleanVehicleNumber,
  cleanChassisNumber,
  cleanEngineNumber,
  chassisNeedsEngine,
  chassisProvider,
  PROVIDERS
} = require('../utils/vehicleInfoProvider')

const todayIST = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })

const usageOf = (apiKey) => ({
  limit: apiKey.callLimit || 0,
  used: apiKey.callCount || 0,
  remaining: Math.max(0, (apiKey.callLimit || 0) - (apiKey.callCount || 0))
})

// What each kind of key opens, so a key used on the other endpoint is told where to go
const ENDPOINTS = {
  rc: { path: '/api/v1/vehicle-info', name: 'Vehicle RC' },
  chassis: { path: '/api/v1/chassis-info', name: 'Chassis to RC' }
}
const productOf = (apiKey) => (apiKey.product === 'chassis' ? 'chassis' : 'rc')

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
 * The shared part of every API key call: reads the key (x-api-key header, or `key` in the query / body),
 * checks it is on and made for this endpoint's product, then hands `run` a context with:
 *   reply(status, payload, logEntry)  sends the reply (with source and usage) and logs the call
 *   reserve()                         takes one call off the limit up front, false when none are left
 *   refund()                          gives the reserved call back (no details sent / not charged)
 */
const withApiKey = (product, run) => async (req, res) => {
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

  // Which of our APIs served the call, sent back on every reply and saved in the log
  // (Chassis keys: the Chassis to RC API, 'rtosarthi_api4' PeriOne or 'rtosarthi_api3' ParzivalHub)
  const source = product === 'chassis' ? `rtosarthi_${chassisProvider()}` : `rtosarthi_${PROVIDERS[apiKey.provider] ? apiKey.provider : 'api5'}`

  const reply = async (statusCode, payload, entry = {}) => {
    await logCall(apiKey, req, startedAt, { statusCode, success: statusCode === 200, message: payload.message, source, ...entry })
    return res.status(statusCode).json({ ...payload, source, usage: usageOf(apiKey) })
  }

  if (!apiKey.active) {
    return reply(403, { success: false, message: 'This API key is disabled. Please contact RTO Sarthi.' })
  }

  if (productOf(apiKey) !== product) {
    const own = ENDPOINTS[productOf(apiKey)]
    return reply(403, {
      success: false,
      message: `This API key is for the ${own.name} API (${own.path}). Please contact RTO Sarthi for ${ENDPOINTS[product].name} access.`
    })
  }

  // Take one call off the limit up front, so two calls at the same moment can't both use the last one
  const reserve = async () => {
    const reserved = await ApiKey.findOneAndUpdate(
      { _id: apiKey._id, active: true, $expr: { $lt: ['$callCount', '$callLimit'] } },
      { $inc: { callCount: 1 }, $set: { lastUsedAt: new Date() } },
      { new: true }
    )
    apiKey = reserved || (await ApiKey.findById(apiKey._id)) || apiKey
    return Boolean(reserved)
  }

  const refund = async () => {
    apiKey = (await ApiKey.findByIdAndUpdate(apiKey._id, { $inc: { callCount: -1 } }, { new: true }).catch(() => null)) || apiKey
  }

  const ctx = {
    req,
    body,
    reply,
    reserve,
    refund,
    get apiKey() {
      return apiKey
    }
  }
  return run(ctx)
}

const LIMIT_EXHAUSTED = { success: false, limitExhausted: true, message: 'API call limit exhausted. Please recharge to continue.' }

/**
 * GET/POST /api/v1/vehicle-info?vno=CG04AB1234
 * Key in the `x-api-key` header (or `key` in the query / body).
 * Only calls that return vehicle details use up the key's limit.
 */
exports.lookupVehicle = withApiKey('rc', async ({ req, body, reply, reserve, refund, apiKey: keyAtStart }) => {
  const rawVno = req.query.vno || body.vno
  const vehicleNumber = typeof rawVno === 'string' ? cleanVehicleNumber(rawVno) : ''
  if (vehicleNumber.length < 4) {
    return reply(400, { success: false, message: 'A valid vehicle registration number is required (vno=CG04AB1234).' }, { vehicleNumber })
  }

  if (!(await reserve())) return reply(403, LIMIT_EXHAUSTED, { vehicleNumber })

  try {
    const result = await fetchVehicleInfo(vehicleNumber, { userId: keyAtStart.userId, provider: keyAtStart.provider, via: `API key: ${keyAtStart.name || keyAtStart._id}` })
    if (!result.found) {
      await refund()
      return reply(404, { success: false, message: result.message }, { vehicleNumber, charged: false })
    }

    // The provider's own account quota is ours, not the customer's
    const { _usage, ...data } = result.data
    // Only count the call when it used one of our provider credits
    const charged = result.charged !== false
    if (!charged) await refund()
    return reply(
      200,
      { success: true, message: 'Vehicle details fetched successfully', vehicleNumber, data },
      {
        vehicleNumber,
        charged,
        providerUsed: Number(_usage?.used) || undefined,
        providerRemaining: Number(_usage?.remaining) || undefined,
        response: data,
        ownerName: data.OWNER_NAME || '',
        makerModel: `${data.MAKER_DESC || ''} ${data.MAKER_MODEL || ''}`.trim()
      }
    )
  } catch (error) {
    console.error('API key vehicle lookup failed:', error.detail || error.message)
    await refund()
    return reply(502, { success: false, message: 'Vehicle information service is not responding. Please try again.' }, {
      vehicleNumber,
      message: `Provider error: ${error.detail || error.message}`.slice(0, 300)
    })
  }
})

/**
 * GET/POST /api/v1/chassis-info?chassis=ME3J3B5FMS2004994&engine=...
 * For Chassis to RC keys. The engine number is required while the chassis API is PeriOne (API 4).
 * Replies with the vehicle in the same format as /vehicle-info (`data`), plus every match (`matches`).
 * Only calls that return vehicle details use up the key's limit.
 */
exports.lookupChassis = withApiKey('chassis', async ({ req, body, reply, reserve, refund, apiKey: keyAtStart }) => {
  const chassisNumber = cleanChassisNumber(req.query.chassis || body.chassis)
  const engineNumber = cleanEngineNumber(req.query.engine || body.engine)
  const logged = { chassisNumber, engineNumber: engineNumber || undefined }
  const needsEngine = chassisNeedsEngine()

  if (chassisNumber.length < 5 || chassisNumber.length > 25) {
    return reply(400, { success: false, message: 'A valid chassis number is required (chassis=MA3EWB22S00123456).' }, logged)
  }
  if (needsEngine && (engineNumber.length < 4 || engineNumber.length > 25)) {
    return reply(400, { success: false, message: 'The engine number is required too (engine=...).' }, logged)
  }

  if (!(await reserve())) return reply(403, LIMIT_EXHAUSTED, logged)

  try {
    const result = await fetchChassisInfo(chassisNumber, {
      userId: keyAtStart.userId,
      engineNumber,
      via: `API key: ${keyAtStart.name || keyAtStart._id}`
    })
    if (!result.found) {
      await refund()
      return reply(404, { success: false, message: result.message, chassisNumber }, { ...logged, charged: false })
    }

    const matches = result.data.matches.map(({ _usage, ...m }) => m)
    const data = matches[0]
    const charged = result.charged !== false
    if (!charged) await refund()
    return reply(
      200,
      {
        success: true,
        message: 'Vehicle details fetched successfully',
        chassisNumber,
        vehicleNumber: data.REGN_NO || null,
        data,
        matches
      },
      {
        ...logged,
        vehicleNumber: data.REGN_NO && data.REGN_NO !== 'NA' ? data.REGN_NO : undefined,
        charged,
        response: { data, matches },
        ownerName: data.OWNER_NAME || '',
        makerModel: `${data.MAKER_DESC || ''} ${data.MAKER_MODEL || ''}`.trim()
      }
    )
  } catch (error) {
    console.error('API key chassis lookup failed:', error.detail || error.message)
    await refund()
    return reply(502, { success: false, message: 'Chassis to RC service is not responding. Please try again.', chassisNumber }, {
      ...logged,
      message: `Provider error: ${error.detail || error.message}`.slice(0, 300)
    })
  }
})
