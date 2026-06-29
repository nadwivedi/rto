const mongoose = require('mongoose')
const { Schema } = mongoose

const licenseClassSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
  value: { type: String, required: true },
  label: { type: String, required: true },
  isDefault: { type: Boolean, default: false }
}, { timestamps: true })

licenseClassSchema.index({ userId: 1, value: 1 }, { unique: true })

module.exports = mongoose.model('LicenseClass', licenseClassSchema)
