const mongoose = require('mongoose')
const Noc = require('../models/Noc')

const buildSearchQuery = (search) => {
  if (!search) return {}

  return {
    $or: [
      { vehicleNumber: { $regex: search, $options: 'i' } },
      { ownerName: { $regex: search, $options: 'i' } },
      { mobileNumber: { $regex: search, $options: 'i' } },
      { nocFrom: { $regex: search, $options: 'i' } },
      { nocTo: { $regex: search, $options: 'i' } }
    ]
  }
}

const normalizeFeeBreakup = (feeBreakup) => {
  if (!Array.isArray(feeBreakup)) return []

  return feeBreakup
    .filter((item) => item && item.name && item.amount !== undefined && Number(item.amount) > 0)
    .map((item) => ({
      name: String(item.name).trim(),
      amount: Number(item.amount)
    }))
}

const validateRequiredFields = (data) => {
  if (!data.vehicleNumber) return 'Vehicle number is required'
  if (!data.ownerName) return 'Owner name is required'
  if (!data.mobileNumber) return 'Mobile number is required'
  if (!/^\d{10}$/.test(String(data.mobileNumber))) return 'Mobile number must be 10 digits'
  if (!data.nocFrom) return 'NOC From is required'
  if (!data.nocTo) return 'NOC To is required'

  if (data.totalFee === undefined || data.totalFee === null) return 'Total fee is required'
  if (data.paid === undefined || data.paid === null) return 'Paid amount is required'
  if (data.balance === undefined || data.balance === null) return 'Balance amount is required'

  if (Number(data.totalFee) < 0 || Number(data.paid) < 0 || Number(data.balance) < 0) {
    return 'Payment amounts cannot be negative'
  }

  if (Number(data.paid) > Number(data.totalFee)) {
    return 'Paid amount cannot be greater than total fee'
  }

  return null
}

exports.createNoc = async (req, res) => {
  try {
    const {
      vehicleNumber,
      ownerName,
      mobileNumber,
      date,
      nocFrom,
      nocTo,
      totalFee,
      paid,
      balance,
      feeBreakup,
      remarks
    } = req.body

    const validationError = validateRequiredFields({
      vehicleNumber,
      ownerName,
      mobileNumber,
      nocFrom,
      nocTo,
      totalFee,
      paid,
      balance
    })

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError
      })
    }

    const noc = new Noc({
      vehicleNumber,
      ownerName,
      mobileNumber,
      date,
      nocFrom,
      nocTo,
      totalFee,
      paid,
      balance,
      feeBreakup: normalizeFeeBreakup(feeBreakup),
      remarks,
      userId: req.user.id
    })

    await noc.save()

    res.status(201).json({
      success: true,
      message: 'NOC record created successfully',
      data: noc
    })
  } catch (error) {
    console.error('Error creating NOC record:', error)
    res.status(500).json({
      success: false,
      message: 'Error creating NOC record',
      error: error.message
    })
  }
}

exports.getAllNoc = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query

    const query = {
      userId: req.user.id,
      ...buildSearchQuery(search)
    }

    const skip = (parseInt(page) - 1) * parseInt(limit)
    const sortOptions = { [sortBy]: sortOrder === 'asc' ? 1 : -1 }

    const records = await Noc.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))

    const total = await Noc.countDocuments(query)

    res.json({
      success: true,
      data: records,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    })
  } catch (error) {
    console.error('Error fetching NOC records:', error)
    res.status(500).json({
      success: false,
      message: 'Error fetching NOC records',
      error: error.message
    })
  }
}

exports.getPendingNoc = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query

    const query = {
      userId: req.user.id,
      balance: { $gt: 0 },
      ...buildSearchQuery(search)
    }

    const skip = (parseInt(page) - 1) * parseInt(limit)
    const sortOptions = { [sortBy]: sortOrder === 'asc' ? 1 : -1 }

    const records = await Noc.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))

    const total = await Noc.countDocuments(query)

    res.json({
      success: true,
      data: records,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    })
  } catch (error) {
    console.error('Error fetching pending NOC records:', error)
    res.status(500).json({
      success: false,
      message: 'Error fetching pending NOC records',
      error: error.message
    })
  }
}

