const ProfessionalTax = require('../models/ProfessionalTax')
const mongoose = require('mongoose')

const getProfessionalTaxStatus = (taxTo) => {
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

exports.getAllProfessionalTax = async (req, res) => {
  try {
    const { search, page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc', status } = req.query
    const query = { userId: req.user.id }
    if (search) {
      query.$or = [
        { ownerName: { $regex: search, $options: 'i' } },
        { grnNo: { $regex: search, $options: 'i' } },
        { dealerTIN: { $regex: search, $options: 'i' } }
      ]
    }
    if (status && status !== 'all') query.status = status
    const skip = (parseInt(page) - 1) * parseInt(limit)
    const sortOptions = {}
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1
    const records = await ProfessionalTax.find(query).sort(sortOptions).skip(skip).limit(parseInt(limit))
    const total = await ProfessionalTax.countDocuments(query)
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
    console.error('Error fetching professional tax records:', error)
    res.status(500).json({ success: false, message: 'Error fetching professional tax records', error: error.message })
  }
}

exports.exportAllProfessionalTax = async (req, res) => {
  try {
    const { status, search } = req.query
    const query = { userId: req.user.id }
    if (status && status !== 'all') query.status = status
    if (search) {
      query.$or = [
        { ownerName: { $regex: search, $options: 'i' } },
        { grnNo: { $regex: search, $options: 'i' } },
        { dealerTIN: { $regex: search, $options: 'i' } }
      ]
    }
    const records = await ProfessionalTax.find(query).sort({ createdAt: -1 })
    res.json({ success: true, data: records })
  } catch (error) {
    console.error('Error exporting professional tax:', error)
    res.status(500).json({ success: false, message: 'Error exporting professional tax records', error: error.message })
  }
}

exports.getProfessionalTaxStatistics = async (req, res) => {
  try {
    const query = { userId: req.user.id }
    const total = await ProfessionalTax.countDocuments(query)
    const active = await ProfessionalTax.countDocuments({ ...query, status: 'active' })
    const expiringSoon = await ProfessionalTax.countDocuments({ ...query, status: 'expiring_soon' })
    const expired = await ProfessionalTax.countDocuments({ ...query, status: 'expired' })
    const pendingPayments = await ProfessionalTax.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(req.user.id), balanceAmount: { $gt: 0 } } },
      { $group: { _id: null, count: { $sum: 1 }, amount: { $sum: '$balanceAmount' } } }
    ])
    res.json({
      success: true,
      data: {
        total,
        active,
        expiringSoon,
        expired,
        pendingPaymentCount: pendingPayments[0]?.count || 0,
        pendingPaymentAmount: pendingPayments[0]?.amount || 0
      }
    })
  } catch (error) {
    console.error('Error getting professional tax statistics:', error)
    res.status(500).json({ success: false, message: 'Error getting professional tax statistics', error: error.message })
  }
}

exports.getProfessionalTaxById = async (req, res) => {
  try {
    const record = await ProfessionalTax.findOne({ _id: req.params.id, userId: req.user.id })
    if (!record) return res.status(404).json({ success: false, message: 'Professional tax record not found' })
    res.json({ success: true, data: record })
  } catch (error) {
    console.error('Error fetching professional tax record:', error)
    res.status(500).json({ success: false, message: 'Error fetching professional tax record', error: error.message })
  }
}

exports.createProfessionalTax = async (req, res) => {
  try {
    const { date, ownerName, grnNo, dealerTIN, totalAmount, paidAmount, balanceAmount, taxFrom, taxTo, professionalTaxDocument, remarks } = req.body
    if (!taxFrom || !taxTo) {
      return res.status(400).json({ success: false, message: 'Tax period (from/to) is required' })
    }
    if (totalAmount === undefined || totalAmount === null || paidAmount === undefined || paidAmount === null || balanceAmount === undefined || balanceAmount === null) {
      return res.status(400).json({ success: false, message: 'Total amount, paid amount, and balance are required' })
    }
    if (parseFloat(paidAmount) > parseFloat(totalAmount)) {
      return res.status(400).json({ success: false, message: 'Paid amount cannot be greater than total amount' })
    }
    const status = getProfessionalTaxStatus(taxTo)
    const record = await ProfessionalTax.create({
      userId: req.user.id,
      date,
      ownerName,
      grnNo,
      dealerTIN,
      totalAmount: parseFloat(totalAmount),
      paidAmount: parseFloat(paidAmount),
      balanceAmount: parseFloat(balanceAmount),
      taxFrom,
      taxTo,
      status,
      professionalTaxDocument,
      remarks
    })
    res.status(201).json({ success: true, data: record, message: 'Professional tax record created successfully' })
  } catch (error) {
    console.error('Error creating professional tax record:', error)
    res.status(500).json({ success: false, message: error.message || 'Error creating professional tax record' })
  }
}

