const path = require('path')
const fs = require('fs')
const { WaUnavailableError, WaRecipientError, withTimeout } = require('./errors')

// Session states. The string values are what the API/DB expose ("authenticated" = ready to send,
// kept for compatibility with the dashboard badge).
const STATE = {
  DISCONNECTED: 'disconnected', // no browser running
  INITIALIZING: 'initializing', // browser starting / WhatsApp Web loading
  QR: 'qr_ready',               // waiting for the user to scan
  SYNCING: 'syncing',           // scanned / login accepted, loading chats
  READY: 'authenticated',       // connected, can send
  NEEDS_QR: 'needs_qr',         // saved login is gone or invalid — only a QR scan can fix it
  STOPPED: 'stopped',           // user paused sending
}

// whatsapp-web.js "disconnected" reasons that mean the linked device was removed.
const LOGGED_OUT_REASONS = new Set(['LOGOUT', 'UNPAIRED', 'UNPAIRED_IDLE'])

// Launch errors worth an immediate retry: WhatsApp Web often reloads itself while it first loads,
// which whatsapp-web.js reports as a destroyed execution context.
const TRANSIENT_LAUNCH = /Execution context was destroyed|navigation|Target closed|Session closed|detached Frame|net::ERR_|Navigating frame was detached|Protocol error/i
const MAX_LAUNCH_RETRIES = 2

const BROWSER_GONE = /Target closed|Session closed|Protocol error|detached Frame|Connection closed|Execution context was destroyed|Not attached|browser has disconnected|timed out/i

// Serializes async work. Every lifecycle change (start/stop/logout/crash handling) runs through
// one of these per user, so two browsers can never be started for the same profile.
class Mutex {
  constructor() { this._tail = Promise.resolve() }
  run(fn) {
    const result = this._tail.then(() => fn())
    this._tail = result.catch(() => {})
    return result
  }
}

class WhatsAppSession {
  /**
   * @param {string} userId
   * @param {object} deps
   *   config, store, createClient({clientId, dataPath}), launchSlots, log, toQrDataUrl(qr),
   *   chrome: { killOrphanChromes, removeLockFiles, hasSavedSession, hasWhatsAppData, markLinked,
   *             clearLinked, wipeProfile, killPid, isPidAlive }
   */
  constructor(userId, deps) {
    this.userId = String(userId)
    this.sessionId = `user_${this.userId}`
    this.deps = deps
    this.config = deps.config
    this.profileDir = path.join(this.config.authDir, `session-${this.sessionId}`)

    this.state = STATE.DISCONNECTED
    this.initStage = null
    this.qrDataUrl = null
    this.qrStartedAt = null
    this.lastPollAt = 0
    this.phoneNumber = null
    this.lastConnectedAt = null
    this.lastError = null
    this.autoStart = false // restore this session automatically (boot / crash)
    this.nextReconnectAt = null

    this.client = null
    this.chromePid = null
    this.generation = 0     // bumped on every launch/teardown; events from older browsers are ignored
    this.allowQr = false    // false for background starts: a QR means "login lost", not "show it"
    this.lock = new Mutex()
    this.sendLock = new Mutex()
    this.readyWaiters = new Set()
    this.reconnectAttempts = 0
    this.reconnectTimer = null
    this.launchTimer = null
    this.releaseLaunchSlot = null
    this.healthFails = 0
    this.launchRetries = 0
    this.sendsInFlight = 0
    this.lastActivityAt = Date.now()
    this.startedAt = null

    this._saveChain = Promise.resolve()
    this._hydrated = null
  }

  // ── Persistence ────────────────────────────────────────────────────────────

