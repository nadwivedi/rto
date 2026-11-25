// API 9 (RechargeKit API, Advanced RC Verification). No database needed: axios, ApiUsage and the admin
// alerts are stubbed. Run: node --test tests/
process.env.RECHARGEKIT_TOKEN = 'test-token'
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

const { fetchVehicleInfo } = require('../utils/vehicleInfoProvider')

const HIT = {
  error: 0,
  msg: 'RC Advance validation successfull',
  status: 1,
  orderid: '3d44b116-66e9-44b3-9d8b-d435a218e3aa',
  optransid: 'provider-reference-id',
  cardData: {
    rc_number: 'DL01AB1234',
    registration_date: '2019-03-15',
    owner_name: 'Ravi Kumar',
    father_name: 'Suresh Kumar',
    present_address: 'H No 1, Delhi',
    mobile_number: '9876543210',
    vehicle_chasi_number: 'MA3EYD32S00123456',
    chassis_number: 'MA3EYD32S00123456',
    engine_number: 'K12MN1234567',
    maker_description: 'MARUTI SUZUKI INDIA LTD',
    maker_model: 'SWIFT VXI',
    fuel_type: 'PETROL',
    color: 'WHITE',
    insurance_company: 'HDFC ERGO',
    insurance_upto: '2026-03-14',
    pucc_upto: '2026-09-01',
    rc_status: 'ACTIVE',
    permit_details: { permit_number: 'P123' },
    norms_type: 'BS VI'
  },
  partnerreqid: 'RTOS1',
  user_var1: '',
  user_var2: '',
  user_var3: ''
}

let reply, sent
beforeEach(() => {
  alerts.length = 0
  sent = []
  reply = { status: 200, data: HIT }
})
axios.post = async (url, body, config) => {
  sent.push({ url, body, config })
  if (reply instanceof Error) throw reply
  return reply
}

test('API 9: RechargeKit cardData in the usual fields, request has reg_no, partner_request_id and the token', async () => {
  const r = await fetchVehicleInfo('DL01AB1234', { provider: 'api9' })
  assert.equal(r.found, true)
  assert.deepEqual(r.servedBy, ['api9'])
  assert.equal(r.data.REGN_NO, 'DL01AB1234')
  assert.equal(r.data.OWNER_NAME, 'Ravi Kumar')
  assert.equal(r.data.F_NAME, 'Suresh Kumar')
  assert.equal(r.data.MOBILE_NO, '9876543210')
  assert.equal(r.data.CHASI_NO, 'MA3EYD32S00123456')
  assert.equal(r.data.ENG_NO, 'K12MN1234567')
  assert.equal(r.data.MAKER_DESC, 'MARUTI SUZUKI INDIA LTD')
  assert.equal(r.data.MAKER_MODEL, 'SWIFT VXI')
  assert.equal(r.data.INSURANCE_UPTO, '14-Mar-2026')
  assert.equal(r.data.PERMIT_NO, 'P123')
  assert.equal(r.data.STATE_CD, 'DL')
  // A field no mapping took is kept in EXTRA_DETAILS
  assert.equal(r.data.EXTRA_DETAILS['Vehicle Chasi Number'], 'MA3EYD32S00123456')
  assert.equal(sent[0].url, 'https://verify.rechargkit.biz/validation/v3/rcAdvanceVerify')
  assert.equal(sent[0].body.reg_no, 'DL01AB1234')
  assert.match(sent[0].body.partner_request_id, /^softwarebytestechnologies\d+$/)
  assert.equal(sent[0].config.headers['Content-Type'], 'application/json')
  assert.equal(sent[0].config.headers.Authorization, 'Bearer test-token')
})

test('API 9: every request gets its own partner_request_id', async () => {
  await fetchVehicleInfo('DL01AB1234', { provider: 'api9' })
  await fetchVehicleInfo('DL01AB1234', { provider: 'api9' })
  assert.notEqual(sent[0].body.partner_request_id, sent[1].body.partner_request_id)
})

test('API 9: a failed lookup is a plain not found, no alert', async () => {
  reply = { status: 200, data: { error: 1, status: 2, msg: 'Record not found', cardData: null } }
  const r = await fetchVehicleInfo('ZZ99ZZ0000', { provider: 'api9' })
  assert.equal(r.found, false)
  assert.match(r.message, /not found/)
  assert.equal(alerts.length, 0)
})

test('API 9: invalid registration number says invalid number', async () => {
  reply = { status: 200, data: { error: 1, status: 2, msg: 'Invalid registration number' } }
  const r = await fetchVehicleInfo('XX', { provider: 'api9' })
  assert.equal(r.found, false)
  assert.match(r.message, /Invalid vehicle number/)
})

test('API 9: low balance is an INSUFFICIENT_BALANCE alert', async () => {
  reply = { status: 200, data: { error: 1, status: 2, msg: 'Insufficient balance' } }
  await assert.rejects(fetchVehicleInfo('DL01AB1234', { provider: 'api9' }), (e) => e.providerUnavailable)
  assert.equal(alerts[0].source, 'api9')
  assert.equal(alerts[0].code, 'INSUFFICIENT_BALANCE')
})

test('API 9: bad token (401) raises a critical alert', async () => {
  reply = { status: 401, data: { error: 1, msg: 'Unauthorized' } }
  await assert.rejects(fetchVehicleInfo('DL01AB1234', { provider: 'api9' }), (e) => e.providerUnavailable)
  assert.equal(alerts[0].code, 'HTTP_401')
  assert.equal(alerts[0].severity, 'critical')
})

test('API 9: not set up without the token', async () => {
  const saved = process.env.RECHARGEKIT_TOKEN
  delete process.env.RECHARGEKIT_TOKEN
  try {
    await assert.rejects(fetchVehicleInfo('DL01AB1234', { provider: 'api9' }), (e) => e.providerUnavailable)
    assert.equal(alerts[0].code, 'NOT_SET_UP')
    assert.equal(sent.length, 0)
  } finally {
    process.env.RECHARGEKIT_TOKEN = saved
  }
})
