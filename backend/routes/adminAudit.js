const express = require('express')
const router = express.Router()
const adminAuthMiddleware = require('../middleware/adminAuth')
const adminAuditController = require('../controllers/adminAuditController')

// Only a logged-in admin can even try the activity center password
router.use(adminAuthMiddleware)

router.post('/unlock', adminAuditController.unlock)
router.post('/lock', adminAuditController.lock)

// Everything an admin created, edited or deleted
router.get('/activity', adminAuditController.requireAuditSession, adminAuditController.getActivity)

module.exports = router
