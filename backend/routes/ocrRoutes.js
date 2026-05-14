const express = require('express');
const router = express.Router();
const { rcOcr, taxOcr, fitnessOcr, pucOcr, gpsOcr, llOcr, insuranceOcr } = require('../controllers/rcOcrController');

// POST /api/ocr/rc
router.post('/rc', rcOcr);

// POST /api/ocr/tax
router.post('/tax', taxOcr);

// POST /api/ocr/fitness
router.post('/fitness', fitnessOcr);

// POST /api/ocr/puc
router.post('/puc', pucOcr);

// POST /api/ocr/gps
router.post('/gps', gpsOcr);

// POST /api/ocr/ll
router.post('/ll', llOcr);

// POST /api/ocr/insurance
router.post('/insurance', insuranceOcr);

module.exports = router;
