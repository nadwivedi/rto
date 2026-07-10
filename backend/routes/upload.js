const express = require('express')
const router = express.Router()
const uploadController = require('../controllers/uploadController')

// POST upload RC image/PDF (base64, max 12MB)
router.post('/rc-image', uploadController.uploadRCImage)
router.post('/rc-back-image', uploadController.uploadRCBackImage)

// DELETE RC image
router.delete('/rc-image', uploadController.deleteRCImage)

// POST upload Speed Governor image/PDF (base64, max 12MB)
router.post('/speed-governor-image', uploadController.uploadSpeedGovernorImage)

// POST upload Insurance Document image/PDF (base64, max 12MB)
router.post('/insurance-document', uploadController.uploadInsuranceDocument)

// POST upload Temporary Permit Document image/PDF (base64, max 12MB)
router.post('/temporary-permit-document', uploadController.uploadTemporaryPermitDocument)

// POST upload KYC Document image/PDF (base64, max 12MB)
router.post('/kyc-document', uploadController.uploadKycDocument)

// POST upload CG Permit Document image/PDF (base64, max 12MB)
router.post('/cg-permit-document', uploadController.uploadCgPermitDocument)

// POST upload Bus Permit Document image/PDF (base64, max 12MB)
router.post('/bus-permit-document', uploadController.uploadBusPermitDocument)

// POST upload National Permit Part A Document image/PDF (base64, max 12MB)
router.post('/np-part-a-document', uploadController.uploadNationalPermitPartADocument)

// POST upload National Permit Part B Document image/PDF (base64, max 12MB)
router.post('/np-part-b-document', uploadController.uploadNationalPermitPartBDocument)

// POST upload Additional Vehicle Document (base64, max 12MB)
router.post('/additional-document', uploadController.uploadAdditionalDocument)

// POST upload Green Tax Document (base64, max 12MB)
router.post('/green-tax-document', uploadController.uploadGreenTaxDocument)

module.exports = router
