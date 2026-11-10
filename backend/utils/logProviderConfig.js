// Prints at startup which vehicle API URLs / keys the backend has, with keys hidden, so a stale or
// missing value in .env shows up in the pm2 logs (pm2 logs rto).
const hideKey = (url) => String(url).replace(/([?&](key|api_key|token)=)[^&]*/gi, '$1***')
const keyState = (value) => (value ? `set (...${String(value).slice(-4)})` : 'MISSING')

module.exports = () => {
  const api2 = process.env.VEHICLE_INFO_API2_URL
  console.log(`[Vehicle APIs] API 2 URL: ${api2 ? hideKey(api2) : 'MISSING (VEHICLE_INFO_API2_URL)'}`)
  console.log(`[Vehicle APIs] API 3 key (PARZIVAL_API_KEY): ${keyState(process.env.PARZIVAL_API_KEY)}`)
  console.log(`[Vehicle APIs] API 5 key (PARZIVAL5_API_KEY): ${keyState(process.env.PARZIVAL5_API_KEY)}`)
}
