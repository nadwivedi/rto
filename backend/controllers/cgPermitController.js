const CgPermit = require('../models/CgPermit')
const VehicleRegistration = require('../models/VehicleRegistration')
const mongoose = require('mongoose')
const { logError, getUserFriendlyError, getSimplifiedTimestamp } = require('../utils/errorLogger')

// helper function to calculate status
const getCgPermitStatus = (validTo) => {
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

// Create new CG permit
exports.createPermit = async (req, res) => {
  try {
    // Destructure and extract all fields from request body
    const {
      permitNumber,
      permitHolder,
      vehicleNumber,
      validFrom,
      validTo,
      totalFee,
      paid,
      balance,
      mobileNumber,
      notes,
      partyId,
      permitDocument
    } = req.body

    // Validate required fields
    // permitNumber is now optional, so no validation needed

    if (!permitHolder || !permitHolder.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Permit holder name is required',
        errors: ['Permit holder name is required'],
        errorCount: 1,
        timestamp: getSimplifiedTimestamp()
      })
    }

    if (!vehicleNumber || !vehicleNumber.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Vehicle number is required',
        errors: ['Vehicle number is required'],
        errorCount: 1,
        timestamp: getSimplifiedTimestamp()
      })
    }

    if (!validFrom || !validFrom.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Valid from date is required',
        errors: ['Valid from date is required'],
        errorCount: 1,
        timestamp: getSimplifiedTimestamp()
      })
    }

    if (!validTo || !validTo.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Valid to date is required',
        errors: ['Valid to date is required'],
        errorCount: 1,
        timestamp: getSimplifiedTimestamp()
      })
    }

    if (totalFee === undefined || totalFee === null || totalFee === '') {
      return res.status(400).json({
        success: false,
        message: 'Total fee is required',
        errors: ['Total fee is required'],
        errorCount: 1,
        timestamp: getSimplifiedTimestamp()
      })
    }

    if (paid === undefined || paid === null || paid === '') {
      return res.status(400).json({
        success: false,
        message: 'Paid amount is required',
        errors: ['Paid amount is required'],
        errorCount: 1,
        timestamp: getSimplifiedTimestamp()
      })
    }

    if (balance === undefined || balance === null || balance === '') {
      return res.status(400).json({
        success: false,
        message: 'Balance amount is required',
        errors: ['Balance amount is required'],
        errorCount: 1,
        timestamp: getSimplifiedTimestamp()
      })
    }

    // Validate numeric fields
    if (isNaN(Number(totalFee)) || Number(totalFee) < 0) {
      return res.status(400).json({
        success: false,
        message: 'Total fee must be a valid positive number',
        errors: ['Total fee must be a valid positive number'],
        errorCount: 1,
        timestamp: getSimplifiedTimestamp()
      })
    }

    if (isNaN(Number(paid)) || Number(paid) < 0) {
      return res.status(400).json({
        success: false,
        message: 'Paid amount must be a valid positive number',
        errors: ['Paid amount must be a valid positive number'],
        errorCount: 1,
        timestamp: getSimplifiedTimestamp()
      })
    }

    if (isNaN(Number(balance)) || Number(balance) < 0) {
      return res.status(400).json({
        success: false,
        message: 'Balance amount must be a valid positive number',
        errors: ['Balance amount must be a valid positive number'],
        errorCount: 1,
        timestamp: getSimplifiedTimestamp()
      })
    }

    // Calculate status
    const status = getCgPermitStatus(validTo);

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

    // Prepare validated permit data
    const permitData = {
      permitNumber: permitNumber ? permitNumber.trim() : undefined,
      permitHolder: permitHolder.trim(),
      vehicleNumber: vehicleNumber.trim().toUpperCase(),
      validFrom: validFrom.trim(),
      validTo: validTo.trim(),
      totalFee: Number(totalFee),
      paid: Number(paid),
      balance: Number(balance),
      mobileNumber: mobileNumber ? mobileNumber.trim() : undefined,
      notes: notes ? notes.trim() : undefined,
      partyId: finalPartyId || undefined,
      documents: permitDocument ? { permitDocument } : undefined,
      status,
      userId: req.user.id
    }

    // Mark any existing non-renewed CG permits for this vehicle as expired and renewed
    await CgPermit.updateMany(
      {
        vehicleNumber: vehicleNumber.trim().toUpperCase(),
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

    // Create new CG permit
    const newPermit = new CgPermit(permitData)
    await newPermit.save()

    res.status(201).json({
      success: true,
      message: 'CG permit created successfully',
      data: newPermit
    })
  } catch (error) {
    console.error('Error creating CG permit:', error)

    // Log error to file
    logError(error, req)

    // Get user-friendly error message
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

// Get all CG permits
exports.getAllPermits = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query

    // Build query
    const query = { userId: req.user.id }

    // Search by vehicle number, permit number, or permit holder name
    if (search) {
      query.$or = [
        { vehicleNumber: { $regex: search, $options: 'i' } },
        { permitNumber: { $regex: search, $options: 'i' } },
        { permitHolder: { $regex: search, $options: 'i' } }
      ]
    }

    const skip = (parseInt(page) - 1) * parseInt(limit)

    // Sort options
    const sortOptions = {}
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1

    // Execute query
    const permits = await CgPermit.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))
      .lean()

    // Map default values for WhatsApp fields to ensure older records have proper defaults
    const permitsWithDefaults = permits.map(permit => ({
      ...permit,
      whatsappMessageCount: permit.whatsappMessageCount || 0,
      lastWhatsappSentAt: permit.lastWhatsappSentAt || null
    }))

    // Get total count for pagination
    const total = await CgPermit.countDocuments(query)

    res.json({
      success: true,
      data: permitsWithDefaults,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalRecords: total,
        hasMore: skip + permits.length < total
      }
    })
  } catch (error) {
    console.error('Error fetching CG permits:', error)
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
}

