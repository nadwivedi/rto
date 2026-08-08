const QRCode = require('qrcode')
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js')
const WaSession = require('../models/WaSession')
const path = require('path')
const fs = require('fs')
const { execSync } = require('child_process')

const AUTH_DATA_PATH = process.env.WHATSAPP_AUTH_DIR || '.wwebjs_auth'
const IDLE_TIMEOUT_MS = 5 * 60 * 1000       // 5 minutes (was 15) — kill idle connected sessions to free RAM
const QR_IDLE_TIMEOUT_MS = 3 * 60 * 1000    // 3 minutes (was 5) — kill QR waiting sessions if nobody is polling
const INIT_TIMEOUT_MS = 4 * 60 * 1000       // 4 minutes (was 2) — handles slow machines / high system load
const INSTANCE_CLEANUP_DELAY_MS = 60 * 1000 // 1 minute grace before removing dead instance from Map

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

// Kill the entire Chrome process tree on Windows so no zombie chrome.exe remains.
// Falls back to a no-op on non-Windows or if PID is null.
function killProcessTree(pid) {
  if (!pid) return
  try {
    if (process.platform === 'win32') {
      execSync(`taskkill /F /T /PID ${pid}`, { stdio: 'ignore', timeout: 5000 })
    } else {
      process.kill(-pid, 'SIGKILL')
    }
  } catch (_) {
    // Process may already be dead — ignore
  }
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

    // Tracks the Chromium PID so we can force-kill on Windows
    this._chromePid = null

    // Tracks the last time the UI polled /status — used by cron to decide whether to keep Chrome alive
    this.lastPollAt = null

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
          initStage: null,
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
          initStage: null,
          lastError: 'Connection timed out. Please try again.'
        }).catch(() => {})
        this.destroySession()
      }
    }, INIT_TIMEOUT_MS)
  }

  // Called on every /status poll while a QR/handshake is pending.
  touchPoll() {
    this.lastPollAt = Date.now()
    if (this.client && !this.authReceived) {
      this.resetIdleTimeout(true)
    }
  }

  // Returns true if a UI user has polled status within the last 30 seconds
  hasActiveUiUser() {
    return this.lastPollAt && (Date.now() - this.lastPollAt) < 30_000
  }

  async updateStatus(status, extra = {}) {
    await WaSession.findOneAndUpdate(
      { userId: this.userId },
      { status, sessionId: this.sessionId, ...extra },
      { upsert: true, new: true }
    )
    console.log(`[WHATSAPP:${this.userId}] Status -> ${status}${extra.initStage ? ` [${extra.initStage}]` : ''}`)
  }

  async getSessionStatus() {
    let session = await WaSession.findOne({ userId: this.userId })
    if (!session) session = await WaSession.create({ userId: this.userId, sessionId: this.sessionId, status: 'disconnected' })
    return session
  }

  // Cleans up Chrome lock files so a new Chromium instance can start cleanly.
  // Chrome puts SingletonLock in BOTH the session root AND the Default/ subdirectory.
  clearChromeLock() {
    try {
      const sessionDir = path.resolve(AUTH_DATA_PATH, `session-${this.sessionId}`)
      // Chrome puts lock files in the root AND in the Default/ profile subfolder
      const dirsToCheck = [
        sessionDir,
        path.join(sessionDir, 'Default')
      ]
      const lockFiles = ['SingletonLock', 'SingletonSocket', 'SingletonCookie']
      for (const dir of dirsToCheck) {
        for (const f of lockFiles) {
          const p = path.join(dir, f)
          try {
            if (fs.existsSync(p)) {
              fs.rmSync(p, { force: true })
              console.log(`[WHATSAPP:${this.userId}] Removed lock file: ${p}`)
            }
          } catch (_) {}
        }
      }
    } catch (err) {
      console.warn(`[WHATSAPP:${this.userId}] Lock clear warning:`, err.message)
    }
  }

  // Internal initialization — MUST be called from within the queue or sendWhatsAppMessage.
  async _init() {
    // If already initializing, wait for it to complete instead of returning undefined
    // (returning undefined would leave the enqueueTask promise hanging forever)
    if (this.isInitializing) {
      console.log(`[WHATSAPP:${this.userId}] _init() — already initializing, waiting for completion...`)
      await new Promise((resolve) => {
        const check = setInterval(() => {
          if (!this.isInitializing) {
            clearInterval(check)
            resolve()
          }
        }, 500)
        // Safety: don't wait longer than the init timeout
        setTimeout(() => { clearInterval(check); resolve() }, INIT_TIMEOUT_MS)
      })
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
    this._chromePid = null
    this.clearChromeLock()
    this.startInitTimeout()

    try {
      await this.updateStatus('initializing', { qrCodeDataUrl: null, initStage: 'launching_browser', isStopped: false, lastError: null })
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
            // Memory reduction flags
            '--js-flags=--max-old-space-size=256',
            '--disk-cache-size=10000000',
            '--disable-site-isolation-trials',
            '--renderer-process-limit=2',
          ]
        },
        // Use disk-cached WhatsApp version so we don't hit the network on every cold start.
        webVersionCache: {
          type: 'local',
          path: path.resolve(AUTH_DATA_PATH, 'wwebjs_cache')
        }
      })

      this.client = client

      // Track PID once browser spawns so we can force-kill on Windows if needed
      const trackPid = () => {
        try {
          const browser = client.pupPage?.browser?.()
          const browserProcess = browser?.process?.()
          if (browserProcess?.pid) {
            this._chromePid = browserProcess.pid
            console.log(`[WHATSAPP:${this.userId}] Chrome PID: ${this._chromePid}`)
          }
        } catch (_) {}
      }

      // Update stage to "loading WhatsApp Web" after a brief delay (browser has launched)
      const loadingStageTimer = setTimeout(async () => {
        if (this.isInitializing) {
          trackPid()
          await this.updateStatus('initializing', { initStage: 'loading_wweb' }).catch(() => {})
        }
      }, 5000)

      // Wait for ready (has saved auth) or QR (fresh scan needed).
      await new Promise((resolve, reject) => {
        let resolved = false
        const safeResolve = () => { if (!resolved) { resolved = true; clearTimeout(loadingStageTimer); resolve() } }
        const safeReject = (err) => { if (!resolved) { resolved = true; clearTimeout(loadingStageTimer); reject(err) } }

        client.on('qr', async (qr) => {
          if (this.authReceived) return
          // QR appearing means the saved session credentials on disk are NO LONGER VALID.
          this.qrShownDuringInit = true
          this.clearInitTimeout()
          trackPid()
          try {
            const qrCodeDataUrl = await QRCode.toDataURL(qr, { width: 300 })
            await this.updateStatus('qr_ready', { qrCodeDataUrl, initStage: null, lastError: null })
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
          trackPid()
          console.log(`[WHATSAPP:${this.userId}] ✓ Authenticated — waiting for ready...`)
          await this.updateStatus('authenticated', { qrCodeDataUrl: null, initStage: null, lastError: null })
        })

        client.on('ready', async () => {
          this.authReceived = true
          this.isInitializing = false
          this.clearInitTimeout()
          trackPid()
          const phoneNumber = client?.info?.wid?.user || null
          console.log(`[WHATSAPP:${this.userId}] ✅ READY! Phone: ${phoneNumber}`)
          await this.updateStatus('authenticated', {
            qrCodeDataUrl: null,
            initStage: null,
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
          await this.updateStatus('auth_failure', { initStage: null, lastError: String(msg) })
          this.destroySession()
          safeReject(new Error('Auth failure: ' + msg))
        })

        client.on('disconnected', async (reason) => {
          console.log(`[WHATSAPP:${this.userId}] Disconnected reason:`, reason)
          const isLogout = String(reason).toUpperCase() === 'LOGOUT'
          if (isLogout) this.isStopped = true
          await this.updateStatus('disconnected', {
            qrCodeDataUrl: null,
            initStage: null,
            isStopped: isLogout ? true : this.isStopped,
            lastError: isLogout ? 'WhatsApp session was logged out from your phone. Click Connect to reconnect.' : String(reason)
          })
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
            console.log(`[WHATSAPP:${this.userId}] Browser closed mid-init (normal during logout). Cleaning up.`)
            this.isInitializing = false
            this.clearInitTimeout()
            this.destroySession()
            safeResolve()
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
      await this.updateStatus('disconnected', { initStage: null, lastError: isPuppeteerNoise(error) ? 'Connection interrupted. Please retry.' : errMsg })
      throw error
    }
  }

  initializeSession() {
    return this.enqueueTask(() => this._init())
  }

  async destroySession(manualStop = false) {
    if (manualStop) {
      this.isStopped = true
      this.updateStatus('disconnected', { qrCodeDataUrl: null, initStage: null, isStopped: true, lastError: 'Manually stopped' }).catch(() => {})
    }

    this.isInitializing = false
    if (this.idleTimer) clearTimeout(this.idleTimer)
    this.clearInitTimeout()

    const clientRef = this.client
    const pidRef = this._chromePid
    this.client = null
    this._chromePid = null
    this.authReceived = false

    if (clientRef) {
      try {
        console.log(`[WHATSAPP:${this.userId}] Destroying browser...`)
        await clientRef.destroy()
      } catch (err) {
        // Ignore — browser may already be dead
      } finally {
        // Force-kill process tree on Windows to prevent zombie chrome.exe
        killProcessTree(pidRef)
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
      const pidRef = this._chromePid
      this.client = null
      this._chromePid = null
      this.authReceived = false

      if (clientRef) {
        console.log(`[WHATSAPP:${this.userId}] Logging out...`)
        try { await clientRef.logout() } catch (_) {}
        try { await clientRef.destroy() } catch (_) {}
        killProcessTree(pidRef)
      }

      try {
        const authDir = path.resolve(AUTH_DATA_PATH, `session-${this.sessionId}`)
        if (fs.existsSync(authDir)) fs.rmSync(authDir, { recursive: true, force: true })
      } catch (e) {}

      await this.updateStatus('disconnected', { qrCodeDataUrl: null, initStage: null, phoneNumber: null, isStopped: false, lastError: null })
      this.clearChromeLock()
    })
  }

  // Tear down + wipe auth without setting isStopped, so the WhatsApp page auto-restarts.
  async _forceLoggedOut(reason) {
    if (this.idleTimer) clearTimeout(this.idleTimer)
    this.clearInitTimeout()
    const clientRef = this.client
    const pidRef = this._chromePid
    this.client = null
    this._chromePid = null
    this.authReceived = false
    this.isInitializing = false
    if (clientRef) {
      try { await clientRef.logout() } catch (_) {}
      try { await clientRef.destroy() } catch (_) {}
      killProcessTree(pidRef)
    }
    try {
      const authDir = path.resolve(AUTH_DATA_PATH, `session-${this.sessionId}`)
      if (fs.existsSync(authDir)) fs.rmSync(authDir, { recursive: true, force: true })
    } catch (_) {}
    this.clearChromeLock()
    await this.updateStatus('disconnected', {
      qrCodeDataUrl: null,
      initStage: null,
      phoneNumber: null,
      lastError: reason
    }).catch(() => {})
    console.log(`[WHATSAPP:${this.userId}] Forced logout during send: ${reason}`)
  }

  sendWhatsAppMessage(targetNumber, text, mediaPath = null) {
    return this.enqueueTask(async () => {
      if (this.isStopped) throw new Error('Sending paused. Resume session first.')

      const wasClientNull = !this.client

      if (!this.client) {
        await this._init()
      }

      this.resetIdleTimeout()

      if (!this.authReceived) {
        if (wasClientNull && this.qrShownDuringInit) {
          console.warn(`[WHATSAPP:${this.userId}] QR was shown during lazy connect — saved session is expired. Clearing auth.`)
          await this._forceLoggedOut('WhatsApp session expired. Please scan the QR code again to reconnect.')
        } else {
          console.warn(`[WHATSAPP:${this.userId}] Not authenticated after init (no QR shown). Keeping auth files — will retry next send.`)
          this.destroySession()
        }
        throw new Error('WhatsApp not ready — will retry automatically. If this persists, re-scan the QR code.')
      }

      try {
        const state = await this.client.getState().catch(() => null)
        if (state !== 'CONNECTED') {
          console.warn(`[WHATSAPP:${this.userId}] State is ${state} (not CONNECTED). Killing browser but keeping auth.`)
          this.destroySession()
          throw new Error(`WhatsApp connection lost (state: ${state}). Will retry on next send cycle.`)
        }

        let num = targetNumber.replace(/\D/g, '')
        if (num.length === 10) num = '91' + num

        const numberId = await this.client.getNumberId(num).catch(() => null)
        if (!numberId) throw new Error(`${num} is not registered on WhatsApp`)

        const chatId = numberId._serialized

        console.log(`[WHATSAPP:${this.userId}] Sending message to ${chatId}${mediaPath ? ' (with attachment: ' + mediaPath + ')' : ''}`)
        
        let result
        if (mediaPath) {
          let fullPath = mediaPath
          const normalizedMedia = mediaPath.replace(/\\/g, '/')
          if (!path.isAbsolute(fullPath)) {
            const cleanPath = normalizedMedia.startsWith('/') ? normalizedMedia.substring(1) : normalizedMedia
            const backendRoot = path.join(__dirname, '..')
            fullPath = path.join(backendRoot, cleanPath)
          }

          console.log(`[WHATSAPP:${this.userId}] Resolved media path: ${fullPath}`)
          console.log(`[WHATSAPP:${this.userId}] File exists: ${fs.existsSync(fullPath)}`)

          if (fs.existsSync(fullPath)) {
            try {
              const media = MessageMedia.fromFilePath(fullPath)
              console.log(`[WHATSAPP:${this.userId}] Media loaded: mimetype=${media.mimetype}, filename=${media.filename}`)
              result = await this.client.sendMessage(chatId, media, { caption: text })
              console.log(`[WHATSAPP:${this.userId}] Media message sent successfully`)
            } catch (mediaErr) {
              console.error(`[WHATSAPP:${this.userId}] Failed to send media, falling back to text only:`, mediaErr.message)
              result = await this.client.sendMessage(chatId, text)
            }
          } else {
            console.warn(`[WHATSAPP:${this.userId}] Attachment file not found at: ${fullPath}. Sending text only.`)
            result = await this.client.sendMessage(chatId, text)
          }
        } else {
          result = await this.client.sendMessage(chatId, text)
        }

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

  // Schedule removal of an instance from Map after a grace period.
  // This frees memory when a user's session is fully destroyed with no active UI.
  scheduleInstanceCleanup(userId) {
    const id = userId.toString()
    setTimeout(() => {
      const instance = this.instances.get(id)
      if (instance && !instance.client && !instance.isInitializing) {
        this.instances.delete(id)
        console.log(`[WHATSAPP] Instance for user ${id} removed from memory (idle cleanup)`)
      }
    }, INSTANCE_CLEANUP_DELAY_MS)
  }

  // Clean API methods
  initializeSession(userId) { return this.getInstance(userId).initializeSession() }
  sendWhatsAppMessage(userId, targetNumber, text, mediaPath = null) { return this.getInstance(userId).sendWhatsAppMessage(targetNumber, text, mediaPath) }
  logoutSession(userId) { return this.getInstance(userId).logoutSession() }
  getSessionStatus(userId) { return this.getInstance(userId).getSessionStatus() }
  touchPoll(userId) { return this.getInstance(userId).touchPoll() }
  getIsInitializing(userId) { return this.getInstance(userId).isInitializing }
  hasActiveUiUser(userId) { return this.getInstance(userId).hasActiveUiUser() }

  // destroySession schedules instance cleanup after Chrome is fully dead
  destroySession(userId, manualStop = false) {
    const result = this.getInstance(userId).destroySession(manualStop)
    this.scheduleInstanceCleanup(userId)
    return result
  }

  // Backwards compatibility
  isClientConnected(userId) { return this.getInstance(userId).isClientConnected() }
  isClientStopped(userId) { return this.getInstance(userId).isStopped }
  startClient(userId) { return this.getInstance(userId).initializeSession() }
  stopClient(userId) { return this.destroySession(userId, true) }
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
          initStage: null,
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
