const mongoose = require('mongoose')
const User = require('../models/User')
const ApiUsage = require('../models/ApiUsage')
const VehicleSearchHistory = require('../models/VehicleSearchHistory')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const { logError, getUserFriendlyError, getSimplifiedTimestamp } = require('../utils/errorLogger')
const { recordActivity, snapshot, diffSnapshots } = require('../utils/activityLog')
const { backupAndCleanUserData } = require('../utils/userDataClean')
const { PROVIDERS } = require('../utils/vehicleInfoProvider')

// '' / null clears a money field, a number >= 0 sets it, anything else is ignored (returns false)
const parseMoney = (value) => {
  if (value === '' || value === null) return undefined
  const n = Number(value)
  return Number.isNaN(n) || n < 0 ? false : Math.round(n * 100) / 100
}

// Payment screenshots attached to a user's fee payment
const paymentScreenshotsDir = path.join(__dirname, '..', 'uploads', 'payment-screenshots')
const PAYMENT_SCREENSHOT_PREFIX = '/uploads/payment-screenshots/'

// Keep only paths that point into the payment screenshots folder (no other files can be linked)
const cleanScreenshotPaths = (list) => {
  if (!Array.isArray(list)) return []
  return [...new Set(list.filter((p) =>
    typeof p === 'string' && p.startsWith(PAYMENT_SCREENSHOT_PREFIX) && path.basename(p) === p.slice(PAYMENT_SCREENSHOT_PREFIX.length)
  ))]
}

const deleteScreenshotFiles = (list) => {
  for (const p of list || []) {
    try {
      const filePath = path.join(paymentScreenshotsDir, path.basename(p))
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
    } catch (err) {
      console.error('Error deleting payment screenshot:', err)
    }
  }
}

// Check the "referred by" user: empty clears it, otherwise it must be another existing user.
// Returns { id } (id undefined = none) or { error }.
const resolveReferrer = async (referredBy, selfId) => {
  if (!referredBy) return { id: undefined }
  if (!mongoose.isValidObjectId(referredBy)) return { error: 'Referred by user not found' }
  if (selfId && String(referredBy) === String(selfId)) return { error: 'A user cannot refer themselves' }
  const exists = await User.exists({ _id: referredBy })
  return exists ? { id: referredBy } : { error: 'Referred by user not found' }
}

// The fee a user owes is their plan fee: the lifetime fee, or the yearly price
const planFee = (user) => (user.planType === 'lifetime' ? user.lifetimeFee : user.yearlyPrice) || 0

// No paidAmount means the full fee was paid (credit is rare, so that's the default)
const feePaid = (user) => user.paidAmount ?? planFee(user)

const feeFields = (user) => ({
  paidAmount: user.paidAmount,
  pendingAmount: Math.max(0, planFee(user) - feePaid(user))
})

// User fields tracked in the activity log, with the label shown there
const USER_FIELDS = [
  { key: 'name', label: 'Name' },
  { key: 'mobile1', label: 'Mobile 1' },
  { key: 'mobile2', label: 'Mobile 2' },
  { key: 'email', label: 'Email' },
  { key: 'address', label: 'Address' },
  { key: 'state', label: 'State' },
  { key: 'rto', label: 'RTO' },
  { key: 'billName', label: 'Bill Name' },
  { key: 'billDescription', label: 'Bill Description' },
  { key: 'planType', label: 'Plan' },
  { key: 'subscriptionExpiresAt', label: 'Subscription Expiry' },
  { key: 'monthlyPrice', label: 'Monthly Price' },
  { key: 'yearlyPrice', label: 'Yearly Price' },
  { key: 'lifetimeFee', label: 'Lifetime Fee' },
  { key: 'paidAmount', label: 'Fee Paid' },
  { key: 'referredBy', label: 'Referred By' },
  { key: 'referralCommission', label: 'Referral Commission' },
  { key: 'rcProvider', label: 'RC Details API' },
  { key: 'features.greenTax', label: 'Feature: Green Tax' },
  { key: 'features.professionalTax', label: 'Feature: Professional Tax' },
  { key: 'features.autoCreateRC', label: 'Feature: Auto Create RC' },
  { key: 'features.expandAdditionalDetails', label: 'Feature: Expand Additional Details' },
  { key: 'features.moneyReceived', label: 'Feature: Money Received' },
  { key: 'features.rcDetails', label: 'Feature: RC Details' },
  { key: 'features.forms', label: 'Feature: Forms' },
  { key: 'features.form23', label: 'Feature: Form 23 in RC Details' },
  { key: 'features.tempRc', label: 'Feature: Temporary RC in RC Details' },
  { key: 'features.nlParticular', label: 'Feature: NL Particulars in RC Details' },
  { key: 'features.saveVehicleRecords', label: 'Feature: Save Records in RC Details' }
]

