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
