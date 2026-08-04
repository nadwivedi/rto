const mongoose = require('mongoose')

const whatsappSettingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  daysBeforeExpiry: {
    type: Number,
    default: 7
  },
  sendOnExpiryDay: {
    type: Boolean,
    default: true
  },
  enableGracePeriodAlerts: {
    type: Boolean,
    default: false
  },
  gracePeriodDays: {
    type: [Number], // e.g. [7, 15] for sending alerts 7 days and 15 days AFTER expiry
    default: [7, 15]
  },
  alertRules: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  welcomeMessageEnabled: {
    type: Boolean,
    default: false
  },
  welcomeMessageTemplate: {
    type: String,
    default: 'Welcome to RTO Services! We are glad to serve you.'
  },
  welcomeMessageTemplateHi: {
    type: String,
    default: 'आरटीओ सेवाओं में आपका स्वागत है! हम आपकी सेवा करने के लिए तत्पर हैं।'
  },
  autoSendInsurancePolicy: {
    type: Boolean,
    default: false
  },
  insurancePolicyMessageTemplate: {
    type: String,
    default: ''
  },
  maxMessagesPerDay: {
    type: Number,
    default: 30
  },
  maxMessagesPerHour: {
    type: Number,
    default: 5
  },
  messageLanguage: {
    type: String,
    enum: ['english', 'hindi', 'both'],
    default: 'both'
  }
}, {
  timestamps: true
})

module.exports = mongoose.model('WhatsAppSetting', whatsappSettingSchema)