// Point every user's RC searches at one API, e.g. all to API 1 while API 2 is down
exports.setAllRcProvider = async (req, res) => {
  try {
    const { provider } = req.body || {}
    if (!PROVIDERS[provider]) {
      return res.status(400).json({ success: false, message: 'Please choose API 1 or API 2' })
    }

    // Users saved before the rcProvider field existed use API 2
    const filter = provider === 'api2' ? { rcProvider: 'api1' } : { rcProvider: { $ne: 'api1' } }
    const result = await User.updateMany(filter, { $set: { rcProvider: provider } })
    const changed = result.modifiedCount || 0

    if (changed) {
      recordActivity(req, {
        action: 'update',
        entity: 'user',
        entityName: 'All users',
        summary: `Switched RC Details of ${changed} user${changed === 1 ? '' : 's'} to ${PROVIDERS[provider]}`,
        changes: [{ field: 'RC Details API', from: null, to: PROVIDERS[provider] }]
      })
    }

    res.json({
      success: true,
      message: changed
        ? `${changed} user${changed === 1 ? '' : 's'} switched to ${PROVIDERS[provider]}`
        : `All users already use ${PROVIDERS[provider]}`,
      changed
    })
  } catch (error) {
    logError(error, req)
    const userError = getUserFriendlyError(error)
    res.status(500).json({
      success: false,
      message: userError.message,
      errors: userError.details,
      errorCount: userError.errorCount,
      timestamp: getSimplifiedTimestamp()
    })
  }
}

// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, isActive, state } = req.query

    // Build query
    const query = {}

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ]
    }

    if (isActive !== undefined) {
      query.isActive = isActive === 'true'
    }

    if (state) {
      query.state = state
    }

    // Calculate pagination
    const pageNum = parseInt(page, 10)
    const limitNum = parseInt(limit, 10)
    const skip = (pageNum - 1) * limitNum

    // Get total count
    const totalRecords = await User.countDocuments(query)
    const totalPages = Math.ceil(totalRecords / limitNum)

    // Get users
    const users = await User.find(query)
      .select('-password')
      .populate('referredBy', 'name mobile1')
      .sort({ isActive: -1, createdAt: -1 })
      .skip(skip)
      .limit(limitNum)

    res.json({
      success: true,
      count: users.length,
      data: users,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalRecords,
        limit: limitNum
      }
    })
  } catch (error) {
    logError(error, req)
    const userError = getUserFriendlyError(error)
    res.status(500).json({
      success: false,
      message: userError.message,
      errors: userError.details,
      errorCount: userError.errorCount,
      timestamp: getSimplifiedTimestamp()
    })
  }
}

// Get single user by ID
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password')

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    res.json({
      success: true,
      data: user
    })
  } catch (error) {
    logError(error, req)
    const userError = getUserFriendlyError(error)
    res.status(500).json({
      success: false,
      message: userError.message,
      errors: userError.details,
      errorCount: userError.errorCount,
      timestamp: getSimplifiedTimestamp()
    })
  }
}

// Upload a payment screenshot (base64 image or PDF). Returns the path to save on the user.
exports.uploadPaymentScreenshot = async (req, res) => {
  try {
    const { imageData } = req.body || {}
    const match = typeof imageData === 'string' && imageData.match(/^data:(image\/(jpeg|jpg|png|webp)|application\/pdf);base64,/)
    if (!match) {
      return res.status(400).json({
        success: false,
        message: 'Only JPG, PNG, WebP and PDF files are accepted'
      })
    }

    const extension = match[2] ? (match[2] === 'jpeg' ? 'jpg' : match[2]) : 'pdf'
    const buffer = Buffer.from(imageData.slice(match[0].length), 'base64')
    if (buffer.length > 8 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        message: 'File must be smaller than 8MB'
      })
    }

    fs.mkdirSync(paymentScreenshotsDir, { recursive: true })
    // Random name so the file URL cannot be guessed
    const filename = `payment-${Date.now()}-${crypto.randomBytes(8).toString('hex')}.${extension}`
    fs.writeFileSync(path.join(paymentScreenshotsDir, filename), buffer)

    res.json({
      success: true,
      data: { path: PAYMENT_SCREENSHOT_PREFIX + filename }
    })
  } catch (error) {
    logError(error, req)
    const userError = getUserFriendlyError(error)
    res.status(500).json({
      success: false,
      message: userError.message,
      timestamp: getSimplifiedTimestamp()
    })
  }
}

