const mongoose = require('mongoose')
const AdminAlert = require('../models/AdminAlert')
const { recordActivity } = require('../utils/activityLog')

const LIST_LIMIT = 200

// GET /api/admin/alerts?status=open|resolved|all
exports.listAlerts = async (req, res) => {
  try {
    const status = ['open', 'resolved', 'all'].includes(req.query.status) ? req.query.status : 'open'
    const filter = status === 'all' ? {} : { resolved: status === 'resolved' }
    const [alerts, openCount, criticalCount] = await Promise.all([
      AdminAlert.find(filter)
        .sort({ resolved: 1, lastSeenAt: -1 })
        .limit(LIST_LIMIT)
        .populate('lastUserId', 'name email mobile1')
        .lean(),
      AdminAlert.countDocuments({ resolved: false }),
      AdminAlert.countDocuments({ resolved: false, severity: 'critical' })
    ])
    return res.json({ success: true, data: alerts, openCount, criticalCount })
  } catch (error) {
    console.error('Failed to list admin alerts:', error.message)
    return res.status(500).json({ success: false, message: 'Failed to load alerts' })
  }
}

// GET /api/admin/alerts/count - for the sidebar badge
exports.countAlerts = async (req, res) => {
  try {
    const [openCount, criticalCount] = await Promise.all([
      AdminAlert.countDocuments({ resolved: false }),
      AdminAlert.countDocuments({ resolved: false, severity: 'critical' })
    ])
    return res.json({ success: true, openCount, criticalCount })
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to count alerts' })
  }
}

// PATCH /api/admin/alerts/:id/resolve
exports.resolveAlert = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid alert id' })
    }
    const alert = await AdminAlert.findOneAndUpdate(
      { _id: req.params.id, resolved: false },
      { $set: { resolved: true, resolvedAt: new Date(), resolvedBy: req.admin?.email || 'admin' } },
      { new: true }
    )
    if (!alert) return res.status(404).json({ success: false, message: 'Alert not found or already resolved' })
    recordActivity(req, { action: 'update', entity: 'alert', entityId: alert._id, entityName: alert.title, summary: `Resolved alert: ${alert.title}` })
    return res.json({ success: true, data: alert })
  } catch (error) {
    console.error('Failed to resolve admin alert:', error.message)
    return res.status(500).json({ success: false, message: 'Failed to resolve alert' })
  }
}

// PATCH /api/admin/alerts/resolve-all
exports.resolveAllAlerts = async (req, res) => {
  try {
    const result = await AdminAlert.updateMany(
      { resolved: false },
      { $set: { resolved: true, resolvedAt: new Date(), resolvedBy: req.admin?.email || 'admin' } }
    )
    if (result.modifiedCount) {
      recordActivity(req, { action: 'update', entity: 'alert', summary: `Resolved all ${result.modifiedCount} open alerts` })
    }
    return res.json({ success: true, resolved: result.modifiedCount })
  } catch (error) {
    console.error('Failed to resolve admin alerts:', error.message)
    return res.status(500).json({ success: false, message: 'Failed to resolve alerts' })
  }
}
