const fs = require('fs')
const path = require('path')
const { logError, getUserFriendlyError } = require('../utils/errorLogger')
const VehicleRegistration = require('../models/VehicleRegistration')
const sharp = require('sharp')

// Ensure uploads directories exist
const uploadsDir = path.join(__dirname, '..', 'uploads', 'rc-images')
const insuranceUploadsDir = path.join(__dirname, '..', 'uploads', 'insurance-documents')
const temporaryPermitUploadsDir = path.join(__dirname, '..', 'uploads', 'temporary-permit-documents')
const speedGovernorUploadsDir = path.join(__dirname, '..', 'uploads', 'speed-governor-images')
const kycUploadsDir = path.join(__dirname, '..', 'uploads', 'kyc-documents')
const cgPermitUploadsDir = path.join(__dirname, '..', 'uploads', 'cg-permit-documents')
const busPermitUploadsDir = path.join(__dirname, '..', 'uploads', 'bus-permit-documents')
const npPartAUploadsDir = path.join(__dirname, '..', 'uploads', 'np-part-a-documents')
const npPartBUploadsDir = path.join(__dirname, '..', 'uploads', 'np-part-b-documents')

if (!fs.existsSync(kycUploadsDir)) {
  fs.mkdirSync(kycUploadsDir, { recursive: true })
}
if (!fs.existsSync(npPartAUploadsDir)) {
  fs.mkdirSync(npPartAUploadsDir, { recursive: true })
}
if (!fs.existsSync(npPartBUploadsDir)) {
  fs.mkdirSync(npPartBUploadsDir, { recursive: true })
}
if (!fs.existsSync(cgPermitUploadsDir)) {
  fs.mkdirSync(cgPermitUploadsDir, { recursive: true })
}
if (!fs.existsSync(busPermitUploadsDir)) {
  fs.mkdirSync(busPermitUploadsDir, { recursive: true })
}
if (!fs.existsSync(insuranceUploadsDir)) {
  fs.mkdirSync(insuranceUploadsDir, { recursive: true })
}
if (!fs.existsSync(temporaryPermitUploadsDir)) {
  fs.mkdirSync(temporaryPermitUploadsDir, { recursive: true })
}
if (!fs.existsSync(speedGovernorUploadsDir)) {
  fs.mkdirSync(speedGovernorUploadsDir, { recursive: true })
}
if (!fs.existsSync(kycUploadsDir)) {
  fs.mkdirSync(kycUploadsDir, { recursive: true })
}

// Helper function to delete old RC image file
const deleteOldRCImage = (imagePath) => {
  try {
    if (!imagePath) return

    const filename = path.basename(imagePath)
    const filePath = path.join(uploadsDir, filename)

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
      console.log(`Deleted old RC image: ${filename}`)
    }
  } catch (error) {
    console.error('Error deleting old RC image:', error)
    // Don't throw error, just log it
  }
}

