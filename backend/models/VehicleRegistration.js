const mongoose = require('mongoose')

const vehicleRegistrationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  partyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Party',
    index: true
  },
  registrationNumber: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
  },
  dateOfRegistration: {
    type: String
  },
  chassisNumber: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
  },
  engineNumber: {
    type: String,
    uppercase: true,
    trim: true
  },
  ownerName: {
    type: String,
    trim: true
  },
  sonWifeDaughterOf: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  mobileNumber: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  subPartyName: {
    type: String,
    trim: true
  },
  subPartyMobile: {
    type: String,
    trim: true
  },
  makerName: {
    type: String,
    trim: true
  },
  makerModel: {
    type: String,
    trim: true
  },
  colour: {
    type: String,
    trim: true
  },
  seatingCapacity: {
    type: Number
  },
  vehicleClass: {
    type: String,
    trim: true
  },
  vehicleType: {
    type: String,
    trim: true
  },
  ladenWeight: {
    type: Number
  },
  unladenWeight: {
    type: Number
  },
  manufactureYear: {
    type: Number
  },
  vehicleCategory: {
    type: String,
    trim: true
  },
  rcImage: {
    type: String,
    trim: true
  },
  aadharImage: {
    type: String,
    trim: true
  },
  panImage: {
    type: String,
    trim: true
  },
  speedGovernorImage: {
    type: String,
    trim: true
  },
  numberOfCylinders: {
    type: Number
  },
  cubicCapacity: {
    type: Number
  },
  fuelType: {
    type: String,
    trim: true
  },
  bodyType: {
    type: String,
    trim: true
  },
  wheelBase: {
    type: Number
  }
}, {
  timestamps: true
})

// Compound index: Each user can have unique registration numbers
vehicleRegistrationSchema.index({ userId: 1, registrationNumber: 1 }, { unique: true })

module.exports = mongoose.model('VehicleRegistration', vehicleRegistrationSchema)
