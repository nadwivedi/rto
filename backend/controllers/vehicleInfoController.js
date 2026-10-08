const axios = require('axios')
const mongoose = require('mongoose')
const VehicleSearchHistory = require('../models/VehicleSearchHistory')
const User = require('../models/User')
const ApiUsage = require('../models/ApiUsage')
const RcSearchUsage = require('../models/RcSearchUsage')
const Lead = require('../models/Lead')
const { VEHICLE_DOC_TYPES, getVehicleDocuments, matchExpiry, leadPriorityFor } = require('../utils/vehicleExpiry')

const VEHICLE_INFO_PROVIDER = 'vehicleInfo'

const EXPIRY_FILTERS = ['expired', '30', '60', '90', '180', '365']
const LEAD_FILTERS = ['in', 'notIn']
// Expiry dates are stored as text, so the expiry / lead filters are applied in memory.
// This caps how many of a user's saved lookups one request will scan.
const HISTORY_SCAN_LIMIT = 5000
const MOVE_TO_LEADS_LIMIT = 1000
// Everything the history table and the lead builder need, without the heavy rawResponse
const HISTORY_LIST_FIELDS = 'vehicleNumber ownerName mobileNo makerModel status registeredAt insuranceUpto fitnessUpto taxUpto pucUpto searchCount lastSearchedAt createdAt updatedAt rawResponse.MOBILE_NO rawResponse.PUCC_UPTO rawResponse.PUC_UPTO'

/**
 * The provider reports its own account quota on every response as
 * `_usage: { total_limit, used, remaining }`. Keep the latest snapshot so the
 * admin panel can show how many searches are left. Never throws - a failure
 * here must not break the vehicle lookup.
 */
const recordProviderUsage = async (usage, { vehicleNumber, userId } = {}) => {
  if (!usage || typeof usage !== 'object') return

  const toNumber = (value) => {
    const n = Number(value)
    return value !== null && value !== '' && Number.isFinite(n) ? n : undefined
  }
  const totalLimit = toNumber(usage.total_limit)
  const used = toNumber(usage.used)
  const remaining = toNumber(usage.remaining)
  if (totalLimit === undefined && used === undefined && remaining === undefined) return

  // Only write the fields the provider actually sent, so a partial reply can't blank the rest
  const snapshot = { checkedAt: new Date() }
  if (totalLimit !== undefined) snapshot.totalLimit = totalLimit
  if (used !== undefined) snapshot.used = used
  if (remaining !== undefined) snapshot.remaining = remaining
  if (vehicleNumber) snapshot.lastVehicleNumber = vehicleNumber
  if (userId) snapshot.lastUserId = userId

  try {
    await ApiUsage.findOneAndUpdate(
      { provider: VEHICLE_INFO_PROVIDER },
      { $set: snapshot },
      { upsert: true, setDefaultsOnInsert: true }
    )
  } catch (err) {
    console.error('Failed to record vehicle API usage:', err.message)
  }
}

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

    // Recorded before the error check so a "not found" reply still updates the quota
    await recordProviderUsage(parsedData?._usage, { vehicleNumber: cleanVno, userId: targetUserId })

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

    // Day-wise usage for the admin's Vehicle API Sales page
    await RcSearchUsage.recordSearch(targetUserId)

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

// Mongo query for a user's saved lookups, narrowed by the search box
const buildHistoryQuery = (userId, rawSearch, searchType = 'all') => {
  const search = String(rawSearch || '').trim()
  const query = { userId }

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

  return query
}

// Expiry / lead filters sent by the history page (query string or request body)
const readHistoryFilters = (source = {}) => {
  const docType = VEHICLE_DOC_TYPES.includes(source.docType) ? source.docType : 'all'
  const expiry = EXPIRY_FILTERS.includes(String(source.expiry)) ? String(source.expiry) : 'any'
  const leadFilter = LEAD_FILTERS.includes(source.leadFilter) ? source.leadFilter : 'all'
  // The client sends its local date so "expired" matches the user's calendar, not the server's
  const today = /^\d{4}-\d{2}-\d{2}$/.test(source.today || '') ? source.today : new Date().toISOString().slice(0, 10)
  return {
    docType,
    expiry,
    leadFilter,
    today,
    isActive: docType !== 'all' || expiry !== 'any' || leadFilter !== 'all'
  }
}

