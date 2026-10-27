const archiver = require('archiver')
const transporter = require('./nodemailer')

// Every collection holding a user's work data. Cleaning a user backs these up
// and deletes them; the account itself, its settings (WhatsApp, employees,
// expense defaults) and billing records (API keys, credits, RC usage) stay.
const USER_DATA_MODELS = [
  { file: 'vehicle_registrations', model: require('../models/VehicleRegistration') },
  { file: 'driving_licenses', model: require('../models/Driving') },
  { file: 'national_permits', model: require('../models/NationalPermit') },
  { file: 'cg_permits', model: require('../models/CgPermit') },
  { file: 'bus_permits', model: require('../models/BusPermit') },
  { file: 'temporary_permits', model: require('../models/TemporaryPermit') },
  { file: 'temporary_permits_other_state', model: require('../models/TemporaryPermitOtherState') },
  { file: 'fitness_certificates', model: require('../models/Fitness') },
  { file: 'fitness_work', model: require('../models/FitnessWork') },
  { file: 'tax_records', model: require('../models/Tax') },
  { file: 'green_tax', model: require('../models/GreenTax') },
  { file: 'professional_tax', model: require('../models/ProfessionalTax') },
  { file: 'insurance_records', model: require('../models/Insurance') },
  { file: 'puc_records', model: require('../models/Puc') },
  { file: 'gps', model: require('../models/Gps') },
  { file: 'hpa_hpt', model: require('../models/HpaHpt') },
  { file: 'noc', model: require('../models/Noc') },
  { file: 'registration_renewals', model: require('../models/registrationRenewal') },
  { file: 'vehicle_transfers', model: require('../models/vehicleTransfer') },
  { file: 'speed_governors', model: require('../models/SpeedGovernor') },
  { file: 'custom_bills', model: require('../models/CustomBill') },
  { file: 'parties', model: require('../models/Party') },
  { file: 'agents', model: require('../models/Agent') },
  { file: 'payments_received', model: require('../models/PaymentReceived') },
  { file: 'money_received', model: require('../models/MoneyReceived') },
  { file: 'expense_breakdowns', model: require('../models/ExpenseBreakdown') },
  { file: 'javak', model: require('../models/Javak') },
  { file: 'kyc', model: require('../models/Kyc') },
  { file: 'leads', model: require('../models/Lead') },
  { file: 'bookmarks', model: require('../models/Bookmark') },
  { file: 'license_classes', model: require('../models/LicenseClass') },
  { file: 'message_logs', model: require('../models/MessageLog') },
  { file: 'vehicle_search_history', model: require('../models/VehicleSearchHistory') }
]

const BACKUP_FROM = 'desinplus1@gmail.com'
const BACKUP_TO = 'rtosarthi@gmail.com'

/**
 * Zip a user's info and all their data into an in-memory buffer
 */
const createUserBackupZip = (user, collections) => {
  return new Promise((resolve, reject) => {
    const archive = archiver('zip', { zlib: { level: 9 } })
    const chunks = []

    archive.on('data', (chunk) => chunks.push(chunk))
    archive.on('error', reject)
    archive.on('end', () => resolve(Buffer.concat(chunks)))

    archive.append(JSON.stringify(user, null, 2), { name: 'user_info.json' })
    for (const { file, docs } of collections) {
      if (docs.length > 0) {
        archive.append(JSON.stringify(docs, null, 2), { name: `${file}.json` })
      }
    }

    archive.finalize()
  })
}

/**
 * Back up all of a user's data by email, then delete it.
 * Nothing is deleted unless the backup email was sent.
 * Returns the number of records deleted per collection.
 */
const backupAndCleanUserData = async (user) => {
  const userId = user._id

  const collections = await Promise.all(
    USER_DATA_MODELS.map(async ({ file, model }) => ({
      file,
      model,
      docs: await model.find({ userId }).lean()
    }))
  )
  const totalRecords = collections.reduce((sum, c) => sum + c.docs.length, 0)

  const zip = await createUserBackupZip(user, collections)
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
  const safeName = (user.name || 'user').replace(/[^a-zA-Z0-9]/g, '_')

  const summaryRows = collections
    .filter((c) => c.docs.length > 0)
    .map((c) => `<li>${c.file.replace(/_/g, ' ')}: <strong>${c.docs.length}</strong></li>`)
    .join('')

  console.log(`[CLEAN] Emailing backup of ${totalRecords} records for user ${user.mobile1} before cleaning...`)
  await transporter.sendMail({
    from: BACKUP_FROM,
    to: BACKUP_TO,
    subject: `RTO Sarthi - User Data Backup before Clean - ${user.name} (${user.mobile1})`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #DC2626;">User Data Backup (before Clean Data)</h2>
        <p>All data of the user below is being permanently deleted by an admin. The full backup is attached.</p>

        <div style="background-color: #F3F4F6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 5px 0;">Name: <strong>${user.name}</strong></p>
          <p style="margin: 5px 0;">Mobile: <strong>${user.mobile1}</strong></p>
          ${user.email ? `<p style="margin: 5px 0;">Email: <strong>${user.email}</strong></p>` : ''}
          <p style="margin: 5px 0;">User ID: <strong>${userId}</strong></p>
          <p style="margin: 5px 0;">Backup Date: <strong>${new Date().toLocaleString('en-IN')}</strong></p>
        </div>

        <div style="background-color: #EFF6FF; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #1E40AF;">Records backed up: ${totalRecords}</h3>
          <ul style="color: #374151;">${summaryRows || '<li>No records</li>'}</ul>
        </div>

        <p style="color: #6B7280; font-size: 12px; margin-top: 30px;">
          This is an automated email. Please do not reply to this message.
        </p>
      </div>
    `,
    attachments: [
      {
        filename: `user_backup_${user.mobile1}_${safeName}_${timestamp}.zip`,
        content: zip
      }
    ]
  })
  console.log(`[CLEAN] Backup email sent for user ${user.mobile1}`)

  // Delete exactly the records that went into the backup
  const deleted = {}
  for (const { file, model, docs } of collections) {
    if (docs.length === 0) continue
    const result = await model.deleteMany({ _id: { $in: docs.map((d) => d._id) } })
    deleted[file] = result.deletedCount
  }

  return { totalRecords, deleted }
}

module.exports = { backupAndCleanUserData }
