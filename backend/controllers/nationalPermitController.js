const NationalPermit = require('../models/NationalPermit')
const VehicleRegistration = require('../models/VehicleRegistration')

// Helper function to parse date from string (DD-MM-YYYY or DD/MM/YYYY format)
function parsePermitDate(dateString) {
  if (!dateString) return null

  // Handle both DD-MM-YYYY and DD/MM/YYYY formats
  const parts = dateString.split(/[-/]/)
  if (parts.length !== 3) return null

  const day = parseInt(parts[0], 10)
  const month = parseInt(parts[1], 10) - 1 // Month is 0-indexed in JS
  const year = parseInt(parts[2], 10)

  if (isNaN(day) || isNaN(month) || isNaN(year)) return null

  return new Date(year, month, day)
}

// Helper function to calculate Part A status (30-day threshold)
const getPartAStatus = (validTo) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const thirtyDaysFromNow = new Date()
  thirtyDaysFromNow.setDate(today.getDate() + 30)
  thirtyDaysFromNow.setHours(23, 59, 59, 999)

  const validToDate = parsePermitDate(validTo)

  if (!validToDate) {
    return 'active' // Default status if date parsing fails
  }

  if (validToDate < today) {
    return 'expired'
  } else if (validToDate <= thirtyDaysFromNow) {
    return 'expiring_soon'
  } else {
    return 'active'
  }
}

// Helper function to calculate Part B status (30-day threshold)
const getPartBStatus = (validTo) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const thirtyDaysFromNow = new Date()
  thirtyDaysFromNow.setDate(today.getDate() + 30)
  thirtyDaysFromNow.setHours(23, 59, 59, 999)

  const validToDate = parsePermitDate(validTo)

  if (!validToDate) {
    return 'active' // Default status if date parsing fails
  }

  if (validToDate < today) {
    return 'expired'
  } else if (validToDate <= thirtyDaysFromNow) {
    return 'expiring_soon'
  } else {
    return 'active'
  }
}

// ========== CREATE PERMIT ==========

exports.createPermit = async (req, res) => {
  try {
    const {
      vehicleNumber,
      permitNumber,
      permitHolder,
      mobileNumber,
      partAValidFrom,
      partAValidTo,
      partBNumber,
      partBValidFrom,
      partBValidTo,
      totalFee,
      paid,
      balance,
      notes,
      partyId
    } = req.body

    // Validate required fields
    if (!vehicleNumber || !permitHolder) {
      return res.status(400).json({
        success: false,
        message: 'Vehicle number and permit holder are required'
      })
    }

    // Check if active permit already exists (only block if BOTH are strictly 'active')
    const existingPermit = await NationalPermit.findOne({
      vehicleNumber,
      userId: req.user.id,
      isRenewed: false
    }).sort({ createdAt: -1 })

    if (existingPermit) {
      const partAActive = existingPermit.partAStatus === 'active'
      const partBActive = existingPermit.partBStatus === 'active'

      if (partAActive && partBActive) {
        return res.status(400).json({
          success: false,
          message: `Both Part A and Part B are already active for vehicle ${vehicleNumber}. Part A expires: ${existingPermit.partAValidTo}, Part B expires: ${existingPermit.partBValidTo}. Please use "Renew" button.`,
          existingPermit
        })
      }
    }

    // Calculate statuses
    const partAStatus = getPartAStatus(partAValidTo)
    const partBStatus = getPartBStatus(partBValidTo)

    // Get partyId - use provided or fetch from VehicleRegistration
    let finalPartyId = partyId
    if (!finalPartyId && vehicleNumber) {
      const vehicle = await VehicleRegistration.findOne({
        registrationNumber: vehicleNumber.trim().toUpperCase(),
        userId: req.user.id
      })
      if (vehicle && vehicle.partyId) {
        finalPartyId = vehicle.partyId
      }
    }

    // Create new permit
    const newPermit = new NationalPermit({
      userId: req.user.id,
      partyId: finalPartyId || undefined,
      vehicleNumber,
      mobileNumber,

      // Part A fields
      permitNumber,
      permitHolder,
      partAValidFrom,
      partAValidTo,
      partAStatus,
      partADocument: req.body.partADocument || req.files?.partAImage?.[0]?.path || '',

      // Part B fields
      authNumber: partBNumber,
      partBValidFrom,
      partBValidTo,
      partBStatus,
      partBDocument: req.body.partBDocument || req.files?.partBImage?.[0]?.path || '',

      // Payment
      totalFee: parseFloat(totalFee) || 0,
      paid: parseFloat(paid) || 0,
      balance: parseFloat(balance) || 0,

      isRenewed: false,
      notes
    })

    await newPermit.save()

    res.status(201).json({
      success: true,
      message: 'National permit created successfully',
      data: newPermit
    })
  } catch (error) {
    console.error('Error creating permit:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to create permit',
      error: error.message
    })
  }
}

