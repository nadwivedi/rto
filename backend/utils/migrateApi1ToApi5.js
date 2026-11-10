const ApiKey = require('../models/ApiKey')
const User = require('../models/User')

// API 1 (Nikhil API) was removed and API 5 took its place. Keys and users still on API 1 (and keys
// saved before the provider field existed, which used API 1) are moved to API 5 once at startup.
// updateMany skips validation, so 'api1' no longer being in the enums does not get in the way.
const migrateApi1ToApi5 = async () => {
  try {
    const [keys, users] = await Promise.all([
      ApiKey.updateMany({ $or: [{ provider: 'api1' }, { provider: { $exists: false } }] }, { $set: { provider: 'api5' } }),
      User.updateMany({ rcProvider: 'api1' }, { $set: { rcProvider: 'api5' } })
    ])
    if (keys.modifiedCount || users.modifiedCount) {
      console.log(`[API 5] Moved ${keys.modifiedCount} API key(s) and ${users.modifiedCount} user(s) from API 1 to API 5`)
    }
  } catch (err) {
    console.error('[API 5] Moving API 1 keys / users to API 5 failed:', err.message)
  }
}

module.exports = migrateApi1ToApi5
