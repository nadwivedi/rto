import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import RcApiUsageCard from '../components/RcApiUsageCard'
import { providerOption } from '../components/apiProviders'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://api.rtosarthi.com'

// Dates are pinned to India time so the admin's device timezone can't shift a day.
const formatDay = (key) => {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-IN', {
    timeZone: 'UTC',
    weekday: 'short',
    day: '2-digit',
    month: 'short'
  })
}

const formatNumber = (n) => Number(n || 0).toLocaleString('en-IN')

const Tile = ({ label, value, sub, accent = 'text-gray-900', className = '' }) => (
  <div className={`bg-white rounded-xl border border-gray-100 p-2.5 sm:p-4 shadow-sm ${className}`}>
    <p className='text-[10px] sm:text-xs text-gray-500 font-semibold uppercase tracking-wide'>{label}</p>
    <p className={`text-lg sm:text-2xl font-bold mt-0.5 sm:mt-1 tabular-nums ${accent}`}>{value}</p>
    {sub && <p className='text-[11px] text-gray-400 mt-0.5'>{sub}</p>}
  </div>
)

const th = 'px-2.5 sm:px-4 py-2 sm:py-2.5 text-[10px] sm:text-[11px] font-semibold text-gray-500 uppercase tracking-wider'

// API Usage: calls left with the providers and the searches app users and API keys actually made.
// Sales and purchases are on the API Sales page.
const ApiUsage = () => {
  const [usage, setUsage] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  // App users and API keys in one list, most used first
  const usageRows = useMemo(
    () =>
      [
        ...(usage?.users || []).map((u) => ({ ...u, rowKey: `u-${u.userId}`, left: u.rcSearchRemaining })),
        ...(usage?.apiKeys || []).map((k) => ({ ...k, rowKey: `k-${k.apiKeyId}`, isKey: true, left: k.remaining }))
      ].sort((a, b) => b.last28 - a.last28 || b.last7 - a.last7),
    [usage]
  )

  const fetchUsage = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const res = await fetch(`${BACKEND_URL}/api/admin/api-credits/usage`, { credentials: 'include' })
      const json = await res.json()
      if (!json.success) throw new Error(json.message || 'Failed to load usage')
      setUsage(json.data)
    } catch (err) {
      setError(err.message || 'Failed to load usage')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUsage()
  }, [fetchUsage])

  const reload = () => {
    setRefreshKey((k) => k + 1)
    fetchUsage()
  }

  return (
    <div className='max-w-[1500px] mx-auto'>
      <div className='flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2.5 sm:gap-4 mb-3 sm:mb-6'>
        <div>
          <h1 className='text-xl sm:text-3xl font-bold text-gray-800'>API Usage</h1>
          <p className='text-xs sm:text-base text-gray-600 mt-0.5 sm:mt-1'>
            Calls left with the providers, and the vehicle searches app users and API keys made
          </p>
        </div>
        <div className='flex gap-2'>
          <Link
            to='/api-credits'
            className='px-3 py-2 sm:px-4 sm:py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold text-sm transition-colors'
          >
            API Sales →
          </Link>
          <button
            onClick={reload}
            disabled={loading}
            className='px-3 py-2 sm:px-4 sm:py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold text-sm transition-colors disabled:opacity-50 cursor-pointer'
          >
            {loading ? 'Loading…' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Provider quota actually left */}
      <RcApiUsageCard key={refreshKey} className='mb-3 sm:mb-5' />

      {error && (
        <div className='mb-5 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium'>
          {error}
        </div>
      )}

      {loading && !usage ? (
        <div className='space-y-4'>
          <div className='grid grid-cols-3 gap-3'>
            {[0, 1, 2].map((i) => (
              <div key={i} className='h-24 bg-white rounded-xl border border-gray-100 animate-pulse' />
            ))}
          </div>
          <div className='h-64 bg-white rounded-xl border border-gray-100 animate-pulse' />
        </div>
      ) : (
        usage && (
          <>
          {/* Searches users actually made */}
          <div className='mb-3 sm:mb-5'>
            <div className='flex flex-wrap items-baseline justify-between gap-x-2 mb-2'>
              <h2 className='text-sm font-bold text-gray-800'>Searches made</h2>
              <p className='text-[11px] text-gray-400'>
                {usage?.trackingSince
                  ? `Counting since ${formatDay(usage.trackingSince)} · searches before that are not included`
                  : 'No search has been counted yet · counting starts with the next search'}
              </p>
            </div>
            <div className='grid grid-cols-3 gap-2 sm:gap-3 mb-3'>
              <Tile label='Today' value={formatNumber(usage?.totals?.today)} sub='searches so far today' />
              <Tile
                label='Last 7 Days'
                value={formatNumber(usage?.totals?.last7)}
                sub={`avg ${formatNumber(usage?.totals?.avg7)} per day`}
              />
              <Tile
                label='Last 28 Days'
                value={formatNumber(usage?.totals?.last28)}
                sub={`avg ${formatNumber(usage?.totals?.avg28)} per day`}
              />
            </div>

            <p className='mb-3 text-[11px] text-gray-500'>
              API key calls · today: API 5 <span className='font-semibold text-gray-800'>{formatNumber(usage?.totals?.api5Today)}</span>
              {' · '}API 2 <span className='font-semibold text-gray-800'>{formatNumber(usage?.totals?.api2Today)}</span>
              {' · '}Parzival API <span className='font-semibold text-gray-800'>{formatNumber(usage?.totals?.api3Today)}</span>
              {' · '}PeriOne API <span className='font-semibold text-gray-800'>{formatNumber(usage?.totals?.api4Today)}</span>
              {' · '}API 2 + 4 <span className='font-semibold text-gray-800'>{formatNumber(usage?.totals?.api24Today)}</span>
              {' · '}API 3 + 2 <span className='font-semibold text-gray-800'>{formatNumber(usage?.totals?.api32Today)}</span>
              {' · last 28 days: '}API 5 <span className='font-semibold text-gray-800'>{formatNumber(usage?.totals?.api5Last28)}</span>
              {' · '}API 2 <span className='font-semibold text-gray-800'>{formatNumber(usage?.totals?.api2Last28)}</span>
              {' · '}Parzival API <span className='font-semibold text-gray-800'>{formatNumber(usage?.totals?.api3Last28)}</span>
              {' · '}PeriOne API <span className='font-semibold text-gray-800'>{formatNumber(usage?.totals?.api4Last28)}</span>
              {' · '}API 2 + 4 <span className='font-semibold text-gray-800'>{formatNumber(usage?.totals?.api24Last28)}</span>
              {' · '}API 3 + 2 <span className='font-semibold text-gray-800'>{formatNumber(usage?.totals?.api32Last28)}</span>
              {' · '}App <span className='font-semibold text-gray-800'>{formatNumber(usage?.totals?.appLast28)}</span>
              {/* Calls API 1 (Nikhil API, now removed) served before it was replaced by API 5 */}
              {usage?.totals?.api1Last28 > 0 && <>{' · '}old API 1 <span className='font-semibold text-gray-800'>{formatNumber(usage.totals.api1Last28)}</span></>}
            </p>

            <div className='grid grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-5'>
              {/* Day-wise */}
              <div className='bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden'>
                <h3 className='text-sm font-bold text-gray-800 p-3 border-b border-gray-100'>Day-wise usage · last 7 days</h3>
                <div className='overflow-x-auto'>
                <table className='w-full'>
                  <thead>
                    <tr className='border-b border-gray-100 bg-gray-50/60'>
                      <th className={`${th} text-left`}>Day</th>
                      <th className={`${th} text-right`}>App</th>
                      <th className={`${th} text-right`} title='API key calls served by API 5 (and by the removed API 1 before it)'>API 5</th>
                      <th className={`${th} text-right`} title='API key calls served by API 2'>API 2</th>
                      <th className={`${th} text-right`} title='API key calls served by API 3 – Parzival API'>Parzival</th>
                      <th className={`${th} text-right`} title='API key calls served by API 4 – PeriOne API'>PeriOne</th>
                      <th className={`${th} text-right`} title='API key calls served by API 2 + API 4 together'>API 2+4</th>
                      <th className={`${th} text-right`} title='API key calls served by API 3 + API 2 together'>API 3+2</th>
                      <th className={`${th} text-right`}>Total</th>
                      <th className={`${th} text-right`} title='Users and API keys that searched that day'>Active</th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-gray-100'>
                    {(usage?.days || []).slice(0, 7).map((day) => (
                      <tr key={day.date} className='hover:bg-gray-50/80 transition-colors'>
                        <td className='px-2.5 sm:px-4 py-2 sm:py-2.5 text-xs text-gray-700 whitespace-nowrap'>
                          {formatDay(day.date)}
                          {day.date === usage.today && <span className='ml-1.5 text-[10px] font-bold text-indigo-600 uppercase'>Today</span>}
                        </td>
                        <td className='px-2.5 sm:px-4 py-2 sm:py-2.5 text-xs text-gray-700 text-right tabular-nums'>{formatNumber(day.appCount)}</td>
                        <td className='px-2.5 sm:px-4 py-2 sm:py-2.5 text-xs text-gray-700 text-right tabular-nums'>{formatNumber((day.api5Count || 0) + (day.api1Count || 0))}</td>
                        <td className='px-2.5 sm:px-4 py-2 sm:py-2.5 text-xs text-gray-700 text-right tabular-nums'>{formatNumber(day.api2Count)}</td>
                        <td className='px-2.5 sm:px-4 py-2 sm:py-2.5 text-xs text-gray-700 text-right tabular-nums'>{formatNumber(day.api3Count)}</td>
                        <td className='px-2.5 sm:px-4 py-2 sm:py-2.5 text-xs text-gray-700 text-right tabular-nums'>{formatNumber(day.api4Count)}</td>
                        <td className='px-2.5 sm:px-4 py-2 sm:py-2.5 text-xs text-gray-700 text-right tabular-nums'>{formatNumber(day.api24Count)}</td>
                        <td className='px-2.5 sm:px-4 py-2 sm:py-2.5 text-xs text-gray-700 text-right tabular-nums'>{formatNumber(day.api32Count)}</td>
                        <td className={`px-2.5 sm:px-4 py-2 sm:py-2.5 text-xs text-right tabular-nums ${day.count ? 'font-bold text-gray-900' : 'text-gray-400'}`}>
                          {formatNumber(day.count)}
                        </td>
                        <td className='px-2.5 sm:px-4 py-2 sm:py-2.5 text-xs text-gray-700 text-right tabular-nums'>{formatNumber((day.users || 0) + (day.keys || 0))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </div>

              {/* User-wise */}
              <div className='bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col'>
                <h3 className='text-sm font-bold text-gray-800 p-3 border-b border-gray-100'>
                  Usage by user &amp; API key
                  {usageRows.length > 0 && <span className='font-normal text-gray-400'> ({usageRows.length})</span>}
                </h3>
                {usageRows.length ? (
                  // Side by side (xl) the list takes the height of the day-wise card and scrolls; stacked it is capped to about the same height
                  <div className='relative max-h-[340px] overflow-auto xl:max-h-none xl:flex-1 xl:min-h-0'>
                    <div className='xl:absolute xl:inset-0 xl:overflow-auto'>
                      <table className='w-full'>
                        <thead className='sticky top-0 z-10 bg-gray-50'>
                          <tr className='border-b border-gray-100'>
                            <th className={`${th} text-left`}>User</th>
                            <th className={`${th} text-right`}>Today</th>
                            <th className={`${th} text-right`}>Last 7 Days</th>
                            <th className={`${th} text-right`}>Last 28 Days</th>
                            <th className={`${th} text-right`}>Left</th>
                          </tr>
                        </thead>
                        <tbody className='divide-y divide-gray-100'>
                          {usageRows.map((u) => (
                            <tr key={u.rowKey} className='hover:bg-gray-50/80 transition-colors'>
                              <td className='px-2.5 sm:px-4 py-2 sm:py-2.5 text-xs'>
                                {u.isKey ? (
                                  <>
                                    <Link to={`/api-keys/${u.apiKeyId}`} className='font-semibold text-gray-900 hover:text-indigo-600'>
                                      {u.name || 'Deleted API key'}
                                    </Link>
                                    <div className='text-gray-400'>
                                      <span
                                        className={`mr-1 rounded px-1 py-px text-[10px] font-bold uppercase ${providerOption(u.provider).tag}`}
                                      >
                                        API key · {providerOption(u.provider).short}
                                      </span>
                                      {u.userName}
                                      {!u.active && <span className='ml-1 text-rose-500'>· off</span>}
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <div className='font-semibold text-gray-900'>{u.name || 'Deleted user'}</div>
                                    <div className='text-gray-400'>{u.mobile1 || ''}</div>
                                  </>
                                )}
                              </td>
                              <td className={`px-2.5 sm:px-4 py-2 sm:py-2.5 text-xs text-right tabular-nums ${u.today ? 'font-bold text-gray-900' : 'text-gray-400'}`}>
                                {formatNumber(u.today)}
                              </td>
                              <td className='px-2.5 sm:px-4 py-2 sm:py-2.5 text-xs text-gray-700 text-right tabular-nums'>{formatNumber(u.last7)}</td>
                              <td className='px-2.5 sm:px-4 py-2 sm:py-2.5 text-xs text-gray-700 text-right tabular-nums'>{formatNumber(u.last28)}</td>
                              <td className={`px-2.5 sm:px-4 py-2 sm:py-2.5 text-xs text-right tabular-nums ${u.left <= 0 ? 'font-bold text-rose-600' : 'text-gray-700'}`}>
                                {formatNumber(u.left)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <p className='p-6 text-center text-sm text-gray-500'>No user or API key has searched in the last 28 days.</p>
                )}
              </div>
            </div>
          </div>
          </>
        )
      )}
    </div>
  )
}

export default ApiUsage
