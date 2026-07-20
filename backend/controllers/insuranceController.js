const Insurance = require('../models/Insurance')
const { checkUserAndQueueAlerts } = require('../jobs/whatsappDailyExpiryChecker')
const { processPendingMessagesForUser } = require('../jobs/whatsappMessageSender')
const VehicleRegistration = require('../models/VehicleRegistration')
const mongoose = require('mongoose')

// helper function to calculate status
const getInsuranceStatus = (validTo) => {
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

// Create new insurance record
exports.createInsurance = async (req, res) => {
  try {
    const { policyNumber, policyHolderName, insuranceCompany, productType, vehicleNumber, mobileNumber, date, issueDate, validFrom, validTo, thirdPartyValidFrom, thirdPartyValidTo, totalFee, paid, balance, remarks, insuranceDocument, renewPremium, commission, partyId: reqPartyId, rcDetails, createRC } = req.body

    // Validate required fields

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

    // Validate that paid amount can't be greater than total amount
    if (Number(paid) > Number(totalFee)) {
      return res.status(400).json({
        success: false,
        message: 'Paid amount cannot be greater than total fee'
      })
    }

    // Validate that balance amount can't be negative
    if (Number(balance) < 0) {
      return res.status(400).json({
        success: false,
        message: 'Balance amount cannot be negative'
      })
    }

    // Check if vehicle already has an active insurance policy
    if (vehicleNumber) {
      const existingActiveInsurance = await Insurance.findOne({
        vehicleNumber: vehicleNumber.toUpperCase().trim(),
        userId: req.user.id,
        status: 'active'
      })

      if (existingActiveInsurance) {
        return res.status(400).json({
          success: false,
          message: `Vehicle ${vehicleNumber.toUpperCase().trim()} already has an active insurance policy (Policy #${existingActiveInsurance.policyNumber || 'N/A'}). You can add new insurance only when the current policy status is expiring soon or expired.`
        })
      }
    }

    // Calculate status
    const status = getInsuranceStatus(validTo);

    // Use partyId from request body if provided, otherwise auto-fetch from vehicle registration
    let partyId = reqPartyId || null
    if (!partyId && vehicleNumber) {
      const vehicle = await VehicleRegistration.findOne({
        registrationNumber: vehicleNumber.toUpperCase().trim(),
        userId: req.user.id
      }).select('partyId')
      if (vehicle && vehicle.partyId) {
        partyId = vehicle.partyId
      }
    }

    // Mark any existing non-renewed insurance records for this vehicle as expired and renewed
    if (vehicleNumber) {
      await Insurance.updateMany(
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
    }

    // Create new insurance record
    const insuranceData = {
      policyNumber,
      policyHolderName,
      insuranceCompany,
      productType,
      vehicleNumber,
      mobileNumber,
      date,
      issueDate: issueDate || '',
      validFrom,
      validTo,
      thirdPartyValidFrom: thirdPartyValidFrom || '',
      thirdPartyValidTo: thirdPartyValidTo || '',
      totalFee,
      paid,
      balance,
      status,
      remarks,
      userId: req.user.id,
      partyId,
      renewPremium: Number(renewPremium) || 0,
      commission: Number(commission) || 0
    }

    // Only add insuranceDocument if it's provided (optional field)
    if (insuranceDocument) {
      insuranceData.insuranceDocument = insuranceDocument
    }

    const newInsurance = new Insurance(insuranceData)
    await newInsurance.save()

    // Auto-create VehicleRegistration if it doesn't already exist (only if createRC is true)
    let vehicleAutoCreated = false
    if (createRC && vehicleNumber) {
      try {
        const normalizedVehicleNumber = vehicleNumber.toUpperCase().trim()
        const existingVehicle = await VehicleRegistration.findOne({
          registrationNumber: normalizedVehicleNumber,
          userId: req.user.id
        })
        if (!existingVehicle) {
          const vehiclePayload = {
            registrationNumber: normalizedVehicleNumber,
            chassisNumber: rcDetails?.chassisNumber || 'N/A',
            engineNumber: rcDetails?.engineNumber || '',
            ownerName: policyHolderName || '',
            mobileNumber: mobileNumber || '',
            makerName: rcDetails?.makerName || '',
            makerModel: rcDetails?.makerModel || '',
            manufactureYear: rcDetails?.manufactureYear || null,
            cubicCapacity: rcDetails?.cubicCapacity || null,
            seatingCapacity: rcDetails?.seatingCapacity || null,
            bodyType: rcDetails?.bodyType || '',
            address: rcDetails?.address || '',
            userId: req.user.id,
            partyId: partyId || undefined
          }
          // Link the insurance document as the RC image if no RC image exists
          if (insuranceDocument) {
            vehiclePayload.rcImage = insuranceDocument
          }
          await VehicleRegistration.create(vehiclePayload)
          vehicleAutoCreated = true
          console.log(`[Insurance] Auto-created vehicle registration for ${normalizedVehicleNumber}`)
        } else {
          // Vehicle already exists, update address on vehicle details if provided
          if (rcDetails?.address) {
            existingVehicle.address = rcDetails.address
            await existingVehicle.save()
            console.log(`[Insurance] Saved extracted owner's address on existing vehicle registration: ${normalizedVehicleNumber}`)
          }
        }
      } catch (vehicleErr) {
        // Non-blocking — insurance is already saved, just log the error
        console.error('[Insurance] Could not auto-create vehicle registration:', vehicleErr.message)
      }
    }

    // Queue alerts then immediately try to send (uses existing limits + session logic)
    try {
      await checkUserAndQueueAlerts(req.user.id)
      processPendingMessagesForUser(req.user.id) // non-blocking: start/send/destroy session as needed
    } catch (err) {
      console.error('Error triggering WhatsApp scan after insurance create:', err)
    }

    res.status(201).json({
      success: true,
      message: 'Insurance record created successfully',
      vehicleAutoCreated,
      data: newInsurance
    })
  } catch (error) {
    console.error('Error creating insurance record:', error)
    res.status(400).json({
      success: false,
      message: 'Failed to create insurance record',
      error: error.message
    })
  }
}

// Get distinct insurance companies for filter dropdown
exports.getInsuranceCompanies = async (req, res) => {
  try {
    const companies = await Insurance.distinct('insuranceCompany', {
      userId: req.user.id,
      insuranceCompany: { $exists: true, $nin: [null, ''] }
    })
    res.status(200).json({ success: true, data: companies.filter(Boolean).sort() })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch companies' })
  }
}

// Get distinct insurance products for filter dropdown
exports.getInsuranceProducts = async (req, res) => {
  try {
    const products = await Insurance.distinct('productType', {
      userId: req.user.id,
      productType: { $exists: true, $nin: [null, ''] }
    })
    res.status(200).json({ success: true, data: products.filter(Boolean).sort() })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch products' })
  }
}

// Get all insurance records with pagination and filters
exports.getAllInsurance = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      company,
      product,
      validity,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query

    // Build query
    const query = { userId: req.user.id }

    // Filter by insurance company
    if (company) {
      query.insuranceCompany = { $regex: company, $options: 'i' }
    }

    // Filter by product type
    if (product) {
      query.productType = product
    }

    // Search by policy number, vehicle number, owner name
    if (search) {
      query.$or = [
        { policyNumber: { $regex: search, $options: 'i' } },
        { vehicleNumber: { $regex: search, $options: 'i' } },
        { policyHolderName: { $regex: search, $options: 'i' } },
        { mobileNumber: { $regex: search, $options: 'i' } }
      ]
    }

    // Filter by validity period (days until expiry)
    if (validity) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());

      const dateFromValidTo = {
        year: { $toInt: { $substrCP: ['$validTo', 6, 4] } },
        month: { $toInt: { $substrCP: ['$validTo', 3, 2] } },
        day: { $toInt: { $substrCP: ['$validTo', 0, 2] } }
      };

      if (validity === 'expired') {
        query.$expr = {
          $lt: [{ $dateFromParts: dateFromValidTo }, todayStart]
        };
      } else {
        const days = parseInt(validity);
        if (!isNaN(days) && days > 0) {
          const future = new Date(today);
          future.setDate(today.getDate() + days);
          const futureEnd = new Date(future.getFullYear(), future.getMonth(), future.getDate(), 23, 59, 59, 999);
          query.$expr = {
            $and: [
              { $gte: [{ $dateFromParts: dateFromValidTo }, todayStart] },
              { $lte: [{ $dateFromParts: dateFromValidTo }, futureEnd] }
            ]
          };
        }
      }
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit)
    const sortOptions = {}
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1

    // Execute query
    const insuranceRecords = await Insurance.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))

    const total = await Insurance.countDocuments(query)

    res.status(200).json({
      success: true,
      data: insuranceRecords,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalRecords: total,
        hasMore: skip + insuranceRecords.length < total
      }
    })
  } catch (error) {
    console.error('Error fetching insurance records:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch insurance records',
      error: error.message
    })
  }
}

