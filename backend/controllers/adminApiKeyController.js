const mongoose = require('mongoose')
const ApiKey = require('../models/ApiKey')
const ApiKeySale = require('../models/ApiKeySale')
const { PAID_EXPR, salePaid, parsePaid } = require('../utils/salePayment')
const ApiKeyCall = require('../models/ApiKeyCall')
const User = require('../models/User')
const { logError, getUserFriendlyError, getSimplifiedTimestamp } = require('../utils/errorLogger')
const { recordActivity } = require('../utils/activityLog')
const { PROVIDERS } = require('../utils/vehicleInfoProvider')

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

const notFound = (res, message = 'API key not found') => res.status(404).json({ success: false, message })

const roundMoney = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100

const todayIST = () => new Date().toLocaleDateString('en-CA', { timeZone: IST })

// 'YYYY-MM-DD' moved by a number of days
const shiftDate = (iso, days) => {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10)
}

const isDateKey = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value || '')

const withRemaining = (key) => ({
  ...key,
  remaining: Math.max(0, (key.callLimit || 0) - (key.callCount || 0))
})

// '+91 98765-43210' -> '9876543210'; resolves to { value } or { error }
const readMobile = (raw) => {
  let digits = String(raw || '').replace(/\D/g, '')
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2)
  if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1)
  if (!digits) return { error: 'Please enter the mobile number' }
  if (!/^[6-9]\d{9}$/.test(digits)) return { error: 'Please enter a valid 10-digit mobile number' }
  return { value: digits }
}

// Optional email; resolves to { value } (empty when not given) or { error }
const readEmail = (raw) => {
  const value = String(raw || '').trim().toLowerCase()
  if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return { error: 'Please enter a valid email address' }
  return { value }
}

// Validates the optional user link; resolves to { userId } or { error }
const readUserId = async (userId) => {
  if (!userId) return { userId: null }
  if (!mongoose.isValidObjectId(userId)) return { error: 'Invalid user' }
  const user = await User.findById(userId).select('_id')
  return user ? { userId: user._id } : { error: 'User not found' }
}

// All keys with sales and today's / total call counts
exports.getApiKeys = async (req, res) => {
  try {
    const today = todayIST()
    const [keys, sales, calls] = await Promise.all([
      ApiKey.find({}).populate('userId', 'name mobile1').sort({ createdAt: -1 }).lean(),
      ApiKeySale.aggregate([
        { $group: { _id: '$apiKeyId', quantity: { $sum: '$quantity' }, amount: { $sum: '$amount' }, paid: { $sum: PAID_EXPR } } }
      ]),
      ApiKeyCall.aggregate([
        {
          $group: {
            _id: '$apiKeyId',
            total: { $sum: 1 },
            today: { $sum: { $cond: [{ $eq: ['$date', today] }, 1, 0] } },
            todaySuccess: { $sum: { $cond: [{ $and: [{ $eq: ['$date', today] }, '$success'] }, 1, 0] } }
          }
        }
      ])
    ])

    const salesByKey = new Map(sales.map((s) => [String(s._id), s]))
    const callsByKey = new Map(calls.map((c) => [String(c._id), c]))

    const data = keys.map((key) => {
      const sale = salesByKey.get(String(key._id))
      const call = callsByKey.get(String(key._id))
      return {
        ...withRemaining(key),
        soldQty: sale?.quantity || 0,
        soldAmount: roundMoney(sale?.amount || 0),
        paidAmount: roundMoney(sale?.paid || 0),
        pendingAmount: roundMoney((sale?.amount || 0) - (sale?.paid || 0)),
        callsTotal: call?.total || 0,
        callsToday: call?.today || 0,
        callsTodaySuccess: call?.todaySuccess || 0
      }
    })

    const totals = data.reduce(
      (t, k) => ({
        keys: t.keys + 1,
        active: t.active + (k.active ? 1 : 0),
        soldQty: t.soldQty + k.soldQty,
        soldAmount: roundMoney(t.soldAmount + k.soldAmount),
        pendingAmount: roundMoney(t.pendingAmount + k.pendingAmount),
        used: t.used + (k.callCount || 0),
        callsToday: t.callsToday + k.callsToday
      }),
      { keys: 0, active: 0, soldQty: 0, soldAmount: 0, pendingAmount: 0, used: 0, callsToday: 0 }
    )

    res.json({ success: true, data, totals })
  } catch (error) {
    sendError(res, req, error)
  }
}

