// Needs a local MongoDB (uses a throwaway database). Run: node --test tests/
process.env.WA_SEND_GAP_MS = '0'
const { test, before, after, beforeEach, mock } = require('node:test')
const assert = require('node:assert/strict')
const path = require('path')
const mongoose = require('mongoose')
const { WaUnavailableError, WaRecipientError } = require('../services/whatsapp/errors')

// Stub the WhatsApp service before the sender loads it.
const stub = {
  canSendResult: { ok: true, reason: 'authenticated' },
  sendImpl: null,
  sent: [],
  canSend: async () => stub.canSendResult,
  sendWhatsAppMessage: async (uid, num, text) => {
    if (stub.sendImpl) return stub.sendImpl(num, text)
    await new Promise(r => setTimeout(r, 20))
    stub.sent.push(num)
    return { messageId: `id-${stub.sent.length}` }
  },
  WaUnavailableError,
  WaRecipientError,
  setReadyHandler: () => {},
  closeIfIdle: () => {},
  config: { idleCloseMs: 60000 },
}
const loggerPath = path.join(__dirname, '..', 'utils', 'whatsappLogger.js')
const noop = () => {}
require.cache[loggerPath] = { id: loggerPath, filename: loggerPath, loaded: true, exports: new Proxy({}, { get: () => noop }) }
const servicePath = path.join(__dirname, '..', 'services', 'whatsappService.js')
require.cache[servicePath] = { id: servicePath, filename: servicePath, loaded: true, exports: stub }

const MessageLog = require('../models/MessageLog')
const WhatsAppSetting = require('../models/WhatsAppSetting')
const { processPendingMessagesForUser, istBoundaries } = require('../jobs/whatsappMessageSender')

const uid = new mongoose.Types.ObjectId()
const DB = 'mongodb://127.0.0.1:27017/rto_wa_sender_test'

before(async () => {
  await mongoose.connect(DB, { serverSelectionTimeoutMS: 3000 })
  await mongoose.connection.dropDatabase()
  await MessageLog.syncIndexes()
  // Pin "now" to 11:00 IST so the 7 AM – 9 PM sending window is open.
  mock.timers.enable({ apis: ['Date'], now: new Date('2026-09-19T05:30:00Z') })
})
after(async () => {
  mock.timers.reset()
  await mongoose.connection.dropDatabase()
  await mongoose.disconnect()
})
beforeEach(async () => {
  await MessageLog.deleteMany({})
  await WhatsAppSetting.deleteMany({})
  await WhatsAppSetting.create({ userId: uid, maxMessagesPerDay: 10, maxMessagesPerHour: 5 })
  stub.canSendResult = { ok: true, reason: 'authenticated' }
  stub.sendImpl = null
  stub.sent = []
})

const queue = (n, extra = {}) => MessageLog.insertMany(Array.from({ length: n }, (_, i) => ({
  userId: uid,
  documentId: new mongoose.Types.ObjectId(),
  documentType: 'Tax',
  targetNumber: `98765000${String(i).padStart(2, '0')}`,
  messageBody: `msg ${i}`,
  alertKey: `k${i}`,
  scheduledFor: new Date(Date.now() - 1000),
  ...extra,
})))

test('IST boundaries', () => {
  const b = istBoundaries(new Date('2026-09-19T20:00:00Z')) // 01:30 IST on the 20th
  assert.equal(b.hourIST, 1)
  assert.equal(b.dayStart.toISOString(), '2026-09-19T18:30:00.000Z')
  assert.equal(b.hourStart.toISOString(), '2026-09-19T19:30:00.000Z')
})

test('concurrent triggers never send the same message twice', async () => {
  await queue(3)
  await Promise.all([
    processPendingMessagesForUser(uid),
    processPendingMessagesForUser(uid),
    processPendingMessagesForUser(uid),
  ])
  assert.equal(stub.sent.length, 3)
  assert.equal(new Set(stub.sent).size, 3)
  assert.equal(await MessageLog.countDocuments({ status: 'sent' }), 3)
})

test('respects the hourly limit', async () => {
  await queue(8)
  await processPendingMessagesForUser(uid)
  assert.equal(stub.sent.length, 5)
  assert.equal(await MessageLog.countDocuments({ status: 'pending' }), 3)
})

test('WhatsApp offline → messages stay pending (not failed), no attempts counted', async () => {
  await queue(3)
  stub.sendImpl = async () => { throw new WaUnavailableError('WhatsApp is not connected right now.') }
  await processPendingMessagesForUser(uid)
  const rows = await MessageLog.find({}).lean()
  assert.ok(rows.every(r => r.status === 'pending'))
  assert.ok(rows.every(r => (r.attempts || 0) === 0))
  assert.equal(rows.filter(r => r.errorReason).length, 1) // batch stops at the first one
})

test('not available (paused / needs QR) → skipped without trying to send', async () => {
  await queue(2)
  stub.canSendResult = { ok: false, reason: 'needs_qr' }
  let called = false
  stub.sendImpl = async () => { called = true }
  await processPendingMessagesForUser(uid)
  assert.equal(called, false)
  assert.equal(await MessageLog.countDocuments({ status: 'pending' }), 2)
})

test('number not on WhatsApp → failed immediately; others still sent', async () => {
  await queue(2)
  stub.sendImpl = async (num) => {
    if (num.endsWith('00')) throw new WaRecipientError(`${num} is not registered on WhatsApp`)
    stub.sent.push(num)
    return { messageId: 'x' }
  }
  await processPendingMessagesForUser(uid)
  assert.equal(await MessageLog.countDocuments({ status: 'failed' }), 1)
  assert.equal(await MessageLog.countDocuments({ status: 'sent' }), 1)
})

test('unexpected error → retried later, failed after 3 attempts', async () => {
  await queue(1)
  stub.sendImpl = async () => { throw new Error('Evaluation failed: something odd') }
  await processPendingMessagesForUser(uid)
  let row = await MessageLog.findOne({}).lean()
  assert.equal(row.status, 'pending')
  assert.equal(row.attempts, 1)
  assert.ok(row.scheduledFor > new Date())

  await MessageLog.updateOne({}, { scheduledFor: new Date(Date.now() - 1000), attempts: 2 })
  await processPendingMessagesForUser(uid)
  row = await MessageLog.findOne({}).lean()
  assert.equal(row.status, 'failed')
  assert.equal(row.attempts, 3)
})

test('outside 7 AM – 9 PM IST nothing is sent', async () => {
  await queue(1)
  mock.timers.setTime(new Date('2026-09-19T17:00:00Z').getTime()) // 22:30 IST
  await processPendingMessagesForUser(uid)
  mock.timers.setTime(new Date('2026-09-19T05:30:00Z').getTime())
  assert.equal(stub.sent.length, 0)
})
