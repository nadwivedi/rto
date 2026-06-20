import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import Pagination from '../../components/Pagination'
import AddVehicleTransferModal from './components/AddVehicleTransferModal'
import VehicleTransferDetailModal from './components/VehicleTransferDetailModal'
import AddButton from '../../components/AddButton'
import SearchBar from '../../components/SearchBar'
import StatisticsCard from '../../components/StatisticsCard'
import MobileCardView from '../../components/MobileCardView'
import { getTheme, getVehicleNumberDesign } from '../../context/ThemeContext'
import { getVehicleNumberParts } from '../../utils/vehicleNoCheck'

const VehicleTransfer = () => {
  const theme = getTheme()
  const vehicleDesign = getVehicleNumberDesign()
  const navigate = useNavigate()
  const [transfers, setTransfers] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [editData, setEditData] = useState(null)
  const [viewData, setViewData] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all') // 'all' or 'pending'
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0,
    limit: 20
  })
  const [statistics, setStatistics] = useState({
    total: 0,
    pendingPayments: 0,
    pendingPaymentAmount: 0
  })

  const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080'

  // Fetch transfers from API
  useEffect(() => {
    fetchTransfers(1)
    fetchStatistics()
  }, [searchTerm, statusFilter])

  const fetchTransfers = async (page = pagination.currentPage) => {
    try {
      setLoading(true)

      // Build URL based on statusFilter
      let url = `${API_URL}/api/vehicle-transfers`
      if (statusFilter !== 'all') {
        url = `${API_URL}/api/vehicle-transfers/${statusFilter}`
      }

      const response = await axios.get(`${url}?page=${page}&limit=${pagination.limit}&search=${searchTerm}`, {
        withCredentials: true
      })
      const data = response.data

      if (data.success) {
        setTransfers(data.data)
        if (data.pagination) {
          setPagination({
            currentPage: data.pagination.page,
            totalPages: data.pagination.pages,
            total: data.pagination.total,
            limit: pagination.limit
          })
        }
      }
    } catch (error) {
      console.error('Error fetching transfers:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStatistics = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/vehicle-transfers/statistics`, {
        withCredentials: true
      })
      const data = response.data

      if (data.success) {
        // Calculate pending payment amount
        const transfersResponse = await axios.get(`${API_URL}/api/vehicle-transfers`, {
          withCredentials: true
        })
        const transfersData = transfersResponse.data

        let pendingAmount = 0
        if (transfersData.success) {
          pendingAmount = transfersData.data
            .filter(t => t.balance > 0)
            .reduce((sum, t) => sum + t.balance, 0)
        }

        setStatistics({
          ...data.data,
          pendingPaymentAmount: pendingAmount
        })
      }
    } catch (error) {
      console.error('Error fetching statistics:', error)
    }
  }

  const handlePageChange = (newPage) => {
    fetchTransfers(newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const filteredTransfers = useMemo(() => {
    return transfers
  }, [transfers])

  const handleAddNew = () => {
    setEditData(null)
    setShowModal(true)
  }

  const handleEdit = (transfer) => {
    setEditData(transfer)
    setShowModal(true)
  }

  const handleViewDetail = (transfer) => {
    setViewData(transfer)
    setShowDetailModal(true)
  }

  const handleSuccess = () => {
    // Refresh transfers list and statistics
    fetchTransfers()
    fetchStatistics()
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this transfer?')) {
      return
    }

    try {
      const response = await axios.delete(`${API_URL}/api/vehicle-transfers/${id}`, {
        withCredentials: true
      })
      const data = response.data

      if (data.success) {
        fetchTransfers()
        fetchStatistics()
        alert('Transfer deleted successfully')
      } else {
        alert(data.message || 'Failed to delete transfer')
      }
    } catch (error) {
      console.error('Error deleting transfer:', error)
      alert('Error deleting transfer')
    }
  }

  // Mark vehicle transfer as paid
  return (
    <>
      <div className='min-h-screen bg-gradient-to-br from-gray-50 via-teal-50 to-cyan-50'>
        <div className='w-full px-3 md:px-4 lg:px-6 pt-4 lg:pt-6 pb-8'>
          {/* Statistics Cards */}
          <div className='mb-2 mt-3'>
            <div className='flex items-center gap-3 mb-5'>
              <button
                onClick={() => navigate('/')}
                className='flex items-center justify-center w-10 h-10 rounded-xl bg-white border border-gray-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer flex-shrink-0'
                title='Back to Home'
              >
                <svg className='w-5 h-5 text-gray-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M10 19l-7-7m0 0l7-7m-7 7h18' />
                </svg>
              </button>
              <div className='grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-3 flex-1'>
              <StatisticsCard
                title='Total Transfers'
                value={statistics.total}
                color='teal'
                isActive={statusFilter === 'all'}
                onClick={() => setStatusFilter('all')}
                icon={
                  <svg className='w-4 h-4 lg:w-6 lg:h-6 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4' />
                  </svg>
                }
              />
              <StatisticsCard
                title='Pending Payments'
                value={statistics.pendingPayments}
                color='orange'
                isActive={statusFilter === 'pending'}
                onClick={() => setStatusFilter(statusFilter === 'pending' ? 'all' : 'pending')}
                extraValue={`₹${statistics.pendingPaymentAmount.toLocaleString('en-IN')}`}
                icon={
                  <svg className='w-4 h-4 lg:w-6 lg:h-6 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' />
                  </svg>
                }
              />
            </div>
          </div>
          </div>

          {/* Transfers Table */}
          <div className='bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden'>
            <div className='px-6 py-5 bg-gradient-to-r from-teal-50 via-cyan-50 to-blue-50 border-b border-gray-200'>
              <div className='flex flex-col lg:flex-row gap-2 items-stretch lg:items-center'>
                {/* Search Bar */}
                <SearchBar
                  value={searchTerm}
                  onChange={(value) => setSearchTerm(value)}
                  placeholder='Search by vehicle no, owner...'
                  toUpperCase={true}
                />

              

                {/* New Transfer Button */}
                <AddButton onClick={handleAddNew} title='New Transfer' />
              </div>

              {/* Results count */}
              <div className='mt-3 text-xs text-gray-600 font-semibold'>
                Showing {filteredTransfers.length} of {pagination.total} transfers
              </div>
            </div>

            {/* Loading Indicator */}
            {loading && (
              <div className='p-8 text-center'>
                <div className='inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600'></div>
                <p className='mt-4 text-gray-600 font-semibold'>Loading vehicle transfers...</p>
              </div>
            )}

            {/* Mobile Card View */}
            <MobileCardView
              loading={loading}
              records={filteredTransfers}
              emptyMessage={{
                title: 'No vehicle transfers found',
                description: 'Click "Add New" to add your first transfer',
              }}
              loadingMessage='Loading vehicle transfers...'
              headerGradient='from-indigo-50 via-purple-50 to-pink-50'
              avatarGradient='from-indigo-500 to-purple-500'
              emptyIconGradient='from-indigo-100 to-purple-100'
              emptyIconColor='text-indigo-400'
              cardConfig={{
                header: {
                  avatar: () => (
                    <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4' />
                    </svg>
                  ),
                  title: (record) => record.vehicleNumber,
                  subtitle: () => 'Vehicle Transfer',
                  showVehicleParts: true,
                },
                body: {
                  showStatus: false,
                  showPayment: true,
                  showValidity: false,
                  customFields: [
                    {
                      render: (record) => (
                        <div className='flex items-center justify-between pb-2 border-b border-gray-100'>
                          <span className='text-xs text-gray-500 font-semibold uppercase'>Transfer Date</span>
                          <span className='text-xs font-semibold text-gray-700'>{record.transferDate}</span>
                        </div>
                      ),
                    },
                    {
                      render: (record) => (
                        <div className='bg-gray-50 rounded-lg p-2'>
                          <p className='text-[10px] text-gray-500 font-semibold uppercase mb-1'>Ownership Transfer</p>
                          <div className='flex items-center gap-2'>
                            <div className='flex-1'>
                              <p className='text-xs font-semibold text-gray-900'>{record.currentOwnerName}</p>
                              <p className='text-[10px] text-gray-500'>Current Owner</p>
                            </div>
                            <svg className='w-4 h-4 text-indigo-600 flex-shrink-0' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13 7l5 5m0 0l-5 5m5-5H6' />
                            </svg>
                            <div className='flex-1'>
                              <p className='text-xs font-semibold text-indigo-700'>{record.newOwnerName}</p>
                              <p className='text-[10px] text-indigo-600'>New Owner</p>
                            </div>
                          </div>
                        </div>
                      ),
                    },
                  ],
                },
              }}
              actions={[
                {
                  title: 'View Details',
                  onClick: handleViewDetail,
                  bgColor: 'bg-blue-100',
                  textColor: 'text-blue-600',
                  hoverBgColor: 'bg-blue-200',
                  icon: (
                    <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 12a3 3 0 11-6 0 3 3 0 016 0z' />
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' />
                    </svg>
                  ),
                },
                {
                  title: 'Edit',
                  onClick: handleEdit,
                  bgColor: 'bg-green-100',
                  textColor: 'text-green-600',
                  hoverBgColor: 'bg-green-200',
                  icon: (
                    <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' />
                    </svg>
                  ),
                },
                {
                  title: 'Delete',
                  onClick: (record) => handleDelete(record._id),
                  bgColor: 'bg-red-100',
                  textColor: 'text-red-600',
                  hoverBgColor: 'bg-red-200',
                  icon: (
                    <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' />
                    </svg>
                  ),
                },
              ]}
            />

            {/* Desktop Table View */}
            
              <div className='hidden lg:block overflow-x-auto'>
                <table className='w-full'>
                  <thead className={theme.tableHeader}>
                    <tr>
                      <th className='px-4 2xl:px-6 py-3 2xl:py-4 text-left text-[10px] 2xl:text-xs font-bold text-white uppercase tracking-wide'>Vehicle No</th>
                      <th className='px-4 2xl:px-6 py-3 2xl:py-4 text-left text-[10px] 2xl:text-xs font-bold text-white uppercase tracking-wide'>Old Owner</th>
                      <th className='px-4 2xl:px-6 py-3 2xl:py-4 text-left text-[10px] 2xl:text-xs font-bold text-white uppercase tracking-wide'>New Owner</th>
                      <th className='px-4 2xl:px-6 py-3 2xl:py-4 text-left text-[10px] 2xl:text-xs font-bold text-white uppercase tracking-wide'>Transfer Date</th>
                      <th className='px-4 2xl:px-6 py-3 2xl:py-4 text-right text-[10px] 2xl:text-xs font-bold text-white uppercase tracking-wide bg-white/10'>Total Fee</th>
                      <th className='px-4 2xl:px-6 py-3 2xl:py-4 text-right text-[10px] 2xl:text-xs font-bold text-white uppercase tracking-wide bg-white/10'>Paid</th>
                      <th className='px-4 2xl:px-6 py-3 2xl:py-4 text-right text-[10px] 2xl:text-xs font-bold text-white uppercase tracking-wide bg-white/10'>Balance</th>
                      <th className='px-4 2xl:px-6 py-3 2xl:py-4 text-center text-[10px] 2xl:text-xs font-bold text-white uppercase tracking-wide'>Payment Status</th>
                      <th className='px-4 2xl:px-6 py-3 2xl:py-4 text-center text-[10px] 2xl:text-xs font-bold text-white uppercase tracking-wide'>Actions</th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-gray-200'>
                    {!loading && filteredTransfers.length > 0 ? (
                      filteredTransfers.map((transfer) => (
                        <tr key={transfer._id} className='hover:bg-gradient-to-r hover:from-teal-50/50 hover:via-cyan-50/50 hover:to-blue-50/50 transition-all duration-200 group'>
                          {/* Vehicle Number */}
                          <td className='px-4 2xl:px-6 py-3 2xl:py-4'>
                            <div className='flex items-center gap-3'>
                              <div>
                                {(() => {
                                  const parts = getVehicleNumberParts(transfer.vehicleNumber);
                                  if (!parts) {
                                    return (
                                      <div className='text-[11px] 2xl:text-sm font-inter font-bold text-gray-900'>
                                        {transfer.vehicleNumber}
                                      </div>
                                    );
                                  }
                                  return (
                                    <div className={vehicleDesign.container}>
                                      <svg
                                        className="w-4 h-6 mr-0.5   text-blue-800 flex-shrink-0"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                      >
                                        <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                                        <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z" />
                                      </svg>

                                      <span className={vehicleDesign.stateCode}>
                                        {parts.stateCode}
                                      </span>
                                      <span className={vehicleDesign.districtCode}>
                                        {parts.districtCode}
                                      </span>
                                      <span className={vehicleDesign.series}>
                                        {parts.series}
                                      </span>
                                      <span className={vehicleDesign.last4Digits}>
                                        {parts.last4Digits}
                                      </span>
                                    </div>
                                  );
                                })()}
                              </div>
                            </div>
                          </td>

                          {/* Old Owner */}
                          <td className='px-2 2xl:px-3 py-3 2xl:py-4'>
                            <div>
                              <div className='text-[11px] 2xl:text-sm font-semibold text-gray-900'>{transfer.currentOwnerName}</div>
                              <div className='text-[10px] 2xl:text-xs text-gray-500 mt-0.5'>Previous Owner</div>
                            </div>
                          </td>

                          {/* New Owner */}
                          <td className='px-2 2xl:px-3 py-3 2xl:py-4'>
                            <div>
                              <div className='text-[11px] 2xl:text-sm font-semibold text-teal-700'>{transfer.newOwnerName}</div>
                              <div className='text-[10px] 2xl:text-xs text-teal-600 mt-0.5 flex items-center gap-1'>
                                <svg className='w-2.5 h-2.5 2xl:w-3 2xl:h-3' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13 7l5 5m0 0l-5 5m5-5H6' />
                                </svg>
                                Current Owner
                              </div>
                            </div>
                          </td>

                          {/* Transfer Date */}
                          <td className='px-4 2xl:px-6 py-3 2xl:py-4'>
                            <div className='flex items-center text-[11px] 2xl:text-sm text-gray-700 font-semibold'>
                              <svg className='w-3 h-3 2xl:w-4 2xl:h-4 mr-1 2xl:mr-2 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' />
                              </svg>
                              {transfer.transferDate}
                            </div>
                          </td>

                          {/* Total Fee */}
                          <td className='px-4 py-4 bg-gray-50/50 group-hover:bg-purple-50/30'>
                            <div className='text-right'>
                              <div className='text-[11px] 2xl:text-sm font-bold text-gray-900'>₹{(transfer.totalFee || 0).toLocaleString('en-IN')}</div>
                              <div className='text-[10px] 2xl:text-xs text-gray-500 mt-0.5'>Total Amount</div>
                            </div>
                          </td>

                          {/* Paid */}
                          <td className='px-4 py-4 bg-gray-50/50 group-hover:bg-emerald-50/30'>
                            <div className='text-right'>
                              <div className='text-[11px] 2xl:text-sm font-bold text-emerald-600'>₹{(transfer.paid || 0).toLocaleString('en-IN')}</div>
                              <div className='text-[10px] 2xl:text-xs text-emerald-600 mt-0.5'>Paid Amount</div>
                            </div>
                          </td>

                          {/* Balance */}
                          <td className={`px-4 py-4 bg-gray-50/50 ${transfer.balance > 0 ? 'group-hover:bg-amber-50/30' : 'group-hover:bg-gray-50'}`}>
                            <div className='text-right'>
                              <div className={`text-[11px] 2xl:text-sm font-bold ${transfer.balance > 0 ? 'text-orange-600' : 'text-gray-500'}`}>
                                ₹{(transfer.balance || 0).toLocaleString('en-IN')}
                              </div>
                              <div className={`text-[10px] 2xl:text-xs mt-0.5 ${transfer.balance > 0 ? 'text-orange-600' : 'text-gray-500'}`}>
                                {transfer.balance > 0 ? 'Pending' : 'Cleared'}
                              </div>
                            </div>
                          </td>

                          {/* Payment Status Badge */}
                          <td className='px-4 py-4 text-center'>
                            {transfer.balance > 0 ? (
                              <span className='inline-flex items-center px-2 py-1 2xl:px-3 2xl:py-1.5 rounded-full text-[10px] 2xl:text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200'>
                                <svg className='w-2.5 h-2.5 2xl:w-3 2xl:h-3 mr-0.5 2xl:mr-1' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' />
                                </svg>
                                Pending
                              </span>
                            ) : (
                              <span className='inline-flex items-center px-2 py-1 2xl:px-3 2xl:py-1.5 rounded-full text-[10px] 2xl:text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200'>
                                <svg className='w-2.5 h-2.5 2xl:w-3 2xl:h-3 mr-0.5 2xl:mr-1' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
                                </svg>
                                Paid
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className='px-4 2xl:px-6 py-3 2xl:py-4'>
                            <div className='flex items-center justify-end gap-0.5 pr-1'>
                              <button
                                onClick={() => handleViewDetail(transfer)}
                                className='p-1.5 2xl:p-2 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-all group-hover:scale-110 duration-200'
                                title='View Details'
                              >
                                <svg className='w-4 h-4 2xl:w-5 2xl:h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 12a3 3 0 11-6 0 3 3 0 016 0z' />
                                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleEdit(transfer)}
                                className='p-1.5 2xl:p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-all group-hover:scale-110 duration-200'
                                title='Edit Transfer'
                              >
                                <svg className='w-4 h-4 2xl:w-5 2xl:h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDelete(transfer._id)}
                                className='p-1.5 2xl:p-2 text-red-600 hover:bg-red-100 rounded-lg transition-all group-hover:scale-110 duration-200'
                                title='Delete Transfer'
                              >
                                <svg className='w-4 h-4 2xl:w-5 2xl:h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : !loading && (
                      <tr>
                        <td colSpan='9' className='px-4 py-8 text-center'>
                          <div className='text-gray-400'>
                            <svg className='mx-auto h-8 w-8 mb-3' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
                            </svg>
                            <p className='text-sm font-semibold text-gray-600'>No vehicle transfers found</p>
                            <p className='text-xs text-gray-500 mt-1'>Click &quot;New Transfer&quot; to add your first record</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>


            {/* Pagination */}
            {!loading && filteredTransfers.length > 0 && (
              <Pagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                onPageChange={handlePageChange}
                totalRecords={pagination.total}
                itemsPerPage={pagination.limit}
              />
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <AddVehicleTransferModal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false)
            setEditData(null)
          }}
          onSuccess={handleSuccess}
          editData={editData}
        />
      )}

      {/* Detail View Modal */}
      {showDetailModal && (
        <VehicleTransferDetailModal
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false)
            setViewData(null)
          }}
          transfer={viewData}
        />
      )}
    </>
  )
}

export default VehicleTransfer
