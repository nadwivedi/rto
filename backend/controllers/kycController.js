const Kyc = require('../models/Kyc')
const { logError, getUserFriendlyError } = require('../utils/errorLogger')

// Get all KYC documents with search, pagination and filtering
exports.getAllKyc = async (req, res) => {
  try {
    const { search, documentType, page = 1, limit = 10 } = req.query
    const query = { userId: req.user.id }

    if (documentType && ['Aadhar', 'PAN', 'GST', 'Other'].includes(documentType)) {
      query.documentType = documentType
    }

    if (search) {
      query.$or = [
        { clientName: { $regex: search, $options: 'i' } },
        { documentNumber: { $regex: search, $options: 'i' } }
      ]
    }

    const totalRecords = await Kyc.countDocuments(query)
    const records = await Kyc.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))

    res.status(200).json({
      success: true,
      data: records,
      pagination: {
        totalRecords,
        currentPage: Number(page),
        totalPages: Math.ceil(totalRecords / limit),
        limit: Number(limit)
      }
    })
  } catch (error) {
    logError(error, req)
    const userError = getUserFriendlyError(error)
    res.status(500).json({
      success: false,
      message: userError.message,
      errors: userError.details,
      errorCount: userError.errorCount
    })
  }
}

// Get single KYC document by ID
exports.getKycById = async (req, res) => {
  try {
    const kyc = await Kyc.findOne({ _id: req.params.id, userId: req.user.id })

    if (!kyc) {
      return res.status(404).json({
        success: false,
        message: 'KYC record not found'
      })
    }

    res.status(200).json({
      success: true,
      data: kyc
    })
  } catch (error) {
    logError(error, req)
    const userError = getUserFriendlyError(error)
    res.status(500).json({
      success: false,
      message: userError.message
    })
  }
}

// Create new KYC document
exports.createKyc = async (req, res) => {
  try {
    const { clientName, documentType, documentNumber, aadharFront, aadharBack, documentFile, remarks } = req.body

    if (!clientName || !documentType) {
      return res.status(400).json({
        success: false,
        message: 'Client Name and Document Type are required'
      })
    }

    const newKyc = new Kyc({
      userId: req.user.id,
      clientName,
      documentType,
      documentNumber,
      aadharFront,
      aadharBack,
      documentFile,
      remarks
    })

    await newKyc.save()

    res.status(201).json({
      success: true,
      message: 'KYC record created successfully',
      data: newKyc
    })
  } catch (error) {
    logError(error, req)
    const userError = getUserFriendlyError(error)
    res.status(500).json({
      success: false,
      message: userError.message,
      errors: userError.details
    })
  }
}

// Update KYC document
exports.updateKyc = async (req, res) => {
  try {
    const { clientName, documentType, documentNumber, aadharFront, aadharBack, documentFile, remarks } = req.body

    const kyc = await Kyc.findOne({ _id: req.params.id, userId: req.user.id })

    if (!kyc) {
      return res.status(404).json({
        success: false,
        message: 'KYC record not found'
      })
    }

    kyc.clientName = clientName || kyc.clientName
    kyc.documentType = documentType || kyc.documentType
    kyc.documentNumber = documentNumber !== undefined ? documentNumber : kyc.documentNumber
    kyc.aadharFront = aadharFront !== undefined ? aadharFront : kyc.aadharFront
    kyc.aadharBack = aadharBack !== undefined ? aadharBack : kyc.aadharBack
    kyc.documentFile = documentFile !== undefined ? documentFile : kyc.documentFile
    kyc.remarks = remarks !== undefined ? remarks : kyc.remarks

    await kyc.save()

    res.status(200).json({
      success: true,
      message: 'KYC record updated successfully',
      data: kyc
    })
  } catch (error) {
    logError(error, req)
    const userError = getUserFriendlyError(error)
    res.status(500).json({
      success: false,
      message: userError.message
    })
  }
}

// Delete KYC document
exports.deleteKyc = async (req, res) => {
  try {
    const kyc = await Kyc.findOneAndDelete({ _id: req.params.id, userId: req.user.id })

    if (!kyc) {
      return res.status(404).json({
        success: false,
        message: 'KYC record not found'
      })
    }

    // Try deleting physical files if they exist
    const fs = require('fs')
    const path = require('path')
    const filesToDelete = [kyc.aadharFront, kyc.aadharBack, kyc.documentFile].filter(Boolean)

    filesToDelete.forEach(fileUrl => {
      try {
        const filename = path.basename(fileUrl)
        const filePath = path.join(__dirname, '..', 'uploads', 'kyc-documents', filename)
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath)
        }
      } catch (err) {
        console.error('Error deleting physical file:', err)
      }
    })

    res.status(200).json({
      success: true,
      message: 'KYC record and associated documents deleted successfully'
    })
  } catch (error) {
    logError(error, req)
    const userError = getUserFriendlyError(error)
    res.status(500).json({
      success: false,
      message: userError.message
    })
  }
}
