const mongoose = require('mongoose')

const RegistrationRenewalSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  vehicleNumber: { type: String, required: true, uppercase: true },

  ownerName: { type: String, required: true },
  ownerMobile: { type: String, required: true },
  date: { type: String, trim: true },
  ownerAddress: { type: String, required: true },

  validFrom: { type: String, required: true },
  validTo: { type: String, required: true },

  totalFee: { type: Number, required: true },
  paid: { type: Number, required: true },
  balance: { type: Number, required: true },

  paymentMode: { type: String, enum: ['Cash', 'Bank', 'UPI'], default: 'Cash' },

  profit: { type: Number, default: 0 },

  expenseBreakup: [{
    name: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, default: 0 },
    _id: false
  }],

  feeBreakup: [{
    name: { type: String, required: true },
    amount: { type: Number, default: 0 },
    _id: false
  }],

  byName: { type: String },
  byMobile: { type: String },

  remarks: { type: String }
}, { timestamps: true })

RegistrationRenewalSchema.pre('save', function(next) {
  if (this.paid > this.totalFee) {
    this.paid = this.totalFee
  }
  this.balance = this.totalFee - this.paid
  next()
})

module.exports = mongoose.model('RegistrationRenewal', RegistrationRenewalSchema)
