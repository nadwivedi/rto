const RegistrationRenewal = require('../models/registrationRenewal')

exports.createRenewal = async (req, res) => {
  try {
    const userId = req.user.id

    const {
      vehicleNumber,
      ownerName,
      ownerMobile,
      date,
      ownerAddress,
      validFrom,
      validTo,
      totalFee,
      paid,
      feeBreakup,
      byName,
      byMobile,
      remarks
    } = req.body

    if (!vehicleNumber) {
      return res.status(400).json({ success: false, message: 'Vehicle number is required' })
    }
    if (!ownerName) {
      return res.status(400).json({ success: false, message: 'Owner name is required' })
    }
    if (!ownerMobile) {
      return res.status(400).json({ success: false, message: 'Mobile number is required' })
    }
    if (!ownerAddress) {
      return res.status(400).json({ success: false, message: 'Address is required' })
    }
    if (!validFrom) {
      return res.status(400).json({ success: false, message: 'Valid from date is required' })
    }
    if (!validTo) {
      return res.status(400).json({ success: false, message: 'Valid to date is required' })
    }
    if (!totalFee && totalFee !== 0) {
      return res.status(400).json({ success: false, message: 'Total fee is required' })
    }
    if (paid === undefined || paid === null || paid === '') {
      return res.status(400).json({ success: false, message: 'Paid amount is required' })
    }

    const totalFeeNum = parseFloat(totalFee)
    const paidNum = parseFloat(paid)
    const balance = totalFeeNum - paidNum

    if (paidNum > totalFeeNum) {
      return res.status(400).json({ success: false, message: 'Paid amount cannot be greater than total fee' })
    }
    if (balance < 0) {
      return res.status(400).json({ success: false, message: 'Balance amount cannot be negative' })
    }

    const filteredFeeBreakup = Array.isArray(feeBreakup)
      ? feeBreakup.filter(item => item && item.name && item.amount && parseFloat(item.amount) > 0)
        .map(item => ({ name: item.name, amount: parseFloat(item.amount) }))
      : []

    const renewal = new RegistrationRenewal({
      userId,
      vehicleNumber,
      ownerName,
      ownerMobile,
      date,
      ownerAddress,
      validFrom,
      validTo,
      totalFee: totalFeeNum,
      paid: paidNum,
      balance,
      feeBreakup: filteredFeeBreakup,
      byName,
      byMobile,
      remarks
    })

    await renewal.save()

    res.status(201).json({
      success: true,
      message: 'Registration renewal created successfully',
      data: renewal
    })
  } catch (error) {
    console.error('Error creating registration renewal:', error)
    res.status(500).json({ success: false, message: 'Server error creating registration renewal', error: error.message })
  }
}

exports.getAllRenewals = async (req, res) => {
  try {
    const userId = req.user.id
    const { page = 1, limit = 10, search = '', sortBy = 'createdAt', sortOrder = 'desc' } = req.query

    const query = { userId }

    if (search) {
      const searchRegex = new RegExp(search, 'i')
      query.$or = [
        { vehicleNumber: searchRegex },
        { ownerName: searchRegex },
        { ownerMobile: searchRegex }
      ]
    }

    const sortOptions = {}
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1

    const total = await RegistrationRenewal.countDocuments(query)
    const renewals = await RegistrationRenewal.find(query)
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))

    res.status(200).json({
      success: true,
      data: renewals,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching registration renewals:', error)
    res.status(500).json({ success: false, message: 'Server error fetching registration renewals', error: error.message })
  }
}

exports.getPendingRenewals = async (req, res) => {
  try {
    const userId = req.user.id
    const { page = 1, limit = 10, search = '', sortBy = 'createdAt', sortOrder = 'desc' } = req.query

    const query = { userId, balance: { $gt: 0 } }

    if (search) {
      const searchRegex = new RegExp(search, 'i')
      query.$or = [
        { vehicleNumber: searchRegex },
        { ownerName: searchRegex },
        { ownerMobile: searchRegex }
      ]
    }

    const sortOptions = {}
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1

    const total = await RegistrationRenewal.countDocuments(query)
    const renewals = await RegistrationRenewal.find(query)
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))

    res.status(200).json({
      success: true,
      data: renewals,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching pending registration renewals:', error)
    res.status(500).json({ success: false, message: 'Server error fetching pending registration renewals', error: error.message })
  }
}

exports.getStatistics = async (req, res) => {
  try {
    const userId = req.user.id

    const totalRenewals = await RegistrationRenewal.countDocuments({ userId })
    const pendingPayments = await RegistrationRenewal.find({ userId, balance: { $gt: 0 } })
    const totalPendingAmount = pendingPayments.reduce((sum, renewal) => sum + renewal.balance, 0)

    res.status(200).json({
      success: true,
      data: {
        totalRenewals,
        pendingPayments: pendingPayments.length,
        totalPendingAmount
      }
    })
  } catch (error) {
    console.error('Error fetching statistics:', error)
    res.status(500).json({ success: false, message: 'Server error fetching statistics', error: error.message })
  }
}

