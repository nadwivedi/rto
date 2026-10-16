const express = require('express')
const router = express.Router()
const adminAuthMiddleware = require('../middleware/adminAuth')
const adminDeployController = require('../controllers/adminDeployController')

router.use(adminAuthMiddleware)

router.get('/', adminDeployController.getDeployStatus)
// Pull the latest code and update the server
router.post('/', adminDeployController.startDeploy)

module.exports = router
