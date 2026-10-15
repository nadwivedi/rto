const mongoose = require('mongoose')

// One row per call made with an API key, successful or not, with what was sent back.
const apiKeyCallSchema = new mongoose.Schema(
  {
    apiKeyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ApiKey',
      required: true
    },
    vehicleNumber: {
      type: String,
      trim: true,
      uppercase: true
    },
    // Vehicle details were returned (and one call was used from the limit)
    success: {
      type: Boolean,
      default: false
    },
    // HTTP status sent to the caller
    statusCode: {
      type: Number
    },
    // Short result for the log: 'Vehicle details fetched', 'Limit exhausted', the provider's error...
    message: {
      type: String,
      trim: true
    },
    // Quick-view fields from the vehicle details
    ownerName: {
      type: String,
      trim: true
    },
    makerModel: {
      type: String,
      trim: true
    },
    // Full vehicle details sent back to the caller (only on success)
    response: {
      type: mongoose.Schema.Types.Mixed
    },
    // The key's limit after this call
    callLimit: {
      type: Number
    },
    remaining: {
      type: Number
    },
    // India date 'YYYY-MM-DD', for day-wise counts
    date: {
      type: String,
      required: true
    },
    durationMs: {
      type: Number
    },
    ip: {
      type: String,
      trim: true
    },
    userAgent: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
)

apiKeyCallSchema.index({ apiKeyId: 1, createdAt: -1 })
apiKeyCallSchema.index({ apiKeyId: 1, date: 1 })
apiKeyCallSchema.index({ apiKeyId: 1, vehicleNumber: 1 })

module.exports = mongoose.model('ApiKeyCall', apiKeyCallSchema)
