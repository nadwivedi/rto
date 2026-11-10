const mongoose = require('mongoose')
const User = require('../models/User')
const HsrpSearchUsage = require('../models/HsrpSearchUsage')
const HsrpSearchHistory = require('../models/HsrpSearchHistory')
const { fetchHsrpInfo, cleanVehicleNumber } = require('../utils/vehicleInfoProvider')

// HSRP (High Security Registration Plate) details search for app users, through API 5.
// Uses the account's own HSRP limit (hsrpSearchLimit / hsrpSearchCount), sold in the admin's API Sales.

// The account whose limit is used: the admin user, also when their staff searches
const accountIdOf = (req) => (req.user?.type === 'staff' ? req.user?.adminId || req.user?.id : req.user?.id)

const quotaOf = (user) => {
  const limit = user?.hsrpSearchLimit || 0
  const count = user?.hsrpSearchCount || 0
  return { hsrpSearchLimit: limit, hsrpSearchCount: count, hsrpSearchRemaining: Math.max(0, limit - count) }
}

const NOT_ENABLED = 'HSRP search is not enabled for your account. Please contact admin.'

// GET /api/hsrp/quota
exports.getQuota = async (req, res) => {
  try {
    const user = await User.findById(accountIdOf(req)).select('features hsrpSearchLimit hsrpSearchCount').lean()
    if (!user) return res.status(404).json({ success: false, message: 'User account not found' })
    res.json({ success: true, enabled: user.features?.hsrp === true, ...quotaOf(user) })
  } catch (error) {
    console.error('HSRP quota failed:', error.message)
    res.status(500).json({ success: false, message: 'Failed to load HSRP limit' })
  }
}

// GET /api/hsrp/lookup?vno=... or POST { vno } - a live (paid) HSRP search
exports.lookup = async (req, res) => {
  try {
    const vno = cleanVehicleNumber(req.query.vno || req.body?.vno)
    if (vno.length < 4) {
      return res.status(400).json({ success: false, message: 'Please enter a valid vehicle number (e.g. CG04AB1234).' })
    }

    const accountId = accountIdOf(req)
    if (!accountId) return res.status(401).json({ success: false, message: 'Unauthorized' })
    const user = await User.findById(accountId).select('features hsrpSearchLimit hsrpSearchCount')
    if (!user) return res.status(404).json({ success: false, message: 'User account not found' })
    if (!user.features?.hsrp) return res.status(403).json({ success: false, message: NOT_ENABLED })

    const quota = quotaOf(user)
    if (quota.hsrpSearchRemaining <= 0) {
      return res.status(403).json({
        success: false,
        limitExhausted: true,
        message: 'HSRP search limit exhausted (0 searches left). Please contact admin to buy more.',
        ...quota
      })
    }

    const result = await fetchHsrpInfo(vno, { userId: accountId, via: 'User HSRP search' })
    if (!result.found) return res.status(404).json({ success: false, message: result.message, ...quota })

    let saved = null
    try {
      saved = await HsrpSearchHistory.findOneAndUpdate(
        { userId: accountId, vehicleNumber: vno },
        { $set: { data: result.data, lastSearchedAt: new Date() }, $inc: { searchCount: 1 } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      )
    } catch (err) {
      console.error('Failed to save HSRP search history:', err.message)
    }

    // Only a search API 5 charged for uses one of the user's searches
    let updated = user
    if (result.charged !== false) {
      updated = await User.findByIdAndUpdate(accountId, { $inc: { hsrpSearchCount: 1 } }, { new: true }).select('hsrpSearchLimit hsrpSearchCount')
      await HsrpSearchUsage.recordSearch(accountId)
    }

    res.json({
      success: true,
      message: 'HSRP details fetched successfully',
      data: result.data,
      vehicleNumber: vno,
      historyId: saved?._id || null,
      ...quotaOf(updated)
    })
  } catch (error) {
    if (error.providerUnavailable) return res.status(503).json({ success: false, message: error.message })
    console.error('HSRP lookup failed:', error.message)
    res.status(500).json({ success: false, message: 'Failed to fetch HSRP details. Please try again.' })
  }
}

// GET /api/hsrp/history?page=&limit=&search= - earlier HSRP searches (no API call)
exports.getHistory = async (req, res) => {
  try {
    const accountId = accountIdOf(req)
    const page = Math.max(1, parseInt(req.query.page, 10) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20))
    const query = { userId: accountId }
    const search = cleanVehicleNumber(req.query.search)
    if (search) query.vehicleNumber = { $regex: search.replace(/[^A-Z0-9]/g, '') }

    const [total, rows] = await Promise.all([
      HsrpSearchHistory.countDocuments(query),
      HsrpSearchHistory.find(query).sort({ lastSearchedAt: -1 }).skip((page - 1) * limit).limit(limit).lean()
    ])
    res.json({
      success: true,
      data: rows,
      pagination: { currentPage: page, totalPages: Math.ceil(total / limit) || 1, totalRecords: total, limit }
    })
  } catch (error) {
    console.error('HSRP history failed:', error.message)
    res.status(500).json({ success: false, message: 'Failed to load HSRP history' })
  }
}

// DELETE /api/hsrp/history/:id
exports.deleteHistory = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid entry' })
    const removed = await HsrpSearchHistory.findOneAndDelete({ _id: req.params.id, userId: accountIdOf(req) })
    if (!removed) return res.status(404).json({ success: false, message: 'Entry not found' })
    res.json({ success: true, message: 'Removed from history' })
  } catch (error) {
    console.error('HSRP history delete failed:', error.message)
    res.status(500).json({ success: false, message: 'Failed to remove entry' })
  }
}
