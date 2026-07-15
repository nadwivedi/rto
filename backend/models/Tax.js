const mongoose = require('mongoose')

const taxSchema = new mongoose.Schema({
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
  receiptNo: {
    type: String,
    trim: true,
    uppercase: true
  },
  vehicleNumber: {
    type: String,
    ref: 'VehicleRegistration',
    required: true,
    uppercase: true,
    trim: true,
    index: true
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
  // Payment Information
  totalAmount: {
    type: Number,
    required: true,
    default: 0
  },
  paidAmount: {
    type: Number,
    required: true,
    default: 0
  },
  balanceAmount: {
    type: Number,
    required: true,
    default: 0
  },
  taxAmount: {
    type: Number,
    required: false
  },
  taxFrom: {
    type: String,
    required: true
  },
  taxTo: {
    type: String,
    required: true
  },

  // Status
  status: {
    type: String,
    enum: ['active', 'expired', 'expiring_soon'],
    default: 'active'
  },

  // Renewal status - set to true when this tax has been renewed
  isRenewed: {
    type: Boolean,
    default: false
  },

  // Road Tax Document
  roadTaxDocument: {
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

// Optimized indexes for exact requirements:
// 1. Get all vehicles with pending payment (balanceAmount > 0)
// 2. Get all vehicles with expiring/expired tax (filter by taxTo date)
// 3. Search vehicle number and get all tax records for that vehicle

// Index 1: vehicleNumber (for searching vehicle and getting all its tax records)
taxSchema.index({ vehicleNumber: 1 })

// Index 2: taxTo (for filtering expired/expiring_soon/active status)
taxSchema.index({ taxTo: 1 })

// Index 3: balanceAmount (for filtering pending payments)
taxSchema.index({ balanceAmount: 1 })

// Index 4: ownerName (for searching by name)
taxSchema.index({ ownerName: 1 })

// Index 5: createdAt (for default sorting - newest first)
taxSchema.index({ createdAt: -1 })

const Tax = mongoose.model('Tax', taxSchema)

module.exports = Tax
