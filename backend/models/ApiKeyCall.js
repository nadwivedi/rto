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
    // Which of our APIs served the call: 'rtosarthi_api1' or 'rtosarthi_api2'
    source: {
      type: String,
      trim: true
    },
    // Vehicle details were returned
    success: {
      type: Boolean,
      default: false
    },
    // One call was used from the key's limit (only when the provider used one of our credits)
    charged: {
      type: Boolean,
      default: false
    },
    // The provider's own counter after this call, to check `charged` against
    providerUsed: {
      type: Number
    },
    providerRemaining: {
      type: Number
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
// Day-wise usage across all keys (admin API Usage)
apiKeyCallSchema.index({ date: 1 })

module.exports = mongoose.model('ApiKeyCall', apiKeyCallSchema)