  hydrate() {
    if (!this._hydrated) {
      this._hydrated = (async () => {
        const doc = await this.deps.store.load(this.userId).catch(() => null)
        if (!doc) return
        this.phoneNumber = doc.phoneNumber || null
        this.lastConnectedAt = doc.lastConnectedAt || null
        this.lastError = doc.lastError || null
        // Documents written before the redesign have no autoStart field.
        this.autoStart = typeof doc.autoStart === 'boolean'
          ? doc.autoStart
          : doc.status === 'authenticated' && !doc.isStopped
        // Sessions linked before the marker file existed: trust the old record once.
        const everLinked = doc.status === 'authenticated' || !!doc.lastConnectedAt
        if (everLinked && doc.autoStart !== false && this.deps.chrome.hasWhatsAppData(this.profileDir) && !this.hasSavedSession()) {
          this.deps.chrome.markLinked(this.profileDir, { migrated: true })
        }
        if (doc.status === STATE.STOPPED || doc.isStopped) this.state = STATE.STOPPED
        else if (doc.status === STATE.NEEDS_QR || doc.status === 'auth_failure') this.state = STATE.NEEDS_QR
        else this.state = STATE.DISCONNECTED // nothing is running in this process yet
      })()
    }
    return this._hydrated
  }

  _persist() {
    const snapshot = {
      sessionId: this.sessionId,
      status: this.state,
      initStage: this.initStage,
      phoneNumber: this.phoneNumber,
      lastConnectedAt: this.lastConnectedAt,
      lastError: this.lastError,
      isStopped: this.state === STATE.STOPPED,
      autoStart: this.autoStart,
      qrCodeDataUrl: null,
    }
    // Chained so an older write can never land after a newer one.
    this._saveChain = this._saveChain
      .then(() => this.deps.store.save(this.userId, snapshot))
      .catch(err => this.deps.log.warn(this.userId, 'DB_SAVE_FAILED', err.message))
    return this._saveChain
  }

  _setState(state, extra = {}) {
    const prev = this.state
    this.state = state
    for (const [k, v] of Object.entries(extra)) this[k] = v
    if (state !== STATE.INITIALIZING) this.initStage = extra.initStage ?? null
    if (state !== STATE.QR) { this.qrDataUrl = null; this.qrStartedAt = null }
    if (prev !== state) this.deps.log.info(this.userId, 'STATE', `${prev} -> ${state}${this.lastError && state !== STATE.READY ? ` (${this.lastError})` : ''}`)
    if (state === STATE.READY) this._resolveWaiters()
    else if (![STATE.INITIALIZING, STATE.SYNCING].includes(state)) {
      this._rejectWaiters(this._unavailableError())
    }
    return this._persist()
  }

  // ── Status ─────────────────────────────────────────────────────────────────

  hasSavedSession() {
    return this.deps.chrome.hasSavedSession(this.profileDir)
  }

  isRunning() {
    return !!this.client
  }

  // A browser exists, or a launch is queued waiting for a free launch slot.
  _isStarting() {
    return !!this.client || [STATE.INITIALIZING, STATE.SYNCING].includes(this.state)
  }

  touchPoll() {
    this.lastPollAt = Date.now()
  }

  snapshot() {
    return {
      status: this.state,
      initStage: this.initStage,
      qrCodeDataUrl: this.state === STATE.QR ? this.qrDataUrl : null,
      qrExpiresAt: this.state === STATE.QR && this.qrStartedAt
        ? new Date(this.qrStartedAt + this.config.qrMaxMs).toISOString()
        : null,
      phoneNumber: this.phoneNumber,
      lastConnectedAt: this.lastConnectedAt,
      lastError: this.lastError,
      isStopped: this.state === STATE.STOPPED,
      isInitializing: [STATE.INITIALIZING, STATE.SYNCING].includes(this.state),
      clientActive: this.state === STATE.READY,
      hasSavedSession: this.hasSavedSession(),
      nextReconnectAt: this.nextReconnectAt ? new Date(this.nextReconnectAt).toISOString() : null,
      startedAt: this.startedAt ? new Date(this.startedAt).toISOString() : null,
      keepAlive: this.config.keepAlive,
    }
  }

  // ── Public lifecycle (all serialized) ──────────────────────────────────────

  // User clicked Connect / Resume: start and show a QR if one is needed.
  connect() {
    return this.lock.run(async () => {
      await this.hydrate()
      this._clearReconnect()
      if (this._isStarting()) {
        // A background restore is already running — let it show a QR if the login turns out invalid.
        this.allowQr = true
        if (this.state === STATE.QR) this.lastPollAt = Date.now()
        return
      }
      await this._launch({ allowQr: true, reason: 'user' })
    })
  }

