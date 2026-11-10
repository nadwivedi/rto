const mongoose = require('mongoose')
const ApiCreditTransaction = require('../models/ApiCreditTransaction')
const User = require('../models/User')
const RcSearchUsage = require('../models/RcSearchUsage')
const HsrpSearchUsage = require('../models/HsrpSearchUsage')
const ApiKeySale = require('../models/ApiKeySale')
const ApiKey = require('../models/ApiKey')
const ApiKeyCall = require('../models/ApiKeyCall')
const { logError, getUserFriendlyError, getSimplifiedTimestamp } = require('../utils/errorLogger')
const { recordActivity } = require('../utils/activityLog')
const { PAID_EXPR, salePaid, parsePaid } = require('../utils/salePayment')

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

// What API calls are sold for. Each has its own limit / count on the user and a feature switch that a
// sale turns on. Rows saved before `product` existed are RC.
const PRODUCTS = {
  rc: { limit: 'rcSearchLimit', count: 'rcSearchCount', feature: 'rcDetails', label: 'Vehicle RC', short: 'RC' },
  hsrp: { limit: 'hsrpSearchLimit', count: 'hsrpSearchCount', feature: 'hsrp', label: 'HSRP', short: 'HSRP' }
}
const productOf = (value) => (value === 'hsrp' ? 'hsrp' : 'rc')
// Mongo filter for one product ('rc' / 'hsrp'), or none for 'all'
const productMatch = (product) => (product === 'hsrp' ? { product: 'hsrp' } : product === 'rc' ? { product: { $ne: 'hsrp' } } : {})
// ?product= on the list / summary / usage: 'rc', 'hsrp' or 'all' (default)
const productFilter = (value) => (value === 'rc' || value === 'hsrp' ? value : 'all')

// Days shown in the day-wise income table
const INCOME_DAYS = 30

// The last n India-time days as YYYY-MM-DD, newest first
const lastDaysIST = (n) => {
  const out = []
  const now = Date.now()
  for (let i = 0; i < n; i++) {
    out.push(new Date(now - i * 86400000).toLocaleDateString('en-CA', { timeZone: IST }))
  }
  return out
}

