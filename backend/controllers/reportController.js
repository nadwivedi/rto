const ExpenseBreakdown = require('../models/ExpenseBreakdown')
const PaymentReceived = require('../models/PaymentReceived')
const Driving = require('../models/Driving')
const VehicleTransfer = require('../models/vehicleTransfer')
const Noc = require('../models/Noc')
const RegistrationRenewal = require('../models/registrationRenewal')
const Fitness = require('../models/Fitness')
const Tax = require('../models/Tax')
const Gps = require('../models/Gps')
const NationalPermit = require('../models/NationalPermit')
const CgPermit = require('../models/CgPermit')
const BusPermit = require('../models/BusPermit')
const TemporaryPermit = require('../models/TemporaryPermit')
const TemporaryPermitOtherState = require('../models/TemporaryPermitOtherState')
const Puc = require('../models/Puc')
const HpaHpt = require('../models/HpaHpt')

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

const workModels = {
  DL:     { model: Driving,              nameField: 'name' },
  VT:     { model: VehicleTransfer,       nameField: 'currentOwnerName' },
  NOC:    { model: Noc,                  nameField: 'ownerName' },
  RR:     { model: RegistrationRenewal,   nameField: 'ownerName' },
  FITNESS:{ model: Fitness,              nameField: 'ownerName' },
  TAX:    { model: Tax,                  nameField: 'ownerName' },
  GPS:    { model: Gps,                  nameField: 'ownerName' },
  NP:     { model: NationalPermit,        nameField: 'permitHolder' },
  CG:     { model: CgPermit,             nameField: 'permitHolder' },
  BP:     { model: BusPermit,            nameField: 'permitHolder' },
  TP:     { model: TemporaryPermit,       nameField: 'permitHolder' },
  TPOS:   { model: TemporaryPermitOtherState, nameField: 'permitHolder' },
  PUC:    { model: Puc,                  nameField: 'ownerName' },
  HPA:    { model: HpaHpt,              nameField: 'ownerName' },
}

async function enrichWithCustomerName(items) {
  const grouped = {}
  for (const item of items) {
    if (!grouped[item.workType]) grouped[item.workType] = []
    grouped[item.workType].push(item)
  }

  for (const [workType, typeItems] of Object.entries(grouped)) {
    const mapping = workModels[workType]
    if (!mapping) continue

    const ids = typeItems.map(t => t.workId).filter(Boolean)
    if (ids.length === 0) continue

    const docs = await mapping.model.find({ _id: { $in: ids } }).lean()
    const nameMap = {}
    docs.forEach(d => { nameMap[d._id.toString()] = d[mapping.nameField] || '' })

    typeItems.forEach(t => {
      t.customerName = nameMap[t.workId?.toString()] || ''
    })
  }

  return items
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

    await enrichWithCustomerName(enriched)

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
    const { fromDate, toDate, employee } = req.query
    const filter = { userId: req.user.id }

    if (employee) filter.receivedBy = employee
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

    await enrichWithCustomerName(enriched)

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
