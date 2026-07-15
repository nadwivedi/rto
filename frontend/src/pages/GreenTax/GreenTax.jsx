import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-toastify'
import * as XLSX from 'xlsx'
import Pagination from '../../components/Pagination'
import AddGreenTaxModal from './components/AddGreenTaxModal'
import GreenTaxDetailModal from './components/GreenTaxDetailModal'
import AddButton from '../../components/AddButton'
import DocumentPreviewModal from '../../components/DocumentPreviewModal'
import SearchBar from '../../components/SearchBar'
import StatisticsCard from '../../components/StatisticsCard'
import MobileCardView from '../../components/MobileCardView'
import { getTheme, getVehicleNumberDesign } from '../../context/ThemeContext'
import { getStatusColor, getStatusText } from '../../utils/statusUtils'
import { getVehicleNumberParts } from '../../utils/vehicleNoCheck'

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'

const GreenTax = () => {
  const navigate = useNavigate()
  const theme = getTheme()
  const vehicleDesign = getVehicleNumberDesign()
  const [records, setRecords] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [previewDoc, setPreviewDoc] = useState(null)
  const [loading, setLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all')
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalRecords: 0, limit: 20 })
  const [stats, setStats] = useState({ total: 0, active: 0, expiringSoon: 0, expired: 0, pendingPaymentCount: 0, pendingPaymentAmount: 0 })

  const fetchStatistics = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/green-tax/statistics`, { withCredentials: true })
      if (response.data.success) {
        const { greenTax, pendingPayments } = response.data.data
        setStats({
          total: greenTax.total, active: greenTax.active, expiringSoon: greenTax.expiringSoon, expired: greenTax.expired,
          pendingPaymentCount: pendingPayments.count, pendingPaymentAmount: pendingPayments.amount
        })
      }
    } catch (error) { console.error('Error fetching statistics:', error) }
  }

  const fetchRecords = async (page = pagination.currentPage) => {
    setLoading(true)
    try {
      let url = `${API_URL}/api/green-tax`
      const params = { page, limit: pagination.limit, search: debouncedSearchQuery }
      if (statusFilter !== 'all') {
        const filterPath = statusFilter.replace('_', '-')
        url = `${API_URL}/api/green-tax/${filterPath}`
      }
      const response = await axios.get(url, { params, withCredentials: true })
      if (response.data.success) {
        setRecords(response.data.data)
        if (response.data.pagination) {
          setPagination({ currentPage: response.data.pagination.currentPage, totalPages: response.data.pagination.totalPages, totalRecords: response.data.pagination.totalRecords, limit: pagination.limit })
        }
      }
    } catch (error) {
      console.error('Error fetching records:', error)
      toast.error('Failed to fetch green tax records. Please check if the backend server is running.', { position: 'top-right', autoClose: 3000 })
    } finally { setLoading(false) }
  }

  useEffect(() => {
    const timer = setTimeout(() => { setDebouncedSearchQuery(searchQuery) }, 500)
    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    if (debouncedSearchQuery.length === 0 || debouncedSearchQuery.length >= 4) {
      fetchRecords(1)
      fetchStatistics()
    }
  }, [debouncedSearchQuery, statusFilter])

  const handlePageChange = (newPage) => { fetchRecords(newPage); window.scrollTo({ top: 0, behavior: 'smooth' }) }

  const handleAddRecord = async () => { await fetchRecords(); await fetchStatistics() }

  const handleEditClick = (record) => { setSelectedRecord(record); setIsEditModalOpen(true) }

  const handleViewClick = (record) => { setSelectedRecord(record); setIsDetailModalOpen(true) }

  const handlePreviewDoc = (record) => { setPreviewDoc(record.greenTaxDocument) }

  const handleEditRecord = async () => { await fetchRecords(); await fetchStatistics(); setIsEditModalOpen(false); setSelectedRecord(null) }

  const handleDeleteRecord = async (record) => {
    if (!window.confirm(`Are you sure you want to delete this green tax record?\n\nVehicle: ${record.vehicleNumber}\nTax Period: ${record.taxFrom} to ${record.taxTo}\n\nThis action cannot be undone.`)) return
    try {
      const response = await axios.delete(`${API_URL}/api/green-tax/${record._id}`, { withCredentials: true })
      if (response.data.success) {
        toast.success('Green tax record deleted successfully!', { position: 'top-right', autoClose: 3000 })
        await fetchRecords()
      } else { toast.error(response.data.message || 'Failed to delete record', { position: 'top-right', autoClose: 3000 }) }
    } catch (error) { toast.error('Error deleting record', { position: 'top-right', autoClose: 3000 }); console.error('Error:', error) }
  }

  const handleMarkAsPaid = async (record) => {
    if (!window.confirm(`Mark this payment as PAID?\n\nVehicle: ${record.vehicleNumber}\nTotal: ₹${(record.totalAmount || 0).toLocaleString('en-IN')}\nBalance: ₹${(record.balanceAmount || 0).toLocaleString('en-IN')}\n\nThis sets Paid = Total and Balance = 0`)) return
    try {
      const response = await axios.patch(`${API_URL}/api/green-tax/${record._id}/mark-as-paid`, {}, { withCredentials: true })
      if (!response.data.success) throw new Error(response.data.message || 'Failed to mark payment as paid')
      toast.success('Payment marked as paid!', { position: 'top-right', autoClose: 3000 })
      await fetchRecords()
    } catch (error) { toast.error(`Failed: ${error.message}`, { position: 'top-right', autoClose: 3000 }) }
  }

  const handleWhatsAppClick = async (record) => {
    if (!record.mobileNumber || record.mobileNumber === 'N/A') {
      toast.error('Mobile number not available', { position: 'top-right', autoClose: 3000 }); return
    }
    try {
      await axios.patch(`${API_URL}/api/green-tax/${record._id}/whatsapp-increment`, {}, { withCredentials: true })
    } catch (error) { console.error('Error incrementing WhatsApp count:', error) }

    let phoneNumber = record.mobileNumber.replace(/\D/g, '')
    if (!phoneNumber.startsWith('91')) phoneNumber = '91' + phoneNumber

    let message = `Hello,\n\n`
    if ((record.balanceAmount || 0) > 0) {
      message += `Your payment of ₹${(record.balanceAmount || 0).toLocaleString('en-IN')} is pending for Green Tax.\n`
      message += `Vehicle Number: ${record.vehicleNumber}\n\n`
    }
    if (record.status === 'expiring_soon' || record.status === 'expired') {
      const statusText = record.status === 'expired' ? 'has expired' : 'is going to expire'
      message += `Your Green Tax ${statusText} on ${record.taxTo}.\n`
      message += `Vehicle Number: ${record.vehicleNumber}\n`
      message += `Please renew your green tax at the earliest.\n\n`
    }
    message += `Thank you for your cooperation.`

    const whatsappURL = `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`
    window.location.href = whatsappURL
  }

  const shouldShowWhatsAppButton = (record) => (record.status === 'expiring_soon' || record.status === 'expired' || (record.balanceAmount || 0) > 0)

  const handleExportExcel = async () => {
    try {
      const params = { ...(statusFilter !== 'all' ? { status: statusFilter } : {}), ...(debouncedSearchQuery ? { search: debouncedSearchQuery } : {}) }
      const response = await axios.get(`${API_URL}/api/green-tax/export`, { params, withCredentials: true })
      if (!response.data.success) { toast.error('Failed to export', { position: 'top-right', autoClose: 3000 }); return }
      const data = response.data.data
      if (!data || data.length === 0) { toast.info('No records to export', { position: 'top-right', autoClose: 3000 }); return }

      const mapped = data.map(item => ({
        'Vehicle Number': item.vehicleNumber, 'Owner Name': item.ownerName, 'Mobile Number': item.mobileNumber,
        'Date of Work': item.date, 'Tax From': item.taxFrom, 'Tax To': item.taxTo,
        'Total Amount': item.totalAmount || 0, 'Paid Amount': item.paidAmount || 0, 'Balance': item.balanceAmount || 0,
        'Status': item.status, 'Remarks': item.remarks || ''
      }))
      const ws = XLSX.utils.json_to_sheet(mapped)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'GreenTax')
      XLSX.writeFile(wb, `GreenTax_${new Date().toISOString().split('T')[0]}.xlsx`)
      toast.success(`Exported ${data.length} records`, { position: 'top-right', autoClose: 3000 })
    } catch (error) { console.error('Error exporting:', error); toast.error('Failed to export', { position: 'top-right', autoClose: 3000 }) }
  }

  const filteredRecords = records

  return (
    <>
      <div className='min-h-screen bg-gradient-to-br from-gray-50 via-green-50 to-emerald-50'>
        <div className='w-full px-3 md:px-4 lg:px-6 pt-4 lg:pt-6 pb-8'>
          <div className='mb-2 mt-3'>
            <div className='flex items-center gap-3 mb-5'>
              <button onClick={() => navigate('/')} className='flex items-center justify-center w-10 h-10 rounded-xl bg-white border border-gray-200 shadow-sm hover:shadow-md hover:border-green-300 transition-all cursor-pointer flex-shrink-0' title='Back to Home'>
                <svg className='w-5 h-5 text-gray-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M10 19l-7-7m0 0l7-7m-7 7h18' />
                </svg>
              </button>
              <div className='grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-3 flex-1'>
                <StatisticsCard title='Total Green Tax Records' value={stats.total} color='green' isActive={statusFilter === 'all'} onClick={() => setStatusFilter('all')} icon={<svg className='w-4 h-4 lg:w-6 lg:h-6 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' /></svg>} />
                <StatisticsCard title='Expiring Soon' value={stats.expiringSoon} subtext='Within 30 days' color='orange' isActive={statusFilter === 'expiring_soon'} onClick={() => setStatusFilter(statusFilter === 'expiring_soon' ? 'all' : 'expiring_soon')} icon={<svg className='w-4 h-4 lg:w-6 lg:h-6 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' /></svg>} />
                <StatisticsCard title='Expired' value={stats.expired} subtext='expired green tax' color='red' isActive={statusFilter === 'expired'} onClick={() => setStatusFilter(statusFilter === 'expired' ? 'all' : 'expired')} icon={<svg className='w-4 h-4 lg:w-6 lg:h-6 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' /></svg>} />
                <StatisticsCard title='Pending Payment' value={stats.pendingPaymentCount} extraValue={`₹${stats.pendingPaymentAmount.toLocaleString('en-IN')}`} color='amber' isActive={statusFilter === 'pending'} onClick={() => setStatusFilter(statusFilter === 'pending' ? 'all' : 'pending')} icon={<svg className='w-4 h-4 lg:w-6 lg:h-6 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' /></svg>} />
              </div>
            </div>
          </div>

          {loading && (
            <div className='flex flex-col justify-center items-center py-20'>
              <div className='relative'>
                <div className='w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl animate-pulse shadow-lg'></div>
                <div className='absolute inset-0 w-16 h-16 border-4 border-emerald-600 border-t-transparent rounded-2xl animate-spin'></div>
              </div>
              <div className='mt-6 text-center'>
                <p className='text-xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-1'>Loading Green Tax Records</p>
                <p className='text-sm text-gray-600'>Please wait while we fetch your data...</p>
              </div>
            </div>
          )}

          {!loading && (
            <>
              <div className='bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden'>
                <div className='px-6 py-5 bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 border-b border-gray-200'>
                  <div className='flex flex-col lg:flex-row gap-2 items-stretch lg:items-center'>
                    <SearchBar value={searchQuery} onChange={(value) => setSearchQuery(value)} placeholder='Search by vehicle no or owner...' toUpperCase={true} />
                    <AddButton onClick={() => setIsAddModalOpen(true)} title='New Green Tax Record' />
                    <button onClick={handleExportExcel} className='flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:shadow-lg font-bold text-xs transition-all hover:scale-105 cursor-pointer'>
                      <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4' /></svg>
                      Export Excel
                    </button>
                  </div>
                </div>

                <MobileCardView
                  records={filteredRecords}
                  loading={loading}
                  searchQuery={searchQuery}
                  emptyMessage={{ title: 'No Green Tax Records Found', description: 'Get started by adding your first green tax record.' }}
                  loadingMessage='Loading green tax records...'
                  headerGradient='from-green-50 via-emerald-50 to-teal-50'
                  avatarGradient='from-green-500 to-emerald-500'
                  emptyIconGradient='from-green-100 to-emerald-100'
                  emptyIconColor='text-green-400'
                  cardConfig={{
                    header: {
                      avatar: null,
                      title: (record) => record.vehicleNumber,
                      subtitle: (record) => record.mobileNumber ? (
                        <a href={`tel:${record.mobileNumber}`} className='flex items-center mt-1 text-blue-600 font-semibold hover:text-blue-700 transition-all cursor-pointer underline decoration-blue-400 underline-offset-2'>
                          <svg className='w-3.5 h-3.5 mr-1 text-blue-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z' /></svg>
                          {record.mobileNumber}
                        </a>
                      ) : null,
                      extraInfo: null,
                      showVehicleParts: true,
                    },
                    body: {
                      showStatus: false,
                      showPayment: true,
                      showValidity: true,
                      customFields: [
                        {
                          render: (record) => (
                            <div className='flex items-center justify-between gap-2 pb-2.5 border-b border-gray-100'>
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap ${getStatusColor(record.status)}`}>{getStatusText(record.status)}</span>
                              <span className='text-xs font-medium text-gray-700'>{record.ownerName || ''}</span>
                            </div>
                          ),
                        },
                      ],
                    },
                    footer: null,
                  }}
                  actions={[
                    {
                      title: 'WhatsApp Reminder', condition: shouldShowWhatsAppButton, onClick: handleWhatsAppClick,
                      bgColor: 'bg-green-50', textColor: 'text-green-600', hoverBgColor: 'bg-green-100',
                      icon: <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 24 24'><path d='M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z' /></svg>,
                    },
                    {
                      title: 'Mark as Paid', condition: (record) => (record.balanceAmount || 0) > 0, onClick: handleMarkAsPaid,
                      bgColor: 'bg-green-100', textColor: 'text-green-600', hoverBgColor: 'bg-green-200',
                      icon: <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' /></svg>,
                    },
                    {
                      title: 'View Document', condition: (record) => !!record.greenTaxDocument, onClick: (record) => handlePreviewDoc(record),
                      bgColor: 'bg-sky-100', textColor: 'text-sky-600', hoverBgColor: 'bg-sky-200',
                      icon: <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 12a3 3 0 11-6 0 3 3 0 016 0z' /><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' /></svg>,
                    },
                    {
                      title: 'Edit Record', onClick: handleEditClick, bgColor: 'bg-amber-100', textColor: 'text-amber-600', hoverBgColor: 'bg-amber-200',
                      icon: <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' /></svg>,
                    },
                    {
                      title: 'Delete Record', onClick: handleDeleteRecord, bgColor: 'bg-red-100', textColor: 'text-red-600', hoverBgColor: 'bg-red-200',
                      icon: <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' /></svg>,
                    },
                  ]}
                  pagination={{
                    currentPage: pagination.currentPage, totalPages: pagination.totalPages, onPageChange: handlePageChange,
                    totalRecords: pagination.totalRecords, limit: pagination.limit,
                  }}
                />

                <div className='hidden lg:block overflow-x-auto'>
                  <table className='w-full'>
                    <thead className={theme.tableHeader}>
                      <tr>
                        <th className='px-4 2xl:px-6 py-3 2xl:py-4 text-left text-[10px] 2xl:text-xs font-bold text-white uppercase tracking-wider'>Date</th>
                        <th className='px-4 2xl:px-6 py-3 2xl:py-4 text-left text-[10px] 2xl:text-xs font-bold text-white uppercase tracking-wider'>Vehicle / Owner</th>
                        <th className='px-4 2xl:px-6 py-3 2xl:py-4 text-left text-[10px] 2xl:text-xs font-bold text-white uppercase tracking-wider'>Mobile</th>
                        <th className='px-4 2xl:px-6 py-3 2xl:py-4 text-left text-[10px] 2xl:text-xs font-bold text-white uppercase tracking-wider'>Tax Period</th>
                        <th className='px-4 2xl:px-6 py-3 2xl:py-4 text-center text-[10px] 2xl:text-xs font-bold text-white uppercase tracking-wider bg-white/10'>Payment</th>
                        <th className='px-4 2xl:px-6 py-3 2xl:py-4 text-center text-[10px] 2xl:text-xs font-bold text-white uppercase tracking-wider'>Status</th>
                        <th className='px-4 2xl:px-6 py-3 2xl:py-4 text-center text-[10px] 2xl:text-xs font-bold text-white uppercase tracking-wider'>Actions</th>
                      </tr>
                    </thead>
                    <tbody className='divide-y divide-gray-100'>
                      {filteredRecords.length > 0 ? (
                        filteredRecords.map((record) => (
                          <tr key={record._id} className='hover:bg-gradient-to-r hover:from-green-50 hover:via-emerald-50 hover:to-teal-50 transition-all duration-300 group'>
                            <td className='px-4 2xl:px-6 py-3 2xl:py-5 whitespace-nowrap'>
                              <span className='inline-flex items-center px-2 py-1 2xl:px-3 2xl:py-1.5 rounded-lg bg-green-50 text-green-700 font-semibold border border-green-200 text-[11px] 2xl:text-[13.8px]'>
                                <svg className='w-3 h-3 2xl:w-4 2xl:h-4 mr-1 2xl:mr-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' /></svg>
                                {record.date || '-'}
                              </span>
                            </td>
                            <td className='px-4 2xl:px-6 py-3 2xl:py-5'>
                              <div className='flex flex-col gap-1.5'>
                                <span className='text-[11px] 2xl:text-[13px] font-bold text-gray-900 truncate max-w-[160px] block'>{record.ownerName || 'N/A'}</span>
                                {record.vehicleNumber && (
                                  <div className='flex items-center gap-2'>
                                    <svg className='w-4 h-4 text-gray-500 flex-shrink-0' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z' />
                                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 004 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0' />
                                    </svg>
                                    {(() => {
                                      const parts = getVehicleNumberParts(record.vehicleNumber)
                                      if (!parts) return <span className='text-[12px] 2xl:text-[14px] font-bold text-blue-900'>{record.vehicleNumber}</span>
                                      return <div className={vehicleDesign.container + ' scale-90 -ml-2 origin-left'}>
                                        <span className={vehicleDesign.stateCode}>{parts.stateCode}</span>
                                        <span className={vehicleDesign.districtCode}>{parts.districtCode}</span>
                                        <span className={vehicleDesign.series}>{parts.series}</span>
                                        <span className={vehicleDesign.last4Digits}>{parts.last4Digits}</span>
                                      </div>
                                    })()}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className='px-4 2xl:px-6 py-3 2xl:py-5'>
                              {record.mobileNumber && (
                                <div className='flex items-center gap-1.5'>
                                  <svg className='w-3 h-3 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z' /></svg>
                                  <span className='text-[10px] 2xl:text-[12px] font-semibold text-gray-500'>{record.mobileNumber}</span>
                                </div>
                              )}
                            </td>
                            <td className='px-4 2xl:px-6 py-3 2xl:py-5 whitespace-nowrap'>
                              <div className='flex flex-col text-[11px] 2xl:text-[13px]'>
                                <span className='inline-flex items-center px-2 py-0.5 rounded-t-lg bg-green-50 text-green-700 font-semibold border border-green-200'>
                                  <svg className='w-3 h-3 2xl:w-3.5 2xl:h-3.5 mr-1' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 10l7-7m0 0l7 7m-7-7v18' /></svg>
                                  {record.taxFrom}
                                </span>
                                <span className='inline-flex items-center px-2 py-0.5 rounded-b-lg bg-red-50 text-red-700 font-semibold border border-red-200 -mt-px'>
                                  <svg className='w-3 h-3 2xl:w-3.5 2xl:h-3.5 mr-1' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 12a3 3 0 11-6 0 3 3 0 016 0z' /><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' /></svg>
                                  {record.taxTo}
                                </span>
                              </div>
                            </td>
                            <td className='px-4 py-3 2xl:py-4 bg-gray-50/50 group-hover:bg-green-50/30'>
                              <div className='flex items-center justify-center gap-3 2xl:gap-4'>
                                <div className='text-center min-w-[60px]'>
                                  <div className='text-[11px] 2xl:text-sm font-bold text-gray-900'>₹{(record.totalAmount || 0).toLocaleString('en-IN')}</div>
                                  <div className='text-[9px] 2xl:text-[10px] text-gray-500'>Total</div>
                                </div>
                                <div className='w-px h-8 bg-gray-200'></div>
                                <div className='text-center min-w-[60px]'>
                                  <div className='text-[11px] 2xl:text-sm font-bold text-emerald-600'>₹{(record.paidAmount || 0).toLocaleString('en-IN')}</div>
                                  <div className='text-[9px] 2xl:text-[10px] text-emerald-600'>Paid</div>
                                </div>
                                <div className='w-px h-8 bg-gray-200'></div>
                                <div className='text-center min-w-[60px]'>
                                  <div className={`text-[11px] 2xl:text-sm font-bold ${(record.balanceAmount || 0) > 0 ? 'text-orange-600' : 'text-gray-500'}`}>₹{(record.balanceAmount || 0).toLocaleString('en-IN')}</div>
                                  <div className={`text-[9px] 2xl:text-[10px] ${(record.balanceAmount || 0) > 0 ? 'text-orange-600' : 'text-gray-500'}`}>{(record.balanceAmount || 0) > 0 ? 'Due' : 'Cleared'}</div>
                                </div>
                              </div>
                            </td>
                            <td className='px-4 2xl:px-6 py-3 2xl:py-5'>
                              <div className='flex items-center justify-center'>
                                <span className={`px-2 py-1 2xl:px-3 2xl:py-1.5 rounded-full text-[10px] 2xl:text-xs font-bold ${getStatusColor(record.status)}`}>{getStatusText(record.status)}</span>
                              </div>
                            </td>
                            <td className='px-4 2xl:px-6 py-3 2xl:py-5'>
                              <div className='flex items-center justify-end gap-0.5 2xl:gap-0.5 pr-1'>
                                <button onClick={() => handleViewClick(record)} className='p-1.5 2xl:p-2 text-green-600 hover:bg-green-100 rounded-lg transition-all group-hover:scale-110 duration-200' title='View Details'>
                                  <svg className='w-4 h-4 2xl:w-5 2xl:h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 12a3 3 0 11-6 0 3 3 0 016 0z' /><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' /></svg>
                                </button>
                                {record.greenTaxDocument && (
                                  <button onClick={() => handlePreviewDoc(record)} className='p-1.5 2xl:p-2 text-sky-600 hover:bg-sky-100 rounded-lg transition-all group-hover:scale-110 duration-200' title='View Document'>
                                    <svg className='w-4 h-4 2xl:w-5 2xl:h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 12a3 3 0 11-6 0 3 3 0 016 0z' /><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' /></svg>
                                  </button>
                                )}
                                <button onClick={() => handleEditClick(record)} className='p-1.5 2xl:p-2 text-amber-600 hover:bg-amber-100 rounded-lg transition-all group-hover:scale-110 duration-200' title='Edit Record'>
                                  <svg className='w-4 h-4 2xl:w-5 2xl:h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' /></svg>
                                </button>
                                <button onClick={() => handleDeleteRecord(record)} className='p-1.5 2xl:p-2 text-red-600 hover:bg-red-100 rounded-lg transition-all group-hover:scale-110 duration-200' title='Delete Record'>
                                  <svg className='w-4 h-4 2xl:w-5 2xl:h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' /></svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan='7' className='px-6 py-16'>
                            <div className='flex flex-col items-center justify-center'>
                              <div className='w-24 h-24 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center mb-6 shadow-lg'>
                                <svg className='w-12 h-12 text-green-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' /></svg>
                              </div>
                              <h3 className='text-xl font-black text-gray-700 mb-2'>No Green Tax Records Found</h3>
                              <p className='text-sm text-gray-500 mb-6 max-w-md text-center'>
                                {searchQuery ? "No records match your search criteria. Try adjusting your search terms." : "Get started by adding your first green tax record."}
                              </p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {!loading && filteredRecords.length > 0 && (
                  <Pagination currentPage={pagination.currentPage} totalPages={pagination.totalPages} onPageChange={handlePageChange} totalRecords={pagination.totalRecords} itemsPerPage={pagination.limit} />
                )}
              </div>
            </>
          )}

          {isAddModalOpen && <AddGreenTaxModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onSubmit={handleAddRecord} />}
          {isEditModalOpen && <AddGreenTaxModal isOpen={isEditModalOpen} onClose={() => { setIsEditModalOpen(false); setSelectedRecord(null) }} onSubmit={handleEditRecord} initialData={selectedRecord} isEditMode={true} />}
          {isDetailModalOpen && <GreenTaxDetailModal isOpen={isDetailModalOpen} onClose={() => { setIsDetailModalOpen(false); setSelectedRecord(null) }} record={selectedRecord} />}
          {previewDoc && <DocumentPreviewModal isOpen={!!previewDoc} onClose={() => setPreviewDoc(null)} docField={previewDoc} title='Green Tax Document' />}
        </div>
      </div>
    </>
  )
}

export default GreenTax
