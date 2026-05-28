const VehicleRegistration = require('../models/VehicleRegistration')
const Party = require('../models/Party')
const Fitness = require('../models/Fitness')
const Tax = require('../models/Tax')
const Insurance = require('../models/Insurance')
const Puc = require('../models/Puc')
const Gps = require('../models/Gps')
const CgPermit = require('../models/CgPermit')
const NationalPermit = require('../models/NationalPermit')
const BusPermit = require('../models/BusPermit')
const TemporaryPermit = require('../models/TemporaryPermit')
const TemporaryPermitOtherState = require('../models/TemporaryPermitOtherState')
const HpaHpt = require('../models/HpaHpt')
const Noc = require('../models/Noc')
const { logError, getUserFriendlyError } = require('../utils/errorLogger')

const parseYear = (val) => {
  if (val === undefined || val === null || val === '') return undefined;
  return String(val).trim();
};

const parseNumber = (val) => {
  if (val === undefined || val === null || val === '') return undefined;
  if (typeof val === 'number') return val;
  const cleaned = String(val).replace(/[^0-9.]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? undefined : parsed;
};


// Get all vehicle registrations
exports.getAllRegistrations = async (req, res) => {
  try {
    const { search, status, page = 1, limit = 20 } = req.query
    // Filter by logged-in user
    let query = { userId: req.user.id }

    if (search) {
      query.$or = [
        { registrationNumber: { $regex: search, $options: 'i' } },
        { ownerName: { $regex: search, $options: 'i' } },
        { chassisNumber: { $regex: search, $options: 'i' } },
        { engineNumber: { $regex: search, $options: 'i' } }
      ]
    }

    if (status) {
      query.status = status
    }

    // Calculate pagination
    const pageNum = parseInt(page, 10)
    const limitNum = parseInt(limit, 10)
    const skip = (pageNum - 1) * limitNum

    // Get total count for pagination
    const totalRecords = await VehicleRegistration.countDocuments(query)
    const totalPages = Math.ceil(totalRecords / limitNum)

    // Get paginated results with party details
    const registrations = await VehicleRegistration.find(query)
      .populate('partyId', 'partyName mobile email address')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean() // Convert to plain JavaScript objects for better performance

    // Fetch related fitness, tax, PUC, and insurance data for each vehicle
    const registrationsWithDetails = await Promise.all(
      registrations.map(async (registration) => {
        const vehicleNumber = registration.registrationNumber || registration.vehicleNumber

        // Fetch latest fitness record
        const latestFitness = await Fitness.findOne({
          vehicleNumber: vehicleNumber,
          userId: req.user.id
        })
          .sort({ createdAt: -1 })
          .lean()

        // Fetch latest tax record
        const latestTax = await Tax.findOne({
          vehicleNumber: vehicleNumber,
          userId: req.user.id
        })
          .sort({ createdAt: -1 })
          .lean()

        // Fetch latest insurance record
        const latestInsurance = await Insurance.findOne({
          vehicleNumber: vehicleNumber,
          userId: req.user.id
        })
          .sort({ createdAt: -1 })
          .lean()

        // Fetch latest PUC record
        const latestPuc = await Puc.findOne({
          vehicleNumber: vehicleNumber,
          userId: req.user.id
        })
          .sort({ createdAt: -1 })
          .lean()

        // Fetch latest GPS record
        const latestGps = await Gps.findOne({
          vehicleNumber: vehicleNumber,
          userId: req.user.id
        })
          .sort({ createdAt: -1 })
          .lean()

        // Fetch latest CG Permit record
        const latestCgPermit = await CgPermit.findOne({
          vehicleNumber: vehicleNumber,
          userId: req.user.id
        })
          .sort({ createdAt: -1 })
          .lean()

        // Fetch latest National Permit record
        const latestNationalPermit = await NationalPermit.findOne({
          vehicleNumber: vehicleNumber,
          userId: req.user.id
        })
          .sort({ createdAt: -1 })
          .lean()

        return {
          ...registration,
          fitness: latestFitness,
          tax: latestTax,
          insurance: latestInsurance,
          puc: latestPuc,
          gps: latestGps,
          cgPermit: latestCgPermit,
          nationalPermit: latestNationalPermit,
          speedGovernorImage: registration.speedGovernorImage // Include speedGovernorImage
        }
      })
    )

    res.json({
      success: true,
      count: registrationsWithDetails.length,
      data: registrationsWithDetails,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalRecords,
        limit: limitNum
      }
    })
  } catch (error) {
    logError(error, req) // Fire and forget
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

// Export all vehicle registrations without pagination
exports.exportAllRegistrations = async (req, res) => {
  try {
    // Get all registrations without pagination (only user's own data)
    const registrations = await VehicleRegistration.find({ userId: req.user.id })
      .populate('partyId', 'partyName mobile')
      .sort({ createdAt: -1 })

    res.json({
      success: true,
      data: registrations,
      total: registrations.length
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

// Get single vehicle registration by ID
exports.getRegistrationById = async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        ...registration.toObject(),
        speedGovernorImage: registration.speedGovernorImage
      }
    })
  } catch (error) {
    logError(error, req) // Fire and forget
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

// Get vehicle registration by registration number
exports.getRegistrationByNumber = async (req, res) => {
  try {
    const registration = await VehicleRegistration.findOne({
      registrationNumber: req.params.registrationNumber.toUpperCase(),
      userId: req.user.id
    }).populate('partyId', 'partyName mobile email address')

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle registration not found'
      })
    }

    res.json({
      success: true,
      data: {
        ...registration.toObject(),
        speedGovernorImage: registration.speedGovernorImage
      }
    })
  } catch (error) {
    logError(error, req) // Fire and forget
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

// Search vehicle registrations by flexible input (last 4 digits, series+digits, or full number)
exports.searchRegistrationByNumber = async (req, res) => {
  try {
    const searchInput = req.params.searchInput.toUpperCase()
    let registrations = []

    // Pattern 1: If input is exactly 10 characters (full vehicle number like CG12AA4793)
    if (searchInput.length === 10) {
      const exactMatch = await VehicleRegistration.findOne({
        registrationNumber: searchInput,
        userId: req.user.id
      }).populate('partyId', 'partyName mobile')
      if (exactMatch) {
        registrations = [exactMatch]
      }
    }

    // Pattern 2 & 3: If input is 4-6 characters (could be last 4 digits like "4793" or series like "AA4793")
    if (registrations.length === 0 && searchInput.length >= 4) {
      // Search for vehicle numbers that end with the input
      // This handles both "4793" and "AA4793" cases
      registrations = await VehicleRegistration.find({
        registrationNumber: { $regex: searchInput + '$', $options: 'i' },
        userId: req.user.id
      }).populate('partyId', 'partyName mobile').sort({ createdAt: -1 })
    }

    if (registrations.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No vehicles found matching the search criteria'
      })
    }

    res.json({
      success: true,
      count: registrations.length,
      data: registrations.length === 1 ? { ...registrations[0].toObject(), speedGovernorImage: registrations[0].speedGovernorImage } : registrations.map(reg => ({ ...reg.toObject(), speedGovernorImage: reg.speedGovernorImage })),
      multiple: registrations.length > 1
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

// Create new vehicle registration
exports.createRegistration = async (req, res) => {
  try {
    const {
      registrationNumber,
      dateOfRegistration,
      chassisNumber,
      engineNumber,
      ownerName,
      sonWifeDaughterOf,
      address,
      mobileNumber,
      email,
      makerName,
      makerModel,
      colour,
      seatingCapacity,
      vehicleClass,
      vehicleType,
      ladenWeight,
      unladenWeight,
      manufactureYear,
      vehicleCategory,
      numberOfCylinders,
      cubicCapacity,
      fuelType,
      bodyType,
      wheelBase,
      partyId
    } = req.body

    // Images are optional
    const rcImage = req.body.rcImage
    const rcBackImage = req.body.rcBackImage
    const aadharImage = req.body.aadharImage
    const panImage = req.body.panImage
    const speedGovernorImage = req.body.speedGovernorImage

    // Validate required fields
    if (!registrationNumber) {
      return res.status(400).json({
        success: false,
        message: 'Registration number is required'
      })
    }

    if (!chassisNumber) {
      return res.status(400).json({
        success: false,
        message: 'Chassis number is required'
      })
    }

    let party = null
    if (partyId) {
      party = await Party.findOne({
        _id: partyId,
        userId: req.user.id
      })
      if (!party) {
        return res.status(400).json({
          success: false,
          message: 'Selected party was not found'
        })
      }
    }

    // Create vehicle registration with userId
    // Build the registration object, only include rcImage if it's provided
    const registrationData = {
      userId: req.user.id,
      partyId: party ? party._id : undefined,
      registrationNumber,
      dateOfRegistration,
      chassisNumber,
      engineNumber,
      ownerName: party ? party.partyName : (ownerName || ''),
      sonWifeDaughterOf,
      address,
      mobileNumber,
      email,
      makerName,
      makerModel,
      colour,
      seatingCapacity: parseNumber(seatingCapacity),
      vehicleClass: vehicleClass || vehicleCategory,
      vehicleType,
      ladenWeight: parseNumber(ladenWeight),
      unladenWeight: parseNumber(unladenWeight),
      manufactureYear: parseYear(manufactureYear),
      vehicleCategory: vehicleCategory || vehicleClass,
      numberOfCylinders: parseNumber(numberOfCylinders),
      cubicCapacity: parseNumber(cubicCapacity),
      fuelType,
      bodyType,
      wheelBase: parseNumber(wheelBase)
    }

    // Only add images if they're provided (optional fields)
    if (rcImage) {
      registrationData.rcImage = rcImage
    }
    if (rcBackImage) {
      registrationData.rcBackImage = rcBackImage
    }
    if (aadharImage) {
      registrationData.aadharImage = aadharImage
    }
    if (panImage) {
      registrationData.panImage = panImage
    }
    if (speedGovernorImage) {
      registrationData.speedGovernorImage = speedGovernorImage
    }

    const registration = await VehicleRegistration.create(registrationData)

    res.status(201).json({
      success: true,
      message: 'Vehicle registered successfully',
      data: registration
    })
  } catch (error) {
    logError(error, req) // Fire and forget
    const userError = getUserFriendlyError(error)
    res.status(400).json({
      success: false,
      message: userError.message,
      errors: userError.details,
      errorCount: userError.errorCount,
      timestamp: new Date().toISOString()
    })
  }
}

// Update vehicle registration
exports.updateRegistration = async (req, res) => {
  try {
    const {
      registrationNumber,
      dateOfRegistration,
      chassisNumber,
      engineNumber,
      ownerName,
      sonWifeDaughterOf,
      address,
      mobileNumber,
      email,
      makerName,
      makerModel,
      colour,
      seatingCapacity,
      vehicleClass,
      vehicleType,
      ladenWeight,
      unladenWeight,
      manufactureYear,
      vehicleCategory,
      numberOfCylinders,
      cubicCapacity,
      fuelType,
      bodyType,
      wheelBase,
      partyId
    } = req.body

    // Images are optional
    const rcImage = req.body.rcImage
    const rcBackImage = req.body.rcBackImage
    const aadharImage = req.body.aadharImage
    const panImage = req.body.panImage
    const speedGovernorImage = req.body.speedGovernorImage

    const registration = await VehicleRegistration.findOne({
      _id: req.params.id,
      userId: req.user.id
    })

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle registration not found'
      })
    }

    // Update fields
    if (registrationNumber !== undefined) registration.registrationNumber = registrationNumber
    if (dateOfRegistration !== undefined) registration.dateOfRegistration = dateOfRegistration
    if (chassisNumber !== undefined) registration.chassisNumber = chassisNumber
    if (engineNumber !== undefined) registration.engineNumber = engineNumber
    if (sonWifeDaughterOf !== undefined) registration.sonWifeDaughterOf = sonWifeDaughterOf
    if (address !== undefined) registration.address = address
    if (mobileNumber !== undefined) registration.mobileNumber = mobileNumber
    if (email !== undefined) registration.email = email
    if (makerName !== undefined) registration.makerName = makerName
    if (makerModel !== undefined) registration.makerModel = makerModel
    if (colour !== undefined) registration.colour = colour
    if (seatingCapacity !== undefined) registration.seatingCapacity = parseNumber(seatingCapacity)
    if (vehicleClass !== undefined) {
      registration.vehicleClass = vehicleClass
      registration.vehicleCategory = vehicleClass
    }
    if (vehicleType !== undefined) registration.vehicleType = vehicleType
    if (ladenWeight !== undefined) registration.ladenWeight = parseNumber(ladenWeight)
    if (unladenWeight !== undefined) registration.unladenWeight = parseNumber(unladenWeight)
    if (manufactureYear !== undefined) registration.manufactureYear = parseYear(manufactureYear)
    if (vehicleCategory !== undefined) {
      registration.vehicleCategory = vehicleCategory
      registration.vehicleClass = vehicleCategory
    }
    if (numberOfCylinders !== undefined) registration.numberOfCylinders = parseNumber(numberOfCylinders)
    if (cubicCapacity !== undefined) registration.cubicCapacity = parseNumber(cubicCapacity)
    if (fuelType !== undefined) registration.fuelType = fuelType
    if (bodyType !== undefined) registration.bodyType = bodyType
    if (wheelBase !== undefined) registration.wheelBase = parseNumber(wheelBase)

    const finalPartyId = partyId !== undefined ? partyId : registration.partyId
    if (finalPartyId) {
      const party = await Party.findOne({
        _id: finalPartyId,
        userId: req.user.id
      })

      if (!party) {
        return res.status(400).json({
          success: false,
          message: 'Selected party was not found'
        })
      }

      registration.partyId = party._id
      registration.ownerName = party.partyName
    } else {
      registration.partyId = undefined
      if (ownerName !== undefined) registration.ownerName = ownerName
    }

    // Handle optional image fields - can be empty string to remove image
    if (rcImage !== undefined) {
      registration.rcImage = rcImage || undefined
    }
    if (rcBackImage !== undefined) {
      registration.rcBackImage = rcBackImage || undefined
    }
    if (aadharImage !== undefined) {
      registration.aadharImage = aadharImage || undefined
    }
    if (panImage !== undefined) {
      registration.panImage = panImage || undefined
    }
    if (speedGovernorImage !== undefined) {
      registration.speedGovernorImage = speedGovernorImage || undefined
    }

    await registration.save()

    res.json({
      success: true,
      message: 'Vehicle registration updated successfully',
      data: registration
    })
  } catch (error) {
    logError(error, req) // Fire and forget
    const userError = getUserFriendlyError(error)
    res.status(400).json({
      success: false,
      message: userError.message,
      errors: userError.details,
      errorCount: userError.errorCount,
      timestamp: new Date().toISOString()
    })
  }
}

// Delete vehicle registration
exports.deleteRegistration = async (req, res) => {
  try {
    const registration = await VehicleRegistration.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    })

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle registration not found'
      })
    }

    // Delete RC image file if exists
    if (registration.rcImage) {
      const fs = require('fs')
      const path = require('path')
      try {
        const filename = path.basename(registration.rcImage)
        const uploadsDir = path.join(__dirname, '..', 'uploads', 'rc-images')
        const filePath = path.join(uploadsDir, filename)
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath)
          console.log(`Deleted RC image: ${filename}`)
        }
      } catch (fileError) {
        console.error('Error deleting RC image file:', fileError)
        // Don't fail the deletion if file removal fails
      }
    }

    res.json({
      success: true,
      message: 'Vehicle registration deleted successfully'
    })
  } catch (error) {
    logError(error, req) // Fire and forget
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

// Update registration status
exports.updateRegistrationStatus = async (req, res) => {
  try {
    const { status } = req.body

    const registration = await VehicleRegistration.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { status },
      { new: true, runValidators: true }
    )

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle registration not found'
      })
    }

    res.json({
      success: true,
      message: 'Registration status updated successfully',
      data: registration
    })
  } catch (error) {
    logError(error, req) // Fire and forget
    const userError = getUserFriendlyError(error)
    res.status(400).json({
      success: false,
      message: userError.message,
      errors: userError.details,
      errorCount: userError.errorCount,
      timestamp: new Date().toISOString()
    })
  }
}