// Export all CG permits without pagination
exports.exportAllPermits = async (req, res) => {
  try {
    const permits = await CgPermit.find({ userId: req.user.id })
      .sort({ createdAt: -1 })

    res.json({
      success: true,
      data: permits,
      total: permits.length
    })
  } catch (error) {
    console.error('Error exporting CG permits:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to export CG permits'
    })
  }
}

// Get expiring soon CG permits
exports.getExpiringSoonPermits = async (req, res) => {
  try {
    const { search, page = 1, limit = 20, sortBy = 'validTo', sortOrder = 'asc' } = req.query;

    // Find all vehicle numbers that have active permits
    // These vehicles have been renewed and should be excluded
    const vehiclesWithActivePermits = await CgPermit.find({ status: 'active', userId: req.user.id })
      .distinct('vehicleNumber');

    const query = {
      userId: req.user.id,
      status: 'expiring_soon',
      vehicleNumber: { $nin: vehiclesWithActivePermits }
    };

    if (search) {
      // Update the vehicleNumber condition to work with search
      query.$and = [
        { vehicleNumber: { $nin: vehiclesWithActivePermits } },
        { vehicleNumber: { $regex: search, $options: 'i' } }
      ];
      delete query.vehicleNumber;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOptions = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    const permits = await CgPermit.find(query).sort(sortOptions).skip(skip).limit(parseInt(limit)).lean();

    // Map default values for WhatsApp fields
    const permitsWithDefaults = permits.map(permit => ({
      ...permit,
      whatsappMessageCount: permit.whatsappMessageCount || 0,
      lastWhatsappSentAt: permit.lastWhatsappSentAt || null
    }));

    const total = await CgPermit.countDocuments(query);
    res.json({
      success: true,
      data: permitsWithDefaults,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalRecords: total,
      },
    });
  } catch (error) {
    console.error('Error fetching expiring soon CG permits:', error);
    res.status(500).json({ success: false, message: 'Error fetching expiring soon CG permits' });
  }
};

