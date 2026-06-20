const VehicleTransfer = require('../models/vehicleTransfer')
const { logError, getUserFriendlyError, getSimplifiedTimestamp } = require('../utils/errorLogger')

// Create new vehicle transfer
exports.createTransfer = async (req, res) => {
  try {
    const {
      vehicleNumber,
      transferDate,
      currentOwnerName,
      currentOwnerFatherName,
      currentOwnerMobile,
      currentOwnerAddress,
      newOwnerName,
      newOwnerFatherName,
      newOwnerMobile,
      newOwnerAddress,
      totalFee,
      paid,
      balance,
      byName,
      byMobile,
      remarks,
      feeBreakup,
      profit,
      expenseBreakup,
      paymentMode
    } = req.body

    // Validate required fields
    if (!vehicleNumber) {
      return res.status(400).json({
        success: false,
        message: 'Vehicle number is required'
      })
    }

    if (!transferDate) {
      return res.status(400).json({
        success: false,
        message: 'Transfer date is required'
      })
    }

    // Validate current owner details
    if (!currentOwnerName) {
      return res.status(400).json({
        success: false,
        message: 'Current owner name is required'
      })
    }

    if (!currentOwnerFatherName) {
      return res.status(400).json({
        success: false,
        message: 'Current owner father name is required'
      })
    }

    if (!currentOwnerMobile) {
      return res.status(400).json({
        success: false,
        message: 'Current owner mobile is required'
      })
    }

    if (!currentOwnerAddress) {
      return res.status(400).json({
        success: false,
        message: 'Current owner address is required'
      })
    }

    // Validate new owner details
    if (!newOwnerName) {
      return res.status(400).json({
        success: false,
        message: 'New owner name is required'
      })
    }

    if (!newOwnerFatherName) {
      return res.status(400).json({
        success: false,
        message: 'New owner father name is required'
      })
    }

    if (!newOwnerMobile) {
      return res.status(400).json({
        success: false,
        message: 'New owner mobile is required'
      })
    }

    if (!newOwnerAddress) {
      return res.status(400).json({
        success: false,
        message: 'New owner address is required'
      })
    }

    // Validate payment fields
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

    // Create new vehicle transfer
    const newTransfer = new VehicleTransfer({
      vehicleNumber,
      transferDate,
      currentOwnerName,
      currentOwnerFatherName,
      currentOwnerMobile,
      currentOwnerAddress,
      newOwnerName,
      newOwnerFatherName,
      newOwnerMobile,
      newOwnerAddress,
      totalFee,
      paid,
      balance,
      byName,
      byMobile,
      remarks,
      feeBreakup,
      profit,
      expenseBreakup,
      paymentMode,
      userId: req.user.id
    })
    await newTransfer.save()

    res.status(201).json({
      success: true,
      message: 'Vehicle transfer created successfully',
      data: newTransfer
    })
  } catch (error) {
    console.error('Error creating vehicle transfer:', error)

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

// Get all vehicle transfers
exports.getAllTransfers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query

    // Build query
    let query = { userId: req.user.id }

    // Search filter
    if (search) {
      query.$or = [
        { vehicleNumber: { $regex: search, $options: 'i' } },
        { currentOwnerName: { $regex: search, $options: 'i' } },
        { newOwnerName: { $regex: search, $options: 'i' } },
        { byName: { $regex: search, $options: 'i' } }
      ]
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit)
    const sortOptions = { [sortBy]: sortOrder === 'asc' ? 1 : -1 }

    // Execute query with pagination
    const transfers = await VehicleTransfer.find(query)
      .sort(sortOptions)
      .limit(parseInt(limit))
      .skip(skip)

    // Get total count
    const total = await VehicleTransfer.countDocuments(query)

    res.json({
      success: true,
      data: transfers,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    })
  } catch (error) {
    console.error('Error fetching vehicle transfers:', error)

    // Log error to file
    logError(error, req)

    res.status(500).json({
      success: false,
      message: 'Error fetching vehicle transfers',
      error: error.message
    })
  }
}

// Get pending payment transfers
exports.getPendingTransfers = async (req, res) => {
  try {
    const { search, page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = req.query

    const query = { balance: { $gt: 0 }, userId: req.user.id }

    if (search) {
      query.$or = [
        { vehicleNumber: { $regex: search, $options: 'i' } },
        { currentOwnerName: { $regex: search, $options: 'i' } },
        { newOwnerName: { $regex: search, $options: 'i' } },
        { byName: { $regex: search, $options: 'i' } }
      ]
    }

    const skip = (parseInt(page) - 1) * parseInt(limit)

    const sortOptions = {}
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1

    const transfers = await VehicleTransfer.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))

    const total = await VehicleTransfer.countDocuments(query)

    res.json({
      success: true,
      data: transfers,
      pagination: {
        total,
        totalItems: total,
        totalRecords: total,
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        itemsPerPage: parseInt(limit)
      }
    })
  } catch (error) {
    console.error('Error getting pending vehicle transfers:', error)
    res.status(500).json({
      success: false,
      message: 'Error fetching pending vehicle transfers',
      error: error.message
    })
  }
}

// Get statistics
exports.getStatistics = async (req, res) => {
  try {
    const total = await VehicleTransfer.countDocuments({ userId: req.user.id })

    // Payment statistics - count transfers with balance (pending payment)
    const pendingPayments = await VehicleTransfer.countDocuments({ userId: req.user.id, balance: { $gt: 0 } })

    res.json({
      success: true,
      data: {
        total,
        pendingPayments
      }
    })
  } catch (error) {
    console.error('Error fetching statistics:', error)

    // Log error to file
    logError(error, req)

    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: error.message
    })
  }
}