// Lead already made for each vehicle number: { _id, status, isOpen }. An open lead wins over a closed one.
const findLeadsByVehicle = async (userId, vehicleNumbers) => {
  const byVehicle = new Map()
  if (!vehicleNumbers.length) return byVehicle

  const leads = await Lead.find({ userId, vehicleNumber: { $in: vehicleNumbers } })
    .select('vehicleNumber status createdAt')
    .sort({ createdAt: -1 })
    .lean()

  leads.forEach((lead) => {
    const isOpen = Lead.OPEN_STATUSES.includes(lead.status)
    const current = byVehicle.get(lead.vehicleNumber)
    if (!current || (isOpen && !current.isOpen)) {
      byVehicle.set(lead.vehicleNumber, { _id: lead._id, status: lead.status, isOpen })
    }
  })
  return byVehicle
}

// Adds what the page shows next to each record: parsed document expiries and its lead, if any
const annotateHistory = async (userId, records, today) => {
  const leads = await findLeadsByVehicle(userId, records.map(record => record.vehicleNumber))
  return records.map(record => ({
    ...record,
    documents: getVehicleDocuments(record, today),
    lead: leads.get(record.vehicleNumber) || null
  }))
}

// All saved lookups that pass the expiry / lead filters. With an expiry filter on, the ones expiring first come first.
const scanHistory = async (userId, query, filters) => {
  const records = await VehicleSearchHistory.find(query)
    .select(HISTORY_LIST_FIELDS)
    .sort({ lastSearchedAt: -1 })
    .limit(HISTORY_SCAN_LIMIT)
    .lean()

  const matches = []
  for (const record of await annotateHistory(userId, records, filters.today)) {
    if (filters.leadFilter === 'in' && !record.lead?.isOpen) continue
    if (filters.leadFilter === 'notIn' && record.lead?.isOpen) continue

    const matched = matchExpiry(record.documents, filters)
    if (!matched) continue
    matches.push({ record, soonest: matched.map(doc => doc.expiryDate).sort()[0] || '' })
  }

  if (filters.docType !== 'all' || filters.expiry !== 'any') {
    matches.sort((a, b) => a.soonest.localeCompare(b.soonest))
  }
  return matches.map(match => match.record)
}

/**
 * Get paginated full search history for user.
 * Optional filters: docType (Insurance | Fitness | Tax | PUC), expiry (expired | 30 | 60 | 90 | 180 | 365 days),
 * leadFilter (in | notIn lead management).
 */
