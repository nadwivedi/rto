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

const formatDateTime = (value) => {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null

  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()

  let hours = date.getHours()
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const ampm = hours >= 12 ? 'PM' : 'AM'
  hours = hours % 12
  hours = hours ? hours : 12
  const strHours = String(hours).padStart(2, '0')

  return `${day}/${month}/${year} ${strHours}:${minutes} ${ampm}`
}

const getDateTime = (date) => parseAppDate(date)?.getTime() || Number.MAX_SAFE_INTEGER

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
          docType: 'Road Tax',
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

      ;(data.expiringRecords.insurance || []).forEach(r => {
        records.push({
          ...r,
          docType: 'Insurance',
          ownerName: r.policyHolderName
        })
      })

      ;(data.expiringRecords.insuranceThirdParty || []).forEach(r => {
        records.push({
          ...r,
          docType: 'Insurance (Third Party)',
          ownerName: r.policyHolderName,
          validFrom: r.thirdPartyValidFrom,
          validTo: r.thirdPartyValidTo
        })
      })

      ;(data.expiringRecords.nationalPermit || []).forEach(r => {
        if (r.partAStatus === 'expiring_soon') {
          records.push({
            ...r,
            docType: 'NP (Part A)',
            ownerName: r.permitHolder || r.partyName,
            validFrom: r.partAValidFrom,
            validTo: r.partAValidTo
          })
        }
        if (r.partBStatus === 'expiring_soon') {
          records.push({
            ...r,
            docType: 'NP (Part B)',
            ownerName: r.permitHolder || r.partyName,
            validFrom: r.partBValidFrom,
            validTo: r.partBValidTo
          })
        }
        if (!r.partAStatus && !r.partBStatus) {
          records.push({
            ...r,
            docType: 'National Permit',
            ownerName: r.permitHolder || r.partyName,
            validFrom: r.validFrom || r.partAValidFrom,
            validTo: r.validTo || r.permitExpiryDate || r.partAValidTo
          })
        }
      })

      ;(data.expiringRecords.cgPermit || []).forEach(r => {
        records.push({
          ...r,
          docType: 'State Permit',
          ownerName: r.permitHolder || r.partyName,
          validFrom: r.validFrom,
          validTo: r.validTo || r.permitExpiryDate
        })
      })

      ;(data.expiringRecords.busPermit || []).forEach(r => {
        records.push({
          ...r,
          docType: 'Bus Permit',
          ownerName: r.permitHolder || r.partyName,
          validFrom: r.validFrom,
          validTo: r.validTo || r.permitExpiryDate
        })
      })

      ;(data.expiringRecords.temporaryPermit || []).forEach(r => {
        records.push({
          ...r,
          docType: 'Temp Permit',
          ownerName: r.permitHolder || r.partyName,
          validTo: r.validTo
        })
      })

      ;(data.expiringRecords.temporaryPermitOtherState || []).forEach(r => {
        records.push({
          ...r,
          docType: 'Temp Permit Other',
          ownerName: r.permitHolder || r.partyName,
          vehicleNumber: r.vehicleNo || r.vehicleNumber,
          validTo: r.validTo
        })
      })

      const nonExpiredRecords = records.filter(r => {
        const days = getDaysRemaining(r.validTo)
        return days !== null && days >= 0
      })

      setAllRecords(nonExpiredRecords)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const docTypeOrder = {
    'Road Tax': 1,
    'Fitness': 2,
    'PUC': 3,
    'GPS': 4,
    'National Permit': 5,
    'NP (Part A)': 6,
    'NP (Part B)': 7,
    'State Permit': 8,
    'Bus Permit': 9,
    'Temp Permit': 10,
    'Temp Permit Other': 11,
    'Insurance': 12,
    'Insurance (Third Party)': 13
  }

  const filteredRecords = useMemo(() => {
    let records = [...allRecords]

    if (filter !== 'all') {
      const filterMap = {
        'fitness': 'Fitness',
        'tax': 'Road Tax',
        'puc': 'PUC',
        'gps': 'GPS',
        'insurance': ['Insurance', 'Insurance (Third Party)'],
        'permit': ['National Permit', 'NP (Part A)', 'NP (Part B)', 'State Permit', 'Bus Permit', 'Temp Permit', 'Temp Permit Other']
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
      'Road Tax': 'bg-violet-100 text-violet-700',
      'Fitness': 'bg-red-100 text-red-700',
      'PUC': 'bg-teal-100 text-teal-700',
      'GPS': 'bg-purple-100 text-purple-700',
      'National Permit': 'bg-emerald-100 text-emerald-700',
      'NP (Part A)': 'bg-emerald-100 text-emerald-700',
      'NP (Part B)': 'bg-emerald-100 text-emerald-700',
      'State Permit': 'bg-green-100 text-green-700',
      'Bus Permit': 'bg-amber-100 text-amber-700',
      'Temp Permit': 'bg-yellow-100 text-yellow-700',
      'Temp Permit Other': 'bg-orange-100 text-orange-700',
      'Insurance': 'bg-blue-100 text-blue-700',
      'Insurance (Third Party)': 'bg-purple-100 text-purple-700'
    }
    return styles[docType] || 'bg-gray-100 text-gray-700'
  }

  // Compact WhatsApp status for the mobile cards
  const renderWhatsAppBadge = (log) => {
    const notSent = <span className='rounded bg-gray-100 px-1.5 py-0.5 text-[11px] font-semibold text-gray-500'>Not Sent</span>
    if (!log) return notSent
    const map = {
      sent: { cls: 'bg-emerald-100 text-emerald-700', label: '✓ Sent', time: log.sentAt || log.createdAt },
      pending: { cls: 'bg-amber-100 text-amber-700', label: 'Pending', time: log.scheduledFor || log.createdAt },
      failed: { cls: 'bg-red-100 text-red-700', label: '✕ Failed', time: log.createdAt }
    }
    const item = map[log.status]
    if (!item) return notSent
    return (
      <span className='flex items-center gap-1.5'>
        <span className='text-[10px] font-medium text-gray-500'>{formatDateTime(item.time) || '-'}</span>
        <span className={`rounded px-1.5 py-0.5 text-[11px] font-semibold ${item.cls}`}>{item.label}</span>
      </span>
    )
  }

  const filterButtons = [
    { key: 'all', label: 'All' },
    { key: 'tax', label: 'Road Tax' },
    { key: 'fitness', label: 'Fitness' },
    { key: 'puc', label: 'PUC' },
    { key: 'gps', label: 'GPS' },
    { key: 'insurance', label: 'Insurance' },
    { key: 'permit', label: 'Permit' }
  ]

  const counts = {
    all: allRecords.length,
    tax: allRecords.filter(r => r.docType === 'Road Tax').length,
    fitness: allRecords.filter(r => r.docType === 'Fitness').length,
    puc: allRecords.filter(r => r.docType === 'PUC').length,
    gps: allRecords.filter(r => r.docType === 'GPS').length,
    insurance: allRecords.filter(r => r.docType === 'Insurance' || r.docType === 'Insurance (Third Party)').length,
    permit: allRecords.filter(r => ['National Permit', 'NP (Part A)', 'NP (Part B)', 'State Permit', 'Bus Permit', 'Temp Permit', 'Temp Permit Other'].includes(r.docType)).length
  }

  return (
    <div className='flex-1 flex flex-col p-2 sm:p-3 overflow-auto'>
      <div className='flex flex-col gap-3 flex-1 min-h-0'>
        <section className='min-w-0 flex flex-col flex-1'>
          <div className='mb-3 grid grid-cols-1 items-center gap-3 text-center md:grid-cols-[auto_1fr]'>
            <h2 className='text-left text-base font-bold text-gray-800 lg:text-[15px] xl:text-base 2xl:text-lg'>Expiry Soon</h2>

            <div className='flex flex-wrap justify-center gap-1 lg:gap-1 xl:gap-1.5 2xl:gap-2'>
              {filterButtons.map(btn => (
                <button
                  key={btn.key}
                  onClick={() => setFilter(btn.key)}
                  className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition sm:px-2 sm:py-0.5 sm:text-[10px] lg:text-[10px] xl:px-2.5 xl:py-1 xl:text-[11px] 2xl:text-xs ${
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
              <svg className='mx-auto mb-3 h-10 w-10 text-green-500' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
              </svg>
              <p className='font-medium text-gray-500'>No documents expiring soon</p>
            </div>
          ) : (
            <>
            {/* Mobile: compact card list */}
            <div className='mt-2 space-y-1.5 sm:hidden'>
              {filteredRecords.map((record, index) => {
                const days = getDaysRemaining(record.validTo)
                return (
                  <div key={index} className='rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 shadow-sm'>
                    <div className='flex items-center justify-between gap-2'>
                      <div className='min-w-0 leading-tight'>
                        <div className='truncate text-[13px] font-semibold text-gray-800'>{record.ownerName || record.partyName || '-'}</div>
                        <div className='font-mono text-[11px] font-bold text-blue-900'>{record.vehicleNumber || '-'}</div>
                      </div>
                      <span className={`shrink-0 rounded px-1.5 py-0.5 text-[11px] font-semibold ${getDocTypeBadge(record.docType)}`}>{record.docType}</span>
                    </div>
                    <div className='mt-1 flex items-center justify-between gap-2 text-[11px] font-semibold'>
                      <span className='min-w-0 truncate'>
                        <span className='text-green-700'>{formatDate(record.validFrom)}</span>
                        <span className='mx-1 text-gray-400'>→</span>
                        <span className='text-red-700'>{formatDate(record.validTo)}</span>
                      </span>
                      <span className={`shrink-0 font-bold ${days !== null && days < 0 ? 'text-red-600' : 'text-orange-600'}`}>{formatExpiryText(record.validTo)}</span>
                    </div>
                    <div className='mt-1 flex items-center justify-between gap-2 border-t border-gray-100 pt-1'>
                      <span className='text-[10px] font-semibold uppercase text-gray-400'>WhatsApp</span>
                      {renderWhatsAppBadge(record.whatsappLog)}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Tablet / desktop: table */}
            <div className='mt-2 sm:mt-4 flex-1 min-h-0 overflow-hidden rounded-lg border border-gray-200 bg-white hidden sm:block'>
              <div className='h-full overflow-auto'>
                <table className='w-full table-fixed'>
                  <thead className='border-b border-gray-200 bg-gray-50'>
                    <tr>
                      <th className='px-2 py-2 sm:px-3 lg:px-4 lg:py-3 text-left text-[11px] lg:text-xs xl:text-sm font-semibold uppercase tracking-wider text-gray-600'>Party / Vehicle</th>
                      <th className='px-2 py-2 sm:px-3 lg:px-4 lg:py-3 text-left text-[11px] lg:text-xs xl:text-sm font-semibold uppercase tracking-wider text-gray-600'>Doc</th>
                      <th className='px-2 py-2 sm:px-3 lg:px-4 lg:py-3 text-left text-[11px] lg:text-xs xl:text-sm font-semibold uppercase tracking-wider text-gray-600'>Validity</th>
                      <th className='px-2 py-2 sm:px-3 lg:px-4 lg:py-3 text-left text-[11px] lg:text-xs xl:text-sm font-semibold uppercase tracking-wider text-gray-600'>Days Left</th>
                      <th className='px-2 py-2 sm:px-3 lg:px-4 lg:py-3 text-left text-[11px] lg:text-xs xl:text-sm font-semibold uppercase tracking-wider text-gray-600'>WhatsApp Alert</th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-gray-200'>
                    {filteredRecords.map((record, index) => (
                      <tr key={index} className='transition-colors hover:bg-gray-50'>
                        <td className='px-2 py-2 sm:px-3 lg:px-4 lg:py-3'>
                          <div className='space-y-0.5'>
                            <div className='text-[10px] sm:text-xs font-semibold text-gray-800'>{record.ownerName || record.partyName || '-'}</div>
                            <div className='font-mono text-[10px] sm:text-xs font-bold text-blue-900'>{record.vehicleNumber || '-'}</div>
                          </div>
                        </td>
                        <td className='px-2 py-2 sm:px-3 lg:px-4 lg:py-3'>
                          <span className={`rounded px-1.5 py-0.5 text-[9px] sm:text-[11px] lg:text-xs xl:text-sm font-semibold ${getDocTypeBadge(record.docType)}`}>
                            {record.docType}
                          </span>
                        </td>
                        <td className='px-2 py-2 sm:px-3 lg:px-4 lg:py-3'>
                          <div className='space-y-0.5 text-[10px] sm:text-xs font-semibold'>
                            <div className='flex items-baseline'>
                              <span className='w-14 shrink-0 text-gray-900'>From:</span>
                              <span className='text-green-700'>{formatDate(record.validFrom)}</span>
                            </div>
                            <div className='flex items-baseline'>
                              <span className='w-14 shrink-0 text-gray-900'>To:</span>
                              <span className='text-red-700'>{formatDate(record.validTo)}</span>
                            </div>
                          </div>
                        </td>
                        <td className='px-2 py-2 sm:px-3 lg:px-4 lg:py-3'>
                          <span className={`text-[10px] sm:text-[11px] lg:text-xs xl:text-sm font-bold ${getDaysRemaining(record.validTo) < 0 ? 'text-red-600' : 'text-orange-600'}`}>
                            {formatExpiryText(record.validTo)}
                          </span>
                        </td>
                        <td className='px-2 py-2 sm:px-3 lg:px-4 lg:py-3'>
                          {record.whatsappLog?.status === 'sent' && (
                            <div className='space-y-0.5'>
                              <span className='inline-flex items-center gap-1 rounded bg-emerald-100 px-1.5 py-0.5 text-[9px] sm:text-[11px] lg:text-xs font-semibold text-emerald-700'>
                                <svg className='w-3 h-3' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
                                </svg>
                                Sent
                              </span>
                              <div className='text-[9px] sm:text-[10px] text-gray-500 font-medium'>
                                {formatDateTime(record.whatsappLog.sentAt || record.whatsappLog.createdAt) || '-'}
                              </div>
                            </div>
                          )}
                          {record.whatsappLog?.status === 'pending' && (
                            <div className='space-y-0.5'>
                              <span className='inline-flex items-center gap-1 rounded bg-amber-100 px-1.5 py-0.5 text-[9px] sm:text-[11px] lg:text-xs font-semibold text-amber-700'>
                                <svg className='w-3 h-3 animate-spin' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                  <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4'></circle>
                                  <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z'></path>
                                </svg>
                                Pending
                              </span>
                              <div className='text-[9px] sm:text-[10px] text-gray-500 font-medium'>
                                {formatDateTime(record.whatsappLog.scheduledFor || record.whatsappLog.createdAt) || '-'}
                              </div>
                            </div>
                          )}
                          {record.whatsappLog?.status === 'failed' && (
                            <div className='space-y-0.5'>
                              <span className='inline-flex items-center gap-1 rounded bg-red-100 px-1.5 py-0.5 text-[9px] sm:text-[11px] lg:text-xs font-semibold text-red-700' title={record.whatsappLog.errorReason || 'Failed to send'}>
                                <svg className='w-3 h-3' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                                </svg>
                                Failed
                              </span>
                              <div className='text-[9px] sm:text-[10px] text-red-500 font-medium truncate max-w-[120px]' title={record.whatsappLog.errorReason}>
                                {formatDateTime(record.whatsappLog.createdAt) || '-'}
                              </div>
                            </div>
                          )}
                          {!record.whatsappLog && (
                            <div className='space-y-0.5'>
                              <span className='inline-flex items-center rounded bg-gray-100 px-1.5 py-0.5 text-[9px] sm:text-[11px] lg:text-xs font-semibold text-gray-500'>
                                Not Sent
                              </span>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            </>
          )}
        </section>
      </div>
    </div>
  )
}

export default VahanDashboard
