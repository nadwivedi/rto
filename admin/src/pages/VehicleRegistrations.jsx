import { useState, useEffect } from 'react'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://api.rtosarthi.com'

const VehicleRegistrations = () => {
  const [registrations, setRegistrations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchRegistrations()
  }, [])

  const fetchRegistrations = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${BACKEND_URL}/api/admin/vehicle-registrations`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      })
      const data = await response.json()
      if (data.success) {
        setRegistrations(data.data)
      }
    } catch (error) {
      console.error('Error fetching vehicle registrations:', error)
      setError('Failed to fetch vehicle registrations')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this vehicle registration?')) return

    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/vehicle-registrations/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      })
      const data = await response.json()
      if (data.success || response.ok) {
        setSuccess('Vehicle registration deleted successfully!')
        fetchRegistrations()
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError('Failed to delete vehicle registration')
        setTimeout(() => setError(''), 3000)
      }
    } catch (error) {
      setError('Failed to delete vehicle registration')
      setTimeout(() => setError(''), 3000)
    }
  }

  const filteredRegistrations = registrations.filter(reg => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      reg.registrationNumber?.toLowerCase().includes(search) ||
      reg.ownerName?.toLowerCase().includes(search) ||
      reg.mobileNumber?.includes(search) ||
      reg.chassisNumber?.toLowerCase().includes(search) ||
      reg.engineNumber?.toLowerCase().includes(search)
    )
  })

  return (
    <div>
      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-3 sm:mb-6'>
        <div>
          <h1 className='text-xl sm:text-3xl font-bold text-gray-800'>Vehicle Registrations</h1>
          <p className='text-xs sm:text-base text-gray-600 mt-0.5 sm:mt-1'>View and manage vehicle registrations</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className='mb-3 sm:mb-6'>
        <input
          type='text'
          placeholder='Search vehicle number, owner, mobile, chassis...'
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className='w-full px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
        />
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className='mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800'>
          {success}
        </div>
      )}
      {error && (
        <div className='mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800'>
          {error}
        </div>
      )}

      {/* Registrations Table/Cards */}
      <div className='bg-white rounded-lg shadow'>
        {loading ? (
          <div className='p-8 text-center'>
            <div className='inline-block animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full'></div>
            <p className='mt-2 text-gray-600'>Loading vehicle registrations...</p>
          </div>
        ) : filteredRegistrations.length === 0 ? (
          <div className='p-8 text-center text-gray-500'>
            {searchTerm ? 'No registrations found matching your search.' : 'No vehicle registrations found.'}
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className='hidden md:block overflow-x-auto'>
              <table className='w-full'>
                <thead className='bg-gray-50 border-b'>
                  <tr>
                    <th className='px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase'>Reg. Number</th>
                    <th className='px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase'>Owner Name</th>
                    <th className='px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase'>Mobile</th>
                    <th className='px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase'>Vehicle</th>
                    <th className='px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase'>Reg. Date</th>
                    <th className='px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase'>Actions</th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-gray-200'>
                  {filteredRegistrations.map((reg) => (
                    <tr key={reg._id} className='hover:bg-gray-50'>
                      <td className='px-6 py-4 text-sm font-medium text-gray-900'>{reg.registrationNumber}</td>
                      <td className='px-6 py-4 text-sm text-gray-700'>{reg.ownerName}</td>
                      <td className='px-6 py-4 text-sm text-gray-700'>{reg.mobileNumber || '-'}</td>
                      <td className='px-6 py-4 text-sm text-gray-700'>
                        {reg.makerName} {reg.makerModel}
                      </td>
                      <td className='px-6 py-4 text-sm text-gray-700'>{reg.dateOfRegistration}</td>
                      <td className='px-6 py-4 text-sm'>
                        <button
                          onClick={() => handleDelete(reg._id)}
                          className='text-red-600 hover:text-red-800 font-semibold cursor-pointer'
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className='md:hidden divide-y divide-gray-200'>
              {filteredRegistrations.map((reg) => (
                <div key={reg._id} className='flex items-center gap-2 px-2.5 py-2 hover:bg-gray-50'>
                  <div className='min-w-0 flex-1'>
                    <h3 className='font-semibold text-gray-900 text-[13px]'>{reg.registrationNumber}</h3>
                    <p className='text-[11px] text-gray-600 truncate'>
                      {reg.ownerName}
                      {reg.mobileNumber && <span className='text-gray-400'> · {reg.mobileNumber}</span>}
                    </p>
                    <p className='text-[11px] text-gray-400 truncate'>
                      {[reg.makerName, reg.makerModel].filter(Boolean).join(' ')}
                      {reg.dateOfRegistration && <span> · Reg. {reg.dateOfRegistration}</span>}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(reg._id)}
                    className='shrink-0 text-red-600 hover:text-red-800 font-semibold text-xs px-2 py-1.5 rounded hover:bg-red-50 transition-colors cursor-pointer'
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Results Count */}
      {!loading && filteredRegistrations.length > 0 && (
        <div className='mt-3 sm:mt-4 text-xs sm:text-sm text-gray-600 text-center'>
          Showing {filteredRegistrations.length} of {registrations.length} vehicle registrations
        </div>
      )}
    </div>
  )
}

export default VehicleRegistrations
