const QRCode = require('qrcode')
const { Client, LocalAuth } = require('whatsapp-web.js')
const WaSession = require('../models/WaSession')
const path = require('path')
const fs = require('fs')

const AUTH_DATA_PATH = process.env.WHATSAPP_AUTH_DIR || '.wwebjs_auth'
const IDLE_TIMEOUT_MS = 15 * 60 * 1000 // 15 minutes
// Waiting-for-QR timeout is kept short and is refreshed on every /status poll (see touchPoll)
// rather than on a fixed clock, so it really means "5 minutes since anyone last looked at the page".
const QR_IDLE_TIMEOUT_MS = 5 * 60 * 1000

class WhatsappUserClient {
  constructor(userId) {
    this.userId = userId.toString()
    this.sessionId = `user_${this.userId}`
    this.client = null
    this.isStopped = false
    this.authReceived = false
    
    // Idle timeout tracking
    this.idleTimer = null
    
    // Concurrency / Queue lock
    this.taskQueue = Promise.resolve()
  }

  // Enqueue async tasks to prevent multiple Chrome instances launching simultaneously
  enqueueTask(taskFn) {
    return new Promise((resolve, reject) => {
      this.taskQueue = this.taskQueue.then(async () => {
        try {
          const result = await taskFn()
          resolve(result)
        } catch (error) {
          reject(error)
        }
      })
    })
  }

  resetIdleTimeout(isQr = false) {
    if (this.idleTimer) clearTimeout(this.idleTimer)
    const timeout = isQr ? QR_IDLE_TIMEOUT_MS : IDLE_TIMEOUT_MS
    this.idleTimer = setTimeout(async () => {
      console.log(`[WHATSAPP:${this.userId}] Session idle for ${timeout/1000/60} minutes. Destroying client to free RAM...`)
      // If we were still waiting for a QR scan, clear the now-dead QR from the DB so the
      // frontend doesn't keep showing an expired code. Marking disconnected lets the UI
      // auto-restart and fetch a fresh QR.
      if (isQr && !this.authReceived) {
        await this.updateStatus('disconnected', {
          qrCodeDataUrl: null,
          lastError: 'QR code expired. Restart to get a fresh code.'
        }).catch(() => {})
      }
      this.destroySession()
    }, timeout)
  }

  // Called on every /status poll while a QR/handshake is pending. As long as the frontend
  // keeps polling (i.e. the user is actually on the WhatsApp page), this keeps pushing the
  // abandonment timer out so the browser stays alive. The moment polling stops — user
  // navigated away, closed the tab, lost connection — the timer is left alone and fires
  // QR_IDLE_TIMEOUT_MS after that last poll, freeing the RAM nobody was using.
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

  isProfileLockedError(error) {
    return String(error?.message || '').includes('already running')
  }

