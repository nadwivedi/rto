import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-toastify'
import { getDaysRemaining, parseFormattedDate } from '../../utils/dateHelpers'
import Pagination from '../../components/Pagination'
import IssueNewPermitModal from './components/IssueNewPermitModal'
import EditNationalPermitModal from './components/EditNationalPermitModal'
import NationalPermitDetailsModal from './components/NationalPermitDetailsModal'
import AddButton from '../../components/AddButton'
import SearchBar from '../../components/SearchBar'
import StatisticsCard from '../../components/StatisticsCard'
import MobileCardView from '../../components/MobileCardView'
import { getTheme, getVehicleNumberDesign } from '../../context/ThemeContext'
import { getVehicleNumberParts } from '../../utils/vehicleNoCheck'

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'

const NationalPermit = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const theme = getTheme()
  const vehicleDesign = getVehicleNumberDesign()
  const [permits, setPermits] = useState([])

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPermit, setSelectedPermit] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showIssuePermitModal, setShowIssuePermitModal] = useState(false)
  const [showEditPermitModal, setShowEditPermitModal] = useState(false)
  const [editingPermit, setEditingPermit] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [dateFilter, setDateFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('all') // 'all', 'partAExpiring', 'partBExpiring', 'partAExpired', 'partBExpired', 'pending'
  const [statistics, setStatistics] = useState({
    total: 0,
    active: 0,
    partAExpiringSoon: 0,
    partBExpiringSoon: 0,
    partAExpired: 0,
    partBExpired: 0,
    pendingPaymentCount: 0,
    pendingPaymentAmount: 0
  })
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalRecords: 0,
    limit: 20
  })

  // Helper function to check if Part B is expiring soon or expired
  const isPartBExpiringSoon = (expiryDate, daysThreshold = 30) => {
    if (!expiryDate || expiryDate === 'N/A') return false

    const expiry = parseFormattedDate(expiryDate)
    if (!expiry) return false

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const daysRemaining = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24))

    // Show button if expired (daysRemaining < 0) OR expiring within threshold
    return daysRemaining <= daysThreshold
  }

  // Helper function to format last WhatsApp sent date
  const formatWhatsAppDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hr${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;

    // Format as date if older than a week
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  };

  // Helper function to open WhatsApp with custom message
  const handleWhatsAppClick = async (permit) => {
    if (!permit.mobileNumber || permit.mobileNumber === 'N/A') {
      toast.error('Mobile number not available for this permit', {
        position: 'top-right',
        autoClose: 3000
      })
      return
    }

    // Format mobile number (remove spaces, dashes, etc.)
    let phoneNumber = permit.mobileNumber.replace(/\D/g, '')

    // Add country code if not present (assuming India +91)
    if (!phoneNumber.startsWith('91') && phoneNumber.length === 10) {
      phoneNumber = '91' + phoneNumber
    }

    // Create custom message
    let message = `Hello ${permit.permitHolder},\n\n`
    message += `This is a reminder regarding your National Permit.\n\n`

    // Check Part A status
    const partADate = parseFormattedDate(permit.partAValidTo)
    if (partADate) {
      const partADaysRemaining = getDaysRemaining(partADate)
      if (partADaysRemaining <= 30) {
        const partAStatus = partADaysRemaining < 0 ? 'has expired' : 'is going to expire'
        message += `*Part A Status:*\n`
        message += `Your Part A permit ${partAStatus} on ${permit.partAValidTo}.\n`
        message += `Permit Number: ${permit.permitNumber}\n\n`
      }
    }

    // Check Part B status
    const partBDate = parseFormattedDate(permit.partBValidTo)
    if (partBDate) {
      const partBDaysRemaining = getDaysRemaining(partBDate)
      if (partBDaysRemaining <= 30) {
        const partBStatus = partBDaysRemaining < 0 ? 'has expired' : 'is going to expire'
        message += `*Part B Status:*\n`
        message += `Your Part B authorization ${partBStatus} on ${permit.partBValidTo}.\n`
        message += `Authorization Number: ${permit.partBNumber}\n\n`
      }
    }

    // Check balance
    if ((permit.balance || 0) > 0) {
      message += `*Pending Payment:*\n`
      message += `Balance Amount: ₹${permit.balance}\n`
      message += `Total Fee: ₹${permit.totalFee}\n`
      message += `Paid: ₹${permit.paid}\n\n`
    }

    message += `Vehicle Number: ${permit.vehicleNo}\n`
    message += `Please take necessary action at the earliest.\n\n`
    message += `Thank you for your cooperation.`

    // Increment WhatsApp message count in backend
    try {
      const response = await axios.patch(
        `${API_URL}/api/national-permits/${permit._id}/whatsapp-increment`,
        {},
        { withCredentials: true }
      );

      // Update local state immediately to show the tracking strip
      if (response.data.success) {
        setPermits(prevPermits =>
          prevPermits.map(p =>
            p._id === permit._id
              ? {
                  ...p,
                  whatsappMessageCount: response.data.data.whatsappMessageCount,
                  lastWhatsappSentAt: response.data.data.lastWhatsappSentAt
                }
              : p
          )
        );
      }
    } catch (error) {
      console.error('Error incrementing WhatsApp count:', error);
      // Don't block the WhatsApp action if the increment fails
    }

    // Open WhatsApp directly (not web)
    const whatsappURL = `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`
    window.location.href = whatsappURL
  }

  // Determine if WhatsApp button should be shown
  const shouldShowWhatsAppButton = (permit) => {
    // Parse dates in DD-MM-YYYY format
    const partADate = parseFormattedDate(permit.partAValidTo)
    const partBDate = parseFormattedDate(permit.partBValidTo)

    const partAExpiring = partADate !== null && getDaysRemaining(partADate) <= 30
    const partBExpiring = partBDate !== null && getDaysRemaining(partBDate) <= 30
    const hasBalance = (permit.balance || 0) > 0

    return partAExpiring || partBExpiring || hasBalance
  }

  // Helper function to check if Part A is expiring soon or expired
  const isPartAExpiringSoon = (expiryDate, daysThreshold = 30) => {
    if (!expiryDate || expiryDate === 'N/A') return false

    const expiry = parseFormattedDate(expiryDate)
    if (!expiry) return false

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const daysRemaining = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24))

    // Show button if expired (daysRemaining < 0) OR expiring within threshold
    return daysRemaining <= daysThreshold
  }

  const fetchStatistics = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/national-permits/statistics`, { withCredentials: true })
      if (response.data.success) {
        setStatistics({
          total: response.data.data.total,
          active: response.data.data.active,
          partAExpiringSoon: response.data.data.partAExpiringSoon,
          partBExpiringSoon: response.data.data.partBExpiringSoon,
          partAExpired: response.data.data.partAExpired,
          partBExpired: response.data.data.partBExpired,
          pendingPaymentCount: response.data.data.pendingPaymentCount,
          pendingPaymentAmount: response.data.data.pendingPaymentAmount
        })
      }
    } catch (error) {
      console.error('Error fetching National Permit statistics:', error)
    }
  }

  // Fetch permits from backend on component mount and when filters change
  useEffect(() => {
    fetchPermits(1)
    fetchStatistics()
  }, [searchQuery, dateFilter, statusFilter]) // Re-fetch when filters change

  useEffect(() => {
    if (!location.state?.openAddModal) return

    setShowIssuePermitModal(true)
    navigate(location.pathname, { replace: true, state: {} })
  }, [location.pathname, location.state, navigate])

  const fetchPermits = async (page = pagination.currentPage) => {
    try {
      setLoading(true)
      setError(null)

      // Build URL based on status filter (like CG Permit)
      let url = `${API_URL}/api/national-permits`

      // Map status filter to endpoint path
      if (statusFilter !== 'all') {
        const filterPath = statusFilter.replace(/([A-Z])/g, '-$1').toLowerCase() // Convert camelCase to kebab-case
        url = `${API_URL}/api/national-permits/${filterPath}`
      }

      // Build query parameters
      const params = {
        page: page.toString(),
        limit: pagination.limit.toString(),
        search: searchQuery
      }

      if (dateFilter && dateFilter !== 'All') {
        params.dateFilter = dateFilter
      }

      const response = await axios.get(url, {
        params,
        withCredentials: true
      })

      // Update pagination info
      if (response.data.pagination) {
        setPagination({
          currentPage: response.data.pagination.currentPage,
          totalPages: response.data.pagination.totalPages,
          totalRecords: response.data.pagination.totalRecords,
          limit: pagination.limit
        })
      }

      // Transform backend data to match frontend structure
      // Flat model - direct field access
      const transformedPermits = response.data.data.map(record => ({
        _id: record._id,
        id: record._id,
        permitNumber: record.permitNumber,
        permitHolder: record.permitHolder,
        vehicleNo: record.vehicleNumber,
        mobileNumber: record.mobileNumber || 'N/A',
        issueDate: record.createdAt,
        validTill: record.partAValidTo,
        status: record.partBStatus,
        totalFee: record.totalFee || 0,
        paid: record.paid || 0,
        balance: record.balance || 0,
        isRenewed: record.isRenewed,
        partAValidFrom: record.partAValidFrom,
        partAValidTo: record.partAValidTo,
        partBValidFrom: record.partBValidFrom,
        partBValidTo: record.partBValidTo,
        partBNumber: record.authNumber,
        whatsappMessageCount: record.whatsappMessageCount || 0,
        lastWhatsappSentAt: record.lastWhatsappSentAt || null,

        partA: {
          _id: record._id,
          permitNumber: record.permitNumber,
          permitType: 'National Permit',
          ownerName: record.permitHolder,
          ownerMobile: record.mobileNumber || 'N/A',
          vehicleNumber: record.vehicleNumber,
          permitValidFrom: record.partAValidFrom,
          permitValidUpto: record.partAValidTo,
          issueDate: record.createdAt,
          status: record.partAStatus,
          partADocument: record.partADocument
        },

        partB: {
          _id: record._id,
          permitNumber: record.permitNumber,
          authorizationNumber: record.authNumber || 'N/A',
          validFrom: record.partBValidFrom || 'N/A',
          validTo: record.partBValidTo || 'N/A',
          authorization: record.authNumber || 'N/A',
          totalFee: record.totalFee || 0,
          paid: record.paid || 0,
          balance: record.balance || 0,
          status: record.partBStatus,
          createdAt: record.createdAt,
          isRenewed: record.isRenewed,
          partBDocument: record.partBDocument
        },

        notes: record.notes || ''
      }))

      setPermits(transformedPermits)
    } catch (error) {
      console.error('Error fetching permits:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  // Helper to convert DD-MM-YYYY to Date object
  const parseDate = (dateStr) => {
    if (!dateStr) return null

    // If it's already a valid date string (YYYY-MM-DD or ISO format)
    const standardDate = new Date(dateStr)
    if (!isNaN(standardDate.getTime())) {
      return standardDate
    }

    // Try DD-MM-YYYY format
    const parts = dateStr.split(/[/-]/)
    if (parts.length === 3) {
      const [day, month, year] = parts
      const parsedDate = new Date(year, month - 1, day)
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate
      }
    }

    return null
  }

  // Use permits directly since filtering is done on backend
  const filteredPermits = permits

  // Use statistics from backend (no local calculation needed)
  const stats = {
    total: statistics.total,
    expiring: statistics.partAExpiringSoon,
    partBExpiring: statistics.partBExpiringSoon,
    partAExpired: statistics.partAExpired,
    partBExpired: statistics.partBExpired,
    pendingPaymentCount: statistics.pendingPaymentCount,
    pendingPaymentAmount: statistics.pendingPaymentAmount
  }

  const handleViewDetails = (permit) => {
    setSelectedPermit(permit)
    setShowDetailsModal(true)
  }

  const handleEditPermit = (permit) => {
    // Permit already has the correct id from flat model transformation
    setEditingPermit(permit)
    setShowEditPermitModal(true)
  }

  const handleDeletePermit = async (id) => {
    // Show confirmation dialog
    if (!window.confirm('Are you sure you want to delete this Part B record? This will only delete this specific Part B renewal, not the entire permit.')) {
      return
    }

    try {
      const response = await axios.delete(`${API_URL}/api/national-permits/${id}`, { withCredentials: true })

      if (response.data.success) {
        toast.success('Part B record deleted successfully!', { position: 'top-right', autoClose: 3000 })
        fetchPermits()
        fetchStatistics()
      } else {
        toast.error(response.data.message || 'Failed to delete Part B record', { position: 'top-right', autoClose: 3000 })
      }
    } catch (error) {
      toast.error('Error deleting Part B record. Please try again.', { position: 'top-right', autoClose: 3000 })
      console.error('Error:', error)
    }
  }

  // Mark Part B as paid
  const handleMarkAsPaid = async (permit) => {
    const confirmPaid = window.confirm(
      `Are you sure you want to mark this Part B payment as PAID?\n\n` +
      `Part B Number: ${permit.partB?.authorizationNumber || 'N/A'}\n` +
      `Permit Number: ${permit.permitNumber}\n` +
      `Vehicle Number: ${permit.vehicleNo}\n` +
      `Total Fee: ₹${(permit.totalFee || 0).toLocaleString('en-IN')}\n` +
      `Current Balance: ₹${(permit.balance || 0).toLocaleString('en-IN')}\n\n` +
      `This will set Paid = ₹${(permit.totalFee || 0).toLocaleString('en-IN')} and Balance = ₹0`
    );

    if (!confirmPaid) return;

    try {
      const response = await axios.patch(`${API_URL}/api/national-permits/${permit.id}/mark-as-paid`, {}, { withCredentials: true });
      if (!response.data.success) throw new Error(response.data.message || 'Failed to mark payment as paid');

      toast.success('Part B payment marked as paid successfully!', { position: 'top-right', autoClose: 3000 });
      fetchPermits();
      fetchStatistics();
    } catch (error) {
      console.error('Error marking Part B payment as paid:', error);
      toast.error(`Failed to mark Part B payment as paid: ${error.message}`, { position: 'top-right', autoClose: 3000 });
    }
  };

  // Page change handler
  const handlePageChange = (newPage) => {
    fetchPermits(newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleFilterChange = (filterType, value) => {
    if (filterType === 'date') {
      setDateFilter(value)
    }
  }

  const handleIssuePermit = async () => {
    // Modal handles API call internally, just refresh data
    await fetchPermits()
    await fetchStatistics()
  }

  const handleUpdatePermit = async (formData) => {
    try {
      // Prepare data to match backend controller expectations (flat model)
      const permitData = {
        permitNumber: formData.permitNumber || '',
        mobileNumber: formData.mobileNumber || '',
        permitHolder: formData.permitHolderName,
        partAValidFrom: formData.validFrom,
        partAValidTo: formData.validTo,
        partBNumber: formData.authorizationNumber || '',
        partBValidFrom: formData.typeBValidFrom || '',
        partBValidTo: formData.typeBValidTo || '',
        totalFee: Number(formData.totalFee) || 0,
        paid: Number(formData.paid) || 0,
        balance: Number(formData.balance) || 0,
        notes: formData.notes || ''
      }

      // Make PUT request to backend
      const response = await axios.put(`${API_URL}/api/national-permits/${editingPermit.id}`, permitData, { withCredentials: true })

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to update permit')
      }

      // Show success message
      toast.success('National Permit updated successfully!', { position: 'top-right', autoClose: 3000 })

      // Refresh the permits list and statistics
      await fetchPermits()
      await fetchStatistics()

      // Close modal
      setShowEditPermitModal(false)
      setEditingPermit(null)
    } catch (error) {
      console.error('Error updating permit:', error)

      // Handle detailed error response from backend
      if (error.response?.data) {
        const errorData = error.response.data

        // Show main error message
        const mainMessage = errorData.errorCount > 1
          ? `${errorData.message} (${errorData.errorCount} errors)`
          : (errorData.message || 'Failed to update permit')

        toast.error(mainMessage, { position: 'top-right', autoClose: 5000 })

        // Show each detailed error if available
        if (errorData.errors && Array.isArray(errorData.errors)) {
          errorData.errors.forEach((err, index) => {
            setTimeout(() => {
              toast.error(`• ${err}`, { position: 'top-right', autoClose: 4000 })
            }, (index + 1) * 150)
          })
        }
      } else {
        // Network or other errors
        toast.error(`Failed to update permit: ${error.message}`, { position: 'top-right', autoClose: 5000 })
      }
    }
  }

  return (
    <>
      <div className='min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50'>
        <div className='w-full px-3 md:px-4 lg:px-6 pt-4 lg:pt-6 pb-8'>


          {/* Statistics Cards */}
          <div className='mb-2 mt-3'>
            <div className='grid grid-cols-2 lg:grid-cols-6 gap-2 lg:gap-3 mb-5'>
              <StatisticsCard
                title='Total Permits'
                value={stats.total}
                color='blue'
                isActive={statusFilter === 'all'}
                onClick={() => setStatusFilter('all')}
                icon={
                  <svg className='w-4 h-4 lg:w-6 lg:h-6 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' />
                  </svg>
                }
              />
              <StatisticsCard
                title='Part A - Expiring Soon'
                value={stats.expiring}
                color='orange'
                isActive={statusFilter === 'partAExpiring'}
                onClick={() => setStatusFilter(statusFilter === 'partAExpiring' ? 'all' : 'partAExpiring')}
                icon={
                  <svg className='w-4 h-4 lg:w-6 lg:h-6 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' />
                  </svg>
                }
              />
              <StatisticsCard
                title='Part B - Expiring Soon'
                value={stats.partBExpiring}
                color='purple'
                isActive={statusFilter === 'partBExpiring'}
                onClick={() => setStatusFilter(statusFilter === 'partBExpiring' ? 'all' : 'partBExpiring')}
                icon={
                  <svg className='w-4 h-4 lg:w-6 lg:h-6 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' />
                  </svg>
                }
              />
              <StatisticsCard
                title='Part A - Expired'
                value={stats.partAExpired}
                color='red'
                isActive={statusFilter === 'partAExpired'}
                onClick={() => setStatusFilter(statusFilter === 'partAExpired' ? 'all' : 'partAExpired')}
                icon={
                  <svg className='w-4 h-4 lg:w-6 lg:h-6 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                  </svg>
                }
              />
              <StatisticsCard
                title='Part B - Expired'
                value={stats.partBExpired}
                color='gray'
                isActive={statusFilter === 'partBExpired'}
                onClick={() => setStatusFilter(statusFilter === 'partBExpired' ? 'all' : 'partBExpired')}
                icon={
                  <svg className='w-4 h-4 lg:w-6 lg:h-6 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                  </svg>
                }
              />
              <StatisticsCard
                title='Pending Payment'
                value={stats.pendingPaymentCount}
                color='yellow'
                isActive={statusFilter === 'pending'}
                onClick={() => setStatusFilter(statusFilter === 'pending' ? 'all' : 'pending')}
                icon={
                  <svg className='w-4 h-4 lg:w-6 lg:h-6 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' />
                  </svg>
                }
              />
            </div>
          </div>

      {/* Permits Table */}
      <div className='bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden'>
        {/* Search and Filters Header */}
        <div className='px-3 lg:px-6 py-3 lg:py-5 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border-b border-gray-200'>
          <div className='flex flex-col lg:flex-row gap-2 items-stretch lg:items-center'>
            {/* Search Bar */}
            <SearchBar
              value={searchQuery}
              onChange={(value) => setSearchQuery(value)}
              placeholder='Search by vehicle number or holder name...'
              toUpperCase={true}
            />

            {/* Filters Group */}
            <div className='flex flex-wrap gap-2'>
              {/* Date Filter */}
              <select
                value={dateFilter}
                onChange={(e) => handleFilterChange('date', e.target.value)}
                className='w-[calc(50%-0.25rem)] lg:w-auto px-2 lg:px-4 py-2 lg:py-3 text-xs lg:text-sm border-2 border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 font-semibold bg-white hover:border-indigo-300 transition-all shadow-sm'
              >
                <option value='All'>All Permits</option>
                <option value='Expiring30Days'>30 Days</option>
                <option value='Expiring60Days'>60 Days</option>
                <option value='Expired'>Expired</option>
              </select>

              {/* Clear Filters */}
              {dateFilter !== 'All' && (
                <button
                  onClick={() => handleFilterChange('date', 'All')}
                  className='w-[calc(50%-0.25rem)] lg:w-auto px-3 lg:px-4 py-2 lg:py-3 text-xs lg:text-sm bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-xl hover:from-red-600 hover:to-rose-600 transition-all font-bold shadow-md hover:shadow-lg'
                >
                  Clear
                </button>
              )}
            </div>

            {/* New Permit Button */}
            <AddButton onClick={() => setShowIssuePermitModal(true)} title='New Permit' />
          </div>
        </div>

        {/* Mobile Card View */}
        <MobileCardView
          loading={loading}
          records={filteredPermits}
          emptyMessage={{
            title: 'No permits found',
            description: searchQuery ? 'Try searching by vehicle number or holder name' : 'Click "New Permit" to add your first permit',
          }}
          loadingMessage='Loading permits...'
          headerGradient='from-indigo-50 via-purple-50 to-pink-50'
          avatarGradient='from-indigo-500 to-purple-500'
          emptyIconGradient='from-indigo-100 to-purple-100'
          emptyIconColor='text-indigo-400'
          cardConfig={{
            header: {
              avatar: null,
              title: (record) => record.vehicleNo,
              subtitle: (record) => record.permitHolder || '-',
              extraInfo: (record) => (
                record.mobileNumber && record.mobileNumber !== 'N/A' && (
                  <a
                    href={`tel:${record.mobileNumber}`}
                    className='flex items-center mt-1 text-blue-600 font-semibold hover:text-blue-700 active:text-blue-800 transition-all cursor-pointer underline decoration-blue-400 underline-offset-2'
                  >
                    <svg className='w-3.5 h-3.5 mr-1 text-blue-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z' />
                    </svg>
                    {record.mobileNumber}
                  </a>
                )
              ),
              showVehicleParts: true,
            },
            body: {
              showStatus: false,
              showPayment: true,
              showValidity: false,
              customFields: [
                {
                  render: (record) => (
                    <div className='space-y-2.5'>
                      {/* Part A Info */}
                      <div className='pb-2.5 border-b border-gray-100'>
                        <div className='flex items-center justify-between mb-1.5'>
                          <span className='text-[10px] text-gray-500 font-semibold uppercase'>Part A</span>
                        </div>
                        <div className='flex items-center justify-between mb-1'>
                          <span className='text-[10px] text-gray-500 font-semibold uppercase'>Valid From</span>
                          <span className='text-xs font-semibold text-gray-700'>{record.partAValidFrom || 'N/A'}</span>
                        </div>
                        <div className='flex items-center justify-between'>
                          <span className='text-[10px] text-gray-500 font-semibold uppercase'>Valid Till</span>
                          <div className='flex items-center gap-1.5'>
                            <span className='text-xs font-semibold text-gray-700'>{record.partAValidTo || 'N/A'}</span>
                            {(() => {
                              const daysRemaining = getDaysRemaining(record.partAValidTo)
                              if (daysRemaining === null) return null
                              if (daysRemaining < 0) {
                                return <span className='text-[10px] font-bold text-red-600'>(Expired)</span>
                              } else if (daysRemaining <= 30) {
                                return <span className='text-[10px] font-bold text-orange-600'>({daysRemaining}d left)</span>
                              }
                              return null
                            })()}
                          </div>
                        </div>
                      </div>

                      {/* Part B Info */}
                      <div className='pb-2.5 border-b border-gray-100'>
                        <div className='flex items-center justify-between mb-1.5'>
                          <span className='text-[10px] text-gray-500 font-semibold uppercase'>Part B Auth No.</span>
                          <span className='text-xs font-mono font-bold text-gray-900'>{record.partBNumber || 'N/A'}</span>
                        </div>
                        <div className='flex items-center justify-between mb-1'>
                          <span className='text-[10px] text-gray-500 font-semibold uppercase'>Valid From</span>
                          <span className='text-xs font-semibold text-gray-700'>{record.partBValidFrom || 'N/A'}</span>
                        </div>
                        <div className='flex items-center justify-between'>
                          <span className='text-[10px] text-gray-500 font-semibold uppercase'>Valid Till</span>
                          <div className='flex items-center gap-1.5'>
                            <span className='text-xs font-semibold text-gray-700'>{record.partBValidTo || 'N/A'}</span>
                            {(() => {
                              const daysRemaining = getDaysRemaining(record.partBValidTo)
                              if (daysRemaining === null) return null
                              if (daysRemaining < 0) {
                                return <span className='text-[10px] font-bold text-red-600'>(Expired)</span>
                              } else if (daysRemaining <= 30) {
                                return <span className='text-[10px] font-bold text-orange-600'>({daysRemaining}d left)</span>
                              }
                              return null
                            })()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ),
                },
              ],
            },
            footer: (record) => {
              const count = record.whatsappMessageCount || 0;
              if (count === 0) return null;

              return (
                <div className='bg-green-50 border-t border-green-100 py-2.5 px-3 -mb-3 -mx-3 mt-2'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-1.5'>
                      <div className='flex items-center gap-0.5 bg-green-100 px-2.5 py-1 rounded-full border border-green-200'>
                        <svg className='w-3.5 h-3.5 text-green-600' fill='currentColor' viewBox='0 0 24 24'>
                          <path d='M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z'/>
                        </svg>
                        <span className='text-xs font-semibold text-green-700'>
                          {count === 1 && '✓'}
                          {count === 2 && '✓✓'}
                          {count >= 3 && '✓✓✓'}
                          {count > 3 && ` (${count})`}
                        </span>
                      </div>
                      <span className='text-[10px] text-gray-600 font-medium'>
                        {count === 1 ? '1 reminder sent' : `${count} reminders sent`}
                      </span>
                    </div>
                    {record.lastWhatsappSentAt && (
                      <div className='flex items-center gap-1'>
                        <svg className='w-3 h-3 text-gray-500' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' />
                        </svg>
                        <span className='text-[10px] text-gray-600 font-medium'>
                          {formatWhatsAppDate(record.lastWhatsappSentAt)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            },
          }}
          actions={[
            {
              title: 'WhatsApp Reminder',
              condition: shouldShowWhatsAppButton,
              onClick: handleWhatsAppClick,
              bgColor: 'bg-green-50',
              textColor: 'text-green-600',
              hoverBgColor: 'bg-green-100',
              icon: (
                <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 24 24'>
                  <path d='M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z'/>
                </svg>
              ),
            },
            {
              title: 'View Details',
              onClick: handleViewDetails,
              bgColor: 'bg-indigo-100',
              textColor: 'text-indigo-600',
              hoverBgColor: 'bg-indigo-200',
              icon: (
                <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 12a3 3 0 11-6 0 3 3 0 016 0z' />
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' />
                </svg>
              ),
            },
            {
              title: 'Edit',
              onClick: handleEditPermit,
              bgColor: 'bg-blue-100',
              textColor: 'text-blue-600',
              hoverBgColor: 'bg-blue-200',
              icon: (
                <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' />
                </svg>
              ),
            },
            {
              title: 'Delete',
              onClick: (record) => handleDeletePermit(record.id),
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
        <div className='hidden lg:block overflow-x-auto bg-white rounded-xl shadow-lg border border-gray-200'>
          <table className='w-full'>
            <thead className={theme.tableHeader}>
              <tr>
                <th className='px-4 2xl:px-6 py-3 2xl:py-4 text-left text-[10px] 2xl:text-xs font-bold text-white uppercase tracking-wide'>Vehicle No.</th>
                <th className='px-4 2xl:px-6 py-3 2xl:py-4 text-left text-[10px] 2xl:text-xs font-bold text-white uppercase tracking-wide'>Permit Holder</th>
                <th className='px-4 2xl:px-6 py-3 2xl:py-4 text-left text-[10px] 2xl:text-xs font-bold text-white uppercase tracking-wide'>Valid From</th>
                <th className='px-4 2xl:px-6 py-3 2xl:py-4 text-left text-[10px] 2xl:text-xs font-bold text-white uppercase tracking-wide'>Valid To</th>
                <th className='px-4 2xl:px-6 py-3 2xl:py-4 text-left text-[10px] 2xl:text-xs font-bold text-white uppercase tracking-wide'>Part B</th>
                <th className='px-4 2xl:px-6 py-3 2xl:py-4 text-right text-[10px] 2xl:text-xs font-bold text-white uppercase tracking-wide bg-white/10'>Total Fee</th>
                <th className='px-4 2xl:px-6 py-3 2xl:py-4 text-right text-[10px] 2xl:text-xs font-bold text-white uppercase tracking-wide bg-white/10'>Paid</th>
                <th className='px-4 2xl:px-6 py-3 2xl:py-4 text-right text-[10px] 2xl:text-xs font-bold text-white uppercase tracking-wide bg-white/10'>Balance</th>
                <th className='px-4 2xl:px-6 py-3 2xl:py-4 text-right text-[10px] 2xl:text-xs font-bold text-white uppercase tracking-wide'>Actions</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-200 bg-white'>
              {loading ? (
                <tr>
                  <td colSpan='9' className='px-5 py-16 text-center'>
                    <div className='flex flex-col items-center justify-center space-y-4'>
                      <div className='relative'>
                        <div className='w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl animate-pulse shadow-lg'></div>
                        <div className='absolute inset-0 w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-2xl animate-spin'></div>
                      </div>
                      <p className='text-lg font-semibold text-gray-700'>Loading permits...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredPermits.length > 0 ? (
                filteredPermits.map((permit, index) => (
                  <tr key={permit.id} className='hover:bg-gradient-to-r hover:from-blue-50/70 hover:via-indigo-50/70 hover:to-purple-50/70 transition-all duration-200 group border-b border-gray-100'>
                    <td className='px-4 2xl:px-6 py-3 2xl:py-4'>
                      <div className='flex flex-col gap-1.5'>
                        <div>
                          {(() => {
                            const parts = getVehicleNumberParts(permit.vehicleNo);
                            if (!parts) {
                              return (
                                <div className='flex items-center gap-1.5'>
                                  <svg className='w-4 h-4 text-blue-600 flex-shrink-0' fill='currentColor' viewBox='0 0 20 20'>
                                    <path d='M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z' />
                                    <path d='M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z' />
                                  </svg>
                                  <span className='text-[11px] 2xl:text-sm font-semibold text-gray-900'>{permit.vehicleNo}</span>
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
                    <td className='px-4 2xl:px-6 py-3 2xl:py-4'>
                      <div className='flex items-center gap-3'>
                        <div className='flex-shrink-0 h-8 w-8 2xl:h-10 2xl:w-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xs 2xl:text-sm shadow-md'>
                          {permit.permitHolder?.charAt(0) || 'P'}
                        </div>
                        <div>
                          <div className='text-[11px] 2xl:text-sm font-bold text-gray-900'>{permit.permitHolder}</div>
                          <div className='text-[10px] 2xl:text-xs text-gray-500 flex items-center mt-0.5 2xl:mt-1'>
                            <svg className='w-3 h-3 mr-1' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z' />
                            </svg>
                            {permit.partA?.ownerMobile || 'N/A'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className='px-0.5 2xl:px-1 py-3 2xl:py-5 pl-4 2xl:pl-8'>
                      <div className='flex items-center text-[11px] 2xl:text-[13.8px]'>
                        <span className='inline-flex items-center px-2 py-1 2xl:px-3 2xl:py-1.5 rounded-lg bg-green-100 text-green-700 font-semibold border border-green-200 whitespace-nowrap'>
                          <svg className='w-3 h-3 mr-1' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' />
                          </svg>
                          {permit.partA?.permitValidFrom || permit.validFrom || 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className='px-0.5 2xl:px-1 py-3 2xl:py-5'>
                      <div className='flex items-center text-[11px] 2xl:text-[13.8px]'>
                        <span className='inline-flex items-center px-2 py-1 2xl:px-3 2xl:py-1.5 rounded-lg bg-red-100 text-red-700 font-semibold border border-red-200 whitespace-nowrap'>
                          <svg className='w-3 h-3 mr-1' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' />
                          </svg>
                          {permit.validTill}
                        </span>
                      </div>
                    </td>
                    <td className='px-4 2xl:px-6 py-3 2xl:py-4'>
                      <div>
                        <div className='font-mono font-semibold text-gray-900 mb-1 text-[11px] 2xl:text-sm'>
                          {permit.partB?.authorizationNumber || 'N/A'}
                        </div>
                        <div className='text-green-600 font-semibold mb-0.5 text-[10px] 2xl:text-xs'>
                          {permit.partB?.validFrom || 'N/A'}
                        </div>
                        <div className='text-red-600 font-semibold text-[10px] 2xl:text-xs'>
                          {permit.partB?.validTo || 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td className='px-4 py-4 bg-gray-50/50 group-hover:bg-purple-50/30'>
                      <div className='text-right'>
                        <div className='text-[11px] 2xl:text-sm font-bold text-gray-900'>₹{(permit.totalFee || 0).toLocaleString('en-IN')}</div>
                        <div className='text-[10px] 2xl:text-xs text-gray-500 mt-0.5'>Total Fee</div>
                      </div>
                    </td>
                    <td className='px-4 py-4 bg-gray-50/50 group-hover:bg-emerald-50/30'>
                      <div className='text-right'>
                        <div className='text-[11px] 2xl:text-sm font-bold text-emerald-600'>₹{(permit.paid || 0).toLocaleString('en-IN')}</div>
                        <div className='text-[10px] 2xl:text-xs text-emerald-600 mt-0.5'>Paid Amount</div>
                      </div>
                    </td>
                    <td className={`px-4 py-4 bg-gray-50/50 ${(permit.balance || 0) > 0 ? 'group-hover:bg-amber-50/30' : 'group-hover:bg-gray-50'}`}>
                      <div className='text-right'>
                        <div className={`text-[11px] 2xl:text-sm font-bold ${(permit.balance || 0) > 0 ? 'text-orange-600' : 'text-gray-500'}`}>
                          ₹{(permit.balance || 0).toLocaleString('en-IN')}
                        </div>
                        <div className={`text-[10px] 2xl:text-xs mt-0.5 ${(permit.balance || 0) > 0 ? 'text-orange-600' : 'text-gray-500'}`}>
                          {(permit.balance || 0) > 0 ? 'Pending' : 'Cleared'}
                        </div>
                      </div>
                    </td>
                    <td className='px-4 2xl:px-6 py-3 2xl:py-4'>
                      <div className='flex items-center justify-end gap-0.5 2xl:gap-0.5 pr-1'>
                        <button
                          onClick={() => handleViewDetails(permit)}

                          className='p-1.5 2xl:p-2 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-all group-hover:scale-110 duration-200'
                          title='View Details'
                        >
                          <svg className='w-4 h-4 2xl:w-5 2xl:h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 12a3 3 0 11-6 0 3 3 0 016 0z' />
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleEditPermit(permit)}

                          className='p-1.5 2xl:p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-all group-hover:scale-110 duration-200'
                          title='Edit Permit'
                        >
                          <svg className='w-4 h-4 2xl:w-5 2xl:h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeletePermit(permit.id)}
                          className='p-1.5 2xl:p-2 text-red-600 hover:bg-red-100 rounded-lg transition-all group-hover:scale-110 duration-200'
                          title='Delete Permit'
                        >
                          <svg className='w-4 h-4 2xl:w-5 2xl:h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan='9' className='px-6 py-16'>
                    <div className='flex flex-col items-center justify-center'>
                      <div className='w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mb-6 shadow-lg'>
                        <svg className='w-12 h-12 text-indigo-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' />
                        </svg>
                      </div>
                      <h3 className='text-xl font-black text-gray-700 mb-2'>No Permits Found</h3>
                      <p className='text-sm text-gray-500 mb-6 max-w-md text-center'>
                        {searchQuery ? 'No permits match your search. Try searching by vehicle number or holder name.' : 'Get started by adding your first national permit.'}
                      </p>
                      {!searchQuery && (
                        <button
                          onClick={() => setShowIssuePermitModal(true)}
                          className='px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all font-bold cursor-pointer transform hover:scale-105 flex items-center gap-2'
                        >
                          <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 4v16m8-8H4' />
                          </svg>
                          Add First Permit
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredPermits.length > 0 && (
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
            totalRecords={pagination.totalRecords}
            itemsPerPage={pagination.limit}
          />
        )}
      </div>

      {/* Permit Details Modal - Lazy Loaded */}
      {showDetailsModal && (
                  <NationalPermitDetailsModal
            isOpen={showDetailsModal}
            onClose={() => {
              setShowDetailsModal(false)
              setSelectedPermit(null)
            }}
            permit={selectedPermit}
          />
      )}

      {/* Add New Permit Modal - Lazy Loaded */}
      {showIssuePermitModal && (
                  <IssueNewPermitModal
            isOpen={showIssuePermitModal}
            onClose={() => setShowIssuePermitModal(false)}
            onSubmit={handleIssuePermit}
          />
      )}

      {/* Edit Permit Modal - Lazy Loaded */}
      {showEditPermitModal && (
                  <EditNationalPermitModal
            isOpen={showEditPermitModal}
            onClose={() => {
              setShowEditPermitModal(false)
              setEditingPermit(null)
            }}
            onSubmit={handleUpdatePermit}
            permit={editingPermit}
          />
      )}
      </div>
      </div>
    </>
  )
}

export default NationalPermit