// ========== GET ALL PERMITS ==========

exports.getAllPermits = async (req, res) => {
  try {
    const mongoose = require('mongoose')
    const {
      search,
      page = 1,
      limit = 20,
      status,
      showHistory = 'false',
      vehicleNumber
    } = req.query

    // Special handling for expired/expiring status filters - use aggregation to show only latest per vehicle
    if (status && ['partAExpiring', 'partBExpiring', 'partAExpired', 'partBExpired'].includes(status)) {
      let matchQuery = {
        userId: new mongoose.Types.ObjectId(req.user.id),
        isRenewed: false
      }

      // Get exclusion lists based on status
      let excludeVehicles = []

      if (status === 'partAExpiring') {
        matchQuery.partAStatus = 'expiring_soon'
        // Exclude vehicles with active Part A
        excludeVehicles = await NationalPermit.find({
          userId: req.user.id,
          isRenewed: false,
          partAStatus: 'active'
        }).distinct('vehicleNumber')
      } else if (status === 'partBExpiring') {
        matchQuery.partBStatus = 'expiring_soon'
        // Exclude vehicles with active Part B
        excludeVehicles = await NationalPermit.find({
          userId: req.user.id,
          isRenewed: false,
          partBStatus: 'active'
        }).distinct('vehicleNumber')
      } else if (status === 'partAExpired') {
        matchQuery.partAStatus = 'expired'
        // Exclude vehicles with active OR expiring_soon Part A
        excludeVehicles = await NationalPermit.find({
          userId: req.user.id,
          isRenewed: false,
          partAStatus: { $in: ['active', 'expiring_soon'] }
        }).distinct('vehicleNumber')
      } else if (status === 'partBExpired') {
        matchQuery.partBStatus = 'expired'
        // Exclude vehicles with active OR expiring_soon Part B
        excludeVehicles = await NationalPermit.find({
          userId: req.user.id,
          isRenewed: false,
          partBStatus: { $in: ['active', 'expiring_soon'] }
        }).distinct('vehicleNumber')
      }

      if (excludeVehicles.length > 0) {
        matchQuery.vehicleNumber = { $nin: excludeVehicles }
      }

      // Use aggregation to get only latest per vehicle
      const permits = await NationalPermit.aggregate([
        { $match: matchQuery },
        { $sort: { createdAt: -1 } },
        {
          $group: {
            _id: '$vehicleNumber',
            latestPermit: { $first: '$$ROOT' }
          }
        },
        { $replaceRoot: { newRoot: '$latestPermit' } },
        { $sort: { createdAt: -1 } },
        { $skip: (parseInt(page) - 1) * parseInt(limit) },
        { $limit: parseInt(limit) }
      ])

      // Ensure WhatsApp tracking fields have default values for older records
      const permitsWithDefaults = permits.map(permit => ({
        ...permit,
        whatsappMessageCount: permit.whatsappMessageCount || 0,
        lastWhatsappSentAt: permit.lastWhatsappSentAt || null
      }))

      // Count unique vehicles for total
      const uniqueVehicles = await NationalPermit.find(matchQuery).distinct('vehicleNumber')
      const total = uniqueVehicles.length

      return res.status(200).json({
        success: true,
        data: permitsWithDefaults,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalRecords: total,
          limit: parseInt(limit)
        }
      })
    }

    // Regular query for other cases (all, pending, search, etc.)
    const query = { userId: req.user.id }

    // Filter by history
    if (showHistory === 'false') {
      query.isRenewed = false
    }

    // Search filter (vehicle number and permit holder name only)
    if (search) {
      query.$or = [
        { vehicleNumber: { $regex: search, $options: 'i' } },
        { permitHolder: { $regex: search, $options: 'i' } }
      ]
    }

    // Vehicle number filter (for showing history of specific vehicle)
    if (vehicleNumber) {
      query.vehicleNumber = { $regex: vehicleNumber, $options: 'i' }
    }

    // Status filter for other statuses
    if (status && status !== 'all') {
      if (status === 'pending') {
        query.balance = { $gt: 0 }
        query.isRenewed = false
      }
    }

    // Execute query with pagination
    const permits = await NationalPermit.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .lean() // Convert to plain JavaScript objects

    // Ensure WhatsApp tracking fields have default values for older records
    const permitsWithDefaults = permits.map(permit => ({
      ...permit,
      whatsappMessageCount: permit.whatsappMessageCount || 0,
      lastWhatsappSentAt: permit.lastWhatsappSentAt || null
    }))

    const total = await NationalPermit.countDocuments(query)

    res.status(200).json({
      success: true,
      data: permitsWithDefaults,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalRecords: total,
        limit: parseInt(limit)
      }
    })
  } catch (error) {
    console.error('Error fetching permits:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch permits',
      error: error.message
    })
  }
}