exports.createApiKey = async (req, res) => {
  try {
    const { name, userId, note, provider, website, contactMobile, contactEmail } = req.body || {}
    if (!name || !String(name).trim()) return badRequest(res, 'Please enter a name for this API key')
    const mobile = readMobile(contactMobile)
    if (mobile.error) return badRequest(res, mobile.error)
    const email = readEmail(contactEmail)
    if (email.error) return badRequest(res, email.error)
    if (provider !== undefined && !PROVIDERS[provider]) return badRequest(res, 'Please choose API 1 or API 2')

    const link = await readUserId(userId)
    if (link.error) return badRequest(res, link.error)

    const apiKey = await ApiKey.create({
      name: String(name).trim(),
      key: ApiKey.generateKey(),
      userId: link.userId || undefined,
      provider: provider || 'api1',
      contactMobile: mobile.value,
      contactEmail: email.value || undefined,
      website: website && String(website).trim() ? String(website).trim() : undefined,
      note: note && String(note).trim() ? String(note).trim() : undefined
    })

    recordActivity(req, {
      action: 'create',
      entity: 'api_key',
      entityId: apiKey._id,
      entityName: apiKey.name,
      summary: `Created vehicle API key "${apiKey.name}"`
    })

    res.status(201).json({ success: true, message: `API key "${apiKey.name}" created`, data: apiKey })
  } catch (error) {
    sendError(res, req, error, error.name === 'ValidationError' ? 400 : 500)
  }
}

// Change name / linked user / vehicle info source / contact / website / note / on-off
exports.updateApiKey = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return badRequest(res, 'Invalid API key')
    const apiKey = await ApiKey.findById(req.params.id)
    if (!apiKey) return notFound(res)

    const { name, userId, note, active, provider, website, contactMobile, contactEmail } = req.body || {}
    const changes = []

    if (name !== undefined) {
      if (!String(name).trim()) return badRequest(res, 'Name cannot be empty')
      if (apiKey.name !== String(name).trim()) changes.push({ field: 'Name', from: apiKey.name, to: String(name).trim() })
      apiKey.name = String(name).trim()
    }
    if (userId !== undefined) {
      const link = await readUserId(userId)
      if (link.error) return badRequest(res, link.error)
      if (String(apiKey.userId || '') !== String(link.userId || '')) {
        changes.push({ field: 'User', from: apiKey.userId ? String(apiKey.userId) : null, to: link.userId ? String(link.userId) : null })
      }
      apiKey.userId = link.userId || undefined
    }
    if (provider !== undefined) {
      if (!PROVIDERS[provider]) return badRequest(res, 'Please choose API 1 or API 2')
      const current = apiKey.provider || 'api1'
      if (current !== provider) changes.push({ field: 'Vehicle data source', from: PROVIDERS[current], to: PROVIDERS[provider] })
      apiKey.provider = provider
    }
    if (contactMobile !== undefined) {
      const mobile = readMobile(contactMobile)
      if (mobile.error) return badRequest(res, mobile.error)
      if ((apiKey.contactMobile || '') !== mobile.value) changes.push({ field: 'Mobile', from: apiKey.contactMobile || null, to: mobile.value })
      apiKey.contactMobile = mobile.value
    }
    if (contactEmail !== undefined) {
      const email = readEmail(contactEmail)
      if (email.error) return badRequest(res, email.error)
      if ((apiKey.contactEmail || '') !== email.value) changes.push({ field: 'Email', from: apiKey.contactEmail || null, to: email.value || null })
      apiKey.contactEmail = email.value || undefined
    }
    if (website !== undefined) {
      const value = String(website).trim()
      if ((apiKey.website || '') !== value) changes.push({ field: 'Website', from: apiKey.website || null, to: value || null })
      apiKey.website = value || undefined
    }
    if (note !== undefined) {
      apiKey.note = String(note).trim() || undefined
    }
    if (active !== undefined) {
      if (apiKey.active !== !!active) changes.push({ field: 'Active', from: apiKey.active, to: !!active })
      apiKey.active = !!active
    }

    await apiKey.save()

    if (changes.length) {
      recordActivity(req, {
        action: 'update',
        entity: 'api_key',
        entityId: apiKey._id,
        entityName: apiKey.name,
        summary: `Updated vehicle API key "${apiKey.name}"`,
        changes
      })
    }

    res.json({ success: true, message: 'API key updated', data: apiKey })
  } catch (error) {
    sendError(res, req, error, error.name === 'ValidationError' ? 400 : 500)
  }
}

