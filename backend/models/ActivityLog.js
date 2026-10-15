const mongoose = require('mongoose')

// One row per change made from the admin panel (create / edit / delete / status change)
const activityLogSchema = new mongoose.Schema({
  action: {
    type: String,
    enum: ['create', 'update', 'delete', 'activate', 'deactivate', 'access', 'login'],
    required: true
  },
  // What kind of record was touched
  entity: {
    type: String,
    enum: ['user', 'api_credit', 'api_key', 'blog', 'vehicle_registration', 'admin'],
    required: true
  },
  entityId: { type: String },
  // Name shown for the record (user name, blog title, vehicle number...) - kept so it survives a delete
  entityName: { type: String, trim: true },
  summary: { type: String, required: true, trim: true },
  // Field-level changes for edits: { field: 'Name', from: 'Old', to: 'New' }
  changes: [{
    _id: false,
    field: String,
    from: mongoose.Schema.Types.Mixed,
    to: mongoose.Schema.Types.Mixed
  }],
  adminId: { type: String },
  adminEmail: { type: String },
  ip: { type: String },
  userAgent: { type: String }
}, {
  timestamps: { createdAt: true, updatedAt: false }
})

activityLogSchema.index({ createdAt: -1 })
activityLogSchema.index({ entity: 1, createdAt: -1 })

module.exports = mongoose.model('ActivityLog', activityLogSchema)
