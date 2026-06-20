const mongoose = require('mongoose')

const nocSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  vehicleNumber: {
    type: String,
    required: true,
    trim: true,
    uppercase: true,
    index: true
  },
  ownerName: {
    type: String,
    required: true,
    trim: true
  },
  mobileNumber: {
    type: String,
    required: true,
    trim: true,
    match: /^\d{10}$/
  },
  date: {
    type: String,
    trim: true
  },
  nocFrom: {
    type: String,
    required: true,
    trim: true,
    uppercase: true
  },
  nocTo: {
    type: String,
    required: true,
    trim: true,
    uppercase: true
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
  profit: {
    type: Number,
    default: 0
  },

  expenseBreakup: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    _id: false
  }],

  feeBreakup: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
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

nocSchema.index({ vehicleNumber: 1 })
nocSchema.index({ balance: 1 })
nocSchema.index({ createdAt: -1 })

nocSchema.pre('save', function(next) {
  if (this.paid > this.totalFee) {
    this.paid = this.totalFee
  }

  this.balance = this.totalFee - this.paid

  next()
})

const Noc = mongoose.model('Noc', nocSchema)

module.exports = Noc
