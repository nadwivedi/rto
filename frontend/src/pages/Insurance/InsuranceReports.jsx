import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-toastify'

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'

const InsuranceReports = () => {
  const navigate = useNavigate()
  const currentYear = new Date().getFullYear()
  const [year, setYear] = useState(currentYear)
  const [companyFilter, setCompanyFilter] = useState('')
  const [companies, setCompanies] = useState([])
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchCompanies()
  }, [])

  useEffect(() => {
    fetchReport()
  }, [year, companyFilter])

  const fetchCompanies = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/insurance/companies`, { withCredentials: true })
      if (res.data.success) setCompanies(res.data.data)
    } catch (e) {
      console.error('Error fetching companies:', e)
    }
  }

  const fetchReport = async () => {
    setLoading(true)
    try {
      const params = { year }
      if (companyFilter) params.company = companyFilter
      const response = await axios.get(`${API_URL}/api/insurance/monthly-report`, {
        params,
        withCredentials: true
      })
      if (response.data.success) {
        setData(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching monthly report:', error)
      toast.error('Failed to load report')
    } finally {
      setLoading(false)
    }
  }

  const prevYear = () => setYear(y => y - 1)
  const nextYear = () => setYear(y => y + 1)

  const monthData = data?.months || []
  const totals = data?.totals || { count: 0, totalFee: 0, commission: 0, paid: 0 }
  const companyData = data?.companies || []

  return (
    <>
      <div className='min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50'>
        <div className='w-full px-3 md:px-4 lg:px-6 pt-4 lg:pt-6 pb-8'>
          {/* Header */}
          <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5'>
            <div>
              <h1 className='text-xl md:text-2xl font-black text-gray-800'>Monthly Insurance Report</h1>
              <p className='text-xs md:text-sm text-gray-500 mt-0.5'>Business summary by month based on date of work</p>
            </div>
            <button
              onClick={() => navigate('/insurance')}
              className='px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-semibold text-sm transition cursor-pointer'
            >
              Back to Insurance
            </button>
          </div>

          {/* Year Selector + Company Filter */}
          <div className='bg-white rounded-xl shadow-md border border-gray-200 p-4 mb-5'>
            <div className='flex flex-col sm:flex-row items-center justify-center gap-4'>
              <div className='flex items-center gap-4'>
                <button
                  onClick={prevYear}
                  className='p-2 hover:bg-gray-100 rounded-lg transition cursor-pointer'
                >
                  <svg className='w-5 h-5 text-gray-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 19l-7-7 7-7' />
                  </svg>
                </button>
                <span className='text-2xl font-black text-gray-800 min-w-[100px] text-center'>{year}</span>
                <button
                  onClick={nextYear}
                  className='p-2 hover:bg-gray-100 rounded-lg transition cursor-pointer'
                >
                  <svg className='w-5 h-5 text-gray-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5l7 7-7 7' />
                  </svg>
                </button>
              </div>
              <div className='w-px h-8 bg-gray-200 hidden sm:block' />
              <select
                value={companyFilter}
                onChange={(e) => setCompanyFilter(e.target.value)}
                className='px-3 py-2 border border-gray-300 rounded-lg text-sm font-semibold bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
              >
                <option value=''>All Companies</option>
                {companies.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Annual Stats Cards */}
          <div className='grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5'>
            <div className='bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-4 text-white shadow-md'>
              <p className='text-xs font-semibold opacity-80'>Total Policies</p>
              <h3 className='text-2xl font-black mt-1'>{loading ? '...' : totals.count}</h3>
            </div>
            <div className='bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-4 text-white shadow-md'>
              <p className='text-xs font-semibold opacity-80'>Total Premium</p>
              <h3 className='text-2xl font-black mt-1'>₹{loading ? '...' : totals.totalFee.toLocaleString('en-IN')}</h3>
            </div>
            <div className='bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl p-4 text-white shadow-md'>
              <p className='text-xs font-semibold opacity-80'>Total Commission</p>
              <h3 className='text-2xl font-black mt-1'>₹{loading ? '...' : totals.commission.toLocaleString('en-IN')}</h3>
            </div>
            <div className='bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl p-4 text-white shadow-md'>
              <p className='text-xs font-semibold opacity-80'>Total Collected</p>
              <h3 className='text-2xl font-black mt-1'>₹{loading ? '...' : totals.paid.toLocaleString('en-IN')}</h3>
            </div>
          </div>

          {/* Monthly Table */}
          <div className='bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden mb-5'>
            <div className='px-4 py-3 border-b border-gray-200 bg-gray-50'>
              <h2 className='text-sm font-bold text-gray-700'>Monthly Breakdown</h2>
            </div>
            {loading ? (
              <div className='flex items-center justify-center py-16'>
                <svg className='animate-spin h-8 w-8 text-indigo-600' fill='none' viewBox='0 0 24 24'>
                  <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' />
                  <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z' />
                </svg>
              </div>
            ) : monthData.length === 0 ? (
              <div className='flex flex-col items-center justify-center py-16 text-gray-400'>
                <svg className='w-12 h-12 mb-3' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' />
                </svg>
                <p className='text-sm font-semibold'>No data for {year}</p>
                <p className='text-xs mt-1'>Start adding insurance records to see your monthly report</p>
              </div>
            ) : (
              <div className='overflow-x-auto'>
                <table className='w-full'>
                  <thead>
                    <tr className='bg-gray-50 border-b border-gray-200'>
                      <th className='px-4 py-3 text-left text-[10px] font-bold text-gray-600 uppercase tracking-wider'>Month</th>
                      <th className='px-4 py-3 text-right text-[10px] font-bold text-gray-600 uppercase tracking-wider'>Policies</th>
                      <th className='px-4 py-3 text-right text-[10px] font-bold text-gray-600 uppercase tracking-wider'>Total Premium</th>
                      <th className='px-4 py-3 text-right text-[10px] font-bold text-purple-700 uppercase tracking-wider'>Commission</th>
                      <th className='px-4 py-3 text-right text-[10px] font-bold text-gray-600 uppercase tracking-wider'>Collected</th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-gray-100'>
                    {monthData.map((m) => (
                      <tr key={m.month} className='hover:bg-gray-50 transition'>
                        <td className='px-4 py-3.5'>
                          <span className='text-sm font-bold text-gray-800'>{m.label}</span>
                        </td>
                        <td className='px-4 py-3.5 text-right'>
                          <span className='text-sm font-bold text-gray-900'>{m.count}</span>
                        </td>
                        <td className='px-4 py-3.5 text-right'>
                          <span className='text-sm font-semibold text-gray-800'>₹{m.totalFee.toLocaleString('en-IN')}</span>
                        </td>
                        <td className='px-4 py-3.5 text-right'>
                          <span className='text-sm font-bold text-purple-600'>₹{m.commission.toLocaleString('en-IN')}</span>
                        </td>
                        <td className='px-4 py-3.5 text-right'>
                          <span className='text-sm font-semibold text-emerald-600'>₹{m.paid.toLocaleString('en-IN')}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className='bg-gradient-to-r from-blue-50 to-purple-50 border-t-2 border-blue-200'>
                      <td className='px-4 py-4'>
                        <span className='text-sm font-black text-gray-800'>Total</span>
                      </td>
                      <td className='px-4 py-4 text-right'>
                        <span className='text-sm font-black text-gray-900'>{totals.count}</span>
                      </td>
                      <td className='px-4 py-4 text-right'>
                        <span className='text-sm font-black text-gray-800'>₹{totals.totalFee.toLocaleString('en-IN')}</span>
                      </td>
                      <td className='px-4 py-4 text-right'>
                        <span className='text-sm font-black text-purple-700'>₹{totals.commission.toLocaleString('en-IN')}</span>
                      </td>
                      <td className='px-4 py-4 text-right'>
                        <span className='text-sm font-black text-emerald-700'>₹{totals.paid.toLocaleString('en-IN')}</span>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          {/* Company-wise Breakdown */}
          {companyData.length > 0 && (
            <div className='bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden'>
              <div className='px-4 py-3 border-b border-gray-200 bg-gray-50'>
                <h2 className='text-sm font-bold text-gray-700'>Company-wise Breakdown — {year}</h2>
              </div>
              <div className='overflow-x-auto'>
                <table className='w-full'>
                  <thead>
                    <tr className='bg-gray-50 border-b border-gray-200'>
                      <th className='px-4 py-3 text-left text-[10px] font-bold text-gray-600 uppercase tracking-wider'>Insurance Company</th>
                      <th className='px-4 py-3 text-right text-[10px] font-bold text-gray-600 uppercase tracking-wider'>Policies</th>
                      <th className='px-4 py-3 text-right text-[10px] font-bold text-gray-600 uppercase tracking-wider'>Total Premium</th>
                      <th className='px-4 py-3 text-right text-[10px] font-bold text-purple-700 uppercase tracking-wider'>Commission</th>
                      <th className='px-4 py-3 text-right text-[10px] font-bold text-gray-600 uppercase tracking-wider'>Collected</th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-gray-100'>
                    {companyData.map((c) => (
                      <tr
                        key={c.company}
                        className='hover:bg-gray-50 transition cursor-pointer'
                        onClick={() => setCompanyFilter(c.company === companyFilter ? '' : c.company)}
                        title={c.company === companyFilter ? 'Click to clear filter' : `Filter by ${c.company}`}
                      >
                        <td className='px-4 py-3.5'>
                          <div className='flex items-center gap-2'>
                            {c.company === companyFilter && (
                              <svg className='w-3.5 h-3.5 text-indigo-600' fill='currentColor' viewBox='0 0 20 20'>
                                <path fillRule='evenodd' d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z' clipRule='evenodd' />
                              </svg>
                            )}
                            <span className='text-sm font-bold text-gray-800'>{c.company || 'Unknown'}</span>
                          </div>
                        </td>
                        <td className='px-4 py-3.5 text-right'>
                          <span className='text-sm font-bold text-gray-900'>{c.count}</span>
                        </td>
                        <td className='px-4 py-3.5 text-right'>
                          <span className='text-sm font-semibold text-gray-800'>₹{c.totalFee.toLocaleString('en-IN')}</span>
                        </td>
                        <td className='px-4 py-3.5 text-right'>
                          <span className='text-sm font-bold text-purple-600'>₹{c.commission.toLocaleString('en-IN')}</span>
                        </td>
                        <td className='px-4 py-3.5 text-right'>
                          <span className='text-sm font-semibold text-emerald-600'>₹{c.paid.toLocaleString('en-IN')}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className='bg-gradient-to-r from-blue-50 to-purple-50 border-t-2 border-blue-200'>
                      <td className='px-4 py-4'>
                        <span className='text-sm font-black text-gray-800'>Total</span>
                      </td>
                      <td className='px-4 py-4 text-right'>
                        <span className='text-sm font-black text-gray-900'>{totals.count}</span>
                      </td>
                      <td className='px-4 py-4 text-right'>
                        <span className='text-sm font-black text-gray-800'>₹{totals.totalFee.toLocaleString('en-IN')}</span>
                      </td>
                      <td className='px-4 py-4 text-right'>
                        <span className='text-sm font-black text-purple-700'>₹{totals.commission.toLocaleString('en-IN')}</span>
                      </td>
                      <td className='px-4 py-4 text-right'>
                        <span className='text-sm font-black text-emerald-700'>₹{totals.paid.toLocaleString('en-IN')}</span>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default InsuranceReports