// Upload RC Image (accepts base64 JPG, JPEG, PNG, WebP, PDF)
// Only 1 image per vehicle registration - replaces old image if exists
exports.uploadRCImage = async (req, res) => {
  try {
    const { imageData, vehicleRegistrationId, vehicleNumber } = req.body

    if (!imageData) {
      return res.status(400).json({
        success: false,
        message: 'Image data is required'
      })
    }

    if (!vehicleNumber) {
      return res.status(400).json({
        success: false,
        message: 'Vehicle registration number is required'
      })
    }

    // If vehicleRegistrationId provided, check for existing image and delete it
    if (vehicleRegistrationId) {
      const existingVehicle = await VehicleRegistration.findOne({
        _id: vehicleRegistrationId,
        userId: req.user.id
      })

      if (existingVehicle && existingVehicle.rcImage) {
        // Delete old RC image file
        deleteOldRCImage(existingVehicle.rcImage)
      }
    }

    // Validate base64 format - accept multiple image formats and PDF
    const imageFormatRegex = /^data:image\/(jpeg|jpg|png|webp);base64,/
    const pdfFormatRegex = /^data:application\/pdf;base64,/

    let fileFormat = null
    let fileExtension = null

    const imageMatch = imageData.match(imageFormatRegex)
    const pdfMatch = imageData.match(pdfFormatRegex)

    if (imageMatch) {
      fileFormat = imageMatch[1]
      fileExtension = fileFormat === 'jpeg' ? 'jpg' : fileFormat
    } else if (pdfMatch) {
      fileFormat = 'pdf'
      fileExtension = 'pdf'
    } else {
      return res.status(400).json({
        success: false,
        message: 'Only JPG, JPEG, PNG, WebP and PDF formats are accepted'
      })
    }

    // Extract base64 data
    const base64Data = imageData.replace(/^data:(image\/[a-z]+|application\/pdf);base64,/, '')
    const buffer = Buffer.from(base64Data, 'base64')

    // Check file size (12MB limit)
    const fileSizeInMB = buffer.length / (1024 * 1024)
    if (fileSizeInMB > 12) {
      return res.status(400).json({
        success: false,
        message: `File size (${fileSizeInMB.toFixed(2)}MB) exceeds the 12MB limit`
      })
    }

    // Generate filename with vehicle number
    // Format: rc-VEHICLENUMBER.extension
    const sanitizedVehicleNumber = vehicleNumber.replace(/[^a-zA-Z0-9]/g, '')
    const filename = `rc-${sanitizedVehicleNumber}-${Date.now()}.${fileExtension}`
    const filePath = path.join(uploadsDir, filename)

    // Save file to disk
    fs.writeFileSync(filePath, buffer)

    // Return the relative path
    const relativePath = `/uploads/rc-images/${filename}`

    res.status(200).json({
      success: true,
      message: 'RC document uploaded successfully (only 1 document allowed per vehicle)',
      data: {
        filename,
        path: relativePath,
        size: buffer.length,
        sizeInMB: (buffer.length / (1024 * 1024)).toFixed(2),
        format: fileFormat.toUpperCase()
      }
    })
  } catch (error) {
    logError(error, req)
    const userError = getUserFriendlyError(error)
    res.status(500).json({
      success: false,
      message: userError.message,
      errors: userError.details,
      errorCount: userError.errorCount,
      timestamp: new Date().toISOString()
    })
  }
}

// Upload RC Back Image
exports.uploadRCBackImage = async (req, res) => {
  try {
    const { imageData, vehicleRegistrationId, vehicleNumber } = req.body

    if (!imageData) {
      return res.status(400).json({
        success: false,
        message: 'Image data is required'
      })
    }

    if (!vehicleNumber) {
      return res.status(400).json({
        success: false,
        message: 'Vehicle registration number is required'
      })
    }

    if (vehicleRegistrationId) {
      const existingVehicle = await VehicleRegistration.findOne({
        _id: vehicleRegistrationId,
        userId: req.user.id
      })

      if (existingVehicle && existingVehicle.rcBackImage) {
        deleteOldRCImage(existingVehicle.rcBackImage)
      }
    }

    const imageFormatRegex = /^data:image\/(jpeg|jpg|png|webp);base64,/
    const pdfFormatRegex = /^data:application\/pdf;base64,/

    let fileFormat = null
    let fileExtension = null

    const imageMatch = imageData.match(imageFormatRegex)
    const pdfMatch = imageData.match(pdfFormatRegex)

    if (imageMatch) {
      fileFormat = imageMatch[1]
      fileExtension = fileFormat === 'jpeg' ? 'jpg' : fileFormat
    } else if (pdfMatch) {
      fileFormat = 'pdf'
      fileExtension = 'pdf'
    } else {
      return res.status(400).json({
        success: false,
        message: 'Only JPG, JPEG, PNG, WebP and PDF formats are accepted'
      })
    }

    const base64Data = imageData.replace(/^data:(image\/[a-z]+|application\/pdf);base64,/, '')
    const buffer = Buffer.from(base64Data, 'base64')

    const fileSizeInMB = buffer.length / (1024 * 1024)
    if (fileSizeInMB > 12) {
      return res.status(400).json({
        success: false,
        message: `File size (${fileSizeInMB.toFixed(2)}MB) exceeds the 12MB limit`
      })
    }

    const sanitizedVehicleNumber = vehicleNumber.replace(/[^a-zA-Z0-9]/g, '')
    const filename = `rc-back-${sanitizedVehicleNumber}-${Date.now()}.${fileExtension}`
    const filePath = path.join(uploadsDir, filename)

    fs.writeFileSync(filePath, buffer)

    const relativePath = `/uploads/rc-images/${filename}`

    res.status(200).json({
      success: true,
      message: 'RC Back document uploaded successfully',
      data: {
        filename,
        path: relativePath,
        size: buffer.length,
        sizeInMB: (buffer.length / (1024 * 1024)).toFixed(2),
        format: fileFormat.toUpperCase()
      }
    })
  } catch (error) {
    logError(error, req)
    const userError = getUserFriendlyError(error)
    res.status(500).json({
      success: false,
      message: userError.message,
      errors: userError.details,
      errorCount: userError.errorCount,
      timestamp: new Date().toISOString()
    })
  }
}

