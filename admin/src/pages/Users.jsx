import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { SlidersHorizontal, X } from 'lucide-react'
import RcApiUsageCard from '../components/RcApiUsageCard'
import SearchSelect from '../components/SearchSelect'
import { PROVIDER_OPTIONS, providerLabel } from '../components/apiProviders'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://api.rtosarthi.com'
const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL || 'https://app.rtosarthi.com'

// Confirmation code for deleting a user. This is a typo guard, not a security
// control - the DELETE endpoint is already behind admin auth.
const DELETE_PASSWORD = '123456'

const SORT_LABELS = {
  default: 'Default order',
  newest: 'Joined: Newest first',
  oldest: 'Joined: Oldest first'
}

const FilterChip = ({ label, onRemove }) => (
  <span className='inline-flex items-center gap-1 rounded-full bg-indigo-50 py-0.5 pl-2.5 pr-1 text-xs font-semibold text-indigo-700'>
    {label}
    <button type='button' onClick={onRemove} className='rounded-full p-0.5 hover:bg-indigo-100 cursor-pointer' aria-label={`Remove ${label}`}>
      <X className='w-3 h-3' />
    </button>
  </span>
)

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

// 12500 -> '12,500'
const formatMoney = (n) => Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })

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

// Feature checkboxes in the Add / Edit User popup (name = formData key)
const FEATURE_OPTIONS = [
  { name: 'features_greenTax', label: 'Green Tax' },
  { name: 'features_professionalTax', label: 'Professional Tax' },
  { name: 'features_autoCreateRC', label: 'Auto Create RC' },
  { name: 'features_expandAdditionalDetails', label: 'Expand Details' },
  { name: 'features_moneyReceived', label: 'Money Received' },
  { name: 'features_rcDetails', label: 'RC Details' },
  { name: 'features_forms', label: 'Forms' },
  { name: 'features_form23', label: 'Form 23 (RC)', title: 'Show Form 23 (Certificate of Registration) in RC Details' },
  { name: 'features_tempRc', label: 'Temporary RC', title: 'Show Temporary Authorization of Registration Certificate in RC Details' },
  { name: 'features_nlParticular', label: 'NL Particulars', title: 'Show NL Vehicle Particulars (For Internal Use) in RC Details' },
  { name: 'features_saveVehicleRecords', label: 'Save Records (RC)', title: 'Show a Save button in RC Details that adds the vehicle to Vehicle Registration, Fitness, Insurance and PUC with 0 fee' }
]

const INPUT_CLASS = 'w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
const LABEL_CLASS = 'block text-xs md:text-sm font-semibold text-gray-700 mb-1'

// Numbered, tinted card used for each section of the user popup
const FormSection = ({ step, title, color, children }) => {
  const tones = {
    indigo: 'from-blue-50 to-indigo-50 border-indigo-200',
    emerald: 'from-green-50 to-emerald-50 border-emerald-200',
    amber: 'from-amber-50 to-yellow-50 border-amber-200',
    purple: 'from-purple-50 to-pink-50 border-purple-200',
    sky: 'from-sky-50 to-cyan-50 border-sky-200'
  }
  const dots = { indigo: 'bg-indigo-600', emerald: 'bg-emerald-600', amber: 'bg-amber-500', purple: 'bg-purple-600', sky: 'bg-sky-600' }
  return (
    <div className={`bg-gradient-to-r border-2 rounded-xl p-3 md:p-5 ${tones[color]}`}>
      <h3 className='text-sm md:text-base font-bold text-gray-800 mb-3 flex items-center gap-2'>
        <span className={`${dots[color]} text-white w-6 h-6 md:w-7 md:h-7 rounded-full flex items-center justify-center text-xs`}>{step}</span>
        {title}
      </h3>
      {children}
    </div>
  )
}

