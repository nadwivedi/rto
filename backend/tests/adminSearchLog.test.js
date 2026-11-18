// Admin API Searches page: GET /api/admin/searches merges app searches (RcSearchLog) and Vehicle RC
// API key calls (ApiKeyCall), newest first, with names; GET /:kind/:id gives the vehicle details.
// Models are stubbed in memory. Run: node --test tests/
const { test } = require('node:test')
const assert = require('node:assert/strict')
const path = require('path')
const mongoose = require('mongoose')

const stubModule = (rel, exports) => {
  const file = path.join(__dirname, '..', rel)
  require.cache[file] = { id: file, filename: file, loaded: true, exports }
}
const id = () => new mongoose.Types.ObjectId()

// Just enough of a mongoose query: find(q).select().sort({ createdAt: -1 }).limit(n).lean()
const matches = (doc, q) =>
  Object.entries(q).every(([k, cond]) => {
    if (k === '$or') return cond.some((c) => matches(doc, c))
    if (k === '$and') return cond.every((c) => matches(doc, c))
    const v = doc[k]
    if (cond instanceof RegExp) return cond.test(String(v ?? ''))
    if (cond && typeof cond === 'object' && !(cond instanceof mongoose.Types.ObjectId) && !(cond instanceof Date)) {
      if (cond.$in) return cond.$in.map(String).includes(String(v))
      if (cond.$nin) return !cond.$nin.map(String).includes(String(v))
      if (cond.$lt) return v < cond.$lt
    }
    return String(v) === String(cond)
  })
const model = (docs) => ({
  docs,
  find (q = {}) {
    let out = docs.filter((d) => matches(d, q))
    const chain = {
      select: () => chain,
      sort: () => { out = [...out].sort((a, b) => b.createdAt - a.createdAt); return chain },
      limit: (n) => { out = out.slice(0, n); return chain },
      lean: async () => out,
      distinct: async (field) => out.map((d) => d[field]),
      then: (resolve, reject) => Promise.resolve(out).then(resolve, reject)
    }
    return chain
  },
  findById (docId) {
    const doc = docs.find((d) => String(d._id) === String(docId)) || null
    return { select: () => ({ lean: async () => doc }) }
  }
})

const userA = { _id: id(), name: 'Ravi Transport', mobile1: '9000000001' }
const keyRc = { _id: id(), name: 'Fleet App', userId: userA._id, product: 'rc' }
const keyChassis = { _id: id(), name: 'Chassis Key', product: 'chassis' }
const t = (min) => new Date(Date.UTC(2026, 10, 18, 10, min))
const appLogs = [
  { _id: id(), userId: userA._id, vehicleNumber: 'CG12BU5574', provider: 'api47', servedBy: ['api4', 'api7'], result: 'found', charged: true, ownerName: 'NARAYAN DWIVEDI', response: { REGN_NO: 'CG12BU5574', OWNER_NAME: 'NARAYAN DWIVEDI' }, createdAt: t(5) },
  { _id: id(), userId: userA._id, vehicleNumber: 'CG04AB1234', provider: 'api47', servedBy: ['api4'], result: 'not_found', message: 'not found', createdAt: t(1) }
]
const keyCalls = [
  { _id: id(), apiKeyId: keyRc._id, vehicleNumber: 'MH12AB0001', source: 'rtosarthi_api7', servedBy: ['api7'], statusCode: 200, charged: true, response: { REGN_NO: 'MH12AB0001' }, createdAt: t(3) },
  // Refused (limit used up): never searched, not listed
  { _id: id(), apiKeyId: keyRc._id, vehicleNumber: 'MH12AB0002', source: 'rtosarthi_api7', statusCode: 403, createdAt: t(4) },
  // Chassis key: not a vehicle number search
  { _id: id(), apiKeyId: keyChassis._id, vehicleNumber: 'MH12AB0003', statusCode: 200, createdAt: t(6) }
]
stubModule('models/RcSearchLog.js', model(appLogs))
stubModule('models/ApiKeyCall.js', model(keyCalls))
stubModule('models/ApiKey.js', model([keyRc, keyChassis]))
stubModule('models/User.js', model([userA]))
stubModule('models/Employee.js', model([]))
stubModule('utils/errorLogger.js', { logError: (e) => { throw e }, getUserFriendlyError: () => ({}), getSimplifiedTimestamp: () => '' })

const { listSearches, getSearch } = require('../controllers/adminSearchLogController')
const call = async (handler, req) => {
  let out
  const res = { status (s) { this.code = s; return this }, json (b) { out = { code: this.code || 200, ...b } } }
  await handler({ query: {}, params: {}, ...req }, res)
  return out
}

test('lists app searches and Vehicle RC key calls newest first, with names and the API that answered', async () => {
  const r = await call(listSearches, {})
  assert.equal(r.success, true)
  assert.deepEqual(r.data.map((d) => d.vehicleNumber), ['CG12BU5574', 'MH12AB0001', 'CG04AB1234'])
  const [app, key, miss] = r.data
  assert.equal(app.kind, 'app')
  assert.equal(app.userName, 'Ravi Transport')
  assert.deepEqual(app.servedBy, ['api4', 'api7'])
  assert.equal(app.response, undefined)
  assert.equal(key.kind, 'key')
  assert.equal(key.keyName, 'Fleet App')
  assert.equal(key.userName, 'Ravi Transport')
  assert.equal(key.provider, 'api7')
  assert.equal(key.result, 'found')
  assert.equal(miss.result, 'not_found')
  assert.equal(r.nextBefore, null)
})

test('pages with nextBefore', async () => {
  const first = await call(listSearches, { query: { limit: '2' } })
  assert.equal(first.data.length, 2)
  assert.ok(first.nextBefore)
  const second = await call(listSearches, { query: { limit: '2', before: new Date(first.nextBefore).toISOString() } })
  assert.deepEqual(second.data.map((d) => d.vehicleNumber), ['CG04AB1234'])
})

test('filters by type, result and text (vehicle number or user name)', async () => {
  assert.deepEqual((await call(listSearches, { query: { type: 'key' } })).data.map((d) => d.vehicleNumber), ['MH12AB0001'])
  assert.deepEqual((await call(listSearches, { query: { result: 'not_found' } })).data.map((d) => d.vehicleNumber), ['CG04AB1234'])
  assert.deepEqual((await call(listSearches, { query: { q: 'cg 12' } })).data.map((d) => d.vehicleNumber), ['CG12BU5574'])
  assert.equal((await call(listSearches, { query: { q: 'ravi' } })).data.length, 3)
})

test('eye button: the full vehicle details of one search', async () => {
  const r = await call(getSearch, { params: { kind: 'app', id: String(appLogs[0]._id) } })
  assert.equal(r.data.response.OWNER_NAME, 'NARAYAN DWIVEDI')
  const k = await call(getSearch, { params: { kind: 'key', id: String(keyCalls[0]._id) } })
  assert.equal(k.data.response.REGN_NO, 'MH12AB0001')
  assert.equal((await call(getSearch, { params: { kind: 'x', id: 'bad' } })).code, 400)
})
