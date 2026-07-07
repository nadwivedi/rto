const express = require('express')
const router = express.Router()
const controller = require('../controllers/speedGovernorController')

router.get('/', controller.getAll)
router.post('/', controller.create)
router.put('/:id', controller.update)
router.delete('/:id', controller.remove)
router.patch('/:id/mark-paid', controller.markAsPaid)

module.exports = router
