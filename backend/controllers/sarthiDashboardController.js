const Driving = require('../models/Driving')
const VehicleTransfer = require('../models/vehicleTransfer')
const Noc = require('../models/Noc')
const RegistrationRenewal = require('../models/registrationRenewal')
const HpaHpt = require('../models/HpaHpt')
const mongoose = require('mongoose')

const getStatusText = (record, type) => {
  if (record.balance > 0) return 'pending'
  return 'completed'
}

exports.getRecentlyAdded = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id)

    const [drivingRecords, transferRecords, nocRecords, renewalRecords, hpaRecords] = await Promise.all([
      Driving.find({ userId })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
      VehicleTransfer.find({ userId })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
      Noc.find({ userId })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
      RegistrationRenewal.find({ userId })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
      HpaHpt.find({ userId })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean()
    ])

    const unifiedRecords = []

    drivingRecords.forEach(r => {
      unifiedRecords.push({
        _id: r._id,
        type: 'DL',
        customerName: r.name || '-',
        vehicleNumber: null,
        mobileNumber: r.mobileNumber || '-',
        date: r.date || '-',
        totalFee: r.totalAmount || 0,
        paid: r.paidAmount || 0,
        balance: r.balanceAmount || 0,
        status: getStatusText({ balance: r.balanceAmount || 0 }, 'DL'),
        createdAt: r.createdAt
      })
    })

    transferRecords.forEach(r => {
      unifiedRecords.push({
        _id: r._id,
        type: 'Transfer',
        customerName: r.currentOwnerName || '-',
        vehicleNumber: r.vehicleNumber || '-',
        mobileNumber: r.currentOwnerMobile || '-',
        date: r.transferDate || '-',
        totalFee: r.totalFee || 0,
        paid: r.paid || 0,
        balance: r.balance || 0,
        status: getStatusText(r, 'Transfer'),
        createdAt: r.createdAt
      })
    })

    nocRecords.forEach(r => {
      unifiedRecords.push({
        _id: r._id,
        type: 'NOC',
        customerName: r.ownerName || '-',
        vehicleNumber: r.vehicleNumber || '-',
        mobileNumber: r.mobileNumber || '-',
        date: r.date || '-',
        totalFee: r.totalFee || 0,
        paid: r.paid || 0,
        balance: r.balance || 0,
        status: getStatusText(r, 'NOC'),
        createdAt: r.createdAt
      })
    })

    renewalRecords.forEach(r => {
      unifiedRecords.push({
        _id: r._id,
        type: 'Renewal',
        customerName: r.ownerName || '-',
        vehicleNumber: r.vehicleNumber || '-',
        mobileNumber: r.ownerMobile || '-',
        date: r.date || '-',
        totalFee: r.totalFee || 0,
        paid: r.paid || 0,
        balance: r.balance || 0,
        status: getStatusText(r, 'Renewal'),
        createdAt: r.createdAt
      })
    })

    hpaRecords.forEach(r => {
      unifiedRecords.push({
        _id: r._id,
        type: r.type === 'hpa' ? 'HPA' : 'HPT',
        customerName: r.ownerName || '-',
        vehicleNumber: r.vehicleNumber || '-',
        mobileNumber: r.mobileNumber || '-',
        date: r.date || '-',
        totalFee: r.totalFee || 0,
        paid: r.paid || 0,
        balance: r.balance || 0,
        status: getStatusText(r, 'HPA+HPT'),
        createdAt: r.createdAt
      })
    })

    unifiedRecords.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

    const topRecords = unifiedRecords.slice(0, 50)

    res.json({
      success: true,
      data: topRecords,
      total: topRecords.length
    })
  } catch (error) {
    console.error('Error fetching recently added records:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recently added records'
    })
  }
}
