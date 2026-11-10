const mongoose = require('mongoose')

// A user's HSRP (number plate) lookups: the last reply for each vehicle, so it can be shown again
// without a new (paid) search
const hsrpSearchHistorySchema = new mongoose.Schema(
  {
    // The account that searched (the admin user, also for searches by their staff)
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    vehicleNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true
    },
    // The HSRP details as API 5 sent them
    data: {
      type: mongoose.Schema.Types.Mixed
    },
    searchCount: {
      type: Number,
      default: 0
    },
    lastSearchedAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
)

hsrpSearchHistorySchema.index({ userId: 1, vehicleNumber: 1 }, { unique: true })
hsrpSearchHistorySchema.index({ userId: 1, lastSearchedAt: -1 })

module.exports = mongoose.model('HsrpSearchHistory', hsrpSearchHistorySchema)
