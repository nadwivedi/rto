const mongoose = require('mongoose')

// Ledger of vehicle (RC details) API credits.
//   purchase - credits the admin bought from the API provider (money out)
//   sale     - credits a user bought from the admin (money in); adds to the user's rcSearchLimit
//   adjustment - a user's unused calls re-priced at a new rate: their value (calls left x old rate) is
//                turned into calls at the new rate and the user's limit moves by the difference. No money
//                changes hands, so it is left out of the sale / purchase totals.
const apiCreditTransactionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['purchase', 'sale', 'adjustment'],
      required: true,
      index: true
    },
    // Sales and adjustments: the user who bought the credits
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },
    // Number of API calls bought / sold (adjustments: calls the user has after it, which can be 0)
    quantity: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: 'Quantity must be a whole number'
      }
    },
    // Adjustments only: calls left before, the rate they were valued at, and their value in rupees
    // (amount below is the same value, as calls after x new rate plus what was left over)
    callsBefore: {
      type: Number
    },
    oldRate: {
      type: Number
    },
    balance: {
      type: Number
    },
    // Price per API call in rupees (adjustments: the new rate)
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
    // Money received so far against amount (rows saved before this existed count as fully paid)
    paidAmount: {
      type: Number,
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