const Users = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [stateFilter, setStateFilter] = useState('all')
  const [sortBy, setSortBy] = useState('default')
  // Phone filter popup works on a draft; Apply copies it to the real filters
  const [showFilters, setShowFilters] = useState(false)
  const [draftFilters, setDraftFilters] = useState({ status: 'all', state: 'all', sort: 'default' })
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 })
  const [stateCounts, setStateCounts] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingUserId, setEditingUserId] = useState(null)
  const [uploadingScreenshot, setUploadingScreenshot] = useState(false)
  const [draggingScreenshot, setDraggingScreenshot] = useState(false)
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
    yearlyPrice: '',
    lifetimeFee: '',
    paidAmount: '',
    paymentScreenshots: [],
    password: '',
    features_greenTax: false,
    features_professionalTax: false,
    features_autoCreateRC: false,
    features_expandAdditionalDetails: false,
    features_moneyReceived: false,
    features_rcDetails: false,
    features_forms: false,
    features_form23: false,
    features_tempRc: false,
    features_nlParticular: false,
    features_saveVehicleRecords: false,
    rcProvider: 'api2',
    rcSearchLimit: 0,
    rcSearchCount: 0
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [switchingAllRc, setSwitchingAllRc] = useState(false)
  const [copiedId, setCopiedId] = useState(null)
  const [accessingId, setAccessingId] = useState(null)
  const navigate = useNavigate()
  const [togglingId, setTogglingId] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [deletingId, setDeletingId] = useState(null)
  const [cleanTarget, setCleanTarget] = useState(null)
  const [cleanConfirm, setCleanConfirm] = useState('')
  const [cleanError, setCleanError] = useState('')
  const [cleaningId, setCleaningId] = useState(null)

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

  // Point every user's RC searches at one API, e.g. all to API 1 while API 2 is down
  const switchAllRcProvider = async (provider) => {
    if (!confirm(`Switch RC Details of ALL users to ${providerLabel(provider)}? Every app user's searches will go to ${providerLabel(provider)} until you change it.`)) return
    try {
      setSwitchingAllRc(true)
      setError('')
      setSuccess('')
      const response = await fetch(`${BACKEND_URL}/api/admin/users/rc-provider-all`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider })
      })
      const data = await response.json()
      if (!data.success) return setError(data.message || 'Failed to switch users')
      setSuccess(data.message)
      fetchStats()
      fetchUsers()
    } catch {
      setError('Failed to switch users')
    } finally {
      setSwitchingAllRc(false)
    }
  }

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

  const activeFilterCount = [statusFilter !== 'all', stateFilter !== 'all', sortBy !== 'default'].filter(Boolean).length

  const openFilters = () => {
    setDraftFilters({ status: statusFilter, state: stateFilter, sort: sortBy })
    setShowFilters(true)
  }

  const applyFilters = () => {
    setStatusFilter(draftFilters.status)
    setStateFilter(draftFilters.state)
    setSortBy(draftFilters.sort)
    setShowFilters(false)
  }

  const copyToClipboard = (userId) => {
    navigator.clipboard.writeText(userId)
    setCopiedId(userId)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // Upload each picked / dropped file, then keep its path on the form (saved with the user)
  const handleScreenshotUpload = (e) => {
    const files = Array.from(e.target.files || [])
    e.target.value = ''
    uploadScreenshots(files)
  }

  const uploadScreenshots = async (files) => {
    if (!files.length) return
    setUploadingScreenshot(true)
    setError('')
    try {
      for (const file of files) {
        if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
          setError(`${file.name}: only images or PDF can be attached`)
          continue
        }
        if (file.size > 8 * 1024 * 1024) {
          setError(`${file.name}: file must be smaller than 8MB`)
          continue
        }
        const imageData = await new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result)
          reader.onerror = reject
          reader.readAsDataURL(file)
        })
        const response = await fetch(`${BACKEND_URL}/api/admin/users/payment-screenshot`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageData })
        })
        const data = await response.json()
        if (data.success) {
          setFormData((prev) => ({ ...prev, paymentScreenshots: [...(prev.paymentScreenshots || []), data.data.path] }))
        } else {
          setError(data.message || `Failed to upload ${file.name}`)
        }
      }
    } catch (err) {
      setError('Failed to upload payment screenshot')
    } finally {
      setUploadingScreenshot(false)
    }
  }

  const removeScreenshot = (path) => {
    setFormData((prev) => ({ ...prev, paymentScreenshots: (prev.paymentScreenshots || []).filter((p) => p !== path) }))
  }

  const handleChange = (e) => {
    const { name, type, value, checked } = e.target
    const next = {
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    }

    // New user: Paid defaults to the full fee and follows it while the fee is edited,
    // unless the admin has typed a different paid amount
    if (!isEditMode && ['yearlyPrice', 'lifetimeFee', 'planType'].includes(name)) {
      const oldFee = planFeeOf(formData)
      if (formData.paidAmount === '' || Number(formData.paidAmount) === oldFee) {
        const newFee = planFeeOf(next)
        next.paidAmount = newFee ? String(newFee) : ''
      }
    }

    setFormData(next)
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

    if (formData.paidAmount !== '' && Number(formData.paidAmount) < 0) {
      setError('Paid amount must be 0 or more')
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
          forms: formData.features_forms,
          form23: formData.features_form23,
          tempRc: formData.features_tempRc,
          nlParticular: formData.features_nlParticular,
          saveVehicleRecords: formData.features_saveVehicleRecords
        }
      }
      delete bodyData.features_greenTax
      delete bodyData.features_professionalTax
      delete bodyData.features_autoCreateRC
      delete bodyData.features_expandAdditionalDetails
      delete bodyData.features_moneyReceived
      delete bodyData.features_rcDetails
      delete bodyData.features_forms
      delete bodyData.features_form23
      delete bodyData.features_tempRc
      delete bodyData.features_nlParticular
      delete bodyData.features_saveVehicleRecords
      // Shown in the form for reference only; the limit changes through Vehicle API Sales
      delete bodyData.rcSearchLimit
      delete bodyData.rcSearchCount
      if (formData.planType === 'lifetime') {
        // Lifetime: one-time fee only, no expiry and no recurring price
        delete bodyData.subscriptionExpiresAt
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
        setFormData({ name: '', mobile1: '', mobile2: '', email: '', address: '', state: '', rto: '', billName: '', billDescription: '', planType: 'yearly', subscriptionExpiresAt: '', yearlyPrice: '', lifetimeFee: '', paidAmount: '', password: '', features_greenTax: false, features_professionalTax: false, features_autoCreateRC: false, features_expandAdditionalDetails: false, features_moneyReceived: false, features_rcDetails: false, features_forms: false, features_form23: false, features_tempRc: false, features_nlParticular: false, features_saveVehicleRecords: false, rcProvider: 'api2', rcSearchLimit: 0, rcSearchCount: 0, paymentScreenshots: [] })
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
      // Older users may only have a monthly price saved; turn it into the yearly price
      yearlyPrice: user.yearlyPrice ?? (user.monthlyPrice != null ? Number((user.monthlyPrice * 12).toFixed(2)) : ''),
      lifetimeFee: user.lifetimeFee ?? '',
      paidAmount: user.paidAmount ?? '',
      paymentScreenshots: user.paymentScreenshots || [],
      password: '',
      features_greenTax: user.features?.greenTax ?? false,
      features_professionalTax: user.features?.professionalTax ?? false,
      features_autoCreateRC: user.features?.autoCreateRC ?? false,
      features_expandAdditionalDetails: user.features?.expandAdditionalDetails ?? false,
      features_moneyReceived: user.features?.moneyReceived ?? false,
      features_rcDetails: user.features?.rcDetails ?? false,
      features_forms: user.features?.forms ?? false,
      features_form23: user.features?.form23 ?? false,
      features_tempRc: user.features?.tempRc ?? false,
      features_nlParticular: user.features?.nlParticular ?? false,
      features_saveVehicleRecords: user.features?.saveVehicleRecords ?? false,
      rcProvider: user.rcProvider === 'api1' ? 'api1' : 'api2',
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
    setFormData({ name: '', mobile1: '', mobile2: '', email: '', address: '', state: '', rto: '', billName: '', billDescription: '', planType: 'yearly', subscriptionExpiresAt: '', yearlyPrice: '', lifetimeFee: '', paidAmount: '', password: '', features_greenTax: false, features_professionalTax: false, features_autoCreateRC: false, features_expandAdditionalDetails: false, features_moneyReceived: false, features_rcDetails: false, features_forms: false, features_form23: false, features_tempRc: false, features_nlParticular: false, features_saveVehicleRecords: false, rcProvider: 'api2', rcSearchLimit: 0, rcSearchCount: 0, paymentScreenshots: [] })
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

  const openCleanModal = (user) => {
    setCleanTarget(user)
    setCleanConfirm('')
    setCleanError('')
  }

  const closeCleanModal = () => {
    setCleanTarget(null)
    setCleanConfirm('')
    setCleanError('')
  }

  const handleCleanData = async (e) => {
    e.preventDefault()
    if (!cleanTarget) return

    if (cleanConfirm.trim().toLowerCase() !== 'confirm') {
      setCleanError('Type confirm to clean all data of this user.')
      return
    }

    try {
      setCleaningId(cleanTarget._id)
      setCleanError('')
      setError('')
      setSuccess('')

      const response = await fetch(`${BACKEND_URL}/api/admin/users/${cleanTarget._id}/clean-data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ confirm: 'confirm' })
      })
      const data = await response.json()
      if (data.success) {
        setSuccess(`Backup emailed and all data of "${cleanTarget.name}" cleaned (${data.data.totalRecords} records deleted).`)
        closeCleanModal()
        fetchUsers()
      } else {
        setCleanError(data.message || 'Failed to clean user data')
      }
    } catch {
      setCleanError('Failed to clean user data')
    } finally {
      setCleaningId(null)
    }
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
        onClick={() => navigate(`/api-credits?user=${user._id}`)}
        className='p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors cursor-pointer'
        title='Sell vehicle API calls / view API purchases'
      >
        <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z' />
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
        onClick={() => openCleanModal(user)}
        disabled={cleaningId === user._id}
        className='p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-md transition-colors disabled:opacity-40 disabled:cursor-wait cursor-pointer'
        title='Clean data (email backup, then delete all user data)'
      >
        <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m-11 7l6-6m0 6l-6-6' />
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

  // Lifetime plans show their one-time fee; yearly plans show the yearly price and its monthly average
  const renderPlanPrice = (user, className) => {
    if (isLifetime(user)) {
      return user.lifetimeFee != null ? (
        <div className={className}>₹{user.lifetimeFee} one-time</div>
      ) : null
    }
    return user.yearlyPrice != null ? (
      <div className={className}>
        ₹{user.yearlyPrice}/yr
        <span> · ≈ ₹{formatMoney(user.yearlyPrice / 12)}/mo</span>
      </div>
    ) : null
  }

  // The plan fee (lifetime fee or yearly price) is what the user owes
  const planFeeOf = (plan) => Number(plan.planType === 'lifetime' ? plan.lifetimeFee : plan.yearlyPrice) || 0

  // How much of the plan fee has been paid and what is still to come in
  const renderFeeStatus = (user, className = '') => {
    const fee = planFeeOf(user)
    if (!fee && user.paidAmount == null) return null
    // No paid amount recorded means the full fee was paid
    const paid = user.paidAmount ?? fee
    const pending = Math.max(0, fee - paid)
    return (
      <div className={className} title={`Fee ₹${fee} · Paid ₹${paid}`}>
        <span className='text-gray-500'>Paid ₹{formatMoney(paid)} of ₹{formatMoney(fee)}</span>
        {pending > 0 ? (
          <span className='ml-1 font-semibold text-amber-600'>· ₹{formatMoney(pending)} pending</span>
        ) : (
          <span className='ml-1 font-semibold text-emerald-600'>· Paid</span>
        )}
        {user.paymentScreenshots?.length > 0 && (
          <a
            href={`${BACKEND_URL}${user.paymentScreenshots[0]}`}
            target='_blank'
            rel='noreferrer'
            className='ml-1 font-semibold text-indigo-600 hover:underline'
            title={`${user.paymentScreenshots.length} payment screenshot(s) — open the first; edit the user to see all`}
          >
            · 📎 {user.paymentScreenshots.length}
          </a>
        )}
      </div>
    )
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
        RC {left}/{user.rcSearchLimit || 0} left{user.rcProvider === 'api1' && ' · API 1'}
      </span>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className='flex justify-between items-center gap-3 mb-3 sm:mb-6'>
        <div className='min-w-0'>
          <h1 className='text-xl sm:text-3xl font-bold text-gray-800'>Manage Users</h1>
          <p className='hidden sm:block text-base text-gray-600 mt-1'>Create and manage user accounts</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className='shrink-0 px-3 py-2 sm:px-5 sm:py-2.5 bg-indigo-600 text-white rounded-lg sm:rounded-xl hover:bg-indigo-700 font-semibold flex items-center justify-center gap-1.5 sm:gap-2 text-sm shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transition-all cursor-pointer'
        >
          <svg className='w-4 h-4 sm:w-5 sm:h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 4v16m8-8H4' />
          </svg>
          <span>New User</span>
        </button>
      </div>

      {/* Stats Bar */}
      <div className='grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-3 sm:mb-5'>
        <div className='bg-white rounded-xl p-2.5 sm:p-4 shadow-sm border border-gray-100'>
          <p className='text-[10px] sm:text-xs text-gray-500 font-semibold uppercase tracking-wide'>Total</p>
          <p className='text-lg sm:text-2xl font-bold text-gray-800 sm:mt-1'>{stats.total}</p>
        </div>
        <div className='bg-white rounded-xl p-2.5 sm:p-4 shadow-sm border border-green-100'>
          <p className='text-[10px] sm:text-xs text-green-600 font-semibold uppercase tracking-wide'>Active</p>
          <p className='text-lg sm:text-2xl font-bold text-green-600 sm:mt-1'>{stats.active}</p>
        </div>
        <div className='bg-white rounded-xl p-2.5 sm:p-4 shadow-sm border border-red-100'>
          <p className='text-[10px] sm:text-xs text-red-500 font-semibold uppercase tracking-wide'>Inactive</p>
          <p className='text-lg sm:text-2xl font-bold text-red-500 sm:mt-1'>{stats.inactive}</p>
        </div>
        <div className='bg-white rounded-xl p-2.5 sm:p-4 shadow-sm border border-amber-100'>
          <p className='text-[10px] sm:text-xs text-amber-600 font-semibold uppercase tracking-wide'>Fee Pending</p>
          <p className='text-lg sm:text-2xl font-bold text-amber-600 sm:mt-1'>₹{formatMoney(stats.fees?.pendingAmount)}</p>
          <p className='text-[11px] text-gray-400 mt-0.5'>
            ₹{formatMoney(stats.fees?.paidAmount)} received of ₹{formatMoney(stats.fees?.totalFee)}
            {stats.fees?.pendingUsers ? ` · ${stats.fees.pendingUsers} user(s)` : ''}
          </p>
        </div>
      </div>

      {/* Vehicle (RC details) API quota left with the provider */}
      <RcApiUsageCard className='mb-3 sm:mb-5' />

      {/* Which API app users' RC searches go to; one user can be changed in Edit */}
      {stats.total > 0 && (
        <div className='mb-3 sm:mb-5 p-3 sm:p-4 bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5'>
          <div>
            <p className='text-sm font-semibold text-gray-800'>RC Details API for app users</p>
            <p className='text-xs text-gray-500 mt-0.5'>
              {stats.rcApi1 || 0} on API 1 · {stats.rcApi2 ?? stats.total} on API 2. Switch every user at once when one API is down, or change one user in Edit.
            </p>
          </div>
          <div className='flex flex-wrap gap-2'>
            {PROVIDER_OPTIONS.map((p) => {
              const name = p.value === 'api2' ? 'API 2' : 'API 1'
              const already = p.value === 'api2' ? !stats.rcApi1 : stats.rcApi1 === stats.total
              return (
                <button
                  key={p.value}
                  onClick={() => switchAllRcProvider(p.value)}
                  disabled={switchingAllRc || already}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg border cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                    p.value === 'api2'
                      ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                      : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                  }`}
                >
                  {already ? `All on ${name}` : `Switch all to ${name}`}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className='bg-white rounded-xl shadow-sm border border-gray-100 p-2 sm:p-3 mb-3 sm:mb-5'>
        <div className='flex flex-wrap sm:flex-nowrap gap-2 sm:gap-3'>
          <div className='relative min-w-0 flex-1'>
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
          {/* Phones: all filters live in a popup behind this button */}
          <button
            type='button'
            onClick={openFilters}
            className={`sm:hidden relative flex shrink-0 items-center justify-center w-10 rounded-lg border transition-colors cursor-pointer ${
              activeFilterCount ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-gray-200 bg-gray-50 text-gray-600'
            }`}
            aria-label='Filters'
          >
            <SlidersHorizontal className='w-4 h-4' />
            {activeFilterCount > 0 && (
              <span className='absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white'>
                {activeFilterCount}
              </span>
            )}
          </button>
          <div className='hidden sm:flex gap-1 sm:gap-2'>
            {['all', 'true', 'false'].map((val) => (
              <button
                key={val}
                onClick={() => setStatusFilter(val)}
                className={`px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all cursor-pointer ${
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
            className='hidden sm:block min-w-0 flex-1 sm:flex-none px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm font-semibold rounded-lg border border-gray-200 bg-gray-50 text-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer'
          >
            <option value='all'>All States</option>
            {stateCounts.map(({ state, count }) => (
              <option key={state} value={state}>{`${state}  (${count})`}</option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className='hidden sm:block w-full sm:w-auto px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm font-semibold rounded-lg border border-gray-200 bg-gray-50 text-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer'
          >
            <option value='default'>Sort: Default</option>
            <option value='newest'>Joined: Newest first</option>
            <option value='oldest'>Joined: Oldest first</option>
          </select>
        </div>

        {/* Phones: the filters in use, each with its own x */}
        {activeFilterCount > 0 && (
          <div className='sm:hidden flex flex-wrap gap-1.5 mt-2'>
            {statusFilter !== 'all' && (
              <FilterChip label={statusFilter === 'true' ? 'Active' : 'Inactive'} onRemove={() => setStatusFilter('all')} />
            )}
            {stateFilter !== 'all' && <FilterChip label={stateFilter} onRemove={() => setStateFilter('all')} />}
            {sortBy !== 'default' && <FilterChip label={SORT_LABELS[sortBy]} onRemove={() => setSortBy('default')} />}
          </div>
        )}
      </div>

      {/* Phone filter popup */}
      {showFilters && (
        <div className='sm:hidden fixed inset-0 z-50 flex items-end bg-black/40' onClick={() => setShowFilters(false)}>
          <div
            className='w-full max-h-[85vh] overflow-y-auto rounded-t-2xl bg-white shadow-2xl'
            onClick={(e) => e.stopPropagation()}
            role='dialog'
            aria-modal='true'
            aria-label='Filters'
          >
            <div className='flex items-center justify-between border-b border-gray-100 px-4 py-3'>
              <h2 className='text-base font-bold text-gray-800'>Filters</h2>
              <button
                type='button'
                onClick={() => setShowFilters(false)}
                className='flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 cursor-pointer'
                aria-label='Close'
              >
                <X className='w-4 h-4' />
              </button>
            </div>

            <div className='space-y-5 p-4'>
              <div>
                <p className='mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500'>Status</p>
                <div className='grid grid-cols-3 gap-2'>
                  {[
                    ['all', 'All', stats.total, 'bg-gray-800'],
                    ['true', 'Active', stats.active, 'bg-green-600'],
                    ['false', 'Inactive', stats.inactive, 'bg-red-500']
                  ].map(([val, label, count, activeBg]) => {
                    const on = draftFilters.status === val
                    return (
                      <button
                        key={val}
                        type='button'
                        onClick={() => setDraftFilters((f) => ({ ...f, status: val }))}
                        className={`rounded-lg border px-2 py-2 text-sm font-semibold transition cursor-pointer ${
                          on ? `${activeBg} border-transparent text-white` : 'border-gray-200 bg-gray-50 text-gray-600'
                        }`}
                      >
                        {label}
                        <span className={`block text-[11px] font-normal ${on ? 'text-white/80' : 'text-gray-400'}`}>{count}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <p className='mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500'>State</p>
                <SearchSelect
                  value={draftFilters.state === 'all' ? '' : draftFilters.state}
                  onChange={(state) => setDraftFilters((f) => ({ ...f, state: state || 'all' }))}
                  options={stateCounts.map(({ state, count }) => ({ value: state, label: state, count }))}
                  placeholder='All states'
                  searchPlaceholder='Search state…'
                  emptyText='No state found'
                  clearable
                  ariaLabel='State'
                />
              </div>

              <div>
                <p className='mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500'>Sort</p>
                <div className='grid gap-2'>
                  {Object.entries(SORT_LABELS).map(([val, label]) => {
                    const on = draftFilters.sort === val
                    return (
                      <button
                        key={val}
                        type='button'
                        onClick={() => setDraftFilters((f) => ({ ...f, sort: val }))}
                        className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm font-semibold transition cursor-pointer ${
                          on ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-200 bg-gray-50 text-gray-600'
                        }`}
                      >
                        {label}
                        <span className={`h-4 w-4 rounded-full border-2 ${on ? 'border-indigo-600 bg-indigo-600 ring-2 ring-inset ring-white' : 'border-gray-300'}`} />
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className='sticky bottom-0 flex gap-2 border-t border-gray-100 bg-white p-4'>
              <button
                type='button'
                onClick={() => setDraftFilters({ status: 'all', state: 'all', sort: 'default' })}
                className='flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer'
              >
                Reset
              </button>
              <button
                type='button'
                onClick={applyFilters}
                className='flex-1 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 cursor-pointer'
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

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
                          {renderFeeStatus(user, 'text-[11px]')}
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
                  <div key={user._id} className='px-2.5 py-2.5'>
                    <div className='flex items-start gap-2'>
                      <div className='relative flex-shrink-0 mt-0.5'>
                        <div className='w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[11px] font-bold'>
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <span className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full ring-2 ring-white ${user.isActive ? 'bg-green-500' : 'bg-red-500'}`}></span>
                      </div>
                      <div className='min-w-0 flex-1'>
                        <div className='flex items-center gap-1.5'>
                          <span className='text-[13px] font-semibold text-gray-900 truncate'>{user.name}</span>
                          {!user.isActive && (
                            <span className='shrink-0 text-[9px] font-bold uppercase text-red-600 bg-red-50 px-1 rounded'>Inactive</span>
                          )}
                        </div>
                        <div className='text-[11px] text-gray-600 truncate'>
                          {user.mobile1}
                          {user.mobile2 && <span className='text-gray-400'> · {user.mobile2}</span>}
                          {user.email && <span className='text-gray-400'> · {user.email}</span>}
                        </div>
                      </div>
                    </div>

                    <div className='mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[11px]'>
                      {renderPlanBadge(user)}
                      {isLifetime(user) ? (
                        <span className='text-violet-600 font-semibold'>Never expires</span>
                      ) : (
                        <span className='text-gray-700'>
                          {formatDate(user.subscriptionExpiresAt)}
                          {days !== null && (
                            <span className={`ml-1 font-semibold ${days <= 0 ? 'text-red-600' : days <= 7 ? 'text-orange-500' : 'text-emerald-600'}`}>
                              {days <= 0 ? 'Expired' : `${days}d left`}
                            </span>
                          )}
                        </span>
                      )}
                      {renderPlanPrice(user, 'text-gray-400')}
                      {renderFeeStatus(user)}
                      {renderRcBadge(user)}
                    </div>

                    <div className='mt-1 flex items-end justify-between gap-2'>
                      <div className='min-w-0 text-[10.5px] leading-4 text-gray-400'>
                        <div className='truncate'>
                          <span className='text-gray-600'>{user.state || '-'}</span>
                          {user.rto && <span> · {user.rto}</span>}
                          <span> · Joined {formatDate(user.createdAt)}</span>
                        </div>
                        <div className='truncate'>Active {formatDateTime(user.lastActivity || user.lastLogin)}</div>
                      </div>
                      <div className='shrink-0 -mr-1'>{renderActions(user)}</div>
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
        <div className='fixed inset-0 bg-black/50 z-50 overflow-y-auto'>
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

      {/* Clean User Data Confirmation */}
      {cleanTarget && (
        <div className='fixed inset-0 bg-black/50 z-50 overflow-y-auto'>
          <div className='flex items-start justify-center min-h-full px-3 py-8 sm:py-16'>
            <div className='bg-white rounded-lg shadow-xl max-w-md w-full p-5'>
              <div className='flex items-start gap-3'>
                <div className='w-10 h-10 shrink-0 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center'>
                  <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' />
                  </svg>
                </div>
                <div className='min-w-0'>
                  <h2 className='text-lg font-bold text-gray-800'>Clean all data of this user?</h2>
                  <p className='text-xs text-gray-500 mt-0.5'>
                    A full backup is emailed first, then all of the user's records (vehicles, DL, permits, fitness, tax, insurance, bills, parties, payments, etc.) are permanently deleted. The account itself stays.
                  </p>
                </div>
              </div>

              {/* Whose data is being cleaned */}
              <div className='mt-4 p-3 rounded-lg bg-gray-50 border border-gray-200'>
                <div className='text-sm font-semibold text-gray-900 break-words'>
                  {cleanTarget.name}
                </div>
                <div className='text-xs text-gray-600 mt-0.5'>
                  {cleanTarget.mobile1}
                  {cleanTarget.state && <span className='text-gray-400'> · {cleanTarget.state}</span>}
                  {cleanTarget.rto && <span className='text-gray-400'> · {cleanTarget.rto}</span>}
                </div>
                {cleanTarget.email && (
                  <div className='text-xs text-gray-400 break-words'>{cleanTarget.email}</div>
                )}
              </div>

              <form onSubmit={handleCleanData} className='mt-4'>
                <label className='block text-xs sm:text-sm font-semibold text-gray-700 mb-1'>
                  Type <strong>confirm</strong> to clean all data
                </label>
                <input
                  type='text'
                  value={cleanConfirm}
                  onChange={(e) => {
                    setCleanConfirm(e.target.value)
                    setCleanError('')
                  }}
                  autoFocus
                  autoComplete='off'
                  placeholder='confirm'
                  className='w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent'
                />

                {cleanError && (
                  <div className='mt-3 p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700'>
                    {cleanError}
                  </div>
                )}

                <div className='flex gap-2 mt-5'>
                  <button
                    type='button'
                    onClick={closeCleanModal}
                    disabled={cleaningId === cleanTarget._id}
                    className='flex-1 px-4 py-2 text-sm font-semibold rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 cursor-pointer'
                  >
                    Cancel
                  </button>
                  <button
                    type='submit'
                    disabled={cleaningId === cleanTarget._id || cleanConfirm.trim().toLowerCase() !== 'confirm'}
                    className='flex-1 px-4 py-2 text-sm font-semibold rounded-lg bg-orange-600 text-white hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer'
                  >
                    {cleaningId === cleanTarget._id ? 'Backing up & cleaning...' : 'Clean Data'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit User Modal */}
      {showModal && (
        <div className='fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-2 md:p-4'>
          <div className='bg-white rounded-xl md:rounded-2xl shadow-2xl max-w-3xl w-full max-h-[95vh] overflow-hidden flex flex-col'>
            {/* Header */}
            <div className='bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-white flex-shrink-0'>
              <div className='flex justify-between items-center gap-2'>
                <div className='min-w-0'>
                  <h2 className='text-lg md:text-xl font-bold truncate'>
                    {isEditMode ? 'Edit User' : 'Add New User'}
                  </h2>
                  <p className='text-blue-100 text-xs md:text-sm mt-0.5 truncate'>
                    {isEditMode ? `Update account details for ${formData.name || 'this user'}` : 'Create an app account with plan and feature access'}
                  </p>
                </div>
                <button
                  type='button'
                  onClick={handleCloseModal}
                  className='text-white hover:bg-white/20 rounded-lg p-1.5 md:p-2 transition cursor-pointer shrink-0'
                  aria-label='Close'
                >
                  <X className='w-5 h-5 md:w-6 md:h-6' />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className='flex flex-col flex-1 overflow-hidden'>
              <div className='flex-1 overflow-y-auto p-3 md:p-5 space-y-4'>
                {error && (
                  <div className='p-3 bg-red-50 border border-red-200 rounded-lg text-xs sm:text-sm text-red-800'>
                    {error}
                  </div>
                )}

                {/* Section 1: Account details */}
                <FormSection step={1} title='Account Details' color='indigo'>
                  <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                    <div className='sm:col-span-2'>
                      <label className={LABEL_CLASS}>
                        Name <span className='text-red-500'>*</span>
                      </label>
                      <input
                        type='text'
                        name='name'
                        value={formData.name}
                        onChange={handleChange}
                        placeholder='Enter full name'
                        className={INPUT_CLASS}
                        required
                        autoFocus
                      />
                    </div>
                    <div>
                      <label className={LABEL_CLASS}>
                        Mobile <span className='text-red-500'>*</span>
                      </label>
                      <input
                        type='text'
                        name='mobile1'
                        value={formData.mobile1}
                        onChange={handleChange}
                        placeholder='10-digit mobile number'
                        maxLength={10}
                        inputMode='numeric'
                        className={`${INPUT_CLASS} font-mono`}
                        required
                      />
                    </div>
                    <div>
                      <label className={LABEL_CLASS}>
                        Mobile 2 <span className='text-gray-400 font-normal'>(optional)</span>
                      </label>
                      <input
                        type='text'
                        name='mobile2'
                        value={formData.mobile2}
                        onChange={handleChange}
                        placeholder='10-digit mobile number'
                        maxLength={10}
                        inputMode='numeric'
                        className={`${INPUT_CLASS} font-mono`}
                      />
                    </div>
                    <div>
                      <label className={LABEL_CLASS}>
                        Email <span className='text-gray-400 font-normal'>(optional)</span>
                      </label>
                      <input
                        type='email'
                        name='email'
                        value={formData.email}
                        onChange={handleChange}
                        placeholder='email@example.com'
                        className={INPUT_CLASS}
                      />
                    </div>
                    <div>
                      <label className={LABEL_CLASS}>
                        Password {isEditMode ? <span className='text-gray-400 font-normal'>(optional)</span> : <span className='text-red-500'>*</span>}
                      </label>
                      <input
                        type='password'
                        name='password'
                        value={formData.password}
                        onChange={handleChange}
                        placeholder={isEditMode ? 'Leave blank to keep current' : 'Min 4 characters'}
                        className={INPUT_CLASS}
                        required={!isEditMode}
                        minLength={4}
                        autoComplete='new-password'
                      />
                    </div>
                  </div>
                </FormSection>

                {/* Section 2: Location & billing */}
                <FormSection step={2} title='Location & Billing' color='emerald'>
                  <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                    <div>
                      <label className={LABEL_CLASS}>
                        State <span className='text-red-500'>*</span>
                      </label>
                      <select
                        name='state'
                        value={formData.state}
                        onChange={handleChange}
                        className={`${INPUT_CLASS} uppercase cursor-pointer`}
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
                    <div>
                      <label className={LABEL_CLASS}>
                        RTO <span className='text-red-500'>*</span>
                      </label>
                      <input
                        type='text'
                        name='rto'
                        value={formData.rto}
                        onChange={handleChange}
                        placeholder='RTO code'
                        className={`${INPUT_CLASS} uppercase`}
                        required
                      />
                    </div>
                    <div className='sm:col-span-2'>
                      <label className={LABEL_CLASS}>
                        Address <span className='text-gray-400 font-normal'>(optional)</span>
                      </label>
                      <textarea
                        name='address'
                        value={formData.address}
                        onChange={handleChange}
                        placeholder='Enter full address'
                        rows={2}
                        className={`${INPUT_CLASS} resize-none`}
                      />
                    </div>
                    <div>
                      <label className={LABEL_CLASS}>
                        Bill Name <span className='text-gray-400 font-normal'>(optional)</span>
                      </label>
                      <input
                        type='text'
                        name='billName'
                        value={formData.billName}
                        onChange={handleChange}
                        placeholder='Name on bills'
                        className={INPUT_CLASS}
                      />
                    </div>
                    <div>
                      <label className={LABEL_CLASS}>
                        Bill Description <span className='text-gray-400 font-normal'>(optional)</span>
                      </label>
                      <input
                        type='text'
                        name='billDescription'
                        value={formData.billDescription}
                        onChange={handleChange}
                        placeholder='e.g. Transport Consultant'
                        className={INPUT_CLASS}
                      />
                    </div>
                  </div>
                </FormSection>

                {/* Section 3: Plan & payment */}
                <FormSection step={3} title='Plan & Payment' color='amber'>
                  <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                    <div>
                      <label className={LABEL_CLASS}>Plan Type</label>
                      <div className='grid grid-cols-2 gap-1 p-1 bg-white border border-gray-300 rounded-lg'>
                        {[{ value: 'yearly', label: 'Yearly' }, { value: 'lifetime', label: 'Lifetime' }].map((p) => (
                          <button
                            key={p.value}
                            type='button'
                            onClick={() => handleChange({ target: { name: 'planType', value: p.value, type: 'select-one' } })}
                            className={`py-1.5 text-sm font-semibold rounded-md transition cursor-pointer ${
                              formData.planType === p.value
                                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm'
                                : 'text-gray-600 hover:bg-gray-100'
                            }`}
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      {formData.planType === 'lifetime' ? (
                        <>
                          <label className={LABEL_CLASS}>Subscription Expires</label>
                          <div className='w-full px-3 py-2 text-sm rounded-lg bg-violet-50 border border-violet-200 text-violet-700 font-semibold'>
                            ♾️ Lifetime plan — never expires
                          </div>
                        </>
                      ) : (
                        <>
                          <label className={LABEL_CLASS}>
                            Subscription Expires <span className='text-gray-400 font-normal'>(optional)</span>
                          </label>
                          <input
                            type='date'
                            name='subscriptionExpiresAt'
                            value={formData.subscriptionExpiresAt}
                            onChange={handleChange}
                            className={INPUT_CLASS}
                          />
                        </>
                      )}
                    </div>

                    {formData.planType === 'lifetime' ? (
                      <div className='sm:col-span-2'>
                        <label className={LABEL_CLASS}>Lifetime Fee (₹)</label>
                        <input
                          type='number'
                          name='lifetimeFee'
                          value={formData.lifetimeFee}
                          onChange={handleChange}
                          placeholder='0'
                          min='0'
                          step='0.01'
                          className={INPUT_CLASS}
                        />
                        <p className='text-[11px] text-gray-500 mt-1'>
                          One-time charge. The yearly price is not used for lifetime plans.
                        </p>
                      </div>
                    ) : (
                      <>
                        <div>
                          <label className={LABEL_CLASS}>
                            Yearly Price (₹) <span className='text-gray-400 font-normal'>(optional)</span>
                          </label>
                          <input
                            type='number'
                            name='yearlyPrice'
                            value={formData.yearlyPrice}
                            onChange={handleChange}
                            placeholder='0'
                            min='0'
                            step='0.01'
                            className={INPUT_CLASS}
                          />
                        </div>
                        {/* Only sold yearly: the monthly figure is yearly ÷ 12, shown for reference and never saved */}
                        <div>
                          <label className={LABEL_CLASS}>Avg. Monthly (₹)</label>
                          <div className='w-full px-3 py-2 text-sm rounded-lg bg-white/70 border border-gray-200 text-gray-700 font-semibold tabular-nums'>
                            ₹{formatMoney((Number(formData.yearlyPrice) || 0) / 12)} <span className='font-normal text-gray-500'>/ month</span>
                          </div>
                          <p className='text-[11px] text-gray-500 mt-1'>Yearly price ÷ 12, for reference only.</p>
                        </div>
                      </>
                    )}

                    <div>
                      <label className={LABEL_CLASS}>
                        Paid (₹) <span className='text-gray-400 font-normal'>of ₹{formatMoney(planFeeOf(formData))}</span>
                      </label>
                      <input
                        type='number'
                        name='paidAmount'
                        value={formData.paidAmount}
                        onChange={handleChange}
                        placeholder={`${formatMoney(planFeeOf(formData))} (full)`}
                        min='0'
                        step='0.01'
                        className={INPUT_CLASS}
                      />
                    </div>
                    <div>
                      <label className={LABEL_CLASS}>Pending (₹)</label>
                      {(() => {
                        // Left blank = full fee paid
                        const pending = formData.paidAmount === '' ? 0 : Math.round((planFeeOf(formData) - (Number(formData.paidAmount) || 0)) * 100) / 100
                        return (
                          <div
                            className={`w-full px-3 py-2 text-sm rounded-lg border font-semibold tabular-nums ${
                              pending > 0
                                ? 'bg-amber-50 border-amber-200 text-amber-700'
                                : pending < 0
                                  ? 'bg-sky-50 border-sky-200 text-sky-700'
                                  : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                            }`}
                          >
                            {pending < 0 ? `₹${formatMoney(-pending)} extra` : `₹${formatMoney(pending)}`}
                          </div>
                        )
                      })()}
                    </div>

                  </div>
                </FormSection>

                {/* Section 4: Payment proof - UPI / bank screenshots, several allowed for part payments */}
                <FormSection step={4} title='Payment Screenshots' color='sky'>
                  <p className='text-xs text-gray-600 mb-3'>Attach the UPI or bank payment proof for this fee (optional).</p>

                  {/* Big dotted drop zone: click to pick files or drag them in */}
                  <label
                    onDragOver={(e) => { e.preventDefault(); if (!uploadingScreenshot) setDraggingScreenshot(true) }}
                    onDragLeave={() => setDraggingScreenshot(false)}
                    onDrop={(e) => {
                      e.preventDefault()
                      setDraggingScreenshot(false)
                      if (!uploadingScreenshot) uploadScreenshots(Array.from(e.dataTransfer.files || []))
                    }}
                    className={`flex flex-col items-center justify-center gap-2 w-full min-h-[150px] px-4 py-6 rounded-xl border-[3px] border-dotted text-center transition ${
                      uploadingScreenshot
                        ? 'border-gray-300 bg-gray-50 text-gray-400 cursor-wait'
                        : draggingScreenshot
                          ? 'border-sky-500 bg-sky-100 text-sky-800 cursor-copy'
                          : 'border-sky-300 bg-white/70 text-sky-700 hover:bg-white hover:border-sky-500 cursor-pointer'
                    }`}
                  >
                    <span className={`w-12 h-12 rounded-full flex items-center justify-center ${uploadingScreenshot ? 'bg-gray-100' : 'bg-sky-100'}`}>
                      {uploadingScreenshot ? (
                        <svg className='w-6 h-6 animate-spin' fill='none' viewBox='0 0 24 24'>
                          <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' />
                          <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z' />
                        </svg>
                      ) : (
                        <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12' />
                        </svg>
                      )}
                    </span>
                    <span className='text-sm font-semibold'>
                      {uploadingScreenshot
                        ? 'Uploading…'
                        : draggingScreenshot
                          ? 'Drop to attach'
                          : <>Click to upload <span className='font-normal text-gray-500'>or drag & drop</span></>}
                    </span>
                    <span className='text-[11px] text-gray-500'>
                      PNG, JPG, WebP or PDF up to 8MB · several allowed for part payments
                    </span>
                    <input
                      type='file'
                      accept='image/*,application/pdf'
                      multiple
                      disabled={uploadingScreenshot}
                      onChange={handleScreenshotUpload}
                      className='hidden'
                    />
                  </label>

                  {(formData.paymentScreenshots || []).length > 0 && (
                    <div className='mt-3 grid grid-cols-3 sm:grid-cols-5 gap-2'>
                      {formData.paymentScreenshots.map((p, i) => (
                        <div key={p} className='relative aspect-square rounded-lg border border-sky-200 bg-white overflow-hidden shadow-sm'>
                          <a href={`${BACKEND_URL}${p}`} target='_blank' rel='noreferrer' title='Open full size' className='block w-full h-full'>
                            {p.toLowerCase().endsWith('.pdf') ? (
                              <div className='w-full h-full flex flex-col items-center justify-center text-rose-600'>
                                <svg className='w-8 h-8' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' />
                                </svg>
                                <span className='text-[11px] font-bold'>PDF</span>
                              </div>
                            ) : (
                              <img src={`${BACKEND_URL}${p}`} alt={`Payment screenshot ${i + 1}`} className='w-full h-full object-cover' />
                            )}
                          </a>
                          <span className='absolute bottom-1 left-1 bg-black/60 text-white text-[10px] font-semibold rounded px-1.5'>#{i + 1}</span>
                          <button
                            type='button'
                            onClick={() => removeScreenshot(p)}
                            className='absolute top-1 right-1 bg-black/60 hover:bg-rose-600 text-white rounded-full p-1 cursor-pointer'
                            aria-label='Remove screenshot'
                            title='Remove'
                          >
                            <X className='w-3.5 h-3.5' />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className='text-[11px] text-gray-500 mt-2'>Saved when you click {isEditMode ? 'Update' : 'Create'} User.</p>
                </FormSection>

                {/* Section 5: Feature access */}
                <FormSection step={5} title='Feature Access' color='purple'>
                  <div className='grid grid-cols-2 sm:grid-cols-3 gap-2'>
                    {FEATURE_OPTIONS.map((f) => (
                      <label
                        key={f.name}
                        title={f.title}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm cursor-pointer transition ${
                          formData[f.name]
                            ? 'bg-white border-purple-400 text-purple-900 font-semibold shadow-sm'
                            : 'bg-white/60 border-gray-200 text-gray-700 hover:border-purple-300'
                        }`}
                      >
                        <input
                          type='checkbox'
                          name={f.name}
                          checked={formData[f.name]}
                          onChange={handleChange}
                          className='w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer'
                        />
                        <span className='truncate'>{f.label}</span>
                      </label>
                    ))}
                  </div>

                  {/* The search limit is never typed in here: it only grows when a sale is recorded in Vehicle API Sales */}
                  {formData.features_rcDetails && (
                    <div className='mt-3 p-3.5 bg-white rounded-xl border border-indigo-100 space-y-3'>
                      <div className='flex flex-wrap items-center justify-between gap-2'>
                        <label htmlFor='rcProvider' className='text-xs font-semibold text-indigo-900'>
                          RC Details API
                          <span className='block text-[11px] font-normal text-indigo-700'>Where this user's RC searches are fetched from</span>
                        </label>
                        <select
                          id='rcProvider'
                          name='rcProvider'
                          value={formData.rcProvider}
                          onChange={handleChange}
                          className='px-3 py-1.5 text-sm border border-indigo-200 bg-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer'
                        >
                          {PROVIDER_OPTIONS.map((p) => (
                            <option key={p.value} value={p.value}>{p.label}</option>
                          ))}
                        </select>
                      </div>
                      {isEditMode ? (
                        <>
                          <div className='grid grid-cols-3 gap-2 text-center'>
                            <div className='p-2 bg-indigo-50/60 rounded-lg border border-indigo-100'>
                              <p className='text-[10px] font-semibold text-gray-500 uppercase tracking-wide'>RC Search Limit</p>
                              <p className='text-base font-bold text-indigo-900 font-mono'>{formData.rcSearchLimit || 0}</p>
                            </div>
                            <div className='p-2 bg-indigo-50/60 rounded-lg border border-indigo-100'>
                              <p className='text-[10px] font-semibold text-gray-500 uppercase tracking-wide'>Used</p>
                              <p className='text-base font-bold text-indigo-900 font-mono'>{formData.rcSearchCount || 0}</p>
                            </div>
                            <div className='p-2 bg-indigo-50/60 rounded-lg border border-indigo-100'>
                              <p className='text-[10px] font-semibold text-gray-500 uppercase tracking-wide'>Left</p>
                              <p className={`text-base font-bold font-mono ${
                                (formData.rcSearchLimit || 0) - (formData.rcSearchCount || 0) <= 0 ? 'text-rose-700' : 'text-emerald-700'
                              }`}>
                                {Math.max(0, (formData.rcSearchLimit || 0) - (formData.rcSearchCount || 0))}
                              </p>
                            </div>
                          </div>
                          <div className='flex flex-wrap items-center justify-between gap-2'>
                            <p className='text-[11px] text-indigo-700'>
                              To increase the limit, record a sale (API calls, money and date).
                            </p>
                            <button
                              type='button'
                              onClick={() => navigate(`/api-credits?user=${editingUserId}`)}
                              className='px-3 py-1.5 text-xs font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 cursor-pointer'
                            >
                              Record API Sale
                            </button>
                          </div>
                        </>
                      ) : (
                        <p className='text-[11px] text-indigo-700'>
                          The user starts with a search limit of 0. After creating the user, record a sale in Vehicle API Sales to give them searches.
                        </p>
                      )}
                    </div>
                  )}
                </FormSection>
              </div>

              {/* Footer Actions */}
              <div className='border-t border-gray-200 px-3 py-3 md:px-5 bg-gray-50 flex gap-2 md:gap-3 md:justify-end flex-shrink-0'>
                <button
                  type='button'
                  onClick={handleCloseModal}
                  className='flex-1 md:flex-none px-4 md:px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-semibold transition cursor-pointer'
                >
                  Cancel
                </button>
                <button
                  type='submit'
                  disabled={uploadingScreenshot}
                  className='flex-1 md:flex-none px-6 md:px-8 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg font-semibold transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  <svg className='w-4 h-4 md:w-5 md:h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
                  </svg>
                  {isEditMode ? 'Update User' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Users
