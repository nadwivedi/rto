const express = require('express')
const router = express.Router()
const {
  getLeads,
  getLead,
  createLead,
  updateLead,
  addFollowUp,
  updateLeadStatus,
  deleteLead
} = require('../controllers/leadController')

// All routes are protected by userAuth middleware applied in index.js

router.get('/', getLeads)
router.get('/:id', getLead)
router.post('/', createLead)
router.put('/:id', updateLead)
router.post('/:id/follow-ups', addFollowUp)
router.patch('/:id/status', updateLeadStatus)
router.delete('/:id', deleteLead)

module.exports = router