// New secret; the old one stops working at once
exports.regenerateApiKey = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return badRequest(res, 'Invalid API key')
    const apiKey = await ApiKey.findByIdAndUpdate(req.params.id, { $set: { key: ApiKey.generateKey() } }, { new: true })
    if (!apiKey) return notFound(res)

    recordActivity(req, {
      action: 'update',
      entity: 'api_key',
      entityId: apiKey._id,
      entityName: apiKey.name,
      summary: `Regenerated secret of vehicle API key "${apiKey.name}"`
    })

    res.json({ success: true, message: 'New key generated. The old key no longer works.', data: apiKey })
  } catch (error) {
    sendError(res, req, error)
  }
}

// Delete a key for good: it stops working at once and its call log goes with it.
// Its sales stay on the books so money totals in Vehicle API Sales do not change.
exports.deleteApiKey = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return badRequest(res, 'Invalid API key')
    if (req.body?.confirm !== 'delete') return badRequest(res, 'Type delete to confirm')

    const apiKey = await ApiKey.findByIdAndDelete(req.params.id)
    if (!apiKey) return notFound(res)

    const { deletedCount: callsDeleted } = await ApiKeyCall.deleteMany({ apiKeyId: apiKey._id })

    recordActivity(req, {
      action: 'delete',
      entity: 'api_key',
      entityId: apiKey._id,
      entityName: apiKey.name,
      summary: `Deleted vehicle API key "${apiKey.name}" (${callsDeleted} call logs removed)`,
      changes: [
        { field: 'Name', from: apiKey.name, to: null },
        { field: 'Limit', from: apiKey.callLimit || 0, to: null },
        { field: 'Used', from: apiKey.callCount || 0, to: null }
      ]
    })

    res.json({ success: true, message: `API key "${apiKey.name}" deleted`, data: { callsDeleted } })
  } catch (error) {
    sendError(res, req, error)
  }
}

/**
 * One key with its sales and day-wise call counts.
 * Query: from / to ('YYYY-MM-DD', India dates) for the day-wise table, default the last 30 days.
 */
exports.getApiKey = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return badRequest(res, 'Invalid API key')
    const apiKey = await ApiKey.findById(req.params.id).populate('userId', 'name mobile1').lean()
    if (!apiKey) return notFound(res)

    const today = todayIST()
    const to = isDateKey(req.query.to) ? req.query.to : today
    let from = isDateKey(req.query.from) ? req.query.from : shiftDate(to, -29)
    if (from > to) from = to
    // Keep the day list a sensible size
    if ((Date.parse(to) - Date.parse(from)) / 86400000 > 366) from = shiftDate(to, -366)

    const keyId = apiKey._id
    const [sales, byDay, overall, firstCall] = await Promise.all([
      ApiKeySale.find({ apiKeyId: keyId }).sort({ date: -1, createdAt: -1 }).lean(),
      ApiKeyCall.aggregate([
        { $match: { apiKeyId: keyId, date: { $gte: from, $lte: to } } },
        {
          $group: {
            _id: '$date',
            total: { $sum: 1 },
            success: { $sum: { $cond: ['$success', 1, 0] } },
            vehicles: { $addToSet: '$vehicleNumber' }
          }
        }
      ]),
      ApiKeyCall.aggregate([
        { $match: { apiKeyId: keyId } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            success: { $sum: { $cond: ['$success', 1, 0] } },
            today: { $sum: { $cond: [{ $eq: ['$date', today] }, 1, 0] } },
            last7: { $sum: { $cond: [{ $gte: ['$date', shiftDate(today, -6)] }, 1, 0] } },
            last30: { $sum: { $cond: [{ $gte: ['$date', shiftDate(today, -29)] }, 1, 0] } }
          }
        }
      ]),
      ApiKeyCall.findOne({ apiKeyId: keyId }).sort({ createdAt: 1 }).select('createdAt').lean()
    ])

    // Every day in the range, newest first, including days without calls
    const dayMap = new Map(byDay.map((d) => [d._id, d]))
    const days = []
    for (let date = to; date >= from; date = shiftDate(date, -1)) {
      const d = dayMap.get(date)
      days.push({
        date,
        total: d?.total || 0,
        success: d?.success || 0,
        failed: (d?.total || 0) - (d?.success || 0),
        vehicles: d ? d.vehicles.filter(Boolean).length : 0
      })
    }

    const stats = overall[0] || { total: 0, success: 0, today: 0, last7: 0, last30: 0 }
    const soldQty = sales.reduce((s, x) => s + x.quantity, 0)
    const soldAmount = roundMoney(sales.reduce((s, x) => s + x.amount, 0))
    const paidAmount = roundMoney(sales.reduce((s, x) => s + salePaid(x), 0))

    res.json({
      success: true,
      data: {
        apiKey: withRemaining(apiKey),
        stats: {
          total: stats.total,
          success: stats.success,
          failed: stats.total - stats.success,
          today: stats.today,
          last7: stats.last7,
          last30: stats.last30,
          firstCallAt: firstCall?.createdAt || null,
          soldQty,
          soldAmount,
          paidAmount,
          pendingAmount: roundMoney(soldAmount - paidAmount)
        },
        range: { from, to, today },
        days,
        sales
      }
    })
  } catch (error) {
    sendError(res, req, error)
  }
}

