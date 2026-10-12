const mongoose = require('mongoose')
const ApiCreditTransaction = require('../models/ApiCreditTransaction')
const User = require('../models/User')
const RcSearchUsage = require('../models/RcSearchUsage')
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

// Rupee amounts are kept to 2 decimals (rates like 1.4 x 2000 would otherwise drift)
const roundMoney = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100

// List transactions (newest first), optionally filtered by type and user
exports.getTransactions = async (req, res) => {
  try {
    const { type, userId, page = 1, limit = 50 } = req.query

    const query = {}
    if (type === 'purchase' || type === 'sale') query.type = type
    if (userId) {
      if (!mongoose.isValidObjectId(userId)) return badRequest(res, 'Invalid user')
      query.userId = userId
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1)
    const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10) || 50))

    const [totalRecords, transactions] = await Promise.all([
      ApiCreditTransaction.countDocuments(query),
      ApiCreditTransaction.find(query)
        .populate('userId', 'name mobile1 state rto')
        .sort({ date: -1, createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean()
    ])

    res.json({
      success: true,
      count: transactions.length,
      data: transactions,
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

// Record a purchase from the provider, or a sale to a user (which raises the user's limit)
exports.createTransaction = async (req, res) => {
  try {
    const { type, userId, quantity, rate, date, note } = req.body

    if (type !== 'purchase' && type !== 'sale') {
      return badRequest(res, 'Type must be purchase or sale')
    }

    const qty = Number(quantity)
    if (!Number.isInteger(qty) || qty < 1) {
      return badRequest(res, 'Quantity must be a whole number of at least 1')
    }

    const price = Number(rate)
    if (rate === '' || rate === null || rate === undefined || Number.isNaN(price) || price < 0) {
      return badRequest(res, 'Rate per API call is required')
    }

    const dealDate = date ? new Date(date) : new Date()
    if (Number.isNaN(dealDate.getTime())) {
      return badRequest(res, 'Please enter a valid date')
    }

    let user = null
    if (type === 'sale') {
      if (!userId || !mongoose.isValidObjectId(userId)) {
        return badRequest(res, 'Please select a user')
      }
      user = await User.findById(userId).select('name')
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' })
      }
    }

    const transaction = await ApiCreditTransaction.create({
      type,
      userId: type === 'sale' ? userId : undefined,
      quantity: qty,
      rate: price,
      amount: roundMoney(qty * price),
      date: dealDate,
      note: note && String(note).trim() ? String(note).trim() : undefined
    })

    let updatedUser = null
    if (type === 'sale') {
      try {
        // Add the bought searches to the user's limit and make sure they can use them
        updatedUser = await User.findByIdAndUpdate(
          userId,
          { $inc: { rcSearchLimit: qty }, $set: { 'features.rcDetails': true } },
          { new: true }
        ).select('name mobile1 rcSearchLimit rcSearchCount features')
        if (!updatedUser) throw new Error('User not found')
      } catch (err) {
        // Don't leave a sale on the books that never reached the user's limit
        await ApiCreditTransaction.deleteOne({ _id: transaction._id }).catch(() => {})
        throw err
      }
    }

    recordActivity(req, {
      action: 'create',
      entity: 'api_credit',
      entityId: transaction._id,
      entityName: type === 'sale' ? user.name : 'Provider purchase',
      summary:
        type === 'sale'
          ? `Sold ${qty} vehicle API calls to ${user.name} @ ₹${price} (₹${transaction.amount}). Limit +${qty}`
          : `Recorded purchase of ${qty} vehicle API calls @ ₹${price} (₹${transaction.amount})`,
      changes: [
        { field: 'Type', from: null, to: type === 'sale' ? 'Sale' : 'Purchase' },
        { field: 'Quantity', from: null, to: qty },
        { field: 'Rate', from: null, to: price },
        { field: 'Amount', from: null, to: transaction.amount },
        ...(updatedUser ? [{ field: 'User RC Search Limit', from: updatedUser.rcSearchLimit - qty, to: updatedUser.rcSearchLimit }] : []),
        ...(transaction.note ? [{ field: 'Note', from: null, to: transaction.note }] : [])
      ]
    })

    res.status(201).json({
      success: true,
      message:
        type === 'sale'
          ? `Sold ${qty} API calls to ${user.name}. Limit increased by ${qty}.`
          : `Recorded purchase of ${qty} API calls`,
      data: {
        transaction,
        user: updatedUser
          ? {
              id: updatedUser._id,
              name: updatedUser.name,
              rcSearchLimit: updatedUser.rcSearchLimit || 0,
              rcSearchCount: updatedUser.rcSearchCount || 0,
              rcSearchRemaining: Math.max(0, (updatedUser.rcSearchLimit || 0) - (updatedUser.rcSearchCount || 0))
            }
          : null
      }
    })
  } catch (error) {
    sendError(res, req, error, error.name === 'ValidationError' ? 400 : 500)
  }
}

// Delete an entry. Deleting a sale takes the sold searches back off the user's limit.
exports.deleteTransaction = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return badRequest(res, 'Invalid entry')

    const transaction = await ApiCreditTransaction.findByIdAndDelete(req.params.id)
    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Entry not found' })
    }

    let limitReducedBy = 0
    let saleUserName = null
    if (transaction.type === 'sale' && transaction.userId) {
      const user = await User.findById(transaction.userId).select('name rcSearchLimit')
      if (user) {
        saleUserName = user.name
        // Never push the limit below zero if it was lowered by hand in the meantime
        limitReducedBy = Math.min(user.rcSearchLimit || 0, transaction.quantity)
        user.rcSearchLimit = (user.rcSearchLimit || 0) - limitReducedBy
        await user.save()
      }
    }

    recordActivity(req, {
      action: 'delete',
      entity: 'api_credit',
      entityId: transaction._id,
      entityName: transaction.type === 'sale' ? saleUserName || 'Deleted user' : 'Provider purchase',
      summary:
        transaction.type === 'sale'
          ? `Deleted sale of ${transaction.quantity} vehicle API calls to ${saleUserName || 'a deleted user'} (₹${transaction.amount}). Limit -${limitReducedBy}`
          : `Deleted purchase of ${transaction.quantity} vehicle API calls (₹${transaction.amount})`,
      changes: [
        { field: 'Type', from: transaction.type === 'sale' ? 'Sale' : 'Purchase', to: null },
        { field: 'Quantity', from: transaction.quantity, to: null },
        { field: 'Rate', from: transaction.rate, to: null },
        { field: 'Amount', from: transaction.amount, to: null },
        { field: 'Date', from: transaction.date ? transaction.date.toISOString().slice(0, 10) : null, to: null }
      ]
    })

    res.json({
      success: true,
      message:
        transaction.type === 'sale'
          ? `Sale deleted. User limit reduced by ${limitReducedBy}.`
          : 'Purchase deleted',
      data: { limitReducedBy }
    })
  } catch (error) {
    sendError(res, req, error)
  }
}