// Export all insurance records without pagination (with optional filters)
exports.exportAllInsurance = async (req, res) => {
  try {
    const { status, company, product, search } = req.query
    const query = { userId: req.user.id }

    if (status && status !== 'all') {
      if (status === 'pending') {
        query.balance = { $gt: 0 }
      } else {
        query.status = status
      }
    }

    if (company) {
      query.insuranceCompany = { $regex: company, $options: 'i' }
    }

    if (product) {
      query.productType = product
    }

    if (search) {
      query.$or = [
        { policyNumber: { $regex: search, $options: 'i' } },
        { vehicleNumber: { $regex: search, $options: 'i' } },
        { policyHolderName: { $regex: search, $options: 'i' } },
        { mobileNumber: { $regex: search, $options: 'i' } }
      ]
    }

    const insuranceRecords = await Insurance.find(query)
      .sort({ createdAt: -1 })

    res.status(200).json({
      success: true,
      data: insuranceRecords,
      total: insuranceRecords.length
    })
  } catch (error) {
    console.error('Error exporting insurance records:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to export insurance records',
      error: error.message
    })
  }
}

// Get expiring soon insurance records
exports.getExpiringSoonInsurance = async (req, res) => {
  try {
    const { search, page = 1, limit = 20, sortBy = 'validTo', sortOrder = 'asc', product } = req.query

    // Find all vehicle numbers that have active insurance
    // These vehicles have been renewed and should be excluded
    const vehiclesWithActiveInsurance = await Insurance.find({ status: 'active', userId: req.user.id })
      .distinct('vehicleNumber')

    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)

    const thirtyDaysFromNow = new Date(today)
    thirtyDaysFromNow.setUTCDate(today.getUTCDate() + 30)
    thirtyDaysFromNow.setUTCHours(23, 59, 59, 999)

    const conditions = [
      { userId: req.user.id },
      { vehicleNumber: { $nin: vehiclesWithActiveInsurance } },
      {
        $or: [
          { status: 'expiring_soon' },
          {
            thirdPartyValidTo: { $ne: '' },
            $expr: {
              $and: [
                { $gte: [{ $dateFromString: { dateString: '$thirdPartyValidTo', format: '%d-%m-%Y' } }, today] },
                { $lte: [{ $dateFromString: { dateString: '$thirdPartyValidTo', format: '%d-%m-%Y' } }, thirtyDaysFromNow] }
              ]
            }
          }
        ]
      }
    ]

    if (product) {
      conditions.push({ productType: product })
    }

    if (search) {
      conditions.push({
        $or: [
          { policyNumber: { $regex: search, $options: 'i' } },
          { vehicleNumber: { $regex: search, $options: 'i' } },
          { mobileNumber: { $regex: search, $options: 'i' } }
        ]
      })
    }

    const query = { $and: conditions }
    const skip = (parseInt(page) - 1) * parseInt(limit)

    const sortOptions = {}
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1

    const insuranceRecords = await Insurance.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))

    const total = await Insurance.countDocuments(query)

    res.json({
      success: true,
      data: insuranceRecords,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalRecords: total,
        hasMore: skip + insuranceRecords.length < total
      }
    })
  } catch (error) {
    console.error('Error fetching expiring soon insurance records:', error)
    res.status(500).json({
      success: false,
      message: 'Error fetching expiring soon insurance records',
      error: error.message
    })
  }
}

