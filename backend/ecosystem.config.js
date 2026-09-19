// pm2 config for the VPS:  pm2 start ecosystem.config.js  (then: pm2 save)
module.exports = {
  apps: [
    {
      name: 'rto-backend',
      script: 'index.js',
      cwd: __dirname,
      // Never watch in production: Chrome writes files inside the backend folder and every
      // restart kills the WhatsApp browsers.
      watch: false,
      // Give WhatsApp browsers time to close cleanly on restart/stop (pm2 default is 1.6s).
      kill_timeout: 30000,
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
}
