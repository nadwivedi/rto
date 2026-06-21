const mongoose = require('mongoose')

const VehicleTransferSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  // Vehicle Information
  vehicleNumber: {
    type: String,
    required: true,
    trim: true,
    uppercase: true,
    index: true
  },

  // Transfer Date
  transferDate: {
    type: String,
    required: true
  },

  // Current Owner Details
  currentOwnerName: {
    type: String,
    required: true,
    trim: true
  },
  currentOwnerFatherName: {
    type: String,
    required: true,
    trim: true
  },
  currentOwnerMobile: {
    type: String,
    required: true,
    trim: true
  },
  currentOwnerAddress: {
    type: String,
    required: true,
    trim: true
  },

  // New Owner Details
  newOwnerName: {
    type: String,
    required: true,
    trim: true
  },
  newOwnerFatherName: {
    type: String,
    required: true,
    trim: true
  },
  newOwnerMobile: {
    type: String,
    required: true,
    trim: true
  },
  newOwnerAddress: {
    type: String,
    required: true,
    trim: true
  },

  // Payment Details
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

  // Profit (Commission)
  profit: {
    type: Number,
    default: 0
  },

  // Expense Breakup
  expenseBreakup: [{
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
    remark: {
      type: String,
      trim: true,
      default: ''
    },
    _id: false
  }],

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


  // referal/By Details (Optional)
  byName: {
    type: String,
    trim: true
  },
  byMobile: {
    type: String,
    trim: true
  },

  // Additional Information
  remarks: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
})

// Indexes for filtering and searching
VehicleTransferSchema.index({ vehicleNumber: 1 })
VehicleTransferSchema.index({ balance: 1 })
VehicleTransferSchema.index({ createdAt: -1 })

// Pre-save middleware to calculate balance
VehicleTransferSchema.pre('save', function(next) {
  // Ensure paid doesn't exceed totalFee
  if (this.paid > this.totalFee) {
    this.paid = this.totalFee
  }

  // Calculate balance
  this.balance = this.totalFee - this.paid

  next()
})

const VehicleTransfer = mongoose.model('VehicleTransfer', VehicleTransferSchema)

module.exports = VehicleTransfer