// Delete RC Image
exports.deleteRCImage = async (req, res) => {
  try {
    const { imagePath } = req.body

    if (!imagePath) {
      return res.status(400).json({
        success: false,
        message: 'Image path is required'
      })
    }

    // Extract filename from path
    const filename = path.basename(imagePath)
    const filePath = path.join(uploadsDir, filename)

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'Image file not found'
      })
    }

    // Verify file belongs to current user (filename contains userId)
    if (!filename.includes(`rc-${req.user.id}-`)) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to delete this image'
      })
    }

    // Delete file
    fs.unlinkSync(filePath)

    res.status(200).json({
      success: true,
      message: 'RC image deleted successfully'
    })
  } catch (error) {
    logError(error, req)
    const userError = getUserFriendlyError(error)
    res.status(500).json({
      success: false,
      message: userError.message,
      errors: userError.details,
      errorCount: userError.errorCount,
      timestamp: new Date().toISOString()
    })
  }
}

exports.uploadSpeedGovernorImage = async (req, res) => {
  try {
    const { imageData, vehicleRegistrationId, vehicleNumber } = req.body

    if (!imageData) {
      return res.status(400).json({
        success: false,
        message: 'Document data is required'
      })
    }

    if (!vehicleNumber) {
      return res.status(400).json({
        success: false,
        message: 'Vehicle registration number is required'
      })
    }

    // If vehicleRegistrationId provided, check for existing document and delete it
    if (vehicleRegistrationId) {
      const existingVehicle = await VehicleRegistration.findOne({
        _id: vehicleRegistrationId,
        userId: req.user.id
      })

      if (existingVehicle && existingVehicle.speedGovernorImage) {
        // Delete old Speed Governor document
        try {
          const filename = path.basename(existingVehicle.speedGovernorImage)
          const filePath = path.join(speedGovernorUploadsDir, filename)
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath)
          }
        } catch (err) {
          console.error('Error deleting old Speed Governor image:', err)
        }
      }
    }

    // Validate base64 format
    const imageFormatRegex = /^data:image\/(jpeg|jpg|png|webp);base64,/
    const pdfFormatRegex = /^data:application\/pdf;base64,/

    let fileFormat = null
    let fileExtension = null

    const imageMatch = imageData.match(imageFormatRegex)
    const pdfMatch = imageData.match(pdfFormatRegex)

    if (imageMatch) {
      fileFormat = imageMatch[1]
      fileExtension = fileFormat === 'jpeg' ? 'jpg' : fileFormat
    } else if (pdfMatch) {
      fileFormat = 'pdf'
      fileExtension = 'pdf'
    } else {
      return res.status(400).json({
        success: false,
        message: 'Only JPG, JPEG, PNG, WebP, and PDF formats are accepted'
      })
    }

    const base64Data = imageData.replace(/^data:(image\/[a-z]+|application\/pdf);base64,/, '')
    const buffer = Buffer.from(base64Data, 'base64')

    const fileSizeInMB = buffer.length / (1024 * 1024)
    if (fileSizeInMB > 12) {
      return res.status(400).json({
        success: false,
        message: `File size (${fileSizeInMB.toFixed(2)}MB) exceeds the 12MB limit`
      })
    }

    // Generate unique filename with vehicle number and timestamp
    // Format: speed-governor-VEHICLENUMBER-TIMESTAMP.extension
    const sanitizedVehicleNumber = vehicleNumber.replace(/[^a-zA-Z0-9]/g, '')
    const filename = `speed-governor-${sanitizedVehicleNumber}-${Date.now()}.${fileExtension}`
    const filePath = path.join(speedGovernorUploadsDir, filename)

    fs.writeFileSync(filePath, buffer)

    const relativePath = `/uploads/speed-governor-images/${filename}`

    res.status(200).json({
      success: true,
      message: 'Speed Governor document uploaded successfully',
      data: {
        filename,
        path: relativePath,
        size: buffer.length,
        sizeInMB: fileSizeInMB.toFixed(2),
        format: fileFormat.toUpperCase()
      }
    })
  } catch (error) {
    logError(error, req)
    const userError = getUserFriendlyError(error)
    res.status(500).json({
      success: false,
      message: userError.message,
      errors: userError.details,
      errorCount: userError.errorCount,
      timestamp: new Date().toISOString()
    })
  }
}

