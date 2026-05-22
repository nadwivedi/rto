const express = require('express')
const router = express.Router()
const hpaHptController = require('../controllers/hpaHptController')

// Export all records (before '/' to avoid conflict)
router.get('/export', hpaHptController.exportAllHpaHpts)

// Get all HPA/HPT records
router.get('/', hpaHptController.getAllHpaHpts)

// Get statistics
router.get('/statistics', hpaHptController.getHpaHptStatistics)

// Get pending payment records
router.get('/pending', hpaHptController.getPendingHpaHpts)

// Get single record by ID
router.get('/id/:id', hpaHptController.getHpaHptById)

// Create new record
router.post('/', hpaHptController.createHpaHpt)

// Update record
router.put('/id/:id', hpaHptController.updateHpaHpt)

// Mark as paid
router.patch('/id/:id/mark-as-paid', hpaHptController.markAsPaid)

// Delete record
router.delete('/id/:id', hpaHptController.deleteHpaHpt)

module.exports = router
