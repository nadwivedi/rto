const fs = require('fs')
const path = require('path')
const mongoose = require('mongoose')

require('dotenv').config({ path: path.join(__dirname, '..', '.env') })

const VehicleRegistration = require('../models/VehicleRegistration')
const Insurance = require('../models/Insurance')

const DEFAULT_MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rto'
const DEFAULT_USER_ID = '6a055af65b635ab08748db26'
const CSV_PATH = path.join(__dirname, '..', '..', 'final.csv')

// CLI arguments handling
const isDryRun = process.argv.includes('--dry-run')
const uriArg = process.argv.find((arg) => arg.startsWith('--uri='))
const userIdArg = process.argv.find((arg) => arg.startsWith('--userId='))

const MONGODB_URI = uriArg ? uriArg.slice('--uri='.length) : DEFAULT_MONGODB_URI
const TARGET_USER_ID = userIdArg ? userIdArg.slice('--userId='.length) : DEFAULT_USER_ID

// Robust CSV parser supporting quoted strings and newlines in quotes
function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0)
  return lines.map((line) => {
    const row = []
    let insideQuote = false
    let currentCell = ''
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      if (char === '"') {
        insideQuote = !insideQuote
      } else if (char === ',' && !insideQuote) {
        row.push(currentCell.trim())
        currentCell = ''
      } else {
        currentCell += char
      }
    }
    row.push(currentCell.trim())
    return row
  })
}

