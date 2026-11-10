import { useState, useEffect, useMemo } from 'react'
import SearchSelect from './SearchSelect'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://api.rtosarthi.com'
const IST = 'Asia/Kolkata'

const formatRupees = (n) =>
  `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
const formatNumber = (n) => Number(n || 0).toLocaleString('en-IN')
const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString('en-IN', { timeZone: IST, day: '2-digit', month: 'short', year: 'numeric' }) : '-'
const todayIST = () => new Date().toLocaleDateString('en-CA', { timeZone: IST })
const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100

const inputClass =
  'w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent'
const labelClass = 'block text-xs sm:text-sm font-semibold text-gray-700 mb-1'

/**
 * Re-price a user's unused API calls when the price changes: what the calls left are worth at the rate
 * they were sold at becomes calls at the new rate, e.g. 400 calls left @ ₹2 = ₹800 -> 200 calls @ ₹4.
 * Shows the user's earlier sales and adjustments with their rates. `onDone(message)` after saving.
 */
const RateAdjustModal = ({ userId: initialUserId = '', userOptions, onClose, onDone }) => {
  const [userId, setUserId] = useState(initialUserId)
  const [info, setInfo] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [oldRate, setOldRate] = useState('')
  const [newRate, setNewRate] = useState('')
  const [date, setDate] = useState(todayIST())
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!userId) {
      setInfo(null)
      return undefined
    }
    let active = true
    setLoading(true)
    setError('')
    fetch(`${BACKEND_URL}/api/admin/api-credits/adjust/${userId}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((json) => {
        if (!active) return
        if (!json.success) throw new Error(json.message || 'Failed to load the user')
        setInfo(json.data)
        setOldRate(json.data.currentRate != null ? String(json.data.currentRate) : '')
      })
      .catch((err) => active && setError(err.message || 'Failed to load the user'))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [userId])

  const left = info?.user?.left || 0
  const oldPrice = Number(oldRate)
  const newPrice = Number(newRate)
  const validOld = oldRate !== '' && !Number.isNaN(oldPrice) && oldPrice >= 0
  const validNew = newRate !== '' && !Number.isNaN(newPrice) && newPrice > 0
  const balance = validOld ? round2(left * oldPrice) : null
  const callsAfter = balance !== null && validNew ? Math.floor(balance / newPrice + 1e-9) : null
  const leftover = callsAfter !== null ? round2(balance - callsAfter * newPrice) : null
  const change = callsAfter !== null ? callsAfter - left : null

  // Earlier rates the user bought at, for a quick pick of the old rate
  const pastRates = useMemo(
    () => [...new Set((info?.history || []).filter((t) => t.type === 'sale').map((t) => t.rate))],
    [info]
  )

  const submit = async (e) => {
    e.preventDefault()
    if (!userId) return setError('Please select a user')
    if (left <= 0) return setError('This user has no API calls left to adjust')
    if (!validOld) return setError('Enter the rate the calls left were sold at')
    if (!validNew) return setError('Enter the new rate per API call')
    if (change === 0) return setError('The number of calls stays the same at this rate')
    const msg = `Adjust ${info.user.name}?\n\n${formatNumber(left)} calls @ ${formatRupees(oldPrice)} = ${formatRupees(balance)}\n→ ${formatNumber(callsAfter)} calls @ ${formatRupees(newPrice)}${leftover > 0 ? ` (${formatRupees(leftover)} left over)` : ''}\n\nTheir limit changes by ${change > 0 ? '+' : ''}${formatNumber(change)}.`
    if (!confirm(msg)) return
    try {
      setSaving(true)
      setError('')
      const res = await fetch(`${BACKEND_URL}/api/admin/api-credits/adjust`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, oldRate: oldPrice, newRate: newPrice, date, note })
      })
      const json = await res.json()
      if (!json.success) return setError(json.message || 'Failed to save')
      onDone(json.message)
    } catch {
      setError('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className='fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center sm:p-4' onClick={() => !saving && onClose()}>
      <div
        className='bg-white w-full sm:max-w-2xl rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[92vh] flex flex-col'
        onClick={(e) => e.stopPropagation()}
        role='dialog'
        aria-modal='true'
        aria-labelledby='rate-adjust-title'
      >
        <div className='px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-t-2xl flex items-start justify-between gap-3'>
          <div>
            <h2 id='rate-adjust-title' className='text-lg font-bold'>Adjust Rate of Calls Left</h2>
            <p className='text-xs text-amber-50 mt-0.5'>The value of the calls a user has left is turned into calls at the new rate</p>
          </div>
          <button onClick={onClose} disabled={saving} className='text-white/80 hover:text-white text-2xl leading-none cursor-pointer' aria-label='Close'>
            ×
          </button>
        </div>

        <form onSubmit={submit} className='p-4 sm:p-6 overflow-y-auto space-y-4'>
          <div>
            <label className={labelClass}>User</label>
            <SearchSelect
              value={userId}
              onChange={(value) => setUserId(value || '')}
              options={userOptions}
              placeholder='Select user'
              searchPlaceholder='Search name or mobile…'
              emptyText='No user found'
              ariaLabel='User to adjust'
            />
          </div>

          {loading && <div className='h-24 bg-gray-50 rounded-xl animate-pulse' />}

          {info && !loading && (
            <>
              {/* Where the user stands now */}
              <div className='grid grid-cols-3 gap-2'>
                <div className='p-2.5 rounded-lg bg-gray-50 border border-gray-100'>
                  <p className='text-[10px] font-semibold text-gray-500 uppercase tracking-wide'>Calls left</p>
                  <p className='text-lg font-bold text-gray-900 tabular-nums'>{formatNumber(left)}</p>
                  <p className='text-[11px] text-gray-500'>{formatNumber(info.user.used)} used of {formatNumber(info.user.limit)}</p>
                </div>
                <div className='p-2.5 rounded-lg bg-gray-50 border border-gray-100'>
                  <p className='text-[10px] font-semibold text-gray-500 uppercase tracking-wide'>Current rate</p>
                  <p className='text-lg font-bold text-gray-900 tabular-nums'>{info.currentRate != null ? formatRupees(info.currentRate) : '-'}</p>
                  <p className='text-[11px] text-gray-500'>
                    {info.sales.avgRate != null ? `avg ${formatRupees(info.sales.avgRate)} over ${info.sales.count} sale${info.sales.count === 1 ? '' : 's'}` : 'No sale yet'}
                  </p>
                </div>
                <div className='p-2.5 rounded-lg bg-amber-50 border border-amber-100'>
                  <p className='text-[10px] font-semibold text-gray-500 uppercase tracking-wide'>Balance value</p>
                  <p className='text-lg font-bold text-amber-700 tabular-nums'>{balance !== null ? formatRupees(balance) : '-'}</p>
                  <p className='text-[11px] text-gray-500'>calls left × rate sold at</p>
                </div>
              </div>

              <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
                <div>
                  <label className={labelClass}>Rate sold at (₹ per call)</label>
                  <input type='number' min='0' step='any' value={oldRate} onChange={(e) => setOldRate(e.target.value)} className={inputClass} required />
                  {pastRates.length > 1 && (
                    <div className='flex flex-wrap gap-1 mt-1'>
                      {pastRates.map((r) => (
                        <button
                          key={r}
                          type='button'
                          onClick={() => setOldRate(String(r))}
                          className='px-1.5 py-0.5 text-[10px] font-semibold rounded border border-gray-200 text-gray-600 hover:bg-gray-50 cursor-pointer'
                        >
                          {formatRupees(r)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <label className={labelClass}>New rate (₹ per call)</label>
                  <input
                    type='number'
                    min='0'
                    step='any'
                    value={newRate}
                    onChange={(e) => setNewRate(e.target.value)}
                    className={inputClass}
                    placeholder='e.g. 4'
                    autoFocus
                    required
                  />
                </div>
                <div>
                  <label className={labelClass}>Date</label>
                  <input type='date' value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} required />
                </div>
              </div>

              {/* Result, worked out as you type */}
              <div className={`p-3 rounded-xl border ${callsAfter === null ? 'bg-gray-50 border-gray-100' : 'bg-emerald-50 border-emerald-200'}`}>
                {callsAfter === null ? (
                  <p className='text-sm text-gray-500'>Enter the new rate to see the calls the user will have.</p>
                ) : (
                  <>
                    <p className='text-sm text-gray-800'>
                      <span className='font-semibold'>{formatNumber(left)}</span> calls × {formatRupees(oldPrice)} ={' '}
                      <span className='font-semibold'>{formatRupees(balance)}</span> ÷ {formatRupees(newPrice)} ={' '}
                      <span className='text-xl font-bold text-emerald-700 tabular-nums'>{formatNumber(callsAfter)}</span> calls
                    </p>
                    <p className='text-xs text-gray-600 mt-1'>
                      Calls left {formatNumber(left)} → {formatNumber(callsAfter)} (
                      <span className={change < 0 ? 'text-red-600 font-semibold' : 'text-emerald-700 font-semibold'}>
                        {change > 0 ? '+' : ''}
                        {formatNumber(change)}
                      </span>
                      ) · limit {formatNumber(info.user.limit)} → {formatNumber(info.user.used + callsAfter)}
                      {leftover > 0 && <> · {formatRupees(leftover)} left over (less than one call)</>}
                    </p>
                  </>
                )}
              </div>

              <div>
                <label className={labelClass}>Note (optional)</label>
                <input value={note} onChange={(e) => setNote(e.target.value)} className={inputClass} placeholder='e.g. Provider price went up' />
              </div>

              {/* Previous selling rates */}
              <div className='border border-gray-100 rounded-xl overflow-hidden'>
                <p className='text-xs font-bold text-gray-700 px-3 py-2 bg-gray-50 border-b border-gray-100'>
                  Previous sales &amp; adjustments
                  {info.sales.count > 0 && (
                    <span className='font-normal text-gray-500'>
                      {' '}· {formatNumber(info.sales.quantity)} calls sold for {formatRupees(info.sales.amount)}
                    </span>
                  )}
                </p>
                {info.history.length ? (
                  <div className='max-h-48 overflow-y-auto divide-y divide-gray-100'>
                    {info.history.map((t) => (
                      <div key={t._id} className='flex items-center justify-between gap-2 px-3 py-1.5 text-xs'>
                        <span className='text-gray-500 whitespace-nowrap'>{formatDate(t.date)}</span>
                        {t.type === 'sale' ? (
                          <>
                            <span className='text-gray-700'>
                              Sold <span className='font-semibold'>{formatNumber(t.quantity)}</span> calls @{' '}
                              <span className='font-semibold'>{formatRupees(t.rate)}</span>
                            </span>
                            <span className='font-semibold text-gray-900 tabular-nums'>{formatRupees(t.amount)}</span>
                          </>
                        ) : (
                          <>
                            <span className='text-amber-700'>
                              Adjusted {formatNumber(t.callsBefore)} @ {formatRupees(t.oldRate)} → {formatNumber(t.quantity)} @{' '}
                              <span className='font-semibold'>{formatRupees(t.rate)}</span>
                            </span>
                            <span className='text-gray-500 tabular-nums'>{formatRupees(t.balance)}</span>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className='px-3 py-3 text-xs text-gray-500'>No sale recorded for this user.</p>
                )}
              </div>
            </>
          )}

          {error && <p className='text-sm text-red-600 font-medium'>{error}</p>}

          <div className='flex justify-end gap-2 pt-1'>
            <button type='button' onClick={onClose} disabled={saving} className='px-4 py-2 text-sm font-semibold text-gray-600 rounded-lg hover:bg-gray-100 cursor-pointer'>
              Cancel
            </button>
            <button
              type='submit'
              disabled={saving || !info || callsAfter === null || change === 0}
              className='px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg shadow disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer'
            >
              {saving ? 'Saving…' : 'Adjust Calls'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default RateAdjustModal
