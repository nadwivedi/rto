const fs = require('fs')
const path = require('path')
const { execFileSync } = require('child_process')

const LOCK_FILES = ['SingletonLock', 'SingletonSocket', 'SingletonCookie']

// Lists chrome processes whose command line points at the given profile directory.
// Puppeteer launches Chrome detached on Linux, so when Node is killed (pm2 restart, crash, OOM)
// Chrome keeps running and keeps the profile open. Starting a second Chrome on that profile
// corrupts the WhatsApp login — so these orphans must be killed before every launch.
function findChromePidsUsingDir(profileDir) {
  const needle = path.resolve(profileDir)
  try {
    if (process.platform === 'win32') {
      const escaped = needle.replace(/'/g, "''")
      const out = execFileSync('powershell.exe', [
        '-NoProfile', '-NonInteractive', '-Command',
        `Get-CimInstance Win32_Process -Filter "Name='chrome.exe' OR Name='chrome-headless-shell.exe'" | ` +
        `Where-Object { $_.CommandLine -and $_.CommandLine.Contains('${escaped}') } | ` +
        `ForEach-Object { $_.ProcessId }`
      ], { encoding: 'utf8', timeout: 15000, windowsHide: true })
      return out.split(/\s+/).map(Number).filter(Boolean)
    }
    const out = execFileSync('ps', ['-eo', 'pid=,args='], { encoding: 'utf8', timeout: 10000 })
    return out.split('\n')
      .map(line => line.trim())
      .filter(line => line && /chrom/i.test(line) && line.includes(needle))
      .map(line => parseInt(line, 10))
      .filter(pid => pid && pid !== process.pid)
  } catch (_) {
    return []
  }
}

function killPid(pid) {
  try {
    if (process.platform === 'win32') {
      execFileSync('taskkill', ['/F', '/T', '/PID', String(pid)], { stdio: 'ignore', timeout: 10000, windowsHide: true })
    } else {
      process.kill(pid, 'SIGKILL')
    }
  } catch (_) {}
}

function isPidAlive(pid) {
  if (!pid) return false
  try { process.kill(pid, 0); return true } catch (_) { return false }
}

function killOrphanChromes(profileDir) {
  const pids = findChromePidsUsingDir(profileDir)
  pids.forEach(killPid)
  return pids
}

// Only safe to call when no Chrome is using the profile (i.e. after killOrphanChromes).
function removeLockFiles(profileDir) {
  const removed = []
  for (const dir of [profileDir, path.join(profileDir, 'Default')]) {
    for (const f of LOCK_FILES) {
      const p = path.join(dir, f)
      try {
        // lstat: on Linux SingletonLock is a dangling symlink, which existsSync reports as missing
        fs.lstatSync(p)
        fs.rmSync(p, { force: true })
        removed.push(p)
      } catch (_) {}
    }
  }
  return removed
}

// WhatsApp Web writes its IndexedDB as soon as the page loads, logged in or not.
function hasWhatsAppData(profileDir) {
  return fs.existsSync(path.join(profileDir, 'Default', 'IndexedDB', 'https_web.whatsapp.com_0.indexeddb.leveldb'))
}

// So a linked login is marked explicitly once the session reaches "ready".
const LINKED_MARKER = 'wa-linked.json'

function markLinked(profileDir, info = {}) {
  try {
    fs.mkdirSync(profileDir, { recursive: true })
    fs.writeFileSync(path.join(profileDir, LINKED_MARKER), JSON.stringify({ ...info, linkedAt: new Date().toISOString() }))
  } catch (_) {}
}

function clearLinked(profileDir) {
  try { fs.rmSync(path.join(profileDir, LINKED_MARKER), { force: true }) } catch (_) {}
}

function hasSavedSession(profileDir) {
  return fs.existsSync(path.join(profileDir, LINKED_MARKER)) && hasWhatsAppData(profileDir)
}

function wipeProfile(profileDir) {
  try {
    fs.rmSync(profileDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 500 })
  } catch (_) {}
}

module.exports = {
  findChromePidsUsingDir,
  killOrphanChromes,
  removeLockFiles,
  hasSavedSession,
  hasWhatsAppData,
  markLinked,
  clearLinked,
  wipeProfile,
  killPid,
  isPidAlive,
}
