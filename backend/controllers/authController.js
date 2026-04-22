const User = require('../models/User')
const Employee = require('../models/Employee')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')

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
    let isPasswordValid = await user.comparePassword(password)

    if (!isPasswordValid) {
      if (user.password === password) {
        // Plaintext fallback (due to bug)
        isPasswordValid = true
        // Auto-fix: hash and save
        const salt = await bcrypt.genSalt(10)
        user.password = await bcrypt.hash(password, salt)
        await user.save()
      } else {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        })
      }
    }

    const loginAt = new Date()

    // Update login/activity timestamps (using updateOne to avoid triggering pre-save hooks)
    await User.updateOne({ _id: user._id }, { lastLogin: loginAt, lastActivity: loginAt })
    user.lastLogin = loginAt
    user.lastActivity = loginAt

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
          lastLogin: user.lastLogin,
          lastActivity: user.lastActivity
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

    let isPasswordValid = await employee.comparePassword(password)
    if (!isPasswordValid) {
      if (employee.password === password) {
        // Plaintext fallback
        isPasswordValid = true
        const salt = await bcrypt.genSalt(10)
        employee.password = await bcrypt.hash(password, salt)
        await employee.save()
      } else {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        })
      }
    }

    const loginAt = new Date()
    await Employee.updateOne({ _id: employee._id }, { lastLogin: loginAt, lastActivity: loginAt })
    employee.lastLogin = loginAt
    employee.lastActivity = loginAt

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
          lastLogin: employee.lastLogin,
          lastActivity: employee.lastActivity
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

// Let an authenticated admin access a user account from the public frontend for testing.
exports.adminAccessLogin = async (req, res) => {
  try {
    const { token: accessToken } = req.body

    if (!accessToken) {
      return res.status(400).json({
        success: false,
        message: 'Access token is required'
      })
    }

    const decoded = jwt.verify(
      accessToken,
      process.env.JWT_SECRET || 'your-secret-key-change-this-in-production'
    )

    if (decoded.type !== 'admin_user_access' || decoded.purpose !== 'admin_user_access') {
      return res.status(401).json({
        success: false,
        message: 'Invalid access token'
      })
    }

    const user = await User.findById(decoded.id).select('-password')

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'This user account is inactive'
      })
    }

    const loginAt = new Date()
    await User.updateOne({ _id: user._id }, { lastLogin: loginAt, lastActivity: loginAt })
    user.lastLogin = loginAt
    user.lastActivity = loginAt

    const token = jwt.sign(
      {
        id: user._id,
        mobile1: user.mobile1,
        mobile2: user.mobile2,
        email: user.email,
        name: user.name,
        type: 'user',
        accessedByAdmin: decoded.adminId
      },
      process.env.JWT_SECRET || 'your-secret-key-change-this-in-production',
      { expiresIn: '30d' }
    )

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000
    })

    res.json({
      success: true,
      message: 'Access granted',
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
          type: 'user',
          lastLogin: user.lastLogin,
          lastActivity: user.lastActivity
        }
      }
    })
  } catch (error) {
    console.error('Admin access login error:', error)

    if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Access token has expired or is invalid'
      })
    }

    res.status(500).json({
      success: false,
      message: 'An error occurred while granting access'
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
      const activityAt = new Date()
      await Employee.updateOne({ _id: employee._id }, { lastActivity: activityAt })
      employee.lastActivity = activityAt
      return res.json({
        success: true,
        data: {
          user: {
            id: employee._id,
            name: employee.name,
            mobile: employee.mobile,
            type: 'staff',
            permissions: employee.permissions,
            lastLogin: employee.lastLogin,
            lastActivity: employee.lastActivity
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

    const activityAt = new Date()
    await User.updateOne({ _id: user._id }, { lastActivity: activityAt })
    user.lastActivity = activityAt

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
          type: 'user',
          lastLogin: user.lastLogin,
          lastActivity: user.lastActivity
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

// Change Password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current password and new password are required' })
    }

    if (newPassword.length < 4) {
      return res.status(400).json({ success: false, message: 'New password must be at least 4 characters long' })
    }

    let account;
    if (req.user.type === 'staff') {
      const employeeId = req.user.staffId || req.user.id
      account = await Employee.findById(employeeId)
    } else {
      account = await User.findById(req.user.id)
    }

    if (!account) {
      return res.status(404).json({ success: false, message: 'Account not found' })
    }

    const isMatch = await account.comparePassword(currentPassword)
    if (!isMatch) {
      // Small fallback: if the current password was saved in plaintext due to the bug, it won't match bcrypt.compare.
      // We can check if the current password exactly equals the stored string as a bailout, so the user isn't permanently locked out.
      if (account.password !== currentPassword) {
        return res.status(400).json({ success: false, message: 'Incorrect current password' })
      }
    }

    const salt = await bcrypt.genSalt(10)
    account.password = await bcrypt.hash(newPassword, salt)
    await account.save()

    res.json({ success: true, message: 'Password updated successfully' })
  } catch (error) {
    console.error('Change password error:', error)
    res.status(500).json({ success: false, message: 'An error occurred while changing password' })
  }
}
