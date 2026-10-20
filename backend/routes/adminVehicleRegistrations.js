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