  // Background start (boot, reconnect, message send). Never shows a QR.
  ensureRunning(reason = 'background') {
    return this.lock.run(async () => {
      await this.hydrate()
      if (this._isStarting()) return
      if ([STATE.STOPPED, STATE.NEEDS_QR].includes(this.state)) return
      if (!this.hasSavedSession()) return
      await this._launch({ allowQr: false, reason })
    })
  }

  // Pause: close the browser, keep the login on disk.
  stop() {
    return this.lock.run(async () => {
      await this.hydrate()
      this._clearReconnect()
      await this._teardown()
      await this._setState(STATE.STOPPED, { lastError: null, autoStart: false })
    })
  }

  // Cancel a QR / connection attempt without changing the saved login.
  cancel() {
    return this.lock.run(async () => {
      await this.hydrate()
      this._clearReconnect()
      await this._teardown()
      await this._setState(this.hasSavedSession() ? STATE.DISCONNECTED : STATE.NEEDS_QR, { lastError: null })
    })
  }

  // Unlink the device and delete the saved login.
  logout() {
    return this.lock.run(async () => {
      await this.hydrate()
      this._clearReconnect()
      const client = this.client
      if (client && this.state === STATE.READY) {
        await withTimeout(client.logout(), 20000, 'logout').catch(() => {})
      }
      await this._teardown()
      this.deps.chrome.wipeProfile(this.profileDir)
      await this._setState(STATE.DISCONNECTED, { phoneNumber: null, lastError: null, autoStart: false })
      this.deps.log.info(this.userId, 'LOGOUT', 'Logged out and saved session deleted')
    })
  }

  // Fresh QR: restart the browser in "show QR" mode.
  renewQr() {
    return this.lock.run(async () => {
      await this.hydrate()
      this._clearReconnect()
      await this._teardown()
      await this._launch({ allowQr: true, reason: 'renew-qr' })
    })
  }

  // Server shutdown: close Chrome cleanly so the login is flushed to disk. State is left as-is
  // in the DB (autoStart stays true) so the session is restored on the next boot.
  shutdown() {
    return this.lock.run(async () => {
      this._clearReconnect()
      await this._teardown()
    })
  }

  // ── Launch / teardown (must run inside this.lock) ──────────────────────────

  async _launch({ allowQr, reason, retry = false }) {
    if (!retry) this.launchRetries = 0
    const gen = ++this.generation
    this.allowQr = allowQr
    this.startedAt = Date.now()
    this.healthFails = 0
    this.deps.log.info(this.userId, 'LAUNCH', `Starting WhatsApp (${reason}, qr ${allowQr ? 'allowed' : 'not allowed'})`)
    await this._setState(STATE.INITIALIZING, { initStage: 'waiting', lastError: null, nextReconnectAt: null })
    this._launchReason = reason

    // Not awaited: browser start-up takes up to minutes and must not block stop/logout.
    this._runLaunch(gen).catch(err => this._onLaunchFailed(gen, err))
  }

  async _runLaunch(gen) {
    if (this.deps.launchSlots.active >= this.deps.launchSlots.max) {
      this.deps.log.info(this.userId, 'WAITING_FOR_SLOT', 'Another WhatsApp session is active — waiting for it to finish')
    }
    const release = await this.deps.launchSlots.acquire()
    let released = false
    const releaseOnce = () => { if (!released) { released = true; release() } }
    if (gen !== this.generation) return releaseOnce() // cancelled while waiting for a slot
    this.releaseLaunchSlot = releaseOnce

    // Everything from here to `this.client = client` is synchronous, so a concurrent teardown
    // either sees no client (and bumps generation first) or sees this one.
    const killed = this.deps.chrome.killOrphanChromes(this.profileDir)
    if (killed.length) this.deps.log.warn(this.userId, 'ORPHAN_CHROME_KILLED', `Killed leftover Chrome process(es): ${killed.join(', ')}`)
    if (!this.hasSavedSession()) {
      // No linked login in this profile, so nothing worth keeping. Leftover WhatsApp Web data from
      // an earlier unfinished attempt makes the page reload itself during start-up, and then no
      // QR code ever appears. Start from a clean profile.
      this.deps.chrome.wipeProfile(this.profileDir)
    }
    this.deps.chrome.removeLockFiles(this.profileDir)

    const client = this.deps.createClient({ clientId: this.sessionId, dataPath: this.config.authDir })
    this.client = client
    this._attachClientEvents(client, gen)
    this.initStage = 'launching_browser'
    this._persist()

    this.launchTimer = setTimeout(() => {
      this._onLaunchFailed(gen, new Error(`WhatsApp did not load within ${Math.round(this.config.launchTimeoutMs / 1000)}s`))
    }, this.config.launchTimeoutMs)

    // Show "loading WhatsApp Web" once the browser process exists.
    const stageTimer = setInterval(() => {
      if (gen !== this.generation || this.state !== STATE.INITIALIZING) return clearInterval(stageTimer)
      if (this._capturePid(client) && this.initStage !== 'loading_wweb') {
        this.initStage = 'loading_wweb'
        this._persist()
      }
    }, 1000)
    stageTimer.unref?.()

    try {
      await client.initialize()
    } finally {
      clearInterval(stageTimer)
    }
  }

