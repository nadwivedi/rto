const Fitness = require('../models/Fitness')
const VehicleRegistration = require('../models/VehicleRegistration')
const { checkUserAndQueueAlerts } = require('../jobs/whatsappDailyExpiryChecker')
const mongoose = require('mongoose')
const fs = require('fs')
const path = require('path')

const fitnessUploadsDir = path.join(__dirname, '..', 'uploads', 'fitness-documents')

if (!fs.existsSync(fitnessUploadsDir)) {
  fs.mkdirSync(fitnessUploadsDir, { recursive: true })
}

const saveFitnessDocument = ({ imageBase64, vehicleNumber, userId, originalName }) => {
  if (!imageBase64 || typeof imageBase64 !== 'string') return null

  const match = imageBase64.match(/^data:(image\/[a-zA-Z0-9.+-]+|application\/pdf);base64,(.+)$/)
  if (!match) return null

  const mimeType = match[1]
  const base64Data = match[2]
  const buffer = Buffer.from(base64Data, 'base64')
  const safeVehicleNumber = String(vehicleNumber || 'fitness').replace(/[^a-zA-Z0-9]/g, '').toUpperCase() || 'FITNESS'

  let extension = 'bin'
  if (mimeType === 'application/pdf') extension = 'pdf'
  else if (mimeType.includes('png')) extension = 'png'
  else if (mimeType.includes('webp')) extension = 'webp'
  else if (mimeType.includes('gif')) extension = 'gif'
  else if (mimeType.includes('jpeg') || mimeType.includes('jpg')) extension = 'jpg'

  const filename = `fitness-${safeVehicleNumber}-${userId}-${Date.now()}.${extension}`
  const filePath = path.join(fitnessUploadsDir, filename)
  fs.writeFileSync(filePath, buffer)

  return {
    relativePath: `/uploads/fitness-documents/${filename}`,
    mimeType,
    originalName: originalName || filename
  }
}

const deleteFitnessDocument = (documentPath) => {
  if (!documentPath) return

  try {
    const filename = path.basename(documentPath)
    const filePath = path.join(fitnessUploadsDir, filename)
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }
  } catch (error) {
    console.error('Error deleting fitness document:', error)
  }
}

// helper function to calculate status
const getFitnessStatus = (validTo) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(today.getDate() + 30);
  thirtyDaysFromNow.setHours(23, 59, 59, 999);

  // a little utility function to parse dates consistently
  const parseDate = (dateString) => {
      const parts = dateString.split(/[-/]/);
      // new Date(year, monthIndex, day)
      return new Date(parts[2], parts[1] - 1, parts[0]);
  };

  const validToDate = parseDate(validTo);

  if (validToDate < today) {
    return 'expired';
  } else if (validToDate <= thirtyDaysFromNow) {
    return 'expiring_soon';
  } else {
    return 'active';
  }
};


// Get all fitness records
exports.getAllFitness = async (req, res) => {
  try {
    const { search, page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = req.query

    const query = { userId: req.user.id }

    // Search by vehicle number or owner name
    if (search) {
      query.$or = [
        { vehicleNumber: { $regex: search, $options: 'i' } },
        { ownerName: { $regex: search, $options: 'i' } }
      ]
    }

    const skip = (parseInt(page) - 1) * parseInt(limit)

    const sortOptions = {}
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1

    const fitnessRecords = await Fitness.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))

    const total = await Fitness.countDocuments(query)

    res.json({
      success: true,
      data: fitnessRecords,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalRecords: total,
        hasMore: skip + fitnessRecords.length < total
      }
    })
  } catch (error) {
    console.error('Error fetching fitness records:', error)
    res.status(500).json({
      success: false,
      message: 'Error fetching fitness records',
      error: error.message
    })
  }
}

// Export all fitness records without pagination
exports.exportAllFitness = async (req, res) => {
  try {
    const fitnessRecords = await Fitness.find({ userId: req.user.id })
      .sort({ createdAt: -1 })

    res.json({
      success: true,
      data: fitnessRecords,
      total: fitnessRecords.length
    })
  } catch (error) {
    console.error('Error exporting fitness records:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to export fitness records',
      error: error.message
    })
  }
}

