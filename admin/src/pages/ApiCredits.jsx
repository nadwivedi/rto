import { useState, useEffect, useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
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

const Tile = ({ label, value, sub, accent = 'text-gray-900' }) => (
  <div className='bg-white rounded-xl border border-gray-100 p-4 shadow-sm'>
    <p className='text-xs text-gray-500 font-semibold uppercase tracking-wide'>{label}</p>
    <p className={`text-2xl font-bold mt-1 tabular-nums ${accent}`}>{value}</p>
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

const th = 'px-4 py-2.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider'

const ApiCredits = () => {
  const [searchParams, setSearchParams] = useSearchParams()

  const [summary, setSummary] = useState(null)
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
  // Bumped after a sale/delete so the provider quota card and user limits re-read
  const [refreshKey, setRefreshKey] = useState(0)

  const fetchSummary = useCallback(async () => {
    const res = await fetch(`${BACKEND_URL}/api/admin/api-credits/summary`, { credentials: 'include' })
    const json = await res.json()
    if (!json.success) throw new Error(json.message || 'Failed to load summary')
    setSummary(json.data)
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
      await Promise.all([fetchSummary(), fetchTransactions(), fetchUsers()])
    } catch (err) {
      setError(err.message || 'Failed to load API sales')
    } finally {
      setLoading(false)
    }
  }, [fetchSummary, fetchTransactions, fetchUsers])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  const usersById = useMemo(() => new Map(users.map((u) => [u._id, u])), [users])
  const selectedUser = usersById.get(formData.userId)
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

  const totals = summary?.totals
  const isSaleForm = formData.type === 'sale'
  const inputClass =
    'w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
  const labelClass = 'block text-xs sm:text-sm font-semibold text-gray-700 mb-1'

  return (
    <div className='max-w-[1500px] mx-auto'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6'>
        <div>
          <h1 className='text-2xl sm:text-3xl font-bold text-gray-800'>Vehicle API Sales</h1>
          <p className='text-sm sm:text-base text-gray-600 mt-1'>
            What you buy from the provider, what each user buys from you, and the cashflow
          </p>
        </div>
        <div className='flex flex-wrap gap-2'>
          <button
            onClick={() => openModal('purchase')}
            className='px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold text-sm transition-colors cursor-pointer'
          >
            + I Bought from Provider
          </button>
          <button
            onClick={() => openModal('sale', userFilter)}
            className='px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-semibold text-sm shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transition-all cursor-pointer'
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
          <div className='grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5'>
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
              label='You Sold'
              value={formatRupees(totals?.soldAmount)}
              sub={
                totals?.soldQty
                  ? `${formatNumber(totals.soldQty)} API calls · avg ${formatRupees(totals.avgSellRate)} each`
                  : 'No sale recorded yet'
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
          <RcApiUsageCard key={refreshKey} className='mb-5' />

          {/* History */}
          <div className='bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-5'>
            <div className='p-3 border-b border-gray-100 flex flex-col lg:flex-row lg:items-center gap-3'>
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
              <div className='overflow-x-auto'>
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
                        <td className='px-4 py-2.5 text-xs text-gray-700 whitespace-nowrap'>{formatDate(txn.date)}</td>
                        <td className='px-4 py-2.5'>
                          <TypeBadge type={txn.type} />
                        </td>
                        <td className='px-4 py-2.5 text-xs'>
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
                        <td className='px-4 py-2.5 text-xs text-gray-700 text-right tabular-nums'>
                          {formatNumber(txn.quantity)}
                        </td>
                        <td className='px-4 py-2.5 text-xs text-gray-700 text-right tabular-nums whitespace-nowrap'>
                          {formatRupees(txn.rate)}
                        </td>
                        <td className='px-4 py-2.5 text-xs font-bold text-gray-900 text-right tabular-nums whitespace-nowrap'>
                          {formatRupees(txn.amount)}
                        </td>
                        <td className='px-4 py-2.5 text-xs text-gray-500 max-w-[220px] truncate' title={txn.note || ''}>
                          {txn.note || '-'}
                        </td>
                        <td className='px-4 py-2.5 text-right'>
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

          <div className='grid grid-cols-1 xl:grid-cols-2 gap-5'>
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
                          <td className='px-4 py-2.5 text-xs'>
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
                          <td className='px-4 py-2.5 text-xs text-gray-700 text-right tabular-nums'>
                            {formatNumber(u.quantity)}
                          </td>
                          <td className='px-4 py-2.5 text-xs font-bold text-gray-900 text-right tabular-nums whitespace-nowrap'>
                            {formatRupees(u.amount)}
                          </td>
                          <td className='px-4 py-2.5 text-xs text-gray-700 text-right tabular-nums whitespace-nowrap'>
                            {formatNumber(u.rcSearchCount)} / {formatNumber(u.rcSearchLimit)}
                          </td>
                          <td className='px-4 py-2.5 text-xs text-gray-700 text-right tabular-nums'>
                            {formatNumber(u.rcSearchRemaining)}
                          </td>
                          <td className='px-4 py-2.5 text-xs text-gray-700 whitespace-nowrap'>{formatDate(u.lastDate)}</td>
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
                          <td className='px-4 py-2.5 text-xs text-gray-700 whitespace-nowrap'>{formatMonth(m.month)}</td>
                          <td className='px-4 py-2.5 text-xs text-right tabular-nums whitespace-nowrap'>
                            <div className='text-gray-700'>{m.boughtAmount ? formatRupees(m.boughtAmount) : '-'}</div>
                            {m.boughtQty > 0 && <div className='text-gray-400'>{formatNumber(m.boughtQty)} calls</div>}
                          </td>
                          <td className='px-4 py-2.5 text-xs text-right tabular-nums whitespace-nowrap'>
                            <div className='text-gray-700'>{m.soldAmount ? formatRupees(m.soldAmount) : '-'}</div>
                            {m.soldQty > 0 && <div className='text-gray-400'>{formatNumber(m.soldQty)} calls</div>}
                          </td>
                          <td
                            className={`px-4 py-2.5 text-xs font-bold text-right tabular-nums whitespace-nowrap ${
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

      {/* Add purchase / sale */}
      {showModal && (
        <div className='fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto'>
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