// Get single vehicle transfer by ID
exports.getTransferById = async (req, res) => {
  try {
    const transfer = await VehicleTransfer.findOne({ _id: req.params.id, userId: req.user.id })

    if (!transfer) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle transfer not found'
      })
    }

    res.json({
      success: true,
      data: transfer
    })
  } catch (error) {
    console.error('Error fetching vehicle transfer:', error)

    // Log error to file
    logError(error, req)

    res.status(500).json({
      success: false,
      message: 'Error fetching vehicle transfer',
      error: error.message
    })
  }
}

// Update vehicle transfer
exports.updateTransfer = async (req, res) => {
  try {
    const {
      vehicleNumber,
      transferDate,
      currentOwnerName,
      currentOwnerFatherName,
      currentOwnerMobile,
      currentOwnerAddress,
      newOwnerName,
      newOwnerFatherName,
      newOwnerMobile,
      newOwnerAddress,
      totalFee,
      paid,
      balance,
      byName,
      byMobile,
      remarks,
      feeBreakup,
      profit,
      expenseBreakup,
      paymentMode
    } = req.body

    const transfer = await VehicleTransfer.findOne({ _id: req.params.id, userId: req.user.id })

    if (!transfer) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle transfer not found'
      })
    }

    // Prepare updated values for validation
    const updatedTotalFee = totalFee !== undefined ? totalFee : transfer.totalFee
    const updatedPaid = paid !== undefined ? paid : transfer.paid
    const updatedBalance = balance !== undefined ? balance : transfer.balance

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
    if (vehicleNumber !== undefined) transfer.vehicleNumber = vehicleNumber
    if (transferDate !== undefined) transfer.transferDate = transferDate
    if (currentOwnerName !== undefined) transfer.currentOwnerName = currentOwnerName
    if (currentOwnerFatherName !== undefined) transfer.currentOwnerFatherName = currentOwnerFatherName
    if (currentOwnerMobile !== undefined) transfer.currentOwnerMobile = currentOwnerMobile
    if (currentOwnerAddress !== undefined) transfer.currentOwnerAddress = currentOwnerAddress
    if (newOwnerName !== undefined) transfer.newOwnerName = newOwnerName
    if (newOwnerFatherName !== undefined) transfer.newOwnerFatherName = newOwnerFatherName
    if (newOwnerMobile !== undefined) transfer.newOwnerMobile = newOwnerMobile
    if (newOwnerAddress !== undefined) transfer.newOwnerAddress = newOwnerAddress
    if (totalFee !== undefined) transfer.totalFee = totalFee
    if (paid !== undefined) transfer.paid = paid
    if (balance !== undefined) transfer.balance = balance
    if (byName !== undefined) transfer.byName = byName
    if (byMobile !== undefined) transfer.byMobile = byMobile
    if (remarks !== undefined) transfer.remarks = remarks
    if (feeBreakup !== undefined) transfer.feeBreakup = feeBreakup
    if (profit !== undefined) transfer.profit = profit
    if (expenseBreakup !== undefined) transfer.expenseBreakup = expenseBreakup
    if (paymentMode !== undefined) transfer.paymentMode = paymentMode

    await transfer.save()

    res.json({
      success: true,
      message: 'Vehicle transfer updated successfully',
      data: transfer
    })
  } catch (error) {
    console.error('Error updating vehicle transfer:', error)

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

// Delete vehicle transfer
exports.deleteTransfer = async (req, res) => {
  try {
    const deletedTransfer = await VehicleTransfer.findOneAndDelete({ _id: req.params.id, userId: req.user.id })

    if (!deletedTransfer) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle transfer not found'
      })
    }

    res.json({
      success: true,
      message: 'Vehicle transfer deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting vehicle transfer:', error)

    // Log error to file
    logError(error, req)

    res.status(500).json({
      success: false,
      message: 'Error deleting vehicle transfer',
      error: error.message
    })
  }
}

// Get transfers by vehicle number
exports.getTransfersByVehicle = async (req, res) => {
  try {
    const { vehicleNumber } = req.params

    const transfers = await VehicleTransfer.find({
      userId: req.user.id,
      vehicleNumber: vehicleNumber.toUpperCase()
    }).sort({ createdAt: -1 })

    res.json({
      success: true,
      data: transfers,
      count: transfers.length
    })
  } catch (error) {
    console.error('Error fetching transfers by vehicle:', error)

    // Log error to file
    logError(error, req)

    res.status(500).json({
      success: false,
      message: 'Error fetching transfers by vehicle',
      error: error.message
    })
  }
}

// Mark vehicle transfer as paid
exports.markAsPaid = async (req, res) => {
  try {
    const transfer = await VehicleTransfer.findOne({ _id: req.params.id, userId: req.user.id })

    if (!transfer) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle transfer record not found'
      })
    }

    // Check if there's a balance to pay
    if (!transfer.balance || transfer.balance === 0) {
      return res.status(400).json({
        success: false,
        message: 'No pending payment for this vehicle transfer'
      })
    }

    // Update payment details
    transfer.paid = transfer.totalFee || 0
    transfer.balance = 0

    await transfer.save()

    res.status(200).json({
      success: true,
      message: 'Payment marked as paid successfully',
      data: transfer
    })
  } catch (error) {
    console.error('Error marking payment as paid:', error)
    logError(error, req)
    res.status(500).json({
      success: false,
      message: 'Error marking payment as paid',
      error: error.message
    })
  }
}