// Upload Insurance Document Image/PDF
exports.uploadInsuranceDocument = async (req, res) => {
  try {
    const { imageData, insuranceId, vehicleNumber } = req.body
		
    if (!imageData) {
      return res.status(400).json({
        success: false,
        message: 'Document data is required'
      })
    }

    if (!vehicleNumber) {
      return res.status(400).json({
        success: false,
        message: 'Vehicle registration number is required'
      })
    }

    // If insuranceId provided, check for existing document and delete it
    if (insuranceId) {
      const Insurance = require('../models/Insurance')
      const existingInsurance = await Insurance.findOne({
        _id: insuranceId,
        userId: req.user.id
      })

      if (existingInsurance && existingInsurance.insuranceDocument) {
        // Delete old insurance document
        try {
          const filename = path.basename(existingInsurance.insuranceDocument)
          const filePath = path.join(insuranceUploadsDir, filename)
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath)
          }
        } catch (err) {
          console.error('Error deleting old insurance document:', err)
        }
      }
    }

    // Validate base64 format
    const imageFormatRegex = /^data:image\/(jpeg|jpg|png|webp);base64,/
    const pdfFormatRegex = /^data:application\/pdf;base64,/

    let fileFormat = null
    let fileExtension = null

    const imageMatch = imageData.match(imageFormatRegex)
    const pdfMatch = imageData.match(pdfFormatRegex)

    if (imageMatch) {
      fileFormat = imageMatch[1]
      fileExtension = fileFormat === 'jpeg' ? 'jpg' : fileFormat
    } else if (pdfMatch) {
      fileFormat = 'pdf'
      fileExtension = 'pdf'
    } else {
      return res.status(400).json({
        success: false,
        message: 'Only JPG, JPEG, PNG, WebP, and PDF formats are accepted'
      })
    }

    const base64Data = imageData.replace(/^data:(image\/[a-z]+|application\/pdf);base64,/, '')
    const buffer = Buffer.from(base64Data, 'base64')

    const fileSizeInMB = buffer.length / (1024 * 1024)
    if (fileSizeInMB > 12) {
      return res.status(400).json({
        success: false,
        message: `File size (${fileSizeInMB.toFixed(2)}MB) exceeds the 12MB limit`
      })
    }

    // Generate unique filename with vehicle number and timestamp
    // Format: insurance-VEHICLENUMBER-TIMESTAMP.extension
    const sanitizedVehicleNumber = vehicleNumber.replace(/[^a-zA-Z0-9]/g, '')
    const filename = `insurance-${sanitizedVehicleNumber}-${Date.now()}.${fileExtension}`
    const filePath = path.join(insuranceUploadsDir, filename)

    fs.writeFileSync(filePath, buffer)

    const relativePath = `/uploads/insurance-documents/${filename}`

    res.status(200).json({
      success: true,
      message: 'Insurance document uploaded successfully',
      data: {
        filename,
        path: relativePath,
        size: buffer.length,
        sizeInMB: fileSizeInMB.toFixed(2),
        format: fileFormat.toUpperCase()
      }
    })
  } catch (error) {
    logError(error, req)
    const userError = getUserFriendlyError(error)
    res.status(500).json({
      success: false,
      message: userError.message,
      errors: userError.details,
      errorCount: userError.errorCount,
      timestamp: new Date().toISOString()
    })
  }
}

