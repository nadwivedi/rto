const express = require('express')
const router = express.Router()
const DefaultExpenseSetting = require('../models/DefaultExpenseSetting')

// Get default settings for a specific type
router.get('/:type', async (req, res) => {
  try {
    const { type } = req.params
    const setting = await DefaultExpenseSetting.findOne({ userId: req.user.id, type })
    res.json({ expenses: setting ? setting.expenses : [] })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Update/Create default settings for a specific type
router.post('/', async (req, res) => {
  try {
    const { type, expenses } = req.body
    
    // Find and update or create
    const setting = await DefaultExpenseSetting.findOneAndUpdate(
      { userId: req.user.id, type },
      { expenses },
      { new: true, upsert: true }
    )
    
    res.json({ success: true, expenses: setting.expenses })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

module.exports = router
