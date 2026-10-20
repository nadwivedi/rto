const mongoose = require('mongoose')
const FitnessWork = require('../models/FitnessWork')
const User = require('../models/User')
const { logError, getUserFriendlyError, getSimplifiedTimestamp } = require('../utils/errorLogger')
const { recordActivity } = require('../utils/activityLog')

const IST = 'Asia/Kolkata'

const sendError = (res, req, error, status = 500) => {
  logError(error, req)
  const userError = getUserFriendlyError(error)
  res.status(status).json({
    success: false,
    message: userError.message,
    errors: userError.details,
    errorCount: userError.errorCount,
    timestamp: getSimplifiedTimestamp()
  })
}

const badRequest = (res, message) =>
  res.status(400).json({
    success: false,
    message,
    errors: [message],
    errorCount: 1,
    timestamp: getSimplifiedTimestamp()
  })

const roundMoney = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100

const isBlank = (v) => v === '' || v === null || v === undefined

const dayKey = (date) => (date ? date.toLocaleDateString('en-CA', { timeZone: IST }) : null)

// Validates the body shared by create and update. Returns { error } or { user, values }.
const parseBody = async (body) => {
  const { userId, date, amount, profit, vehicleNumber, note } = body || {}

  if (!userId || !mongoose.isValidObjectId(userId)) return { error: 'Please select a party' }
  const user = await User.findById(userId).select('name')
  if (!user) return { error: 'Party not found' }

  // 'YYYY-MM-DD' from the form is read as midnight India time
  const workDate = date ? new Date(/^\d{4}-\d{2}-\d{2}$/.test(date) ? `${date}T00:00:00+05:30` : date) : new Date()
  if (Number.isNaN(workDate.getTime())) return { error: 'Please enter a valid date' }

  const workAmount = Number(amount)
  if (isBlank(amount) || Number.isNaN(workAmount) || workAmount < 0) {
    return { error: 'Please enter the work amount' }
  }

  const workProfit = Number(profit)
  if (isBlank(profit) || Number.isNaN(workProfit)) return { error: 'Please enter the profit amount' }

  return {
    user,
    values: {
      userId,
      date: workDate,
      amount: roundMoney(workAmount),
      profit: roundMoney(workProfit),
      vehicleNumber: vehicleNumber && String(vehicleNumber).trim() ? String(vehicleNumber).trim() : undefined,
      note: note && String(note).trim() ? String(note).trim() : undefined
    }
  }
}

// List entries (newest first), optionally filtered by party and date range, with totals for the filter
exports.getWorks = async (req, res) => {
  try {
    const { userId, from, to, page = 1, limit = 50 } = req.query

    const query = {}
    if (userId) {
      if (!mongoose.isValidObjectId(userId)) return badRequest(res, 'Invalid party')
      query.userId = new mongoose.Types.ObjectId(userId)
    }
    if (from || to) {
      query.date = {}
      if (from) query.date.$gte = new Date(`${from}T00:00:00+05:30`)
      if (to) query.date.$lte = new Date(`${to}T23:59:59.999+05:30`)
      if (Object.values(query.date).some((d) => Number.isNaN(d.getTime()))) {
        return badRequest(res, 'Please enter a valid date')
      }
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1)
    const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10) || 50))

    const [totalRecords, works, totals] = await Promise.all([
      FitnessWork.countDocuments(query),
      FitnessWork.find(query)
        .populate('userId', 'name mobile1')
        .sort({ date: -1, createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
      FitnessWork.aggregate([
        { $match: query },
        { $group: { _id: null, entries: { $sum: 1 }, amount: { $sum: '$amount' }, profit: { $sum: '$profit' } } }
      ])
    ])

    res.json({
      success: true,
      count: works.length,
      data: works,
      totals: {
        entries: totals[0]?.entries || 0,
        amount: roundMoney(totals[0]?.amount || 0),
        profit: roundMoney(totals[0]?.profit || 0)
      },
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalRecords / limitNum) || 1,
        totalRecords,
        limit: limitNum
      }
    })
  } catch (error) {
    sendError(res, req, error)
  }
}

