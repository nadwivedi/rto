const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

// Single document holding the hashed password that opens the activity center.
// Set it with: npm run set:audit-password
const auditAccessSchema = new mongoose.Schema({
  key: {
    type: String,
    default: 'activity-center',
    unique: true
  },
  passwordHash: {
    type: String,
    required: true
  }
}, {
  timestamps: true
})

auditAccessSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash)
}

module.exports = mongoose.model('AuditAccess', auditAccessSchema, 'audit_access')
