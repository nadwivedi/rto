import { useState, useEffect, useCallback, useMemo } from 'react'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://api.rtosarthi.com'

// Dates are pinned to India time so the admin's device timezone can't shift a month.
const IST = 'Asia/Kolkata'

// Validated categorical slots (dataviz reference palette, light surface).
// Slot 7 violet for joins; slots 1/2 blue+orange for the revenue split.
const C_JOINS = '#4a3aa7'
const C_YEARLY = '#2a78d6'
const C_LIFETIME = '#eb6834'

const formatMonth = (key, long = false) => {
  const [y, m] = key.split('-').map(Number)
  const d = new Date(Date.UTC(y, m - 1, 1))
  return d.toLocaleDateString('en-IN', {
    timeZone: 'UTC',
    month: 'short',
    year: long ? 'numeric' : '2-digit'
  })
}

const formatRupees = (n) => `₹${Math.round(n || 0).toLocaleString('en-IN')}`

// 12300 -> ₹12.3k, keeps axis and bar labels short
const formatCompact = (n) => {
  const v = Math.round(n || 0)
  if (v === 0) return '₹0'
  if (Math.abs(v) >= 10000000) return `₹${(v / 10000000).toFixed(v % 10000000 === 0 ? 0 : 1)}Cr`
  if (Math.abs(v) >= 100000) return `₹${(v / 100000).toFixed(v % 100000 === 0 ? 0 : 1)}L`
  if (Math.abs(v) >= 1000) return `₹${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}k`
  return `₹${v}`
}

// A "nice" axis maximum so gridlines land on round numbers
const niceMax = (value) => {
  if (!value || value <= 0) return 1
  const exp = Math.floor(Math.log10(value))
  const base = Math.pow(10, exp)
  const steps = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]
  for (const s of steps) {
    if (value <= base * s) return base * s
  }
  return base * 10
}

const StatTile = ({ label, value, sub, accent = 'text-gray-900', hint }) => (
  <div className='bg-white rounded-xl border border-gray-200 p-4 shadow-sm'>
    <div className='flex items-start justify-between gap-2'>
      <p className='text-[11px] font-semibold text-gray-500 uppercase tracking-wide'>{label}</p>
      {hint && (
        <span className='text-gray-300 cursor-help text-[11px] leading-none mt-0.5' title={hint}>
          ⓘ
        </span>
      )}
    </div>
    <p className={`text-2xl font-bold mt-1 tabular-nums ${accent}`}>{value}</p>
    {sub && <p className='text-[11px] text-gray-400 mt-0.5'>{sub}</p>}
  </div>
)

// Horizontal gridlines + value labels, shared by both charts
const Gridlines = ({ max, fmt, ticks = 4 }) => (
  <div className='absolute inset-0 pointer-events-none'>
    {Array.from({ length: ticks + 1 }, (_, i) => {
      const frac = i / ticks
      return (
        <div
          key={i}
          className='absolute left-0 right-0 flex items-center'
          style={{ bottom: `${frac * 100}%` }}
        >
          <span className='w-11 shrink-0 text-right pr-1.5 text-[10px] text-gray-400 tabular-nums -mb-px'>
            {fmt(max * frac)}
          </span>
          <div className={`flex-1 border-t ${i === 0 ? 'border-gray-300' : 'border-gray-100'}`} />
        </div>
      )
    })}
  </div>
)

