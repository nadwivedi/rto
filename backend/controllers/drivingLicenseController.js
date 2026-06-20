const Driving = require('../models/Driving')
const mongoose = require('mongoose')

// Helper function to convert DD-MM-YYYY to Date object
const convertToDate = (dateString) => {
  if (!dateString) return null

  // If already a Date object, return as is
  if (dateString instanceof Date) return dateString

  // Handle DD-MM-YYYY format
  const parts = dateString.split('-')
  if (parts.length === 3) {
    const [day, month, year] = parts
    // Create date object (month is 0-indexed in JavaScript)
    return new Date(year, parseInt(month) - 1, day)
  }

  return null
}

// Create new driving license application
exports.createApplication = async (req, res) => {
  try {
    const {
      name, dateOfBirth, gender, fatherName,
      mobileNumber, date, email, address, licenseClass,
      licenseNumber, licenseIssueDate, licenseExpiryDate,
      learningLicenseApplicationNumber, learningLicenseNumber, learningLicenseIssueDate, learningLicenseExpiryDate,
      totalAmount, paidAmount, balanceAmount, profit, expenseBreakup,
      documents
    } = req.body

    // Validate required personal fields
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Name is required'
      })
    }

    if (!dateOfBirth) {
      return res.status(400).json({
        success: false,
        message: 'Date of birth is required'
      })
    }

    if (!gender) {
      return res.status(400).json({
        success: false,
        message: 'Gender is required'
      })
    }

    if (!fatherName) {
      return res.status(400).json({
        success: false,
        message: 'Father name is required'
      })
    }

    if (!mobileNumber) {
      return res.status(400).json({
        success: false,
        message: 'Mobile number is required'
      })
    }

    if (!address) {
      return res.status(400).json({
        success: false,
        message: 'Address is required'
      })
    }

    if (!licenseClass) {
      return res.status(400).json({
        success: false,
        message: 'License class is required'
      })
    }

    // Validate payment fields are mandatory
    if (totalAmount === undefined || totalAmount === null || paidAmount === undefined || paidAmount === null || balanceAmount === undefined || balanceAmount === null) {
      return res.status(400).json({
        success: false,
        message: 'Total amount, paid amount, and balance amount are required'
      })
    }

    // Validate that paid amount can't be greater than total amount
    if (paidAmount > totalAmount) {
      return res.status(400).json({
        success: false,
        message: 'Paid amount cannot be greater than total amount'
      })
    }

    // Validate that balance amount can't be negative
    if (balanceAmount < 0) {
      return res.status(400).json({
        success: false,
        message: 'Balance amount cannot be negative'
      })
    }

    // Prepare application data
    const applicationData = {
      name,
      dateOfBirth,
      gender,
      fatherName,
      mobileNumber,
      date,
      email,
      address,
      licenseClass,
      totalAmount,
      paidAmount,
      balanceAmount,
      profit,
      expenseBreakup,
      documents
    }

    // Map lowercase field names to uppercase (model field names)
    if (licenseNumber !== undefined) {
      applicationData.LicenseNumber = licenseNumber
    }

    // Convert date strings to Date objects and map to uppercase field names
    if (licenseIssueDate !== undefined) {
      applicationData.LicenseIssueDate = convertToDate(licenseIssueDate)
    }

    if (licenseExpiryDate !== undefined) {
      applicationData.LicenseExpiryDate = convertToDate(licenseExpiryDate)
    }

    // Learning license details
    if (learningLicenseApplicationNumber !== undefined) {
      applicationData.learningLicenseApplicationNumber = learningLicenseApplicationNumber
    }

    if (learningLicenseNumber !== undefined) {
      applicationData.learningLicenseNumber = learningLicenseNumber
    }

    // Convert learning license dates
    if (learningLicenseIssueDate !== undefined) {
      applicationData.learningLicenseIssueDate = convertToDate(learningLicenseIssueDate)
    }

    if (learningLicenseExpiryDate !== undefined) {
      applicationData.learningLicenseExpiryDate = convertToDate(learningLicenseExpiryDate)
    }

    // Create new driving license application
    const newApplication = new Driving({
      ...applicationData,
      userId: req.user.id
    })
    await newApplication.save()

    res.status(201).json({
      success: true,
      message: 'Driving license application created successfully',
      data: newApplication
    })
  } catch (error) {
    console.error('Error creating application:', error)
    res.status(400).json({
      success: false,
      message: 'Failed to create application',
      error: error.message
    })
  }
}

