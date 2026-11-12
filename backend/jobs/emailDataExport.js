const cron = require('node-cron')
const archiver = require('archiver')
const path = require('path')
const fs = require('fs')
const transporter = require('../utils/nodemailer')

const User = require('../models/User')
const VehicleRegistration = require('../models/VehicleRegistration')
const DrivingLicense = require('../models/Driving')
const NationalPermit = require('../models/NationalPermit')
const CgPermit = require('../models/CgPermit')
const TemporaryPermit = require('../models/TemporaryPermit')
const TemporaryPermitOtherState = require('../models/TemporaryPermitOtherState')
const Fitness = require('../models/Fitness')
const Tax = require('../models/Tax')
const Insurance = require('../models/Insurance')
const Puc = require('../models/Puc')
const VehicleTransfer = require('../models/vehicleTransfer')
const CustomBill = require('../models/CustomBill')

// Backups are kept on the server too (backend/backups), so a failed email never means a lost backup
const BACKUP_DIR = process.env.BACKUP_DIR || path.join(__dirname, '..', 'backups')
const BACKUP_KEEP_DAYS = Number(process.env.BACKUP_KEEP_DAYS) || 7
// The mail server refuses mails over 20MB, and attachments grow ~33% when base64 encoded,
// so each mailed part is at most 14MB (~18.7MB once encoded)
const EMAIL_PART_BYTES = (Number(process.env.BACKUP_EMAIL_PART_MB) || 14) * 1024 * 1024
const LAST_EMAIL_FILE = path.join(BACKUP_DIR, 'last-email.json')

const BACKUP_FROM = 'desinplus1@gmail.com'
const BACKUP_TO = 'rtosarthi@gmail.com'

// Collections in each backup: [file name, model]
const COLLECTIONS = [
  ['vehicle_registrations', VehicleRegistration],
  ['driving_licenses', DrivingLicense],
  ['national_permits', NationalPermit],
  ['cg_permits', CgPermit],
  ['temporary_permits', TemporaryPermit],
  ['temporary_permits_other_state', TemporaryPermitOtherState],
  ['fitness_certificates', Fitness],
  ['tax_records', Tax],
  ['insurance_records', Insurance],
  ['puc_records', Puc],
  ['vehicle_transfers', VehicleTransfer],
  ['custom_bills', CustomBill]
]

const ensureBackupDir = () => {
  if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true })
}

const fileTimestamp = () => new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)

const formatSize = (bytes) => `${(bytes / (1024 * 1024)).toFixed(2)} MB`

/**
 * Write a ZIP file: addEntries(archive) appends the files; resolves with the file's size
 */
const writeZip = (filepath, addEntries) => {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(filepath)
    const archive = archiver('zip', { zlib: { level: 9 } })

    archive.on('error', reject)
    output.on('error', reject)
    output.on('close', () => resolve(archive.pointer()))

    archive.pipe(output)
    Promise.resolve(addEntries(archive))
      .then(() => archive.finalize())
      .catch((err) => {
        archive.abort()
        reject(err)
      })
  })
}

/**
 * Create a ZIP file with all data combined (one JSON file per collection)
 */
const createCombinedZip = async (timestamp) => {
  console.log('[EXPORT] Fetching all data for combined export...')
  const filepath = path.join(BACKUP_DIR, `rto_all_data_combined_${timestamp}.zip`)

  const size = await writeZip(filepath, async (archive) => {
    const users = await User.find({}).select('-password').lean()
    console.log(`[EXPORT] Found ${users.length} users and related data`)
    archive.append(JSON.stringify(users), { name: 'users.json' })

    for (const [name, Model] of COLLECTIONS) {
      const records = await Model.find({}).populate('userId', 'name mobile1').lean()
      archive.append(JSON.stringify(records), { name: `${name}.json` })
    }
  })

  console.log(`[EXPORT] Combined ZIP created: ${formatSize(size)}`)
  return { filepath, size }
}

/**
 * Create a ZIP file with user-wise organization (kept on the server only, it holds the same data)
 */
