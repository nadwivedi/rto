const mongoose = require('mongoose')

// Day-wise count of Chassis -> RC searches, one row per user per day (same as RcSearchUsage / HsrpSearchUsage).
const chassisSearchUsageSchema = new mongoose.Schema(
  {
    // The account whose search limit was used (the admin user, also for searches by their staff)
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    // India date of the searches, 'YYYY-MM-DD'
    date: {
      type: String,
      required: true
    },
    // Searches that used a credit on that day
    count: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
)

chassisSearchUsageSchema.index({ userId: 1, date: 1 }, { unique: true })
chassisSearchUsageSchema.index({ date: 1 })

// Today's date in India, the key searches are counted under
chassisSearchUsageSchema.statics.todayIST = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })

// Count one search for the user today. Never throws: a failure here must not break the lookup.
chassisSearchUsageSchema.statics.recordSearch = async function (userId) {
  const bump = () => this.updateOne({ userId, date: this.todayIST() }, { $inc: { count: 1 } }, { upsert: true })
  try {
    await bump()
  } catch (err) {
    try {
      // Two first searches of the day at the same moment can both try to create the row; the retry finds it
      if (err.code !== 11000) throw err
      await bump()
    } catch (retryErr) {
      console.error('Failed to record Chassis search usage:', retryErr.message)
    }
  }
}

module.exports = mongoose.model('ChassisSearchUsage', chassisSearchUsageSchema)
