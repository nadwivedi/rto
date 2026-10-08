// Expiry helpers for saved RC lookups (vehicle search history).
// The lookup API returns dates as text, so they are parsed here before anything is compared.

const MONTHS = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 }

// Documents a saved RC lookup has an expiry date for. `type` matches the lead types in models/Lead.js.
// (The lookup gives a permit number but no permit expiry date, so Permit is not here.)
const VEHICLE_DOCS = [
  { type: 'Insurance', field: 'insuranceUpto', rawKeys: ['INSURANCE_UPTO'] },
  { type: 'Fitness', field: 'fitnessUpto', rawKeys: ['FIT_UPTO'] },
  { type: 'Tax', field: 'taxUpto', rawKeys: ['TAX_UPTO'] },
  { type: 'PUC', field: 'pucUpto', rawKeys: ['PUCC_UPTO', 'PUC_UPTO'] }
]
const VEHICLE_DOC_TYPES = VEHICLE_DOCS.map(doc => doc.type)

const toISO = (year, month, day) => {
  const date = new Date(Date.UTC(year, month - 1, day))
  // Rejects impossible dates like 31-02-2027, which Date would silently roll over
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return ''
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

// '14-Jul-2027', '31-03-2027' or '2027-03-31' -> '2027-07-14'.
// Returns '' when there is no real date: blank, 'NA', or 'LTT' (lifetime tax, which never expires).
const parseExpiryDate = (value) => {
  const text = String(value || '').trim()
  if (!text) return ''

  let match = text.match(/^(\d{1,2})[-/. ]([A-Za-z]{3,9})[-/., ]+(\d{4})$/)
  if (match) {
    const month = MONTHS[match[2].slice(0, 3).toLowerCase()]
    return month ? toISO(Number(match[3]), month, Number(match[1])) : ''
  }

  match = text.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/)
  if (match) return toISO(Number(match[3]), Number(match[2]), Number(match[1]))

  match = text.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (match) return toISO(Number(match[1]), Number(match[2]), Number(match[3]))

  return ''
}

// Whole days from `today` to `iso` (both 'YYYY-MM-DD'); negative when already expired
const daysUntil = (iso, today) => {
  const [y1, m1, d1] = today.split('-').map(Number)
  const [y2, m2, d2] = iso.split('-').map(Number)
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86400000)
}

// Every document of a saved lookup that has a real expiry date
const getVehicleDocuments = (record, today) => {
  const documents = []
  VEHICLE_DOCS.forEach(({ type, field, rawKeys }) => {
    const value = record[field] || rawKeys.map(key => record.rawResponse?.[key]).find(Boolean)
    const expiryDate = parseExpiryDate(value)
    if (expiryDate) documents.push({ type, expiryDate, daysLeft: daysUntil(expiryDate, today) })
  })
  return documents
}

// Documents that satisfy the page filters, or null when the record should be hidden.
//   docType: 'all' or one document type
//   expiry:  'any', 'expired', or a number of days ('30' = expires within the next 30 days)
const matchExpiry = (documents, { docType, expiry }) => {
  const pool = docType === 'all' ? documents : documents.filter(doc => doc.type === docType)
  if (expiry === 'any') return docType === 'all' || pool.length ? pool : null

  const matched = expiry === 'expired'
    ? pool.filter(doc => doc.daysLeft < 0)
    : pool.filter(doc => doc.daysLeft >= 0 && doc.daysLeft <= Number(expiry))
  return matched.length ? matched : null
}

// How urgent a lead is, from how close its document is to expiring
const leadPriorityFor = (daysLeft) => {
  if (daysLeft <= 30) return 'hot'
  if (daysLeft <= 90) return 'warm'
  return 'cold'
}

module.exports = {
  VEHICLE_DOC_TYPES,
  parseExpiryDate,
  daysUntil,
  getVehicleDocuments,
  matchExpiry,
  leadPriorityFor
}
