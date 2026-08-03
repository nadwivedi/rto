const express = require('express')
const router = express.Router()
const partyController = require('../controllers/partyController')

// GET all parties (with pagination) or all parties for dropdown (with ?all=true)
router.get('/', partyController.getAllParties)

// GET party statistics
router.get('/statistics', partyController.getPartyStatistics)

// GET party-wise pending payment summary (all parties)
router.get('/pending-summary', partyController.getPartyWisePendingSummary)

// POST add money received entry
router.post('/money-received', partyController.createMoneyReceived)

// GET all money received entries for the logged-in user
router.get('/money-received', partyController.getMoneyReceivedList)

// GET single party by ID
router.get('/:id', partyController.getPartyById)

// GET all vehicles by party
router.get('/:partyId/vehicles', partyController.getVehiclesByParty)

// GET pending payments by party
router.get('/:partyId/pending-payments', partyController.getPendingPaymentsByParty)

// GET all work/services done for a party
router.get('/:partyId/all-work', partyController.getAllWorkByParty)

// POST create new party
router.post('/', partyController.createParty)

// PUT update party
router.put('/:id', partyController.updateParty)

// DELETE party
router.delete('/:id', partyController.deleteParty)

module.exports = router
