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

module.exports = router
