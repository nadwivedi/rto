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

test('PeriOne + API 7: both called, insurance / fitness / tax from PeriOne, other details from API 7', async () => {
  const r = await fetchVehicleInfo('CG12BU5574', { provider: 'api47' })
  assert.equal(r.found, true)
  assert.equal(periCalls, 1)
  assert.equal(api7Calls, 1)
  // Insurance / fitness / tax / RC status from PeriOne, the insurance group whole (PeriOne's policy no, not API 7's)
  assert.equal(r.data.INSURANCE_UPTO, '10-Jan-2027')
  assert.equal(r.data.INSURANCE_COMP, 'New India')
  assert.equal(r.data.POLICY_NO, 'NEW-1')
  assert.equal(r.data.INS_POLICY_NO, 'NEW-1')
  assert.equal(r.data.TAX_UPTO, '31-Dec-2026')
  assert.equal(r.data.FIT_UPTO, '27-Nov-2027')
  assert.equal(r.data.STATUS, 'ACTIVE')
  // Everything else from API 7, even where PeriOne sent its own value
  assert.equal(r.data.MAKER_DESC, 'Royal Enfield')
  assert.equal(r.data.OWNER_NAME, 'NARAYAN DWIVEDI')
  assert.equal(r.data.MOBILE_NO, '8602145864')
  assert.equal(r.data.CHASI_NO, 'ME3J3B5FMS2004994')
  assert.equal(r.data.PRESENT_ADDRESS, 'KORBA, CHATTISGARH, CT, 495674')
  // Fields API 7 does not have are filled from PeriOne
  assert.equal(r.data.IS_COMMERCIAL, 'TRUE')
  // PeriOne has no PUC date here, so API 7's PUC stays
  assert.equal(r.data.PUCC_UPTO, '27-Nov-2026')
  assert.equal(r.data.PUCC_NO, 'Newv4')
})

test('PeriOne + API 7: PeriOne PUC date wins with its own PUC number', async () => {
  const withPuc = structuredClone(PERIONE_HIT)
  withPuc.response[0].response.rcPuccUpto = '2027-03-01'
  peri = { status: 200, data: withPuc }
  const r = await fetchVehicleInfo('CG12BU5574', { provider: 'api47' })
  assert.equal(r.data.PUCC_UPTO, '01-Mar-2027')
  assert.equal(r.data.PUC_UPTO, '01-Mar-2027')
  // PeriOne sent no PUC number, so API 7's older one is not shown next to the new date
  assert.equal(r.data.PUCC_NO, 'NA')
})

test('PeriOne + API 7: API 7 misses -> PeriOne record alone', async () => {
  api7Reply = { status: 404, data: API7_MISS }
  const r = await fetchVehicleInfo('CG12BU5574', { provider: 'api47' })
  assert.equal(r.found, true)
  assert.equal(r.data.INSURANCE_UPTO, '10-Jan-2027')
  assert.equal(r.data.OWNER_NAME, 'NA')
})