const Dashboard = () => {
  const [months, setMonths] = useState(12)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showTable, setShowTable] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const res = await fetch(
        `${BACKEND_URL}/api/admin/users/revenue-dashboard?months=${months}`,
        { credentials: 'include' }
      )
      const json = await res.json()
      if (json.success) {
        setData(json.data)
      } else {
        setError(json.message || 'Failed to load dashboard')
      }
    } catch {
      setError('Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }, [months])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const series = useMemo(() => data?.series || [], [data])
  const totals = data?.totals
  const win = data?.window

  const maxUsers = useMemo(() => niceMax(Math.max(1, ...series.map((m) => m.users))), [series])
  const maxRevenue = useMemo(() => niceMax(Math.max(1, ...series.map((m) => m.revenue))), [series])

  const peakUsers = useMemo(() => Math.max(0, ...series.map((m) => m.users)), [series])
  const currentMonthKey = series.length ? series[series.length - 1].month : null
  const hasLifetime = series.some((m) => m.lifetimeRevenue > 0)

  return (
    <div className='max-w-[1500px] mx-auto'>
      {/* Header + filter row */}
      <div className='flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-5'>
        <div>
          <h1 className='text-xl sm:text-2xl font-bold text-gray-800'>Dashboard</h1>
          <p className='text-xs text-gray-500 mt-0.5'>
            Month-wise users joined and subscription revenue · India time
          </p>
        </div>
        <div className='flex items-center gap-2'>
          <span className='text-[11px] font-semibold text-gray-500 uppercase tracking-wide'>
            Range
          </span>
          <div className='flex rounded-lg border border-gray-300 overflow-hidden bg-white'>
            {[6, 12, 24].map((m) => (
              <button
                key={m}
                onClick={() => setMonths(m)}
                className={`px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                  months === m
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                } ${m !== 6 ? 'border-l border-gray-300' : ''}`}
              >
                {m}M
              </button>
            ))}
          </div>
          <button
            onClick={fetchData}
            className='px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer'
            title='Refresh'
          >
            ↻
          </button>
        </div>
      </div>

      {error && (
        <div className='mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700'>
          {error}
        </div>
      )}

      {loading && !data ? (
        <div className='space-y-4'>
          <div className='grid grid-cols-2 lg:grid-cols-4 gap-3'>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className='h-24 bg-white rounded-xl border border-gray-200 animate-pulse' />
            ))}
          </div>
          <div className='h-72 bg-white rounded-xl border border-gray-200 animate-pulse' />
          <div className='h-72 bg-white rounded-xl border border-gray-200 animate-pulse' />
        </div>
      ) : (
        <>
          {/* All-time stat tiles */}
          <div className='grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5'>
            <StatTile
              label='Total Revenue'
              value={formatRupees(totals?.totalRevenue)}
              sub={`All time · ${totals?.totalUsers || 0} users`}
              accent='text-emerald-700'
              hint="Sum of every user's plan price (yearly price, or monthly × 12)."
            />
            <StatTile
              label='Active Run Rate'
              value={formatRupees(totals?.activeYearlyRunRate)}
              sub='Per year · active yearly plans'
              accent='text-indigo-700'
              hint='Yearly plan value of active users only. Excludes lifetime (one-time) and deactivated users.'
            />
            <StatTile
              label='Total Users'
              value={totals?.totalUsers || 0}
              sub={`${totals?.activeUsers || 0} active · ${
                (totals?.totalUsers || 0) - (totals?.activeUsers || 0)
              } inactive`}
            />
            <StatTile
              label='Avg Per User'
              value={formatRupees(totals?.avgRevenuePerUser)}
              sub={
                totals?.lifetimeUsers
                  ? `${totals.lifetimeUsers} lifetime plan${totals.lifetimeUsers > 1 ? 's' : ''}`
                  : 'All yearly plans'
              }
            />
          </div>

          {/* Warning when some users have no price set — revenue would undercount */}
          {totals?.unpricedUsers > 0 && (
            <div className='mb-5 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2'>
              <span className='shrink-0'>⚠️</span>
              <span>
                <strong>{totals.unpricedUsers}</strong> user
                {totals.unpricedUsers > 1 ? 's have' : ' has'} no plan price set, so they count as
                ₹0 here. Set a Yearly or Monthly Price on them in Manage Users for accurate revenue.
              </span>
            </div>
          )}

          {/* Revenue per month */}
          <div className='bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-5 mb-5'>
            <div className='flex flex-wrap items-start justify-between gap-3 mb-4'>
              <div>
                <h2 className='text-sm font-bold text-gray-800'>Revenue by month</h2>
                <p className='text-[11px] text-gray-500 mt-0.5'>
                  Each user&apos;s plan price counted in the month they joined
                </p>
              </div>
              <div className='text-right'>
                <p className='text-[11px] text-gray-400 uppercase tracking-wide font-semibold'>
                  {months}M total
                </p>
                <p className='text-base font-bold text-gray-800 tabular-nums'>
                  {formatRupees(win?.revenue)}
                </p>
              </div>
            </div>

            {/* Legend — only meaningful when lifetime plans exist */}
            {hasLifetime && (
              <div className='flex items-center gap-4 mb-3'>
                <span className='flex items-center gap-1.5 text-[11px] text-gray-600'>
                  <span
                    className='w-2.5 h-2.5 rounded-sm'
                    style={{ background: C_YEARLY }}
                  />
                  Yearly
                </span>
                <span className='flex items-center gap-1.5 text-[11px] text-gray-600'>
                  <span
                    className='w-2.5 h-2.5 rounded-sm'
                    style={{ background: C_LIFETIME }}
                  />
                  Lifetime (one-time)
                </span>
              </div>
            )}

            <div className='relative h-52 mb-1'>
              {/* Few ticks when there is no revenue yet, so labels don't repeat */}
              <Gridlines max={maxRevenue} fmt={formatCompact} ticks={maxRevenue <= 4 ? 1 : 4} />
              <div className='absolute inset-0 pl-11 flex items-end gap-[2px] sm:gap-1'>
                {series.map((m) => {
                  const total = m.revenue
                  const pct = (total / maxRevenue) * 100
                  const yearlyPct = total > 0 ? (m.yearlyRevenue / total) * 100 : 0
                  return (
                    <div
                      key={m.month}
                      className='flex-1 h-full flex flex-col justify-end items-center group relative min-w-0'
                    >
                      {/* Hover tooltip */}
                      <div className='pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-20'>
                        <div className='whitespace-nowrap rounded-lg bg-gray-900 text-white text-[11px] px-2.5 py-1.5 shadow-lg'>
                          <div className='font-bold'>{formatMonth(m.month, true)}</div>
                          <div className='tabular-nums'>{formatRupees(total)}</div>
                          <div className='text-gray-300'>
                            {m.users} user{m.users === 1 ? '' : 's'} joined
                          </div>
                          {m.lifetimeRevenue > 0 && (
                            <div className='text-gray-300 tabular-nums'>
                              {formatRupees(m.yearlyRevenue)} yearly ·{' '}
                              {formatRupees(m.lifetimeRevenue)} lifetime
                            </div>
                          )}
                        </div>
                      </div>

                      {total > 0 ? (
                        <div
                          className='w-full max-w-[44px] rounded-t transition-opacity group-hover:opacity-80 overflow-hidden flex flex-col justify-end'
                          style={{ height: `${Math.max(pct, 1.5)}%` }}
                        >
                          {m.lifetimeRevenue > 0 && (
                            <div
                              className='w-full shrink-0'
                              style={{
                                background: C_LIFETIME,
                                height: `${100 - yearlyPct}%`,
                                // 2px surface gap between stacked segments
                                borderBottom: yearlyPct > 0 ? '2px solid #fff' : 'none'
                              }}
                            />
                          )}
                          {m.yearlyRevenue > 0 && (
                            <div
                              className='w-full'
                              style={{ background: C_YEARLY, height: `${yearlyPct}%` }}
                            />
                          )}
                        </div>
                      ) : (
                        <div className='w-full max-w-[44px] h-[2px] bg-gray-200 rounded' />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
            {/* Month axis */}
            <div className='pl-11 flex gap-[2px] sm:gap-1'>
              {series.map((m) => (
                <div
                  key={m.month}
                  className={`flex-1 min-w-0 text-center text-[9px] sm:text-[10px] truncate ${
                    m.month === currentMonthKey ? 'font-bold text-indigo-600' : 'text-gray-400'
                  }`}
                >
                  {formatMonth(m.month)}
                </div>
              ))}
            </div>
          </div>

          {/* Users joined per month */}
          <div className='bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-5 mb-5'>
            <div className='flex flex-wrap items-start justify-between gap-3 mb-4'>
              <div>
                <h2 className='text-sm font-bold text-gray-800'>Users joined by month</h2>
                <p className='text-[11px] text-gray-500 mt-0.5'>Based on account created date</p>
              </div>
              <div className='text-right'>
                <p className='text-[11px] text-gray-400 uppercase tracking-wide font-semibold'>
                  {months}M total
                </p>
                <p className='text-base font-bold text-gray-800 tabular-nums'>{win?.users || 0}</p>
              </div>
            </div>

            <div className='relative h-44 mb-1'>
              <Gridlines max={maxUsers} fmt={(v) => Math.round(v)} ticks={Math.min(4, maxUsers)} />
              <div className='absolute inset-0 pl-11 flex items-end gap-[2px] sm:gap-1'>
                {series.map((m) => {
                  const pct = (m.users / maxUsers) * 100
                  // Label the peak and the current month only, not every bar
                  const labelled = m.users > 0 && (m.users === peakUsers || m.month === currentMonthKey)
                  return (
                    <div
                      key={m.month}
                      className='flex-1 h-full flex flex-col justify-end items-center group relative min-w-0'
                    >
                      <div className='pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-20'>
                        <div className='whitespace-nowrap rounded-lg bg-gray-900 text-white text-[11px] px-2.5 py-1.5 shadow-lg'>
                          <div className='font-bold'>{formatMonth(m.month, true)}</div>
                          <div>
                            {m.users} user{m.users === 1 ? '' : 's'} joined
                          </div>
                          <div className='text-gray-300 tabular-nums'>{formatRupees(m.revenue)}</div>
                        </div>
                      </div>
                      {labelled && (
                        <span className='text-[10px] font-bold text-gray-500 tabular-nums mb-0.5'>
                          {m.users}
                        </span>
                      )}
                      {m.users > 0 ? (
                        <div
                          className='w-full max-w-[44px] rounded-t transition-opacity group-hover:opacity-80'
                          style={{ height: `${Math.max(pct, 1.5)}%`, background: C_JOINS }}
                        />
                      ) : (
                        <div className='w-full max-w-[44px] h-[2px] bg-gray-200 rounded' />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
            <div className='pl-11 flex gap-[2px] sm:gap-1'>
              {series.map((m) => (
                <div
                  key={m.month}
                  className={`flex-1 min-w-0 text-center text-[9px] sm:text-[10px] truncate ${
                    m.month === currentMonthKey ? 'font-bold text-indigo-600' : 'text-gray-400'
                  }`}
                >
                  {formatMonth(m.month)}
                </div>
              ))}
            </div>
          </div>

          {/* Table view */}
          <div className='bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden'>
            <button
              onClick={() => setShowTable((v) => !v)}
              className='w-full flex items-center justify-between px-4 sm:px-5 py-3 hover:bg-gray-50 transition-colors cursor-pointer'
            >
              <span className='text-sm font-bold text-gray-800'>Month-wise breakdown</span>
              <span className='text-xs text-gray-400'>{showTable ? 'Hide ▲' : 'Show ▼'}</span>
            </button>
            {showTable && (
              <div className='overflow-x-auto border-t border-gray-100'>
                <table className='w-full'>
                  <thead>
                    <tr className='bg-gray-50/60 border-b border-gray-100'>
                      <th className='px-4 py-2.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider'>
                        Month
                      </th>
                      <th className='px-4 py-2.5 text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wider'>
                        Joined
                      </th>
                      <th className='px-4 py-2.5 text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wider'>
                        Yearly ₹
                      </th>
                      <th className='px-4 py-2.5 text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wider'>
                        Lifetime ₹
                      </th>
                      <th className='px-4 py-2.5 text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wider'>
                        Total ₹
                      </th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-gray-100'>
                    {series.map((m) => (
                      <tr key={m.month} className='hover:bg-gray-50/80 transition-colors'>
                        <td className='px-4 py-2.5 text-xs text-gray-700 whitespace-nowrap'>
                          {formatMonth(m.month, true)}
                          {m.month === currentMonthKey && (
                            <span className='ml-1.5 text-[9px] font-bold uppercase text-indigo-600 bg-indigo-50 px-1 rounded'>
                              Current
                            </span>
                          )}
                        </td>
                        <td className='px-4 py-2.5 text-xs text-gray-700 text-right tabular-nums'>
                          {m.users || '-'}
                        </td>
                        <td className='px-4 py-2.5 text-xs text-gray-700 text-right tabular-nums'>
                          {m.yearlyRevenue ? formatRupees(m.yearlyRevenue) : '-'}
                        </td>
                        <td className='px-4 py-2.5 text-xs text-gray-700 text-right tabular-nums'>
                          {m.lifetimeRevenue ? formatRupees(m.lifetimeRevenue) : '-'}
                        </td>
                        <td className='px-4 py-2.5 text-xs font-bold text-gray-900 text-right tabular-nums'>
                          {m.revenue ? formatRupees(m.revenue) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className='bg-gray-50 border-t-2 border-gray-200'>
                      <td className='px-4 py-2.5 text-xs font-bold text-gray-800'>
                        Total ({months}M)
                      </td>
                      <td className='px-4 py-2.5 text-xs font-bold text-gray-900 text-right tabular-nums'>
                        {win?.users || 0}
                      </td>
                      <td className='px-4 py-2.5 text-xs font-bold text-gray-900 text-right tabular-nums'>
                        {formatRupees(series.reduce((s, m) => s + m.yearlyRevenue, 0))}
                      </td>
                      <td className='px-4 py-2.5 text-xs font-bold text-gray-900 text-right tabular-nums'>
                        {formatRupees(series.reduce((s, m) => s + m.lifetimeRevenue, 0))}
                      </td>
                      <td className='px-4 py-2.5 text-xs font-bold text-gray-900 text-right tabular-nums'>
                        {formatRupees(win?.revenue)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          <p className='text-[11px] text-gray-400 mt-4 leading-relaxed'>
            Revenue counts each user&apos;s plan price once, in the month their account was created
            (yearly price, or monthly price × 12 when no yearly price is set). Renewals are not
            tracked separately, so this is new-business revenue per month, not cash collected.
            Months are bucketed in India time ({IST}).
          </p>
        </>
      )}
    </div>
  )
}

export default Dashboard