// 'YYYY-MM-DD' moved by a number of days
const shiftDate = (iso, days) => {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10)
}

// How many searches users actually made: day-wise for the last 28 days, and per user for today / 7 / 28 days
exports.getUsage = async (req, res) => {
  try {
    const today = RcSearchUsage.todayIST()
    const from7 = shiftDate(today, -6)
    const from28 = shiftDate(today, -27)

    const [rows, firstRow] = await Promise.all([
      RcSearchUsage.find({ date: { $gte: from28, $lte: today } }).select('userId date count').lean(),
      RcSearchUsage.findOne({}).sort({ date: 1 }).select('date').lean()
    ])

    // One entry per day, newest first, including days with no searches
    const dayMap = new Map()
    for (let i = 0; i < 28; i++) {
      const date = shiftDate(today, -i)
      dayMap.set(date, { date, count: 0, users: 0 })
    }

    const userMap = new Map()
    const totals = { today: 0, last7: 0, last28: 0 }
    for (const row of rows) {
      const day = dayMap.get(row.date)
      if (!day || !row.count) continue
      day.count += row.count
      day.users += 1

      const key = String(row.userId)
      if (!userMap.has(key)) userMap.set(key, { userId: row.userId, today: 0, last7: 0, last28: 0 })
      const usage = userMap.get(key)
      usage.last28 += row.count
      totals.last28 += row.count
      if (row.date >= from7) {
        usage.last7 += row.count
        totals.last7 += row.count
      }
      if (row.date === today) {
        usage.today += row.count
        totals.today += row.count
      }
    }

    const users = await User.find({ _id: { $in: Array.from(userMap.values()).map((u) => u.userId) } })
      .select('name mobile1 rcSearchLimit rcSearchCount')
      .lean()
    const usersById = new Map(users.map((u) => [String(u._id), u]))

    // Counting started when this feature went live, so averages only use the days that were counted
    const trackingSince = firstRow?.date || null
    const trackedDays = trackingSince
      ? Math.round((Date.parse(today) - Date.parse(trackingSince)) / 86400000) + 1
      : 0
    const average = (total, windowDays) => {
      const days = Math.min(windowDays, trackedDays)
      return days > 0 ? Math.round((total / days) * 10) / 10 : 0
    }

    res.json({
      success: true,
      data: {
        today,
        trackingSince,
        trackedDays,
        totals: {
          ...totals,
          avg7: average(totals.last7, 7),
          avg28: average(totals.last28, 28)
        },
        days: Array.from(dayMap.values()),
        users: Array.from(userMap.values())
          .map((usage) => {
            const user = usersById.get(String(usage.userId))
            return {
              ...usage,
              name: user?.name,
              mobile1: user?.mobile1,
              rcSearchLimit: user?.rcSearchLimit || 0,
              rcSearchCount: user?.rcSearchCount || 0,
              rcSearchRemaining: Math.max(0, (user?.rcSearchLimit || 0) - (user?.rcSearchCount || 0))
            }
          })
          .sort((a, b) => b.last28 - a.last28 || b.last7 - a.last7)
      }
    })
  } catch (error) {
    sendError(res, req, error)
  }
}

