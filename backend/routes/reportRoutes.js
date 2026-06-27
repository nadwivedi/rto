const router = require('express').Router()
const reportController = require('../controllers/reportController')

router.get('/expenses', reportController.getExpenses)
router.get('/income', reportController.getIncome)

module.exports = router
