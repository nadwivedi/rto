const crypto = require('crypto')
const mongoose = require('mongoose')

// A key the admin shares with a customer so their own software can call the vehicle
// info API (/api/v1/vehicle-info). Each key has its own call limit, raised by recording
// sales (ApiKeySale); it never touches the linked user's RC search limit.
const apiKeySchema = new mongoose.Schema(
  {
    // Label shown in the admin panel, e.g. the customer's business name
    name: {
      type: String,
      required: true,
      trim: true
    },
    // Secret sent by the customer with every call
    key: {
      type: String,
      required: true,
      unique: true
    },
    // Optional: the RTO Sarthi user this key belongs to
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },
    // Calls bought so far (sum of the sales)
    callLimit: {
      type: Number,
      default: 0,
      min: 0
    },
    // Calls that returned vehicle details and so used up the limit
    callCount: {
      type: Number,
      default: 0,
      min: 0
    },
    // Switched off keys are refused without calling the provider
    active: {
      type: Boolean,
      default: true
    },
    note: {
      type: String,
      trim: true
    },
    lastUsedAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
)

apiKeySchema.statics.generateKey = () => `rts_${crypto.randomBytes(24).toString('hex')}`

apiKeySchema.virtual('remaining').get(function () {
  return Math.max(0, (this.callLimit || 0) - (this.callCount || 0))
})

module.exports = mongoose.model('ApiKey', apiKeySchema)
