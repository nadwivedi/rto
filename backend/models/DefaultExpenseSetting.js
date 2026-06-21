const mongoose = require('mongoose')

const defaultExpenseSettingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String, // 'DL', 'VT', 'NOC', 'RR', etc.
    required: true
  },
  expenses: [
    {
      name: { type: String, default: '' },
      amount: { type: String, default: '' }
    }
  ]
}, {
  timestamps: true
})

// Unique compound index for user + type
defaultExpenseSettingSchema.index({ userId: 1, type: 1 }, { unique: true })

module.exports = mongoose.model('DefaultExpenseSetting', defaultExpenseSettingSchema)