// Get expired insurance records
exports.getExpiredInsurance = async (req, res) => {
  try {
    const { search, page = 1, limit = 20, sortBy = 'validTo', sortOrder = 'desc', product } = req.query

    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)

    // A vehicle is still "in force" if any of its records is currently active
    // or expiring soon (i.e. status field says its validity range covers today/near future).
    // Only show expired records for vehicles that have no such currently-valid record.
    const vehiclesStillValid = await Insurance.find({
      userId: req.user.id,
      status: { $in: ['active', 'expiring_soon'] }
    }).distinct('vehicleNumber')

    const conditions = [
      { userId: req.user.id },
      { vehicleNumber: { $nin: vehiclesStillValid } },
      {
        $or: [
          { status: 'expired' },
          {
            thirdPartyValidTo: { $ne: '' },
            $expr: {
              $lt: [{ $dateFromString: { dateString: '$thirdPartyValidTo', format: '%d-%m-%Y' } }, today]
            }
          }
        ]
      }
    ]

    if (product) {
      conditions.push({ productType: product })
    }

    if (search) {
      conditions.push({
        $or: [
          { policyNumber: { $regex: search, $options: 'i' } },
          { vehicleNumber: { $regex: search, $options: 'i' } },
          { mobileNumber: { $regex: search, $options: 'i' } }
        ]
      })
    }

    const query = { $and: conditions }
    const skip = (parseInt(page) - 1) * parseInt(limit)

    const sortOptions = {}
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1

    const insuranceRecords = await Insurance.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))

    const total = await Insurance.countDocuments(query)

    res.json({
      success: true,
      data: insuranceRecords,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalRecords: total,
        hasMore: skip + insuranceRecords.length < total
      }
    })
  } catch (error) {
    console.error('Error fetching expired insurance records:', error)
    res.status(500).json({
      success: false,
      message: 'Error fetching expired insurance records',
      error: error.message
    })
  }
}

