const mongoose = require('mongoose')
const ServerLog = require('../models/ServerLog')
const User = require('../models/User')
const Employee = require('../models/Employee')
const { LOG_RETENTION_DAYS } = require('../models/ServerLog')
const { flushServerLogs } = require('../utils/serverLogs')
const { recordActivity } = require('../utils/activityLog')

const PAGE_SIZE = 100
const LEVELS = ['error', 'warn', 'info']

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// The name / mobile of the user and staff member a page of logs was printed for (log.context)
const withNames = async (logs) => {
  const ids = (field) => [...new Set(logs.map((l) => l.context?.[field]).filter(Boolean).map(String))]
  const [users, staff] = await Promise.all([
    ids('userId').length ? User.find({ _id: { $in: ids('userId') } }).select('name mobile1').lean() : [],
    ids('staffId').length ? Employee.find({ _id: { $in: ids('staffId') } }).select('name').lean() : []
  ])
  const userById = new Map(users.map((u) => [String(u._id), u]))
  const staffById = new Map(staff.map((e) => [String(e._id), e]))
  return logs.map((log) => {
    if (!log.context) return log
    const user = log.context.userId ? userById.get(String(log.context.userId)) : null
    const staffMember = log.context.staffId ? staffById.get(String(log.context.staffId)) : null
    return {
      ...log,
      context: {
        ...log.context,
        userName: user ? user.name : log.context.userId ? '(deleted user)' : undefined,
        userMobile: user?.mobile1 || undefined,
        staffName: staffMember ? staffMember.name : log.context.staffId ? 'Staff' : undefined
      }
    }
  })
}

// GET /api/admin/logs?level=error|warn|info|all&source=API 8&q=CG04&before=<log id>
// Newest first, PAGE_SIZE at a time; pass the last id as `before` for the next page. `q` matches the
// text, the vehicle / chassis number searched, or the searching user's name / mobile.
exports.listLogs = async (req, res) => {
  try {
    // Lines printed in the last two seconds are still in memory; save them first
    await flushServerLogs()

    const filter = {}
    if (LEVELS.includes(req.query.level)) filter.level = req.query.level
    const source = String(req.query.source || '').trim()
    if (source) filter.source = source
    const q = String(req.query.q || '').trim().slice(0, 200)
    if (q) {
      const text = { $regex: escapeRegex(q), $options: 'i' }
      const number = { $regex: escapeRegex(q.replace(/[\s-]/g, '').toUpperCase()) }
      const userIds = await User.find({ $or: [{ name: text }, { mobile1: text }] }).distinct('_id')
      filter.$or = [
        { message: text },
        { 'context.vehicleNumber': number },
        { 'context.chassisNumber': number },
        ...(userIds.length ? [{ 'context.userId': { $in: userIds.map(String) } }] : [])
      ]
    }
    if (req.query.before && mongoose.Types.ObjectId.isValid(req.query.before)) {
      filter._id = { $lt: new mongoose.Types.ObjectId(req.query.before) }
    }

    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const [logs, levelCounts, sources] = await Promise.all([
      ServerLog.find(filter).sort({ _id: -1 }).limit(PAGE_SIZE + 1).lean(),
      ServerLog.aggregate([{ $match: { createdAt: { $gte: dayAgo } } }, { $group: { _id: '$level', count: { $sum: 1 } } }]),
      ServerLog.distinct('source', { source: { $nin: [null, ''] } })
    ])

    const last24h = { error: 0, warn: 0, info: 0 }
    for (const row of levelCounts) if (row._id in last24h) last24h[row._id] = row.count

    return res.json({
      success: true,
      data: await withNames(logs.slice(0, PAGE_SIZE)),
      hasMore: logs.length > PAGE_SIZE,
      last24h,
      sources: sources.sort(),
      retentionDays: LOG_RETENTION_DAYS
    })
  } catch (error) {
    console.error('Failed to list server logs:', error.message)
    return res.status(500).json({ success: false, message: 'Failed to load logs' })
  }
}

// DELETE /api/admin/logs?level=error|warn|info  (no level: every log)
exports.clearLogs = async (req, res) => {
  try {
    const filter = LEVELS.includes(req.query.level) ? { level: req.query.level } : {}
    const result = await ServerLog.deleteMany(filter)
    recordActivity(req, {
      action: 'delete',
      entity: 'log',
      summary: `Cleared ${result.deletedCount} ${filter.level ? `${filter.level} ` : ''}server logs`
    })
    return res.json({ success: true, deleted: result.deletedCount })
  } catch (error) {
    console.error('Failed to clear server logs:', error.message)
    return res.status(500).json({ success: false, message: 'Failed to clear logs' })
  }
}
