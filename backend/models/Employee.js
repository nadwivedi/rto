const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const employeeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  mobile: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    validate: {
      validator: function(v) {
        return /^[0-9]{10}$/.test(v)
      },
      message: 'Mobile must be 10 digits'
    }
  },
  password: {
    type: String,
    required: true
  },
  permissions: {
    view: {
      type: Boolean,
      default: true
    },
    add: {
      type: Boolean,
      default: false
    },
    edit: {
      type: Boolean,
      default: false
    }
  },
  sections: {
    vehicleRegistration: { type: Boolean, default: true },
    insurance: { type: Boolean, default: true },
    fitness: { type: Boolean, default: true },
    tax: { type: Boolean, default: true },
    greenTax: { type: Boolean, default: true },
    professionalTax: { type: Boolean, default: true },
    puc: { type: Boolean, default: true },
    gps: { type: Boolean, default: true },
    speedGovernor: { type: Boolean, default: true },
    dealerBill: { type: Boolean, default: true },
    party: { type: Boolean, default: true },
    nationalPermit: { type: Boolean, default: true },
    statePermit: { type: Boolean, default: true },
    busPermit: { type: Boolean, default: true },
    temporaryPermit: { type: Boolean, default: true },
    tempPermitOtherState: { type: Boolean, default: true },
    drivingLicense: { type: Boolean, default: true },
    vehicleTransfer: { type: Boolean, default: true },
    noc: { type: Boolean, default: true },
    registrationRenewal: { type: Boolean, default: true },
    hpaHpt: { type: Boolean, default: true },
    kyc: { type: Boolean, default: true },
    javak: { type: Boolean, default: true },
    cashflow: { type: Boolean, default: true }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  lastActivity: {
    type: Date
  },
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  }
}, {
  timestamps: true
})

// Method to compare password
employeeSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password)
  } catch (error) {
    throw error
  }
}

// Pre-save hook to hash password if it's modified (like during creation or update)
employeeSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next()
  
  try {
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error) {
    next(error)
  }
})

module.exports = mongoose.model('Employee', employeeSchema)
