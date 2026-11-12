// Chassis -> RC lookup through ParzivalHub (API 3). No database needed: axios, ApiUsage and the admin
// alerts are stubbed. Run: node --test tests/
process.env.PARZIVAL_API_KEY = 'pzk_test_x'
process.env.CHASSIS_PROVIDER = 'api3'
const { test, beforeEach } = require('node:test')
const assert = require('node:assert/strict')
const path = require('path')
const axios = require('axios')

const usageWrites = []
const alerts = []
const stubModule = (rel, exports) => {
  const file = path.join(__dirname, '..', rel)
  require.cache[file] = { id: file, filename: file, loaded: true, exports }
}
stubModule('models/ApiUsage.js', {
  findOneAndUpdate: async (filter, update) => { usageWrites.push({ provider: filter.provider, set: update.$set }) }
})
stubModule('utils/adminAlerts.js', {
  raiseAlert: async (a) => { alerts.push(a) },
  autoResolveAlerts: async () => {}
})

const { fetchChassisInfo, cleanChassisNumber } = require('../utils/vehicleInfoProvider')

let reply
let sent
axios.post = async (url, body, opts) => {
  sent = { url, body, auth: opts.headers.Authorization }
  return reply
}

beforeEach(() => {
  usageWrites.length = 0
  alerts.length = 0
  sent = null
})

const META = { api: 'chassis-to-rc', charged: 5, wallet_balance: 900, quota_remaining: 40 }

test('cleans the chassis number', () => {
  assert.equal(cleanChassisNumber(' ma3 ewb-22s00.123456 '), 'MA3EWB22S00123456')
})

test('one vehicle: posts chassis_number with the Bearer key and maps the record', async () => {
  reply = {
    status: 200,
    data: {
      success: true,
      status: 'found',
      data: { registration_number: 'CG04AB1234', chassis_number: 'MA3EWB22S00123456', owner_name: 'RAM KUMAR', maker: 'MARUTI', registration_date: '2020-02-14' },
      meta: META
    }
  }
  const result = await fetchChassisInfo('MA3EWB22S00123456')
  assert.equal(sent.url, 'https://api.parzivalhub.com/v1/chassis-to-rc')
  assert.deepEqual(sent.body, { chassis_number: 'MA3EWB22S00123456' })
  assert.equal(sent.auth, 'Bearer pzk_test_x')
  assert.equal(result.found, true)
  assert.equal(result.charged, true)
  assert.equal(result.data.matches.length, 1)
  const m = result.data.matches[0]
  assert.equal(m.REGN_NO, 'CG04AB1234')
  assert.equal(m.OWNER_NAME, 'RAM KUMAR')
  assert.equal(m.REGN_DT, '14-Feb-2020')
  assert.equal(m.MOBILE_NO, 'NA')
})

test('quota goes to the chassis usage row, the wallet to the API 3 row', async () => {
  reply = { status: 200, data: { success: true, data: { registration_number: 'CG04AB1234' }, meta: META } }
  await fetchChassisInfo('MA3EWB22S00123456')
  const chassisRow = usageWrites.find((w) => w.provider === 'parzivalhubchassis')
  const api3Row = usageWrites.find((w) => w.provider === 'parzivalhub')
  assert.equal(chassisRow.set.remaining, 40)
  assert.equal(chassisRow.set.lastCharge, 5)
  assert.deepEqual(Object.keys(api3Row.set).sort(), ['checkedAt', 'walletBalance'])
  assert.equal(api3Row.set.walletBalance, 900)
})

test('several vehicles, other field names: every match is returned', async () => {
  reply = {
    status: 200,
    data: { success: true, data: { matches: [{ vehicle_number: 'cg-04 ab 1234', chassis_no: 'X1' }, { registration_number: 'MH12AB1' }, { foo: 'bar' }] }, meta: { charged: 0 } }
  }
  const result = await fetchChassisInfo('X1XXX')
  assert.equal(result.charged, false)
  assert.deepEqual(result.data.matches.map((m) => m.REGN_NO), ['CG04AB1234', 'MH12AB1'])
  assert.equal(result.data.matches[0].CHASI_NO, 'X1')
})

test('no record (404) is a plain not found', async () => {
  reply = { status: 404, data: { success: false, error: { code: 'RECORD_NOT_FOUND', message: 'No record was found for this input.' } } }
  const result = await fetchChassisInfo('MA3EWB22S00123456')
  assert.equal(result.found, false)
  assert.match(result.message, /No vehicle found/)
  assert.equal(alerts.length, 0)
})

test('empty wallet / not subscribed: admin alert, user sees "unavailable"', async () => {
  reply = { status: 402, data: { success: false, error: { code: 'INSUFFICIENT_BALANCE', message: 'Wallet too low' } } }
  await assert.rejects(fetchChassisInfo('MA3EWB22S00123456'), (err) => err.providerUnavailable === true && /temporarily unavailable/.test(err.message))
  assert.equal(alerts.length, 1)
  assert.equal(alerts[0].key, 'api3chassis:error:INSUFFICIENT_BALANCE')
})
