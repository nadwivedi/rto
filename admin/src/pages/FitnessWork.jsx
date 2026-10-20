import { useState, useEffect, useCallback, useMemo } from 'react'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://api.rtosarthi.com'

// Dates are pinned to India time so the admin's device timezone can't shift a day or month.
const IST = 'Asia/Kolkata'
const PAGE_SIZE = 50

const todayIST = () => new Date().toLocaleDateString('en-CA', { timeZone: IST })

// Stored date -> 'YYYY-MM-DD' in India time, for the date input when editing
const toDateInput = (value) => new Date(value).toLocaleDateString('en-CA', { timeZone: IST })

const formatDate = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleDateString('en-IN', { timeZone: IST, day: '2-digit', month: 'short', year: 'numeric' })
}

const formatMonth = (key) => {
  const [y, m] = key.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString('en-IN', {
    timeZone: 'UTC',
    month: 'short',
    year: 'numeric'
  })
}

const formatRupees = (n) =>
  `${Number(n) < 0 ? '-' : ''}₹${Math.abs(Number(n) || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`

const EMPTY_FORM = { userId: '', date: '', amount: '', profit: '', vehicleNumber: '', note: '' }

const Tile = ({ label, value, sub, accent = 'text-gray-900' }) => (
  <div className='bg-white rounded-xl border border-gray-100 p-2.5 sm:p-4 shadow-sm'>
    <p className='text-[10px] sm:text-xs text-gray-500 font-semibold uppercase tracking-wide'>{label}</p>
    <p className={`text-lg sm:text-2xl font-bold mt-0.5 sm:mt-1 tabular-nums ${accent}`}>{value}</p>
    {sub && <p className='text-[11px] text-gray-400 mt-0.5'>{sub}</p>}
  </div>
)

const th = 'px-2.5 sm:px-4 py-2 sm:py-2.5 text-[10px] sm:text-[11px] font-semibold text-gray-500 uppercase tracking-wider'
const td = 'px-2.5 sm:px-4 py-2 sm:py-2.5 text-xs'

const PencilIcon = () => (
  <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15.232 5.232l3.536 3.536M9 13l6.232-6.232a2.5 2.5 0 113.536 3.536L12.536 16.536 8 17l.464-4.536z' />
  </svg>
)
const TrashIcon = () => (
  <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' />
  </svg>
)

