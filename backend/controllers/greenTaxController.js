const GreenTax = require('../models/GreenTax')
const VehicleRegistration = require('../models/VehicleRegistration')
const { checkUserAndQueueAlerts } = require('../jobs/whatsappDailyExpiryChecker')
const mongoose = require('mongoose')

const getGreenTaxStatus = (taxTo) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(today.getDate() + 30);
  thirtyDaysFromNow.setHours(23, 59, 59, 999);
  const parseDate = (dateString) => {
    const parts = dateString.split(/[-/]/);
    return new Date(parts[2], parts[1] - 1, parts[0]);
  };
  const taxToDate = parseDate(taxTo);
  if (taxToDate < today) return 'expired';
  else if (taxToDate <= thirtyDaysFromNow) return 'expiring_soon';
  else return 'active';
};

exports.getAllGreenTax = async (req, res) => {
  try {
    const { search, page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = req.query
    const query = { userId: req.user.id }
    if (search) {
      query.$or = [
        { vehicleNumber: { $regex: search, $options: 'i' } },
        { ownerName: { $regex: search, $options: 'i' } }
      ]
    }
    const skip = (parseInt(page) - 1) * parseInt(limit)
    const sortOptions = {}
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1
    const records = await GreenTax.find(query).sort(sortOptions).skip(skip).limit(parseInt(limit))
    const total = await GreenTax.countDocuments(query)
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
    console.error('Error fetching green tax records:', error)
    res.status(500).json({ success: false, message: 'Error fetching green tax records', error: error.message })
  }
}

exports.exportAllGreenTax = async (req, res) => {
  try {
    const { status, search } = req.query
    const query = { userId: req.user.id }
    if (status && status !== 'all') query.status = status
    if (search) {
      query.$or = [
        { vehicleNumber: { $regex: search, $options: 'i' } },
        { ownerName: { $regex: search, $options: 'i' } }
      ]
    }
    const records = await GreenTax.find(query).sort({ createdAt: -1 })
    res.json({ success: true, data: records })
  } catch (error) {
    console.error('Error exporting green tax:', error)
    res.status(500).json({ success: false, message: 'Error exporting green tax records', error: error.message })
  }
}

exports.getGreenTaxStatistics = async (req, res) => {
  try {
    const query = { userId: req.user.id }
    const total = await GreenTax.countDocuments(query)
    const active = await GreenTax.countDocuments({ ...query, status: 'active' })
    const expiringSoon = await GreenTax.countDocuments({ ...query, status: 'expiring_soon' })
    const expired = await GreenTax.countDocuments({ ...query, status: 'expired' })
    const pendingPayments = await GreenTax.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(req.user.id), balanceAmount: { $gt: 0 } } },
      { $group: { _id: null, count: { $sum: 1 }, amount: { $sum: '$balanceAmount' } } }
    ])
    res.json({
      success: true,
      data: {
        greenTax: { total, active, expiringSoon, expired },
        pendingPayments: { count: pendingPayments[0]?.count || 0, amount: pendingPayments[0]?.amount || 0 }
      }
    })
  } catch (error) {
    console.error('Error getting green tax statistics:', error)
    res.status(500).json({ success: false, message: 'Error getting green tax statistics', error: error.message })
  }
}

exports.getGreenTaxById = async (req, res) => {
  try {
    const record = await GreenTax.findOne({ _id: req.params.id, userId: req.user.id })
    if (!record) return res.status(404).json({ success: false, message: 'Green tax record not found' })
    res.json({ success: true, data: record })
  } catch (error) {
    console.error('Error fetching green tax record:', error)
    res.status(500).json({ success: false, message: 'Error fetching green tax record', error: error.message })
  }
}

