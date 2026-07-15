const mongoose = require('mongoose')
const { Schema } = mongoose

const expenseBreakdownSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  workType: { type: String, enum: ['DL', 'VT', 'NOC', 'RR', 'FITNESS', 'TAX', 'GPS', 'NP', 'CG', 'BP', 'TP', 'TPOS', 'PUC', 'HPA', 'SPEED_GOVERNOR'], required: true },
  workId: { type: Schema.Types.ObjectId, required: true },
  date: { type: String, required: true },
  name: { type: String, required: true, trim: true },
  amount: { type: Number, required: true, min: 0 },
  remark: { type: String, trim: true }
}, { timestamps: true })

expenseBreakdownSchema.index({ workType: 1, workId: 1 })

module.exports = mongoose.model('ExpenseBreakdown', expenseBreakdownSchema)
