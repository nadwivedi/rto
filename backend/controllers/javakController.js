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

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const DEFAULT_LIST_LIMIT = 100
const SEARCH_RESULT_LIMIT = 500

// Get Javak entries — recent list by default; full DB search when ?search= is provided
exports.getJavaks = async (req, res) => {
  try {
    const search = (req.query.search || '').trim()
    const filter = { userId: req.user.id }

    if (search) {
      const pattern = escapeRegex(search)
      filter.$or = [
        { partyName: { $regex: pattern, $options: 'i' } },
        { vehicleNo: { $regex: pattern, $options: 'i' } }
      ]
    }

    const totalRecords = await Javak.countDocuments(filter)

    let query = Javak.find(filter).sort({ date: -1, createdAt: -1 })

    if (search) {
      query = query.limit(SEARCH_RESULT_LIMIT)
    } else {
      const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || DEFAULT_LIST_LIMIT, 1), DEFAULT_LIST_LIMIT)
      query = query.limit(limit)
    }

    const javaks = await query

    res.status(200).json({
      success: true,
      data: javaks,
      totalRecords,
      isSearch: Boolean(search),
      limit: search ? SEARCH_RESULT_LIMIT : (javaks.length < totalRecords ? javaks.length : totalRecords)
    })
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
