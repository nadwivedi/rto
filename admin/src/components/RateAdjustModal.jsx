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
  'w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none'
const labelClass = 'block text-sm font-semibold text-gray-700 mb-1.5'

/**
 * Re-price a user's unused API calls when the price changes: what the calls left are worth at the rate
 * they were sold at becomes calls at the new rate, e.g. 400 calls left @ ₹2 = ₹800 -> 200 calls @ ₹4.
 * Shows the user's earlier sales and adjustments with their rates. `onDone(message)` after saving.
 */
const RateAdjustModal = ({ userId: initialUserId = '', product: initialProduct = 'rc', userOptions, onClose, onDone }) => {
  const [userId, setUserId] = useState(initialUserId)
  // Vehicle RC or HSRP calls: each has its own limit and rates
  const [product, setProduct] = useState(initialProduct === 'hsrp' ? 'hsrp' : 'rc')
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
    fetch(`${BACKEND_URL}/api/admin/api-credits/adjust/${userId}?product=${product}`, { credentials: 'include' })
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
  }, [userId, product])

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
    const msg = `Adjust ${info.user.name} (${product === 'hsrp' ? 'HSRP' : 'Vehicle RC'})?\n\n${formatNumber(left)} calls @ ${formatRupees(oldPrice)} = ${formatRupees(balance)}\n→ ${formatNumber(callsAfter)} calls @ ${formatRupees(newPrice)}${leftover > 0 ? ` (${formatRupees(leftover)} left over)` : ''}\n\nTheir limit changes by ${change > 0 ? '+' : ''}${formatNumber(change)}.`
    if (!confirm(msg)) return
    try {
      setSaving(true)
      setError('')
      const res = await fetch(`${BACKEND_URL}/api/admin/api-credits/adjust`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, product, oldRate: oldPrice, newRate: newPrice, date, note })
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
    <div
      className='fixed inset-0 bg-gray-900/60 backdrop-blur-[2px] z-50 flex items-end sm:items-center justify-center sm:p-6'
      onClick={() => !saving && onClose()}
    >
      <div
        className='bg-gray-50 w-full min-w-0 sm:max-w-4xl rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[94vh] flex flex-col overflow-hidden'
        onClick={(e) => e.stopPropagation()}
        role='dialog'
        aria-modal='true'
        aria-labelledby='rate-adjust-title'
      >
        {/* Header */}
        <div className='px-5 sm:px-8 py-4 sm:py-5 bg-white border-b border-gray-200 flex items-start justify-between gap-4'>
          <div className='flex items-start gap-3 sm:gap-4'>
            <div className='hidden sm:flex w-11 h-11 rounded-2xl bg-amber-100 text-amber-600 items-center justify-center shrink-0'>
              <ScaleIcon />
            </div>
            <div>
              <h2 id='rate-adjust-title' className='text-lg sm:text-xl font-bold text-gray-900'>Adjust rate of calls left</h2>
              <p className='text-sm text-gray-500 mt-0.5'>
                The money value of a user's unused calls is turned into calls at the new rate.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={saving}
            className='w-9 h-9 -mr-1 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 text-2xl leading-none cursor-pointer shrink-0'
            aria-label='Close'
          >
            ×
          </button>
        </div>

        <form onSubmit={submit} className='flex-1 min-h-0 flex flex-col'>
          <div className='flex-1 overflow-y-auto px-5 sm:px-8 py-5 sm:py-6 space-y-5 sm:space-y-6'>
            {/* Step 1: user */}
            <section className='bg-white rounded-2xl border border-gray-200 p-4 sm:p-5'>
              <div className='flex flex-wrap items-center justify-between gap-2 mb-3 sm:mb-4'>
                <StepTitle n={1} title='Choose the user' className='' />
                <div className='inline-flex rounded-lg border border-gray-300 overflow-hidden bg-white' role='group' aria-label='Calls for'>
                  {[
                    ['rc', 'Vehicle RC'],
                    ['hsrp', 'HSRP']
                  ].map(([value, label], i) => (
                    <button
                      key={value}
                      type='button'
                      onClick={() => setProduct(value)}
                      aria-pressed={product === value}
                      className={`px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                        product === value ? (value === 'hsrp' ? 'bg-teal-600 text-white' : 'bg-gray-900 text-white') : 'text-gray-600 hover:bg-gray-50'
                      } ${i > 0 ? 'border-l border-gray-300' : ''}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <SearchSelect
                value={userId}
                onChange={(value) => setUserId(value || '')}
                options={userOptions}
                placeholder='Select user'
                searchPlaceholder='Search name or mobile…'
                emptyText='No user found'
                ariaLabel='User to adjust'
              />

              {loading && (
                <div className='mt-4 grid grid-cols-3 gap-2 sm:gap-3'>
                  {[0, 1, 2].map((i) => <div key={i} className='h-24 bg-gray-100 rounded-xl animate-pulse' />)}
                </div>
              )}

              {info && !loading && (
                <div className='mt-4 grid grid-cols-3 gap-2 sm:gap-3'>
                  <Stat label={product === 'hsrp' ? 'HSRP calls left' : 'RC calls left'} value={formatNumber(left)} sub={`${formatNumber(info.user.used)} used of ${formatNumber(info.user.limit)}`} />
                  <Stat
                    label='Current rate'
                    value={info.currentRate != null ? `${formatRupees(info.currentRate)}` : '-'}
                    unit={info.currentRate != null ? '/ call' : ''}
                    sub={info.sales.avgRate != null ? `Avg ${formatRupees(info.sales.avgRate)} over ${info.sales.count} sale${info.sales.count === 1 ? '' : 's'}` : 'No sale yet'}
                  />
                  <Stat
                    label='Balance value'
                    value={balance !== null ? formatRupees(balance) : '-'}
                    sub='Calls left × rate sold at'
                    tone='amber'
                  />
                </div>
              )}
            </section>

            {info && !loading && (
              <>
                {/* Step 2: rates and result side by side */}
                <section className='bg-white rounded-2xl border border-gray-200 p-4 sm:p-5'>
                  <StepTitle n={2} title='Enter the new rate' />
                  <div className='grid grid-cols-1 lg:grid-cols-5 gap-5 lg:gap-6'>
                    <div className='lg:col-span-3 space-y-4'>
                      <div className='grid grid-cols-2 gap-3 sm:gap-4'>
                        <div className='min-w-0'>
                          <label className={labelClass} htmlFor='adj-old-rate'>Rate it was sold at</label>
                          <RupeeInput id='adj-old-rate' value={oldRate} onChange={setOldRate} />
                          {pastRates.length > 1 && (
                            <div className='flex flex-wrap items-center gap-1.5 mt-2'>
                              <span className='text-xs text-gray-400'>Sold at:</span>
                              {pastRates.map((r) => (
                                <button
                                  key={r}
                                  type='button'
                                  onClick={() => setOldRate(String(r))}
                                  className={`px-2.5 py-1 text-xs font-semibold rounded-full border transition-colors cursor-pointer ${
                                    Number(oldRate) === r ? 'bg-amber-500 border-amber-500 text-white' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                  }`}
                                >
                                  {formatRupees(r)}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className='min-w-0'>
                          <label className={labelClass} htmlFor='adj-new-rate'>New rate</label>
                          <RupeeInput id='adj-new-rate' value={newRate} onChange={setNewRate} placeholder='e.g. 4' autoFocus highlight />
                        </div>
                      </div>
                      <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                        <div>
                          <label className={labelClass} htmlFor='adj-date'>Date</label>
                          <input id='adj-date' type='date' value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} required />
                        </div>
                        <div>
                          <label className={labelClass} htmlFor='adj-note'>
                            Note <span className='font-normal text-gray-400'>(optional)</span>
                          </label>
                          <input id='adj-note' value={note} onChange={(e) => setNote(e.target.value)} className={inputClass} placeholder='e.g. Provider price went up' />
                        </div>
                      </div>
                    </div>

                    {/* Result, worked out as you type */}
                    <div className='lg:col-span-2'>
                      <div
                        className={`h-full rounded-2xl border-2 p-4 sm:p-5 flex flex-col justify-center ${
                          callsAfter === null ? 'border-dashed border-gray-200 bg-gray-50' : 'border-emerald-200 bg-emerald-50/60'
                        }`}
                      >
                        {callsAfter === null ? (
                          <p className='text-sm text-gray-500 text-center'>Enter the new rate to see how many calls the user will have.</p>
                        ) : (
                          <>
                            <div className='flex items-center justify-between gap-2 text-center'>
                              <div className='flex-1'>
                                <p className='text-xs font-semibold text-gray-500 uppercase tracking-wide'>Now</p>
                                <p className='text-2xl font-bold text-gray-700 tabular-nums mt-1'>{formatNumber(left)}</p>
                                <p className='text-xs text-gray-500'>@ {formatRupees(oldPrice)}</p>
                              </div>
                              <span className='text-2xl text-gray-300' aria-hidden='true'>→</span>
                              <div className='flex-1'>
                                <p className='text-xs font-semibold text-emerald-700 uppercase tracking-wide'>After</p>
                                <p className='text-4xl font-extrabold text-emerald-700 tabular-nums mt-0.5'>{formatNumber(callsAfter)}</p>
                                <p className='text-xs text-emerald-700'>@ {formatRupees(newPrice)}</p>
                              </div>
                            </div>
                            <dl className='mt-4 pt-4 border-t border-emerald-200/70 space-y-2 text-sm'>
                              <Row label='Balance value' value={`${formatNumber(left)} × ${formatRupees(oldPrice)} = ${formatRupees(balance)}`} />
                              <Row label='New calls' value={`${formatRupees(balance)} ÷ ${formatRupees(newPrice)} = ${formatNumber(callsAfter)}`} />
                              <Row
                                label='Calls change'
                                value={`${change > 0 ? '+' : ''}${formatNumber(change)}`}
                                valueClass={change < 0 ? 'text-red-600' : change > 0 ? 'text-emerald-700' : 'text-gray-700'}
                              />
                              <Row label='Limit' value={`${formatNumber(info.user.limit)} → ${formatNumber(info.user.used + callsAfter)}`} />
                              {leftover > 0 && <Row label='Left over' value={`${formatRupees(leftover)} (less than 1 call)`} valueClass='text-amber-700' />}
                            </dl>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </section>

                {/* Previous selling rates */}
                <section className='bg-white rounded-2xl border border-gray-200 overflow-hidden'>
                  <div className='px-4 sm:px-5 py-3 border-b border-gray-100 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1'>
                    <h3 className='text-sm font-bold text-gray-800'>Previous sales &amp; adjustments</h3>
                    {info.sales.count > 0 && (
                      <p className='text-xs text-gray-500'>
                        {formatNumber(info.sales.quantity)} calls sold for {formatRupees(info.sales.amount)}
                      </p>
                    )}
                  </div>
                  {info.history.length ? (
                    <div className='max-h-60 overflow-auto max-w-full'>
                      <table className='w-full text-sm'>
                        <thead className='sticky top-0 bg-gray-50 text-[11px] uppercase tracking-wider text-gray-500'>
                          <tr>
                            <th className='px-4 sm:px-5 py-2 text-left font-semibold'>Date</th>
                            <th className='px-3 py-2 text-left font-semibold'>Type</th>
                            <th className='px-3 py-2 text-right font-semibold'>Calls</th>
                            <th className='px-3 py-2 text-right font-semibold'>Rate</th>
                            <th className='px-4 sm:px-5 py-2 text-right font-semibold'>Amount</th>
                          </tr>
                        </thead>
                        <tbody className='divide-y divide-gray-100'>
                          {info.history.map((t) => {
                            const adj = t.type === 'adjustment'
                            return (
                              <tr key={t._id} className='hover:bg-gray-50/70'>
                                <td className='px-4 sm:px-5 py-2.5 text-gray-600 whitespace-nowrap'>{formatDate(t.date)}</td>
                                <td className='px-3 py-2.5'>
                                  <span
                                    className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                                      adj ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
                                    }`}
                                  >
                                    {adj ? 'Adjusted' : 'Sold'}
                                  </span>
                                </td>
                                <td className='px-3 py-2.5 text-right tabular-nums text-gray-800 whitespace-nowrap'>
                                  {adj ? `${formatNumber(t.callsBefore)} → ${formatNumber(t.quantity)}` : formatNumber(t.quantity)}
                                </td>
                                <td className='px-3 py-2.5 text-right tabular-nums font-semibold text-gray-900 whitespace-nowrap'>
                                  {adj ? `${formatRupees(t.oldRate)} → ${formatRupees(t.rate)}` : formatRupees(t.rate)}
                                </td>
                                <td className='px-4 sm:px-5 py-2.5 text-right tabular-nums text-gray-700 whitespace-nowrap'>
                                  {formatRupees(adj ? t.balance : t.amount)}
                                  {adj && <div className='text-[10px] text-gray-400'>value</div>}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className='px-5 py-6 text-sm text-gray-500 text-center'>No sale recorded for this user.</p>
                  )}
                </section>
              </>
            )}

            {error && (
              <div className='p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 font-medium' role='alert'>
                {error}
              </div>
            )}
          </div>

          {/* Footer stays in view while the body scrolls */}
          <div className='px-5 sm:px-8 py-3 sm:py-4 bg-white border-t border-gray-200 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4'>
            <p className='text-xs text-gray-500 text-center sm:text-left'>
              {callsAfter !== null && info
                ? `${info.user.name} will have ${formatNumber(callsAfter)} calls left at ${formatRupees(newPrice)} each.`
                : 'No money is charged or refunded. Only the calls left change.'}
            </p>
            <div className='flex gap-2 justify-end'>
              <button
                type='button'
                onClick={onClose}
                disabled={saving}
                className='flex-1 sm:flex-none px-5 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 cursor-pointer'
              >
                Cancel
              </button>
              <button
                type='submit'
                disabled={saving || !info || callsAfter === null || change === 0}
                className='flex-1 sm:flex-none px-6 py-2.5 text-sm font-semibold text-white bg-amber-500 hover:bg-amber-600 rounded-xl shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors'
              >
                {saving ? 'Saving…' : 'Adjust calls'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

const StepTitle = ({ n, title, className = 'mb-3 sm:mb-4' }) => (
  <div className={`flex items-center gap-2.5 ${className}`}>
    <span className='w-6 h-6 rounded-full bg-gray-900 text-white text-xs font-bold flex items-center justify-center'>{n}</span>
    <h3 className='text-sm sm:text-base font-bold text-gray-800'>{title}</h3>
  </div>
)

const Stat = ({ label, value, unit, sub, tone }) => (
  <div className={`min-w-0 rounded-xl p-2.5 sm:p-4 border ${tone === 'amber' ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-200'}`}>
    <p className='text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wide truncate'>{label}</p>
    <p className={`text-xl sm:text-3xl font-bold tabular-nums mt-1 ${tone === 'amber' ? 'text-amber-700' : 'text-gray-900'}`}>
      {value}
      {unit && <span className='text-xs sm:text-sm font-medium text-gray-400 ml-1'>{unit}</span>}
    </p>
    <p className='text-[11px] sm:text-xs text-gray-500 mt-1 leading-snug'>{sub}</p>
  </div>
)

const Row = ({ label, value, valueClass = 'text-gray-800' }) => (
  <div className='flex items-baseline justify-between gap-3'>
    <dt className='text-gray-500'>{label}</dt>
    <dd className={`font-semibold tabular-nums text-right ${valueClass}`}>{value}</dd>
  </div>
)

// Number box with a ₹ in front and "/ call" after
const RupeeInput = ({ id, value, onChange, placeholder, autoFocus, highlight }) => (
  <div
    className={`flex items-center rounded-xl border bg-white focus-within:ring-2 focus-within:ring-amber-500 focus-within:border-transparent ${
      highlight ? 'border-amber-300' : 'border-gray-300'
    }`}
  >
    <span className='pl-3.5 text-lg font-semibold text-gray-400'>₹</span>
    <input
      id={id}
      type='number'
      min='0'
      step='any'
      inputMode='decimal'
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      autoFocus={autoFocus}
      required
      className='w-full min-w-0 px-2 py-2.5 text-lg font-semibold text-gray-900 bg-transparent outline-none tabular-nums'
    />
    <span className='hidden sm:inline pr-3.5 text-sm text-gray-400 whitespace-nowrap'>/ call</span>
  </div>
)

const ScaleIcon = () => (
  <svg className='w-6 h-6' fill='none' stroke='currentColor' strokeWidth={2} viewBox='0 0 24 24' aria-hidden='true'>
    <path strokeLinecap='round' strokeLinejoin='round' d='M12 3v18M5 7h14M5 7l-3 7a4 4 0 006 0L5 7zm14 0l-3 7a4 4 0 006 0l-3-7zM8 21h8' />
  </svg>
)

export default RateAdjustModal
