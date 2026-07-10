const express = require('express')
const router = express.Router()
const professionalTaxController = require('../controllers/professionalTaxController')

router.get('/export', professionalTaxController.exportAllProfessionalTax)
router.get('/statistics', professionalTaxController.getProfessionalTaxStatistics)
router.get('/expiring-soon', professionalTaxController.getExpiringSoonProfessionalTaxes)
router.get('/expired', professionalTaxController.getExpiredProfessionalTaxes)
router.get('/pending-payment', professionalTaxController.getPendingPaymentProfessionalTaxes)
router.get('/', professionalTaxController.getAllProfessionalTax)
router.get('/:id', professionalTaxController.getProfessionalTaxById)
router.post('/', professionalTaxController.createProfessionalTax)
router.put('/:id', professionalTaxController.updateProfessionalTax)
router.patch('/:id/mark-as-paid', professionalTaxController.markAsPaid)
router.delete('/:id', professionalTaxController.deleteProfessionalTax)

module.exports = router