// Create new user
exports.createUser = async (req, res) => {
  try {
    const { name, mobile1, mobile2, email, address, state, rto, billName, billDescription, password, features, yearlyPrice, lifetimeFee, paidAmount, paymentScreenshots, referredBy, referralCommission, planType, rcProvider } = req.body

    // Validate required fields
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Name is required',
        errors: ['Name is required'],
        errorCount: 1,
        timestamp: getSimplifiedTimestamp()
      })
    }

    if (!mobile1 || !mobile1.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Mobile 1 is required',
        errors: ['Mobile 1 is required'],
        errorCount: 1,
        timestamp: getSimplifiedTimestamp()
      })
    }

    // Validate mobile1 format (10 digits)
    if (!/^[0-9]{10}$/.test(mobile1.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Mobile 1 must be 10 digits',
        errors: ['Mobile 1 must be 10 digits'],
        errorCount: 1,
        timestamp: getSimplifiedTimestamp()
      })
    }

    // Validate mobile2 format if provided (10 digits)
    if (mobile2 && mobile2.trim() && !/^[0-9]{10}$/.test(mobile2.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Mobile 2 must be 10 digits',
        errors: ['Mobile 2 must be 10 digits'],
        errorCount: 1,
        timestamp: getSimplifiedTimestamp()
      })
    }

    if (!state || !state.trim()) {
      return res.status(400).json({
        success: false,
        message: 'State is required',
        errors: ['State is required'],
        errorCount: 1,
        timestamp: getSimplifiedTimestamp()
      })
    }

    if (!rto || !rto.trim()) {
      return res.status(400).json({
        success: false,
        message: 'RTO is required',
        errors: ['RTO is required'],
        errorCount: 1,
        timestamp: getSimplifiedTimestamp()
      })
    }

    if (!password || password.length < 4) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 4 characters',
        errors: ['Password must be at least 4 characters'],
        errorCount: 1,
        timestamp: getSimplifiedTimestamp()
      })
    }

    // Validate email format if provided
    if (email && email.trim()) {
      if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email.trim())) {
        return res.status(400).json({
          success: false,
          message: 'Please enter a valid email',
          errors: ['Please enter a valid email'],
          errorCount: 1,
          timestamp: getSimplifiedTimestamp()
        })
      }
    }

    // Check if mobile1 already exists
    const existingUserByMobile = await User.findOne({ mobile1: mobile1.trim() })
    if (existingUserByMobile) {
      return res.status(400).json({
        success: false,
        message: 'Mobile 1 already exists',
        errors: ['Mobile 1 already exists'],
        errorCount: 1,
        timestamp: getSimplifiedTimestamp()
      })
    }

    // Check if email already exists (if provided)
    if (email && email.trim()) {
      const existingUserByEmail = await User.findOne({ email: email.trim().toLowerCase() })
      if (existingUserByEmail) {
        return res.status(400).json({
          success: false,
          message: 'Email already exists',
          errors: ['Email already exists'],
          errorCount: 1,
          timestamp: getSimplifiedTimestamp()
        })
      }
    }

    const paid = paidAmount === undefined ? undefined : parseMoney(paidAmount)
    if (paid === false) {
      return res.status(400).json({
        success: false,
        message: 'Paid amount must be 0 or more',
        errors: ['Paid amount must be 0 or more'],
        errorCount: 1,
        timestamp: getSimplifiedTimestamp()
      })
    }

    const referrer = await resolveReferrer(referredBy)
    if (referrer.error) {
      return res.status(400).json({ success: false, message: referrer.error })
    }
    const commission = referralCommission === undefined ? undefined : parseMoney(referralCommission)
    if (commission === false) {
      return res.status(400).json({ success: false, message: 'Referral commission must be 0 or more' })
    }

    // Hash password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    const isLifetimePlan = planType === 'lifetime'

    // Create new user
    const newUser = new User({
      name: name.trim(),
      mobile1: mobile1.trim(),
      mobile2: mobile2 && mobile2.trim() ? mobile2.trim() : undefined,
      email: email && email.trim() ? email.trim().toLowerCase() : undefined,
      address: address && address.trim() ? address.trim() : undefined,
      state: state.trim(),
      rto: rto.trim(),
      billName: billName && billName.trim() ? billName.trim() : undefined,
      billDescription: billDescription && billDescription.trim() ? billDescription.trim() : undefined,
      password: hashedPassword,
      isActive: true,
      planType: isLifetimePlan ? 'lifetime' : 'yearly',
      // A lifetime plan has no recurring price, and a yearly plan has no lifetime fee.
      // Plans are only sold yearly, so no monthly price is stored.
      yearlyPrice: !isLifetimePlan && yearlyPrice !== undefined && !Number.isNaN(Number(yearlyPrice)) ? Number(yearlyPrice) : undefined,
      lifetimeFee: isLifetimePlan && lifetimeFee !== undefined && !Number.isNaN(Number(lifetimeFee)) ? Number(lifetimeFee) : undefined,
      paidAmount: paid,
      paymentScreenshots: cleanScreenshotPaths(paymentScreenshots),
      referredBy: referrer.id,
      referralCommission: referrer.id ? commission : undefined,
      features: features ? {
        greenTax: features.greenTax === true,
        professionalTax: features.professionalTax === true,
        autoCreateRC: features.autoCreateRC === true,
        expandAdditionalDetails: features.expandAdditionalDetails === true,
        moneyReceived: features.moneyReceived === true,
        rcDetails: features.rcDetails === true,
        forms: features.forms === true,
        form23: features.form23 === true,
        tempRc: features.tempRc === true,
        nlParticular: features.nlParticular === true,
        saveVehicleRecords: features.saveVehicleRecords === true
      } : { greenTax: false, professionalTax: false, autoCreateRC: false, expandAdditionalDetails: false, moneyReceived: false, rcDetails: false, forms: false, form23: false, tempRc: false, nlParticular: false, saveVehicleRecords: false },
      rcProvider: PROVIDERS[rcProvider] ? rcProvider : undefined,
      // Starts at 0; the limit only grows when a sale is recorded in Vehicle API Sales
      rcSearchLimit: 0,
      rcSearchCount: 0
    })

    await newUser.save()

    recordActivity(req, {
      action: 'create',
      entity: 'user',
      entityId: newUser._id,
      entityName: newUser.name,
      summary: `Created user ${newUser.name} (${newUser.mobile1})`,
      changes: diffSnapshots({}, snapshot(newUser, USER_FIELDS), USER_FIELDS)
    })

    // Return user without password
    const userResponse = {
      id: newUser._id,
      name: newUser.name,
      mobile1: newUser.mobile1,
      mobile2: newUser.mobile2,
      email: newUser.email,
      address: newUser.address,
      state: newUser.state,
      rto: newUser.rto,
      billName: newUser.billName,
      billDescription: newUser.billDescription,
      isActive: newUser.isActive,
      planType: newUser.planType,
      monthlyPrice: newUser.monthlyPrice,
      yearlyPrice: newUser.yearlyPrice,
      lifetimeFee: newUser.lifetimeFee,
      paymentScreenshots: newUser.paymentScreenshots || [],
      referredBy: newUser.referredBy,
      referralCommission: newUser.referralCommission,
      ...feeFields(newUser),
      createdAt: newUser.createdAt
    }

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: userResponse
    })
  } catch (error) {
    logError(error, req)
    const userError = getUserFriendlyError(error)
    res.status(400).json({
      success: false,
      message: userError.message,
      errors: userError.details,
      errorCount: userError.errorCount,
      timestamp: getSimplifiedTimestamp()
    })
  }
}

