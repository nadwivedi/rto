import { useState, useEffect } from 'react'
import axios from 'axios'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL

const Export = () => {
  const [statistics, setStatistics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [downloadingType, setDownloadingType] = useState(null)

  useEffect(() => {
    fetchStatistics()
  }, [])

  const fetchStatistics = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${BACKEND_URL}/api/admin/export/statistics`, {
        withCredentials: true
      })

      if (response.data.success) {
        setStatistics(response.data.data)
      }
    } catch (error) {
      console.error('Failed to fetch statistics:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async (type, endpoint) => {
    try {
      setDownloadingType(type)
      const response = await axios.get(`${BACKEND_URL}/api/admin/export/${endpoint}`, {
        withCredentials: true,
        responseType: 'blob'
      })

      // Create blob URL and trigger download
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url

      // Extract filename from Content-Disposition header or use default
      const contentDisposition = response.headers['content-disposition']
      let filename = type === 'combined' ? 'rto_all_data_combined.zip' : 'rto_all_data_user_wise.zip'
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/)
        if (filenameMatch) {
          filename = filenameMatch[1]
        }
      }

      link.setAttribute('download', filename)
      document.body.appendChild(link)
      link.click()
      link.parentNode.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error(`Failed to export ${type}:`, error)
      alert(`Failed to export ${type}. Please try again.`)
    } finally {
      setDownloadingType(null)
    }
  }

  const statisticsCards = [
    { label: 'Total Users', value: statistics?.users || 0, icon: '👥', color: 'bg-blue-500' },
    { label: 'Vehicle Registrations', value: statistics?.vehicleRegistrations || 0, icon: '🚗', color: 'bg-green-500' },
    { label: 'Driving Licenses', value: statistics?.drivingLicenses || 0, icon: '🪪', color: 'bg-purple-500' },
    { label: 'National Permits (Part A)', value: statistics?.nationalPermitsPartA || 0, icon: '📋', color: 'bg-indigo-500' },
    { label: 'National Permits (Part B)', value: statistics?.nationalPermitsPartB || 0, icon: '📋', color: 'bg-indigo-600' },
    { label: 'CG Permits', value: statistics?.cgPermits || 0, icon: '📄', color: 'bg-yellow-500' },
    { label: 'Temporary Permits', value: statistics?.temporaryPermits || 0, icon: '⏰', color: 'bg-orange-500' },
    { label: 'Temporary Permits (Other State)', value: statistics?.temporaryPermitsOtherState || 0, icon: '🌍', color: 'bg-red-500' },
    { label: 'Fitness Certificates', value: statistics?.fitness || 0, icon: '✅', color: 'bg-teal-500' },
    { label: 'Tax Records', value: statistics?.tax || 0, icon: '💰', color: 'bg-pink-500' },
    { label: 'Insurance Records', value: statistics?.insurance || 0, icon: '🔒', color: 'bg-cyan-500' },
    { label: 'PUC Records', value: statistics?.puc || 0, icon: '🔧', color: 'bg-lime-500' },
    { label: 'Vehicle Transfers', value: statistics?.vehicleTransfers || 0, icon: '🔄', color: 'bg-amber-500' },
    { label: 'Custom Bills', value: statistics?.customBills || 0, icon: '🧾', color: 'bg-rose-500' }
  ]

  if (loading) {
    return (
      <div className='flex items-center justify-center h-screen'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto'></div>
          <p className='mt-4 text-gray-600'>Loading statistics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className='max-w-7xl mx-auto'>
      {/* Header */}
      <div className='mb-8'>
        <h1 className='text-3xl font-bold text-gray-900'>Data Export</h1>
        <p className='mt-2 text-gray-600'>Export all RTO data in organized ZIP files</p>
      </div>

      {/* Statistics Grid */}
      <div className='mb-8'>
        <h2 className='text-2xl font-bold text-gray-800 mb-4'>Database Statistics</h2>
        <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4'>
          {statisticsCards.map((stat, index) => (
            <div
              key={index}
              className={`${stat.color} rounded-lg p-4 text-white shadow-md hover:shadow-lg transition-shadow`}
            >
              <div className='text-3xl mb-2'>{stat.icon}</div>
              <div className='text-2xl font-bold'>{stat.value}</div>
              <div className='text-xs opacity-90 mt-1'>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Export Options */}
      <div className='mb-8'>
        <h2 className='text-2xl font-bold text-gray-800 mb-4'>Export &amp; Log Options</h2>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          {/* Combined Export */}
          <div className='bg-white rounded-lg shadow-md hover:shadow-lg overflow-hidden border border-gray-200 transition-all'>
            <div className='p-6'>
              <div className='flex items-center gap-3 mb-4'>
                <div className='w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center shrink-0'>
                  <svg className='w-6 h-6 text-indigo-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' />
                  </svg>
                </div>
                <div>
                  <h3 className='text-lg font-bold text-gray-900'>All Data Combined</h3>
                  <p className='text-sm text-gray-600'>Single ZIP with all JSON files</p>
                </div>
              </div>
              <button
                onClick={() => handleExport('combined', 'all-combined')}
                disabled={downloadingType === 'combined'}
                className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                  downloadingType === 'combined'
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95'
                }`}
              >
                {downloadingType === 'combined' ? (
                  <>
                    <svg className='animate-spin h-5 w-5' fill='none' viewBox='0 0 24 24'>
                      <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4'></circle>
                      <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'></path>
                    </svg>
                    Preparing...
                  </>
                ) : (
                  <>
                    <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4' />
                    </svg>
                    Download Combined ZIP
                  </>
                )}
              </button>
            </div>
          </div>

          {/* User-Wise Export */}
          <div className='bg-white rounded-lg shadow-md hover:shadow-lg overflow-hidden border border-gray-200 transition-all'>
            <div className='p-6'>
              <div className='flex items-center gap-3 mb-4'>
                <div className='w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center shrink-0'>
                  <svg className='w-6 h-6 text-green-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z' />
                  </svg>
                </div>
                <div>
                  <h3 className='text-lg font-bold text-gray-900'>User-Wise Organization</h3>
                  <p className='text-sm text-gray-600'>ZIP with folders per user</p>
                </div>
              </div>
              <button
                onClick={() => handleExport('user-wise', 'all-user-wise')}
                disabled={downloadingType === 'user-wise'}
                className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                  downloadingType === 'user-wise'
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700 active:scale-95'
                }`}
              >
                {downloadingType === 'user-wise' ? (
                  <>
                    <svg className='animate-spin h-5 w-5' fill='none' viewBox='0 0 24 24'>
                      <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4'></circle>
                      <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'></path>
                    </svg>
                    Preparing...
                  </>
                ) : (
                  <>
                    <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4' />
                    </svg>
                    Download User-Wise ZIP
                  </>
                )}
              </button>
            </div>
          </div>

          {/* WhatsApp System Log Download (Admin Only) */}
          <div className='bg-white rounded-lg shadow-md hover:shadow-lg overflow-hidden border border-gray-200 transition-all'>
            <div className='p-6'>
              <div className='flex items-center gap-3 mb-4'>
                <div className='w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center shrink-0'>
                  <span className='text-2xl'>💬</span>
                </div>
                <div>
                  <h3 className='text-lg font-bold text-gray-900'>WhatsApp System Logs</h3>
                  <p className='text-sm text-gray-600'>Daily date-wise error &amp; RAM log</p>
                </div>
              </div>
              <button
                onClick={() => handleExport('whatsapp-log', 'whatsapp-log')}
                disabled={downloadingType === 'whatsapp-log'}
                className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                  downloadingType === 'whatsapp-log'
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-amber-600 text-white hover:bg-amber-700 active:scale-95'
                }`}
              >
                {downloadingType === 'whatsapp-log' ? (
                  <>
                    <svg className='animate-spin h-5 w-5' fill='none' viewBox='0 0 24 24'>
                      <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4'></circle>
                      <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'></path>
                    </svg>
                    Fetching...
                  </>
                ) : (
                  <>
                    <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4' />
                    </svg>
                    Download Today's WA Log
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className='bg-blue-50 border border-blue-200 rounded-lg p-6'>
        <div className='flex items-start gap-3'>
          <svg className='w-6 h-6 text-blue-600 flex mt-0.5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
          </svg>
          <div>
            <h3 className='font-semibold text-blue-900 mb-2'>Export Information</h3>
            <ul className='text-sm text-blue-800 space-y-1'>
              <li>• All data is exported in JSON format for easy processing</li>
              <li>• Files are compressed into ZIP format to reduce download size</li>
              <li>• Combined export contains all records in separate JSON files</li>
              <li>• User-wise export organizes data by user in separate folders</li>
              <li>• Export files include timestamps in their names</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Export
