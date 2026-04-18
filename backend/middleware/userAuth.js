const jwt = require('jsonwebtoken')
const { logError, getUserFriendlyError, getSimplifiedTimestamp } = require('../utils/errorLogger')

const userAuthMiddleware = async (req, res, next) => {
  try {
    // Get token from cookie
    const token = req.cookies.token

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No authentication token provided',
        errors: ['No authentication token provided'],
        errorCount: 1,
        timestamp: getSimplifiedTimestamp()
      })
    }

    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your-secret-key-change-this-in-production'
    )

    // Check if token is for a user or staff
    if (decoded.type !== 'user' && decoded.type !== 'staff') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token type',
        errors: ['Invalid token type'],
        errorCount: 1,
        timestamp: getSimplifiedTimestamp()
      })
    }

    // Add user info to request
    req.user = decoded

    // KEY RBAC FIX: If staff, swap req.user.id to adminId so all DB queries
    // fetch the admin's records transparently — no changes needed in any controller.
    if (decoded.type === 'staff') {
      req.user.staffId = decoded.id  // preserve real employee _id for getProfile

      if (decoded.adminId) {
        // Token already has adminId (normal case after first login)
        req.user.id = decoded.adminId
      } else {
        // Old token without adminId — look up from DB and save for next login
        const Employee = require('../models/Employee')
        const User = require('../models/User')
        const employee = await Employee.findById(decoded.id).select('adminId').lean()

        let adminId = employee && employee.adminId ? employee.adminId.toString() : null
        if (!adminId) {
          const adminUser = await User.findOne({}).select('_id').lean()
          adminId = adminUser ? adminUser._id.toString() : null
          if (adminId) {
            await Employee.updateOne({ _id: decoded.id }, { adminId })
          }
        }

        if (adminId) {
          req.user.id = adminId
        }
      }
    }

    next()
  } catch (error) {
    logError(error, req) // Fire and forget

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired',
        errors: ['Token has expired'],
        errorCount: 1,
        timestamp: getSimplifiedTimestamp()
      })
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token',
        errors: ['Invalid token'],
        errorCount: 1,
        timestamp: getSimplifiedTimestamp()
      })
    }

    const userError = getUserFriendlyError(error)
    res.status(500).json({
      success: false,
      message: userError.message,
      errors: userError.details,
      errorCount: userError.errorCount,
      timestamp: new Date().toISOString()
    })
  }
}

module.exports = userAuthMiddleware
