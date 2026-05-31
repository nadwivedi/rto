const express = require('express')
const router = express.Router()
const bookmarkController = require('../controllers/bookmarkController')

router.get('/', bookmarkController.getAll)
router.post('/', bookmarkController.create)
router.delete('/:id', bookmarkController.remove)

module.exports = router