// List entries (newest first): purchases from the provider, sales to users and calls sold on API keys.
// type: 'all' (default), 'sales' (users + API keys), 'sale' (users only), 'key_sale' (API keys only), 'purchase'
// or 'adjustment' (a user's calls left re-priced at a new rate).
// userId: that user's sales plus the sales on API keys linked to them.
// API key sales come back with type 'sale', source 'key' and apiKeyId populated; the rest have source 'user'.
exports.getTransactions = async (req, res) => {
  try {
    const { type = 'all', userId, page = 1, limit = 50 } = req.query
    const product = productFilter(req.query.product)

    if (userId && !mongoose.isValidObjectId(userId)) return badRequest(res, 'Invalid user')
    const userObjectId = userId ? new mongoose.Types.ObjectId(String(userId)) : null

    const userTypes = { all: ['sale', 'purchase', 'adjustment'], sales: ['sale'], sale: ['sale'], purchase: ['purchase'], adjustment: ['adjustment'] }[type] || []
    // API key sales are vehicle (RC) calls
    const withKeySales = ['all', 'sales', 'key_sale'].includes(type) && product !== 'hsrp'

    // A user filter leaves out provider purchases, which belong to no user
    const txnMatch = { type: { $in: userObjectId ? userTypes.filter((t) => t !== 'purchase') : userTypes }, ...productMatch(product) }
    if (userObjectId) txnMatch.userId = userObjectId
    const keyMatch = {}
    if (userObjectId) {
      const keys = await ApiKey.find({ userId: userObjectId }).select('_id').lean()
      keyMatch.apiKeyId = { $in: keys.map((k) => k._id) }
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1)
    const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10) || 50))

    const pipeline = [
      { $match: txnMatch },
      { $addFields: { source: 'user' } }
    ]
    if (withKeySales) {
      pipeline.push({
        $unionWith: {
          coll: ApiKeySale.collection.name,
          pipeline: [{ $match: keyMatch }, { $addFields: { type: 'sale', source: 'key', product: 'rc' } }]
        }
      })
    }
    pipeline.push(
      { $sort: { date: -1, createdAt: -1, _id: -1 } },
      { $facet: { rows: [{ $skip: (pageNum - 1) * limitNum }, { $limit: limitNum }], total: [{ $count: 'n' }] } }
    )

    const [result] = await ApiCreditTransaction.aggregate(pipeline)
    let transactions = result?.rows || []
    const totalRecords = result?.total?.[0]?.n || 0
    transactions = await User.populate(transactions, { path: 'userId', select: 'name mobile1 state rto', model: User })
    transactions = await ApiKey.populate(transactions, {
      path: 'apiKeyId',
      select: 'name userId',
      model: ApiKey,
      populate: { path: 'userId', select: 'name mobile1', model: User }
    })

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
    const { type, userId, quantity, rate, date, note, paidAmount } = req.body
    const product = productOf(req.body.product)
    const P = PRODUCTS[product]

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

    const amount = roundMoney(qty * price)
    // Only sales track money still to come in
    const paid = type === 'sale' ? parsePaid(paidAmount, amount) : { value: undefined }
    if (paid.error) return badRequest(res, paid.error)

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
      product,
      userId: type === 'sale' ? userId : undefined,
      quantity: qty,
      rate: price,
      amount,
      paidAmount: paid.value,
      date: dealDate,
      note: note && String(note).trim() ? String(note).trim() : undefined
    })

    let updatedUser = null
    if (type === 'sale') {
      try {
        // Add the bought searches to the user's limit and make sure they can use them
        updatedUser = await User.findByIdAndUpdate(
          userId,
          { $inc: { [P.limit]: qty }, $set: { [`features.${P.feature}`]: true } },
          { new: true }
        ).select(`name mobile1 ${P.limit} ${P.count} features`)
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
          ? `Sold ${qty} ${P.label} API calls to ${user.name} @ ₹${price} (₹${transaction.amount}). Limit +${qty}`
          : `Recorded purchase of ${qty} ${P.label} API calls @ ₹${price} (₹${transaction.amount})`,
      changes: [
        { field: 'Type', from: null, to: type === 'sale' ? 'Sale' : 'Purchase' },
        { field: 'Product', from: null, to: P.label },
        { field: 'Quantity', from: null, to: qty },
        { field: 'Rate', from: null, to: price },
        { field: 'Amount', from: null, to: transaction.amount },
        ...(type === 'sale' ? [{ field: 'Paid', from: null, to: transaction.paidAmount }] : []),
        ...(updatedUser ? [{ field: `User ${P.short} Search Limit`, from: updatedUser[P.limit] - qty, to: updatedUser[P.limit] }] : []),
        ...(transaction.note ? [{ field: 'Note', from: null, to: transaction.note }] : [])
      ]
    })

    res.status(201).json({
      success: true,
      message:
        type === 'sale'
          ? `Sold ${qty} ${P.label} calls to ${user.name}. ${P.short} limit increased by ${qty}.`
          : `Recorded purchase of ${qty} ${P.label} calls`,
      data: {
        transaction,
        user: updatedUser
          ? {
              id: updatedUser._id,
              name: updatedUser.name,
              product,
              limit: updatedUser[P.limit] || 0,
              count: updatedUser[P.count] || 0,
              remaining: Math.max(0, (updatedUser[P.limit] || 0) - (updatedUser[P.count] || 0))
            }
          : null
      }
    })
  } catch (error) {
    sendError(res, req, error, error.name === 'ValidationError' ? 400 : 500)
  }
}

