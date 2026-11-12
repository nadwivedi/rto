// API 5 (parzivalapi.online) when Parzival serves the key from its Kundan provider, which sends readable
// labels ('Owner name', ...) instead of API 1 names. No database needed: axios, ApiUsage and the admin
// alerts are stubbed. Run: node --test tests/
process.env.PARZIVAL5_API_KEY = 'pz_live_test_x'
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

const { fetchVehicleInfo } = require('../utils/vehicleInfoProvider')

let reply
let sent
axios.get = async (url, opts) => {
  sent = { url, opts }
  return reply
}

// Shape of a real Kundan reply through Parzival (Nov 2026); the values are made up.
const KUNDAN_DATA = {
  'Registration number': 'MH12AB1234',
  'Owner name': 'RAHUL SHARMA',
  'Father/husband name': null,
  'Registration date': '2019-03-15',
  'RC/fitness valid date': '2034-03-14',
  'RTO / registering authority': 'MH-12',
  'Chassis number': 'MA3XXXXXXXX123456',
  'Engine number': 'K12MXXXX1234',
  'Manufacturer / maker': 'MARUTI SUZUKI INDIA LTD',
  Model: 'SWIFT VXI',
  'Fuel type': 'PETROL',
  'Emission norms': null,
  Color: 'WHITE',
  'Seating capacity': 5,
  'Finance status / financer': 'On Cash',
  'Insurance company': 'SAMPLE GENERAL INSURANCE CO. LTD.',
  'Insurance policy number': 'XXXXXXXX1234',
  'Insurance valid date': '2027-03-10',
  'PUCC number': null,
  'PUCC valid date': null,
  'Official Parivahan URL with registration number': 'https://vahan.parivahan.gov.in/nrservices/faces/user/searchstatus.xhtml?rc_no=MH12AB1234',
  verification: {
    'Registration number': 'MH12AB1234',
    'Owner name': 'RAHUL SHARMA',
    'Model name': 'SWIFT VXI',
    RTO: 'MH-12',
    'Registering authority': 'PUNE, Maharashtra',
    'RC status': 'ACTIVE'
  }
}

test('Kundan-format reply is mapped to the API 1 fields', async () => {
  reply = {
    status: 200,
    data: { success: true, api: 'vehicle', charged: 2.5, remaining: 99, calls_left: { vehicle: 99, hsrp: 10 }, data: KUNDAN_DATA }
  }
  const result = await fetchVehicleInfo('MH12AB1234', { provider: 'api5' })

  assert.equal(sent.url, 'https://api.parzivalapi.online/v1/vehicle')
  assert.equal(sent.opts.params.number, 'MH12AB1234')
  assert.equal(result.found, true)
  assert.equal(result.charged, true)
  const d = result.data
  assert.equal(d.REGN_NO, 'MH12AB1234')
  assert.equal(d.OWNER_NAME, 'RAHUL SHARMA')
  assert.equal(d.CHASI_NO, 'MA3XXXXXXXX123456')
  assert.equal(d.ENG_NO, 'K12MXXXX1234')
  assert.equal(d.MAKER_DESC, 'MARUTI SUZUKI INDIA LTD')
  assert.equal(d.MAKER_MODEL, 'SWIFT VXI')
  assert.equal(d.REGN_DT, '15-Mar-2019')
  assert.equal(d.FIT_UPTO, '14-Mar-2034')
  assert.equal(d.INSURANCE_UPTO, '10-Mar-2027')
  assert.equal(d.INSURANCE_COMP, 'SAMPLE GENERAL INSURANCE CO. LTD.')
  assert.equal(d.INS_POLICY_NO, 'XXXXXXXX1234')
  assert.equal(d.STATE_CD, 'MH')
  assert.equal(d.RTO_CD, 'MH12')
  assert.equal(d.REGISTERED_AT, 'PUNE, Maharashtra')
  assert.equal(d.STATUS, 'ACTIVE')
  assert.equal(d.SEATING_CAPACITY, '5')
  assert.equal(d.FINANCER_DETAILS, 'NA') // 'On Cash' = no loan
  assert.equal(d.F_NAME, 'NA')
  assert.equal(d.PUCC_UPTO, 'NA')
})

test('API 1-format reply still works as before', async () => {
  reply = {
    status: 200,
    data: { success: true, charged: 2.5, remaining: 98, data: { REGN_NO: 'MH12AB1234', OWNER_NAME: 'RAHUL SHARMA', MAKER_MODEL: 'SWIFT VXI' } }
  }
  const result = await fetchVehicleInfo('MH12AB1234', { provider: 'api5' })
  assert.equal(result.found, true)
  assert.equal(result.data.OWNER_NAME, 'RAHUL SHARMA')
  assert.equal(result.data.MAKER_MODEL, 'SWIFT VXI')
})

test('Kundan miss (Parzival 404) is "not found", not an outage', async () => {
  reply = { status: 404, data: { success: false, error: 'No record found for this number. You were not charged.' } }
  const result = await fetchVehicleInfo('ZZ99ZZ9999', { provider: 'api5' })
  assert.equal(result.found, false)
  assert.equal(result.charged, false)
})

test('waits long enough for a slow Kundan lookup', async () => {
  reply = { status: 404, data: { success: false, error: 'x' } }
  await fetchVehicleInfo('ZZ99ZZ9999', { provider: 'api5' })
  assert.ok(sent.opts.timeout >= 60000)
})
