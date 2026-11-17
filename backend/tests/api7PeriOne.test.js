// API 7 (Telegram basic details, vehicleinfo.online) and PeriOne + API 7 (api47, transport advanced):
// PeriOne is asked first and API 7 only when PeriOne found the vehicle. No database needed: axios,
// ApiUsage and the admin alerts are stubbed. Run: node --test tests/
process.env.PERIONE_CLIENT_ID = 'cid'
process.env.PERIONE_CLIENT_SECRET = 'secret'
process.env.PERIONE_EMAIL = 'ops@example.com'
process.env.VEHICLE_INFO_API7_KEY = 'vi_test'
const { test, beforeEach } = require('node:test')
const assert = require('node:assert/strict')
const path = require('path')
const axios = require('axios')

const alerts = []
const usage = []
const stubModule = (rel, exports) => {
  const file = path.join(__dirname, '..', rel)
  require.cache[file] = { id: file, filename: file, loaded: true, exports }
}
stubModule('models/ApiUsage.js', { findOneAndUpdate: async (q, u) => { usage.push([q, u]) } })
stubModule('utils/adminAlerts.js', {
  raiseAlert: async (a) => { alerts.push(a) },
  autoResolveAlerts: async () => {}
})

const { fetchVehicleInfo } = require('../utils/vehicleInfoProvider')

// The API 7 reply seen for CG12BU5574
const API7_HIT = {
  status: 'SUCCESS',
  data: {
    vehicle_number: 'CG12BU5574',
    vehicle_info: {
      registrationNo: 'CG12BU5574',
      owner: 'NARAYAN  DWIVEDI',
      address: 'KORBA, CHATTISGARH, CT, 495674',
      chassisNo: 'ME3J3B5FMS2004994',
      engineNo: 'J3A5FMS20*****',
      registrationDate: '28/11/2025',
      make: 'Royal Enfield',
      model: 'Bullet',
      variant: '350 (350 CC)',
      fuel: 'Petrol',
      rto: 'Korba',
      rtoCode: 'CG12',
      bodyType: 'SOLO WITH PILLION (MOTORCYCLE)',
      cubicCapacity: 349,
      seatingCapacity: 2,
      financier: 'TATA CAPITAL LIMITED',
      policyNo: '2369/80625316/00/000',
      pucNo: 'Newv4',
      pucValidTill: '27/11/2026'
    },
    mobile_lookup: { vehicle_number: 'CG12BU5574', mobile_number: '8602145864' },
    api_usage: { credits_deducted: 1, credits_remaining: 1995 }
  }
}
const API7_MISS = { status: 'VEHICLE_NOT_FOUND', data: [] }

const PERIONE_HIT = {
  code: '200',
  response: [{
    responseStatus: 'SUCCESS',
    response: {
      rcRegnNo: 'CG12BU5574',
      rcRegnDt: '2025-11-28',
      rcMakerDesc: 'ROYAL ENFIELD',
      rcInsuranceComp: 'New India',
      rcInsuranceUpto: '2027-01-10',
      rcInsurancePolicyNo: 'NEW-1',
      rcTaxUpto: '2026-12-31',
      rcFitUpto: '2027-11-27',
      rcStatus: 'ACTIVE',
      rcVhType: 'T'
    }
  }]
}
const PERIONE_MISS = { code: '200', response: [{ responseStatus: 'ERROR', message: 'Record not found' }] }

let api7Reply, peri, api7Calls, periCalls
beforeEach(() => {
  alerts.length = 0
  usage.length = 0
  api7Calls = 0
  periCalls = 0
  api7Reply = { status: 200, data: API7_HIT }
  peri = { status: 200, data: PERIONE_HIT }
})
axios.get = async (url, opts) => {
  api7Calls++
  assert.equal(opts.params.key, 'vi_test')
  if (api7Reply instanceof Error) throw api7Reply
  return api7Reply
}
axios.post = async () => {
  periCalls++
  if (peri instanceof Error) throw peri
  return peri
}

