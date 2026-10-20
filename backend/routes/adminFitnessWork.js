const express = require('express')
const router = express.Router()
const adminFitnessWorkController = require('../controllers/adminFitnessWorkController')
const adminAuthMiddleware = require('../middleware/adminAuth')

router.use(adminAuthMiddleware)

// Totals: today, this month, month-wise and per party
router.get('/summary', adminFitnessWorkController.getSummary)

// List fitness work entries
router.get('/', adminFitnessWorkController.getWorks)

// Record new fitness work
router.post('/', adminFitnessWorkController.createWork)

// Edit an entry
router.put('/:id', adminFitnessWorkController.updateWork)

// Delete an entry
router.delete('/:id', adminFitnessWorkController.deleteWork)

module.exports = router