// Update user
exports.updateUser = async (req, res) => {
  try {
    // rcSearchLimit is deliberately not accepted here: it changes only through Vehicle API Sales
    const { name, mobile1, mobile2, email, address, state, rto, billName, billDescription, isActive, password, planType, subscriptionExpiresAt, yearlyPrice, lifetimeFee, paidAmount, paymentScreenshots, referredBy, referralCommission, features, rcProvider } = req.body

    const user = await User.findById(req.params.id)

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    const before = snapshot(user, USER_FIELDS)
    const wasActive = user.isActive
    let passwordChanged = false

    // Update fields if provided
    if (name !== undefined) user.name = name.trim()
    if (mobile1 !== undefined) {
      // Validate mobile1 format
      if (!/^[0-9]{10}$/.test(mobile1.trim())) {
        return res.status(400).json({
          success: false,
          message: 'Mobile 1 must be 10 digits'
        })
      }
      user.mobile1 = mobile1.trim()
    }
    if (mobile2 !== undefined) {
      if (mobile2.trim()) {
        // Validate mobile2 format
        if (!/^[0-9]{10}$/.test(mobile2.trim())) {
          return res.status(400).json({
            success: false,
            message: 'Mobile 2 must be 10 digits'
          })
        }
        user.mobile2 = mobile2.trim()
      } else {
        user.mobile2 = undefined
      }
    }
    if (email !== undefined) {
      if (email.trim()) {
        // Validate email format
        if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email.trim())) {
          return res.status(400).json({
            success: false,
            message: 'Please enter a valid email'
          })
        }
        user.email = email.trim().toLowerCase()
      } else {
        user.email = undefined
      }
    }
    if (address !== undefined) {
      user.address = address.trim() ? address.trim() : undefined
    }
    if (state !== undefined) {
      if (!state || !state.trim()) {
        return res.status(400).json({
          success: false,
          message: 'State is required'
        })
      }
      user.state = state.trim()
    }
    if (rto !== undefined) {
      if (!rto || !rto.trim()) {
        return res.status(400).json({
          success: false,
          message: 'RTO is required'
        })
      }
      user.rto = rto.trim()
    }
    if (billName !== undefined) {
      user.billName = billName.trim() ? billName.trim() : undefined
    }
    if (billDescription !== undefined) {
      user.billDescription = billDescription.trim() ? billDescription.trim() : undefined
    }
    if (isActive !== undefined) user.isActive = isActive
    if (features !== undefined) {
      user.features = {
        greenTax: features.greenTax === true,
        professionalTax: features.professionalTax === true,
        autoCreateRC: features.autoCreateRC === true,
        expandAdditionalDetails: features.expandAdditionalDetails === true,
        moneyReceived: features.moneyReceived === true,
        rcDetails: features.rcDetails === true,
        forms: features.forms === true,
        form23: features.form23 === true,
        tempRc: features.tempRc === true,
        nlParticular: features.nlParticular === true,
        saveVehicleRecords: features.saveVehicleRecords === true
      }
    }
    if (rcProvider !== undefined) {
      if (!PROVIDERS[rcProvider]) {
        return res.status(400).json({
          success: false,
          message: 'Please choose API 1 or API 2'
        })
      }
      user.rcProvider = rcProvider
    }
    if (planType !== undefined) {
      user.planType = planType === 'lifetime' ? 'lifetime' : 'yearly'
    }
    if (user.planType === 'lifetime') {
      // Lifetime plans never expire
      user.subscriptionExpiresAt = undefined
    } else if (subscriptionExpiresAt !== undefined) {
      const d = new Date(subscriptionExpiresAt)
      if (!Number.isNaN(d.getTime())) {
        user.subscriptionExpiresAt = d
      }
    }
    if (user.planType === 'lifetime') {
      // One-time fee only - drop any recurring price left over from a yearly plan
      if (lifetimeFee !== undefined) {
        const fee = Number(lifetimeFee)
        if (!Number.isNaN(fee) && fee >= 0) {
          user.lifetimeFee = fee
        }
      }
      user.monthlyPrice = undefined
      user.yearlyPrice = undefined
    } else {
      // Only sold yearly - drop any monthly price saved by older versions
      user.monthlyPrice = undefined
      if (yearlyPrice !== undefined) {
        const price = Number(yearlyPrice)
        if (!Number.isNaN(price) && price >= 0) {
          user.yearlyPrice = price
        }
      }
      user.lifetimeFee = undefined
    }
    if (paidAmount !== undefined) {
      const amount = parseMoney(paidAmount)
      if (amount === false) {
        return res.status(400).json({
          success: false,
          message: 'Paid amount must be 0 or more'
        })
      }
      user.paidAmount = amount
    }
    if (referredBy !== undefined) {
      const referrer = await resolveReferrer(referredBy, user._id)
      if (referrer.error) {
        return res.status(400).json({ success: false, message: referrer.error })
      }
      user.referredBy = referrer.id
      if (!referrer.id) user.referralCommission = undefined
    }
    if (referralCommission !== undefined && user.referredBy) {
      const commission = parseMoney(referralCommission)
      if (commission === false) {
        return res.status(400).json({ success: false, message: 'Referral commission must be 0 or more' })
      }
      user.referralCommission = commission
    }
    if (paymentScreenshots !== undefined) {
      const next = cleanScreenshotPaths(paymentScreenshots)
      // Files the admin removed are deleted from disk
      deleteScreenshotFiles((user.paymentScreenshots || []).filter((p) => !next.includes(p)))
      user.paymentScreenshots = next
    }
    if (password !== undefined && password.trim()) {
      if (password.length < 4) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 4 characters'
        })
      }
      // Hash the new password
      const salt = await bcrypt.genSalt(10)
      user.password = await bcrypt.hash(password, salt)
      passwordChanged = true
    }

    await user.save()

    const changes = diffSnapshots(before, snapshot(user, USER_FIELDS), USER_FIELDS)
    if (passwordChanged) changes.push({ field: 'Password', from: null, to: '(changed)' })
    const nameChange = changes.find((c) => c.field === 'Name')
    const label = nameChange ? `${nameChange.from} → ${nameChange.to}` : user.name

    if (Boolean(wasActive) !== Boolean(user.isActive)) {
      recordActivity(req, {
        action: user.isActive ? 'activate' : 'deactivate',
        entity: 'user',
        entityId: user._id,
        entityName: user.name,
        summary: `${user.isActive ? 'Activated' : 'Deactivated'} user ${user.name} (${user.mobile1})`,
        changes: [{ field: 'Status', from: wasActive ? 'Active' : 'Inactive', to: user.isActive ? 'Active' : 'Inactive' }]
      })
    }
    if (changes.length) {
      recordActivity(req, {
        action: 'update',
        entity: 'user',
        entityId: user._id,
        entityName: user.name,
        summary: nameChange
          ? `Renamed user ${label}`
          : `Edited user ${label} (${changes.map((c) => c.field).join(', ')})`,
        changes
      })
    }

    res.json({
      success: true,
      message: 'User updated successfully',
      data: {
        id: user._id,
        name: user.name,
        mobile1: user.mobile1,
        mobile2: user.mobile2,
        email: user.email,
        address: user.address,
        state: user.state,
        rto: user.rto,
        billName: user.billName,
        billDescription: user.billDescription,
        isActive: user.isActive,
        features: user.features,
        rcSearchLimit: user.rcSearchLimit || 0,
        rcSearchCount: user.rcSearchCount || 0,
        rcSearchRemaining: Math.max(0, (user.rcSearchLimit || 0) - (user.rcSearchCount || 0)),
        rcProvider: user.rcProvider,
        planType: user.planType,
        subscriptionExpiresAt: user.subscriptionExpiresAt,
        monthlyPrice: user.monthlyPrice,
        yearlyPrice: user.yearlyPrice,
        lifetimeFee: user.lifetimeFee,
        paymentScreenshots: user.paymentScreenshots || [],
        referredBy: user.referredBy,
        referralCommission: user.referralCommission,
        ...feeFields(user)
      }
    })
  } catch (error) {
    logError(error, req)
    const userError = getUserFriendlyError(error)
    res.status(400).json({
      success: false,
      message: userError.message,
      errors: userError.details,
      errorCount: userError.errorCount,
      timestamp: getSimplifiedTimestamp()
    })
  }
}

