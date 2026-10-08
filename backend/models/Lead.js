const mongoose = require('mongoose')

const LEAD_TYPES = ['Permit', 'Tax', 'Fitness', 'PUC', 'Insurance']
const LEAD_PRIORITIES = ['hot', 'warm', 'cold']
const OPEN_STATUSES = ['new', 'in_progress', 'call_back', 'not_connected', 'waiting_quotation', 'quotation_sent']
const CLOSED_STATUSES = ['converted', 'lost']

// Dates are stored as 'YYYY-MM-DD' strings so "today / overdue / upcoming" can be
// compared as plain strings against the user's local date, with no timezone drift.
const followUpSchema = new mongoose.Schema({
  date: { type: String, required: true },
  note: { type: String, trim: true, default: '' },
  outcome: { type: String, trim: true, default: '' },
  nextFollowUpDate: { type: String, default: '' },
  nextFollowUpTime: { type: String, default: '' }
}, { timestamps: true })

// One document of the vehicle with its expiry date ('YYYY-MM-DD')
const leadDocumentSchema = new mongoose.Schema({
  type: { type: String, enum: LEAD_TYPES, required: true },
  expiryDate: { type: String, default: '' }
}, { _id: false })

const leadSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: { type: String, trim: true, required: true },
  mobile: { type: String, trim: true, default: '' },
  email: { type: String, trim: true, lowercase: true, default: '' },
  city: { type: String, trim: true, default: '' },
  vehicleNumber: { type: String, trim: true, uppercase: true, default: '' },
  // What the lead wants done
  leadType: { type: String, enum: LEAD_TYPES, required: true },
  // Expiry date of the customer's current permit / tax / fitness / PUC / insurance
  expiryDate: { type: String, default: '' },
  // Leads moved from RC search carry the expiry of every document of the vehicle, so the
  // lead can show e.g. "Insurance expired, PUC expired". Empty for leads added by hand.
  documents: { type: [leadDocumentSchema], default: [] },
  expectedAmount: { type: Number, default: null },
  source: { type: String, trim: true, default: '' },
  priority: { type: String, enum: LEAD_PRIORITIES, default: 'warm' },
  notes: { type: String, trim: true, default: '' },
  status: {
    type: String,
    enum: [...OPEN_STATUSES, ...CLOSED_STATUSES],
    default: 'new',
    index: true
  },
  nextFollowUpDate: { type: String, default: '', index: true },
  // Optional 'HH:MM' (24h); empty means any time that day.
  nextFollowUpTime: { type: String, default: '' },
  lostReason: { type: String, trim: true, default: '' },
  statusChangedAt: { type: Date, default: null },
  followUps: { type: [followUpSchema], default: [] }
}, {
  timestamps: true
})

leadSchema.index({ userId: 1, status: 1, nextFollowUpDate: 1 })

module.exports = mongoose.model('Lead', leadSchema)
module.exports.LEAD_TYPES = LEAD_TYPES
module.exports.LEAD_PRIORITIES = LEAD_PRIORITIES
module.exports.OPEN_STATUSES = OPEN_STATUSES
module.exports.CLOSED_STATUSES = CLOSED_STATUSES
