// Real-browser smoke test for the WhatsApp system. Safe to run on the VPS next to the live
// server: it uses a temporary auth folder and an in-memory store (no DB, no real sessions touched).
//
//   node scripts/whatsappSmokeTest.js
//
// Checks:
//  1. Chrome launches and WhatsApp Web loads → a QR code is produced (user connect)
//  2. Cancel closes Chrome completely (no leftover processes)
//  3. Background start with an invalid saved login → "needs_qr", Chrome closed, no QR shown
const fs = require('fs')
const os = require('os')
const path = require('path')

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'wa-smoke-'))
process.env.WHATSAPP_AUTH_DIR = tmp

const QRCode = require('qrcode')
const config = require('../services/whatsapp/config')
const chrome = require('../services/whatsapp/chromeProcess')
const { WhatsAppManager } = require('../services/whatsapp/WhatsAppManager')

const createClient = require('../services/whatsapp/createClient')

const db = new Map()
const log = {
  info: (u, e, msg) => console.log(`  [info] ${e} ${msg || ''}`),
  warn: (u, e, msg) => console.log(`  [warn] ${e} ${msg || ''}`),
  error: (u, e, msg) => console.log(`  [error] ${e} ${msg || ''}`),
}
const manager = new WhatsAppManager({
  config: { ...config, authDir: tmp },
  store: {
    load: async (id) => db.get(id) || null,
    list: async () => [],
    save: async (id, d) => db.set(id, { ...(db.get(id) || {}), ...d }),
  },
  chrome,
  createClient,
  log,
  toQrDataUrl: (qr) => QRCode.toDataURL(qr, { width: 300, margin: 1 }),
})

const sleep = (ms) => new Promise(r => setTimeout(r, ms))
async function waitFor(fn, ms, label) {
  const end = Date.now() + ms
  while (Date.now() < end) {
    const v = await fn()
    if (v) return v
    await sleep(500)
  }
  throw new Error(`Timed out waiting for: ${label}`)
}

let failed = false
function check(cond, label) {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${label}`)
  if (!cond) failed = true
}

;(async () => {
  console.log(`Auth dir: ${tmp}\nUser agent: ${config.userAgent}\n`)

  // 1. user connect → QR
  const t0 = Date.now()
  await manager.connect('smoke1')
  const st = await waitFor(async () => {
    const s = await manager.getStatus('smoke1', { watching: true })
    if (s.lastError && !s.isInitializing && s.status !== 'qr_ready') throw new Error(s.lastError)
    return s.status === 'qr_ready' && s.qrCodeDataUrl ? s : null
  }, 240000, 'QR code')
  check(st.qrCodeDataUrl.startsWith('data:image/png;base64,'), `QR code produced in ${Math.round((Date.now() - t0) / 1000)}s`)
  const pid = manager.getChromePid('smoke1')
  check(!!pid, `Chrome running (pid ${pid})`)

  // 2. cancel → Chrome gone
  await manager.cancel('smoke1')
  await sleep(1500)
  const left = chrome.findChromePidsUsingDir(path.join(tmp, 'session-user_smoke1'))
  check(left.length === 0 && !chrome.isPidAlive(pid), 'Cancel closed Chrome completely')
  check((await manager.getStatus('smoke1')).status === 'needs_qr', 'State after cancel: needs_qr (no saved login)')

  // 3. background start with a fake/invalid saved login → needs_qr, no QR exposed
  const fakeLogin = path.join(tmp, 'session-user_smoke2', 'Default', 'IndexedDB', 'https_web.whatsapp.com_0.indexeddb.leveldb')
  fs.mkdirSync(fakeLogin, { recursive: true })
  chrome.markLinked(path.join(tmp, 'session-user_smoke2'))
  await manager.ensureRunning('smoke2', 'smoke-test')
  const st2 = await waitFor(async () => {
    const s = await manager.getStatus('smoke2')
    return ['needs_qr', 'disconnected'].includes(s.status) && !s.isInitializing ? s : null
  }, 240000, 'background start result')
  check(st2.status === 'needs_qr', `Background start with invalid login → ${st2.status}`)
  check(st2.qrCodeDataUrl === null, 'No QR shown for a background start')
  await sleep(1500)
  check(chrome.findChromePidsUsingDir(path.join(tmp, 'session-user_smoke2')).length === 0, 'Chrome closed after background failure')

  await manager.shutdown()
})()
  .catch(err => { console.error('FAIL ', err.message); failed = true })
  .finally(async () => {
    await manager.shutdown().catch(() => {})
    fs.rmSync(tmp, { recursive: true, force: true, maxRetries: 5, retryDelay: 500 })
    console.log(failed ? '\nSMOKE TEST FAILED' : '\nSMOKE TEST PASSED')
    process.exit(failed ? 1 : 0)
  })
