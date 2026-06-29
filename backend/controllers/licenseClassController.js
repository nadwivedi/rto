const LicenseClass = require('../models/LicenseClass')

const defaults = [
  { value: 'MCWG', label: 'MCWG - Two Wheeler', isDefault: true },
  { value: 'LMV', label: 'LMV - Four Wheeler', isDefault: true },
  { value: 'MCWG+LMV', label: 'MCWG+LMV - Both', isDefault: true },
  { value: 'HMV', label: 'HMV - Heavy Vehicle', isDefault: true },
  { value: 'Commercial', label: 'Commercial', isDefault: true },
  { value: 'Transport', label: 'Transport', isDefault: true },
  { value: 'E-Rikshaw', label: 'E-Rikshaw - 3 wheeler', isDefault: true },
]

const getLicenseClasses = async (req, res) => {
  try {
    const globalDefaults = await LicenseClass.find({ userId: null }).lean()
    if (globalDefaults.length === 0) {
      await LicenseClass.insertMany(defaults)
    }

    const classes = await LicenseClass.find({
      $or: [{ userId: null }, { userId: req.user.id }]
    }).sort({ isDefault: -1, value: 1 }).lean()

    res.json({ success: true, data: classes })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

const addLicenseClass = async (req, res) => {
  try {
    const { name } = req.body
    if (!name) {
      return res.status(400).json({ success: false, message: 'License class name is required' })
    }

    const existing = await LicenseClass.findOne({
      $or: [{ userId: null, value: name.trim() }, { userId: req.user.id, value: name.trim() }]
    })
    if (existing) {
      return res.status(400).json({ success: false, message: 'License class already exists' })
    }

    const licenseClass = await LicenseClass.create({
      userId: req.user.id,
      value: name.trim(),
      label: name.trim(),
      isDefault: false
    })

    res.status(201).json({ success: true, data: licenseClass })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

const deleteLicenseClass = async (req, res) => {
  try {
    const { value } = req.params
    const cls = await LicenseClass.findOne({ userId: req.user.id, value })
    if (!cls) {
      return res.status(404).json({ success: false, message: 'License class not found or cannot be deleted' })
    }
    await cls.deleteOne()
    res.json({ success: true, message: 'Deleted' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

module.exports = { getLicenseClasses, addLicenseClass, deleteLicenseClass }
