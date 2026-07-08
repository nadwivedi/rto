const mongoose = require('mongoose')

const InsuranceSchema = new mongoose.Schema({
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
  // Policy Information
  policyNumber: {
    type: String,
    trim: true,
    uppercase: true
  },

  policyHolderName: {
    type: String,
    trim: true
  },

  insuranceCompany: {
    type: String,
    trim: true
  },

  productType: {
    type: String,
    trim: true
  },

  // Date of Work
  date: {
    type: String,
    trim: true,
    default: ''
  },

  // Issue Date (when insurance document was issued)
  issueDate: {
    type: String,
    trim: true,
    default: ''
  },

  // Vehicle Information
  vehicleNumber: {
    type: String,
    ref: 'VehicleRegistration',
    trim: true,
    uppercase: true,
  },

  mobileNumber: {
    type: String,
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

  // Third Party Validity
  thirdPartyValidFrom: {
    type: String,
    trim: true,
    default: ''
  },
  thirdPartyValidTo: {
    type: String,
    trim: true,
    default: ''
  },



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

  // Status
  status: {
    type: String,
    enum: ['active', 'expired', 'expiring_soon'],
    default: 'active'
  },

  // Renewal status - set to true when this insurance has been renewed
  isRenewed: {
    type: Boolean,
    default: false
  },

  // Insurance Document
  insuranceDocument: {
    type: String,
    trim: true
  },

  // Additional Information
  remarks: {
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
  renewPremium: {
    type: Number,
    default: 0
  },
  commission: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt fields
})



const Insurance = mongoose.model('Insurance', InsuranceSchema)

module.exports = Insurance