const createUserWiseZip = async (timestamp) => {
  console.log('[EXPORT] Fetching all data for user-wise export...')
  const filepath = path.join(BACKUP_DIR, `rto_all_data_user_wise_${timestamp}.zip`)

  const size = await writeZip(filepath, async (archive) => {
    const users = await User.find({}).select('-password').lean()
    console.log(`[EXPORT] Found ${users.length} users`)

    for (const user of users) {
      const userId = user._id
      const folderName = `user_${user.mobile1}_${String(user.name || '').replace(/[^a-zA-Z0-9]/g, '_')}`

      archive.append(JSON.stringify(user, null, 2), { name: `${folderName}/user_info.json` })

      for (const [name, Model] of COLLECTIONS) {
        const records = await Model.find({ userId }).lean()
        if (records.length > 0) {
          archive.append(JSON.stringify(records, null, 2), { name: `${folderName}/${name}.json` })
        }
      }
    }
  })

  console.log(`[EXPORT] User-wise ZIP created: ${formatSize(size)}`)
  return { filepath, size }
}

/**
 * Byte ranges to cut a file of `size` bytes into parts of at most `maxBytes` each
 * (end is inclusive, as fs.createReadStream expects)
 */
const splitRanges = (size, maxBytes) => {
  const ranges = []
  for (let start = 0; start < size; start += maxBytes) {
    ranges.push({ start, end: Math.min(start + maxBytes, size) - 1 })
  }
  return ranges.length ? ranges : [{ start: 0, end: -1 }]
}

