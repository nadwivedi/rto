const mongoose = require('mongoose')
const MessageLog = require('../models/MessageLog')
require('dotenv').config()

const cleanDuplicates = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/rto'
    console.log(`[CLEANUP] Connecting to MongoDB: ${mongoUri}`)
    await mongoose.connect(mongoUri)
    console.log('[CLEANUP] Connected to MongoDB')

    // Find all MessageLogs that have an alertKey
    const logs = await MessageLog.find({ alertKey: { $exists: true, $ne: null } })
      .sort({ createdAt: -1 })
      .lean()

    console.log(`[CLEANUP] Total logs with alertKey: ${logs.length}`)

    // Group logs by userId, documentId, documentType, alertKey
    const groups = new Map()

    for (const log of logs) {
      const key = `${log.userId.toString()}:${log.documentId.toString()}:${log.documentType}:${log.alertKey}`
      if (!groups.has(key)) {
        groups.set(key, [])
      }
      groups.get(key).push(log)
    }

    let deletedCount = 0
    const toDeleteIds = []

    for (const [key, logList] of groups.entries()) {
      if (logList.length <= 1) continue

      // Priority for keeping:
      // 1. Sent log (latest sent)
      // 2. Pending log (latest pending)
      // 3. Failed log (latest failed)
      // 4. Any latest log

      let winner = logList.find(l => l.status === 'sent')
      if (!winner) {
        winner = logList.find(l => l.status === 'pending')
      }
      if (!winner) {
        winner = logList[0] // since sorted createdAt desc
      }

      for (const log of logList) {
        if (log._id.toString() !== winner._id.toString()) {
          toDeleteIds.push(log._id)
        }
      }
    }

    if (toDeleteIds.length > 0) {
      console.log(`[CLEANUP] Found ${toDeleteIds.length} duplicate MessageLog records to purge.`)
      const res = await MessageLog.deleteMany({ _id: { $in: toDeleteIds } })
      deletedCount = res.deletedCount
      console.log(`[CLEANUP] Successfully deleted ${deletedCount} duplicate MessageLog records.`)
    } else {
      console.log('[CLEANUP] No duplicate MessageLog records found.')
    }

    await mongoose.disconnect()
    console.log('[CLEANUP] Finished and disconnected.')
  } catch (err) {
    console.error('[CLEANUP] Error during cleanup:', err)
    process.exit(1)
  }
}

if (require.main === module) {
  cleanDuplicates()
}

module.exports = cleanDuplicates
