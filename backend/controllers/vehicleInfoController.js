const axios = require('axios')
const VehicleSearchHistory = require('../models/VehicleSearchHistory')

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

    return res.status(200).json({
      success: true,
      message: 'Vehicle details fetched successfully',
      data: parsedData,
      isLiveApi: true,
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

    return res.status(200).json({
      success: true,
      data: records,
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

module.exports = {
  lookupVehicle,
  getSavedVehicleByVno,
  getSearchHistory,
  getHistoryById,
  deleteHistoryItem,
  clearSearchHistory
}
