const AdminAlert = require('../models/AdminAlert')

/**
 * Raise (or bump) an admin alert. While an alert with this key is open, a repeat only raises
 * its count and updates the last-seen details. Never throws - an alert must not break a lookup.
 */
const raiseAlert = async ({ key, severity = 'critical', source, code, title, message, vehicleNumber, userId, via }) => {
  const now = new Date()
  const set = { severity, title, message, lastSeenAt: now }
  if (source) set.source = source
  if (code) set.code = code
  if (vehicleNumber) set.lastVehicleNumber = vehicleNumber
  if (userId) set.lastUserId = userId
  if (via) set.lastVia = via

  const update = { $set: set, $inc: { count: 1 }, $setOnInsert: { key, firstSeenAt: now, resolved: false } }
  try {
    await AdminAlert.findOneAndUpdate({ key, resolved: false }, update, { upsert: true })
  } catch (err) {
    // Two lookups opening the same alert at once: the second one just bumps it
    if (err?.code === 11000) {
      await AdminAlert.updateOne({ key, resolved: false }, { $set: set, $inc: { count: 1 } }).catch(() => {})
    } else {
      console.error('Failed to raise admin alert:', err.message)
    }
  }
}

// Close open alerts whose key starts with `prefix` because the problem went away. Never throws.
const autoResolveAlerts = async (prefix) => {
  try {
    const escaped = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    await AdminAlert.updateMany(
      { resolved: false, key: { $regex: `^${escaped}` } },
      { $set: { resolved: true, resolvedAt: new Date(), resolvedBy: 'auto' } }
    )
  } catch (err) {
    console.error('Failed to auto-resolve admin alerts:', err.message)
  }
}

module.exports = { raiseAlert, autoResolveAlerts }
