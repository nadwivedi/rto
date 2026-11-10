const express = require('express')
const router = express.Router()
const adminUserController = require('../controllers/adminUserController')
const adminAuthMiddleware = require('../middleware/adminAuth')

router.use(adminAuthMiddleware)

// Get user statistics
router.get('/statistics', adminUserController.getUserStatistics)

// Get user counts grouped by state
router.get('/state-counts', adminUserController.getUserStateCounts)

// Month-wise joins & revenue for the dashboard
router.get('/revenue-dashboard', adminUserController.getRevenueDashboard)

// Vehicle (RC details) API quota left with the provider
router.get('/rc-api-usage', adminUserController.getRcApiUsage)
// API 2 plan size (searches bought), for its used / left (body: { totalLimit })
router.patch('/rc-api-usage/api2', adminUserController.setApi2Plan)

// Point every user's RC searches at one vehicle info API (body: { provider })
router.post('/rc-provider-all', adminUserController.setAllRcProvider)

// Upload a fee payment screenshot (base64 image/PDF); the returned path is saved on the user
router.post('/payment-screenshot', adminUserController.uploadPaymentScreenshot)

// Get all users
router.get('/', adminUserController.getAllUsers)

// Generate frontend access token for a user
router.post('/:id/access-token', adminUserController.generateUserAccessToken)

// Email a backup of all the user's data, then delete it (account stays)
router.post('/:id/clean-data', adminUserController.cleanUserData)

// Get single user by ID
router.get('/:id', adminUserController.getUserById)

// Create new user
router.post('/', adminUserController.createUser)

// Update user
router.put('/:id', adminUserController.updateUser)

// Delete user
router.delete('/:id', adminUserController.deleteUser)

module.exports = router
