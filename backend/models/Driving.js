const mongoose = require('mongoose')

const DrivingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  // Personal Information
  name: {
    type: String,
    required: true,
    trim: true
  },
  dateOfBirth: {
    type: Date,
    required: true
  },
  gender: {
    type: String,
    required: true,
    enum: ['Male', 'Female', 'Other']
  },
  fatherName: {
    type: String,
    required: true,
    trim: true
  },

  // Contact Information
  mobileNumber: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    lowercase: true,
    trim: true
  },
  address: {
    type: String,
    required: true,
    trim: true
  },

  // License Information

  licenseClass: {
    type: String,
    required: true,
    enum: ['MCWG', 'LMV', 'MCWG+LMV', 'HMV', 'Commercial', 'Transport'],
    // MCWG = Two Wheeler, LMV = Light Motor Vehicle (Four Wheeler)
  },

  // Driving License Details
  LicenseNumber: {
    type: String,
    trim: true,
    unique: true,
    sparse: true
  },
  LicenseIssueDate: {
    type: Date
  },
  LicenseExpiryDate: {
    type: Date
  },

  // Learning License Details
  learningLicenseApplicationNumber: {
    type: String,
    trim: true
  },
  learningLicenseNumber: {
    type: String,
    trim: true
  },
  learningLicenseIssueDate: {
    type: Date
  },
  learningLicenseExpiryDate: {
    type: Date
  },

  // Payment Information
  totalAmount: {
    type: Number,
    required: true,
    default: 0
  },
  paidAmount: {
    type: Number,
    required: true,
    default: 0
  },
  balanceAmount: {
    type: Number,
    required: true,
    default: 0
  },



  // Documents (store file paths or URLs)
  documents: {
    photo: String,
    signature: String,
    aadharCard: String,
    learningLicense: String, 
    learningLicenseType: String // e.g. application/pdf, image/jpeg
  },
  
}, {
  timestamps: true // Automatically adds createdAt and updatedAt fields
})




const Driving = mongoose.model('Driving', DrivingSchema)

module.exports = Driving