// Get all driving license applications
exports.getAllApplications = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      applicationStatus,
      paymentStatus,
      llEligibleForDL
    } = req.query

    // Build query - filter by logged-in user
    const query = { userId: req.user.id }

    // Search by name, license number, mobile, or email
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { drivingLicenseNumber: { $regex: search, $options: 'i' } },
        { mobileNumber: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ]
    }

    // Filter by license class
    if (req.query.licenseClass) {
      query.licenseClass = req.query.licenseClass
    }

    // Filter by application status
    if (applicationStatus) {
      query.applicationStatus = applicationStatus
    }

    // Filter by payment status
    if (paymentStatus) {
      if (paymentStatus === 'Paid') {
        query.balanceAmount = 0
      } else if (paymentStatus === 'Pending') {
        query.balanceAmount = { $gt: 0 }
      }
    }

    // Filter by LL eligible for DL (completed 30 days and not expired)
    if (llEligibleForDL === 'true') {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000))

      query.learningLicenseIssueDate = {
        $exists: true,
        $ne: null,
        $lte: thirtyDaysAgo
      }
      query.learningLicenseExpiryDate = {
        $exists: true,
        $ne: null,
        $gte: today
      }
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit)

    // Determine sort order
    let sortCriteria = { createdAt: -1 }
    if (llEligibleForDL === 'true') {
      // Sort by most recently eligible (most recent issue date first)
      sortCriteria = { learningLicenseIssueDate: -1 }
    }

    // Execute query with sort
    const applications = await Driving.find(query)
      .sort(sortCriteria)
      .skip(skip)
      .limit(parseInt(limit))

    const total = await Driving.countDocuments(query)

    res.status(200).json({
      success: true,
      data: applications,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    })
  } catch (error) {
    console.error('Error fetching applications:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch applications',
      error: error.message
    })
  }
}

// Export all driving license applications without pagination
exports.exportAllApplications = async (req, res) => {
  try {
    const applications = await Driving.find({ userId: req.user.id })
      .sort({ createdAt: -1 })

    res.status(200).json({
      success: true,
      data: applications,
      total: applications.length
    })
  } catch (error) {
    console.error('Error exporting applications:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to export applications',
      error: error.message
    })
  }
}

// Get single driving license application by ID
exports.getApplicationById = async (req, res) => {
  try {
    const { id } = req.params

    const application = await Driving.findOne({ _id: id, userId: req.user.id })

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      })
    }

    res.status(200).json({
      success: true,
      data: application
    })
  } catch (error) {
    console.error('Error fetching application:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch application',
      error: error.message
    })
  }
}

