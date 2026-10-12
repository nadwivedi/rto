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
      <div className='flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6'>
        <div>
          <h1 className='text-2xl sm:text-3xl font-bold text-gray-800'>Vehicle Registrations</h1>
          <p className='text-sm sm:text-base text-gray-600 mt-1'>View and manage vehicle registrations</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className='mb-6'>
        <input
          type='text'
          placeholder='Search by registration number, owner name, mobile, chassis or engine number...'
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
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
                <div key={reg._id} className='p-4 hover:bg-gray-50'>
                  <div className='flex justify-between items-start mb-3'>
                    <div className='flex-1'>
                      <h3 className='font-semibold text-gray-900 text-base'>{reg.registrationNumber}</h3>
                      <p className='text-sm text-gray-600 mt-1'>{reg.ownerName}</p>
                      {reg.mobileNumber && (
                        <p className='text-sm text-gray-600 mt-0.5'>{reg.mobileNumber}</p>
                      )}
                      <p className='text-sm text-gray-600 mt-1'>
                        {reg.makerName} {reg.makerModel}
                      </p>
                    </div>
                  </div>
                  <div className='flex justify-between items-center pt-2 border-t border-gray-100'>
                    <span className='text-xs text-gray-500'>
                      Registered: {reg.dateOfRegistration}
                    </span>
                    <button
                      onClick={() => handleDelete(reg._id)}
                      className='text-red-600 hover:text-red-800 font-semibold text-sm px-3 py-1.5 rounded hover:bg-red-50 transition-colors cursor-pointer'
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Results Count */}
      {!loading && filteredRegistrations.length > 0 && (
        <div className='mt-4 text-sm text-gray-600 text-center'>
          Showing {filteredRegistrations.length} of {registrations.length} vehicle registrations
        </div>
      )}
    </div>
  )
}

export default VehicleRegistrations
