const express = require('express')
const router = express.Router()
const publicVehicleApiController = require('../controllers/publicVehicleApiController')

// Vehicle details for customers with an API key (x-api-key header). No login.
router.get('/vehicle-info', publicVehicleApiController.lookupVehicle)
router.post('/vehicle-info', publicVehicleApiController.lookupVehicle)

// Chassis (+ engine) number -> vehicle details, for Chassis to RC API keys
router.get('/chassis-info', publicVehicleApiController.lookupChassis)
router.post('/chassis-info', publicVehicleApiController.lookupChassis)

module.exports = router
