const axios = require('axios')
const VehicleSearchHistory = require('../models/VehicleSearchHistory')
const User = require('../models/User')

/**
 * Controller to fetch vehicle details from external RTO Information API
 * and save search history in MongoDB for the authenticated user.
 * (ONLY CALLED WHEN USER MANUALLY SEARCHES)
 */
const lookupVehicle = async (req, res) => {
  try {
    const rawVno = req.query.vno || req.body.vno || req.params.vno
    if (!rawVno || typeof rawVno !== 'string' || !rawVno.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Vehicle registration number is required (e.g., CG12BU5574).'
      })
    }

    // Clean up registration number: remove spaces and dashes, convert to uppercase
    const cleanVno = rawVno.replace(/[\s-]/g, '').toUpperCase()

    if (cleanVno.length < 4) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid vehicle registration number.'
      })
    }

    // ── Check User Access & Quota Limits ──
    const targetUserId = req.user?.type === 'staff' ? (req.user?.adminId || req.user?.id) : req.user?.id
    if (!targetUserId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' })
    }

    const userDoc = await User.findById(targetUserId).select('features rcSearchLimit rcSearchCount')
    if (!userDoc) {
      return res.status(404).json({ success: false, message: 'User account not found' })
    }

    if (!userDoc.features?.rcDetails) {
      return res.status(403).json({
        success: false,
        message: 'RC Details feature is not enabled for your account. Please contact admin.'
      })
    }

    const currentLimit = userDoc.rcSearchLimit || 0
    const currentCount = userDoc.rcSearchCount || 0
    const remaining = currentLimit - currentCount

    if (remaining <= 0) {
      return res.status(403).json({
        success: false,
        limitExhausted: true,
        message: `RC search limit exhausted (0 limits left). Total lifetime searches: ${currentCount}. Please contact admin to increase your limit.`,
        rcSearchLimit: currentLimit,
        rcSearchCount: currentCount,
        rcSearchRemaining: 0
      })
    }

    const apiUrl = process.env.VEHICLE_INFO_API_URL || 'https://informationapi.shop/rtosathi767/api.php'
    const apiKey = process.env.VEHICLE_INFO_API_KEY || 'xxnxxxxx8000'

    const targetUrl = `${apiUrl}?key=${apiKey}&vno=${encodeURIComponent(cleanVno)}`

    const response = await axios.get(targetUrl, {
      timeout: 20000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        Accept: 'application/json, text/plain, */*'
      }
    })

    const data = response.data

    // If API returned string that needs parsing
    let parsedData = data
    if (typeof data === 'string') {
      try {
        parsedData = JSON.parse(data)
      } catch (err) {
        return res.status(404).json({
          success: false,
          message: data || 'No vehicle information found for this registration number.'
        })
      }
    }

    if (!parsedData || parsedData.error || parsedData.status === 'error' || parsedData.status === false) {
      return res.status(404).json({
        success: false,
        message: parsedData?.message || parsedData?.error || 'Vehicle details not found. Please check registration number.'
      })
    }

    let savedRecord = null
    // Save or update in search history for authenticated user
    if (req.user?.id) {
      try {
        savedRecord = await VehicleSearchHistory.findOneAndUpdate(
          { userId: req.user.id, vehicleNumber: cleanVno },
          {
            $set: {
              ownerName: parsedData.OWNER_NAME || '',
              mobileNo: parsedData.MOBILE_NO || '',
              makerModel: `${parsedData.MAKER_DESC || ''} ${parsedData.MAKER_MODEL || ''}`.trim(),
              status: parsedData.STATUS || 'ACTIVE',
              registeredAt: parsedData.REGISTERED_AT || '',
              insuranceUpto: parsedData.INSURANCE_UPTO || '',
              fitnessUpto: parsedData.FIT_UPTO || '',
              taxUpto: parsedData.TAX_UPTO || '',
              pucUpto: parsedData.PUCC_UPTO || parsedData.PUC_UPTO || '',
              rawResponse: parsedData,
              lastSearchedAt: new Date()
            },

            $inc: { searchCount: 1 }
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        )
      } catch (dbErr) {
        console.error('Failed to save vehicle search history to database:', dbErr.message)
      }
    }

    // ── Increment user's lifetime search count ──
    const updatedUser = await User.findByIdAndUpdate(
      targetUserId,
      { $inc: { rcSearchCount: 1 } },
      { new: true }
    ).select('rcSearchLimit rcSearchCount')

    const newLimit = updatedUser?.rcSearchLimit || currentLimit
    const newCount = updatedUser?.rcSearchCount || (currentCount + 1)
    const newRemaining = Math.max(0, newLimit - newCount)

    return res.status(200).json({
      success: true,
      message: 'Vehicle details fetched successfully',
      data: parsedData,
      isLiveApi: true,
      rcSearchLimit: newLimit,
      rcSearchCount: newCount,
      rcSearchRemaining: newRemaining,
      historyMeta: savedRecord ? {
        _id: savedRecord._id,
        vehicleNumber: savedRecord.vehicleNumber,
        lastSearchedAt: savedRecord.lastSearchedAt,
        searchCount: savedRecord.searchCount
      } : null
    })
  } catch (error) {
    console.error('Error fetching vehicle details:', error?.response?.data || error.message)
    const status = error.response ? error.response.status : 500
    const msg =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'Failed to fetch vehicle details from RTO server'

    return res.status(status === 404 ? 404 : 500).json({
      success: false,
      message: msg,
      error: error.message
    })
  }
}

