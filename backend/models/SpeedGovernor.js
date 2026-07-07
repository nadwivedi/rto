const mongoose = require('mongoose')

const speedGovernorSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  partyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Party',
    index: true
  },
  vehicleNumber: {
    type: String,
    ref: 'VehicleRegistration',
    required: true,
    uppercase: true,
    trim: true,
  },
  ownerName: {
    type: String,
    trim: true
  },
  mobileNumber: {
    type: String,
    trim: true
  },
  date: {
    type: String,
    trim: true
  },
  remark: {
    type: String,
    trim: true
  },
  totalFee: {
    type: Number,
    required: true,
  },
  paid: {
    type: Number,
    required: true,
  },
  balance: {
    type: Number,
    required: true,
  },
}, {
  timestamps: true
})

speedGovernorSchema.index({ vehicleNumber: 1 })
speedGovernorSchema.index({ createdAt: -1 })

const SpeedGovernor = mongoose.model('SpeedGovernor', speedGovernorSchema)

module.exports = SpeedGovernor
