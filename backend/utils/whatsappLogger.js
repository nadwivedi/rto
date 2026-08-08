/**
 * WhatsApp Logger
 * ───────────────
 * Writes structured, human-readable logs to:
 *   backend/logs/whatsapp/whatsapp-YYYY-MM-DD.log
 *
 * Each daily file opens with a clear date heading.
 * Every entry is tagged INFO | WARN | ERROR so you can grep/share easily.
 *
 * Usage:
 *   const waLog = require('../utils/whatsappLogger')
 *   waLog.info('USER_ID', 'Some event', { extraData: 'value' })
 *   waLog.warn('USER_ID', 'Possible problem', { details })
 *   waLog.error('USER_ID', 'Critical failure', error)
 *   waLog.cron('EVENT', 'Cron message', { count: 5 })
 */

const fs = require('fs')
const path = require('path')

// ── Directory Setup ───────────────────────────────────────────────────────────
const LOGS_DIR = path.join(__dirname, '../logs/whatsapp')
if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true })
}

// ── Helpers ───────────────────────────────────────────────────────────────────

// Format: DD-MM-YYYY HH:MM:SS  (IST-aware)
function nowIST() {
  const now = new Date()
  // Convert UTC → IST (UTC + 5:30)
  const ist = new Date(now.getTime() + 5.5 * 60 * 60 * 1000)
  const dd   = String(ist.getUTCDate()).padStart(2, '0')
  const mm   = String(ist.getUTCMonth() + 1).padStart(2, '0')
  const yyyy = ist.getUTCFullYear()
  const hh   = String(ist.getUTCHours()).padStart(2, '0')
  const min  = String(ist.getUTCMinutes()).padStart(2, '0')
  const ss   = String(ist.getUTCSeconds()).padStart(2, '0')
  return `${dd}-${mm}-${yyyy} ${hh}:${min}:${ss}`
}

// Log file path for today (YYYY-MM-DD so files sort chronologically)
function todayFilePath() {
  const now = new Date()
  const ist = new Date(now.getTime() + 5.5 * 60 * 60 * 1000)
  const yyyy = ist.getUTCFullYear()
  const mm   = String(ist.getUTCMonth() + 1).padStart(2, '0')
  const dd   = String(ist.getUTCDate()).padStart(2, '0')
  return path.join(LOGS_DIR, `whatsapp-${yyyy}-${mm}-${dd}.log`)
}

// Tracks which dates have had their heading written this process lifetime
const headingsWritten = new Set()

// Write the date heading if this is the first write of the day
function ensureDayHeading(filePath) {
  const dateKey = path.basename(filePath)
  if (headingsWritten.has(dateKey)) return

  // Check if file already has content (server restarted mid-day)
  let alreadyHasHeading = false
  try {
    if (fs.existsSync(filePath)) {
      const firstBytes = fs.readFileSync(filePath, { encoding: 'utf8', flag: 'r' })
      alreadyHasHeading = firstBytes.trimStart().startsWith('╔')
    }
  } catch (_) {}

  if (!alreadyHasHeading) {
    const now = new Date(new Date().getTime() + 5.5 * 60 * 60 * 1000)
    const dayName = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][now.getUTCDay()]
    const dd   = String(now.getUTCDate()).padStart(2, '0')
    const mm   = String(now.getUTCMonth() + 1).padStart(2, '0')
    const yyyy = now.getUTCFullYear()

    const heading = [
      '',
      '╔══════════════════════════════════════════════════════════════════════════════╗',
      `║          📋 WHATSAPP LOG — ${dayName.toUpperCase()}, ${dd}-${mm}-${yyyy}${' '.repeat(Math.max(0, 47 - dayName.length - 14))}║`,
      '╚══════════════════════════════════════════════════════════════════════════════╝',
      '',
    ].join('\n')

    fs.appendFileSync(filePath, heading, 'utf8')
  }

  headingsWritten.add(dateKey)
}

