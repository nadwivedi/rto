const Puc = require('../models/Puc')
const VehicleRegistration = require('../models/VehicleRegistration')
const mongoose = require('mongoose')

// helper function to calculate status
const getPucStatus = (validTo) => {
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


// Get all PUC records
exports.getAllPuc = async (req, res) => {
  try {
    const { search, page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = req.query

    const query = { userId: req.user.id }

    if (search) {
      query.vehicleNumber = { $regex: search, $options: 'i' }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit)

    const sortOptions = {}
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1

    const pucRecords = await Puc.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))

    const total = await Puc.countDocuments(query)

    res.json({
      success: true,
      data: pucRecords,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalRecords: total,
        hasMore: skip + pucRecords.length < total
      }
    })
  } catch (error) {
    console.error('Error fetching PUC records:', error)
    res.status(500).json({
      success: false,
      message: 'Error fetching PUC records',
      error: error.message
    })
  }
}

// Export all PUC records without pagination
exports.exportAllPuc = async (req, res) => {
  try {
    const { status, search } = req.query
    const query = { userId: req.user.id }

    if (status && status !== 'all') {
      query.status = status
    }

    if (search) {
      query.$or = [
        { vehicleNumber: { $regex: search, $options: 'i' } },
        { ownerName: { $regex: search, $options: 'i' } },
        { mobileNumber: { $regex: search, $options: 'i' } }
      ]
    }

    const pucRecords = await Puc.find(query)
      .sort({ createdAt: -1 })

    res.json({
      success: true,
      data: pucRecords,
      total: pucRecords.length
    })
  } catch (error) {
    console.error('Error exporting PUC records:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to export PUC records',
      error: error.message
    })
  }
}

// Get expiring soon PUC records
exports.getExpiringSoonPuc = async (req, res) => {
  try {

    const { search, page = 1, limit = 20, sortBy = 'validTo', sortOrder = 'asc' } = req.query

    // Find all vehicle numbers that have both expiring_soon and active PUC
    // These vehicles have been renewed and should be excluded
    const vehiclesWithActivePuc = await Puc.find({ status: 'active', userId: req.user.id })
      .distinct('vehicleNumber')

    const query = {
      status: 'expiring_soon',
      vehicleNumber: { $nin: vehiclesWithActivePuc },
      userId: req.user.id
    }

    if (search) {
      // Update the vehicleNumber condition to work with search
      query.$and = [
        { vehicleNumber: { $nin: vehiclesWithActivePuc } },
        { vehicleNumber: { $regex: search, $options: 'i' } }
      ]
      delete query.vehicleNumber
    }

    const skip = (parseInt(page) - 1) * parseInt(limit)

    const sortOptions = {}
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1

    const pucRecords = await Puc.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))

    const total = await Puc.countDocuments(query)

    res.json({
      success: true,
      data: pucRecords,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalRecords: total,
        hasMore: skip + pucRecords.length < total
      }
    })
  } catch (error) {
    console.error('Error fetching expiring soon PUC records:', error)
    res.status(500).json({
      success: false,
      message: 'Error fetching expiring soon PUC records',
      error: error.message
    })
  }
}

// Get expired PUC records
exports.getExpiredPuc = async (req, res) => {
  try {
    const { search, page = 1, limit = 20, sortBy = 'validTo', sortOrder = 'desc' } = req.query

    // Find all vehicle numbers that have active PUC
    // These vehicles have been renewed and should be excluded
    const vehiclesWithActivePuc = await Puc.find({ status: 'active', userId: req.user.id })
      .distinct('vehicleNumber')

    const query = {
      status: 'expired',
      vehicleNumber: { $nin: vehiclesWithActivePuc },
      userId: req.user.id
    }

    if (search) {
      // Update the vehicleNumber condition to work with search
      query.$and = [
        { vehicleNumber: { $nin: vehiclesWithActivePuc } },
        { vehicleNumber: { $regex: search, $options: 'i' } }
      ]
      delete query.vehicleNumber
    }

    const skip = (parseInt(page) - 1) * parseInt(limit)

    const sortOptions = {}
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1

    const pucRecords = await Puc.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))

    const total = await Puc.countDocuments(query)

    res.json({
      success: true,
      data: pucRecords,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalRecords: total,
        hasMore: skip + pucRecords.length < total
      }
    })
  } catch (error) {
    console.error('Error fetching expired PUC records:', error)
    res.status(500).json({
      success: false,
      message: 'Error fetching expired PUC records',
      error: error.message
    })
  }
}

// Get active PUC records
exports.getActivePuc = async (req, res) => {
  try {
    const { search, page = 1, limit = 20, sortBy = 'validTo', sortOrder = 'asc' } = req.query

    const query = { status: 'active', userId: req.user.id }

    if (search) {
      query.vehicleNumber = { $regex: search, $options: 'i' }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit)

    const sortOptions = {}
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1

    const pucRecords = await Puc.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))

    const total = await Puc.countDocuments(query)

    res.json({
      success: true,
      data: pucRecords,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalRecords: total,
        hasMore: skip + pucRecords.length < total
      }
    })
  } catch (error) {
    console.error('Error fetching active PUC records:', error)
    res.status(500).json({
      success: false,
      message: 'Error fetching active PUC records',
      error: error.message
    })
  }
}

