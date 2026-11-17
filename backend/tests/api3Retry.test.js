// API 3 (ParzivalHub) retries a 502 UPSTREAM_ERROR (free, "please retry shortly") before giving up.
// No database needed: axios, ApiUsage and the admin alerts are stubbed. Run: node --test tests/*.test.js
process.env.PARZIVAL_API_KEY = 'pzk_live_test_x'
process.env.API3_RETRY_DELAYS_MS = '0,0'
const { test } = require('node:test')
const assert = require('node:assert/strict')
const path = require('path')
const axios = require('axios')

const stubModule = (rel, exports) => {
  const file = path.join(__dirname, '..', rel)
  require.cache[file] = { id: file, filename: file, loaded: true, exports }
}
const alerts = []
stubModule('models/ApiUsage.js', { findOneAndUpdate: async () => {}, updateOne: async () => {} })
stubModule('utils/adminAlerts.js', { raiseAlert: async (a) => { alerts.push(a) }, autoResolveAlerts: async () => {} })

const { fetchVehicleInfo } = require('../utils/vehicleInfoProvider')

const upstreamError = () => {
  const err = new Error('Request failed with status code 502')
  err.response = { status: 502, data: { success: false, error: { code: 'UPSTREAM_ERROR', message: 'The data source returned an error.' }, meta: { charged: 0 } } }
  return err
}
const found = {
  status: 200,
  data: { success: true, status: 'found', data: { registration_number: 'KA23EH6376', owner_name: 'TEST OWNER', maker_model: 'SWIFT' }, meta: { charged: 4 } }
}

let replies
let calls
axios.post = async () => {
  calls++
  const next = replies.shift()
  if (next instanceof Error) throw next
  return next
}

test('502 UPSTREAM_ERROR is retried and the next reply is used', async () => {
  calls = 0
  alerts.length = 0
  replies = [upstreamError(), found]
  const result = await fetchVehicleInfo('KA23EH6376', { provider: 'api3' })
  assert.equal(calls, 2)
  assert.equal(result.found, true)
  assert.equal(result.data.OWNER_NAME, 'TEST OWNER')
  assert.equal(alerts.length, 0)
})

test('gives up after the retries and reports the service as unavailable', async () => {
  calls = 0
  alerts.length = 0
  replies = [upstreamError(), upstreamError(), upstreamError()]
  await assert.rejects(fetchVehicleInfo('KA23EH6376', { provider: 'api3' }), (err) => err.providerUnavailable === true)
  assert.equal(calls, 3)
  assert.equal(alerts.length, 1)
})

test('a not-found reply is not retried', async () => {
  calls = 0
  replies = [{ status: 404, data: { success: false, error: { code: 'RECORD_NOT_FOUND', message: 'No record was found for this input.' }, meta: { charged: 0 } } }]
  const result = await fetchVehicleInfo('CG04AB1234', { provider: 'api3' })
  assert.equal(calls, 1)
  assert.equal(result.found, false)
})
