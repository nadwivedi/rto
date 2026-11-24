const mongoose = require('mongoose')

// Every console.log / info / warn / error line the backend prints, so the admin can read them
// in the admin panel (Logs page) instead of on the server. Kept for LOG_RETENTION_DAYS.
const LOG_RETENTION_DAYS = Number(process.env.SERVER_LOG_RETENTION_DAYS) || 30

const serverLogSchema = new mongoose.Schema(
  {
    level: { type: String, enum: ['error', 'warn', 'info'], default: 'info' },
    // The [TAG] the line started with, e.g. 'API 8', 'API 3', 'Chassis to RC'
    source: { type: String, trim: true },
    message: { type: String, default: '' },
    // Which backend process wrote it (pm2 instance), handy after a restart
    pid: { type: Number },
    createdAt: { type: Date, default: Date.now }
  },
  { versionKey: false }
)

serverLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: LOG_RETENTION_DAYS * 24 * 60 * 60 })
serverLogSchema.index({ level: 1, createdAt: -1 })
serverLogSchema.index({ source: 1, createdAt: -1 })

module.exports = mongoose.model('ServerLog', serverLogSchema)
module.exports.LOG_RETENTION_DAYS = LOG_RETENTION_DAYS