// ========== UPDATE PERMIT ==========

exports.updatePermit = async (req, res) => {
  try {
    const { id } = req.params
    const updateData = req.body

    const permit = await NationalPermit.findOne({ _id: id, userId: req.user.id })

    if (!permit) {
      return res.status(404).json({
        success: false,
        message: 'Permit not found'
      })
    }

    // Update basic fields
    if (updateData.mobileNumber !== undefined) permit.mobileNumber = updateData.mobileNumber

    // Update Part A
    if (updateData.permitNumber !== undefined) permit.permitNumber = updateData.permitNumber
    if (updateData.permitHolder) permit.permitHolder = updateData.permitHolder
    if (updateData.partAValidFrom) permit.partAValidFrom = updateData.partAValidFrom
    if (updateData.partAValidTo) {
      permit.partAValidTo = updateData.partAValidTo
      permit.partAStatus = getPartAStatus(updateData.partAValidTo)
    }

    // Update Part B
    if (updateData.partBNumber !== undefined) permit.authNumber = updateData.partBNumber
    if (updateData.partBValidFrom) permit.partBValidFrom = updateData.partBValidFrom
    if (updateData.partBValidTo) {
      permit.partBValidTo = updateData.partBValidTo
      permit.partBStatus = getPartBStatus(updateData.partBValidTo)
    }

    // Update payment
    if (updateData.totalFee !== undefined) permit.totalFee = parseFloat(updateData.totalFee)
    if (updateData.paid !== undefined) permit.paid = parseFloat(updateData.paid)
    if (updateData.balance !== undefined) permit.balance = parseFloat(updateData.balance)

    // Update notes
    if (updateData.notes !== undefined) permit.notes = updateData.notes

    // Update partyId
    if (updateData.partyId !== undefined) permit.partyId = updateData.partyId || null

    // Update documents
    if (updateData.partADocument !== undefined) permit.partADocument = updateData.partADocument
    if (updateData.partBDocument !== undefined) permit.partBDocument = updateData.partBDocument

    await permit.save()

    res.status(200).json({
      success: true,
      message: 'Permit updated successfully',
      data: permit
    })
  } catch (error) {
    console.error('Error updating permit:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to update permit',
      error: error.message
    })
  }
}

// ========== MARK AS PAID ==========

exports.markAsPaid = async (req, res) => {
  try {
    const { id } = req.params

    const permit = await NationalPermit.findOne({ _id: id, userId: req.user.id })

    if (!permit) {
      return res.status(404).json({
        success: false,
        message: 'Permit not found'
      })
    }

    permit.paid = permit.totalFee
    permit.balance = 0
    await permit.save()

    res.status(200).json({
      success: true,
      message: 'Payment marked as complete',
      data: permit
    })
  } catch (error) {
    console.error('Error marking as paid:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to mark as paid',
      error: error.message
    })
  }
};

