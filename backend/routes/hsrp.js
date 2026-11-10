const express = require('express')
const router = express.Router()
const hsrpController = require('../controllers/hsrpController')

// HSRP (number plate) details search, through API 5. Mounted behind userAuth.
router.get('/quota', hsrpController.getQuota)
router.get('/history', hsrpController.getHistory)
router.delete('/history/:id', hsrpController.deleteHistory)
router.get('/lookup', hsrpController.lookup)
router.post('/lookup', hsrpController.lookup)

module.exports = router
