const express = require('express')
const router = express.Router()
const insuranceController = require('../controllers/insuranceController')

// IMPORTANT: Specific routes must come BEFORE parameterized routes

// GET export all insurance records (must be before /:id)
router.get('/export', insuranceController.exportAllInsurance)

// Get statistics (must be before /:id)
router.get('/statistics', insuranceController.getStatistics)

// Get distinct insurance companies for filter dropdown
router.get('/companies', insuranceController.getInsuranceCompanies)

// Monthly business report (must be before /:id)
router.get('/monthly-report', insuranceController.monthlyReport)

// Get expiring insurance records (must be before /:id)
router.get('/expiring', insuranceController.getExpiringInsurance)

// Get expiring soon insurance records
router.get('/expiring-soon', insuranceController.getExpiringSoonInsurance)

// Get expired insurance records
router.get('/expired', insuranceController.getExpiredInsurance)

// Get pending payment insurance records
router.get('/pending', insuranceController.getPendingInsurance)

// Check if vehicle has active insurance (must be before general /:id)
router.get('/check-vehicle/:vehicleNumber', insuranceController.checkVehicleActiveInsurance)

// Get insurance by policy number (must be before general /:id)
router.get('/policy/:policyNumber', insuranceController.getInsuranceByPolicyNumber)

// Get all insurance records with pagination and filters
router.get('/', insuranceController.getAllInsurance)

// Create new insurance record
router.post('/', insuranceController.createInsurance)

// Get single insurance record by ID
router.get('/:id', insuranceController.getInsuranceById)

// Update insurance record
router.put('/:id', insuranceController.updateInsurance)

// PATCH mark insurance as paid
router.patch('/:id/mark-as-paid', insuranceController.markAsPaid)

// PATCH increment WhatsApp message count
router.patch('/:id/whatsapp-increment', insuranceController.incrementWhatsAppCount)

// Delete insurance record
router.delete('/:id', insuranceController.deleteInsurance)

module.exports = router
