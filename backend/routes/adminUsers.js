const express = require('express')
const router = express.Router()
const adminUserController = require('../controllers/adminUserController')
const adminAuthMiddleware = require('../middleware/adminAuth')

router.use(adminAuthMiddleware)

// Get user statistics
router.get('/statistics', adminUserController.getUserStatistics)

// Get all users
router.get('/', adminUserController.getAllUsers)

// Generate frontend access token for a user
router.post('/:id/access-token', adminUserController.generateUserAccessToken)

// Get single user by ID
router.get('/:id', adminUserController.getUserById)

// Create new user
router.post('/', adminUserController.createUser)

// Update user
router.put('/:id', adminUserController.updateUser)

// Delete user
router.delete('/:id', adminUserController.deleteUser)

module.exports = router
