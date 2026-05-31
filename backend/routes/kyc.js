const express = require('express')
const router = express.Router()
const kycController = require('../controllers/kycController')

// GET all KYC documents
router.get('/', kycController.getAllKyc)

// GET single KYC document by ID
router.get('/:id', kycController.getKycById)

// POST create a new KYC document
router.post('/', kycController.createKyc)

// PUT update a KYC document
router.put('/:id', kycController.updateKyc)

// DELETE a KYC document
router.delete('/:id', kycController.deleteKyc)

module.exports = router