// Get expired CG permits
exports.getExpiredPermits = async (req, res) => {
  try {
    const { search, page = 1, limit = 20, sortBy = 'validTo', sortOrder = 'desc' } = req.query;

    // Find all vehicle numbers that have active permits
    // These vehicles have been renewed and should be excluded
    const vehiclesWithActivePermits = await CgPermit.find({ status: 'active', userId: req.user.id })
      .distinct('vehicleNumber');

    const query = {
      userId: req.user.id,
      status: 'expired',
      vehicleNumber: { $nin: vehiclesWithActivePermits }
    };

    if (search) {
      // Update the vehicleNumber condition to work with search
      query.$and = [
        { vehicleNumber: { $nin: vehiclesWithActivePermits } },
        { vehicleNumber: { $regex: search, $options: 'i' } }
      ];
      delete query.vehicleNumber;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOptions = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    const permits = await CgPermit.find(query).sort(sortOptions).skip(skip).limit(parseInt(limit)).lean();

    // Map default values for WhatsApp fields
    const permitsWithDefaults = permits.map(permit => ({
      ...permit,
      whatsappMessageCount: permit.whatsappMessageCount || 0,
      lastWhatsappSentAt: permit.lastWhatsappSentAt || null
    }));

    const total = await CgPermit.countDocuments(query);
    res.json({
      success: true,
      data: permitsWithDefaults,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalRecords: total,
      },
    });
  } catch (error) {
    console.error('Error fetching expired CG permits:', error);
    res.status(500).json({ success: false, message: 'Error fetching expired CG permits' });
  }
};

// Get pending payment CG permits
exports.getPendingPermits = async (req, res) => {
  try {
    const { search, page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    const query = { userId: req.user.id, balance: { $gt: 0 } };
    if (search) {
      query.vehicleNumber = { $regex: search, $options: 'i' };
    }
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOptions = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    const permits = await CgPermit.find(query).sort(sortOptions).skip(skip).limit(parseInt(limit)).lean();

    // Map default values for WhatsApp fields
    const permitsWithDefaults = permits.map(permit => ({
      ...permit,
      whatsappMessageCount: permit.whatsappMessageCount || 0,
      lastWhatsappSentAt: permit.lastWhatsappSentAt || null
    }));

    const total = await CgPermit.countDocuments(query);
    res.json({
      success: true,
      data: permitsWithDefaults,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalRecords: total,
      },
    });
  } catch (error) {
    console.error('Error fetching pending CG permits:', error);
    res.status(500).json({ success: false, message: 'Error fetching pending CG permits' });
  }
};

// Get single CG permit by ID
exports.getPermitById = async (req, res) => {
  try {
    const { id } = req.params

    const permit = await CgPermit.findOne({ _id: id, userId: req.user.id })

    if (!permit) {
      return res.status(404).json({
        success: false,
        message: 'CG permit not found'
      })
    }

    res.status(200).json({
      success: true,
      data: permit
    })
  } catch (error) {
    console.error('Error fetching CG permit:', error)

    // Log error to file
    logError(error, req)

    // Get user-friendly error message
    const userError = getUserFriendlyError(error)

    res.status(500).json({
      success: false,
      message: userError.message,
      errors: userError.details,
      errorCount: userError.errorCount,
      timestamp: getSimplifiedTimestamp()
    })
  }
}

// Get CG permit by permit number
exports.getPermitByNumber = async (req, res) => {
  try {
    const { permitNumber } = req.params

    const permit = await CgPermit.findOne({ permitNumber, userId: req.user.id })

    if (!permit) {
      return res.status(404).json({
        success: false,
        message: 'CG permit not found'
      })
    }

    res.status(200).json({
      success: true,
      data: permit
    })
  } catch (error) {
    console.error('Error fetching CG permit:', error)

    // Log error to file
    logError(error, req)

    // Get user-friendly error message
    const userError = getUserFriendlyError(error)

    res.status(500).json({
      success: false,
      message: userError.message,
      errors: userError.details,
      errorCount: userError.errorCount,
      timestamp: getSimplifiedTimestamp()
    })
  }
}