  _capturePid(client) {
    try {
      const pid = client.pupBrowser?.process?.()?.pid
      if (pid) this.chromePid = pid
      return !!client.pupBrowser
    } catch (_) {
      return false
    }
  }

  _attachClientEvents(client, gen) {
    const live = () => gen === this.generation
    let browserWatched = false
    const watchBrowser = () => {
      this._capturePid(client)
      if (browserWatched || !client.pupBrowser) return
      browserWatched = true
      // Chrome crashed or was killed by the OS (e.g. out of memory).
      client.pupBrowser.on('disconnected', () => {
        if (live()) this._onCrash(gen, 'Browser closed unexpectedly')
      })
      client.pupPage?.on?.('error', err => {
        if (live()) this._onCrash(gen, `WhatsApp page crashed: ${err?.message || err}`)
      })
      // whatsapp-web.js swallows errors thrown while it finishes the login, which shows up only as
      // "ready" never arriving. Log page errors during start-up so the cause is visible.
      client.pupPage?.on?.('pageerror', err => {
        if (live() && [STATE.INITIALIZING, STATE.SYNCING].includes(this.state)) {
          this.deps.log.warn(this.userId, 'PAGE_ERROR', String(err?.message || err).slice(0, 500))
        }
      })
    }

    client.on('qr', async (qr) => {
      if (!live()) return
      watchBrowser()
      this._finishLaunchPhase()
      if (!this.allowQr) {
        // Background start and WhatsApp wants a QR → the saved login is no longer valid.
        return this._onNeedsQr(gen, 'Your WhatsApp login has expired. Scan the QR code again to reconnect.', false)
      }
      try {
        const dataUrl = await this.deps.toQrDataUrl(qr)
        if (!live()) return
        const first = this.state !== STATE.QR
        this.qrDataUrl = dataUrl
        if (first) {
          this.qrStartedAt = Date.now()
          this.lastPollAt = Math.max(this.lastPollAt, Date.now())
          await this._setState(STATE.QR, { lastError: null })
          this.deps.log.info(this.userId, 'QR_READY', 'QR code ready to scan')
        }
      } catch (err) {
        this.deps.log.error(this.userId, 'QR_RENDER_FAILED', err.message)
      }
    })

    client.on('authenticated', () => {
      if (!live()) return
      watchBrowser()
      this._finishLaunchPhase()
      this.deps.chrome.markLinked(this.profileDir) // login accepted and stored by WhatsApp Web
      this._probeWhileSyncing(client, gen)
      // Give the chat sync its own full timeout.
      this.launchTimer = setTimeout(() => {
        this._onLaunchFailed(gen, new Error('WhatsApp accepted the login but did not finish loading'))
      }, this.config.launchTimeoutMs)
      this._setState(STATE.SYNCING, { lastError: null })
    })

    client.on('ready', () => {
      if (!live()) return
      watchBrowser()
      this._markReady(client, client.info?.wid?.user, 'ready event')
    })

    client.on('auth_failure', (msg) => {
      if (!live()) return
      this._onNeedsQr(gen, `WhatsApp rejected the saved login (${msg}). Scan the QR code again.`, true)
    })

    client.on('disconnected', (reason) => {
      if (!live()) return
      const r = String(reason)
      this.deps.log.warn(this.userId, 'DISCONNECTED', r)
      if (LOGGED_OUT_REASONS.has(r)) {
        return this._onNeedsQr(gen, 'WhatsApp was logged out from your phone (Linked Devices). Scan the QR code again.', true)
      }
      this._onCrash(gen, `WhatsApp disconnected (${r})`)
    })

    client.on('change_state', (state) => {
      if (live()) this.deps.log.info(this.userId, 'WA_STATE', String(state))
    })
  }

