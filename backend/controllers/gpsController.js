const Gps = require('../models/Gps')
const VehicleRegistration = require('../models/VehicleRegistration')
const mongoose = require('mongoose')
const fs = require('fs')
const path = require('path')

const gpsUploadsDir = path.join(__dirname, '..', 'uploads', 'gps-documents')
if (!fs.existsSync(gpsUploadsDir)) {
  fs.mkdirSync(gpsUploadsDir, { recursive: true })
}

const saveGpsDocument = (imageData, vehicleNumber) => {
  if (!imageData || !vehicleNumber) return ''

  const imageFormatRegex = /^data:image\/(jpeg|jpg|png|webp);base64,/
  const pdfFormatRegex = /^data:application\/pdf;base64,/

  let fileExtension = null

  const imageMatch = imageData.match(imageFormatRegex)
  const pdfMatch = imageData.match(pdfFormatRegex)

  if (imageMatch) {
    fileExtension = imageMatch[1] === 'jpeg' ? 'jpg' : imageMatch[1]
  } else if (pdfMatch) {
    fileExtension = 'pdf'
  } else {
    throw new Error('Only JPG, JPEG, PNG, WebP, and PDF formats are accepted')
  }

  const base64Data = imageData.replace(/^data:(image\/[a-z]+|application\/pdf);base64,/, '')
  const buffer = Buffer.from(base64Data, 'base64')

  const fileSizeInMB = buffer.length / (1024 * 1024)
  if (fileSizeInMB > 12) {
    throw new Error(`File size (${fileSizeInMB.toFixed(2)}MB) exceeds the 12MB limit`)
  }

  const sanitizedVehicleNumber = vehicleNumber.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
  const filename = `gps-${sanitizedVehicleNumber}.${fileExtension}`
  const filePath = path.join(gpsUploadsDir, filename)

  fs.writeFileSync(filePath, buffer)

  return `/uploads/gps-documents/${filename}`
}

const deleteGpsDocument = (documentPath) => {
  if (!documentPath) return

  try {
    const filename = path.basename(documentPath)
    const filePath = path.join(gpsUploadsDir, filename)
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }
  } catch (err) {
    console.error('Error deleting GPS document:', err)
  }
}

// helper function to calculate status
const getGpsStatus = (validTo) => {
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


// Get all GPS records
exports.getAllGps = async (req, res) => {
  try {
    const { search, page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = req.query

    const query = { userId: req.user.id }

    if (search) {
      query.vehicleNumber = { $regex: search, $options: 'i' }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit)

    const sortOptions = {}
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1

    const gpsRecords = await Gps.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))

    const total = await Gps.countDocuments(query)

    res.json({
      success: true,
      data: gpsRecords,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalRecords: total,
        hasMore: skip + gpsRecords.length < total
      }
    })
  } catch (error) {
    console.error('Error fetching GPS records:', error)
    res.status(500).json({
      success: false,
      message: 'Error fetching GPS records',
      error: error.message
    })
  }
}

// Export all GPS records without pagination
exports.exportAllGps = async (req, res) => {
  try {
    const gpsRecords = await Gps.find({ userId: req.user.id })
      .sort({ createdAt: -1 })

    res.json({
      success: true,
      data: gpsRecords,
      total: gpsRecords.length
    })
  } catch (error) {
    console.error('Error exporting GPS records:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to export GPS records',
      error: error.message
    })
  }
}

// Get expiring soon GPS records
exports.getExpiringSoonGps = async (req, res) => {
  try {

    const { search, page = 1, limit = 20, sortBy = 'validTo', sortOrder = 'asc' } = req.query

    const query = { userId: req.user.id }

    if (search) {
      query.vehicleNumber = { $regex: search, $options: 'i' }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit)

    const sortOptions = {}
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1

    const gpsRecords = await Gps.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))

    // Filter records where status is expiring_soon
    const expiringSoonRecords = gpsRecords.filter(record => {
      const status = getGpsStatus(record.validTo)
      return status === 'expiring_soon'
    })

    // Count total expiring soon records for pagination
    const allRecords = await Gps.find(query)
    const totalExpiringSoon = allRecords.filter(record => {
      const status = getGpsStatus(record.validTo)
      return status === 'expiring_soon'
    }).length

    res.json({
      success: true,
      data: expiringSoonRecords,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalExpiringSoon / parseInt(limit)),
        totalRecords: totalExpiringSoon,
        hasMore: skip + expiringSoonRecords.length < totalExpiringSoon
      }
    })
  } catch (error) {
    console.error('Error fetching expiring soon GPS records:', error)
    res.status(500).json({
      success: false,
      message: 'Error fetching expiring soon GPS records',
      error: error.message
    })
  }
}

