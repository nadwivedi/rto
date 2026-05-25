const mongoose = require('mongoose')

const TemporaryPermitSchema = new mongoose.Schema({
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
  vehicleNumber: {
    type: String,
    ref: 'VehicleRegistration',
    required: true,
    trim: true,
    uppercase: true,
  },
  vehicleType: {
    type: String,
    required: true,
    enum: ['CV', 'PV'], // CV = Commercial Vehicle, PV = Passenger Vehicle
    uppercase: true
  },
  validFrom: {
    type: String,
    required: true
  },
  validTo: {
    type: String,
    required: true
  },

  // Additional Details (Optional)
  mobileNumber: {
    type: String,
    trim: true
  },


  // Fees
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
  },

  // Uploaded permit document path
  temporaryPermitDocument: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
})

// Optimized indexes for exact requirements:
// 1. Get all vehicles with pending payment (balance > 0)
// 2. Get all vehicles with expiring/expired permits (filter by validTo date)
// 3. Search vehicle number and get all permit records for that vehicle

// Index 1: vehicleNumber (for searching vehicle and getting all its permit records)
TemporaryPermitSchema.index({ vehicleNumber: 1 })

// Index 2: validTo (for filtering expired/expiring_soon/active status)
TemporaryPermitSchema.index({ validTo: 1 })

// Index 3: balance (for filtering pending payments)
TemporaryPermitSchema.index({ balance: 1 })

// Index 4: createdAt (for default sorting - newest first)
TemporaryPermitSchema.index({ createdAt: -1 })

const TemporaryPermit = mongoose.model('TemporaryPermit', TemporaryPermitSchema)

module.exports = TemporaryPermit