exports.createGreenTax = async (req, res) => {
  try {
    const { vehicleNumber, ownerName, mobileNumber, date, totalAmount, paidAmount, balanceAmount, taxFrom, taxTo, greenTaxDocument, remarks, partyId } = req.body
    if (!vehicleNumber || !taxFrom || !taxTo) {
      return res.status(400).json({ success: false, message: 'Vehicle number, tax from, and tax to are required' })
    }
    if (totalAmount === undefined || totalAmount === null || paidAmount === undefined || paidAmount === null || balanceAmount === undefined || balanceAmount === null) {
      return res.status(400).json({ success: false, message: 'Total amount, paid amount, and balance are required' })
    }
    if (parseFloat(paidAmount) > parseFloat(totalAmount)) {
      return res.status(400).json({ success: false, message: 'Paid amount cannot be greater than total amount' })
    }
    const status = getGreenTaxStatus(taxTo)
    const record = await GreenTax.create({
      userId: req.user.id,
      partyId: partyId || undefined,
      vehicleNumber,
      ownerName,
      mobileNumber,
      date,
      totalAmount: parseFloat(totalAmount),
      paidAmount: parseFloat(paidAmount),
      balanceAmount: parseFloat(balanceAmount),
      taxFrom,
      taxTo,
      greenTaxDocument,
      remarks,
      status
    })
    const vehicle = await VehicleRegistration.findOne({ vehicleNumber: vehicleNumber.toUpperCase(), userId: req.user.id })
    if (vehicle && !vehicle.greenTaxFrom && !vehicle.greenTaxTo) {
      vehicle.greenTaxFrom = taxFrom;
      vehicle.greenTaxTo = taxTo;
      await vehicle.save();
    }
    res.status(201).json({ success: true, data: record, message: 'Green tax record created successfully' })
  } catch (error) {
    console.error('Error creating green tax record:', error)
    res.status(500).json({ success: false, message: error.message || 'Error creating green tax record' })
  }
}

exports.updateGreenTax = async (req, res) => {
  try {
    const { vehicleNumber, ownerName, mobileNumber, date, totalAmount, paidAmount, balanceAmount, taxFrom, taxTo, greenTaxDocument, remarks, partyId } = req.body
    const record = await GreenTax.findOne({ _id: req.params.id, userId: req.user.id })
    if (!record) return res.status(404).json({ success: false, message: 'Green tax record not found' })
    if (parseFloat(paidAmount) > parseFloat(totalAmount)) {
      return res.status(400).json({ success: false, message: 'Paid amount cannot be greater than total amount' })
    }
    const status = getGreenTaxStatus(taxTo || record.taxTo)
    record.vehicleNumber = vehicleNumber || record.vehicleNumber
    record.ownerName = ownerName !== undefined ? ownerName : record.ownerName
    record.mobileNumber = mobileNumber !== undefined ? mobileNumber : record.mobileNumber
    record.date = date !== undefined ? date : record.date
    record.totalAmount = totalAmount !== undefined ? parseFloat(totalAmount) : record.totalAmount
    record.paidAmount = paidAmount !== undefined ? parseFloat(paidAmount) : record.paidAmount
    record.balanceAmount = balanceAmount !== undefined ? parseFloat(balanceAmount) : record.balanceAmount
    record.taxFrom = taxFrom || record.taxFrom
    record.taxTo = taxTo || record.taxTo
    if (greenTaxDocument !== undefined) record.greenTaxDocument = greenTaxDocument
    record.remarks = remarks !== undefined ? remarks : record.remarks
    if (partyId !== undefined) record.partyId = partyId || undefined
    record.status = status
    await record.save()
    res.json({ success: true, data: record, message: 'Green tax record updated successfully' })
  } catch (error) {
    console.error('Error updating green tax record:', error)
    res.status(500).json({ success: false, message: error.message || 'Error updating green tax record' })
  }
}

exports.deleteGreenTax = async (req, res) => {
  try {
    const record = await GreenTax.findOneAndDelete({ _id: req.params.id, userId: req.user.id })
    if (!record) return res.status(404).json({ success: false, message: 'Green tax record not found' })
    res.json({ success: true, message: 'Green tax record deleted successfully' })
  } catch (error) {
    console.error('Error deleting green tax record:', error)
    res.status(500).json({ success: false, message: 'Error deleting green tax record', error: error.message })
  }
}