// Upload Temporary Permit Document (accepts base64 image or PDF)
exports.uploadTemporaryPermitDocument = async (req, res) => {
  try {
    const { imageData, temporaryPermitId, vehicleNumber } = req.body

    if (!imageData) {
      return res.status(400).json({
        success: false,
        message: 'Document data is required'
      })
    }

    if (!vehicleNumber) {
      return res.status(400).json({
        success: false,
        message: 'Vehicle registration number is required'
      })
    }

    // If temporaryPermitId provided, check for existing document and delete it
    if (temporaryPermitId) {
      const TemporaryPermit = require('../models/TemporaryPermit')
      const existingPermit = await TemporaryPermit.findOne({
        _id: temporaryPermitId,
        userId: req.user.id
      })

      if (existingPermit && existingPermit.temporaryPermitDocument) {
        try {
          const filename = path.basename(existingPermit.temporaryPermitDocument)
          const filePath = path.join(temporaryPermitUploadsDir, filename)
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath)
          }
        } catch (err) {
          console.error('Error deleting old temporary permit document:', err)
        }
      }
    }

    // Validate base64 format
    const imageFormatRegex = /^data:image\/(jpeg|jpg|png|webp);base64,/
    const pdfFormatRegex = /^data:application\/pdf;base64,/

    let fileFormat = null
    let fileExtension = null

    const imageMatch = imageData.match(imageFormatRegex)
    const pdfMatch = imageData.match(pdfFormatRegex)

    if (imageMatch) {
      fileFormat = imageMatch[1]
      fileExtension = fileFormat === 'jpeg' ? 'jpg' : fileFormat
    } else if (pdfMatch) {
      fileFormat = 'pdf'
      fileExtension = 'pdf'
    } else {
      return res.status(400).json({
        success: false,
        message: 'Only JPG, JPEG, PNG, WebP, and PDF formats are accepted'
      })
    }

    const base64Data = imageData.replace(/^data:(image\/[a-z]+|application\/pdf);base64,/, '')
    const buffer = Buffer.from(base64Data, 'base64')

    const fileSizeInMB = buffer.length / (1024 * 1024)
    if (fileSizeInMB > 12) {
      return res.status(400).json({
        success: false,
        message: `File size (${fileSizeInMB.toFixed(2)}MB) exceeds the 12MB limit`
      })
    }

    // Generate filename with vehicle number
    const sanitizedVehicleNumber = vehicleNumber.replace(/[^a-zA-Z0-9]/g, '')
    const filename = `temp-permit-${sanitizedVehicleNumber}-${Date.now()}.${fileExtension}`
    const filePath = path.join(temporaryPermitUploadsDir, filename)

    fs.writeFileSync(filePath, buffer)

    const relativePath = `/uploads/temporary-permit-documents/${filename}`

    res.status(200).json({
      success: true,
      message: 'Temporary permit document uploaded successfully',
      data: {
        filename,
        path: relativePath,
        size: buffer.length,
        sizeInMB: fileSizeInMB.toFixed(2),
        format: fileFormat.toUpperCase()
      }
    })
  } catch (error) {
    logError(error, req)
    const userError = getUserFriendlyError(error)
    res.status(500).json({
      success: false,
      message: userError.message,
      errors: userError.details,
      errorCount: userError.errorCount,
      timestamp: new Date().toISOString()
    })
  }
}