/**
 * The key's call log, newest first.
 * Query: page, limit, from / to (India dates), vehicle (part of the number), status (success | failed)
 */
exports.getApiKeyCalls = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return badRequest(res, 'Invalid API key')

    const { from, to, vehicle, status } = req.query
    const query = { apiKeyId: req.params.id }
    if (isDateKey(from) || isDateKey(to)) {
      query.date = {}
      if (isDateKey(from)) query.date.$gte = from
      if (isDateKey(to)) query.date.$lte = to
    }
    if (vehicle && String(vehicle).trim()) {
      const clean = String(vehicle).replace(/[\s-]/g, '').toUpperCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      query.vehicleNumber = new RegExp(clean)
    }
    if (status === 'success') query.success = true
    if (status === 'failed') query.success = false

    const pageNum = Math.max(1, parseInt(req.query.page, 10) || 1)
    const limitNum = Math.min(200, Math.max(1, parseInt(req.query.limit, 10) || 50))

    const [totalRecords, calls] = await Promise.all([
      ApiKeyCall.countDocuments(query),
      ApiKeyCall.find(query)
        .select('-response')
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean()
    ])

    res.json({
      success: true,
      data: calls,
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

// One logged call with the full response that was sent back
exports.getApiKeyCall = async (req, res) => {
  try {
    const { id, callId } = req.params
    if (!mongoose.isValidObjectId(id) || !mongoose.isValidObjectId(callId)) return badRequest(res, 'Invalid call')
    const call = await ApiKeyCall.findOne({ _id: callId, apiKeyId: id }).lean()
    if (!call) return notFound(res, 'Call not found')
    res.json({ success: true, data: call })
  } catch (error) {
    sendError(res, req, error)
  }
}

// Sell API calls on a key: records the money and raises the key's limit
exports.createSale = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return badRequest(res, 'Invalid API key')
    const { quantity, rate, date, note, paidAmount } = req.body || {}

    const qty = Number(quantity)
    if (!Number.isInteger(qty) || qty < 1) return badRequest(res, 'Quantity must be a whole number of at least 1')

    const price = Number(rate)
    if (rate === '' || rate === null || rate === undefined || Number.isNaN(price) || price < 0) {
      return badRequest(res, 'Rate per API call is required')
    }

    const saleDate = date ? new Date(date) : new Date()
    if (Number.isNaN(saleDate.getTime())) return badRequest(res, 'Please enter a valid date')

    const amount = roundMoney(qty * price)
    const paid = parsePaid(paidAmount, amount)
    if (paid.error) return badRequest(res, paid.error)

    const apiKey = await ApiKey.findById(req.params.id).select('name callLimit')
    if (!apiKey) return notFound(res)

    const sale = await ApiKeySale.create({
      apiKeyId: apiKey._id,
      quantity: qty,
      rate: price,
      amount,
      paidAmount: paid.value,
      date: saleDate,
      note: note && String(note).trim() ? String(note).trim() : undefined
    })

    let updated
    try {
      updated = await ApiKey.findByIdAndUpdate(apiKey._id, { $inc: { callLimit: qty } }, { new: true })
      if (!updated) throw new Error('API key not found')
    } catch (err) {
      // Don't leave a sale on the books that never reached the key's limit
      await ApiKeySale.deleteOne({ _id: sale._id }).catch(() => {})
      throw err
    }

    recordActivity(req, {
      action: 'create',
      entity: 'api_key',
      entityId: sale._id,
      entityName: apiKey.name,
      summary: `Sold ${qty} API calls on key "${apiKey.name}" @ ₹${price} (₹${sale.amount}). Limit +${qty}`,
      changes: [
        { field: 'Quantity', from: null, to: qty },
        { field: 'Rate', from: null, to: price },
        { field: 'Amount', from: null, to: sale.amount },
        { field: 'Paid', from: null, to: sale.paidAmount },
        { field: 'API Key Limit', from: updated.callLimit - qty, to: updated.callLimit }
      ]
    })

    res.status(201).json({
      success: true,
      message: `Sold ${qty} API calls. Limit increased by ${qty}.`,
      data: { sale, apiKey: updated }
    })
  } catch (error) {
    sendError(res, req, error, error.name === 'ValidationError' ? 400 : 500)
  }
}