exports.markAsPaid = async (req, res) => {
  try {
    const record = await GreenTax.findOne({ _id: req.params.id, userId: req.user.id })
    if (!record) return res.status(404).json({ success: false, message: 'Green tax record not found' })
    record.paidAmount = record.totalAmount
    record.balanceAmount = 0
    await record.save()
    res.json({ success: true, data: record, message: 'Green tax marked as paid successfully' })
  } catch (error) {
    console.error('Error marking green tax as paid:', error)
    res.status(500).json({ success: false, message: 'Error marking green tax as paid', error: error.message })
  }
}

exports.incrementWhatsAppCount = async (req, res) => {
  try {
    const record = await GreenTax.findOne({ _id: req.params.id, userId: req.user.id })
    if (!record) return res.status(404).json({ success: false, message: 'Green tax record not found' })
    record.whatsappMessageCount = (record.whatsappMessageCount || 0) + 1
    record.lastWhatsappSentAt = new Date()
    await record.save()
    res.json({ success: true, data: { whatsappMessageCount: record.whatsappMessageCount, lastWhatsappSentAt: record.lastWhatsappSentAt } })
  } catch (error) {
    console.error('Error incrementing WhatsApp count:', error)
    res.status(500).json({ success: false, message: 'Error incrementing WhatsApp count', error: error.message })
  }
}

exports.getExpiringSoonGreenTaxes = async (req, res) => {
  try {
    const { search, page = 1, limit = 20, sortBy = 'taxTo', sortOrder = 'asc' } = req.query
    const query = { status: 'expiring_soon', userId: req.user.id }
    if (search) {
      query.$or = [
        { vehicleNumber: { $regex: search, $options: 'i' } },
        { ownerName: { $regex: search, $options: 'i' } }
      ]
    }
    const skip = (parseInt(page) - 1) * parseInt(limit)
    const sortOptions = {}
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1
    const records = await GreenTax.find(query).sort(sortOptions).skip(skip).limit(parseInt(limit))
    const total = await GreenTax.countDocuments(query)
    res.json({ success: true, data: records, pagination: { currentPage: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)), totalRecords: total, hasMore: skip + records.length < total } })
  } catch (error) {
    console.error('Error fetching expiring soon green tax:', error)
    res.status(500).json({ success: false, message: 'Error fetching expiring soon green tax records', error: error.message })
  }
}

exports.getExpiredGreenTaxes = async (req, res) => {
  try {
    const { search, page = 1, limit = 20, sortBy = 'taxTo', sortOrder = 'desc' } = req.query
    const query = { status: 'expired', userId: req.user.id }
    if (search) {
      query.$or = [
        { vehicleNumber: { $regex: search, $options: 'i' } },
        { ownerName: { $regex: search, $options: 'i' } }
      ]
    }
    const skip = (parseInt(page) - 1) * parseInt(limit)
    const sortOptions = {}
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1
    const records = await GreenTax.find(query).sort(sortOptions).skip(skip).limit(parseInt(limit))
    const total = await GreenTax.countDocuments(query)
    res.json({ success: true, data: records, pagination: { currentPage: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)), totalRecords: total, hasMore: skip + records.length < total } })
  } catch (error) {
    console.error('Error fetching expired green tax:', error)
    res.status(500).json({ success: false, message: 'Error fetching expired green tax records', error: error.message })
  }
}

exports.getPendingPaymentGreenTaxes = async (req, res) => {
  try {
    const { search, page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = req.query
    const query = { userId: req.user.id, balanceAmount: { $gt: 0 } }
    if (search) {
      query.$or = [
        { vehicleNumber: { $regex: search, $options: 'i' } },
        { ownerName: { $regex: search, $options: 'i' } }
      ]
    }
    const skip = (parseInt(page) - 1) * parseInt(limit)
    const sortOptions = {}
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1
    const records = await GreenTax.find(query).sort(sortOptions).skip(skip).limit(parseInt(limit))
    const total = await GreenTax.countDocuments(query)
    res.json({ success: true, data: records, pagination: { currentPage: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)), totalRecords: total, hasMore: skip + records.length < total } })
  } catch (error) {
    console.error('Error fetching pending payment green tax:', error)
    res.status(500).json({ success: false, message: 'Error fetching pending payment green tax records', error: error.message })
  }
}