// ── Core Write Function ───────────────────────────────────────────────────────

/**
 * @param {'INFO'|'WARN'|'ERROR'|'CRON'|'DEBUG'} level
 * @param {string} userId   - user id or empty string for system events
 * @param {string} event    - short event name e.g. 'INIT_STARTED', 'QR_READY', 'SEND_FAILED'
 * @param {string} message  - human-readable description
 * @param {object|Error|null} extra  - extra data or Error object
 */
function write(level, userId, event, message, extra = null) {
  setImmediate(() => {
    try {
      const filePath = todayFilePath()
      ensureDayHeading(filePath)

      const ts       = nowIST()
      const userTag  = userId ? `[User:${userId}]` : '[System]'
      const pad      = (s, n) => String(s).padEnd(n)

      let line = `[${ts}] ${pad(level, 5)} ${userTag} ${pad(event, 22)} | ${message}`

      // Append structured extra data if provided
      if (extra) {
        if (extra instanceof Error) {
          line += `\n          ↳ Error: ${extra.message}`
          if (extra.stack) {
            // Indent each stack line for readability
            const stackLines = extra.stack.split('\n').slice(1, 6) // top 5 frames
            line += '\n          ↳ Stack:\n' + stackLines.map(l => '              ' + l.trim()).join('\n')
          }
        } else if (typeof extra === 'object') {
          const cleaned = JSON.stringify(extra, null, 0)
          if (cleaned !== '{}' && cleaned !== '[]') {
            line += `\n          ↳ Data: ${cleaned}`
          }
        } else {
          line += `\n          ↳ ${extra}`
        }
      }

      fs.appendFileSync(filePath, line + '\n', 'utf8')
    } catch (writeErr) {
      console.error('[whatsappLogger] Failed to write log:', writeErr.message)
    }
  })
}

// ── Separator helpers ─────────────────────────────────────────────────────────

function separator(label = '') {
  setImmediate(() => {
    try {
      const filePath = todayFilePath()
      ensureDayHeading(filePath)
      const line = label
        ? `\n── ${label} ${'─'.repeat(Math.max(0, 72 - label.length - 4))}\n`
        : `\n${'─'.repeat(76)}\n`
      fs.appendFileSync(filePath, line, 'utf8')
    } catch (_) {}
  })
}

// ── Public API ────────────────────────────────────────────────────────────────

