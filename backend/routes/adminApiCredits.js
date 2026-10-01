const express = require('express')
const router = express.Router()
const adminApiCreditController = require('../controllers/adminApiCreditController')
const adminAuthMiddleware = require('../middleware/adminAuth')

router.use(adminAuthMiddleware)

// Totals, month-wise cashflow and per-user sales
router.get('/summary', adminApiCreditController.getSummary)

// List purchases / sales
router.get('/', adminApiCreditController.getTransactions)

// Record a purchase from the provider or a sale to a user
router.post('/', adminApiCreditController.createTransaction)

// Delete an entry (a deleted sale is taken back off the user's limit)
router.delete('/:id', adminApiCreditController.deleteTransaction)

module.exports = router