// Delete user
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id)

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    deleteScreenshotFiles(user.paymentScreenshots)

    recordActivity(req, {
      action: 'delete',
      entity: 'user',
      entityId: user._id,
      entityName: user.name,
      summary: `Deleted user ${user.name} (${user.mobile1})`,
      changes: diffSnapshots(snapshot(user, USER_FIELDS), {}, USER_FIELDS)
    })

    res.json({
      success: true,
      message: 'User deleted successfully'
    })
  } catch (error) {
    logError(error, req)
    const userError = getUserFriendlyError(error)
    res.status(500).json({
      success: false,
      message: userError.message,
      errors: userError.details,
      errorCount: userError.errorCount,
      timestamp: getSimplifiedTimestamp()
    })
  }
}

// Clean all of a user's data (keeps the account). Emails a backup first.
exports.cleanUserData = async (req, res) => {
  try {
    if (req.body?.confirm !== 'confirm') {
      return res.status(400).json({
        success: false,
        message: 'Type "confirm" to clean this user data'
      })
    }

    const user = await User.findById(req.params.id).select('-password').lean()
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    let result
    try {
      result = await backupAndCleanUserData(user)
    } catch (error) {
      logError(error, req)
      return res.status(500).json({
        success: false,
        message: 'Backup email could not be sent, so no data was deleted. Please try again.'
      })
    }

    recordActivity(req, {
      action: 'delete',
      entity: 'user',
      entityId: user._id,
      entityName: user.name,
      summary: `Cleaned all data of user ${user.name} (${user.mobile1}): ${result.totalRecords} records deleted after email backup`
    })

    res.json({
      success: true,
      message: `Backup emailed and ${result.totalRecords} records deleted`,
      data: result
    })
  } catch (error) {
    logError(error, req)
    const userError = getUserFriendlyError(error)
    res.status(500).json({
      success: false,
      message: userError.message,
      errors: userError.details,
      errorCount: userError.errorCount,
      timestamp: getSimplifiedTimestamp()
    })
  }
}

