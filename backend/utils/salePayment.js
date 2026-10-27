// Money received on API call sales (user sales and API key sales)

const roundMoney = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100

// Sales saved before paidAmount existed were fully paid
const PAID_EXPR = { $ifNull: ['$paidAmount', '$amount'] }
const salePaid = (sale) => sale.paidAmount ?? sale.amount

// Reads a "paid" input against the sale amount: blank means paid in full.
// Returns { value } or { error }.
const parsePaid = (paidAmount, amount) => {
  if (paidAmount === undefined || paidAmount === null || paidAmount === '') return { value: amount }
  const paid = Number(paidAmount)
  if (Number.isNaN(paid) || paid < 0) return { error: 'Paid amount must be 0 or more' }
  if (roundMoney(paid) > amount) return { error: `Paid amount cannot be more than the sale amount (₹${amount})` }
  return { value: roundMoney(paid) }
}

module.exports = { PAID_EXPR, salePaid, parsePaid }
