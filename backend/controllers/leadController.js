const Lead = require('../models/Lead')
const { LEAD_TYPES, LEAD_PRIORITIES, OPEN_STATUSES, CLOSED_STATUSES } = Lead

const ALL_STATUSES = [...OPEN_STATUSES, ...CLOSED_STATUSES]
const BUCKETS = ['today', 'overdue', 'new', 'upcoming', 'open', 'converted', 'lost', 'all']
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// The client sends its local date so "today" matches the user's calendar, not the server's.
const resolveToday = (value) => (DATE_RE.test(value || '') ? value : new Date().toISOString().slice(0, 10))
const cleanDate = (value) => (DATE_RE.test(value || '') ? value : '')
const cleanTime = (value) => (/^([01]\d|2[0-3]):[0-5]\d$/.test(value || '') ? value : '')

const bucketFilter = (bucket, today) => {
  switch (bucket) {
    case 'today':
      return { status: { $in: OPEN_STATUSES }, nextFollowUpDate: today }
    case 'overdue':
      return { status: { $in: OPEN_STATUSES }, nextFollowUpDate: { $ne: '', $lt: today } }
    case 'upcoming':
      return { status: { $in: OPEN_STATUSES }, nextFollowUpDate: { $gt: today } }
    case 'new':
      return { status: 'new' }
    case 'converted':
      return { status: 'converted' }
    case 'lost':
      return { status: 'lost' }
    case 'open':
      return { status: { $in: OPEN_STATUSES } }
    default:
      return {}
  }
}

const pickLeadFields = (body) => {
  const amount = body.expectedAmount === '' || body.expectedAmount == null ? null : Number(body.expectedAmount)
  return {
    name: String(body.name || '').trim(),
    mobile: String(body.mobile || '').trim(),
    email: String(body.email || '').trim(),
    city: String(body.city || '').trim(),
    vehicleNumber: String(body.vehicleNumber || '').trim(),
    leadType: String(body.leadType || '').trim(),
    expiryDate: cleanDate(body.expiryDate),
    expectedAmount: Number.isFinite(amount) ? amount : null,
    source: String(body.source || '').trim(),
    priority: LEAD_PRIORITIES.includes(body.priority) ? body.priority : 'warm',
    notes: String(body.notes || '').trim(),
    nextFollowUpDate: cleanDate(body.nextFollowUpDate),
    nextFollowUpTime: cleanDate(body.nextFollowUpDate) ? cleanTime(body.nextFollowUpTime) : ''
  }
}

// Returns a message when the lead can't be saved, otherwise null
const validateLeadFields = (fields) => {
  if (!fields.name) return 'Lead name is required'
  if (!LEAD_TYPES.includes(fields.leadType)) return 'Please choose what the lead is for'
  if (fields.mobile && !/^[0-9]{10}$/.test(fields.mobile)) return 'Mobile number must be 10 digits'
  return null
}

// Leads moved from RC search list every document of the vehicle. The edit form only shows the
// expiry of the document the lead is for, so keep that entry in step with what was saved.
const syncPrimaryDocument = (lead) => {
  if (!lead.documents.length) return
  const others = lead.documents.filter(doc => doc.type !== lead.leadType)
  lead.documents = lead.expiryDate
    ? [...others, { type: lead.leadType, expiryDate: lead.expiryDate }]
    : others
}

const sendError = (res, error, fallbackMessage) => {
  if (error.name === 'CastError') {
    return res.status(400).json({ success: false, message: 'Invalid lead id' })
  }
  if (error.name === 'ValidationError') {
    const message = Object.values(error.errors).map(e => e.message).join(', ')
    return res.status(400).json({ success: false, message })
  }
  res.status(500).json({ success: false, message: fallbackMessage })
}

// Get leads for a tab (bucket) plus the counts shown on every tab
exports.getLeads = async (req, res) => {
  try {
    const today = resolveToday(req.query.today)
    const bucket = BUCKETS.includes(req.query.bucket) ? req.query.bucket : 'today'

    // Type / priority / source / created date / search narrow both the list and the tab counts.
    const base = { userId: req.user.id }
    if (LEAD_TYPES.includes(req.query.type)) base.leadType = req.query.type
    if (LEAD_PRIORITIES.includes(req.query.priority)) base.priority = req.query.priority
    if (req.query.source) base.source = String(req.query.source)
    // Created-date range: the client sends ISO timestamps for its local start/end of day.
    const createdFrom = req.query.createdFrom ? new Date(req.query.createdFrom) : null
    const createdTo = req.query.createdTo ? new Date(req.query.createdTo) : null
    if ((createdFrom && !isNaN(createdFrom)) || (createdTo && !isNaN(createdTo))) {
      base.createdAt = {}
      if (createdFrom && !isNaN(createdFrom)) base.createdAt.$gte = createdFrom
      if (createdTo && !isNaN(createdTo)) base.createdAt.$lte = createdTo
    }
    const search = String(req.query.search || '').trim()
    if (search) {
      const rx = { $regex: escapeRegex(search), $options: 'i' }
      base.$or = [{ name: rx }, { mobile: rx }, { vehicleNumber: rx }, { city: rx }]
    }

    // Status narrows only the list (it would otherwise zero out the other tabs).
    const conditions = [bucketFilter(bucket, today)]
    if (ALL_STATUSES.includes(req.query.status)) conditions.push({ status: req.query.status })
    const filter = { ...base, $and: conditions }

    let sort = { nextFollowUpDate: 1, nextFollowUpTime: 1, createdAt: -1 }
    if (bucket === 'new') sort = { createdAt: -1 }
    if (bucket === 'converted' || bucket === 'lost') sort = { statusChangedAt: -1, updatedAt: -1 }

    const [leads, ...counts] = await Promise.all([
      Lead.find(filter).sort(sort).limit(1000).lean(),
      ...BUCKETS.map(b => Lead.countDocuments({ ...base, ...bucketFilter(b, today) }))
    ])

    res.status(200).json({
      success: true,
      data: leads,
      counts: Object.fromEntries(BUCKETS.map((b, i) => [b, counts[i]]))
    })
  } catch (error) {
    console.error('Error fetching leads:', error)
    res.status(500).json({ success: false, message: 'Failed to fetch leads' })
  }
}

