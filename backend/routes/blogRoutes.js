const express = require('express')
const router = express.Router()
const adminAuth = require('../middleware/adminAuth')
const blogController = require('../controllers/blogController')

router.use(adminAuth)

router.get('/', blogController.getAll)
router.get('/:id', blogController.getById)
router.post('/', blogController.create)
router.post('/upload-image', blogController.uploadImage)
router.put('/:id', blogController.update)
router.delete('/:id', blogController.delete)

module.exports = router
