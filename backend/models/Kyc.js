const mongoose = require('mongoose')

const kycSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  clientName: {
    type: String,
    required: true,
    trim: true
  },
  documentType: {
    type: String,
    enum: ['Aadhar', 'PAN', 'GST', 'Other'],
    required: true
  },
  documentNumber: {
    type: String,
    trim: true
  },
  // If documentType is Aadhar, store front and back
  aadharFront: {
    type: String, // Path or url
    trim: true
  },
  aadharBack: {
    type: String, // Path or url
    trim: true
  },
  // If PAN, GST, or Other, store in documentFile
  documentFile: {
    type: String, // Path or url
    trim: true
  },
  remarks: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
})

// Index for searching clientName and documentNumber
kycSchema.index({ clientName: 'text', documentNumber: 'text' })

module.exports = mongoose.model('Kyc', kycSchema)