// Get expired GPS records
exports.getExpiredGps = async (req, res) => {
  try {
    const { search, page = 1, limit = 20, sortBy = 'validTo', sortOrder = 'desc' } = req.query

    const query = { userId: req.user.id }

    if (search) {
      query.vehicleNumber = { $regex: search, $options: 'i' }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit)

    const sortOptions = {}
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1

    const gpsRecords = await Gps.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))

    // Filter records where status is expired
    const expiredRecords = gpsRecords.filter(record => {
      const status = getGpsStatus(record.validTo)
      return status === 'expired'
    })

    // Count total expired records for pagination
    const allRecords = await Gps.find(query)
    const totalExpired = allRecords.filter(record => {
      const status = getGpsStatus(record.validTo)
      return status === 'expired'
    }).length

    res.json({
      success: true,
      data: expiredRecords,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalExpired / parseInt(limit)),
        totalRecords: totalExpired,
        hasMore: skip + expiredRecords.length < totalExpired
      }
    })
  } catch (error) {
    console.error('Error fetching expired GPS records:', error)
    res.status(500).json({
      success: false,
      message: 'Error fetching expired GPS records',
      error: error.message
    })
  }
}

// Get GPS records with pending payment
exports.getPendingPaymentGps = async (req, res) => {
  try {
    const { search, page = 1, limit = 20, sortBy = 'balance', sortOrder = 'desc' } = req.query

    const query = {
      userId: req.user.id,
      balance: { $gt: 0 }
    }

    if (search) {
      query.vehicleNumber = { $regex: search, $options: 'i' }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit)

    const sortOptions = {}
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1

    const gpsRecords = await Gps.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))

    const total = await Gps.countDocuments(query)

    res.json({
      success: true,
      data: gpsRecords,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalRecords: total,
        hasMore: skip + gpsRecords.length < total
      }
    })
  } catch (error) {
    console.error('Error fetching pending payment GPS records:', error)
    res.status(500).json({
      success: false,
      message: 'Error fetching pending payment GPS records',
      error: error.message
    })
  }
}

// Get GPS statistics
exports.getGpsStatistics = async (req, res) => {
  try {
    const gpsRecords = await Gps.find({ userId: req.user.id })

    const statistics = {
      total: gpsRecords.length,
      expiringSoon: 0,
      expired: 0,
      pendingPaymentCount: 0,
      pendingPaymentAmount: 0
    }

    gpsRecords.forEach(record => {
      const status = getGpsStatus(record.validTo)

      if (status === 'expiring_soon') {
        statistics.expiringSoon++
      } else if (status === 'expired') {
        statistics.expired++
      }

      if (record.balance > 0) {
        statistics.pendingPaymentCount++
        statistics.pendingPaymentAmount += record.balance
      }
    })

    res.json({
      success: true,
      data: statistics
    })
  } catch (error) {
    console.error('Error fetching GPS statistics:', error)
    res.status(500).json({
      success: false,
      message: 'Error fetching GPS statistics',
      error: error.message
    })
  }
}


// Get single GPS record by ID
exports.getGpsById = async (req, res) => {
  try {
    const gps = await Gps.findOne({ _id: req.params.id, userId: req.user.id })

    if (!gps) {
      return res.status(404).json({
        success: false,
        message: 'GPS record not found'
      })
    }

    res.json({
      success: true,
      data: gps
    })
  } catch (error) {
    console.error('Error fetching GPS record:', error)
    res.status(500).json({
      success: false,
      message: 'Error fetching GPS record',
      error: error.message
    })
  }
}

