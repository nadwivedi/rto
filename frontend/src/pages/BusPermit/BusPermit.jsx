import { useState, useEffect } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import Pagination from '../../components/Pagination'
import IssueBusPermitModal from './components/IssueBusPermitModal'
import EditBusPermitModal from './components/EditBusPermitModal'
import BusPermitDetailsModal from './components/BusPermitDetailsModal'
import AddButton from '../../components/AddButton'
import SearchBar from '../../components/SearchBar'
import StatisticsCard from '../../components/StatisticsCard'
import MobileCardView from '../../components/MobileCardView'
import { getTheme, getVehicleNumberDesign } from '../../context/ThemeContext'

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080'

import { getStatusColor, getStatusText } from '../../utils/statusUtils';
import { getVehicleNumberParts } from '../../utils/vehicleNoCheck';

const BusPermit = () => {
  const theme = getTheme()
  const vehicleDesign = getVehicleNumberDesign()
  // Force recompile for debugging ReferenceError: loading is not defined
  // Demo data for when backend is not available
 

  const [permits, setPermits] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPermit, setSelectedPermit] = useState(null)
  const [showIssuePermitModal, setShowIssuePermitModal] = useState(false)
  const [showEditPermitModal, setShowEditPermitModal] = useState(false)
  const [editingPermit, setEditingPermit] = useState(null)
  const [viewingPermit, setViewingPermit] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [loading, setLoading] = useState(true) // Re-initializing loading state
  const [error, setError] = useState(null) // Error state
  const [statusFilter, setStatusFilter] = useState('all') // 'all', 'active', 'expiring_soon', 'expired', 'pending'
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalRecords: 0,
    limit: 20
  })
  const [statistics, setStatistics] = useState({
    total: 0,
    active: 0,
    expiringSoon: 0,
    expired: 0,
    pendingPaymentCount: 0,
    pendingPaymentAmount: 0
  })

  // Fetch CG permit statistics from API
  const fetchStatistics = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/bus-permits/statistics`, { withCredentials: true })
      if (response.data.success) {
        setStatistics({
          total: response.data.data.total,
          active: response.data.data.active,
          expiringSoon: response.data.data.expiringSoon,
          expired: response.data.data.expired,
          pendingPaymentCount: response.data.data.pendingPaymentCount,
          pendingPaymentAmount: response.data.data.pendingPaymentAmount
        })
        
      }
    } catch (error) {
      console.error('Error fetching CG permit statistics:', error)
    }
  }

  // Fetch permits from backend on component mount and when filters change
  useEffect(() => {
    fetchPermits(1)
    fetchStatistics()
  }, [searchQuery, statusFilter])

  // Page change handler
  const handlePageChange = (newPage) => {
    fetchPermits(newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const fetchPermits = async (page = pagination.currentPage) => {
    setLoading(true)
    setError(null)
    let url = `${API_URL}/api/bus-permits`
    const params = {
      page,
      limit: pagination.limit,
      search: searchQuery
    }

    if (statusFilter !== 'all') {
      const filterPath = statusFilter.replace('_', '-')
      url = `${API_URL}/api/bus-permits/${filterPath}`
    }

    try {
      const response = await axios.get(url, { params, withCredentials: true })

      // Transform backend data to match frontend structure
      const transformedPermits = response.data.data.map(permit => ({
        id: permit._id,
        permitNumber: permit.permitNumber,
        permitType: permit.permitType,
        permitHolder: permit.permitHolder,
        vehicleNo: permit.vehicleNumber || 'N/A',
        routeFrom: permit.routeFrom || '',
        routeTo: permit.routeTo || '',
        category: permit.category || 'AC',
        issueDate: permit.issueDate,
        validFrom: permit.validFrom,
        validTo: permit.validTo, // Keep original field
        validTill: permit.validTo, // Also map to validTill for compatibility
        validityPeriod: permit.validityPeriod,
        bill: permit.bill, // Include bill reference
        totalFee: permit.totalFee || 0, // Keep original field name for edit modal
        fees: permit.totalFee || permit.fees || 0, // Keep for backward compatibility
        balance: permit.balance || 0,
        paid: permit.paid || 0,
        status: permit.status || 'Active', // Status field for edit modal
        isRenewed: permit.isRenewed || false, // Renewal status
        fatherName: permit.fatherName || '', // Optional field for edit modal
        email: permit.email || '', // Optional field for edit modal
        address: permit.address || 'N/A',
        mobileNumber: permit.mobileNumber || 'N/A',
        route: permit.route,
        goodsType: permit.goodsType || 'General Goods',
        issuingAuthority: permit.issuingAuthority,
        vehicleModel: permit.vehicleModel || 'N/A',
        vehicleType: permit.vehicleType || 'N/A',
        chassisNumber: permit.chassisNumber || 'N/A',
        engineNumber: permit.engineNumber || 'N/A',
        renewalHistory: permit.renewalHistory || [],
        insuranceDetails: permit.insuranceDetails || {
          policyNumber: 'N/A',
          company: 'N/A',
          validUpto: 'N/A'
        },
        taxDetails: permit.taxDetails || {
          taxPaidUpto: 'N/A',
          taxAmount: 'N/A'
        },
        whatsappMessageCount: permit.whatsappMessageCount || 0, // WhatsApp message count
        lastWhatsappSentAt: permit.lastWhatsappSentAt, // Last WhatsApp sent time
        documents: permit.documents || {}
      }))

      setPermits(transformedPermits)

      // Update pagination state
      if (response.data.pagination) {
        setPagination({
          currentPage: response.data.pagination.currentPage,
          totalPages: response.data.pagination.totalPages,
          totalRecords: response.data.pagination.totalRecords,
          limit: pagination.limit
        })
      }
    } catch (error) {
      console.error('Error fetching CG permits:', error)
      toast.error('Failed to fetch CG permits. Please check if the backend server is running.', {
        position: 'top-right',
        autoClose: 3000
      })
    } finally {
      setLoading(false)
    }
  }


  // Use permits directly since filtering is done on backend
  const filteredPermits = permits

  const handleDeletePermit = async (permit) => {
    // Show confirmation dialog
    const confirmDelete = window.confirm(
      `Are you sure you want to delete this CG permit?\n\n` +
      `Permit Number: ${permit.permitNumber}\n` +
      `Vehicle Number: ${permit.vehicleNo}\n` +
      `Permit Holder: ${permit.permitHolder}\n` +
      `Permit Type: ${permit.permitType}\n\n` +
      `This action cannot be undone.`
    )

    if (!confirmDelete) {
      return
    }

    try {
      // Make DELETE request to backend
      const response = await axios.delete(`${API_URL}/api/bus-permits/${permit.id}`, { withCredentials: true })

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to delete CG permit')
      }

      // Show success message
      toast.success('Bus Permit deleted successfully!', {
        position: 'top-right',
        autoClose: 3000
      })

      // Refresh the permits list
      await fetchPermits()
    } catch (error) {
      console.error('Error deleting CG permit:', error)
      toast.error(`Failed to delete CG permit: ${error.message}`, {
        position: 'top-right',
        autoClose: 3000
      })
    }
  }

  // Mark CG permit as paid
  const handleMarkAsPaid = async (permit) => {
    // Show confirmation dialog
    const confirmPaid = window.confirm(
      `Are you sure you want to mark this payment as PAID?\n\n` +
      `Permit Number: ${permit.permitNumber}\n` +
      `Vehicle Number: ${permit.vehicleNo}\n` +
      `Total Fee: ₹${(permit.totalFee || 0).toLocaleString('en-IN')}\n` +
      `Current Balance: ₹${(permit.balance || 0).toLocaleString('en-IN')}\n\n` +
      `This will set Paid = ₹${(permit.totalFee || 0).toLocaleString('en-IN')} and Balance = ₹0`
    );

    if (!confirmPaid) {
      return;
    }

    try {
      // Make PATCH request to backend
      const response = await axios.patch(`${API_URL}/api/bus-permits/${permit.id}/mark-as-paid`, {}, { withCredentials: true });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to mark payment as paid');
      }

      // Show success message
      toast.success('Payment marked as paid successfully!', {
        position: 'top-right',
        autoClose: 3000
      });

      // Refresh the permits list
      await fetchPermits();
    } catch (error) {
      console.error('Error marking payment as paid:', error);
      toast.error(`Failed to mark payment as paid: ${error.message}`, {
        position: 'top-right',
        autoClose: 3000
      });
    }
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

    try {
      // Increment WhatsApp message count in backend
      const response = await axios.patch(
        `${API_URL}/api/bus-permits/${permit.id}/whatsapp-increment`,
        {},
        { withCredentials: true }
      )

      if (response.data.success) {
        // Update the local state with new count and last sent time
        setPermits(prevPermits =>
          prevPermits.map(p =>
            p.id === permit.id
              ? {
                  ...p,
                  whatsappMessageCount: response.data.data.whatsappMessageCount,
                  lastWhatsappSentAt: response.data.data.lastWhatsappSentAt
                }
              : p
          )
        )
      }
    } catch (error) {
      console.error('Error incrementing WhatsApp count:', error)
      // Continue with WhatsApp even if count update fails
    }

    // Format mobile number (remove spaces, dashes, etc.)
    let phoneNumber = permit.mobileNumber.replace(/\D/g, '')

    // Add +91 country code if not already present
    if (!phoneNumber.startsWith('91')) {
      phoneNumber = '91' + phoneNumber
    }

    // Create custom message
    let message = `Hello ${permit.permitHolder},\n\n`

    if ((permit.balance || 0) > 0) {
      message += `Your payment of ₹${(permit.balance || 0).toLocaleString('en-IN')} is pending for Bus Permit.\n`
      message += `Permit Number: ${permit.permitNumber}\n`
      message += `Vehicle Number: ${permit.vehicleNo}\n\n`
    }

    if (permit.status === 'expiring_soon' || permit.status === 'expired') {
      const statusText = permit.status === 'expired' ? 'has expired' : 'is going to expire'
      message += `Your CG permit ${statusText} on ${permit.validTill}.\n`
      message += `Permit Number: ${permit.permitNumber}\n`
      message += `Vehicle Number: ${permit.vehicleNo}\n`
      message += `Please renew your permit at the earliest.\n\n`
    }

    message += `Thank you for your cooperation.`

    // Open WhatsApp directly (not web)
    const whatsappURL = `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`
    window.location.href = whatsappURL
  }

  // Determine if WhatsApp button should be shown
  const shouldShowWhatsAppButton = (permit) => {
    return (permit.status === 'expiring_soon' || permit.status === 'expired' || (permit.balance || 0) > 0)
  }

  const handleEditPermit = (permit) => {
    setEditingPermit(permit)
    setShowEditPermitModal(true)
  }

  const handleViewPermit = (permit) => {
    setViewingPermit(permit)
    setShowDetailsModal(true)
  }

  const handleIssuePermit = async (formData) => {
    try {
      // Prepare data to match backend model
      const permitData = {
        permitNumber: formData.permitNumber,
        permitHolder: formData.permitHolderName,
        vehicleNumber: formData.vehicleNumber,
        routeFrom: formData.routeFrom,
        routeTo: formData.routeTo,
        category: formData.category,
        validFrom: formData.validFrom,
        validTo: formData.validTo,
        issueDate: formData.validFrom,
        permitType: 'Type A',
        validityPeriod: 5,
        fatherName: formData.fatherName || '',
        address: formData.address || '',
        mobileNumber: formData.mobileNumber || '',
        email: formData.email || '',
        vehicleModel: formData.vehicleModel || '',
        vehicleType: formData.vehicleType || '',
        chassisNumber: formData.chassisNumber || '',
        engineNumber: formData.engineNumber || '',
        unladenWeight: formData.unladenWeight ? Number(formData.unladenWeight) : 0,
        grossWeight: formData.grossWeight ? Number(formData.grossWeight) : 0,
        yearOfManufacture: new Date().getFullYear().toString(),
        seatingCapacity: '2',
        goodsType: formData.goodsType || 'General Goods',
        route: 'Chhattisgarh State',
        maxLoadCapacity: formData.grossWeight ? `${formData.grossWeight} kg` : '',
        totalFee: Number(formData.totalFee) || 0,
        paid: Number(formData.paid) || 0,
        balance: Number(formData.balance) || 0,
        status: 'Active',
        permitDocument: formData.permitDocument || undefined
      }

      // Make POST request to backend
      const response = await axios.post(`${API_URL}/api/bus-permits`, permitData, { withCredentials: true })

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to create CG permit')
      }

      // Show success message
      toast.success('Bus Permit added successfully!', { position: 'top-right', autoClose: 3000 })

      // Refresh the permits list and statistics
      await fetchPermits()
      await fetchStatistics()

      // Close the modal
      setShowIssuePermitModal(false)
    } catch (error) {
      console.error('Error creating CG permit:', error)

      // Handle detailed error response from backend
      if (error.response?.data) {
        const errorData = error.response.data

        // Show main error message
        const mainMessage = errorData.errorCount > 1
          ? `${errorData.message} (${errorData.errorCount} errors)`
          : (errorData.message || 'Failed to create CG permit')

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
        toast.error(`Failed to create CG permit: ${error.message}`, { position: 'top-right', autoClose: 5000 })
      }
    }
  }

  const handleUpdatePermit = async (formData) => {
    try {
      if (!editingPermit || !editingPermit.id) {
        throw new Error('No permit selected for editing')
      }

      // Prepare data to match backend model
      const permitData = {
        permitNumber: formData.permitNumber,
        permitHolder: formData.permitHolder,
        vehicleNumber: formData.vehicleNumber,
        routeFrom: formData.routeFrom,
        routeTo: formData.routeTo,
        category: formData.category,
        validFrom: formData.validFrom,
        validTo: formData.validTo,
        fatherName: formData.fatherName || '',
        address: formData.address || '',
        mobileNumber: formData.mobileNumber || '',
        email: formData.email || '',
        vehicleModel: formData.vehicleModel || '',
        vehicleType: formData.vehicleType || '',
        chassisNumber: formData.chassisNumber || '',
        engineNumber: formData.engineNumber || '',
        unladenWeight: formData.unladenWeight ? Number(formData.unladenWeight) : 0,
        grossWeight: formData.grossWeight ? Number(formData.grossWeight) : 0,
        goodsType: formData.goodsType || 'General Goods',
        totalFee: Number(formData.totalFee) || 0,
        paid: Number(formData.paid) || 0,
        balance: Number(formData.balance) || 0,
        permitDocument: formData.permitDocument || undefined
      }

      // Make PUT request to backend
      const response = await axios.put(`${API_URL}/api/bus-permits/${editingPermit.id}`, permitData, { withCredentials: true })

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to update CG permit')
      }

      // Show success message
      toast.success('Bus Permit updated successfully!', { position: 'top-right', autoClose: 3000 })

      // Refresh the permits list and statistics
      await fetchPermits()
      await fetchStatistics()

      // Close the modal
      setShowEditPermitModal(false)
      setEditingPermit(null)
    } catch (error) {
      console.error('Error updating CG permit:', error)

      // Handle detailed error response from backend
      if (error.response?.data) {
        const errorData = error.response.data

        // Show main error message
        const mainMessage = errorData.errorCount > 1
          ? `${errorData.message} (${errorData.errorCount} errors)`
          : (errorData.message || 'Failed to update CG permit')

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
        toast.error(`Failed to update CG permit: ${error.message}`, { position: 'top-right', autoClose: 5000 })
      }
    }
  }

  return (
    <>
      <div className='min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50'>
        <div className='w-full px-3 md:px-4 lg:px-6 pt-4 lg:pt-6 pb-8'>

          {/* Statistics Cards */}
          <div className='mb-2 mt-3'>
            <div className='grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-3 mb-5'>
              <StatisticsCard
                title='Total Bus Permits'
                value={statistics.total}
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
                title='Expiring Soon'
                value={statistics.expiringSoon}
                color='orange'
                isActive={statusFilter === 'expiring_soon'}
                onClick={() => setStatusFilter(statusFilter === 'expiring_soon' ? 'all' : 'expiring_soon')}
                subtext='Within 30 days'
                icon={
                  <svg className='w-4 h-4 lg:w-6 lg:h-6 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' />
                  </svg>
                }
              />
              <StatisticsCard
                title='Expired'
                value={statistics.expired}
                color='red'
                isActive={statusFilter === 'expired'}
                onClick={() => setStatusFilter(statusFilter === 'expired' ? 'all' : 'expired')}
                subtext='Expired Permits'
                icon={
                  <svg className='w-4 h-4 lg:w-6 lg:h-6 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                  </svg>
                }
              />
              <StatisticsCard
                title='Pending Payment'
                value={statistics.pendingPaymentCount}
                extraValue={`₹${statistics.pendingPaymentAmount.toLocaleString('en-IN')}`}
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
        <div className='px-6 py-5 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border-b border-gray-200'>
          <div className='flex flex-col lg:flex-row gap-2 items-stretch lg:items-center'>
            {/* Search Bar */}
            <SearchBar
              value={searchQuery}
              onChange={(value) => setSearchQuery(value)}
              placeholder='Search by permit number, holder, or vehicle...'
              toUpperCase={true}
            />

            {/* New Permit Button */}
            <AddButton onClick={() => setShowIssuePermitModal(true)} title='New Bus Permit' />
          </div>
        </div>

        {/* Mobile Card View */}
        <MobileCardView
          loading={loading}
          records={filteredPermits}
          emptyMessage={{
            title: 'No Bus Permits Found',
            description: 'Get started by adding your first CG permit.',
          }}
          loadingMessage='Loading permits...'
          headerGradient='from-indigo-50 via-purple-50 to-pink-50'
          avatarGradient='from-indigo-500 to-purple-500'
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
              showValidity: true,
              customFields: [
                {
                  render: (record, { renderVehicleBadge, getStatusColor, getStatusText }) => (
                    <div className='flex items-center justify-between gap-2 pb-2.5 border-b border-gray-100'>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap ${getStatusColor(record.status)}`}>
                        {getStatusText(record.status)}
                      </span>
                      <div className='flex items-center gap-1.5'>
                        <svg className='w-3.5 h-3.5 text-indigo-600 flex-shrink-0' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' />
                        </svg>
                        <span className='text-xs font-medium text-gray-700'>{record.permitNumber}</span>
                      </div>
                    </div>
                  ),
                },
              ],
            },
            footer: (record) => {
              const count = record.whatsappMessageCount || 0;
              if (count === 0) return null;

              // Format last sent time
              const formatLastSent = (date) => {
                if (!date) return '';

                const sentDate = new Date(date);
                const now = new Date();
                const diffMs = now - sentDate;
                const diffMins = Math.floor(diffMs / 60000);
                const diffHours = Math.floor(diffMs / 3600000);
                const diffDays = Math.floor(diffMs / 86400000);

                if (diffMins < 1) return 'Just now';
                if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
                if (diffHours < 24) return `${diffHours} hr${diffHours > 1 ? 's' : ''} ago`;
                if (diffDays === 1) return 'Yesterday';
                if (diffDays < 7) return `${diffDays} days ago`;

                // Format as date if older than a week
                return sentDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
              };

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
                          {formatLastSent(record.lastWhatsappSentAt)}
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
              title: 'View Details',
              onClick: handleViewPermit,
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
              title: 'Edit',
              onClick: handleEditPermit,
              bgColor: 'bg-amber-100',
              textColor: 'text-amber-600',
              hoverBgColor: 'bg-amber-200',
              icon: (
                <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' />
                </svg>
              ),
            },
            {
              title: 'Delete Permit',
              onClick: handleDeletePermit,
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
                <th className='px-4 2xl:px-6 py-3 2xl:py-4 text-left text-[10px] 2xl:text-xs font-bold text-white uppercase tracking-wider'>Vehicle/Permit No.</th>
                <th className='px-4 2xl:px-6 py-3 2xl:py-4 text-center text-[10px] 2xl:text-xs font-bold text-white uppercase tracking-wider'>Permit Holder</th>
                <th className='px-4 2xl:px-6 py-3 2xl:py-4 text-left text-[10px] 2xl:text-xs font-bold text-white uppercase tracking-wider'>Route</th>
                <th className='px-4 2xl:px-6 py-3 2xl:py-4 text-left text-[10px] 2xl:text-xs font-bold text-white uppercase tracking-wider'>Category</th>
                <th className='px-0.5 2xl:px-1 py-3 2xl:py-4 text-left text-[10px] 2xl:text-xs font-bold text-white uppercase tracking-wider pl-8 2xl:pl-12'>Valid From</th>
                <th className='px-0.5 2xl:px-1 py-3 2xl:py-4 text-left text-[10px] 2xl:text-xs font-bold text-white uppercase tracking-wider'>Valid To</th>
                <th className='px-4 2xl:px-6 py-3 2xl:py-4 text-right text-[10px] 2xl:text-xs font-bold text-white uppercase tracking-wider bg-white/10 pl-12 2xl:pl-16'>Total Fee</th>
                <th className='px-4 2xl:px-6 py-3 2xl:py-4 text-right text-[10px] 2xl:text-xs font-bold text-white uppercase tracking-wider bg-white/10'>Paid</th>
                <th className='px-4 2xl:px-6 py-3 2xl:py-4 text-right text-[10px] 2xl:text-xs font-bold text-white uppercase tracking-wider bg-white/10'>Balance</th>
                <th className='px-4 2xl:px-6 py-3 2xl:py-4 text-left text-[10px] 2xl:text-xs font-bold text-white uppercase tracking-wider pl-20 2xl:pl-32'>Status</th>
                <th className='px-4 2xl:px-6 py-3 2xl:py-4 text-center text-[10px] 2xl:text-xs font-bold text-white uppercase tracking-wider'>Actions</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-100'>
              {loading ? (
                <tr>
                  <td colSpan='11' className='px-6 py-16'>
                    <div className='flex flex-col justify-center items-center'>
                      <div className='relative'>
                        <div className='w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl animate-pulse shadow-lg'></div>
                        <div className='absolute inset-0 w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-2xl animate-spin'></div>
                      </div>
                      <p className='text-gray-600 mt-6'>Loading CG permits...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredPermits.length > 0 ? (
                filteredPermits.map((permit) => (
                  <tr key={permit.id} className='hover:bg-gradient-to-r hover:from-blue-50 hover:via-indigo-50 hover:to-purple-50 transition-all duration-300 group'>
                    <td className='px-4 2xl:px-6 py-3 2xl:py-5'>
                      <div className='flex flex-col gap-1 2xl:gap-1.5'>
                        <div>
                          {(() => {
                            const parts = getVehicleNumberParts(permit.vehicleNo);
                            if (!parts) {
                              return (
                                <div className='flex items-center gap-1.5'>
                                  <svg className='w-3.5 h-3.5 2xl:w-4 2xl:h-4 text-blue-600 flex-shrink-0' fill='currentColor' viewBox='0 0 20 20'>
                                    <path d='M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z' />
                                    <path d='M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z' />
                                  </svg>
                                  <span className='text-[13px] 2xl:text-[15px] font-semibold text-gray-900'>{permit.vehicleNo}</span>
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
                        <div className='flex items-center gap-1.5'>
                          <svg className='w-3.5 h-3.5 text-indigo-600 flex-shrink-0' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' />
                          </svg>
                          <span className='text-[11px] 2xl:text-[13px] font-medium text-gray-600'>{permit.permitNumber}</span>
                          {permit.documents?.permitDocument && (
                            <span className='inline-flex items-center ml-1' title='Document uploaded'>
                              <svg className='w-3.5 h-3.5 text-green-500' fill='currentColor' viewBox='0 0 20 20'>
                                <path fillRule='evenodd' d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z' clipRule='evenodd' />
                              </svg>
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className='px-4 2xl:px-6 py-3 2xl:py-5'>
                      <div className='flex items-center justify-center'>
                        <div className='flex-shrink-0 h-8 w-8 2xl:h-10 2xl:w-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold shadow-md text-xs 2xl:text-sm'>
                          {permit.permitHolder?.charAt(0) || 'P'}
                        </div>
                        <div className='ml-2 2xl:ml-4'>
                          <div className='text-[11px] 2xl:text-sm font-bold text-gray-900'>{permit.permitHolder}</div>
                          <div className='text-[10px] 2xl:text-xs text-gray-500 flex items-center mt-0.5 2xl:mt-1'>
                            <svg className='w-3 h-3 mr-1' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z' />
                            </svg>
                            {permit.mobileNumber || 'N/A'}
                          </div>
                        </div>
                      </div>
                    </td>
                    {/* Route */}
                    <td className='px-4 2xl:px-6 py-3 2xl:py-5'>
                      <div className='text-[11px] 2xl:text-sm'>
                        <div className='flex items-center text-gray-700 font-semibold'>
                          <svg className='w-3.5 h-3.5 mr-1.5 text-blue-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M17 8l4 4m0 0l-4 4m4-4H3' />
                          </svg>
                          {permit.routeFrom || 'N/A'}
                        </div>
                        <div className='flex items-center text-gray-600 mt-1'>
                          <svg className='w-3.5 h-3.5 mr-1.5 text-gray-500' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M7 16l-4-4m0 0l4-4m-4 4h18' />
                          </svg>
                          {permit.routeTo || 'N/A'}
                        </div>
                      </div>
                    </td>
                    {/* Category */}
                    <td className='px-4 2xl:px-6 py-3 2xl:py-5'>
                      <span className={`inline-flex items-center px-2.5 py-1 2xl:px-3 2xl:py-1.5 rounded-full text-[10px] 2xl:text-xs font-bold ${
                        permit.category === 'AC' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                        permit.category === 'Delux' ? 'bg-purple-100 text-purple-700 border border-purple-200' :
                        'bg-orange-100 text-orange-700 border border-orange-200'
                      }`}>
                        {permit.category || 'N/A'}
                      </span>
                    </td>
                    <td className='px-0.5 2xl:px-1 py-3 2xl:py-5 pl-8 2xl:pl-12'>
                      <div className='flex items-center text-[11px] 2xl:text-[13.8px]'>
                        <span className='inline-flex items-center px-2 py-1 2xl:px-3 2xl:py-1.5 rounded-lg bg-green-100 text-green-700 font-semibold border border-green-200 whitespace-nowrap'>
                          <svg className='w-3 h-3 2xl:w-4 2xl:h-4 mr-1 2xl:mr-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' />
                          </svg>
                          {permit.validFrom}
                        </span>
                      </div>
                    </td>
                    <td className='px-0.5 2xl:px-1 py-3 2xl:py-5'>
                      <div className='flex items-center text-[11px] 2xl:text-[13.8px]'>
                        <span className='inline-flex items-center px-2 py-1 2xl:px-3 2xl:py-1.5 rounded-lg bg-red-100 text-red-700 font-semibold border border-red-200 whitespace-nowrap'>
                          <svg className='w-3 h-3 2xl:w-4 2xl:h-4 mr-1 2xl:mr-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' />
                          </svg>
                          {permit.validTill}
                        </span>
                      </div>
                    </td>
                    {/* Total Fee */}
                    <td className='px-4 py-4 bg-gray-50/50 group-hover:bg-purple-50/30 pl-12 2xl:pl-16'>
                      <div className='text-right'>
                        <div className='text-[11px] 2xl:text-sm font-bold text-gray-900'>₹{(permit.fees || 0).toLocaleString('en-IN')}</div>
                        <div className='text-[10px] 2xl:text-xs text-gray-500 mt-0.5'>Total Amount</div>
                      </div>
                    </td>

                    {/* Paid */}
                    <td className='px-4 py-4 bg-gray-50/50 group-hover:bg-emerald-50/30'>
                      <div className='text-right'>
                        <div className='text-[11px] 2xl:text-sm font-bold text-emerald-600'>₹{(permit.paid || 0).toLocaleString('en-IN')}</div>
                        <div className='text-[10px] 2xl:text-xs text-emerald-600 mt-0.5'>Paid Amount</div>
                      </div>
                    </td>

                    {/* Balance */}
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
                    <td className='px-4 2xl:px-6 py-3 2xl:py-5 pl-20 2xl:pl-32'>
                      <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap ${getStatusColor(permit.status)}`}>
                        {getStatusText(permit.status)}
                      </span>
                    </td>
                    <td className='px-4 2xl:px-6 py-3 2xl:py-5'>
                      <div className='flex items-center justify-end gap-1'>
                        <button
                          onClick={() => handleViewPermit(permit)}
                          className='p-1.5 2xl:p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-200 cursor-pointer'
                          title='View Details'
                        >
                          <svg className='w-4 h-4 2xl:w-5 2xl:h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 12a3 3 0 11-6 0 3 3 0 016 0z' />
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleEditPermit(permit)}

                          className='p-1.5 2xl:p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 cursor-pointer'
                          title='Edit Permit'
                        >
                          <svg className='w-4 h-4 2xl:w-5 2xl:h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeletePermit(permit)}
                          className='p-1.5 2xl:p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 cursor-pointer'
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
                      <h3 className='text-xl font-black text-gray-700 mb-2'>No Bus Permits Found</h3>
                      <p className='text-sm text-gray-500 mb-6 max-w-md text-center'>
                        {searchQuery ? 'No permits match your search criteria. Try adjusting your search terms.' : 'Get started by adding your first CG permit.'}
                      </p>
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

      {/* Add New Bus Permit Modal - Lazy Loaded */}
      {showIssuePermitModal && (
                  <IssueBusPermitModal
            isOpen={showIssuePermitModal}
            onClose={() => {
              setShowIssuePermitModal(false)
            }}
            onSubmit={handleIssuePermit}
          />
      )}

      {/* Edit Bus Permit Modal - Lazy Loaded */}
      {showEditPermitModal && (
                  <EditBusPermitModal
            isOpen={showEditPermitModal}
            onClose={() => {
              setShowEditPermitModal(false)
              setEditingPermit(null)
            }}
            onSubmit={handleUpdatePermit}
            permit={editingPermit}
          />
      )}

      {/* Bus Permit Details Modal */}
      <BusPermitDetailsModal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false)
          setViewingPermit(null)
        }}
        permit={viewingPermit}
      />

        </div>
      </div>
    </>
  )
}

export default BusPermit
