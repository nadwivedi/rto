import { useState, useEffect, useCallback } from 'react'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://api.rtosarthi.com'

const formatDateTime = (value) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatNumber = (n) => Number(n || 0).toLocaleString('en-IN')

// Low once a tenth of the plan (or 10 searches, whichever is more) is all that is left
const getStatus = (remaining, totalLimit) => {
  if (remaining <= 0) {
    return { label: 'Exhausted', icon: '⛔', chip: 'bg-red-50 text-red-700 border-red-200', bar: 'bg-red-600' }
  }
  const lowMark = Math.max(10, Math.ceil((totalLimit || 0) * 0.1))
  if (remaining <= lowMark) {
    return { label: 'Running low', icon: '⚠️', chip: 'bg-orange-50 text-orange-700 border-orange-200', bar: 'bg-orange-500' }
  }
  return { label: 'Healthy', icon: '✓', chip: 'bg-emerald-50 text-emerald-700 border-emerald-200', bar: 'bg-emerald-600' }
}

// Shows how many Vehicle Info calls are left with API 5 (parzivalapi.online), and API 3's wallet.
// The provider only reports this on a search response, so the figure is as of the last search.
const RcApiUsageCard = ({ className = '' }) => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchUsage = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const response = await fetch(`${BACKEND_URL}/api/admin/users/rc-api-usage`, {
        credentials: 'include'
      })
      const json = await response.json()
      if (json.success) {
        setData(json.data)
      } else {
        setError(json.message || 'Failed to load vehicle API limit')
      }
    } catch {
      setError('Failed to load vehicle API limit')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUsage()
  }, [fetchUsage])

  const usage = data?.usage
  const allocation = data?.allocation
  const hasRemaining = usage && usage.remaining !== null && usage.remaining !== undefined
  const remaining = hasRemaining ? usage.remaining : 0
  const totalLimit = usage?.totalLimit ?? null
  const status = hasRemaining ? getStatus(remaining, totalLimit) : null
  const leftPct = hasRemaining && totalLimit > 0 ? Math.min(100, Math.max(0, (remaining / totalLimit) * 100)) : null
  // More searches promised to users than the provider has left
  const oversold = hasRemaining && allocation && allocation.allocatedRemaining > remaining

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 ${className}`}>
    <div className='bg-white rounded-xl p-4 shadow-sm border border-gray-100'>
      <div className='flex items-start justify-between gap-3'>
        <div>
          <p className='text-xs text-gray-500 font-semibold uppercase tracking-wide'>API 5 Limit</p>
          <p className='text-[11px] text-gray-400 mt-0.5'>Vehicle Info calls left with parzivalapi.online</p>
        </div>
        <div className='flex items-center gap-2 shrink-0'>
          {status && (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-bold ${status.chip}`}>
              <span aria-hidden='true'>{status.icon}</span>
              {status.label}
            </span>
          )}
          <button
            onClick={fetchUsage}
            disabled={loading}
            className='p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors disabled:opacity-40 disabled:cursor-wait cursor-pointer'
            title='Reload (does not use an API search)'
          >
            <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' />
            </svg>
          </button>
        </div>
      </div>

      {error ? (
        <p className='text-sm text-red-600 mt-3'>{error}</p>
      ) : loading && !data ? (
        <div className='mt-3 space-y-2'>
          <div className='h-8 w-40 bg-gray-100 rounded animate-pulse' />
          <div className='h-2 bg-gray-100 rounded animate-pulse' />
        </div>
      ) : !hasRemaining ? (
        <p className='text-sm text-gray-500 mt-3'>
          No API 5 search has been made yet. The calls left appear here after the first API 5 search.
        </p>
      ) : (
        <>
          <div className='flex flex-wrap items-baseline gap-x-2 gap-y-0.5 mt-3'>
            <span className='text-3xl font-bold text-gray-900 tabular-nums'>{formatNumber(remaining)}</span>
            <span className='text-sm text-gray-500'>
              left{totalLimit !== null && <> of {formatNumber(totalLimit)}</>}
            </span>
            {usage.used !== null && usage.used !== undefined && (
              <span className='text-sm text-gray-400'>· {formatNumber(usage.used)} used</span>
            )}
            {usage.lastCharge > 0 && (
              <span className='text-sm text-gray-400'>· ₹{usage.lastCharge} per call</span>
            )}
          </div>

          {leftPct !== null && (
            <div
              className='mt-2.5 h-2 w-full bg-gray-100 rounded-full overflow-hidden'
              role='meter'
              aria-valuemin={0}
              aria-valuemax={totalLimit}
              aria-valuenow={remaining}
              aria-label='Vehicle API searches left'
            >
              <div className={`h-full rounded-full ${status.bar}`} style={{ width: `${leftPct}%` }} />
            </div>
          )}

          <p className='text-[11px] text-gray-400 mt-2'>
            As of the last search
            {usage.checkedAt && <> on {formatDateTime(usage.checkedAt)}</>}
            {usage.lastVehicleNumber && <> ({usage.lastVehicleNumber})</>}. Updates after every API 5 search.
          </p>

          {allocation && allocation.users > 0 && (
            <p className={`text-[11px] mt-1 ${oversold ? 'text-orange-700 font-semibold' : 'text-gray-500'}`}>
              {oversold && <span aria-hidden='true'>⚠️ </span>}
              {formatNumber(allocation.allocatedRemaining)} search
              {allocation.allocatedRemaining === 1 ? '' : 'es'} still allotted to {allocation.users} user
              {allocation.users === 1 ? '' : 's'}
              {oversold && <> — more than the {formatNumber(remaining)} the provider has left</>}.
            </p>
          )}
        </>
      )}

      {/* Same key, separate counter: HSRP (number plate) calls */}
      <Api5HsrpRow usage={data?.hsrpUsage} allocation={data?.hsrpAllocation} />
    </div>
    <Api2Card usage={data?.api2Usage} loading={loading && !data} error={error} onSaved={fetchUsage} />
    <ParzivalCard usage={data?.api3Usage} loading={loading && !data} error={error} />
    </div>
  )
}

