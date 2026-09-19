const path = require('path')
const fs = require('fs')

const BACKEND_ROOT = path.join(__dirname, '..', '..')

function envInt(name, fallback) {
  const v = parseInt(process.env[name], 10)
  return Number.isFinite(v) && v >= 0 ? v : fallback
}

function envBool(name, fallback) {
  const v = process.env[name]
  if (v === undefined || v === '') return fallback
  return ['1', 'true', 'yes', 'on'].includes(String(v).toLowerCase())
}

// Auth data lives in backend/.wwebjs_auth by default. It is resolved against the backend folder,
// NOT process.cwd() — otherwise starting the server from a different folder (pm2, systemd)
// silently points at an empty directory and every user gets asked to scan the QR again.
function resolveAuthDir() {
  const fromEnv = process.env.WHATSAPP_AUTH_DIR
  if (fromEnv) return path.isAbsolute(fromEnv) ? fromEnv : path.join(BACKEND_ROOT, fromEnv)

  const preferred = path.join(BACKEND_ROOT, '.wwebjs_auth')
  // Older builds resolved the folder against cwd. Reuse it if that is where the sessions are.
  const legacy = path.resolve(process.cwd(), '.wwebjs_auth')
  if (!fs.existsSync(preferred) && legacy !== preferred && fs.existsSync(legacy)) return legacy
  return preferred
}

// Report a real, current Chrome to WhatsApp Web. whatsapp-web.js defaults to a Chrome 101 user agent,
// which WhatsApp treats as an outdated browser.
function chromeUserAgent() {
  let major = '147'
  try {
    const { PUPPETEER_REVISIONS } = require('puppeteer-core/lib/cjs/puppeteer/revisions.js')
    major = String(PUPPETEER_REVISIONS.chrome).split('.')[0] || major
  } catch (_) {}
  const platform = process.platform === 'win32'
    ? 'Windows NT 10.0; Win64; x64'
    : process.platform === 'darwin' ? 'Macintosh; Intel Mac OS X 10_15_7' : 'X11; Linux x86_64'
  return `Mozilla/5.0 (${platform}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${major}.0.0.0 Safari/537.36`
}

const config = {
  authDir: resolveAuthDir(),

  // Default (on-demand): WhatsApp is opened only to send pending messages and closed again
  // afterwards; the login stays saved on disk. Set WHATSAPP_KEEP_ALIVE=true to keep connected
  // sessions running permanently instead (more RAM, but no start-up delay before sending).
  keepAlive: envBool('WHATSAPP_KEEP_ALIVE', false),
  // On-demand mode: close the browser once it has been idle (nothing sent) for this long.
  idleCloseMs: envInt('WHATSAPP_IDLE_CLOSE_SEC', 60) * 1000,

  // Browser launch + WhatsApp Web load must finish within this time.
  launchTimeoutMs: envInt('WHATSAPP_LAUNCH_TIMEOUT_SEC', 180) * 1000,
  // How many browsers may be starting at the same moment (launch is the CPU/RAM spike).
  maxConcurrentLaunches: Math.max(1, envInt('WHATSAPP_MAX_CONCURRENT_LAUNCHES', 1)),

  // QR screen: closed when nobody has polled the page for qrIdleMs, or after qrMaxMs in total.
  qrIdleMs: envInt('WHATSAPP_QR_IDLE_SEC', 90) * 1000,
  qrMaxMs: envInt('WHATSAPP_QR_MAX_SEC', 300) * 1000,

  // Health check of running sessions.
  watchdogIntervalMs: envInt('WHATSAPP_WATCHDOG_SEC', 60) * 1000,
  // Consecutive failed health checks before the browser is restarted.
  watchdogFailLimit: 2,

  // Automatic reconnect delays after a crash / transient disconnect (ms).
  reconnectDelaysMs: [15e3, 60e3, 2 * 60e3, 5 * 60e3, 10 * 60e3],

  sendTimeoutMs: 90 * 1000,
  // How long a send waits for a (re)starting session to become ready.
  sendWaitReadyMs: envInt('WHATSAPP_SEND_WAIT_READY_SEC', 180) * 1000,

  // Delay between boot-time session restores, so browsers don't all start at once.
  bootStaggerMs: 20 * 1000,

  chromePath: process.env.WHATSAPP_CHROME_PATH || undefined,
  userAgent: chromeUserAgent(),

  chromeArgs: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-extensions',
    '--disable-default-apps',
    '--disable-sync',
    '--disable-background-networking',
    '--disable-component-update',
    '--metrics-recording-only',
    '--mute-audio',
    '--password-store=basic',
    // Headless tabs are treated as "background" and throttled, which makes WhatsApp Web time out.
    '--disable-background-timer-throttling',
    '--disable-backgrounding-occluded-windows',
    '--disable-renderer-backgrounding',
  ],
}

module.exports = config
