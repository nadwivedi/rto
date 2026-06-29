const express = require('express')
const router = express.Router()
const { getLicenseClasses, addLicenseClass, deleteLicenseClass } = require('../controllers/licenseClassController')

router.get('/', getLicenseClasses)
router.post('/', addLicenseClass)
router.delete('/:value', deleteLicenseClass)

module.exports = router
