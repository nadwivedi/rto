const Javak = require('../models/Javak')

// Create a new Javak entry
exports.createJavak = async (req, res) => {
  try {
    const { date, vehicleNo, partyName, purpose, remark } = req.body

    const newJavak = new Javak({
      userId: req.user.id,
      date,
      vehicleNo: vehicleNo ? vehicleNo.toUpperCase() : '',
      partyName: partyName.toUpperCase(),
      purpose,
      remark,
      isWorkDone: false
    })

    await newJavak.save()
    res.status(201).json({ success: true, data: newJavak })
  } catch (error) {
    console.error('Error creating javak:', error)
    res.status(500).json({ success: false, message: 'Server error while creating javak' })
  }
}

// Get all Javak entries for the user
exports.getJavaks = async (req, res) => {
  try {
    // Sort by date descending (newest dates first), then createdAt descending
    const javaks = await Javak.find({ userId: req.user.id })
      .sort({ date: -1, createdAt: -1 })
    
    res.status(200).json({ success: true, data: javaks })
  } catch (error) {
    console.error('Error fetching javaks:', error)
    res.status(500).json({ success: false, message: 'Server error while fetching javaks' })
  }
}

// Update Javak details
exports.updateJavak = async (req, res) => {
  try {
    const { id } = req.params
    const { date, vehicleNo, partyName, purpose, remark } = req.body

    const updated = await Javak.findOneAndUpdate(
      { _id: id, userId: req.user.id },
      {
        date,
        vehicleNo: vehicleNo ? vehicleNo.toUpperCase() : '',
        partyName: partyName ? partyName.toUpperCase() : '',
        purpose,
        remark
      },
      { new: true, runValidators: true }
    )

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Record not found' })
    }

    res.status(200).json({ success: true, data: updated })
  } catch (error) {
    console.error('Error updating javak:', error)
    res.status(500).json({ success: false, message: 'Server error while updating javak' })
  }
}

// Toggle or update Work Done status
exports.updateJavakStatus = async (req, res) => {
  try {
    const { id } = req.params
    const { isWorkDone } = req.body

    const updated = await Javak.findOneAndUpdate(
      { _id: id, userId: req.user.id },
      { isWorkDone },
      { new: true }
    )

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Record not found' })
    }

    res.status(200).json({ success: true, data: updated })
  } catch (error) {
    console.error('Error updating javak status:', error)
    res.status(500).json({ success: false, message: 'Server error while updating status' })
  }
}

// Delete Javak entry
exports.deleteJavak = async (req, res) => {
  try {
    const { id } = req.params
    
    const deleted = await Javak.findOneAndDelete({ _id: id, userId: req.user.id })
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Record not found' })
    }

    res.status(200).json({ success: true, data: {} })
  } catch (error) {
    console.error('Error deleting javak:', error)
    res.status(500).json({ success: false, message: 'Server error while deleting javak' })
  }
}
