// Run: node --test tests/
const { test, beforeEach } = require('node:test')
const assert = require('node:assert/strict')
const { EventEmitter } = require('events')
const { WhatsAppManager } = require('../services/whatsapp/WhatsAppManager')
const { STATE } = require('../services/whatsapp/WhatsAppSession')
const { WaUnavailableError, WaRecipientError } = require('../services/whatsapp/errors')

const tick = (ms = 5) => new Promise(r => setTimeout(r, ms))
async function until(fn, ms = 2000) {
  const end = Date.now() + ms
  while (Date.now() < end) {
    if (await fn()) return
    await tick(5)
  }
  throw new Error('condition not met in time')
}

// Behaves like whatsapp-web.js Client: initialize() launches the "browser", then the test
// drives the WhatsApp side by emitting qr / authenticated / ready / disconnected.
class FakeClient extends EventEmitter {
  constructor(env) {
    super()
    this.env = env
    this.destroyed = false
    this.loggedOut = false
    this.sent = []
    this.waState = 'CONNECTED'
    this.browser = new EventEmitter()
    this.browser.isConnected = () => !this.destroyed
    this.browser.process = () => ({ pid: 4242 })
    this.pupBrowser = null
    this.pupPage = new EventEmitter()
    this.info = { wid: { user: '919876543210' } }
    env.clients.push(this)
  }
  async initialize() {
    this.pupBrowser = this.browser
    if (this.env.initErrors?.length) throw new Error(this.env.initErrors.shift())
    this.env.onInitialize?.(this)
    // like the real client, initialize() stays pending until the page is closed or fails
    return new Promise((resolve, reject) => { this._initReject = reject })
  }
  async destroy() {
    this.destroyed = true
    this._initReject?.(new Error('Target closed'))
  }
  async logout() { this.loggedOut = true }
  async getState() { return this.waState }
  async getNumberId(num) { return num.endsWith('0000000000') ? null : { _serialized: `${num}@c.us` } }
  async sendMessage(chatId, text) {
    if (this.env.sendError) throw this.env.sendError
    this.sent.push({ chatId, text })
    return { id: { _serialized: `msg-${this.sent.length}` } }
  }
}

function makeEnv(overrides = {}) {
  const env = {
    clients: [],
    saved: new Set(),   // userIds that have a linked login on disk
    data: new Set(),    // userIds with WhatsApp Web data but no linked marker (pre-redesign sessions)
    wiped: [],
    db: new Map(),
    logs: [],
  }
  const config = {
    authDir: '/tmp/wa-test',
    keepAlive: true,
    idleCloseMs: 60000,
    launchTimeoutMs: 2000,
    maxActiveSessions: 1,
    qrIdleMs: 60000,
    qrMaxMs: 300000,
    watchdogIntervalMs: 60000,
    watchdogFailLimit: 2,
    reconnectDelaysMs: [20, 40],
    sendTimeoutMs: 1000,
    sendWaitReadyMs: 1000,
    bootStaggerMs: 10,
    ...overrides,
  }
  const userFromDir = (dir) => dir.replace(/.*session-user_/, '')
  const deps = {
    config,
    store: {
      load: async (id) => env.db.get(id) || null,
      list: async () => [...env.db.entries()].map(([userId, d]) => ({ userId, ...d })),
      save: async (id, data) => { env.db.set(id, { ...(env.db.get(id) || {}), ...data }) },
    },
    chrome: {
      killOrphanChromes: () => [],
      removeLockFiles: () => [],
      hasSavedSession: (dir) => env.saved.has(userFromDir(dir)),
      hasWhatsAppData: (dir) => env.saved.has(userFromDir(dir)) || env.data.has(userFromDir(dir)),
      markLinked: (dir) => env.saved.add(userFromDir(dir)),
      clearLinked: (dir) => env.saved.delete(userFromDir(dir)),
      wipeProfile: (dir) => { env.wiped.push(userFromDir(dir)); env.saved.delete(userFromDir(dir)) },
      killPid: () => {},
      isPidAlive: () => false,
    },
    createClient: () => new FakeClient(env),
    log: {
      info: (...a) => env.logs.push(['info', ...a]),
      warn: (...a) => env.logs.push(['warn', ...a]),
      error: (...a) => env.logs.push(['error', ...a]),
    },
    toQrDataUrl: async (qr) => `data:image/png;base64,${qr}`,
  }
  env.manager = new WhatsAppManager(deps)
  env.last = () => env.clients[env.clients.length - 1]
  return env
}

let env
beforeEach(() => { env = makeEnv() })

