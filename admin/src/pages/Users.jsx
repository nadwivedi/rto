import { useState, useEffect, useCallback, useMemo } from 'react'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://api.rtosarthi.com'
const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL || 'https://app.rtosarthi.com'

// Confirmation code for deleting a user. This is a typo guard, not a security
// control - the DELETE endpoint is already behind admin auth.
const DELETE_PASSWORD = '123456'

// All dates are shown in India time regardless of the admin's device timezone.
// Without this the browser's own timezone is used (UTC on a server/VM), which
// shifts dates by a day for anything created after 05:30 IST.
const IST = 'Asia/Kolkata'

// Calendar day in IST as 'YYYY-MM-DD' (en-CA gives ISO-ordered parts)
const istDayKey = (date) => date.toLocaleDateString('en-CA', { timeZone: IST })

// Whole IST calendar days between two instants (b - a), ignoring time of day
const istDayDiff = (a, b) => {
  const toUTCDay = (d) => {
    const [y, m, day] = istDayKey(d).split('-').map(Number)
    return Date.UTC(y, m - 1, day)
  }
  return Math.round((toUTCDay(b) - toUTCDay(a)) / (1000 * 60 * 60 * 24))
}

const formatDateTime = (value) => {
  if (!value) return 'Never'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Never'
  return date.toLocaleString('en-IN', {
    timeZone: IST,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatDate = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleDateString('en-IN', { timeZone: IST, day: '2-digit', month: 'short', year: 'numeric' })
}

const formatTime = (value) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleTimeString('en-IN', { timeZone: IST, hour: '2-digit', minute: '2-digit' })
}

// 'YYYY-MM-DD' in IST, for prefilling <input type='date'>
const toDateInputValue = (value) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return istDayKey(date)
}

const getDaysAgo = (value) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const days = istDayDiff(date, new Date())
  if (days <= 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 30) return `${days}d ago`
  if (days < 365) return `${Math.floor(days / 30)}mo ago`
  return `${Math.floor(days / 365)}y ago`
}

const getDaysLeft = (expiryDate) => {
  if (!expiryDate) return null
  const date = new Date(expiryDate)
  if (Number.isNaN(date.getTime())) return null
  return istDayDiff(new Date(), date)
}

const INDIAN_STATES = [
  'Andaman and Nicobar Islands',
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chandigarh',
  'Chhattisgarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jammu and Kashmir',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Ladakh',
  'Lakshadweep',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Puducherry',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal'
]

