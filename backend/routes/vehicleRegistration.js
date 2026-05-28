const express = require('express')
const router = express.Router()
const vehicleRegistrationController = require('../controllers/vehicleRegistrationController')

// GET export all registrations (must be before '/')
router.get('/export', vehicleRegistrationController.exportAllRegistrations)

// GET all vehicle registrations
router.get('/', vehicleRegistrationController.getAllRegistrations)

// GET statistics
router.get('/statistics', vehicleRegistrationController.getStatistics)

// GET check if vehicle exists (must be before other routes)
router.get('/check-exists/:registrationNumber', vehicleRegistrationController.checkVehicleExists)

// GET vehicle ledger - all work done for a vehicle
router.get('/ledger/:registrationNumber', vehicleRegistrationController.getVehicleLedger)

// GET single vehicle registration by ID
router.get('/:id', vehicleRegistrationController.getRegistrationById)

// GET vehicle registration by registration number
router.get('/number/:registrationNumber', vehicleRegistrationController.getRegistrationByNumber)

// GET vehicle registrations by flexible search (last 4 digits, series, or full number)
router.get('/search/:searchInput', vehicleRegistrationController.searchRegistrationByNumber)

// POST create new vehicle registration
router.post('/', vehicleRegistrationController.createRegistration)

// PUT update vehicle registration
router.put('/:id', vehicleRegistrationController.updateRegistration)

// DELETE vehicle registration
router.delete('/:id', vehicleRegistrationController.deleteRegistration)

// PATCH update registration status
router.patch('/:id/status', vehicleRegistrationController.updateRegistrationStatus)

module.exports = router