exports.updateProfessionalTax = async (req, res) => {
  try {
    const { date, ownerName, grnNo, dealerTIN, totalAmount, paidAmount, balanceAmount, taxFrom, taxTo, professionalTaxDocument, remarks } = req.body
    const record = await ProfessionalTax.findOne({ _id: req.params.id, userId: req.user.id })
    if (!record) return res.status(404).json({ success: false, message: 'Professional tax record not found' })
    if (parseFloat(paidAmount) > parseFloat(totalAmount)) {
      return res.status(400).json({ success: false, message: 'Paid amount cannot be greater than total amount' })
    }
    const status = getProfessionalTaxStatus(taxTo || record.taxTo)
    record.date = date !== undefined ? date : record.date
    record.ownerName = ownerName !== undefined ? ownerName : record.ownerName
    record.grnNo = grnNo !== undefined ? grnNo : record.grnNo
    record.dealerTIN = dealerTIN !== undefined ? dealerTIN : record.dealerTIN
    record.totalAmount = totalAmount !== undefined ? parseFloat(totalAmount) : record.totalAmount
    record.paidAmount = paidAmount !== undefined ? parseFloat(paidAmount) : record.paidAmount
    record.balanceAmount = balanceAmount !== undefined ? parseFloat(balanceAmount) : record.balanceAmount
    record.taxFrom = taxFrom || record.taxFrom
    record.taxTo = taxTo || record.taxTo
    record.status = status
    if (professionalTaxDocument !== undefined) record.professionalTaxDocument = professionalTaxDocument
    record.remarks = remarks !== undefined ? remarks : record.remarks
    await record.save()
    res.json({ success: true, data: record, message: 'Professional tax record updated successfully' })
  } catch (error) {
    console.error('Error updating professional tax record:', error)
    res.status(500).json({ success: false, message: error.message || 'Error updating professional tax record' })
  }
}

exports.deleteProfessionalTax = async (req, res) => {
  try {
    const record = await ProfessionalTax.findOneAndDelete({ _id: req.params.id, userId: req.user.id })
    if (!record) return res.status(404).json({ success: false, message: 'Professional tax record not found' })
    res.json({ success: true, message: 'Professional tax record deleted successfully' })
  } catch (error) {
    console.error('Error deleting professional tax record:', error)
    res.status(500).json({ success: false, message: 'Error deleting professional tax record', error: error.message })
  }
}

exports.markAsPaid = async (req, res) => {
  try {
    const record = await ProfessionalTax.findOne({ _id: req.params.id, userId: req.user.id })
    if (!record) return res.status(404).json({ success: false, message: 'Professional tax record not found' })
    record.paidAmount = record.totalAmount
    record.balanceAmount = 0
    await record.save()
    res.json({ success: true, data: record, message: 'Professional tax marked as paid successfully' })
  } catch (error) {
    console.error('Error marking professional tax as paid:', error)
    res.status(500).json({ success: false, message: 'Error marking professional tax as paid', error: error.message })
  }
}

exports.getExpiringSoonProfessionalTaxes = async (req, res) => {
  try {
    const { search, page = 1, limit = 20, sortBy = 'taxTo', sortOrder = 'asc' } = req.query
    const query = { status: 'expiring_soon', userId: req.user.id }
    if (search) {
      query.$or = [
        { ownerName: { $regex: search, $options: 'i' } },
        { grnNo: { $regex: search, $options: 'i' } },
        { dealerTIN: { $regex: search, $options: 'i' } }
      ]
    }
    const skip = (parseInt(page) - 1) * parseInt(limit)
    const sortOptions = {}
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1
    const records = await ProfessionalTax.find(query).sort(sortOptions).skip(skip).limit(parseInt(limit))
    const total = await ProfessionalTax.countDocuments(query)
    res.json({ success: true, data: records, pagination: { currentPage: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)), totalRecords: total, hasMore: skip + records.length < total } })
  } catch (error) {
    console.error('Error fetching expiring soon professional tax:', error)
    res.status(500).json({ success: false, message: 'Error fetching expiring soon professional tax records', error: error.message })
  }
}

exports.getExpiredProfessionalTaxes = async (req, res) => {
  try {
    const { search, page = 1, limit = 20, sortBy = 'taxTo', sortOrder = 'desc' } = req.query
    const query = { status: 'expired', userId: req.user.id }
    if (search) {
      query.$or = [
        { ownerName: { $regex: search, $options: 'i' } },
        { grnNo: { $regex: search, $options: 'i' } },
        { dealerTIN: { $regex: search, $options: 'i' } }
      ]
    }
    const skip = (parseInt(page) - 1) * parseInt(limit)
    const sortOptions = {}
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1
    const records = await ProfessionalTax.find(query).sort(sortOptions).skip(skip).limit(parseInt(limit))
    const total = await ProfessionalTax.countDocuments(query)
    res.json({ success: true, data: records, pagination: { currentPage: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)), totalRecords: total, hasMore: skip + records.length < total } })
  } catch (error) {
    console.error('Error fetching expired professional tax:', error)
    res.status(500).json({ success: false, message: 'Error fetching expired professional tax records', error: error.message })
  }
}

exports.getPendingPaymentProfessionalTaxes = async (req, res) => {
  try {
    const { search, page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = req.query
    const query = { userId: req.user.id, balanceAmount: { $gt: 0 } }
    if (search) {
      query.$or = [
        { ownerName: { $regex: search, $options: 'i' } },
        { grnNo: { $regex: search, $options: 'i' } },
        { dealerTIN: { $regex: search, $options: 'i' } }
      ]
    }
    const skip = (parseInt(page) - 1) * parseInt(limit)
    const sortOptions = {}
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1
    const records = await ProfessionalTax.find(query).sort(sortOptions).skip(skip).limit(parseInt(limit))
    const total = await ProfessionalTax.countDocuments(query)
    res.json({ success: true, data: records, pagination: { currentPage: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)), totalRecords: total, hasMore: skip + records.length < total } })
  } catch (error) {
    console.error('Error fetching pending payment professional tax:', error)
    res.status(500).json({ success: false, message: 'Error fetching pending payment professional tax records', error: error.message })
  }
}