// Get expiring soon fitness records
exports.getExpiringSoonFitness = async (req, res) => {
  try {

    const { search, page = 1, limit = 20, sortBy = 'validTo', sortOrder = 'asc' } = req.query

    // Find all vehicle numbers that have both expiring_soon and active fitness
    // These vehicles have been renewed and should be excluded
    const vehiclesWithActiveFitness = await Fitness.find({ status: 'active', userId: req.user.id })
      .distinct('vehicleNumber')

    const query = {
      status: 'expiring_soon',
      vehicleNumber: { $nin: vehiclesWithActiveFitness },
      userId: req.user.id
    }

    if (search) {
      // Update the condition to work with search for both vehicleNumber and ownerName
      query.$and = [
        { vehicleNumber: { $nin: vehiclesWithActiveFitness } },
        {
          $or: [
            { vehicleNumber: { $regex: search, $options: 'i' } },
            { ownerName: { $regex: search, $options: 'i' } }
          ]
        }
      ]
      delete query.vehicleNumber
    }

    const skip = (parseInt(page) - 1) * parseInt(limit)

    const sortOptions = {}
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1

    const fitnessRecords = await Fitness.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))

    const total = await Fitness.countDocuments(query)

    res.json({
      success: true,
      data: fitnessRecords,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalRecords: total,
        hasMore: skip + fitnessRecords.length < total
      }
    })
  } catch (error) {
    console.error('Error fetching expiring soon fitness records:', error)
    res.status(500).json({
      success: false,
      message: 'Error fetching expiring soon fitness records',
      error: error.message
    })
  }
}

// Get expired fitness records
exports.getExpiredFitness = async (req, res) => {
  try {
    const { search, page = 1, limit = 20, sortBy = 'validTo', sortOrder = 'desc' } = req.query

    // Find all vehicle numbers that have active fitness
    // These vehicles have been renewed and should be excluded
    const vehiclesWithActiveFitness = await Fitness.find({ status: 'active', userId: req.user.id })
      .distinct('vehicleNumber')

    const query = {
      status: 'expired',
      vehicleNumber: { $nin: vehiclesWithActiveFitness },
      userId: req.user.id
    }

    if (search) {
      // Update the condition to work with search for both vehicleNumber and ownerName
      query.$and = [
        { vehicleNumber: { $nin: vehiclesWithActiveFitness } },
        {
          $or: [
            { vehicleNumber: { $regex: search, $options: 'i' } },
            { ownerName: { $regex: search, $options: 'i' } }
          ]
        }
      ]
      delete query.vehicleNumber
    }

    const skip = (parseInt(page) - 1) * parseInt(limit)

    const sortOptions = {}
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1

    const fitnessRecords = await Fitness.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))

    const total = await Fitness.countDocuments(query)

    res.json({
      success: true,
      data: fitnessRecords,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalRecords: total,
        hasMore: skip + fitnessRecords.length < total
      }
    })
  } catch (error) {
    console.error('Error fetching expired fitness records:', error)
    res.status(500).json({
      success: false,
      message: 'Error fetching expired fitness records',
      error: error.message
    })
  }
}

// Get active fitness records
exports.getActiveFitness = async (req, res) => {
  try {
    const { search, page = 1, limit = 20, sortBy = 'validTo', sortOrder = 'asc' } = req.query

    const query = { status: 'active', userId: req.user.id }

    // Search by vehicle number or owner name
    if (search) {
      query.$or = [
        { vehicleNumber: { $regex: search, $options: 'i' } },
        { ownerName: { $regex: search, $options: 'i' } }
      ]
    }

    const skip = (parseInt(page) - 1) * parseInt(limit)

    const sortOptions = {}
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1

    const fitnessRecords = await Fitness.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))

    const total = await Fitness.countDocuments(query)

    res.json({
      success: true,
      data: fitnessRecords,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalRecords: total,
        hasMore: skip + fitnessRecords.length < total
      }
    })
  } catch (error) {
    console.error('Error fetching active fitness records:', error)
    res.status(500).json({
      success: false,
      message: 'Error fetching active fitness records',
      error: error.message
    })
  }
}