// API 5 HSRP calls left, from the last HSRP (or vehicle) reply, and what is still promised to users
const Api5HsrpRow = ({ usage, allocation }) => {
  const has = usage && usage.remaining !== null && usage.remaining !== undefined
  const left = has ? usage.remaining : null
  const oversold = has && allocation && allocation.allocatedRemaining > left
  return (
    <div className='mt-3 pt-3 border-t border-gray-100'>
      <div className='flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1'>
        <p className='text-[11px] font-semibold text-teal-700 uppercase tracking-wide'>HSRP calls left</p>
        {has ? (
          <p className='text-sm'>
            <span className={`text-xl font-bold tabular-nums ${left <= 0 ? 'text-red-600' : left <= 10 ? 'text-orange-600' : 'text-gray-900'}`}>
              {formatNumber(left)}
            </span>
            {usage.lastCharge > 0 && <span className='text-gray-400'> · ₹{usage.lastCharge} per call</span>}
          </p>
        ) : (
          <p className='text-xs text-gray-400'>Shown after the first API 5 search</p>
        )}
      </div>
      {allocation?.users > 0 && (
        <p className={`text-[11px] mt-0.5 ${oversold ? 'text-orange-700 font-semibold' : 'text-gray-500'}`}>
          {formatNumber(allocation.allocatedRemaining)} HSRP search{allocation.allocatedRemaining === 1 ? '' : 'es'} still allotted to {allocation.users} user
          {allocation.users === 1 ? '' : 's'}
          {oversold && <> — more than API 5 has left</>}.
        </p>
      )}
    </div>
  )
}

const DAY_MS = 24 * 60 * 60 * 1000
const formatMoney = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
const formatDate = (value) =>
  new Date(value).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric' })

