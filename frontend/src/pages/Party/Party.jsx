import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-toastify'
import Pagination from '../../components/Pagination'
import AddButton from '../../components/AddButton'
import SearchBar from '../../components/SearchBar'
import StatisticsCard from '../../components/StatisticsCard'
import { getTheme } from '../../context/ThemeContext'
import AddEditPartyModal from './components/AddEditPartyModal'

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'

const formatCurrency = (amount = 0) => `₹${Number(amount || 0).toLocaleString('en-IN')}`

const Party = () => {
  const navigate = useNavigate()
  const theme = getTheme()
  const [parties, setParties] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editData, setEditData] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statistics, setStatistics] = useState({
    total: 0
  })
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalRecords: 0,
    limit: 20
  })

  useEffect(() => {
    fetchParties(1)
    fetchStatistics()
  }, [searchTerm])

  const fetchParties = async (page = pagination.currentPage) => {
    try {
      setLoading(true)
      const response = await axios.get(`${API_URL}/api/parties`, {
        params: {
          page,
          limit: pagination.limit,
          search: searchTerm
        },
        withCredentials: true
      })

      if (response.data.success) {
        setParties(response.data.data || [])

        if (response.data.pagination) {
          setPagination({
            currentPage: response.data.pagination.currentPage,
            totalPages: response.data.pagination.totalPages,
            totalRecords: response.data.pagination.totalRecords,
            limit: pagination.limit
          })
        }
      }
    } catch (error) {
      console.error('Error fetching parties:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStatistics = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/parties/statistics`, { withCredentials: true })

      if (response.data.success) {
        setStatistics(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching statistics:', error)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this party?')) {
      return
    }

    try {
      const response = await axios.delete(`${API_URL}/api/parties/${id}`, { withCredentials: true })

      if (response.data.success) {
        toast.success('Party deleted successfully!', { position: 'top-right', autoClose: 3000 })
        fetchParties()
        fetchStatistics()
      } else {
        toast.error(response.data.message || 'Failed to delete party', { position: 'top-right', autoClose: 3000 })
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error deleting party. Please try again.'
      toast.error(errorMessage, { position: 'top-right', autoClose: 3000 })
      console.error('Error:', error)
    }
  }

  const handleEdit = (party) => {
    setEditData(party)
    setShowModal(true)
  }

  const handlePageChange = (newPage) => {
    fetchParties(newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const filteredParties = parties

  return (
    <>
      <div className='min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-pink-50'>
        <div className='w-full px-3 md:px-4 lg:px-6 pt-4 lg:pt-6 pb-8'>
          {/* Statistics Cards */}
          <div className='mb-2 mt-3'>
            <div className='grid grid-cols-1 gap-2 lg:gap-3 mb-5 max-w-sm'>
              <StatisticsCard
                title='Total Parties'
                value={statistics.total}
                color='purple'
                icon={
                  <svg className='w-4 h-4 lg:w-6 lg:h-6 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' />
                  </svg>
                }
              />
            </div>
          </div>

          {/* Parties Table */}
          <div className='bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden'>
            <div className='px-6 py-5 bg-gradient-to-r from-purple-50 via-pink-50 to-indigo-50 border-b border-gray-200'>
              <div className='flex flex-col lg:flex-row gap-2 items-stretch lg:items-center'>
                {/* Search Bar */}
                <SearchBar
                  value={searchTerm}
                  onChange={(value) => setSearchTerm(value)}
                  placeholder='Search by party name, mobile...'
                  toUpperCase={true}
                />

                {/* Add Party Button */}
                <AddButton
                  onClick={() => {
                    setEditData(null)
                    setShowModal(true)
                  }}
                  title='Add New Party'
                />

                {/* Vehicle+ Button */}
                <button
                  onClick={() => navigate('/vehicle-registration')}
                  className='flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white px-4 py-2 lg:px-5 lg:py-2.5 rounded-xl text-xs lg:text-sm font-semibold shadow-md hover:shadow-lg transition-all duration-200'
                >
                  <svg className='w-4 h-4 lg:w-5 lg:h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z' />
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0' />
                  </svg>
                  Vehicle+
                </button>
              </div>

              {/* Results count */}
              <div className='mt-3 text-xs text-gray-600 font-semibold'>
                Showing {filteredParties.length} of {pagination.totalRecords} records
              </div>
            </div>

            {loading ? (
              <div className='p-12 text-center'>
                <div className='text-gray-400'>
                  <svg className='animate-spin mx-auto h-8 w-8 mb-3 text-purple-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z' />
                  </svg>
                  <p className='text-sm font-semibold text-gray-600'>Loading parties...</p>
                </div>
              </div>
            ) : filteredParties.length === 0 ? (
              <div className='p-12 text-center'>
                <div className='text-gray-400'>
                  <svg className='mx-auto h-8 w-8 mb-3' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' />
                  </svg>
                  <p className='text-sm font-semibold text-gray-600'>No parties found</p>
                  <p className='text-xs text-gray-500 mt-1'>Click &quot;Add New Party&quot; to add your first party</p>
                </div>
              </div>
            ) : (
              <>
                {/* Mobile Card View */}
                <div className='block lg:hidden'>
                  <div className='p-4 space-y-3'>
                    {filteredParties.map((party) => (
                      <div key={party._id} className='bg-white rounded-lg shadow border border-gray-200 overflow-hidden hover:shadow-md transition-shadow'>
                        {/* Card Header */}
                        <div className='bg-gradient-to-r from-purple-50 to-pink-50 p-3 flex items-start justify-between border-b border-gray-200'>
                          <div
                            className='min-w-0 flex-1 mr-2 cursor-pointer'
                            onClick={() => navigate(`/parties/${party._id}`)}
                          >
                            <div className='text-sm font-bold text-gray-900 mb-1 flex items-center gap-2'>
                              <div className='w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold'>
                                {party.partyName?.charAt(0)?.toUpperCase() || 'P'}
                              </div>
                              <span className='truncate hover:text-purple-600'>{party.partyName}</span>
                            </div>
                            {party.mobile && (
                              <div className='text-xs text-gray-600 ml-10'>{party.mobile}</div>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className='flex items-center gap-1'>
                            <button
                              onClick={() => handleEdit(party)}
                              className='p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all cursor-pointer'
                              title='Edit'
                            >
                              <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDelete(party._id)}
                              className='p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-all cursor-pointer'
                              title='Delete'
                            >
                              <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' />
                              </svg>
                            </button>
                          </div>
                        </div>

                        {/* Card Body */}
                        <div className='p-3 space-y-2'>
                          {party.sonWifeDaughterOf && (
                            <div>
                              <p className='text-[10px] text-gray-500 font-semibold uppercase'>S/o, W/o, D/o</p>
                              <p className='text-xs font-semibold text-gray-700'>{party.sonWifeDaughterOf}</p>
                            </div>
                          )}

                          {party.email && (
                            <div>
                              <p className='text-[10px] text-gray-500 font-semibold uppercase'>Email</p>
                              <p className='text-xs text-gray-700 lowercase'>{party.email}</p>
                            </div>
                          )}

                          {party.address && (
                            <div>
                              <p className='text-[10px] text-gray-500 font-semibold uppercase'>Address</p>
                              <p className='text-xs text-gray-700 line-clamp-2'>{party.address}</p>
                            </div>
                          )}

                          <div>
                            <p className='text-[10px] text-gray-500 font-semibold uppercase'>Party Balance</p>
                            <p className={`text-xs font-bold ${party.totalPending > 0 ? 'text-red-600' : 'text-green-600'}`}>
                              {formatCurrency(party.totalPending)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Desktop Table View */}
                <div className='hidden lg:block overflow-x-auto'>
                  <table className='w-full'>
                    <thead className={theme.tableHeader}>
                      <tr>
                        <th className='px-4 2xl:px-6 py-3 2xl:py-4 text-left text-[10px] 2xl:text-xs font-bold text-white uppercase tracking-wide'>Party Name</th>
                        <th className='px-4 2xl:px-6 py-3 2xl:py-4 text-left text-[10px] 2xl:text-xs font-bold text-white uppercase tracking-wide'>S/o, W/o, D/o</th>
                        <th className='px-4 2xl:px-6 py-3 2xl:py-4 text-left text-[10px] 2xl:text-xs font-bold text-white uppercase tracking-wide'>Mobile</th>
                        <th className='px-4 2xl:px-6 py-3 2xl:py-4 text-left text-[10px] 2xl:text-xs font-bold text-white uppercase tracking-wide'>Email</th>
                        <th className='px-4 2xl:px-6 py-3 2xl:py-4 text-left text-[10px] 2xl:text-xs font-bold text-white uppercase tracking-wide'>Address</th>
                        <th className='px-4 2xl:px-6 py-3 2xl:py-4 text-center text-[10px] 2xl:text-xs font-bold text-white uppercase tracking-wide'>Actions</th>
                      </tr>
                    </thead>
                    <tbody className='divide-y divide-gray-200'>
                      {filteredParties.map((party) => (
                        <tr key={party._id} className='hover:bg-gradient-to-r hover:from-purple-50/50 hover:via-pink-50/50 hover:to-indigo-50/50 transition-all duration-200 group cursor-pointer' onClick={() => navigate(`/parties/${party._id}`)}>
                          <td className='px-4 2xl:px-6 py-3 2xl:py-4'>
                            <div className='flex items-center gap-3'>
                              <div className='w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0'>
                                {party.partyName?.charAt(0)?.toUpperCase() || 'P'}
                              </div>
                              <div className='text-[12px] 2xl:text-sm font-semibold text-gray-900 group-hover:text-purple-600'>{party.partyName}</div>
                            </div>
                          </td>
                          <td className='px-4 2xl:px-6 py-3 2xl:py-4'>
                            <span className='text-[11px] 2xl:text-sm text-gray-700'>{party.sonWifeDaughterOf || '-'}</span>
                          </td>
                          <td className='px-4 2xl:px-6 py-3 2xl:py-4'>
                            <span className='text-[11px] 2xl:text-sm font-semibold text-gray-900'>{party.mobile || '-'}</span>
                          </td>
                          <td className='px-4 2xl:px-6 py-3 2xl:py-4'>
                            <span className='text-[11px] 2xl:text-sm text-gray-700 lowercase'>{party.email || '-'}</span>
                          </td>
                          <td className='px-4 2xl:px-6 py-3 2xl:py-4 max-w-xs'>
                            <div className='space-y-1'>
                              <span className='block text-[11px] 2xl:text-sm text-gray-700 line-clamp-2'>{party.address || '-'}</span>
                              <div className='text-[11px] 2xl:text-sm'>
                                <span className='font-semibold text-gray-500'>Party Balance: </span>
                                <span className={party.totalPending > 0 ? 'font-bold text-red-600' : 'font-bold text-green-600'}>
                                  {formatCurrency(party.totalPending)}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className='px-4 2xl:px-6 py-3 2xl:py-4' onClick={(e) => e.stopPropagation()}>
                            <div className='flex items-center justify-center gap-0.5'>
                              <button
                                onClick={() => handleEdit(party)}
                                className='p-1.5 2xl:p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 cursor-pointer'
                                title='Edit'
                              >
                                <svg className='w-4 h-4 2xl:w-5 2xl:h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDelete(party._id)}
                                className='p-1.5 2xl:p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 cursor-pointer'
                                title='Delete'
                              >
                                <svg className='w-4 h-4 2xl:w-5 2xl:h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {!loading && filteredParties.length > 0 && (
                  <Pagination
                    currentPage={pagination.currentPage}
                    totalPages={pagination.totalPages}
                    onPageChange={handlePageChange}
                    totalRecords={pagination.totalRecords}
                    itemsPerPage={pagination.limit}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <AddEditPartyModal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false)
            setEditData(null)
          }}
          onSuccess={() => {
            fetchParties()
            fetchStatistics()
          }}
          editData={editData}
        />
      )}
    </>
  )
}

export default Party