const Users = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [stateFilter, setStateFilter] = useState('all')
  const [sortBy, setSortBy] = useState('default')
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 })
  const [stateCounts, setStateCounts] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingUserId, setEditingUserId] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    mobile1: '',
    mobile2: '',
    email: '',
    address: '',
    state: '',
    rto: '',
    billName: '',
    billDescription: '',
    planType: 'yearly',
    subscriptionExpiresAt: '',
    monthlyPrice: '',
    yearlyPrice: '',
    lifetimeFee: '',
    password: '',
    features_greenTax: false,
    features_professionalTax: false,
    features_autoCreateRC: false,
    features_expandAdditionalDetails: false,
    features_moneyReceived: false,
    features_rcDetails: false,
    features_forms: false,
    rcSearchLimit: 0,
    rcSearchCount: 0
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [copiedId, setCopiedId] = useState(null)
  const [accessingId, setAccessingId] = useState(null)
  const [togglingId, setTogglingId] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [deletingId, setDeletingId] = useState(null)

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (statusFilter !== 'all') params.append('isActive', statusFilter)
      if (stateFilter !== 'all') params.append('state', stateFilter)
      params.append('limit', '100')

      const response = await fetch(`${BACKEND_URL}/api/admin/users?${params}`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      })
      const data = await response.json()
      if (data.success) {
        setUsers(data.data)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter, stateFilter])

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/users/statistics`, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      })
      const data = await response.json()
      if (data.success) {
        setStats(data.data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }, [])

  const fetchStateCounts = useCallback(async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/users/state-counts`, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      })
      const data = await response.json()
      if (data.success) {
        setStateCounts(data.data)
      }
    } catch (error) {
      console.error('Error fetching state counts:', error)
    }
  }, [])

  useEffect(() => {
    fetchUsers()
    fetchStats()
    fetchStateCounts()
  }, [fetchUsers, fetchStats, fetchStateCounts])

  const sortedUsers = useMemo(() => {
    if (sortBy === 'default') return users
    const time = (u) => new Date(u.createdAt).getTime() || 0
    return [...users].sort((a, b) => sortBy === 'newest' ? time(b) - time(a) : time(a) - time(b))
  }, [users, sortBy])

  const copyToClipboard = (userId) => {
    navigator.clipboard.writeText(userId)
    setCopiedId(userId)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleChange = (e) => {
    const { name, type, value, checked } = e.target

    if (name === 'monthlyPrice') {
      const monthly = value === '' ? '' : Number(value)
      setFormData({
        ...formData,
        monthlyPrice: value,
        yearlyPrice: monthly === '' || Number.isNaN(monthly) ? '' : Number((monthly * 12).toFixed(2))
      })
      setError('')
      return
    }

    if (name === 'yearlyPrice') {
      const yearly = value === '' ? '' : Number(value)
      setFormData({
        ...formData,
        yearlyPrice: value,
        monthlyPrice: yearly === '' || Number.isNaN(yearly) ? '' : Number((yearly / 12).toFixed(2))
      })
      setError('')
      return
    }

    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    // Validation
    if (!formData.name || !formData.mobile1) {
      setError('Name and Mobile are required')
      return
    }

    if (!formData.state || !formData.rto) {
      setError('State and RTO are required')
      return
    }

    if (!isEditMode && !formData.password) {
      setError('Password is required for new users')
      return
    }

    try {
      const url = isEditMode
        ? `${BACKEND_URL}/api/admin/users/${editingUserId}`
        : `${BACKEND_URL}/api/admin/users`

      const method = isEditMode ? 'PUT' : 'POST'

      const bodyData = {
        ...formData,
        features: {
          greenTax: formData.features_greenTax,
          professionalTax: formData.features_professionalTax,
          autoCreateRC: formData.features_autoCreateRC,
          expandAdditionalDetails: formData.features_expandAdditionalDetails,
          moneyReceived: formData.features_moneyReceived,
          rcDetails: formData.features_rcDetails,
          forms: formData.features_forms
        }
      }
      delete bodyData.features_greenTax
      delete bodyData.features_professionalTax
      delete bodyData.features_autoCreateRC
      delete bodyData.features_expandAdditionalDetails
      delete bodyData.features_moneyReceived
      delete bodyData.features_rcDetails
      delete bodyData.features_forms
      bodyData.rcSearchLimit = formData.rcSearchLimit !== '' ? Number(formData.rcSearchLimit) : 0
      if (formData.planType === 'lifetime') {
        // Lifetime: one-time fee only, no expiry and no recurring price
        delete bodyData.subscriptionExpiresAt
        delete bodyData.monthlyPrice
        delete bodyData.yearlyPrice
      } else {
        delete bodyData.lifetimeFee
      }
      if (isEditMode && !formData.password) {
        delete bodyData.password
      }

      const response = await fetch(url, {
        method: method,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bodyData)
      })
      const data = await response.json()
      if (data.success) {
        setSuccess(isEditMode ? 'User updated successfully!' : 'User created successfully!')
        setShowModal(false)
        setIsEditMode(false)
        setEditingUserId(null)
        setFormData({ name: '', mobile1: '', mobile2: '', email: '', address: '', state: '', rto: '', billName: '', billDescription: '', planType: 'yearly', subscriptionExpiresAt: '', monthlyPrice: '', yearlyPrice: '', lifetimeFee: '', password: '', features_greenTax: false, features_professionalTax: false, features_autoCreateRC: false, features_expandAdditionalDetails: false, features_moneyReceived: false, features_rcDetails: false, features_forms: false, rcSearchLimit: 0, rcSearchCount: 0 })
    fetchUsers()
    fetchStateCounts()
      } else {
        setError(data.message || `Failed to ${isEditMode ? 'update' : 'create'} user`)
      }
    } catch (error) {
      setError(`Failed to ${isEditMode ? 'update' : 'create'} user`)
    }
  }

  const handleEdit = (user) => {
    setIsEditMode(true)
    setEditingUserId(user._id)
    setFormData({
      name: user.name,
      mobile1: user.mobile1 || '',
      mobile2: user.mobile2 || '',
      email: user.email || '',
      address: user.address || '',
      state: user.state || '',
      rto: user.rto || '',
      billName: user.billName || '',
      billDescription: user.billDescription || '',
      planType: user.planType === 'lifetime' ? 'lifetime' : 'yearly',
      subscriptionExpiresAt: toDateInputValue(user.subscriptionExpiresAt),
      monthlyPrice: user.monthlyPrice ?? '',
      yearlyPrice: user.yearlyPrice ?? '',
      lifetimeFee: user.lifetimeFee ?? '',
      password: '',
      features_greenTax: user.features?.greenTax ?? false,
      features_professionalTax: user.features?.professionalTax ?? false,
      features_autoCreateRC: user.features?.autoCreateRC ?? false,
      features_expandAdditionalDetails: user.features?.expandAdditionalDetails ?? false,
      features_moneyReceived: user.features?.moneyReceived ?? false,
      features_rcDetails: user.features?.rcDetails ?? false,
      features_forms: user.features?.forms ?? false,
      rcSearchLimit: user.rcSearchLimit ?? 0,
      rcSearchCount: user.rcSearchCount ?? 0
    })
    setShowModal(true)
    setError('')
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setIsEditMode(false)
    setEditingUserId(null)
    setError('')
    setFormData({ name: '', mobile1: '', mobile2: '', email: '', address: '', state: '', rto: '', billName: '', billDescription: '', planType: 'yearly', subscriptionExpiresAt: '', monthlyPrice: '', yearlyPrice: '', lifetimeFee: '', password: '', features_greenTax: false, features_professionalTax: false, features_autoCreateRC: false, features_expandAdditionalDetails: false, features_moneyReceived: false, features_rcDetails: false, features_forms: false, rcSearchLimit: 0, rcSearchCount: 0 })
  }

  const openDeleteModal = (user) => {
    setDeleteTarget(user)
    setDeletePassword('')
    setDeleteError('')
  }

  const closeDeleteModal = () => {
    setDeleteTarget(null)
    setDeletePassword('')
    setDeleteError('')
  }

  const handleDelete = async (e) => {
    e.preventDefault()
    if (!deleteTarget) return

    if (deletePassword !== DELETE_PASSWORD) {
      setDeleteError('Wrong password. Type 1 to 6 to delete this user.')
      return
    }

    try {
      setDeletingId(deleteTarget._id)
      setDeleteError('')
      setError('')
      setSuccess('')

      const response = await fetch(`${BACKEND_URL}/api/admin/users/${deleteTarget._id}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      const data = await response.json()
      if (data.success) {
        setSuccess(`User "${deleteTarget.name}" deleted successfully!`)
        closeDeleteModal()
        fetchUsers()
        fetchStats()
        fetchStateCounts()
      } else {
        setDeleteError(data.message || 'Failed to delete user')
      }
    } catch {
      setDeleteError('Failed to delete user')
    } finally {
      setDeletingId(null)
    }
  }

  const handleToggleActive = async (user) => {
    const newStatus = !user.isActive
    const action = newStatus ? 'activate' : 'deactivate'
    if (!confirm(`Are you sure you want to ${action} this user?\n\nUser: ${user.name}\nMobile: ${user.mobile1}`)) return

    try {
      setTogglingId(user._id)
      setError('')
      setSuccess('')

      const response = await fetch(`${BACKEND_URL}/api/admin/users/${user._id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: newStatus })
      })
      const data = await response.json()
      if (data.success) {
        setSuccess(`User ${action}d successfully!`)
        fetchUsers()
        fetchStats()
      } else {
        setError(data.message || `Failed to ${action} user`)
      }
    } catch (error) {
      setError(`Failed to ${action} user`)
    } finally {
      setTogglingId(null)
    }
  }

  const handleAccess = async (user) => {
    const accessWindow = window.open('', '_blank')

    if (!accessWindow) {
      setError('Please allow popups to open the user account in a new tab')
      return
    }

    try {
      setAccessingId(user._id)
      setError('')

      const response = await fetch(`${BACKEND_URL}/api/admin/users/${user._id}/access-token`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      const data = await response.json()

      if (!response.ok || !data.success || !data.data?.token) {
        accessWindow.close()
        setError(data.message || 'Failed to create user access token')
        return
      }

      accessWindow.location.href = `${FRONTEND_URL}/admin-access?token=${encodeURIComponent(data.data.token)}`
    } catch (error) {
      accessWindow.close()
      setError('Failed to open user account access')
    } finally {
      setAccessingId(null)
    }
  }

  const renderActions = (user) => (
    <div className='flex items-center justify-end gap-0.5'>
      <button
        onClick={() => handleToggleActive(user)}
        disabled={togglingId === user._id}
        className={`p-1.5 rounded-md transition-colors disabled:opacity-40 disabled:cursor-wait cursor-pointer ${
          user.isActive ? 'text-gray-400 hover:text-red-500 hover:bg-red-50' : 'text-gray-400 hover:text-emerald-600 hover:bg-emerald-50'
        }`}
        title={user.isActive ? 'Deactivate user' : 'Activate user'}
      >
        <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636' />
        </svg>
      </button>
      <button
        onClick={() => handleAccess(user)}
        disabled={accessingId === user._id}
        className='p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors disabled:opacity-40 disabled:cursor-wait cursor-pointer'
        title='Access as user'
      >
        <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14' />
        </svg>
      </button>
      <button
        onClick={() => handleEdit(user)}
        className='p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors cursor-pointer'
        title='Edit user'
      >
        <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' />
        </svg>
      </button>
      <button
        onClick={() => openDeleteModal(user)}
        disabled={deletingId === user._id}
        className='p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-40 disabled:cursor-wait cursor-pointer'
        title='Delete user'
      >
        <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' />
        </svg>
      </button>
    </div>
  )

  const isLifetime = (user) => user?.planType === 'lifetime'

  const renderPlanBadge = (user) => (
    isLifetime(user) ? (
      <span className='inline-flex items-center gap-1 px-1.5 py-0.5 mb-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-violet-50 text-violet-700 border border-violet-200'>
        ♾️ Lifetime
      </span>
    ) : (
      <span className='inline-flex items-center gap-1 px-1.5 py-0.5 mb-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-sky-50 text-sky-700 border border-sky-200'>
        Yearly
      </span>
    )
  )

  // Lifetime plans show their one-time fee; recurring plans show yearly/monthly
  const renderPlanPrice = (user, className) => {
    if (isLifetime(user)) {
      return user.lifetimeFee != null ? (
        <div className={className}>₹{user.lifetimeFee} one-time</div>
      ) : null
    }
    return user.yearlyPrice != null ? (
      <div className={className}>
        ₹{user.yearlyPrice}/yr
        {user.monthlyPrice != null && <span> · ₹{user.monthlyPrice}/mo</span>}
      </div>
    ) : null
  }

  const renderRcBadge = (user) => {
    if (!user.features?.rcDetails) return null
    const left = Math.max(0, (user.rcSearchLimit || 0) - (user.rcSearchCount || 0))
    return (
      <span
        className={`inline-block mt-1 text-[10px] font-semibold px-1.5 py-0.5 rounded ${
          left <= 0 ? 'bg-rose-50 text-rose-700' : 'bg-indigo-50 text-indigo-700'
        }`}
        title={`${user.rcSearchCount || 0} searches done`}
      >
        RC {left}/{user.rcSearchLimit || 0} left
      </span>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6'>
        <div>
          <h1 className='text-2xl sm:text-3xl font-bold text-gray-800'>Manage Users</h1>
          <p className='text-sm sm:text-base text-gray-600 mt-1'>Create and manage user accounts</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className='px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-semibold flex items-center justify-center gap-2 text-sm shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transition-all cursor-pointer'
        >
          <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 4v16m8-8H4' />
          </svg>
          <span>Create New User</span>
        </button>
      </div>

      {/* Stats Bar */}
      <div className='grid grid-cols-3 gap-3 mb-5'>
        <div className='bg-white rounded-xl p-4 shadow-sm border border-gray-100'>
          <p className='text-xs text-gray-500 font-semibold uppercase tracking-wide'>Total</p>
          <p className='text-2xl font-bold text-gray-800 mt-1'>{stats.total}</p>
        </div>
        <div className='bg-white rounded-xl p-4 shadow-sm border border-green-100'>
          <p className='text-xs text-green-600 font-semibold uppercase tracking-wide'>Active</p>
          <p className='text-2xl font-bold text-green-600 mt-1'>{stats.active}</p>
        </div>
        <div className='bg-white rounded-xl p-4 shadow-sm border border-red-100'>
          <p className='text-xs text-red-500 font-semibold uppercase tracking-wide'>Inactive</p>
          <p className='text-2xl font-bold text-red-500 mt-1'>{stats.inactive}</p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className='bg-white rounded-xl shadow-sm border border-gray-100 p-3 mb-5'>
        <div className='flex flex-col sm:flex-row gap-3'>
          <div className='relative flex-1'>
            <svg className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' />
            </svg>
            <input
              type='text'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder='Search by name, mobile or email...'
              className='w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50'
            />
          </div>
          <div className='flex gap-2'>
            {['all', 'true', 'false'].map((val) => (
              <button
                key={val}
                onClick={() => setStatusFilter(val)}
                className={`px-3 py-2 text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                  statusFilter === val
                    ? val === 'all' ? 'bg-gray-800 text-white shadow-sm'
                      : val === 'true' ? 'bg-green-600 text-white shadow-sm'
                      : 'bg-red-500 text-white shadow-sm'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {val === 'all' ? 'All' : val === 'true' ? 'Active' : 'Inactive'}
              </button>
            ))}
          </div>
          <select
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            className='px-3 py-2 text-sm font-semibold rounded-lg border border-gray-200 bg-gray-50 text-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer'
          >
            <option value='all'>All States</option>
            {stateCounts.map(({ state, count }) => (
              <option key={state} value={state}>{`${state}  (${count})`}</option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className='px-3 py-2 text-sm font-semibold rounded-lg border border-gray-200 bg-gray-50 text-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer'
          >
            <option value='default'>Sort: Default</option>
            <option value='newest'>Joined: Newest first</option>
            <option value='oldest'>Joined: Oldest first</option>
          </select>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className='mb-5 p-4 bg-green-50 border border-green-200 rounded-xl text-green-800 text-sm font-medium flex items-center gap-2'>
          <svg className='w-5 h-5 flex-shrink-0' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' />
          </svg>
          {success}
        </div>
      )}
      {error && !showModal && (
        <div className='mb-5 p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm font-medium flex items-center gap-2'>
          <svg className='w-5 h-5 flex-shrink-0' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
          </svg>
          {error}
        </div>
      )}

      {/* Users Table/Cards */}
      <div className='bg-white rounded-xl shadow-sm border border-gray-100'>
        {loading ? (
          <div className='p-8 space-y-4'>
            {[1,2,3,4,5].map((i) => (
              <div key={i} className='animate-pulse flex gap-4'>
                <div className='h-4 bg-gray-200 rounded w-1/4'></div>
                <div className='h-4 bg-gray-200 rounded w-1/5'></div>
                <div className='h-4 bg-gray-200 rounded w-1/6'></div>
                <div className='h-4 bg-gray-200 rounded w-1/6'></div>
              </div>
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className='p-12 text-center'>
            <svg className='w-12 h-12 mx-auto text-gray-300 mb-3' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1.5} d='M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' />
            </svg>
            <p className='text-gray-500 font-medium'>No users found</p>
            <p className='text-gray-400 text-sm mt-1'>Try adjusting your search or create a new user</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className='hidden md:block overflow-x-auto'>
              <table className='w-full'>
                <thead>
                  <tr className='border-b border-gray-100 bg-gray-50/60'>
                    <th className='px-4 py-2.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider'>User</th>
                    <th className='px-4 py-2.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider'>Location</th>
                    <th className='px-4 py-2.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider'>Subscription</th>
                    <th className='px-4 py-2.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider'>Joined</th>
                    <th className='px-4 py-2.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider'>Last Active</th>
                    <th className='px-4 py-2.5 text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wider'>Actions</th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-gray-100'>
                  {sortedUsers.map((user) => {
                    const days = getDaysLeft(user.subscriptionExpiresAt)
                    return (
                      <tr key={user._id} className='hover:bg-gray-50/80 transition-colors align-top'>
                        <td className='px-4 py-3'>
                          <div className='flex items-start gap-2.5 min-w-0'>
                            <div className='relative flex-shrink-0'>
                              <div className='w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold'>
                                {user.name.charAt(0).toUpperCase()}
                              </div>
                              <span
                                className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-white ${user.isActive ? 'bg-green-500' : 'bg-red-500'}`}
                                title={user.isActive ? 'Active' : 'Inactive'}
                              ></span>
                            </div>
                            <div className='min-w-0'>
                              <div className='flex items-center gap-1.5'>
                                <span className='text-[13px] font-semibold text-gray-900 truncate max-w-[180px]' title={user.name}>{user.name}</span>
                                {!user.isActive && (
                                  <span className='text-[9px] font-bold uppercase text-red-600 bg-red-50 px-1 rounded'>Inactive</span>
                                )}
                              </div>
                              <div className='text-xs text-gray-600 mt-0.5'>
                                {user.mobile1}
                                {user.mobile2 && <span className='text-gray-400'> · {user.mobile2}</span>}
                              </div>
                              {user.email && (
                                <div className='text-xs text-gray-400 truncate max-w-[220px]' title={user.email}>{user.email}</div>
                              )}
                              <button
                                onClick={() => copyToClipboard(user._id)}
                                className='group flex items-center gap-1 mt-0.5 cursor-pointer'
                                title='Copy user ID'
                              >
                                <span className='text-[10px] text-gray-300 font-mono group-hover:text-indigo-600 transition-colors'>
                                  #{user._id.slice(-8)}
                                </span>
                                {copiedId === user._id && (
                                  <svg className='w-3 h-3 text-green-500' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
                                  </svg>
                                )}
                              </button>
                            </div>
                          </div>
                        </td>
                        <td className='px-4 py-3'>
                          <div className='text-xs text-gray-700'>{user.state || '-'}</div>
                          <div className='text-[11px] text-gray-400'>{user.rto || '-'}</div>
                          {renderRcBadge(user)}
                        </td>
                        <td className='px-4 py-3'>
                          {renderPlanBadge(user)}
                          {isLifetime(user) ? (
                            <div className='text-[11px] text-violet-600 font-semibold'>Never expires</div>
                          ) : (
                            <>
                              <div className='text-xs text-gray-700'>{formatDate(user.subscriptionExpiresAt)}</div>
                              {days !== null && (
                                <div className={`text-[11px] font-semibold ${
                                  days <= 0 ? 'text-red-600' : days <= 7 ? 'text-orange-500' : 'text-emerald-600'
                                }`}>
                                  {days <= 0 ? 'Expired' : `${days} days left`}
                                </div>
                              )}
                            </>
                          )}
                          {renderPlanPrice(user, 'text-[11px] text-gray-400')}
                        </td>
                        <td className='px-4 py-3 whitespace-nowrap'>
                          <div className='text-xs text-gray-700'>{formatDate(user.createdAt)}</div>
                          <div className='text-[11px] text-gray-400'>
                            {formatTime(user.createdAt)}
                            {user.createdAt && <span> · {getDaysAgo(user.createdAt)}</span>}
                          </div>
                        </td>
                        <td className='px-4 py-3 whitespace-nowrap'>
                          <div className='text-[11px] leading-5'>
                            <span className='text-gray-400'>Login </span>
                            <span className={user.lastLogin ? 'text-gray-700' : 'text-gray-300'}>{formatDateTime(user.lastLogin)}</span>
                          </div>
                          <div className='text-[11px] leading-5'>
                            <span className='text-gray-400'>Activity </span>
                            <span className={user.lastActivity ? 'text-gray-700' : 'text-gray-300'}>{formatDateTime(user.lastActivity)}</span>
                          </div>
                        </td>
                        <td className='px-4 py-3'>
                          {renderActions(user)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className='md:hidden divide-y divide-gray-100'>
              {sortedUsers.map((user) => {
                const days = getDaysLeft(user.subscriptionExpiresAt)
                return (
                  <div key={user._id} className='p-3.5'>
                    <div className='flex items-start gap-2.5'>
                      <div className='relative flex-shrink-0'>
                        <div className='w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold'>
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-white ${user.isActive ? 'bg-green-500' : 'bg-red-500'}`}></span>
                      </div>
                      <div className='min-w-0 flex-1'>
                        <div className='flex items-center gap-1.5'>
                          <span className='text-[13px] font-semibold text-gray-900 truncate'>{user.name}</span>
                          {!user.isActive && (
                            <span className='text-[9px] font-bold uppercase text-red-600 bg-red-50 px-1 rounded'>Inactive</span>
                          )}
                        </div>
                        <div className='text-xs text-gray-600'>
                          {user.mobile1}
                          {user.mobile2 && <span className='text-gray-400'> · {user.mobile2}</span>}
                        </div>
                        {user.email && <div className='text-xs text-gray-400 truncate'>{user.email}</div>}
                      </div>
                      {renderActions(user)}
                    </div>

                    <div className='grid grid-cols-2 gap-x-3 gap-y-2 mt-3 text-[11px]'>
                      <div>
                        <div className='text-gray-400'>Location</div>
                        <div className='text-gray-700'>{user.state || '-'}{user.rto && <span className='text-gray-400'> · {user.rto}</span>}</div>
                        {renderRcBadge(user)}
                      </div>
                      <div>
                        <div className='text-gray-400'>Joined</div>
                        <div className='text-gray-700'>{formatDate(user.createdAt)} <span className='text-gray-400'>{formatTime(user.createdAt)}</span></div>
                      </div>
                      <div>
                        <div className='text-gray-400'>Subscription</div>
                        {renderPlanBadge(user)}
                        {isLifetime(user) ? (
                          <div className='text-violet-600 font-semibold'>Never expires</div>
                        ) : (
                          <div className='text-gray-700'>
                            {formatDate(user.subscriptionExpiresAt)}
                            {days !== null && (
                              <span className={`ml-1 font-semibold ${days <= 0 ? 'text-red-600' : days <= 7 ? 'text-orange-500' : 'text-emerald-600'}`}>
                                {days <= 0 ? 'Expired' : `${days}d`}
                              </span>
                            )}
                          </div>
                        )}
                        {renderPlanPrice(user, 'text-gray-400')}
                      </div>
                      <div>
                        <div className='text-gray-400'>Last Active</div>
                        <div className='text-gray-700'>{formatDateTime(user.lastActivity || user.lastLogin)}</div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* Delete User Confirmation */}
      {deleteTarget && (
        <div className='fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto'>
          <div className='flex items-start justify-center min-h-full px-3 py-8 sm:py-16'>
            <div className='bg-white rounded-lg shadow-xl max-w-md w-full p-5'>
              <div className='flex items-start gap-3'>
                <div className='w-10 h-10 shrink-0 rounded-full bg-red-100 text-red-600 flex items-center justify-center'>
                  <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' />
                  </svg>
                </div>
                <div className='min-w-0'>
                  <h2 className='text-lg font-bold text-gray-800'>Delete this user?</h2>
                  <p className='text-xs text-gray-500 mt-0.5'>
                    This permanently removes the account and cannot be undone.
                  </p>
                </div>
              </div>

              {/* Who is being deleted */}
              <div className='mt-4 p-3 rounded-lg bg-gray-50 border border-gray-200'>
                <div className='text-sm font-semibold text-gray-900 break-words'>
                  {deleteTarget.name}
                </div>
                <div className='text-xs text-gray-600 mt-0.5'>
                  {deleteTarget.mobile1}
                  {deleteTarget.state && <span className='text-gray-400'> · {deleteTarget.state}</span>}
                  {deleteTarget.rto && <span className='text-gray-400'> · {deleteTarget.rto}</span>}
                </div>
                {deleteTarget.email && (
                  <div className='text-xs text-gray-400 break-words'>{deleteTarget.email}</div>
                )}
              </div>

              <form onSubmit={handleDelete} className='mt-4'>
                <label className='block text-xs sm:text-sm font-semibold text-gray-700 mb-1'>
                  Enter password to confirm
                </label>
                <input
                  type='password'
                  value={deletePassword}
                  onChange={(e) => {
                    setDeletePassword(e.target.value)
                    setDeleteError('')
                  }}
                  autoFocus
                  autoComplete='off'
                  placeholder='Password'
                  className='w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent'
                />
                <p className='text-[11px] text-gray-500 mt-1'>
                  Type <strong>1 to 6</strong> to delete this user.
                </p>

                {deleteError && (
                  <div className='mt-3 p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700'>
                    {deleteError}
                  </div>
                )}

                <div className='flex gap-2 mt-5'>
                  <button
                    type='button'
                    onClick={closeDeleteModal}
                    className='flex-1 px-4 py-2 text-sm font-semibold rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer'
                  >
                    Cancel
                  </button>
                  <button
                    type='submit'
                    disabled={deletingId === deleteTarget._id}
                    className='flex-1 px-4 py-2 text-sm font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-wait cursor-pointer'
                  >
                    {deletingId === deleteTarget._id ? 'Deleting...' : 'Delete User'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showModal && (
        <div className='fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto'>
          <div className='flex items-start justify-center min-h-full px-2 sm:px-4 py-4 sm:py-8'>
          <div className='bg-white rounded-lg shadow-xl max-w-xl sm:max-w-2xl w-full p-4 sm:p-6'>
            <div className='flex justify-between items-center mb-3 sm:mb-4'>
              <h2 className='text-lg sm:text-xl font-bold text-gray-800'>
                {isEditMode ? 'Edit User' : 'Create New User'}
              </h2>
              <button
                onClick={handleCloseModal}
                className='text-gray-500 hover:text-gray-700 p-1 cursor-pointer'
              >
                <svg className='w-5 h-5 sm:w-6 sm:h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                </svg>
              </button>
            </div>

            {error && (
              <div className='mb-3 sm:mb-4 p-2.5 sm:p-3 bg-red-50 border border-red-200 rounded text-xs sm:text-sm text-red-800'>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className='space-y-3'>
              <div>
                <label className='block text-xs sm:text-sm font-semibold text-gray-700 mb-1'>
                  Name <span className='text-red-500'>*</span>
                </label>
                <input
                  type='text'
                  name='name'
                  value={formData.name}
                  onChange={handleChange}
                  placeholder='Enter full name'
                  className='w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
                  required
                />
              </div>

              <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                <div>
                  <label className='block text-xs sm:text-sm font-semibold text-gray-700 mb-1'>
                    Mobile <span className='text-red-500'>*</span>
                  </label>
                  <input
                    type='text'
                    name='mobile1'
                    value={formData.mobile1}
                    onChange={handleChange}
                    placeholder='10-digit mobile number'
                    maxLength={10}
                    className='w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
                    required
                  />
                </div>
                <div>
                  <label className='block text-xs sm:text-sm font-semibold text-gray-700 mb-1'>
                    Mobile 2 <span className='text-gray-400'>(Opt)</span>
                  </label>
                  <input
                    type='text'
                    name='mobile2'
                    value={formData.mobile2}
                    onChange={handleChange}
                    placeholder='10-digit mobile number'
                    maxLength={10}
                    className='w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
                  />
                </div>
              </div>

              <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                <div>
                  <label className='block text-xs sm:text-sm font-semibold text-gray-700 mb-1'>
                    Email <span className='text-gray-400'>(Opt)</span>
                  </label>
                  <input
                    type='email'
                    name='email'
                    value={formData.email}
                    onChange={handleChange}
                    placeholder='email@example.com'
                    className='w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
                  />
                </div>
                <div>
                  <label className='block text-xs sm:text-sm font-semibold text-gray-700 mb-1'>
                    State <span className='text-red-500'>*</span>
                  </label>
                  <select
                    name='state'
                    value={formData.state}
                    onChange={handleChange}
                    className='w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent uppercase'
                    required
                  >
                    <option value=''>Select State</option>
                    {INDIAN_STATES.map((state) => (
                      <option key={state} value={state.toUpperCase()}>
                        {state.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                <div className='sm:col-span-2'>
                  <label className='block text-xs sm:text-sm font-semibold text-gray-700 mb-1'>
                    Address <span className='text-gray-400'>(Opt)</span>
                  </label>
                  <textarea
                    name='address'
                    value={formData.address}
                    onChange={handleChange}
                    placeholder='Enter full address'
                    rows={2}
                    className='w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none'
                  />
                </div>
                <div>
                  <label className='block text-xs sm:text-sm font-semibold text-gray-700 mb-1'>
                    RTO <span className='text-red-500'>*</span>
                  </label>
                  <input
                    type='text'
                    name='rto'
                    value={formData.rto}
                    onChange={handleChange}
                    placeholder='RTO code'
                    className='w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent uppercase'
                    required
                  />
                </div>
                <div>
                  <label className='block text-xs sm:text-sm font-semibold text-gray-700 mb-1'>
                    Password {isEditMode ? <span className='text-gray-400'>(Opt)</span> : <span className='text-red-500'>*</span>}
                  </label>
                  <input
                    type='password'
                    name='password'
                    value={formData.password}
                    onChange={handleChange}
                    placeholder={isEditMode ? 'Leave blank to keep' : 'Min 4 chars'}
                    className='w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
                    required={!isEditMode}
                    minLength={4}
                  />
                </div>
              </div>

              <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                <div>
                  <label className='block text-xs sm:text-sm font-semibold text-gray-700 mb-1'>
                    Bill Name <span className='text-gray-400'>(Opt)</span>
                  </label>
                  <input
                    type='text'
                    name='billName'
                    value={formData.billName}
                    onChange={handleChange}
                    placeholder='Name on bills'
                    className='w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
                  />
                </div>
                <div>
                  <label className='block text-xs sm:text-sm font-semibold text-gray-700 mb-1'>
                    Bill Description <span className='text-gray-400'>(Opt)</span>
                  </label>
                  <input
                    type='text'
                    name='billDescription'
                    value={formData.billDescription}
                    onChange={handleChange}
                    placeholder='e.g. Transport Consultant'
                    className='w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
                  />
                </div>
              </div>

              <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                <div>
                  <label className='block text-xs sm:text-sm font-semibold text-gray-700 mb-1'>
                    Plan Type
                  </label>
                  <select
                    name='planType'
                    value={formData.planType}
                    onChange={handleChange}
                    className='w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer'
                  >
                    <option value='yearly'>Yearly</option>
                    <option value='lifetime'>Lifetime</option>
                  </select>
                </div>
                <div>
                  {formData.planType === 'lifetime' ? (
                    <>
                      <label className='block text-xs sm:text-sm font-semibold text-gray-700 mb-1'>
                        Subscription Expires
                      </label>
                      <div className='w-full px-3 py-2 text-sm rounded-lg bg-violet-50 border border-violet-200 text-violet-700 font-semibold'>
                        ♾️ Lifetime plan — never expires
                      </div>
                    </>
                  ) : (
                    <>
                      <label className='block text-xs sm:text-sm font-semibold text-gray-700 mb-1'>
                        Subscription Expires <span className='text-gray-400'>(Opt)</span>
                      </label>
                      <input
                        type='date'
                        name='subscriptionExpiresAt'
                        value={formData.subscriptionExpiresAt}
                        onChange={handleChange}
                        className='w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
                      />
                    </>
                  )}
                </div>
              </div>

              {formData.planType === 'lifetime' ? (
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                  <div>
                    <label className='block text-xs sm:text-sm font-semibold text-gray-700 mb-1'>
                      Lifetime Fee (₹)
                    </label>
                    <input
                      type='number'
                      name='lifetimeFee'
                      value={formData.lifetimeFee}
                      onChange={handleChange}
                      placeholder='0'
                      min='0'
                      step='0.01'
                      className='w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
                    />
                    <p className='text-[11px] text-gray-400 mt-1'>
                      One-time charge. Monthly and yearly price are not used for lifetime plans.
                    </p>
                  </div>
                </div>
              ) : (
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                <div>
                  <label className='block text-xs sm:text-sm font-semibold text-gray-700 mb-1'>
                    Monthly Price (₹) <span className='text-gray-400'>(Opt)</span>
                  </label>
                  <input
                    type='number'
                    name='monthlyPrice'
                    value={formData.monthlyPrice}
                    onChange={handleChange}
                    placeholder='0'
                    min='0'
                    step='0.01'
                    className='w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
                  />
                </div>
                <div>
                  <label className='block text-xs sm:text-sm font-semibold text-gray-700 mb-1'>
                    Yearly Price (₹) <span className='text-gray-400'>(Opt)</span>
                  </label>
                  <input
                    type='number'
                    name='yearlyPrice'
                    value={formData.yearlyPrice}
                    onChange={handleChange}
                    placeholder='0'
                    min='0'
                    step='0.01'
                    className='w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
                  />
                  <p className='text-[11px] text-gray-400 mt-1'>Auto-calculated from monthly price (× 12) — editable, updates monthly price too.</p>
                </div>
              </div>
              )}

              <div className='border-t border-gray-200 pt-3'>
                <label className='block text-xs sm:text-sm font-semibold text-gray-700 mb-2'>
                  Feature Access
                </label>
                <div className='flex flex-wrap gap-4 sm:gap-6'>
                  <label className='flex items-center gap-2 text-sm text-gray-700 cursor-pointer'>
                    <input
                      type='checkbox'
                      name='features_greenTax'
                      checked={formData.features_greenTax}
                      onChange={handleChange}
                      className='w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500'
                    />
                    Green Tax
                  </label>
                  <label className='flex items-center gap-2 text-sm text-gray-700 cursor-pointer'>
                    <input
                      type='checkbox'
                      name='features_professionalTax'
                      checked={formData.features_professionalTax}
                      onChange={handleChange}
                      className='w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500'
                    />
                    Professional Tax
                  </label>
                  <label className='flex items-center gap-2 text-sm text-gray-700 cursor-pointer'>
                    <input
                      type='checkbox'
                      name='features_autoCreateRC'
                      checked={formData.features_autoCreateRC}
                      onChange={handleChange}
                      className='w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500'
                    />
                    Auto Create RC
                  </label>
                  <label className='flex items-center gap-2 text-sm text-gray-700 cursor-pointer'>
                    <input
                      type='checkbox'
                      name='features_expandAdditionalDetails'
                      checked={formData.features_expandAdditionalDetails}
                      onChange={handleChange}
                      className='w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500'
                    />
                    Expand Details
                  </label>
                  <label className='flex items-center gap-2 text-sm text-gray-700 cursor-pointer'>
                    <input
                      type='checkbox'
                      name='features_moneyReceived'
                      checked={formData.features_moneyReceived}
                      onChange={handleChange}
                      className='w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500'
                    />
                    Money Received
                  </label>
                  <label className='flex items-center gap-2 text-sm text-gray-700 cursor-pointer'>
                    <input
                      type='checkbox'
                      name='features_rcDetails'
                      checked={formData.features_rcDetails}
                      onChange={handleChange}
                      className='w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500'
                    />
                    RC Details
                  </label>
                  <label className='flex items-center gap-2 text-sm text-gray-700 cursor-pointer'>
                    <input
                      type='checkbox'
                      name='features_forms'
                      checked={formData.features_forms}
                      onChange={handleChange}
                      className='w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500'
                    />
                    Forms
                  </label>
                </div>

                {formData.features_rcDetails && (
                  <div className='mt-3 p-3.5 bg-indigo-50/80 rounded-xl border border-indigo-100 space-y-3'>
                    <div>
                      <label className='block text-xs sm:text-sm font-bold text-indigo-950 mb-1'>
                        RC Search Limit (Allotted API Searches)
                      </label>
                      <input
                        type='number'
                        name='rcSearchLimit'
                        value={formData.rcSearchLimit}
                        onChange={handleChange}
                        placeholder='e.g. 10'
                        min='0'
                        className='w-full px-3 py-2 text-sm bg-white border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
                      />
                      <p className='text-[11px] text-indigo-600 mt-1'>
                        Total vehicle search quota allotted to this user. E.g. set 10 to allow 10 searches.
                      </p>
                    </div>

                    {isEditMode && (
                      <div className='p-3 bg-white rounded-lg border border-indigo-100 flex flex-wrap items-center justify-between gap-2 shadow-xs'>
                        <div className='flex items-center gap-2'>
                          <span className='w-2 h-2 rounded-full bg-indigo-600'></span>
                          <span className='text-xs font-semibold text-gray-700'>
                            Total Lifetime Searches:
                          </span>
                          <span className='text-xs font-bold text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 font-mono'>
                            {formData.rcSearchCount || 0}
                          </span>
                        </div>
                        <div className='flex items-center gap-2'>
                          <span className='text-xs font-semibold text-gray-700'>
                            Remaining Limits:
                          </span>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded border font-mono ${
                            (formData.rcSearchLimit - formData.rcSearchCount) <= 0
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          }`}>
                            {Math.max(0, (formData.rcSearchLimit || 0) - (formData.rcSearchCount || 0))} Left
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className='flex gap-2 sm:gap-3 pt-2'>
                <button
                  type='button'
                  onClick={handleCloseModal}
                  className='flex-1 px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 cursor-pointer'
                >
                  Cancel
                </button>
                <button
                  type='submit'
                  className='flex-1 px-3 sm:px-4 py-2 text-sm sm:text-base bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold cursor-pointer'
                >
                  {isEditMode ? 'Update User' : 'Create User'}
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

export default Users
