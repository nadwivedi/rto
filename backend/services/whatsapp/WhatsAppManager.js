const fs = require('fs')
const path = require('path')
const { WhatsAppSession, STATE } = require('./WhatsAppSession')

// Limits how many WhatsApp browsers exist at once (config.maxActiveSessions). A session takes a
// slot when it starts and gives it back when its browser is closed; others queue in FIFO order.
class Semaphore {
  constructor(max) {
    this.max = max
    this.active = 0
    this.queue = []
  }
  get waiting() {
    return this.queue.length
  }

  acquire() {
    return new Promise(resolve => {
      const grant = () => {
        this.active++
        let released = false
        resolve(() => {
          if (released) return
          released = true
          this.active--
          const next = this.queue.shift()
          if (next) next()
        })
      }
      if (this.active < this.max) grant()
      else this.queue.push(grant)
    })
  }
}

class WhatsAppManager {
  /**
   * @param {object} deps  config, store, createClient, log, toQrDataUrl, chrome
   */
  constructor(deps) {
    this.deps = deps
    this.config = deps.config
    this.sessions = new Map()
    this.launchSlots = new Semaphore(this.config.maxActiveSessions)
    this.watchdog = null
    this.shuttingDown = false
  }

  session(userId) {
    const id = String(userId)
    let s = this.sessions.get(id)
    if (!s) {
      s = new WhatsAppSession(id, {
        ...this.deps,
        launchSlots: this.launchSlots,
        onReady: (userId) => this.readyHandler?.(userId),
      })
      this.sessions.set(id, s)
    }
    return s
  }

  // ── API used by routes / jobs ──────────────────────────────────────────────

  async getStatus(userId, { watching = false } = {}) {
    const s = this.session(userId)
    await s.hydrate()
    if (watching) s.touchPoll()
    return s.snapshot()
  }

  connect(userId) { return this._guard(() => this.session(userId).connect()) }
  stop(userId) { return this.session(userId).stop() }
  cancel(userId) { return this.session(userId).cancel() }
  logout(userId) { return this.session(userId).logout() }
  renewQr(userId) { return this._guard(() => this.session(userId).renewQr()) }
  ensureRunning(userId, reason) { return this._guard(() => this.session(userId).ensureRunning(reason)) }

  sendWhatsAppMessage(userId, targetNumber, text, mediaPath = null) {
    return this.session(userId).send(targetNumber, text, mediaPath)
  }

  // Lets the sender skip a user without launching Chrome when nothing can be sent anyway.
  async canSend(userId) {
    const s = this.session(userId)
    await s.hydrate()
    return { ok: !this.shuttingDown && s.canSendInBackground(), reason: s.state }
  }

  // Called every time a session becomes ready (set by the message sender job).
  setReadyHandler(fn) {
    this.readyHandler = fn
  }

  // After a send batch: close the browser if it is idle (on-demand mode only).
  closeIfIdle(userId) {
    return this.sessions.get(String(userId))?.closeIfIdle()
  }

  getChromePid(userId) {
    return this.sessions.get(String(userId))?.chromePid || null
  }

  _guard(fn) {
    if (this.shuttingDown) return Promise.reject(new Error('Server is shutting down'))
    return fn()
  }

  // ── Startup ────────────────────────────────────────────────────────────────

  async start() {
    this._cleanupAuthDir()
    await this._restoreSessions()
    this.watchdog = setInterval(() => this._tick(), this.config.watchdogIntervalMs)
    this.watchdog.unref?.()
  }

  // Any Chrome still using the auth folder at boot belongs to a previous server process.
  _cleanupAuthDir() {
    const { chrome, log, config } = this.deps
    fs.mkdirSync(config.authDir, { recursive: true })
    const killed = chrome.killOrphanChromes(config.authDir)
    if (killed.length) log.warn('', 'ORPHAN_CHROME_KILLED', `Killed ${killed.length} Chrome process(es) left by the previous server run`)
    for (const dir of fs.readdirSync(config.authDir)) {
      if (dir.startsWith('session-')) chrome.removeLockFiles(path.join(config.authDir, dir))
    }
    log.info('', 'STARTUP', `Auth folder: ${config.authDir} | keep-alive: ${config.keepAlive} | max active sessions: ${config.maxActiveSessions}`)
    // Chrome stores WhatsApp Web data ~130 characters deep inside the profile. Past Windows'
    // 260-character path limit that storage fails and WhatsApp Web reloads forever (no QR).
    if (process.platform === 'win32' && path.resolve(config.authDir).length > 110) {
      log.warn('', 'AUTH_PATH_TOO_LONG', `Auth folder path is ${path.resolve(config.authDir).length} characters — use a shorter WHATSAPP_AUTH_DIR (e.g. C:\wa-auth)`)
    }
  }

  async _restoreSessions() {
    const { store, log } = this.deps
    const docs = await store.list().catch(err => {
      log.error('', 'STARTUP_ERROR', `Could not load sessions: ${err.message}`)
      return []
    })

    const toStart = []
    for (const doc of docs) {
      const s = this.session(doc.userId)
      await s.hydrate()
      // Write back the normalized state: "initializing"/"qr_ready" from the previous process are stale.
      await s._persist()
      if (this.config.keepAlive && s.autoStart && s.state === STATE.DISCONNECTED && s.hasSavedSession()) toStart.push(s)
    }

    log.info('', 'STARTUP_RESTORE', `${toStart.length} session(s) will be restored`)
    toStart.forEach((s, i) => {
      const t = setTimeout(() => {
        if (!this.shuttingDown) s.ensureRunning('boot').catch(() => {})
      }, 3000 + i * this.config.bootStaggerMs)
      t.unref?.()
    })
  }

  async _tick() {
    if (this.shuttingDown) return
    for (const s of this.sessions.values()) {
      try {
        await s.healthCheck()
        // keep-alive: a connected session whose browser is gone (and no reconnect pending) is restarted
        if (this.config.keepAlive && s.autoStart && s.state === STATE.DISCONNECTED && !s.reconnectTimer && !s.isRunning() && s.hasSavedSession()) {
          s.ensureRunning('keep-alive').catch(() => {})
        }
      } catch (err) {
        this.deps.log.error(s.userId, 'WATCHDOG_ERROR', err.message)
      }
    }
  }

  // ── Shutdown ───────────────────────────────────────────────────────────────

  async shutdown() {
    if (this.shuttingDown) return
    this.shuttingDown = true
    if (this.watchdog) clearInterval(this.watchdog)
    const running = [...this.sessions.values()].filter(s => s.isRunning())
    this.deps.log.info('', 'SHUTDOWN', `Closing ${running.length} WhatsApp browser(s)`)
    await Promise.allSettled([...this.sessions.values()].map(s => s.shutdown()))
  }
}

module.exports = { WhatsAppManager, Semaphore }