// Get pending fitness records
exports.getPendingFitness = async (req, res) => {
  try {
    const { search, page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = req.query

    const query = { balance: { $gt: 0 }, userId: req.user.id }

    // Search by vehicle number or owner name
    if (search) {
      query.$or = [
        { vehicleNumber: { $regex: search, $options: 'i' } },
        { ownerName: { $regex: search, $options: 'i' } }
      ]
    }

    const skip = (parseInt(page) - 1) * parseInt(limit)

    const sortOptions = {}
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1

    const fitnessRecords = await Fitness.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))

    const total = await Fitness.countDocuments(query)

    res.json({
      success: true,
      data: fitnessRecords,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalRecords: total,
        hasMore: skip + fitnessRecords.length < total
      }
    })
  } catch (error) {
    console.error('Error fetching pending fitness records:', error)
    res.status(500).json({
      success: false,
      message: 'Error fetching pending fitness records',
      error: error.message
    })
  }
}


// Get single fitness record by ID
exports.getFitnessById = async (req, res) => {
  try {
    const fitness = await Fitness.findOne({ _id: req.params.id, userId: req.user.id })

    if (!fitness) {
      return res.status(404).json({
        success: false,
        message: 'Fitness record not found'
      })
    }

    res.json({
      success: true,
      data: fitness
    })
  } catch (error) {
    console.error('Error fetching fitness record:', error)
    res.status(500).json({
      success: false,
      message: 'Error fetching fitness record',
      error: error.message
    })
  }
}

// Create new fitness record
exports.createFitness = async (req, res) => {
  try {
    const {
      ownerName,
      vehicleNumber,
      mobileNumber,
      date,
      validFrom,
      validTo,
      totalFee,
      paid,
      balance,
      feeBreakup,
      partyId: reqPartyId,
      fitnessDocumentBase64,
      fitnessDocumentName
    } = req.body

    // Validate required fields
    if (!vehicleNumber ) {
      return res.status(400).json({
        success: false,
        message: 'Vehicle number is required '
      })
    }

    if(!validFrom || !validTo){
      return res.status(400).json({success:false , message:'valid from, and valid to are required'})

    }

    if(totalFee === undefined || totalFee === null || paid === undefined || paid === null || balance === undefined || balance === null){
      return res.status(400).json({success:false , message:'total fee, paid amount, and balance are required'})
    }

    // Validate that paid amount can't be greater than total amount
    if(Number(paid) > Number(totalFee)){
      return res.status(400).json({success:false , message:'paid amount cannot be greater than total fee'})
    }

    // Validate that balance amount can't be negative
    if(Number(balance) < 0){
      return res.status(400).json({success:false , message:'balance amount cannot be negative'})
    }

    // Calculate status
    const status = getFitnessStatus(validTo);

    // Use partyId from request body if provided, otherwise auto-fetch from vehicle registration
    let partyId = reqPartyId || null
    if (!partyId) {
      const vehicle = await VehicleRegistration.findOne({
        registrationNumber: vehicleNumber.toUpperCase().trim(),
        userId: req.user.id
      }).select('partyId')
      if (vehicle && vehicle.partyId) {
        partyId = vehicle.partyId
      }
    }

    // Mark any existing non-renewed fitness records for this vehicle as expired and renewed
    await Fitness.updateMany(
      {
        vehicleNumber: vehicleNumber.toUpperCase().trim(),
        userId: req.user.id,
        isRenewed: false
      },
      {
        $set: {
          status: 'expired',
          isRenewed: true
        }
      }
    )

    const uploadedDocument = saveFitnessDocument({
      imageBase64: fitnessDocumentBase64,
      vehicleNumber,
      userId: req.user.id,
      originalName: fitnessDocumentName
    })

    // Create new fitness record
    const fitness = new Fitness({
      ownerName,
      vehicleNumber,
      mobileNumber,
      date,
      validFrom,
      validTo,
      totalFee,
      paid,
      balance,
      feeBreakup,
      status,
      userId: req.user.id,
      partyId,
      fitnessDocument: uploadedDocument?.relativePath || '',
      fitnessDocumentType: uploadedDocument?.mimeType || '',
      fitnessDocumentName: uploadedDocument?.originalName || ''
    })

    await fitness.save()

    // Trigger WhatsApp expiry check immediately after creation
    try { checkUserAndQueueAlerts(req.user.id) } catch (e) { console.error('[WhatsApp] Trigger error (fitness create):', e) }

    res.status(201).json({
      success: true,
      message: 'Fitness record created successfully',
      data: fitness
    })
  } catch (error) {
    console.error('Error creating fitness record:', error)
    res.status(500).json({
      success: false,
      message: 'Error creating fitness record',
      error: error.message
    })
  }
}

