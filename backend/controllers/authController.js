const User = require('../models/User')
const Employee = require('../models/Employee')
const jwt = require('jsonwebtoken')

// Helper function to validate mobile number
const isValidMobile = (mobile) => {
  return /^[0-9]{10}$/.test(mobile)
}

// Helper function to validate email
const isValidEmail = (email) => {
  return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)
}

// Login user (using email or mobile + password)
exports.login = async (req, res) => {
  try {
    const { identifier, password } = req.body

    // Validate input
    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email or mobile number and password'
      })
    }

    // Validate password length
    if (password.length < 4) {
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials'
      })
    }

    // Find user by email or mobile
    let user
    const trimmedIdentifier = identifier.trim()

    // Check if identifier is an email or mobile number
    if (trimmedIdentifier.includes('@')) {
      // Validate email format
      if (!isValidEmail(trimmedIdentifier)) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid email address'
        })
      }
      user = await User.findOne({ email: trimmedIdentifier.toLowerCase() })
    } else {
      // Validate mobile format
      if (!isValidMobile(trimmedIdentifier)) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid 10-digit mobile number'
        })
      }
      user = await User.findOne({ mobile1: trimmedIdentifier })
    }


    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      })
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact support.'
      })
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password)

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      })
    }

    // Update last login (using updateOne to avoid triggering pre-save hooks)
    await User.updateOne({ _id: user._id }, { lastLogin: new Date() })

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user._id,
        mobile1: user.mobile1,
        mobile2: user.mobile2,
        email: user.email,
        name: user.name,
        type: 'user'
      },
      process.env.JWT_SECRET || 'your-secret-key-change-this-in-production',
      { expiresIn: '30d' }
    )

    // Set token in HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    })

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          name: user.name,
          mobile1: user.mobile1,
          mobile2: user.mobile2,
          email: user.email,
          address: user.address,
          state: user.state,
          rto: user.rto,
          lastLogin: user.lastLogin
        }
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({
      success: false,
      message: 'An error occurred during login. Please try again.'
    })
  }
}

// Staff Login (using mobile + password)
exports.staffLogin = async (req, res) => {
  try {
    const { identifier, password } = req.body

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide mobile number and password'
      })
    }

    const trimmedIdentifier = identifier.trim()

    const employee = await Employee.findOne({ mobile: trimmedIdentifier })

    if (!employee) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      })
    }

    if (!employee.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact admin.'
      })
    }

    const isPasswordValid = await employee.comparePassword(password)
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      })
    }

    await Employee.updateOne({ _id: employee._id }, { lastLogin: new Date() })

    // Resolve adminId - use the stored one or find the first admin in the DB
    let adminId = employee.adminId ? employee.adminId.toString() : null
    if (!adminId) {
      const adminUser = await User.findOne({}).select('_id').lean()
      adminId = adminUser ? adminUser._id.toString() : null
      // Save for future logins so subsequent logins are instant
      if (adminId) await Employee.updateOne({ _id: employee._id }, { adminId })
    }

    const token = jwt.sign(
      {
        id: employee._id,
        adminId: adminId,
        mobile: employee.mobile,
        name: employee.name,
        type: 'staff',
        permissions: employee.permissions
      },
      process.env.JWT_SECRET || 'your-secret-key-change-this-in-production',
      { expiresIn: '30d' }
    )

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    })

    res.json({
      success: true,
      message: 'Staff login successful',
      data: {
        user: {
          id: employee._id,
          name: employee.name,
          mobile: employee.mobile,
          type: 'staff',
          permissions: employee.permissions,
          lastLogin: employee.lastLogin
        }
      }
    })
  } catch (error) {
    console.error('Staff login error:', error)
    res.status(500).json({
      success: false,
      message: 'An error occurred during staff login'
    })
  }
}

// Get current user profile
exports.getProfile = async (req, res) => {
  try {
    if (req.user.type === 'staff') {
      // Use staffId (original employee _id preserved in middleware)
      const employeeId = req.user.staffId || req.user.id
      const employee = await Employee.findById(employeeId).select('-password')
      if (!employee) {
        return res.status(404).json({ success: false, message: 'Staff profile not found' })
      }
      if (!employee.isActive) {
        return res.status(403).json({ success: false, message: 'Your account has been deactivated' })
      }
      return res.json({
        success: true,
        data: {
          user: {
            id: employee._id,
            name: employee.name,
            mobile: employee.mobile,
            type: 'staff',
            permissions: employee.permissions
          }
        }
      })
    }

    const user = await User.findById(req.user.id).select('-password')

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated'
      })
    }

    res.json({
      success: true,
      data: {
        user: {
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
          type: 'user'
        }
      }
    })
  } catch (error) {
    console.error('Get profile error:', error)
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching profile'
    })
  }
}

// Logout user
exports.logout = async (req, res) => {
  // Clear the token cookie
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  })

  res.json({
    success: true,
    message: 'Logged out successfully'
  })
}