// Get pending payment insurance records
exports.getPendingInsurance = async (req, res) => {
  try {
    const { search, page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc', product } = req.query

    const query = { balance: { $gt: 0 }, userId: req.user.id }

    if (product) {
      query.productType = product
    }

    if (search) {
      query.$or = [
        { policyNumber: { $regex: search, $options: 'i' } },
        { vehicleNumber: { $regex: search, $options: 'i' } },
        { mobileNumber: { $regex: search, $options: 'i' } }
      ]
    }

    const skip = (parseInt(page) - 1) * parseInt(limit)

    const sortOptions = {}
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1

    const insuranceRecords = await Insurance.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))

    const total = await Insurance.countDocuments(query)

    res.json({
      success: true,
      data: insuranceRecords,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalRecords: total,
        hasMore: skip + insuranceRecords.length < total
      }
    })
  } catch (error) {
    console.error('Error fetching pending payment insurance records:', error)
    res.status(500).json({
      success: false,
      message: 'Error fetching pending payment insurance records',
      error: error.message
    })
  }
}

// Get single insurance record by ID
exports.getInsuranceById = async (req, res) => {
  try {
    const { id } = req.params

    const insurance = await Insurance.findOne({ _id: id, userId: req.user.id })

    if (!insurance) {
      return res.status(404).json({
        success: false,
        message: 'Insurance record not found'
      })
    }

    res.status(200).json({
      success: true,
      data: insurance
    })
  } catch (error) {
    console.error('Error fetching insurance record:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch insurance record',
      error: error.message
    })
  }
}

