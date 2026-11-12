// Chassis -> RC through PeriOne (API 4) POST /vahan/chassisno, and the /api/v1/chassis-info API key
// endpoint. No database needed: axios, ApiUsage, the admin alerts and the ApiKey / ApiKeyCall models are
// stubbed. Run: node --test tests/
process.env.PERIONE_CLIENT_ID = 'cid'
process.env.PERIONE_CLIENT_SECRET = 'secret'
process.env.PERIONE_EMAIL = 'ops@example.com'
delete process.env.CHASSIS_PROVIDER
const { test, beforeEach } = require('node:test')
const assert = require('node:assert/strict')
const path = require('path')
const axios = require('axios')

const alerts = []
const stubModule = (rel, exports) => {
  const file = path.join(__dirname, '..', rel)
  require.cache[file] = { id: file, filename: file, loaded: true, exports }
}
stubModule('models/ApiUsage.js', { findOneAndUpdate: async () => {} })
stubModule('utils/adminAlerts.js', {
  raiseAlert: async (a) => { alerts.push(a) },
  autoResolveAlerts: async () => {}
})

// One API key in memory, enough for the public controller
let keyDoc
const calls = []
const ApiKeyStub = {
  findOne: async ({ key }) => (keyDoc && keyDoc.key === key ? keyDoc : null),
  findById: async () => keyDoc,
  findOneAndUpdate: async () => {
    if (!keyDoc.active || keyDoc.callCount >= keyDoc.callLimit) return null
    keyDoc.callCount += 1
    return keyDoc
  },
  findByIdAndUpdate: async (id, update) => {
    keyDoc.callCount += update.$inc.callCount
    return keyDoc
  }
}
stubModule('models/ApiKey.js', ApiKeyStub)
stubModule('models/ApiKeyCall.js', { create: async (row) => { calls.push(row) } })

const { fetchChassisInfo, chassisNeedsEngine } = require('../utils/vehicleInfoProvider')
const { lookupChassis, lookupVehicle } = require('../controllers/publicVehicleApiController')

let reply
let sent
axios.post = async (url, body, opts) => {
  sent = { url, body, headers: opts.headers }
  return reply
}

const SUCCESS = {
  status: 200,
  data: {
    response: [
      {
        response: { rcRegnNo: 'CG04AB1234', rcMakerDesc: 'TATA MOTORS LTD', rcMakerModel: 'ACE GOLD', rcFuelDesc: 'DIESEL', rcRegnDt: '15-Jun-2019' },
        responseStatus: 'SUCCESS',
        message: null
      }
    ],
    error: 'false',
    code: '200',
    message: 'Success'
  }
}

// What PeriOne sent back on 2026-11-12 for a real call once the daily limit was used up
const DAILY_LIMIT = {
  status: 200,
  data: {
    response: [
      {
        response: null,
        responseStatus: 'ERROR',
        message: { id: null, code: 'NO_DATA_FOUND', params: null, text: 'Daily API limit exceeded for your account. Please contact the administrator.' }
      }
    ],
    error: 'false',
    code: '200',
    message: 'Success'
  }
}

// ...and without the engine number
const ENGINE_MISSING = {
  status: 200,
  data: { status: 200, data: { response: null, error: 'true', code: '400 BAD_REQUEST', message: 'enginenumber:is mandatory field.' } }
}

const NO_DATA = {
  status: 200,
  data: {
    response: [{ response: null, responseStatus: 'ERROR', message: { id: null, code: 'NO_DATA_FOUND', params: null, text: 'No data found' } }],
    error: 'false',
    code: '200',
    message: 'Success'
  }
}

beforeEach(() => {
  alerts.length = 0
  calls.length = 0
  sent = null
  keyDoc = { _id: 'k1', key: 'rts_chassis', name: 'Demo', product: 'chassis', active: true, callLimit: 5, callCount: 0, provider: 'api5' }
})

test('PeriOne is the chassis API by default and needs the engine number', () => {
  assert.equal(chassisNeedsEngine(), true)
})

test('posts chasisnumber + enginenumber with the PeriOne credentials and maps the vehicle', async () => {
  reply = SUCCESS
  const result = await fetchChassisInfo('ME3J3B5FMS2004994', { engineNumber: 'FMS04994' })

  assert.equal(sent.url, 'https://api.perione.in/vahan/chassisno?email=ops%40example.com')
  assert.deepEqual(sent.body, { chasisnumber: 'ME3J3B5FMS2004994', enginenumber: 'FMS04994' })
  assert.equal(sent.headers.client_id, 'cid')
  assert.equal(sent.headers.client_secret, 'secret')

  assert.equal(result.found, true)
  assert.equal(result.provider, 'api4')
  assert.equal(result.data.chassisNumber, 'ME3J3B5FMS2004994')
  assert.equal(result.data.matches.length, 1)
  const [vehicle] = result.data.matches
  assert.equal(vehicle.REGN_NO, 'CG04AB1234')
  assert.equal(vehicle.MAKER_MODEL, 'ACE GOLD')
  assert.equal(vehicle.CHASI_NO, 'ME3J3B5FMS2004994')
  assert.equal(alerts.length, 0)
})

test('no engine number: not sent to PeriOne, asks for it', async () => {
  const result = await fetchChassisInfo('ME3J3B5FMS2004994', {})
  assert.equal(sent, null)
  assert.equal(result.found, false)
  assert.match(result.message, /engine number/)
})

