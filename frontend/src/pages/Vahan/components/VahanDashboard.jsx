import { useState, useEffect, useMemo } from 'react'
import axios from 'axios'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL

const parseAppDate = (value) => {
  if (!value) return null

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value
  }

  const rawValue = String(value).trim()
  if (!rawValue) return null

  const numericMatch = rawValue.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/)
  if (numericMatch) {
    const [, day, month, year] = numericMatch
    const parsedDate = new Date(Number(year), Number(month) - 1, Number(day))

    if (
      parsedDate.getFullYear() === Number(year) &&
      parsedDate.getMonth() === Number(month) - 1 &&
      parsedDate.getDate() === Number(day)
    ) {
      return parsedDate
    }

    return null
  }

  const parsedDate = new Date(rawValue)
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate
}

const getDaysRemaining = (date) => {
  const expDate = parseAppDate(date)
  if (!expDate) return null

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  expDate.setHours(0, 0, 0, 0)

  const diffTime = expDate - today
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

const formatDate = (date) => {
  const parsedDate = parseAppDate(date)
  if (!parsedDate) return '-'

  return parsedDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const getDateTime = (date) => parseAppDate(date)?.getTime() || Number.MAX_SAFE_INTEGER

const formatCurrency = (amount) => `₹${Number(amount || 0).toLocaleString('en-IN')}`

const VahanDashboard = () => {
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [allRecords, setAllRecords] = useState([])
  const [pendingLoading, setPendingLoading] = useState(true)
  const [pendingParties, setPendingParties] = useState([])
  const [pendingGrandTotal, setPendingGrandTotal] = useState(0)

  useEffect(() => {
    fetchData()
    fetchPendingBalances()
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
          validFrom: r.validFrom || r.partBValidFrom || r.partAValidFrom,
          validTo: r.validTo || r.permitExpiryDate || r.partBValidTo || r.partAValidTo
        })
      })

      ;(data.expiringRecords.cgPermit || []).forEach(r => {
        records.push({
          ...r,
          docType: 'State Permit',
          validTo: r.validTo || r.permitExpiryDate
        })
      })

      ;(data.expiringRecords.busPermit || []).forEach(r => {
        records.push({
          ...r,
          docType: 'Bus Permit',
          validTo: r.validTo || r.permitExpiryDate
        })
      })

      setAllRecords(records)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPendingBalances = async () => {
    try {
      setPendingLoading(true)
      const response = await axios.get(`${BACKEND_URL}/api/parties/pending-summary`, { withCredentials: true })
      const summary = response.data.data
      const parties = (summary.parties || []).filter(party => Number(party.totalPending || 0) > 0)

      setPendingParties(parties)
      setPendingGrandTotal(summary.grandTotal || 0)
    } catch (error) {
      console.error('Error fetching pending balances:', error)
    } finally {
      setPendingLoading(false)
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
      return getDateTime(a.validTo) - getDateTime(b.validTo)
    })
  }, [allRecords, filter])

  const formatExpiryText = (validTo) => {
    const days = getDaysRemaining(validTo)
    if (days === null) return '-'
    if (days < 0) return 'Expired'
    return `${days}d left`
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
    <div className='h-full overflow-auto p-3'>
      <div className='grid gap-3 xl:grid-cols-[65%_minmax(0,1fr)]'>
        <section className='min-w-0'>
          <div className='mb-3 grid grid-cols-1 items-center gap-3 text-center md:grid-cols-[auto_1fr]'>
            <h2 className='text-left text-base font-bold text-gray-800 lg:text-[15px] xl:text-base 2xl:text-lg'>Expiry Soon</h2>

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
            <div className='animate-pulse space-y-2'>
              {[...Array(5)].map((_, i) => (
                <div key={i} className='h-12 rounded-lg bg-gray-100'></div>
              ))}
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className='rounded-lg border border-gray-200 bg-white py-10 text-center'>
              <svg className='mx-auto mb-3 h-10 w-10 text-green-500' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
              </svg>
              <p className='font-medium text-gray-500'>No documents expiring soon</p>
            </div>
          ) : (
            <div className='overflow-hidden rounded-lg border border-gray-200 bg-white'>
              <div className='overflow-x-auto'>
                <table className='w-full'>
                  <thead className='border-b border-gray-200 bg-gray-50'>
                    <tr>
                      <th className='px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-600'>Party / Vehicle</th>
                      <th className='px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-600'>Doc</th>
                      <th className='px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-600'>Validity</th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-gray-200'>
                    {filteredRecords.map((record, index) => (
                      <tr key={index} className='transition-colors hover:bg-gray-50'>
                        <td className='px-3 py-2'>
                          <div className='space-y-0.5'>
                            <div className='text-xs font-semibold text-gray-800'>{record.ownerName || record.partyName || '-'}</div>
                            <div className='font-mono text-xs font-bold text-blue-900'>{record.vehicleNumber || '-'}</div>
                          </div>
                        </td>
                        <td className='px-3 py-2'>
                          <span className={`rounded px-1.5 py-0.5 text-[11px] font-semibold ${getDocTypeBadge(record.docType)}`}>
                            {record.docType}
                          </span>
                        </td>
                        <td className='px-3 py-2'>
                          <div className='space-y-0.5 text-xs font-semibold'>
                            <div className='flex items-baseline'>
                              <span className='w-9 shrink-0 text-gray-900'>From:</span>
                              <span className='text-green-700'>{formatDate(record.validFrom)}</span>
                            </div>
                            <div className='flex items-baseline'>
                              <span className='w-9 shrink-0 text-gray-900'>To:</span>
                              <span className='text-red-700'>{formatDate(record.validTo)} </span>
                              <span className='text-red-600'>({formatExpiryText(record.validTo)})</span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        <aside className='min-w-0 rounded-lg border border-gray-200 bg-white'>
          <div className='border-b border-gray-200 px-3 py-2'>
            <div className='flex items-center justify-between gap-2'>
              <h2 className='text-base font-bold text-gray-800'>Pending Balance</h2>
              <span className='text-sm font-black text-orange-600'>{formatCurrency(pendingGrandTotal)}</span>
            </div>
          </div>

          {pendingLoading ? (
            <div className='space-y-2 p-3'>
              {[...Array(5)].map((_, index) => (
                <div key={index} className='h-11 animate-pulse rounded-lg bg-gray-100'></div>
              ))}
            </div>
          ) : pendingParties.length === 0 ? (
            <div className='px-3 py-8 text-center text-sm font-medium text-gray-500'>No pending balance</div>
          ) : (
            <div className='max-h-[calc(100vh-13rem)] divide-y divide-gray-100 overflow-y-auto'>
              {pendingParties.map((party) => (
                <div key={party.partyId} className='flex items-center justify-between gap-3 px-3 py-2 hover:bg-orange-50/40'>
                  <div className='min-w-0'>
                    <div className='truncate text-sm font-semibold text-gray-800'>{party.partyName || '-'}</div>
                    <div className='text-xs text-gray-500'>{party.vehicleCount || 0} vehicle{party.vehicleCount === 1 ? '' : 's'}</div>
                  </div>
                  <div className='shrink-0 text-sm font-black text-orange-600'>{formatCurrency(party.totalPending)}</div>
                </div>
              ))}
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}

export default VahanDashboard
