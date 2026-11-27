// A search that finds no vehicle never uses one of the user's searches or an API key call: the app's RC,
// HSRP and Chassis to RC searches and the API key endpoint, and the provider replies that look like data
// but say "no record". No database needed: models and the provider are stubbed. Run: npm test
process.env.PARZIVAL5_API_KEY = 'test-key'
process.env.RECHARGEKIT_TOKEN = 'test-token'
process.env.RECHARGEKIT_PENDING_RETRY_MS = '0'
const { test } = require('node:test')
const assert = require('node:assert/strict')
const path = require('path')
const axios = require('axios')

const stubModule = (rel, exports) => {
  const file = path.join(__dirname, '..', rel)
  require.cache[file] = { id: file, filename: file, loaded: true, exports }
}
stubModule('models/ApiUsage.js', { findOneAndUpdate: async () => {} })
stubModule('utils/adminAlerts.js', { raiseAlert: async () => {}, autoResolveAlerts: async () => {} })

const { fetchHsrpInfo, fetchVehicleInfo } = require('../utils/vehicleInfoProvider')

// ---- Provider replies that look like data but have no vehicle ----

let getReply
axios.get = async () => getReply
let postReply
axios.post = async () => postReply

test('HSRP: success with an empty hsrp_response is not found, whatever its status text says', async () => {
  for (const status of ['No Record', 'Data not available', 'SUCCESS', '']) {
    getReply = { status: 200, data: { success: true, charged: 1, data: { status, regno: 'CG04AB1234', hsrp_response: { message: status } } } }
    const r = await fetchHsrpInfo('CG04AB1234')
    assert.equal(r.found, false, `status "${status}"`)
  }
})

test('HSRP: a record with laser codes or maker is found', async () => {
  getReply = { status: 200, data: { success: true, charged: 1, data: { status: 'SUCCESS', regno: 'CG04AB1234', hsrp_response: { hsrpFrontLaserCode: 'AB12', maker: 'HONDA' } } } }
  const r = await fetchHsrpInfo('CG04AB1234')
  assert.equal(r.found, true)
})

test('RC: a reply whose details are all "Not Available" / "No Data Found" is not found', async () => {
  postReply = {
    status: 200,
    data: {
      error: 0,
      status: 1,
      msg: 'RC Advance validation successfull',
      cardData: { regno: 'CG04AB1234', ownername: 'Not Available', makermodal: 'No Data Found', chassisno: 'NA', maker: 'Record not exist' }
    }
  }
  const r = await fetchVehicleInfo('CG04AB1234', { provider: 'api9' })
  assert.equal(r.found, false)
})

test('RC: a real owner next to a "Not Available" field is still found', async () => {
  postReply = {
    status: 200,
    data: { error: 0, status: 1, cardData: { regno: 'CG04AB1234', ownername: 'RAJ NODATA SINGH', makermodal: 'Not Available' } }
  }
  const r = await fetchVehicleInfo('CG04AB1234', { provider: 'api9' })
  assert.equal(r.found, true)
  assert.equal(r.data.OWNER_NAME, 'RAJ NODATA SINGH')
})

// ---- Controllers: nothing found -> the user's count / the key's calls stay the same ----

const NOT_FOUND = { found: false, message: 'Vehicle details not found. Please check registration number.', charged: true }
let lookupResult
const charges = []
const fakeProvider = (name) => async () => {
  charges.push(`asked:${name}`)
  if (lookupResult instanceof Error) throw lookupResult
  return lookupResult
}
const realProvider = require('../utils/vehicleInfoProvider')
stubModule('utils/vehicleInfoProvider.js', {
  ...realProvider,
  fetchVehicleInfo: fakeProvider('rc'),
  fetchHsrpInfo: fakeProvider('hsrp'),
  fetchChassisInfo: fakeProvider('chassis')
})

