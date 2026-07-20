const QRCode = require('qrcode')
const { Client, LocalAuth } = require('whatsapp-web.js')
const WaSession = require('../models/WaSession')
const path = require('path')
const fs = require('fs')

const AUTH_DATA_PATH = process.env.WHATSAPP_AUTH_DIR || '.wwebjs_auth'
const IDLE_TIMEOUT_MS = 15 * 60 * 1000      // 15 minutes — kill idle connected sessions to free RAM
const QR_IDLE_TIMEOUT_MS = 5 * 60 * 1000   // 5 minutes — kill QR waiting sessions if nobody is polling
const INIT_TIMEOUT_MS = 2 * 60 * 1000       // 2 minutes — if stuck in "initializing" (no QR, no ready), auto-reset

// Errors from Puppeteer that we safely ignore — they happen when the browser is destroyed
// while whatsapp-web.js is still running async page operations (inject, getWWebVersion, etc.)
const PUPPETEER_NOISE = [
  'Target closed',
  'Session closed',
  'Detached Frame',
  'detached Frame',
  'Not connected',
  'Connection closed',
  'Protocol error',
]

function isPuppeteerNoise(err) {
  const msg = String(err?.message || err || '')
  return PUPPETEER_NOISE.some(n => msg.includes(n))
}

class WhatsappUserClient {
  constructor(userId) {
    this.userId = userId.toString()
    this.sessionId = `user_${this.userId}`
    this.client = null
    this.isStopped = false
    this.authReceived = false
    this.isInitializing = false   // Prevents concurrent _init() calls
    this.qrShownDuringInit = false // True only if QR appeared during _init (saved auth is INVALID)

    // Idle timeout tracking
    this.idleTimer = null
    this.initTimeoutTimer = null  // Guards against stuck "initializing" state

    // Concurrency / Queue lock — reset to a fresh resolved promise when the chain breaks
    this.taskQueue = Promise.resolve()
  }

  // Enqueue async tasks to prevent multiple Chrome instances launching simultaneously.
  // If the previous task threw, the chain is still intact because we always resolve the
  // outer wrapper — errors are forwarded to the caller but don't break the queue.
  enqueueTask(taskFn) {
    return new Promise((resolve, reject) => {
      this.taskQueue = this.taskQueue.then(async () => {
        try {
          const result = await taskFn()
          resolve(result)
        } catch (error) {
          reject(error)
        }
      }).catch(() => {
        // Queue chain safety-net: if something went terribly wrong, keep the chain alive
      })
    })
  }

  resetIdleTimeout(isQr = false) {
    if (this.idleTimer) clearTimeout(this.idleTimer)
    const timeout = isQr ? QR_IDLE_TIMEOUT_MS : IDLE_TIMEOUT_MS
    this.idleTimer = setTimeout(async () => {
      console.log(`[WHATSAPP:${this.userId}] Session idle for ${timeout/1000/60} min. Destroying client to free RAM...`)
      if (isQr && !this.authReceived) {
        await this.updateStatus('disconnected', {
          qrCodeDataUrl: null,
          lastError: 'QR code expired. Reload the page to get a fresh code.'
        }).catch(() => {})
      }
      this.destroySession()
    }, timeout)
  }

  clearInitTimeout() {
    if (this.initTimeoutTimer) {
      clearTimeout(this.initTimeoutTimer)
      this.initTimeoutTimer = null
    }
  }

  // Starts a watchdog: if we spend more than INIT_TIMEOUT_MS in "initializing" without
  // reaching qr_ready or authenticated, auto-destroy so the frontend can retry.
  startInitTimeout() {
    this.clearInitTimeout()
    this.initTimeoutTimer = setTimeout(async () => {
      if (this.isInitializing) {
        console.warn(`[WHATSAPP:${this.userId}] Initialization timed out after ${INIT_TIMEOUT_MS/1000}s. Resetting...`)
        this.isInitializing = false
        await this.updateStatus('disconnected', {
          qrCodeDataUrl: null,
          lastError: 'Connection timed out. Please try again.'
        }).catch(() => {})
        this.destroySession()
      }
    }, INIT_TIMEOUT_MS)
  }

  // Called on every /status poll while a QR/handshake is pending.
  touchPoll() {
    if (this.client && !this.authReceived) {
      this.resetIdleTimeout(true)
    }
  }

  async updateStatus(status, extra = {}) {
    await WaSession.findOneAndUpdate(
      { userId: this.userId },
      { status, sessionId: this.sessionId, ...extra },
      { upsert: true, new: true }
    )
    console.log(`[WHATSAPP:${this.userId}] Status -> ${status}`)
  }

