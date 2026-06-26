const ExpenseBreakdown = require('../models/ExpenseBreakdown')

const getExpensesByWork = async (req, res) => {
  try {
    const { workType, workId } = req.params
    const expenses = await ExpenseBreakdown.find({ userId: req.user.id, workType, workId }).sort({ date: -1 })
    res.json(expenses)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const createExpense = async (req, res) => {
  try {
    const { workType, workId, date, name, amount, remark } = req.body
    const expense = await ExpenseBreakdown.create({
      userId: req.user.id, workType, workId, date, name, amount, remark
    })
    res.status(201).json(expense)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const replaceExpensesForWork = async (req, res) => {
  try {
    const { workType, workId } = req.params
    const { expenses } = req.body
    await ExpenseBreakdown.deleteMany({ userId: req.user.id, workType, workId })
    if (Array.isArray(expenses) && expenses.length > 0) {
      const docs = expenses.map(e => ({
        userId: req.user.id,
        workType,
        workId,
        date: e.date,
        name: e.name,
        amount: e.amount,
        remark: e.remark || ''
      }))
      const created = await ExpenseBreakdown.insertMany(docs)
      return res.json(created)
    }
    res.json([])
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const deleteExpense = async (req, res) => {
  try {
    const expense = await ExpenseBreakdown.findOneAndDelete({ _id: req.params.id, userId: req.user.id })
    if (!expense) return res.status(404).json({ message: 'Expense not found' })
    res.json({ message: 'Deleted successfully' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

module.exports = { getExpensesByWork, createExpense, replaceExpensesForWork, deleteExpense }