// Edit an entry: API calls, rate, money received, date and note.
// Changing a sale's API calls moves the user's limit by the difference; the user itself can't change.
exports.updateTransaction = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return badRequest(res, 'Invalid entry')

    const { rate, paidAmount, quantity, date, note } = req.body || {}
    const hasRate = rate !== undefined
    const hasPaid = paidAmount !== undefined
    const hasQty = quantity !== undefined
    const hasDate = date !== undefined
    const hasNote = note !== undefined
    if (!hasRate && !hasPaid && !hasQty && !hasDate && !hasNote) return badRequest(res, 'Nothing to update')

    const price = Number(rate)
    if (hasRate && (rate === '' || rate === null || Number.isNaN(price) || price < 0)) {
      return badRequest(res, 'Rate per API call is required')
    }
    const qty = Number(quantity)
    if (hasQty && (!Number.isInteger(qty) || qty < 1)) {
      return badRequest(res, 'Number of API calls must be a whole number of at least 1')
    }
    const dealDate = hasDate ? new Date(date) : null
    if (hasDate && (!date || Number.isNaN(dealDate.getTime()))) {
      return badRequest(res, 'Please enter a valid date')
    }

    const transaction = await ApiCreditTransaction.findById(req.params.id).populate('userId', 'name')
    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Entry not found' })
    }
    if (transaction.type === 'adjustment') {
      return badRequest(res, 'A rate adjustment cannot be edited. Delete it (the calls go back) and adjust again.')
    }

    const isSale = transaction.type === 'sale'
    const before = {
      quantity: transaction.quantity,
      rate: transaction.rate,
      amount: transaction.amount,
      paid: isSale ? salePaid(transaction) : undefined,
      date: transaction.date ? transaction.date.toISOString().slice(0, 10) : null,
      note: transaction.note || null
    }

    // A sale's calls are on the user's limit: move the limit by the difference
    let limitChange = 0
    if (hasQty && qty !== transaction.quantity && isSale && transaction.userId) {
      const field = PRODUCTS[productOf(transaction.product)].limit
      const user = await User.findById(transaction.userId._id).select(field)
      if (user) {
        const diff = qty - transaction.quantity
        // Never push the limit below zero if it was lowered by hand in the meantime
        limitChange = Math.max(diff, -(user[field] || 0))
        user[field] = (user[field] || 0) + limitChange
        await user.save()
      }
    }

    if (hasQty) transaction.quantity = qty
    if (hasRate) transaction.rate = price
    if (hasQty || hasRate) transaction.amount = roundMoney(transaction.quantity * transaction.rate)
    if (hasDate) transaction.date = dealDate
    if (hasNote) transaction.note = note && String(note).trim() ? String(note).trim() : undefined
    if (isSale) {
      if (hasPaid) {
        const paid = parsePaid(paidAmount, transaction.amount)
        if (paid.error) return badRequest(res, paid.error)
        transaction.paidAmount = paid.value
      } else if (transaction.paidAmount != null && transaction.paidAmount > transaction.amount) {
        // A lower amount can't leave more money received than the sale is worth
        transaction.paidAmount = transaction.amount
      }
    }
    await transaction.save()

    const after = {
      quantity: transaction.quantity,
      rate: transaction.rate,
      amount: transaction.amount,
      paid: isSale ? salePaid(transaction) : undefined,
      date: transaction.date ? transaction.date.toISOString().slice(0, 10) : null,
      note: transaction.note || null
    }
    const labels = { quantity: 'API Calls', rate: 'Rate', amount: 'Amount', paid: 'Paid', date: 'Date', note: 'Note' }
    const changes = Object.keys(labels)
      .filter((k) => before[k] !== after[k])
      .map((k) => ({ field: labels[k], from: before[k], to: after[k] }))

    if (changes.length) {
      const userName = transaction.userId?.name
      recordActivity(req, {
        action: 'update',
        entity: 'api_credit',
        entityId: transaction._id,
        entityName: isSale ? userName || 'Deleted user' : 'Provider purchase',
        summary: `Edited ${isSale ? `sale to ${userName || 'a deleted user'}` : 'purchase from provider'}: ${changes
          .map((ch) => `${ch.field} ${ch.from ?? '-'} → ${ch.to ?? '-'}`)
          .join(', ')}`,
        changes
      })
    }

    const limitNote = limitChange ? ` User limit ${limitChange > 0 ? '+' : ''}${limitChange}.` : ''
    res.json({
      success: true,
      message: isSale
        ? `Saved. ${transaction.quantity} calls, amount ₹${transaction.amount}, paid ₹${salePaid(transaction)}, pending ₹${roundMoney(transaction.amount - salePaid(transaction))}.${limitNote}`
        : `Saved. ${transaction.quantity} calls, amount ₹${transaction.amount}.`,
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

    if (transaction.type === 'adjustment') {
      const change = (transaction.callsBefore || 0) - transaction.quantity
      const field = PRODUCTS[productOf(transaction.product)].limit
      const user = transaction.userId ? await User.findById(transaction.userId).select(`name ${field}`) : null
      let limitChange = 0
      if (user) {
        // Never push the limit below zero if it was lowered by hand in the meantime
        limitChange = Math.max(change, -(user[field] || 0))
        user[field] = (user[field] || 0) + limitChange
        await user.save()
      }
      recordActivity(req, {
        action: 'delete',
        entity: 'api_credit',
        entityId: transaction._id,
        entityName: user?.name || 'Deleted user',
        summary: `Deleted rate adjustment (${transaction.callsBefore} calls @ ₹${transaction.oldRate} -> ${transaction.quantity} @ ₹${transaction.rate}). Limit ${limitChange >= 0 ? '+' : ''}${limitChange}`,
        changes: [
          { field: 'Type', from: 'Adjustment', to: null },
          { field: `User ${PRODUCTS[productOf(transaction.product)].short} Search Limit`, from: user ? user[field] - limitChange : null, to: user ? user[field] : null }
        ]
      })
      return res.json({
        success: true,
        message: `Adjustment deleted. User limit ${limitChange >= 0 ? '+' : ''}${limitChange}.`,
        data: { limitChange }
      })
    }

    let limitReducedBy = 0
    let saleUserName = null
    if (transaction.type === 'sale' && transaction.userId) {
      const field = PRODUCTS[productOf(transaction.product)].limit
      const user = await User.findById(transaction.userId).select(`name ${field}`)
      if (user) {
        saleUserName = user.name
        // Never push the limit below zero if it was lowered by hand in the meantime
        limitReducedBy = Math.min(user[field] || 0, transaction.quantity)
        user[field] = (user[field] || 0) - limitReducedBy
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

// The rate a user's calls left are worth now: the new rate of their latest adjustment or the rate of
// their latest sale, whichever is newer
const currentRateOf = (history) => history.find((t) => t.type === 'adjustment' || t.type === 'sale')?.rate ?? null

const userCredits = (user, product = 'rc') => {
  const P = PRODUCTS[product]
  const limit = user[P.limit] || 0
  const used = user[P.count] || 0
  return { limit, used, left: Math.max(0, limit - used) }
}

// What a rate adjustment for a user starts from: calls left, the sales and adjustments so far
// (newest first, with their rates) and the rate the calls left are valued at now
exports.getAdjustment = async (req, res) => {
  try {
    const { userId } = req.params
    if (!mongoose.isValidObjectId(userId)) return badRequest(res, 'Invalid user')
    const product = productOf(req.query.product)
    const [user, history] = await Promise.all([
      User.findById(userId).select('name mobile1 rcSearchLimit rcSearchCount hsrpSearchLimit hsrpSearchCount').lean(),
      ApiCreditTransaction.find({ userId, type: { $in: ['sale', 'adjustment'] }, ...productMatch(product) })
        .sort({ date: -1, createdAt: -1 })
        .select('type quantity rate amount paidAmount callsBefore oldRate balance date note')
        .limit(100)
        .lean()
    ])
    if (!user) return res.status(404).json({ success: false, message: 'User not found' })

    const sales = history.filter((t) => t.type === 'sale')
    const soldQty = sales.reduce((t, s) => t + s.quantity, 0)
    const soldAmount = roundMoney(sales.reduce((t, s) => t + s.amount, 0))
    res.json({
      success: true,
      data: {
        product,
        user: { _id: user._id, name: user.name, mobile1: user.mobile1, ...userCredits(user, product) },
        currentRate: currentRateOf(history),
        sales: { count: sales.length, quantity: soldQty, amount: soldAmount, avgRate: soldQty ? roundMoney(soldAmount / soldQty) : null },
        history
      }
    })
  } catch (error) {
    sendError(res, req, error)
  }
}

// Re-price a user's calls left: value = calls left x old rate, new calls = value / new rate (rounded down).
// The user's limit moves by the difference; any rupees too few for one more call are saved as leftover.
// Body: { userId, newRate, oldRate? (default: the current rate), date?, note? }
exports.createAdjustment = async (req, res) => {
  try {
    const { userId, newRate, oldRate, date, note } = req.body || {}
    const product = productOf(req.body?.product)
    const P = PRODUCTS[product]
    if (!userId || !mongoose.isValidObjectId(userId)) return badRequest(res, 'Please select a user')
    const price = Number(newRate)
    if (newRate === '' || newRate === null || newRate === undefined || Number.isNaN(price) || price <= 0) {
      return badRequest(res, 'Enter the new rate per API call (more than 0)')
    }
    const dealDate = date ? new Date(date) : new Date()
    if (Number.isNaN(dealDate.getTime())) return badRequest(res, 'Please enter a valid date')

    const user = await User.findById(userId).select(`name ${P.limit} ${P.count}`)
    if (!user) return res.status(404).json({ success: false, message: 'User not found' })
    const { limit, used, left } = userCredits(user, product)
    if (left <= 0) return badRequest(res, `${user.name} has no ${P.label} calls left to adjust`)

    let valueRate = Number(oldRate)
    if (oldRate === '' || oldRate === null || oldRate === undefined) {
      const history = await ApiCreditTransaction.find({ userId, type: { $in: ['sale', 'adjustment'] }, ...productMatch(product) })
        .sort({ date: -1, createdAt: -1 }).select('type rate').limit(1).lean()
      valueRate = currentRateOf(history)
    }
    if (valueRate === null || Number.isNaN(valueRate) || valueRate < 0) {
      return badRequest(res, 'Enter the rate the calls left were sold at')
    }

    const balance = roundMoney(left * valueRate)
    // A tiny epsilon so ₹800 / ₹4 is exactly 200, not 199.999…
    const callsAfter = Math.floor(balance / price + 1e-9)
    const leftover = roundMoney(balance - callsAfter * price)
    if (callsAfter === left) return badRequest(res, `No change: ${left} calls at ₹${valueRate} are still ${callsAfter} calls at ₹${price}`)

    // Only if the user did not search in the meantime, so the calls left are what was valued
    const newLimit = used + callsAfter
    const updated = await User.findOneAndUpdate(
      { _id: userId, [P.limit]: user[P.limit], [P.count]: user[P.count] },
      { $set: { [P.limit]: newLimit } },
      { new: true }
    ).select(`name ${P.limit} ${P.count}`)
    if (!updated) return res.status(409).json({ success: false, message: 'The user just made a search. Please open the adjustment again.' })

    const autoNote = `${left} calls @ ₹${valueRate} = ₹${balance} -> ${callsAfter} calls @ ₹${price}${leftover > 0 ? ` (₹${leftover} left over)` : ''}`
    let transaction
    try {
      transaction = await ApiCreditTransaction.create({
        type: 'adjustment',
        product,
        userId,
        quantity: callsAfter,
        rate: price,
        amount: balance,
        callsBefore: left,
        oldRate: valueRate,
        balance,
        date: dealDate,
        note: note && String(note).trim() ? `${String(note).trim()} · ${autoNote}` : autoNote
      })
    } catch (err) {
      // Don't leave the limit changed without the entry that explains it
      await User.updateOne({ _id: userId }, { $inc: { [P.limit]: limit - newLimit } }).catch(() => {})
      throw err
    }

    recordActivity(req, {
      action: 'create',
      entity: 'api_credit',
      entityId: transaction._id,
      entityName: user.name,
      summary: `${P.label} rate adjustment for ${user.name}: ${autoNote}. Limit ${limit} -> ${newLimit}`,
      changes: [
        { field: 'Type', from: null, to: 'Adjustment' },
        { field: 'Calls left', from: left, to: callsAfter },
        { field: 'Rate', from: valueRate, to: price },
        { field: `User ${P.short} Search Limit`, from: limit, to: newLimit }
      ]
    })

    res.status(201).json({
      success: true,
      message: `${user.name} (${P.label}): ${autoNote}. Limit ${limit} -> ${newLimit}.`,
      data: { transaction, product, callsBefore: left, callsAfter, balance, leftover, limit: newLimit }
    })
  } catch (error) {
    sendError(res, req, error, error.name === 'ValidationError' ? 400 : 500)
  }
}

// 'YYYY-MM-DD' moved by a number of days
const shiftDate = (iso, days) => {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10)
}

// API key calls that used the key's limit. Calls logged before `charged` existed count when they returned details.
const CHARGED_KEY_CALL = { $or: [{ charged: true }, { charged: { $exists: false }, success: true }] }
// 'rtosarthi_api3' -> 'api3', 'rtosarthi_api5' -> 'api5', ...; anything unknown counts as the removed API 1
// (old calls only - its keys now use API 5)
const sourceApi = (source) => ({ rtosarthi_api2: 'api2', rtosarthi_api5: 'api5', rtosarthi_api3: 'api3', rtosarthi_api4: 'api4', rtosarthi_api24: 'api24', rtosarthi_api32: 'api32' })[source] || 'api1'

// How many searches were actually made, by app users (RC search) and by API keys:
// day-wise for the last 28 days, and per user / per key for today / 7 / 28 days
exports.getUsage = async (req, res) => {
  try {
    const today = RcSearchUsage.todayIST()
    const from7 = shiftDate(today, -6)
    const from28 = shiftDate(today, -27)
    // RC: app searches + API key calls; HSRP: app searches only (API keys serve vehicle details)
    const product = req.query.product === 'hsrp' ? 'hsrp' : 'rc'
    const P = PRODUCTS[product]
    const Usage = product === 'hsrp' ? HsrpSearchUsage : RcSearchUsage

    const [rows, firstRow, keyRows, firstKeyCall] = await Promise.all([
      Usage.find({ date: { $gte: from28, $lte: today } }).select('userId date count').lean(),
      Usage.findOne({}).sort({ date: 1 }).select('date').lean(),
      product === 'hsrp' ? [] : ApiKeyCall.aggregate([
        { $match: { date: { $gte: from28, $lte: today }, ...CHARGED_KEY_CALL } },
        // Calls logged before `source` was saved were all API 1
        { $group: { _id: { apiKeyId: '$apiKeyId', date: '$date', source: { $ifNull: ['$source', 'rtosarthi_api1'] } }, count: { $sum: 1 } } }
      ]),
      product === 'hsrp' ? null : ApiKeyCall.findOne(CHARGED_KEY_CALL).sort({ date: 1 }).select('date').lean()
    ])

    // One entry per day, newest first, including days with no searches
    const dayMap = new Map()
    for (let i = 0; i < 28; i++) {
      const date = shiftDate(today, -i)
      dayMap.set(date, { date, count: 0, appCount: 0, keyCount: 0, api1Count: 0, api5Count: 0, api2Count: 0, api3Count: 0, api4Count: 0, api24Count: 0, api32Count: 0, users: 0, keys: 0, keyIds: new Set() })
    }

    const totals = { today: 0, last7: 0, last28: 0, appLast28: 0, keyLast28: 0, api1Last28: 0, api5Last28: 0, api2Last28: 0, api3Last28: 0, api4Last28: 0, api24Last28: 0, api32Last28: 0, api1Today: 0, api5Today: 0, api2Today: 0, api3Today: 0, api4Today: 0, api24Today: 0, api32Today: 0 }
    // Adds one day's count to the day, the totals and the user / key row it belongs to
    const add = (map, id, base, row, kind) => {
      const day = dayMap.get(row.date)
      if (!day || !row.count) return
      day.count += row.count
      if (kind === 'key') {
        const api = sourceApi(row.source)
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

      if (!map.has(id)) map.set(id, { ...base, today: 0, last7: 0, last28: 0, api1Last28: 0, api5Last28: 0, api2Last28: 0, api3Last28: 0, api4Last28: 0, api24Last28: 0, api32Last28: 0 })
      const usage = map.get(id)
      if (kind === 'key') usage[`${sourceApi(row.source)}Last28`] += row.count
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
        .select(`name mobile1 ${P.limit} ${P.count}`)
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
        product,
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
              // (named rcSearch* for both products; for HSRP they are the HSRP limit / count)
              rcSearchLimit: user?.[P.limit] || 0,
              rcSearchCount: user?.[P.count] || 0,
              rcSearchRemaining: Math.max(0, (user?.[P.limit] || 0) - (user?.[P.count] || 0))
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
              provider: key?.provider || 'api5',
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
    // ?product=rc / hsrp / all. API key sales are vehicle (RC) calls, so they are left out for HSRP.
    const product = productFilter(req.query.product)
    const pm = productMatch(product)
    const withKeys = product !== 'hsrp'
    const none = Promise.resolve([])
    // Sales dated today (India), from users and from API keys
    const today = RcSearchUsage.todayIST()
    const todayMatch = { $expr: { $eq: [{ $dateToString: { format: '%Y-%m-%d', date: '$date', timezone: IST } }, today] } }
    const todayTotal = { $group: { _id: null, quantity: { $sum: '$quantity' }, amount: { $sum: '$amount' }, entries: { $sum: 1 } } }

    // Day-wise income window (a day extra so the oldest India day is complete)
    const incomeDays = lastDaysIST(INCOME_DAYS)
    const incomeSince = new Date(Date.now() - (INCOME_DAYS + 1) * 86400000)
    const dayKey = { $dateToString: { format: '%Y-%m-%d', date: '$date', timezone: IST } }

    const [byType, byMonth, byUser, lastPurchase, lastSale, keySales, keySalesByMonth, userSalesToday, keySalesToday, byDay, keySalesByDay, adjustByUser] = await Promise.all([
      ApiCreditTransaction.aggregate([
        { $match: pm },
        {
          $group: {
            _id: '$type',
            quantity: { $sum: '$quantity' },
            amount: { $sum: '$amount' },
            paid: { $sum: PAID_EXPR },
            entries: { $sum: 1 }
          }
        }
      ]),
      ApiCreditTransaction.aggregate([
        { $match: { type: { $in: ['sale', 'purchase'] }, ...pm } },
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
        { $match: { type: 'sale', userId: { $ne: null }, ...pm } },
        {
          $group: {
            _id: '$userId',
            quantity: { $sum: '$quantity' },
            amount: { $sum: '$amount' },
            paid: { $sum: PAID_EXPR },
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
            hsrpSearchLimit: { $ifNull: ['$user.hsrpSearchLimit', 0] },
            hsrpSearchCount: { $ifNull: ['$user.hsrpSearchCount', 0] },
            quantity: 1,
            amount: 1,
            paid: 1,
            entries: 1,
            lastDate: 1
          }
        }
      ]),
      ApiCreditTransaction.findOne({ type: 'purchase', ...pm }).sort({ date: -1, createdAt: -1 }).select('rate').lean(),
      ApiCreditTransaction.findOne({ type: 'sale', ...pm }).sort({ date: -1, createdAt: -1 }).select('rate').lean(),
      // Calls sold on API keys are sales of the same provider calls
      withKeys ? ApiKeySale.aggregate([{ $group: { _id: null, quantity: { $sum: '$quantity' }, amount: { $sum: '$amount' }, paid: { $sum: PAID_EXPR } } }]) : none,
      !withKeys ? none : ApiKeySale.aggregate([
        {
          $group: {
            _id: { month: { $dateToString: { format: '%Y-%m', date: '$date', timezone: IST } }, type: 'sale', key: { $literal: true } },
            quantity: { $sum: '$quantity' },
            amount: { $sum: '$amount' }
          }
        }
      ]),
      ApiCreditTransaction.aggregate([{ $match: { type: 'sale', ...pm, ...todayMatch } }, todayTotal]),
      withKeys ? ApiKeySale.aggregate([{ $match: todayMatch }, todayTotal]) : none,
      ApiCreditTransaction.aggregate([
        { $match: { date: { $gte: incomeSince }, type: { $in: ['sale', 'purchase'] }, ...pm } },
        {
          $group: {
            _id: { day: dayKey, type: '$type' },
            quantity: { $sum: '$quantity' },
            amount: { $sum: '$amount' },
            paid: { $sum: PAID_EXPR },
            entries: { $sum: 1 }
          }
        }
      ]),
      !withKeys ? none : ApiKeySale.aggregate([
        { $match: { date: { $gte: incomeSince } } },
        {
          $group: {
            _id: dayKey,
            quantity: { $sum: '$quantity' },
            amount: { $sum: '$amount' },
            paid: { $sum: PAID_EXPR },
            entries: { $sum: 1 }
          }
        }
      ]),
      // Calls taken back (or given) by rate adjustments, per user
      ApiCreditTransaction.aggregate([
        { $match: { type: 'adjustment', ...pm } },
        { $group: { _id: '$userId', taken: { $sum: { $subtract: [{ $ifNull: ['$callsBefore', 0] }, '$quantity'] } }, count: { $sum: 1 } } }
      ])
    ])

    const pick = (type) => byType.find((t) => t._id === type) || { quantity: 0, amount: 0, paid: 0, entries: 0 }
    const purchase = pick('purchase')
    const userSale = pick('sale')
    const keySale = keySales[0] || { quantity: 0, amount: 0, paid: 0 }
    // Calls that rate adjustments took back from users are unsold again (negative: calls given)
    const adjustedQty = adjustByUser.reduce((t, a) => t + a.taken, 0)
    const adjustByUserId = new Map(adjustByUser.map((a) => [String(a._id), a]))
    const sale = {
      quantity: userSale.quantity + keySale.quantity - adjustedQty,
      amount: userSale.amount + keySale.amount,
      paid: userSale.paid + keySale.paid
    }

    const avgBuyRate = purchase.quantity ? purchase.amount / purchase.quantity : null
    const avgSellRate = sale.quantity ? sale.amount / sale.quantity : null

    // Pivot month/type rows into one row per month
    const monthMap = new Map()
    for (const row of [...byMonth, ...keySalesByMonth]) {
      const key = row._id.month
      if (!monthMap.has(key)) {
        monthMap.set(key, { month: key, boughtQty: 0, boughtAmount: 0, soldQty: 0, soldAmount: 0, keyQty: 0, keyAmount: 0 })
      }
      const m = monthMap.get(key)
      if (row._id.type === 'purchase') {
        m.boughtQty += row.quantity
        m.boughtAmount = roundMoney(m.boughtAmount + row.amount)
      } else {
        m.soldQty += row.quantity
        m.soldAmount = roundMoney(m.soldAmount + row.amount)
        if (row._id.key) {
          m.keyQty += row.quantity
          m.keyAmount = roundMoney(m.keyAmount + row.amount)
        }
      }
    }
    const months = Array.from(monthMap.values())
      .sort((a, b) => (a.month < b.month ? 1 : -1))
      .map((m) => ({ ...m, net: roundMoney(m.soldAmount - m.boughtAmount) }))

    // One row per day (days with nothing stay in, as zeros), newest first
    const dayMap = new Map(incomeDays.map((d) => [d, {
      date: d, soldQty: 0, soldAmount: 0, receivedAmount: 0, keyQty: 0, keyAmount: 0, keySales: 0, sales: 0, boughtQty: 0, boughtAmount: 0
    }]))
    for (const row of byDay) {
      const d = dayMap.get(row._id.day)
      if (!d) continue
      if (row._id.type === 'purchase') {
        d.boughtQty += row.quantity
        d.boughtAmount += row.amount
      } else {
        d.soldQty += row.quantity
        d.soldAmount += row.amount
        d.receivedAmount += row.paid
        d.sales += row.entries
      }
    }
    for (const row of keySalesByDay) {
      const d = dayMap.get(row._id)
      if (!d) continue
      d.soldQty += row.quantity
      d.soldAmount += row.amount
      d.receivedAmount += row.paid
      d.keyQty += row.quantity
      d.keyAmount += row.amount
      d.keySales += row.entries
      d.sales += row.entries
    }
    const days = incomeDays.map((key) => {
      const d = dayMap.get(key)
      return {
        ...d,
        soldAmount: roundMoney(d.soldAmount),
        receivedAmount: roundMoney(d.receivedAmount),
        keyAmount: roundMoney(d.keyAmount),
        boughtAmount: roundMoney(d.boughtAmount),
        net: roundMoney(d.soldAmount - d.boughtAmount),
        // Earned on that day's sales at the average buying price
        profit: avgBuyRate === null ? null : roundMoney(d.soldAmount - d.soldQty * avgBuyRate)
      }
    })
    const sumDays = (list, field) => roundMoney(list.reduce((t, d) => t + (d[field] || 0), 0))
    const incomeTotals = (n) => {
      const list = days.slice(0, n)
      return {
        soldAmount: sumDays(list, 'soldAmount'),
        receivedAmount: sumDays(list, 'receivedAmount'),
        soldQty: list.reduce((t, d) => t + d.soldQty, 0),
        keyAmount: sumDays(list, 'keyAmount'),
        keyQty: list.reduce((t, d) => t + d.keyQty, 0),
        sales: list.reduce((t, d) => t + d.sales, 0),
        profit: avgBuyRate === null ? null : sumDays(list, 'profit')
      }
    }

    res.json({
      success: true,
      data: {
        product,
        totals: {
          boughtQty: purchase.quantity,
          boughtAmount: roundMoney(purchase.amount),
          soldQty: sale.quantity,
          soldAmount: roundMoney(sale.amount),
          // Part of the sold figures that came from API keys
          keySoldQty: keySale.quantity,
          keySoldAmount: roundMoney(keySale.amount),
          // Money actually received on sales, and what users / API key customers still owe
          receivedAmount: roundMoney(sale.paid),
          pendingAmount: roundMoney(sale.amount - sale.paid),
          keyPendingAmount: roundMoney(keySale.amount - keySale.paid),
          avgBuyRate: avgBuyRate === null ? null : roundMoney(avgBuyRate),
          avgSellRate: avgSellRate === null ? null : roundMoney(avgSellRate),
          // Money in from users minus money out to the provider
          netCashflow: roundMoney(sale.amount - purchase.amount),
          // What was earned on the calls actually sold, at the average buying price
          profitOnSold: avgBuyRate === null ? null : roundMoney(sale.amount - sale.quantity * avgBuyRate),
          // Bought from the provider but not yet sold to any user
          unsoldQty: purchase.quantity - sale.quantity,
          // Calls taken back from users by rate adjustments (already left out of soldQty)
          adjustedQty
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
        days,
        income: { last7: incomeTotals(7), last30: incomeTotals(INCOME_DAYS) },
        users: byUser.map((u) => ({
          ...u,
          // Calls bought, less what rate adjustments took back
          adjustedQty: adjustByUserId.get(String(u.userId))?.taken || 0,
          adjustments: adjustByUserId.get(String(u.userId))?.count || 0,
          amount: roundMoney(u.amount),
          paid: roundMoney(u.paid),
          pending: roundMoney(u.amount - u.paid),
          rcSearchRemaining: Math.max(0, (u.rcSearchLimit || 0) - (u.rcSearchCount || 0)),
          hsrpSearchRemaining: Math.max(0, (u.hsrpSearchLimit || 0) - (u.hsrpSearchCount || 0))
        }))
      }
    })
  } catch (error) {
    sendError(res, req, error)
  }
}