const getSearchHistory = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' })
    }

    const page = Math.max(1, parseInt(req.query.page) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20))
    const query = buildHistoryQuery(req.user.id, req.query.search, req.query.searchType)
    const filters = readHistoryFilters(req.query)

    let total
    let records
    if (filters.isActive) {
      const matches = await scanHistory(req.user.id, query, filters)
      total = matches.length
      records = matches.slice((page - 1) * limit, page * limit)
    } else {
      total = await VehicleSearchHistory.countDocuments(query)
      const pageRecords = await VehicleSearchHistory.find(query)
        .sort({ lastSearchedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()
      records = await annotateHistory(req.user.id, pageRecords, filters.today)
    }

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

// Lead for one saved lookup, or null when the vehicle has no document with an expiry date to make a lead for
const buildLeadFromHistory = (record, filters) => {
  // The lead is for the document chosen in the filter; with "All" it is for whichever matching document expires first
  const byExpiry = (a, b) => a.expiryDate.localeCompare(b.expiryDate)
  const matched = matchExpiry(record.documents, filters) || []
  const soonest = [...matched].sort(byExpiry)[0] || [...record.documents].sort(byExpiry)[0]
  const leadType = filters.docType !== 'all' ? filters.docType : soonest?.type
  if (!leadType) return null

  const primary = record.documents.find(doc => doc.type === leadType)
  const mobile = String(record.mobileNo || record.rawResponse?.MOBILE_NO || '').trim()

  return {
    name: record.ownerName || record.vehicleNumber,
    // The lookup often masks the mobile number; only keep a full one
    mobile: /^[0-9]{10}$/.test(mobile) ? mobile : '',
    vehicleNumber: record.vehicleNumber,
    leadType,
    expiryDate: primary?.expiryDate || '',
    documents: record.documents.map(({ type, expiryDate }) => ({ type, expiryDate })),
    priority: primary ? leadPriorityFor(primary.daysLeft) : 'warm',
    source: 'RC Search',
    notes: [record.makerModel, record.registeredAt].filter(Boolean).join(' · '),
    status: 'new'
  }
}

/**
 * Turn saved lookups into leads (Lead Management).
 * Body: { ids: [...] } for picked rows, or { selectAll: true, search, searchType } for everything matching
 * the filters; plus docType / expiry / leadFilter / today as used on the history page.
 * A vehicle that already has an open lead is skipped, so moving twice never makes duplicates.
 */
const moveHistoryToLeads = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' })
    }

    const filters = readHistoryFilters(req.body)
    let records

    if (req.body.selectAll === true) {
      const query = buildHistoryQuery(req.user.id, req.body.search, req.body.searchType)
      records = await scanHistory(req.user.id, query, filters)
    } else {
      const ids = (Array.isArray(req.body.ids) ? req.body.ids : []).filter(id => mongoose.isValidObjectId(id))
      if (!ids.length) {
        return res.status(400).json({ success: false, message: 'Select at least one vehicle to move' })
      }
      const picked = await VehicleSearchHistory.find({ userId: req.user.id, _id: { $in: ids } })
        .select(HISTORY_LIST_FIELDS)
        .lean()
      records = await annotateHistory(req.user.id, picked, filters.today)
    }

    if (records.length > MOVE_TO_LEADS_LIMIT) {
      return res.status(400).json({
        success: false,
        message: `You can move up to ${MOVE_TO_LEADS_LIMIT} vehicles at a time. Narrow the filters and try again.`
      })
    }

    const leads = []
    let alreadyInLeads = 0
    let noExpiryDate = 0
    records.forEach((record) => {
      if (record.lead?.isOpen) {
        alreadyInLeads++
        return
      }
      const lead = buildLeadFromHistory(record, filters)
      if (!lead) {
        noExpiryDate++
        return
      }
      leads.push({ ...lead, userId: req.user.id })
    })

    if (leads.length) await Lead.insertMany(leads)

    return res.status(200).json({
      success: true,
      moved: leads.length,
      alreadyInLeads,
      noExpiryDate
    })
  } catch (error) {
    console.error('Error moving search history to leads:', error)
    return res.status(500).json({ success: false, message: 'Failed to move vehicles to lead management' })
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

// GET /api/vehicle-info/history/:id/particular-pdf -> Vehicle Particulars PDF from saved record (NO API call)
const downloadHistoryParticularPdf = async (req, res) => {
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
    const pdf = await generateParticularPDF(data)
    const fname = `${String(data.REGN_NO).replace(/[^A-Za-z0-9]/g, '')} Particular.pdf`
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${fname}"`)
    return res.send(pdf)
  } catch (error) {
    console.error('Error generating history Particular PDF:', error)
    return res.status(500).json({ success: false, message: 'Failed to generate Particular PDF' })
  }
}

module.exports = {
  downloadRcPdf,
  downloadParticularPdf,
  downloadHistoryParticularPdf,
  downloadHistoryRcPdf,
  lookupVehicle,
  getSavedVehicleByVno,
  getSearchHistory,
  moveHistoryToLeads,
  getHistoryById,
  deleteHistoryItem,
  clearSearchHistory,
  getQuotaStatus
}
