const mongoose = require('mongoose')
const RcSearchLog = require('../models/RcSearchLog')
const ApiKeyCall = require('../models/ApiKeyCall')
const ApiKey = require('../models/ApiKey')
const User = require('../models/User')
const Employee = require('../models/Employee')
const { logError, getUserFriendlyError, getSimplifiedTimestamp } = require('../utils/errorLogger')

const sendError = (res, req, error) => {
  logError(error, req)
  const userError = getUserFriendlyError(error)
  res.status(500).json({ success: false, message: userError.message, timestamp: getSimplifiedTimestamp() })
}
const badRequest = (res, message) => res.status(400).json({ success: false, message })

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
// API key calls that reached a provider: details sent (200), not found (404) or the provider failed (502).
// Refused calls (bad number, limit used up, key off) never searched anything.
const KEY_SEARCH_CODES = [200, 404, 502]
const KEY_RESULT_CODE = { found: 200, not_found: 404, unavailable: 502 }
const keyResult = (call) => (call.statusCode === 200 ? 'found' : call.statusCode === 404 ? 'not_found' : 'unavailable')
// 'rtosarthi_api47' -> 'api47'
const keyProvider = (source) => String(source || '').replace(/^rtosarthi_/, '') || undefined

/**
 * GET /api/admin/searches?type=all|app|key&q=&result=all|found|not_found|unavailable&before=<ISO>&limit=50
 * Every RC (vehicle details) search, newest first: app users' searches (RcSearchLog) and Vehicle RC API key
 * calls (ApiKeyCall), without the vehicle details (see getSearch). `q` matches the vehicle number, the
 * user's name / mobile or the API key's name. Paged with `before` = the `nextBefore` of the previous page.
 */
exports.listSearches = async (req, res) => {
  try {
    const type = ['app', 'key'].includes(req.query.type) ? req.query.type : 'all'
    const result = KEY_RESULT_CODE[req.query.result] ? req.query.result : 'all'
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50))
    const before = req.query.before ? new Date(req.query.before) : null
    if (before && Number.isNaN(before.getTime())) return badRequest(res, 'Invalid date')
    const q = String(req.query.q || '').trim()

    // Chassis to RC keys are not vehicle number searches; only Vehicle RC keys here
    const chassisKeyIds = await ApiKey.find({ product: 'chassis' }).distinct('_id')
    const appQuery = {}
    const keyQuery = { apiKeyId: { $nin: chassisKeyIds }, statusCode: { $in: KEY_SEARCH_CODES } }
    if (before) {
      appQuery.createdAt = { $lt: before }
      keyQuery.createdAt = { $lt: before }
    }
    if (result !== 'all') {
      appQuery.result = result
      keyQuery.statusCode = KEY_RESULT_CODE[result]
    }
    if (q) {
      const vehicle = new RegExp(escapeRegex(q.replace(/[\s-]/g, '').toUpperCase()))
      const text = new RegExp(escapeRegex(q), 'i')
      const [userIds, keyIds] = await Promise.all([
        User.find({ $or: [{ name: text }, { mobile1: text }] }).distinct('_id'),
        ApiKey.find({ name: text }).distinct('_id')
      ])
      const keysOfUsers = userIds.length ? await ApiKey.find({ userId: { $in: userIds } }).distinct('_id') : []
      appQuery.$or = [{ vehicleNumber: vehicle }, { userId: { $in: userIds } }]
      keyQuery.$and = [{ $or: [{ vehicleNumber: vehicle }, { apiKeyId: { $in: [...keyIds, ...keysOfUsers] } }] }]
    }

    const [appRows, keyRows] = await Promise.all([
      type === 'key' ? [] : RcSearchLog.find(appQuery).select('-response').sort({ createdAt: -1 }).limit(limit + 1).lean(),
      type === 'app'
        ? []
        : ApiKeyCall.find(keyQuery)
          .select('apiKeyId vehicleNumber source servedBy statusCode charged message ownerName makerModel durationMs createdAt')
          .sort({ createdAt: -1 })
          .limit(limit + 1)
          .lean()
    ])

    const merged = [
      ...appRows.map((r) => ({ ...r, kind: 'app' })),
      ...keyRows.map((r) => ({ ...r, kind: 'key' }))
    ].sort((a, b) => b.createdAt - a.createdAt)
    const page = merged.slice(0, limit)

    // Names of the users, staff and API keys on this page
    const ids = (kind, field) => [...new Set(page.filter((r) => r.kind === kind && r[field]).map((r) => String(r[field])))]
    const [keys, staff] = await Promise.all([
      ApiKey.find({ _id: { $in: ids('key', 'apiKeyId') } }).select('name userId').lean(),
      Employee.find({ _id: { $in: ids('app', 'staffId') } }).select('name').lean()
    ])
    const keyById = new Map(keys.map((k) => [String(k._id), k]))
    const userIds = [...new Set([...ids('app', 'userId'), ...keys.filter((k) => k.userId).map((k) => String(k.userId))])]
    const users = await User.find({ _id: { $in: userIds } }).select('name mobile1').lean()
    const userById = new Map(users.map((u) => [String(u._id), u]))
    const staffById = new Map(staff.map((s) => [String(s._id), s]))

    const data = page.map((r) => {
      const common = {
        kind: r.kind,
        _id: r._id,
        createdAt: r.createdAt,
        vehicleNumber: r.vehicleNumber,
        servedBy: r.servedBy || [],
        charged: r.charged,
        message: r.message,
        ownerName: r.ownerName,
        makerModel: r.makerModel,
        durationMs: r.durationMs
      }
      if (r.kind === 'app') {
        const user = userById.get(String(r.userId))
        return {
          ...common,
          userId: r.userId,
          userName: user?.name || '(deleted user)',
          userMobile: user?.mobile1 || '',
          staffName: r.staffId ? staffById.get(String(r.staffId))?.name || 'Staff' : '',
          provider: r.provider,
          result: r.result
        }
      }
      const key = keyById.get(String(r.apiKeyId))
      const user = key?.userId ? userById.get(String(key.userId)) : null
      return {
        ...common,
        apiKeyId: r.apiKeyId,
        keyName: key?.name || '(deleted key)',
        userId: key?.userId,
        userName: user?.name || '',
        userMobile: user?.mobile1 || '',
        provider: keyProvider(r.source),
        result: keyResult(r)
      }
    })

    res.json({
      success: true,
      data,
      nextBefore: merged.length > limit && page.length ? page[page.length - 1].createdAt : null
    })
  } catch (error) {
    sendError(res, req, error)
  }
}

// GET /api/admin/searches/:kind/:id - one search with the full vehicle details the API sent back
exports.getSearch = async (req, res) => {
  try {
    const { kind, id } = req.params
    if (!['app', 'key'].includes(kind) || !mongoose.isValidObjectId(id)) return badRequest(res, 'Invalid search')
    const Model = kind === 'app' ? RcSearchLog : ApiKeyCall
    const row = await Model.findById(id).select('response').lean()
    if (!row) return res.status(404).json({ success: false, message: 'Search not found' })
    res.json({ success: true, data: { response: row.response || null } })
  } catch (error) {
    sendError(res, req, error)
  }
}
