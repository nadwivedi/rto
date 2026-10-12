// Sets (or changes) the password that opens the admin activity center.
// Usage: npm run set:audit-password
require('dotenv').config()
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const readline = require('readline')
const AuditAccess = require('../models/AuditAccess')
const connectDB = require('../utils/mongodb')

const MIN_LENGTH = 6

// Ask for a value without echoing what is typed
const askHidden = (query) =>
  new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true })
    rl._writeToOutput = (text) => {
      // Show the prompt itself, mask everything typed after it
      if (text.includes(query)) rl.output.write(text)
      else if (text !== '\r\n' && text !== '\n') rl.output.write('*')
    }
    rl.question(query, (answer) => {
      rl.output.write('\n')
      rl.close()
      resolve(answer)
    })
  })

async function setAuditPassword() {
  try {
    await connectDB()

    const password = await askHidden('Enter new activity center password: ')
    if (!password || password.length < MIN_LENGTH) {
      console.log(`Password must be at least ${MIN_LENGTH} characters`)
      process.exitCode = 1
      return
    }

    const confirm = await askHidden('Confirm password: ')
    if (password !== confirm) {
      console.log('Passwords do not match')
      process.exitCode = 1
      return
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const existing = await AuditAccess.findOne({ key: 'activity-center' })
    await AuditAccess.updateOne(
      { key: 'activity-center' },
      { $set: { passwordHash } },
      { upsert: true }
    )
    console.log(existing ? 'Activity center password changed' : 'Activity center password set')
  } catch (err) {
    console.error(err.message)
    process.exitCode = 1
  } finally {
    await mongoose.disconnect()
  }
}

setAuditPassword()
