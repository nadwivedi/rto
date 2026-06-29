const mongoose = require('mongoose')

const DrivingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  // Personal Information
  applicationType: {
    type: String,
    enum: ['New Application', 'DL Renewal', 'New DL'],
    default: 'New Application'
  },
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
  date: {
    type: String,
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

  // Referral Details
  byName: {
    type: String,
    trim: true,
    default: ''
  },
  byMobile: {
    type: String,
    trim: true,
    default: ''
  },
  // License Information

  licenseClass: {
    type: String,
    required: true,
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
  profit: {
    type: Number,
    default: 0
  },

  // Documents (store file paths or URLs)
  documents: {
    photo: String,
    signature: String,
    aadharCard: String,
    learningLicense: String, 
    learningLicenseType: String, // e.g. application/pdf, image/jpeg
    drivingLicense: String,
    drivingLicenseType: String,
    otherDocument: String,
    otherDocumentType: String
  },
  
}, {
  timestamps: true // Automatically adds createdAt and updatedAt fields
})




const Driving = mongoose.model('Driving', DrivingSchema)

module.exports = Driving
