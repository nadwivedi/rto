const express = require('express')
const router = express.Router()
const adminAuthMiddleware = require('../middleware/adminAuth')
const adminSearchLogController = require('../controllers/adminSearchLogController')

router.use(adminAuthMiddleware)

// Every RC search (app users + Vehicle RC API keys), and one search's full vehicle details
router.get('/', adminSearchLogController.listSearches)
router.get('/:kind/:id', adminSearchLogController.getSearch)

module.exports = router