test('daily limit reached: admin alert, user sees "unavailable"', async () => {
  reply = DAILY_LIMIT
  await assert.rejects(fetchChassisInfo('ME3J3B5FMS2004994', { engineNumber: 'FMS04994' }), (err) => {
    assert.equal(err.providerUnavailable, true)
    assert.match(err.message, /temporarily unavailable/)
    return true
  })
  assert.equal(alerts.length, 1)
  assert.equal(alerts[0].key, 'api4chassis:error:DAILY_LIMIT_REACHED')
  assert.equal(alerts[0].source, 'api4')
  assert.match(alerts[0].title, /daily limit/)
  assert.match(alerts[0].message, /Daily API limit exceeded/)
})

test('a field PeriOne refuses (400 BAD_REQUEST) is an invalid number, not an alert', async () => {
  reply = ENGINE_MISSING
  const result = await fetchChassisInfo('ME3J3B5FMS2004994', { engineNumber: 'X1234' })
  assert.equal(result.found, false)
  assert.match(result.message, /Invalid chassis or engine number/)
  assert.equal(alerts.length, 0)
})

test('no record: plain not found', async () => {
  reply = NO_DATA
  const result = await fetchChassisInfo('ME3J3B5FMS2004994', { engineNumber: 'FMS04994' })
  assert.equal(result.found, false)
  assert.match(result.message, /No vehicle found for this chassis and engine number/)
  assert.equal(alerts.length, 0)
})

// The public endpoint: a fake req / res pair
const call = async (handler, { query = {}, body = {}, key = 'rts_chassis' } = {}) => {
  const res = {
    statusCode: 0,
    body: null,
    status(code) { this.statusCode = code; return this },
    json(payload) { this.body = payload; return this }
  }
  await handler({ headers: { 'x-api-key': key }, query, body, ip: '1.2.3.4' }, res)
  return res
}

test('/chassis-info: vehicle details, one call used, logged with the chassis number', async () => {
  reply = SUCCESS
  const res = await call(lookupChassis, { query: { chassis: 'ME3J3B5FMS2004994', engine: 'FMS04994' } })

  assert.equal(res.statusCode, 200)
  assert.equal(res.body.success, true)
  assert.equal(res.body.chassisNumber, 'ME3J3B5FMS2004994')
  assert.equal(res.body.vehicleNumber, 'CG04AB1234')
  assert.equal(res.body.data.MAKER_DESC, 'TATA MOTORS LTD')
  assert.equal(res.body.matches.length, 1)
  assert.equal(res.body.source, 'rtosarthi_api4')
  assert.deepEqual(res.body.usage, { limit: 5, used: 1, remaining: 4 })

  assert.equal(calls.length, 1)
  assert.equal(calls[0].chassisNumber, 'ME3J3B5FMS2004994')
  assert.equal(calls[0].engineNumber, 'FMS04994')
  assert.equal(calls[0].vehicleNumber, 'CG04AB1234')
  assert.equal(calls[0].success, true)
})

test('/chassis-info: POST body works too', async () => {
  reply = SUCCESS
  const res = await call(lookupChassis, { body: { chassis: 'ME3J3B5FMS2004994', engine: 'FMS04994' } })
  assert.equal(res.statusCode, 200)
})

test('/chassis-info: engine number missing is a 400 and uses no call', async () => {
  const res = await call(lookupChassis, { query: { chassis: 'ME3J3B5FMS2004994' } })
  assert.equal(res.statusCode, 400)
  assert.match(res.body.message, /engine number/)
  assert.equal(keyDoc.callCount, 0)
  assert.equal(sent, null)
})

test('/chassis-info: not found gives the call back', async () => {
  reply = NO_DATA
  const res = await call(lookupChassis, { query: { chassis: 'ME3J3B5FMS2004994', engine: 'FMS04994' } })
  assert.equal(res.statusCode, 404)
  assert.equal(keyDoc.callCount, 0)
  assert.equal(res.body.usage.remaining, 5)
})

test('/chassis-info: provider down is a 502 and gives the call back', async () => {
  reply = DAILY_LIMIT
  const res = await call(lookupChassis, { query: { chassis: 'ME3J3B5FMS2004994', engine: 'FMS04994' } })
  assert.equal(res.statusCode, 502)
  assert.equal(keyDoc.callCount, 0)
})

test('/chassis-info: limit used up is a 403', async () => {
  keyDoc.callCount = 5
  const res = await call(lookupChassis, { query: { chassis: 'ME3J3B5FMS2004994', engine: 'FMS04994' } })
  assert.equal(res.statusCode, 403)
  assert.equal(res.body.limitExhausted, true)
  assert.equal(sent, null)
})

test('a Vehicle RC key cannot call /chassis-info, and a Chassis key cannot call /vehicle-info', async () => {
  keyDoc.product = 'rc'
  let res = await call(lookupChassis, { query: { chassis: 'ME3J3B5FMS2004994', engine: 'FMS04994' } })
  assert.equal(res.statusCode, 403)
  assert.match(res.body.message, /Vehicle RC API/)

  keyDoc.product = 'chassis'
  res = await call(lookupVehicle, { query: { vno: 'CG04AB1234' } })
  assert.equal(res.statusCode, 403)
  assert.match(res.body.message, /Chassis to RC API \(\/api\/v1\/chassis-info\)/)
  assert.equal(sent, null)
})

test('keys saved before `product` existed are Vehicle RC keys', async () => {
  delete keyDoc.product
  const res = await call(lookupChassis, { query: { chassis: 'ME3J3B5FMS2004994', engine: 'FMS04994' } })
  assert.equal(res.statusCode, 403)
})
