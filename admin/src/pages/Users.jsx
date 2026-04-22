import { useState, useEffect } from 'react'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://api.rtosarthi.com'
const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL || 'https://rtosarthi.com'
console.log(BACKEND_URL);

const formatDateTime = (value) => {
  if (!value) return 'Never'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Never'

  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
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
    password: ''
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [copiedId, setCopiedId] = useState(null)
  const [accessingId, setAccessingId] = useState(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  const copyToClipboard = (userId) => {
    navigator.clipboard.writeText(userId)
    setCopiedId(userId)
    setTimeout(() => {
      setCopiedId(null)
    }, 2000)
  }

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${BACKEND_URL}/api/admin/users`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
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
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
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

      // Only include password if it's provided
      const bodyData = { ...formData }
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
        setFormData({ name: '', mobile1: '', mobile2: '', email: '', address: '', state: '', rto: '', billName: '', billDescription: '', password: '' })
        fetchUsers()
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
      password: '' // Don't populate password for security
    })
    setShowModal(true)
    setError('')
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setIsEditMode(false)
    setEditingUserId(null)
    setError('')
    setFormData({ name: '', mobile1: '', mobile2: '', email: '', address: '', state: '', rto: '', billName: '', billDescription: '', password: '' })
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this user?')) return

    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/users/${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      const data = await response.json()
      if (data.success || response.ok) {
        setSuccess('User deleted successfully!')
        fetchUsers()
      } else {
        setError('Failed to delete user')
      }
    } catch (error) {
      setError('Failed to delete user')
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
          className='px-4 sm:px-6 py-2.5 sm:py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold flex items-center justify-center gap-2 text-sm sm:text-base whitespace-nowrap cursor-pointer'
        >
          <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 4v16m8-8H4' />
          </svg>
          <span className='hidden xs:inline'>Create New User</span>
          <span className='xs:hidden'>New User</span>
        </button>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className='mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800'>
          {success}
        </div>
      )}
      {error && !showModal && (
        <div className='mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800'>
          {error}
        </div>
      )}

      {/* Users Table/Cards */}
      <div className='bg-white rounded-lg shadow'>
        {loading ? (
          <div className='p-8 text-center'>
            <div className='inline-block animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full'></div>
            <p className='mt-2 text-gray-600'>Loading users...</p>
          </div>
        ) : users.length === 0 ? (
          <div className='p-8 text-center text-gray-500'>
            No users found. Create your first user!
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className='hidden md:block overflow-x-auto'>
              <table className='w-full'>
                <thead className='bg-gray-50 border-b'>
                  <tr>
                    <th className='px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase'>Name</th>
                    <th className='px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase'>Contact</th>
                    <th className='px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase'>Status</th>
                    <th className='px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase'>Last Login</th>
                    <th className='px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase'>Last Activity</th>
                    <th className='px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase'>Created</th>
                    <th className='px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase'>Actions</th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-gray-200'>
                  {users.map((user) => (
                    <tr key={user._id} className='hover:bg-gray-50'>
                      <td className='px-6 py-4'>
                        <div className='flex flex-col'>
                          <span className='text-sm font-medium text-gray-900'>{user.name}</span>
                          <div className='flex items-center gap-2 mt-1'>
                            <span className='text-xs text-gray-500 font-mono'>ID: {user._id}</span>
                            <button
                              onClick={() => copyToClipboard(user._id)}
                              className='text-indigo-600 hover:text-indigo-800 p-1 rounded hover:bg-indigo-50 transition-colors'
                              title='Copy User ID'
                            >
                              {copiedId === user._id ? (
                                <svg className='w-3.5 h-3.5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
                                </svg>
                              ) : (
                                <svg className='w-3.5 h-3.5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z' />
                                </svg>
                              )}
                            </button>
                          </div>
                        </div>
                      </td>
                      <td className='px-6 py-4'>
                        <div className='flex flex-col'>
                          <span className='text-sm font-medium text-gray-800'>{user.mobile1}</span>
                          <span className='text-xs text-gray-500 mt-0.5'>{user.email || '-'}</span>
                        </div>
                      </td>
                      <td className='px-6 py-4 text-sm'>
                        <span className={`px-2 py-1 rounded-full text-[10px] font-semibold ${
                          user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className='px-6 py-4 text-xs text-gray-700'>
                        <div className={user.lastLogin ? 'text-gray-700' : 'text-gray-400'}>
                          {formatDateTime(user.lastLogin)}
                        </div>
                      </td>
                      <td className='px-6 py-4 text-xs text-gray-700'>
                        <div className={user.lastActivity ? 'text-gray-700' : 'text-gray-400'}>
                          {formatDateTime(user.lastActivity)}
                        </div>
                      </td>
                      <td className='px-6 py-4 text-sm text-gray-700'>
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className='px-6 py-4 text-sm'>
                        <div className='flex gap-3'>
                          <button
                            onClick={() => handleAccess(user)}
                            disabled={accessingId === user._id}
                            className='text-emerald-600 hover:text-emerald-800 font-semibold cursor-pointer disabled:opacity-60 disabled:cursor-wait'
                          >
                            {accessingId === user._id ? 'Opening...' : 'Access'}
                          </button>
                          <button
                            onClick={() => handleEdit(user)}
                            className='text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer'
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(user._id)}
                            className='text-red-600 hover:text-red-800 font-semibold cursor-pointer'
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className='md:hidden divide-y divide-gray-200'>
              {users.map((user) => (
                <div key={user._id} className='p-4 hover:bg-gray-50'>
                  <div className='flex justify-between items-start mb-3'>
                    <div className='flex-1'>
                      <h3 className='font-semibold text-gray-900 text-base'>{user.name}</h3>
                      <div className='flex items-center gap-2 mt-1'>
                        <span className='text-xs text-gray-500 font-mono'>ID: {user._id}</span>
                        <button
                          onClick={() => copyToClipboard(user._id)}
                          className='text-indigo-600 hover:text-indigo-800 p-1 rounded hover:bg-indigo-50 transition-colors'
                          title='Copy User ID'
                        >
                          {copiedId === user._id ? (
                            <svg className='w-3.5 h-3.5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
                            </svg>
                          ) : (
                            <svg className='w-3.5 h-3.5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z' />
                            </svg>
                          )}
                        </button>
                      </div>
                      <div className='text-sm text-gray-600 mt-1'>
                        <div className='font-medium text-gray-700'>{user.mobile1}</div>
                        <div className='text-xs text-gray-500'>{user.email || '-'}</div>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap ${
                      user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className='flex justify-between items-center pt-2 border-t border-gray-100'>
                    <div className='text-[11px] text-gray-500 space-y-0.5'>
                      <div>Last Login: <span className={user.lastLogin ? 'text-gray-700 font-medium' : 'text-gray-400'}>{formatDateTime(user.lastLogin)}</span></div>
                      <div>Last Activity: <span className={user.lastActivity ? 'text-gray-700 font-medium' : 'text-gray-400'}>{formatDateTime(user.lastActivity)}</span></div>
                      <div>Created: {new Date(user.createdAt).toLocaleDateString()}</div>
                    </div>
                    <div className='flex gap-2'>
                      <button
                        onClick={() => handleAccess(user)}
                        disabled={accessingId === user._id}
                        className='text-emerald-600 hover:text-emerald-800 font-semibold text-sm px-3 py-1.5 rounded hover:bg-emerald-50 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-wait'
                      >
                        {accessingId === user._id ? 'Opening...' : 'Access'}
                      </button>
                      <button
                        onClick={() => handleEdit(user)}
                        className='text-indigo-600 hover:text-indigo-800 font-semibold text-sm px-3 py-1.5 rounded hover:bg-indigo-50 transition-colors cursor-pointer'
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(user._id)}
                        className='text-red-600 hover:text-red-800 font-semibold text-sm px-3 py-1.5 rounded hover:bg-red-50 transition-colors cursor-pointer'
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Create User Modal */}
      {showModal && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto'>
          <div className='bg-white rounded-lg shadow-xl max-w-md w-full p-4 sm:p-6 my-8'>
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

            <form onSubmit={handleSubmit} className='space-y-3 sm:space-y-4'>
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
                  Mobile 2 <span className='text-gray-400'>(Optional)</span>
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

              <div>
                <label className='block text-xs sm:text-sm font-semibold text-gray-700 mb-1'>
                  Email <span className='text-gray-400'>(Optional)</span>
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
                  Address <span className='text-gray-400'>(Optional)</span>
                </label>
                <textarea
                  name='address'
                  value={formData.address}
                  onChange={handleChange}
                  placeholder='Enter full address'
                  rows={3}
                  className='w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none'
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

              <div>
                <label className='block text-xs sm:text-sm font-semibold text-gray-700 mb-1'>
                  RTO <span className='text-red-500'>*</span>
                </label>
                <input
                  type='text'
                  name='rto'
                  value={formData.rto}
                  onChange={handleChange}
                  placeholder='Enter RTO code'
                  className='w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent uppercase'
                  required
                />
              </div>

              <div>
                <label className='block text-xs sm:text-sm font-semibold text-gray-700 mb-1'>
                  Bill Name <span className='text-gray-400'>(Optional - Displayed on bills)</span>
                </label>
                <input
                  type='text'
                  name='billName'
                  value={formData.billName}
                  onChange={handleChange}
                  placeholder='Name to display on bills'
                  className='w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
                />
              </div>

              <div>
                <label className='block text-xs sm:text-sm font-semibold text-gray-700 mb-1'>
                  Bill Description <span className='text-gray-400'>(Optional - e.g., Transport Consultant)</span>
                </label>
                <input
                  type='text'
                  name='billDescription'
                  value={formData.billDescription}
                  onChange={handleChange}
                  placeholder='Description to display on bills'
                  className='w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
                />
              </div>

              <div>
                <label className='block text-xs sm:text-sm font-semibold text-gray-700 mb-1'>
                  Password {isEditMode ? <span className='text-gray-400'>(Leave blank to keep unchanged)</span> : <span className='text-red-500'>*</span>}
                </label>
                <input
                  type='password'
                  name='password'
                  value={formData.password}
                  onChange={handleChange}
                  placeholder={isEditMode ? 'Leave blank to keep current password' : 'Minimum 4 characters'}
                  className='w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
                  required={!isEditMode}
                  minLength={4}
                />
              </div>

              <div className='flex gap-2 sm:gap-3 mt-4 sm:mt-6'>
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
      )}
    </div>
  )
}

export default Users
