import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAudit } from '../context/AuditContext'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://api.rtosarthi.com'

// Dates are pinned to India time so the admin's device timezone can't shift a day.
const IST = 'Asia/Kolkata'

const todayIST = () => new Date().toLocaleDateString('en-CA', { timeZone: IST })

// 'YYYY-MM-DD' moved by a number of days
const shiftDate = (iso, days) => {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10)
}

const dayKeyIST = (value) => new Date(value).toLocaleDateString('en-CA', { timeZone: IST })

const formatDay = (key) => {
  const today = todayIST()
  if (key === today) return 'Today'
  if (key === shiftDate(today, -1)) return 'Yesterday'
  const [y, m, d] = key.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-IN', {
    timeZone: 'UTC',
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

const formatShortDate = (key) => {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-IN', {
    timeZone: 'UTC',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

const formatTime = (value) =>
  new Date(value).toLocaleTimeString('en-IN', { timeZone: IST, hour: '2-digit', minute: '2-digit', hour12: true })

const formatValue = (value) => {
  if (value === null || value === undefined || value === '') return '—'
  if (value === true) return 'Yes'
  if (value === false) return 'No'
  return String(value)
}

const RANGES = [
  { key: 'today', label: 'Today', days: [0, 0] },
  { key: 'yesterday', label: 'Yesterday', days: [-1, -1] },
  { key: 'last7', label: 'Last 7 Days', days: [-6, 0] },
  { key: 'last30', label: 'Last 30 Days', days: [-29, 0] },
  { key: 'custom', label: 'Custom' }
]

const rangeFor = (key) => {
  const preset = RANGES.find((r) => r.key === key)
  const today = todayIST()
  return { from: shiftDate(today, preset.days[0]), to: shiftDate(today, preset.days[1]) }
}

const ENTITIES = {
  user: 'Users',
  api_credit: 'Vehicle API Sales',
  blog: 'Blogs',
  vehicle_registration: 'Vehicles',
  admin: 'Admin Logins'
}

const ENTITY_SINGULAR = {
  user: 'User',
  api_credit: 'Vehicle API Sale',
  blog: 'Blog',
  vehicle_registration: 'Vehicle',
  admin: 'Admin'
}

const ICON_PATHS = {
  plus: 'M12 4v16m8-8H4',
  pencil: 'M15.232 5.232l3.536 3.536M9 13l6.232-6.232a2.5 2.5 0 113.536 3.536L12.536 16.536 8 17l.464-4.536z',
  trash: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
  check: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  ban: 'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636',
  eye: 'M15 12a3 3 0 11-6 0 3 3 0 016 0zm-3-9C7 3 3.6 6.1 2.5 12c1.1 5.9 4.5 9 9.5 9s8.4-3.1 9.5-9C20.4 6.1 17 3 12 3z',
  login: 'M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1',
  activity: 'M3 12h4l3-8 4 16 3-8h4'
}

// How each kind of action is shown in the list
const ACTIONS = {
  create: { label: 'Created', icon: 'plus', tile: 'bg-emerald-50 text-emerald-700 ring-emerald-100' },
  update: { label: 'Edited', icon: 'pencil', tile: 'bg-blue-50 text-blue-700 ring-blue-100' },
  delete: { label: 'Deleted', icon: 'trash', tile: 'bg-red-50 text-red-700 ring-red-100' },
  activate: { label: 'Activated', icon: 'check', tile: 'bg-teal-50 text-teal-700 ring-teal-100' },
  deactivate: { label: 'Deactivated', icon: 'ban', tile: 'bg-amber-50 text-amber-700 ring-amber-100' },
  access: { label: 'Opened as user', icon: 'eye', tile: 'bg-violet-50 text-violet-700 ring-violet-100' },
  login: { label: 'Login', icon: 'login', tile: 'bg-gray-100 text-gray-600 ring-gray-200' }
}

const Icon = ({ name, className = 'w-4 h-4' }) => (
  <svg className={className} fill='none' stroke='currentColor' viewBox='0 0 24 24'>
    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d={ICON_PATHS[name]} />
  </svg>
)

const Tile = ({ label, value, accent = 'text-gray-900' }) => (
  <div className='bg-white rounded-xl border border-gray-100 p-2.5 sm:p-4 shadow-sm'>
    <p className='text-[10px] sm:text-xs text-gray-500 font-semibold uppercase tracking-wide'>{label}</p>
    <p className={`text-lg sm:text-2xl font-bold mt-0.5 sm:mt-1 tabular-nums ${accent}`}>{Number(value || 0).toLocaleString('en-IN')}</p>
  </div>
)

const ChangesTable = ({ changes }) => (
  <div className='mt-2 overflow-x-auto rounded-lg border border-gray-100'>
    <table className='w-full text-xs'>
      <thead className='bg-gray-50 text-gray-500'>
        <tr>
          <th className='px-3 py-1.5 text-left font-semibold'>Field</th>
          <th className='px-3 py-1.5 text-left font-semibold'>Before</th>
          <th className='px-3 py-1.5 text-left font-semibold'>After</th>
        </tr>
      </thead>
      <tbody className='divide-y divide-gray-100'>
        {changes.map((c, i) => (
          <tr key={`${c.field}-${i}`}>
            <td className='px-3 py-1.5 font-medium text-gray-700 whitespace-nowrap'>{c.field}</td>
            <td className='px-3 py-1.5 text-red-600 break-all'>{formatValue(c.from)}</td>
            <td className='px-3 py-1.5 text-emerald-700 break-all'>{formatValue(c.to)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)

const ActivityCenter = () => {
  const navigate = useNavigate()
  const { lock } = useAudit()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [rangeKey, setRangeKey] = useState('last7')
  const [range, setRange] = useState(() => rangeFor('last7'))
  const [custom, setCustom] = useState(range)
  const [entityFilter, setEntityFilter] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState(() => new Set())

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const params = new URLSearchParams(range)
        const res = await fetch(`${BACKEND_URL}/api/admin/audit/activity?${params}`, { credentials: 'include' })
        if (res.status === 401) {
          // Admin session ended: hide the page again
          lock()
          navigate('/', { replace: true })
          return
        }
        const json = await res.json()
        if (!json.success) throw new Error(json.message || 'Failed to load activity')
        if (!cancelled) setData(json.data)
      } catch (err) {
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [range, lock, navigate])

  const selectRange = (key) => {
    setRangeKey(key)
    if (key === 'custom') setCustom(range)
    else setRange(rangeFor(key))
  }

  const customValid = custom.from && custom.to && custom.from <= custom.to

  const items = useMemo(() => data?.items || [], [data])
  const q = search.trim().toLowerCase()

  const searched = useMemo(
    () =>
      items.filter(
        (i) =>
          (!actionFilter || i.action === actionFilter) &&
          (!q ||
            `${i.summary} ${i.entityName || ''} ${i.adminEmail || ''} ${(i.changes || [])
              .map((c) => `${c.field} ${c.from ?? ''} ${c.to ?? ''}`)
              .join(' ')}`
              .toLowerCase()
              .includes(q))
      ),
    [items, actionFilter, q]
  )
  const visible = searched.filter((i) => !entityFilter || i.entity === entityFilter)
  const entityCounts = searched.reduce((acc, i) => ({ ...acc, [i.entity]: (acc[i.entity] || 0) + 1 }), {})

  // Group the list by day (India time), keeping the newest-first order
  const days = []
  visible.forEach((item) => {
    const key = dayKeyIST(item.createdAt)
    const last = days[days.length - 1]
    if (last?.key === key) last.items.push(item)
    else days.push({ key, items: [item] })
  })

  const toggle = (id) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const handleLock = () => {
    lock()
    navigate('/', { replace: true })
  }

  const totals = data?.totals || {}
  const periodText =
    range.from === range.to ? formatShortDate(range.from) : `${formatShortDate(range.from)} – ${formatShortDate(range.to)}`

  return (
    <div className='max-w-6xl mx-auto space-y-3 md:space-y-5'>
      {/* Header + period */}
      <div className='flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between'>
        <div>
          <h1 className='text-xl sm:text-2xl font-bold text-gray-900'>Activity Center</h1>
          <p className='text-xs sm:text-sm text-gray-500 mt-0.5'>Every change made in the admin panel · {periodText}</p>
        </div>
        <div className='flex items-center gap-2'>
          <div className='flex min-w-0 overflow-x-auto rounded-lg border border-gray-200 bg-white p-0.5'>
            {RANGES.map((r) => (
              <button
                key={r.key}
                type='button'
                onClick={() => selectRange(r.key)}
                className={`shrink-0 rounded-md px-2 sm:px-3 py-1.5 text-xs font-semibold transition ${
                  rangeKey === r.key ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
          <button
            type='button'
            onClick={handleLock}
            className='shrink-0 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100'
          >
            Lock
          </button>
        </div>
      </div>

      {rangeKey === 'custom' && (
        <div className='flex flex-wrap items-end gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm'>
          <div>
            <label className='block text-xs font-semibold text-gray-500 mb-1'>From</label>
            <input
              type='date'
              className='rounded-lg border border-gray-300 px-3 py-2 text-sm'
              value={custom.from}
              max={custom.to || undefined}
              onChange={(e) => setCustom({ ...custom, from: e.target.value })}
            />
          </div>
          <div>
            <label className='block text-xs font-semibold text-gray-500 mb-1'>To</label>
            <input
              type='date'
              className='rounded-lg border border-gray-300 px-3 py-2 text-sm'
              value={custom.to}
              min={custom.from || undefined}
              onChange={(e) => setCustom({ ...custom, to: e.target.value })}
            />
          </div>
          <button
            type='button'
            onClick={() => customValid && setRange({ ...custom })}
            disabled={!customValid}
            className='rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50'
          >
            Apply
          </button>
          {!customValid && <p className='pb-2 text-xs font-medium text-red-600'>"From" date must be on or before "To" date</p>}
        </div>
      )}

      {/* Period totals */}
      <section className='grid grid-cols-3 gap-2 md:gap-4 lg:grid-cols-5'>
        <Tile label='All Activity' value={totals.total} />
        <Tile label='Created' value={totals.create} accent='text-emerald-700' />
        <Tile label='Edited' value={totals.update} accent='text-blue-700' />
        <Tile label='Deleted' value={totals.delete} accent='text-red-600' />
        <Tile label='Status' value={(totals.activate || 0) + (totals.deactivate || 0)} accent='text-amber-700' />
      </section>

      {/* Activity list */}
      <section className='rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden'>
        <div className='border-b border-gray-100 p-2.5 md:p-3 md:px-5'>
          <div className='flex flex-col gap-2 md:flex-row md:items-center md:justify-between'>
            <div className='flex gap-2 overflow-x-auto'>
              {['', ...Object.keys(ENTITIES)].map((entity) => {
                const active = entityFilter === entity
                const count = entity ? entityCounts[entity] || 0 : searched.length
                return (
                  <button
                    key={entity || 'all'}
                    type='button'
                    onClick={() => setEntityFilter(entity)}
                    className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold transition ${
                      active
                        ? 'border-indigo-700 bg-indigo-700 text-white'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {entity ? ENTITIES[entity] : 'All'}{' '}
                    <span className={active ? 'text-indigo-200' : 'text-gray-400'}>{count}</span>
                  </button>
                )
              })}
            </div>
            <div className='flex gap-2 md:shrink-0'>
              <select
                className='w-36 shrink-0 rounded-lg border border-gray-300 px-2 py-2 text-sm'
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                aria-label='Action'
              >
                <option value=''>All Actions</option>
                {Object.entries(ACTIONS).map(([key, a]) => (
                  <option key={key} value={key}>
                    {a.label}
                  </option>
                ))}
              </select>
              <input
                type='search'
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder='Search activity...'
                className='min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm md:w-64 md:flex-none'
              />
            </div>
          </div>
        </div>

        {error ? (
          <p className='px-5 py-10 text-center text-sm text-red-600'>{error}</p>
        ) : loading && !data ? (
          <p className='px-5 py-10 text-center text-sm text-gray-500'>Loading activity…</p>
        ) : visible.length === 0 ? (
          <div className='px-5 py-12 text-center'>
            <Icon name='activity' className='mx-auto w-8 h-8 text-gray-300' />
            <p className='mt-2 text-sm font-semibold text-gray-700'>No activity found</p>
            <p className='text-xs text-gray-400'>
              {q || entityFilter || actionFilter ? 'Try a different search or filter.' : 'Nothing was changed in this period.'}
            </p>
          </div>
        ) : (
          <div className={`transition-opacity ${loading ? 'pointer-events-none opacity-50' : ''}`}>
            {days.map((day) => (
              <div key={day.key}>
                <p className='border-b border-gray-100 bg-gray-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500 md:px-5'>
                  {formatDay(day.key)}
                  <span className='ml-2 font-medium normal-case tracking-normal text-gray-400'>
                    {day.items.length} {day.items.length === 1 ? 'entry' : 'entries'}
                  </span>
                </p>
                <ul className='divide-y divide-gray-100'>
                  {day.items.map((item) => {
                    const a = ACTIONS[item.action] || ACTIONS.update
                    const hasChanges = item.changes?.length > 0
                    const isOpen = expanded.has(item._id)
                    return (
                      <li key={item._id} className='px-2.5 py-2.5 md:px-5 md:py-3'>
                        <button
                          type='button'
                          onClick={() => hasChanges && toggle(item._id)}
                          className={`flex w-full items-center gap-2.5 md:gap-3 text-left ${hasChanges ? 'cursor-pointer' : 'cursor-default'}`}
                        >
                          <span className={`flex h-8 w-8 md:h-9 md:w-9 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset ${a.tile}`}>
                            <Icon name={a.icon} />
                          </span>
                          <div className='min-w-0 flex-1'>
                            <p className='text-[13px] md:text-sm font-semibold text-gray-800 break-words'>{item.summary}</p>
                            <p className='truncate text-xs text-gray-500'>
                              <span className='font-medium text-gray-600'>{a.label}</span>
                              {' · '}
                              {ENTITY_SINGULAR[item.entity] || item.entity}
                              {item.adminEmail ? ` · by ${item.adminEmail}` : ''}
                              {item.ip ? ` · ${item.ip}` : ''}
                            </p>
                          </div>
                          <div className='shrink-0 text-right'>
                            <p className='whitespace-nowrap text-xs font-semibold text-gray-600'>{formatTime(item.createdAt)}</p>
                            {hasChanges && (
                              <p className='whitespace-nowrap text-[11px] text-indigo-600'>
                                {isOpen ? 'Hide' : `${item.changes.length} ${item.changes.length === 1 ? 'change' : 'changes'}`}
                              </p>
                            )}
                          </div>
                        </button>
                        {isOpen && <ChangesTable changes={item.changes} />}
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </div>
        )}
        <p className='border-t border-gray-100 px-4 py-2.5 text-xs text-gray-500 md:px-5'>
          Showing {visible.length} of {items.length} entries
          {data?.truncated ? ` (latest ${items.length} of ${totals.total} — choose a shorter period to see older ones)` : ''}
        </p>
      </section>
    </div>
  )
}

export default ActivityCenter