// Increment WhatsApp message count
exports.incrementWhatsAppCount = async (req, res) => {
  try {
    const permit = await NationalPermit.findOne({ _id: req.params.id, userId: req.user.id })

    if (!permit) {
      return res.status(404).json({
        success: false,
        message: 'Permit not found'
      })
    }

    // Increment the WhatsApp message count
    permit.whatsappMessageCount = (permit.whatsappMessageCount || 0) + 1
    permit.lastWhatsappSentAt = new Date()

    await permit.save()

    res.status(200).json({
      success: true,
      message: 'WhatsApp message count updated successfully',
      data: {
        whatsappMessageCount: permit.whatsappMessageCount,
        lastWhatsappSentAt: permit.lastWhatsappSentAt
      }
    })
  } catch (error) {
    console.error('Error incrementing WhatsApp count:', error)
    res.status(500).json({
      success: false,
      message: 'Error updating WhatsApp message count',
      error: error.message
    })
  }
}

// ========== DELETE PERMIT ==========

exports.deletePermit = async (req, res) => {
  try {
    const { id } = req.params

    const permit = await NationalPermit.findOneAndDelete({ _id: id, userId: req.user.id })

    if (!permit) {
      return res.status(404).json({
        success: false,
        message: 'Permit not found'
      })
    }

    res.status(200).json({
      success: true,
      message: 'Permit deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting permit:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to delete permit',
      error: error.message
    })
  }
}

// ========== EXPORT ALL PERMITS ==========

exports.exportAllPermits = async (req, res) => {
  try {
    const permits = await NationalPermit.find({ userId: req.user.id })
      .sort({ createdAt: -1 })

    res.status(200).json({
      success: true,
      data: permits
    })
  } catch (error) {
    console.error('Error exporting permits:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to export permits',
      error: error.message
    })
  }
}

// ========== CHECK EXISTING PERMIT ==========

exports.checkExistingPermit = async (req, res) => {
  try {
    const { vehicleNumber } = req.params

    // Find latest (non-renewed) permit for this vehicle
    const existingPermit = await NationalPermit.findOne({
      vehicleNumber,
      userId: req.user.id,
      isRenewed: false
    }).sort({ createdAt: -1 })

    if (!existingPermit) {
      return res.status(200).json({
        success: true,
        data: {
          hasActivePermit: false,
          message: 'No existing permit found. You can create a new permit.'
        }
      })
    }

    // Check if strictly active (for blocking creation and autofill)
    const partAStrictlyActive = existingPermit.partAStatus === 'active'
    const partBStrictlyActive = existingPermit.partBStatus === 'active'

    // Prepare Part A data - only autofill if strictly active
    const activePartA = partAStrictlyActive ? {
      permitNumber: existingPermit.permitNumber,
      permitHolder: existingPermit.permitHolder,
      validFrom: existingPermit.partAValidFrom,
      validTo: existingPermit.partAValidTo,
      mobileNumber: existingPermit.mobileNumber
    } : null

    // Prepare Part B data - only autofill if strictly active
    const activePartB = partBStrictlyActive ? {
      partBNumber: existingPermit.authNumber,
      validFrom: existingPermit.partBValidFrom,
      validTo: existingPermit.partBValidTo
    } : null

    // Prepare old permit details for display (not autofill)
    const oldPartADetails = !partAStrictlyActive ? {
      permitNumber: existingPermit.permitNumber,
      permitHolder: existingPermit.permitHolder,
      validFrom: existingPermit.partAValidFrom,
      validTo: existingPermit.partAValidTo,
      status: existingPermit.partAStatus
    } : null

    const oldPartBDetails = !partBStrictlyActive ? {
      authNumber: existingPermit.authNumber,
      validFrom: existingPermit.partBValidFrom,
      validTo: existingPermit.partBValidTo,
      status: existingPermit.partBStatus
    } : null

    // Only block creation if BOTH are strictly active
    if (partAStrictlyActive && partBStrictlyActive) {
      return res.status(200).json({
        success: true,
        data: {
          hasActivePermit: true,
          hasActivePartA: true,
          hasActivePartB: true,
          message: 'Both Part A and Part B are active. Cannot create new permit.',
          activePartA,
          activePartB
        }
      })
    }

    // Build appropriate message
    let message = 'Ready to create new permit.'
    if (partAStrictlyActive && !partBStrictlyActive) {
      message = 'Part A is active (will be auto-filled). Please add new Part B details.'
    } else if (!partAStrictlyActive && partBStrictlyActive) {
      message = 'Part B is active (will be auto-filled). Please add new Part A details.'
    } else if (!partAStrictlyActive && !partBStrictlyActive) {
      message = 'Please add both Part A and Part B details (both need renewal).'
    }

    res.status(200).json({
      success: true,
      data: {
        hasActivePermit: false,
        hasActivePartA: partAStrictlyActive,
        hasActivePartB: partBStrictlyActive,
        message,
        activePartA,
        activePartB,
        oldPartADetails,
        oldPartBDetails
      }
    })
  } catch (error) {
    console.error('Error checking existing permit:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to check existing permit',
      error: error.message
    })
  }
}

