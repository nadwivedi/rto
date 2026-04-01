require('dotenv').config()
const express = require('express')
const cors = require('cors')
const path = require('path')
const cookieParser = require('cookie-parser')
const connectDB = require('./utils/mongodb')

const app = express()
const PORT = process.env.PORT

// CORS configuration
const allowedOrigins = [
  'https://adm.rtosarthi.com',
  'https://rtosarthi.com',
  'https://www.rtosarthi.com',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175'
]

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true)

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization']
}))

// Middleware (12MB limit for image uploads)
app.use(express.json({ limit: '12mb' }))
app.use(express.urlencoded({ extended: true, limit: '12mb' }))
app.use(cookieParser())

// Serve static files (PDFs) from uploads folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.pdf')) {
      // Allow inline viewing but also enable download
      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition')
    }
  }
}))

// MongoDB Connection
connectDB()

// Initialize Cron Jobs
const { initTemporaryPermitStatusCron } = require('./jobs/updateTemporaryPermitStatus')
const { initCgPermitStatusCron } = require('./jobs/updateCgPermitStatus')
const { initNationalPermitStatusCron } = require('./jobs/updateNationalPermitStatus')
const { initFitnessStatusCron } = require('./jobs/updateFitnessStatus')
const { initTaxStatusCron } = require('./jobs/updateTaxStatus')
const { initInsuranceStatusCron } = require('./jobs/updateInsuranceStatus')
const { initTemporaryPermitOtherStateStatusCron } = require('./jobs/updateTemporaryPermitOtherStateStatus')
const { initPucStatusCron } = require('./jobs/updatePucStatus')
const { initEmailDataExportCron } = require('./jobs/emailDataExport')

initTemporaryPermitStatusCron()
initCgPermitStatusCron()
initNationalPermitStatusCron()
initFitnessStatusCron()
initTaxStatusCron()
initInsuranceStatusCron()
initTemporaryPermitOtherStateStatusCron()
initPucStatusCron()
initEmailDataExportCron()

// Import Middleware
const userAuth = require('./middleware/userAuth')

// Import Routes
const authRoutes = require('./routes/auth')
const adminAuthRoutes = require('./routes/adminAuth')
const adminUsersRoutes = require('./routes/adminUsers')
const adminVehicleRegistrationsRoutes = require('./routes/adminVehicleRegistrations')
const exportRoutes = require('./routes/export')
const drivingLicenseRoutes = require('./routes/drivingLicense')
const nationalPermitRoutes = require('./routes/nationalPermit')
const cgPermitRoutes = require('./routes/cgPermit')
const busPermitRoutes = require('./routes/busPermit')
const temporaryPermitRoutes = require('./routes/temporaryPermit')
const temporaryPermitOtherStateRoutes = require('./routes/temporaryPermitOtherState')
const vehicleRegistrationRoutes = require('./routes/vehicleRegistration')
const fitnessRoutes = require('./routes/fitness')
const customBillRoutes = require('./routes/customBill')
const taxRoutes = require('./routes/tax')
const insuranceRoutes = require('./routes/insurance')
const vehicleTransferRoutes = require('./routes/vehicleTransfer')
const registrationRenewalRoutes = require('./routes/registrationRenewal')
const pucRoutes = require('./routes/puc')
const gpsRoutes = require('./routes/gpsRoutes')
const uploadRoutes = require('./routes/upload')
const dashboardRoutes = require('./routes/dashboard')
const partyRoutes = require('./routes/party')
const nocRoutes = require('./routes/noc')
const ocrRoutes = require('./routes/ocrRoutes')

// Use Routes

// Admin routes
app.use('/api/admin/auth', adminAuthRoutes)
app.use('/api/admin/users', adminUsersRoutes)
app.use('/api/admin/vehicle-registrations', adminVehicleRegistrationsRoutes)
app.use('/api/admin/export', exportRoutes)

// User routes
app.use('/api/auth', authRoutes)
app.use('/api/dashboard', userAuth, dashboardRoutes)
// Protect all routes below with userAuth middleware
app.use('/api/upload', userAuth, uploadRoutes)
app.use('/api/driving-licenses', userAuth, drivingLicenseRoutes)
app.use('/api/national-permits', userAuth, nationalPermitRoutes)
app.use('/api/cg-permits', userAuth, cgPermitRoutes)
app.use('/api/bus-permits', userAuth, busPermitRoutes)
app.use('/api/temporary-permits', userAuth, temporaryPermitRoutes)
app.use('/api/temporary-permits-other-state', userAuth, temporaryPermitOtherStateRoutes)
app.use('/api/vehicle-registrations', userAuth, vehicleRegistrationRoutes)
app.use('/api/fitness', userAuth, fitnessRoutes)
app.use('/api/custom-bills', userAuth, customBillRoutes)
app.use('/api/tax', userAuth, taxRoutes)
app.use('/api/insurance', userAuth, insuranceRoutes)
app.use('/api/vehicle-transfers', userAuth, vehicleTransferRoutes)
app.use('/api/registration-renewals', userAuth, registrationRenewalRoutes)
app.use('/api/puc', userAuth, pucRoutes)
app.use('/api/gps', userAuth, gpsRoutes)
app.use('/api/parties', userAuth, partyRoutes)
app.use('/api/noc', userAuth, nocRoutes)
app.use('/api/ocr', userAuth, ocrRoutes)

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'RTO Management System API',
    version: '1.0.0',
  })
})

// Simple error handling middleware - fallback only
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.stack)

  // Simplified timestamp
  const now = new Date()
  const date = String(now.getDate()).padStart(2, '0')
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const year = now.getFullYear()
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const seconds = String(now.getSeconds()).padStart(2, '0')
  const timestamp = `${date}-${month}-${year} ${hours}:${minutes}:${seconds}`

  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    errors: [err.message || 'Internal server error'],
    errorCount: 1,
    timestamp
  })
})

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})

