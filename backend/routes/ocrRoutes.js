const express = require('express');
const router = express.Router();
const { rcOcr } = require('../controllers/rcOcrController');

// POST /api/ocr/rc
router.post('/rc', rcOcr);

module.exports = router;
