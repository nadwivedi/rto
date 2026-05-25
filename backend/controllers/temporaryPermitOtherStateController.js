const TemporaryPermitOtherState = require('../models/TemporaryPermitOtherState')
const VehicleRegistration = require('../models/VehicleRegistration')
const mongoose = require('mongoose')
const { logError, getUserFriendlyError, getSimplifiedTimestamp } = require('../utils/errorLogger')

// helper function to calculate status
const getTemporaryPermitOtherStateStatus = (validTo) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(today.getDate() + 7);
  sevenDaysFromNow.setHours(23, 59, 59, 999);

  // a little utility function to parse dates consistently
  const parseDate = (dateString) => {
      const parts = dateString.split(/[-/]/);
      // new Date(year, monthIndex, day)
      return new Date(parts[2], parts[1] - 1, parts[0]);
  };

  const validToDate = parseDate(validTo);

  if (validToDate < today) {
    return 'expired';
  } else if (validToDate <= sevenDaysFromNow) {
    return 'expiring_soon';
  } else {
    return 'active';
  }
};

// Create new temporary permit (other state)
exports.createPermit = async (req, res) => {
  try {
    const { permitNumber, permitHolder, vehicleNo, mobileNo, validFrom, validTo, totalFee, paid, balance, notes, partyId } = req.body

    // Validate required fields
    // permitNumber and permitHolder are now optional

    if (!vehicleNo) {
      return res.status(400).json({
        success: false,
        message: 'Vehicle number is required'
      })
    }

    if (!mobileNo) {
      return res.status(400).json({
        success: false,
        message: 'Mobile number is required'
      })
    }

    if (!validFrom || !validTo) {
      return res.status(400).json({
        success: false,
        message: 'Valid from and valid to dates are required'
      })
    }

    if (totalFee === undefined || totalFee === null || paid === undefined || paid === null || balance === undefined || balance === null) {
      return res.status(400).json({
        success: false,
        message: 'Total fee, paid amount, and balance are required'
      })
    }

    // Validate that paid amount can't be greater than total fee
    if (paid > totalFee) {
      return res.status(400).json({
        success: false,
        message: 'Paid amount cannot be greater than total fee'
      })
    }

    // Validate that balance amount can't be negative
    if (balance < 0) {
      return res.status(400).json({
        success: false,
        message: 'Balance amount cannot be negative'
      })
    }

    // Calculate status
    const status = getTemporaryPermitOtherStateStatus(validTo);

    // Get partyId - use provided or fetch from VehicleRegistration
    let finalPartyId = partyId
    if (!finalPartyId && vehicleNo) {
      const vehicle = await VehicleRegistration.findOne({
        registrationNumber: vehicleNo.toUpperCase().trim(),
        userId: req.user.id
      })
      if (vehicle && vehicle.partyId) {
        finalPartyId = vehicle.partyId
      }
    }

    // Mark any existing non-renewed temporary permits (other state) for this vehicle as expired and renewed
    await TemporaryPermitOtherState.updateMany(
      {
        vehicleNo: vehicleNo.toUpperCase().trim(),
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

    // Create new temporary permit
    const permitData = {
      permitHolder,
      vehicleNo,
      mobileNo,
      validFrom,
      validTo,
      totalFee,
      paid,
      balance,
      partyId: finalPartyId || undefined,
      status,
      userId: req.user.id
    }

    // Add optional fields if provided
    if (permitNumber) permitData.permitNumber = permitNumber
    if (notes) permitData.notes = notes

    const newPermit = new TemporaryPermitOtherState(permitData)
    await newPermit.save()

    res.status(201).json({
      success: true,
      message: 'Temporary permit (other state) created successfully',
      data: newPermit
    })
  } catch (error) {
    console.error('Error creating temporary permit (other state):', error)
    logError(error, req)
    const userError = getUserFriendlyError(error)
    res.status(400).json({
      success: false,
      message: userError.message,
      errors: userError.details,
      errorCount: userError.errorCount,
      timestamp: getSimplifiedTimestamp()
    })
  }
}

// Get all temporary permits (other state)
exports.getAllPermits = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query

    let query = { userId: req.user.id }

    // Search filter
    if (search) {
      query.$or = [
        { permitNumber: { $regex: search, $options: 'i' } },
        { permitHolder: { $regex: search, $options: 'i' } },
        { vehicleNo: { $regex: search, $options: 'i' } },
        { mobileNo: { $regex: search, $options: 'i' } }
      ]
    }

    // Count total permits
    const totalPermits = await TemporaryPermitOtherState.countDocuments(query)

    // Get permits with pagination and sorting
    const sortField = sortBy || 'createdAt'
    const sortDirection = sortOrder === 'asc' ? 1 : -1

    const permits = await TemporaryPermitOtherState.find(query)
      .sort({ [sortField]: sortDirection })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))

    res.json({
      success: true,
      data: permits,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalPermits / parseInt(limit)),
        totalRecords: totalPermits,
        totalItems: totalPermits,
        itemsPerPage: parseInt(limit)
      }
    })
  } catch (error) {
    console.error('Error fetching temporary permits (other state):', error)
    logError(error, req)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch temporary permits (other state)',
      error: error.message
    })
  }
}