test('first connect shows a QR, then scan → syncing → connected', async () => {
  const m = env.manager
  await m.connect('u1')
  await until(() => env.clients.length === 1)
  const c = env.last()

  c.emit('qr', 'QR-1')
  await until(async () => (await m.getStatus('u1')).status === STATE.QR)
  let st = await m.getStatus('u1', { watching: true })
  assert.equal(st.qrCodeDataUrl, 'data:image/png;base64,QR-1')
  assert.ok(st.qrExpiresAt)

  c.emit('qr', 'QR-2') // WhatsApp rotates the QR every ~20s
  await until(async () => (await m.getStatus('u1')).qrCodeDataUrl.endsWith('QR-2'))

  c.emit('authenticated')
  await until(async () => (await m.getStatus('u1')).status === STATE.SYNCING)
  env.saved.add('u1')
  c.emit('ready')
  await until(async () => (await m.getStatus('u1')).status === STATE.READY)

  st = await m.getStatus('u1')
  assert.equal(st.phoneNumber, '919876543210')
  assert.equal(st.qrCodeDataUrl, null)
  assert.equal(env.db.get('u1').status, STATE.READY)
  assert.equal(env.db.get('u1').autoStart, true)
})

test('background start never shows a QR: invalid login → needs_qr, browser closed, no retry loop', async () => {
  env.saved.add('u2')
  const m = env.manager
  await m.ensureRunning('u2', 'send')
  await until(() => env.clients.length === 1)
  env.last().emit('qr', 'QR')
  await until(async () => (await m.getStatus('u2')).status === STATE.NEEDS_QR)

  assert.equal(env.last().destroyed, true)
  assert.equal(env.saved.has('u2'), false) // linked marker cleared
  assert.equal((await m.getStatus('u2')).qrCodeDataUrl, null)
  // later background attempts do nothing until the user reconnects
  await m.ensureRunning('u2', 'send')
  await assert.rejects(m.sendWhatsAppMessage('u2', '9876543210', 'hi'), WaUnavailableError)
  assert.equal(env.clients.length, 1)
  assert.equal((await m.canSend('u2')).ok, false)
})

test('send cold-starts from the saved login, waits for ready, then sends', async () => {
  env.saved.add('u3')
  env.onInitialize = (c) => setTimeout(() => { c.emit('authenticated'); c.emit('ready') }, 20)
  const res = await env.manager.sendWhatsAppMessage('u3', '98765 43210', 'hello')
  assert.equal(res.messageId, 'msg-1')
  assert.deepEqual(env.last().sent[0], { chatId: '919876543210@c.us', text: 'hello' })
  // a second send reuses the running browser
  await env.manager.sendWhatsAppMessage('u3', '9876543210', 'again')
  assert.equal(env.clients.length, 1)
})

test('send with no saved login and no session fails fast without launching Chrome', async () => {
  await assert.rejects(env.manager.sendWhatsAppMessage('u4', '9876543210', 'hi'), WaUnavailableError)
  assert.equal(env.clients.length, 0)
})

test('number not on WhatsApp → WaRecipientError (permanent)', async () => {
  env.saved.add('u5')
  env.onInitialize = (c) => setTimeout(() => c.emit('ready'), 5)
  await assert.rejects(env.manager.sendWhatsAppMessage('u5', '910000000000', 'hi'), WaRecipientError)
  await assert.rejects(env.manager.sendWhatsAppMessage('u5', '123', 'hi'), WaRecipientError)
})

test('logged out from phone → needs_qr and the saved login is wiped', async () => {
  env.saved.add('u6')
  env.onInitialize = (c) => setTimeout(() => c.emit('ready'), 5)
  await env.manager.ensureRunning('u6')
  await until(async () => (await env.manager.getStatus('u6')).status === STATE.READY)
  env.last().emit('disconnected', 'LOGOUT')
  await until(async () => (await env.manager.getStatus('u6')).status === STATE.NEEDS_QR)
  assert.deepEqual(env.wiped, ['u6'])
  assert.equal(env.db.get('u6').autoStart, false)
})

test('browser crash → automatic reconnect from the saved login (no QR)', async () => {
  env.saved.add('u7')
  env.onInitialize = (c) => setTimeout(() => c.emit('ready'), 5)
  await env.manager.ensureRunning('u7')
  await until(async () => (await env.manager.getStatus('u7')).status === STATE.READY)
  const first = env.last()
  first.browser.emit('disconnected') // Chrome killed by the OS
  await until(async () => env.clients.length === 2 && (await env.manager.getStatus('u7')).status === STATE.READY)
  assert.equal(first.destroyed, true)
  assert.equal(env.wiped.length, 0)
})

