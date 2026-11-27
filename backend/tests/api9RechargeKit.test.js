// API 9 (RechargeKit API, Advanced RC Verification). No database needed: axios, ApiUsage and the admin
// alerts are stubbed. Run: node --test tests/
process.env.RECHARGEKIT_TOKEN = 'test-token'
process.env.RECHARGEKIT_PENDING_RETRY_MS = '0,0'
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
  const r = Array.isArray(reply) ? reply.shift() : reply
  if (r instanceof Error) throw r
  return r
}

test('API 9: RechargeKit cardData in the usual fields, request has rc_no, partner_request_id and the token', async () => {
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
  assert.equal(sent[0].url, 'https://verify.rechargkit.biz/validation/rcAdvanceVerify')
  assert.equal(sent[0].body.rc_no, 'DL01AB1234')
  assert.equal(sent[0].body.reg_no, undefined)
  assert.match(sent[0].body.partner_request_id, /^softwarebytestechnologies\d+$/)
  assert.equal(sent[0].config.headers['Content-Type'], 'application/json')
  assert.equal(sent[0].config.headers.Authorization, 'Bearer test-token')
})

// The shape of a real cardData RechargeKit sent on 27 Nov 2026 (one-word names, no underscores; personal values replaced).
// The reply as we showed it put all of these in EXTRA_DETAILS; 'maker' / 'status' are the two fields
// that already filled MAKER_DESC and STATUS (their exact names were not in the copy we saw).
const REAL_CARD = {
  regno: 'CG10XY1234',
  ownername: 'RAMESH KUMAR SHARMA',
  fathername: 'SURESH PRASAD SHARMA',
  regdate: '11-Aug-2010',
  rtocode: 'CG-10',
  state: 'CG',
  vehiclecategory: 'M-Cycle/Scooter',
  vehiclecolor: 'RED',
  makermodal: 'YAMAHA-YBR',
  fueltype: 'PETROL',
  chassisno: 'ME1ABCD1A2000001',
  engineno: '5ABC000001',
  fitnessupto: '10-Aug-2025',
  inscompany: 'UNITED INDIA INSURANCE CO.LTD',
  insupto: '18-Jun-2011',
  financerdetails: 'SAMPLE AUTO FINANCE LTD',
  maker: 'INDIA YAMAHA MOTOR PVT LTD',
  status: 'ACTIVE'
}

test('API 9: the real RechargeKit reply fills the usual fields, nothing left in EXTRA_DETAILS', async () => {
  reply = { status: 200, data: { ...HIT, cardData: REAL_CARD } }
  const r = await fetchVehicleInfo('CG10XY1234', { provider: 'api9' })
  assert.equal(r.found, true)
  const expected = {
    REGN_NO: 'CG10XY1234',
    REGN_DT: '11-Aug-2010',
    OWNER_NAME: 'RAMESH KUMAR SHARMA',
    F_NAME: 'SURESH PRASAD SHARMA',
    STATE_CD: 'CG',
    RTO_CD: '10',
    CHASI_NO: 'ME1ABCD1A2000001',
    ENG_NO: '5ABC000001',
    MAKER_DESC: 'INDIA YAMAHA MOTOR PVT LTD',
    MAKER_MODEL: 'YAMAHA-YBR',
    FUEL_DESC: 'PETROL',
    COLOR: 'RED',
    FIT_UPTO: '10-Aug-2025',
    INSURANCE_COMP: 'UNITED INDIA INSURANCE CO.LTD',
    INSURANCE_UPTO: '18-Jun-2011',
    FINANCER_DETAILS: 'SAMPLE AUTO FINANCE LTD',
    STATUS: 'ACTIVE',
    VEHICLE_CLASS: 'M-Cycle/Scooter'
  }
  for (const [field, value] of Object.entries(expected)) assert.equal(r.data[field], value, field)
  assert.equal(r.data.EXTRA_DETAILS, undefined)
  // Same 69 fields, same order as every other API
  assert.equal(Object.keys(r.data).length, 69)
  assert.equal(Object.keys(r.data)[0], 'REGN_NO')
})