  async getSessionStatus() {
    let session = await WaSession.findOne({ userId: this.userId })
    if (!session) session = await WaSession.create({ userId: this.userId, sessionId: this.sessionId, status: 'disconnected' })
    return session
  }

  clearChromeLock() {
    try {
      const sessionDir = path.resolve(AUTH_DATA_PATH, `session-${this.sessionId}`)
      for (const f of ['SingletonLock', 'SingletonSocket', 'SingletonCookie']) {
        const p = path.join(sessionDir, f)
        if (fs.existsSync(p)) {
          fs.rmSync(p, { force: true })
        }
      }
    } catch (err) {
      console.warn(`[WHATSAPP:${this.userId}] Lock clear warning:`, err.message)
    }
  }

  // Internal initialization — MUST be called from within the queue or sendWhatsAppMessage.
  async _init() {
    // Already running or already alive — nothing to do
    if (this.isInitializing) {
      console.log(`[WHATSAPP:${this.userId}] _init() skipped — already initializing`)
      return
    }
    if (this.client) {
      this.resetIdleTimeout()
      return
    }

    this.isInitializing = true
    this.isStopped = false
    this.authReceived = false
    this.qrShownDuringInit = false  // Reset — will be set true only if QR appears
    this.clearChromeLock()
    this.startInitTimeout()

    try {
      await this.updateStatus('initializing', { qrCodeDataUrl: null, lastError: null })
      console.log(`[WHATSAPP:${this.userId}] Instantiating browser...`)

      const client = new Client({
        authStrategy: new LocalAuth({
          clientId: this.sessionId,
          dataPath: AUTH_DATA_PATH
        }),
        puppeteer: {
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--disable-gpu',
            '--disable-features=site-per-process',
            '--disable-web-security',
            '--disable-background-networking',
            '--disable-default-apps',
            '--disable-extensions',
            '--disable-sync',
            '--metrics-recording-only',
            '--mute-audio',
            '--no-default-browser-check',
            '--safebrowsing-disable-auto-update',
          ]
        },
        // Use disk-cached WhatsApp version so we don't hit the network on every cold start.
        // This shaves several seconds off first-QR time.
        webVersionCache: {
          type: 'local',
          path: path.resolve(AUTH_DATA_PATH, 'wwebjs_cache')
        }
      })

      this.client = client

      // Wait for ready (has saved auth) or QR (fresh scan needed).
      // We do NOT wait for 'ready' before resolving — we resolve on QR so that the
      // user sees the code immediately. 'ready' resolves the connection fully afterward.
      await new Promise((resolve, reject) => {
        let resolved = false
        const safeResolve = () => { if (!resolved) { resolved = true; resolve() } }
        const safeReject = (err) => { if (!resolved) { resolved = true; reject(err) } }

        client.on('qr', async (qr) => {
          if (this.authReceived) return
          // QR appearing means the saved session credentials on disk are NO LONGER VALID.
          // Flag this so sendWhatsAppMessage knows it must wipe auth (not just fail silently).
          this.qrShownDuringInit = true
          this.clearInitTimeout()
          try {
            const qrCodeDataUrl = await QRCode.toDataURL(qr, { width: 300 })
            await this.updateStatus('qr_ready', { qrCodeDataUrl, lastError: null })
            this.resetIdleTimeout(true)
            this.isInitializing = false
            safeResolve()
          } catch (err) {
            console.error(`[WHATSAPP:${this.userId}] QR error:`, err.message)
            safeResolve()
          }
        })

        client.on('authenticated', async () => {
          this.authReceived = true
          this.clearInitTimeout()
          console.log(`[WHATSAPP:${this.userId}] ✓ Authenticated — waiting for ready...`)
          await this.updateStatus('authenticated', { qrCodeDataUrl: null, lastError: null })
        })

        client.on('ready', async () => {
          this.authReceived = true
          this.isInitializing = false
          this.clearInitTimeout()
          const phoneNumber = client?.info?.wid?.user || null
          console.log(`[WHATSAPP:${this.userId}] ✅ READY! Phone: ${phoneNumber}`)
          await this.updateStatus('authenticated', {
            qrCodeDataUrl: null,
            phoneNumber,
            lastConnectedAt: new Date(),
            lastError: null
          })
          this.resetIdleTimeout()
          safeResolve()
        })

        client.on('auth_failure', async (msg) => {
          this.isInitializing = false
          this.clearInitTimeout()
          console.error(`[WHATSAPP:${this.userId}] Auth failure:`, msg)
          await this.updateStatus('auth_failure', { lastError: String(msg) })
          this.destroySession()
          safeReject(new Error('Auth failure: ' + msg))
        })

        client.on('disconnected', async (reason) => {
          console.log(`[WHATSAPP:${this.userId}] Disconnected reason:`, reason)
          await this.updateStatus('disconnected', { qrCodeDataUrl: null, lastError: String(reason) })
          if (reason !== 'NAVIGATION') {
            this.destroySession()
          }
        })

        client.on('error', (err) => {
          if (!isPuppeteerNoise(err)) {
            console.error(`[WHATSAPP:${this.userId}] Client error:`, err?.message || err)
          }
        })

        // Initialize the browser — catch Puppeteer noise so it doesn't orphan the promise.
        client.initialize().catch(err => {
          if (isPuppeteerNoise(err)) {
            // Browser was torn down mid-init (e.g. user logged out while QR was loading).
            // This is expected — just clean up and don't propagate.
            console.log(`[WHATSAPP:${this.userId}] Browser closed mid-init (normal during logout). Cleaning up.`)
            this.isInitializing = false
            this.clearInitTimeout()
            this.destroySession()
            safeResolve() // Resolve rather than reject — the caller doesn't need to see this
          } else {
            safeReject(err)
          }
        })
      })
    } catch (error) {
      const errMsg = String(error?.message || error)
      this.isInitializing = false
      this.clearInitTimeout()
      if (!isPuppeteerNoise(error)) {
        console.error(`[WHATSAPP:${this.userId}] Init error:`, errMsg)
      }
      this.destroySession()
      await this.updateStatus('disconnected', { lastError: isPuppeteerNoise(error) ? 'Connection interrupted. Please retry.' : errMsg })
      throw error
    }
  }

  initializeSession() {
    return this.enqueueTask(() => this._init())
  }

  async destroySession(manualStop = false) {
    if (manualStop) {
      this.isStopped = true
      this.updateStatus('disconnected', { qrCodeDataUrl: null, lastError: 'Manually stopped' }).catch(() => {})
    }

    this.isInitializing = false
    if (this.idleTimer) clearTimeout(this.idleTimer)
    this.clearInitTimeout()

    const clientRef = this.client
    this.client = null
    this.authReceived = false

    if (clientRef) {
      try {
        console.log(`[WHATSAPP:${this.userId}] Destroying browser...`)
        await clientRef.destroy()
      } catch (err) {
        // Ignore — browser may already be dead
      } finally {
        this.clearChromeLock()
      }
    }
  }

  logoutSession() {
    return this.enqueueTask(async () => {
      this.isStopped = true
      this.isInitializing = false
      if (this.idleTimer) clearTimeout(this.idleTimer)
      this.clearInitTimeout()

      const clientRef = this.client
      this.client = null
      this.authReceived = false

      if (clientRef) {
        console.log(`[WHATSAPP:${this.userId}] Logging out...`)
        try { await clientRef.logout() } catch (_) {}
        try { await clientRef.destroy() } catch (_) {}
      }

      try {
        const authDir = path.resolve(AUTH_DATA_PATH, `session-${this.sessionId}`)
        if (fs.existsSync(authDir)) fs.rmSync(authDir, { recursive: true, force: true })
      } catch (e) {}

      await this.updateStatus('disconnected', { qrCodeDataUrl: null, phoneNumber: null, lastError: null })
      this.clearChromeLock()
    })
  }

  // Tear down + wipe auth without setting isStopped, so the WhatsApp page auto-restarts.
  // Used when a lazy connect during send fails.
  async _forceLoggedOut(reason) {
    if (this.idleTimer) clearTimeout(this.idleTimer)
    this.clearInitTimeout()
    const clientRef = this.client
    this.client = null
    this.authReceived = false
    this.isInitializing = false
    if (clientRef) {
      try { await clientRef.logout() } catch (_) {}
      try { await clientRef.destroy() } catch (_) {}
    }
    try {
      const authDir = path.resolve(AUTH_DATA_PATH, `session-${this.sessionId}`)
      if (fs.existsSync(authDir)) fs.rmSync(authDir, { recursive: true, force: true })
    } catch (_) {}
    this.clearChromeLock()
    await this.updateStatus('disconnected', {
      qrCodeDataUrl: null,
      phoneNumber: null,
      lastError: reason
    }).catch(() => {})
    console.log(`[WHATSAPP:${this.userId}] Forced logout during send: ${reason}`)
  }

  sendWhatsAppMessage(targetNumber, text) {
    return this.enqueueTask(async () => {
      if (this.isStopped) throw new Error('Sending paused. Resume session first.')

      const wasClientNull = !this.client

      if (!this.client) {
        await this._init()
      }

      this.resetIdleTimeout()

      if (!this.authReceived) {
        // Only wipe the saved auth credentials if a QR was explicitly shown during this
        // lazy-connect attempt — that is definitive proof the WhatsApp session is invalid.
        // For ALL other failures (timeout, browser crash, network blip), we preserve the
        // auth files so the next send attempt can retry without forcing a full re-scan.
        if (wasClientNull && this.qrShownDuringInit) {
          console.warn(`[WHATSAPP:${this.userId}] QR was shown during lazy connect — saved session is expired. Clearing auth.`)
          await this._forceLoggedOut('WhatsApp session expired. Please scan the QR code again to reconnect.')
        } else {
          // Auth might still be valid — just kill the browser and let next send retry
          console.warn(`[WHATSAPP:${this.userId}] Not authenticated after init (no QR shown). Keeping auth files — will retry next send.`)
          this.destroySession()
        }
        throw new Error('WhatsApp not ready — will retry automatically. If this persists, re-scan the QR code.')
      }

      try {
        const state = await this.client.getState().catch(() => null)
        if (state !== 'CONNECTED') {
          // Don't wipe auth on a bad state — WhatsApp may reconnect on its own.
          // Just kill the current browser instance; next send will lazy-restart cleanly.
          console.warn(`[WHATSAPP:${this.userId}] State is ${state} (not CONNECTED). Killing browser but keeping auth.`)
          this.destroySession()
          throw new Error(`WhatsApp connection lost (state: ${state}). Will retry on next send cycle.`)
        }

        let num = targetNumber.replace(/\D/g, '')
        if (num.length === 10) num = '91' + num

        const numberId = await this.client.getNumberId(num).catch(() => null)
        if (!numberId) throw new Error(`${num} is not registered on WhatsApp`)

        const chatId = numberId._serialized

        console.log(`[WHATSAPP:${this.userId}] Sending message to ${chatId}`)
        const result = await this.client.sendMessage(chatId, text)

        this.resetIdleTimeout()
        return { success: true, messageId: result?.id?._serialized }
      } catch (err) {
        if (isPuppeteerNoise(err)) {
          console.warn(`[WHATSAPP:${this.userId}] Browser crashed during send. Killing browser (auth preserved).`)
          this.destroySession()
        }
        throw err
      }
    })
  }

  isClientConnected() {
    return !!this.client && !this.isStopped
  }
}

