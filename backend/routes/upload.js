const express = require('express')
const router = express.Router()
const uploadController = require('../controllers/uploadController')

// POST upload RC image/PDF (base64, max 12MB)
router.post('/rc-image', uploadController.uploadRCImage)
router.post('/rc-back-image', uploadController.uploadRCBackImage)

// DELETE RC image
router.delete('/rc-image', uploadController.deleteRCImage)

// POST upload Aadhar image/PDF (base64, max 12MB)
router.post('/aadhar-image', uploadController.uploadAadharImage)

// POST upload PAN image/PDF (base64, max 12MB)
router.post('/pan-image', uploadController.uploadPanImage)

// POST upload Speed Governor image/PDF (base64, max 12MB)
router.post('/speed-governor-image', uploadController.uploadSpeedGovernorImage)

// POST upload Insurance Document image/PDF (base64, max 12MB)
router.post('/insurance-document', uploadController.uploadInsuranceDocument)

// POST upload Temporary Permit Document image/PDF (base64, max 12MB)
router.post('/temporary-permit-document', uploadController.uploadTemporaryPermitDocument)

// POST upload KYC Document image/PDF (base64, max 12MB)
router.post('/kyc-document', uploadController.uploadKycDocument)

module.exports = router
