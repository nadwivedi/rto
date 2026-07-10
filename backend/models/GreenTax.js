const mongoose = require('mongoose')

const greenTaxSchema = new mongoose.Schema({
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
  taxFrom: {
    type: String,
    required: true
  },
  taxTo: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'expiring_soon'],
    default: 'active'
  },
  greenTaxDocument: {
    type: String,
    trim: true
  },
  remarks: {
    type: String,
    trim: true
  },
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

greenTaxSchema.index({ vehicleNumber: 1 })
greenTaxSchema.index({ taxTo: 1 })
greenTaxSchema.index({ balanceAmount: 1 })
greenTaxSchema.index({ ownerName: 1 })
greenTaxSchema.index({ createdAt: -1 })

const GreenTax = mongoose.model('GreenTax', greenTaxSchema)

module.exports = GreenTax
