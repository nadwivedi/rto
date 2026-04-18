const QRCode = require('qrcode')
const { Client, LocalAuth } = require('whatsapp-web.js')
const WaSession = require('../models/WaSession')
const path = require('path')
const fs = require('fs')

const AUTH_DATA_PATH = process.env.WHATSAPP_AUTH_DIR || '.wwebjs_auth'
const SESSION_ID = 'rto_system_admin'

class WhatsappService {
  constructor() {
    this.client = null          // set BEFORE initialize (like working system)
    this.startingPromise = null // in-flight dedup guard
    this.isStopped = false
    this.authReceived = false   // blocks stale QR events after scan
  }

  // ─── Status DB helpers ────────────────────────────────────────────────

  async updateStatus(status, extra = {}) {
    await WaSession.findOneAndUpdate(
      {},
      { status, ...extra },
      { upsert: true, new: true }
    )
    console.log(`[WHATSAPP] Status -> ${status}`)
  }

  async getStatus() {
    let session = await WaSession.findOne()
    if (!session) session = await WaSession.create({ sessionId: SESSION_ID })
    return session
  }

  /**
   * Called on server boot — if DB shows 'authenticated', auto-restore the session
   * so messages can be sent without manually clicking Start in the UI.
   * Matches the working system's restoreActiveSessions() pattern.
   */
  async autoRestoreSession() {
    try {
      const session = await WaSession.findOne()
      if (session && (session.status === 'authenticated' || session.status === 'initializing')) {
        console.log('[WHATSAPP] DB shows authenticated/initializing — auto-restoring session...')
        this.startClient()
      } else {
        console.log(`[WHATSAPP] Auto-restore skipped (DB status: ${session?.status || 'none'})`)
      }
    } catch (err) {
      console.error('[WHATSAPP] autoRestoreSession error:', err.message)
    }
  }

  // ─── Lock file cleanup (orphaned Chrome after nodemon restart) ────────

  clearChromeLock() {
    try {
      const sessionDir = path.resolve(AUTH_DATA_PATH, `session-${SESSION_ID}`)
      for (const f of ['SingletonLock', 'SingletonSocket', 'SingletonCookie']) {
        const p = path.join(sessionDir, f)
        if (fs.existsSync(p)) {
          fs.rmSync(p, { force: true })
          console.log(`[WHATSAPP] Cleared lock: ${f}`)
        }
      }
    } catch (err) {
      console.warn('[WHATSAPP] Lock clear warning:', err.message)
    }
  }

  isProfileLockedError(error) {
    return String(error?.message || '').includes('already running')
  }

  // ─── Start: matches working system pattern exactly ───────────────────