// Update driving license application
exports.updateApplication = async (req, res) => {
  try {
    const { id } = req.params
    const {
      name, dateOfBirth, gender, fatherName,
      mobileNumber, date, email, address, licenseClass,
      licenseNumber, licenseIssueDate, licenseExpiryDate,
      learningLicenseApplicationNumber, learningLicenseNumber, learningLicenseIssueDate, learningLicenseExpiryDate,
      totalAmount, paidAmount, balanceAmount, profit, expenseBreakup,
      documents
    } = req.body

    const application = await Driving.findOne({ _id: id, userId: req.user.id })

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      })
    }

    // Prepare updated values for validation
    const updatedTotalAmount = totalAmount !== undefined ? totalAmount : application.totalAmount
    const updatedPaidAmount = paidAmount !== undefined ? paidAmount : application.paidAmount
    const updatedBalanceAmount = balanceAmount !== undefined ? balanceAmount : application.balanceAmount

    // Validate that paid amount can't be greater than total amount
    if (updatedPaidAmount > updatedTotalAmount) {
      return res.status(400).json({
        success: false,
        message: 'Paid amount cannot be greater than total amount'
      })
    }

    // Validate that balance amount can't be negative
    if (updatedBalanceAmount < 0) {
      return res.status(400).json({
        success: false,
        message: 'Balance amount cannot be negative'
      })
    }

    // Update fields
    if (name !== undefined) application.name = name
    if (dateOfBirth !== undefined) application.dateOfBirth = dateOfBirth
    if (gender !== undefined) application.gender = gender
    if (fatherName !== undefined) application.fatherName = fatherName
    if (mobileNumber !== undefined) application.mobileNumber = mobileNumber
    if (date !== undefined) application.date = date
    if (email !== undefined) application.email = email
    if (address !== undefined) application.address = address
    if (licenseClass !== undefined) application.licenseClass = licenseClass
    if (totalAmount !== undefined) application.totalAmount = totalAmount
    if (paidAmount !== undefined) application.paidAmount = paidAmount
    if (balanceAmount !== undefined) application.balanceAmount = balanceAmount
    if (profit !== undefined) application.profit = profit
    if (expenseBreakup !== undefined) application.expenseBreakup = expenseBreakup
    if (documents !== undefined) application.documents = documents

    // Map lowercase field names to uppercase (model field names)
    if (licenseNumber !== undefined) {
      application.LicenseNumber = licenseNumber
    }

    // Convert date strings to Date objects and map to uppercase field names
    if (licenseIssueDate !== undefined) {
      application.LicenseIssueDate = convertToDate(licenseIssueDate)
    }

    if (licenseExpiryDate !== undefined) {
      application.LicenseExpiryDate = convertToDate(licenseExpiryDate)
    }

    // Learning license details
    if (learningLicenseApplicationNumber !== undefined) {
      application.learningLicenseApplicationNumber = learningLicenseApplicationNumber
    }

    if (learningLicenseNumber !== undefined) {
      application.learningLicenseNumber = learningLicenseNumber
    }

    // Convert learning license dates
    if (learningLicenseIssueDate !== undefined) {
      application.learningLicenseIssueDate = convertToDate(learningLicenseIssueDate)
    }

    if (learningLicenseExpiryDate !== undefined) {
      application.learningLicenseExpiryDate = convertToDate(learningLicenseExpiryDate)
    }

    await application.save()

    res.status(200).json({
      success: true,
      message: 'Application updated successfully',
      data: application
    })
  } catch (error) {
    console.error('Error updating application:', error)
    res.status(400).json({
      success: false,
      message: 'Failed to update application',
      error: error.message
    })
  }
}

// Delete driving license application
exports.deleteApplication = async (req, res) => {
  try {
    const { id } = req.params

    const deletedApplication = await Driving.findOneAndDelete({ _id: id, userId: req.user.id })

    if (!deletedApplication) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      })
    }

    res.status(200).json({
      success: true,
      message: 'Application deleted successfully',
      data: deletedApplication
    })
  } catch (error) {
    console.error('Error deleting application:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to delete application',
      error: error.message
    })
  }
}

// Add payment to driving license application
exports.addPayment = async (req, res) => {
  try {
    const { id } = req.params
    const { amount, paymentMethod, description, receiptNumber } = req.body

    const application = await Driving.findOne({ _id: id, userId: req.user.id })

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      })
    }

    // Use the addPayment method from the model
    await application.addPayment(amount, paymentMethod, description, receiptNumber)

    res.status(200).json({
      success: true,
      message: 'Payment added successfully',
      data: application
    })
  } catch (error) {
    console.error('Error adding payment:', error)
    res.status(400).json({
      success: false,
      message: 'Failed to add payment',
      error: error.message
    })
  }
}