// Party picker you can type into: filters users by name or mobile number
const PartySearchSelect = ({ users, value, onChange, className }) => {
  const selected = users.find((u) => u._id === value)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [highlight, setHighlight] = useState(0)

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return users
    return users.filter((u) => u.name?.toLowerCase().includes(q) || String(u.mobile1 || '').includes(q))
  }, [users, query])

  const pick = (user) => {
    onChange(user._id)
    setQuery('')
    setOpen(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setOpen(true)
      setHighlight((h) => Math.min(h + 1, matches.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlight((h) => Math.max(h - 1, 0))
    } else if (e.key === 'Enter' && open) {
      // Pick the highlighted party instead of submitting the form
      e.preventDefault()
      if (matches[highlight]) pick(matches[highlight])
    } else if (e.key === 'Escape' && open) {
      e.stopPropagation()
      setOpen(false)
    }
  }

  return (
    <div className='relative'>
      <input
        type='text'
        value={open ? query : selected ? `${selected.name} · ${selected.mobile1}` : ''}
        onChange={(e) => {
          setQuery(e.target.value)
          setHighlight(0)
          setOpen(true)
        }}
        onFocus={() => {
          setQuery('')
          setHighlight(0)
          setOpen(true)
        }}
        onBlur={() => setOpen(false)}
        onKeyDown={handleKeyDown}
        placeholder={selected ? `${selected.name} · ${selected.mobile1}` : 'Search party by name or mobile'}
        autoComplete='off'
        className={className}
      />
      {open && (
        <ul className='absolute z-10 mt-1 w-full max-h-60 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg'>
          {matches.length === 0 ? (
            <li className='px-3 py-2 text-sm text-gray-500'>No party found</li>
          ) : (
            matches.map((u, i) => (
              <li
                key={u._id}
                // mousedown fires before the input's blur, so the click still lands
                onMouseDown={(e) => {
                  e.preventDefault()
                  pick(u)
                }}
                onMouseEnter={() => setHighlight(i)}
                className={`px-3 py-2 text-sm cursor-pointer flex justify-between gap-2 ${
                  i === highlight ? 'bg-indigo-50' : ''
                } ${u._id === value ? 'font-semibold text-indigo-700' : 'text-gray-800'}`}
              >
                <span className='truncate'>{u.name}</span>
                <span className='text-xs text-gray-400 shrink-0'>{u.mobile1}</span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  )
}

const FitnessWork = () => {
  const [summary, setSummary] = useState(null)
  const [works, setWorks] = useState([])
  const [listTotals, setListTotals] = useState(null)
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalRecords: 0 })
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [partyFilter, setPartyFilter] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [page, setPage] = useState(1)

  const [showModal, setShowModal] = useState(false)
  // Entry being edited; null when adding new work
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState(EMPTY_FORM)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  const fetchSummary = useCallback(async () => {
    const res = await fetch(`${BACKEND_URL}/api/admin/fitness-work/summary`, { credentials: 'include' })
    const json = await res.json()
    if (!json.success) throw new Error(json.message || 'Failed to load summary')
    setSummary(json.data)
  }, [])

  const fetchWorks = useCallback(async () => {
    const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) })
    if (partyFilter) params.set('userId', partyFilter)
    if (fromDate) params.set('from', fromDate)
    if (toDate) params.set('to', toDate)
    const res = await fetch(`${BACKEND_URL}/api/admin/fitness-work?${params}`, { credentials: 'include' })
    const json = await res.json()
    if (!json.success) throw new Error(json.message || 'Failed to load fitness work')
    setWorks(json.data)
    setListTotals(json.totals)
    setPagination(json.pagination)
  }, [page, partyFilter, fromDate, toDate])

  const fetchUsers = useCallback(async () => {
    const res = await fetch(`${BACKEND_URL}/api/admin/users?limit=1000`, { credentials: 'include' })
    const json = await res.json()
    if (!json.success) throw new Error(json.message || 'Failed to load parties')
    setUsers([...json.data].sort((a, b) => a.name.localeCompare(b.name)))
  }, [])

  const loadAll = useCallback(async () => {
    try {
      setError('')
      await Promise.all([fetchSummary(), fetchWorks(), fetchUsers()])
    } catch (err) {
      setError(err.message || 'Failed to load fitness work')
    } finally {
      setLoading(false)
    }
  }, [fetchSummary, fetchWorks, fetchUsers])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  const usersById = useMemo(() => new Map(users.map((u) => [u._id, u])), [users])
  const filteredParty = usersById.get(partyFilter)
  const hasFilter = Boolean(partyFilter || fromDate || toDate)

  const openAdd = () => {
    setEditingId(null)
    setFormData({ ...EMPTY_FORM, userId: partyFilter, date: todayIST() })
    setFormError('')
    setShowModal(true)
  }

  const openEdit = (work) => {
    setEditingId(work._id)
    setFormData({
      userId: work.userId?._id || '',
      date: toDateInput(work.date),
      amount: String(work.amount),
      profit: String(work.profit),
      vehicleNumber: work.vehicleNumber || '',
      note: work.note || ''
    })
    setFormError('')
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setFormError('')
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setFormError('')
  }

  const changeFilter = (setter) => (e) => {
    setter(e.target.value)
    setPage(1)
  }

  const clearFilters = () => {
    setPartyFilter('')
    setFromDate('')
    setToDate('')
    setPage(1)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const amount = Number(formData.amount)
    const profit = Number(formData.profit)

    if (!formData.userId) return setFormError('Please select the party who gave the work')
    if (!formData.date) return setFormError('Please choose a date')
    if (formData.amount === '' || Number.isNaN(amount) || amount < 0) {
      return setFormError('Please enter the work amount')
    }
    if (formData.profit === '' || Number.isNaN(profit)) return setFormError('Please enter the profit amount')

    try {
      setSaving(true)
      setFormError('')
      const res = await fetch(`${BACKEND_URL}/api/admin/fitness-work${editingId ? `/${editingId}` : ''}`, {
        method: editingId ? 'PUT' : 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, amount, profit })
      })
      const json = await res.json()
      if (json.success) {
        setSuccess(json.message)
        setShowModal(false)
        if (!editingId) setPage(1)
        await loadAll()
      } else {
        setFormError(json.message || 'Failed to save')
      }
    } catch {
      setFormError('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (work) => {
    const who = work.userId?.name ? ` from ${work.userId.name}` : ''
    if (!window.confirm(`Delete fitness work${who} of ${formatRupees(work.amount)} on ${formatDate(work.date)}?`)) return

    try {
      setDeletingId(work._id)
      const res = await fetch(`${BACKEND_URL}/api/admin/fitness-work/${work._id}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      const json = await res.json()
      if (json.success) {
        setSuccess(json.message)
        await loadAll()
      } else {
        setError(json.message || 'Failed to delete')
      }
    } catch {
      setError('Failed to delete')
    } finally {
      setDeletingId(null)
    }
  }

  const inputClass =
    'w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
  const labelClass = 'block text-xs sm:text-sm font-semibold text-gray-700 mb-1'
  const filterClass =
    'px-2.5 py-1.5 text-xs sm:text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent'

  const formAmount = Number(formData.amount)
  const formProfit = Number(formData.profit)
  const profitPercent =
    formData.amount !== '' && formData.profit !== '' && formAmount > 0 && !Number.isNaN(formProfit)
      ? Math.round((formProfit / formAmount) * 1000) / 10
      : null

  const iconButton = 'p-1.5 text-gray-400 rounded-md transition-colors disabled:opacity-40 disabled:cursor-wait cursor-pointer'

  return (
    <div className='max-w-[1500px] mx-auto'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2.5 sm:gap-4 mb-3 sm:mb-6'>
        <div>
          <h1 className='text-xl sm:text-3xl font-bold text-gray-800'>Fitness Work</h1>
          <p className='text-xs sm:text-base text-gray-600 mt-0.5 sm:mt-1'>
            Fitness work each party gives us and the profit we make on it. Only visible to admin.
          </p>
        </div>
        <button
          onClick={openAdd}
          className='px-3 py-2 sm:px-5 sm:py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-semibold text-sm shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transition-all cursor-pointer'
        >
          + New Work
        </button>
      </div>

      {success && (
        <div className='mb-5 p-4 bg-green-50 border border-green-200 rounded-xl text-green-800 text-sm font-medium'>
          {success}
        </div>
      )}
      {error && (
        <div className='mb-5 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium'>
          {error}
        </div>
      )}

      {loading ? (
        <div className='space-y-4'>
          <div className='grid grid-cols-2 lg:grid-cols-4 gap-3'>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className='h-24 bg-white rounded-xl border border-gray-100 animate-pulse' />
            ))}
          </div>
          <div className='h-64 bg-white rounded-xl border border-gray-100 animate-pulse' />
        </div>
      ) : (
        <>
          {/* Totals */}
          <div className='grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-3 sm:mb-5'>
            <Tile
              label="Today's Profit"
              value={formatRupees(summary?.today?.profit)}
              accent='text-emerald-700'
              sub={summary?.today?.entries ? `${summary.today.entries} work(s) · ${formatRupees(summary.today.amount)}` : 'No work recorded today'}
            />
            <Tile
              label='This Month Profit'
              value={formatRupees(summary?.thisMonth?.profit)}
              accent='text-emerald-700'
              sub={
                summary?.thisMonth?.entries
                  ? `${summary.thisMonth.entries} work(s) · ${formatRupees(summary.thisMonth.amount)}`
                  : 'No work this month'
              }
            />
            <Tile
              label='Total Profit'
              value={formatRupees(summary?.overall?.profit)}
              accent='text-emerald-700'
              sub={`${summary?.overall?.entries || 0} work(s) in all`}
            />
            <Tile
              label='Total Work Amount'
              value={formatRupees(summary?.overall?.amount)}
              sub={`From ${summary?.parties?.length || 0} part${summary?.parties?.length === 1 ? 'y' : 'ies'}`}
            />
          </div>

          <div className='grid grid-cols-1 xl:grid-cols-3 gap-3 sm:gap-5'>
            {/* Entries */}
            <div className='xl:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden'>
              <div className='p-3 sm:p-4 border-b border-gray-100 space-y-2'>
                <div className='flex items-center justify-between gap-2'>
                  <h2 className='text-sm sm:text-base font-bold text-gray-800'>
                    {filteredParty ? `Work from ${filteredParty.name}` : 'All Fitness Work'}
                  </h2>
                  {hasFilter && (
                    <button onClick={clearFilters} className='text-xs text-indigo-600 hover:underline cursor-pointer'>
                      Clear filters
                    </button>
                  )}
                </div>
                <div className='flex flex-wrap gap-2'>
                  <select value={partyFilter} onChange={changeFilter(setPartyFilter)} className={`${filterClass} cursor-pointer min-w-0 flex-1 sm:flex-none`}>
                    <option value=''>All parties</option>
                    {users.map((u) => (
                      <option key={u._id} value={u._id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                  <input type='date' value={fromDate} onChange={changeFilter(setFromDate)} className={filterClass} title='From date' />
                  <input type='date' value={toDate} onChange={changeFilter(setToDate)} className={filterClass} title='To date' />
                </div>
                {hasFilter && listTotals && (
                  <p className='text-xs text-gray-600'>
                    {listTotals.entries} work(s) · Amount <b>{formatRupees(listTotals.amount)}</b> · Profit{' '}
                    <b className='text-emerald-700'>{formatRupees(listTotals.profit)}</b>
                  </p>
                )}
              </div>

              {works.length === 0 ? (
                <div className='p-8 text-center text-sm text-gray-500'>
                  {hasFilter ? 'No fitness work matches these filters.' : 'No fitness work recorded yet. Click “+ New Work” to add one.'}
                </div>
              ) : (
                <>
                  {/* Mobile list */}
                  <ul className='md:hidden divide-y divide-gray-100'>
                    {works.map((work) => (
                      <li key={work._id} className='p-3 flex items-start gap-2'>
                        <div className='flex-1 min-w-0'>
                          <div className='flex justify-between gap-2'>
                            <span className='font-semibold text-sm text-gray-900 truncate'>{work.userId?.name || 'Deleted user'}</span>
                            <span className='text-sm font-bold text-emerald-700 tabular-nums'>{formatRupees(work.profit)}</span>
                          </div>
                          <div className='flex justify-between gap-2 text-xs text-gray-500 mt-0.5'>
                            <span>
                              {formatDate(work.date)}
                              {work.vehicleNumber && ` · ${work.vehicleNumber}`}
                            </span>
                            <span className='tabular-nums'>of {formatRupees(work.amount)}</span>
                          </div>
                          {work.note && <p className='text-xs text-gray-400 mt-0.5 truncate'>{work.note}</p>}
                        </div>
                        <button onClick={() => openEdit(work)} className={`${iconButton} hover:text-indigo-600 hover:bg-indigo-50`} title='Edit'>
                          <PencilIcon />
                        </button>
                        <button
                          onClick={() => handleDelete(work)}
                          disabled={deletingId === work._id}
                          className={`${iconButton} -mr-1 hover:text-red-600 hover:bg-red-50`}
                          title='Delete'
                        >
                          <TrashIcon />
                        </button>
                      </li>
                    ))}
                  </ul>

                  {/* Desktop table */}
                  <div className='hidden md:block overflow-x-auto'>
                    <table className='w-full'>
                      <thead>
                        <tr className='border-b border-gray-100 bg-gray-50/60'>
                          <th className={`${th} text-left`}>Date</th>
                          <th className={`${th} text-left`}>Party</th>
                          <th className={`${th} text-left`}>Vehicle</th>
                          <th className={`${th} text-right`}>Amount</th>
                          <th className={`${th} text-right`}>Profit</th>
                          <th className={`${th} text-left`}>Note</th>
                          <th className={`${th} text-right`}></th>
                        </tr>
                      </thead>
                      <tbody className='divide-y divide-gray-100'>
                        {works.map((work) => (
                          <tr key={work._id} className='hover:bg-gray-50/80 transition-colors'>
                            <td className={`${td} text-gray-700 whitespace-nowrap`}>{formatDate(work.date)}</td>
                            <td className={td}>
                              {work.userId ? (
                                <>
                                  <div className='font-semibold text-gray-900'>{work.userId.name}</div>
                                  <div className='text-gray-400'>{work.userId.mobile1}</div>
                                </>
                              ) : (
                                <span className='text-gray-400'>Deleted user</span>
                              )}
                            </td>
                            <td className={`${td} text-gray-700 whitespace-nowrap`}>{work.vehicleNumber || '-'}</td>
                            <td className={`${td} text-right tabular-nums text-gray-900`}>{formatRupees(work.amount)}</td>
                            <td className={`${td} text-right tabular-nums font-bold text-emerald-700`}>{formatRupees(work.profit)}</td>
                            <td className={`${td} text-gray-500 max-w-[200px] truncate`} title={work.note || ''}>
                              {work.note || '-'}
                            </td>
                            <td className={`${td} text-right whitespace-nowrap`}>
                              <button onClick={() => openEdit(work)} className={`${iconButton} hover:text-indigo-600 hover:bg-indigo-50`} title='Edit'>
                                <PencilIcon />
                              </button>
                              <button
                                onClick={() => handleDelete(work)}
                                disabled={deletingId === work._id}
                                className={`${iconButton} hover:text-red-600 hover:bg-red-50`}
                                title='Delete'
                              >
                                <TrashIcon />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {pagination.totalPages > 1 && (
                    <div className='flex items-center justify-between p-3 border-t border-gray-100 text-xs text-gray-600'>
                      <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page <= 1}
                        className='px-3 py-1.5 border border-gray-300 rounded-lg disabled:opacity-40 cursor-pointer disabled:cursor-default'
                      >
                        Previous
                      </button>
                      <span>
                        Page {pagination.currentPage} of {pagination.totalPages}
                      </span>
                      <button
                        onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                        disabled={page >= pagination.totalPages}
                        className='px-3 py-1.5 border border-gray-300 rounded-lg disabled:opacity-40 cursor-pointer disabled:cursor-default'
                      >
                        Next
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Side: party-wise and month-wise */}
            <div className='space-y-3 sm:space-y-5'>
              <div className='bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden'>
                <h2 className='p-3 sm:p-4 border-b border-gray-100 text-sm sm:text-base font-bold text-gray-800'>Party-wise Profit</h2>
                {summary?.parties?.length ? (
                  <ul className='divide-y divide-gray-100'>
                    {summary.parties.map((p) => (
                      <li key={p.userId}>
                        <button
                          onClick={() => {
                            setPartyFilter(String(p.userId))
                            setPage(1)
                          }}
                          className={`w-full text-left px-3 sm:px-4 py-2 flex justify-between gap-2 hover:bg-gray-50 cursor-pointer ${
                            partyFilter === String(p.userId) ? 'bg-indigo-50' : ''
                          }`}
                        >
                          <div className='min-w-0'>
                            <div className='text-sm font-semibold text-gray-900 truncate'>{p.name}</div>
                            <div className='text-[11px] text-gray-400'>
                              {p.entries} work(s) · {formatRupees(p.amount)} · last {formatDate(p.lastDate)}
                            </div>
                          </div>
                          <div className='text-sm font-bold text-emerald-700 tabular-nums whitespace-nowrap'>{formatRupees(p.profit)}</div>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className='p-4 text-xs text-gray-500'>No party has given work yet.</p>
                )}
              </div>

              <div className='bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden'>
                <h2 className='p-3 sm:p-4 border-b border-gray-100 text-sm sm:text-base font-bold text-gray-800'>Month-wise</h2>
                {summary?.months?.length ? (
                  <table className='w-full'>
                    <thead>
                      <tr className='border-b border-gray-100 bg-gray-50/60'>
                        <th className={`${th} text-left`}>Month</th>
                        <th className={`${th} text-right`}>Works</th>
                        <th className={`${th} text-right`}>Amount</th>
                        <th className={`${th} text-right`}>Profit</th>
                      </tr>
                    </thead>
                    <tbody className='divide-y divide-gray-100'>
                      {summary.months.map((m) => (
                        <tr key={m.month}>
                          <td className={`${td} text-gray-700 whitespace-nowrap`}>{formatMonth(m.month)}</td>
                          <td className={`${td} text-right tabular-nums`}>{m.entries}</td>
                          <td className={`${td} text-right tabular-nums`}>{formatRupees(m.amount)}</td>
                          <td className={`${td} text-right tabular-nums font-bold text-emerald-700`}>{formatRupees(m.profit)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className='p-4 text-xs text-gray-500'>Nothing recorded yet.</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {showModal && (
        <div className='fixed inset-0 bg-black/50 z-50 overflow-y-auto'>
          <div className='flex items-start justify-center min-h-full px-3 py-8 sm:py-16'>
            <div className='bg-white rounded-lg shadow-xl max-w-md w-full p-5'>
              <div className='flex justify-between items-start mb-4'>
                <div>
                  <h2 className='text-lg font-bold text-gray-800'>{editingId ? 'Edit Fitness Work' : 'New Fitness Work'}</h2>
                  <p className='text-xs text-gray-500 mt-0.5'>Which party gave the work, its amount and our profit.</p>
                </div>
                <button onClick={closeModal} className='text-gray-500 hover:text-gray-700 p-1 cursor-pointer'>
                  <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className='space-y-3'>
                <div>
                  <label className={labelClass}>Work By Party</label>
                  <PartySearchSelect
                    users={users}
                    value={formData.userId}
                    onChange={(userId) => {
                      setFormData((prev) => ({ ...prev, userId }))
                      setFormError('')
                    }}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Date</label>
                  <input type='date' name='date' value={formData.date} onChange={handleChange} className={inputClass} />
                </div>

                <div className='grid grid-cols-2 gap-3'>
                  <div>
                    <label className={labelClass}>Amount (₹)</label>
                    <input
                      type='number'
                      name='amount'
                      value={formData.amount}
                      onChange={handleChange}
                      placeholder='5000'
                      min='0'
                      step='0.01'
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Profit (₹)</label>
                    <input
                      type='number'
                      name='profit'
                      value={formData.profit}
                      onChange={handleChange}
                      placeholder='800'
                      step='0.01'
                      className={inputClass}
                    />
                  </div>
                </div>
                {profitPercent !== null && (
                  <p className='text-[11px] text-gray-500 -mt-1'>Profit is {profitPercent}% of the work amount</p>
                )}

                <div>
                  <label className={labelClass}>
                    Vehicle Number <span className='font-normal text-gray-400'>(optional)</span>
                  </label>
                  <input
                    type='text'
                    name='vehicleNumber'
                    value={formData.vehicleNumber}
                    onChange={handleChange}
                    placeholder='CG04AB1234'
                    className={`${inputClass} uppercase`}
                  />
                </div>

                <div>
                  <label className={labelClass}>
                    Note <span className='font-normal text-gray-400'>(optional)</span>
                  </label>
                  <input type='text' name='note' value={formData.note} onChange={handleChange} className={inputClass} />
                </div>

                {formError && <p className='text-sm text-red-600'>{formError}</p>}

                <div className='flex gap-2 pt-1'>
                  <button
                    type='button'
                    onClick={closeModal}
                    className='flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-semibold cursor-pointer'
                  >
                    Cancel
                  </button>
                  <button
                    type='submit'
                    disabled={saving}
                    className='flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-semibold disabled:opacity-60 cursor-pointer disabled:cursor-wait'
                  >
                    {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Save Work'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default FitnessWork
