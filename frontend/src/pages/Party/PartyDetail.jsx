import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { getTheme } from '../../context/ThemeContext'

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'

const PartyDetail = () => {
  const { partyId } = useParams()
  const navigate = useNavigate()
  const theme = getTheme()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)
  const [showAllVehicles, setShowAllVehicles] = useState(false)
  const [showAllWork, setShowAllWork] = useState(false)
  const [showAllPending, setShowAllPending] = useState(false)

  useEffect(() => {
    fetchPartyData()
  }, [partyId])

  const fetchPartyData = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${API_URL}/api/parties/${partyId}/all-work`, {
        withCredentials: true
      })
      if (response.data.success) {
        setData(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching party data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'

    const rawValue = String(dateString).trim()
    const numericMatch = rawValue.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/)
    const parsedDate = numericMatch
      ? new Date(Number(numericMatch[3]), Number(numericMatch[2]) - 1, Number(numericMatch[1]))
      : new Date(rawValue)

    if (Number.isNaN(parsedDate.getTime())) return '-'

    return parsedDate.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const getDateTime = (dateString) => {
    if (!dateString) return 0

    const rawValue = String(dateString).trim()
    const numericMatch = rawValue.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/)
    const parsedDate = numericMatch
      ? new Date(Number(numericMatch[3]), Number(numericMatch[2]) - 1, Number(numericMatch[1]))
      : new Date(rawValue)

    return Number.isNaN(parsedDate.getTime()) ? 0 : parsedDate.getTime()
  }

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '-'
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const getWorkDate = (item) => (
    item.taxFrom ||
    item.validFrom ||
    item.partBValidFrom ||
    item.partAValidFrom ||
    item.issueDate ||
    item.applicationDate ||
    item.installationDate ||
    item.createdAt
  )

  const normalizeWorkItem = (item, type, typeColor) => {
    const totalAmount = Number(item.totalAmount ?? item.totalFee ?? 0)
    const receivedAmount = Number(item.paidAmount ?? item.paid ?? 0)
    const balanceAmount = Number(item.balanceAmount ?? item.balance ?? Math.max(totalAmount - receivedAmount, 0))

    return {
      ...item,
      type,
      typeColor,
      vehicleNumber: item.vehicleNumber || item.vehicleNo || '-',
      dateField: getWorkDate(item),
      totalAmount,
      receivedAmount,
      balanceAmount,
      referenceNo: item.receiptNo || item.permitNumber || item.authNumber || item.policyNumber || ''
    }
  }

  // Get all work records combined as party ledger rows
  const getAllWork = () => {
    if (!data?.work) return []
    const allWork = []

    data.work.moneyReceived?.forEach(item => {
      const amount = Number(item.amount || 0)
      allWork.push({
        ...item,
        type: 'Money Received',
        typeColor: 'green',
        vehicleNumber: '-',
        dateField: item.moneyReceivedDate || item.createdAt,
        totalAmount: 0,
        receivedAmount: amount,
        balanceAmount: -amount,
        referenceNo: ''
      })
    })

    data.work.tax?.forEach(item => {
      allWork.push(normalizeWorkItem(item, 'Tax', 'blue'))
    })

    data.work.fitness?.forEach(item => {
      allWork.push(normalizeWorkItem(item, 'Fitness', 'green'))
    })

    data.work.insurance?.forEach(item => {
      allWork.push(normalizeWorkItem(item, 'Insurance', 'purple'))
    })

    data.work.puc?.forEach(item => {
      allWork.push(normalizeWorkItem(item, 'PUC', 'orange'))
    })

    data.work.gps?.forEach(item => {
      allWork.push(normalizeWorkItem(item, 'GPS', 'cyan'))
    })

    data.work.cgPermit?.forEach(item => {
      allWork.push(normalizeWorkItem(item, 'CG Permit', 'red'))
    })

    data.work.nationalPermit?.forEach(item => {
      allWork.push(normalizeWorkItem(item, 'National Permit', 'indigo'))
    })

    data.work.busPermit?.forEach(item => {
      allWork.push(normalizeWorkItem(item, 'Bus Permit', 'pink'))
    })

    data.work.temporaryPermit?.forEach(item => {
      allWork.push(normalizeWorkItem(item, 'Temporary Permit', 'amber'))
    })

    data.work.temporaryPermitOtherState?.forEach(item => {
      allWork.push(normalizeWorkItem(item, 'Temp Permit (OS)', 'teal'))
    })

    let runningBalance = 0

    const chronologicalRows = allWork
      .sort((a, b) => getDateTime(a.dateField || a.createdAt) - getDateTime(b.dateField || b.createdAt))
      .map((item) => {
        runningBalance += item.balanceAmount
        return {
          ...item,
          runningBalance
        }
      })

    return chronologicalRows.reverse()
  }

  // Get all pending payments (balance > 0)
  const getPendingPayments = () => {
    if (!data?.work) return []
    const pending = []

    data.work.tax?.forEach(item => {
      if (item.balanceAmount > 0) {
        pending.push({ ...item, type: 'Tax', typeColor: 'blue' })
      }
    })

    data.work.fitness?.forEach(item => {
      if (item.balanceAmount > 0) {
        pending.push({ ...item, type: 'Fitness', typeColor: 'green' })
      }
    })

    data.work.insurance?.forEach(item => {
      if (item.balanceAmount > 0) {
        pending.push({ ...item, type: 'Insurance', typeColor: 'purple' })
      }
    })

    data.work.puc?.forEach(item => {
      if (item.balanceAmount > 0) {
        pending.push({ ...item, type: 'PUC', typeColor: 'orange' })
      }
    })

    data.work.gps?.forEach(item => {
      if (item.balanceAmount > 0) {
        pending.push({ ...item, type: 'GPS', typeColor: 'cyan' })
      }
    })

    data.work.cgPermit?.forEach(item => {
      if (item.balanceAmount > 0) {
        pending.push({ ...item, type: 'CG Permit', typeColor: 'red' })
      }
    })

    data.work.nationalPermit?.forEach(item => {
      if (item.balanceAmount > 0) {
        pending.push({ ...item, type: 'National Permit', typeColor: 'indigo' })
      }
    })

    data.work.busPermit?.forEach(item => {
      if (item.balanceAmount > 0) {
        pending.push({ ...item, type: 'Bus Permit', typeColor: 'pink' })
      }
    })

    data.work.temporaryPermit?.forEach(item => {
      if (item.balanceAmount > 0) {
        pending.push({ ...item, type: 'Temporary Permit', typeColor: 'amber' })
      }
    })

    data.work.temporaryPermitOtherState?.forEach(item => {
      if (item.balanceAmount > 0) {
        pending.push({ ...item, type: 'Temp Permit (OS)', typeColor: 'teal' })
      }
    })

    return pending.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }

  const getTypeColorClass = (color) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-800',
      green: 'bg-green-100 text-green-800',
      purple: 'bg-purple-100 text-purple-800',
      orange: 'bg-orange-100 text-orange-800',
      cyan: 'bg-cyan-100 text-cyan-800',
      red: 'bg-red-100 text-red-800',
      indigo: 'bg-indigo-100 text-indigo-800',
      pink: 'bg-pink-100 text-pink-800',
      amber: 'bg-amber-100 text-amber-800',
      teal: 'bg-teal-100 text-teal-800'
    }
    return colors[color] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-pink-50 pt-4 lg:pt-6'>
        <div className='w-full px-3 md:px-4 lg:px-6 py-8'>
          <div className='flex items-center justify-center h-64'>
            <div className='text-center'>
              <svg className='animate-spin mx-auto h-8 w-8 mb-3 text-purple-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z' />
              </svg>
              <p className='text-sm font-semibold text-gray-600'>Loading party details...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-pink-50 pt-4 lg:pt-6'>
        <div className='w-full px-3 md:px-4 lg:px-6 py-8'>
          <div className='text-center py-12'>
            <p className='text-gray-600'>Party not found</p>
            <button
              onClick={() => navigate('/parties')}
              className='mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700'
            >
              Back to Parties
            </button>
          </div>
        </div>
      </div>
    )
  }

  const pendingPayments = getPendingPayments()
  const allWork = getAllWork()
  const ledgerTotals = allWork.reduce(
    (totals, item) => ({
      total: totals.total + (item.totalAmount || 0),
      paid: totals.paid + (item.receivedAmount || 0),
      balance: totals.balance + (item.balanceAmount || 0)
    }),
    { total: 0, paid: 0, balance: 0 }
  )
  const totalPending = ledgerTotals.balance
  const vehicles = data.vehicles || []

  const displayedVehicles = showAllVehicles ? vehicles : vehicles.slice(0, 5)
  const displayedWork = allWork
  const displayedPending = showAllPending ? pendingPayments : pendingPayments.slice(0, 5)

  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-pink-50'>
      <div className='w-full px-3 md:px-4 lg:px-6 pt-4 lg:pt-6 pb-8'>
        {/* Party Header */}
        <div className='mb-4'>
          <h1 className='mb-2 truncate text-xl font-bold text-gray-900'>{data.party?.partyName}</h1>

          {/* Summary Cards */}
          <div className='bg-white rounded-2xl shadow-lg border border-gray-200 p-4'>
            <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:items-stretch'>
              <div className='bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl px-3 py-2 border border-blue-200'>
                <p className='text-[10px] text-blue-600 font-bold uppercase'>Total Work</p>
                <p className='truncate text-lg font-bold text-blue-700'>{allWork.length}</p>
              </div>
              <div className='bg-gradient-to-br from-green-50 to-green-100 rounded-xl px-3 py-2 border border-green-200'>
                <p className='text-[10px] text-green-600 font-bold uppercase'>Total Paid</p>
                <p className='truncate text-lg font-bold text-green-700'>{formatCurrency(ledgerTotals.paid)}</p>
              </div>
              <div className='bg-gradient-to-br from-red-50 to-red-100 rounded-xl px-3 py-2 border border-red-200'>
                <p className='text-[10px] text-red-600 font-bold uppercase'>Total Amount</p>
                <p className='truncate text-lg font-bold text-red-700'>{formatCurrency(ledgerTotals.total)}</p>
              </div>
              <div className='bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl px-3 py-2 border border-orange-200'>
                <p className='text-[10px] text-orange-600 font-bold uppercase'>Total Balance</p>
                <p className='truncate text-lg font-bold text-orange-700'>{formatCurrency(totalPending)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Vehicles & Pending Payments Row */}
        <div className='hidden'>
          {/* Vehicles Section */}
          <div className='bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden'>
            <div className='px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-3'>
                  <div className='w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center'>
                    <svg className='w-5 h-5 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z' />
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0' />
                    </svg>
                  </div>
                  <div>
                    <h2 className='text-lg font-bold text-gray-900'>Vehicles</h2>
                    <p className='text-xs text-gray-600'>{vehicles.length} vehicles registered</p>
                  </div>
                </div>
              </div>
            </div>

            <div className='p-4'>
              {vehicles.length === 0 ? (
                <div className='text-center py-8'>
                  <p className='text-sm text-gray-600'>No vehicles found for this party.</p>
                </div>
              ) : (
                <>
                  <div className='overflow-x-auto'>
                    <table className='w-full'>
                      <thead className={theme.tableHeader}>
                        <tr>
                          <th className='px-3 py-2 text-left text-[10px] font-bold text-white uppercase'>Vehicle No.</th>
                          <th className='px-3 py-2 text-left text-[10px] font-bold text-white uppercase'>Owner</th>
                          <th className='px-3 py-2 text-left text-[10px] font-bold text-white uppercase'>Type</th>
                        </tr>
                      </thead>
                      <tbody className='divide-y divide-gray-200'>
                        {displayedVehicles.map((vehicle) => (
                          <tr key={vehicle._id} className='hover:bg-gray-50'>
                            <td className='px-3 py-2 text-xs font-bold text-gray-900'>{vehicle.registrationNumber}</td>
                            <td className='px-3 py-2 text-xs text-gray-700'>{vehicle.ownerName || '-'}</td>
                            <td className='px-3 py-2 text-xs text-gray-700'>{vehicle.vehicleType || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {vehicles.length > 5 && (
                    <div className='mt-4 text-center'>
                      <button
                        onClick={() => setShowAllVehicles(!showAllVehicles)}
                        className='inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-sm font-semibold rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all'
                      >
                        {showAllVehicles ? (
                          <>
                            <span>Show Less</span>
                            <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 15l7-7 7 7' />
                            </svg>
                          </>
                        ) : (
                          <>
                            <span>View All {vehicles.length}</span>
                            <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
                            </svg>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Pending Payments Section */}
          <div className='bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden'>
            <div className='px-6 py-4 bg-gradient-to-r from-red-50 to-orange-50 border-b border-gray-200'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-3'>
                  <div className='w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center'>
                    <svg className='w-5 h-5 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
                    </svg>
                  </div>
                  <div>
                    <h2 className='text-lg font-bold text-gray-900'>Pending Payments</h2>
                    <p className='text-xs text-gray-600'>{pendingPayments.length} pending • <span className='font-bold text-red-600'>{formatCurrency(totalPending)}</span></p>
                  </div>
                </div>
              </div>
            </div>

            <div className='p-4'>
              {pendingPayments.length === 0 ? (
                <div className='text-center py-8'>
                  <svg className='mx-auto h-12 w-12 text-green-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' />
                  </svg>
                  <p className='mt-2 text-sm font-semibold text-gray-600'>No pending payments!</p>
                  <p className='text-xs text-gray-500'>All payments cleared.</p>
                </div>
              ) : (
                <>
                  <div className='overflow-x-auto'>
                    <table className='w-full'>
                      <thead className={theme.tableHeader}>
                        <tr>
                          <th className='px-3 py-2 text-left text-[10px] font-bold text-white uppercase'>Type</th>
                          <th className='px-3 py-2 text-left text-[10px] font-bold text-white uppercase'>Vehicle</th>
                          <th className='px-3 py-2 text-right text-[10px] font-bold text-white uppercase'>Balance</th>
                        </tr>
                      </thead>
                      <tbody className='divide-y divide-gray-200'>
                        {displayedPending.map((item) => (
                          <tr key={`pending-${item.type}-${item._id}`} className='hover:bg-gray-50'>
                            <td className='px-3 py-2'>
                              <span className={`inline-flex px-2 py-0.5 text-[10px] font-semibold rounded-full ${getTypeColorClass(item.typeColor)}`}>
                                {item.type}
                              </span>
                            </td>
                            <td className='px-3 py-2 text-xs font-semibold text-gray-900'>{item.vehicleNumber}</td>
                            <td className='px-3 py-2 text-xs text-red-600 text-right font-bold'>{formatCurrency(item.balanceAmount)}</td>
                          </tr>
                        ))}
                      </tbody>
                      {showAllPending && pendingPayments.length > 0 && (
                        <tfoot className='bg-gray-100'>
                          <tr>
                            <td colSpan='2' className='px-3 py-2 text-xs font-bold text-gray-900 text-right'>Total:</td>
                            <td className='px-3 py-2 text-xs font-bold text-red-600 text-right'>{formatCurrency(totalPending)}</td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>

                  {pendingPayments.length > 5 && (
                    <div className='mt-4 text-center'>
                      <button
                        onClick={() => setShowAllPending(!showAllPending)}
                        className='inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-orange-500 text-white text-sm font-semibold rounded-lg hover:from-red-600 hover:to-orange-600 transition-all'
                      >
                        {showAllPending ? (
                          <>
                            <span>Show Less</span>
                            <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 15l7-7 7 7' />
                            </svg>
                          </>
                        ) : (
                          <>
                            <span>View All {pendingPayments.length}</span>
                            <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
                            </svg>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* All Work Section */}
        <div className='bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden'>
          <div className='px-6 py-4 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-gray-200'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-3'>
                <div className='w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center'>
                  <svg className='w-5 h-5 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' />
                  </svg>
                </div>
                <div>
                  <h2 className='text-lg font-bold text-gray-900'>Party Ledger</h2>
                  <p className='text-xs text-gray-600'>{allWork.length} records with total, paid, balance, and running balance</p>
                </div>
              </div>
            </div>
          </div>

          <div className='p-4'>
            {allWork.length === 0 ? (
              <div className='text-center py-8'>
                <p className='text-sm text-gray-600'>No work records found for this party.</p>
              </div>
            ) : (
              <>
                <div className='overflow-x-auto'>
                  <table className='w-full'>
                    <thead className={theme.tableHeader}>
                      <tr>
                        <th className='px-4 py-3 text-left text-xs font-bold text-white uppercase'>Type</th>
                        <th className='px-4 py-3 text-left text-xs font-bold text-white uppercase'>Vehicle No.</th>
                        <th className='px-4 py-3 text-left text-xs font-bold text-white uppercase'>Date</th>
                        <th className='px-4 py-3 text-right text-xs font-bold text-white uppercase'>Total</th>
                        <th className='px-4 py-3 text-right text-xs font-bold text-white uppercase'>Received</th>
                        <th className='px-4 py-3 text-right text-xs font-bold text-white uppercase'>Balance</th>
                        <th className='px-4 py-3 text-right text-xs font-bold text-white uppercase'>Running Balance</th>
                      </tr>
                    </thead>
                    <tbody className='divide-y divide-gray-200'>
                      {displayedWork.map((item, index) => (
                        <tr key={`${item.type}-${item._id}`} className='hover:bg-gray-50'>
                          <td className='px-4 py-3'>
                            <div className='flex flex-col gap-1'>
                              <span className={`inline-flex w-fit px-2 py-1 text-xs font-semibold rounded-full ${getTypeColorClass(item.typeColor)}`}>
                                {item.type}
                              </span>
                              {item.referenceNo && (
                                <span className='text-[10px] font-semibold text-gray-500'>{item.referenceNo}</span>
                              )}
                            </div>
                          </td>
                          <td className='px-4 py-3 text-sm font-semibold text-gray-900'>{item.vehicleNumber}</td>
                          <td className='px-4 py-3 text-sm text-gray-600'>{formatDate(item.dateField || item.createdAt)}</td>
                          <td className='px-4 py-3 text-sm text-gray-900 text-right'>{formatCurrency(item.totalAmount)}</td>
                          <td className='px-4 py-3 text-sm text-green-600 text-right font-semibold'>{formatCurrency(item.receivedAmount || 0)}</td>
                          <td className={`px-4 py-3 text-sm text-right font-semibold ${item.balanceAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {formatCurrency(item.balanceAmount)}
                          </td>
                          <td className='px-4 py-3 text-sm text-orange-700 text-right font-black'>{formatCurrency(item.runningBalance)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {false && allWork.length > 5 && (
                  <div className='mt-4 text-center'>
                    <button
                      onClick={() => setShowAllWork(!showAllWork)}
                      className='inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-sm font-semibold rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all'
                    >
                      {showAllWork ? (
                        <>
                          <span>Show Less</span>
                          <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 15l7-7 7 7' />
                          </svg>
                        </>
                      ) : (
                        <>
                          <span>View All {allWork.length} Records</span>
                          <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
                          </svg>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}

export default PartyDetail
