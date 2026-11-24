const util = require('util')
const mongoose = require('mongoose')

// Copies everything the backend prints with console.log / info / warn / error / debug into the
// ServerLog collection (admin panel > Logs). The console still prints as before.
// Lines are buffered and written in batches, so logging never waits on the database.

const FLUSH_MS = 2000
const MAX_BUFFER = 2000
const MAX_MESSAGE = 10000
const LEVELS = { log: 'info', info: 'info', debug: 'info', warn: 'warn', error: 'error' }

let installed = false
let buffer = []
let flushing = false
let dropped = 0

// '[API 8] CG04...' -> 'API 8'; 'API 8 – Satmat API lookup failed: ...' -> 'API 8'
const sourceOf = (message) => {
  const tag = message.match(/^\s*\[([^\]\n]{1,40})\]/)
  if (tag) return tag[1].trim()
  const api = message.match(/^\s*(API \d+)\b/i)
  if (api) return api[1].toUpperCase()
  return undefined
}

const flush = async () => {
  if (flushing || !buffer.length || mongoose.connection.readyState !== 1) return
  flushing = true
  const batch = buffer
  buffer = []
  try {
    const ServerLog = require('../models/ServerLog')
    if (dropped) {
      batch.push({ level: 'warn', source: 'Logs', message: `${dropped} log lines were dropped while the database was not reachable`, pid: process.pid, createdAt: new Date() })
      dropped = 0
    }
    await ServerLog.insertMany(batch, { ordered: false, lean: true })
  } catch (err) {
    // Straight to stderr: going through console.error here would log the failure to log
    process.stderr.write(`[Logs] Could not save ${batch.length} log lines: ${err.message}\n`)
  } finally {
    flushing = false
  }
}

const installServerLogs = () => {
  if (installed || process.env.SERVER_LOGS_DISABLED === 'true') return
  installed = true

  for (const [method, level] of Object.entries(LEVELS)) {
    const original = console[method].bind(console)
    console[method] = (...args) => {
      original(...args)
      try {
        let message = util.format(...args)
        if (message.length > MAX_MESSAGE) message = `${message.slice(0, MAX_MESSAGE)}… (${message.length - MAX_MESSAGE} more characters)`
        if (buffer.length >= MAX_BUFFER) {
          buffer.shift()
          dropped++
        }
        buffer.push({ level, source: sourceOf(message), message, pid: process.pid, createdAt: new Date() })
      } catch {
        // A log line that cannot be formatted is not worth breaking the caller for
      }
    }
  }

  const timer = setInterval(flush, FLUSH_MS)
  timer.unref()
  // Save what is left when the process ends normally
  process.on('beforeExit', flush)
}

module.exports = { installServerLogs, flushServerLogs: flush, sourceOf }
