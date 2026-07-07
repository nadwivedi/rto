import { useState, useEffect, useMemo } from 'react'
import axios from 'axios'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080'

const getTypeBadge = (type) => {
  const styles = {
    'DL': 'bg-indigo-100 text-indigo-700',
    'Transfer': 'bg-orange-100 text-orange-700',
    'NOC': 'bg-emerald-100 text-emerald-700',
    'Renewal': 'bg-sky-100 text-sky-700',
    'HPA': 'bg-rose-100 text-rose-700',
    'HPT': 'bg-pink-100 text-pink-700',
  }
  return styles[type] || 'bg-gray-100 text-gray-700'
}

const SarthiDashboard = ({ refreshKey = 0 }) => {
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [allRecords, setAllRecords] = useState([])

  useEffect(() => {
    fetchRecentlyAdded()
  }, [refreshKey])

  const fetchRecentlyAdded = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${BACKEND_URL}/api/sarthi-dashboard/recently-added`, { withCredentials: true })
      if (response.data.success) {
        setAllRecords(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching recently added records:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredRecords = useMemo(() => {
    if (filter === 'all') return allRecords
    return allRecords.filter(r => r.type === filter)
  }, [allRecords, filter])

  const filterButtons = [
    { key: 'all', label: 'All' },
    { key: 'DL', label: 'DL' },
    { key: 'Transfer', label: 'Transfer' },
    { key: 'NOC', label: 'NOC' },
    { key: 'Renewal', label: 'Renewal' },
    { key: 'HPA', label: 'HPA' },
    { key: 'HPT', label: 'HPT' },
  ]

  const counts = {
    all: allRecords.length,
    DL: allRecords.filter(r => r.type === 'DL').length,
    Transfer: allRecords.filter(r => r.type === 'Transfer').length,
    NOC: allRecords.filter(r => r.type === 'NOC').length,
    Renewal: allRecords.filter(r => r.type === 'Renewal').length,
    HPA: allRecords.filter(r => r.type === 'HPA').length,
    HPT: allRecords.filter(r => r.type === 'HPT').length,
  }

  return (
    <div className='flex-1 flex flex-col p-1 sm:p-3 overflow-auto'>
      <div className='flex flex-col gap-3 flex-1 min-h-0'>
        <section className='min-w-0 flex flex-col flex-1'>
          <div className='mb-3 grid grid-cols-1 items-center gap-3 text-center md:grid-cols-[auto_1fr]'>
            <h2 className='text-left text-base font-bold text-gray-800 lg:text-[15px] xl:text-base 2xl:text-lg'>Recently Added</h2>

            <div className='flex flex-wrap justify-center gap-1 lg:gap-1 xl:gap-1.5 2xl:gap-2'>
              {filterButtons.map(btn => (
                <button
                  key={btn.key}
                  onClick={() => setFilter(btn.key)}
                  className={`rounded-md px-2 py-0.5 text-[10px] font-semibold transition lg:text-[10px] xl:px-2.5 xl:py-1 xl:text-[11px] 2xl:text-xs ${
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
            <div className='mt-4 animate-pulse space-y-2'>
              {[...Array(5)].map((_, i) => (
                <div key={i} className='h-12 rounded-lg bg-gray-100'></div>
              ))}
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className='mt-4 rounded-lg border border-gray-200 bg-white py-10 text-center'>
              <svg className='mx-auto mb-3 h-10 w-10 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4' />
              </svg>
              <p className='font-medium text-gray-500'>No recently added records</p>
            </div>
          ) : (
            <div className='mt-2 sm:mt-4 flex-1 min-h-0 overflow-hidden rounded-lg border border-gray-200 bg-white'>
              <div className='h-full overflow-auto'>
                <table className='w-full table-fixed h-full'>
                  <thead className='border-b border-gray-200 bg-gray-50'>
                    <tr>
                      <th className='w-2/5 px-2 py-2 sm:px-3 lg:px-4 lg:py-3 text-left text-[11px] lg:text-xs xl:text-sm font-semibold uppercase tracking-wider text-gray-600'>Customer Detail</th>
                      <th className='w-20 px-2 py-2 sm:px-3 lg:px-4 lg:py-3 text-left text-[11px] lg:text-xs xl:text-sm font-semibold uppercase tracking-wider text-gray-600'>Work Type</th>
                      <th className='w-24 px-2 py-2 sm:px-3 lg:px-4 lg:py-3 text-left text-[11px] lg:text-xs xl:text-sm font-semibold uppercase tracking-wider text-gray-600'>Date</th>
                      <th className='w-24 px-2 py-2 sm:px-3 lg:px-4 lg:py-3 text-right text-[11px] lg:text-xs xl:text-sm font-semibold uppercase tracking-wider text-gray-600'>Total Fee</th>
                      <th className='w-24 px-2 py-2 sm:px-3 lg:px-4 lg:py-3 text-right text-[11px] lg:text-xs xl:text-sm font-semibold uppercase tracking-wider text-gray-600'>Paid</th>
                      <th className='w-24 px-2 py-2 sm:px-3 lg:px-4 lg:py-3 text-right text-[11px] lg:text-xs xl:text-sm font-semibold uppercase tracking-wider text-gray-600'>Balance</th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-gray-200'>
                    {filteredRecords.map((record, index) => (
                      <tr key={record._id || index} className='transition-colors hover:bg-gray-50'>
                        <td className='px-2 py-2 sm:px-3 lg:px-4 lg:py-3'>
                          <div className='space-y-0.5'>
                            <div className='text-[10px] sm:text-xs font-semibold text-gray-800'>{record.customerName || '-'}</div>
                            {record.vehicleNumber && (
                              <div className='font-mono text-[10px] sm:text-xs font-bold text-blue-900'>{record.vehicleNumber}</div>
                            )}
                          </div>
                        </td>
                        <td className='px-2 py-2 sm:px-3 lg:px-4 lg:py-3'>
                          <span className={`rounded px-1.5 py-0.5 text-[9px] sm:text-[11px] lg:text-xs xl:text-sm font-semibold ${getTypeBadge(record.type)}`}>
                            {record.type}
                          </span>
                        </td>
                        <td className='px-2 py-2 sm:px-3 lg:px-4 lg:py-3'>
                          <div className='text-[10px] sm:text-xs font-semibold text-gray-700'>{record.date || '-'}</div>
                        </td>
                        <td className='px-2 py-2 sm:px-3 lg:px-4 lg:py-3 text-right'>
                          <div className='text-[10px] sm:text-xs font-semibold text-gray-800'>₹{(record.totalFee || 0).toLocaleString('en-IN')}</div>
                        </td>
                        <td className='px-2 py-2 sm:px-3 lg:px-4 lg:py-3 text-right'>
                          <div className='text-[10px] sm:text-xs font-semibold text-emerald-600'>₹{(record.paid || 0).toLocaleString('en-IN')}</div>
                        </td>
                        <td className='px-2 py-2 sm:px-3 lg:px-4 lg:py-3 text-right'>
                          <div className={`text-[10px] sm:text-xs font-semibold ${(record.balance || 0) > 0 ? 'text-orange-600' : 'text-gray-500'}`}>₹{(record.balance || 0).toLocaleString('en-IN')}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

export default SarthiDashboard