// Update application status
exports.updateApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params
    const { applicationStatus, notes } = req.body

    const application = await Driving.findOne({ _id: id, userId: req.user.id })

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      })
    }

    application.applicationStatus = applicationStatus
    if (notes) {
      application.notes = notes
    }

    await application.save()

    res.status(200).json({
      success: true,
      message: 'Application status updated successfully',
      data: application
    })
  } catch (error) {
    console.error('Error updating application status:', error)
    res.status(400).json({
      success: false,
      message: 'Failed to update application status',
      error: error.message
    })
  }
}

// Update license status (learning to full)
exports.updateLicenseStatus = async (req, res) => {
  try {
    const { id } = req.params
    const { licenseStatus, drivingLicenseNumber, drivingLicenseIssueDate, drivingLicenseExpiryDate } = req.body

    const application = await Driving.findOne({ _id: id, userId: req.user.id })

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      })
    }

    application.licenseStatus = licenseStatus

    // If upgrading to full license, add driving license details
    if (licenseStatus === 'full') {
      application.drivingLicenseNumber = drivingLicenseNumber
      application.drivingLicenseIssueDate = drivingLicenseIssueDate
      application.drivingLicenseExpiryDate = drivingLicenseExpiryDate
    }

    await application.save()

    res.status(200).json({
      success: true,
      message: 'License status updated successfully',
      data: application
    })
  } catch (error) {
    console.error('Error updating license status:', error)
    res.status(400).json({
      success: false,
      message: 'Failed to update license status',
      error: error.message
    })
  }
}

// Get statistics
exports.getStatistics = async (req, res) => {
  try {
    const today = new Date()
    const thirtyDaysFromNow = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000))

    // Pending payment aggregation
    const pendingPaymentPipeline = [
      { $match: { balanceAmount: { $gt: 0 }, userId: new mongoose.Types.ObjectId(req.user.id) } },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          totalAmount: { $sum: '$balanceAmount' }
        }
      }
    ]

    const pendingPaymentResults = await Driving.aggregate(pendingPaymentPipeline)
    const pendingPaymentCount = pendingPaymentResults.length > 0 ? pendingPaymentResults[0].count : 0
    const pendingPaymentAmount = pendingPaymentResults.length > 0 ? pendingPaymentResults[0].totalAmount : 0

    // Count LL expiring in next 30 days
    const llExpiringCount = await Driving.countDocuments({
      userId: new mongoose.Types.ObjectId(req.user.id),
      learningLicenseExpiryDate: {
        $exists: true,
        $ne: null,
        $gte: today,
        $lte: thirtyDaysFromNow
      }
    })

    // Count LL eligible for DL (completed 30 days and not expired)
    const todayStart = new Date(today)
    todayStart.setHours(0, 0, 0, 0)

    const thirtyDaysAgo = new Date(todayStart.getTime() - (30 * 24 * 60 * 60 * 1000))

    const llEligibleForDLCount = await Driving.countDocuments({
      userId: new mongoose.Types.ObjectId(req.user.id),
      learningLicenseIssueDate: {
        $exists: true,
        $ne: null,
        $lte: thirtyDaysAgo
      },
      learningLicenseExpiryDate: {
        $exists: true,
        $ne: null,
        $gte: todayStart
      }
    })

    res.status(200).json({
      success: true,
      data: {
        pendingPaymentCount,
        pendingPaymentAmount,
        llExpiringCount,
        llEligibleForDLCount
      }
    })
  } catch (error) {
    console.error('Error fetching statistics:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    })
  }
}

