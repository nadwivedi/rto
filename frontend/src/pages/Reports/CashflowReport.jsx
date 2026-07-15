import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-toastify'

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'

const CashflowReport = () => {
  const navigate = useNavigate()
  const [expenseData, setExpenseData] = useState([])
  const [incomeData, setIncomeData] = useState([])
  const [expenseGrandTotal, setExpenseGrandTotal] = useState(0)
  const [incomeGrandTotal, setIncomeGrandTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [employees, setEmployees] = useState([])
  const [employeeFilter, setEmployeeFilter] = useState('')

  useEffect(() => {
    axios.get(`${API_URL}/api/employees`, { withCredentials: true })
      .then(res => setEmployees(res.data.data || []))
      .catch(() => {})
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const params = {}
      if (fromDate) params.fromDate = fromDate
      if (toDate) params.toDate = toDate
      if (employeeFilter) params.employee = employeeFilter

      const [expensesRes, incomeRes] = await Promise.all([
        axios.get(`${API_URL}/api/reports/expenses`, { params, withCredentials: true }),
        axios.get(`${API_URL}/api/reports/income`, { params, withCredentials: true })
      ])
      if (expensesRes.data.success) {
        setExpenseData(expensesRes.data.data)
        setExpenseGrandTotal(expensesRes.data.grandTotal)
      }
      if (incomeRes.data.success) {
        setIncomeData(incomeRes.data.data)
        setIncomeGrandTotal(incomeRes.data.grandTotal)
      }
    } catch {
      toast.error('Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const handleFilter = () => { fetchData() }

  const toDateKey = (dateStr) => {
    if (!dateStr) return ''
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr
    if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
      const [d, m, y] = dateStr.split('-')
      return `${y}-${m}-${d}`
    }
    try {
      const d = new Date(dateStr)
      if (!isNaN(d.getTime())) {
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      }
    } catch {}
    return dateStr
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const [y, m, d] = dateStr.split('-')
      return `${d}-${m}-${y}`
    }
    if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) return dateStr
    try {
      const d = new Date(dateStr)
      if (!isNaN(d.getTime())) {
        return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`
      }
    } catch {}
    return dateStr
  }

  const renderCashflowDateGroups = () => {
    const dateMap = {}

    expenseData.forEach(group => {
      const key = toDateKey(group.date)
      if (!dateMap[key]) dateMap[key] = { income: null, expense: null, displayDate: group.date }
      dateMap[key].expense = group
    })

    incomeData.forEach(group => {
      const key = toDateKey(group.date)
      if (!dateMap[key]) dateMap[key] = { income: null, expense: null, displayDate: group.date }
      dateMap[key].income = group
    })

    const sortedDates = Object.keys(dateMap).sort((a, b) => b.localeCompare(a))

    if (sortedDates.length === 0) {
      return (
        <div className='text-center py-12 text-gray-500'>
          <svg className='w-12 h-12 mx-auto mb-3 text-gray-300' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1.5} d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' />
          </svg>
          <p className='font-semibold'>No data found</p>
        </div>
      )
    }

    return sortedDates.map(date => {
      const { income, expense } = dateMap[date]
      const incomeTotal = income?.total || 0
      const expenseTotal = expense?.total || 0
      const netTotal = incomeTotal - expenseTotal

      return (
        <div key={date} className='bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden'>
          <div className='px-4 py-2.5 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 flex items-center justify-between'>
            <span className='text-sm font-bold text-gray-800'>{formatDate(date)}</span>
            <span className='text-xs text-gray-500'>
              {income?.items?.length || 0} income / {expense?.items?.length || 0} expenses
            </span>
          </div>

          <div className='p-3 grid grid-cols-1 md:grid-cols-2 gap-3'>
            <div className='rounded-lg border border-green-200 overflow-hidden'>
              <div className='px-3 py-2 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-200 flex items-center justify-between'>
                <span className='text-xs font-bold text-green-700 uppercase tracking-wider'>Income</span>
                <span className='text-[10px] text-green-600 font-semibold'>{income?.items?.length || 0} entries · ₹{incomeTotal.toLocaleString('en-IN')}</span>
              </div>
              {income?.items?.length > 0 ? (
                <div className='overflow-x-auto'>
                  <table className='w-full text-xs'>
                    <thead>
                      <tr className='bg-green-100/50'>
                        <th className='text-left px-3 py-1.5 text-green-800 font-bold'>Work</th>
                        <th className='text-left px-3 py-1.5 text-green-800 font-bold'>Customer</th>
                        <th className='text-left px-3 py-1.5 text-green-800 font-bold'>Payment</th>
                        <th className='text-left px-3 py-1.5 text-green-800 font-bold'>Received By</th>
                        <th className='text-right px-3 py-1.5 text-green-800 font-bold'>Amount</th>
                        <th className='text-left px-3 py-1.5 text-green-800 font-bold'>Remarks</th>
                      </tr>
                    </thead>
                    <tbody className='divide-y divide-green-100'>
                      {income.items.map((item, idx) => (
                        <tr key={item._id || idx} className='hover:bg-green-50/50'>
                          <td className='px-3 py-2'>
                            <span className='inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-100 text-cyan-700 border border-cyan-200'>{item.workTypeLabel}</span>
                          </td>
                          <td className='px-3 py-2 text-gray-700 font-medium'>{item.customerName || '-'}</td>
                          <td className='px-3 py-2'>
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                              item.paymentMode === 'Cash' ? 'bg-green-100 text-green-700' :
                              item.paymentMode === 'Bank' ? 'bg-blue-100 text-blue-700' :
                              'bg-purple-100 text-purple-700'
                            }`}>{item.paymentMode || 'Cash'}</span>
                          </td>
                          <td className='px-3 py-2 text-gray-700 font-medium'>{item.receivedBy || '-'}</td>
                          <td className='px-3 py-2 text-right font-bold text-green-700'>₹{(item.amount || 0).toLocaleString('en-IN')}</td>
                          <td className='px-3 py-2 text-gray-500 max-w-[120px] truncate' title={item.remark || ''}>{item.remark || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className='px-3 py-6 text-center'>
                  <p className='text-xs text-gray-400 italic'>No income entries</p>
                </div>
              )}
            </div>

            <div className='rounded-lg border border-red-200 overflow-hidden'>
              <div className='px-3 py-2 bg-gradient-to-r from-red-50 to-orange-50 border-b border-red-200 flex items-center justify-between'>
                <span className='text-xs font-bold text-red-700 uppercase tracking-wider'>Expense</span>
                <span className='text-[10px] text-red-600 font-semibold'>{expense?.items?.length || 0} entries · ₹{expenseTotal.toLocaleString('en-IN')}</span>
              </div>
              {expense?.items?.length > 0 ? (
                <div className='overflow-x-auto'>
                  <table className='w-full text-xs'>
                    <thead>
                      <tr className='bg-red-100/50'>
                        <th className='text-left px-3 py-1.5 text-red-800 font-bold'>Work</th>
                        <th className='text-left px-3 py-1.5 text-red-800 font-bold'>Customer</th>
                        <th className='text-left px-3 py-1.5 text-red-800 font-bold'>Type</th>
                        <th className='text-right px-3 py-1.5 text-red-800 font-bold'>Amount</th>
                        <th className='text-left px-3 py-1.5 text-red-800 font-bold'>Remarks</th>
                      </tr>
                    </thead>
                    <tbody className='divide-y divide-red-100'>
                      {expense.items.map((item, idx) => (
                        <tr key={item._id || idx} className='hover:bg-red-50/50'>
                          <td className='px-3 py-2'>
                            <span className='inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-700 border border-orange-200'>{item.workTypeLabel}</span>
                          </td>
                          <td className='px-3 py-2 text-gray-700 font-medium'>{item.customerName || '-'}</td>
                          <td className='px-3 py-2 font-semibold text-gray-900'>{item.name}</td>
                          <td className='px-3 py-2 text-right font-bold text-red-700'>₹{(item.amount || 0).toLocaleString('en-IN')}</td>
                          <td className='px-3 py-2 text-gray-500 max-w-[120px] truncate' title={item.remark || ''}>{item.remark || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className='px-3 py-6 text-center'>
                  <p className='text-xs text-gray-400 italic'>No expense entries</p>
                </div>
              )}
            </div>
          </div>

          <div className='px-4 py-2.5 bg-gradient-to-r from-gray-50 to-white border-t border-gray-100 flex flex-wrap items-center justify-between gap-2 text-xs'>
            <span className='text-green-700 font-bold'>Income: ₹{incomeTotal.toLocaleString('en-IN')}</span>
            <span className='text-red-700 font-bold'>Expense: ₹{expenseTotal.toLocaleString('en-IN')}</span>
            <span className={`font-black ${netTotal >= 0 ? 'text-green-800' : 'text-red-800'}`}>
              Net: ₹{netTotal.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      )
    })
  }

  const renderCashflow = () => (
    <div className='space-y-4'>
      <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
        <div className='bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200 p-4'>
          <p className='text-xs font-bold text-green-700 uppercase tracking-wider'>Total Income</p>
          <p className='text-xl font-black text-green-800 mt-1'>₹{incomeGrandTotal.toLocaleString('en-IN')}</p>
        </div>
        <div className='bg-gradient-to-br from-red-50 to-orange-50 rounded-xl border border-red-200 p-4'>
          <p className='text-xs font-bold text-red-700 uppercase tracking-wider'>Total Expense</p>
          <p className='text-xl font-black text-red-800 mt-1'>₹{expenseGrandTotal.toLocaleString('en-IN')}</p>
        </div>
        <div className={`rounded-xl border-2 p-4 flex flex-col justify-center ${
          (incomeGrandTotal - expenseGrandTotal) >= 0
            ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300'
            : 'bg-gradient-to-br from-red-50 to-orange-50 border-red-300'
        }`}>
          <p className='text-xs font-bold uppercase tracking-wider text-gray-600'>Net Cashflow</p>
          <p className={`text-lg font-black mt-0.5 ${incomeGrandTotal - expenseGrandTotal >= 0 ? 'text-green-800' : 'text-red-800'}`}>
            ₹{(incomeGrandTotal - expenseGrandTotal).toLocaleString('en-IN')}
          </p>
        </div>
      </div>

      <div className='text-center'>
        <p className='text-xs font-bold text-gray-500 uppercase tracking-wider mb-3'>Date-wise Breakdown</p>
      </div>

      <div className='space-y-3'>
        {renderCashflowDateGroups()}
      </div>
    </div>
  )

  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50'>
      <div className='w-full px-3 md:px-4 lg:px-6 pt-4 lg:pt-6 pb-8'>
        <div className='mb-4 flex items-center gap-3'>
          <button
            onClick={() => navigate(-1)}
            className='flex items-center justify-center w-10 h-10 rounded-xl bg-white border border-gray-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer flex-shrink-0'
            title='Go Back'
          >
            <svg className='w-5 h-5 text-gray-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M10 19l-7-7m0 0l7-7m-7 7h18' />
            </svg>
          </button>
          <h1 className='text-lg font-black text-gray-800'>Cashflow Report</h1>
        </div>

        {/* Date Filter */}
        <div className='mb-4 bg-white rounded-xl shadow-sm border border-gray-200 p-3 flex flex-wrap items-center gap-2'>
          <svg className='w-4 h-4 text-indigo-500' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' />
          </svg>
          <span className='text-xs font-bold text-gray-700'>From:</span>
          <input
            type='date'
            value={fromDate}
            onChange={e => setFromDate(e.target.value)}
            className='px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none'
          />
          <span className='text-xs text-gray-400'>to</span>
          <input
            type='date'
            value={toDate}
            onChange={e => setToDate(e.target.value)}
            className='px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none'
          />
          <span className='text-xs font-bold text-gray-700 ml-2'>Employee:</span>
          <select
            value={employeeFilter}
            onChange={e => setEmployeeFilter(e.target.value)}
            className='px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white'
          >
            <option value=''>All</option>
            {employees.filter(e => e.isActive !== false).map(emp => (
              <option key={emp._id} value={emp.name}>{emp.name}</option>
            ))}
          </select>
          <button
            onClick={handleFilter}
            className='px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-all cursor-pointer shadow-sm'
          >
            Apply Filter
          </button>
          {(fromDate || toDate || employeeFilter) && (
            <button
              onClick={() => { setFromDate(''); setToDate(''); setEmployeeFilter(''); handleFilter() }}
              className='px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-300 transition-all cursor-pointer'
            >
              Clear
            </button>
          )}
        </div>

        {loading ? (
          <div className='text-center py-12'>
            <svg className='animate-spin mx-auto h-8 w-8 text-indigo-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z' />
            </svg>
            <p className='text-sm font-semibold text-gray-600 mt-3'>Loading...</p>
          </div>
        ) : (
          renderCashflow()
        )}
      </div>
    </div>
  )
}

export default CashflowReport