// Get a single lead
exports.getLead = async (req, res) => {
  try {
    const lead = await Lead.findOne({ _id: req.params.id, userId: req.user.id }).lean()
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' })
    res.status(200).json({ success: true, data: lead })
  } catch (error) {
    console.error('Error fetching lead:', error)
    sendError(res, error, 'Failed to fetch lead')
  }
}

// Create a new lead
exports.createLead = async (req, res) => {
  try {
    const fields = pickLeadFields(req.body)
    const invalid = validateLeadFields(fields)
    if (invalid) return res.status(400).json({ success: false, message: invalid })

    const status = ALL_STATUSES.includes(req.body.status) ? req.body.status : 'new'
    const closed = CLOSED_STATUSES.includes(status)
    const lead = await Lead.create({
      ...fields,
      ...(closed ? { nextFollowUpDate: '', nextFollowUpTime: '' } : {}),
      userId: req.user.id,
      status,
      statusChangedAt: status === 'new' ? null : new Date()
    })
    res.status(201).json({ success: true, data: lead })
  } catch (error) {
    console.error('Error creating lead:', error)
    sendError(res, error, 'Failed to create lead')
  }
}

// Update lead details
exports.updateLead = async (req, res) => {
  try {
    const fields = pickLeadFields(req.body)
    const invalid = validateLeadFields(fields)
    if (invalid) return res.status(400).json({ success: false, message: invalid })

    const existing = await Lead.findOne({ _id: req.params.id, userId: req.user.id })
    if (!existing) return res.status(404).json({ success: false, message: 'Lead not found' })

    Object.assign(existing, fields)
    syncPrimaryDocument(existing)
    if (ALL_STATUSES.includes(req.body.status) && req.body.status !== existing.status) {
      existing.status = req.body.status
      existing.statusChangedAt = new Date()
    }
    if (CLOSED_STATUSES.includes(existing.status)) {
      existing.nextFollowUpDate = ''
      existing.nextFollowUpTime = ''
    }
    if (existing.status !== 'lost') existing.lostReason = ''
    await existing.save()
    res.status(200).json({ success: true, data: existing })
  } catch (error) {
    console.error('Error updating lead:', error)
    sendError(res, error, 'Failed to update lead')
  }
}

// Log a follow-up call/visit and schedule the next one
exports.addFollowUp = async (req, res) => {
  try {
    const lead = await Lead.findOne({ _id: req.params.id, userId: req.user.id })
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' })

    const date = cleanDate(req.body.date) || resolveToday(req.body.today)
    const newStatus = ALL_STATUSES.includes(req.body.status) ? req.body.status : null
    const closing = newStatus && CLOSED_STATUSES.includes(newStatus)
    const nextFollowUpDate = closing ? '' : cleanDate(req.body.nextFollowUpDate)
    const nextFollowUpTime = nextFollowUpDate ? cleanTime(req.body.nextFollowUpTime) : ''

    lead.followUps.push({
      date,
      note: String(req.body.note || '').trim(),
      outcome: String(req.body.outcome || '').trim(),
      nextFollowUpDate,
      nextFollowUpTime
    })
    lead.nextFollowUpDate = nextFollowUpDate
    lead.nextFollowUpTime = nextFollowUpTime
    const targetStatus = newStatus || (lead.status === 'new' ? 'in_progress' : lead.status)
    if (targetStatus !== lead.status) {
      lead.status = targetStatus
      lead.statusChangedAt = new Date()
    }
    if (targetStatus === 'lost' && req.body.lostReason) lead.lostReason = String(req.body.lostReason).trim()
    if (targetStatus !== 'lost') lead.lostReason = ''
    await lead.save()
    res.status(200).json({ success: true, data: lead })
  } catch (error) {
    console.error('Error logging follow-up:', error)
    sendError(res, error, 'Failed to log follow-up')
  }
}

// Change only the status (converted and lost also clear the next follow-up)
exports.updateLeadStatus = async (req, res) => {
  try {
    const { status, lostReason } = req.body
    if (!ALL_STATUSES.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' })
    }
    const update = { status, statusChangedAt: new Date() }
    update.lostReason = status === 'lost' ? String(lostReason || '').trim() : ''
    if (CLOSED_STATUSES.includes(status)) {
      update.nextFollowUpDate = ''
      update.nextFollowUpTime = ''
    }

    const lead = await Lead.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { $set: update },
      { new: true }
    )
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' })
    res.status(200).json({ success: true, data: lead })
  } catch (error) {
    console.error('Error updating lead status:', error)
    sendError(res, error, 'Failed to update lead status')
  }
}

// Delete lead
exports.deleteLead = async (req, res) => {
  try {
    const result = await Lead.deleteOne({ _id: req.params.id, userId: req.user.id })
    if (!result.deletedCount) return res.status(404).json({ success: false, message: 'Lead not found' })
    res.status(200).json({ success: true, message: 'Lead deleted' })
  } catch (error) {
    console.error('Error deleting lead:', error)
    sendError(res, error, 'Failed to delete lead')
  }
}