  _markReady(client, phoneFromPage, via) {
    if (this.state === STATE.READY) return
    this._finishLaunchPhase()
    this.reconnectAttempts = 0
    this.healthFails = 0
    this.lastActivityAt = Date.now()
    const phone = phoneFromPage || this.phoneNumber
    this.deps.chrome.markLinked(this.profileDir, { phone })
    this.deps.log.info(this.userId, 'READY', `Connected as +${phone || 'unknown'} (${via})`)
    this._setState(STATE.READY, {
      phoneNumber: phone,
      lastConnectedAt: new Date(),
      lastError: null,
      autoStart: true,
      nextReconnectAt: null,
    })
    // Send whatever is pending right away (the manager hands this to the message sender).
    Promise.resolve(this.deps.onReady?.(this.userId)).catch(err => this.deps.log.error(this.userId, 'ON_READY_FAILED', err.message))
  }

  // Diagnostics: while waiting for "ready", record what the WhatsApp page is doing. whatsapp-web.js
  // swallows errors in this phase, so this is the only way to see why "ready" does not arrive.
  _probeWhileSyncing(client, gen) {
    let n = 0
    const probe = async () => {
      if (gen !== this.generation || this.state !== STATE.SYNCING) return
      n++
      const t0 = Date.now()
      const info = await withTimeout(client.pupPage.evaluate(() => {
        const tryReq = (name, fn) => { try { return fn(window.require(name)) } catch (e) { return 'ERR ' + e.message } }
        const me = tryReq('WAWebUserPrefsMeUser', m => {
          const w = m.getMaybeMePnUser() || m.getMaybeMeLidUser()
          return w ? (w.user || String(w._serialized || '').split('@')[0] || true) : null
        })
        // Modules whatsapp-web.js needs for its final "ready" step (incoming-message listeners).
        const missing = ['WAWebCollections', 'WAWebSocketModel', 'WAWebSyncGatingUtils', 'WAWebCallCollection']
          .filter(name => { try { return !window.require(name) } catch (_) { return true } })
        return {
          wwebjs: typeof window.WWebJS,
          sendFn: typeof window.WWebJS?.sendMessage,
          conn: tryReq('WAWebConnModel', m => !!m.Conn),
          me,
          missing,
          version: window.Debug?.VERSION,
        }
      }), 15000, 'page probe').catch(err => ({ error: err.message }))
      if (gen !== this.generation || this.state !== STATE.SYNCING) return
      this.deps.log.info(this.userId, 'SYNC_PROBE', `#${n} after ${Math.round((Date.now() - this.startedAt) / 1000)}s (answered in ${Date.now() - t0}ms): ${JSON.stringify(info)}`)

      // Logged in and able to send, but whatsapp-web.js never says "ready" (its last step, which
      // only sets up incoming-message listeners, fails on some WhatsApp Web versions). We only
      // send messages, so after two healthy checks in a row we continue without it.
      const usable = info.wwebjs === 'object' && info.sendFn === 'function' && info.conn === true && info.me && !String(info.me).startsWith('ERR')
      usableStreak = usable ? usableStreak + 1 : 0
      if (usableStreak >= 2) {
        this.deps.log.warn(this.userId, 'READY_FALLBACK', `whatsapp-web.js did not signal ready; WhatsApp is logged in and can send, continuing${info.missing?.length ? ` (missing modules: ${info.missing.join(', ')})` : ''}`)
        return this._markReady(client, typeof info.me === 'string' ? info.me : null, 'fallback')
      }
      setTimeout(probe, 8000).unref?.()
    }
    let usableStreak = 0
    setTimeout(probe, 8000).unref?.()
    client.on('loading_screen', (percent) => {
      if (gen === this.generation) this.deps.log.info(this.userId, 'LOADING', `${percent}%`)
    })
  }