// Get license expiry report
exports.getLicenseExpiryReport = async (req, res) => {
  try {
    const today = new Date()
    const thirtyDaysFromNow = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000))
    const sixtyDaysFromNow = new Date(today.getTime() + (60 * 24 * 60 * 60 * 1000))
    const ninetyDaysFromNow = new Date(today.getTime() + (90 * 24 * 60 * 60 * 1000))

    // Get all licenses with expiry dates
    const allLicenses = await Driving.find({
      userId: req.user.id,
      LicenseExpiryDate: { $exists: true, $ne: null }
    }).sort({ LicenseExpiryDate: 1 })

    // Categorize licenses
    const expired = []
    const expiringIn30Days = []
    const expiringIn60Days = []
    const expiringIn90Days = []
    const valid = []

    allLicenses.forEach(license => {
      const expiryDate = new Date(license.LicenseExpiryDate)

      if (expiryDate < today) {
        expired.push(license)
      } else if (expiryDate <= thirtyDaysFromNow) {
        expiringIn30Days.push(license)
      } else if (expiryDate <= sixtyDaysFromNow) {
        expiringIn60Days.push(license)
      } else if (expiryDate <= ninetyDaysFromNow) {
        expiringIn90Days.push(license)
      } else {
        valid.push(license)
      }
    })

    res.status(200).json({
      success: true,
      data: {
        summary: {
          total: allLicenses.length,
          expired: expired.length,
          expiringIn30Days: expiringIn30Days.length,
          expiringIn60Days: expiringIn60Days.length,
          expiringIn90Days: expiringIn90Days.length,
          valid: valid.length
        },
        licenses: {
          expired,
          expiringIn30Days,
          expiringIn60Days,
          expiringIn90Days,
          valid
        }
      }
    })
  } catch (error) {
    console.error('Error fetching license expiry report:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch license expiry report',
      error: error.message
    })
  }
}

// Get learning licenses expiring in next 30 days
exports.getLearningLicensesExpiringSoon = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20
    } = req.query

    const today = new Date()
    const thirtyDaysFromNow = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000))

    // Find all applications with learning license expiry dates within next 30 days
    const query = {
      userId: req.user.id,
      learningLicenseExpiryDate: {
        $exists: true,
        $ne: null,
        $gte: today,
        $lte: thirtyDaysFromNow
      }
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit)

    // Execute query with default sort by expiry date (earliest first)
    const applications = await Driving.find(query)
      .sort({ learningLicenseExpiryDate: 1 })
      .skip(skip)
      .limit(parseInt(limit))

    const total = await Driving.countDocuments(query)

    res.status(200).json({
      success: true,
      data: applications,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    })
  } catch (error) {
    console.error('Error fetching LL expiring soon:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch learning licenses expiring soon',
      error: error.message
    })
  }
}

// Get driving licenses expiring in next 30 days
exports.getDrivingLicensesExpiringSoon = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20
    } = req.query

    const today = new Date()
    const thirtyDaysFromNow = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000))

    // Find all applications with driving license expiry dates within next 30 days
    const query = {
      userId: req.user.id,
      LicenseExpiryDate: {
        $exists: true,
        $ne: null,
        $gte: today,
        $lte: thirtyDaysFromNow
      }
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit)

    // Execute query with default sort by expiry date (earliest first)
    const applications = await Driving.find(query)
      .sort({ LicenseExpiryDate: 1 })
      .skip(skip)
      .limit(parseInt(limit))

    const total = await Driving.countDocuments(query)

    res.status(200).json({
      success: true,
      data: applications,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    })
  } catch (error) {
    console.error('Error fetching DL expiring soon:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch driving licenses expiring soon',
      error: error.message
    })
  }
}

// Mark driving license as paid
exports.markAsPaid = async (req, res) => {
  try {
    const drivingLicense = await Driving.findOne({ _id: req.params.id, userId: req.user.id })

    if (!drivingLicense) {
      return res.status(404).json({
        success: false,
        message: 'Driving license record not found'
      })
    }

    // Check if there's a balance to pay
    if (!drivingLicense.balanceAmount || drivingLicense.balanceAmount === 0) {
      return res.status(400).json({
        success: false,
        message: 'No pending payment for this driving license'
      })
    }

    // Update payment details
    drivingLicense.paidAmount = drivingLicense.totalAmount || 0
    drivingLicense.balanceAmount = 0

    await drivingLicense.save()

    res.status(200).json({
      success: true,
      message: 'Payment marked as paid successfully',
      data: drivingLicense
    })
  } catch (error) {
    console.error('Error marking payment as paid:', error)
    res.status(500).json({
      success: false,
      message: 'Error marking payment as paid',
      error: error.message
    })
  }
}

