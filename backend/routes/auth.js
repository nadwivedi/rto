const express = require('express')
const router = express.Router()
const authController = require('../controllers/authController')
const userAuthMiddleware = require('../middleware/userAuth')

// User authentication routes
router.post('/login', authController.login)
router.post('/staff-login', authController.staffLogin)
router.post('/admin-access-login', authController.adminAccessLogin)
router.get('/profile', userAuthMiddleware, authController.getProfile)
router.post('/change-password', userAuthMiddleware, authController.changePassword)
router.post('/logout', userAuthMiddleware, authController.logout)
router.patch('/settings', userAuthMiddleware, authController.updateSettings)
router.post('/profile-picture', userAuthMiddleware, authController.uploadProfilePicture)
router.delete('/profile-picture', userAuthMiddleware, authController.removeProfilePicture)

module.exports = router