// Record how much of a sale's amount has been received
exports.updateSalePaid = async (req, res) => {
  try {
    const { id, saleId } = req.params
    if (!mongoose.isValidObjectId(id) || !mongoose.isValidObjectId(saleId)) return badRequest(res, 'Invalid sale')

    const { paidAmount } = req.body || {}
    if (paidAmount === undefined || paidAmount === null || paidAmount === '') return badRequest(res, 'Please enter the amount paid')

    const sale = await ApiKeySale.findOne({ _id: saleId, apiKeyId: id })
    if (!sale) return notFound(res, 'Sale not found')

    const paid = parsePaid(paidAmount, sale.amount)
    if (paid.error) return badRequest(res, paid.error)

    const oldPaid = salePaid(sale)
    sale.paidAmount = paid.value
    await sale.save()

    if (oldPaid !== sale.paidAmount) {
      const apiKey = await ApiKey.findById(id).select('name').lean()
      recordActivity(req, {
        action: 'update',
        entity: 'api_key',
        entityId: sale._id,
        entityName: apiKey?.name || 'Deleted API key',
        summary: `Payment on sale of ${sale.quantity} API calls on key "${apiKey?.name || 'deleted'}": paid ₹${oldPaid} → ₹${sale.paidAmount} of ₹${sale.amount}`,
        changes: [{ field: 'Paid', from: oldPaid, to: sale.paidAmount }]
      })
    }

    res.json({
      success: true,
      message: `Saved. Paid ₹${sale.paidAmount} of ₹${sale.amount}, pending ₹${roundMoney(sale.amount - sale.paidAmount)}.`,
      data: sale
    })
  } catch (error) {
    sendError(res, req, error, error.name === 'ValidationError' ? 400 : 500)
  }
}

// Delete a sale and take its calls back off the key's limit
exports.deleteSale = async (req, res) => {
  try {
    const { id, saleId } = req.params
    if (!mongoose.isValidObjectId(id) || !mongoose.isValidObjectId(saleId)) return badRequest(res, 'Invalid sale')

    const sale = await ApiKeySale.findOneAndDelete({ _id: saleId, apiKeyId: id })
    if (!sale) return notFound(res, 'Sale not found')

    let limitReducedBy = 0
    const apiKey = await ApiKey.findById(id)
    if (apiKey) {
      // Never push the limit below zero
      limitReducedBy = Math.min(apiKey.callLimit || 0, sale.quantity)
      apiKey.callLimit = (apiKey.callLimit || 0) - limitReducedBy
      await apiKey.save()
    }

    recordActivity(req, {
      action: 'delete',
      entity: 'api_key',
      entityId: sale._id,
      entityName: apiKey?.name || 'Deleted API key',
      summary: `Deleted sale of ${sale.quantity} API calls on key "${apiKey?.name || 'deleted'}" (₹${sale.amount}). Limit -${limitReducedBy}`,
      changes: [
        { field: 'Quantity', from: sale.quantity, to: null },
        { field: 'Rate', from: sale.rate, to: null },
        { field: 'Amount', from: sale.amount, to: null }
      ]
    })

    res.json({ success: true, message: `Sale deleted. Limit reduced by ${limitReducedBy}.`, data: { limitReducedBy } })
  } catch (error) {
    sendError(res, req, error)
  }
}
