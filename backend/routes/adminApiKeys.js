const express = require('express')
const router = express.Router()
const adminApiKeyController = require('../controllers/adminApiKeyController')
const adminAuthMiddleware = require('../middleware/adminAuth')

router.use(adminAuthMiddleware)

// All keys with limits, sales and call counts
router.get('/', adminApiKeyController.getApiKeys)

// Create a key (limit starts at 0; sell calls to raise it)
router.post('/', adminApiKeyController.createApiKey)

// One key: stats, day-wise calls and sales
router.get('/:id', adminApiKeyController.getApiKey)

// Change name / user / note / on-off
router.patch('/:id', adminApiKeyController.updateApiKey)

// Replace the secret (the old one stops working)
router.post('/:id/regenerate', adminApiKeyController.regenerateApiKey)

// Call log, and one call with its full response
router.get('/:id/calls', adminApiKeyController.getApiKeyCalls)
router.get('/:id/calls/:callId', adminApiKeyController.getApiKeyCall)

// Sell API calls on the key (raises its limit) / delete a sale (lowers it)
router.post('/:id/sales', adminApiKeyController.createSale)
router.delete('/:id/sales/:saleId', adminApiKeyController.deleteSale)

module.exports = router
