const express = require('express')
const router = express.Router()
const expenseBreakdownController = require('../controllers/expenseBreakdownController')

router.get('/:workType/:workId', expenseBreakdownController.getExpensesByWork)
router.post('/', expenseBreakdownController.createExpense)
router.put('/:workType/:workId', expenseBreakdownController.replaceExpensesForWork)
router.delete('/:id', expenseBreakdownController.deleteExpense)

module.exports = router
