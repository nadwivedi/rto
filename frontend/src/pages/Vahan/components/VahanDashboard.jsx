import { useState, useEffect, useMemo } from 'react'
import axios from 'axios'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL

const getDaysRemaining = (date) => {
  if (!date) return null
  const today = new Date()
  const expDate = new Date(date)
  const diffTime = expDate - today
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const VahanDashboard = () => {
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [allRecords, setAllRecords] = useState([])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${BACKEND_URL}/api/dashboard`, { withCredentials: true })
      const data = response.data.data

      const records = []

      ;(data.expiringRecords.tax || []).forEach(r => {
        records.push({
          ...r,
          docType: 'Tax',
          validFrom: r.taxFrom,
          validTo: r.taxTo
        })
      })

      ;(data.expiringRecords.fitness || []).forEach(r => {
        records.push({
          ...r,
          docType: 'Fitness'
        })
      })

      ;(data.expiringRecords.puc || []).forEach(r => {
        records.push({
          ...r,
          docType: 'PUC'
        })
      })

      ;(data.expiringRecords.gps || []).forEach(r => {
        records.push({
          ...r,
          docType: 'GPS'
        })
      })

      ;(data.expiringRecords.nationalPermit || []).forEach(r => {
        records.push({
          ...r,
          docType: 'National Permit',
          validTo: r.permitExpiryDate
        })
      })

      ;(data.expiringRecords.cgPermit || []).forEach(r => {
        records.push({
          ...r,
          docType: 'State Permit',
          validTo: r.permitExpiryDate
        })
      })

      ;(data.expiringRecords.busPermit || []).forEach(r => {
        records.push({
          ...r,
          docType: 'Bus Permit',
          validTo: r.permitExpiryDate
        })
      })

      setAllRecords(records)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const docTypeOrder = {
    'Tax': 1,
    'Fitness': 2,
    'PUC': 3,
    'GPS': 4,
    'National Permit': 5,
    'State Permit': 6,
    'Bus Permit': 7
  }

  const filteredRecords = useMemo(() => {
    let records = [...allRecords]

    if (filter !== 'all') {
      const filterMap = {
        'fitness': 'Fitness',
        'tax': 'Tax',
        'puc': 'PUC',
        'gps': 'GPS',
        'permit': ['National Permit', 'State Permit', 'Bus Permit']
      }
      const targetType = filterMap[filter]
      if (Array.isArray(targetType)) {
        records = records.filter(r => targetType.includes(r.docType))
      } else {
        records = records.filter(r => r.docType === targetType)
      }
    }

    return records.sort((a, b) => {
      const orderA = docTypeOrder[a.docType] || 999
      const orderB = docTypeOrder[b.docType] || 999
      if (orderA !== orderB) return orderA - orderB
      return new Date(a.validTo) - new Date(b.validTo)
    })
  }, [allRecords, filter])

  const getExpiryBadge = (validTo) => {
    const days = getDaysRemaining(validTo)
    if (days === null) return null

    if (days < 0) {
      return <span className='px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700'>Expired</span>
    }
    if (days <= 7) {
      return <span className='px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700'>{days}d left</span>
    }
    if (days <= 15) {
      return <span className='px-2 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700'>{days}d left</span>
    }
    return <span className='px-2 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700'>{days}d left</span>
  }

  const getDocTypeBadge = (docType) => {
    const styles = {
      'Tax': 'bg-violet-100 text-violet-700',
      'Fitness': 'bg-red-100 text-red-700',
      'PUC': 'bg-teal-100 text-teal-700',
      'GPS': 'bg-purple-100 text-purple-700',
      'National Permit': 'bg-emerald-100 text-emerald-700',
      'State Permit': 'bg-green-100 text-green-700',
      'Bus Permit': 'bg-amber-100 text-amber-700'
    }
    return styles[docType] || 'bg-gray-100 text-gray-700'
  }

  const filterButtons = [
    { key: 'all', label: 'All' },
    { key: 'tax', label: 'Tax' },
    { key: 'fitness', label: 'Fitness' },
    { key: 'puc', label: 'PUC' },
    { key: 'gps', label: 'GPS' },
    { key: 'permit', label: 'Permit' }
  ]

  const counts = {
    all: allRecords.length,
    tax: allRecords.filter(r => r.docType === 'Tax').length,
    fitness: allRecords.filter(r => r.docType === 'Fitness').length,
    puc: allRecords.filter(r => r.docType === 'PUC').length,
    gps: allRecords.filter(r => r.docType === 'GPS').length,
    permit: allRecords.filter(r => ['National Permit', 'State Permit', 'Bus Permit'].includes(r.docType)).length
  }

  return (
    <div className='h-full overflow-auto p-4'>
      <div className='mb-4'>
        <h2 className='text-lg font-bold text-gray-800 mb-3'>Expiry Soon</h2>
        
        <div className='flex flex-wrap gap-2 mb-3'>
          {filterButtons.map(btn => (
            <button
              key={btn.key}
              onClick={() => setFilter(btn.key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition ${
                filter === btn.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {btn.label} ({counts[btn.key]})
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className='animate-pulse space-y-3'>
          {[...Array(5)].map((_, i) => (
            <div key={i} className='bg-gray-100 h-14 rounded-lg'></div>
          ))}
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className='text-center py-12 bg-white rounded-lg border border-gray-200'>
          <svg className='w-12 h-12 text-green-500 mx-auto mb-3' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
          </svg>
          <p className='text-gray-500 font-medium'>No documents expiring soon</p>
        </div>
      ) : (
        <div className='bg-white rounded-lg border border-gray-200 overflow-hidden'>
          <div className='overflow-x-auto'>
            <table className='w-full'>
              <thead className='bg-gray-50 border-b border-gray-200'>
                <tr>
                  <th className='px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider'>Vehicle No</th>
                  <th className='px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider'>Party Name</th>
                  <th className='px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider'>Doc Type</th>
                  <th className='px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider'>Valid From</th>
                  <th className='px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider'>Valid To</th>
                  <th className='px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider'>Expires</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-gray-200'>
                {filteredRecords.map((record, index) => (
                  <tr key={index} className='hover:bg-gray-50 transition-colors'>
                    <td className='px-4 py-3'>
                      <span className='font-mono font-bold text-sm text-blue-900'>{record.vehicleNumber}</span>
                    </td>
                    <td className='px-4 py-3'>
                      <span className='text-sm text-gray-700'>{record.ownerName || record.partyName || '-'}</span>
                    </td>
                    <td className='px-4 py-3'>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${getDocTypeBadge(record.docType)}`}>
                        {record.docType}
                      </span>
                    </td>
                    <td className='px-4 py-3'>
                      <span className='text-sm text-gray-600'>{formatDate(record.validFrom)}</span>
                    </td>
                    <td className='px-4 py-3'>
                      <span className='text-sm text-gray-600'>{formatDate(record.validTo)}</span>
                    </td>
                    <td className='px-4 py-3'>
                      {getExpiryBadge(record.validTo)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default VahanDashboard