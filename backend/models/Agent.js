const mongoose = require('mongoose')

const agentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  contact: {
    type: String,
    trim: true,
    default: ''
  }
}, {
  timestamps: true
})

// Compound index: unique agent name per user
agentSchema.index({ userId: 1, name: 1 }, { unique: true })

// Text index for searching agent name
agentSchema.index({ name: 'text' })

module.exports = mongoose.model('Agent', agentSchema)
