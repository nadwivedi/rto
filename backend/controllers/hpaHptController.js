const HpaHpt = require('../models/HpaHpt')
const VehicleRegistration = require('../models/VehicleRegistration')
const mongoose = require('mongoose')

// Get all HpaHpt records
exports.getAllHpaHpts = async (req, res) => {
  try {
    const { search, type, page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = req.query

    const query = { userId: req.user.id }

    if (type && ['hpa', 'hpt'].includes(type)) {
      query.type = type
    }

    if (search) {
      query.$or = [
        { vehicleNumber: { $regex: search, $options: 'i' } },
        { ownerName: { $regex: search, $options: 'i' } }
      ]
    }

    const skip = (parseInt(page) - 1) * parseInt(limit)
    const sortOptions = {}
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1

    const records = await HpaHpt.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))

    const total = await HpaHpt.countDocuments(query)

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
    console.error('Error fetching HPA/HPT records:', error)
    res.status(500).json({ success: false, message: 'Error fetching HPA/HPT records', error: error.message })
  }
}

// Get pending HpaHpt records
exports.getPendingHpaHpts = async (req, res) => {
  try {
    const { search, page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = req.query

    const query = { balance: { $gt: 0 }, userId: req.user.id }

    if (search) {
      query.$or = [
        { vehicleNumber: { $regex: search, $options: 'i' } },
        { ownerName: { $regex: search, $options: 'i' } }
      ]
    }

    const skip = (parseInt(page) - 1) * parseInt(limit)
    const sortOptions = {}
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1

    const records = await HpaHpt.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))

    const total = await HpaHpt.countDocuments(query)

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
    console.error('Error fetching pending HPA/HPT records:', error)
    res.status(500).json({ success: false, message: 'Error fetching pending HPA/HPT records', error: error.message })
  }
}

// Get single HpaHpt record by ID
exports.getHpaHptById = async (req, res) => {
  try {
    const record = await HpaHpt.findOne({ _id: req.params.id, userId: req.user.id })

    if (!record) {
      return res.status(404).json({ success: false, message: 'HPA/HPT record not found' })
    }

    res.json({ success: true, data: record })
  } catch (error) {
    console.error('Error fetching HPA/HPT record:', error)
    res.status(500).json({ success: false, message: 'Error fetching HPA/HPT record', error: error.message })
  }
}

// Create new HpaHpt record
exports.createHpaHpt = async (req, res) => {
  try {
    const {
      vehicleNumber,
      ownerName,
      mobileNumber,
      type,
      totalFee,
      paid,
      balance,
      feeBreakup,
      remarks,
      partyId: reqPartyId
    } = req.body

    if (!vehicleNumber) {
      return res.status(400).json({ success: false, message: 'Vehicle number is required' })
    }

    if (!type || !['hpa', 'hpt'].includes(type)) {
      return res.status(400).json({ success: false, message: 'Type must be hpa or hpt' })
    }

    if (totalFee === undefined || totalFee === null || paid === undefined || paid === null || balance === undefined || balance === null) {
      return res.status(400).json({ success: false, message: 'Total fee, paid amount, and balance are required' })
    }

    if (paid > totalFee) {
      return res.status(400).json({ success: false, message: 'Paid amount cannot be greater than total fee' })
    }

    if (balance < 0) {
      return res.status(400).json({ success: false, message: 'Balance amount cannot be negative' })
    }

    // Auto-fetch partyId from vehicle registration if not provided
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

    const record = new HpaHpt({
      vehicleNumber,
      ownerName,
      mobileNumber,
      type,
      totalFee,
      paid,
      balance,
      feeBreakup,
      remarks,
      userId: req.user.id,
      partyId
    })

    await record.save()

    res.status(201).json({
      success: true,
      message: 'HPA/HPT record created successfully',
      data: record
    })
  } catch (error) {
    console.error('Error creating HPA/HPT record:', error)
    res.status(500).json({ success: false, message: 'Error creating HPA/HPT record', error: error.message })
  }
}