test('transient disconnect (e.g. CONFLICT) reconnects; events from the old browser are ignored', async () => {
  env.saved.add('u8')
  env.onInitialize = (c) => setTimeout(() => c.emit('ready'), 5)
  await env.manager.ensureRunning('u8')
  await until(async () => (await env.manager.getStatus('u8')).status === STATE.READY)
  const old = env.last()
  old.emit('disconnected', 'CONFLICT')
  await until(() => env.clients.length === 2)
  await until(async () => (await env.manager.getStatus('u8')).status === STATE.READY)
  old.emit('disconnected', 'LOGOUT') // stale event must not log the new session out
  await tick(30)
  assert.equal((await env.manager.getStatus('u8')).status, STATE.READY)
  assert.equal(env.wiped.length, 0)
})

test('stop pauses: browser closed, sends rejected, background starts ignored; connect resumes', async () => {
  env.saved.add('u9')
  env.onInitialize = (c) => setTimeout(() => c.emit('ready'), 5)
  await env.manager.ensureRunning('u9')
  await until(async () => (await env.manager.getStatus('u9')).status === STATE.READY)
  await env.manager.stop('u9')
  const st = await env.manager.getStatus('u9')
  assert.equal(st.status, STATE.STOPPED)
  assert.equal(st.isStopped, true)
  assert.equal(env.last().destroyed, true)
  await assert.rejects(env.manager.sendWhatsAppMessage('u9', '9876543210', 'x'), /paused/)
  await env.manager.ensureRunning('u9')
  assert.equal(env.clients.length, 1)
  await env.manager.connect('u9')
  await until(async () => (await env.manager.getStatus('u9')).status === STATE.READY)
  assert.equal(env.clients.length, 2)
})

test('parallel connect/ensureRunning calls start exactly one browser', async () => {
  env.saved.add('u10')
  await Promise.all([
    env.manager.connect('u10'),
    env.manager.connect('u10'),
    env.manager.ensureRunning('u10'),
    env.manager.ensureRunning('u10'),
  ])
  await tick(30)
  assert.equal(env.clients.length, 1)
})

test('launch timeout → error shown, launch slot released for the next user', async () => {
  env = makeEnv({ launchTimeoutMs: 50 })
  await env.manager.connect('a')
  await env.manager.connect('b') // waits for the single launch slot
  await tick(20)
  assert.equal(env.clients.length, 1)
  await until(async () => (await env.manager.getStatus('a')).lastError?.includes('did not load'))
  const st = await env.manager.getStatus('a')
  assert.equal(st.status, STATE.NEEDS_QR) // no saved login → needs a scan
  await until(() => env.clients.length === 2) // b got the slot
})

test('one WhatsApp session at a time: the next user starts only after the first browser is closed', async () => {
  env = makeEnv({ keepAlive: false, idleCloseMs: 60000 })
  env.saved.add('x')
  env.saved.add('y')
  env.onInitialize = (c) => setTimeout(() => c.emit('ready'), 5)
  await env.manager.ensureRunning('x')
  await env.manager.connect('y') // user y clicks Connect while x is sending
  await until(async () => (await env.manager.getStatus('x')).status === STATE.READY)
  await tick(30)
  assert.equal(env.clients.length, 1) // y waits, even though x is past login
  assert.equal((await env.manager.getStatus('y')).initStage, 'waiting')

  // x has nothing left to send; with someone waiting it closes after 5s idle instead of 60s
  env.manager.session('x').lastActivityAt = Date.now() - 6000
  await env.manager.closeIfIdle('x')
  await until(() => env.clients.length === 2)
  assert.equal(env.clients[0].destroyed, true)
  await until(async () => (await env.manager.getStatus('y')).status === STATE.READY)
})

test('a QR screen also holds the slot until it is cancelled', async () => {
  await env.manager.connect('q1')
  await until(() => env.clients.length === 1)
  env.last().emit('qr', 'QR')
  env.saved.add('q2')
  await env.manager.ensureRunning('q2')
  await tick(30)
  assert.equal(env.clients.length, 1)
  await env.manager.cancel('q1')
  await until(() => env.clients.length === 2)
})