/**
 * Get saved vehicle details from MongoDB by vehicle number (NO external API call)
 */
const getSavedVehicleByVno = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' })
    }

    const rawVno = req.params.vno || req.query.vno
    if (!rawVno) {
      return res.status(400).json({ success: false, message: 'Vehicle number required' })
    }

    const cleanVno = rawVno.replace(/[\s-]/g, '').toUpperCase()
    const record = await VehicleSearchHistory.findOne({
      userId: req.user.id,
      vehicleNumber: cleanVno
    }).lean()

    if (!record || !record.rawResponse) {
      return res.status(404).json({
        success: false,
        message: 'No saved search record found in database for this vehicle number.'
      })
    }

    return res.status(200).json({
      success: true,
      message: 'Vehicle details loaded from database',
      data: record.rawResponse,
      isSavedData: true,
      historyMeta: {
        _id: record._id,
        vehicleNumber: record.vehicleNumber,
        lastSearchedAt: record.lastSearchedAt || record.updatedAt,
        searchCount: record.searchCount
      }
    })
  } catch (error) {
    console.error('Error fetching saved vehicle:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch saved vehicle details',
      error: error.message
    })
  }
}

/**
 * Get paginated full search history for user
 */
const getSearchHistory = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' })
    }

    const page = Math.max(1, parseInt(req.query.page) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20))
    const search = (req.query.search || '').trim()

    const searchType = req.query.searchType || 'all'
    const query = { userId: req.user.id }

    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const regex = new RegExp(escaped, 'i')

      // For vehicle number, also strip spaces/dashes so "CG 12 BU 5574" matches "CG12BU5574"
      const cleanSearch = search.replace(/[\s-]/g, '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const cleanRegex = new RegExp(cleanSearch, 'i')

      if (searchType === 'vehicleNumber') {
        // Match either cleaned (CG12BU5574) or original input
        query.$or = [
          { vehicleNumber: cleanRegex },
          { vehicleNumber: regex }
        ]
      } else if (searchType === 'ownerName') {
        query.ownerName = regex
      } else if (searchType === 'rtoLocation') {
        // registeredAt is a top-level flat field saved from API response
        query.registeredAt = regex
      } else if (searchType === 'mobileNo') {
        query.mobileNo = regex
      } else {
        // "all" — search across all top-level string fields (reliable, no Mixed path queries)
        query.$or = [
          { vehicleNumber: cleanRegex },
          { vehicleNumber: regex },
          { ownerName: regex },
          { mobileNo: regex },
          { makerModel: regex },
          { registeredAt: regex }
        ]
      }
    }

    const total = await VehicleSearchHistory.countDocuments(query)
    const records = await VehicleSearchHistory.find(query)
      .sort({ lastSearchedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean()

    const targetUserId = req.user?.type === 'staff' ? (req.user?.adminId || req.user?.id) : req.user?.id
    const userDoc = await User.findById(targetUserId).select('features rcSearchLimit rcSearchCount').lean()
    const quotaLimit = userDoc?.rcSearchLimit || 0
    const quotaCount = userDoc?.rcSearchCount || 0
    const quotaRemaining = Math.max(0, quotaLimit - quotaCount)

    return res.status(200).json({
      success: true,
      data: records,
      quota: {
        rcDetailsEnabled: !!userDoc?.features?.rcDetails,
        rcSearchLimit: quotaLimit,
        rcSearchCount: quotaCount,
        rcSearchRemaining: quotaRemaining,
        limitExhausted: quotaRemaining <= 0
      },
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1
      }
    })
  } catch (error) {
    console.error('Error fetching search history:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch vehicle search history',
      error: error.message
    })
  }
}

/**
 * Get specific search history entry by ID (includes cached rawResponse) (NO external API call)
 */
const getHistoryById = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' })
    }

    const record = await VehicleSearchHistory.findOne({
      _id: req.params.id,
      userId: req.user.id
    }).lean()

    if (!record || !record.rawResponse) {
      return res.status(404).json({
        success: false,
        message: 'Search history record not found'
      })
    }

    return res.status(200).json({
      success: true,
      message: 'Vehicle details loaded from database record',
      data: record.rawResponse,
      isSavedData: true,
      historyMeta: {
        _id: record._id,
        vehicleNumber: record.vehicleNumber,
        lastSearchedAt: record.lastSearchedAt || record.updatedAt,
        searchCount: record.searchCount
      }
    })
  } catch (error) {
    console.error('Error fetching search history by id:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch history details',
      error: error.message
    })
  }
}

