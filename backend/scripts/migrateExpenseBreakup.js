/**
 * Migration Script: Move expenseBreakup from documents to ExpenseBreakdown collection
 *
 * Run with: node backend/scripts/migrateExpenseBreakup.js
 *
 * IMPORTANT: Backup your MongoDB database before running this script!
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })
const mongoose = require('mongoose')

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI

if (!MONGO_URI) {
  console.error('❌ MONGO_URI not found in .env file. Please set it and try again.')
  process.exit(1)
}

// Define schemas inline (no circular dependency issues)
const expenseBreakdownSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  workType: { type: String, required: true },
  workId: { type: mongoose.Schema.Types.ObjectId, required: true },
  date: { type: String, required: true },
  name: { type: String, required: true, trim: true },
  amount: { type: Number, required: true, min: 0 },
  remark: { type: String, trim: true }
}, { timestamps: true })

async function migrateCollection(db, ExpenseBreakdown, collectionName, workTypeLabel, nameField) {
  const collection = db.collection(collectionName)

  // Find all docs with a non-empty expenseBreakup
  const docs = await collection.find({
    expenseBreakup: { $exists: true, $not: { $size: 0 } }
  }).toArray()

  console.log(`\n📋 Found ${docs.length} ${collectionName} document(s) with embedded expenseBreakup`)

  if (docs.length === 0) {
    console.log(`✅ Nothing to migrate for ${collectionName}.`)
    return { inserted: 0, failed: 0 }
  }

  let totalInserted = 0
  let totalFailed = 0

  for (const doc of docs) {
    const items = doc.expenseBreakup || []
    if (!Array.isArray(items) || items.length === 0) {
      await collection.updateOne({ _id: doc._id }, { $unset: { expenseBreakup: '' } })
      continue
    }

    // Use the document's createdAt date as the default expense date
    const defaultDate = doc.createdAt
      ? (() => {
          const d = new Date(doc.createdAt)
          const day = String(d.getDate()).padStart(2, '0')
          const month = String(d.getMonth() + 1).padStart(2, '0')
          const year = d.getFullYear()
          return `${day}-${month}-${year}`
        })()
      : new Date().toISOString().slice(0, 10)

    const newDocs = items
      .filter(item => item.name && item.amount && parseFloat(item.amount) > 0)
      .map(item => ({
        userId: doc.userId,
        workType: workTypeLabel,
        workId: doc._id,
        date: defaultDate,
        name: item.name,
        amount: parseFloat(item.amount) || 0,
        remark: item.remark || ''
      }))

    if (newDocs.length === 0) {
      await collection.updateOne({ _id: doc._id }, { $unset: { expenseBreakup: '' } })
      continue
    }

    try {
      await ExpenseBreakdown.insertMany(newDocs)
      totalInserted += newDocs.length
      const docName = doc[nameField] || doc._id
      console.log(`  ✓ Migrated ${newDocs.length} expense(s) for ${workTypeLabel}: ${docName} (${doc._id})`)

      // Remove expenseBreakup from the document
      await collection.updateOne(
        { _id: doc._id },
        { $unset: { expenseBreakup: '' } }
      )
    } catch (err) {
      totalFailed += 1
      console.error(`  ✗ Failed for ${workTypeLabel} ${doc._id}: ${err.message}`)
    }
  }

  return { inserted: totalInserted, failed: totalFailed }
}

async function migrate() {
  await mongoose.connect(MONGO_URI)
  console.log('✅ Connected to MongoDB')

  const db = mongoose.connection.db
  const ExpenseBreakdown = mongoose.model('ExpenseBreakdown', expenseBreakdownSchema)

  let grandTotalInserted = 0
  let grandTotalFailed = 0

  const modulesToMigrate = [
    { collection: 'drivings', workType: 'DL', nameField: 'name' },
    { collection: 'vehicletransfers', workType: 'VT', nameField: 'vehicleNumber' },
    { collection: 'registrationrenewals', workType: 'RR', nameField: 'vehicleNumber' },
    { collection: 'nocs', workType: 'NOC', nameField: 'vehicleNumber' }
  ]

  for (const module of modulesToMigrate) {
    const stats = await migrateCollection(db, ExpenseBreakdown, module.collection, module.workType, module.nameField)
    grandTotalInserted += stats.inserted
    grandTotalFailed += stats.failed
  }

  console.log(`\n✅ Overall Migration complete!`)
  console.log(`   ➜ Total expense entries inserted: ${grandTotalInserted}`)
  if (grandTotalFailed > 0) {
    console.log(`   ➜ ⚠️ Total failed documents: ${grandTotalFailed}`)
  }

  await mongoose.disconnect()
  console.log('🔌 Disconnected from MongoDB')
}

migrate().catch(err => {
  console.error('Migration crashed:', err)
  process.exit(1)
})