  _finishLaunchPhase() {
    this.launchRetries = 0
    if (this.launchTimer) { clearTimeout(this.launchTimer); this.launchTimer = null }
  }

  _releaseSlot() {
    if (this.releaseLaunchSlot) {
      this.releaseLaunchSlot()
      this.releaseLaunchSlot = null
    }
  }

  async _teardown() {
    this.generation++ // any event from the old browser is ignored from now on
    this._finishLaunchPhase()
    const client = this.client
    const pid = this.chromePid
    this.client = null
    this.chromePid = null
    this.startedAt = null
    if (!client) return this._releaseSlot()

    // browser.close() lets Chrome flush IndexedDB (the WhatsApp login) to disk before exiting.
    await withTimeout(client.destroy(), 20000, 'browser close').catch(() => {})
    if (pid && this.deps.chrome.isPidAlive(pid)) this.deps.chrome.killPid(pid)
    this.deps.chrome.killOrphanChromes(this.profileDir)
    this._releaseSlot() // only now can the next user's browser start
    this.deps.log.info(this.userId, 'BROWSER_CLOSED', `Chrome closed${pid ? ` (pid ${pid})` : ''}`)
  }

  // ── Failure handling ───────────────────────────────────────────────────────

  _onLaunchFailed(gen, err) {
    return this.lock.run(async () => {
      if (gen !== this.generation) return
      const msg = String(err?.message || err)
      if (TRANSIENT_LAUNCH.test(msg) && this.launchRetries < MAX_LAUNCH_RETRIES) {
        const attempt = ++this.launchRetries
        this.deps.log.warn(this.userId, 'LAUNCH_RETRY', `${msg} — retrying (${attempt}/${MAX_LAUNCH_RETRIES})`)
        const allowQr = this.allowQr
        await this._teardown()
        this.launchRetries = attempt // _teardown → _finishLaunchPhase resets it
        return this._launch({ allowQr, reason: `${this._launchReason || 'launch'} retry ${attempt}`, retry: true })
      }
      this.deps.log.error(this.userId, 'LAUNCH_FAILED', msg)
      await this._teardown()
      if (this.config.keepAlive && this.autoStart && this.hasSavedSession()) {
        await this._setState(STATE.DISCONNECTED, { lastError: `Could not start WhatsApp: ${msg}. Retrying automatically.` })
        this._scheduleReconnect()
      } else {
        await this._setState(this.hasSavedSession() ? STATE.DISCONNECTED : STATE.NEEDS_QR, { lastError: `Could not start WhatsApp: ${msg}` })
      }
    })
  }

  _onNeedsQr(gen, message, wipe) {
    return this.lock.run(async () => {
      if (gen !== this.generation) return
      this.deps.log.warn(this.userId, 'NEEDS_QR', message)
      this._clearReconnect()
      await this._teardown()
      if (wipe) this.deps.chrome.wipeProfile(this.profileDir)
      else this.deps.chrome.clearLinked(this.profileDir)
      await this._setState(STATE.NEEDS_QR, { lastError: message, autoStart: false })
    })
  }

  _onCrash(gen, message) {
    return this.lock.run(async () => {
      if (gen !== this.generation) return
      this.deps.log.warn(this.userId, 'CRASH', message)
      const wasUserQr = this.state === STATE.QR
      await this._teardown()
      if (!wasUserQr && this.config.keepAlive && this.autoStart && this.hasSavedSession()) {
        await this._setState(STATE.DISCONNECTED, { lastError: `${message}. Reconnecting automatically.` })
        this._scheduleReconnect()
      } else if (!wasUserQr && this.hasSavedSession()) {
        // On-demand mode: nothing to do now; the next send opens WhatsApp again.
        await this._setState(STATE.DISCONNECTED, { lastError: `${message}. It will reconnect automatically when a message needs to be sent.` })
      } else {
        await this._setState(this.hasSavedSession() ? STATE.DISCONNECTED : STATE.NEEDS_QR, { lastError: message })
      }
    })
  }

