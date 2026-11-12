const mongoose = require('mongoose')
const User = require('../models/User')
const ChassisSearchUsage = require('../models/ChassisSearchUsage')
const ChassisSearchHistory = require('../models/ChassisSearchHistory')
const { fetchChassisInfo, cleanChassisNumber } = require('../utils/vehicleInfoProvider')

// Chassis number -> vehicle (RC) search for app users, through ParzivalHub (API 3) POST /v1/chassis-to-rc.
// Uses the account's own Chassis limit (chassisSearchLimit / chassisSearchCount), sold in the admin's API Sales.

// The account whose limit is used: the admin user, also when their staff searches
const accountIdOf = (req) => (req.user?.type === 'staff' ? req.user?.adminId || req.user?.id : req.user?.id)

const quotaOf = (user) => {
  const limit = user?.chassisSearchLimit || 0
  const count = user?.chassisSearchCount || 0
  return { chassisSearchLimit: limit, chassisSearchCount: count, chassisSearchRemaining: Math.max(0, limit - count) }
}

const NOT_ENABLED = 'Chassis to RC search is not enabled for your account. Please contact admin.'

// GET /api/chassis-to-rc/quota
exports.getQuota = async (req, res) => {
  try {
    const user = await User.findById(accountIdOf(req)).select('features chassisSearchLimit chassisSearchCount').lean()
    if (!user) return res.status(404).json({ success: false, message: 'User account not found' })
    res.json({ success: true, enabled: user.features?.chassisToRc === true, ...quotaOf(user) })
  } catch (error) {
    console.error('Chassis quota failed:', error.message)
    res.status(500).json({ success: false, message: 'Failed to load Chassis search limit' })
  }
}

// GET /api/chassis-to-rc/lookup?chassis=... or POST { chassis } - a live (paid) chassis search
exports.lookup = async (req, res) => {
  try {
    const chassis = cleanChassisNumber(req.query.chassis || req.body?.chassis)
    if (chassis.length < 5 || chassis.length > 25) {
      return res.status(400).json({ success: false, message: 'Please enter a valid chassis number (e.g. MA3EWB22S00123456).' })
    }

    const accountId = accountIdOf(req)
    if (!accountId) return res.status(401).json({ success: false, message: 'Unauthorized' })
    const user = await User.findById(accountId).select('features chassisSearchLimit chassisSearchCount')
    if (!user) return res.status(404).json({ success: false, message: 'User account not found' })
    if (!user.features?.chassisToRc) return res.status(403).json({ success: false, message: NOT_ENABLED })

    const quota = quotaOf(user)
    if (quota.chassisSearchRemaining <= 0) {
      return res.status(403).json({
        success: false,
        limitExhausted: true,
        message: 'Chassis search limit exhausted (0 searches left). Please contact admin to buy more.',
        ...quota
      })
    }

    const result = await fetchChassisInfo(chassis, { userId: accountId, via: 'User Chassis to RC search' })
    if (!result.found) return res.status(404).json({ success: false, message: result.message, ...quota })

    let saved = null
    try {
      const vehicleNumbers = result.data.matches.map((m) => m.REGN_NO).filter((v) => v && v !== 'NA')
      saved = await ChassisSearchHistory.findOneAndUpdate(
        { userId: accountId, chassisNumber: chassis },
        { $set: { data: result.data, vehicleNumbers, lastSearchedAt: new Date() }, $inc: { searchCount: 1 } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      )
    } catch (err) {
      console.error('Failed to save Chassis search history:', err.message)
    }

    // Only a search the provider charged for uses one of the user's searches
    let updated = user
    if (result.charged !== false) {
      updated = await User.findByIdAndUpdate(accountId, { $inc: { chassisSearchCount: 1 } }, { new: true }).select('chassisSearchLimit chassisSearchCount')
      await ChassisSearchUsage.recordSearch(accountId)
    }

    res.json({
      success: true,
      message: 'Vehicle details fetched successfully',
      data: result.data,
      chassisNumber: chassis,
      historyId: saved?._id || null,
      ...quotaOf(updated)
    })
  } catch (error) {
    if (error.providerUnavailable) return res.status(503).json({ success: false, message: error.message })
    console.error('Chassis lookup failed:', error.message)
    res.status(500).json({ success: false, message: 'Failed to fetch vehicle details. Please try again.' })
  }
}

// GET /api/chassis-to-rc/history?page=&limit=&search= - earlier chassis searches (no API call).
// `search` matches the chassis number or a registration number found for it.
exports.getHistory = async (req, res) => {
  try {
    const accountId = accountIdOf(req)
    const page = Math.max(1, parseInt(req.query.page, 10) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20))
    const query = { userId: accountId }
    const search = cleanChassisNumber(req.query.search)
    if (search) query.$or = [{ chassisNumber: { $regex: search } }, { vehicleNumbers: { $regex: search } }]

    const [total, rows] = await Promise.all([
      ChassisSearchHistory.countDocuments(query),
      ChassisSearchHistory.find(query).sort({ lastSearchedAt: -1 }).skip((page - 1) * limit).limit(limit).lean()
    ])
    res.json({
      success: true,
      data: rows,
      pagination: { currentPage: page, totalPages: Math.ceil(total / limit) || 1, totalRecords: total, limit }
    })
  } catch (error) {
    console.error('Chassis history failed:', error.message)
    res.status(500).json({ success: false, message: 'Failed to load Chassis search history' })
  }
}

// DELETE /api/chassis-to-rc/history/:id
exports.deleteHistory = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid entry' })
    const removed = await ChassisSearchHistory.findOneAndDelete({ _id: req.params.id, userId: accountIdOf(req) })
    if (!removed) return res.status(404).json({ success: false, message: 'Entry not found' })
    res.json({ success: true, message: 'Removed from history' })
  } catch (error) {
    console.error('Chassis history delete failed:', error.message)
    res.status(500).json({ success: false, message: 'Failed to remove entry' })
  }
}
