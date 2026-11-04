const mongoose = require('mongoose')

// Problems only the admin can fix (a provider wallet out of money, a bad API key, an API that
// is down). Users get a plain "service unavailable" message; the details land here instead.
// The same problem happening again bumps `count` on the one open alert instead of adding rows.
const adminAlertSchema = new mongoose.Schema(
  {
    // What the alert is about, e.g. 'api3:error:INSUFFICIENT_BALANCE'. One open alert per key.
    key: { type: String, required: true, trim: true },
    severity: { type: String, enum: ['critical', 'warning'], default: 'critical' },
    // Which part of the system raised it, e.g. 'api3'
    source: { type: String, trim: true },
    code: { type: String, trim: true },
    title: { type: String, required: true, trim: true },
    message: { type: String, trim: true },
    count: { type: Number, default: 1 },
    firstSeenAt: { type: Date, default: Date.now },
    lastSeenAt: { type: Date, default: Date.now },
    // The last lookup that ran into it
    lastVehicleNumber: { type: String, trim: true, uppercase: true },
    lastUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    lastVia: { type: String, trim: true },
    resolved: { type: Boolean, default: false },
    resolvedAt: { type: Date },
    // 'auto' when the problem went away by itself (e.g. the next lookup worked), else the admin's email
    resolvedBy: { type: String, trim: true }
  },
  { timestamps: true }
)

adminAlertSchema.index({ key: 1 }, { unique: true, partialFilterExpression: { resolved: false } })
adminAlertSchema.index({ resolved: 1, lastSeenAt: -1 })

module.exports = mongoose.model('AdminAlert', adminAlertSchema)
