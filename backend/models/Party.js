const mongoose = require('mongoose')

const partySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  partyName: {
    type: String,
    required: true,
    trim: true
  },
  sonWifeDaughterOf: {
    type: String,
    trim: true
  },
  mobile: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  address: {
    type: String,
    trim: true
  },
  welcomeMessageSent: {
    type: Boolean,
    default: false
  },
  welcomeMessageSentAt: {
    type: Date
  }
}, {
  timestamps: true
})

// Compound index: unique party name per user
partySchema.index({ userId: 1, partyName: 1 }, { unique: true })

// Text index for searching party name
partySchema.index({ partyName: 'text' })

module.exports = mongoose.model('Party', partySchema)
