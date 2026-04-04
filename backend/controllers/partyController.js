const Party = require('../models/Party')
const VehicleRegistration = require('../models/VehicleRegistration')
const Tax = require('../models/Tax')
const Fitness = require('../models/Fitness')
const Insurance = require('../models/Insurance')
const Puc = require('../models/Puc')
const Gps = require('../models/Gps')
const CgPermit = require('../models/CgPermit')
const NationalPermit = require('../models/NationalPermit')
const BusPermit = require('../models/BusPermit')
const TemporaryPermit = require('../models/TemporaryPermit')
const TemporaryPermitOtherState = require('../models/TemporaryPermitOtherState')
const { logError, getUserFriendlyError } = require('../utils/errorLogger')

// Get all parties
exports.getAllParties = async (req, res) => {
  try {
    const { search, page = 1, limit = 20, all } = req.query
    let query = { userId: req.user.id }

    if (search) {
      query.$or = [
        { partyName: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } }
      ]
    }

    // If 'all' parameter is true, return all parties without pagination (for dropdowns)
    if (all === 'true') {
      const parties = await Party.find(query)
        .sort({ partyName: 1 })
        .select('_id partyName sonWifeDaughterOf mobile email address')
        .lean()

      return res.json({
        success: true,
        data: parties,
        count: parties.length
      })
    }

    // Calculate pagination
    const pageNum = parseInt(page, 10)
    const limitNum = parseInt(limit, 10)
    const skip = (pageNum - 1) * limitNum

    // Get total count for pagination
    const totalRecords = await Party.countDocuments(query)
    const totalPages = Math.ceil(totalRecords / limitNum)

    // Get paginated results
    const parties = await Party.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean()

    const partyIds = parties.map(party => party._id)
    const vehicles = await VehicleRegistration.find({
      partyId: { $in: partyIds },
      userId: req.user.id
    })
      .select('partyId registrationNumber')
      .lean()

    const vehiclesByParty = {}
    vehicles.forEach(vehicle => {
      const key = vehicle.partyId?.toString()
      if (!key) return
      if (!vehiclesByParty[key]) vehiclesByParty[key] = []
      vehiclesByParty[key].push(vehicle.registrationNumber)
    })

    const partiesWithPending = await Promise.all(
      parties.map(async (party) => {
        const vehicleNumbers = vehiclesByParty[party._id.toString()] || []

        if (vehicleNumbers.length === 0) {
          return {
            ...party,
            totalPending: 0
          }
        }

        const [
          taxPending,
          fitnessPending,
          insurancePending,
          pucPending,
          gpsPending,
          cgPermitPending,
          nationalPermitPending,
          busPermitPending,
          temporaryPermitPending,
          temporaryPermitOtherStatePending
        ] = await Promise.all([
          Tax.aggregate([
            { $match: { vehicleNumber: { $in: vehicleNumbers }, userId: req.user.id, balanceAmount: { $gt: 0 } } },
            { $group: { _id: null, total: { $sum: '$balanceAmount' } } }
          ]),
          Fitness.aggregate([
            { $match: { vehicleNumber: { $in: vehicleNumbers }, userId: req.user.id, balance: { $gt: 0 } } },
            { $group: { _id: null, total: { $sum: '$balance' } } }
          ]),
          Insurance.aggregate([
            { $match: { vehicleNumber: { $in: vehicleNumbers }, userId: req.user.id, balance: { $gt: 0 } } },
            { $group: { _id: null, total: { $sum: '$balance' } } }
          ]),
          Puc.aggregate([
            { $match: { vehicleNumber: { $in: vehicleNumbers }, userId: req.user.id, balance: { $gt: 0 } } },
            { $group: { _id: null, total: { $sum: '$balance' } } }
          ]),
          Gps.aggregate([
            { $match: { vehicleNumber: { $in: vehicleNumbers }, userId: req.user.id, balance: { $gt: 0 } } },
            { $group: { _id: null, total: { $sum: '$balance' } } }
          ]),
          CgPermit.aggregate([
            { $match: { vehicleNumber: { $in: vehicleNumbers }, userId: req.user.id, balance: { $gt: 0 } } },
            { $group: { _id: null, total: { $sum: '$balance' } } }
          ]),
          NationalPermit.aggregate([
            { $match: { vehicleNumber: { $in: vehicleNumbers }, userId: req.user.id, balance: { $gt: 0 } } },
            { $group: { _id: null, total: { $sum: '$balance' } } }
          ]),
          BusPermit.aggregate([
            { $match: { vehicleNumber: { $in: vehicleNumbers }, userId: req.user.id, balance: { $gt: 0 } } },
            { $group: { _id: null, total: { $sum: '$balance' } } }
          ]),
          TemporaryPermit.aggregate([
            { $match: { vehicleNumber: { $in: vehicleNumbers }, userId: req.user.id, balance: { $gt: 0 } } },
            { $group: { _id: null, total: { $sum: '$balance' } } }
          ]),
          TemporaryPermitOtherState.aggregate([
            { $match: { vehicleNo: { $in: vehicleNumbers }, userId: req.user.id, balance: { $gt: 0 } } },
            { $group: { _id: null, total: { $sum: '$balance' } } }
          ])
        ])

        const totalPending =
          (taxPending[0]?.total || 0) +
          (fitnessPending[0]?.total || 0) +
          (insurancePending[0]?.total || 0) +
          (pucPending[0]?.total || 0) +
          (gpsPending[0]?.total || 0) +
          (cgPermitPending[0]?.total || 0) +
          (nationalPermitPending[0]?.total || 0) +
          (busPermitPending[0]?.total || 0) +
          (temporaryPermitPending[0]?.total || 0) +
          (temporaryPermitOtherStatePending[0]?.total || 0)

        return {
          ...party,
          totalPending
        }
      })
    )

    res.json({
      success: true,
      count: partiesWithPending.length,
      data: partiesWithPending,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalRecords,
        limit: limitNum
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

// Get single party by ID
exports.getPartyById = async (req, res) => {
  try {
    const party = await Party.findOne({
      _id: req.params.id,
      userId: req.user.id
    })

    if (!party) {
      return res.status(404).json({
        success: false,
        message: 'Party not found'
      })
    }

    res.json({
      success: true,
      data: party
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

// Create new party
exports.createParty = async (req, res) => {
  try {
    const {
      partyName,
      sonWifeDaughterOf,
      mobile,
      email,
      address
    } = req.body

    // Validate required fields
    if (!partyName) {
      return res.status(400).json({
        success: false,
        message: 'Party name is required'
      })
    }

    const partyData = {
      userId: req.user.id,
      partyName,
      sonWifeDaughterOf,
      mobile,
      email,
      address
    }

    const party = await Party.create(partyData)

    res.status(201).json({
      success: true,
      message: 'Party created successfully',
      data: party
    })
  } catch (error) {
    logError(error, req)
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

// Update party
exports.updateParty = async (req, res) => {
  try {
    const {
      partyName,
      sonWifeDaughterOf,
      mobile,
      email,
      address
    } = req.body

    const party = await Party.findOne({
      _id: req.params.id,
      userId: req.user.id
    })

    if (!party) {
      return res.status(404).json({
        success: false,
        message: 'Party not found'
      })
    }

    // Update fields
    if (partyName !== undefined) party.partyName = partyName
    if (sonWifeDaughterOf !== undefined) party.sonWifeDaughterOf = sonWifeDaughterOf
    if (mobile !== undefined) party.mobile = mobile
    if (email !== undefined) party.email = email
    if (address !== undefined) party.address = address

    await party.save()

    res.json({
      success: true,
      message: 'Party updated successfully',
      data: party
    })
  } catch (error) {
    logError(error, req)
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

// Delete party
exports.deleteParty = async (req, res) => {
  try {
    // Check if any vehicles are linked to this party
    const linkedVehicles = await VehicleRegistration.countDocuments({
      partyId: req.params.id,
      userId: req.user.id
    })

    if (linkedVehicles > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete party. ${linkedVehicles} vehicle(s) are linked to this party. Please remove the party from those vehicles first.`
      })
    }

    const party = await Party.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    })

    if (!party) {
      return res.status(404).json({
        success: false,
        message: 'Party not found'
      })
    }

    res.json({
      success: true,
      message: 'Party deleted successfully'
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

// Get party statistics
exports.getPartyStatistics = async (req, res) => {
  try {
    const totalParties = await Party.countDocuments({ userId: req.user.id })

    res.json({
      success: true,
      data: {
        total: totalParties
      }
    })
  } catch (error) {
    logError(error, req)
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

// Get all vehicles by party
exports.getVehiclesByParty = async (req, res) => {
  try {
    const { partyId } = req.params

    const vehicles = await VehicleRegistration.find({
      partyId: partyId,
      userId: req.user.id
    }).sort({ createdAt: -1 }).lean()

    res.json({
      success: true,
      count: vehicles.length,
      data: vehicles
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

// Get pending payments by party
exports.getPendingPaymentsByParty = async (req, res) => {
  try {
    const { partyId } = req.params
    const userId = req.user.id

    // Get all vehicles for this party
    const vehicles = await VehicleRegistration.find({
      partyId: partyId,
      userId: userId
    }).select('registrationNumber').lean()

    const vehicleNumbers = vehicles.map(v => v.registrationNumber)

    if (vehicleNumbers.length === 0) {
      return res.json({
        success: true,
        data: {
          totalPending: 0,
          breakdown: {
            tax: 0,
            fitness: 0,
            insurance: 0,
            puc: 0,
            cgPermit: 0,
            nationalPermit: 0,
            busPermit: 0
          },
          records: []
        }
      })
    }

    // Get pending payments from all service models
    const [taxPending, fitnessPending, insurancePending, pucPending, cgPermitPending, nationalPermitPending, busPermitPending] = await Promise.all([
      Tax.find({ vehicleNumber: { $in: vehicleNumbers }, userId, balanceAmount: { $gt: 0 } }).lean(),
      Fitness.find({ vehicleNumber: { $in: vehicleNumbers }, userId, balance: { $gt: 0 } }).lean(),
      Insurance.find({ vehicleNumber: { $in: vehicleNumbers }, userId, balance: { $gt: 0 } }).lean(),
      Puc.find({ vehicleNumber: { $in: vehicleNumbers }, userId, balance: { $gt: 0 } }).lean(),
      CgPermit.find({ vehicleNumber: { $in: vehicleNumbers }, userId, balance: { $gt: 0 } }).lean(),
      NationalPermit.find({ vehicleNumber: { $in: vehicleNumbers }, userId, balance: { $gt: 0 } }).lean(),
      BusPermit.find({ vehicleNumber: { $in: vehicleNumbers }, userId, balance: { $gt: 0 } }).lean()
    ])

    // Calculate totals
    const taxTotal = taxPending.reduce((sum, t) => sum + (t.balanceAmount || 0), 0)
    const fitnessTotal = fitnessPending.reduce((sum, f) => sum + (f.balance || 0), 0)
    const insuranceTotal = insurancePending.reduce((sum, i) => sum + (i.balance || 0), 0)
    const pucTotal = pucPending.reduce((sum, p) => sum + (p.balance || 0), 0)
    const cgPermitTotal = cgPermitPending.reduce((sum, c) => sum + (c.balance || 0), 0)
    const nationalPermitTotal = nationalPermitPending.reduce((sum, n) => sum + (n.balance || 0), 0)
    const busPermitTotal = busPermitPending.reduce((sum, b) => sum + (b.balance || 0), 0)

    const totalPending = taxTotal + fitnessTotal + insuranceTotal + pucTotal + cgPermitTotal + nationalPermitTotal + busPermitTotal

    // Compile all pending records with type
    const records = [
      ...taxPending.map(r => ({ ...r, type: 'Tax', pendingAmount: r.balanceAmount })),
      ...fitnessPending.map(r => ({ ...r, type: 'Fitness', pendingAmount: r.balance })),
      ...insurancePending.map(r => ({ ...r, type: 'Insurance', pendingAmount: r.balance })),
      ...pucPending.map(r => ({ ...r, type: 'PUC', pendingAmount: r.balance })),
      ...cgPermitPending.map(r => ({ ...r, type: 'CG Permit', pendingAmount: r.balance })),
      ...nationalPermitPending.map(r => ({ ...r, type: 'National Permit', pendingAmount: r.balance })),
      ...busPermitPending.map(r => ({ ...r, type: 'Bus Permit', pendingAmount: r.balance }))
    ]

    res.json({
      success: true,
      data: {
        totalPending,
        breakdown: {
          tax: taxTotal,
          fitness: fitnessTotal,
          insurance: insuranceTotal,
          puc: pucTotal,
          cgPermit: cgPermitTotal,
          nationalPermit: nationalPermitTotal,
          busPermit: busPermitTotal
        },
        records
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

// Get party-wise pending payment summary (all parties)
exports.getPartyWisePendingSummary = async (req, res) => {
  try {
    const userId = req.user.id

    // Get all parties
    const parties = await Party.find({ userId }).lean()

    // Get all vehicles with party information
    const vehicles = await VehicleRegistration.find({ userId, partyId: { $ne: null } })
      .select('registrationNumber partyId')
      .lean()

    // Group vehicles by party
    const vehiclesByParty = {}
    vehicles.forEach(v => {
      const partyId = v.partyId.toString()
      if (!vehiclesByParty[partyId]) {
        vehiclesByParty[partyId] = []
      }
      vehiclesByParty[partyId].push(v.registrationNumber)
    })

    // Calculate pending for each party
    const partySummary = await Promise.all(
      parties.map(async (party) => {
        const partyVehicles = vehiclesByParty[party._id.toString()] || []

        if (partyVehicles.length === 0) {
          return {
            partyId: party._id,
            partyName: party.partyName,
            mobile: party.mobile,
            vehicleCount: 0,
            totalPending: 0
          }
        }

        // Get pending amounts
        const [taxPending, fitnessPending, insurancePending, pucPending] = await Promise.all([
          Tax.aggregate([
            { $match: { vehicleNumber: { $in: partyVehicles }, userId: userId, balanceAmount: { $gt: 0 } } },
            { $group: { _id: null, total: { $sum: '$balanceAmount' } } }
          ]),
          Fitness.aggregate([
            { $match: { vehicleNumber: { $in: partyVehicles }, userId: userId, balance: { $gt: 0 } } },
            { $group: { _id: null, total: { $sum: '$balance' } } }
          ]),
          Insurance.aggregate([
            { $match: { vehicleNumber: { $in: partyVehicles }, userId: userId, balance: { $gt: 0 } } },
            { $group: { _id: null, total: { $sum: '$balance' } } }
          ]),
          Puc.aggregate([
            { $match: { vehicleNumber: { $in: partyVehicles }, userId: userId, balance: { $gt: 0 } } },
            { $group: { _id: null, total: { $sum: '$balance' } } }
          ])
        ])

        const totalPending =
          (taxPending[0]?.total || 0) +
          (fitnessPending[0]?.total || 0) +
          (insurancePending[0]?.total || 0) +
          (pucPending[0]?.total || 0)

        return {
          partyId: party._id,
          partyName: party.partyName,
          mobile: party.mobile,
          vehicleCount: partyVehicles.length,
          totalPending
        }
      })
    )

    // Sort by pending amount descending
    partySummary.sort((a, b) => b.totalPending - a.totalPending)

    // Calculate grand total
    const grandTotal = partySummary.reduce((sum, p) => sum + p.totalPending, 0)

    res.json({
      success: true,
      data: {
        parties: partySummary,
        grandTotal,
        totalParties: parties.length
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

// Get all work/services done for a party
exports.getAllWorkByParty = async (req, res) => {
  try {
    const { partyId } = req.params
    const userId = req.user.id

    // Get party details
    const party = await Party.findOne({ _id: partyId, userId }).lean()
    if (!party) {
      return res.status(404).json({
        success: false,
        message: 'Party not found'
      })
    }

    // Get all vehicles for this party
    const vehicles = await VehicleRegistration.find({
      partyId: partyId,
      userId: userId
    }).lean()

    const vehicleNumbers = vehicles.map(v => v.registrationNumber)

    if (vehicleNumbers.length === 0) {
      return res.json({
        success: true,
        data: {
          party,
          vehicles: [],
          work: {
            tax: [],
            fitness: [],
            insurance: [],
            puc: [],
            gps: [],
            cgPermit: [],
            nationalPermit: [],
            busPermit: [],
            temporaryPermit: [],
            temporaryPermitOtherState: []
          },
          summary: {
            totalVehicles: 0,
            totalRecords: 0,
            totalPending: 0
          }
        }
      })
    }

    // Get all work records from all service models
    const [
      taxRecords,
      fitnessRecords,
      insuranceRecords,
      pucRecords,
      gpsRecords,
      cgPermitRecords,
      nationalPermitRecords,
      busPermitRecords,
      temporaryPermitRecords,
      temporaryPermitOtherStateRecords
    ] = await Promise.all([
      Tax.find({ vehicleNumber: { $in: vehicleNumbers }, userId }).sort({ createdAt: -1 }).lean(),
      Fitness.find({ vehicleNumber: { $in: vehicleNumbers }, userId }).sort({ createdAt: -1 }).lean(),
      Insurance.find({ vehicleNumber: { $in: vehicleNumbers }, userId }).sort({ createdAt: -1 }).lean(),
      Puc.find({ vehicleNumber: { $in: vehicleNumbers }, userId }).sort({ createdAt: -1 }).lean(),
      Gps.find({ vehicleNumber: { $in: vehicleNumbers }, userId }).sort({ createdAt: -1 }).lean(),
      CgPermit.find({ vehicleNumber: { $in: vehicleNumbers }, userId }).sort({ createdAt: -1 }).lean(),
      NationalPermit.find({ vehicleNumber: { $in: vehicleNumbers }, userId }).sort({ createdAt: -1 }).lean(),
      BusPermit.find({ vehicleNumber: { $in: vehicleNumbers }, userId }).sort({ createdAt: -1 }).lean(),
      TemporaryPermit.find({ vehicleNumber: { $in: vehicleNumbers }, userId }).sort({ createdAt: -1 }).lean(),
      TemporaryPermitOtherState.find({ vehicleNo: { $in: vehicleNumbers }, userId }).sort({ createdAt: -1 }).lean()
    ])

    // Calculate pending amounts
    const taxPending = taxRecords.reduce((sum, r) => sum + (r.balanceAmount || 0), 0)
    const fitnessPending = fitnessRecords.reduce((sum, r) => sum + (r.balance || 0), 0)
    const insurancePending = insuranceRecords.reduce((sum, r) => sum + (r.balance || 0), 0)
    const pucPending = pucRecords.reduce((sum, r) => sum + (r.balance || 0), 0)
    const gpsPending = gpsRecords.reduce((sum, r) => sum + (r.balance || 0), 0)
    const cgPermitPending = cgPermitRecords.reduce((sum, r) => sum + (r.balance || 0), 0)
    const nationalPermitPending = nationalPermitRecords.reduce((sum, r) => sum + (r.balance || 0), 0)
    const busPermitPending = busPermitRecords.reduce((sum, r) => sum + (r.balance || 0), 0)
    const temporaryPermitPending = temporaryPermitRecords.reduce((sum, r) => sum + (r.balance || 0), 0)
    const temporaryPermitOtherStatePending = temporaryPermitOtherStateRecords.reduce((sum, r) => sum + (r.balance || 0), 0)

    const totalPending = taxPending + fitnessPending + insurancePending + pucPending + gpsPending +
      cgPermitPending + nationalPermitPending + busPermitPending + temporaryPermitPending + temporaryPermitOtherStatePending

    const totalRecords = taxRecords.length + fitnessRecords.length + insuranceRecords.length +
      pucRecords.length + gpsRecords.length + cgPermitRecords.length + nationalPermitRecords.length +
      busPermitRecords.length + temporaryPermitRecords.length + temporaryPermitOtherStateRecords.length

    res.json({
      success: true,
      data: {
        party,
        vehicles,
        work: {
          tax: taxRecords,
          fitness: fitnessRecords,
          insurance: insuranceRecords,
          puc: pucRecords,
          gps: gpsRecords,
          cgPermit: cgPermitRecords,
          nationalPermit: nationalPermitRecords,
          busPermit: busPermitRecords,
          temporaryPermit: temporaryPermitRecords,
          temporaryPermitOtherState: temporaryPermitOtherStateRecords
        },
        pendingBreakdown: {
          tax: taxPending,
          fitness: fitnessPending,
          insurance: insurancePending,
          puc: pucPending,
          gps: gpsPending,
          cgPermit: cgPermitPending,
          nationalPermit: nationalPermitPending,
          busPermit: busPermitPending,
          temporaryPermit: temporaryPermitPending,
          temporaryPermitOtherState: temporaryPermitOtherStatePending
        },
        summary: {
          totalVehicles: vehicles.length,
          totalRecords,
          totalPending
        }
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