  startClient() {
    if (this.startingPromise) {
      console.log('[WHATSAPP] Already starting, skip.')
      return
    }
    if (this.client) {
      console.log('[WHATSAPP] Client already active, skip.')
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
      console.log('[WHATSAPP] Starting session...')

      const client = new Client({
        authStrategy: new LocalAuth({
          clientId: SESSION_ID,
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
        // Don't wait for full page load before firing events
        webVersionCache: { type: 'none' }
      })

      // ── Store client in memory immediately (like working system) ──────
      this.client = client

      // QR event — ignore if scan already accepted
      client.on('qr', async (qr) => {
        if (this.authReceived) {
          console.log('[WHATSAPP] Ignoring stale QR (already authenticated)')
          return
        }
        try {
          console.log('[WHATSAPP] QR received — generating data URL...')
          const qrCodeDataUrl = await QRCode.toDataURL(qr, { width: 300 })
          await this.updateStatus('qr_ready', { qrCodeDataUrl, lastError: null })
        } catch (err) {
          console.error('[WHATSAPP] QR error:', err.message)
        }
      })

      client.on('loading_screen', (pct, msg) => {
        console.log(`[WHATSAPP] Loading ${pct}% — ${msg}`)
      })

      // Authenticated: scan accepted — mark as connected immediately
      // (ready fires later once WhatsApp fully loads in browser)
      client.on('authenticated', async () => {
        this.authReceived = true
        console.log('[WHATSAPP] ✓ Authenticated — session saved!')
        // Set to authenticated immediately so UI shows Connected without waiting for ready
        await this.updateStatus('authenticated', {
          qrCodeDataUrl: null,
          lastError: null
        })
      })

      // Ready: fully connected and usable
      client.on('ready', async () => {
        this.authReceived = true
        const phoneNumber = client?.info?.wid?.user || null
        console.log(`[WHATSAPP] ✅ READY! Phone: ${phoneNumber}`)
        await this.updateStatus('authenticated', {
          qrCodeDataUrl: null,
          phoneNumber,
          lastConnectedAt: new Date(),
          lastError: null
        })
      })

      client.on('auth_failure', async (msg) => {
        console.error('[WHATSAPP] Auth failure:', msg)
        this.client = null
        this.authReceived = false
        await this.updateStatus('auth_failure', { lastError: String(msg) })
      })

      client.on('disconnected', async (reason) => {
        console.log('[WHATSAPP] Disconnected:', reason)
        this.client = null
        this.authReceived = false
        await this.updateStatus('disconnected', {
          qrCodeDataUrl: null,
          lastError: String(reason)
        })
      })

      // ── initialize() AWAITED inside try/catch (like working system) ───
      // It blocks until 'ready' event fires or throws on error.
      await client.initialize()

    } catch (error) {
      const errMsg = String(error?.message || error)
      console.error('[WHATSAPP] Session error:', errMsg)

      if (this.isProfileLockedError(error)) {
        console.warn('[WHATSAPP] Profile locked — clearing lock and retrying in 2s...')
        this.client = null
        this.authReceived = false
        this.clearChromeLock()
        await new Promise(r => setTimeout(r, 2000))
        // Retry once after clearing lock
        return this._doStart()
      }

      this.client = null
      this.authReceived = false
      await this.updateStatus('disconnected', { lastError: errMsg })
    }
  }

  // ─── Stop: kill browser, keep auth on disk ────────────────────────────

  async stopClient() {
    console.log('[WHATSAPP] Stopping...')
    this.isStopped = true
    this.authReceived = false
    const c = this.client
    this.client = null
    if (c) try { await c.destroy() } catch (_) {}
    await this.updateStatus('disconnected', {
      qrCodeDataUrl: null,
      lastError: 'Manually stopped'
    })
  }

  // ─── Logout: kill browser AND wipe auth data from disk ───────────────

  async logoutClient() {
    console.log('[WHATSAPP] Logging out — clearing session data...')
    this.isStopped = true
    this.authReceived = false
    const c = this.client
    this.client = null
    if (c) {
      try { await c.logout() } catch (_) {}
      try { await c.destroy() } catch (_) {}
    }
    try {
      const authDir = path.resolve(AUTH_DATA_PATH, `session-${SESSION_ID}`)
      if (fs.existsSync(authDir)) {
        fs.rmSync(authDir, { recursive: true, force: true })
        console.log('[WHATSAPP] Auth data cleared:', authDir)
      }
    } catch (err) {
      console.error('[WHATSAPP] Could not wipe auth:', err.message)
    }
    await this.updateStatus('disconnected', {
      qrCodeDataUrl: null,
      phoneNumber: null,
      lastError: null
    })
  }

  isClientConnected() {
    return !!this.client && !this.isStopped
  }

  // ─── Send (used by cron) ──────────────────────────────────────────────

  async sendMessage(targetNumber, text) {
    if (this.isStopped) throw new Error('Sending paused. Resume session first.')
    if (!this.client) throw new Error('WhatsApp not initialized.')

    const state = await this.client.getState().catch(() => null)
    if (state !== 'CONNECTED') throw new Error(`Not connected. State: ${state}`)

    let num = targetNumber.replace(/\D/g, '')
    if (num.length === 10) num = '91' + num

    // Use getNumberId() to resolve the correct chat ID — handles @lid format
    // used by newer WhatsApp accounts (avoids 'findChat: new chat not found @lid' error)
    const numberId = await this.client.getNumberId(num).catch(() => null)
    if (!numberId) {
      throw new Error(`${num} is not registered on WhatsApp`)
    }
    const chatId = numberId._serialized  // could be @c.us or @lid depending on account type

    const result = await this.client.sendMessage(chatId, text)
    return { success: true, messageId: result?.id?._serialized }
  }
}

module.exports = new WhatsappService()