// Get expiring soon permits
exports.getExpiringSoonPermits = async (req, res) => {
  try {
    const { search, page = 1, limit = 20, sortBy = 'validTo', sortOrder = 'asc' } = req.query

    // Find all vehicle numbers that have active permits
    // These vehicles have been renewed and should be excluded
    const vehiclesWithActivePermits = await TemporaryPermitOtherState.find({ status: 'active', userId: req.user.id })
      .distinct('vehicleNo')

    const query = {
      userId: req.user.id,
      status: 'expiring_soon',
      vehicleNo: { $nin: vehiclesWithActivePermits }
    }

    if (search) {
      query.$and = [
        { userId: req.user.id },
        { vehicleNo: { $nin: vehiclesWithActivePermits } },
        {
          $or: [
            { permitNumber: { $regex: search, $options: 'i' } },
            { permitHolder: { $regex: search, $options: 'i' } },
            { vehicleNo: { $regex: search, $options: 'i' } },
            { mobileNo: { $regex: search, $options: 'i' } }
          ]
        }
      ]
      delete query.vehicleNo
      delete query.userId
    }

    const skip = (parseInt(page) - 1) * parseInt(limit)

    const sortOptions = {}
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1

    const permits = await TemporaryPermitOtherState.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))

    const total = await TemporaryPermitOtherState.countDocuments(query)

    res.json({
      success: true,
      data: permits,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalRecords: total,
        totalItems: total,
        itemsPerPage: parseInt(limit),
        hasMore: skip + permits.length < total
      }
    })
  } catch (error) {
    console.error('Error fetching expiring soon permits:', error)
    logError(error, req)
    res.status(500).json({
      success: false,
      message: 'Error fetching expiring soon permits',
      error: error.message
    })
  }
}

// Get expired permits
exports.getExpiredPermits = async (req, res) => {
  try {
    const { search, page = 1, limit = 20, sortBy = 'validTo', sortOrder = 'desc' } = req.query

    // Find all vehicle numbers that have active permits
    // These vehicles have been renewed and should be excluded
    const vehiclesWithActivePermits = await TemporaryPermitOtherState.find({ status: 'active', userId: req.user.id })
      .distinct('vehicleNo')

    const query = {
      userId: req.user.id,
      status: 'expired',
      vehicleNo: { $nin: vehiclesWithActivePermits }
    }

    if (search) {
      query.$and = [
        { userId: req.user.id },
        { vehicleNo: { $nin: vehiclesWithActivePermits } },
        {
          $or: [
            { permitNumber: { $regex: search, $options: 'i' } },
            { permitHolder: { $regex: search, $options: 'i' } },
            { vehicleNo: { $regex: search, $options: 'i' } },
            { mobileNo: { $regex: search, $options: 'i' } }
          ]
        }
      ]
      delete query.vehicleNo
      delete query.userId
    }

    const skip = (parseInt(page) - 1) * parseInt(limit)

    const sortOptions = {}
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1

    const permits = await TemporaryPermitOtherState.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))

    const total = await TemporaryPermitOtherState.countDocuments(query)

    res.json({
      success: true,
      data: permits,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalRecords: total,
        totalItems: total,
        itemsPerPage: parseInt(limit),
        hasMore: skip + permits.length < total
      }
    })
  } catch (error) {
    console.error('Error fetching expired permits:', error)
    logError(error, req)
    res.status(500).json({
      success: false,
      message: 'Error fetching expired permits',
      error: error.message
    })
  }
}

