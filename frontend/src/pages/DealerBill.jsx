import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import axios from 'axios'
import AddButton from '../components/AddButton'
import SearchBar from '../components/SearchBar'
import { getTheme } from '../context/ThemeContext'
import AddDealerBillModal from '../components/AddDealerBillModal'
import EditDealerBillModal from '../components/EditDealerBillModal'

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'
console.log(API_URL);


const DealerBill = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const theme = getTheme()
  const [dealerBills, setDealerBills] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [totalItems, setTotalItems] = useState(0)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editBill, setEditBill] = useState(null)
  const [previewBill, setPreviewBill] = useState(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const itemsPerPage = 10

  // Fetch dealer bills
  useEffect(() => {
    fetchDealerBills()
  }, [currentPage, searchQuery])

  useEffect(() => {
    if (!location.state?.openAddModal) return

    setIsAddModalOpen(true)
    navigate(location.pathname, { replace: true, state: {} })
  }, [location.pathname, location.state, navigate])

  const fetchDealerBills = async () => {
    try {
      setLoading(true)
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        search: searchQuery,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      }

      const response = await axios.get(`${API_URL}/api/custom-bills`, { params, withCredentials: true })

      setDealerBills(response.data.data || [])
      setTotalPages(response.data.pagination?.totalPages || 0)
      setTotalItems(response.data.pagination?.totalItems || 0)
    } catch (error) {
      console.error('Error fetching bills:', error)
      setDealerBills([])
    } finally {
      setLoading(false)
    }
  }

  const handlePageChange = (page) => {
    setCurrentPage(page)
  }

  const handleEditBill = (bill) => {
    setEditBill(bill)
    setIsEditModalOpen(true)
  }

  const handlePreviewBill = (bill) => {
    setPreviewBill(bill)
    setIsPreviewOpen(true)
  }

  const handleDownloadBill = async (billId, billNumber) => {
    try {
      const response = await axios.get(`${API_URL}/api/custom-bills/${billId}/download`, {
        responseType: 'blob',
        withCredentials: true
      })

      const url = window.URL.createObjectURL(new Blob([response.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = `${billNumber}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading bill:', error)
      alert('Failed to download bill. Please try again.')
    }
  }

  const handleDeleteBill = async (billId) => {
    if (!confirm('Are you sure you want to delete this bill?')) {
      return
    }

    try {
      const response = await axios.delete(`${API_URL}/api/custom-bills/${billId}`, { withCredentials: true })

      if (response.data.success) {
        alert('Bill deleted successfully')
        fetchDealerBills()
      } else {
        throw new Error(response.data.message || 'Failed to delete bill')
      }
    } catch (error) {
      console.error('Error deleting bill:', error)
      alert('Failed to delete bill. Please try again.')
    }
  }

  const handleShareBill = async (bill) => {
    try {
      // Fetch the PDF file as a blob
      const response = await axios.get(`${API_URL}/api/custom-bills/${bill._id}/download`, {
        responseType: 'blob',
        withCredentials: true
      })

      // Create a file from the blob
      const pdfFile = new File(
        [response.data],
        `${bill.billNumber}.pdf`,
        { type: 'application/pdf' }
      )

      const shareData = {
        title: `Bill ${bill.billNumber}`,
        text: `Bill for ${bill.customerName} - Amount: ₹${bill.totalAmount?.toLocaleString('en-IN')}`,
        files: [pdfFile]
      }

      // Check if Web Share API is supported and can share files
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData)
      } else {
        // Fallback: Download the file if sharing is not supported
        const url = window.URL.createObjectURL(new Blob([response.data]))
        const a = document.createElement('a')
        a.href = url
        a.download = `${bill.billNumber}.pdf`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
        alert('File sharing not supported on this device. PDF downloaded instead.')
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error sharing bill:', error)
        alert('Failed to share bill. Please try again.')
      }
    }
  }

  const getIncludedItems = (items) => {
    if (!items || !Array.isArray(items)) return []
    return items.map(item => item.description).filter(desc => desc && desc.trim() !== '')
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50'>
      <div className='w-full px-3 md:px-4 lg:px-6 pt-4 lg:pt-6 pb-8'>
        {/* Add Modal */}
        {isAddModalOpen && (
          <AddDealerBillModal
            isOpen={isAddModalOpen}
            onClose={() => setIsAddModalOpen(false)}
            onSuccess={() => {
              fetchDealerBills()
            }}
          />
        )}

        {/* Edit Modal */}
        {isEditModalOpen && editBill && (
          <EditDealerBillModal
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false)
              setEditBill(null)
            }}
            onSuccess={() => {
              fetchDealerBills()
            }}
            billData={editBill}
          />
        )}

        {/* Total Bills Card */}
        <div className='mt-3 mb-4 w-full md:max-w-xs'>
          <div className='bg-white rounded-lg shadow-md border border-transparent p-3 hover:shadow-lg transition-all duration-300'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-xs font-bold text-gray-500 uppercase tracking-wide mb-1'>Total Bills</p>
                <h3 className='text-2xl font-black text-gray-800'>{totalItems}</h3>
              </div>
              <div className='w-11 h-11 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md'>
                <svg className='w-6 h-6 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className='bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden mb-6 md:mb-0'>
          <div className='px-6 py-5 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50'>
            <div className='flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between'>
              {/* Search Bar */}
              <div className='flex-1'>
                <SearchBar
                  value={searchQuery}
                  onChange={(value) => {
                    setSearchQuery(value);
                    setCurrentPage(1);
                  }}
                  placeholder='Search by bill number or customer name...'
                />
              </div>

              {/* Add Button */}
              <AddButton
                onClick={() => setIsAddModalOpen(true)}
                title='Add Dealer Bill'
              />
            </div>
          </div>
        </div>

        {/* Mobile Card View */}
        <div className='md:hidden space-y-4'>
          {loading ? (
            <div className='bg-white rounded-2xl shadow-xl border border-gray-200 p-8'>
              <div className='text-center'>
                <svg className='animate-spin mx-auto h-8 w-8 mb-3 text-indigo-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z' />
                </svg>
                <p className='text-sm font-semibold text-gray-600'>Loading bills...</p>
              </div>
            </div>
          ) : dealerBills.length > 0 ? (
            dealerBills.map((bill, index) => (
              <div key={bill._id} className='bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300'>
                {/* Card Header */}
                <div className='px-3 py-2 bg-gradient-to-r from-gray-600 to-gray-700 border-b border-gray-600'>
                  <div className='text-sm font-mono font-bold text-white'>
                    Bill No - {bill.billNumber || 'N/A'}
                  </div>
                </div>

                {/* Card Body */}
                <div className='p-3 space-y-2'>
                  {/* Customer Name and Date */}
                  <div className='flex items-start justify-between gap-2'>
                    <div>
                      <p className='text-xs text-gray-500 font-medium'>Customer Name</p>
                      <p className='text-sm font-bold text-gray-900'>{bill.customerName || 'N/A'}</p>
                    </div>
                    <div className='text-right'>
                      <p className='text-xs text-gray-500 font-medium'>Date</p>
                      <div className='text-sm text-gray-600'>
                        {bill.billDate || (bill.createdAt ? formatDate(bill.createdAt) : 'N/A')}
                      </div>
                    </div>
                  </div>

                  {/* Items */}
                  {getIncludedItems(bill.items).length > 0 && (
                    <div>
                      <p className='text-xs text-gray-500 font-medium mb-1.5'>Items</p>
                      <div className='flex flex-wrap gap-1'>
                        {getIncludedItems(bill.items).map((item, idx) => (
                          <div key={idx} className='text-xs font-semibold text-gray-900 bg-blue-50 px-2 py-1 rounded-lg border border-blue-200'>
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Total Amount */}
                  <div className='pt-2 border-t border-gray-100'>
                    <p className='text-xs text-gray-500 font-medium'>Total Amount</p>
                    <div className='text-lg font-bold text-indigo-600'>
                      ₹{bill.totalAmount ? bill.totalAmount.toLocaleString('en-IN') : '0'}
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className='px-3 py-2 bg-gray-50 border-t border-gray-200'>
                  <div className='grid grid-cols-5 gap-2'>
                    {/* Preview Button */}
                    <button
                      onClick={() => handlePreviewBill(bill)}
                      className='p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-all'
                      title='Preview'
                    >
                      <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 12a3 3 0 11-6 0 3 3 0 016 0z' />
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' />
                      </svg>
                    </button>

                    {/* Edit Button */}
                    <button
                      onClick={() => handleEditBill(bill)}
                      className='p-2 bg-orange-100 text-orange-600 rounded-lg hover:bg-orange-200 transition-all'
                      title='Edit'
                    >
                      <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' />
                      </svg>
                    </button>

                    {/* Share Button */}
                    <button
                      onClick={() => handleShareBill(bill)}
                      className='p-2 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 transition-all'
                      title='Share'
                    >
                      <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z' />
                      </svg>
                    </button>

                    {/* Download Button */}
                    <button
                      onClick={() => handleDownloadBill(bill._id, bill.billNumber)}
                      className='p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-all'
                      title='Download'
                    >
                      <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' />
                      </svg>
                    </button>

                    {/* Delete Button */}
                    <button
                      onClick={() => handleDeleteBill(bill._id)}
                      className='p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-all'
                      title='Delete'
                    >
                      <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className='bg-white rounded-2xl shadow-xl border border-gray-200 p-12'>
              <div className='text-center text-gray-400'>
                <svg className='mx-auto h-12 w-12 mb-3 text-gray-300' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' />
                </svg>
                <p className='text-sm font-semibold text-gray-600'>No bills found</p>
                <p className='text-xs text-gray-500 mt-1'>Click "Add Dealer Bill" to create your first bill</p>
              </div>
            </div>
          )}
        </div>

        {/* Desktop Table View */}
        <div className='hidden md:block bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden'>
          <div className='overflow-x-auto'>
            <table className='w-full'>
              <thead className={theme.tableHeader}>
                <tr>
                  <th className='px-4 py-4 text-left text-xs font-bold text-white uppercase tracking-wide'>Bill Number</th>
                  <th className='px-4 py-4 text-left text-xs font-bold text-white uppercase tracking-wide'>Customer Name</th>
                  <th className='px-4 py-4 text-left text-xs font-bold text-white uppercase tracking-wide'>Items</th>
                  <th className='px-4 py-4 text-left text-xs font-bold text-white uppercase tracking-wide'>Total Amount</th>
                  <th className='px-4 py-4 text-left text-xs font-bold text-white uppercase tracking-wide'>Date</th>
                  <th className='px-4 py-4 text-center text-xs font-bold text-white uppercase tracking-wide'>Actions</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-gray-200'>
                {loading ? (
                  <tr>
                    <td colSpan='6' className='px-4 py-8 text-center'>
                      <div className='text-gray-400'>
                        <svg className='animate-spin mx-auto h-8 w-8 mb-3 text-indigo-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z' />
                        </svg>
                        <p className='text-sm font-semibold text-gray-600'>Loading bills...</p>
                      </div>
                    </td>
                  </tr>
                ) : dealerBills.length > 0 ? (
                  dealerBills.map((bill) => (
                    <tr key={bill._id} className='hover:bg-gradient-to-r hover:from-blue-50/50 hover:via-indigo-50/50 hover:to-purple-50/50 transition-all duration-200 group'>
                      <td className='px-4 py-4'>
                        <div className='text-sm font-mono font-bold text-gray-900 bg-indigo-100 px-3 py-1.5 rounded-lg inline-block border border-indigo-200'>
                          {bill.billNumber || 'N/A'}
                        </div>
                      </td>
                      <td className='px-4 py-4'>
                        <div className='text-sm font-bold text-gray-900'>
                          {bill.customerName || 'N/A'}
                        </div>
                      </td>
                      <td className='px-4 py-4'>
                        <div className='flex flex-wrap gap-1'>
                          {getIncludedItems(bill.items).map((item, index) => (
                            <div key={index} className='text-xs font-semibold text-gray-900 bg-blue-50 px-2 py-1 rounded-lg border border-blue-200'>
                              {item}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className='px-4 py-4'>
                        <div className='text-lg font-bold text-indigo-600'>
                          ₹{bill.totalAmount ? bill.totalAmount.toLocaleString('en-IN') : '0'}
                        </div>
                      </td>
                      <td className='px-4 py-4'>
                        <div className='text-sm text-gray-600'>
                          {bill.billDate || (bill.createdAt ? formatDate(bill.createdAt) : 'N/A')}
                        </div>
                      </td>
                      <td className='px-4 py-4'>
                        <div className='flex items-center justify-center gap-3'>
                          {/* Preview Button */}
                          <button
                            onClick={() => handlePreviewBill(bill)}
                            className='p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-all'
                            title='Preview Bill'
                          >
                            <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 12a3 3 0 11-6 0 3 3 0 016 0z' />
                              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' />
                            </svg>
                          </button>

                          {/* Edit Button */}
                          <button
                            onClick={() => handleEditBill(bill)}
                            className='p-2 bg-orange-100 text-orange-600 rounded-lg hover:bg-orange-200 transition-all'
                            title='Edit Bill'
                          >
                            <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' />
                            </svg>
                          </button>

                          {/* Share Button */}
                          <button
                            onClick={() => handleShareBill(bill)}
                            className='p-2 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 transition-all'
                            title='Share Bill'
                          >
                            <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z' />
                            </svg>
                          </button>

                          {/* Download Button */}
                          <button
                            onClick={() => handleDownloadBill(bill._id, bill.billNumber)}
                            className='p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-all'
                            title='Download Bill'
                          >
                            <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' />
                            </svg>
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => handleDeleteBill(bill._id)}
                            className='p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-all'
                            title='Delete Bill'
                          >
                            <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan='6' className='px-4 py-8 text-center'>
                      <div className='text-gray-400'>
                        <svg className='mx-auto h-12 w-12 mb-3 text-gray-300' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' />
                        </svg>
                        <p className='text-sm font-semibold text-gray-600'>No bills found</p>
                        <p className='text-xs text-gray-500 mt-1'>Click "Add Dealer Bill" to create your first bill</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className='px-6 py-4 bg-gray-50 border-t border-gray-200'>
              <div className='flex items-center justify-between'>
                <div className='text-sm text-gray-600'>
                  Page {currentPage} of {totalPages}
                </div>
                <div className='flex gap-2'>
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className='px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className='px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Preview Modal */}
        {isPreviewOpen && previewBill && (
          <div className='fixed inset-0 bg-black/70  flex items-center justify-center z-[70] p-4'>
            <div className='bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden'>
              {/* Header */}
              <div className='bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 text-white flex justify-between items-center'>
                <div>
                  <h2 className='text-xl font-bold'>Bill Preview - {previewBill.billNumber}</h2>
                  <p className='text-sm text-blue-100 mt-1'>{previewBill.customerName}</p>
                </div>
                <button
                  onClick={() => setIsPreviewOpen(false)}
                  className='w-10 h-10 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-all'
                >
                  <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                  </svg>
                </button>
              </div>

              {/* PDF Preview */}
              <div className='p-4 bg-gray-100 overflow-auto' style={{ height: 'calc(90vh - 100px)' }}>
                {previewBill.billPdfPath ? (
                  <iframe
                    src={`${API_URL}${previewBill.billPdfPath}`}
                    className='w-full h-full rounded-lg border-2 border-gray-300'
                    title='Bill Preview'
                  />
                ) : (
                  <div className='flex items-center justify-center h-full'>
                    <div className='text-center text-gray-500'>
                      <svg className='mx-auto h-16 w-16 mb-4 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' />
                      </svg>
                      <p className='text-lg font-semibold'>PDF not available</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer with Action Buttons */}
              <div className='px-6 py-4 bg-gray-50 border-t border-gray-200 flex gap-3'>
                <button
                  onClick={() => handleDownloadBill(previewBill._id, previewBill.billNumber)}
                  className='flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-xl hover:shadow-lg transition-all font-semibold flex items-center justify-center gap-2'
                >
                  <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' />
                  </svg>
                  Download PDF
                </button>
                <button
                  onClick={() => setIsPreviewOpen(false)}
                  className='px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all font-semibold'
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default DealerBill