const waLog = {
  // Session lifecycle
  info:  (userId, event, message, extra) => write('INFO',  userId, event, message, extra),
  warn:  (userId, event, message, extra) => write('WARN',  userId, event, message, extra),
  error: (userId, event, message, extra) => write('ERROR', userId, event, message, extra),
  debug: (userId, event, message, extra) => write('DEBUG', userId, event, message, extra),

  // Cron / system-level events (no userId)
  cron:   (event, message, extra) => write('CRON',  '', event, message, extra),
  system: (event, message, extra) => write('INFO',  '', event, message, extra),

  // Visual separator in the log (e.g. between cron runs)
  separator,

  // ── Convenience wrappers for common WhatsApp events ─────────────────────────

  sessionStart: (userId, extra) =>
    write('INFO', userId, 'SESSION_START', 'Session initialization requested', extra),

  browserLaunching: (userId) =>
    write('INFO', userId, 'BROWSER_LAUNCH', 'Chromium browser process starting'),

  browserLaunchFailed: (userId, err) =>
    write('ERROR', userId, 'BROWSER_FAIL', 'Failed to launch Chromium', err),

  chromePid: (userId, pid) =>
    write('INFO', userId, 'CHROME_PID', `Chromium PID: ${pid}`, { pid }),

  lockFileRemoved: (userId, filePath) =>
    write('INFO', userId, 'LOCK_REMOVED', `Stale lock file removed: ${path.basename(filePath)}`),

  wwwbLoading: (userId) =>
    write('INFO', userId, 'WWEB_LOADING', 'WhatsApp Web interface loading in browser'),

  qrReady: (userId) =>
    write('INFO', userId, 'QR_READY', 'QR code generated and ready for scan'),

  qrExpired: (userId) =>
    write('WARN', userId, 'QR_EXPIRED', 'QR code expired without being scanned'),

  authenticated: (userId, phoneNumber) =>
    write('INFO', userId, 'AUTHENTICATED', `Session authenticated. Phone: ${phoneNumber || 'unknown'}`),

  sessionReady: (userId, phoneNumber) =>
    write('INFO', userId, 'SESSION_READY', `✅ Session fully ready. Phone: ${phoneNumber || 'unknown'}`),

  authFailed: (userId, reason) =>
    write('ERROR', userId, 'AUTH_FAILURE', `Authentication failed: ${reason}`),

  disconnected: (userId, reason, isLogout) =>
    write(isLogout ? 'WARN' : 'INFO', userId, 'DISCONNECTED', `Session disconnected — reason: ${reason}`, { isLogout }),

  sessionDestroyed: (userId, pid) =>
    write('INFO', userId, 'SESSION_DESTROY', `Session destroyed. Chrome PID killed: ${pid || 'N/A'}`),

  sessionLogout: (userId) =>
    write('WARN', userId, 'SESSION_LOGOUT', 'Session logged out and auth data wiped'),

  idleKill: (userId, timeoutMins) =>
    write('INFO', userId, 'IDLE_KILL', `Session idle ${timeoutMins} min — browser destroyed to free RAM`),

  initTimeout: (userId, seconds) =>
    write('WARN', userId, 'INIT_TIMEOUT', `Initialization timed out after ${seconds}s with no QR or auth`),

  concurrentInitWait: (userId) =>
    write('WARN', userId, 'CONCURRENT_INIT', 'Duplicate init call detected — waiting for existing init to complete'),

  // Message sending
  messageSending: (userId, targetNumber, hasMedia) =>
    write('INFO', userId, 'MSG_SENDING', `Sending to ${targetNumber}${hasMedia ? ' [+attachment]' : ''}`),

  messageSent: (userId, targetNumber, messageId) =>
    write('INFO', userId, 'MSG_SENT', `✅ Sent to ${targetNumber}`, { messageId }),

  messageFailed: (userId, targetNumber, err) =>
    write('ERROR', userId, 'MSG_FAILED', `❌ Failed to send to ${targetNumber}`, err),

  messageNotOnWA: (userId, number) =>
    write('WARN', userId, 'NOT_ON_WA', `Number ${number} is not registered on WhatsApp`),

  connectionLost: (userId, state) =>
    write('WARN', userId, 'CONN_LOST', `WhatsApp connection state is ${state} — destroying browser`),

  lazyColdStart: (userId) =>
    write('INFO', userId, 'LAZY_START', 'No active browser — cold-starting Chrome for message send'),

  sessionExpiredOnSend: (userId) =>
    write('WARN', userId, 'SESSION_EXPIRED', 'QR appeared during lazy connect — saved auth is invalid, clearing'),

  // Cron
  cronStart: (userCount) =>
    write('CRON', '', 'CRON_START', `Message sender cron started. ${userCount} user(s) with pending messages`),

  cronUserSkip: (userId, reason) =>
    write('CRON', userId, 'CRON_SKIP', `Skipped: ${reason}`),

  cronUserQueued: (userId, count) =>
    write('CRON', userId, 'CRON_QUEUED', `Processing ${count} pending message(s)`),

  cronBatchDone: (userId, destroyingNow) =>
    write('CRON', userId, 'CRON_BATCH_DONE', destroyingNow
      ? 'Batch done. No UI user active — Chrome destroyed immediately.'
      : 'Batch done. UI user active — idle timer will clean up.'),

  // Daily expiry checker
  expiryCheckStart: (userId) =>
    write('CRON', userId || '', 'EXPIRY_CHECK_START', userId ? `Expiry scan started for user` : 'Global expiry scan started'),

  expiryCheckDone: (userId, queued) =>
    write('CRON', userId || '', 'EXPIRY_CHECK_DONE', `Scan complete — ${queued} new alert(s) queued`),

  expiryQueued: (userId, docType, vehicleNo, number, alertLabel) =>
    write('CRON', userId, 'EXPIRY_QUEUED', `${docType} | ${vehicleNo} | ${number} | ${alertLabel}`),

  // Startup / server
  startupCleanup: (count) =>
    write('INFO', '', 'STARTUP_CLEANUP', `Cleared ${count} stale session(s) on server restart`),

  instanceCleaned: (userId) =>
    write('INFO', userId, 'INSTANCE_GC', 'Idle instance removed from memory'),

  // Puppeteer noise (we swallow these, but still log them at DEBUG so they're traceable)
  puppeteerNoise: (userId, message) =>
    write('DEBUG', userId, 'PUPPETEER_NOISE', `Swallowed Puppeteer noise: ${message}`),

  // RAM & Performance Monitoring
  getSystemRamStats: () => {
    const os = require('os')
    const totalMb = Math.round(os.totalmem() / (1024 * 1024))
    const freeMb = Math.round(os.freemem() / (1024 * 1024))
    const usedMb = totalMb - freeMb
    const freePercent = Math.round((freeMb / totalMb) * 100)
    return { totalMb, freeMb, usedMb, freePercent }
  },

  getProcessRamMb: (pid) => {
    if (!pid) return null
    try {
      const { execSync } = require('child_process')
      if (process.platform === 'win32') {
        const out = execSync(`tasklist /FI "PID eq ${pid}" /FO CSV /NH`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] })
        const parts = out.split(',')
        if (parts.length >= 5) {
          const memStr = parts[4].replace(/[^0-9]/g, '')
          return Math.round(parseInt(memStr, 10) / 1024) // KB -> MB
        }
      } else {
        // Linux / Unix VPS
        if (fs.existsSync(`/proc/${pid}/status`)) {
          const status = fs.readFileSync(`/proc/${pid}/status`, 'utf8')
          const match = status.match(/VmRSS:\s+(\d+)\s+kB/)
          if (match) return Math.round(parseInt(match[1], 10) / 1024)
        }
        const out = execSync(`ps -o rss= -p ${pid}`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] })
        const kb = parseInt(out.trim(), 10)
        if (!isNaN(kb)) return Math.round(kb / 1024)
      }
    } catch (_) {}
    return null
  },

  logRamStatus: (userId, event = 'RAM_CHECK', pid = null) => {
    const os = require('os')
    const sys = waLog.getSystemRamStats()
    const chromeMb = pid ? waLog.getProcessRamMb(pid) : null

    let level = 'INFO'
    let alertNote = ''

    if (sys.freePercent < 15) {
      level = 'WARN'
      alertNote += ` ⚠️ CRITICAL: System free RAM low (${sys.freePercent}% left)! VPS may slow down/swap.`
    }
    if (chromeMb && chromeMb > 400) {
      level = 'WARN'
      alertNote += ` ⚠️ WARNING: Chrome PID ${pid} RAM high (${chromeMb} MB)!`
    }

    const load = process.platform !== 'win32' ? os.loadavg().map(n => n.toFixed(2)).join(', ') : 'N/A'
    const msg = `System RAM: ${sys.usedMb}MB/${sys.totalMb}MB used (${sys.freePercent}% free) | LoadAvg: [${load}]${chromeMb ? ` | Chrome PID ${pid}: ${chromeMb}MB` : ''}${alertNote}`

    write(level, userId, event, msg, { sys, chromePid: pid, chromeMb })
  }
}

module.exports = waLog
