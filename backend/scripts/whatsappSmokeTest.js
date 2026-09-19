// Real-connection smoke test for the WhatsApp system (Baileys). Safe to run on the VPS next to
// the live server: logins are written to a separate throwaway database (rto_wa_smoke) that is
// dropped afterwards; no real sessions are touched.
//
//   node scripts/whatsappSmokeTest.js                                   (mongodb://127.0.0.1:27017)
//   SMOKE_MONGO_URL=mongodb://host:27017 node scripts/whatsappSmokeTest.js
//
// Checks:
//  1. Connecting to WhatsApp produces a QR code (user connect) and how much RAM that takes
//  2. Cancel closes the connection and frees the session slot
//  3. Background start with an invalid saved login → "needs_qr", no QR shown, no retry loop
const mongoose = require('mongoose')
const QRCode = require('qrcode')
const config = require('../services/whatsapp/config')
const { WhatsAppManager } = require('../services/whatsapp/WhatsAppManager')
const { loadBaileys } = require('../services/whatsapp/baileysClient')
const { profile, useMongoAuthState } = require('../services/whatsapp/mongoAuthState')
const createClient = require('../services/whatsapp/createClient')

const MONGO = (process.env.SMOKE_MONGO_URL || 'mongodb://127.0.0.1:27017').replace(/\/+$/, '') + '/rto_wa_smoke'

const db = new Map()
const log = {
  info: (u, e, msg) => console.log(`  [info] ${e} ${msg || ''}`),
  warn: (u, e, msg) => console.log(`  [warn] ${e} ${msg || ''}`),
  error: (u, e, msg) => console.log(`  [error] ${e} ${msg || ''}`),
}
const manager = new WhatsAppManager({
  config,
  store: {
    load: async (id) => db.get(id) || null,
    list: async () => [],
    save: async (id, d) => db.set(id, { ...(db.get(id) || {}), ...d }),
  },
  profile,
  createClient,
  log,
  toQrDataUrl: (qr) => QRCode.toDataURL(qr, { width: 300, margin: 1 }),
})

const sleep = (ms) => new Promise(r => setTimeout(r, ms))
const rssMb = () => Math.round(process.memoryUsage().rss / 1024 / 1024)
async function waitFor(fn, ms, label) {
  const end = Date.now() + ms
  while (Date.now() < end) {
    const v = await fn()
    if (v) return v
    await sleep(250)
  }
  throw new Error(`Timed out waiting for: ${label}`)
}

let failed = false
function check(cond, label) {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${label}`)
  if (!cond) failed = true
}

;(async () => {
  await mongoose.connect(MONGO, { serverSelectionTimeoutMS: 5000 })
  await mongoose.connection.dropDatabase()
  await loadBaileys() // load the library first so the RAM figure below is the connection only
  const before = rssMb()

  // 1. user connect → QR
  const t0 = Date.now()
  await manager.connect('smoke1')
  const st = await waitFor(async () => {
    const s = await manager.getStatus('smoke1', { watching: true })
    if (s.lastError && !s.isInitializing && s.status !== 'qr_ready') throw new Error(s.lastError)
    return s.status === 'qr_ready' && s.qrCodeDataUrl ? s : null
  }, 90000, 'QR code')
  check(st.qrCodeDataUrl.startsWith('data:image/png;base64,'), `QR code produced in ${((Date.now() - t0) / 1000).toFixed(1)}s`)
  await sleep(3000)
  const during = rssMb()
  console.log(`      RAM: whole Node process ${during} MB (with library loaded: ${before} MB, connection adds ~${Math.max(0, during - before)} MB)`)

  // 2. cancel → connection closed, slot free
  await manager.cancel('smoke1')
  const afterCancel = await manager.getStatus('smoke1')
  check(afterCancel.status === 'needs_qr' && manager.launchSlots.active === 0, 'Cancel closed the connection and freed the session slot')

  // 3. background start with a fake "saved" login → rejected by WhatsApp → needs_qr, no QR
  const fake = await useMongoAuthState('user_smoke2', await loadBaileys())
  fake.state.creds.me = { id: '910000000001:1@s.whatsapp.net', name: 'smoke' }
  fake.state.creds.registered = true
  await fake.saveCreds()
  await manager.ensureRunning('smoke2', 'smoke-test')
  const st2 = await waitFor(async () => {
    const s = await manager.getStatus('smoke2')
    return !s.isInitializing ? s : null
  }, 90000, 'background start result')
  check(st2.status === 'needs_qr', `Background start with invalid login → ${st2.status}${st2.lastError ? ` (${st2.lastError})` : ''}`)
  check(st2.qrCodeDataUrl === null, 'No QR shown for a background start')
  check(manager.launchSlots.active === 0, 'Connection closed and slot freed after the failure')
  check(!profile.hasSavedSession('user_smoke2'), 'Invalid login removed from the database')
})()
  .catch(err => { console.error('FAIL ', err.message); failed = true })
  .finally(async () => {
    await manager.shutdown().catch(() => {})
    await mongoose.connection.dropDatabase().catch(() => {})
    await mongoose.disconnect().catch(() => {})
    console.log(failed ? '\nSMOKE TEST FAILED' : '\nSMOKE TEST PASSED')
    process.exit(failed ? 1 : 0)
  })