// Get insurance by policy number
exports.getInsuranceByPolicyNumber = async (req, res) => {
  try {
    const { policyNumber } = req.params

    const insurance = await Insurance.findOne({ policyNumber, userId: req.user.id })

    if (!insurance) {
      return res.status(404).json({
        success: false,
        message: 'Insurance record not found'
      })
    }

    res.status(200).json({
      success: true,
      data: insurance
    })
  } catch (error) {
    console.error('Error fetching insurance record:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch insurance record',
      error: error.message
    })
  }
}

// Check if vehicle has active insurance
exports.checkVehicleActiveInsurance = async (req, res) => {
  try {
    const { vehicleNumber } = req.params

    const existingActive = await Insurance.findOne({
      vehicleNumber: vehicleNumber.toUpperCase().trim(),
      userId: req.user.id,
      status: 'active'
    }).select('policyNumber validTo insuranceCompany')

    if (existingActive) {
      return res.status(200).json({
        success: true,
        data: {
          hasActiveInsurance: true,
          policyNumber: existingActive.policyNumber,
          validTo: existingActive.validTo,
          insuranceCompany: existingActive.insuranceCompany
        }
      })
    }

    return res.status(200).json({
      success: true,
      data: { hasActiveInsurance: false }
    })
  } catch (error) {
    console.error('Error checking vehicle active insurance:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to check insurance status',
      error: error.message
    })
  }
}

// Update insurance record
exports.updateInsurance = async (req, res) => {
  try {
    const { id } = req.params
    const { policyNumber, policyHolderName, insuranceCompany, productType, vehicleNumber, mobileNumber, date, issueDate, validFrom, validTo, thirdPartyValidFrom, thirdPartyValidTo, totalFee, paid, balance, remarks, insuranceDocument, renewPremium, commission, partyId, rcDetails } = req.body

    const insurance = await Insurance.findOne({ _id: id, userId: req.user.id })

    if (!insurance) {
      return res.status(404).json({
        success: false,
        message: 'Insurance record not found'
      })
    }

    // Prepare updated values for validation
    const updatedTotalFee = totalFee !== undefined ? totalFee : insurance.totalFee
    const updatedPaid = paid !== undefined ? paid : insurance.paid
    const updatedBalance = balance !== undefined ? balance : insurance.balance

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
    if (policyNumber) insurance.policyNumber = policyNumber
    if (policyHolderName) insurance.policyHolderName = policyHolderName
    if (date !== undefined) insurance.date = date
    if (issueDate !== undefined) insurance.issueDate = issueDate
    if (insuranceCompany !== undefined) insurance.insuranceCompany = insuranceCompany
    if (productType !== undefined) insurance.productType = productType
    if (vehicleNumber !== undefined) insurance.vehicleNumber = vehicleNumber
    if (mobileNumber !== undefined) insurance.mobileNumber = mobileNumber
    if (validFrom) insurance.validFrom = validFrom
    if (validTo) {
      insurance.validTo = validTo
      // Recalculate status if validTo is updated
      insurance.status = getInsuranceStatus(validTo)
    }
    if (thirdPartyValidFrom !== undefined) insurance.thirdPartyValidFrom = thirdPartyValidFrom
    if (thirdPartyValidTo !== undefined) insurance.thirdPartyValidTo = thirdPartyValidTo
    if (totalFee !== undefined) insurance.totalFee = totalFee
    if (paid !== undefined) insurance.paid = paid
    if (balance !== undefined) insurance.balance = balance
    if (remarks !== undefined) insurance.remarks = remarks
    // Handle optional insuranceDocument field - can be empty string to remove document
    if (insuranceDocument !== undefined) {
      insurance.insuranceDocument = insuranceDocument || undefined
    }
    if (partyId !== undefined) insurance.partyId = partyId
    if (renewPremium !== undefined) insurance.renewPremium = Number(renewPremium) || 0
    if (commission !== undefined) insurance.commission = Number(commission) || 0

    const updatedInsurance = await insurance.save()

    // Update existing vehicle registration if address is provided in rcDetails
    if (rcDetails?.address) {
      try {
        const normalizedVehicleNumber = (vehicleNumber || insurance.vehicleNumber).toUpperCase().trim()
        const vehicle = await VehicleRegistration.findOne({
          registrationNumber: normalizedVehicleNumber,
          userId: req.user.id
        })
        if (vehicle) {
          vehicle.address = rcDetails.address
          await vehicle.save()
          console.log(`[Insurance Update] Updated address on vehicle registration: ${normalizedVehicleNumber}`)
        }
      } catch (vehicleErr) {
        console.error('[Insurance Update] Could not update vehicle address:', vehicleErr.message)
      }
    }

    // Queue alerts then immediately try to send (uses existing limits + session logic)
    try {
      await checkUserAndQueueAlerts(req.user.id)
      processPendingMessagesForUser(req.user.id) // non-blocking: start/send/destroy session as needed
    } catch (err) {
      console.error('Error triggering WhatsApp scan after insurance update:', err)
    }

    res.status(200).json({
      success: true,
      message: 'Insurance record updated successfully',
      data: updatedInsurance
    })
  } catch (error) {
    console.error('Error updating insurance record:', error)
    res.status(400).json({
      success: false,
      message: 'Failed to update insurance record',
      error: error.message
    })
  }
}