// Totals, month-wise cashflow and per-user sales
exports.getSummary = async (req, res) => {
  try {
    const [byType, byMonth, byUser, lastPurchase, lastSale] = await Promise.all([
      ApiCreditTransaction.aggregate([
        {
          $group: {
            _id: '$type',
            quantity: { $sum: '$quantity' },
            amount: { $sum: '$amount' },
            entries: { $sum: 1 }
          }
        }
      ]),
      ApiCreditTransaction.aggregate([
        {
          $group: {
            _id: {
              month: { $dateToString: { format: '%Y-%m', date: '$date', timezone: IST } },
              type: '$type'
            },
            quantity: { $sum: '$quantity' },
            amount: { $sum: '$amount' }
          }
        },
        { $sort: { '_id.month': -1 } }
      ]),
      ApiCreditTransaction.aggregate([
        { $match: { type: 'sale', userId: { $ne: null } } },
        {
          $group: {
            _id: '$userId',
            quantity: { $sum: '$quantity' },
            amount: { $sum: '$amount' },
            entries: { $sum: 1 },
            lastDate: { $max: '$date' }
          }
        },
        { $sort: { amount: -1 } },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
        { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 0,
            userId: '$_id',
            name: '$user.name',
            mobile1: '$user.mobile1',
            rcSearchLimit: { $ifNull: ['$user.rcSearchLimit', 0] },
            rcSearchCount: { $ifNull: ['$user.rcSearchCount', 0] },
            quantity: 1,
            amount: 1,
            entries: 1,
            lastDate: 1
          }
        }
      ]),
      ApiCreditTransaction.findOne({ type: 'purchase' }).sort({ date: -1, createdAt: -1 }).select('rate').lean(),
      ApiCreditTransaction.findOne({ type: 'sale' }).sort({ date: -1, createdAt: -1 }).select('rate').lean()
    ])

    const pick = (type) => byType.find((t) => t._id === type) || { quantity: 0, amount: 0, entries: 0 }
    const purchase = pick('purchase')
    const sale = pick('sale')

    const avgBuyRate = purchase.quantity ? purchase.amount / purchase.quantity : null
    const avgSellRate = sale.quantity ? sale.amount / sale.quantity : null

    // Pivot month/type rows into one row per month
    const monthMap = new Map()
    for (const row of byMonth) {
      const key = row._id.month
      if (!monthMap.has(key)) {
        monthMap.set(key, { month: key, boughtQty: 0, boughtAmount: 0, soldQty: 0, soldAmount: 0 })
      }
      const m = monthMap.get(key)
      if (row._id.type === 'purchase') {
        m.boughtQty = row.quantity
        m.boughtAmount = roundMoney(row.amount)
      } else {
        m.soldQty = row.quantity
        m.soldAmount = roundMoney(row.amount)
      }
    }
    const months = Array.from(monthMap.values())
      .sort((a, b) => (a.month < b.month ? 1 : -1))
      .map((m) => ({ ...m, net: roundMoney(m.soldAmount - m.boughtAmount) }))

    res.json({
      success: true,
      data: {
        totals: {
          boughtQty: purchase.quantity,
          boughtAmount: roundMoney(purchase.amount),
          soldQty: sale.quantity,
          soldAmount: roundMoney(sale.amount),
          avgBuyRate: avgBuyRate === null ? null : roundMoney(avgBuyRate),
          avgSellRate: avgSellRate === null ? null : roundMoney(avgSellRate),
          // Money in from users minus money out to the provider
          netCashflow: roundMoney(sale.amount - purchase.amount),
          // What was earned on the calls actually sold, at the average buying price
          profitOnSold: avgBuyRate === null ? null : roundMoney(sale.amount - sale.quantity * avgBuyRate),
          // Bought from the provider but not yet sold to any user
          unsoldQty: purchase.quantity - sale.quantity
        },
        lastRates: {
          purchase: lastPurchase?.rate ?? null,
          sale: lastSale?.rate ?? null
        },
        months,
        users: byUser.map((u) => ({
          ...u,
          amount: roundMoney(u.amount),
          rcSearchRemaining: Math.max(0, (u.rcSearchLimit || 0) - (u.rcSearchCount || 0))
        }))
      }
    })
  } catch (error) {
    sendError(res, req, error)
  }
}
