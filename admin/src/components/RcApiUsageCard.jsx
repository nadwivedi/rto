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

// Shows how many vehicle (RC details) searches are left with the API provider.
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
    <div className={`bg-white rounded-xl p-4 shadow-sm border border-gray-100 ${className}`}>
      <div className='flex items-start justify-between gap-3'>
        <div>
          <p className='text-xs text-gray-500 font-semibold uppercase tracking-wide'>Vehicle API Limit</p>
          <p className='text-[11px] text-gray-400 mt-0.5'>RC details searches left with the provider</p>
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
          No vehicle search has been made yet. The limit appears here after the first RC details search.
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
            {usage.lastVehicleNumber && <> ({usage.lastVehicleNumber})</>}. Updates after every vehicle search.
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
    </div>
  )
}

export default RcApiUsageCard