// ========== GET PENDING PAYMENT PERMITS ==========

exports.getPendingPermits = async (req, res) => {
  try {
    const { search, page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = req.query

    // Build query for pending payments
    const query = {
      userId: req.user.id,
      isRenewed: false,
      balance: { $gt: 0 }
    }

    // Search filter (vehicle number and permit holder name only)
    if (search) {
      query.$or = [
        { vehicleNumber: { $regex: search, $options: 'i' } },
        { permitHolder: { $regex: search, $options: 'i' } }
      ]
    }

    // Sort options
    const sortOptions = {}
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1

    // Execute query with pagination
    const permits = await NationalPermit.find(query)
      .sort(sortOptions)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))

    const total = await NationalPermit.countDocuments(query)

    res.status(200).json({
      success: true,
      data: permits,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalRecords: total,
        limit: parseInt(limit)
      }
    })
  } catch (error) {
    console.error('Error fetching pending payment permits:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending payment permits',
      error: error.message
    })
  }
}

// ========== GET PART A EXPIRING SOON ==========

exports.getPartAExpiringSoon = async (req, res) => {
  try {
    const mongoose = require('mongoose')
    const { search, page = 1, limit = 20, sortBy = 'partAValidTo', sortOrder = 'asc' } = req.query

    // Get vehicle numbers with active Part A (to exclude from expiring list)
    const vehiclesWithActivePartA = await NationalPermit.find({
      userId: req.user.id,
      isRenewed: false,
      partAStatus: 'active'
    }).distinct('vehicleNumber')

    // Build aggregation pipeline
    const pipeline = [
      {
        $match: {
          userId: new mongoose.Types.ObjectId(req.user.id),
          isRenewed: false,
          partAStatus: 'expiring_soon',
          vehicleNumber: { $nin: vehiclesWithActivePartA }
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: '$vehicleNumber',
          latestPermit: { $first: '$$ROOT' }
        }
      },
      {
        $replaceRoot: { newRoot: '$latestPermit' }
      }
    ]

    // Add search filter if provided (vehicle number and permit holder name only)
    if (search) {
      pipeline.splice(1, 0, {
        $match: {
          $or: [
            { vehicleNumber: { $regex: search, $options: 'i' } },
            { permitHolder: { $regex: search, $options: 'i' } }
          ]
        }
      })
    }

    // Add sorting
    const sortOptions = {}
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1
    pipeline.push({ $sort: sortOptions })

    // Get total count before pagination
    const countPipeline = [...pipeline]
    countPipeline.push({ $count: 'total' })
    const countResult = await NationalPermit.aggregate(countPipeline)
    const total = countResult.length > 0 ? countResult[0].total : 0

    // Add pagination
    pipeline.push({ $skip: (parseInt(page) - 1) * parseInt(limit) })
    pipeline.push({ $limit: parseInt(limit) })

    const permits = await NationalPermit.aggregate(pipeline)

    res.status(200).json({
      success: true,
      data: permits,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalRecords: total,
        limit: parseInt(limit)
      }
    })
  } catch (error) {
    console.error('Error fetching Part A expiring soon:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch Part A expiring soon',
      error: error.message
    })
  }
}