test('QR closes when nobody is watching the page', async () => {
  env = makeEnv({ qrIdleMs: 30 })
  await env.manager.connect('q')
  await until(() => env.clients.length === 1)
  env.last().emit('qr', 'QR')
  await until(async () => (await env.manager.getStatus('q')).status === STATE.QR)
  await tick(60)
  await env.manager.session('q').healthCheck()
  await until(async () => (await env.manager.getStatus('q')).status === STATE.NEEDS_QR)
  assert.match((await env.manager.getStatus('q')).lastError, /expired/)
  assert.equal(env.last().destroyed, true)
})

test('health check: WhatsApp unresponsive twice → browser restarted', async () => {
  env.saved.add('h')
  env.onInitialize = (c) => setTimeout(() => c.emit('ready'), 5)
  await env.manager.ensureRunning('h')
  await until(async () => (await env.manager.getStatus('h')).status === STATE.READY)
  const s = env.manager.session('h')
  env.last().waState = null
  await s.healthCheck()
  assert.equal(env.clients.length, 1)
  await s.healthCheck()
  await until(() => env.clients.length === 2)
  await until(async () => (await env.manager.getStatus('h')).status === STATE.READY)
})

test('browser dies mid-send → message error is "unavailable" (stays pending) and session restarts', async () => {
  env.saved.add('m')
  env.onInitialize = (c) => setTimeout(() => c.emit('ready'), 5)
  await env.manager.ensureRunning('m')
  await until(async () => (await env.manager.getStatus('m')).status === STATE.READY)
  env.sendError = new Error('Protocol error (Runtime.callFunctionOn): Target closed')
  await assert.rejects(env.manager.sendWhatsAppMessage('m', '9876543210', 'x'), WaUnavailableError)
  env.sendError = null
  await until(() => env.clients.length === 2)
})

test('logout unlinks the device and deletes the saved login', async () => {
  env.saved.add('l')
  env.onInitialize = (c) => setTimeout(() => c.emit('ready'), 5)
  await env.manager.ensureRunning('l')
  await until(async () => (await env.manager.getStatus('l')).status === STATE.READY)
  const c = env.last()
  await env.manager.logout('l')
  assert.equal(c.loggedOut, true)
  assert.deepEqual(env.wiped, ['l'])
  const st = await env.manager.getStatus('l')
  assert.equal(st.status, STATE.DISCONNECTED)
  assert.equal(st.phoneNumber, null)
  assert.equal(st.hasSavedSession, false)
})

test('boot: restores previously connected sessions (incl. pre-redesign records), normalizes stale states', async () => {
  env.db.set('old', { status: 'authenticated', isStopped: false })          // legacy record, no autoStart, no marker
  env.db.set('new', { status: 'authenticated', autoStart: true })
  env.db.set('paused', { status: 'disconnected', isStopped: true })
  env.db.set('stale', { status: 'qr_ready', autoStart: false })
  env.db.set('nologin', { status: 'authenticated', autoStart: true })       // login folder missing
  env.data.add('old'); env.saved.add('new'); env.saved.add('paused'); env.saved.add('stale')
  env.onInitialize = (c) => setTimeout(() => c.emit('ready'), 5)

  env.manager.config.bootStaggerMs = 0
  env.manager.launchSlots.max = 5 // keep-alive with several users needs several slots
  await env.manager.start()
  clearInterval(env.manager.watchdog)
  await until(async () => (await env.manager.getStatus('old')).status === STATE.READY &&
    (await env.manager.getStatus('new')).status === STATE.READY, 6000)

  assert.equal((await env.manager.getStatus('paused')).status, STATE.STOPPED)
  assert.equal(env.db.get('stale').status, STATE.DISCONNECTED)
  assert.equal((await env.manager.getStatus('nologin')).status, STATE.DISCONNECTED)
  assert.equal(env.clients.length, 2)
  assert.ok(env.saved.has('old')) // migrated to the linked marker
})

test('shutdown closes every browser and keeps autoStart for the next boot', async () => {
  env.saved.add('s')
  env.onInitialize = (c) => setTimeout(() => c.emit('ready'), 5)
  await env.manager.ensureRunning('s')
  await until(async () => (await env.manager.getStatus('s')).status === STATE.READY)
  await env.manager.shutdown()
  assert.equal(env.last().destroyed, true)
  assert.equal(env.db.get('s').autoStart, true)
  await assert.rejects(env.manager.connect('s'), /shutting down/)
})

test('WhatsApp Web reloading during start-up is retried automatically', async () => {
  env.initErrors = ['Execution context was destroyed, most likely because of a navigation.']
  await env.manager.connect('r1')
  await until(() => env.clients.length === 2)
  env.last().emit('qr', 'QR')
  await until(async () => (await env.manager.getStatus('r1')).status === STATE.QR)
  assert.equal(env.clients[0].destroyed, true)
})