// Get statistics
exports.getStatistics = async (req, res) => {
  try {
    // Filter by logged-in user
    const total = await VehicleRegistration.countDocuments({ userId: req.user.id })
    const active = await VehicleRegistration.countDocuments({ status: 'Active', userId: req.user.id })
    const transferred = await VehicleRegistration.countDocuments({ status: 'Transferred', userId: req.user.id })
    const cancelled = await VehicleRegistration.countDocuments({ status: 'Cancelled', userId: req.user.id })

    res.json({
      success: true,
      data: {
        total,
        active,
        transferred,
        cancelled
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

// Get complete vehicle ledger - all work done across all services
exports.getVehicleLedger = async (req, res) => {
  try {
    const registrationNumber = req.params.registrationNumber.toUpperCase()
    const userId = req.user.id

    // Query all services in parallel
    const [
      fitnessRecords,
      taxRecords,
      insuranceRecords,
      pucRecords,
      gpsRecords,
      cgPermitRecords,
      nationalPermitRecords,
      busPermitRecords,
      temporaryPermitRecords,
      temporaryPermitOtherStateRecords,
      hpaHptRecords,
      nocRecords
    ] = await Promise.all([
      Fitness.find({ vehicleNumber: registrationNumber, userId }).sort({ createdAt: -1 }).lean(),
      Tax.find({ vehicleNumber: registrationNumber, userId }).sort({ createdAt: -1 }).lean(),
      Insurance.find({ vehicleNumber: registrationNumber, userId }).sort({ createdAt: -1 }).lean(),
      Puc.find({ vehicleNumber: registrationNumber, userId }).sort({ createdAt: -1 }).lean(),
      Gps.find({ vehicleNumber: registrationNumber, userId }).sort({ createdAt: -1 }).lean(),
      CgPermit.find({ vehicleNumber: registrationNumber, userId }).sort({ createdAt: -1 }).lean(),
      NationalPermit.find({ vehicleNumber: registrationNumber, userId }).sort({ createdAt: -1 }).lean(),
      BusPermit.find({ vehicleNumber: registrationNumber, userId }).sort({ createdAt: -1 }).lean(),
      TemporaryPermit.find({ vehicleNumber: registrationNumber, userId }).sort({ createdAt: -1 }).lean(),
      TemporaryPermitOtherState.find({ vehicleNo: registrationNumber, userId }).sort({ createdAt: -1 }).lean(),
      HpaHpt.find({ vehicleNumber: registrationNumber, userId }).sort({ createdAt: -1 }).lean(),
      Noc.find({ vehicleNumber: registrationNumber, userId }).sort({ createdAt: -1 }).lean()
    ])

    // Helper to compute section totals
    const sumSection = (records, totalField, paidField, balanceField) => ({
      totalFee: records.reduce((sum, r) => sum + (r[totalField] || 0), 0),
      paid: records.reduce((sum, r) => sum + (r[paidField] || 0), 0),
      balance: records.reduce((sum, r) => sum + (r[balanceField] || 0), 0)
    })

    const sections = {
      fitness: {
        records: fitnessRecords,
        ...sumSection(fitnessRecords, 'totalFee', 'paid', 'balance')
      },
      tax: {
        records: taxRecords,
        ...sumSection(taxRecords, 'totalAmount', 'paidAmount', 'balanceAmount')
      },
      insurance: {
        records: insuranceRecords,
        ...sumSection(insuranceRecords, 'totalFee', 'paid', 'balance')
      },
      puc: {
        records: pucRecords,
        ...sumSection(pucRecords, 'totalFee', 'paid', 'balance')
      },
      gps: {
        records: gpsRecords,
        ...sumSection(gpsRecords, 'totalFee', 'paid', 'balance')
      },
      cgPermit: {
        records: cgPermitRecords,
        ...sumSection(cgPermitRecords, 'totalFee', 'paid', 'balance')
      },
      nationalPermit: {
        records: nationalPermitRecords,
        ...sumSection(nationalPermitRecords, 'totalFee', 'paid', 'balance')
      },
      busPermit: {
        records: busPermitRecords,
        ...sumSection(busPermitRecords, 'totalFee', 'paid', 'balance')
      },
      temporaryPermit: {
        records: temporaryPermitRecords,
        ...sumSection(temporaryPermitRecords, 'totalFee', 'paid', 'balance')
      },
      temporaryPermitOtherState: {
        records: temporaryPermitOtherStateRecords,
        ...sumSection(temporaryPermitOtherStateRecords, 'totalFee', 'paid', 'balance')
      },
      hpaHpt: {
        records: hpaHptRecords,
        ...sumSection(hpaHptRecords, 'totalFee', 'paid', 'balance')
      },
      noc: {
        records: nocRecords,
        ...sumSection(nocRecords, 'totalFee', 'paid', 'balance')
      }
    }

    // Compute grand total across all sections
    const grandTotal = Object.values(sections).reduce(
      (acc, s) => ({
        totalFee: acc.totalFee + s.totalFee,
        paid: acc.paid + s.paid,
        balance: acc.balance + s.balance
      }),
      { totalFee: 0, paid: 0, balance: 0 }
    )

    const totalRecords = Object.values(sections).reduce((sum, s) => sum + s.records.length, 0)

    res.json({
      success: true,
      data: {
        registrationNumber,
        totalRecords,
        sections,
        grandTotal
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

// Check if vehicle exists (lightweight endpoint)
exports.checkVehicleExists = async (req, res) => {
  try {
    const registrationNumber = req.params.registrationNumber.toUpperCase()

    // Only check if vehicle exists for this user
    const exists = await VehicleRegistration.exists({
      registrationNumber: registrationNumber,
      userId: req.user.id
    })

    res.json({
      success: true,
      exists: !!exists,
      message: exists ? 'Vehicle already registered' : 'Vehicle not found'
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
