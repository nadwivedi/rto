const express = require('express')
const router = express.Router()
const vehicleInfoController = require('../controllers/vehicleInfoController')

// GET paginated search history
router.get('/history', vehicleInfoController.getSearchHistory)

// DELETE clear all search history
router.delete('/history', vehicleInfoController.clearSearchHistory)

// GET specific search history item by ID (loads from database, NO API call)
router.get('/history/:id', vehicleInfoController.getHistoryById)

// DELETE specific search history item
router.delete('/history/:id', vehicleInfoController.deleteHistoryItem)

// GET saved vehicle details by vehicle number (loads from database, NO API call)
router.get('/saved/:vno', vehicleInfoController.getSavedVehicleByVno)

// GET /api/vehicle-info/lookup?vno=... (MANUAL LIVE RTO API SEARCH)
router.get('/lookup', vehicleInfoController.lookupVehicle)

// POST /api/vehicle-info/lookup (MANUAL LIVE RTO API SEARCH)
router.post('/lookup', vehicleInfoController.lookupVehicle)

// GET /api/vehicle-info/:vno (MANUAL LIVE RTO API SEARCH)
router.get('/:vno', vehicleInfoController.lookupVehicle)

module.exports = router