// Update HpaHpt record
exports.updateHpaHpt = async (req, res) => {
  try {
    const {
      vehicleNumber,
      ownerName,
      mobileNumber,
      type,
      totalFee,
      paid,
      balance,
      feeBreakup,
      remarks,
      partyId
    } = req.body

    const record = await HpaHpt.findOne({ _id: req.params.id, userId: req.user.id })

    if (!record) {
      return res.status(404).json({ success: false, message: 'HPA/HPT record not found' })
    }

    const updatedTotalFee = totalFee !== undefined ? totalFee : record.totalFee
    const updatedPaid = paid !== undefined ? paid : record.paid
    const updatedBalance = balance !== undefined ? balance : record.balance

    if (updatedPaid > updatedTotalFee) {
      return res.status(400).json({ success: false, message: 'Paid amount cannot be greater than total fee' })
    }

    if (updatedBalance < 0) {
      return res.status(400).json({ success: false, message: 'Balance amount cannot be negative' })
    }

    if (vehicleNumber) record.vehicleNumber = vehicleNumber
    if (ownerName !== undefined) record.ownerName = ownerName
    if (mobileNumber !== undefined) record.mobileNumber = mobileNumber
    if (type) record.type = type
    if (totalFee !== undefined) record.totalFee = totalFee
    if (paid !== undefined) record.paid = paid
    if (balance !== undefined) record.balance = balance
    if (feeBreakup !== undefined) record.feeBreakup = feeBreakup
    if (remarks !== undefined) record.remarks = remarks
    if (partyId !== undefined) record.partyId = partyId

    await record.save()

    res.json({
      success: true,
      message: 'HPA/HPT record updated successfully',
      data: record
    })
  } catch (error) {
    console.error('Error updating HPA/HPT record:', error)
    res.status(500).json({ success: false, message: 'Error updating HPA/HPT record', error: error.message })
  }
}

// Delete HpaHpt record
exports.deleteHpaHpt = async (req, res) => {
  try {
    const record = await HpaHpt.findOne({ _id: req.params.id, userId: req.user.id })

    if (!record) {
      return res.status(404).json({ success: false, message: 'HPA/HPT record not found' })
    }

    await record.deleteOne()

    res.json({ success: true, message: 'HPA/HPT record deleted successfully' })
  } catch (error) {
    console.error('Error deleting HPA/HPT record:', error)
    res.status(500).json({ success: false, message: 'Error deleting HPA/HPT record', error: error.message })
  }
}

// Mark HpaHpt as paid
exports.markAsPaid = async (req, res) => {
  try {
    const record = await HpaHpt.findOne({ _id: req.params.id, userId: req.user.id })

    if (!record) {
      return res.status(404).json({ success: false, message: 'HPA/HPT record not found' })
    }

    if (!record.balance || record.balance === 0) {
      return res.status(400).json({ success: false, message: 'No pending payment for this record' })
    }

    record.paid = record.totalFee || 0
    record.balance = 0

    await record.save()

    res.status(200).json({
      success: true,
      message: 'Payment marked as paid successfully',
      data: record
    })
  } catch (error) {
    console.error('Error marking payment as paid:', error)
    res.status(500).json({ success: false, message: 'Error marking payment as paid', error: error.message })
  }
}

// Get HpaHpt statistics
exports.getHpaHptStatistics = async (req, res) => {
  try {
    const total = await HpaHpt.countDocuments({ userId: req.user.id })
    const hpaCount = await HpaHpt.countDocuments({ userId: req.user.id, type: 'hpa' })
    const hptCount = await HpaHpt.countDocuments({ userId: req.user.id, type: 'hpt' })

    const pendingPipeline = [
      { $match: { balance: { $gt: 0 }, userId: new mongoose.Types.ObjectId(req.user.id) } },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          totalAmount: { $sum: '$balance' }
        }
      }
    ]

    const pendingResults = await HpaHpt.aggregate(pendingPipeline)
    const pendingPaymentCount = pendingResults.length > 0 ? pendingResults[0].count : 0
    const pendingPaymentAmount = pendingResults.length > 0 ? pendingResults[0].totalAmount : 0

    res.json({
      success: true,
      data: {
        total,
        hpaCount,
        hptCount,
        pendingPaymentCount,
        pendingPaymentAmount
      }
    })
  } catch (error) {
    console.error('Error fetching HPA/HPT statistics:', error)
    res.status(500).json({ success: false, message: 'Error fetching HPA/HPT statistics', error: error.message })
  }
}

// Export all HpaHpt records
exports.exportAllHpaHpts = async (req, res) => {
  try {
    const records = await HpaHpt.find({ userId: req.user.id }).sort({ createdAt: -1 })

    res.json({ success: true, data: records, total: records.length })
  } catch (error) {
    console.error('Error exporting HPA/HPT records:', error)
    res.status(500).json({ success: false, message: 'Failed to export HPA/HPT records', error: error.message })
  }
}
