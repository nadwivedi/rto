const jwt = require('jsonwebtoken')
const { logError, getUserFriendlyError, getSimplifiedTimestamp } = require('../utils/errorLogger')

const adminAuthMiddleware = (req, res, next) => {
  try {
    // Get token from cookie
    const token = req.cookies.adminToken || req.cookies.token

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

    // Check if token is for an admin (not regular user)
    if (decoded.type !== 'admin') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token type',
        errors: ['Invalid token type'],
        errorCount: 1,
        timestamp: getSimplifiedTimestamp()
      })
    }

    // Add admin info to request
    req.admin = decoded
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

module.exports = adminAuthMiddleware
