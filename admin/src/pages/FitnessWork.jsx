import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import {
  AlertTriangle,
  CalendarDays,
  Car,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  IndianRupee,
  Loader2,
  Pencil,
  Plus,
  StickyNote,
  Trash2,
  TrendingUp,
  User,
  Wallet,
  X
} from 'lucide-react'
import StatCard from '../components/StatCard'
import SearchSelect from '../components/SearchSelect'
import RowMenu from '../components/RowMenu'

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

// Profit as a share of the work amount: 800 of 5000 -> "16%"
const marginOf = (profit, amount) => (Number(amount) > 0 ? `${Math.round((Number(profit) / Number(amount)) * 1000) / 10}%` : null)

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`

const getInitials = (name) => {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() || '').join('') || '?'
}

const AVATAR_PALETTE = [
  'bg-sky-100 text-sky-700',
  'bg-emerald-100 text-emerald-700',
  'bg-violet-100 text-violet-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-teal-100 text-teal-700'
]

const getAvatarClass = (seed) => {
  const code = String(seed || '').split('').reduce((total, char) => total + char.charCodeAt(0), 0)
  return AVATAR_PALETTE[code % AVATAR_PALETTE.length]
}

const EMPTY_FORM = { userId: '', date: '', amount: '', profit: '', vehicleNumber: '', note: '' }

const INPUT_CLASS =
  'w-full rounded-lg border border-stone-300 bg-white py-2 pl-9 pr-3 text-sm text-stone-900 placeholder:text-stone-400 outline-none transition focus:border-stone-500 focus:ring-4 focus:ring-stone-200'
const PRIMARY_BUTTON =
  'flex items-center justify-center gap-1.5 rounded-lg bg-stone-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:opacity-60 cursor-pointer'
const SECONDARY_BUTTON =
  'flex items-center justify-center gap-1.5 rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-100 disabled:opacity-60 cursor-pointer'
const ICON_BUTTON =
  'flex h-8 w-8 items-center justify-center rounded-lg text-stone-500 transition hover:bg-stone-100 hover:text-stone-800 cursor-pointer'
const CARD = 'overflow-hidden rounded-2xl border border-stone-200 bg-[#fbfaf7] shadow-xs'
const FILTER_DATE =
  'h-[38px] rounded-lg border border-stone-300 bg-white px-3 text-sm text-stone-800 outline-none transition focus:border-stone-500 focus:ring-4 focus:ring-stone-200'

const FieldLabel = ({ children, optional }) => (
  <span className='text-sm font-medium text-stone-700'>
    {children}
    {optional && <span className='ml-1 font-normal text-stone-400'>(optional)</span>}
  </span>
)

const Avatar = ({ name, seed, size = 'h-9 w-9' }) => (
  <span className={`flex ${size} shrink-0 items-center justify-center rounded-full text-xs font-bold ${getAvatarClass(seed || name)}`}>
    {getInitials(name)}
  </span>
)

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
  const [workToDelete, setWorkToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

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

  // Success notes fade on their own
  useEffect(() => {
    if (!success) return undefined
    const timer = setTimeout(() => setSuccess(''), 3500)
    return () => clearTimeout(timer)
  }, [success])

  const usersById = useMemo(() => new Map(users.map((u) => [u._id, u])), [users])
  const filteredParty = usersById.get(partyFilter)
  const hasFilter = Boolean(partyFilter || fromDate || toDate)

  // Work done per party, to show next to each name in the picker
  const entriesByParty = useMemo(
    () => new Map((summary?.parties || []).map((p) => [String(p.userId), p.entries])),
    [summary]
  )
  const partyOptions = useMemo(
    () =>
      users.map((u) => ({
        value: u._id,
        label: u.mobile1 ? `${u.name} · ${u.mobile1}` : u.name,
        count: entriesByParty.get(u._id)
      })),
    [users, entriesByParty]
  )
  const filterOptions = useMemo(() => partyOptions.map(({ value, label }) => ({ value, label })), [partyOptions])

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
    if (saving) return
    setShowModal(false)
    setFormError('')
  }

  // Esc closes whichever popup is open
  useEffect(() => {
    if (!showModal && !workToDelete) return undefined
    const onKeyDown = (e) => {
      if (e.key !== 'Escape' || e.defaultPrevented) return
      if (workToDelete && !deleting) setWorkToDelete(null)
      else if (showModal && !saving) setShowModal(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [showModal, workToDelete, saving, deleting])

  const setField = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
    setFormError('')
  }

  const handleChange = (e) => setField(e.target.name, e.target.value)

  // Keyboard flow in the popup: Date -> Party -> Work Amount -> Profit, and Enter on Profit saves
  const partyRef = useRef(null)
  const amountRef = useRef(null)
  const profitRef = useRef(null)
  const noteRef = useRef(null)
  const enterTo = (next) => (e) => {
    if (e.key !== 'Enter') return
    e.preventDefault()
    next()
  }

  const changeFilter = (setter) => (value) => {
    setter(value)
    setPage(1)
  }

  const clearFilters = () => {
    setPartyFilter('')
    setFromDate('')
    setToDate('')
    setPage(1)
  }

  const formAmount = Number(formData.amount)
  const formProfit = Number(formData.profit)
  const formReady = formData.amount !== '' && formData.profit !== '' && !Number.isNaN(formAmount) && !Number.isNaN(formProfit)

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.userId) return setFormError('Please select the party who gave the work')
    if (!formData.date) return setFormError('Please choose a date')
    if (formData.amount === '' || Number.isNaN(formAmount) || formAmount < 0) {
      return setFormError('Please enter the work amount')
    }
    if (formData.profit === '' || Number.isNaN(formProfit)) return setFormError('Please enter the profit amount')
    if (formProfit > formAmount) return setFormError('Profit cannot be more than the work amount')

    try {
      setSaving(true)
      setFormError('')
      const res = await fetch(`${BACKEND_URL}/api/admin/fitness-work${editingId ? `/${editingId}` : ''}`, {
        method: editingId ? 'PUT' : 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, amount: formAmount, profit: formProfit })
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

  const handleDeleteConfirm = async () => {
    try {
      setDeleting(true)
      const res = await fetch(`${BACKEND_URL}/api/admin/fitness-work/${workToDelete._id}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      const json = await res.json()
      if (json.success) {
        setSuccess(json.message)
        setWorkToDelete(null)
        await loadAll()
      } else {
        setError(json.message || 'Failed to delete')
        setWorkToDelete(null)
      }
    } catch {
      setError('Failed to delete')
      setWorkToDelete(null)
    } finally {
      setDeleting(false)
    }
  }

  const rowActions = (work) => [
    { label: 'Edit', icon: Pencil, onClick: () => openEdit(work) },
    { label: 'Delete', icon: Trash2, tone: 'danger', onClick: () => setWorkToDelete(work) }
  ]

  const renderParty = (work, withMobile = true) =>
    work.userId ? (
      <div className='flex min-w-0 items-center gap-3'>
        <Avatar name={work.userId.name} seed={work.userId._id} />
        <div className='min-w-0'>
          <p className='truncate font-semibold text-stone-900'>{work.userId.name}</p>
          {withMobile && <p className='truncate text-xs text-stone-500'>{work.userId.mobile1}</p>}
        </div>
      </div>
    ) : (
      <div className='flex items-center gap-3'>
        <Avatar name='?' />
        <span className='text-stone-400'>Deleted user</span>
      </div>
    )

  const renderProfit = (work) => (
    <div className='text-right'>
      <p className='font-bold tabular-nums text-emerald-700'>{formatRupees(work.profit)}</p>
      {marginOf(work.profit, work.amount) && (
        <p className='text-[11px] tabular-nums text-stone-400'>{marginOf(work.profit, work.amount)} margin</p>
      )}
    </div>
  )

  const maxPartyProfit = Math.max(1, ...(summary?.parties || []).map((p) => p.profit))
  const months = summary?.months || []
  const maxMonthProfit = Math.max(1, ...months.map((m) => m.profit))

  return (
    <div className='mx-auto max-w-[1500px] space-y-4 text-stone-900'>
      {/* Header */}
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h1 className='text-xl font-bold text-stone-900'>Fitness Work</h1>
          <p className='mt-0.5 text-sm text-stone-500'>Fitness work each party gives us and the profit we make on it. Only for admin.</p>
        </div>
        <button type='button' onClick={openAdd} className={PRIMARY_BUTTON}>
          <Plus className='h-4 w-4' strokeWidth={2.5} />
          New Work
        </button>
      </div>

      {success && (
        <div className='rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800'>{success}</div>
      )}
      {error && (
        <div className='flex items-start justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700'>
          {error}
          <button type='button' onClick={() => setError('')} className='text-rose-400 hover:text-rose-700 cursor-pointer' aria-label='Dismiss'>
            <X className='h-4 w-4' />
          </button>
        </div>
      )}

      {/* Totals */}
      <section className='grid grid-cols-2 gap-2 md:gap-3 xl:grid-cols-4'>
        <StatCard
          compact
          icon={TrendingUp}
          tone='emerald'
          label="Today's Profit"
          value={formatRupees(summary?.today?.profit)}
          hint={summary?.today?.entries ? `${plural(summary.today.entries, 'work', 'works')} · ${formatRupees(summary.today.amount)}` : 'No work recorded today'}
        />
        <StatCard
          compact
          icon={CalendarDays}
          tone='teal'
          label='This Month Profit'
          value={formatRupees(summary?.thisMonth?.profit)}
          hint={summary?.thisMonth?.entries ? `${plural(summary.thisMonth.entries, 'work', 'works')} · ${formatRupees(summary.thisMonth.amount)}` : 'No work this month'}
        />
        <StatCard
          compact
          icon={Wallet}
          tone='indigo'
          label='Total Profit'
          value={formatRupees(summary?.overall?.profit)}
          hint={
            summary?.overall?.amount
              ? `${marginOf(summary.overall.profit, summary.overall.amount)} of all work`
              : 'Nothing recorded yet'
          }
        />
        <StatCard
          compact
          icon={ClipboardCheck}
          tone='amber'
          label='Total Work Amount'
          value={formatRupees(summary?.overall?.amount)}
          hint={`${plural(summary?.overall?.entries || 0, 'work', 'works')} from ${plural(summary?.parties?.length || 0, 'party', 'parties')}`}
        />
      </section>

      <div className='grid grid-cols-1 gap-4 xl:grid-cols-3'>
        {/* Entries */}
        <section className={`${CARD} xl:col-span-2`}>
          <div className='flex flex-col gap-3 border-b border-stone-200 px-4 py-3 md:px-5'>
            <div className='flex items-center justify-between gap-2'>
              <h2 className='text-sm font-bold text-stone-800'>
                {filteredParty ? `Work from ${filteredParty.name}` : 'All Fitness Work'}
                <span className='ml-2 text-xs font-normal text-stone-500'>{pagination.totalRecords} entries</span>
              </h2>
              {hasFilter && (
                <button type='button' onClick={clearFilters} className='text-xs font-semibold text-stone-500 hover:text-stone-900 cursor-pointer'>
                  Clear filters
                </button>
              )}
            </div>
            <div className='flex flex-col gap-2 sm:flex-row sm:items-center'>
              <SearchSelect
                value={partyFilter}
                onChange={changeFilter(setPartyFilter)}
                options={filterOptions}
                placeholder='All parties'
                searchPlaceholder='Search party…'
                emptyText='No party found'
                icon={User}
                clearable
                ariaLabel='Filter by party'
                className='sm:w-64'
              />
              <div className='flex items-center gap-2'>
                <input
                  type='date'
                  value={fromDate}
                  max={toDate || undefined}
                  onChange={(e) => changeFilter(setFromDate)(e.target.value)}
                  className={`${FILTER_DATE} min-w-0 flex-1`}
                  aria-label='From date'
                />
                <span className='text-xs text-stone-400'>to</span>
                <input
                  type='date'
                  value={toDate}
                  min={fromDate || undefined}
                  onChange={(e) => changeFilter(setToDate)(e.target.value)}
                  className={`${FILTER_DATE} min-w-0 flex-1`}
                  aria-label='To date'
                />
              </div>
            </div>
            {hasFilter && listTotals && (
              <div className='flex flex-wrap gap-x-5 gap-y-1 rounded-lg bg-white px-3 py-2 text-xs text-stone-600 ring-1 ring-stone-200'>
                <span>
                  Works <b className='text-stone-900'>{listTotals.entries}</b>
                </span>
                <span>
                  Amount <b className='text-stone-900'>{formatRupees(listTotals.amount)}</b>
                </span>
                <span>
                  Profit <b className='text-emerald-700'>{formatRupees(listTotals.profit)}</b>
                </span>
              </div>
            )}
          </div>

          {loading ? (
            <div className='flex flex-col items-center justify-center gap-3 py-14 text-stone-500'>
              <Loader2 className='h-6 w-6 animate-spin text-stone-700' />
              <p className='text-sm'>Loading fitness work…</p>
            </div>
          ) : works.length === 0 ? (
            <div className='flex flex-col items-center justify-center gap-2 px-6 py-14 text-center'>
              <span className='flex h-11 w-11 items-center justify-center rounded-full bg-stone-100'>
                <ClipboardCheck className='h-5 w-5 text-stone-400' />
              </span>
              <p className='text-sm font-semibold text-stone-800'>No fitness work found</p>
              <p className='text-xs text-stone-500'>{hasFilter ? 'Try different filters.' : 'Add the first work to get started.'}</p>
              {!hasFilter && (
                <button type='button' onClick={openAdd} className={`${PRIMARY_BUTTON} mt-2`}>
                  <Plus className='h-4 w-4' strokeWidth={2.5} />
                  New Work
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className='hidden overflow-x-auto md:block'>
                <table className='w-full text-left'>
                  <thead>
                    <tr className='border-b border-stone-200 text-[11px] font-semibold uppercase tracking-wide text-stone-400'>
                      <th className='px-5 py-2.5'>Party</th>
                      <th className='px-3 py-2.5'>Date</th>
                      <th className='px-3 py-2.5'>Vehicle</th>
                      <th className='px-3 py-2.5 text-right'>Amount</th>
                      <th className='px-3 py-2.5 text-right'>Profit</th>
                      <th className='px-5 py-2.5' />
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-stone-200/70'>
                    {works.map((work) => (
                      <tr key={work._id} className='text-sm transition hover:bg-white'>
                        <td className='px-5 py-3'>
                          {renderParty(work)}
                          {work.note && (
                            <p className='mt-1 max-w-xs truncate pl-12 text-xs text-stone-400' title={work.note}>
                              {work.note}
                            </p>
                          )}
                        </td>
                        <td className='whitespace-nowrap px-3 py-3 text-stone-700'>{formatDate(work.date)}</td>
                        <td className='whitespace-nowrap px-3 py-3'>
                          {work.vehicleNumber ? (
                            <span className='rounded-md bg-stone-100 px-2 py-0.5 font-mono text-xs font-semibold text-stone-700'>{work.vehicleNumber}</span>
                          ) : (
                            <span className='text-stone-400'>—</span>
                          )}
                        </td>
                        <td className='whitespace-nowrap px-3 py-3 text-right font-medium tabular-nums text-stone-800'>{formatRupees(work.amount)}</td>
                        <td className='whitespace-nowrap px-3 py-3'>{renderProfit(work)}</td>
                        <td className='px-5 py-3'>
                          <div className='flex justify-end'>
                            <RowMenu items={rowActions(work)} label={`Actions for this work`} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Phones: one short card per work */}
              <ul className='divide-y divide-stone-200/70 md:hidden'>
                {works.map((work) => (
                  <li key={work._id} className='flex items-start gap-3 px-4 py-3'>
                    <Avatar name={work.userId?.name || '?'} seed={work.userId?._id} />
                    <div className='min-w-0 flex-1'>
                      <div className='flex items-start justify-between gap-2'>
                        <p className='truncate text-sm font-semibold text-stone-900'>{work.userId?.name || 'Deleted user'}</p>
                        <p className='shrink-0 text-sm font-bold tabular-nums text-emerald-700'>{formatRupees(work.profit)}</p>
                      </div>
                      <div className='flex items-center justify-between gap-2 text-xs text-stone-500'>
                        <span className='truncate'>
                          {formatDate(work.date)}
                          {work.vehicleNumber && ` · ${work.vehicleNumber}`}
                        </span>
                        <span className='shrink-0 tabular-nums'>of {formatRupees(work.amount)}</span>
                      </div>
                      {work.note && <p className='truncate text-xs text-stone-400'>{work.note}</p>}
                    </div>
                    <RowMenu items={rowActions(work)} label='Actions for this work' />
                  </li>
                ))}
              </ul>

              {pagination.totalPages > 1 && (
                <div className='flex items-center justify-between border-t border-stone-200 px-4 py-2.5 text-xs text-stone-500 md:px-5'>
                  <span>
                    Page {pagination.currentPage} of {pagination.totalPages}
                  </span>
                  <div className='flex gap-1'>
                    <button
                      type='button'
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1}
                      className={`${ICON_BUTTON} disabled:opacity-40 disabled:cursor-default`}
                      aria-label='Previous page'
                    >
                      <ChevronLeft className='h-4 w-4' />
                    </button>
                    <button
                      type='button'
                      onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                      disabled={page >= pagination.totalPages}
                      className={`${ICON_BUTTON} disabled:opacity-40 disabled:cursor-default`}
                      aria-label='Next page'
                    >
                      <ChevronRight className='h-4 w-4' />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </section>

        {/* Side: party-wise and month-wise */}
        <div className='space-y-4'>
          <section className={CARD}>
            <div className='border-b border-stone-200 px-4 py-3 md:px-5'>
              <h2 className='text-sm font-bold text-stone-800'>Party-wise Profit</h2>
              <p className='text-xs text-stone-500'>Tap a party to see only their work</p>
            </div>
            {summary?.parties?.length ? (
              <ul className='max-h-[420px] divide-y divide-stone-200/70 overflow-y-auto'>
                {summary.parties.map((p) => {
                  const active = partyFilter === String(p.userId)
                  return (
                    <li key={p.userId}>
                      <button
                        type='button'
                        onClick={() => changeFilter(setPartyFilter)(active ? '' : String(p.userId))}
                        className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition md:px-5 cursor-pointer ${active ? 'bg-white ring-1 ring-inset ring-stone-300' : 'hover:bg-white'}`}
                      >
                        <Avatar name={p.name} seed={p.userId} size='h-8 w-8' />
                        <div className='min-w-0 flex-1'>
                          <div className='flex items-center justify-between gap-2'>
                            <p className='truncate text-sm font-semibold text-stone-900'>{p.name}</p>
                            <p className='shrink-0 text-sm font-bold tabular-nums text-emerald-700'>{formatRupees(p.profit)}</p>
                          </div>
                          <div className='mt-1 h-1.5 overflow-hidden rounded-full bg-stone-200/70'>
                            <div className='h-full rounded-full bg-emerald-500' style={{ width: `${Math.max(2, (p.profit / maxPartyProfit) * 100)}%` }} />
                          </div>
                          <p className='mt-1 text-[11px] text-stone-500'>
                            {plural(p.entries, 'work', 'works')} · {formatRupees(p.amount)} · last {formatDate(p.lastDate)}
                          </p>
                        </div>
                      </button>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <p className='px-5 py-8 text-center text-xs text-stone-500'>{loading ? 'Loading…' : 'No party has given work yet.'}</p>
            )}
          </section>

          <section className={CARD}>
            <div className='border-b border-stone-200 px-4 py-3 md:px-5'>
              <h2 className='text-sm font-bold text-stone-800'>Month-wise</h2>
              <p className='text-xs text-stone-500'>Last 12 months</p>
            </div>
            {months.length ? (
              <ul className='divide-y divide-stone-200/70'>
                {months.map((m) => (
                  <li key={m.month} className='px-4 py-2.5 md:px-5'>
                    <div className='flex items-center justify-between gap-2 text-sm'>
                      <span className='font-semibold text-stone-800'>{formatMonth(m.month)}</span>
                      <span className='font-bold tabular-nums text-emerald-700'>{formatRupees(m.profit)}</span>
                    </div>
                    <div className='mt-1 h-1.5 overflow-hidden rounded-full bg-stone-200/70'>
                      <div className='h-full rounded-full bg-teal-500' style={{ width: `${Math.max(2, (m.profit / maxMonthProfit) * 100)}%` }} />
                    </div>
                    <p className='mt-1 text-[11px] text-stone-500'>
                      {plural(m.entries, 'work', 'works')} · {formatRupees(m.amount)}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className='px-5 py-8 text-center text-xs text-stone-500'>{loading ? 'Loading…' : 'Nothing recorded yet.'}</p>
            )}
          </section>
        </div>
      </div>

      {/* Add / edit popup */}
      {showModal && (
        <div className='fixed inset-0 z-50 grid place-items-center bg-black/40 p-4' onClick={closeModal}>
          <div
            className='max-h-[calc(100vh-2rem)] w-full max-w-lg overflow-y-auto rounded-2xl border border-stone-200 bg-[#fbfaf7] shadow-2xl'
            onClick={(e) => e.stopPropagation()}
            role='dialog'
            aria-modal='true'
          >
            <div className='flex items-start justify-between gap-4 border-b border-stone-200 px-5 py-4'>
              <div className='flex items-center gap-3'>
                <span className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white'>
                  <ClipboardCheck className='h-5 w-5' />
                </span>
                <div>
                  <h2 className='text-base font-bold text-stone-900'>{editingId ? 'Edit Fitness Work' : 'New Fitness Work'}</h2>
                  <p className='mt-0.5 text-sm text-stone-500'>Which party gave the work, its amount and our profit.</p>
                </div>
              </div>
              <button type='button' onClick={closeModal} className={ICON_BUTTON} aria-label='Close'>
                <X className='h-4 w-4' />
              </button>
            </div>

            <form className='grid gap-4 p-5' onSubmit={handleSubmit}>
              <div className='grid gap-1.5'>
                <FieldLabel>Date</FieldLabel>
                <div className='relative'>
                  <CalendarDays className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400' />
                  <input
                    type='date'
                    name='date'
                    value={formData.date}
                    onChange={handleChange}
                    onKeyDown={enterTo(() => partyRef.current?.click())}
                    className={INPUT_CLASS}
                    aria-label='Date'
                    autoFocus
                  />
                </div>
                <div className='flex gap-1.5'>
                  {[
                    ['Today', 0],
                    ['Yesterday', 1]
                  ].map(([label, daysAgo]) => {
                    const key = toDateInput(Date.now() - daysAgo * 24 * 60 * 60 * 1000)
                    const active = formData.date === key
                    return (
                      <button
                        key={label}
                        type='button'
                        onClick={() => setField('date', key)}
                        className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold transition cursor-pointer ${active ? 'border-stone-900 bg-stone-900 text-white' : 'border-stone-300 bg-white text-stone-600 hover:bg-stone-100'}`}
                      >
                        {label}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className='grid gap-1.5'>
                <FieldLabel>Work By Party</FieldLabel>
                <SearchSelect
                  value={formData.userId}
                  onChange={(userId) => {
                    setField('userId', userId)
                    // Party chosen: carry on typing in Work Amount
                    requestAnimationFrame(() => amountRef.current?.focus())
                  }}
                  options={partyOptions}
                  placeholder='Select party'
                  searchPlaceholder='Search name or mobile…'
                  emptyText='No party found'
                  icon={User}
                  ariaLabel='Work by party'
                  triggerRef={partyRef}
                />
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <label className='grid gap-1.5'>
                  <FieldLabel>Work Amount</FieldLabel>
                  <div className='relative'>
                    <IndianRupee className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400' />
                    <input
                      type='number'
                      ref={amountRef}
                      name='amount'
                      value={formData.amount}
                      onChange={handleChange}
                      onKeyDown={enterTo(() => profitRef.current?.focus())}
                      placeholder='e.g. 5000'
                      min='0'
                      step='0.01'
                      inputMode='decimal'
                      className={INPUT_CLASS}
                    />
                  </div>
                </label>
                <label className='grid gap-1.5'>
                  <FieldLabel>Our Profit</FieldLabel>
                  <div className='relative'>
                    <TrendingUp className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-500' />
                    <input
                      type='number'
                      ref={profitRef}
                      name='profit'
                      value={formData.profit}
                      onChange={handleChange}
                      placeholder='e.g. 800'
                      step='0.01'
                      inputMode='decimal'
                      className={`${INPUT_CLASS} focus:border-emerald-500 focus:ring-emerald-100`}
                    />
                  </div>
                </label>
              </div>

              {/* Live breakdown of the numbers typed above */}
              <div className='grid grid-cols-3 divide-x divide-stone-200 rounded-xl border border-stone-200 bg-white text-center'>
                <div className='px-2 py-2.5'>
                  <p className='text-[11px] font-medium uppercase tracking-wide text-stone-400'>Amount</p>
                  <p className='text-sm font-bold tabular-nums text-stone-800'>{formReady ? formatRupees(formAmount) : '—'}</p>
                </div>
                <div className='px-2 py-2.5'>
                  <p className='text-[11px] font-medium uppercase tracking-wide text-stone-400'>Cost</p>
                  <p className='text-sm font-bold tabular-nums text-stone-800'>{formReady ? formatRupees(formAmount - formProfit) : '—'}</p>
                </div>
                <div className='px-2 py-2.5'>
                  <p className='text-[11px] font-medium uppercase tracking-wide text-stone-400'>Margin</p>
                  <p className={`text-sm font-bold tabular-nums ${formReady && formProfit < 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                    {formReady ? marginOf(formProfit, formAmount) || '—' : '—'}
                  </p>
                </div>
              </div>

              <div className='grid gap-4 sm:grid-cols-2'>
                <label className='grid gap-1.5'>
                  <FieldLabel optional>Vehicle Number</FieldLabel>
                  <div className='relative'>
                    <Car className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400' />
                    <input
                      type='text'
                      name='vehicleNumber'
                      value={formData.vehicleNumber}
                      onChange={(e) => setField('vehicleNumber', e.target.value.toUpperCase())}
                      onKeyDown={enterTo(() => noteRef.current?.focus())}
                      placeholder='CG04AB1234'
                      className={INPUT_CLASS}
                    />
                  </div>
                </label>
                <label className='grid gap-1.5'>
                  <FieldLabel optional>Note</FieldLabel>
                  <div className='relative'>
                    <StickyNote className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400' />
                    <input ref={noteRef} type='text' name='note' value={formData.note} onChange={handleChange} placeholder='Any detail' className={INPUT_CLASS} />
                  </div>
                </label>
              </div>

              {formError && (
                <p className='flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700'>
                  <AlertTriangle className='h-4 w-4 shrink-0' />
                  {formError}
                </p>
              )}

              <div className='flex justify-end gap-2 border-t border-stone-200 pt-4'>
                <button type='button' onClick={closeModal} className={SECONDARY_BUTTON}>
                  Cancel
                </button>
                <button type='submit' disabled={saving} className={`${PRIMARY_BUTTON} px-6`}>
                  {saving && <Loader2 className='h-4 w-4 animate-spin' />}
                  {saving ? 'Saving…' : editingId ? 'Update Work' : 'Save Work'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {workToDelete && (
        <div className='fixed inset-0 z-50 grid place-items-center bg-black/40 p-4' onClick={() => !deleting && setWorkToDelete(null)}>
          <div
            className='w-full max-w-sm rounded-2xl border border-stone-200 bg-[#fbfaf7] p-6 text-center shadow-2xl'
            onClick={(e) => e.stopPropagation()}
            role='alertdialog'
            aria-modal='true'
          >
            <span className='mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-rose-50'>
              <AlertTriangle className='h-5 w-5 text-rose-600' />
            </span>
            <h3 className='mt-3 text-base font-bold text-stone-900'>Delete this work?</h3>
            <p className='mt-1 text-sm text-stone-500'>
              Work from <span className='font-semibold text-stone-800'>{workToDelete.userId?.name || 'a deleted user'}</span> of{' '}
              {formatRupees(workToDelete.amount)} on {formatDate(workToDelete.date)} will be removed. This cannot be undone.
            </p>
            <div className='mt-5 flex gap-2'>
              <button type='button' onClick={() => setWorkToDelete(null)} disabled={deleting} className={`${SECONDARY_BUTTON} flex-1`}>
                Cancel
              </button>
              <button
                type='button'
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className='flex flex-1 items-center justify-center gap-2 rounded-lg bg-rose-600 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-60 cursor-pointer'
              >
                {deleting && <Loader2 className='h-4 w-4 animate-spin' />}
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default FitnessWork
