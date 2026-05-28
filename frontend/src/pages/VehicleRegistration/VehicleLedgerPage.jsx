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
    sec.cgPermit?.records?.forEach(item => allWork.push(normalizeWorkItem(item, 'CG Permit', 'red')))
    sec.nationalPermit?.records?.forEach(item => allWork.push(normalizeWorkItem(item, 'National Permit', 'indigo')))
    sec.busPermit?.records?.forEach(item => allWork.push(normalizeWorkItem(item, 'Bus Permit', 'pink')))
    sec.temporaryPermit?.records?.forEach(item => allWork.push(normalizeWorkItem(item, 'Temporary Permit', 'amber')))
    sec.temporaryPermitOtherState?.records?.forEach(item => allWork.push(normalizeWorkItem(item, 'Temp Permit (OS)', 'teal')))
    sec.hpaHpt?.records?.forEach(item => allWork.push(normalizeWorkItem(item, item.type === 'hpa' ? 'HPA' : 'HPT', 'rose')))
    sec.noc?.records?.forEach(item => allWork.push(normalizeWorkItem(item, 'NOC', 'slate')))

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
      
      {/* ── Page Header ── */}
      <div className='relative bg-gradient-to-br from-slate-800 via-slate-900 to-gray-900 px-6 py-8 overflow-hidden shadow-md text-white'>
        <div className='absolute -top-8 -right-8 w-40 h-40 rounded-full bg-indigo-500/10 blur-2xl pointer-events-none' />
        <div className='absolute -bottom-6 -left-6 w-32 h-32 rounded-full bg-purple-500/10 blur-2xl pointer-events-none' />

        <div className='max-w-6xl mx-auto w-full flex flex-col md:flex-row md:items-center justify-between gap-6 relative'>
          <div className='flex items-start gap-4'>
            {/* Back Button */}
            <button
              onClick={() => navigate('/vehicle-registration')}
              className='mt-1 flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all duration-200 shadow-sm cursor-pointer border border-white/10'
              title='Back'
            >
              <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M10 19l-7-7m0 0l7-7m-7 7h18' />
              </svg>
            </button>

            <div className='min-w-0'>
              <p className='text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5'>Vehicle Ledger</p>
              
              <div className='mb-2'>
                {parts ? (
                  <div className={vehicleDesign.container}>
                    <span className={vehicleDesign.stateCode}>{parts.stateCode}</span>
                    <span className={vehicleDesign.districtCode}>{parts.districtCode}</span>
                    <span className={vehicleDesign.series}>{parts.series}</span>
                    <span className={vehicleDesign.last4Digits}>{parts.last4Digits}</span>
                  </div>
                ) : (
                  <span className='text-2xl font-black text-white font-mono tracking-widest'>{vehicleNum}</span>
                )}
              </div>

              {registration?.ownerName && (
                <p className='text-sm font-semibold text-slate-300 mt-1.5'>Owner: {registration.ownerName}</p>
              )}
              {registration?.mobileNumber && (
                <p className='text-xs text-slate-500 mt-0.5'>Mobile: {registration.mobileNumber}</p>
              )}
            </div>
          </div>

          {/* Summary Cards */}
          {!loading && !error && ledger && (
            <div className='grid grid-cols-2 sm:grid-cols-4 gap-3 w-full md:w-auto md:min-w-[520px]'>
              <div className='bg-white/5 rounded-xl px-4 py-3 backdrop-blur-sm border border-white/10'>
                <p className='text-[10px] font-semibold text-slate-400 uppercase tracking-wide'>Total Work</p>
                <p className='text-lg font-black text-white mt-0.5'>{totalRecords}</p>
              </div>
              <div className='bg-white/5 rounded-xl px-4 py-3 backdrop-blur-sm border border-white/10'>
                <p className='text-[10px] font-semibold text-slate-400 uppercase tracking-wide'>Total Amount</p>
                <p className='text-lg font-black text-white mt-0.5'>{formatCurrency(ledgerTotals.total)}</p>
              </div>
              <div className='bg-white/5 rounded-xl px-4 py-3 backdrop-blur-sm border border-white/10'>
                <p className='text-[10px] font-semibold text-slate-400 uppercase tracking-wide'>Total Paid</p>
                <p className='text-lg font-black text-emerald-400 mt-0.5'>{formatCurrency(ledgerTotals.paid)}</p>
              </div>
              <div className={`rounded-xl px-4 py-3 backdrop-blur-sm border ${hasPendingBalance ? 'bg-red-500/10 border-red-400/30' : 'bg-white/5 border-white/10'}`}>
                <p className='text-[10px] font-semibold text-slate-400 uppercase tracking-wide'>Total Balance</p>
                <p className={`text-lg font-black mt-0.5 ${hasPendingBalance ? 'text-red-300' : 'text-emerald-400'}`}>
                  {formatCurrency(totalPending)}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Main Content Area ── */}
      <div className='flex-1 max-w-6xl mx-auto w-full px-3 md:px-4 lg:px-6 py-8'>
        
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
            <div className='px-6 py-4 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-gray-200'>
              <div className='flex items-center gap-3'>
                <div className='w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center flex-shrink-0 shadow-sm'>
                  <svg className='w-5 h-5 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' />
                  </svg>
                </div>
                <div>
                  <h2 className='text-lg font-bold text-gray-900'>Vehicle Work Ledger</h2>
                  <p className='text-xs text-gray-600'>{allWork.length} records computed chronologically with running balances</p>
                </div>
              </div>
            </div>

            <div className='p-4'>
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
                        <td className='px-4 py-3.5 text-sm text-gray-900 text-right font-medium'>{formatCurrency(item.totalAmount)}</td>
                        <td className='px-4 py-3.5 text-sm text-green-600 text-right font-bold'>{formatCurrency(item.receivedAmount || 0)}</td>
                        <td className={`px-4 py-3.5 text-sm text-right font-bold ${item.balanceAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {formatCurrency(item.balanceAmount)}
                        </td>
                        <td className='px-4 py-3.5 text-sm text-orange-700 text-right font-black'>{formatCurrency(item.runningBalance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default VehicleLedgerPage