/**
 * Delete a single search history record
 */
const deleteHistoryItem = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' })
    }

    const result = await VehicleSearchHistory.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    })

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Record not found or already deleted'
      })
    }

    return res.status(200).json({
      success: true,
      message: 'Search record deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting search history item:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to delete search record',
      error: error.message
    })
  }
}

/**
 * Clear all search history records for user
 */
const clearSearchHistory = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' })
    }

    const result = await VehicleSearchHistory.deleteMany({ userId: req.user.id })

    return res.status(200).json({
      success: true,
      message: `Cleared ${result.deletedCount} search records from history`
    })
  } catch (error) {
    console.error('Error clearing search history:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to clear search history',
      error: error.message
    })
  }
}

/**
 * Get RC search quota status for authenticated user
 */
const getQuotaStatus = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' })
    }

    const targetUserId = req.user.type === 'staff' ? (req.user.adminId || req.user.id) : req.user.id
    const userDoc = await User.findById(targetUserId).select('features rcSearchLimit rcSearchCount').lean()

    if (!userDoc) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    const rcDetailsEnabled = !!userDoc.features?.rcDetails
    const rcSearchLimit = userDoc.rcSearchLimit || 0
    const rcSearchCount = userDoc.rcSearchCount || 0
    const rcSearchRemaining = Math.max(0, rcSearchLimit - rcSearchCount)

    return res.status(200).json({
      success: true,
      data: {
        rcDetailsEnabled,
        rcSearchLimit,
        rcSearchCount,
        rcSearchRemaining,
        limitExhausted: rcSearchRemaining <= 0
      }
    })
  } catch (error) {
    console.error('Error getting quota status:', error)
    return res.status(500).json({ success: false, message: 'Failed to retrieve quota status' })
  }
}

const { generateRcCardPDF } = require('../utils/rcCardGenerator')

// POST /api/vehicle-info/rc-pdf  { data: <vehicle details> } -> RC card style PDF (no API credit used)
const downloadRcPdf = async (req, res) => {
  try {
    const data = req.body && req.body.data
    if (!data || typeof data !== 'object' || !data.REGN_NO) {
      return res.status(400).json({ success: false, message: 'Vehicle data is required' })
    }
    const pdf = await generateRcCardPDF(data)
    const fname = `RC-${String(data.REGN_NO).replace(/[^A-Za-z0-9]/g, '')}.pdf`
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${fname}"`)
    return res.send(pdf)
  } catch (error) {
    console.error('Error generating RC PDF:', error)
    return res.status(500).json({ success: false, message: 'Failed to generate RC PDF' })
  }
}

// GET /api/vehicle-info/history/:id/rc-pdf -> RC card PDF from saved record (NO API call)
const downloadHistoryRcPdf = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' })
    }
    const record = await VehicleSearchHistory.findOne({
      _id: req.params.id,
      userId: req.user.id
    }).lean()
    if (!record || !record.rawResponse) {
      return res.status(404).json({ success: false, message: 'Search history record not found' })
    }
    const data = { REGN_NO: record.vehicleNumber, ...record.rawResponse }
    const pdf = await generateRcCardPDF(data)
    const fname = `RC-${String(data.REGN_NO).replace(/[^A-Za-z0-9]/g, '')}.pdf`
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${fname}"`)
    return res.send(pdf)
  } catch (error) {
    console.error('Error generating history RC PDF:', error)
    return res.status(500).json({ success: false, message: 'Failed to generate RC PDF' })
  }
}

const { generateParticularPDF } = require('../utils/particularGenerator')

// POST /api/vehicle-info/particular-pdf  { data: <vehicle details> } -> Vahan "Vehicle Particulars" PDF (no API credit used)
const downloadParticularPdf = async (req, res) => {
  try {
    const data = req.body && req.body.data
    if (!data || typeof data !== 'object' || !data.REGN_NO) {
      return res.status(400).json({ success: false, message: 'Vehicle data is required' })
    }
    const pdf = await generateParticularPDF(data)
    const fname = `${String(data.REGN_NO).replace(/[^A-Za-z0-9]/g, '')} Particular.pdf`
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${fname}"`)
    return res.send(pdf)
  } catch (error) {
    console.error('Error generating Particular PDF:', error)
    return res.status(500).json({ success: false, message: 'Failed to generate Particular PDF' })
  }
}

module.exports = {
  downloadRcPdf,
  downloadParticularPdf,
  downloadHistoryRcPdf,
  lookupVehicle,
  getSavedVehicleByVno,
  getSearchHistory,
  getHistoryById,
  deleteHistoryItem,
  clearSearchHistory,
  getQuotaStatus
}