// ========== GET PART B EXPIRING SOON ==========

exports.getPartBExpiringSoon = async (req, res) => {
  try {
    const mongoose = require('mongoose')
    const { search, page = 1, limit = 20, sortBy = 'partBValidTo', sortOrder = 'asc' } = req.query

    // Get vehicle numbers with active Part B (to exclude from expiring list)
    const vehiclesWithActivePartB = await NationalPermit.find({
      userId: req.user.id,
      isRenewed: false,
      partBStatus: 'active'
    }).distinct('vehicleNumber')

    // Build aggregation pipeline
    const pipeline = [
      {
        $match: {
          userId: new mongoose.Types.ObjectId(req.user.id),
          isRenewed: false,
          partBStatus: 'expiring_soon',
          vehicleNumber: { $nin: vehiclesWithActivePartB }
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: '$vehicleNumber',
          latestPermit: { $first: '$$ROOT' }
        }
      },
      {
        $replaceRoot: { newRoot: '$latestPermit' }
      }
    ]

    // Add search filter if provided (vehicle number and permit holder name only)
    if (search) {
      pipeline.splice(1, 0, {
        $match: {
          $or: [
            { vehicleNumber: { $regex: search, $options: 'i' } },
            { permitHolder: { $regex: search, $options: 'i' } }
          ]
        }
      })
    }

    // Add sorting
    const sortOptions = {}
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1
    pipeline.push({ $sort: sortOptions })

    // Get total count before pagination
    const countPipeline = [...pipeline]
    countPipeline.push({ $count: 'total' })
    const countResult = await NationalPermit.aggregate(countPipeline)
    const total = countResult.length > 0 ? countResult[0].total : 0

    // Add pagination
    pipeline.push({ $skip: (parseInt(page) - 1) * parseInt(limit) })
    pipeline.push({ $limit: parseInt(limit) })

    const permits = await NationalPermit.aggregate(pipeline)

    res.status(200).json({
      success: true,
      data: permits,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalRecords: total,
        limit: parseInt(limit)
      }
    })
  } catch (error) {
    console.error('Error fetching Part B expiring soon:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch Part B expiring soon',
      error: error.message
    })
  }
}

// ========== GET PART A EXPIRED ==========

exports.getPartAExpired = async (req, res) => {
  try {
    const mongoose = require('mongoose')
    const { search, page = 1, limit = 20, sortBy = 'partAValidTo', sortOrder = 'desc' } = req.query

    // Get vehicle numbers with active OR expiring_soon Part A (to exclude from expired list)
    const vehiclesWithActiveOrExpiringSoonPartA = await NationalPermit.find({
      userId: req.user.id,
      isRenewed: false,
      partAStatus: { $in: ['active', 'expiring_soon'] }
    }).distinct('vehicleNumber')

    // Build aggregation pipeline
    const pipeline = [
      {
        $match: {
          userId: new mongoose.Types.ObjectId(req.user.id),
          isRenewed: false,
          partAStatus: 'expired',
          vehicleNumber: { $nin: vehiclesWithActiveOrExpiringSoonPartA }
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: '$vehicleNumber',
          latestPermit: { $first: '$$ROOT' }
        }
      },
      {
        $replaceRoot: { newRoot: '$latestPermit' }
      }
    ]

    // Add search filter if provided (vehicle number and permit holder name only)
    if (search) {
      pipeline.splice(1, 0, {
        $match: {
          $or: [
            { vehicleNumber: { $regex: search, $options: 'i' } },
            { permitHolder: { $regex: search, $options: 'i' } }
          ]
        }
      })
    }

    // Add sorting
    const sortOptions = {}
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1
    pipeline.push({ $sort: sortOptions })

    // Get total count before pagination
    const countPipeline = [...pipeline]
    countPipeline.push({ $count: 'total' })
    const countResult = await NationalPermit.aggregate(countPipeline)
    const total = countResult.length > 0 ? countResult[0].total : 0

    // Add pagination
    pipeline.push({ $skip: (parseInt(page) - 1) * parseInt(limit) })
    pipeline.push({ $limit: parseInt(limit) })

    const permits = await NationalPermit.aggregate(pipeline)

    res.status(200).json({
      success: true,
      data: permits,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalRecords: total,
        limit: parseInt(limit)
      }
    })
  } catch (error) {
    console.error('Error fetching Part A expired:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch Part A expired',
      error: error.message
    })
  }
}