// Get user statistics
exports.getUserStatistics = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments()
    const activeUsers = await User.countDocuments({ isActive: true })
    const inactiveUsers = await User.countDocuments({ isActive: false })
    // Users without rcProvider use API 2
    const rcApi1Users = await User.countDocuments({ rcProvider: 'api1' })
    // Plan fee (lifetime fee or yearly price) against the money received
    const [fees] = await User.aggregate([
      {
        $addFields: {
          planFee: {
            $ifNull: [{ $cond: [{ $eq: ['$planType', 'lifetime'] }, '$lifetimeFee', '$yearlyPrice'] }, 0]
          }
        }
      },
      // No paidAmount means the full fee was paid
      { $addFields: { paid: { $ifNull: ['$paidAmount', '$planFee'] } } },
      {
        $group: {
          _id: null,
          totalFee: { $sum: '$planFee' },
          paidAmount: { $sum: '$paid' },
          pendingAmount: { $sum: { $max: [0, { $subtract: ['$planFee', '$paid'] }] } },
          pendingUsers: { $sum: { $cond: [{ $gt: ['$planFee', '$paid'] }, 1, 0] } }
        }
      }
    ])

    res.json({
      success: true,
      data: {
        total: totalUsers,
        active: activeUsers,
        inactive: inactiveUsers,
        rcApi1: rcApi1Users,
        rcApi2: totalUsers - rcApi1Users,
        fees: {
          totalFee: fees?.totalFee || 0,
          paidAmount: fees?.paidAmount || 0,
          pendingAmount: fees?.pendingAmount || 0,
          pendingUsers: fees?.pendingUsers || 0
        }
      }
    })
  } catch (error) {
    logError(error, req)
    const userError = getUserFriendlyError(error)
    res.status(500).json({
      success: false,
      message: userError.message,
      errors: userError.details,
      errorCount: userError.errorCount,
      timestamp: getSimplifiedTimestamp()
    })
  }
}

