const express = require('express')
const router = express.Router()
const adminAuthMiddleware = require('../middleware/adminAuth')
const adminAlertController = require('../controllers/adminAlertController')

router.use(adminAuthMiddleware)

// Problems only the admin can fix: provider wallet empty, bad API key, provider down
router.get('/', adminAlertController.listAlerts)
router.get('/count', adminAlertController.countAlerts)
router.patch('/resolve-all', adminAlertController.resolveAllAlerts)
router.patch('/:id/resolve', adminAlertController.resolveAlert)

module.exports = router
