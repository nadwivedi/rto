const mongoose = require('mongoose')

const hpaHptSchema = new mongoose.Schema({
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
    trim: true
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
  type: {
    type: String,
    enum: ['hpa', 'hpt'],
    required: true
  },
  totalFee: {
    type: Number,
    required: true,
    min: 0
  },
  paid: {
    type: Number,
    required: true,
    min: 0
  },
  balance: {
    type: Number,
    required: true,
    min: 0
  },

  // Fee Breakup (Optional)
  feeBreakup: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    amount: {
      type: Number,
      required: true,
      default: 0
    },
    _id: false
  }],

  remarks: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
})

// Index for searching vehicle number
hpaHptSchema.index({ vehicleNumber: 1 })

// Index for filtering pending payments
hpaHptSchema.index({ balance: 1 })

// Index for filtering by type
hpaHptSchema.index({ type: 1 })

// Index for owner name search
hpaHptSchema.index({ ownerName: 1 })

// Index for default sorting - newest first
hpaHptSchema.index({ createdAt: -1 })

const HpaHpt = mongoose.model('HpaHpt', hpaHptSchema)

module.exports = HpaHpt
