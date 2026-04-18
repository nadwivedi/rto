const QRCode = require('qrcode')
const { Client, LocalAuth } = require('whatsapp-web.js')
const WaSession = require('../models/WaSession')
const path = require('path')
const fs = require('fs')

const AUTH_DATA_PATH = process.env.WHATSAPP_AUTH_DIR || '.wwebjs_auth'

class WhatsappUserClient {
  constructor(userId) {
    this.userId = userId.toString()
    this.sessionId = `user_${this.userId}`
    this.client = null
    this.startingPromise = null
    this.isStopped = false
    this.authReceived = false
  }

  async updateStatus(status, extra = {}) {
    await WaSession.findOneAndUpdate(
      { userId: this.userId },
      { status, ...extra },
      { upsert: true, new: true }
    )
    console.log(`[WHATSAPP:${this.userId}] Status -> ${status}`)
  }

  async getStatus() {
    let session = await WaSession.findOne({ userId: this.userId })
    if (!session) session = await WaSession.create({ userId: this.userId, status: 'disconnected' })
    return session
  }

  clearChromeLock() {
    try {
      const sessionDir = path.resolve(AUTH_DATA_PATH, `session-${this.sessionId}`)
      for (const f of ['SingletonLock', 'SingletonSocket', 'SingletonCookie']) {
        const p = path.join(sessionDir, f)
        if (fs.existsSync(p)) {
          fs.rmSync(p, { force: true })
          console.log(`[WHATSAPP:${this.userId}] Cleared lock: ${f}`)
        }
      }
    } catch (err) {
      console.warn(`[WHATSAPP:${this.userId}] Lock clear warning:`, err.message)
    }
  }

  isProfileLockedError(error) {
    return String(error?.message || '').includes('already running')
  }

  startClient() {
    if (this.startingPromise) {
      console.log(`[WHATSAPP:${this.userId}] Already starting, skip.`)
      return
    }
    if (this.client) {
      console.log(`[WHATSAPP:${this.userId}] Client already active, skip.`)
      return
    }

    this.isStopped = false
    this.authReceived = false
    this.clearChromeLock()

    this.startingPromise = this._doStart().finally(() => {
      this.startingPromise = null
    })
  }

  async _doStart() {
    try {
      await this.updateStatus('initializing', { qrCodeDataUrl: null, lastError: null })
      console.log(`[WHATSAPP:${this.userId}] Starting session...`)

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
            '--disable-web-security'
          ]
        },
        webVersionCache: { type: 'none' }
      })

      this.client = client

      client.on('qr', async (qr) => {
        if (this.authReceived) return
        try {
          const qrCodeDataUrl = await QRCode.toDataURL(qr, { width: 300 })
          await this.updateStatus('qr_ready', { qrCodeDataUrl, lastError: null })
        } catch (err) {
          console.error(`[WHATSAPP:${this.userId}] QR error:`, err.message)
        }
      })

      client.on('authenticated', async () => {
        this.authReceived = true
        console.log(`[WHATSAPP:${this.userId}] ✓ Authenticated — session saved!`)
        await this.updateStatus('authenticated', {
          qrCodeDataUrl: null,
          lastError: null
        })
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
      })

      client.on('auth_failure', async (msg) => {
        console.error(`[WHATSAPP:${this.userId}] Auth failure:`, msg)
        this.client = null
        this.authReceived = false
        await this.updateStatus('auth_failure', { lastError: String(msg) })
      })

      client.on('disconnected', async (reason) => {
        console.log(`[WHATSAPP:${this.userId}] Disconnected:`, reason)
        this.client = null
        this.authReceived = false
        await this.updateStatus('disconnected', { qrCodeDataUrl: null, lastError: String(reason) })
      })

      await client.initialize()

    } catch (error) {
      const errMsg = String(error?.message || error)
      console.error(`[WHATSAPP:${this.userId}] Session error:`, errMsg)

      if (this.isProfileLockedError(error)) {
        console.warn(`[WHATSAPP:${this.userId}] Profile locked — clearing and retrying...`)
        this.client = null
        this.authReceived = false
        this.clearChromeLock()
        await new Promise(r => setTimeout(r, 2000))
        return this._doStart()
      }

      this.client = null
      this.authReceived = false
      await this.updateStatus('disconnected', { lastError: errMsg })
    }
  }

  async stopClient() {
    console.log(`[WHATSAPP:${this.userId}] Stopping...`)
    this.isStopped = true
    this.authReceived = false
    const c = this.client
    this.client = null
    if (c) try { await c.destroy() } catch (_) {}
    await this.updateStatus('disconnected', { qrCodeDataUrl: null, lastError: 'Manually stopped' })
  }

  async logoutClient() {
    console.log(`[WHATSAPP:${this.userId}] Logging out — clearing session data...`)
    this.isStopped = true
    this.authReceived = false
    const c = this.client
    this.client = null
    if (c) {
      try { await c.logout() } catch (_) {}
      try { await c.destroy() } catch (_) {}
    }
    try {
      const authDir = path.resolve(AUTH_DATA_PATH, `session-${this.sessionId}`)
      if (fs.existsSync(authDir)) fs.rmSync(authDir, { recursive: true, force: true })
    } catch (err) {}
    await this.updateStatus('disconnected', { qrCodeDataUrl: null, phoneNumber: null, lastError: null })
  }

  isClientConnected() {
    return !!this.client && !this.isStopped
  }

  async sendMessage(targetNumber, text) {
    if (this.isStopped) throw new Error('Sending paused. Resume session first.')
    if (!this.client) throw new Error('WhatsApp not initialized.')

    const state = await this.client.getState().catch(() => null)
    if (state !== 'CONNECTED') throw new Error(`Not connected. State: ${state}`)

    let num = targetNumber.replace(/\D/g, '')
    if (num.length === 10) num = '91' + num

    const numberId = await this.client.getNumberId(num).catch(() => null)
    if (!numberId) throw new Error(`${num} is not registered on WhatsApp`)

    const chatId = numberId._serialized

    const result = await this.client.sendMessage(chatId, text)
    return { success: true, messageId: result?.id?._serialized }
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

  async autoRestoreSession() {
    try {
      const sessions = await WaSession.find({ status: { $in: ['authenticated', 'initializing'] } })
      if (sessions.length > 0) {
        console.log(`[WHATSAPP-MANAGER] Restoring ${sessions.length} sessions...`)
        for (const s of sessions) {
          if (s.userId) {
            this.getInstance(s.userId).startClient()
          }
        }
      }
    } catch (err) {
      console.error('[WHATSAPP-MANAGER] autoRestoreSession error:', err.message)
    }
  }

  // Proxies to individual user instances
  getStatus(userId) { return this.getInstance(userId).getStatus() }
  startClient(userId) { return this.getInstance(userId).startClient() }
  stopClient(userId) { return this.getInstance(userId).stopClient() }
  logoutClient(userId) { return this.getInstance(userId).logoutClient() }
  isClientConnected(userId) { return this.getInstance(userId).isClientConnected() }
  isClientStopped(userId) { return this.getInstance(userId).isStopped }
  sendMessage(userId, targetNumber, text) { return this.getInstance(userId).sendMessage(targetNumber, text) }
}

module.exports = new WhatsappServiceManager()
