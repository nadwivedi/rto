const mongoose = require('mongoose')

const NationalPermitSchema = new mongoose.Schema({
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
    trim: true,
    uppercase: true,
    index: true
  },

  mobileNumber: {
    type: String,
    trim: true
  },

  // ========== PART A DATA (5-year National Permit) ==========
  permitNumber: {
    type: String,
    required: false,
    trim: true,
    index: true
  },
  permitHolder: {
    type: String,
    trim: true
  },
  partAValidFrom: {
    type: String
  },
  partAValidTo: {
    type: String
  },
  partAStatus: {
    type: String,
    enum: ['active', 'expiring_soon', 'expired', 'inactive'],
    default: 'inactive',
    index: true
  },
  partADocument: String,

  // ========== PART B DATA (1-year Authorization) ==========
  authNumber: {
    type: String,
    required: false,
    trim: true,
    index: true
  },
  partBValidFrom: {
    type: String
  },
  partBValidTo: {
    type: String
  },
  partBStatus: {
    type: String,
    enum: ['active', 'expiring_soon', 'expired', 'inactive'],
    default: 'inactive',
    index: true
  },
  partBDocument: String,

  // ========== PAYMENT ==========
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

  // ========== RENEWAL TRACKING ==========
  // Set to true when this permit has been renewed (creates new document)
  isRenewed: {
    type: Boolean,
    default: false,
    index: true
  },

  // Notes
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

// Optimized indexes for queries
NationalPermitSchema.index({ vehicleNumber: 1, isRenewed: 1 })
NationalPermitSchema.index({ permitNumber: 1 })
NationalPermitSchema.index({ authNumber: 1 })
NationalPermitSchema.index({ partAValidTo: 1 })
NationalPermitSchema.index({ partBValidTo: 1 })
NationalPermitSchema.index({ partAStatus: 1 })
NationalPermitSchema.index({ partBStatus: 1 })
NationalPermitSchema.index({ balance: 1 })
NationalPermitSchema.index({ createdAt: -1 })
NationalPermitSchema.index({ userId: 1, vehicleNumber: 1 })

const NationalPermit = mongoose.model('NationalPermit', NationalPermitSchema)

module.exports = NationalPermit
