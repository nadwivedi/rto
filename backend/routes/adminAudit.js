const express = require('express')
const router = express.Router()
const adminAuthMiddleware = require('../middleware/adminAuth')
const adminAuditController = require('../controllers/adminAuditController')

router.use(adminAuthMiddleware)

// Everything an admin created, edited or deleted
router.get('/activity', adminAuditController.getActivity)

module.exports = router
