const mongoose = require('mongoose')
const { Schema } = mongoose

const paymentReceivedSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  workType: { type: String, enum: ['DL', 'VT', 'NOC', 'RR'], required: true },
  workId: { type: Schema.Types.ObjectId, required: true },
  date: { type: String, required: true },
  amount: { type: Number, required: true, min: 0 },
  paymentMode: { type: String, enum: ['Cash', 'Bank', 'UPI'], default: 'Cash' },
  remark: { type: String, trim: true }
}, { timestamps: true })

paymentReceivedSchema.index({ workType: 1, workId: 1 })

module.exports = mongoose.model('PaymentReceived', paymentReceivedSchema)
