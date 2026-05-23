const express = require('express')
const router = express.Router()
const blogController = require('../controllers/blogController')

router.get('/', blogController.getPublicBlogs)
router.get('/:slug', blogController.getPublicBlogBySlug)

module.exports = router
