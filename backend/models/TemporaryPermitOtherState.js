const mongoose = require('mongoose')

const TemporaryPermitOtherStateSchema = new mongoose.Schema({
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
  // Essential Information (Required)
  permitNumber: {
    type: String,
    required: false,
    trim: true
  },
  permitHolder: {
    type: String,
    required: false,
    trim: true
  },
  vehicleNo: {
    type: String,
    required: true,
    trim: true,
    uppercase: true,
    index: true
  },
  mobileNo: {
    type: String,
    required: true,
    trim: true
  },
  validFrom: {
    type: String,
    required: true
  },
  validTo: {
    type: String,
    required: true
  },

  // Fees
  totalFee: {
    type: Number,
    required: true,
    default: 0
  },
  paid: {
    type: Number,
    required: true,
    default: 0
  },
  balance: {
    type: Number,
    required: true,
    default: 0
  },

  // Status (managed by cron job)
  status: {
    type: String,
    enum: ['active', 'expiring_soon', 'expired'],
    default: 'active',
    index: true
  },

  // Renewal status - set to true when this permit has been renewed
  isRenewed: {
    type: Boolean,
    default: false
  },

  // Admin Notes
  notes: {
    type: String,
    trim: true
  },

  // WhatsApp message tracking
  whatsappMessageCount: {
    type: Number,
    default: 0
  },
  lastWhatsappSentAt: {
    type: Date
  }
}, {
  timestamps: true
})

// Indexes for optimized queries
// Index 1: vehicleNo (for searching vehicle and getting all its permit records)
TemporaryPermitOtherStateSchema.index({ vehicleNo: 1 })

// Index 2: validTo (for filtering expired/expiring_soon/active status)
TemporaryPermitOtherStateSchema.index({ validTo: 1 })

// Index 3: balance (for filtering pending payments)
TemporaryPermitOtherStateSchema.index({ balance: 1 })

// Index 4: createdAt (for default sorting - newest first)
TemporaryPermitOtherStateSchema.index({ createdAt: -1 })

const TemporaryPermitOtherState = mongoose.model('TemporaryPermitOtherState', TemporaryPermitOtherStateSchema)

module.exports = TemporaryPermitOtherState