exports.getRenewalById = async (req, res) => {
  try {
    const userId = req.user.id
    const { id } = req.params

    const renewal = await RegistrationRenewal.findOne({ _id: id, userId })

    if (!renewal) {
      return res.status(404).json({ success: false, message: 'Registration renewal not found' })
    }

    res.status(200).json({ success: true, data: renewal })
  } catch (error) {
    console.error('Error fetching registration renewal:', error)
    res.status(500).json({ success: false, message: 'Server error fetching registration renewal', error: error.message })
  }
}

exports.updateRenewal = async (req, res) => {
  try {
    const userId = req.user.id
    const { id } = req.params

    const existingRenewal = await RegistrationRenewal.findOne({ _id: id, userId })

    if (!existingRenewal) {
      return res.status(404).json({ success: false, message: 'Registration renewal not found' })
    }

    const {
      vehicleNumber,
      ownerName,
      ownerMobile,
      date,
      ownerAddress,
      validFrom,
      validTo,
      totalFee,
      paid,
      feeBreakup,
      byName,
      byMobile,
      remarks
    } = req.body

    if (vehicleNumber) existingRenewal.vehicleNumber = vehicleNumber
    if (ownerName) existingRenewal.ownerName = ownerName
    if (ownerMobile) existingRenewal.ownerMobile = ownerMobile
    if (date !== undefined) existingRenewal.date = date
    if (ownerAddress) existingRenewal.ownerAddress = ownerAddress
    if (validFrom) existingRenewal.validFrom = validFrom
    if (validTo) existingRenewal.validTo = validTo
    if (byName !== undefined) existingRenewal.byName = byName
    if (byMobile !== undefined) existingRenewal.byMobile = byMobile
    if (remarks !== undefined) existingRenewal.remarks = remarks

    if (totalFee !== undefined) {
      existingRenewal.totalFee = parseFloat(totalFee)
    }
    if (paid !== undefined) {
      existingRenewal.paid = parseFloat(paid)
    }

    if (feeBreakup !== undefined) {
      existingRenewal.feeBreakup = Array.isArray(feeBreakup)
        ? feeBreakup.filter(item => item && item.name && item.amount && parseFloat(item.amount) > 0)
          .map(item => ({ name: item.name, amount: parseFloat(item.amount) }))
        : []
    }

    if (existingRenewal.paid > existingRenewal.totalFee) {
      existingRenewal.paid = existingRenewal.totalFee
    }
    existingRenewal.balance = existingRenewal.totalFee - existingRenewal.paid

    await existingRenewal.save()

    res.status(200).json({
      success: true,
      message: 'Registration renewal updated successfully',
      data: existingRenewal
    })
  } catch (error) {
    console.error('Error updating registration renewal:', error)
    res.status(500).json({ success: false, message: 'Server error updating registration renewal', error: error.message })
  }
}

exports.deleteRenewal = async (req, res) => {
  try {
    const userId = req.user.id
    const { id } = req.params

    const renewal = await RegistrationRenewal.findOneAndDelete({ _id: id, userId })

    if (!renewal) {
      return res.status(404).json({ success: false, message: 'Registration renewal not found' })
    }

    res.status(200).json({ success: true, message: 'Registration renewal deleted successfully' })
  } catch (error) {
    console.error('Error deleting registration renewal:', error)
    res.status(500).json({ success: false, message: 'Server error deleting registration renewal', error: error.message })
  }
}

exports.markAsPaid = async (req, res) => {
  try {
    const userId = req.user.id
    const { id } = req.params

    const renewal = await RegistrationRenewal.findOne({ _id: id, userId })

    if (!renewal) {
      return res.status(404).json({ success: false, message: 'Registration renewal not found' })
    }

    if (renewal.balance <= 0) {
      return res.status(400).json({ success: false, message: 'Renewal is already fully paid' })
    }

    const amountToPay = renewal.balance

    renewal.paid += amountToPay
    renewal.balance = 0

    await renewal.save()

    res.status(200).json({
      success: true,
      message: 'Renewal marked as paid successfully',
      data: renewal
    })
  } catch (error) {
    console.error('Error marking renewal as paid:', error)
    res.status(500).json({ success: false, message: 'Server error marking renewal as paid', error: error.message })
  }
}

exports.getRenewalsByVehicle = async (req, res) => {
  try {
    const userId = req.user.id
    const { vehicleNumber } = req.params

    const renewals = await RegistrationRenewal.find({ userId, vehicleNumber: vehicleNumber.toUpperCase() })
      .sort({ createdAt: -1 })

    res.status(200).json({ success: true, data: renewals })
  } catch (error) {
    console.error('Error fetching renewals by vehicle:', error)
    res.status(500).json({ success: false, message: 'Server error fetching renewals by vehicle', error: error.message })
  }
}
