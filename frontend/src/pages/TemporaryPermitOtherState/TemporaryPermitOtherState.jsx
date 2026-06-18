import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-toastify'
import Pagination from '../../components/Pagination'
import IssueTemporaryPermitOtherStateModal from './components/IssueTemporaryPermitOtherStateModal'
import EditTemporaryPermitOtherStateModal from './components/EditTemporaryPermitOtherStateModal'
import AddButton from '../../components/AddButton'
import SearchBar from '../../components/SearchBar'
import StatisticsCard from '../../components/StatisticsCard'
import MobileCardView from '../../components/MobileCardView'
import { getTheme, getVehicleNumberDesign } from '../../context/ThemeContext'

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'

import { getStatusColor, getStatusText } from '../../utils/statusUtils';
import { getVehicleNumberParts } from '../../utils/vehicleNoCheck';

const TemporaryPermitOtherState = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const theme = getTheme()
  const vehicleDesign = getVehicleNumberDesign()
  const [permits, setPermits] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  const [showIssuePermitModal, setShowIssuePermitModal] = useState(false)
  const [showEditPermitModal, setShowEditPermitModal] = useState(false)
  const [editingPermit, setEditingPermit] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')
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

  const fetchStatistics = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/temporary-permits-other-state/statistics`, { withCredentials: true });
      if (response.data.success) {
        setStatistics(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 500)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Fetch permits from backend
  useEffect(() => {
    fetchPermits(1)
    fetchStatistics();
  }, [debouncedSearchQuery, statusFilter])

  useEffect(() => {
    if (!location.state?.openAddModal) return

    setShowIssuePermitModal(true)
    navigate(location.pathname, { replace: true, state: {} })
  }, [location.pathname, location.state, navigate])

  const fetchPermits = async (page = pagination.currentPage) => {
    try {
      setLoading(true)
      setError(null)

      let url = `${API_URL}/api/temporary-permits-other-state`
      const params = {
        page,
        limit: pagination.limit,
        search: debouncedSearchQuery
      }

      if (statusFilter !== 'all') {
        // Convert underscore to hyphen for API endpoints
        const filterPath = statusFilter.replace('_', '-')
        url = `${API_URL}/api/temporary-permits-other-state/${filterPath}`
      }

      const response = await axios.get(url, { params, withCredentials: true })

      if (response.data.success) {
        // Transform data to include WhatsApp tracking fields explicitly
        const transformedPermits = (response.data.data || []).map(permit => ({
          ...permit,
          whatsappMessageCount: permit.whatsappMessageCount || 0,
          lastWhatsappSentAt: permit.lastWhatsappSentAt || null,
        }));
        setPermits(transformedPermits)
        setPagination({
          currentPage: response.data.pagination?.currentPage || 1,
          totalPages: response.data.pagination?.totalPages || 1,
          totalRecords: response.data.pagination?.totalRecords || response.data.pagination?.totalItems || 0,
          limit: response.data.pagination?.itemsPerPage || 20
        })
      }
    } catch (error) {
      console.error('Error fetching permits:', error)
      setError('Failed to fetch permits')
      toast.error('Failed to fetch permits')
    } finally {
      setLoading(false)
    }
  }



  const handlePageChange = (newPage) => {
    fetchPermits(newPage)
  }

  const handleEditPermit = (permit) => {
    setEditingPermit(permit)
    setShowEditPermitModal(true)
  }

  const handleDeletePermit = async (id) => {
    if (window.confirm('Are you sure you want to delete this permit?')) {
      try {
        await axios.delete(`${API_URL}/api/temporary-permits-other-state/${id}`, { withCredentials: true })
        toast.success('Permit deleted successfully')
        fetchPermits(pagination.currentPage)
        fetchStatistics()
      } catch (error) {
        console.error('Error deleting permit:', error)
        toast.error('Failed to delete permit')
      }
    }
  }

  // Mark temporary permit (other state) as paid
  const handleMarkAsPaid = async (permit) => {
    const confirmPaid = window.confirm(
      `Are you sure you want to mark this payment as PAID?\n\n` +
      `Permit Number: ${permit.permitNumber}\n` +
      `Vehicle Number: ${permit.vehicleNo}\n` +
      `Total Fee: ₹${(permit.totalFee || 0).toLocaleString('en-IN')}\n` +
      `Current Balance: ₹${(permit.balance || 0).toLocaleString('en-IN')}\n\n` +
      `This will set Paid = ₹${(permit.totalFee || 0).toLocaleString('en-IN')} and Balance = ₹0`
    );

    if (!confirmPaid) return;

    try {
      const response = await axios.patch(`${API_URL}/api/temporary-permits-other-state/${permit._id}/mark-as-paid`, {}, { withCredentials: true });
      if (!response.data.success) throw new Error(response.data.message || 'Failed to mark payment as paid');

      toast.success('Payment marked as paid successfully!', { position: 'top-right', autoClose: 3000 });
      await fetchPermits();
      await fetchStatistics();
    } catch (error) {
      console.error('Error marking payment as paid:', error);
      toast.error(`Failed to mark payment as paid: ${error.message}`, { position: 'top-right', autoClose: 3000 });
    }
  };

  // Helper function to open WhatsApp with custom message (expiring only)
  const handleWhatsAppClick = async (permit) => {
    if (!permit.mobileNumber || permit.mobileNumber === 'N/A') {
      toast.error('Mobile number not available for this permit', {
        position: 'top-right',
        autoClose: 3000
      });
      return;
    }

    // Format mobile number (remove spaces, dashes, etc.)
    let phoneNumber = permit.mobileNumber.replace(/\D/g, '');

    // Add +91 country code if not already present
    if (!phoneNumber.startsWith('91')) {
      phoneNumber = '91' + phoneNumber;
    }

    // Create custom message for expiring permits only
    let message = `Hello ${permit.permitHolder || ''},\n\n`;

    if (permit.status === 'expiring_soon' || permit.status === 'expired') {
      const statusText = permit.status === 'expired' ? 'has expired' : 'is going to expire';
      message += `Your temporary permit (Other State) ${statusText} on ${permit.validTill}.\n`;
      message += `Permit Number: ${permit.permitNumber}\n`;
      message += `Vehicle Number: ${permit.vehicleNo}\n`;
      message += `Please renew your permit at the earliest.\n\n`;
    }

    message += `Thank you for your cooperation.`;

    // Increment WhatsApp message count in backend
    try {
      const response = await axios.patch(
        `${API_URL}/api/temporary-permits-other-state/${permit._id}/whatsapp-increment`,
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
    const whatsappURL = `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`;
    window.location.href = whatsappURL;
  };

  // Determine if WhatsApp button should be shown (expiring only)
  const shouldShowWhatsAppButton = (permit) => {
    return (permit.status === 'expiring_soon' || permit.status === 'expired');
  };

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

  return (
    <>
      <div className='min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50'>
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
                title='Total (Other State)'
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
                subtext='Within 7 days'
                color='orange'
                isActive={statusFilter === 'expiring_soon'}
                onClick={() => setStatusFilter(statusFilter === 'expiring_soon' ? 'all' : 'expiring_soon')}
                icon={
                  <svg className='w-4 h-4 lg:w-6 lg:h-6 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' />
                  </svg>
                }
              />
              <StatisticsCard
                title='Expired'
                value={statistics.expired}
                subtext='expired permit'
                color='red'
                isActive={statusFilter === 'expired'}
                onClick={() => setStatusFilter(statusFilter === 'expired' ? 'all' : 'expired')}
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
                  placeholder='Search by vehicle number...'
                  toUpperCase={true}
                />

                {/* New Permit Button */}
                <AddButton onClick={() => setShowIssuePermitModal(true)} title='New Permit (Other State)' />
              </div>
            </div>

            {/* Mobile Card View */}
            <MobileCardView
              loading={loading}
              records={permits}
              emptyMessage={{
                title: 'No Temporary Permits (Other State) Found',
                description: 'Get started by adding your first permit.',
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
                    record.mobileNo && record.mobileNo !== 'N/A' && (
                      <a
                        href={`tel:${record.mobileNo}`}
                        className='flex items-center mt-1 text-blue-600 font-semibold hover:text-blue-700 active:text-blue-800 transition-all cursor-pointer underline decoration-blue-400 underline-offset-2'
                      >
                        <svg className='w-3.5 h-3.5 mr-1 text-blue-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z' />
                        </svg>
                        {record.mobileNo}
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
                  title: 'Edit Permit',
                  onClick: handleEditPermit,
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
                  title: 'Delete Permit',
                  onClick: (permit) => handleDeletePermit(permit._id),
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
                    <th className='px-4 2xl:px-6 py-3 2xl:py-4 text-left text-[10px] 2xl:text-xs font-bold text-white uppercase tracking-wider'>Permit Holder</th>
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
                      <td colSpan='9' className='px-6 py-16'>
                        <div className='flex flex-col justify-center items-center'>
                          <div className='relative'>
                            <div className='w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl animate-pulse shadow-lg'></div>
                            <div className='absolute inset-0 w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-2xl animate-spin'></div>
                          </div>
                          <p className='text-gray-600 mt-6'>Loading permits...</p>
                        </div>
                      </td>
                    </tr>
                  ) : permits.length > 0 ? (
                    permits.map((permit) => (
                      <tr key={permit._id} className='hover:bg-gradient-to-r hover:from-blue-50 hover:via-indigo-50 hover:to-purple-50 transition-all duration-300 group'>
                        <td className='px-4 2xl:px-6 py-3 2xl:py-5'>
                          <div className='flex flex-col gap-1 2xl:gap-1.5'>
                            <div>
                              {(() => {
                                const parts = getVehicleNumberParts(permit.vehicleNo)
                                if (!parts) {
                                  return (
                                    <div className='flex items-center gap-1 2xl:gap-1.5'>
                                      <svg className='w-3.5 h-3.5 2xl:w-4 2xl:h-4 text-blue-600 flex-shrink-0' fill='currentColor' viewBox='0 0 20 20'>
                                        <path d='M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z' />
                                        <path d='M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z' />
                                      </svg>
                                      <span className='text-[13px] 2xl:text-[15px] font-semibold text-gray-900'>{permit.vehicleNo}</span>
                                    </div>
                                  )
                                }
                                return (
                                  <div className={vehicleDesign.container}>

                                     <svg
                                        className="w-3.5 h-5 2xl:w-4 2xl:h-6 mr-0.5 text-blue-800 flex-shrink-0"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                      >
                                        <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                                        <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z" />
                                      </svg>

                                    <span className={vehicleDesign.stateCode}>{parts.stateCode}</span>
                                    <span className={vehicleDesign.districtCode}>{parts.districtCode}</span>
                                    <span className={vehicleDesign.series}>{parts.series}</span>
                                    <span className={vehicleDesign.last4Digits}>{parts.last4Digits}</span>
                                  </div>
                                )
                              })()}
                            </div>
                            <div className='flex items-center gap-1 2xl:gap-1.5'>
                              <svg className='w-3 h-3 2xl:w-3.5 2xl:h-3.5 text-indigo-600 flex-shrink-0' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' />
                              </svg>
                              <span className='text-[11px] 2xl:text-[13px] font-medium text-gray-600'>{permit.permitNumber}</span>
                            </div>
                          </div>
                        </td>
                        <td className='px-4 2xl:px-6 py-3 2xl:py-5'>
                          <div className='flex items-center'>
                            <div className='flex-shrink-0 h-8 w-8 2xl:h-10 2xl:w-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold shadow-md text-xs 2xl:text-sm'>
                              {permit.permitHolder?.charAt(0) || 'P'}
                            </div>
                            <div className='ml-2 2xl:ml-4'>
                              <div className='text-[11px] 2xl:text-sm font-bold text-gray-900'>{permit.permitHolder}</div>
                              <div className='text-[10px] 2xl:text-xs text-gray-500 flex items-center mt-0.5 2xl:mt-1'>
                                <svg className='w-2.5 h-2.5 2xl:w-3 2xl:h-3 mr-0.5 2xl:mr-1' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z' />
                                </svg>
                                {permit.mobileNo || 'N/A'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className='px-0.5 2xl:px-1 py-3 2xl:py-5 pl-8 2xl:pl-12'>
                          <div className='flex items-center text-[11px] 2xl:text-[13.8px]'>
                            <span className='inline-flex items-center px-2 py-1 2xl:px-3 2xl:py-1.5 rounded-lg bg-green-100 text-green-700 font-semibold border border-green-200 whitespace-nowrap'>
                              <svg className='w-3 h-3 2xl:w-4 2xl:h-4 mr-1 2xl:mr-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' />
                              </svg>
                              {permit.validFrom?.replace(/\//g, '-') || permit.validFrom}
                            </span>
                          </div>
                        </td>
                        <td className='px-0.5 2xl:px-1 py-3 2xl:py-5'>
                          <div className='flex items-center text-[11px] 2xl:text-[13.8px]'>
                            <span className='inline-flex items-center px-2 py-1 2xl:px-3 2xl:py-1.5 rounded-lg bg-red-100 text-red-700 font-semibold border border-red-200 whitespace-nowrap'>
                              <svg className='w-3 h-3 2xl:w-4 2xl:h-4 mr-1 2xl:mr-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' />
                              </svg>
                              {permit.validTo?.replace(/\//g, '-') || permit.validTo}
                            </span>
                          </div>
                        </td>
                        {/* Total Fee */}
                        <td className='px-4 py-4 bg-gray-50/50 group-hover:bg-purple-50/30 pl-12 2xl:pl-16'>
                          <div className='text-right'>
                            <div className='text-[11px] 2xl:text-sm font-bold text-gray-900'>₹{(permit.totalFee || 0).toLocaleString('en-IN')}</div>
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
                          <span className={`inline-flex items-center px-2 py-1 2xl:px-3 2xl:py-1.5 rounded-full text-[10px] 2xl:text-xs font-bold ${getStatusColor(permit.status)}`}>
                            {getStatusText(permit.status)}
                          </span>
                        </td>
                        <td className='px-1 2xl:px-2 py-3 2xl:py-5'>
                          <div className='flex items-center justify-center gap-1 2xl:gap-2'>

                            {/* edit button */}
                            <button
                              onClick={() => handleEditPermit(permit)}

                              className='p-1.5 2xl:p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-all group-hover:scale-110 duration-200'
                              title='Edit Permit'
                            >
                              <svg className='w-4 h-4 2xl:w-5 2xl:h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' />
                              </svg>
                            </button>

                            {/* delete button */}
                            <button
                              onClick={() => handleDeletePermit(permit._id)}
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
                          <div className='w-20 h-20 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full flex items-center justify-center mb-4 shadow-lg'>
                            <svg className='w-10 h-10 text-amber-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' />
                            </svg>
                          </div>
                          <h3 className='text-lg font-black text-gray-700 mb-2'>No Temporary Permits Found</h3>
                          <p className='text-sm text-gray-500 text-center max-w-xs'>
                            {searchQuery ? 'No permits match your search criteria.' : 'Get started by adding your first temporary permit (other state).'}
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {!loading && permits.length > 0 && (
              <div className='px-6 py-4 border-t border-gray-200'>
                <Pagination
                  currentPage={pagination.currentPage}
                  totalPages={pagination.totalPages}
                  onPageChange={handlePageChange}
                  totalRecords={pagination.totalRecords}
                  itemsPerPage={pagination.limit}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals - Lazy Loaded */}
      {showIssuePermitModal && (
                  <IssueTemporaryPermitOtherStateModal
            onClose={() => setShowIssuePermitModal(false)}
            onPermitIssued={() => {
              setShowIssuePermitModal(false)
              fetchPermits(pagination.currentPage)
              fetchStatistics()
            }}
          />
      )}

      {/* Edit Modal - Lazy Loaded */}
      {showEditPermitModal && editingPermit && (
                  <EditTemporaryPermitOtherStateModal
            permit={editingPermit}
            onClose={() => {
              setShowEditPermitModal(false)
              setEditingPermit(null)
            }}
            onPermitUpdated={() => {
              setShowEditPermitModal(false)
              setEditingPermit(null)
              fetchPermits(pagination.currentPage)
              fetchStatistics()
            }}
          />
      )}
    </>
  )
}

export default TemporaryPermitOtherState
