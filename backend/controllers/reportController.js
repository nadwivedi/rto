const ExpenseBreakdown = require('../models/ExpenseBreakdown')
const PaymentReceived = require('../models/PaymentReceived')

const workTypeLabels = {
  DL: 'Driving License',
  VT: 'Vehicle Transfer',
  NOC: 'NOC',
  RR: 'Registration Renewal',
  FITNESS: 'Fitness',
  TAX: 'Tax',
  GPS: 'GPS',
  NP: 'National Permit',
  CG: 'CG Permit',
  BP: 'Bus Permit',
  TP: 'Temporary Permit',
  TPOS: 'Temp Permit (Other State)',
  PUC: 'PUC',
  HPA: 'HPA/HPT'
}

const getExpenses = async (req, res) => {
  try {
    const { fromDate, toDate } = req.query
    const filter = { userId: req.user.id }

    if (fromDate || toDate) {
      filter.date = {}
      if (fromDate) filter.date.$gte = fromDate
      if (toDate) filter.date.$lte = toDate
    }

    const expenses = await ExpenseBreakdown.find(filter).sort({ date: -1, createdAt: -1 }).lean()

    const enriched = expenses.map(e => ({
      ...e,
      workTypeLabel: workTypeLabels[e.workType] || e.workType
    }))

    const grouped = {}
    for (const exp of enriched) {
      const dateKey = exp.date || 'unknown'
      if (!grouped[dateKey]) grouped[dateKey] = { date: dateKey, items: [], total: 0 }
      grouped[dateKey].items.push(exp)
      grouped[dateKey].total += (exp.amount || 0)
    }

    const dates = Object.values(grouped).sort((a, b) => b.date.localeCompare(a.date))

    const grandTotal = dates.reduce((sum, d) => sum + d.total, 0)

    res.json({ success: true, data: dates, grandTotal })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

const getIncome = async (req, res) => {
  try {
    const { fromDate, toDate } = req.query
    const filter = { userId: req.user.id }

    if (fromDate || toDate) {
      filter.date = {}
      if (fromDate) filter.date.$gte = fromDate
      if (toDate) filter.date.$lte = toDate
    }

    const payments = await PaymentReceived.find(filter).sort({ date: -1, createdAt: -1 }).lean()

    const enriched = payments.map(p => ({
      ...p,
      workTypeLabel: workTypeLabels[p.workType] || p.workType
    }))

    const grouped = {}
    for (const pay of enriched) {
      const dateKey = pay.date || 'unknown'
      if (!grouped[dateKey]) grouped[dateKey] = { date: dateKey, items: [], total: 0 }
      grouped[dateKey].items.push(pay)
      grouped[dateKey].total += (pay.amount || 0)
    }

    const dates = Object.values(grouped).sort((a, b) => b.date.localeCompare(a.date))

    const grandTotal = dates.reduce((sum, d) => sum + d.total, 0)

    res.json({ success: true, data: dates, grandTotal })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

module.exports = { getExpenses, getIncome }
