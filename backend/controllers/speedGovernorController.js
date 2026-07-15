const SpeedGovernor = require('../models/SpeedGovernor')

// Get all Speed Governor records
exports.getAll = async (req, res) => {
  try {
    const { search, page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = req.query

    const query = { userId: req.user.id }

    if (search) {
      query.vehicleNumber = { $regex: search, $options: 'i' }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit)

    const sortOptions = {}
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1

    const records = await SpeedGovernor.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))

    const total = await SpeedGovernor.countDocuments(query)

    res.json({
      success: true,
      data: records,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalRecords: total,
        hasMore: skip + records.length < total
      }
    })
  } catch (error) {
    console.error('Error fetching Speed Governor records:', error)
    res.status(500).json({
      success: false,
      message: 'Error fetching Speed Governor records',
      error: error.message
    })
  }
}

// Create new Speed Governor record
exports.create = async (req, res) => {
  try {
    const { vehicleNumber, ownerName, mobileNumber, date, remark, totalFee, paid, balance, partyId } = req.body

    if (!vehicleNumber) {
      return res.status(400).json({
        success: false,
        message: 'Vehicle number is required'
      })
    }

    if (totalFee === undefined || totalFee === null || paid === undefined || paid === null || balance === undefined || balance === null) {
      return res.status(400).json({ success: false, message: 'Total fee, paid amount, and balance are required' })
    }

    if (Number(paid) > Number(totalFee)) {
      return res.status(400).json({ success: false, message: 'Paid amount cannot be greater than total fee' })
    }

    if (Number(balance) < 0) {
      return res.status(400).json({ success: false, message: 'Balance amount cannot be negative' })
    }

    const normalizedVehicleNumber = vehicleNumber.toUpperCase().trim()

    const record = new SpeedGovernor({
      vehicleNumber: normalizedVehicleNumber,
      ownerName,
      mobileNumber,
      date,
      remark,
      totalFee,
      paid,
      balance,
      userId: req.user.id,
      partyId
    })

    await record.save()

    res.status(201).json({
      success: true,
      message: 'Speed Governor record created successfully',
      data: record
    })
  } catch (error) {
    console.error('Error creating Speed Governor record:', error)
    res.status(500).json({
      success: false,
      message: 'Error creating Speed Governor record',
      error: error.message
    })
  }
}

// Update Speed Governor record
exports.update = async (req, res) => {
  try {
    const { vehicleNumber, ownerName, mobileNumber, date, remark, totalFee, paid, balance, partyId } = req.body

    const record = await SpeedGovernor.findOne({ _id: req.params.id, userId: req.user.id })

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Speed Governor record not found'
      })
    }

    const updatedTotalFee = totalFee !== undefined ? totalFee : record.totalFee
    const updatedPaid = paid !== undefined ? paid : record.paid
    const updatedBalance = balance !== undefined ? balance : record.balance

    if (Number(updatedPaid) > Number(updatedTotalFee)) {
      return res.status(400).json({
        success: false,
        message: 'Paid amount cannot be greater than total fee'
      })
    }

    if (Number(updatedBalance) < 0) {
      return res.status(400).json({
        success: false,
        message: 'Balance amount cannot be negative'
      })
    }

    if (vehicleNumber) record.vehicleNumber = vehicleNumber
    if (ownerName !== undefined) record.ownerName = ownerName
    if (mobileNumber !== undefined) record.mobileNumber = mobileNumber
    if (date !== undefined) record.date = date
    if (remark !== undefined) record.remark = remark
    if (totalFee !== undefined) record.totalFee = totalFee
    if (paid !== undefined) record.paid = paid
    if (balance !== undefined) record.balance = balance
    if (partyId !== undefined) record.partyId = partyId

    await record.save()

    res.json({
      success: true,
      message: 'Speed Governor record updated successfully',
      data: record
    })
  } catch (error) {
    console.error('Error updating Speed Governor record:', error)
    res.status(500).json({
      success: false,
      message: 'Error updating Speed Governor record',
      error: error.message
    })
  }
}

// Delete Speed Governor record
exports.remove = async (req, res) => {
  try {
    const record = await SpeedGovernor.findOne({ _id: req.params.id, userId: req.user.id })

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Speed Governor record not found'
      })
    }

    await SpeedGovernor.deleteOne({ _id: req.params.id })

    res.json({
      success: true,
      message: 'Speed Governor record deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting Speed Governor record:', error)
    res.status(500).json({
      success: false,
      message: 'Error deleting Speed Governor record',
      error: error.message
    })
  }
}

// Mark as paid
exports.markAsPaid = async (req, res) => {
  try {
    const record = await SpeedGovernor.findOne({ _id: req.params.id, userId: req.user.id })

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Speed Governor record not found'
      })
    }

    record.paid = record.totalFee
    record.balance = 0

    await record.save()

    res.json({
      success: true,
      message: 'Speed Governor record marked as paid successfully',
      data: record
    })
  } catch (error) {
    console.error('Error marking Speed Governor as paid:', error)
    res.status(500).json({
      success: false,
      message: 'Error marking Speed Governor as paid',
      error: error.message
    })
  }
}
