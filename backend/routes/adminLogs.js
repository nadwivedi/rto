const express = require('express')
const router = express.Router()
const adminAuthMiddleware = require('../middleware/adminAuth')
const adminLogController = require('../controllers/adminLogController')

router.use(adminAuthMiddleware)

// Everything the backend printed (API errors, warnings, info), newest first
router.get('/', adminLogController.listLogs)
router.delete('/', adminLogController.clearLogs)

module.exports = router