test('API 7 alone: basic details in the usual fields, masked engine left out, credits recorded', async () => {
  const r = await fetchVehicleInfo('CG12BU5574', { provider: 'api7' })
  assert.equal(r.found, true)
  assert.equal(r.data.OWNER_NAME, 'NARAYAN DWIVEDI')
  assert.equal(r.data.MOBILE_NO, '8602145864')
  assert.equal(r.data.CHASI_NO, 'ME3J3B5FMS2004994')
  assert.equal(r.data.ENG_NO, 'NA')
  assert.equal(r.data.REGN_DT, '28-Nov-2025')
  assert.equal(r.data.PUCC_UPTO, '27-Nov-2026')
  assert.equal(r.data.MAKER_MODEL, 'Bullet 350 (350 CC)')
  assert.equal(r.data.STATE_CD, 'CG')
  assert.equal(r.data.RTO_CD, '12')
  assert.equal(r.data.CUBIC_CAPACITY, '349.00')
  assert.equal(r.data.INSURANCE_UPTO, 'NA')
  assert.equal(usage[0][0].provider, 'vehicleinfoapi7')
  assert.equal(usage[0][1].$set.remaining, 1995)
})

test('API 7 alone: VEHICLE_NOT_FOUND is a plain not found', async () => {
  api7Reply = { status: 404, data: API7_MISS }
  const r = await fetchVehicleInfo('ZZ99ZZ0000', { provider: 'api7' })
  assert.equal(r.found, false)
  assert.equal(alerts.length, 0)
})

test('API 7 alone: INVALID_API_KEY raises an admin alert and shows unavailable', async () => {
  api7Reply = { status: 200, data: { status: 'INVALID_API_KEY', data: [] } }
  await assert.rejects(fetchVehicleInfo('CG12BU5574', { provider: 'api7' }), (e) => e.providerUnavailable)
  assert.equal(alerts[0].source, 'api7')
  assert.equal(alerts[0].severity, 'critical')
})

test('PeriOne + API 7: PeriOne not found -> API 7 is never called', async () => {
  peri = { status: 200, data: PERIONE_MISS }
  const r = await fetchVehicleInfo('CG04AB1234', { provider: 'api47' })
  assert.equal(r.found, false)
  assert.equal(periCalls, 1)
  assert.equal(api7Calls, 0)
})

test('PeriOne + API 7: PeriOne down -> unavailable, API 7 is never called', async () => {
  const err = new Error('timeout of 30000ms exceeded')
  err.code = 'ECONNABORTED'
  peri = err
  await assert.rejects(fetchVehicleInfo('CG04AB1234', { provider: 'api47' }), (e) => e.providerUnavailable)
  assert.equal(api7Calls, 0)
})

test('PeriOne + API 7: both called, PeriOne status + API 7 owner / mobile / chassis', async () => {
  const r = await fetchVehicleInfo('CG12BU5574', { provider: 'api47' })
  assert.equal(r.found, true)
  assert.equal(periCalls, 1)
  assert.equal(api7Calls, 1)
  // From PeriOne
  assert.equal(r.data.INSURANCE_UPTO, '10-Jan-2027')
  assert.equal(r.data.INSURANCE_COMP, 'New India')
  assert.equal(r.data.TAX_UPTO, '31-Dec-2026')
  assert.equal(r.data.FIT_UPTO, '27-Nov-2027')
  assert.equal(r.data.MAKER_DESC, 'ROYAL ENFIELD')
  // PeriOne has the insurance date, so its policy number is kept, not API 7's
  assert.equal(r.data.POLICY_NO, 'NEW-1')
  // From API 7
  assert.equal(r.data.OWNER_NAME, 'NARAYAN DWIVEDI')
  assert.equal(r.data.MOBILE_NO, '8602145864')
  assert.equal(r.data.CHASI_NO, 'ME3J3B5FMS2004994')
  assert.equal(r.data.PRESENT_ADDRESS, 'KORBA, CHATTISGARH, CT, 495674')
  // PeriOne has no PUC date here, so the whole PUC group comes from API 7
  assert.equal(r.data.PUCC_UPTO, '27-Nov-2026')
  assert.equal(r.data.PUCC_NO, 'Newv4')
})

test('PeriOne + API 7: API 7 misses -> PeriOne record alone', async () => {
  api7Reply = { status: 404, data: API7_MISS }
  const r = await fetchVehicleInfo('CG12BU5574', { provider: 'api47' })
  assert.equal(r.found, true)
  assert.equal(r.data.INSURANCE_UPTO, '10-Jan-2027')
  assert.equal(r.data.OWNER_NAME, 'NA')
})
