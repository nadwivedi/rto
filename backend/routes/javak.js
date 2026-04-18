const express = require('express')
const router = express.Router()
const {
  createJavak,
  getJavaks,
  updateJavak,
  updateJavakStatus,
  deleteJavak
} = require('../controllers/javakController')

// All routes are protected by userAuth middleware applied in index.js

router.post('/', createJavak)
router.get('/', getJavaks)
router.put('/:id', updateJavak)
router.patch('/:id/status', updateJavakStatus)
router.delete('/:id', deleteJavak)

module.exports = router
