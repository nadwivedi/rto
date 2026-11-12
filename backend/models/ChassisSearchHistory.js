const mongoose = require('mongoose')

// A user's Chassis -> RC lookups: the last reply for each chassis number, so it can be shown again
// without a new (paid) search
const chassisSearchHistorySchema = new mongoose.Schema(
  {
    // The account that searched (the admin user, also for searches by their staff)
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    chassisNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true
    },
    // The engine number searched with (PeriOne needs it with the chassis number)
    engineNumber: {
      type: String,
      trim: true,
      uppercase: true
    },
    // Registration number(s) found, for the list and its search box
    vehicleNumbers: {
      type: [String],
      default: []
    },
    // { chassisNumber, matches: [vehicle record, ...] } as the lookup returned it
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

chassisSearchHistorySchema.index({ userId: 1, chassisNumber: 1 }, { unique: true })
chassisSearchHistorySchema.index({ userId: 1, lastSearchedAt: -1 })

module.exports = mongoose.model('ChassisSearchHistory', chassisSearchHistorySchema)
