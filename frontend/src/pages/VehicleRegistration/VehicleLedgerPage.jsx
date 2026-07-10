import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import axios from 'axios'
import { getTheme, getVehicleNumberDesign } from '../../context/ThemeContext'
import { getVehicleNumberParts } from '../../utils/vehicleNoCheck'

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'

const VehicleLedgerPage = () => {
  const { registrationNumber } = useParams()
  const navigate = useNavigate()
  const theme = getTheme()
  const vehicleDesign = getVehicleNumberDesign()

  const [ledger, setLedger] = useState(null)
  const [registration, setRegistration] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const vehicleNum = registrationNumber?.toUpperCase() || ''
  const parts = getVehicleNumberParts(vehicleNum)

  const fetchLedgerAndRegistration = useCallback(async () => {
    if (!vehicleNum) return
    setLoading(true)
    setError(null)
    try {
      const [ledgerRes, regRes] = await Promise.allSettled([
        axios.get(`${API_URL}/api/vehicle-registrations/ledger/${vehicleNum}`, { withCredentials: true }),
        axios.get(`${API_URL}/api/vehicle-registrations/number/${vehicleNum}`, { withCredentials: true })
      ])

      if (ledgerRes.status === 'fulfilled' && ledgerRes.value.data.success) {
        setLedger(ledgerRes.value.data.data)
      } else {
        throw new Error('Failed to load ledger records.')
      }

      if (regRes.status === 'fulfilled' && regRes.value.data.success) {
        setRegistration(regRes.value.data.data)
      } else {
        setRegistration({ registrationNumber: vehicleNum })
      }
    } catch (err) {
      setError(err.message || 'Error loading ledger details.')
      console.error('Ledger page fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [vehicleNum])

  useEffect(() => {
    fetchLedgerAndRegistration()
  }, [fetchLedgerAndRegistration])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        navigate('/vehicle-registration')
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [navigate])

  // ─── Helpers for UI & Normalization ───
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
    let totalAmount = 0
    let receivedAmount = 0
    let balanceAmount = 0

    if (type === 'Tax') {
      totalAmount = Number(item.totalAmount ?? 0)
      receivedAmount = Number(item.paidAmount ?? 0)
      balanceAmount = Number(item.balanceAmount ?? Math.max(totalAmount - receivedAmount, 0))
    } else {
      totalAmount = Number(item.totalFee ?? 0)
      receivedAmount = Number(item.paid ?? 0)
      balanceAmount = Number(item.balance ?? Math.max(totalAmount - receivedAmount, 0))
    }

    return {
      ...item,
      type,
      typeColor,
      dateField: getWorkDate(item),
      totalAmount,
      receivedAmount,
      balanceAmount,
      referenceNo: item.receiptNo || item.permitNumber || item.authNumber || item.policyNumber || ''
    }
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
      teal: 'bg-teal-100 text-teal-800',
      rose: 'bg-rose-100 text-rose-800',
      slate: 'bg-slate-100 text-slate-800'
    }
    return colors[color] || 'bg-gray-100 text-gray-800'
  }

  // ─── Flatten & Compile Ledger Rows ───
  const getLedgerWork = () => {
    if (!ledger?.sections) return []
    const allWork = []
    const sec = ledger.sections

    sec.tax?.records?.forEach(item => allWork.push(normalizeWorkItem(item, 'Tax', 'blue')))
    sec.fitness?.records?.forEach(item => allWork.push(normalizeWorkItem(item, 'Fitness', 'green')))
    sec.insurance?.records?.forEach(item => allWork.push(normalizeWorkItem(item, 'Insurance', 'purple')))
    sec.puc?.records?.forEach(item => allWork.push(normalizeWorkItem(item, 'PUC', 'orange')))
    sec.gps?.records?.forEach(item => allWork.push(normalizeWorkItem(item, 'GPS', 'cyan')))
    sec.cgPermit?.records?.forEach(item => allWork.push(normalizeWorkItem(item, 'State Permit', 'red')))
    sec.nationalPermit?.records?.forEach(item => allWork.push(normalizeWorkItem(item, 'National Permit', 'indigo')))
    sec.busPermit?.records?.forEach(item => allWork.push(normalizeWorkItem(item, 'Bus Permit', 'pink')))
    sec.temporaryPermit?.records?.forEach(item => allWork.push(normalizeWorkItem(item, 'Temporary Permit', 'amber')))
    sec.temporaryPermitOtherState?.records?.forEach(item => allWork.push(normalizeWorkItem(item, 'Temp Permit (OS)', 'teal')))
    sec.hpaHpt?.records?.forEach(item => allWork.push(normalizeWorkItem(item, item.type === 'hpa' ? 'HPA' : 'HPT', 'rose')))
    sec.noc?.records?.forEach(item => allWork.push(normalizeWorkItem(item, 'NOC', 'slate')))
    sec.moneyReceived?.records?.forEach(item => {
      const amount = Number(item.amount || 0)
      allWork.push({
        ...item,
        type: 'Money Received',
        typeColor: 'green',
        dateField: item.moneyReceivedDate || item.createdAt,
        totalAmount: 0,
        receivedAmount: amount,
        balanceAmount: -amount,
        referenceNo: item.remark || ''
      })
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

  const allWork = getLedgerWork()
  const totalRecords = allWork.length
  const ledgerTotals = allWork.reduce(
    (totals, item) => ({
      total: totals.total + (item.totalAmount || 0),
      paid: totals.paid + (item.receivedAmount || 0),
      balance: totals.balance + (item.balanceAmount || 0)
    }),
    { total: 0, paid: 0, balance: 0 }
  )
  const totalPending = ledgerTotals.balance
  const hasPendingBalance = totalPending > 0

  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-pink-50 flex flex-col'>

      {/* ── Main Content Area ── */}
      <div className='flex-1 max-w-6xl mx-auto w-full px-3 md:px-4 lg:px-6 py-6'>
        
        {/* Loading Spinner */}
        {loading && (
          <div className='flex flex-col items-center justify-center py-24 gap-3 bg-white rounded-2xl border border-gray-200 shadow-sm'>
            <div className='relative w-12 h-12'>
              <div className='absolute inset-0 rounded-full border-4 border-indigo-100' />
              <div className='absolute inset-0 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin' />
            </div>
            <p className='text-sm font-semibold text-gray-500'>Compiling vehicle ledger records…</p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className='flex flex-col items-center justify-center py-20 gap-3 bg-white rounded-2xl border border-gray-200 shadow-sm'>
            <div className='w-12 h-12 rounded-full bg-red-100 flex items-center justify-center'>
              <svg className='w-6 h-6 text-red-500' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
              </svg>
            </div>
            <p className='text-sm font-semibold text-red-600'>{error}</p>
            <button
              onClick={fetchLedgerAndRegistration}
              className='px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition cursor-pointer'
            >
              Retry Connection
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && allWork.length === 0 && (
          <div className='flex flex-col items-center justify-center py-24 gap-4 bg-white rounded-2xl border border-gray-200 shadow-sm'>
            <div className='w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100'>
              <svg className='w-8 h-8 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' />
              </svg>
            </div>
            <div className='text-center'>
              <p className='text-base font-bold text-gray-800'>No service history exists</p>
              <p className='text-xs text-gray-400 mt-1'>There are no services logged for {vehicleNum} yet.</p>
            </div>
            <Link
              to='/vehicle-registration'
              className='px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition cursor-pointer'
            >
              Back to Registrations
            </Link>
          </div>
        )}

        {/* Chronological Unified Ledger Table (Matching Party Ledger UI) */}
        {!loading && !error && allWork.length > 0 && (
          <div className='bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden'>
            <div className='px-4 py-3 md:px-6 md:py-4 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-gray-200'>
              <div className='flex items-center gap-2 md:gap-3'>
                <div className='w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center flex-shrink-0 shadow-sm'>
                  <svg className='w-4 h-4 md:w-5 md:h-5 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' />
                  </svg>
                </div>
                <div>
                  <h2 className='text-sm md:text-lg font-bold text-gray-900'>Vehicle Work Ledger - {vehicleNum}</h2>
                  <p className='hidden md:block text-xs text-gray-600'>{allWork.length} records computed chronologically with running balances</p>
                </div>
              </div>
            </div>

            {/* ── Desktop Table ── */}
            <div className='hidden md:block p-4'>
              <div className='overflow-x-auto'>
                <table className='w-full'>
                  <thead className={theme.tableHeader}>
                    <tr>
                      <th className='px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider'>Date</th>
                      <th className='px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider'>Type</th>
                      <th className='px-4 py-3 text-right text-xs font-bold text-white uppercase tracking-wider'>Total</th>
                      <th className='px-4 py-3 text-right text-xs font-bold text-white uppercase tracking-wider'>Received</th>
                      <th className='px-4 py-3 text-right text-xs font-bold text-white uppercase tracking-wider'>Balance</th>
                      <th className='px-4 py-3 text-right text-xs font-bold text-white uppercase tracking-wider'>Running Balance</th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-gray-200'>
                    {allWork.map((item) => (
                      <tr key={`${item.type}-${item._id}`} className='hover:bg-gray-50 transition-colors duration-150'>
                        <td className='px-4 py-3.5 text-sm text-gray-600 whitespace-nowrap'>{formatDate(item.dateField || item.createdAt)}</td>
                        <td className='px-4 py-3.5'>
                          <div className='flex flex-col gap-1'>
                            <span className={`inline-flex w-fit px-2.5 py-0.5 text-xs font-bold rounded-full ${getTypeColorClass(item.typeColor)}`}>
                              {item.type}
                            </span>
                            {item.referenceNo && (
                              <span className='text-[10px] font-semibold text-gray-400'>Ref: {item.referenceNo}</span>
                            )}
                          </div>
                        </td>
                        <td className='px-4 py-3.5 text-sm text-gray-900 text-right font-medium'>
                          {item.type === 'Money Received' ? '-' : formatCurrency(item.totalAmount)}
                        </td>
                        <td className='px-4 py-3.5 text-sm text-green-600 text-right font-bold'>{formatCurrency(item.receivedAmount || 0)}</td>
                        <td className={`px-4 py-3.5 text-sm text-right font-bold ${item.balanceAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {item.type === 'Money Received' ? '-' : formatCurrency(item.balanceAmount)}
                        </td>
                        <td className='px-4 py-3.5 text-sm text-orange-700 text-right font-black'>{formatCurrency(item.runningBalance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── Mobile Cards ── */}
            <div className='md:hidden p-3 space-y-2'>
              {allWork.map((item) => {
                return (
                  <div
                    key={`${item.type}-${item._id}`}
                    className='bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden'
                  >
                    {/* Top row: Date + Type badge */}
                    <div className='flex items-center justify-between px-3 pt-2 pb-1.5'>
                      <span className='text-[10px] font-semibold text-gray-500'>{formatDate(item.dateField || item.createdAt)}</span>
                      <span className={`inline-flex px-2 py-0.5 text-[10px] font-bold rounded-full ${getTypeColorClass(item.typeColor)}`}>
                        {item.type}
                      </span>
                    </div>

                    {/* Reference */}
                    {item.referenceNo && (
                      <div className='px-3 pb-0.5'>
                        <span className='text-[10px] font-semibold text-gray-400'>Ref: {item.referenceNo}</span>
                      </div>
                    )}

                    {/* Amounts grid */}
                    <div className='grid grid-cols-3 gap-px bg-gray-100 mt-1.5 rounded-b-xl overflow-hidden'>
                      <div className='bg-white px-2.5 py-1.5'>
                        <p className='text-[10px] font-semibold text-gray-400 uppercase tracking-wider'>Total</p>
                        <p className='text-xs font-bold text-gray-900'>
                          {item.type === 'Money Received' ? '-' : formatCurrency(item.totalAmount)}
                        </p>
                      </div>
                      <div className='bg-white px-2.5 py-1.5'>
                        <p className='text-[10px] font-semibold text-gray-400 uppercase tracking-wider'>Received</p>
                        <p className='text-xs font-bold text-green-600'>{formatCurrency(item.receivedAmount || 0)}</p>
                      </div>
                      <div className='bg-white px-2.5 py-1.5'>
                        <p className='text-[10px] font-semibold text-gray-400 uppercase tracking-wider'>Balance</p>
                        <p className={`text-xs font-bold ${item.balanceAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {item.type === 'Money Received' ? '-' : formatCurrency(item.balanceAmount)}
                        </p>
                      </div>
                    </div>

                    {/* Running Balance footer */}
                    <div className='flex items-center justify-between px-3 py-1.5 bg-orange-50'>
                      <span className='text-[10px] font-bold text-orange-700 uppercase tracking-wider'>Running Balance</span>
                      <span className='text-xs font-black text-orange-700'>{formatCurrency(item.runningBalance)}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Bottom Back Button ── */}
        {!loading && (
          <div className='mt-6 flex justify-start'>
            <button
              onClick={() => navigate('/vehicle-registration')}
              className='inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 shadow-sm hover:bg-gray-50 hover:border-gray-300 transition-all'
            >
              <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M10 19l-7-7m0 0l7-7m-7 7h18' />
              </svg>
              Back to Vehicle Registrations
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default VehicleLedgerPage