  _scheduleReconnect() {
    this._clearReconnect()
    const delays = this.config.reconnectDelaysMs
    const delay = delays[Math.min(this.reconnectAttempts, delays.length - 1)]
    this.reconnectAttempts++
    this.nextReconnectAt = Date.now() + delay
    this.deps.log.info(this.userId, 'RECONNECT_SCHEDULED', `Attempt ${this.reconnectAttempts} in ${Math.round(delay / 1000)}s`)
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      this.nextReconnectAt = null
      this.ensureRunning('reconnect').catch(() => {})
    }, delay)
    this.reconnectTimer.unref?.()
  }

  _clearReconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer)
    this.reconnectTimer = null
    this.nextReconnectAt = null
  }

  // ── Health check (called by the manager's watchdog) ────────────────────────

  async healthCheck() {
    const gen = this.generation
    const now = Date.now()

    if (this.state === STATE.QR) {
      const idle = now - this.lastPollAt > this.config.qrIdleMs
      const tooLong = this.qrStartedAt && now - this.qrStartedAt > this.config.qrMaxMs
      if (idle || tooLong) {
        return this.lock.run(async () => {
          if (gen !== this.generation || this.state !== STATE.QR) return
          this.deps.log.info(this.userId, 'QR_EXPIRED', idle ? 'Nobody is viewing the QR page' : 'QR not scanned in time')
          await this._teardown()
          await this._setState(this.hasSavedSession() ? STATE.DISCONNECTED : STATE.NEEDS_QR, {
            lastError: 'QR code expired. Click Connect to get a new one.',
          })
        })
      }
      return
    }

    if (this.state !== STATE.READY || !this.client) return
    const client = this.client

    if (client.pupBrowser?.isConnected?.() === false) {
      return this._onCrash(gen, 'Browser is no longer running')
    }

    const waState = await withTimeout(client.getState(), 20000, 'health check').catch(() => null)
    if (gen !== this.generation) return
    if (LOGGED_OUT_REASONS.has(String(waState))) {
      return this._onNeedsQr(gen, 'WhatsApp was logged out from your phone (Linked Devices). Scan the QR code again.', true)
    }
    if (waState === 'CONNECTED') {
      this.healthFails = 0
    } else {
      this.healthFails++
      this.deps.log.warn(this.userId, 'HEALTH_CHECK', `State ${waState} (${this.healthFails}/${this.config.watchdogFailLimit})`)
      if (this.healthFails >= this.config.watchdogFailLimit) {
        return this._onCrash(gen, `WhatsApp stopped responding (state: ${waState})`)
      }
    }

    await this.closeIfIdle()
  }

  // On-demand mode: close the browser once nothing has been sent for idleCloseMs.
  // The login stays on disk; the next message due opens WhatsApp again without a QR.
  closeIfIdle() {
    if (this.config.keepAlive) return
    const gen = this.generation
    return this.lock.run(async () => {
      if (gen !== this.generation || this.state !== STATE.READY || this.sendsInFlight > 0) return
      // Close almost immediately when another user is waiting for the slot.
      const idleLimit = this.deps.launchSlots.waiting > 0 ? 5000 : this.config.idleCloseMs
      if (Date.now() - this.lastActivityAt < idleLimit) return
      this.deps.log.info(this.userId, 'IDLE_CLOSE', 'Nothing left to send — closing WhatsApp (login stays saved)')
      await this._teardown()
      await this._setState(STATE.DISCONNECTED, { lastError: null })
    })
  }

  // ── Sending ────────────────────────────────────────────────────────────────

  _unavailableError() {
    switch (this.state) {
      case STATE.STOPPED: return new WaUnavailableError('WhatsApp sending is paused.', 'stopped')
      case STATE.NEEDS_QR: return new WaUnavailableError('WhatsApp is not connected — scan the QR code on the WhatsApp page.', 'needs_qr')
      case STATE.QR: return new WaUnavailableError('WhatsApp is waiting for a QR scan.', 'needs_qr')
      default: return new WaUnavailableError('WhatsApp is not connected right now. The message will be retried.', 'not_connected')
    }
  }

  _resolveWaiters() {
    for (const w of this.readyWaiters) w.resolve()
    this.readyWaiters.clear()
  }

  _rejectWaiters(err) {
    for (const w of this.readyWaiters) w.reject(err)
    this.readyWaiters.clear()
  }

  waitUntilReady(timeoutMs) {
    if (this.state === STATE.READY && this.client) return Promise.resolve()
    if (![STATE.INITIALIZING, STATE.SYNCING].includes(this.state)) return Promise.reject(this._unavailableError())
    return new Promise((resolve, reject) => {
      const waiter = {
        resolve: () => { clearTimeout(timer); resolve() },
        reject: (e) => { clearTimeout(timer); reject(e) },
      }
      const timer = setTimeout(() => {
        this.readyWaiters.delete(waiter)
        reject(new WaUnavailableError('WhatsApp is still starting. The message will be retried.', 'starting'))
      }, timeoutMs)
      this.readyWaiters.add(waiter)
    })
  }

  // Can a message be sent without user action? (Used by the sender to skip without launching Chrome.)
  canSendInBackground() {
    if ([STATE.STOPPED, STATE.NEEDS_QR, STATE.QR].includes(this.state)) return false
    return this.isRunning() || this.hasSavedSession()
  }

  async send(targetNumber, text, mediaPath = null) {
    await this.hydrate()
    this.lastActivityAt = Date.now()
    if (!this.canSendInBackground()) throw this._unavailableError()
    this.sendsInFlight++
    try {
      if (!this._isStarting()) await this.ensureRunning('send')
      await this.waitUntilReady(this.config.sendWaitReadyMs)
      return await this.sendLock.run(() => this._doSend(targetNumber, text, mediaPath))
    } finally {
      this.sendsInFlight--
      this.lastActivityAt = Date.now()
    }
  }

  async _doSend(targetNumber, text, mediaPath) {
    const client = this.client
    const gen = this.generation
    if (!client || this.state !== STATE.READY) throw this._unavailableError()

    let num = String(targetNumber || '').replace(/\D/g, '')
    if (num.length === 10) num = '91' + num
    if (num.length < 11) throw new WaRecipientError(`Invalid mobile number: ${targetNumber}`)

    try {
      const numberId = await withTimeout(client.getNumberId(num), 30000, 'number lookup')
      if (!numberId) throw new WaRecipientError(`${num} is not registered on WhatsApp`)
      const chatId = numberId._serialized

      let result
      const media = this._loadMedia(mediaPath)
      if (media) {
        try {
          result = await withTimeout(client.sendMessage(chatId, media, { caption: text }), this.config.sendTimeoutMs, 'send')
        } catch (err) {
          if (BROWSER_GONE.test(err?.message || '')) throw err
          this.deps.log.warn(this.userId, 'MEDIA_FAILED', `Sending text only: ${err.message}`)
          result = await withTimeout(client.sendMessage(chatId, text), this.config.sendTimeoutMs, 'send')
        }
      } else {
        result = await withTimeout(client.sendMessage(chatId, text), this.config.sendTimeoutMs, 'send')
      }

      this.lastActivityAt = Date.now()
      this.deps.log.info(this.userId, 'MSG_SENT', `Sent to ${num}`)
      return { success: true, messageId: result?.id?._serialized || null }
    } catch (err) {
      if (err instanceof WaRecipientError) throw err
      const msg = String(err?.message || err)
      if (BROWSER_GONE.test(msg)) {
        // The browser died mid-send: restart it and keep the message pending.
        this._onCrash(gen, `Browser stopped while sending: ${msg}`)
        throw new WaUnavailableError(`WhatsApp connection was interrupted (${msg}). The message will be retried.`, 'interrupted')
      }
      throw err
    }
  }

  _loadMedia(mediaPath) {
    if (!mediaPath) return null
    let full = mediaPath
    if (!path.isAbsolute(full)) {
      const clean = String(mediaPath).replace(/\\/g, '/').replace(/^\/+/, '')
      full = path.join(__dirname, '..', '..', clean)
    }
    if (!fs.existsSync(full)) {
      this.deps.log.warn(this.userId, 'MEDIA_MISSING', `Attachment not found: ${full}. Sending text only.`)
      return null
    }
    const { MessageMedia } = require('whatsapp-web.js')
    return MessageMedia.fromFilePath(full)
  }
}

module.exports = { WhatsAppSession, STATE, Mutex }
