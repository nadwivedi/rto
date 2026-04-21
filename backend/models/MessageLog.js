const mongoose = require('mongoose')

const messageLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },
  documentType: {
    type: String,
    enum: ['Tax', 'Fitness', 'Puc', 'Gps', 'Insurance', 'NationalPermit', 'CgPermit', 'BusPermit'],
    required: true
  },
  targetNumber: {
    type: String,
    required: true,
    trim: true
  },
  ownerName: {
    type: String,
    trim: true
  },
  messageBody: {
    type: String,
    required: true
  },
  alertKey: {
    type: String,
    trim: true,
    index: true
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'failed'],
    default: 'pending',
    index: true
  },
  scheduledFor: {
    type: Date,
    required: true,
    index: true
  },
  sentAt: {
    type: Date
  },
  errorReason: {
    type: String
  },
  whatsappMessageId: {
    type: String
  }
}, {
  timestamps: true
})

// Index for grabbing pending messages scheduled for past/present
messageLogSchema.index({ status: 1, scheduledFor: 1 })
// Index for checking how many sent today
messageLogSchema.index({ status: 1, sentAt: 1 })

module.exports = mongoose.model('MessageLog', messageLogSchema)
