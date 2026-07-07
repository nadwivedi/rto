const express = require('express')
const router = express.Router()
const sarthiDashboardController = require('../controllers/sarthiDashboardController')

router.get('/recently-added', sarthiDashboardController.getRecentlyAdded)

module.exports = router