// Add demo data (15 driving licenses)
exports.addDemoData = async (req, res) => {
  try {
    // Clear existing data (optional - comment out if you want to keep existing data)
    // await Driving.deleteMany({})

    const demoData = [
      {
        name: 'Rajesh Kumar Sharma',
        dateOfBirth: new Date('1995-03-15'),
        gender: 'Male',
        fatherName: 'Vijay Kumar Sharma',
        mobileNumber: '9876543210',
        email: 'rajesh.sharma@gmail.com',
        address: '123, MG Road, Mumbai, Maharashtra - 400001',
        applicationDate: '15-01-2024',
        licenseClass: 'MCWG+LMV',
        applicationStatus: 'approved',
        drivingLicenseNumber: 'MH1220240001234',
        drivingLicenseIssueDate: new Date('2024-01-20'),
        drivingLicenseExpiryDate: new Date('2044-01-19'),
        totalAmount: 1500,
        paidAmount: 1500,
        balanceAmount: 0,
      },
      {
        name: 'Priya Singh',
        dateOfBirth: new Date('1998-07-22'),
        gender: 'Female',
        fatherName: 'Arun Singh',
        mobileNumber: '9876543211',
        email: 'priya.singh@gmail.com',
        address: '456, Park Street, Kolkata, West Bengal - 700016',
        applicationDate: '20-01-2024',
        licenseClass: 'LMV',
        applicationStatus: 'approved',
        drivingLicenseNumber: 'WB0720240002345',
        drivingLicenseIssueDate: new Date('2024-01-25'),
        drivingLicenseExpiryDate: new Date('2044-01-24'),
        totalAmount: 1200,
        paidAmount: 1200,
        balanceAmount: 0,
      },
      {
        name: 'Amit Patel',
        dateOfBirth: new Date('1992-11-10'),
        gender: 'Male',
        fatherName: 'Ramesh Patel',
        mobileNumber: '9876543212',
        email: 'amit.patel@gmail.com',
        address: '789, CG Road, Ahmedabad, Gujarat - 380009',
        applicationDate: '10-02-2024',
        licenseClass: 'MCWG',
        applicationStatus: 'pending',
        drivingLicenseNumber: 'GJ0120240003456',
        drivingLicenseIssueDate: new Date('2024-02-15'),
        drivingLicenseExpiryDate: new Date('2044-02-14'),
        totalAmount: 800,
        paidAmount: 800,
        balanceAmount: 0,
      },
      {
        name: 'Sneha Reddy',
        dateOfBirth: new Date('2000-05-18'),
        gender: 'Female',
        fatherName: 'Venkat Reddy',
        mobileNumber: '9876543213',
        email: 'sneha.reddy@gmail.com',
        address: '321, Banjara Hills, Hyderabad, Telangana - 500034',
        applicationDate: '05-03-2024',
        licenseClass: 'LMV',
        applicationStatus: 'under_review',
        drivingLicenseNumber: 'TS0920240004567',
        drivingLicenseIssueDate: new Date('2024-03-10'),
        drivingLicenseExpiryDate: new Date('2044-03-09'),
        totalAmount: 1200,
        paidAmount: 800,
        balanceAmount: 400,
      },
      {
        name: 'Vikas Verma',
        dateOfBirth: new Date('1990-09-25'),
        gender: 'Male',
        fatherName: 'Suresh Verma',
        mobileNumber: '9876543214',
        email: 'vikas.verma@gmail.com',
        address: '654, Connaught Place, New Delhi - 110001',
        applicationDate: '12-03-2024',
        licenseClass: 'MCWG+LMV',
        applicationStatus: 'approved',
        drivingLicenseNumber: 'DL0120240005678',
        drivingLicenseIssueDate: new Date('2024-03-18'),
        drivingLicenseExpiryDate: new Date('2044-03-17'),
        totalAmount: 1500,
        paidAmount: 1500,
        balanceAmount: 0,
      },
      {
        name: 'Anjali Desai',
        dateOfBirth: new Date('1997-12-30'),
        gender: 'Female',
        fatherName: 'Kiran Desai',
        mobileNumber: '9876543215',
        email: 'anjali.desai@gmail.com',
        address: '987, FC Road, Pune, Maharashtra - 411005',
        applicationDate: '20-03-2024',
        licenseClass: 'MCWG',
        applicationStatus: 'pending',
        drivingLicenseNumber: 'MH1420240006789',
        drivingLicenseIssueDate: new Date('2024-03-25'),
        drivingLicenseExpiryDate: new Date('2044-03-24'),
        totalAmount: 800,
        paidAmount: 800,
        balanceAmount: 0,
      },
      {
        name: 'Rohit Mehta',
        dateOfBirth: new Date('1993-06-08'),
        gender: 'Male',
        fatherName: 'Prakash Mehta',
        mobileNumber: '9876543216',
        email: 'rohit.mehta@gmail.com',
        address: '135, Brigade Road, Bangalore, Karnataka - 560001',
        applicationDate: '01-04-2024',
        licenseClass: 'LMV',
        applicationStatus: 'approved',
        drivingLicenseNumber: 'KA0320240007890',
        drivingLicenseIssueDate: new Date('2024-04-05'),
        drivingLicenseExpiryDate: new Date('2044-04-04'),
        totalAmount: 1200,
        paidAmount: 1200,
        balanceAmount: 0,
      },
      {
        name: 'Neha Gupta',
        dateOfBirth: new Date('1999-02-14'),
        gender: 'Female',
        fatherName: 'Rajiv Gupta',
        mobileNumber: '9876543217',
        email: 'neha.gupta@gmail.com',
        address: '246, Mall Road, Lucknow, Uttar Pradesh - 226001',
        applicationDate: '15-04-2024',
        licenseClass: 'MCWG+LMV',
        applicationStatus: 'rejected',
        drivingLicenseNumber: 'UP1420240008901',
        drivingLicenseIssueDate: new Date('2024-04-20'),
        drivingLicenseExpiryDate: new Date('2044-04-19'),
        totalAmount: 1500,
        paidAmount: 1000,
        balanceAmount: 500,
      },
      {
        name: 'Sanjay Yadav',
        dateOfBirth: new Date('1991-08-19'),
        gender: 'Male',
        fatherName: 'Ram Yadav',
        mobileNumber: '9876543218',
        email: 'sanjay.yadav@gmail.com',
        address: '369, Station Road, Jaipur, Rajasthan - 302001',
        applicationDate: '05-05-2024',
        licenseClass: 'MCWG',
        applicationStatus: 'pending',
        drivingLicenseNumber: 'RJ1420240009012',
        drivingLicenseIssueDate: new Date('2024-05-10'),
        drivingLicenseExpiryDate: new Date('2044-05-09'),
        totalAmount: 800,
        paidAmount: 800,
        balanceAmount: 0,
      },
      {
        name: 'Divya Nair',
        dateOfBirth: new Date('1996-04-27'),
        gender: 'Female',
        fatherName: 'Sunil Nair',
        mobileNumber: '9876543219',
        email: 'divya.nair@gmail.com',
        address: '741, MG Road, Kochi, Kerala - 682011',
        applicationDate: '20-05-2024',
        licenseClass: 'LMV',
        applicationStatus: 'approved',
        drivingLicenseNumber: 'KL0720240010123',
        drivingLicenseIssueDate: new Date('2024-05-25'),
        drivingLicenseExpiryDate: new Date('2044-05-24'),
        totalAmount: 1200,
        paidAmount: 1200,
        balanceAmount: 0,
      },
      {
        name: 'Arjun Iyer',
        dateOfBirth: new Date('1994-10-12'),
        gender: 'Male',
        fatherName: 'Krishnan Iyer',
        mobileNumber: '9876543220',
        email: 'arjun.iyer@gmail.com',
        address: '852, Anna Salai, Chennai, Tamil Nadu - 600002',
        applicationDate: '01-06-2024',
        licenseClass: 'MCWG+LMV',
        applicationStatus: 'under_review',
        drivingLicenseNumber: 'TN0120240011234',
        drivingLicenseIssueDate: new Date('2024-06-05'),
        drivingLicenseExpiryDate: new Date('2044-06-04'),
        totalAmount: 1500,
        paidAmount: 1500,
        balanceAmount: 0,
      },
      {
        name: 'Pooja Joshi',
        dateOfBirth: new Date('2001-01-05'),
        gender: 'Female',
        fatherName: 'Mukesh Joshi',
        mobileNumber: '9876543221',
        email: 'pooja.joshi@gmail.com',
        address: '963, Civil Lines, Nagpur, Maharashtra - 440001',
        applicationDate: '15-06-2024',
        licenseClass: 'MCWG',
        applicationStatus: 'pending',
        drivingLicenseNumber: 'MH3120240012345',
        drivingLicenseIssueDate: new Date('2024-06-20'),
        drivingLicenseExpiryDate: new Date('2044-06-19'),
        totalAmount: 800,
        paidAmount: 600,
        balanceAmount: 200,
      },
      {
        name: 'Karan Kapoor',
        dateOfBirth: new Date('1989-03-21'),
        gender: 'Male',
        fatherName: 'Ravi Kapoor',
        mobileNumber: '9876543222',
        email: 'karan.kapoor@gmail.com',
        address: '159, Mall Road, Chandigarh - 160001',
        applicationDate: '01-07-2024',
        licenseClass: 'LMV',
        applicationStatus: 'approved',
        drivingLicenseNumber: 'CH0120240013456',
        drivingLicenseIssueDate: new Date('2024-07-05'),
        drivingLicenseExpiryDate: new Date('2044-07-04'),
        totalAmount: 1200,
        paidAmount: 1200,
        balanceAmount: 0,
      },
      {
        name: 'Ritu Malhotra',
        dateOfBirth: new Date('1998-09-16'),
        gender: 'Female',
        fatherName: 'Sandeep Malhotra',
        mobileNumber: '9876543223',
        email: 'ritu.malhotra@gmail.com',
        address: '357, Sadar Bazaar, Indore, Madhya Pradesh - 452001',
        applicationDate: '20-07-2024',
        licenseClass: 'MCWG+LMV',
        applicationStatus: 'approved',
        drivingLicenseNumber: 'MP0920240014567',
        drivingLicenseIssueDate: new Date('2024-07-25'),
        drivingLicenseExpiryDate: new Date('2044-07-24'),
        totalAmount: 1500,
        paidAmount: 1500,
        balanceAmount: 0,
      },
      {
        name: 'Aditya Saxena',
        dateOfBirth: new Date('1995-11-28'),
        gender: 'Male',
        fatherName: 'Deepak Saxena',
        mobileNumber: '9876543224',
        email: 'aditya.saxena@gmail.com',
        address: '753, Hazratganj, Lucknow, Uttar Pradesh - 226001',
        applicationDate: '10-08-2024',
        licenseClass: 'MCWG',
        applicationStatus: 'under_review',
        drivingLicenseNumber: 'UP1420240015678',
        drivingLicenseIssueDate: new Date('2024-08-15'),
        drivingLicenseExpiryDate: new Date('2044-08-14'),
        totalAmount: 800,
        paidAmount: 800,
        balanceAmount: 0,
      }
    ]

    // Insert all demo data
    const insertedData = await Driving.insertMany(demoData)

    res.status(201).json({
      success: true,
      message: `Successfully added ${insertedData.length} demo driving licenses`,
      data: insertedData,
      count: insertedData.length
    })
  } catch (error) {
    console.error('Error adding demo data:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to add demo data',
      error: error.message
    })
  }
}