// Get pending payment permits
exports.getPendingPermits = async (req, res) => {
  try {
    const { search, page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = req.query

    const query = { userId: req.user.id, balance: { $gt: 0 } }

    if (search) {
      query.$or = [
        { permitNumber: { $regex: search, $options: 'i' } },
        { permitHolder: { $regex: search, $options: 'i' } },
        { vehicleNo: { $regex: search, $options: 'i' } },
        { mobileNo: { $regex: search, $options: 'i' } }
      ]
    }

    const skip = (parseInt(page) - 1) * parseInt(limit)

    const sortOptions = {}
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1

    const permits = await TemporaryPermitOtherState.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))

    const total = await TemporaryPermitOtherState.countDocuments(query)

    res.json({
      success: true,
      data: permits,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalRecords: total,
        totalItems: total,
        itemsPerPage: parseInt(limit),
        hasMore: skip + permits.length < total
      }
    })
  } catch (error) {
    console.error('Error fetching pending payment permits:', error)
    logError(error, req)
    res.status(500).json({
      success: false,
      message: 'Error fetching pending payment permits',
      error: error.message
    })
  }
}

// Get single permit by ID
exports.getPermitById = async (req, res) => {
  try {
    const permit = await TemporaryPermitOtherState.findOne({ _id: req.params.id, userId: req.user.id }).populate('bill')
    if (!permit) {
      return res.status(404).json({
        success: false,
        message: 'Temporary permit (other state) not found'
      })
    }
    res.json({ success: true, data: permit })
  } catch (error) {
    console.error('Error fetching temporary permit (other state):', error)
    logError(error, req)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch temporary permit (other state)',
      error: error.message
    })
  }
}

// Update permit
exports.updatePermit = async (req, res) => {
  try {
    const { id } = req.params
    const { permitNumber, permitHolder, vehicleNo, mobileNo, validFrom, validTo, totalFee, paid, balance, notes, partyId } = req.body

    const permit = await TemporaryPermitOtherState.findOne({ _id: id, userId: req.user.id })

    if (!permit) {
      return res.status(404).json({
        success: false,
        message: 'Temporary permit (other state) not found'
      })
    }

    // Prepare updated values for validation
    const updatedTotalFee = totalFee !== undefined ? totalFee : permit.totalFee
    const updatedPaid = paid !== undefined ? paid : permit.paid
    const updatedBalance = balance !== undefined ? balance : permit.balance

    // Validate that paid amount can't be greater than total fee
    if (updatedPaid > updatedTotalFee) {
      return res.status(400).json({
        success: false,
        message: 'Paid amount cannot be greater than total fee'
      })
    }

    // Validate that balance amount can't be negative
    if (updatedBalance < 0) {
      return res.status(400).json({
        success: false,
        message: 'Balance amount cannot be negative'
      })
    }

    // Update fields
    if (permitNumber !== undefined) permit.permitNumber = permitNumber
    if (permitHolder !== undefined) permit.permitHolder = permitHolder
    if (vehicleNo !== undefined) permit.vehicleNo = vehicleNo
    if (mobileNo !== undefined) permit.mobileNo = mobileNo
    if (validFrom !== undefined) permit.validFrom = validFrom
    if (validTo !== undefined) {
      permit.validTo = validTo
      // Recalculate status if validTo is updated
      permit.status = getTemporaryPermitOtherStateStatus(validTo)
    }
    if (totalFee !== undefined) permit.totalFee = totalFee
    if (paid !== undefined) permit.paid = paid
    if (balance !== undefined) permit.balance = balance
    if (notes !== undefined) permit.notes = notes
    if (partyId !== undefined) permit.partyId = partyId || null

    await permit.save()

    res.json({
      success: true,
      message: 'Temporary permit (other state) updated successfully',
      data: permit
    })
  } catch (error) {
    console.error('Error updating temporary permit (other state):', error)
    logError(error, req)
    const userError = getUserFriendlyError(error)
    res.status(400).json({
      success: false,
      message: userError.message,
      errors: userError.details,
      errorCount: userError.errorCount,
      timestamp: getSimplifiedTimestamp()
    })
  }
}

