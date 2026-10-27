const mongoose = require('mongoose')

// API calls sold on an API key. Each sale adds its quantity to the key's callLimit.
const apiKeySaleSchema = new mongoose.Schema(
  {
    apiKeyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ApiKey',
      required: true,
      index: true
    },
    // Number of API calls sold
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
    // quantity x rate
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
    // Business date of the sale (chosen by the admin)
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

apiKeySaleSchema.index({ apiKeyId: 1, date: -1 })

module.exports = mongoose.model('ApiKeySale', apiKeySaleSchema)
