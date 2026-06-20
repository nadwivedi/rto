const path = require('path')
const mongoose = require('mongoose')
const XLSX = require('xlsx')
const Insurance = require('../models/Insurance')

require('dotenv').config({ path: path.join(__dirname, '..', '.env') })

const DEFAULT_MONGODB_URI = 'mongodb://localhost:27017/rto2'
const EXCEL_PATH = path.join(__dirname, '..', '..', 'insurance data.xlsx')

const TARGET_USER_ID = '6a055af65b635ab08748db26'

// const TARGET_USER_ID = '69194e960cb5afd352fb96cb'

const FIELDS_MAP = {
  policyHolderName: 'Name Of Insured',
  mobileNumber: 'Mobile Number',
  vehicleNumber: 'Registration No.',
  policyNumber: 'Policy Number',
  businessType: 'Business Type',
  validFrom: 'Policy Effective Date'
}

const BUSINESS_TYPE_MAP = {
  'CommercialVehicle': 'GCV',
  'TwoWheeler': 'Two Wheeler',
  'PrivateCar': 'Pvt. Car',
  'MiscellaneousVehicle': 'Mis-D'
}

const isDryRun = process.argv.includes('--dry-run')
const uriArg = process.argv.find((arg) => arg.startsWith('--uri='))

const parseDateDDMMYYYY = (value) => {
  if (!value) return null
  const str = String(value).trim()
  const match = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/)
  if (!match) return null
  const [, day, month, year] = match
  return { day: day.padStart(2, '0'), month: month.padStart(2, '0'), year }
}

const addYears = (parsed, years) => {
  let d = parseInt(parsed.day, 10)
  let m = parseInt(parsed.month, 10)
  let y = parseInt(parsed.year, 10)
  y += years
  d -= 1
  if (d < 1) {
    m -= 1
    if (m < 1) { m = 12; y -= 1 }
    const daysInPrevMonth = new Date(y, m, 0).getDate()
    d = daysInPrevMonth
  }
  return {
    day: String(d).padStart(2, '0'),
    month: String(m).padStart(2, '0'),
    year: String(y)
  }
}

const getStatus = (validTo) => {
  const parts = validTo.split('-')
  const date = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]))
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const thirtyDaysFromNow = new Date(today)
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

  if (date < today) return 'expired'
  if (date <= thirtyDaysFromNow) return 'expiring_soon'
  return 'active'
}

const loadExcel = () => {
  const wb = XLSX.readFile(EXCEL_PATH)
  const ws = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1 })
  if (rows.length < 2) throw new Error('Excel file has no data rows')
  return rows
}

const buildRecords = (rows) => {
  const headers = rows[0]
  const colIndex = {}
  headers.forEach((h, i) => { colIndex[h] = i })

  const records = []
  const skipped = []

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    const get = (field) => (row[colIndex[field]] != null ? String(row[colIndex[field]]).trim() : '')

    const rawDate = get('Policy Effective Date')
    const parsed = parseDateDDMMYYYY(rawDate)

    if (!parsed) {
      skipped.push({ row: i + 1, reason: `Invalid date: "${rawDate}"` })
      continue
    }

    const validFrom = `${parsed.day}-${parsed.month}-${parsed.year}`
    const expiry = addYears(parsed, 1)
    const validTo = `${expiry.day}-${expiry.month}-${expiry.year}`
    const vehicleNumber = get('Registration No.').toUpperCase().replace(/\s+/g, '')

    if (!vehicleNumber) {
      skipped.push({ row: i + 1, reason: 'Empty vehicle number' })
      continue
    }

    const businessType = get('Business Type')
    const productType = BUSINESS_TYPE_MAP[businessType] || businessType

    records.push({
      userId: TARGET_USER_ID,
      policyHolderName: get('Name Of Insured'),
      mobileNumber: get('Mobile Number'),
      vehicleNumber,
      policyNumber: get('Policy Number'),
      insuranceCompany: 'UNITED INDIA INSURANCE',
      productType,
      date: validFrom,
      validFrom,
      validTo,
      totalFee: 0,
      paid: 0,
      balance: 0,
      status: getStatus(validTo),
      isRenewed: false,
      renewPremium: 0,
      commission: 0,
      remarks: businessType ? `Imported from Excel` : ''
    })
  }

  return { records, skipped }
}

const importInsurance = async () => {
  const mongoUri = uriArg ? uriArg.slice('--uri='.length) : (process.env.MONGODB_URI || DEFAULT_MONGODB_URI)

  console.log(`Reading Excel file: ${EXCEL_PATH}`)
  const rows = loadExcel()
  console.log(`Found ${rows.length - 1} data rows`)

  const { records, skipped } = buildRecords(rows)
  console.log(`Parsed ${records.length} valid insurance records`)

  if (skipped.length > 0) {
    console.log(`\nSkipped ${skipped.length} rows:`)
    skipped.slice(0, 10).forEach((s) => console.log(`  Row ${s.row}: ${s.reason}`))
    if (skipped.length > 10) console.log(`  ... and ${skipped.length - 10} more`)
  }

  if (records.length === 0) {
    console.log('No valid records to import.')
    return
  }

  console.log(`\nSample record:`)
  console.log(JSON.stringify(records[0], null, 2))

  console.log(`\nTarget MongoDB: ${mongoUri}`)
  console.log(`Target userId: ${TARGET_USER_ID}\n`)

  if (isDryRun) {
    console.log('Dry run complete. No records inserted.')
    return
  }

  await mongoose.connect(mongoUri)

  let inserted = 0
  let updated = 0

  for (const record of records) {
    const existing = await Insurance.findOne({
      policyNumber: record.policyNumber
    })

    if (existing) {
      Object.assign(existing, record)
      await existing.save()
      updated++
      continue
    }

    await new Insurance(record).save()
    inserted++
  }

  console.log(`\nDone. Inserted: ${inserted}, Updated (duplicate overwritten): ${updated}`)
}

importInsurance()
  .catch((error) => {
    console.error('Import failed:', error.message)
    process.exitCode = 1
  })
  .finally(async () => {
    await mongoose.disconnect()
  })