// Create new GPS record
exports.createGps = async (req, res) => {
  try {
    const { vehicleNumber, ownerName, mobileNumber, date, validFrom, validTo, totalFee, paid, balance, partyId: reqPartyId, gpsDocumentData } = req.body

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
    const status = getGpsStatus(validTo);
    const normalizedVehicleNumber = vehicleNumber.toUpperCase().trim()

    // Use partyId from request body if provided, otherwise auto-fetch from vehicle registration
    let partyId = reqPartyId || null
    if (!partyId) {
      const vehicle = await VehicleRegistration.findOne({
        registrationNumber: normalizedVehicleNumber,
        userId: req.user.id
      }).select('partyId')
      if (vehicle && vehicle.partyId) {
        partyId = vehicle.partyId
      }
    }

    // Mark any existing non-renewed GPS records for this vehicle as expired and renewed
    await Gps.updateMany(
      {
        vehicleNumber: normalizedVehicleNumber,
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

    const gpsDocument = gpsDocumentData ? saveGpsDocument(gpsDocumentData, normalizedVehicleNumber) : ''

    // Create new GPS record
    const gps = new Gps({
      vehicleNumber: normalizedVehicleNumber,
      ownerName,
      mobileNumber,
      date,
      gpsDocument,
      validFrom,
      validTo,
      totalFee,
      paid,
      balance,
      status,
      userId: req.user.id,
      partyId
    })

    await gps.save()

    res.status(201).json({
      success: true,
      message: 'GPS record created successfully',
      data: gps
    })
  } catch (error) {
    console.error('Error creating GPS record:', error)
    res.status(500).json({
      success: false,
      message: 'Error creating GPS record',
      error: error.message
    })
  }
}

// Update GPS record
exports.updateGps = async (req, res) => {
  try {
    const { vehicleNumber, ownerName, mobileNumber, date, validFrom, validTo, totalFee, paid, balance, partyId, gpsDocumentData } = req.body

    const gps = await Gps.findOne({ _id: req.params.id, userId: req.user.id })

    if (!gps) {
      return res.status(404).json({
        success: false,
        message: 'GPS record not found'
      })
    }

    // Prepare updated values for validation
    const updatedTotalFee = totalFee !== undefined ? totalFee : gps.totalFee
    const updatedPaid = paid !== undefined ? paid : gps.paid
    const updatedBalance = balance !== undefined ? balance : gps.balance

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
    if (vehicleNumber) gps.vehicleNumber = vehicleNumber
    if (ownerName !== undefined) gps.ownerName = ownerName
    if (mobileNumber !== undefined) gps.mobileNumber = mobileNumber
    if (date !== undefined) gps.date = date
    if (gpsDocumentData) {
      deleteGpsDocument(gps.gpsDocument)
      gps.gpsDocument = saveGpsDocument(gpsDocumentData, vehicleNumber || gps.vehicleNumber)
    }
    if (validFrom) gps.validFrom = validFrom
    if (validTo) {
        gps.validTo = validTo
        // Recalculate status if validTo is updated
        gps.status = getGpsStatus(validTo);
    }
    if (totalFee !== undefined) gps.totalFee = totalFee
    if (paid !== undefined) gps.paid = paid
    if (balance !== undefined) gps.balance = balance
    if (partyId !== undefined) gps.partyId = partyId

    await gps.save()

    res.json({
      success: true,
      message: 'GPS record updated successfully',
      data: gps
    })
  } catch (error) {
    console.error('Error updating GPS record:', error)
    res.status(500).json({
      success: false,
      message: 'Error updating GPS record',
      error: error.message
    })
  }
}

// Delete GPS record
exports.deleteGps = async (req, res) => {
  try {
    const gps = await Gps.findOne({ _id: req.params.id, userId: req.user.id })

    if (!gps) {
      return res.status(404).json({
        success: false,
        message: 'GPS record not found'
      })
    }

    deleteGpsDocument(gps.gpsDocument)

    await Gps.deleteOne({ _id: req.params.id })

    res.json({
      success: true,
      message: 'GPS record deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting GPS record:', error)
    res.status(500).json({
      success: false,
      message: 'Error deleting GPS record',
      error: error.message
    })
  }
}


// Mark GPS as paid
exports.markAsPaid = async (req, res) => {
  try {
    const gps = await Gps.findOne({ _id: req.params.id, userId: req.user.id })

    if (!gps) {
      return res.status(404).json({
        success: false,
        message: 'GPS record not found'
      })
    }

    gps.paid = gps.totalFee
    gps.balance = 0

    await gps.save()

    res.json({
      success: true,
      message: 'GPS record marked as paid successfully',
      data: gps
    })
  } catch (error) {
    console.error('Error marking GPS as paid:', error)
    res.status(500).json({
      success: false,
      message: 'Error marking GPS as paid',
      error: error.message
    })
  }
}
