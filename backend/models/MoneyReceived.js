const mongoose = require('mongoose')

const moneyReceivedSchema = new mongoose.Schema({
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
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  moneyReceivedDate: {
    type: String,
    required: true,
    trim: true
  },
  vehicleNumber: {
    type: String,
    trim: true
  },
  remark: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
})

moneyReceivedSchema.index({ userId: 1, partyId: 1, moneyReceivedDate: -1 })
moneyReceivedSchema.index({ createdAt: -1 })

module.exports = mongoose.model('MoneyReceived', moneyReceivedSchema)