// Delete insurance record
exports.deleteInsurance = async (req, res) => {
  try {
    const { id } = req.params

    const deletedInsurance = await Insurance.findOneAndDelete({ _id: id, userId: req.user.id })

    if (!deletedInsurance) {
      return res.status(404).json({
        success: false,
        message: 'Insurance record not found'
      })
    }

    res.status(200).json({
      success: true,
      message: 'Insurance record deleted successfully',
      data: deletedInsurance
    })
  } catch (error) {
    console.error('Error deleting insurance record:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to delete insurance record',
      error: error.message
    })
  }
}

// Helper function to parse date from string (DD-MM-YYYY or DD/MM/YYYY format)
function parseInsuranceDate(dateString) {
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

// Get expiring insurance records (within specified days) - with pagination
exports.getExpiringInsurance = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      days = 30
    } = req.query

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Get all insurance records
    const allInsurance = await Insurance.find({ userId: req.user.id })

    // Filter insurance records where policy is expiring in next N days
    const expiringInsurance = allInsurance.filter(insurance => {
      const validToDate = parseInsuranceDate(insurance.validTo)
      if (!validToDate) return false

      const diffTime = validToDate - today
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      // Between 0 and specified days (not expired yet)
      return diffDays >= 0 && diffDays <= parseInt(days)
    })

    // Sort by expiry date (earliest first)
    expiringInsurance.sort((a, b) => {
      const dateA = parseInsuranceDate(a.validTo)
      const dateB = parseInsuranceDate(b.validTo)
      return dateA - dateB
    })

    // Apply pagination
    const total = expiringInsurance.length
    const skip = (parseInt(page) - 1) * parseInt(limit)
    const paginatedInsurance = expiringInsurance.slice(skip, skip + parseInt(limit))

    res.status(200).json({
      success: true,
      data: paginatedInsurance,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalRecords: total,
        hasMore: skip + parseInt(limit) < total
      }
    })
  } catch (error) {
    console.error('Error fetching expiring insurance records:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch expiring insurance records',
      error: error.message
    })
  }
}

