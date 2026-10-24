import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import RcApiUsageCard from '../components/RcApiUsageCard'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://api.rtosarthi.com'

// Dates are pinned to India time so the admin's device timezone can't shift a day or month.
const IST = 'Asia/Kolkata'
const PAGE_SIZE = 50

const todayIST = () => new Date().toLocaleDateString('en-CA', { timeZone: IST })

const formatDate = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleDateString('en-IN', { timeZone: IST, day: '2-digit', month: 'short', year: 'numeric' })
}

// 'YYYY-MM-DD' -> 'Thu, 08 Oct'
const formatDay = (key) => {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-IN', {
    timeZone: 'UTC',
    weekday: 'short',
    day: '2-digit',
    month: 'short'
  })
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

const formatNumber = (n) => Number(n || 0).toLocaleString('en-IN')

const EMPTY_FORM = { type: 'sale', userId: '', quantity: '', rate: '', date: '', note: '' }

const Tile = ({ label, value, sub, accent = 'text-gray-900', className = '' }) => (
  <div className={`bg-white rounded-xl border border-gray-100 p-2.5 sm:p-4 shadow-sm ${className}`}>
    <p className='text-[10px] sm:text-xs text-gray-500 font-semibold uppercase tracking-wide'>{label}</p>
    <p className={`text-lg sm:text-2xl font-bold mt-0.5 sm:mt-1 tabular-nums ${accent}`}>{value}</p>
    {sub && <p className='text-[11px] text-gray-400 mt-0.5'>{sub}</p>}
  </div>
)

const TypeBadge = ({ type }) =>
  type === 'sale' ? (
    <span className='inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-emerald-50 text-emerald-700 border border-emerald-200'>
      Sold
    </span>
  ) : (
    <span className='inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-sky-50 text-sky-700 border border-sky-200'>
      Bought
    </span>
  )

const th = 'px-2.5 sm:px-4 py-2 sm:py-2.5 text-[10px] sm:text-[11px] font-semibold text-gray-500 uppercase tracking-wider'

