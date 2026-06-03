const express = require('express')
const router = express.Router()
const registrationRenewalController = require('../controllers/registrationRenewalController')

router.get('/', registrationRenewalController.getAllRenewals)
router.get('/statistics', registrationRenewalController.getStatistics)
router.get('/pending', registrationRenewalController.getPendingRenewals)
router.get('/vehicle/:vehicleNumber', registrationRenewalController.getRenewalsByVehicle)
router.get('/:id', registrationRenewalController.getRenewalById)
router.post('/', registrationRenewalController.createRenewal)
router.put('/:id', registrationRenewalController.updateRenewal)
router.patch('/:id/mark-as-paid', registrationRenewalController.markAsPaid)
router.delete('/:id', registrationRenewalController.deleteRenewal)

module.exports = router