test('launch retries are limited; a permanent error is shown to the user', async () => {
  env.initErrors = ['Execution context was destroyed', 'Execution context was destroyed', 'Execution context was destroyed']
  await env.manager.connect('r2')
  await until(async () => (await env.manager.getStatus('r2')).lastError?.includes('Could not start'))
  assert.equal(env.clients.length, 3) // first try + 2 retries
  env.initErrors = ['Failed to launch the browser process: no chrome']
  await env.manager.connect('r3')
  await until(async () => (await env.manager.getStatus('r3')).lastError?.includes('no chrome'))
  assert.equal(env.clients.length, 4) // not retried
})

test('a QR start wipes a profile that has no linked login; a linked profile is never wiped on start', async () => {
  env.data.add('w1') // leftover WhatsApp Web data from an unfinished attempt
  await env.manager.connect('w1')
  await until(() => env.clients.length === 1)
  assert.deepEqual(env.wiped, ['w1'])

  env.saved.add('w2')
  await env.manager.ensureRunning('w2')
  await env.manager.cancel('w1') // free the single session slot
  await until(() => env.clients.length === 2)
  assert.deepEqual(env.wiped, ['w1'])
})

test('on-demand mode: ready → pending sent via ready handler → browser closed when idle; next send reopens without QR', async () => {
  env = makeEnv({ keepAlive: false, idleCloseMs: 30 })
  env.saved.add('od')
  const readyCalls = []
  env.manager.setReadyHandler(async (uid) => { readyCalls.push(uid); await env.manager.sendWhatsAppMessage(uid, '9876543210', 'pending msg') })
  env.onInitialize = (c) => setTimeout(() => c.emit('ready'), 5)
  await env.manager.connect('od')
  await until(() => env.last()?.sent.length === 1)
  assert.deepEqual(readyCalls, ['od'])

  await tick(40)
  await env.manager.closeIfIdle('od')
  await until(async () => (await env.manager.getStatus('od')).status === STATE.DISCONNECTED)
  const st = await env.manager.getStatus('od')
  assert.equal(st.hasSavedSession, true)
  assert.equal(st.lastError, null)
  assert.equal(env.clients[0].destroyed, true)

  await env.manager.sendWhatsAppMessage('od', '9876543210', 'later msg')
  assert.equal(env.clients.length, 2)
  await until(() => env.clients[1].sent.length === 2) // ready handler + this send
})

test('on-demand mode: never closes while a send is in progress; crash does not schedule reconnects', async () => {
  env = makeEnv({ keepAlive: false, idleCloseMs: 0 })
  env.saved.add('od2')
  env.onInitialize = (c) => setTimeout(() => c.emit('ready'), 5)
  let release
  env.manager.setReadyHandler(() => {})
  await env.manager.ensureRunning('od2')
  await until(async () => (await env.manager.getStatus('od2')).status === STATE.READY)
  const c = env.last()
  c.sendMessage = () => new Promise(r => { release = () => r({ id: { _serialized: 'm' } }) })
  const sending = env.manager.sendWhatsAppMessage('od2', '9876543210', 'slow')
  await until(() => !!release)
  await env.manager.closeIfIdle('od2')
  assert.equal(c.destroyed, false)
  release()
  await sending

  c.browser.emit('disconnected')
  await until(async () => (await env.manager.getStatus('od2')).status === STATE.DISCONNECTED)
  await tick(80)
  assert.equal(env.clients.length, 1) // no automatic reconnect loop
})

test('"ready" never arrives but WhatsApp is logged in and can send → session continues (fallback)', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] })
  env = makeEnv({ launchTimeoutMs: 600000 })
  env.saved.add('fb')
  env.onInitialize = (c) => {
    c.pupPage.evaluate = async () => ({ wwebjs: 'object', sendFn: 'function', conn: true, me: '918602145864', missing: ['WAWebSyncGatingUtils'] })
    queueMicrotask(() => c.emit('authenticated'))
  }
  await env.manager.ensureRunning('fb')
  for (let i = 0; i < 20 && (await env.manager.getStatus('fb')).status !== STATE.SYNCING; i++) await Promise.resolve()
  for (let i = 0; i < 4; i++) { t.mock.timers.tick(8000); for (let j = 0; j < 20; j++) await Promise.resolve() }
  const st = await env.manager.getStatus('fb')
  assert.equal(st.status, STATE.READY)
  assert.equal(st.phoneNumber, '918602145864')
})
