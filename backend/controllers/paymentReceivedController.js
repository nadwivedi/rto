const PaymentReceived = require('../models/PaymentReceived')

const getPaymentsByWork = async (req, res) => {
  try {
    const { workType, workId } = req.params
    const payments = await PaymentReceived.find({ userId: req.user.id, workType, workId }).sort({ date: -1 })
    res.json(payments)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const createPayment = async (req, res) => {
  try {
    const { workType, workId, date, amount, paymentMode, remark } = req.body
    const payment = await PaymentReceived.create({
      userId: req.user.id, workType, workId, date, amount, paymentMode, remark
    })
    res.status(201).json(payment)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const bulkCreatePayments = async (req, res) => {
  try {
    const { workType, workId, payments } = req.body
    if (!Array.isArray(payments) || payments.length === 0) {
      return res.status(400).json({ message: 'payments array is required' })
    }
    const docs = payments.map(p => ({
      userId: req.user.id,
      workType,
      workId,
      date: p.date,
      amount: p.amount,
      paymentMode: p.paymentMode || 'Cash',
      remark: p.remark || ''
    }))
    const created = await PaymentReceived.insertMany(docs)
    res.status(201).json(created)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const replacePaymentsForWork = async (req, res) => {
  try {
    const { workType, workId } = req.params
    const { payments } = req.body
    await PaymentReceived.deleteMany({ userId: req.user.id, workType, workId })
    if (Array.isArray(payments) && payments.length > 0) {
      const docs = payments.map(p => ({
        userId: req.user.id,
        workType,
        workId,
        date: p.date,
        amount: p.amount,
        paymentMode: p.paymentMode || 'Cash',
        remark: p.remark || ''
      }))
      const created = await PaymentReceived.insertMany(docs)
      return res.json(created)
    }
    res.json([])
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const deletePayment = async (req, res) => {
  try {
    const payment = await PaymentReceived.findOneAndDelete({ _id: req.params.id, userId: req.user.id })
    if (!payment) return res.status(404).json({ message: 'Payment not found' })
    res.json({ message: 'Deleted successfully' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

module.exports = { getPaymentsByWork, createPayment, bulkCreatePayments, replacePaymentsForWork, deletePayment }
