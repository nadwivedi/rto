const express = require('express')
const router = express.Router()
const greenTaxController = require('../controllers/greenTaxController')

router.get('/export', greenTaxController.exportAllGreenTax)
router.get('/', greenTaxController.getAllGreenTax)
router.get('/statistics', greenTaxController.getGreenTaxStatistics)
router.get('/expiring-soon', greenTaxController.getExpiringSoonGreenTaxes)
router.get('/expired', greenTaxController.getExpiredGreenTaxes)
router.get('/pending-payment', greenTaxController.getPendingPaymentGreenTaxes)
router.get('/:id', greenTaxController.getGreenTaxById)
router.post('/', greenTaxController.createGreenTax)
router.put('/:id', greenTaxController.updateGreenTax)
router.patch('/:id/mark-as-paid', greenTaxController.markAsPaid)
router.patch('/:id/whatsapp-increment', greenTaxController.incrementWhatsAppCount)
router.delete('/:id', greenTaxController.deleteGreenTax)

module.exports = router
