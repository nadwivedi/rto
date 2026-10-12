const express = require('express')
const router = express.Router()
const VehicleRegistration = require('../models/VehicleRegistration')
const User = require('../models/User')
const adminAuthMiddleware = require('../middleware/adminAuth')
const { recordActivity } = require('../utils/activityLog')

// These routes read and change every user's vehicles, so they are admin-only
router.use(adminAuthMiddleware)

// "Owner name (mobile)" of the user a vehicle belongs to, for the activity log
const ownerLabel = async (userId) => {
  try {
    const user = await User.findById(userId).select('name mobile1').lean()
    return user ? `${user.name} (${user.mobile1})` : null
  } catch {
    return null
  }
}

// GET all vehicle registrations
router.get('/', async (req, res) => {
  try {
    const registrations = await VehicleRegistration.find().sort({ createdAt: -1 })
    res.json({
      success: true,
      data: registrations
    })
  } catch (error) {
    console.error('Error fetching vehicle registrations:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch vehicle registrations'
    })
  }
})

// POST - Create vehicle registration from JSON
router.post('/create-from-json', async (req, res) => {
  try {
    const vehicleData = req.body

    // Validate required fields
    if (!vehicleData.userId) {
      return res.status(400).json({
        success: false,
        message: 'userId is required'
      })
    }

    if (!vehicleData.registrationNumber) {
      return res.status(400).json({
        success: false,
        message: 'registrationNumber is required'
      })
    }

    if (!vehicleData.chassisNumber) {
      return res.status(400).json({
        success: false,
        message: 'chassisNumber is required'
      })
    }

    // Check if vehicle registration already exists for this user
    const existingRegistration = await VehicleRegistration.findOne({
      userId: vehicleData.userId,
      registrationNumber: vehicleData.registrationNumber.toUpperCase()
    })

    if (existingRegistration) {
      return res.status(409).json({
        success: false,
        message: 'Vehicle registration already exists for this user'
      })
    }

    // Create new vehicle registration
    const newRegistration = new VehicleRegistration(vehicleData)
    await newRegistration.save()

    const owner = await ownerLabel(newRegistration.userId)
    recordActivity(req, {
      action: 'create',
      entity: 'vehicle_registration',
      entityId: newRegistration._id,
      entityName: newRegistration.registrationNumber,
      summary: `Created vehicle ${newRegistration.registrationNumber} from JSON${owner ? ` for ${owner}` : ''}`,
      changes: [
        { field: 'Registration Number', from: null, to: newRegistration.registrationNumber },
        { field: 'Chassis Number', from: null, to: newRegistration.chassisNumber },
        ...(owner ? [{ field: 'User', from: null, to: owner }] : [])
      ]
    })

    res.status(201).json({
      success: true,
      message: 'Vehicle registration created successfully',
      data: newRegistration
    })
  } catch (error) {
    console.error('Error creating vehicle registration:', error)

    // Handle validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.keys(error.errors).map(key => ({
          field: key,
          message: error.errors[key].message
        }))
      })
    }

    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Vehicle registration already exists'
      })
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create vehicle registration'
    })
  }
})

// DELETE vehicle registration
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const deletedRegistration = await VehicleRegistration.findByIdAndDelete(id)

    if (!deletedRegistration) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle registration not found'
      })
    }

    const owner = await ownerLabel(deletedRegistration.userId)
    recordActivity(req, {
      action: 'delete',
      entity: 'vehicle_registration',
      entityId: deletedRegistration._id,
      entityName: deletedRegistration.registrationNumber,
      summary: `Deleted vehicle ${deletedRegistration.registrationNumber}${owner ? ` of ${owner}` : ''}`,
      changes: [
        { field: 'Registration Number', from: deletedRegistration.registrationNumber, to: null },
        { field: 'Chassis Number', from: deletedRegistration.chassisNumber || null, to: null },
        ...(owner ? [{ field: 'User', from: owner, to: null }] : [])
      ]
    })

    res.json({
      success: true,
      message: 'Vehicle registration deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting vehicle registration:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to delete vehicle registration'
    })
  }
})

module.exports = router