// Update fitness record
exports.updateFitness = async (req, res) => {
  try {
    const {
      ownerName,
      vehicleNumber,
      mobileNumber,
      date,
      validFrom,
      validTo,
      totalFee,
      paid,
      balance,
      feeBreakup,
      partyId,
      fitnessDocumentBase64,
      fitnessDocumentName
    } = req.body

    const fitness = await Fitness.findOne({ _id: req.params.id, userId: req.user.id })

    if (!fitness) {
      return res.status(404).json({
        success: false,
        message: 'Fitness record not found'
      })
    }

    // Prepare updated values for validation
    const updatedTotalFee = totalFee !== undefined ? totalFee : fitness.totalFee
    const updatedPaid = paid !== undefined ? paid : fitness.paid
    const updatedBalance = balance !== undefined ? balance : fitness.balance

    // Validate that paid amount can't be greater than total amount
    if (Number(updatedPaid) > Number(updatedTotalFee)) {
      return res.status(400).json({
        success: false,
        message: 'Paid amount cannot be greater than total fee'
      })
    }

    // Validate that balance amount can't be negative
    if (Number(updatedBalance) < 0) {
      return res.status(400).json({
        success: false,
        message: 'Balance amount cannot be negative'
      })
    }

    // Update fields
    if (ownerName) fitness.ownerName = ownerName
    if (vehicleNumber) fitness.vehicleNumber = vehicleNumber
    if (mobileNumber !== undefined) fitness.mobileNumber = mobileNumber
    if (date !== undefined) fitness.date = date
    if (validFrom) fitness.validFrom = validFrom
    if (validTo) {
        fitness.validTo = validTo
        // Recalculate status if validTo is updated
        fitness.status = getFitnessStatus(validTo);
    }
    if (totalFee !== undefined) fitness.totalFee = totalFee
    if (paid !== undefined) fitness.paid = paid
    if (balance !== undefined) fitness.balance = balance
    if (feeBreakup !== undefined) fitness.feeBreakup = feeBreakup
    if (partyId !== undefined) fitness.partyId = partyId
    if (fitnessDocumentBase64) {
      deleteFitnessDocument(fitness.fitnessDocument)
      const uploadedDocument = saveFitnessDocument({
        imageBase64: fitnessDocumentBase64,
        vehicleNumber: vehicleNumber || fitness.vehicleNumber,
        userId: req.user.id,
        originalName: fitnessDocumentName
      })
      fitness.fitnessDocument = uploadedDocument?.relativePath || ''
      fitness.fitnessDocumentType = uploadedDocument?.mimeType || ''
      fitness.fitnessDocumentName = uploadedDocument?.originalName || ''
    }

    await fitness.save()

    // Trigger WhatsApp expiry check immediately after update
    try { checkUserAndQueueAlerts(req.user.id) } catch (e) { console.error('[WhatsApp] Trigger error (fitness update):', e) }

    res.json({
      success: true,
      message: 'Fitness record updated successfully',
      data: fitness
    })
  } catch (error) {
    console.error('Error updating fitness record:', error)
    res.status(500).json({
      success: false,
      message: 'Error updating fitness record',
      error: error.message
    })
  }
}