// Overall, today, this month, month-wise and per-party totals
exports.getSummary = async (req, res) => {
  try {
    const todayKey = new Date().toLocaleDateString('en-CA', { timeZone: IST })
    const monthKey = todayKey.slice(0, 7)
    const sumFields = { entries: { $sum: 1 }, amount: { $sum: '$amount' }, profit: { $sum: '$profit' } }

    const [overall, months, today, parties] = await Promise.all([
      FitnessWork.aggregate([{ $group: { _id: null, ...sumFields } }]),
      FitnessWork.aggregate([
        { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$date', timezone: IST } }, ...sumFields } },
        { $sort: { _id: -1 } },
        { $limit: 12 }
      ]),
      FitnessWork.aggregate([
        {
          $match: {
            date: {
              $gte: new Date(`${todayKey}T00:00:00+05:30`),
              $lte: new Date(`${todayKey}T23:59:59.999+05:30`)
            }
          }
        },
        { $group: { _id: null, ...sumFields } }
      ]),
      FitnessWork.aggregate([
        { $group: { _id: '$userId', ...sumFields, lastDate: { $max: '$date' } } },
        { $sort: { profit: -1 } },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
        {
          $project: {
            entries: 1,
            amount: 1,
            profit: 1,
            lastDate: 1,
            name: { $arrayElemAt: ['$user.name', 0] },
            mobile1: { $arrayElemAt: ['$user.mobile1', 0] }
          }
        }
      ])
    ])

    const shape = (row) => ({
      entries: row?.entries || 0,
      amount: roundMoney(row?.amount || 0),
      profit: roundMoney(row?.profit || 0)
    })

    res.json({
      success: true,
      data: {
        overall: shape(overall[0]),
        today: shape(today[0]),
        thisMonth: shape(months.find((m) => m._id === monthKey)),
        months: months.map((m) => ({ month: m._id, ...shape(m) })),
        parties: parties.map((p) => ({
          userId: p._id,
          name: p.name || 'Deleted user',
          mobile1: p.mobile1,
          lastDate: p.lastDate,
          ...shape(p)
        }))
      }
    })
  } catch (error) {
    sendError(res, req, error)
  }
}

exports.createWork = async (req, res) => {
  try {
    const parsed = await parseBody(req.body)
    if (parsed.error) return badRequest(res, parsed.error)
    const { user, values } = parsed

    const work = await FitnessWork.create(values)

    recordActivity(req, {
      action: 'create',
      entity: 'fitness_work',
      entityId: work._id,
      entityName: user.name,
      summary: `Recorded fitness work from ${user.name}: ₹${work.amount}, profit ₹${work.profit}`,
      changes: [
        { field: 'Party', from: null, to: user.name },
        { field: 'Date', from: null, to: dayKey(work.date) },
        { field: 'Amount', from: null, to: work.amount },
        { field: 'Profit', from: null, to: work.profit },
        ...(work.vehicleNumber ? [{ field: 'Vehicle', from: null, to: work.vehicleNumber }] : []),
        ...(work.note ? [{ field: 'Note', from: null, to: work.note }] : [])
      ]
    })

    res.status(201).json({ success: true, message: `Fitness work from ${user.name} saved`, data: work })
  } catch (error) {
    sendError(res, req, error, error.name === 'ValidationError' ? 400 : 500)
  }
}

exports.updateWork = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return badRequest(res, 'Invalid entry')

    const work = await FitnessWork.findById(req.params.id).populate('userId', 'name')
    if (!work) return res.status(404).json({ success: false, message: 'Entry not found' })

    const parsed = await parseBody(req.body)
    if (parsed.error) return badRequest(res, parsed.error)
    const { user, values } = parsed

    const snapshot = (partyName) => ({
      Party: partyName,
      Date: dayKey(work.date),
      Amount: work.amount,
      Profit: work.profit,
      Vehicle: work.vehicleNumber || null,
      Note: work.note || null
    })
    const before = snapshot(work.userId?.name || 'Deleted user')

    work.set(values)
    await work.save()

    const after = snapshot(user.name)
    const changes = Object.keys(after)
      .filter((field) => before[field] !== after[field])
      .map((field) => ({ field, from: before[field], to: after[field] }))

    recordActivity(req, {
      action: 'update',
      entity: 'fitness_work',
      entityId: work._id,
      entityName: user.name,
      summary: `Edited fitness work from ${user.name}`,
      changes
    })

    res.json({ success: true, message: 'Fitness work updated', data: work })
  } catch (error) {
    sendError(res, req, error, error.name === 'ValidationError' ? 400 : 500)
  }
}

exports.deleteWork = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return badRequest(res, 'Invalid entry')

    const work = await FitnessWork.findByIdAndDelete(req.params.id).populate('userId', 'name')
    if (!work) return res.status(404).json({ success: false, message: 'Entry not found' })

    const partyName = work.userId?.name || 'Deleted user'
    recordActivity(req, {
      action: 'delete',
      entity: 'fitness_work',
      entityId: work._id,
      entityName: partyName,
      summary: `Deleted fitness work from ${partyName} (₹${work.amount}, profit ₹${work.profit})`,
      changes: [
        { field: 'Party', from: partyName, to: null },
        { field: 'Date', from: dayKey(work.date), to: null },
        { field: 'Amount', from: work.amount, to: null },
        { field: 'Profit', from: work.profit, to: null }
      ]
    })

    res.json({ success: true, message: 'Fitness work deleted' })
  } catch (error) {
    sendError(res, req, error)
  }
}
