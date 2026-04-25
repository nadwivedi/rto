import { useState, useMemo, useEffect } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import Pagination from '../../components/Pagination'
import QuickDLApplicationForm from './components/QuickDLApplicationForm'
import EditDLApplicationForm from './components/EditDLApplicationForm'
import ApplicationDetailModal from './components/ApplicationDetailModal'
import AddButton from '../../components/AddButton'
import SearchBar from '../../components/SearchBar'
import StatisticsCard from '../../components/StatisticsCard'
import MobileCardView from '../../components/MobileCardView'
import { getTheme } from '../../context/ThemeContext'

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'

const DrivingLicence = () => {
  const theme = getTheme()
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isEditFormOpen, setIsEditFormOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [selectedApplication, setSelectedApplication] = useState(null)
  const [typeFilter, setTypeFilter] = useState('All')
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('All')
  const [llEligibleForDLFilter, setLlEligibleForDLFilter] = useState('All')
  const [llExpiryFilter, setLlExpiryFilter] = useState('All')
  const [llExpiringCount, setLlExpiringCount] = useState(0)
  const [llEligibleForDLCount, setLlEligibleForDLCount] = useState(0)
  const [pendingPaymentCount, setPendingPaymentCount] = useState(0)
  const [totalPendingAmount, setTotalPendingAmount] = useState(0)
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalRecords: 0,
    limit: 20
  })

  // Fetch applications from backend
  useEffect(() => {
    fetchApplications(1)
  }, [searchQuery, typeFilter, paymentStatusFilter, llEligibleForDLFilter])

  // Fetch statistics on component mount
  useEffect(() => {
    fetchStatistics()
  }, [])

  const fetchStatistics = async () => {
    try {
      // Fetch all statistics in one call
      const response = await axios.get(`${API_URL}/api/driving-licenses/statistics`, {
        withCredentials: true
      })
      if (response.data.success) {
        const data = response.data.data
        setLlExpiringCount(data.llExpiringCount || 0)
        setLlEligibleForDLCount(data.llEligibleForDLCount || 0)
        setPendingPaymentCount(data.pendingPaymentCount || 0)
        setTotalPendingAmount(data.pendingPaymentAmount || 0)
      }
    } catch (error) {
      console.error('Error fetching statistics:', error)
      setLlExpiringCount(0)
      setLlEligibleForDLCount(0)
      setPendingPaymentCount(0)
      setTotalPendingAmount(0)
    }
  }

  const fetchApplications = async (page = pagination.currentPage) => {
    try {
      setLoading(true)
      const params = {
        page,
        limit: pagination.limit
      }

      if (searchQuery) params.search = searchQuery
      if (typeFilter !== 'All') params.licenseClass = typeFilter
      if (paymentStatusFilter !== 'All') params.paymentStatus = paymentStatusFilter
      if (llEligibleForDLFilter !== 'All') params.llEligibleForDL = 'true'

      const response = await axios.get(`${API_URL}/api/driving-licenses`, { params, withCredentials: true })

      const transformedData = (response.data.data || []).map(app => {

        // Safely handle date
        let formattedDate = '-'
        try {
          if (app.createdAt) {
            const d = new Date(app.createdAt);
            const day = String(d.getDate()).padStart(2, '0');
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const year = d.getFullYear();
            formattedDate = `${day}-${month}-${year}`;
          }
        } catch (err) {
          console.error('Date parsing error:', err)
        }

        // Format license issue date (prioritize new field, fallback to old field)
        let formattedIssueDate = '-'
        try {
          const issueDate = app.LicenseIssueDate || app.drivingLicenseIssueDate
          if (issueDate) {
            const d = new Date(issueDate);
            if (!isNaN(d.getTime())) {
              const day = String(d.getDate()).padStart(2, '0');
              const month = String(d.getMonth() + 1).padStart(2, '0');
              const year = d.getFullYear();
              formattedIssueDate = `${day}-${month}-${year}`;
            }
          }
        } catch (err) {
          console.error('Issue date parsing error:', err)
        }

        // Format license expiry date (prioritize new field, fallback to old field)
        let formattedExpiryDate = '-'
        try {
          const expiryDate = app.LicenseExpiryDate || app.drivingLicenseExpiryDate
          if (expiryDate) {
            const d = new Date(expiryDate);
            if (!isNaN(d.getTime())) {
              const day = String(d.getDate()).padStart(2, '0');
              const month = String(d.getMonth() + 1).padStart(2, '0');
              const year = d.getFullYear();
              formattedExpiryDate = `${day}-${month}-${year}`;
            }
          }
        } catch (err) {
          console.error('Expiry date parsing error:', err)
        }

        return {
          id: app._id,
          name: app.name || '-',
          type: app.licenseClass || '-',
          date: formattedDate,
          licenseNumber: app.LicenseNumber || app.drivingLicenseNumber || '-',
          issueDate: formattedIssueDate,
          expiryDate: formattedExpiryDate,
          licenseClass: app.licenseClass || '-',
          totalAmount: app.totalAmount || 0,
          paidAmount: app.paidAmount || 0,
          balanceAmount: app.balanceAmount || 0,
          mobile: app.mobileNumber || '-',
          email: app.email || '-',
          fullData: app
        }
      })

      setApplications(transformedData)

      // Update pagination state
      if (response.data.pagination) {
        setPagination({
          currentPage: response.data.pagination.currentPage,
          totalPages: response.data.pagination.totalPages,
          totalRecords: response.data.pagination.totalItems,
          limit: pagination.limit
        })
      }
    } catch (error) {
      console.error('Error fetching applications:', error)
      toast.error('Failed to fetch applications. Please try again.', { autoClose: 700 })
      setApplications([])
      setPagination({
        currentPage: 1,
        totalPages: 1,
        totalRecords: 0,
        limit: pagination.limit
      })
    } finally {
      setLoading(false)
    }
  }


  // Apply client-side filtering for LL expiry only
  const currentApplications = useMemo(() => {
    let filtered = [...applications]

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Filter by LL Expiry
    if (llExpiryFilter !== 'All') {
      filtered = filtered.filter(app => {
        const llExpiryDate = app.fullData?.learningLicenseExpiryDate
        if (!llExpiryDate) return false

        try {
          const expiry = new Date(llExpiryDate)
          const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24))

          if (llExpiryFilter === '30') {
            return daysUntilExpiry >= 0 && daysUntilExpiry <= 30
          } else if (llExpiryFilter === '45') {
            return daysUntilExpiry >= 0 && daysUntilExpiry <= 45
          }
        } catch (e) {
          return false
        }
        return true
      })
    }

    return filtered
  }, [applications, llExpiryFilter])

  // Calculate statistics
  const stats = useMemo(() => {
    const total = pagination.totalRecords

    // Use the fetched counts instead of calculating from current page
    const llEligibleForDL = llEligibleForDLCount
    const llExpiringSoon = llExpiringCount

    return {
      total,
      llEligibleForDL,
      llExpiringSoon,
      totalPending: totalPendingAmount,
      pendingCount: pendingPaymentCount
    }
  }, [pagination.totalRecords, llEligibleForDLCount, llExpiringCount, totalPendingAmount, pendingPaymentCount])

  // Page change handler
  const handlePageChange = (newPage) => {
    fetchApplications(newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleViewDetails = (app) => {
    setSelectedApplication(app)
    setIsDetailModalOpen(true)
  }

  const handleEdit = (app) => {
    setSelectedApplication(app)
    setIsEditFormOpen(true)
  }

  const handleDelete = async (app) => {
    // Show confirmation dialog
    const confirmDelete = window.confirm(
      `Are you sure you want to delete this driving license application?\n\n` +
      `License Number: ${app.licenseNumber || 'N/A'}\n` +
      `Name: ${app.name}\n` +
      `License Class: ${app.licenseClass}\n\n` +
      `This action cannot be undone.`
    )

    if (!confirmDelete) {
      return
    }

    try {
      const response = await axios.delete(`${API_URL}/api/driving-licenses/${app.id}`, { withCredentials: true })

      if (response.data.success) {
        toast.success('Application deleted successfully!', { autoClose: 700 })
        fetchApplications() // Refresh the list
        fetchStatistics() // Refresh the statistics
      }
    } catch (error) {
      console.error('Error deleting application:', error)
      toast.error('Failed to delete application. Please try again.', { autoClose: 700 })
    }
  }

  // Mark driving license as paid
  const handleMarkAsPaid = async (app) => {
    const confirmPaid = window.confirm(
      `Are you sure you want to mark this payment as PAID?\n\n` +
      `Name: ${app.name}\n` +
      `License Number: ${app.licenseNumber || 'N/A'}\n` +
      `Total Amount: ₹${(app.totalAmount || 0).toLocaleString('en-IN')}\n` +
      `Current Balance: ₹${(app.balanceAmount || 0).toLocaleString('en-IN')}\n\n` +
      `This will set Paid = ₹${(app.totalAmount || 0).toLocaleString('en-IN')} and Balance = ₹0`
    );

    if (!confirmPaid) return;

    try {
      const response = await axios.patch(`${API_URL}/api/driving-licenses/${app.id}/mark-as-paid`, {}, { withCredentials: true });
      if (!response.data.success) throw new Error(response.data.message || 'Failed to mark payment as paid');

      toast.success('Payment marked as paid successfully!', { autoClose: 700 });
      fetchApplications();
      fetchStatistics(); // Refresh the statistics
    } catch (error) {
      console.error('Error marking payment as paid:', error);
      toast.error(`Failed to mark payment as paid: ${error.message}`, { autoClose: 700 });
    }
  };

  // Helper function to open WhatsApp with custom message (expiring only)
  const handleWhatsAppClick = (app) => {
    if (!app.mobileNumber || app.mobileNumber === 'N/A') {
      toast.error('Mobile number not available for this application', {
        position: 'top-right',
        autoClose: 3000
      });
      return;
    }

    // Format mobile number (remove spaces, dashes, etc.)
    let phoneNumber = app.mobileNumber.replace(/\D/g, '');

    // Add +91 country code if not already present
    if (!phoneNumber.startsWith('91')) {
      phoneNumber = '91' + phoneNumber;
    }

    // Create custom message for expiring licenses only
    let message = `Hello ${app.name || ''},\n\n`;

    // Check if LL is expiring
    if (app.llExpiryDate && isExpiringSoon(app.llExpiryDate)) {
      message += `Your Learner's License is expiring on ${app.llExpiryDate}.\n`;
      message += `Please renew your license at the earliest.\n\n`;
    }

    // Check if DL is expiring
    if (app.dlExpiryDate && isExpiringSoon(app.dlExpiryDate)) {
      message += `Your Driving License is expiring on ${app.dlExpiryDate}.\n`;
      message += `Please renew your license at the earliest.\n\n`;
    }

    message += `Thank you for your cooperation.`;

    // Open WhatsApp directly (not web)
    const whatsappURL = `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`;
    window.location.href = whatsappURL;
  };

  // Helper function to check if date is expiring soon (within 30 days)
  const isExpiringSoon = (dateStr) => {
    if (!dateStr || dateStr === 'N/A') return false;

    // Parse date string (DD-MM-YYYY format)
    const parts = dateStr.split('-');
    if (parts.length !== 3) return false;

    const expiryDate = new Date(parts[2], parts[1] - 1, parts[0]);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const daysRemaining = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
    return daysRemaining <= 30 && daysRemaining >= 0;
  };

  // Determine if WhatsApp button should be shown (expiring licenses only)
  const shouldShowWhatsAppButton = (app) => {
    return (
      (app.llExpiryDate && isExpiringSoon(app.llExpiryDate)) ||
      (app.dlExpiryDate && isExpiringSoon(app.dlExpiryDate))
    );
  };

  const handleFormSubmit = async (formData) => {
    try {
      // Helper function to convert DD-MM-YYYY to ISO date format
      const convertDateToISO = (dateStr) => {
        if (!dateStr) return null
        const [day, month, year] = dateStr.split('-')
        return `${year}-${month}-${day}` // Convert to YYYY-MM-DD format
      }

      // Transform form data to match backend schema
      const applicationData = {
        name: formData.name,
        dateOfBirth: convertDateToISO(formData.dateOfBirth),
        gender: formData.gender,
        fatherName: formData.fatherName,
        mobileNumber: formData.mobileNumber,
        email: formData.email,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        licenseClass: formData.licenseClass,
        licenseNumber: formData.licenseNumber,
        licenseIssueDate: formData.licenseIssueDate,
        licenseExpiryDate: formData.licenseExpiryDate,
        learningLicenseApplicationNumber: formData.learningLicenseApplicationNumber,
        learningLicenseNumber: formData.learningLicenseNumber,
        learningLicenseIssueDate: formData.learningLicenseIssueDate,
        learningLicenseExpiryDate: formData.learningLicenseExpiryDate,
        panNumber: formData.panNumber,
        emergencyContact: formData.emergencyContact,
        emergencyRelation: formData.emergencyRelation,
        totalAmount: parseFloat(formData.totalAmount) || 0,
        paidAmount: parseFloat(formData.paidAmount) || 0,
        balanceAmount: parseFloat(formData.balanceAmount) || 0,
        applicationStatus: 'pending',
        documents: formData.documents
      }

      const response = await axios.post(`${API_URL}/api/driving-licenses`, applicationData, { withCredentials: true })

      if (response.data.success) {
        toast.success('Application submitted successfully!', { autoClose: 700 })
        fetchApplications() // Refresh the list
        fetchStatistics() // Refresh the statistics
      }
    } catch (error) {
      console.error('Error submitting application:', error)
      toast.error('Failed to submit application. Please try again.', { autoClose: 700 })
    }
  }

  const handleEditSubmit = async (formData) => {
    try {
      // Helper function to convert DD-MM-YYYY to ISO date format
      const convertDateToISO = (dateStr) => {
        if (!dateStr) return null
        const [day, month, year] = dateStr.split('-')
        return `${year}-${month}-${day}` // Convert to YYYY-MM-DD format
      }

      // Transform form data to match backend schema
      const applicationData = {
        name: formData.name,
        dateOfBirth: convertDateToISO(formData.dateOfBirth),
        gender: formData.gender,
        fatherName: formData.fatherName,
        mobileNumber: formData.mobileNumber,
        email: formData.email,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        licenseClass: formData.licenseClass,
        licenseNumber: formData.licenseNumber,
        licenseIssueDate: formData.licenseIssueDate,
        licenseExpiryDate: formData.licenseExpiryDate,
        learningLicenseApplicationNumber: formData.learningLicenseApplicationNumber,
        learningLicenseNumber: formData.learningLicenseNumber,
        learningLicenseIssueDate: formData.learningLicenseIssueDate,
        learningLicenseExpiryDate: formData.learningLicenseExpiryDate,
        drivingLicenseNumber: formData.drivingLicenseNumber,
        drivingLicenseIssueDate: convertDateToISO(formData.drivingLicenseIssueDate),
        drivingLicenseExpiryDate: convertDateToISO(formData.drivingLicenseExpiryDate),
        panNumber: formData.panNumber,
        emergencyContact: formData.emergencyContact,
        emergencyRelation: formData.emergencyRelation,
        totalAmount: parseFloat(formData.totalAmount) || 0,
        paidAmount: parseFloat(formData.paidAmount) || 0,
        balanceAmount: parseFloat(formData.balanceAmount) || 0,
        applicationStatus: formData.applicationStatus,
        notes: formData.notes,
        documents: formData.documents
      }

      const response = await axios.put(`${API_URL}/api/driving-licenses/${selectedApplication.id}`, applicationData, { withCredentials: true })

      if (response.data.success) {
        toast.success('Application updated successfully!', { autoClose: 700 })
        setIsEditFormOpen(false)
        fetchApplications() // Refresh the list
        fetchStatistics() // Refresh the statistics
      }
    } catch (error) {
      console.error('Error updating application:', error)
      toast.error('Failed to update application. Please try again.', { autoClose: 700 })
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
                title='Total Applications'
                value={stats.total}
                color='blue'
                isActive={paymentStatusFilter === 'All' && llEligibleForDLFilter === 'All' && llExpiryFilter === 'All'}
                onClick={() => {
                  setPaymentStatusFilter('All')
                  setLlEligibleForDLFilter('All')
                  setLlExpiryFilter('All')
                }}
                icon={
                  <svg className='w-4 h-4 lg:w-6 lg:h-6 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' />
                  </svg>
                }
              />
              <StatisticsCard
                title='Eligible for DL'
                value={stats.llEligibleForDL}
                color='purple'
                isActive={llEligibleForDLFilter === 'eligible'}
                onClick={() => {
                  if (llEligibleForDLFilter === 'eligible') {
                    // If already active, reset to show all
                    setLlEligibleForDLFilter('All')
                  } else {
                    // Activate LL eligible filter and reset others
                    setLlEligibleForDLFilter('eligible')
                    setLlExpiryFilter('All')
                    setPaymentStatusFilter('All')
                  }
                }}
                subtext='LL completed 30 days'
                icon={
                  <svg className='w-4 h-4 lg:w-6 lg:h-6 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' />
                  </svg>
                }
              />
              <StatisticsCard
                title='LL Expiring Soon'
                value={stats.llExpiringSoon}
                color='yellow'
                isActive={llExpiryFilter === '30'}
                onClick={() => {
                  if (llExpiryFilter === '30') {
                    // If already active, reset to show all
                    setLlExpiryFilter('All')
                  } else {
                    // Activate LL expiring filter and reset others
                    setLlExpiryFilter('30')
                    setLlEligibleForDLFilter('All')
                    setPaymentStatusFilter('All')
                  }
                }}
                subtext='Within 30 days'
                icon={
                  <svg className='w-4 h-4 lg:w-6 lg:h-6 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' />
                  </svg>
                }
              />
              <StatisticsCard
                title='Pending Payment'
                value={stats.pendingCount}
                color='orange'
                isActive={paymentStatusFilter === 'Pending'}
                onClick={() => {
                  if (paymentStatusFilter === 'Pending') {
                    // If already active, reset to show all
                    setPaymentStatusFilter('All')
                  } else {
                    // Activate pending payment filter and reset others
                    setPaymentStatusFilter('Pending')
                    setLlEligibleForDLFilter('All')
                    setLlExpiryFilter('All')
                  }
                }}
                extraValue={`₹${stats.totalPending.toLocaleString('en-IN')}`}
                icon={
                  <svg className='w-4 h-4 lg:w-6 lg:h-6 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' />
                  </svg>
                }
              />
            </div>
          </div>

          {/* Quick DL Application Form */}
      {isFormOpen && (
        <QuickDLApplicationForm
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          onSubmit={handleFormSubmit}
        />
      )}

      {/* Edit DL Application Form */}
      {isEditFormOpen && (
        <EditDLApplicationForm
          isOpen={isEditFormOpen}
          onClose={() => setIsEditFormOpen(false)}
          onSubmit={handleEditSubmit}
          application={selectedApplication}
        />
      )}

      {/* Application Detail Modal */}
      {isDetailModalOpen && (
        <ApplicationDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          application={selectedApplication}
        />
      )}

      {/* Applications Table */}
      <div className='bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden'>
        <div className='px-3 lg:px-6 py-3 lg:py-5 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border-b border-gray-200'>
          {/* All Filters, Search and Action in One Line */}
          <div className='flex flex-col lg:flex-row gap-2 items-stretch lg:items-center'>
            {/* Search Bar */}
            <SearchBar
              value={searchQuery}
              onChange={(value) => setSearchQuery(value)}
              placeholder='Search by DL number or name...'
            />

            {/* Filters Group */}
            <div className='flex flex-wrap gap-2'>


              {/* License Class Filter */}
              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value)
                }}
                className='w-[calc(50%-0.25rem)] lg:w-auto px-2 lg:px-4 py-2 lg:py-3 text-xs lg:text-sm border-2 border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 font-semibold bg-white hover:border-indigo-300 transition-all shadow-sm'
              >
                <option value='All'>All Types</option>
                <option value='MCWG'>MCWG</option>
                <option value='LMV'>LMV</option>
                <option value='MCWG+LMV'>Both</option>
                <option value='HMV'>HMV</option>
                <option value='Commercial'>Commercial</option>
                <option value='Transport'>Transport</option>
              </select>

              {/* Payment Status Filter */}
              <select
                value={paymentStatusFilter}
                onChange={(e) => {
                  setPaymentStatusFilter(e.target.value)
                }}
                className='w-[calc(50%-0.25rem)] lg:w-auto px-2 lg:px-4 py-2 lg:py-3 text-xs lg:text-sm border-2 border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 font-semibold bg-white hover:border-indigo-300 transition-all shadow-sm'
              >
                <option value='All'>All Status</option>
                <option value='Paid'>Paid</option>
                <option value='Pending'>Pending</option>
              </select>

              {/* Clear Filters */}
              {(typeFilter !== 'All' || searchQuery || paymentStatusFilter !== 'All' || llEligibleForDLFilter !== 'All' || llExpiryFilter !== 'All') && (
                <button
                  onClick={() => {
                    setTypeFilter('All')
                    setSearchQuery('')
                    setPaymentStatusFilter('All')
                    setLlEligibleForDLFilter('All')
                    setLlExpiryFilter('All')
                  }}
                  className='px-3 lg:px-4 py-2 lg:py-3 text-xs lg:text-sm bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-xl hover:from-red-600 hover:to-rose-600 transition-all font-bold shadow-md hover:shadow-lg'
                >
                  Clear
                </button>
              )}
            </div>

            {/* New Application Button */}
            <AddButton onClick={() => setIsFormOpen(true)} title='New Application' />
          </div>

          {/* Active Filter Indicators */}
          {(llEligibleForDLFilter !== 'All' || llExpiryFilter !== 'All') && (
            <div className='mt-3 flex flex-wrap gap-2'>
              {llEligibleForDLFilter !== 'All' && (
                <span className='inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold'>
                  <svg className='w-3 h-3' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z' />
                  </svg>
                  Eligible for DL (LL completed 30+ days)
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setLlEligibleForDLFilter('All')
                    }}
                    className='ml-1 hover:bg-purple-200 rounded-full p-0.5'
                  >
                    <svg className='w-3 h-3' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                    </svg>
                  </button>
                </span>
              )}
              {llExpiryFilter !== 'All' && (
                <span className='inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold'>
                  <svg className='w-3 h-3' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z' />
                  </svg>
                  LL Expiring in {llExpiryFilter} days
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setLlExpiryFilter('All')
                    }}
                    className='ml-1 hover:bg-yellow-200 rounded-full p-0.5'
                  >
                    <svg className='w-3 h-3' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                    </svg>
                  </button>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Mobile Card View */}
        <MobileCardView
          loading={loading}
          records={currentApplications}
          emptyMessage={{
            title: 'No applications found',
            description: 'Click "New Application" to add your first application',
          }}
          loadingMessage='Loading applications...'
          headerGradient='from-indigo-50 via-purple-50 to-pink-50'
          avatarGradient='from-indigo-500 to-purple-500'
          emptyIconGradient='from-indigo-100 to-purple-100'
          emptyIconColor='text-indigo-400'
          cardConfig={{
            header: {
              avatar: (record) => record.name?.charAt(0) || 'A',
              title: (record) => record.name,
              subtitle: (record) => record.mobile,
              subtitleIcon: (
                <svg className='w-3 h-3 mr-1' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z' />
                </svg>
              ),
            },
            body: {
              showStatus: false,
              showPayment: false,
              showValidity: false,
              customFields: [
                {
                  render: (record) => (
                    <div className='flex items-center justify-between pb-2 border-b border-gray-100'>
                      <div>
                        <p className='text-[10px] text-gray-500 font-semibold uppercase'>License Class</p>
                        <span className='inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200 mt-1'>
                          <svg className='w-3 h-3 mr-1' fill='currentColor' viewBox='0 0 20 20'>
                            <path d='M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z' />
                            <path d='M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z' />
                          </svg>
                          {record.type}
                        </span>
                      </div>
                      <div className='text-right'>
                        <p className='text-[10px] text-gray-500 font-semibold uppercase'>LL Number</p>
                        <div className='text-xs font-mono font-semibold text-gray-900 bg-gray-100 px-2 py-1 rounded-lg border border-gray-200 mt-1'>
                          {record.fullData?.learningLicenseNumber || '-'}
                        </div>
                      </div>
                    </div>
                  ),
                },
                {
                  render: (record) => (
                    <div className='flex items-center justify-between'>
                      <span className='text-xs text-gray-500 font-semibold uppercase'>Payment Status</span>
                      {record.balanceAmount === 0 ? (
                        <span className='inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200'>
                          <svg className='w-3 h-3 mr-1' fill='currentColor' viewBox='0 0 20 20'>
                            <path fillRule='evenodd' d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z' clipRule='evenodd' />
                          </svg>
                          Paid
                        </span>
                      ) : (
                        <span className='inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200'>
                          <svg className='w-3 h-3 mr-1' fill='currentColor' viewBox='0 0 20 20'>
                            <path fillRule='evenodd' d='M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z' clipRule='evenodd' />
                          </svg>
                          Pending
                        </span>
                      )}
                    </div>
                  ),
                },
                {
                  render: (record) => (
                    <div className='grid grid-cols-3 gap-2 pt-2 border-t border-gray-100'>
                      <div>
                        <p className='text-[10px] text-gray-500 font-semibold uppercase'>Total Amount</p>
                        <p className='text-sm font-bold text-gray-800'>₹{record.totalAmount.toLocaleString('en-IN')}</p>
                      </div>
                      <div>
                        <p className='text-[10px] text-gray-500 font-semibold uppercase'>Paid</p>
                        <p className='text-sm font-bold text-emerald-600'>₹{record.paidAmount.toLocaleString('en-IN')}</p>
                      </div>
                      <div>
                        <p className='text-[10px] text-gray-500 font-semibold uppercase'>Balance</p>
                        <p className={`text-sm font-bold ${record.balanceAmount > 0 ? 'text-orange-600' : 'text-gray-500'}`}>
                          ₹{record.balanceAmount.toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>
                  ),
                },
                {
                  render: (record) => (
                    <div className='grid grid-cols-2 gap-2 pt-2 border-t border-gray-100'>
                      <div>
                        <p className='text-[10px] text-gray-500 font-semibold uppercase flex items-center gap-1'>
                          <svg className='w-3 h-3 text-green-500' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' />
                          </svg>
                          LL Issue Date
                        </p>
                        <p className='text-xs font-semibold text-gray-700'>
                          {(() => {
                            const llIssueDate = record.fullData?.learningLicenseIssueDate;
                            if (!llIssueDate) return '-';
                            try {
                              const d = new Date(llIssueDate);
                              const day = String(d.getDate()).padStart(2, '0');
                              const month = String(d.getMonth() + 1).padStart(2, '0');
                              const year = d.getFullYear();
                              return `${day}-${month}-${year}`;
                            } catch (e) {
                              return '-';
                            }
                          })()}
                        </p>
                      </div>
                      <div>
                        <p className='text-[10px] text-gray-500 font-semibold uppercase flex items-center gap-1'>
                          <svg className='w-3 h-3 text-red-500' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' />
                          </svg>
                          LL Expiry Date
                        </p>
                        <p className='text-xs font-semibold text-gray-700'>
                          {(() => {
                            const llExpiryDate = record.fullData?.learningLicenseExpiryDate;
                            if (!llExpiryDate) return '-';
                            try {
                              const d = new Date(llExpiryDate);
                              const day = String(d.getDate()).padStart(2, '0');
                              const month = String(d.getMonth() + 1).padStart(2, '0');
                              const year = d.getFullYear();
                              return `${day}-${month}-${year}`;
                            } catch (e) {
                              return '-';
                            }
                          })()}
                        </p>
                      </div>
                    </div>
                  ),
                },
              ],
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
              title: 'Mark as Paid',
              condition: (app) => (app.balanceAmount || 0) > 0,
              onClick: handleMarkAsPaid,
              bgColor: 'bg-green-100',
              textColor: 'text-green-600',
              hoverBgColor: 'bg-green-200',
              icon: (
                <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' />
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
              onClick: handleDelete,
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
                <th className='px-4 py-4 text-left text-xs font-bold text-white uppercase tracking-wide'>Applicant Details</th>
                <th className='px-4 py-4 text-center text-xs font-bold text-white uppercase tracking-wide'>License Class</th>
                <th className='px-2 py-4 text-center text-xs font-bold text-white uppercase tracking-wide'>Learning Licence No.</th>
                <th className='px-0.5 2xl:px-1 py-4 text-center text-xs font-bold text-white uppercase tracking-wide pl-8 2xl:pl-12'>LL Issue Date</th>
                <th className='px-0.5 2xl:px-1 py-4 text-center text-xs font-bold text-white uppercase tracking-wide'>LL Expiry Date</th>
                <th className='px-4 py-4 text-right text-xs font-bold text-white uppercase tracking-wide bg-white/10 pl-6 2xl:pl-8'>Total Amount</th>
                <th className='px-4 py-4 text-right text-xs font-bold text-white uppercase tracking-wide bg-white/10'>Paid</th>
                <th className='px-4 py-4 text-right text-xs font-bold text-white uppercase tracking-wide bg-white/10'>Balance</th>
                <th className='px-4 py-4 text-center text-xs font-bold text-white uppercase tracking-wide'>Actions</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-200'>
              {loading ? (
                <tr>
                  <td colSpan='9' className='px-4 py-8 text-center'>
                    <div className='text-gray-400'>
                      <svg className='animate-spin mx-auto h-8 w-8 mb-3 text-indigo-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z' />
                      </svg>
                      <p className='text-sm font-semibold text-gray-600'>Loading applications...</p>
                    </div>
                  </td>
                </tr>
              ) : currentApplications.length > 0 ? (
                currentApplications.map((app, index) => (
                  <tr key={app.id} className='hover:bg-gradient-to-r hover:from-blue-50/50 hover:via-indigo-50/50 hover:to-purple-50/50 transition-all duration-200 group'>
                    <td className='px-4 py-4'>
                      <div className='flex items-center gap-3'>
                        <div className='flex-shrink-0 h-10 w-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md'>
                          {app.name?.charAt(0) || 'A'}
                        </div>
                        <div>
                          <div className='text-sm font-bold text-gray-900'>{app.name}</div>
                          <div className='text-xs text-gray-500 flex items-center mt-1'>
                            <svg className='w-3 h-3 mr-1' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z' />
                            </svg>
                            {app.mobile}
                          </div>
                        </div>
                      </div>
                    </td>
                    {/* License Class */}
                    <td className='px-4 py-4'>
                      <div className='flex items-center justify-center'>
                        <span className='inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold border bg-blue-100 text-blue-800 border-blue-200'>
                          <svg className='w-3 h-3 mr-1.5' fill='currentColor' viewBox='0 0 20 20'>
                            <path d='M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z' />
                            <path d='M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z' />
                          </svg>
                          {app.type}
                        </span>
                      </div>
                    </td>
                    {/* Learning Licence Number */}
                    <td className='px-2 py-4'>
                      <div className='text-[11px] 2xl:text-sm font-mono font-semibold text-gray-900 text-center'>
                        {app.fullData?.learningLicenseNumber || '-'}
                      </div>
                    </td>

                    {/* LL Issue Date */}
                    <td className='px-0.5 2xl:px-1 py-3 2xl:py-5 pl-8 2xl:pl-12'>
                      <div className='flex items-center justify-center text-[11px] 2xl:text-[13.8px]'>
                        {(() => {
                          const llIssueDate = app.fullData?.learningLicenseIssueDate;
                          if (!llIssueDate) {
                            return <span className='text-gray-900 font-semibold'>-</span>;
                          }
                          try {
                            const d = new Date(llIssueDate);
                            const day = String(d.getDate()).padStart(2, '0');
                            const month = String(d.getMonth() + 1).padStart(2, '0');
                            const year = d.getFullYear();
                            const formattedDate = `${day}-${month}-${year}`;
                            return (
                              <span className='inline-flex items-center px-2 py-1 2xl:px-3 2xl:py-1.5 rounded-lg bg-green-100 text-green-700 font-semibold border border-green-200 whitespace-nowrap'>
                                <svg
                                  className='w-3 h-3 2xl:w-4 2xl:h-4 mr-1 2xl:mr-2'
                                  fill='none'
                                  stroke='currentColor'
                                  viewBox='0 0 24 24'
                                >
                                  <path
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    strokeWidth={2}
                                    d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
                                  />
                                </svg>
                                {formattedDate}
                              </span>
                            );
                          } catch (e) {
                            return <span className='text-gray-900 font-semibold'>-</span>;
                          }
                        })()}
                      </div>
                    </td>

                    {/* LL Expiry Date */}
                    <td className='px-0.5 2xl:px-1 py-3 2xl:py-5'>
                      <div className='flex items-center justify-center text-[11px] 2xl:text-[13.8px]'>
                        {(() => {
                          const llExpiryDate = app.fullData?.learningLicenseExpiryDate;
                          if (!llExpiryDate) {
                            return <span className='text-gray-900 font-semibold'>-</span>;
                          }
                          try {
                            const d = new Date(llExpiryDate);
                            const day = String(d.getDate()).padStart(2, '0');
                            const month = String(d.getMonth() + 1).padStart(2, '0');
                            const year = d.getFullYear();
                            const formattedDate = `${day}-${month}-${year}`;
                            return (
                              <span className='inline-flex items-center px-2 py-1 2xl:px-3 2xl:py-1.5 rounded-lg bg-red-100 text-red-700 font-semibold border border-red-200 whitespace-nowrap'>
                                <svg
                                  className='w-3 h-3 2xl:w-4 2xl:h-4 mr-1 2xl:mr-2'
                                  fill='none'
                                  stroke='currentColor'
                                  viewBox='0 0 24 24'
                                >
                                  <path
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    strokeWidth={2}
                                    d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
                                  />
                                </svg>
                                {formattedDate}
                              </span>
                            );
                          } catch (e) {
                            return <span className='text-gray-900 font-semibold'>-</span>;
                          }
                        })()}
                      </div>
                    </td>

                    {/* Total Amount */}
                    <td className='px-4 py-4 bg-gray-50/50 group-hover:bg-purple-50/30 pl-6 2xl:pl-8'>
                      <div className='text-right'>
                        <div className='text-[11px] 2xl:text-sm font-bold text-gray-900'>₹{app.totalAmount.toLocaleString('en-IN')}</div>
                        <div className='text-[10px] 2xl:text-xs text-gray-500 mt-0.5'>Total Amount</div>
                      </div>
                    </td>

                    {/* Paid */}
                    <td className='px-4 py-4 bg-gray-50/50 group-hover:bg-emerald-50/30'>
                      <div className='text-right'>
                        <div className='text-[11px] 2xl:text-sm font-bold text-emerald-600'>₹{app.paidAmount.toLocaleString('en-IN')}</div>
                        <div className='text-[10px] 2xl:text-xs text-emerald-600 mt-0.5'>Paid Amount</div>
                      </div>
                    </td>

                    {/* Balance */}
                    <td className={`px-4 py-4 bg-gray-50/50 ${app.balanceAmount > 0 ? 'group-hover:bg-amber-50/30' : 'group-hover:bg-gray-50'}`}>
                      <div className='text-right'>
                        <div className={`text-[11px] 2xl:text-sm font-bold ${app.balanceAmount > 0 ? 'text-orange-600' : 'text-gray-500'}`}>
                          ₹{app.balanceAmount.toLocaleString('en-IN')}
                        </div>
                        <div className={`text-[10px] 2xl:text-xs mt-0.5 ${app.balanceAmount > 0 ? 'text-orange-600' : 'text-gray-500'}`}>
                          {app.balanceAmount > 0 ? 'Pending' : 'Cleared'}
                        </div>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className='px-4 py-4'>
                      <div className='flex items-center justify-center gap-2'>
                        {/* Mark as Paid Button */}
                        {(app.balanceAmount || 0) > 0 && (
                          <button
                            onClick={() => handleMarkAsPaid(app)}
                            className='p-2 text-green-600 hover:bg-green-100 rounded-lg transition-all group-hover:scale-110 duration-200'
                            title='Mark as Paid'
                          >
                            <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' />
                            </svg>
                          </button>
                        )}
                        <button
                          onClick={() => handleViewDetails(app)}
                          className='p-2 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-all group-hover:scale-110 duration-200'
                          title='View Details'
                        >
                          <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 12a3 3 0 11-6 0 3 3 0 016 0z' />
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleEdit(app)}
                          className='p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-all group-hover:scale-110 duration-200'
                          title='Edit Application'
                        >
                          <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(app)}
                          className='p-2 text-red-600 hover:bg-red-100 rounded-lg transition-all group-hover:scale-110 duration-200'
                          title='Delete Application'
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
                  <td colSpan='9' className='px-4 py-8 text-center'>
                    <div className='text-gray-400'>
                      <svg className='mx-auto h-8 w-8 mb-3' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
                      </svg>
                      <p className='text-sm font-semibold text-gray-600'>No applications found</p>
                      <p className='text-xs text-gray-500 mt-1'>Click "New Application" to add your first application</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && currentApplications.length > 0 && (
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
            totalRecords={pagination.totalRecords}
            itemsPerPage={pagination.limit}
          />
        )}
        </div>
        </div>
      </div>
    </>
  )
}

export default DrivingLicence
