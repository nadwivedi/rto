const mongoose = require('mongoose')

// Admin-only ledger of fitness work the business does for a party (one of our users).
// Not shown to users - it records how much work each party gave us and the profit on it.
const fitnessWorkSchema = new mongoose.Schema(
  {
    // The party (user) who gave us the work
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    // Business date of the work (chosen by the admin), not when the row was typed in
    date: {
      type: Date,
      required: true,
      index: true
    },
    // Total amount of the work in rupees
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    // Our profit on this work in rupees
    profit: {
      type: Number,
      required: true
    },
    vehicleNumber: {
      type: String,
      trim: true,
      uppercase: true
    },
    note: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
)

fitnessWorkSchema.index({ userId: 1, date: -1 })

module.exports = mongoose.model('FitnessWork', fitnessWorkSchema)