const ApiCredits = () => {
  const [searchParams, setSearchParams] = useSearchParams()

  const [summary, setSummary] = useState(null)
  const [usage, setUsage] = useState(null)
  // App users and API keys in one list, most used first
  const usageRows = useMemo(
    () =>
      [
        ...(usage?.users || []).map((u) => ({ ...u, rowKey: `u-${u.userId}`, left: u.rcSearchRemaining })),
        ...(usage?.apiKeys || []).map((k) => ({ ...k, rowKey: `k-${k.apiKeyId}`, isKey: true, left: k.remaining }))
      ].sort((a, b) => b.last28 - a.last28 || b.last7 - a.last7),
    [usage]
  )
  const [transactions, setTransactions] = useState([])
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalRecords: 0 })
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [typeFilter, setTypeFilter] = useState('all')
  const [userFilter, setUserFilter] = useState(searchParams.get('user') || '')
  const [page, setPage] = useState(1)

  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState(EMPTY_FORM)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  // Entry whose rate is being changed (only the price can be edited)
  const [editTxn, setEditTxn] = useState(null)
  const [editRate, setEditRate] = useState('')
  const [editError, setEditError] = useState('')
  const [editSaving, setEditSaving] = useState(false)
  // Bumped after a sale/delete so the provider quota card and user limits re-read
  const [refreshKey, setRefreshKey] = useState(0)

  const fetchSummary = useCallback(async () => {
    const res = await fetch(`${BACKEND_URL}/api/admin/api-credits/summary`, { credentials: 'include' })
    const json = await res.json()
    if (!json.success) throw new Error(json.message || 'Failed to load summary')
    setSummary(json.data)
  }, [])

  const fetchUsage = useCallback(async () => {
    const res = await fetch(`${BACKEND_URL}/api/admin/api-credits/usage`, { credentials: 'include' })
    const json = await res.json()
    if (!json.success) throw new Error(json.message || 'Failed to load usage')
    setUsage(json.data)
  }, [])

  const fetchTransactions = useCallback(async () => {
    const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) })
    if (typeFilter !== 'all') params.set('type', typeFilter)
    if (userFilter) params.set('userId', userFilter)
    const res = await fetch(`${BACKEND_URL}/api/admin/api-credits?${params}`, { credentials: 'include' })
    const json = await res.json()
    if (!json.success) throw new Error(json.message || 'Failed to load history')
    setTransactions(json.data)
    setPagination(json.pagination)
  }, [page, typeFilter, userFilter])

  const fetchUsers = useCallback(async () => {
    const res = await fetch(`${BACKEND_URL}/api/admin/users?limit=1000`, { credentials: 'include' })
    const json = await res.json()
    if (!json.success) throw new Error(json.message || 'Failed to load users')
    setUsers([...json.data].sort((a, b) => a.name.localeCompare(b.name)))
  }, [])

  const loadAll = useCallback(async () => {
    try {
      setError('')
      await Promise.all([fetchSummary(), fetchUsage(), fetchTransactions(), fetchUsers()])
    } catch (err) {
      setError(err.message || 'Failed to load API sales')
    } finally {
      setLoading(false)
    }
  }, [fetchSummary, fetchUsage, fetchTransactions, fetchUsers])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  const usersById = useMemo(() => new Map(users.map((u) => [u._id, u])), [users])
  const selectedUser = usersById.get(formData.userId)
  // What the user picked in the sell form has bought so far
  const selectedUserSales = summary?.users?.find((u) => String(u.userId) === formData.userId)
  const filteredUser = usersById.get(userFilter)

  const openModal = useCallback(
    (type, userId = '') => {
      setFormData({
        ...EMPTY_FORM,
        type,
        userId,
        date: todayIST(),
        // Start from the price used last time, so it only needs typing when it changes
        rate: summary?.lastRates?.[type] ?? ''
      })
      setFormError('')
      setShowModal(true)
    },
    [summary]
  )

  // Arriving from a user's row in Manage Users (?user=<id>): show that user's
  // history and open the sell form for them straight away.
  const [autoOpened, setAutoOpened] = useState(false)
  useEffect(() => {
    const fromUser = searchParams.get('user')
    if (fromUser && !autoOpened && !loading && usersById.has(fromUser)) {
      setAutoOpened(true)
      openModal('sale', fromUser)
    }
  }, [searchParams, autoOpened, loading, usersById, openModal])

  const closeModal = () => {
    setShowModal(false)
    setFormError('')
  }

  const changeUserFilter = (value) => {
    setUserFilter(value)
    setPage(1)
    // Keep the address bar honest so a reload shows the same user
    if (value) setSearchParams({ user: value }, { replace: true })
    else setSearchParams({}, { replace: true })
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setFormError('')
  }

  const quantity = Number(formData.quantity)
  const rate = Number(formData.rate)
  const total =
    formData.quantity !== '' && formData.rate !== '' && !Number.isNaN(quantity) && !Number.isNaN(rate)
      ? Math.round(quantity * rate * 100) / 100
      : null

  const handleSubmit = async (e) => {
    e.preventDefault()
    const isSale = formData.type === 'sale'

    if (isSale && !formData.userId) return setFormError('Please select a user')
    if (!Number.isInteger(quantity) || quantity < 1) {
      return setFormError('Number of API calls must be a whole number of at least 1')
    }
    if (formData.rate === '' || Number.isNaN(rate) || rate < 0) {
      return setFormError('Please enter the price per API call')
    }
    if (!formData.date) return setFormError('Please choose a date')

    try {
      setSaving(true)
      setFormError('')
      const res = await fetch(`${BACKEND_URL}/api/admin/api-credits`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: formData.type,
          userId: isSale ? formData.userId : undefined,
          quantity,
          rate,
          date: formData.date,
          note: formData.note
        })
      })
      const json = await res.json()
      if (json.success) {
        setSuccess(json.message)
        setShowModal(false)
        setPage(1)
        setRefreshKey((k) => k + 1)
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

  const handleDelete = async (txn) => {
    const who = txn.userId?.name ? ` to ${txn.userId.name}` : ''
    const warning =
      txn.type === 'sale'
        ? `Delete this sale of ${txn.quantity} API calls${who}?\n\nThe user's vehicle API limit will be reduced by ${txn.quantity}.`
        : `Delete this purchase of ${txn.quantity} API calls?`
    if (!confirm(warning)) return

    try {
      setDeletingId(txn._id)
      setError('')
      setSuccess('')
      const res = await fetch(`${BACKEND_URL}/api/admin/api-credits/${txn._id}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      const json = await res.json()
      if (json.success) {
        setSuccess(json.message)
        setRefreshKey((k) => k + 1)
        await loadAll()
      } else {
        setError(json.message || 'Failed to delete entry')
      }
    } catch {
      setError('Failed to delete entry')
    } finally {
      setDeletingId(null)
    }
  }

  const openEditRate = (txn) => {
    setEditTxn(txn)
    setEditRate(String(txn.rate))
    setEditError('')
  }

  const closeEditRate = () => {
    if (editSaving) return
    setEditTxn(null)
  }

  const handleEditRate = async (e) => {
    e.preventDefault()
    const price = Number(editRate)
    if (editRate === '' || Number.isNaN(price) || price < 0) {
      setEditError('Enter a valid rate')
      return
    }
    try {
      setEditSaving(true)
      setEditError('')
      const res = await fetch(`${BACKEND_URL}/api/admin/api-credits/${editTxn._id}/rate`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ rate: price })
      })
      const json = await res.json()
      if (!json.success) {
        setEditError(json.message || 'Failed to update rate')
        return
      }
      setEditTxn(null)
      setError('')
      setSuccess(json.message)
      await loadAll()
    } catch {
      setEditError('Failed to update rate')
    } finally {
      setEditSaving(false)
    }
  }

  const editAmount = Number(editRate)
  const editAmountValid = editTxn && editRate !== '' && !Number.isNaN(editAmount) && editAmount >= 0

  const totals = summary?.totals
  const isSaleForm = formData.type === 'sale'
  const inputClass =
    'w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
  const labelClass = 'block text-xs sm:text-sm font-semibold text-gray-700 mb-1'

  return (
    <div className='max-w-[1500px] mx-auto'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2.5 sm:gap-4 mb-3 sm:mb-6'>
        <div>
          <h1 className='text-xl sm:text-3xl font-bold text-gray-800'>Vehicle API Sales</h1>
          <p className='text-xs sm:text-base text-gray-600 mt-0.5 sm:mt-1'>
            What you buy from the provider, what each user buys from you, and the cashflow
          </p>
        </div>
        <div className='grid grid-cols-2 sm:flex gap-2'>
          <button
            onClick={() => openModal('purchase')}
            className='px-2 py-2 sm:px-4 sm:py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold text-sm transition-colors cursor-pointer'
          >
            + I Bought from Provider
          </button>
          <button
            onClick={() => openModal('sale', userFilter)}
            className='px-2 py-2 sm:px-5 sm:py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-semibold text-sm shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transition-all cursor-pointer'
          >
            + Sell to User
          </button>
        </div>
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
          <div className='grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3'>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className='h-24 bg-white rounded-xl border border-gray-100 animate-pulse' />
            ))}
          </div>
          <div className='h-64 bg-white rounded-xl border border-gray-100 animate-pulse' />
        </div>
      ) : (
        <>
          {/* Totals */}
          <div className='grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2 sm:gap-3 mb-3 sm:mb-5'>
            <Tile
              label="Today's Sales"
              value={formatRupees(summary?.today?.amount)}
              accent='text-emerald-700'
              sub={
                summary?.today?.entries
                  ? `${formatNumber(summary.today.quantity)} API calls in ${summary.today.entries} sale(s)${
                      summary.today.keyAmount ? ` · ${formatRupees(summary.today.keyAmount)} via API keys` : ''
                    }`
                  : 'No sale recorded today'
              }
            />
            <Tile
              label='You Bought'
              value={formatRupees(totals?.boughtAmount)}
              sub={
                totals?.boughtQty
                  ? `${formatNumber(totals.boughtQty)} API calls · avg ${formatRupees(totals.avgBuyRate)} each`
                  : 'No purchase recorded yet'
              }
            />
            <Tile
              label='Total Sale Amount'
              value={formatRupees(totals?.soldAmount)}
              sub={
                totals?.soldQty
                  ? `Received from users${totals.keySoldAmount ? ` · ${formatRupees(totals.keySoldAmount)} via API keys` : ''} · avg ${formatRupees(totals.avgSellRate)} per search`
                  : 'No sale recorded yet'
              }
            />
            <Tile
              label='RC Searches Sold'
              value={formatNumber(totals?.soldQty)}
              sub={
                totals?.boughtQty
                  ? `of ${formatNumber(totals.boughtQty)} bought · ${formatNumber(totals.unsoldQty)} not yet sold`
                  : 'Total searches sold to users'
              }
            />
            <Tile
              label='Profit on Sold'
              value={totals?.profitOnSold === null || totals?.profitOnSold === undefined ? '-' : formatRupees(totals.profitOnSold)}
              accent={totals?.profitOnSold < 0 ? 'text-red-600' : 'text-emerald-700'}
              sub={
                totals?.profitOnSold === null || totals?.profitOnSold === undefined
                  ? 'Record a purchase to see profit'
                  : 'Sold amount minus its cost at your average buying price'
              }
            />
            <Tile
              label='Net Cashflow'
              value={formatRupees(totals?.netCashflow)}
              accent={totals?.netCashflow < 0 ? 'text-red-600' : 'text-emerald-700'}
              sub={`Received minus paid · ${formatNumber(totals?.unsoldQty)} bought calls not yet sold`}
            />
          </div>

          {/* Provider quota actually left */}
          <RcApiUsageCard key={refreshKey} className='mb-3 sm:mb-5' />

          {/* History */}
          <div className='bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-3 sm:mb-5'>
            <div className='p-2.5 sm:p-3 border-b border-gray-100 flex flex-col lg:flex-row lg:items-center gap-2 sm:gap-3'>
              <h2 className='text-sm font-bold text-gray-800 lg:mr-auto'>
                History
                {filteredUser && <span className='font-normal text-gray-500'> · {filteredUser.name}</span>}
                <span className='font-normal text-gray-400'> ({pagination.totalRecords})</span>
              </h2>
              <div className='flex rounded-lg border border-gray-300 overflow-hidden bg-white self-start'>
                {[
                  ['all', 'All'],
                  ['sale', 'Sold to users'],
                  ['purchase', 'Bought from provider']
                ].map(([value, label], i) => (
                  <button
                    key={value}
                    onClick={() => {
                      setTypeFilter(value)
                      setPage(1)
                    }}
                    className={`px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                      typeFilter === value ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-50'
                    } ${i > 0 ? 'border-l border-gray-300' : ''}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <select
                value={userFilter}
                onChange={(e) => changeUserFilter(e.target.value)}
                className='px-3 py-1.5 text-xs border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer lg:max-w-[260px]'
              >
                <option value=''>All users</option>
                {users.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.name} · {u.mobile1}
                  </option>
                ))}
              </select>
            </div>

            {transactions.length === 0 ? (
              <p className='p-8 text-center text-sm text-gray-500'>
                {userFilter || typeFilter !== 'all'
                  ? 'No entries match this filter.'
                  : 'Nothing recorded yet. Start with "I Bought from Provider", then "Sell to User".'}
              </p>
            ) : (
              <>
              <ul className='md:hidden divide-y divide-gray-100'>
                {transactions.map((txn) => (
                  <li key={txn._id} className='flex items-center gap-2 px-2.5 py-2'>
                    <div className='min-w-0 flex-1'>
                      <div className='flex items-center gap-1.5 min-w-0'>
                        <TypeBadge type={txn.type} />
                        <span className='text-xs font-semibold text-gray-900 truncate'>
                          {txn.type === 'purchase' ? 'API provider' : txn.userId ? txn.userId.name : 'Deleted user'}
                        </span>
                      </div>
                      <div className='text-[11px] text-gray-500 truncate mt-0.5'>
                        {formatDate(txn.date)} · {formatNumber(txn.quantity)} calls @ {formatRupees(txn.rate)}
                        {txn.note && <span className='text-gray-400'> · {txn.note}</span>}
                      </div>
                    </div>
                    <div className='shrink-0 text-xs font-bold text-gray-900 tabular-nums'>{formatRupees(txn.amount)}</div>
                    <button
                      onClick={() => openEditRate(txn)}
                      className='shrink-0 p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors cursor-pointer'
                      title='Edit rate'
                    >
                      <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(txn)}
                      disabled={deletingId === txn._id}
                      className='shrink-0 p-1.5 -mr-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-40 disabled:cursor-wait cursor-pointer'
                      title='Delete entry'
                    >
                      <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
              <div className='hidden md:block overflow-x-auto'>
                <table className='w-full'>
                  <thead>
                    <tr className='border-b border-gray-100 bg-gray-50/60'>
                      <th className={`${th} text-left`}>Date</th>
                      <th className={`${th} text-left`}>Type</th>
                      <th className={`${th} text-left`}>User</th>
                      <th className={`${th} text-right`}>API Calls</th>
                      <th className={`${th} text-right`}>Rate</th>
                      <th className={`${th} text-right`}>Amount</th>
                      <th className={`${th} text-left`}>Note</th>
                      <th className={`${th} text-right`}></th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-gray-100'>
                    {transactions.map((txn) => (
                      <tr key={txn._id} className='hover:bg-gray-50/80 transition-colors'>
                        <td className='px-2.5 sm:px-4 py-2 sm:py-2.5 text-xs text-gray-700 whitespace-nowrap'>{formatDate(txn.date)}</td>
                        <td className='px-2.5 sm:px-4 py-2 sm:py-2.5'>
                          <TypeBadge type={txn.type} />
                        </td>
                        <td className='px-2.5 sm:px-4 py-2 sm:py-2.5 text-xs'>
                          {txn.type === 'purchase' ? (
                            <span className='text-gray-400'>API provider</span>
                          ) : txn.userId ? (
                            <>
                              <div className='font-semibold text-gray-900'>{txn.userId.name}</div>
                              <div className='text-gray-400'>{txn.userId.mobile1}</div>
                            </>
                          ) : (
                            <span className='text-gray-400'>Deleted user</span>
                          )}
                        </td>
                        <td className='px-2.5 sm:px-4 py-2 sm:py-2.5 text-xs text-gray-700 text-right tabular-nums'>
                          {formatNumber(txn.quantity)}
                        </td>
                        <td className='px-2.5 sm:px-4 py-2 sm:py-2.5 text-xs text-gray-700 text-right tabular-nums whitespace-nowrap'>
                          {formatRupees(txn.rate)}
                        </td>
                        <td className='px-2.5 sm:px-4 py-2 sm:py-2.5 text-xs font-bold text-gray-900 text-right tabular-nums whitespace-nowrap'>
                          {formatRupees(txn.amount)}
                        </td>
                        <td className='px-2.5 sm:px-4 py-2 sm:py-2.5 text-xs text-gray-500 max-w-[220px] truncate' title={txn.note || ''}>
                          {txn.note || '-'}
                        </td>
                        <td className='px-2.5 sm:px-4 py-2 sm:py-2.5 text-right whitespace-nowrap'>
                          <button
                            onClick={() => openEditRate(txn)}
                            className='p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors cursor-pointer'
                            title='Edit rate'
                          >
                            <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(txn)}
                            disabled={deletingId === txn._id}
                            className='p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-40 disabled:cursor-wait cursor-pointer'
                            title='Delete entry'
                          >
                            <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              </>
            )}

            {pagination.totalPages > 1 && (
              <div className='p-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500'>
                <span>
                  Page {pagination.currentPage} of {pagination.totalPages}
                </span>
                <div className='flex gap-2'>
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className='px-3 py-1.5 rounded-lg border border-gray-300 font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer'
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                    disabled={page >= pagination.totalPages}
                    className='px-3 py-1.5 rounded-lg border border-gray-300 font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer'
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Searches users actually made */}
          <div className='mb-3 sm:mb-5'>
            <div className='flex flex-wrap items-baseline justify-between gap-x-2 mb-2'>
              <h2 className='text-sm font-bold text-gray-800'>API Usage</h2>
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
              API key calls · today: API 1 <span className='font-semibold text-gray-800'>{formatNumber(usage?.totals?.api1Today)}</span>
              {' · '}API 2 <span className='font-semibold text-gray-800'>{formatNumber(usage?.totals?.api2Today)}</span>
              {' · last 28 days: '}API 1 <span className='font-semibold text-gray-800'>{formatNumber(usage?.totals?.api1Last28)}</span>
              {' · '}API 2 <span className='font-semibold text-gray-800'>{formatNumber(usage?.totals?.api2Last28)}</span>
              {' · '}App <span className='font-semibold text-gray-800'>{formatNumber(usage?.totals?.appLast28)}</span>
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
                      <th className={`${th} text-right`} title='API key calls served by API 1'>API 1</th>
                      <th className={`${th} text-right`} title='API key calls served by API 2'>API 2</th>
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
                        <td className='px-2.5 sm:px-4 py-2 sm:py-2.5 text-xs text-gray-700 text-right tabular-nums'>{formatNumber(day.api1Count)}</td>
                        <td className='px-2.5 sm:px-4 py-2 sm:py-2.5 text-xs text-gray-700 text-right tabular-nums'>{formatNumber(day.api2Count)}</td>
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
                                        className={`mr-1 rounded px-1 py-px text-[10px] font-bold uppercase ${
                                          u.provider === 'api2' ? 'bg-amber-50 text-amber-700' : 'bg-indigo-50 text-indigo-600'
                                        }`}
                                      >
                                        API key · {u.provider === 'api2' ? 'API 2' : 'API 1'}
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

          <div className='grid grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-5'>
            {/* Per-user totals */}
            <div className='bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden'>
              <h2 className='text-sm font-bold text-gray-800 p-3 border-b border-gray-100'>Bought by each user</h2>
              {summary?.users?.length ? (
                <div className='overflow-x-auto'>
                  <table className='w-full'>
                    <thead>
                      <tr className='border-b border-gray-100 bg-gray-50/60'>
                        <th className={`${th} text-left`}>User</th>
                        <th className={`${th} text-right`}>Bought</th>
                        <th className={`${th} text-right`}>Paid</th>
                        <th className={`${th} text-right`}>Used / Limit</th>
                        <th className={`${th} text-right`}>Left</th>
                        <th className={`${th} text-left`}>Last Bought</th>
                      </tr>
                    </thead>
                    <tbody className='divide-y divide-gray-100'>
                      {summary.users.map((u) => (
                        <tr key={u.userId} className='hover:bg-gray-50/80 transition-colors'>
                          <td className='px-2.5 sm:px-4 py-2 sm:py-2.5 text-xs'>
                            <button
                              onClick={() => changeUserFilter(String(u.userId))}
                              className='text-left cursor-pointer group'
                              title='Show this user in the history above'
                            >
                              <div className='font-semibold text-gray-900 group-hover:text-indigo-600'>
                                {u.name || 'Deleted user'}
                              </div>
                              <div className='text-gray-400'>{u.mobile1 || ''}</div>
                            </button>
                          </td>
                          <td className='px-2.5 sm:px-4 py-2 sm:py-2.5 text-xs text-gray-700 text-right tabular-nums'>
                            {formatNumber(u.quantity)}
                          </td>
                          <td className='px-2.5 sm:px-4 py-2 sm:py-2.5 text-xs font-bold text-gray-900 text-right tabular-nums whitespace-nowrap'>
                            {formatRupees(u.amount)}
                          </td>
                          <td className='px-2.5 sm:px-4 py-2 sm:py-2.5 text-xs text-gray-700 text-right tabular-nums whitespace-nowrap'>
                            {formatNumber(u.rcSearchCount)} / {formatNumber(u.rcSearchLimit)}
                          </td>
                          <td className='px-2.5 sm:px-4 py-2 sm:py-2.5 text-xs text-gray-700 text-right tabular-nums'>
                            {formatNumber(u.rcSearchRemaining)}
                          </td>
                          <td className='px-2.5 sm:px-4 py-2 sm:py-2.5 text-xs text-gray-700 whitespace-nowrap'>{formatDate(u.lastDate)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className='p-6 text-center text-sm text-gray-500'>No user has bought API calls yet.</p>
              )}
            </div>

            {/* Month-wise cashflow */}
            <div className='bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden'>
              <h2 className='text-sm font-bold text-gray-800 p-3 border-b border-gray-100'>Month-wise cashflow</h2>
              {summary?.months?.length ? (
                <div className='overflow-x-auto'>
                  <table className='w-full'>
                    <thead>
                      <tr className='border-b border-gray-100 bg-gray-50/60'>
                        <th className={`${th} text-left`}>Month</th>
                        <th className={`${th} text-right`}>Paid to Provider</th>
                        <th className={`${th} text-right`}>Received from Users</th>
                        <th className={`${th} text-right`}>Net</th>
                      </tr>
                    </thead>
                    <tbody className='divide-y divide-gray-100'>
                      {summary.months.map((m) => (
                        <tr key={m.month} className='hover:bg-gray-50/80 transition-colors'>
                          <td className='px-2.5 sm:px-4 py-2 sm:py-2.5 text-xs text-gray-700 whitespace-nowrap'>{formatMonth(m.month)}</td>
                          <td className='px-2.5 sm:px-4 py-2 sm:py-2.5 text-xs text-right tabular-nums whitespace-nowrap'>
                            <div className='text-gray-700'>{m.boughtAmount ? formatRupees(m.boughtAmount) : '-'}</div>
                            {m.boughtQty > 0 && <div className='text-gray-400'>{formatNumber(m.boughtQty)} calls</div>}
                          </td>
                          <td className='px-2.5 sm:px-4 py-2 sm:py-2.5 text-xs text-right tabular-nums whitespace-nowrap'>
                            <div className='text-gray-700'>{m.soldAmount ? formatRupees(m.soldAmount) : '-'}</div>
                            {m.soldQty > 0 && <div className='text-gray-400'>{formatNumber(m.soldQty)} calls</div>}
                          </td>
                          <td
                            className={`px-2.5 sm:px-4 py-2 sm:py-2.5 text-xs font-bold text-right tabular-nums whitespace-nowrap ${
                              m.net < 0 ? 'text-red-600' : 'text-emerald-700'
                            }`}
                          >
                            {formatRupees(m.net)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className='p-6 text-center text-sm text-gray-500'>No entries yet.</p>
              )}
            </div>
          </div>
        </>
      )}

      {/* Edit the rate of one entry */}
      {editTxn && (
        <div className='fixed inset-0 bg-black/50 z-50 overflow-y-auto' onMouseDown={closeEditRate}>
          <div className='flex items-start justify-center min-h-full px-3 py-8 sm:py-16'>
            <form
              onSubmit={handleEditRate}
              onMouseDown={(e) => e.stopPropagation()}
              className='bg-white rounded-lg shadow-xl max-w-sm w-full p-4 sm:p-5'
            >
              <div className='flex justify-between items-start mb-3'>
                <div>
                  <h2 className='text-base sm:text-lg font-bold text-gray-800'>Edit Rate</h2>
                  <p className='text-xs text-gray-500 mt-0.5'>
                    {editTxn.type === 'sale'
                      ? `Sale to ${editTxn.userId?.name || 'deleted user'}`
                      : 'Purchase from provider'}{' '}
                    · {formatDate(editTxn.date)} · {formatNumber(editTxn.quantity)} API calls
                  </p>
                </div>
                <button
                  type='button'
                  onClick={closeEditRate}
                  className='text-gray-500 hover:text-gray-700 p-1 -mr-1 cursor-pointer'
                  aria-label='Close'
                >
                  <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                  </svg>
                </button>
              </div>

              <label className={labelClass}>Rate per API call (₹)</label>
              <input
                type='number'
                min='0'
                step='any'
                inputMode='decimal'
                value={editRate}
                onChange={(e) => setEditRate(e.target.value)}
                className={inputClass}
                autoFocus
                required
              />

              <div className='mt-3 rounded-lg bg-gray-50 border border-gray-100 p-2.5 text-xs text-gray-600 space-y-1'>
                <div className='flex justify-between'>
                  <span>Current amount</span>
                  <span className='tabular-nums'>{formatRupees(editTxn.amount)}</span>
                </div>
                <div className='flex justify-between font-semibold text-gray-900'>
                  <span>New amount</span>
                  <span className='tabular-nums'>
                    {editAmountValid ? formatRupees(Math.round(editTxn.quantity * editAmount * 100) / 100) : '-'}
                  </span>
                </div>
                <p className='text-[11px] text-gray-400 pt-0.5'>
                  Only the price changes. API calls{editTxn.type === 'sale' ? " and the user's limit" : ''} stay the same.
                </p>
              </div>

              {editError && <p className='mt-2 text-xs font-medium text-red-600'>{editError}</p>}

              <div className='mt-4 grid grid-cols-2 gap-2'>
                <button
                  type='button'
                  onClick={closeEditRate}
                  className='px-3 py-2 text-sm font-semibold border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 cursor-pointer'
                >
                  Cancel
                </button>
                <button
                  type='submit'
                  disabled={editSaving}
                  className='px-3 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 cursor-pointer'
                >
                  {editSaving ? 'Saving...' : 'Save Rate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add purchase / sale */}
      {showModal && (
        <div className='fixed inset-0 bg-black/50 z-50 overflow-y-auto'>
          <div className='flex items-start justify-center min-h-full px-3 py-8 sm:py-16'>
            <div className='bg-white rounded-lg shadow-xl max-w-md w-full p-5'>
              <div className='flex justify-between items-start mb-4'>
                <div>
                  <h2 className='text-lg font-bold text-gray-800'>
                    {isSaleForm ? 'Sell API Calls to User' : 'API Calls Bought from Provider'}
                  </h2>
                  <p className='text-xs text-gray-500 mt-0.5'>
                    {isSaleForm
                      ? "Adds to the user's vehicle API limit and records the money received."
                      : 'Records what you paid the provider. Does not change any user.'}
                  </p>
                </div>
                <button onClick={closeModal} className='text-gray-500 hover:text-gray-700 p-1 cursor-pointer'>
                  <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className='space-y-3'>
                {isSaleForm && (
                  <div>
                    <label className={labelClass}>User</label>
                    <select name='userId' value={formData.userId} onChange={handleChange} className={`${inputClass} cursor-pointer`}>
                      <option value=''>Select user</option>
                      {users.map((u) => (
                        <option key={u._id} value={u._id}>
                          {u.name} · {u.mobile1}
                        </option>
                      ))}
                    </select>
                    {selectedUser && (
                      <p className='text-[11px] text-gray-500 mt-1'>
                        Now: {formatNumber(selectedUser.rcSearchCount)} used of {formatNumber(selectedUser.rcSearchLimit)} ·{' '}
                        {formatNumber(Math.max(0, (selectedUser.rcSearchLimit || 0) - (selectedUser.rcSearchCount || 0)))} left
                        {!selectedUser.features?.rcDetails && ' · RC Details is off and will be switched on'}
                      </p>
                    )}
                    {selectedUser && (
                      <p className='text-[11px] text-gray-500 mt-0.5'>
                        {selectedUserSales
                          ? `Bought so far: ${formatNumber(selectedUserSales.quantity)} searches for ${formatRupees(selectedUserSales.amount)}`
                          : 'Has not bought any searches yet'}
                      </p>
                    )}
                  </div>
                )}

                <div className='grid grid-cols-2 gap-3'>
                  <div>
                    <label className={labelClass}>API Calls</label>
                    <input
                      type='number'
                      name='quantity'
                      value={formData.quantity}
                      onChange={handleChange}
                      placeholder={isSaleForm ? '500' : '2000'}
                      min='1'
                      step='1'
                      autoFocus
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Price per Call (₹)</label>
                    <input
                      type='number'
                      name='rate'
                      value={formData.rate}
                      onChange={handleChange}
                      placeholder={isSaleForm ? '2' : '1.4'}
                      min='0'
                      step='0.01'
                      className={inputClass}
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Date</label>
                  <input type='date' name='date' value={formData.date} onChange={handleChange} className={inputClass} />
                </div>

                <div>
                  <label className={labelClass}>
                    Note <span className='text-gray-400'>(Opt)</span>
                  </label>
                  <input
                    type='text'
                    name='note'
                    value={formData.note}
                    onChange={handleChange}
                    placeholder='e.g. Paid by UPI'
                    className={inputClass}
                  />
                </div>

                <div className='p-3 rounded-lg bg-gray-50 border border-gray-200 text-sm'>
                  <div className='flex items-center justify-between'>
                    <span className='text-gray-600'>{isSaleForm ? 'User pays you' : 'You pay provider'}</span>
                    <span className='text-lg font-bold text-gray-900 tabular-nums'>
                      {total === null ? '-' : formatRupees(total)}
                    </span>
                  </div>
                  {isSaleForm && selectedUser && Number.isInteger(quantity) && quantity > 0 && (
                    <p className='text-[11px] text-gray-500 mt-1'>
                      Limit goes from {formatNumber(selectedUser.rcSearchLimit)} to{' '}
                      <strong>{formatNumber((selectedUser.rcSearchLimit || 0) + quantity)}</strong>
                    </p>
                  )}
                </div>

                {formError && (
                  <div className='p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700'>{formError}</div>
                )}

                <div className='flex gap-2 pt-1'>
                  <button
                    type='button'
                    onClick={closeModal}
                    className='flex-1 px-4 py-2 text-sm font-semibold rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer'
                  >
                    Cancel
                  </button>
                  <button
                    type='submit'
                    disabled={saving}
                    className='flex-1 px-4 py-2 text-sm font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-wait cursor-pointer'
                  >
                    {saving ? 'Saving...' : isSaleForm ? 'Sell & Add Limit' : 'Save Purchase'}
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

export default ApiCredits
