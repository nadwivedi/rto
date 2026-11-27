const { AsyncLocalStorage } = require('async_hooks')

// What a log line was printed for: the search (vehicle / chassis number) and who made it. Set around a
// lookup with withLogContext; every console line printed inside it, however deep (API 2 … API 9, retries,
// alerts), is saved with it, so the admin's Logs page shows which user searched which vehicle.
const storage = new AsyncLocalStorage()

const FIELDS = ['vehicleNumber', 'chassisNumber', 'userId', 'staffId', 'via']

const withLogContext = (context, fn) => {
  const merged = { ...(storage.getStore() || {}) }
  for (const field of FIELDS) {
    const value = context?.[field]
    if (value !== undefined && value !== null && value !== '') merged[field] = typeof value === 'object' ? String(value) : value
  }
  return storage.run(merged, fn)
}

// The context of the code running now, or undefined outside a lookup
const getLogContext = () => {
  const store = storage.getStore()
  return store && Object.keys(store).length ? { ...store } : undefined
}

module.exports = { withLogContext, getLogContext }
