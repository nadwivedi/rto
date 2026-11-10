// Needs a local MongoDB (uses a throwaway database). Run: node --test tests/
const { test, before, after, beforeEach } = require('node:test')
const assert = require('node:assert/strict')
const mongoose = require('mongoose')
const Fitness = require('../models/Fitness')
const MessageLog = require('../models/MessageLog')
const WhatsAppSetting = require('../models/WhatsAppSetting')
const { checkUserAndQueueAlerts } = require('../jobs/whatsappDailyExpiryChecker')
const { isReminderSuperseded } = require('../utils/expiryAlertSupersede')

const DB = 'mongodb://127.0.0.1:27017/rto_wa_supersede_test'
const uid = new mongoose.Types.ObjectId()

const dmy = (daysFromToday) => {
  const d = new Date()
  d.setDate(d.getDate() + daysFromToday)
  return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`
}
const fitness = (vehicleNumber, validTo, status) => Fitness.collection.insertOne({
  userId: uid, vehicleNumber, validFrom: dmy(-360), validTo, status, mobileNumber: '9876543210', isRenewed: false
})

before(async () => {
  await mongoose.connect(DB, { serverSelectionTimeoutMS: 3000 })
  await mongoose.connection.dropDatabase()
  await MessageLog.syncIndexes()
})
after(async () => {
  await mongoose.connection.dropDatabase()
  await mongoose.disconnect()
})
beforeEach(async () => {
  await Fitness.deleteMany({})
  await MessageLog.deleteMany({})
  await WhatsAppSetting.deleteMany({})
  await WhatsAppSetting.create({ userId: uid })
})

test('expiring record alone gets a reminder', async () => {
  await fitness('CG12AA4793', dmy(5), 'expiring_soon')
  await checkUserAndQueueAlerts(uid.toString())
  assert.equal(await MessageLog.countDocuments({ documentType: 'Fitness' }), 1)
})

test('no reminder when the vehicle also has a newer active record', async () => {
  await fitness('CG12AA4793', dmy(5), 'expiring_soon')
  await fitness('CG 12 AA 4793', dmy(300), 'active')
  await checkUserAndQueueAlerts(uid.toString())
  assert.equal(await MessageLog.countDocuments({ documentType: 'Fitness' }), 0)
})

test('reminder queued earlier is superseded once a newer record is added', async () => {
  const { insertedId } = await fitness('CG12AA4793', dmy(5), 'expiring_soon')
  await checkUserAndQueueAlerts(uid.toString())
  const msg = await MessageLog.findOne({ documentId: insertedId }).lean()
  assert.equal(await isReminderSuperseded(msg), false)
  await fitness('CG12AA4793', dmy(300), 'active')
  assert.equal(await isReminderSuperseded(msg), true)
})

// Tax and Insurance: old expiring / expired record + an active record → no reminder queued
const Tax = require('../models/Tax')
const Insurance = require('../models/Insurance')
for (const [label, Model, dateField] of [['Tax', Tax, 'taxTo'], ['Insurance', Insurance, 'validTo']]) {
  for (const [state, days] of [['expiring soon', 5], ['expired', -3]]) {
    test(`${label}: ${state} record + active record → no reminder`, async () => {
      await Model.deleteMany({})
      await WhatsAppSetting.updateOne({ userId: uid }, { $set: { 'alertRules.tax.sendAfterExpiry': true, 'alertRules.insurance.sendAfterExpiry': true } })
      const base = { userId: uid, mobileNumber: '9876543210', isRenewed: false, policyHolderName: 'A', ownerName: 'A' }
      await Model.collection.insertOne({ ...base, vehicleNumber: 'CG12AA4793', [dateField]: dmy(days), status: days < 0 ? 'expired' : 'expiring_soon' })
      await Model.collection.insertOne({ ...base, vehicleNumber: 'CG12AA4793', [dateField]: dmy(300), status: 'active' })
      await checkUserAndQueueAlerts(uid.toString())
      assert.equal(await MessageLog.countDocuments({ documentType: label }), 0)
    })
  }

  test(`${label}: expiring record alone → reminder queued`, async () => {
    await Model.deleteMany({})
    await Model.collection.insertOne({ userId: uid, mobileNumber: '9876543210', isRenewed: false, vehicleNumber: 'CG12AA4793', [dateField]: dmy(5), status: 'expiring_soon' })
    await checkUserAndQueueAlerts(uid.toString())
    assert.equal(await MessageLog.countDocuments({ documentType: label }), 1)
  })
}