// Get pending PUC records
exports.getPendingPuc = async (req, res) => {
  try {
    const { search, page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = req.query

    const query = { balance: { $gt: 0 }, userId: req.user.id }

    if (search) {
      query.vehicleNumber = { $regex: search, $options: 'i' }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit)

    const sortOptions = {}
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1

    const pucRecords = await Puc.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))

    const total = await Puc.countDocuments(query)

    res.json({
      success: true,
      data: pucRecords,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalRecords: total,
        hasMore: skip + pucRecords.length < total
      }
    })
  } catch (error) {
    console.error('Error fetching pending PUC records:', error)
    res.status(500).json({
      success: false,
      message: 'Error fetching pending PUC records',
      error: error.message
    })
  }
}


// Get single PUC record by ID
exports.getPucById = async (req, res) => {
  try {
    const puc = await Puc.findOne({ _id: req.params.id, userId: req.user.id })

    if (!puc) {
      return res.status(404).json({
        success: false,
        message: 'PUC record not found'
      })
    }

    res.json({
      success: true,
      data: puc
    })
  } catch (error) {
    console.error('Error fetching PUC record:', error)
    res.status(500).json({
      success: false,
      message: 'Error fetching PUC record',
      error: error.message
    })
  }
}

// Create new PUC record
exports.createPuc = async (req, res) => {
  try {
    const { vehicleNumber, ownerName, mobileNumber, date, vehicleModel, validFrom, validTo, totalFee, paid, balance, partyId: reqPartyId } = req.body

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
    const status = getPucStatus(validTo);

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

    // Mark any existing non-renewed PUC records for this vehicle as expired and renewed
    await Puc.updateMany(
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

    // Create new PUC record
    const puc = new Puc({
      vehicleNumber,
      ownerName,
      mobileNumber,
      date,
      vehicleModel,
      validFrom,
      validTo,
      totalFee,
      paid,
      balance,
      status,
      userId: req.user.id,
      partyId
    })

    await puc.save()

    res.status(201).json({
      success: true,
      message: 'PUC record created successfully',
      data: puc
    })
  } catch (error) {
    console.error('Error creating PUC record:', error)
    res.status(500).json({
      success: false,
      message: 'Error creating PUC record',
      error: error.message
    })
  }
}

// Update PUC record
exports.updatePuc = async (req, res) => {
  try {
    const { vehicleNumber, ownerName, mobileNumber, date, vehicleModel, validFrom, validTo, totalFee, paid, balance, partyId } = req.body

    const puc = await Puc.findOne({ _id: req.params.id, userId: req.user.id })

    if (!puc) {
      return res.status(404).json({
        success: false,
        message: 'PUC record not found'
      })
    }

    // Prepare updated values for validation
    const updatedTotalFee = totalFee !== undefined ? totalFee : puc.totalFee
    const updatedPaid = paid !== undefined ? paid : puc.paid
    const updatedBalance = balance !== undefined ? balance : puc.balance

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
    if (vehicleNumber) puc.vehicleNumber = vehicleNumber
    if (ownerName !== undefined) puc.ownerName = ownerName
    if (mobileNumber !== undefined) puc.mobileNumber = mobileNumber
    if (date !== undefined) puc.date = date
    if (vehicleModel !== undefined) puc.vehicleModel = vehicleModel
    if (validFrom) puc.validFrom = validFrom
    if (validTo) {
        puc.validTo = validTo
        // Recalculate status if validTo is updated
        puc.status = getPucStatus(validTo);
    }
    if (totalFee !== undefined) puc.totalFee = totalFee
    if (paid !== undefined) puc.paid = paid
    if (balance !== undefined) puc.balance = balance
    if (partyId !== undefined) puc.partyId = partyId

    await puc.save()

    res.json({
      success: true,
      message: 'PUC record updated successfully',
      data: puc
    })
  } catch (error) {
    console.error('Error updating PUC record:', error)
    res.status(500).json({
      success: false,
      message: 'Error updating PUC record',
      error: error.message
    })
  }
}

// Delete PUC record
exports.deletePuc = async (req, res) => {
  try {
    const puc = await Puc.findOne({ _id: req.params.id, userId: req.user.id })

    if (!puc) {
      return res.status(404).json({
        success: false,
        message: 'PUC record not found'
      })
    }

    await puc.deleteOne()

    res.json({
      success: true,
      message: 'PUC record deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting PUC record:', error)
    res.status(500).json({
      success: false,
      message: 'Error deleting PUC record',
      error: error.message
    })
  }
}

// Get PUC statistics
exports.getPucStatistics = async (req, res) => {
  try {
    // Count permits by status (now using the indexed status field)
    const activePuc = await Puc.countDocuments({ status: 'active', userId: req.user.id })

    // For expiring soon and expired, exclude vehicles that also have active PUC (renewed vehicles)
    const vehiclesWithActivePuc = await Puc.find({ status: 'active', userId: req.user.id })
      .distinct('vehicleNumber')

    const expiringSoonPuc = await Puc.countDocuments({
      status: 'expiring_soon',
      vehicleNumber: { $nin: vehiclesWithActivePuc },
      userId: req.user.id
    })

    const expiredPuc = await Puc.countDocuments({
      status: 'expired',
      vehicleNumber: { $nin: vehiclesWithActivePuc },
      userId: req.user.id
    })

    const total = await Puc.countDocuments({ userId: req.user.id })

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

    const pendingPaymentResults = await Puc.aggregate(pendingPaymentPipeline)
    const pendingPaymentCount = pendingPaymentResults.length > 0 ? pendingPaymentResults[0].count : 0
    const pendingPaymentAmount = pendingPaymentResults.length > 0 ? pendingPaymentResults[0].totalAmount : 0

    res.json({
      success: true,
      data: {
        total,
        active: activePuc,
        expired: expiredPuc,
        expiringSoon: expiringSoonPuc,
        pendingPaymentCount,
        pendingPaymentAmount
      }
    })
  } catch (error) {
    console.error('Error fetching PUC statistics:', error)
    res.status(500).json({
      success: false,
      message: 'Error fetching PUC statistics',
      error: error.message
    })
  }
}


// Mark PUC as paid
exports.markAsPaid = async (req, res) => {
  try {
    const puc = await Puc.findOne({ _id: req.params.id, userId: req.user.id })

    if (!puc) {
      return res.status(404).json({
        success: false,
        message: 'PUC record not found'
      })
    }

    // Check if there's a balance to pay
    if (!puc.balance || puc.balance === 0) {
      return res.status(400).json({
        success: false,
        message: 'No pending payment for this PUC record'
      })
    }

    // Update payment details
    puc.paid = puc.totalFee || 0
    puc.balance = 0

    await puc.save()

    res.status(200).json({
      success: true,
      message: 'Payment marked as paid successfully',
      data: puc
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
    const puc = await Puc.findOne({ _id: req.params.id, userId: req.user.id })

    if (!puc) {
      return res.status(404).json({
        success: false,
        message: 'PUC record not found'
      })
    }

    // Increment the WhatsApp message count
    puc.whatsappMessageCount = (puc.whatsappMessageCount || 0) + 1
    puc.lastWhatsappSentAt = new Date()

    await puc.save()

    res.status(200).json({
      success: true,
      message: 'WhatsApp message count updated successfully',
      data: {
        whatsappMessageCount: puc.whatsappMessageCount,
        lastWhatsappSentAt: puc.lastWhatsappSentAt
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

// Bulk import PUC records
exports.bulkImportPuc = async (req, res) => {
  try {
    const { records } = req.body

    if (!records || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No records provided for import'
      })
    }

    let successCount = 0
    let failedCount = 0
    const errors = []

    for (const [index, record] of records.entries()) {
      try {
        const { vehicleNumber, ownerName, mobileNumber, vehicleModel, validFrom, validTo } = record

        if (!vehicleNumber || !validFrom || !validTo) {
          throw new Error('Vehicle Number, Valid From, and Valid To are required fields')
        }

        // We set totalFee, paid, balance to 0 as requested
        const totalFee = 0
        const paid = 0
        const balance = 0

        // Calculate status
        const status = getPucStatus(validTo)

        // Find partyId if possible
        let partyId = null
        const vehicle = await VehicleRegistration.findOne({
          registrationNumber: vehicleNumber.toUpperCase().trim(),
          userId: req.user.id
        }).select('partyId')
        
        if (vehicle && vehicle.partyId) {
          partyId = vehicle.partyId
        }

        // Mark any existing non-renewed PUC records for this vehicle as expired and renewed
        await Puc.updateMany(
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

        // Create new PUC record
        const puc = new Puc({
          vehicleNumber: vehicleNumber.toUpperCase().trim(),
          ownerName: ownerName || '',
          mobileNumber: mobileNumber || '',
          vehicleModel: vehicleModel || '',
          validFrom,
          validTo,
          totalFee,
          paid,
          balance,
          status,
          userId: req.user.id,
          partyId
        })

        await puc.save()
        successCount++
      } catch (err) {
        failedCount++
        errors.push({ index, vehicleNumber: record.vehicleNumber, error: err.message })
      }
    }

    res.status(200).json({
      success: true,
      message: `Bulk import completed. Successfully imported ${successCount} records.`,
      data: {
        success: successCount,
        failed: failedCount,
        errors
      }
    })
  } catch (error) {
    console.error('Error during bulk import:', error)
    res.status(500).json({
      success: false,
      message: 'Server error during bulk import',
      error: error.message
    })
  }
}
