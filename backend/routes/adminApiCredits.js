const express = require('express')
const router = express.Router()
const adminApiCreditController = require('../controllers/adminApiCreditController')
const adminAuthMiddleware = require('../middleware/adminAuth')

router.use(adminAuthMiddleware)

// Totals, month-wise cashflow and per-user sales
router.get('/summary', adminApiCreditController.getSummary)

// Searches actually made: day-wise and per user
router.get('/usage', adminApiCreditController.getUsage)

// List purchases / sales
router.get('/', adminApiCreditController.getTransactions)

// Record a purchase from the provider or a sale to a user
router.post('/', adminApiCreditController.createTransaction)

// Change the rate (price) and/or money received on an entry; quantity and the user's limit stay the same
router.patch('/:id', adminApiCreditController.updateTransaction)
router.patch('/:id/rate', adminApiCreditController.updateTransaction)

// Delete an entry (a deleted sale is taken back off the user's limit)
router.delete('/:id', adminApiCreditController.deleteTransaction)

module.exports = router