exports.getNocStatistics = async (req, res) => {
  try {
    const total = await Noc.countDocuments({ userId: req.user.id })
    const pendingPayments = await Noc.countDocuments({ userId: req.user.id, balance: { $gt: 0 } })

    const pendingAmountAgg = await Noc.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(req.user.id),
          balance: { $gt: 0 }
        }
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$balance' }
        }
      }
    ])

    const pendingPaymentAmount = pendingAmountAgg[0]?.totalAmount || 0

    res.json({
      success: true,
      data: {
        total,
        pendingPayments,
        pendingPaymentAmount
      }
    })
  } catch (error) {
    console.error('Error fetching NOC statistics:', error)
    res.status(500).json({
      success: false,
      message: 'Error fetching NOC statistics',
      error: error.message
    })
  }
}

exports.getNocById = async (req, res) => {
  try {
    const record = await Noc.findOne({ _id: req.params.id, userId: req.user.id })

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'NOC record not found'
      })
    }

    res.json({
      success: true,
      data: record
    })
  } catch (error) {
    console.error('Error fetching NOC record:', error)
    res.status(500).json({
      success: false,
      message: 'Error fetching NOC record',
      error: error.message
    })
  }
}

exports.updateNoc = async (req, res) => {
  try {
    const record = await Noc.findOne({ _id: req.params.id, userId: req.user.id })

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'NOC record not found'
      })
    }

    const nextData = {
      vehicleNumber: req.body.vehicleNumber !== undefined ? req.body.vehicleNumber : record.vehicleNumber,
      ownerName: req.body.ownerName !== undefined ? req.body.ownerName : record.ownerName,
      mobileNumber: req.body.mobileNumber !== undefined ? req.body.mobileNumber : record.mobileNumber,
      nocFrom: req.body.nocFrom !== undefined ? req.body.nocFrom : record.nocFrom,
      nocTo: req.body.nocTo !== undefined ? req.body.nocTo : record.nocTo,
      totalFee: req.body.totalFee !== undefined ? req.body.totalFee : record.totalFee,
      paid: req.body.paid !== undefined ? req.body.paid : record.paid,
      balance: req.body.balance !== undefined ? req.body.balance : record.balance
    }

    const validationError = validateRequiredFields(nextData)
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError
      })
    }

    if (req.body.vehicleNumber !== undefined) record.vehicleNumber = req.body.vehicleNumber
    if (req.body.ownerName !== undefined) record.ownerName = req.body.ownerName
    if (req.body.mobileNumber !== undefined) record.mobileNumber = req.body.mobileNumber
    if (req.body.date !== undefined) record.date = req.body.date
    if (req.body.nocFrom !== undefined) record.nocFrom = req.body.nocFrom
    if (req.body.nocTo !== undefined) record.nocTo = req.body.nocTo
    if (req.body.totalFee !== undefined) record.totalFee = req.body.totalFee
    if (req.body.paid !== undefined) record.paid = req.body.paid
    if (req.body.balance !== undefined) record.balance = req.body.balance
    if (req.body.remarks !== undefined) record.remarks = req.body.remarks
    if (req.body.feeBreakup !== undefined) record.feeBreakup = normalizeFeeBreakup(req.body.feeBreakup)

    await record.save()

    res.json({
      success: true,
      message: 'NOC record updated successfully',
      data: record
    })
  } catch (error) {
    console.error('Error updating NOC record:', error)
    res.status(500).json({
      success: false,
      message: 'Error updating NOC record',
      error: error.message
    })
  }
}

exports.deleteNoc = async (req, res) => {
  try {
    const deleted = await Noc.findOneAndDelete({ _id: req.params.id, userId: req.user.id })

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'NOC record not found'
      })
    }

    res.json({
      success: true,
      message: 'NOC record deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting NOC record:', error)
    res.status(500).json({
      success: false,
      message: 'Error deleting NOC record',
      error: error.message
    })
  }
}

exports.markAsPaid = async (req, res) => {
  try {
    const record = await Noc.findOne({ _id: req.params.id, userId: req.user.id })

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'NOC record not found'
      })
    }

    if (!record.balance || record.balance === 0) {
      return res.status(400).json({
        success: false,
        message: 'No pending payment for this NOC record'
      })
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
    console.error('Error marking NOC payment as paid:', error)
    res.status(500).json({
      success: false,
      message: 'Error marking NOC payment as paid',
      error: error.message
    })
  }
}
