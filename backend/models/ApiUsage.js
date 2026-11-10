const mongoose = require('mongoose')

// Latest quota snapshot reported by an external API provider, one document per provider.
// Kept separately from VehicleSearchHistory because users can clear their history.
const apiUsageSchema = new mongoose.Schema(
  {
    provider: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    totalLimit: {
      type: Number
    },
    used: {
      type: Number
    },
    remaining: {
      type: Number
    },
    // ParzivalHub (API 3) only: money left in the wallet, what the last search cost
    // from it, and when our access to the API ends
    walletBalance: {
      type: Number
    },
    lastCharge: {
      type: Number
    },
    accessExpiresAt: {
      type: Date
    },
    // API 2 only: each time searches were bought / set ({ quantity added, plan after, when }), newest last
    planHistory: [
      {
        _id: false,
        type: { type: String, enum: ['set', 'add'] },
        quantity: Number,
        totalAfter: Number,
        note: String,
        at: Date
      }
    ],
    // API 2 only: how long its searches take (average over our key, and the last one), in ms
    avgResponseMs: {
      type: Number
    },
    lastResponseMs: {
      type: Number
    },
    // When the provider last reported these numbers (i.e. the last API call)
    checkedAt: {
      type: Date
    },
    lastVehicleNumber: {
      type: String,
      trim: true,
      uppercase: true
    },
    lastUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
)

module.exports = mongoose.model('ApiUsage', apiUsageSchema)