// Convert date strings like "Sep 2, 2025" or "May 20, 2010 12:00 AM" or "02-09-2025" to DD-MM-YYYY
function formatDate(dateStr) {
  if (!dateStr) return ''
  const cleanStr = String(dateStr).replace(/\s+12:00\s+AM/i, '').replace(/,/g, '').trim()
  if (!cleanStr) return ''

  // Direct regex for DD-MM-YYYY or DD/MM/YYYY
  const directMatch = cleanStr.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/)
  if (directMatch) {
    const [, d, m, y] = directMatch
    return `${d.padStart(2, '0')}-${m.padStart(2, '0')}-${y}`
  }

  const d = new Date(cleanStr)
  if (isNaN(d.getTime())) {
    return cleanStr
  }
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}-${month}-${year}`
}

// Calculate status from DD-MM-YYYY date string
function getInsuranceStatus(validToStr) {
  if (!validToStr) return 'active'
  const parts = validToStr.split('-')
  if (parts.length !== 3) return 'active'

  const validToDate = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10))
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const thirtyDaysFromNow = new Date(today)
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

  if (validToDate < today) {
    return 'expired'
  } else if (validToDate <= thirtyDaysFromNow) {
    return 'expiring_soon'
  } else {
    return 'active'
  }
}

async function seedData() {
  console.log('--------------------------------------------------')
  console.log('     RTO & Insurance Data Seeding Script          ')
  console.log('--------------------------------------------------')
  console.log(`CSV Path     : ${CSV_PATH}`)
  console.log(`Target User  : ${TARGET_USER_ID}`)
  console.log(`MongoDB URI  : ${MONGODB_URI}`)
  console.log(`Dry Run Mode : ${isDryRun ? 'YES (No DB changes)' : 'NO (Will write to DB)'}`)
  console.log('--------------------------------------------------\n')

  if (!fs.existsSync(CSV_PATH)) {
    throw new Error(`File not found at: ${CSV_PATH}`)
  }

  const csvContent = fs.readFileSync(CSV_PATH, 'utf8')
  const rows = parseCSV(csvContent)

  if (rows.length < 2) {
    throw new Error('CSV file contains no data rows')
  }

  console.log(`Found ${rows.length - 1} data records in CSV.`)

  const vehicleMap = new Map() // Key: registrationNumber
  const insuranceList = []

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]

    const policyNumber = (row[0] || '').trim().toUpperCase()
    const insuredName = (row[3] || '').trim()
    const rawValidFrom = (row[4] || '').trim()
    const rawValidTo = (row[5] || '').trim()
    const productType = (row[7] || '').trim() || 'Motor'
    const chassisNumber = (row[9] || '').trim().toUpperCase()
    const engineNumber = (row[10] || '').trim().toUpperCase()
    const registrationNumber = (row[11] || '').trim().toUpperCase().replace(/\s+/g, '')

    const odPremium = parseFloat(row[13]) || 0
    const tpPremium = parseFloat(row[14]) || 0
    const netPremium = parseFloat(row[22]) || 0
    const grossPremium = parseFloat(row[23]) || 0
    const insuranceCompany = (row[29] || '').trim()
    const mobileNumber = (row[34] || '').trim()

    const vehicleClass = (row[40] || '').trim()
    const seatingCapacity = parseInt(row[41], 10) || undefined
    const cubicCapacity = parseInt(row[42], 10) || undefined
    const fuelType = (row[43] || '').trim()
    const manufactureYear = (row[45] || '').trim()
    const rawRegDate = (row[46] || '').trim()
    const makerName = (row[47] || '').trim()
    const makerModel = (row[48] || '').trim()

    const validFrom = formatDate(rawValidFrom)
    const validTo = formatDate(rawValidTo)
    const dateOfRegistration = formatDate(rawRegDate)

    // Build Vehicle Record if registrationNumber is available
    if (registrationNumber) {
      vehicleMap.set(registrationNumber, {
        userId: TARGET_USER_ID,
        registrationNumber,
        ownerName: insuredName,
        chassisNumber: chassisNumber || registrationNumber || 'UNKNOWN',
        engineNumber,
        mobileNumber,
        vehicleClass,
        seatingCapacity,
        cubicCapacity,
        fuelType,
        manufactureYear,
        dateOfRegistration,
        makerName,
        makerModel
      })
    }

    // Build Insurance Record
    if (policyNumber) {
      const totalFee = grossPremium || netPremium || 0
      insuranceList.push({
        userId: TARGET_USER_ID,
        policyNumber,
        policyHolderName: insuredName,
        productType,
        insuranceCompany: insuranceCompany || 'United India Insurance',
        date: validFrom,
        validFrom,
        validTo,
        vehicleNumber: registrationNumber,
        mobileNumber,
        odPremium,
        tpPremium,
        netPremium,
        premium: grossPremium,
        totalFee,
        paid: totalFee,
        balance: 0,
        status: getInsuranceStatus(validTo)
      })
    }
  }

  const vehiclesToProcess = Array.from(vehicleMap.values())
  console.log(`Prepared ${vehiclesToProcess.length} unique Vehicle Registration records.`)
  console.log(`Prepared ${insuranceList.length} Insurance records.`)

  if (isDryRun) {
    console.log('\n--- DRY RUN SUMMARY ---')
    console.log(`Sample Vehicle Record:`, vehiclesToProcess[0])
    console.log(`Sample Insurance Record:`, insuranceList[0])
    console.log('\nDry run complete. Database was not modified.')
    return
  }

  // Connect to MongoDB
  await mongoose.connect(MONGODB_URI)
  console.log('\nConnected to MongoDB successfully.')

  // 1. Seed / Upsert Vehicles
  let vehiclesInserted = 0
  let vehiclesUpdated = 0

  for (const veh of vehiclesToProcess) {
    const existing = await VehicleRegistration.findOne({
      userId: veh.userId,
      registrationNumber: veh.registrationNumber
    })

    if (existing) {
      Object.assign(existing, veh)
      await existing.save()
      vehiclesUpdated++
    } else {
      await new VehicleRegistration(veh).save()
      vehiclesInserted++
    }
  }

  console.log(`Vehicles    -> Inserted: ${vehiclesInserted}, Updated: ${vehiclesUpdated}`)

  // 2. Seed / Upsert Insurance Records
  let insuranceInserted = 0
  let insuranceUpdated = 0

  for (const ins of insuranceList) {
    const existing = await Insurance.findOne({
      userId: ins.userId,
      policyNumber: ins.policyNumber
    })

    if (existing) {
      Object.assign(existing, ins)
      await existing.save()
      insuranceUpdated++
    } else {
      await new Insurance(ins).save()
      insuranceInserted++
    }
  }

  console.log(`Insurance   -> Inserted: ${insuranceInserted}, Updated: ${insuranceUpdated}`)
  console.log('\nData seeding finished successfully!')
}

seedData()
  .catch((err) => {
    console.error('\nSeeding failed with error:', err)
    process.exitCode = 1
  })
  .finally(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect()
      console.log('MongoDB disconnected.')
    }
  })
