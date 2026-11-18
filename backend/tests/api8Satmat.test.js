// API 8 (Satmat API, RC Verification Plus). No database needed: axios, ApiUsage and the admin alerts
// are stubbed. Run: node --test tests/
process.env.SATMAT_MEMBER_ID = '9999999999'
process.env.SATMAT_MEMBER_PASSWORD = 'test@12345'
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

// The sample reply in Satmat's API document (v7.0, RC Verification (Plus))
const HIT = {
  status: true,
  message: 'RC Verification Success',
  reference_number: 'REF123453111',
  request_id: 'REQUEST_878370923892783',
  data: {
    result: {
      type: 'Petrol',
      class: 'M-Cycle/Scooter(2Wn)',
      model: 'Activa 125 Disc',
      engine: 'MK13MW0011111',
      reg_no: 'MH03XU9999',
      status: 'Active',
      chassis: 'LF2JL220DER013434',
      financed: false,
      reg_date: '14-02-2025',
      rto_code: '',
      body_type: 'Two Wheeler Motorcyle',
      pucc_upto: '24-03-2027',
      wheelbase: '1260',
      norms_type: 'BHARAT STAGE VI',
      owner_name: 'Rohan Vinit Shaha',
      owner_count: '1',
      pucc_number: 'MH042034000987890',
      rc_financer: '',
      status_as_on: '07-04-2026',
      is_commercial: '',
      mobile_number: '9876543210',
      reg_authority: 'Mumbai, Maharashtra',
      rc_expiry_date: '13-02-2040',
      unladen_weight: '107',
      vehicle_colour: 'Pearl Siren Blue-A',
      challan_details: [],
      present_address: 'Room 402, B-Wing, Aravind Towers, M.G. Road, Fort,Mumbai Maharashtra-400001',
      vehicle_category: '2WN',
      vehicle_tax_upto: '13-02-2040',
      blacklist_details: [],
      owner_father_name: 'Vinit Shaha',
      permanent_address: 'Room 402, B-Wing, Aravind Towers, M.G. Road, Fort,Mumbai Maharashtra-400001',
      gross_vehicle_weight: '284',
      vehicle_cylinders_no: '1',
      split_present_address: { city: [], state: [], country: [], pincode: '400001', district: [], address_line: 'Room 402' },
      vehicle_seat_capacity: '2',
      vehicle_cubic_capacity: '123.92',
      vehicle_insurance_upto: '12-02-2030',
      vehicle_sleeper_capacity: '0',
      vehicle_manufacturer_name: 'Honda Motorcycle And Scooter India (P) Ltd',
      vehicle_standing_capacity: '0',
      vehicle_insurance_company_name: 'Icici Insurance Co. Ltd.',
      vehicle_insurance_policy_number: '1234/111234543245/00/000',
      vehicle_manufacturing_month_year: '1/2025'
    },
    result_code: 101,
    response_metadata: { rc_details: true, mobile_number: false },
    http_response_code: 200
  }
}

let reply, sent
beforeEach(() => {
  alerts.length = 0
  sent = []
  reply = { status: 200, data: HIT }
})
axios.post = async (url, body) => {
  sent.push({ url, body })
  if (reply instanceof Error) throw reply
  return reply
}

test('API 8: Satmat record in the usual fields, dates as dd-Mon-yyyy', async () => {
  const r = await fetchVehicleInfo('MH03XU9999', { provider: 'api8' })
  assert.equal(r.found, true)
  assert.deepEqual(r.servedBy, ['api8'])
  assert.equal(r.data.REGN_NO, 'MH03XU9999')
  assert.equal(r.data.OWNER_NAME, 'Rohan Vinit Shaha')
  assert.equal(r.data.F_NAME, 'Vinit Shaha')
  assert.equal(r.data.MOBILE_NO, '9876543210')
  assert.equal(r.data.CHASI_NO, 'LF2JL220DER013434')
  assert.equal(r.data.ENG_NO, 'MK13MW0011111')
  assert.equal(r.data.MAKER_DESC, 'Honda Motorcycle And Scooter India (P) Ltd')
  assert.equal(r.data.MAKER_MODEL, 'Activa 125 Disc')
  assert.equal(r.data.FUEL_DESC, 'Petrol')
  assert.equal(r.data.VEHICLE_CLASS, 'M-Cycle/Scooter(2Wn)')
  assert.equal(r.data.REGN_DT, '14-Feb-2025')
  assert.equal(r.data.REGN_UPTO, '13-Feb-2040')
  assert.equal(r.data.INSURANCE_UPTO, '12-Feb-2030')
  assert.equal(r.data.INSURANCE_COMP, 'Icici Insurance Co. Ltd.')
  assert.equal(r.data.POLICY_NO, '1234/111234543245/00/000')
  assert.equal(r.data.PUCC_UPTO, '24-Mar-2027')
  assert.equal(r.data.PUCC_NO, 'MH042034000987890')
  assert.equal(r.data.TAX_UPTO, '13-Feb-2040')
  assert.equal(r.data.STATUS_AS_ON, '07-Apr-2026')
  assert.equal(r.data.STATUS, 'Active')
  assert.equal(r.data.MANU_MONTH_YR, '01/2025')
  assert.equal(r.data.CUBIC_CAPACITY, '123.92')
  assert.equal(r.data.STATE_CD, 'MH')
  assert.equal(r.data.RTO_CD, '03')
  assert.equal(r.data.CURRENTADD_PINCODE, '400001')
  assert.equal(r.data.FINANCER_DETAILS, 'NA')
  assert.equal(r.data.FIT_UPTO, 'NA')
  // Satmat's request: member credentials, a fresh reference number and the vehicle number
  assert.equal(sent[0].body.member_id, '9999999999')
  assert.equal(sent[0].body.member_password, 'test@12345')
  assert.equal(sent[0].body.vehicle_number, 'MH03XU9999')
  assert.match(sent[0].body.reference_number, /^RTOS\d+$/)
})