// Delete permit
exports.deletePermit = async (req, res) => {
  try {
    const deletedPermit = await TemporaryPermitOtherState.findOneAndDelete({ _id: req.params.id, userId: req.user.id })

    if (!deletedPermit) {
      return res.status(404).json({
        success: false,
        message: 'Temporary permit (other state) not found'
      })
    }

    res.json({
      success: true,
      message: 'Temporary permit (other state) deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting temporary permit (other state):', error)
    logError(error, req)
    res.status(500).json({
      success: false,
      message: 'Failed to delete temporary permit (other state)',
      error: error.message
    })
  }
}

// Get expiring soon count
exports.getExpiringSoonCount = async (req, res) => {
  try {
    const count = await TemporaryPermitOtherState.countDocuments({ status: 'expiring_soon', userId: req.user.id });
    res.json({ success: true, count });
  } catch (error) {
    console.error('Error getting expiring soon count:', error);
    logError(error, req);
    res.status(500).json({
      success: false,
      message: 'Failed to get expiring soon count',
      error: error.message,
    });
  }
};

// Get statistics
exports.getStatistics = async (req, res) => {
  try {
    // Count permits by status (now using the indexed status field)
    const activePermits = await TemporaryPermitOtherState.countDocuments({ status: 'active', userId: req.user.id });

    // For expiring soon and expired, exclude vehicles that also have active permits (renewed vehicles)
    const vehiclesWithActivePermits = await TemporaryPermitOtherState.find({ status: 'active', userId: req.user.id })
      .distinct('vehicleNo')

    const expiringPermits = await TemporaryPermitOtherState.countDocuments({
      userId: req.user.id,
      status: 'expiring_soon',
      vehicleNo: { $nin: vehiclesWithActivePermits }
    });

    const expiredPermits = await TemporaryPermitOtherState.countDocuments({
      userId: req.user.id,
      status: 'expired',
      vehicleNo: { $nin: vehiclesWithActivePermits }
    });

    const total = await TemporaryPermitOtherState.countDocuments({ userId: req.user.id });

    // Pending payment aggregation
    const pendingPaymentPipeline = [
      { $match: { userId: new mongoose.Types.ObjectId(req.user.id), balance: { $gt: 0 } } },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          totalAmount: { $sum: '$balance' },
        },
      },
    ];

    const pendingPaymentResults = await TemporaryPermitOtherState.aggregate(pendingPaymentPipeline);
    const pendingPaymentCount = pendingPaymentResults.length > 0 ? pendingPaymentResults[0].count : 0;
    const pendingPaymentAmount = pendingPaymentResults.length > 0 ? pendingPaymentResults[0].totalAmount : 0;

    res.json({
      success: true,
      data: {
        total,
        active: activePermits,
        expired: expiredPermits,
        expiringSoon: expiringPermits,
        pendingPaymentCount,
        pendingPaymentAmount,
      },
    });
  } catch (error) {
    console.error('Error fetching temporary permit (other state) statistics:', error);
    logError(error, req);
    const userError = getUserFriendlyError(error);
    res.status(500).json({
      success: false,
      message: userError.message,
      errors: userError.details,
      errorCount: userError.errorCount,
      timestamp: getSimplifiedTimestamp(),
    });
  }
};


// Mark temporary permit (other state) as paid
exports.markAsPaid = async (req, res) => {
  try {
    const permit = await TemporaryPermitOtherState.findOne({ _id: req.params.id, userId: req.user.id })

    if (!permit) {
      return res.status(404).json({
        success: false,
        message: 'Temporary permit (other state) not found'
      })
    }

    // Check if there's a balance to pay
    if (!permit.balance || permit.balance === 0) {
      return res.status(400).json({
        success: false,
        message: 'No pending payment for this temporary permit'
      })
    }

    // Update payment details
    permit.paid = permit.totalFee || 0
    permit.balance = 0

    await permit.save()

    res.status(200).json({
      success: true,
      message: 'Payment marked as paid successfully',
      data: permit
    })
  } catch (error) {
    console.error('Error marking payment as paid:', error)
    logError(error, req)
    const userError = getUserFriendlyError(error)
    res.status(500).json({
      success: false,
      message: userError.message,
      errors: userError.details,
      errorCount: userError.errorCount,
      timestamp: getSimplifiedTimestamp()
    })
  }
};

// Increment WhatsApp message count
exports.incrementWhatsAppCount = async (req, res) => {
  try {
    const permit = await TemporaryPermitOtherState.findOne({ _id: req.params.id, userId: req.user.id })

    if (!permit) {
      return res.status(404).json({
        success: false,
        message: 'Temporary permit (other state) not found'
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
