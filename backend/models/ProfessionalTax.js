const mongoose = require('mongoose')

const professionalTaxSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  date: {
    type: String,
    trim: true
  },
  ownerName: {
    type: String,
    trim: true
  },
  grnNo: {
    type: String,
    trim: true
  },
  dealerTIN: {
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
  professionalTaxDocument: {
    type: String,
    trim: true
  },
  remarks: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
})

professionalTaxSchema.index({ taxTo: 1 })
professionalTaxSchema.index({ balanceAmount: 1 })
professionalTaxSchema.index({ ownerName: 1 })
professionalTaxSchema.index({ createdAt: -1 })

const ProfessionalTax = mongoose.model('ProfessionalTax', professionalTaxSchema)

module.exports = ProfessionalTax