// Get statistics
exports.getStatistics = async (req, res) => {
  try {
    const totalInsurance = await Insurance.countDocuments({ userId: req.user.id })
    const activeInsurance = await Insurance.countDocuments({ status: 'active', userId: req.user.id })

    // For expiring soon and expired, exclude vehicles that also have active insurance (renewed vehicles)
    const vehiclesWithActiveInsurance = await Insurance.find({ status: 'active', userId: req.user.id })
      .distinct('vehicleNumber')

    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)

    const thirtyDaysFromNow = new Date(today)
    thirtyDaysFromNow.setUTCDate(today.getUTCDate() + 30)
    thirtyDaysFromNow.setUTCHours(23, 59, 59, 999)

    const expiringSoonInsurance = await Insurance.countDocuments({
      userId: req.user.id,
      vehicleNumber: { $nin: vehiclesWithActiveInsurance },
      $or: [
        { status: 'expiring_soon' },
        {
          thirdPartyValidTo: { $ne: '' },
          $expr: {
            $and: [
              { $gte: [{ $dateFromString: { dateString: '$thirdPartyValidTo', format: '%d-%m-%Y' } }, today] },
              { $lte: [{ $dateFromString: { dateString: '$thirdPartyValidTo', format: '%d-%m-%Y' } }, thirtyDaysFromNow] }
            ]
          }
        }
      ]
    })

    const vehiclesStillValid = await Insurance.find({
      userId: req.user.id,
      status: { $in: ['active', 'expiring_soon'] }
    }).distinct('vehicleNumber')

    const expiredInsurance = await Insurance.countDocuments({
      userId: req.user.id,
      vehicleNumber: { $nin: vehiclesStillValid },
      $or: [
        { status: 'expired' },
        {
          thirdPartyValidTo: { $ne: '' },
          $expr: {
            $lt: [{ $dateFromString: { dateString: '$thirdPartyValidTo', format: '%d-%m-%Y' } }, today]
          }
        }
      ]
    })

    const cancelledInsurance = await Insurance.countDocuments({ status: 'cancelled', userId: req.user.id })

    // Total fees collected
    const totalRevenue = await Insurance.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(req.user.id) } },
      { $group: { _id: null, total: { $sum: '$totalFee' } } }
    ])

    // Pending payment count and amount
    const pendingPayments = await Insurance.aggregate([
      { $match: { balance: { $gt: 0 }, userId: new mongoose.Types.ObjectId(req.user.id) } },
      { $group: { _id: null, count: { $sum: 1 }, total: { $sum: '$balance' } } }
    ])

    res.status(200).json({
      success: true,
      data: {
        insurance: {
          total: totalInsurance,
          active: activeInsurance,
          expiringSoon: expiringSoonInsurance,
          expired: expiredInsurance,
          cancelled: cancelledInsurance
        },
        revenue: {
          total: totalRevenue.length > 0 ? totalRevenue[0].total : 0
        },
        pendingPayments: {
          count: pendingPayments.length > 0 ? pendingPayments[0].count : 0,
          amount: pendingPayments.length > 0 ? pendingPayments[0].total : 0
        }
      }
    })
  } catch (error) {
    console.error('Error fetching statistics:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    })
  }
}