// Upload CG Permit Document (accepts base64 image/PDF)
exports.uploadCgPermitDocument = async (req, res) => {
  try {
    const { imageData, permitId, vehicleNumber } = req.body

    if (!imageData) {
      return res.status(400).json({
        success: false,
        message: 'Document data is required'
      })
    }

    if (!vehicleNumber) {
      return res.status(400).json({
        success: false,
        message: 'Vehicle registration number is required'
      })
    }

    // If permitId provided, check for existing document and delete it
    if (permitId) {
      const CgPermit = require('../models/CgPermit')
      const existingPermit = await CgPermit.findOne({
        _id: permitId,
        userId: req.user.id
      })

      if (existingPermit && existingPermit.documents?.permitDocument) {
        try {
          const filename = path.basename(existingPermit.documents.permitDocument)
          const filePath = path.join(cgPermitUploadsDir, filename)
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath)
          }
        } catch (err) {
          console.error('Error deleting old CG permit document:', err)
        }
      }
    }

    // Validate base64 format
    const imageFormatRegex = /^data:image\/(jpeg|jpg|png|webp|avif);base64,/
    const pdfFormatRegex = /^data:application\/pdf;base64,/

    let fileFormat = null
    let fileExtension = null

    const imageMatch = imageData.match(imageFormatRegex)
    const pdfMatch = imageData.match(pdfFormatRegex)

    if (imageMatch) {
      fileFormat = imageMatch[1] === 'jpeg' ? 'jpg' : imageMatch[1]
      fileExtension = fileFormat
    } else if (pdfMatch) {
      fileFormat = 'pdf'
      fileExtension = 'pdf'
    } else {
      return res.status(400).json({
        success: false,
        message: 'Only JPG, JPEG, PNG, WebP, AVIF and PDF formats are accepted'
      })
    }

    const base64Data = imageData.replace(/^data:(image\/[a-z]+|application\/pdf);base64,/, '')
    const buffer = Buffer.from(base64Data, 'base64')

    const fileSizeInMB = buffer.length / (1024 * 1024)
    if (fileSizeInMB > 12) {
      return res.status(400).json({
        success: false,
        message: `File size (${fileSizeInMB.toFixed(2)}MB) exceeds the 12MB limit`
      })
    }

    // Generate filename with vehicle number
    const sanitizedVehicleNumber = vehicleNumber.replace(/[^a-zA-Z0-9]/g, '')
    const filename = `cg-permit-${sanitizedVehicleNumber}-${Date.now()}.${fileExtension}`
    const filePath = path.join(cgPermitUploadsDir, filename)

    fs.writeFileSync(filePath, buffer)

    const relativePath = `/uploads/cg-permit-documents/${filename}`

    res.status(200).json({
      success: true,
      message: 'CG permit document uploaded successfully',
      data: {
        filename,
        path: relativePath,
        size: buffer.length,
        sizeInMB: fileSizeInMB.toFixed(2),
        format: fileFormat.toUpperCase()
      }
    })
  } catch (error) {
    logError(error, req)
    const userError = getUserFriendlyError(error)
    res.status(500).json({
      success: false,
      message: userError.message,
      errors: userError.details,
      errorCount: userError.errorCount,
      timestamp: new Date().toISOString()
    })
  }
}

// Upload Bus Permit Document (accepts base64 image/PDF)
exports.uploadBusPermitDocument = async (req, res) => {
  try {
    const { imageData, permitId, vehicleNumber } = req.body

    if (!imageData) {
      return res.status(400).json({
        success: false,
        message: 'Document data is required'
      })
    }

    if (!vehicleNumber) {
      return res.status(400).json({
        success: false,
        message: 'Vehicle registration number is required'
      })
    }

    // If permitId provided, check for existing document and delete it
    if (permitId) {
      const BusPermit = require('../models/BusPermit')
      const existingPermit = await BusPermit.findOne({
        _id: permitId,
        userId: req.user.id
      })

      if (existingPermit && existingPermit.documents?.permitDocument) {
        try {
          const filename = path.basename(existingPermit.documents.permitDocument)
          const filePath = path.join(busPermitUploadsDir, filename)
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath)
          }
        } catch (err) {
          console.error('Error deleting old Bus permit document:', err)
        }
      }
    }

    // Validate base64 format
    const imageFormatRegex = /^data:image\/(jpeg|jpg|png|webp|avif);base64,/
    const pdfFormatRegex = /^data:application\/pdf;base64,/

    let fileFormat = null
    let fileExtension = null

    const imageMatch = imageData.match(imageFormatRegex)
    const pdfMatch = imageData.match(pdfFormatRegex)

    if (imageMatch) {
      fileFormat = imageMatch[1] === 'jpeg' ? 'jpg' : imageMatch[1]
      fileExtension = fileFormat
    } else if (pdfMatch) {
      fileFormat = 'pdf'
      fileExtension = 'pdf'
    } else {
      return res.status(400).json({
        success: false,
        message: 'Only JPG, JPEG, PNG, WebP, AVIF and PDF formats are accepted'
      })
    }

    const base64Data = imageData.replace(/^data:(image\/[a-z]+|application\/pdf);base64,/, '')
    const buffer = Buffer.from(base64Data, 'base64')

    const fileSizeInMB = buffer.length / (1024 * 1024)
    if (fileSizeInMB > 12) {
      return res.status(400).json({
        success: false,
        message: `File size (${fileSizeInMB.toFixed(2)}MB) exceeds the 12MB limit`
      })
    }

    // Generate filename with vehicle number
    const sanitizedVehicleNumber = vehicleNumber.replace(/[^a-zA-Z0-9]/g, '')
    const filename = `bus-permit-${sanitizedVehicleNumber}-${Date.now()}.${fileExtension}`
    const filePath = path.join(busPermitUploadsDir, filename)

    fs.writeFileSync(filePath, buffer)

    const relativePath = `/uploads/bus-permit-documents/${filename}`

    res.status(200).json({
      success: true,
      message: 'Bus permit document uploaded successfully',
      data: {
        filename,
        path: relativePath,
        size: buffer.length,
        sizeInMB: fileSizeInMB.toFixed(2),
        format: fileFormat.toUpperCase()
      }
    })
  } catch (error) {
    logError(error, req)
    const userError = getUserFriendlyError(error)
    res.status(500).json({
      success: false,
      message: userError.message,
      errors: userError.details,
      errorCount: userError.errorCount,
      timestamp: new Date().toISOString()
    })
  }
}

