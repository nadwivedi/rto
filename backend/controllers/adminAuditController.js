const jwt = require('jsonwebtoken')
const AuditAccess = require('../models/AuditAccess')
const ActivityLog = require('../models/ActivityLog')
const { logError } = require('../utils/errorLogger')

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production'
const SESSION_HOURS = 8
const MAX_FAILED_ATTEMPTS = 5
const LOCKOUT_MS = 15 * 60 * 1000
const MAX_ITEMS = 2000

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
}

// Failed password attempts per admin, kept in memory: { count, lockedUntil }
const failedAttempts = new Map()

const notFound = (res) => res.status(404).json({ success: false, message: 'Not found' })

// Lets the request through only with a valid unlock cookie issued to this same admin.
// Anything else looks like a route that does not exist.
exports.requireAuditSession = (req, res, next) => {
  try {
    const token = req.cookies.auditToken
    if (!token) return notFound(res)
    const decoded = jwt.verify(token, JWT_SECRET)
    if (decoded.type !== 'audit' || String(decoded.id) !== String(req.admin?.id)) return notFound(res)
    next()
  } catch {
    return notFound(res)
  }
}

// POST /api/admin/audit/unlock { password }
exports.unlock = async (req, res) => {
  try {
    const adminKey = String(req.admin.id)
    const attempt = failedAttempts.get(adminKey)
    if (attempt?.lockedUntil && attempt.lockedUntil > Date.now()) {
      const minutes = Math.ceil((attempt.lockedUntil - Date.now()) / 60000)
      return res.status(429).json({ success: false, message: `Too many attempts. Try again in ${minutes} min.` })
    }

    const { password } = req.body || {}
    const access = await AuditAccess.findOne({ key: 'activity-center' })
    const valid = Boolean(password && access && (await access.comparePassword(String(password))))

    if (!valid) {
      const count = (attempt?.lockedUntil && attempt.lockedUntil <= Date.now() ? 0 : attempt?.count || 0) + 1
      failedAttempts.set(adminKey, {
        count,
        lockedUntil: count >= MAX_FAILED_ATTEMPTS ? Date.now() + LOCKOUT_MS : null
      })
      return res.status(401).json({ success: false, message: 'Incorrect password' })
    }

    failedAttempts.delete(adminKey)

    const token = jwt.sign({ id: req.admin.id, type: 'audit' }, JWT_SECRET, { expiresIn: `${SESSION_HOURS}h` })
    res.cookie('auditToken', token, { ...cookieOptions, maxAge: SESSION_HOURS * 60 * 60 * 1000 })
    res.json({ success: true })
  } catch (error) {
    logError(error, req)
    res.status(500).json({ success: false, message: 'Something went wrong' })
  }
}

// POST /api/admin/audit/lock
exports.lock = (req, res) => {
  res.clearCookie('auditToken', cookieOptions)
  res.json({ success: true })
}

// 'YYYY-MM-DD' in India time -> Date
const istDate = (iso, endOfDay) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(iso || ''))) return null
  const date = new Date(`${iso}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}+05:30`)
  return Number.isNaN(date.getTime()) ? null : date
}

// GET /api/admin/audit/activity?from=YYYY-MM-DD&to=YYYY-MM-DD
exports.getActivity = async (req, res) => {
  try {
    const from = istDate(req.query.from, false)
    const to = istDate(req.query.to, true)
    if (!from || !to || from > to) {
      return res.status(400).json({ success: false, message: 'Please choose a valid date range' })
    }

    const match = { createdAt: { $gte: from, $lte: to } }

    const [items, byAction, total] = await Promise.all([
      ActivityLog.find(match).sort({ createdAt: -1 }).limit(MAX_ITEMS).lean(),
      ActivityLog.aggregate([{ $match: match }, { $group: { _id: '$action', count: { $sum: 1 } } }]),
      ActivityLog.countDocuments(match)
    ])

    const totals = { total }
    for (const row of byAction) totals[row._id] = row.count

    res.json({
      success: true,
      data: {
        items,
        totals,
        truncated: total > items.length
      }
    })
  } catch (error) {
    logError(error, req)
    res.status(500).json({ success: false, message: 'Failed to load activity' })
  }
}