// Get user counts grouped by state (only states that have at least one user)
exports.getUserStateCounts = async (req, res) => {
  try {
    const counts = await User.aggregate([
      { $match: { state: { $exists: true, $ne: null, $ne: '' } } },
      { $group: { _id: '$state', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ])

    res.json({
      success: true,
      data: counts.map((c) => ({ state: c._id, count: c.count }))
    })
  } catch (error) {
    logError(error, req)
    const userError = getUserFriendlyError(error)
    res.status(500).json({
      success: false,
      message: userError.message,
      errors: userError.details,
      errorCount: userError.errorCount,
      timestamp: getSimplifiedTimestamp()
    })
  }
}

// Generate a short-lived token so an admin can open the frontend as a user for testing.
exports.generateUserAccessToken = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password')

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    const token = jwt.sign(
      {
        id: user._id,
        type: 'admin_user_access',
        purpose: 'admin_user_access',
        adminId: req.admin.id
      },
      process.env.JWT_SECRET || 'your-secret-key-change-this-in-production',
      { expiresIn: '10m' }
    )

    recordActivity(req, {
      action: 'access',
      entity: 'user',
      entityId: user._id,
      entityName: user.name,
      summary: `Opened the software as user ${user.name} (${user.mobile1})`
    })

    const adminToken = jwt.sign(
      {
        id: req.admin.id,
        email: req.admin.email,
        type: 'admin'
      },
      process.env.JWT_SECRET || 'your-secret-key-change-this-in-production',
      { expiresIn: '30d' }
    )

    res.cookie('adminToken', adminToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000
    })

    res.json({
      success: true,
      data: {
        token
      }
    })
  } catch (error) {
    logError(error, req)
    const userError = getUserFriendlyError(error)
    res.status(500).json({
      success: false,
      message: userError.message,
      errors: userError.details,
      errorCount: userError.errorCount,
      timestamp: getSimplifiedTimestamp()
    })
  }
}

// Month-wise joins & subscription revenue for the admin dashboard.
// Months are bucketed on createdAt in India time, so a user created at 02:00 IST
// counts in the correct month rather than slipping into the previous one.
exports.getRevenueDashboard = async (req, res) => {
  try {
    const IST = 'Asia/Kolkata'
    const months = Math.min(60, Math.max(1, parseInt(req.query.months, 10) || 12))

    // Plan amount per user: lifetime plans use lifetimeFee, recurring plans use
    // yearlyPrice, else monthlyPrice x 12, else 0
    const amountExpr = {
      $cond: [
        { $eq: ['$planType', 'lifetime'] },
        { $ifNull: ['$lifetimeFee', 0] },
        {
          $ifNull: [
            '$yearlyPrice',
            { $cond: [{ $ifNull: ['$monthlyPrice', false] }, { $multiply: ['$monthlyPrice', 12] }, 0] }
          ]
        }
      ]
    }

    const pipeline = [
      {
        $addFields: {
          planAmount: amountExpr,
          isLifetime: { $eq: ['$planType', 'lifetime'] }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt', timezone: IST } },
          users: { $sum: 1 },
          revenue: { $sum: '$planAmount' },
          yearlyUsers: { $sum: { $cond: ['$isLifetime', 0, 1] } },
          lifetimeUsers: { $sum: { $cond: ['$isLifetime', 1, 0] } },
          yearlyRevenue: { $sum: { $cond: ['$isLifetime', 0, '$planAmount'] } },
          lifetimeRevenue: { $sum: { $cond: ['$isLifetime', '$planAmount', 0] } },
          activeUsers: { $sum: { $cond: ['$isActive', 1, 0] } },
          unpricedUsers: { $sum: { $cond: [{ $gt: ['$planAmount', 0] }, 0, 1] } }
        }
      },
      { $sort: { _id: 1 } }
    ]

    const [grouped, totals] = await Promise.all([
      User.aggregate(pipeline),
      User.aggregate([
        { $addFields: { planAmount: amountExpr, isLifetime: { $eq: ['$planType', 'lifetime'] } } },
        {
          $group: {
            _id: null,
            totalUsers: { $sum: 1 },
            activeUsers: { $sum: { $cond: ['$isActive', 1, 0] } },
            totalRevenue: { $sum: '$planAmount' },
            yearlyRevenue: { $sum: { $cond: ['$isLifetime', 0, '$planAmount'] } },
            lifetimeRevenue: { $sum: { $cond: ['$isLifetime', '$planAmount', 0] } },
            lifetimeUsers: { $sum: { $cond: ['$isLifetime', 1, 0] } },
            unpricedUsers: { $sum: { $cond: [{ $gt: ['$planAmount', 0] }, 0, 1] } },
            // Recurring run rate: yearly plans on active users only
            activeYearlyRevenue: {
              $sum: { $cond: [{ $and: ['$isActive', { $not: '$isLifetime' }] }, '$planAmount', 0] }
            }
          }
        }
      ])
    ])

    const byMonth = new Map(grouped.map((g) => [g._id, g]))

    // Build a continuous month axis (no gaps) ending with the current IST month
    const nowKey = new Date().toLocaleDateString('en-CA', { timeZone: IST }) // YYYY-MM-DD
    const [nowYear, nowMonth] = nowKey.split('-').map(Number)
    const series = []
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(Date.UTC(nowYear, nowMonth - 1 - i, 1))
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
      const row = byMonth.get(key)
      series.push({
        month: key,
        users: row?.users || 0,
        revenue: row?.revenue || 0,
        yearlyUsers: row?.yearlyUsers || 0,
        lifetimeUsers: row?.lifetimeUsers || 0,
        yearlyRevenue: row?.yearlyRevenue || 0,
        lifetimeRevenue: row?.lifetimeRevenue || 0,
        activeUsers: row?.activeUsers || 0,
        unpricedUsers: row?.unpricedUsers || 0
      })
    }

    const t = totals[0] || {}
    const windowUsers = series.reduce((sum, m) => sum + m.users, 0)
    const windowRevenue = series.reduce((sum, m) => sum + m.revenue, 0)

    res.json({
      success: true,
      data: {
        months,
        timezone: IST,
        series,
        // All-time, across every user in the database
        totals: {
          totalUsers: t.totalUsers || 0,
          activeUsers: t.activeUsers || 0,
          totalRevenue: t.totalRevenue || 0,
          yearlyRevenue: t.yearlyRevenue || 0,
          lifetimeRevenue: t.lifetimeRevenue || 0,
          lifetimeUsers: t.lifetimeUsers || 0,
          unpricedUsers: t.unpricedUsers || 0,
          activeYearlyRunRate: t.activeYearlyRevenue || 0,
          avgRevenuePerUser: t.totalUsers ? Math.round((t.totalRevenue || 0) / t.totalUsers) : 0
        },
        // Just the selected window
        window: {
          users: windowUsers,
          revenue: windowRevenue,
          bestMonth: series.reduce(
            (best, m) => (best === null || m.revenue > best.revenue ? m : best),
            null
          ),
          avgMonthlyRevenue: series.length ? Math.round(windowRevenue / series.length) : 0
        }
      }
    })
  } catch (error) {
    logError(error, req)
    const userError = getUserFriendlyError(error)
    res.status(500).json({
      success: false,
      message: userError.message,
      errors: userError.details,
      errorCount: userError.errorCount,
      timestamp: getSimplifiedTimestamp()
    })
  }
}

