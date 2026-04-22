const User = require('../models/User')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { logError, getUserFriendlyError, getSimplifiedTimestamp } = require('../utils/errorLogger')

// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, isActive } = req.query

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
      .sort({ createdAt: -1 })
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

// Create new user
exports.createUser = async (req, res) => {
  try {
    const { name, mobile1, mobile2, email, address, state, rto, billName, billDescription, password } = req.body

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

    // Hash password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

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
      isActive: true
    })

    await newUser.save()

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
    const { name, mobile1, mobile2, email, address, state, rto, billName, billDescription, isActive, password } = req.body

    const user = await User.findById(req.params.id)

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

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
    }

    await user.save()

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
        isActive: user.isActive
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

// Get user statistics
exports.getUserStatistics = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments()
    const activeUsers = await User.countDocuments({ isActive: true })
    const inactiveUsers = await User.countDocuments({ isActive: false })

    res.json({
      success: true,
      data: {
        total: totalUsers,
        active: activeUsers,
        inactive: inactiveUsers
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

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Cannot access an inactive user account'
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
