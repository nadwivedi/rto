const mongoose = require('mongoose')

// One row per RC (vehicle details) search made in the app, found or not, with the details the API
// sent back. API key calls have their own log (ApiKeyCall). Shown in the admin's API Searches page.
const rcSearchLogSchema = new mongoose.Schema(
  {
    // The account the search belongs to (a staff member's searches go under their owner)
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    // Set when a staff member made the search
    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee'
    },
    vehicleNumber: {
      type: String,
      trim: true,
      uppercase: true,
      required: true
    },
    // The source the user is set to (utils/vehicleInfoProvider PROVIDERS), e.g. 'api47'
    provider: {
      type: String,
      trim: true
    },
    // The provider(s) the reply actually came from, e.g. ['api4', 'api7'], or ['api4'] when API 7 found nothing
    servedBy: {
      type: [String],
      default: undefined
    },
    // 'found', 'not_found' or 'unavailable' (the provider failed)
    result: {
      type: String,
      enum: ['found', 'not_found', 'unavailable'],
      required: true
    },
    // One search was taken from the user's limit
    charged: {
      type: Boolean,
      default: false
    },
    message: {
      type: String,
      trim: true
    },
    ownerName: {
      type: String,
      trim: true
    },
    makerModel: {
      type: String,
      trim: true
    },
    // Full vehicle details the user got (only when found)
    response: {
      type: mongoose.Schema.Types.Mixed
    },
    durationMs: {
      type: Number
    }
  },
  {
    timestamps: true
  }
)

rcSearchLogSchema.index({ createdAt: -1 })
rcSearchLogSchema.index({ userId: 1, createdAt: -1 })
rcSearchLogSchema.index({ vehicleNumber: 1, createdAt: -1 })

module.exports = mongoose.model('RcSearchLog', rcSearchLogSchema)