// Vehicle (RC details) API quota for the admin panel.
// The provider only reports its quota on a search response, so this is the snapshot
// from the most recent search - it is never fetched live (that would spend a credit).
exports.getRcApiUsage = async (req, res) => {
  try {
    let usage = null

    const snapshot = await ApiUsage.findOne({ provider: 'vehicleInfo' }).lean()
    if (snapshot) {
      usage = {
        totalLimit: snapshot.totalLimit ?? null,
        used: snapshot.used ?? null,
        remaining: snapshot.remaining ?? null,
        checkedAt: snapshot.checkedAt || snapshot.updatedAt || null,
        lastVehicleNumber: snapshot.lastVehicleNumber || null
      }
    } else {
      // Nothing recorded yet (no search since this was deployed): fall back to the
      // newest saved search, which carries the provider's reply from that time
      const last = await VehicleSearchHistory.findOne({ 'rawResponse._usage': { $exists: true } })
        .sort({ lastSearchedAt: -1 })
        .select('rawResponse._usage lastSearchedAt vehicleNumber')
        .lean()
      const raw = last?.rawResponse?._usage
      if (raw) {
        const toNumber = (value) => (Number.isFinite(Number(value)) ? Number(value) : null)
        usage = {
          totalLimit: toNumber(raw.total_limit),
          used: toNumber(raw.used),
          remaining: toNumber(raw.remaining),
          checkedAt: last.lastSearchedAt || null,
          lastVehicleNumber: last.vehicleNumber || null
        }
      }
    }

    // Searches still promised to users who have the RC Details feature switched on
    const [allocation] = await User.aggregate([
      { $match: { 'features.rcDetails': true } },
      {
        $group: {
          _id: null,
          users: { $sum: 1 },
          allocatedRemaining: {
            $sum: {
              $max: [
                0,
                { $subtract: [{ $ifNull: ['$rcSearchLimit', 0] }, { $ifNull: ['$rcSearchCount', 0] }] }
              ]
            }
          }
        }
      }
    ])

    res.json({
      success: true,
      data: {
        usage,
        allocation: {
          users: allocation?.users || 0,
          allocatedRemaining: allocation?.allocatedRemaining || 0
        }
      }
    })
  } catch (error) {
    logError(error, req)
    const userError = getUserFriendlyError(error)
    res.status(500).json({
      success: false,
      message: userError.message,
      errors: userError.details,
      errorCount: userError.errorCount,
      timestamp: getSimplifiedTimestamp()
    })
  }
}
