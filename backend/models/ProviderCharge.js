const mongoose = require('mongoose')

// One row per credit the external vehicle info provider used, keyed by the provider's own
// `used` counter. A lookup that comes back with a counter value already saved here did not
// use a provider credit, so it is not counted against our customer's limit either.
const providerChargeSchema = new mongoose.Schema(
  {
    provider: {
      type: String,
      required: true,
      trim: true
    },
    totalLimit: {
      type: Number,
      default: null
    },
    used: {
      type: Number,
      required: true
    },
    remaining: {
      type: Number
    },
    vehicleNumber: {
      type: String,
      trim: true,
      uppercase: true
    }
  },
  {
    timestamps: true
  }
)

providerChargeSchema.index({ provider: 1, totalLimit: 1, used: 1 }, { unique: true })
// Old rows are only needed to spot a repeated counter value, so let them expire
providerChargeSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 24 * 60 * 60 })

module.exports = mongoose.model('ProviderCharge', providerChargeSchema)