// ========== GET PART B EXPIRED ==========

exports.getPartBExpired = async (req, res) => {
  try {
    const mongoose = require('mongoose')
    const { search, page = 1, limit = 20, sortBy = 'partBValidTo', sortOrder = 'desc' } = req.query

    // Get vehicle numbers with active OR expiring_soon Part B (to exclude from expired list)
    const vehiclesWithActiveOrExpiringSoonPartB = await NationalPermit.find({
      userId: req.user.id,
      isRenewed: false,
      partBStatus: { $in: ['active', 'expiring_soon'] }
    }).distinct('vehicleNumber')

    // Build aggregation pipeline
    const pipeline = [
      {
        $match: {
          userId: new mongoose.Types.ObjectId(req.user.id),
          isRenewed: false,
          partBStatus: 'expired',
          vehicleNumber: { $nin: vehiclesWithActiveOrExpiringSoonPartB }
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: '$vehicleNumber',
          latestPermit: { $first: '$$ROOT' }
        }
      },
      {
        $replaceRoot: { newRoot: '$latestPermit' }
      }
    ]

    // Add search filter if provided (vehicle number and permit holder name only)
    if (search) {
      pipeline.splice(1, 0, {
        $match: {
          $or: [
            { vehicleNumber: { $regex: search, $options: 'i' } },
            { permitHolder: { $regex: search, $options: 'i' } }
          ]
        }
      })
    }

    // Add sorting
    const sortOptions = {}
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1
    pipeline.push({ $sort: sortOptions })

    // Get total count before pagination
    const countPipeline = [...pipeline]
    countPipeline.push({ $count: 'total' })
    const countResult = await NationalPermit.aggregate(countPipeline)
    const total = countResult.length > 0 ? countResult[0].total : 0

    // Add pagination
    pipeline.push({ $skip: (parseInt(page) - 1) * parseInt(limit) })
    pipeline.push({ $limit: parseInt(limit) })

    const permits = await NationalPermit.aggregate(pipeline)

    res.status(200).json({
      success: true,
      data: permits,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalRecords: total,
        limit: parseInt(limit)
      }
    })
  } catch (error) {
    console.error('Error fetching Part B expired:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch Part B expired',
      error: error.message
    })
  }
}

// ========== GET PART A RENEWAL HISTORY ==========

exports.getPartARenewalHistory = async (req, res) => {
  try {
    const { id } = req.params

    // Get the current permit
    const permit = await NationalPermit.findById(id)

    if (!permit) {
      return res.status(404).json({
        success: false,
        message: 'Permit not found'
      })
    }

    // Find all permits for this vehicle (history)
    const history = await NationalPermit.find({
      vehicleNumber: permit.vehicleNumber,
      userId: req.user.id
    }).sort({ createdAt: -1 })

    res.status(200).json({
      success: true,
      data: history
    })
  } catch (error) {
    console.error('Error fetching Part A renewal history:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch renewal history',
      error: error.message
    })
  }
}

// ========== GET PART B RENEWAL HISTORY ==========

exports.getPartBRenewalHistory = async (req, res) => {
  try {
    const { id } = req.params

    // Get the current permit
    const permit = await NationalPermit.findById(id)

    if (!permit) {
      return res.status(404).json({
        success: false,
        message: 'Permit not found'
      })
    }

    // Find all permits for this vehicle (history)
    const history = await NationalPermit.find({
      vehicleNumber: permit.vehicleNumber,
      userId: req.user.id
    }).sort({ createdAt: -1 })

    res.status(200).json({
      success: true,
      data: history
    })
  } catch (error) {
    console.error('Error fetching Part B renewal history:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch renewal history',
      error: error.message
    })
  }
}

// ========== GET STATISTICS ==========

