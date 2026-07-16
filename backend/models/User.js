const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  mobile1: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    validate: {
      validator: function(v) {
        return /^[0-9]{10}$/.test(v)
      },
      message: 'Mobile 1 must be 10 digits'
    }
  },
  mobile2: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        if (!v) return true
        return /^[0-9]{10}$/.test(v)
      },
      message: 'Mobile 2 must be 10 digits'
    }
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    sparse: true,
    validate: {
      validator: function(v) {
        if (!v) return true
        return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(v)
      },
      message: 'Please enter a valid email'
    }
  },
  address: {
    type: String,
    trim: true
  },
  state: {
    type: String,
    required: true,
    trim: true,
    uppercase: true
  },
  rto: {
    type: String,
    required: true,
    trim: true,
    uppercase: true
  },
  billName: {
    type: String,
    trim: true
  },
  billDescription: {
    type: String,
    trim: true
  },
  password: {
    type: String,
    required: true
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
  subscriptionExpiresAt: {
    type: Date
  },
  monthlyPrice: {
    type: Number,
    min: 0
  },
  features: {
    greenTax: { type: Boolean, default: false },
    professionalTax: { type: Boolean, default: false },
    autoCreateRC: { type: Boolean, default: false },
    expandAdditionalDetails: { type: Boolean, default: false }
  }
}, {
  timestamps: true
})

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password)
  } catch (error) {
    throw error
  }
}

module.exports = mongoose.model('User', userSchema)
