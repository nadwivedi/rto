const express = require('express')
const router = express.Router()
const chassisController = require('../controllers/chassisController')

// Chassis number -> vehicle (RC) search, through ParzivalHub (API 3). Mounted behind userAuth.
router.get('/quota', chassisController.getQuota)
router.get('/history', chassisController.getHistory)
router.delete('/history/:id', chassisController.deleteHistory)
router.get('/lookup', chassisController.lookup)
router.post('/lookup', chassisController.lookup)

module.exports = router