// ========== NATIONAL PERMIT DOCUMENT UPLOADS ==========

// Helper for NP document upload (Part A or Part B)
const uploadNpDocument = async (req, res, docType) => {
  try {
    const { imageData, permitId, vehicleNumber } = req.body

    if (!imageData) {
      return res.status(400).json({
        success: false,
        message: 'Document data is required'
      })
    }

    if (!vehicleNumber) {
      return res.status(400).json({
        success: false,
        message: 'Vehicle number is required'
      })
    }

    const targetDir = docType === 'partA' ? npPartAUploadsDir : npPartBUploadsDir
    const docLabel = docType === 'partA' ? 'Part A' : 'Part B'

    // If permitId provided, check for existing document and delete it
    if (permitId) {
      const NationalPermit = require('../models/NationalPermit')
      const existingPermit = await NationalPermit.findOne({
        _id: permitId,
        userId: req.user.id
      })

      const existingDocField = docType === 'partA' ? 'partADocument' : 'partBDocument'
      if (existingPermit && existingPermit[existingDocField]) {
        try {
          const filename = path.basename(existingPermit[existingDocField])
          const filePath = path.join(targetDir, filename)
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath)
          }
        } catch (err) {
          console.error(`Error deleting old NP ${docLabel} document:`, err)
        }
      }
    }

    // Validate base64 format
    const imageFormatRegex = /^data:image\/(jpeg|jpg|png|webp|avif);base64,/
    const pdfFormatRegex = /^data:application\/pdf;base64,/

    let fileFormat = null
    let fileExtension = null

    const imageMatch = imageData.match(imageFormatRegex)
    const pdfMatch = imageData.match(pdfFormatRegex)

    if (imageMatch) {
      fileFormat = imageMatch[1] === 'jpeg' ? 'jpg' : imageMatch[1]
      fileExtension = fileFormat
    } else if (pdfMatch) {
      fileFormat = 'pdf'
      fileExtension = 'pdf'
    } else {
      return res.status(400).json({
        success: false,
        message: 'Only JPG, JPEG, PNG, WebP, AVIF and PDF formats are accepted'
      })
    }

    const base64Data = imageData.replace(/^data:(image\/[a-z]+|application\/pdf);base64,/, '')
    const buffer = Buffer.from(base64Data, 'base64')

    const fileSizeInMB = buffer.length / (1024 * 1024)
    if (fileSizeInMB > 12) {
      return res.status(400).json({
        success: false,
        message: `File size (${fileSizeInMB.toFixed(2)}MB) exceeds the 12MB limit`
      })
    }

    // Generate filename
    const sanitizedVehicleNumber = vehicleNumber.replace(/[^a-zA-Z0-9]/g, '')
    const prefix = docType === 'partA' ? 'np-part-a' : 'np-part-b'
    const filename = `${prefix}-${sanitizedVehicleNumber}-${Date.now()}.${fileExtension}`
    const filePath = path.join(targetDir, filename)

    fs.writeFileSync(filePath, buffer)

    const relativePath = `/uploads/${docType === 'partA' ? 'np-part-a-documents' : 'np-part-b-documents'}/${filename}`

    res.status(200).json({
      success: true,
      message: `NP ${docLabel} document uploaded successfully`,
      data: {
        filename,
        path: relativePath,
        size: buffer.length,
        sizeInMB: fileSizeInMB.toFixed(2),
        format: fileFormat.toUpperCase()
      }
    })
  } catch (error) {
    logError(error, req)
    const userError = getUserFriendlyError(error)
    res.status(500).json({
      success: false,
      message: userError.message,
      errors: userError.details,
      errorCount: userError.errorCount,
      timestamp: new Date().toISOString()
    })
  }
}

