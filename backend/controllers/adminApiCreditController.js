const mongoose = require('mongoose')
const ApiCreditTransaction = require('../models/ApiCreditTransaction')
const User = require('../models/User')
const RcSearchUsage = require('../models/RcSearchUsage')
const ApiKeySale = require('../models/ApiKeySale')
const ApiKey = require('../models/ApiKey')
const ApiKeyCall = require('../models/ApiKeyCall')
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

// Change the rate of an entry. Only the price moves: the quantity (and so the user's limit) stays as it is.
exports.updateTransactionRate = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return badRequest(res, 'Invalid entry')

    const { rate } = req.body || {}
    const price = Number(rate)
    if (rate === '' || rate === null || rate === undefined || Number.isNaN(price) || price < 0) {
      return badRequest(res, 'Rate per API call is required')
    }

    const transaction = await ApiCreditTransaction.findById(req.params.id).populate('userId', 'name')
    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Entry not found' })
    }

    const oldRate = transaction.rate
    const oldAmount = transaction.amount
    transaction.rate = price
    transaction.amount = roundMoney(transaction.quantity * price)
    await transaction.save()

    if (oldRate !== transaction.rate) {
      const userName = transaction.userId?.name
      recordActivity(req, {
        action: 'update',
        entity: 'api_credit',
        entityId: transaction._id,
        entityName: transaction.type === 'sale' ? userName || 'Deleted user' : 'Provider purchase',
        summary:
          transaction.type === 'sale'
            ? `Changed rate of sale of ${transaction.quantity} vehicle API calls to ${userName || 'a deleted user'}: ₹${oldRate} → ₹${transaction.rate}`
            : `Changed rate of purchase of ${transaction.quantity} vehicle API calls: ₹${oldRate} → ₹${transaction.rate}`,
        changes: [
          { field: 'Rate', from: oldRate, to: transaction.rate },
          { field: 'Amount', from: oldAmount, to: transaction.amount }
        ]
      })
    }

    res.json({
      success: true,
      message: `Rate updated to ₹${transaction.rate}. Amount is now ₹${transaction.amount}.`,
      data: transaction
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

// API key calls that used the key's limit. Calls logged before `charged` existed count when they returned details.
const CHARGED_KEY_CALL = { $or: [{ charged: true }, { charged: { $exists: false }, success: true }] }

// How many searches were actually made, by app users (RC search) and by API keys:
// day-wise for the last 28 days, and per user / per key for today / 7 / 28 days
exports.getUsage = async (req, res) => {
  try {
    const today = RcSearchUsage.todayIST()
    const from7 = shiftDate(today, -6)
    const from28 = shiftDate(today, -27)

    const [rows, firstRow, keyRows, firstKeyCall] = await Promise.all([
      RcSearchUsage.find({ date: { $gte: from28, $lte: today } }).select('userId date count').lean(),
      RcSearchUsage.findOne({}).sort({ date: 1 }).select('date').lean(),
      ApiKeyCall.aggregate([
        { $match: { date: { $gte: from28, $lte: today }, ...CHARGED_KEY_CALL } },
        // Calls logged before `source` was saved were all API 1
        { $group: { _id: { apiKeyId: '$apiKeyId', date: '$date', source: { $ifNull: ['$source', 'rtosarthi_api1'] } }, count: { $sum: 1 } } }
      ]),
      ApiKeyCall.findOne(CHARGED_KEY_CALL).sort({ date: 1 }).select('date').lean()
    ])

    // One entry per day, newest first, including days with no searches
    const dayMap = new Map()
    for (let i = 0; i < 28; i++) {
      const date = shiftDate(today, -i)
      dayMap.set(date, { date, count: 0, appCount: 0, keyCount: 0, api1Count: 0, api2Count: 0, users: 0, keys: 0, keyIds: new Set() })
    }

    const totals = { today: 0, last7: 0, last28: 0, appLast28: 0, keyLast28: 0, api1Last28: 0, api2Last28: 0, api1Today: 0, api2Today: 0 }
    // Adds one day's count to the day, the totals and the user / key row it belongs to
    const add = (map, id, base, row, kind) => {
      const day = dayMap.get(row.date)
      if (!day || !row.count) return
      day.count += row.count
      if (kind === 'key') {
        const api = row.source === 'rtosarthi_api2' ? 'api2' : 'api1'
        day.keyCount += row.count
        day[`${api}Count`] += row.count
        // A key can have API 1 and API 2 calls on the same day; count it once
        if (!day.keyIds.has(id)) {
          day.keyIds.add(id)
          day.keys += 1
        }
        totals.keyLast28 += row.count
        totals[`${api}Last28`] += row.count
        if (row.date === today) totals[`${api}Today`] += row.count
      } else {
        day.appCount += row.count
        day.users += 1
        totals.appLast28 += row.count
      }

      if (!map.has(id)) map.set(id, { ...base, today: 0, last7: 0, last28: 0, api1Last28: 0, api2Last28: 0 })
      const usage = map.get(id)
      if (kind === 'key') usage[row.source === 'rtosarthi_api2' ? 'api2Last28' : 'api1Last28'] += row.count
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

    const userMap = new Map()
    for (const row of rows) add(userMap, String(row.userId), { userId: row.userId }, row, 'user')
    const keyMap = new Map()
    for (const row of keyRows) {
      const { apiKeyId, date, source } = row._id
      add(keyMap, String(apiKeyId), { apiKeyId }, { date, source, count: row.count }, 'key')
    }

    const [users, keys] = await Promise.all([
      User.find({ _id: { $in: Array.from(userMap.values()).map((u) => u.userId) } })
        .select('name mobile1 rcSearchLimit rcSearchCount')
        .lean(),
      ApiKey.find({ _id: { $in: Array.from(keyMap.values()).map((k) => k.apiKeyId) } })
        .select('name callLimit callCount active userId provider')
        .populate('userId', 'name')
        .lean()
    ])
    const usersById = new Map(users.map((u) => [String(u._id), u]))
    const keysById = new Map(keys.map((k) => [String(k._id), k]))

    // Counting started when this feature went live, so averages only use the days that were counted
    const firstDates = [firstRow?.date, firstKeyCall?.date].filter(Boolean).sort()
    const trackingSince = firstDates[0] || null
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
        days: Array.from(dayMap.values()).map(({ keyIds, ...day }) => day),
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
          .sort((a, b) => b.last28 - a.last28 || b.last7 - a.last7),
        apiKeys: Array.from(keyMap.values())
          .map((usage) => {
            const key = keysById.get(String(usage.apiKeyId))
            return {
              ...usage,
              name: key?.name,
              active: key ? key.active : false,
              provider: key?.provider || 'api1',
              userName: key?.userId?.name || '',
              callLimit: key?.callLimit || 0,
              callCount: key?.callCount || 0,
              remaining: Math.max(0, (key?.callLimit || 0) - (key?.callCount || 0))
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
    // Sales dated today (India), from users and from API keys
    const today = RcSearchUsage.todayIST()
    const todayMatch = { $expr: { $eq: [{ $dateToString: { format: '%Y-%m-%d', date: '$date', timezone: IST } }, today] } }
    const todayTotal = { $group: { _id: null, quantity: { $sum: '$quantity' }, amount: { $sum: '$amount' }, entries: { $sum: 1 } } }

    const [byType, byMonth, byUser, lastPurchase, lastSale, keySales, keySalesByMonth, userSalesToday, keySalesToday] = await Promise.all([
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
      ApiCreditTransaction.findOne({ type: 'sale' }).sort({ date: -1, createdAt: -1 }).select('rate').lean(),
      // Calls sold on API keys are sales of the same provider calls
      ApiKeySale.aggregate([{ $group: { _id: null, quantity: { $sum: '$quantity' }, amount: { $sum: '$amount' } } }]),
      ApiKeySale.aggregate([
        {
          $group: {
            _id: { month: { $dateToString: { format: '%Y-%m', date: '$date', timezone: IST } }, type: 'sale' },
            quantity: { $sum: '$quantity' },
            amount: { $sum: '$amount' }
          }
        }
      ]),
      ApiCreditTransaction.aggregate([{ $match: { type: 'sale', ...todayMatch } }, todayTotal]),
      ApiKeySale.aggregate([{ $match: todayMatch }, todayTotal])
    ])

    const pick = (type) => byType.find((t) => t._id === type) || { quantity: 0, amount: 0, entries: 0 }
    const purchase = pick('purchase')
    const userSale = pick('sale')
    const keySale = keySales[0] || { quantity: 0, amount: 0 }
    const sale = { quantity: userSale.quantity + keySale.quantity, amount: userSale.amount + keySale.amount }

    const avgBuyRate = purchase.quantity ? purchase.amount / purchase.quantity : null
    const avgSellRate = sale.quantity ? sale.amount / sale.quantity : null

    // Pivot month/type rows into one row per month
    const monthMap = new Map()
    for (const row of [...byMonth, ...keySalesByMonth]) {
      const key = row._id.month
      if (!monthMap.has(key)) {
        monthMap.set(key, { month: key, boughtQty: 0, boughtAmount: 0, soldQty: 0, soldAmount: 0 })
      }
      const m = monthMap.get(key)
      if (row._id.type === 'purchase') {
        m.boughtQty += row.quantity
        m.boughtAmount = roundMoney(m.boughtAmount + row.amount)
      } else {
        m.soldQty += row.quantity
        m.soldAmount = roundMoney(m.soldAmount + row.amount)
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
          // Part of the sold figures that came from API keys
          keySoldQty: keySale.quantity,
          keySoldAmount: roundMoney(keySale.amount),
          avgBuyRate: avgBuyRate === null ? null : roundMoney(avgBuyRate),
          avgSellRate: avgSellRate === null ? null : roundMoney(avgSellRate),
          // Money in from users minus money out to the provider
          netCashflow: roundMoney(sale.amount - purchase.amount),
          // What was earned on the calls actually sold, at the average buying price
          profitOnSold: avgBuyRate === null ? null : roundMoney(sale.amount - sale.quantity * avgBuyRate),
          // Bought from the provider but not yet sold to any user
          unsoldQty: purchase.quantity - sale.quantity
        },
        today: {
          date: today,
          quantity: (userSalesToday[0]?.quantity || 0) + (keySalesToday[0]?.quantity || 0),
          amount: roundMoney((userSalesToday[0]?.amount || 0) + (keySalesToday[0]?.amount || 0)),
          entries: (userSalesToday[0]?.entries || 0) + (keySalesToday[0]?.entries || 0),
          keyAmount: roundMoney(keySalesToday[0]?.amount || 0)
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