const user = {
  features: { rcDetails: true, hsrp: true, chassisToRc: true },
  rcSearchLimit: 10, rcSearchCount: 2, hsrpSearchLimit: 10, hsrpSearchCount: 2, chassisSearchLimit: 10, chassisSearchCount: 2,
  rcProvider: 'api9'
}
const selectable = (value) => { const p = Promise.resolve(value); p.select = async () => value; p.lean = async () => value; return p }
stubModule('models/User.js', {
  findById: () => selectable(user),
  findByIdAndUpdate: (id, update) => { charges.push(`user:${JSON.stringify(update)}`); return selectable(user) }
})
const noop = { findOneAndUpdate: async () => null, recordSearch: async () => { charges.push('usage') }, create: async () => {} }
for (const m of ['RcSearchUsage', 'HsrpSearchUsage', 'ChassisSearchUsage', 'VehicleSearchHistory', 'HsrpSearchHistory', 'ChassisSearchHistory', 'RcSearchLog', 'ApiKeyCall']) {
  stubModule(`models/${m}.js`, noop)
}
const apiKey = { _id: 'k1', key: 'live-key', active: true, product: 'rc', provider: 'api9', callLimit: 10, callCount: 2, userId: 'u1', name: 'Fleet App' }
stubModule('models/ApiKey.js', {
  findOne: async () => ({ ...apiKey }),
  findById: async () => ({ ...apiKey }),
  findOneAndUpdate: async (q, update) => { apiKey.callCount += update.$inc.callCount; return { ...apiKey } },
  findByIdAndUpdate: (id, update) => {
    apiKey.callCount += update.$inc.callCount
    const p = Promise.resolve({ ...apiKey })
    p.catch = () => p
    return p
  }
})

// Slow to load (WhatsApp, PDF libraries) and not used by a lookup
stubModule('controllers/vehicleRecordSaveController.js', { saveHistoryRecords: async () => {}, canSaveRecords: () => false, SAVE_DISABLED_MESSAGE: '' })
stubModule('utils/rcCardGenerator.js', { generateRcCardPDF: async () => {} })
stubModule('utils/particularGenerator.js', { generateParticularPDF: async () => {} })

const response = () => {
  const res = { code: 200, status (c) { this.code = c; return this }, json (b) { this.body = b; return this } }
  return res
}
const appReq = (query) => ({ query, body: {}, params: {}, headers: {}, user: { id: 'u1' } })

test('app RC search: not found and API failed take no search', async () => {
  const { lookupVehicle } = require('../controllers/vehicleInfoController')
  for (const result of [NOT_FOUND, Object.assign(new Error('down'), { providerUnavailable: true })]) {
    charges.length = 0
    lookupResult = result
    const res = response()
    await lookupVehicle(appReq({ vno: 'CG04AB1234' }), res)
    assert.ok([404, 503].includes(res.code), `HTTP ${res.code}`)
    assert.deepEqual(charges, ['asked:rc'])
  }
})

test('app HSRP and Chassis to RC searches: not found takes no search', async () => {
  const hsrp = require('../controllers/hsrpController')
  const chassis = require('../controllers/chassisController')
  const hsrpLookup = Object.values(hsrp).find((fn) => typeof fn === 'function' && /fetchHsrpInfo/.test(fn.toString()))
  const chassisLookup = Object.values(chassis).find((fn) => typeof fn === 'function' && /fetchChassisInfo/.test(fn.toString()))
  lookupResult = { ...NOT_FOUND, message: 'not found' }

  charges.length = 0
  let res = response()
  await hsrpLookup(appReq({ vno: 'CG04AB1234' }), res)
  assert.equal(res.code, 404)
  assert.deepEqual(charges, ['asked:hsrp'])

  charges.length = 0
  res = response()
  await chassisLookup(appReq({ chassis: 'MA3EWB22S00123456', engine: 'K12MN1234567' }), res)
  assert.equal(res.code, 404)
  assert.deepEqual(charges, ['asked:chassis'])
})

test('API key: not found gives the reserved call back', async () => {
  const { lookupVehicle } = require('../controllers/publicVehicleApiController')
  lookupResult = NOT_FOUND
  const before = apiKey.callCount
  const res = response()
  await lookupVehicle({ query: { vno: 'CG04AB1234' }, body: {}, headers: { 'x-api-key': 'live-key' }, ip: '1.1.1.1' }, res)
  assert.equal(res.code, 404)
  assert.equal(apiKey.callCount, before)
  assert.equal(res.body.usage.used, before)
})