// Delete fitness record
exports.deleteFitness = async (req, res) => {
  try {
    const fitness = await Fitness.findOne({ _id: req.params.id, userId: req.user.id })

    if (!fitness) {
      return res.status(404).json({
        success: false,
        message: 'Fitness record not found'
      })
    }

    deleteFitnessDocument(fitness.fitnessDocument)
    await fitness.deleteOne()

    res.json({
      success: true,
      message: 'Fitness record deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting fitness record:', error)
    res.status(500).json({
      success: false,
      message: 'Error deleting fitness record',
      error: error.message
    })
  }
}

// Get fitness statistics
exports.getFitnessStatistics = async (req, res) => {
  try {
    // Count permits by status (now using the indexed status field)
    const activeFitness = await Fitness.countDocuments({ status: 'active', userId: req.user.id })

    // For expiring soon and expired, exclude vehicles that also have active fitness (renewed vehicles)
    const vehiclesWithActiveFitness = await Fitness.find({ status: 'active', userId: req.user.id })
      .distinct('vehicleNumber')

    const expiringSoonFitness = await Fitness.countDocuments({
      status: 'expiring_soon',
      vehicleNumber: { $nin: vehiclesWithActiveFitness },
      userId: req.user.id
    })

    const expiredFitness = await Fitness.countDocuments({
      status: 'expired',
      vehicleNumber: { $nin: vehiclesWithActiveFitness },
      userId: req.user.id
    })

    const total = await Fitness.countDocuments({ userId: req.user.id })

    // Pending payment aggregation
    const pendingPaymentPipeline = [
      { $match: { balance: { $gt: 0 }, userId: new mongoose.Types.ObjectId(req.user.id) } },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          totalAmount: { $sum: '$balance' }
        }
      }
    ]

    const pendingPaymentResults = await Fitness.aggregate(pendingPaymentPipeline)
    const pendingPaymentCount = pendingPaymentResults.length > 0 ? pendingPaymentResults[0].count : 0
    const pendingPaymentAmount = pendingPaymentResults.length > 0 ? pendingPaymentResults[0].totalAmount : 0

    res.json({
      success: true,
      data: {
        total,
        active: activeFitness,
        expired: expiredFitness,
        expiringSoon: expiringSoonFitness,
        pendingPaymentCount,
        pendingPaymentAmount
      }
    })
  } catch (error) {
    console.error('Error fetching fitness statistics:', error)
    res.status(500).json({
      success: false,
      message: 'Error fetching fitness statistics',
      error: error.message
    })
  }
}


// Mark fitness as paid
exports.markAsPaid = async (req, res) => {
  try {
    const fitness = await Fitness.findOne({ _id: req.params.id, userId: req.user.id })

    if (!fitness) {
      return res.status(404).json({
        success: false,
        message: 'Fitness record not found'
      })
    }

    // Check if there's a balance to pay
    if (!fitness.balance || fitness.balance === 0) {
      return res.status(400).json({
        success: false,
        message: 'No pending payment for this fitness record'
      })
    }

    // Update payment details
    fitness.paid = fitness.totalFee || 0
    fitness.balance = 0

    await fitness.save()

    res.status(200).json({
      success: true,
      message: 'Payment marked as paid successfully',
      data: fitness
    })
  } catch (error) {
    console.error('Error marking payment as paid:', error)
    res.status(500).json({
      success: false,
      message: 'Error marking payment as paid',
      error: error.message
    })
  }
};

// Increment WhatsApp message count
exports.incrementWhatsAppCount = async (req, res) => {
  try {
    const fitness = await Fitness.findOne({ _id: req.params.id, userId: req.user.id })

    if (!fitness) {
      return res.status(404).json({
        success: false,
        message: 'Fitness record not found'
      })
    }

    // Increment the WhatsApp message count
    fitness.whatsappMessageCount = (fitness.whatsappMessageCount || 0) + 1
    fitness.lastWhatsappSentAt = new Date()

    await fitness.save()

    res.status(200).json({
      success: true,
      message: 'WhatsApp message count updated successfully',
      data: {
        whatsappMessageCount: fitness.whatsappMessageCount,
        lastWhatsappSentAt: fitness.lastWhatsappSentAt
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
