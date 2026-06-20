const router = require('express').Router()
const paymentReceivedController = require('../controllers/paymentReceivedController')

router.get('/:workType/:workId', paymentReceivedController.getPaymentsByWork)
router.post('/', paymentReceivedController.createPayment)
router.post('/bulk', paymentReceivedController.bulkCreatePayments)
router.put('/:workType/:workId', paymentReceivedController.replacePaymentsForWork)
router.delete('/:id', paymentReceivedController.deletePayment)

module.exports = router