exports.getStatistics = async (req, res) => {
  try {
    const mongoose = require('mongoose')

    // Total permits (only non-renewed)
    const total = await NationalPermit.countDocuments({
      userId: req.user.id,
      isRenewed: false
    })

    // Get vehicle numbers with active OR expiring_soon Part A (to exclude from expired counts)
    const vehiclesWithActiveOrExpiringSoonPartA = await NationalPermit.find({
      userId: req.user.id,
      isRenewed: false,
      partAStatus: { $in: ['active', 'expiring_soon'] }
    }).distinct('vehicleNumber')

    // Get vehicle numbers with active OR expiring_soon Part B (to exclude from expired counts)
    const vehiclesWithActiveOrExpiringSoonPartB = await NationalPermit.find({
      userId: req.user.id,
      isRenewed: false,
      partBStatus: { $in: ['active', 'expiring_soon'] }
    }).distinct('vehicleNumber')

    // Get vehicle numbers with only active Part A (to exclude from expiring_soon counts)
    const vehiclesWithActivePartA = await NationalPermit.find({
      userId: req.user.id,
      isRenewed: false,
      partAStatus: 'active'
    }).distinct('vehicleNumber')

    // Get vehicle numbers with only active Part B (to exclude from expiring_soon counts)
    const vehiclesWithActivePartB = await NationalPermit.find({
      userId: req.user.id,
      isRenewed: false,
      partBStatus: 'active'
    }).distinct('vehicleNumber')

    // Part A expiring soon - count unique vehicles (only latest expiring per vehicle)
    const partAExpiringSoonVehicles = await NationalPermit.find({
      userId: req.user.id,
      isRenewed: false,
      partAStatus: 'expiring_soon',
      vehicleNumber: { $nin: vehiclesWithActivePartA }
    }).distinct('vehicleNumber')
    const partAExpiringSoon = partAExpiringSoonVehicles.length

    // Part B expiring soon - count unique vehicles (only latest expiring per vehicle)
    const partBExpiringSoonVehicles = await NationalPermit.find({
      userId: req.user.id,
      isRenewed: false,
      partBStatus: 'expiring_soon',
      vehicleNumber: { $nin: vehiclesWithActivePartB }
    }).distinct('vehicleNumber')
    const partBExpiringSoon = partBExpiringSoonVehicles.length

    // Part A expired - count unique vehicles (only latest expired per vehicle)
    const partAExpiredVehicles = await NationalPermit.find({
      userId: req.user.id,
      isRenewed: false,
      partAStatus: 'expired',
      vehicleNumber: { $nin: vehiclesWithActiveOrExpiringSoonPartA }
    }).distinct('vehicleNumber')
    const partAExpired = partAExpiredVehicles.length

    // Part B expired - count unique vehicles (only latest expired per vehicle)
    const partBExpiredVehicles = await NationalPermit.find({
      userId: req.user.id,
      isRenewed: false,
      partBStatus: 'expired',
      vehicleNumber: { $nin: vehiclesWithActiveOrExpiringSoonPartB }
    }).distinct('vehicleNumber')
    const partBExpired = partBExpiredVehicles.length

    // Active permits (both Part A and Part B are active)
    const activePermits = await NationalPermit.countDocuments({
      userId: req.user.id,
      isRenewed: false,
      partAStatus: 'active',
      partBStatus: 'active'
    })

    // Pending payment aggregation
    const pendingPaymentPipeline = [
      {
        $match: {
          userId: new mongoose.Types.ObjectId(req.user.id),
          isRenewed: false,
          balance: { $gt: 0 }
        }
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          totalAmount: { $sum: '$balance' }
        }
      }
    ]

    const pendingPaymentResults = await NationalPermit.aggregate(pendingPaymentPipeline)
    const pendingPaymentCount = pendingPaymentResults.length > 0 ? pendingPaymentResults[0].count : 0
    const pendingPaymentAmount = pendingPaymentResults.length > 0 ? pendingPaymentResults[0].totalAmount : 0

    res.status(200).json({
      success: true,
      data: {
        total,
        active: activePermits,
        partAExpiringSoon,
        partBExpiringSoon,
        partAExpired,
        partBExpired,
        pendingPaymentCount,
        pendingPaymentAmount
      }
    })
  } catch (error) {
    console.error('Error fetching National Permit statistics:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    })
  }
}