// Update CG permit
exports.updatePermit = async (req, res) => {
  try {
    const { id } = req.params

    // Destructure and extract all fields from request body
    const {
      permitNumber,
      permitHolder,
      vehicleNumber,
      validFrom,
      validTo,
      totalFee,
      paid,
      balance,
      mobileNumber,
      notes,
      partyId,
      permitDocument
    } = req.body

    // Validate required fields if provided
    // permitNumber is now optional, so no validation needed

    if (permitHolder !== undefined && (!permitHolder || !permitHolder.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Permit holder name cannot be empty',
        errors: ['Permit holder name cannot be empty'],
        errorCount: 1,
        timestamp: getSimplifiedTimestamp()
      })
    }

    if (vehicleNumber !== undefined && (!vehicleNumber || !vehicleNumber.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Vehicle number cannot be empty',
        errors: ['Vehicle number cannot be empty'],
        errorCount: 1,
        timestamp: getSimplifiedTimestamp()
      })
    }

    if (validFrom !== undefined && (!validFrom || !validFrom.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Valid from date cannot be empty',
        errors: ['Valid from date cannot be empty'],
        errorCount: 1,
        timestamp: getSimplifiedTimestamp()
      })
    }

    if (validTo !== undefined && (!validTo || !validTo.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Valid to date cannot be empty',
        errors: ['Valid to date cannot be empty'],
        errorCount: 1,
        timestamp: getSimplifiedTimestamp()
      })
    }

    // Validate numeric fields if provided
    if (totalFee !== undefined && (isNaN(Number(totalFee)) || Number(totalFee) < 0)) {
      return res.status(400).json({
        success: false,
        message: 'Total fee must be a valid positive number',
        errors: ['Total fee must be a valid positive number'],
        errorCount: 1,
        timestamp: getSimplifiedTimestamp()
      })
    }

    if (paid !== undefined && (isNaN(Number(paid)) || Number(paid) < 0)) {
      return res.status(400).json({
        success: false,
        message: 'Paid amount must be a valid positive number',
        errors: ['Paid amount must be a valid positive number'],
        errorCount: 1,
        timestamp: getSimplifiedTimestamp()
      })
    }

    if (balance !== undefined && (isNaN(Number(balance)) || Number(balance) < 0)) {
      return res.status(400).json({
        success: false,
        message: 'Balance amount must be a valid positive number',
        errors: ['Balance amount must be a valid positive number'],
        errorCount: 1,
        timestamp: getSimplifiedTimestamp()
      })
    }

    // Prepare validated update data
    const updateData = {}

    if (permitNumber !== undefined) updateData.permitNumber = permitNumber ? permitNumber.trim() : undefined
    if (permitHolder !== undefined) updateData.permitHolder = permitHolder.trim()
    if (vehicleNumber !== undefined) updateData.vehicleNumber = vehicleNumber.trim().toUpperCase()
    if (validFrom !== undefined) updateData.validFrom = validFrom.trim()
    if (validTo !== undefined) {
        updateData.validTo = validTo.trim()
        // Recalculate status if validTo is updated
        updateData.status = getCgPermitStatus(validTo.trim());
    }
    if (totalFee !== undefined) updateData.totalFee = Number(totalFee)
    if (paid !== undefined) updateData.paid = Number(paid)
    if (balance !== undefined) updateData.balance = Number(balance)
    if (mobileNumber !== undefined) updateData.mobileNumber = mobileNumber ? mobileNumber.trim() : ''
    if (notes !== undefined) updateData.notes = notes ? notes.trim() : ''
    if (partyId !== undefined) updateData.partyId = partyId || null
    if (permitDocument !== undefined) updateData['documents.permitDocument'] = permitDocument || undefined

    const updatedPermit = await CgPermit.findOneAndUpdate(
      { _id: id, userId: req.user.id },
      updateData,
      { new: true, runValidators: true }
    )

    if (!updatedPermit) {
      return res.status(404).json({
        success: false,
        message: 'CG permit not found'
      })
    }

    res.status(200).json({
      success: true,
      message: 'CG permit updated successfully',
      data: updatedPermit
    })
  } catch (error) {
    console.error('Error updating CG permit:', error)

    // Log error to file
    logError(error, req)

    // Get user-friendly error message
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

// Delete CG permit
exports.deletePermit = async (req, res) => {
  try {
    const { id } = req.params

    const deletedPermit = await CgPermit.findOneAndDelete({ _id: id, userId: req.user.id })

    if (!deletedPermit) {
      return res.status(404).json({
        success: false,
        message: 'CG permit not found'
      })
    }

    res.status(200).json({
      success: true,
      message: 'CG permit deleted successfully',
      data: deletedPermit
    })
  } catch (error) {
    console.error('Error deleting CG permit:', error)

    // Log error to file
    logError(error, req)

    // Get user-friendly error message
    const userError = getUserFriendlyError(error)

    res.status(500).json({
      success: false,
      message: userError.message,
      errors: userError.details,
      errorCount: userError.errorCount,
      timestamp: getSimplifiedTimestamp()
    })
  }
}

// Get statistics
exports.getStatistics = async (req, res) => {
  try {
    // Count permits by status (now using the indexed status field)
    const activePermits = await CgPermit.countDocuments({ status: 'active', userId: req.user.id })

    // For expiring soon and expired, exclude vehicles that also have active permits (renewed vehicles)
    const vehiclesWithActivePermits = await CgPermit.find({ status: 'active', userId: req.user.id })
      .distinct('vehicleNumber')

    const expiringPermits = await CgPermit.countDocuments({
      userId: req.user.id,
      status: 'expiring_soon',
      vehicleNumber: { $nin: vehiclesWithActivePermits }
    })

    const expiredPermits = await CgPermit.countDocuments({
      userId: req.user.id,
      status: 'expired',
      vehicleNumber: { $nin: vehiclesWithActivePermits }
    })

    const total = await CgPermit.countDocuments({ userId: req.user.id })

    // Pending payment aggregation
    const pendingPaymentPipeline = [
      { $match: { userId: new mongoose.Types.ObjectId(req.user.id), balance: { $gt: 0 } } },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          totalAmount: { $sum: '$balance' }
        }
      }
    ]

    const pendingPaymentResults = await CgPermit.aggregate(pendingPaymentPipeline)
    const pendingPaymentCount = pendingPaymentResults.length > 0 ? pendingPaymentResults[0].count : 0
    const pendingPaymentAmount = pendingPaymentResults.length > 0 ? pendingPaymentResults[0].totalAmount : 0

    res.json({
      success: true,
      data: {
        total,
        active: activePermits,
        expired: expiredPermits,
        expiringSoon: expiringPermits,
        pendingPaymentCount,
        pendingPaymentAmount
      }
    })
  } catch (error) {
    console.error('Error fetching CG permit statistics:', error)
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
}


// Mark CG permit as paid
exports.markAsPaid = async (req, res) => {
  try {
    const permit = await CgPermit.findOne({ _id: req.params.id, userId: req.user.id })

    if (!permit) {
      return res.status(404).json({
        success: false,
        message: 'CG permit not found'
      })
    }

    // Check if there's a balance to pay
    if (!permit.balance || permit.balance === 0) {
      return res.status(400).json({
        success: false,
        message: 'No pending payment for this CG permit'
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
    const permit = await CgPermit.findOne({ _id: req.params.id, userId: req.user.id })

    if (!permit) {
      return res.status(404).json({
        success: false,
        message: 'CG permit not found'
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