// API 3 – Parzival API: wallet balance, quota and access expiry, as sent in the meta of its last reply
// API 2: searches used on our key (API 2 sends the running total on every reply) against the searches
// bought. Newly bought searches are added on top of the plan ("+ Add searches"); "Edit total" corrects it.
const Api2Card = ({ usage, loading, error, onSaved }) => {
  // null, 'add' (bought more) or 'set' (correct the total)
  const [mode, setMode] = useState(null)
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [showHistory, setShowHistory] = useState(false)
  const has = (v) => v !== null && v !== undefined
  const used = usage?.used
  const plan = usage?.totalLimit
  const left = has(used) && plan > 0 ? plan - used : null
  const usedPct = has(used) && plan > 0 ? Math.min(100, Math.max(0, (used / plan) * 100)) : null
  const status = left === null ? null : getStatus(left, plan)
  const history = usage?.planHistory || []

  const value = Number(amount)
  const validValue = amount !== '' && Number.isInteger(value) && value >= 1
  const newTotal = !validValue ? null : mode === 'add' ? (plan || 0) + value : value
  const newLeft = newTotal !== null && has(used) ? newTotal - used : null

  const open = (next) => {
    setMode(next)
    setAmount(next === 'set' && plan ? String(plan) : '')
    setNote('')
    setSaveError('')
  }

  const save = async (e) => {
    e.preventDefault()
    if (!validValue) return setSaveError('Enter a whole number of searches')
    try {
      setSaving(true)
      setSaveError('')
      const res = await fetch(`${BACKEND_URL}/api/admin/users/rc-api-usage/api2`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mode === 'add' ? { add: value, note } : { totalLimit: value, note })
      })
      const json = await res.json()
      if (!json.success) return setSaveError(json.message || 'Failed to save')
      setMode(null)
      onSaved?.()
    } catch {
      setSaveError('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className='bg-white rounded-xl p-4 shadow-sm border border-gray-100'>
      <div className='flex items-start justify-between gap-3'>
        <div>
          <p className='text-xs text-gray-500 font-semibold uppercase tracking-wide'>API 2 Searches</p>
          <p className='text-[11px] text-gray-400 mt-0.5'>Used on our API 2 key, against the searches bought</p>
        </div>
        {status && (
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-bold shrink-0 ${status.chip}`}>
            <span aria-hidden='true'>{status.icon}</span>
            {status.label}
          </span>
        )}
      </div>

      {error ? null : loading ? (
        <div className='mt-3 space-y-2'>
          <div className='h-8 w-40 bg-gray-100 rounded animate-pulse' />
          <div className='h-2 bg-gray-100 rounded animate-pulse' />
        </div>
      ) : (
        <>
          {!has(used) ? (
            <p className='text-sm text-gray-500 mt-3'>No API 2 search has been made yet. The searches used appear here after the next API 2 search.</p>
          ) : (
            <>
              <div className='flex flex-wrap items-baseline gap-x-2 gap-y-0.5 mt-3'>
                {left !== null ? (
                  <>
                    <span className={`text-3xl font-bold tabular-nums ${left <= 0 ? 'text-red-600' : 'text-gray-900'}`}>{formatNumber(Math.max(0, left))}</span>
                    <span className='text-sm text-gray-500'>left of {formatNumber(plan)}</span>
                    <span className='text-sm text-gray-400'>· {formatNumber(used)} used</span>
                  </>
                ) : (
                  <>
                    <span className='text-3xl font-bold text-gray-900 tabular-nums'>{formatNumber(used)}</span>
                    <span className='text-sm text-gray-500'>searches used · add the searches you bought to see what is left</span>
                  </>
                )}
              </div>
              {usedPct !== null && (
                <div
                  className='mt-2.5 h-2 w-full bg-gray-100 rounded-full overflow-hidden'
                  role='meter'
                  aria-valuemin={0}
                  aria-valuemax={plan}
                  aria-valuenow={used}
                  aria-label='API 2 searches used'
                >
                  <div className={`h-full rounded-full ${status?.bar || 'bg-amber-500'}`} style={{ width: `${usedPct}%` }} />
                </div>
              )}
              <p className='text-[11px] text-gray-400 mt-2'>
                {has(usage.avgResponseMs) && <>Avg {(usage.avgResponseMs / 1000).toFixed(1)}s per search · </>}
                As of the last search
                {usage.checkedAt && <> on {formatDateTime(usage.checkedAt)}</>}
                {usage.lastVehicleNumber && <> ({usage.lastVehicleNumber})</>}
                {has(usage.lastResponseMs) && <>, took {(usage.lastResponseMs / 1000).toFixed(1)}s</>}.
              </p>
            </>
          )}

          {mode === null ? (
            <div className='mt-3 flex flex-wrap items-center gap-2'>
              <button
                onClick={() => open('add')}
                className='px-3 py-1.5 text-xs font-semibold text-white bg-amber-500 hover:bg-amber-600 rounded-lg cursor-pointer'
              >
                + Add searches
              </button>
              {plan > 0 && (
                <button
                  onClick={() => open('set')}
                  className='px-3 py-1.5 text-xs font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 rounded-lg cursor-pointer'
                  title='Correct the total searches bought'
                >
                  Edit total
                </button>
              )}
              {history.length > 0 && (
                <button
                  onClick={() => setShowHistory((v) => !v)}
                  className='ml-auto text-[11px] font-semibold text-gray-500 hover:text-gray-800 cursor-pointer'
                  aria-expanded={showHistory}
                >
                  {showHistory ? 'Hide' : 'Show'} purchases ({history.length})
                </button>
              )}
            </div>
          ) : (
            <form onSubmit={save} className='mt-3 p-3 rounded-lg bg-amber-50/60 border border-amber-100 space-y-2'>
              <p className='text-xs font-semibold text-gray-700'>
                {mode === 'add' ? 'Searches you just bought from API 2' : 'Total searches bought (correction)'}
              </p>
              <div className='flex flex-wrap items-center gap-2'>
                <input
                  type='number'
                  min='1'
                  step='1'
                  inputMode='numeric'
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value)
                    setSaveError('')
                  }}
                  placeholder={mode === 'add' ? 'e.g. 10000' : 'e.g. 12000'}
                  aria-label={mode === 'add' ? 'Searches bought' : 'Total searches bought'}
                  className='w-32 px-2.5 py-1.5 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none tabular-nums'
                  autoFocus
                />
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder='Note (optional)'
                  aria-label='Note'
                  className='min-w-0 flex-1 px-2.5 py-1.5 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none'
                />
              </div>
              {newTotal !== null && (
                <p className='text-xs text-gray-700'>
                  {mode === 'add' && <>{formatNumber(plan || 0)} + {formatNumber(value)} = </>}
                  <strong>{formatNumber(newTotal)}</strong> searches bought
                  {newLeft !== null && (
                    <>
                      {' '}· <strong className={newLeft <= 0 ? 'text-red-600' : 'text-emerald-700'}>{formatNumber(Math.max(0, newLeft))}</strong> left after{' '}
                      {formatNumber(used)} used
                    </>
                  )}
                </p>
              )}
              {saveError && <p className='text-xs text-red-600'>{saveError}</p>}
              <div className='flex gap-2'>
                <button type='submit' disabled={saving || !validValue} className='px-3 py-1.5 text-xs font-semibold text-white bg-amber-500 hover:bg-amber-600 rounded-lg disabled:opacity-50 cursor-pointer'>
                  {saving ? 'Saving…' : mode === 'add' ? 'Add to plan' : 'Save total'}
                </button>
                <button type='button' onClick={() => setMode(null)} className='px-2 py-1.5 text-xs font-semibold text-gray-500 hover:text-gray-700 cursor-pointer'>
                  Cancel
                </button>
              </div>
            </form>
          )}

          {showHistory && mode === null && history.length > 0 && (
            <ul className='mt-2 divide-y divide-gray-100 border border-gray-100 rounded-lg text-[11px] max-h-40 overflow-y-auto'>
              {history.map((h, i) => (
                <li key={`${h.at}-${i}`} className='flex items-center justify-between gap-2 px-2.5 py-1.5'>
                  <span className='text-gray-500 whitespace-nowrap'>{h.at ? formatDateTime(h.at) : '-'}</span>
                  <span className='min-w-0 truncate text-gray-500' title={h.note || ''}>{h.note || ''}</span>
                  <span className='font-semibold text-gray-800 tabular-nums whitespace-nowrap'>
                    {h.type === 'add' ? `+${formatNumber(h.quantity)}` : `set ${formatNumber(h.quantity)}`}
                    <span className='font-normal text-gray-400'> → {formatNumber(h.totalAfter)}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  )
}

const ParzivalCard = ({ usage, loading, error }) => {
  // Time read once when the card mounts, for the days-left count
  const [now] = useState(() => Date.now())
  const has = (v) => v !== null && v !== undefined
  const wallet = usage?.walletBalance
  const charge = usage?.lastCharge
  // How many more searches the wallet pays for at the last search's price
  const searchesLeft = has(wallet) && charge > 0 ? Math.floor(wallet / charge) : null
  const expires = usage?.accessExpiresAt ? new Date(usage.accessExpiresAt) : null
  const daysLeft = expires ? Math.ceil((expires.getTime() - now) / DAY_MS) : null

  let status = null
  if (usage) {
    if ((has(wallet) && wallet <= 0) || usage.quotaRemaining === 0 || (daysLeft !== null && daysLeft <= 0)) {
      status = { label: daysLeft !== null && daysLeft <= 0 ? 'Expired' : 'Exhausted', icon: '⛔', chip: 'bg-red-50 text-red-700 border-red-200' }
    } else if ((searchesLeft !== null && searchesLeft <= 25) || (daysLeft !== null && daysLeft <= 7)) {
      status = { label: 'Running low', icon: '⚠️', chip: 'bg-orange-50 text-orange-700 border-orange-200' }
    } else {
      status = { label: 'Healthy', icon: '✓', chip: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
    }
  }

  return (
    <div className='bg-white rounded-xl p-4 shadow-sm border border-gray-100'>
      <div className='flex items-start justify-between gap-3'>
        <div>
          <p className='text-xs text-gray-500 font-semibold uppercase tracking-wide'>API 3 – Parzival API</p>
          <p className='text-[11px] text-gray-400 mt-0.5'>Wallet, quota and access with ParzivalHub</p>
        </div>
        {status && (
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-bold shrink-0 ${status.chip}`}>
            <span aria-hidden='true'>{status.icon}</span>
            {status.label}
          </span>
        )}
      </div>

      {error ? null : loading ? (
        <div className='mt-3 grid grid-cols-3 gap-2'>
          {[0, 1, 2].map((i) => <div key={i} className='h-14 bg-gray-100 rounded-lg animate-pulse' />)}
        </div>
      ) : !usage ? (
        <p className='text-sm text-gray-500 mt-3'>
          No Parzival API search has been made yet. The wallet, quota and expiry appear here after the first search.
        </p>
      ) : (
        <>
          <div className='mt-3 grid grid-cols-3 gap-2'>
            <div className='p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-100'>
              <p className='text-[10px] font-semibold text-gray-500 uppercase tracking-wide'>Wallet balance</p>
              <p className='text-lg sm:text-xl font-bold text-gray-900 tabular-nums'>{has(wallet) ? formatMoney(wallet) : '—'}</p>
              {searchesLeft !== null && <p className='text-[11px] text-gray-500'>≈ {formatNumber(searchesLeft)} searches</p>}
            </div>
            <div className='p-2.5 rounded-lg bg-gray-50 border border-gray-100'>
              <p className='text-[10px] font-semibold text-gray-500 uppercase tracking-wide'>Quota left</p>
              <p className='text-lg sm:text-xl font-bold text-gray-900 tabular-nums'>{has(usage.quotaRemaining) ? formatNumber(usage.quotaRemaining) : '—'}</p>
              {has(charge) && <p className='text-[11px] text-gray-500'>{formatMoney(charge)} per search</p>}
            </div>
            <div className={`p-2.5 rounded-lg border ${daysLeft !== null && daysLeft <= 7 ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-100'}`}>
              <p className='text-[10px] font-semibold text-gray-500 uppercase tracking-wide'>Access expires</p>
              <p className='text-sm sm:text-base font-bold text-gray-900'>{expires ? formatDate(expires) : '—'}</p>
              {daysLeft !== null && (
                <p className={`text-[11px] ${daysLeft <= 7 ? 'text-orange-700 font-semibold' : 'text-gray-500'}`}>
                  {daysLeft > 0 ? `${daysLeft} day${daysLeft === 1 ? '' : 's'} left` : 'Expired'}
                </p>
              )}
            </div>
          </div>
          <p className='text-[11px] text-gray-400 mt-2'>
            As of the last search
            {usage.checkedAt && <> on {formatDateTime(usage.checkedAt)}</>}
            {usage.lastVehicleNumber && <> ({usage.lastVehicleNumber})</>}. Updates after every Parzival API search.
          </p>
        </>
      )}
    </div>
  )
}

export default RcApiUsageCard
