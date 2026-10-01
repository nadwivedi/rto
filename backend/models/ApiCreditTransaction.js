const mongoose = require('mongoose')

// Ledger of vehicle (RC details) API credits.
//   purchase - credits the admin bought from the API provider (money out)
//   sale     - credits a user bought from the admin (money in); adds to the user's rcSearchLimit
const apiCreditTransactionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['purchase', 'sale'],
      required: true,
      index: true
    },
    // Only for sales: the user who bought the credits
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },
    // Number of API calls bought / sold
    quantity: {
      type: Number,
      required: true,
      min: 1,
      validate: {
        validator: Number.isInteger,
        message: 'Quantity must be a whole number'
      }
    },
    // Price per API call in rupees
    rate: {
      type: Number,
      required: true,
      min: 0
    },
    // quantity x rate, stored so history stays correct even if the rate logic changes
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    // Business date of the deal (chosen by the admin), not when the row was typed in
    date: {
      type: Date,
      required: true,
      index: true
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

apiCreditTransactionSchema.index({ type: 1, date: -1 })
apiCreditTransactionSchema.index({ userId: 1, date: -1 })

module.exports = mongoose.model('ApiCreditTransaction', apiCreditTransactionSchema)