// Mark insurance as paid
exports.markAsPaid = async (req, res) => {
  try {
    const insurance = await Insurance.findOne({ _id: req.params.id, userId: req.user.id })

    if (!insurance) {
      return res.status(404).json({
        success: false,
        message: 'Insurance record not found'
      })
    }

    // Check if there's a balance to pay
    if (!insurance.balance || insurance.balance === 0) {
      return res.status(400).json({
        success: false,
        message: 'No pending payment for this insurance record'
      })
    }

    // Update payment details
    insurance.paid = insurance.totalFee || 0
    insurance.balance = 0

    await insurance.save()

    res.status(200).json({
      success: true,
      message: 'Payment marked as paid successfully',
      data: insurance
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

// Monthly business report
exports.monthlyReport = async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear()
    const company = req.query.company || ''

    const baseMatch = { userId: new mongoose.Types.ObjectId(req.user.id) }
    if (company) {
      baseMatch.insuranceCompany = company
    }

    // Monthly breakdown
    const monthlyResult = await Insurance.aggregate([
      { $match: baseMatch },
      {
        $addFields: {
          parsedYear: { $substr: ["$validFrom", 6, 4] },
          parsedMonth: { $substr: ["$validFrom", 3, 2] }
        }
      },
      { $match: { parsedYear: String(year) } },
      {
        $group: {
          _id: { month: "$parsedMonth" },
          count: { $sum: 1 },
          totalFee: { $sum: { $ifNull: ["$totalFee", 0] } },
          commission: { $sum: { $ifNull: ["$commission", 0] } },
          paid: { $sum: { $ifNull: ["$paid", 0] } }
        }
      },
      { $sort: { "_id.month": 1 } },
      {
        $project: {
          _id: 0,
          month: "$_id.month",
          count: 1,
          totalFee: { $round: ["$totalFee", 0] },
          commission: { $round: ["$commission", 0] },
          paid: { $round: ["$paid", 0] }
        }
      }
    ])

    const months = monthlyResult.map(r => ({
      month: parseInt(r.month),
      label: new Date(year, parseInt(r.month) - 1).toLocaleString('default', { month: 'long' }),
      count: r.count,
      totalFee: r.totalFee,
      commission: r.commission,
      paid: r.paid
    }))

    const totals = months.reduce((acc, m) => ({
      count: acc.count + m.count,
      totalFee: acc.totalFee + m.totalFee,
      commission: acc.commission + m.commission,
      paid: acc.paid + m.paid
    }), { count: 0, totalFee: 0, commission: 0, paid: 0 })

    // Company-wise breakdown for the year
    const companyMatch = { userId: new mongoose.Types.ObjectId(req.user.id) }
    const companyResult = await Insurance.aggregate([
      { $match: companyMatch },
      {
        $addFields: {
          parsedYear: { $substr: ["$validFrom", 6, 4] }
        }
      },
      { $match: { parsedYear: String(year) } },
      {
        $group: {
          _id: { company: "$insuranceCompany" },
          count: { $sum: 1 },
          totalFee: { $sum: { $ifNull: ["$totalFee", 0] } },
          commission: { $sum: { $ifNull: ["$commission", 0] } },
          paid: { $sum: { $ifNull: ["$paid", 0] } }
        }
      },
      { $sort: { count: -1 } },
      {
        $project: {
          _id: 0,
          company: "$_id.company",
          count: 1,
          totalFee: { $round: ["$totalFee", 0] },
          commission: { $round: ["$commission", 0] },
          paid: { $round: ["$paid", 0] }
        }
      }
    ])

    res.status(200).json({
      success: true,
      data: { year, months, totals, companies: companyResult.filter(c => c.company) }
    })
  } catch (error) {
    console.error('Error generating monthly report:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to generate monthly report',
      error: error.message
    })
  }
}

// Increment WhatsApp message count
exports.incrementWhatsAppCount = async (req, res) => {
  try {
    const insurance = await Insurance.findOne({ _id: req.params.id, userId: req.user.id })

    if (!insurance) {
      return res.status(404).json({
        success: false,
        message: 'Insurance record not found'
      })
    }

    // Increment the WhatsApp message count
    insurance.whatsappMessageCount = (insurance.whatsappMessageCount || 0) + 1
    insurance.lastWhatsappSentAt = new Date()

    await insurance.save()

    res.status(200).json({
      success: true,
      message: 'WhatsApp message count updated successfully',
      data: {
        whatsappMessageCount: insurance.whatsappMessageCount,
        lastWhatsappSentAt: insurance.lastWhatsappSentAt
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

