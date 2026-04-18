const mongoose = require('mongoose')

const javakSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  date: {
    type: String, // Format: YYYY-MM-DD for easy grouping and sorting
    required: true,
    index: true
  },
  vehicleNo: {
    type: String,
    trim: true,
    uppercase: true
  },
  partyName: {
    type: String,
    trim: true,
    uppercase: true,
    required: true
  },
  purpose: {
    type: String,
    trim: true
  },
  remark: {
    type: String,
    trim: true
  },
  isWorkDone: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
})

module.exports = mongoose.model('Javak', javakSchema)