  // Internal initialization to avoid queue deadlocks
  async _init() {
    if (this.client) {
      this.resetIdleTimeout()
      return
    }

    this.isStopped = false
    this.authReceived = false
    this.clearChromeLock()

    try {
      await this.updateStatus('initializing', { qrCodeDataUrl: null, lastError: null })
      console.log(`[WHATSAPP:${this.userId}] Instantiating low-memory browser...`)

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
            '--no-zygote',
            '--disable-features=site-per-process',
            '--disable-web-security'
          ]
        },
        webVersionCache: { type: 'none' }
      })

      this.client = client

      // Wait for ready or QR or disconnected
      await new Promise((resolve, reject) => {
        client.on('qr', async (qr) => {
          if (this.authReceived) return
          try {
            const qrCodeDataUrl = await QRCode.toDataURL(qr, { width: 300 })
            await this.updateStatus('qr_ready', { qrCodeDataUrl, lastError: null })
            this.resetIdleTimeout(true) // Start longer idle since we are waiting for QR
            resolve()
          } catch (err) {
            console.error(`[WHATSAPP:${this.userId}] QR error:`, err.message)
            resolve()
          }
        })

        client.on('authenticated', async () => {
          this.authReceived = true
          console.log(`[WHATSAPP:${this.userId}] ✓ Authenticated.`)
          await this.updateStatus('authenticated', { qrCodeDataUrl: null, lastError: null })
        })

        client.on('ready', async () => {
          this.authReceived = true
          const phoneNumber = client?.info?.wid?.user || null
          console.log(`[WHATSAPP:${this.userId}] ✅ READY! Phone: ${phoneNumber}`)
          await this.updateStatus('authenticated', {
            qrCodeDataUrl: null,
            phoneNumber,
            lastConnectedAt: new Date(),
            lastError: null
          })
          this.resetIdleTimeout()
          resolve() // Fully initialized
        })

        client.on('auth_failure', async (msg) => {
          console.error(`[WHATSAPP:${this.userId}] Auth failure:`, msg)
          await this.updateStatus('auth_failure', { lastError: String(msg) })
          this.destroySession()
          reject(new Error('Auth failure: ' + msg))
        })

        client.on('disconnected', async (reason) => {
          console.log(`[WHATSAPP:${this.userId}] Disconnected reason:`, reason)
          await this.updateStatus('disconnected', { qrCodeDataUrl: null, lastError: String(reason) })
          if (reason !== 'NAVIGATION') {
            this.destroySession()
          }
        })

        client.initialize().catch(err => reject(err))
      })
    } catch (error) {
      const errMsg = String(error?.message || error)
      console.error(`[WHATSAPP:${this.userId}] Init error:`, errMsg)
      this.destroySession()
      await this.updateStatus('disconnected', { lastError: errMsg })
      throw error
    }
  }

  initializeSession() {
    return this.enqueueTask(() => this._init())
  }

  async destroySession(manualStop = false) {
    if (manualStop) {
      this.isStopped = true
      this.updateStatus('disconnected', { qrCodeDataUrl: null, lastError: 'Manually stopped' }).catch(()=>{})
    }
    
    if (this.idleTimer) clearTimeout(this.idleTimer)
    
    const clientRef = this.client
    this.client = null
    this.authReceived = false
    
    if (clientRef) {
      try {
        console.log(`[WHATSAPP:${this.userId}] Destroying puppeteer browser...`)
        await clientRef.destroy()
      } catch (err) {
      } finally {
        this.clearChromeLock()
      }
    }
  }

  logoutSession() {
    return this.enqueueTask(async () => {
      this.isStopped = true
      if (this.idleTimer) clearTimeout(this.idleTimer)
      
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
      } catch(e) {}
      
      await this.updateStatus('disconnected', { qrCodeDataUrl: null, phoneNumber: null, lastError: null })
      this.clearChromeLock()
    })
  }

  // Tear down the browser AND wipe saved auth, marking the user disconnected. Unlike
  // logoutSession this does NOT set isStopped, so the WhatsApp page can auto-start and show
  // a fresh QR for the user to re-scan. Used when a lazy connect during send fails — per the
  // rule "if we can't connect while sending, mark the user logged out". Assumes it's already
  // running inside the task queue (called from sendWhatsAppMessage), so it does not enqueue.
  async _forceLoggedOut(reason) {
    if (this.idleTimer) clearTimeout(this.idleTimer)
    const clientRef = this.client
    this.client = null
    this.authReceived = false
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

      // Call internal init directly to prevent queue deadlock
      if (!this.client) {
        await this._init()
      }

      this.resetIdleTimeout()

      // Lazy cold-start finished but we never authenticated — the saved session on disk is
      // invalid/expired (init resolved on a QR instead of 'ready'). Mark logged out so the
      // user is prompted to re-scan, rather than looping on a dead session forever.
      if (!this.authReceived) {
        await this._forceLoggedOut('WhatsApp session expired. Please scan the QR code again to reconnect.')
        throw new Error('WhatsApp not connected — session logged out. Please re-scan the QR code.')
      }

      try {
        const state = await this.client.getState().catch(() => null)
        if (state !== 'CONNECTED') {
           await this._forceLoggedOut(`WhatsApp disconnected (state: ${state}). Please scan the QR code again to reconnect.`)
           throw new Error(`WhatsApp not connected (state: ${state}) — session logged out. Please re-scan the QR code.`)
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
        if (err.message.includes('Session closed') || err.message.includes('Target closed') || err.message.includes('Not connected')) {
            console.warn(`[WHATSAPP:${this.userId}] Browser crashed during send. Tearing down.`)
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
  
  // Backwards compatibility methods temporarily retained if called directly
  isClientConnected(userId) { return this.getInstance(userId).isClientConnected() }
  isClientStopped(userId) { return this.getInstance(userId).isStopped }
  startClient(userId) { return this.getInstance(userId).initializeSession() }
  stopClient(userId) { return this.getInstance(userId).destroySession(true) }
  logoutClient(userId) { return this.getInstance(userId).logoutSession() }
  getStatus(userId) { return this.getInstance(userId).getSessionStatus() }
  sendMessage(userId, num, txt) { return this.sendWhatsAppMessage(userId, num, txt) }

  // On server restart we intentionally DO NOT launch any browsers or verify anyone's auth.
  // Authenticated users are left in their "sleeping" state — the saved auth stays on disk and
  // the browser is cold-started lazily on the next send (or when the user opens the QR page).
  // If that lazy connect fails, sendWhatsAppMessage marks the user logged out at that point.
  //
  // The only thing we tidy up here is sessions that were mid-handshake (qr_ready / initializing)
  // when the process died: their in-memory client is gone and the stored QR is stale, so we flip
  // them to disconnected. No browser is started for anyone.
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
        console.log(`[WHATSAPP] Cleared ${stale.modifiedCount} stale mid-handshake session(s) after restart. No browsers launched.`)
      }
    } catch (error) {
      console.error('[WHATSAPP] Error clearing stale sessions on startup:', error)
    }
  }
}

module.exports = new WhatsappServiceManager()