const emailHtml = ({ fileName, size, partNo, partCount }) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h2 style="color: #4F46E5;">RTO Sarthi - Daily Data Backup</h2>
    <p>This is your automated daily data backup from RTO Sarthi system.</p>

    <div style="background-color: #F3F4F6; padding: 15px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 5px 0; color: #374151;">Backup Date: <strong>${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</strong></p>
      <p style="margin: 5px 0; color: #374151;">Backup file: <strong>${fileName}</strong> (${formatSize(size)})</p>
      ${partCount > 1 ? `<p style="margin: 5px 0; color: #B45309;"><strong>This is part ${partNo} of ${partCount}.</strong></p>` : ''}
    </div>

    ${partCount > 1 ? `
    <div style="background-color: #FFFBEB; padding: 15px; border-radius: 8px; margin: 20px 0; color: #78350F; font-size: 14px;">
      <h3 style="margin-top: 0;">How to open a backup sent in ${partCount} parts</h3>
      <p>Download all ${partCount} part files (${fileName}.001 ... .${String(partCount).padStart(3, '0')}) into one folder, then:</p>
      <ul>
        <li><strong>7-Zip / WinRAR:</strong> open <code>${fileName}.001</code>, it joins the parts by itself</li>
        <li><strong>Windows (cmd):</strong> <code>copy /b ${fileName}.0* ${fileName}</code></li>
        <li><strong>Linux / Mac:</strong> <code>cat ${fileName}.0* &gt; ${fileName}</code></li>
      </ul>
    </div>` : ''}

    <p style="color: #6B7280; font-size: 13px;">The full backup (and a user-wise copy) is also kept on the server for ${BACKUP_KEEP_DAYS} days in <code>${BACKUP_DIR}</code>.</p>
    <p style="color: #6B7280; font-size: 12px; margin-top: 30px;">This is an automated email. Please do not reply to this message.</p>
  </div>
`

const sendWithRetry = async (mailOptions, attempts = 3) => {
  for (let i = 1; ; i++) {
    try {
      return await transporter.sendMail(mailOptions)
    } catch (error) {
      if (i >= attempts || error.responseCode === 552) throw error
      console.warn(`[EMAIL] Send failed (try ${i} of ${attempts}): ${error.message}, retrying...`)
      await new Promise((r) => setTimeout(r, 5000 * i))
    }
  }
}

/**
 * Email the backup ZIP: one mail when it fits, otherwise one mail per part (file.zip.001, .002, ...)
 */
const sendExportEmail = async ({ filepath, size }) => {
  const fileName = path.basename(filepath)
  const ranges = size > EMAIL_PART_BYTES ? splitRanges(size, EMAIL_PART_BYTES) : [null]
  const partCount = ranges.length
  const date = new Date().toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })

  console.log(`[EMAIL] Sending backup ${fileName} (${formatSize(size)}) in ${partCount} email(s)...`)

  for (let i = 0; i < partCount; i++) {
    const range = ranges[i]
    const partNo = i + 1
    const attachment = range
      ? {
          filename: `${fileName}.${String(partNo).padStart(3, '0')}`,
          content: fs.createReadStream(filepath, range),
          contentType: 'application/octet-stream'
        }
      : { filename: fileName, path: filepath }

    const info = await sendWithRetry({
      from: BACKUP_FROM,
      to: BACKUP_TO,
      subject: `RTO Sarthi - Daily Data Backup - ${date}${partCount > 1 ? ` (Part ${partNo} of ${partCount})` : ''}`,
      html: emailHtml({ fileName, size, partNo, partCount }),
      attachments: [attachment]
    })
    console.log(`[EMAIL] Backup email ${partNo}/${partCount} sent:`, info.messageId)
  }

  fs.writeFileSync(LAST_EMAIL_FILE, JSON.stringify({ sentAt: new Date().toISOString(), fileName, size, parts: partCount }))
  return partCount
}

/**
 * Delete backups older than BACKUP_KEEP_DAYS
 */
const cleanupOldBackups = () => {
  const cutoff = Date.now() - BACKUP_KEEP_DAYS * 24 * 60 * 60 * 1000
  for (const file of fs.readdirSync(BACKUP_DIR)) {
    if (!/^rto_all_data_.*\.zip$/.test(file)) continue
    const filepath = path.join(BACKUP_DIR, file)
    try {
      if (fs.statSync(filepath).mtimeMs < cutoff) {
        fs.unlinkSync(filepath)
        console.log(`[CLEANUP] Deleted old backup: ${file}`)
      }
    } catch (error) {
      console.error(`[CLEANUP] Error deleting backup ${file}:`, error.message)
    }
  }
}

let running = false

/**
 * Main export and email function
 */
const exportAndEmailData = async () => {
  if (running) {
    console.log('[CRON] Data export already running, skipped')
    return
  }
  running = true
  console.log('[CRON] Starting data export and email job...')
  const startTime = Date.now()

  try {
    ensureBackupDir()
    const timestamp = fileTimestamp()

    const combined = await createCombinedZip(timestamp)
    try {
      await createUserWiseZip(timestamp)
    } catch (error) {
      // The combined backup is the one that matters, keep going without the user-wise copy
      console.error('[EXPORT] Error creating user-wise ZIP:', error)
    }

    await sendExportEmail(combined)

    console.log(`[CRON] Data export and email completed successfully in ${Date.now() - startTime}ms`)
  } catch (error) {
    console.error('[CRON] Error in export and email job (the backup is still saved in ' + BACKUP_DIR + '):', error)
  } finally {
    try {
      cleanupOldBackups()
    } catch (error) {
      console.error('[CLEANUP] Error cleaning old backups:', error.message)
    }
    running = false
  }
}

/**
 * True when no backup email went out in the last 20 hours (so a restart / deploy does not mail it again)
 */
const backupDue = () => {
  try {
    const { sentAt } = JSON.parse(fs.readFileSync(LAST_EMAIL_FILE, 'utf8'))
    return Date.now() - new Date(sentAt).getTime() > 20 * 60 * 60 * 1000
  } catch {
    return true
  }
}

/**
 * Initialize cron job
 * Runs every day at 2:00 AM, and on server restart when the last backup email is over 20 hours old
 */
const initEmailDataExportCron = () => {
  // Schedule: Every day at 2:00 AM
  // Format: second minute hour day month dayOfWeek
  cron.schedule('0 0 2 * * *', () => {
    console.log('[CRON] Running scheduled data export and email...')
    exportAndEmailData()
  })

  if (backupDue()) {
    console.log('[CRON] Running initial data export and email on server restart...')
    exportAndEmailData()
  } else {
    console.log('[CRON] Backup already emailed in the last 20 hours, skipped on restart')
  }

  console.log('[CRON] Email data export cron job initialized (runs daily at 2:00 AM)')
}

module.exports = {
  initEmailDataExportCron,
  exportAndEmailData,
  splitRanges
}