test('API 8: every request gets its own reference number', async () => {
  await fetchVehicleInfo('MH03XU9999', { provider: 'api8' })
  await fetchVehicleInfo('MH03XU9999', { provider: 'api8' })
  assert.notEqual(sent[0].body.reference_number, sent[1].body.reference_number)
})

test('API 8: result_code 103 (no record) is a plain not found', async () => {
  reply = { status: 200, data: { status: false, message: 'No Record Found', result: { http_response_code: 200, result_code: 103, message: 'No record found for the given input' } } }
  const r = await fetchVehicleInfo('ZZ99ZZ0000', { provider: 'api8' })
  assert.equal(r.found, false)
  assert.match(r.message, /not found/)
  assert.equal(alerts.length, 0)
})

test('API 8: 422 input validation error says invalid number, no alert', async () => {
  reply = { status: 422, data: { status: false, message: 'Input Validation Error' } }
  const r = await fetchVehicleInfo('XX', { provider: 'api8' })
  assert.equal(r.found, false)
  assert.match(r.message, /Invalid vehicle number/)
  assert.equal(alerts.length, 0)
})

test('API 8: Invalid IP Address (401) raises a critical admin alert and shows unavailable', async () => {
  reply = { status: 401, data: { status: false, message: 'Invalid IP Address', reference_number: 'RTOS1' } }
  await assert.rejects(fetchVehicleInfo('MH03XU9999', { provider: 'api8' }), (e) => e.providerUnavailable && /Invalid IP Address/.test(e.detail))
  assert.equal(alerts[0].source, 'api8')
  assert.equal(alerts[0].severity, 'critical')
  assert.equal(alerts[0].code, 'HTTP_401')
})

test('API 8: empty wallet (409) is an INSUFFICIENT_BALANCE alert', async () => {
  reply = { status: 409, data: { status: false, message: 'Insufficient wallet balance. Your current balance is 0.00.' } }
  await assert.rejects(fetchVehicleInfo('MH03XU9999', { provider: 'api8' }), (e) => e.providerUnavailable)
  assert.equal(alerts[0].code, 'INSUFFICIENT_BALANCE')
  assert.equal(alerts[0].title, 'API 8 – Satmat API: wallet balance too low')
})

test('API 8: 503 source busy shows unavailable', async () => {
  const err = new Error('Request failed with status code 503')
  err.response = { status: 503, data: { status: false, message: 'Source is busy or unavailable.' } }
  reply = err
  await assert.rejects(fetchVehicleInfo('MH03XU9999', { provider: 'api8' }), (e) => e.providerUnavailable)
  assert.equal(alerts[0].code, 'HTTP_503')
  assert.equal(alerts[0].severity, 'warning')
})

test('API 8: not set up without the member id / password', async () => {
  const saved = process.env.SATMAT_MEMBER_PASSWORD
  delete process.env.SATMAT_MEMBER_PASSWORD
  try {
    await assert.rejects(fetchVehicleInfo('MH03XU9999', { provider: 'api8' }), (e) => e.providerUnavailable)
    assert.equal(alerts[0].code, 'NOT_SET_UP')
    assert.equal(sent.length, 0)
  } finally {
    process.env.SATMAT_MEMBER_PASSWORD = saved
  }
})

test('API 8: other field names, nested permit details and every leftover field in EXTRA_DETAILS', async () => {
  reply = {
    status: 200,
    data: {
      status: true,
      message: 'RC Verification Success',
      data: {
        result: {
          reg_no: 'CG04AB1234',
          owner_name: 'Ram Kumar',
          maker_description: 'TATA MOTORS LTD',
          maker_model: 'SIGNA 4825.TK',
          fuel_type: 'Diesel',
          status: 'Active',
          financed: true,
          permit_details: {
            permit_number: 'CG2024-NP-1234',
            type: 'National Permit',
            permit_valid_upto: '31-12-2028',
            permit_issuing_authority: 'RTO Raipur'
          },
          challan_details: [{ challan_no: 'CG123', amount: 500 }],
          blacklist_details: [],
          rto_phone_number: '0771-1234567',
          vehicle_insurance_upto: '2027-05-01'
        },
        result_code: 101
      }
    }
  }
  const r = await fetchVehicleInfo('CG04AB1234', { provider: 'api8' })
  assert.equal(r.found, true)
  assert.equal(r.data.MAKER_DESC, 'TATA MOTORS LTD')
  assert.equal(r.data.MAKER_MODEL, 'SIGNA 4825.TK')
  assert.equal(r.data.FUEL_DESC, 'Diesel')
  assert.equal(r.data.PERMIT_NO, 'CG2024-NP-1234')
  assert.equal(r.data.PERMIT_VALID_UPTO, '31-Dec-2028')
  assert.equal(r.data.PERMIT_ISSUING_AUTHORITY, 'RTO Raipur')
  assert.equal(r.data.INSURANCE_UPTO, '01-May-2027')
  assert.equal(r.data.FINANCER_DETAILS, 'Financed')
  assert.equal(r.data.STATUS, 'Active')
  assert.deepEqual(r.data.EXTRA_DETAILS, {
    'Permit Details Type': 'National Permit',
    'Challan Details': 'Challan No: CG123, Amount: 500',
    'Rto Phone Number': '0771-1234567'
  })
})
