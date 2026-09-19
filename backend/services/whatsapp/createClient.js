const config = require('./config')

function createClient({ clientId, dataPath }) {
  const { Client, LocalAuth } = require('whatsapp-web.js')
  return new Client({
    authStrategy: new LocalAuth({ clientId, dataPath }),
    puppeteer: {
      headless: true,
      executablePath: config.chromePath,
      args: config.chromeArgs,
      timeout: 120000,         // browser launch
      protocolTimeout: 180000, // slow VPS: page commands can take long while WhatsApp Web loads
    },
    // Always load the live WhatsApp Web build. A cached/pinned old build is a common cause of
    // WhatsApp forcing a logout.
    webVersionCache: { type: 'none' },
    authTimeoutMs: 120000,     // default 30s is too short for a loaded VPS
    qrMaxRetries: 0,           // QR lifetime is managed by the session (see config.qrMaxMs)
    takeoverOnConflict: true,
    takeoverTimeoutMs: 5000,
    userAgent: config.userAgent,
  })
}

module.exports = createClient