class WhatsappServiceManager {
  constructor() {
    this.instances = new Map()
  }

  getInstance(userId) {
    const id = userId.toString()
    if (!this.instances.has(id)) {
      this.instances.set(id, new WhatsappUserClient(id))
    }
    return this.instances.get(id)
  }

  // Clean API methods
  initializeSession(userId) { return this.getInstance(userId).initializeSession() }
  sendWhatsAppMessage(userId, targetNumber, text) { return this.getInstance(userId).sendWhatsAppMessage(targetNumber, text) }
  destroySession(userId, manualStop = false) { return this.getInstance(userId).destroySession(manualStop) }
  getSessionStatus(userId) { return this.getInstance(userId).getSessionStatus() }
  logoutSession(userId) { return this.getInstance(userId).logoutSession() }
  touchPoll(userId) { return this.getInstance(userId).touchPoll() }
  getIsInitializing(userId) { return this.getInstance(userId).isInitializing }

  // Backwards compatibility
  isClientConnected(userId) { return this.getInstance(userId).isClientConnected() }
  isClientStopped(userId) { return this.getInstance(userId).isStopped }
  startClient(userId) { return this.getInstance(userId).initializeSession() }
  stopClient(userId) { return this.getInstance(userId).destroySession(true) }
  logoutClient(userId) { return this.getInstance(userId).logoutSession() }
  getStatus(userId) { return this.getInstance(userId).getSessionStatus() }
  sendMessage(userId, num, txt) { return this.sendWhatsAppMessage(userId, num, txt) }

  // On server restart, clear stale mid-handshake sessions. No browsers are launched.
  async restoreSessionsOnStartup() {
    try {
      const stale = await WaSession.updateMany(
        { status: { $in: ['qr_ready', 'initializing'] } },
        {
          status: 'disconnected',
          qrCodeDataUrl: null,
          lastError: 'Session interrupted by server restart. Please reconnect.'
        }
      )
      if (stale.modifiedCount > 0) {
        console.log(`[WHATSAPP] Cleared ${stale.modifiedCount} stale mid-handshake session(s) after restart.`)
      }
    } catch (error) {
      console.error('[WHATSAPP] Error clearing stale sessions on startup:', error)
    }
  }
}

module.exports = new WhatsappServiceManager()