test('API 9: every request gets its own partner_request_id', async () => {
  await fetchVehicleInfo('DL01AB1234', { provider: 'api9' })
  await fetchVehicleInfo('DL01AB1234', { provider: 'api9' })
  assert.notEqual(sent[0].body.partner_request_id, sent[1].body.partner_request_id)
})

test('API 9: a failed lookup is a plain not found, no alert', async () => {
  reply = { status: 200, data: { error: 0, status: 3, msg: 'Record not found' } }
  const r = await fetchVehicleInfo('ZZ99ZZ0000', { provider: 'api9' })
  assert.equal(r.found, false)
  assert.match(r.message, /not found/)
  assert.equal(alerts.length, 0)
})

test('API 9: invalid registration number says invalid number', async () => {
  reply = { status: 200, data: { error: 1, msg: 'Invalid registration number' } }
  const r = await fetchVehicleInfo('XX', { provider: 'api9' })
  assert.equal(r.found, false)
  assert.match(r.message, /Invalid vehicle number/)
})

test('API 9: low balance is an INSUFFICIENT_BALANCE alert', async () => {
  reply = { status: 200, data: { error: 1, msg: 'Insufficient balance' } }
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

// The real replies RechargeKit sent on 26 Nov 2026
const PENDING = { status: 202, data: { error: 0, msg: 'RC Advance validation pending please try after sometime', status: 2, orderid: 'b985f999', optransid: '', cardData: '', partnerreqid: 'x' } }
const FAILED = { status: 404, data: { error: 0, msg: 'RC Advance validation failed', status: 3, orderid: 'c400912a', optransid: '', partnerreqid: 'x' } }

test('API 9: pending (status 2) is retried with a new partner_request_id until it answers', async () => {
  reply = [PENDING, { status: 200, data: HIT }]
  const r = await fetchVehicleInfo('CG12BU5574', { provider: 'api9' })
  assert.equal(r.found, true)
  assert.equal(sent.length, 2)
  assert.notEqual(sent[0].body.partner_request_id, sent[1].body.partner_request_id)
})

test('API 9: still pending after every retry shows unavailable, not "not found"', async () => {
  reply = [PENDING, PENDING, PENDING]
  await assert.rejects(fetchVehicleInfo('CG12BU5574', { provider: 'api9' }), (e) => e.providerUnavailable)
  assert.equal(sent.length, 3)
  assert.equal(alerts[0].code, 'PENDING')
})

test('API 9: status 3 (validation failed, HTTP 404) is not found, no alert', async () => {
  reply = FAILED
  const r = await fetchVehicleInfo('CG12BU5574', { provider: 'api9' })
  assert.equal(r.found, false)
  assert.match(r.message, /not found/)
  assert.equal(alerts.length, 0)
})

test('API 9: an empty rc_no (422) is an invalid number', async () => {
  reply = { status: 422, data: { error: 422, msg: 'please enter valid registration number' } }
  const r = await fetchVehicleInfo('', { provider: 'api9' })
  assert.equal(r.found, false)
  assert.match(r.message, /Invalid vehicle number/)
})

test('API 9: a status 1 reply is used even with HTTP 202, and cardData may be a JSON string', async () => {
  reply = { status: 202, data: { ...HIT, cardData: JSON.stringify(HIT.cardData) } }
  const r = await fetchVehicleInfo('DL01AB1234', { provider: 'api9' })
  assert.equal(r.found, true)
  assert.equal(r.data.OWNER_NAME, 'Ravi Kumar')
  assert.equal(sent.length, 1)
})

test('API 9: an error printed during the lookup knows the vehicle no and who searched (admin Logs)', async () => {
  const { getLogContext } = require('../utils/logContext')
  const printed = []
  const original = console.error
  console.error = (...args) => printed.push({ text: args.join(' '), context: getLogContext() })
  try {
    reply = { status: 401, data: { error: 1, msg: 'Unauthorized' } }
    await assert.rejects(fetchVehicleInfo('CG04AB1234', { provider: 'api9', userId: 'user1', staffId: 'staff1', via: 'User search' }))
  } finally {
    console.error = original
  }
  const refused = printed.find((p) => p.text.includes('[API 9]'))
  assert.ok(refused, 'the API 9 error was printed')
  assert.deepEqual(refused.context, { vehicleNumber: 'CG04AB1234', userId: 'user1', staffId: 'staff1', via: 'User search' })
})