// Upload NP Part A Document
exports.uploadNationalPermitPartADocument = async (req, res) => {
  return uploadNpDocument(req, res, 'partA')
}

// Upload NP Part B Document
exports.uploadNationalPermitPartBDocument = async (req, res) => {
  return uploadNpDocument(req, res, 'partB')
}

// Upload KYC Document (accepts base64 image/PDF)
exports.uploadKycDocument = async (req, res) => {
  try {
    const { imageData, clientName, documentType, side } = req.body

    if (!imageData) {
      return res.status(400).json({
        success: false,
        message: 'Document/Image data is required'
      })
    }

    if (!clientName) {
      return res.status(400).json({
        success: false,
        message: 'Client name is required'
      })
    }

    // Validate base64 format
    const imageFormatRegex = /^data:image\/(jpeg|jpg|png|webp|avif);base64,/
    const pdfFormatRegex = /^data:application\/pdf;base64,/

    let fileFormat = null
    let fileExtension = null

    const imageMatch = imageData.match(imageFormatRegex)
    const pdfMatch = imageData.match(pdfFormatRegex)

    if (imageMatch) {
      fileFormat = 'avif' // we can save as avif to optimize size
      fileExtension = 'avif'
    } else if (pdfMatch) {
      fileFormat = 'pdf'
      fileExtension = 'pdf'
    } else {
      return res.status(400).json({
        success: false,
        message: 'Only JPG, JPEG, PNG, WebP, AVIF and PDF formats are accepted'
      })
    }

    const base64Data = imageData.replace(/^data:(image\/[a-z]+|application\/pdf);base64,/, '')
    const buffer = Buffer.from(base64Data, 'base64')

    let finalBuffer = buffer
    const fileSizeInMB = finalBuffer.length / (1024 * 1024)
    if (fileSizeInMB > 12) {
      return res.status(400).json({
        success: false,
        message: `File size (${fileSizeInMB.toFixed(2)}MB) exceeds the 12MB limit`
      })
    }

    if (imageMatch) {
      try {
        finalBuffer = await sharp(buffer)
          .avif({ quality: 60 })
          .toBuffer()
      } catch (sharpErr) {
        console.error('Sharp AVIF conversion error:', sharpErr)
        fileFormat = imageMatch[1] === 'jpeg' ? 'jpg' : imageMatch[1]
        fileExtension = fileFormat
      }
    }

    // Generate clean filename
    const sanitizedClientName = clientName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()
    const docPrefix = documentType ? documentType.toLowerCase() : 'kyc'
    const sideSuffix = side ? `-${side}` : ''
    const filename = `${docPrefix}-${sanitizedClientName}${sideSuffix}-${Date.now()}.${fileExtension}`
    const filePath = path.join(kycUploadsDir, filename)

    // Save to disk
    fs.writeFileSync(filePath, finalBuffer)

    const relativePath = `/uploads/kyc-documents/${filename}`

    res.status(200).json({
      success: true,
      message: 'KYC Document uploaded successfully',
      data: {
        filename,
        path: relativePath,
        size: finalBuffer.length,
        sizeInMB: (finalBuffer.length / (1024 * 1024)).toFixed(2),
        format: fileFormat.toUpperCase()
      }
    })
  } catch (error) {
    logError(error, req)
    const userError = getUserFriendlyError(error)
    res.status(500).json({
      success: false,
      message: userError.message,
      errors: userError.details,
      errorCount: userError.errorCount,
      timestamp: new Date().toISOString()
    })
  }
}

