import { useState } from 'react'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://api.rtosarthi.com'

const formatRupees = (n) => `₹${Math.abs(Number(n) || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
const formatNumber = (n) => Number(n || 0).toLocaleString('en-IN')
const todayIST = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })

const inputClass =
  'w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
const labelClass = 'block text-xs sm:text-sm font-semibold text-gray-700 mb-1'

// Sell API calls on one API key. Raises the key's own limit (not the user's RC search limit).
const ApiKeySaleModal = ({ apiKey, defaultRate = '', onClose, onSaved }) => {
  const [form, setForm] = useState({ quantity: '', rate: defaultRate, paidAmount: '', date: todayIST(), note: '' })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const quantity = Number(form.quantity)
  const rate = Number(form.rate)
  const total =
    form.quantity !== '' && form.rate !== '' && !Number.isNaN(quantity) && !Number.isNaN(rate)
      ? Math.round(quantity * rate * 100) / 100
      : null
  // Blank "Paid" means the full amount was received
  const paid = form.paidAmount === '' ? total : Number(form.paidAmount)
  const pending = total !== null && paid !== null && !Number.isNaN(paid) ? Math.round((total - paid) * 100) / 100 : null

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!Number.isInteger(quantity) || quantity < 1) return setError('Number of API calls must be a whole number of at least 1')
    if (form.rate === '' || Number.isNaN(rate) || rate < 0) return setError('Please enter the price per API call')
    if (!form.date) return setError('Please choose a date')
    if (form.paidAmount !== '' && (Number.isNaN(paid) || paid < 0)) return setError('Paid amount must be 0 or more')
    if (pending !== null && pending < 0) return setError('Paid amount cannot be more than the total')

    try {
      setSaving(true)
      const res = await fetch(`${BACKEND_URL}/api/admin/api-keys/${apiKey._id}/sales`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity, rate, paidAmount: form.paidAmount, date: form.date, note: form.note })
      })
      const json = await res.json()
      if (!json.success) return setError(json.message || 'Failed to save')
      onSaved(json.message)
    } catch {
      setError('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const left = Math.max(0, (apiKey.callLimit || 0) - (apiKey.callCount || 0))

  return (
    <div className='fixed inset-0 bg-black/50 z-50 overflow-y-auto'>
      <div className='flex items-start justify-center min-h-full px-3 py-8 sm:py-16'>
        <div className='bg-white rounded-lg shadow-xl max-w-md w-full p-5'>
          <div className='flex justify-between items-start mb-4'>
            <div>
              <h2 className='text-lg font-bold text-gray-800'>Sell API Calls · {apiKey.name}</h2>
              <p className='text-xs text-gray-500 mt-0.5'>
                Adds to this API key's limit and records the money received. The user's RC search limit is not changed.
              </p>
            </div>
            <button onClick={onClose} className='text-gray-500 hover:text-gray-700 p-1 cursor-pointer' aria-label='Close'>
              <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
              </svg>
            </button>
          </div>

          <p className='text-[11px] text-gray-500 mb-3'>
            Now: {formatNumber(apiKey.callCount)} used of {formatNumber(apiKey.callLimit)} · {formatNumber(left)} left
          </p>

          <form onSubmit={handleSubmit} className='space-y-3'>
            <div className='grid grid-cols-2 gap-3'>
              <div>
                <label className={labelClass}>API Calls</label>
                <input type='number' name='quantity' value={form.quantity} onChange={handleChange} placeholder='1000' min='1' step='1' autoFocus className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Price per Call (₹)</label>
                <input type='number' name='rate' value={form.rate} onChange={handleChange} placeholder='2' min='0' step='0.01' className={inputClass} />
              </div>
            </div>
            <div className='grid grid-cols-2 gap-3'>
              <div>
                <label className={labelClass}>
                  Paid Now (₹) <span className='text-gray-400'>(Opt)</span>
                </label>
                <input type='number' name='paidAmount' value={form.paidAmount} onChange={handleChange} placeholder={total === null ? 'Full amount' : String(total)} min='0' step='0.01' className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Date</label>
                <input type='date' name='date' value={form.date} onChange={handleChange} className={inputClass} />
              </div>
            </div>
            <div>
              <label className={labelClass}>
                Note <span className='text-gray-400'>(Opt)</span>
              </label>
              <input type='text' name='note' value={form.note} onChange={handleChange} placeholder='e.g. Paid by UPI' className={inputClass} />
            </div>

            <div className='p-3 rounded-lg bg-gray-50 border border-gray-200 text-sm'>
              <div className='flex items-center justify-between'>
                <span className='text-gray-600'>Customer pays you</span>
                <span className='text-lg font-bold text-gray-900 tabular-nums'>{total === null ? '-' : formatRupees(total)}</span>
              </div>
              {total !== null && (
                <div className='flex items-center justify-between text-xs mt-1'>
                  <span className='text-gray-500'>Paid {paid !== null && !Number.isNaN(paid) ? formatRupees(paid) : '-'}</span>
                  <span className={`font-semibold ${pending > 0 ? 'text-amber-600' : pending < 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                    {pending > 0 ? `${formatRupees(pending)} pending` : pending < 0 ? 'More than total' : 'Fully paid'}
                  </span>
                </div>
              )}
              {Number.isInteger(quantity) && quantity > 0 && (
                <p className='text-[11px] text-gray-500 mt-1'>
                  Limit goes from {formatNumber(apiKey.callLimit)} to <strong>{formatNumber((apiKey.callLimit || 0) + quantity)}</strong>
                </p>
              )}
            </div>

            {error && <div className='p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700'>{error}</div>}

            <div className='flex gap-2 pt-1'>
              <button type='button' onClick={onClose} className='flex-1 px-4 py-2 text-sm font-semibold rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer'>
                Cancel
              </button>
              <button type='submit' disabled={saving} className='flex-1 px-4 py-2 text-sm font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-wait cursor-pointer'>
                {saving ? 'Saving...' : 'Sell & Add Limit'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default ApiKeySaleModal
