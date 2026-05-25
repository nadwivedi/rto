import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import Pagination from "../../components/Pagination";
import IssueTemporaryPermitModal from "./components/IssueTemporaryPermitModal";
import EditTemporaryPermitModal from "./components/EditTemporaryPermitModal";
import AddButton from "../../components/AddButton";
import SearchBar from "../../components/SearchBar";
import StatisticsCard from "../../components/StatisticsCard";
import MobileCardView from "../../components/MobileCardView";
import { getTheme, getVehicleNumberDesign } from "../../context/ThemeContext";

const API_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

import { getStatusColor, getStatusText } from "../../utils/statusUtils";
import { getVehicleNumberParts } from "../../utils/vehicleNoCheck";

const TemporaryPermit = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = getTheme();
  const vehicleDesign = getVehicleNumberDesign();
  const [permits, setPermits] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPermit, setSelectedPermit] = useState(null);
  const [showIssuePermitModal, setShowIssuePermitModal] = useState(false);
  const [showEditPermitModal, setShowEditPermitModal] = useState(false);
  const [editingPermit, setEditingPermit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all"); // 'all', 'active', 'expiring_soon', 'expired', 'pending'
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalRecords: 0,
    limit: 20,
  });
  const [statistics, setStatistics] = useState({
    total: 0,
    active: 0,
    expiringSoon: 0,
    expired: 0,
    pendingPaymentCount: 0,
    pendingPaymentAmount: 0,
  });

  // Fetch temporary permit statistics from API
  const fetchStatistics = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/api/temporary-permits/statistics`,
        { withCredentials: true }
      );
      if (response.data.success) {
        setStatistics({
          total: response.data.data.permits.total,
          active: response.data.data.permits.active,
          expiringSoon: response.data.data.permits.expiringSoon,
          expired: response.data.data.permits.expired,
          pendingPaymentCount: response.data.data.pendingPaymentCount,
          pendingPaymentAmount: response.data.data.pendingPaymentAmount,
        });
      }
    } catch (error) {
      console.error("Error fetching temporary permit statistics:", error);
    }
  };

  // Fetch permits from backend on component mount and when filters change
  useEffect(() => {
    fetchPermits(1);
    fetchStatistics();
  }, [searchQuery, statusFilter]);

  useEffect(() => {
    if (!location.state?.openAddModal) return;

    setShowIssuePermitModal(true);
    navigate(location.pathname, { replace: true, state: {} });
  }, [location.pathname, location.state, navigate]);

  // Page change handler
  const handlePageChange = (newPage) => {
    fetchPermits(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const fetchPermits = async (page = pagination.currentPage) => {
    setLoading(true);
    setError(null);
    let url = `${API_URL}/api/temporary-permits`;
    const params = {
      page,
      limit: pagination.limit,
      search: searchQuery,
    };

    if (statusFilter !== "all") {
      // Convert underscore to hyphen for API endpoints if needed, e.g., 'expiring_soon' -> 'expiring-soon'
      const filterPath = statusFilter.replace("_", "-");
      url = `${API_URL}/api/temporary-permits/${filterPath}`;
    }

    try {
      const response = await axios.get(url, { params, withCredentials: true });

      // Transform backend data to match frontend structure
      const transformedPermits = response.data.data.map((permit) => ({
        id: permit._id,
        _id: permit._id, // Keep _id for operations
        permitNumber: permit.permitNumber,
        vehicleType: permit.vehicleType,
        vehicleTypeFull:
          permit.vehicleType === "CV"
            ? "Commercial Vehicle"
            : "Passenger Vehicle",
        validityPeriod: permit.validityPeriod,
        permitHolder: permit.permitHolder,
        vehicleNo: permit.vehicleNumber || "N/A",
        vehicleNumber: permit.vehicleNumber || "N/A",
        issueDate: permit.issueDate,
        validFrom: permit.validFrom,
        validTill: permit.validTo,
        status: permit.status,
        bill: permit.bill, // Include bill reference
        totalFee: permit.totalFee || 0,
        fees: permit.totalFee || 0,
        balance: permit.balance || 0,
        paid: permit.paid || 0,
        address: permit.address || "N/A",
        fatherName: permit.fatherName || "",
        email: permit.email || "",
        mobileNumber: permit.mobileNumber || "N/A",
        chassisNumber: permit.chassisNumber || "N/A",
        engineNumber: permit.engineNumber || "N/A",
        ladenWeight: permit.ladenWeight || "",
        unladenWeight: permit.unladenWeight || "",
        notes: permit.notes || "",
        route: permit.route || "N/A",
        isRenewed: permit.isRenewed || false, // IMPORTANT: Include isRenewed field
        whatsappMessageCount: permit.whatsappMessageCount || 0,
        lastWhatsappSentAt: permit.lastWhatsappSentAt || null,
      }));

      setPermits(transformedPermits);

      // Update pagination state
      if (response.data.pagination) {
        setPagination({
          currentPage: response.data.pagination.currentPage,
          totalPages: response.data.pagination.totalPages,
          totalRecords: response.data.pagination.totalRecords,
          limit: pagination.limit,
        });
      }
    } catch (error) {
      console.error("Error fetching temporary permits:", error);
      toast.error(
        "Failed to fetch temporary permits. Please check if the backend server is running.",
        {
          position: "top-right",
          autoClose: 3000,
        }
      );
    } finally {
      setLoading(false);
    }
  };

  // Helper to convert DD-MM-YYYY to Date object
  const parseDate = (dateStr) => {
    if (!dateStr) return null;

    // If it's already a valid date string (YYYY-MM-DD or ISO format)
    const standardDate = new Date(dateStr);
    if (!isNaN(standardDate.getTime())) {
      return standardDate;
    }

    // Try DD-MM-YYYY format
    const parts = dateStr.split(/[/-]/);
    if (parts.length === 3) {
      const [day, month, year] = parts;
      const parsedDate = new Date(year, month - 1, day);
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate;
      }
    }

    return null;
  };

  const handleEditClick = (permit) => {
    setEditingPermit(permit);
    setShowEditPermitModal(true);
  };

  const handleEditPermit = async (formData) => {
    try {
      // Prepare data to match backend model
      const permitData = {
        permitNumber: formData.permitNumber,
        permitHolder: formData.permitHolderName,
        vehicleNumber: formData.vehicleNumber,
        vehicleType: formData.vehicleType,
        validFrom: formData.validFrom,
        validTo: formData.validTo,
        fatherName: formData.fatherName || "",
        address: formData.address || "",
        mobileNumber: formData.mobileNumber || "",
        email: formData.email || "",
        chassisNumber: formData.chassisNumber || "",
        engineNumber: formData.engineNumber || "",
        ladenWeight: formData.ladenWeight ? Number(formData.ladenWeight) : 0,
        unladenWeight: formData.unladenWeight
          ? Number(formData.unladenWeight)
          : 0,
        totalFee: Number(formData.totalFee) || 1000,
        paid: Number(formData.paid) || 0,
        balance: Number(formData.balance) || 0,
      };

      // Make PUT request to backend to update the permit
      const response = await axios.put(
        `${API_URL}/api/temporary-permits/${editingPermit.id}`,
        permitData,
        { withCredentials: true }
      );
      // Show success message
      toast.success("Temporary Permit updated successfully!", {
        position: "top-right",
        autoClose: 3000,
      });

      // Close modal and refresh
      setShowEditPermitModal(false);
      setEditingPermit(null);
      await fetchPermits();
      await fetchStatistics();
    } catch (error) {
      console.error("Error updating temporary permit:", error);

      // Handle detailed error response from backend
      if (error.response?.data) {
        const errorData = error.response.data;

        // Show main error message
        const mainMessage =
          errorData.errorCount > 1
            ? `${errorData.message} (${errorData.errorCount} errors)`
            : errorData.message || "Failed to update temporary permit";

        toast.error(mainMessage, { position: "top-right", autoClose: 5000 });

        // Show each detailed error if available
        if (errorData.errors && Array.isArray(errorData.errors)) {
          errorData.errors.forEach((err, index) => {
            setTimeout(() => {
              toast.error(`• ${err}`, {
                position: "top-right",
                autoClose: 4000,
              });
            }, (index + 1) * 150);
          });
        }
      } else {
        // Network or other errors
        toast.error(`Failed to update temporary permit: ${error.message}`, {
          position: "top-right",
          autoClose: 5000,
        });
      }
    }
  };

  const handleDeletePermit = async (permit) => {
    // Show confirmation dialog
    const confirmDelete = window.confirm(
      `Are you sure you want to delete this temporary permit?\n\n` +
        `Permit Number: ${permit.permitNumber}\n` +
        `Vehicle Number: ${permit.vehicleNo}\n` +
        `Permit Holder: ${permit.permitHolder}\n\n` +
        `This action cannot be undone.`
    );

    if (!confirmDelete) {
      return;
    }

    try {
      // Make DELETE request to backend
      const response = await axios.delete(
        `${API_URL}/api/temporary-permits/${permit.id}`,
        { withCredentials: true }
      );

      if (!response.data.success) {
        throw new Error(
          response.data.message || "Failed to delete temporary permit"
        );
      }

      // Show success message
      toast.success("Temporary Permit deleted successfully!", {
        position: "top-right",
        autoClose: 3000,
      });

      // Refresh the permits list
      await fetchPermits();
    } catch (error) {
      console.error("Error deleting temporary permit:", error);
      toast.error(`Failed to delete temporary permit: ${error.message}`, {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  // Mark temporary permit as paid
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
      const response = await axios.patch(`${API_URL}/api/temporary-permits/${permit.id}/mark-as-paid`, {}, { withCredentials: true });

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
      });
      return;
    }

    // Format mobile number (remove spaces, dashes, etc.)
    let phoneNumber = permit.mobileNumber.replace(/\D/g, '');

    // Add +91 country code if not already present
    if (!phoneNumber.startsWith('91')) {
      phoneNumber = '91' + phoneNumber;
    }

    // Create custom message
    let message = `Hello ${permit.permitHolder || ''},\n\n`;

    if ((permit.balance || 0) > 0) {
      message += `Your payment of ₹${(permit.balance || 0).toLocaleString('en-IN')} is pending for Temporary Permit.\n`;
      message += `Permit Number: ${permit.permitNumber}\n`;
      message += `Vehicle Number: ${permit.vehicleNo}\n\n`;
    }

    if (permit.status === 'expiring_soon' || permit.status === 'expired') {
      const statusText = permit.status === 'expired' ? 'has expired' : 'is going to expire';
      message += `Your temporary permit ${statusText} on ${permit.validTill}.\n`;
      message += `Permit Number: ${permit.permitNumber}\n`;
      message += `Vehicle Number: ${permit.vehicleNo}\n`;
      message += `Please renew your permit at the earliest.\n\n`;
    }

    message += `Thank you for your cooperation.`;

    // Increment WhatsApp message count in backend
    try {
      const response = await axios.patch(
        `${API_URL}/api/temporary-permits/${permit.id}/whatsapp-increment`,
        {},
        { withCredentials: true }
      );

      // Update local state immediately to show the tracking strip
      if (response.data.success) {
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

  // Determine if WhatsApp button should be shown
  const shouldShowWhatsAppButton = (permit) => {
    return (permit.status === 'expiring_soon' || permit.status === 'expired' || (permit.balance || 0) > 0);
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
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const handleIssuePermit = async (formData) => {
    try {
      // Prepare data to match backend model
      const permitData = {
        permitNumber: formData.permitNumber,
        permitHolder: formData.permitHolderName,
        vehicleNumber: formData.vehicleNumber,
        vehicleType: formData.vehicleType,
        validFrom: formData.validFrom,
        validTo: formData.validTo,
        issueDate: formData.validFrom,
        fatherName: formData.fatherName || "",
        address: formData.address || "",
        mobileNumber: formData.mobileNumber || "",
        email: formData.email || "",
        chassisNumber: formData.chassisNumber || "",
        engineNumber: formData.engineNumber || "",
        ladenWeight: formData.ladenWeight
          ? Number(formData.ladenWeight)
          : undefined,
        unladenWeight: formData.unladenWeight
          ? Number(formData.unladenWeight)
          : undefined,
        totalFee: Number(formData.totalFee) || 0,
        paid: Number(formData.paid) || 0,
        balance: Number(formData.balance) || 0,
        notes: formData.notes || "",
        temporaryPermitDocument: formData.temporaryPermitDocument || "",
      };

      // Make POST request to backend
      const response = await axios.post(
        `${API_URL}/api/temporary-permits`,
        permitData,
        { withCredentials: true }
      );

      // Show success message
      toast.success("Temporary Permit added successfully!", {
        position: "top-right",
        autoClose: 3000,
      });

      // Refresh the permits list and statistics
      await fetchPermits();
      await fetchStatistics();

      // Close the modal
      setShowIssuePermitModal(false);
    } catch (error) {
      console.error("Error creating temporary permit:", error);

      // Handle detailed error response from backend
      if (error.response?.data) {
        const errorData = error.response.data;

        // Show main error message
        const mainMessage =
          errorData.errorCount > 1
            ? `${errorData.message} (${errorData.errorCount} errors)`
            : errorData.message || "Failed to create temporary permit";

        toast.error(mainMessage, { position: "top-right", autoClose: 5000 });

        // Show each detailed error if available
        if (errorData.errors && Array.isArray(errorData.errors)) {
          errorData.errors.forEach((err, index) => {
            setTimeout(() => {
              toast.error(`• ${err}`, {
                position: "top-right",
                autoClose: 4000,
              });
            }, (index + 1) * 150);
          });
        }
      } else {
        // Network or other errors
        toast.error(`Failed to create temporary permit: ${error.message}`, {
          position: "top-right",
          autoClose: 5000,
        });
      }
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
        <div className="w-full px-3 md:px-4 lg:px-6 pt-4 lg:pt-6 pb-8">
          {/* Statistics Cards */}
          <div className="mb-2 mt-3">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-3 mb-5">
              <StatisticsCard
                title="Total Temporary Permits"
                value={statistics.total}
                color="blue"
                isActive={statusFilter === "all"}
                onClick={() => setStatusFilter("all")}
                icon={
                  <svg
                    className="w-4 h-4 lg:w-6 lg:h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                }
              />
              <StatisticsCard
                title="Expiring Soon"
                value={statistics.expiringSoon}
                subtext="within 15days"
                color="orange"
                isActive={statusFilter === "expiring_soon"}
                onClick={() =>
                  setStatusFilter(
                    statusFilter === "expiring_soon" ? "all" : "expiring_soon"
                  )
                }
                icon={
                  <svg
                    className="w-4 h-4 lg:w-6 lg:h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                }
              />
              <StatisticsCard
                title="Expired"
                value={statistics.expired}
                subtext="expired permit"
                color="red"
                isActive={statusFilter === "expired"}
                onClick={() =>
                  setStatusFilter(
                    statusFilter === "expired" ? "all" : "expired"
                  )
                }
                icon={
                  <svg
                    className="w-4 h-4 lg:w-6 lg:h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                }
              />
              <StatisticsCard
                title="Pending Payment"
                value={statistics.pendingPaymentCount}
                extraValue={`₹${statistics.pendingPaymentAmount.toLocaleString(
                  "en-IN"
                )}`}
                color="yellow"
                isActive={statusFilter === "pending"}
                onClick={() =>
                  setStatusFilter(
                    statusFilter === "pending" ? "all" : "pending"
                  )
                }
                icon={
                  <svg
                    className="w-4 h-4 lg:w-6 lg:h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                }
              />
            </div>
          </div>

          {/* Permits Table */}
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
            {/* Search and Filters Header */}
            <div className="px-6 py-5 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border-b border-gray-200">
              <div className="flex flex-col lg:flex-row gap-2 items-stretch lg:items-center">
                {/* Search Bar */}
                <SearchBar
                  value={searchQuery}
                  onChange={(value) => setSearchQuery(value)}
                  placeholder="Search by vehicle number..."
                  toUpperCase={true}
                />

                {/* New Permit Button */}
                <AddButton
                  onClick={() => setShowIssuePermitModal(true)}

                  title="New Temporary Permit"
                />
              </div>
            </div>

            {/* Mobile Card View */}
            <MobileCardView
              loading={loading}
              records={permits}
              emptyMessage={{
                title: 'No Temporary Permits Found',
                description: 'Get started by adding your first temporary permit.',
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
                  onClick: handleEditClick,
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
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead className={theme.tableHeader}>
                  <tr>
                    <th className="px-4 2xl:px-6 py-3 2xl:py-4 text-left text-[10px] 2xl:text-xs font-bold text-white uppercase tracking-wider">
                      Vehicle/Permit No.
                    </th>
                    <th className="px-4 2xl:px-6 py-3 2xl:py-4 text-left text-[10px] 2xl:text-xs font-bold text-white uppercase tracking-wider">
                      Permit Holder
                    </th>
                    <th className="px-0.5 2xl:px-1 py-3 2xl:py-4 text-left text-[10px] 2xl:text-xs font-bold text-white uppercase tracking-wider pl-8 2xl:pl-12">
                      Valid From
                    </th>
                    <th className="px-0.5 2xl:px-1 py-3 2xl:py-4 text-left text-[10px] 2xl:text-xs font-bold text-white uppercase tracking-wider">
                      Valid To
                    </th>
                    <th className="px-4 2xl:px-6 py-3 2xl:py-4 text-right text-[10px] 2xl:text-xs font-bold text-white uppercase tracking-wider bg-white/10 pl-12 2xl:pl-16">
                      Total Fee
                    </th>
                    <th className="px-4 2xl:px-6 py-3 2xl:py-4 text-right text-[10px] 2xl:text-xs font-bold text-white uppercase tracking-wider bg-white/10">
                      Paid
                    </th>
                    <th className="px-4 2xl:px-6 py-3 2xl:py-4 text-right text-[10px] 2xl:text-xs font-bold text-white uppercase tracking-wider bg-white/10">
                      Balance
                    </th>
                    <th className="px-4 2xl:px-6 py-3 2xl:py-4 text-left text-[10px] 2xl:text-xs font-bold text-white uppercase tracking-wider pl-20 2xl:pl-32">
                      Status
                    </th>
                    <th className="px-4 2xl:px-6 py-3 2xl:py-4 text-center text-[10px] 2xl:text-xs font-bold text-white uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr>
                      <td colSpan="9" className="px-6 py-16">
                        <div className="flex flex-col justify-center items-center">
                          <div className="relative">
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl animate-pulse shadow-lg"></div>
                            <div className="absolute inset-0 w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-2xl animate-spin"></div>
                          </div>
                          <p className="text-gray-600 mt-6">
                            Loading temporary permits...
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : permits.length > 0 ? (
                    permits.map((permit) => (
                      <tr
                        key={permit.id}
                        className="hover:bg-gradient-to-r hover:from-blue-50 hover:via-indigo-50 hover:to-purple-50 transition-all duration-300 group"
                      >
                        <td className="px-4 2xl:px-6 py-3 2xl:py-5">
                          <div className="flex flex-col gap-1 2xl:gap-1.5">
                            <div>
                              {(() => {
                                const parts = getVehicleNumberParts(
                                  permit.vehicleNo
                                );
                                if (!parts) {
                                  return (
                                    <div className="flex items-center gap-1 2xl:gap-1.5">
                                      <svg
                                        className="w-3.5 h-3.5 2xl:w-4 2xl:h-4 text-blue-600 flex-shrink-0"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                      >
                                        <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                                        <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z" />
                                      </svg>
                                      <span className="text-[13px] 2xl:text-[15px] font-semibold text-gray-900">
                                        {permit.vehicleNo}
                                      </span>
                                    </div>
                                  );
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
                            <div className="flex items-center gap-1 2xl:gap-1.5">
                              <svg
                                className="w-3 h-3 2xl:w-3.5 2xl:h-3.5 text-indigo-600 flex-shrink-0"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                              </svg>
                              <span className="text-[11px] 2xl:text-[13px] font-medium text-gray-600">
                                {permit.permitNumber}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 2xl:px-6 py-3 2xl:py-5">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8 2xl:h-10 2xl:w-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold shadow-md text-xs 2xl:text-sm">
                              {permit.permitHolder?.charAt(0) || "P"}
                            </div>
                            <div className="ml-2 2xl:ml-4">
                              <div className="text-[11px] 2xl:text-sm font-bold text-gray-900">
                                {permit.permitHolder}
                              </div>
                              <div className="text-[10px] 2xl:text-xs text-gray-500 flex items-center mt-0.5 2xl:mt-1">
                                <svg
                                  className="w-2.5 h-2.5 2xl:w-3 2xl:h-3 mr-0.5 2xl:mr-1"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                                  />
                                </svg>
                                {permit.mobileNumber || "N/A"}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-0.5 2xl:px-1 py-3 2xl:py-5 pl-8 2xl:pl-12">
                          <div className="flex items-center text-[11px] 2xl:text-[13.8px]">
                            <span className="inline-flex items-center px-2 py-1 2xl:px-3 2xl:py-1.5 rounded-lg bg-green-100 text-green-700 font-semibold border border-green-200">
                              <svg
                                className="w-3 h-3 2xl:w-4 2xl:h-4 mr-1 2xl:mr-2"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                              </svg>
                              {permit.validFrom}
                            </span>
                          </div>
                        </td>
                        <td className="px-0.5 2xl:px-1 py-3 2xl:py-5">
                          <div className="flex items-center text-[11px] 2xl:text-[13.8px]">
                            <span className="inline-flex items-center px-2 py-1 2xl:px-3 2xl:py-1.5 rounded-lg bg-red-100 text-red-700 font-semibold border border-red-200">
                              <svg
                                className="w-3 h-3 2xl:w-4 2xl:h-4 mr-1 2xl:mr-2"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                              </svg>
                              {permit.validTill}
                            </span>
                          </div>
                        </td>
                        {/* Total Fee */}
                        <td className="px-4 py-4 bg-gray-50/50 group-hover:bg-purple-50/30 pl-12 2xl:pl-16">
                          <div className="text-right">
                            <div className="text-[11px] 2xl:text-sm font-bold text-gray-900">₹{(permit.totalFee || 0).toLocaleString("en-IN")}</div>
                            <div className="text-[10px] 2xl:text-xs text-gray-500 mt-0.5">Total Amount</div>
                          </div>
                        </td>

                        {/* Paid */}
                        <td className="px-4 py-4 bg-gray-50/50 group-hover:bg-emerald-50/30">
                          <div className="text-right">
                            <div className="text-[11px] 2xl:text-sm font-bold text-emerald-600">₹{(permit.paid || 0).toLocaleString("en-IN")}</div>
                            <div className="text-[10px] 2xl:text-xs text-emerald-600 mt-0.5">Paid Amount</div>
                          </div>
                        </td>

                        {/* Balance */}
                        <td className={`px-4 py-4 bg-gray-50/50 ${(permit.balance || 0) > 0 ? 'group-hover:bg-amber-50/30' : 'group-hover:bg-gray-50'}`}>
                          <div className="text-right">
                            <div className={`text-[11px] 2xl:text-sm font-bold ${(permit.balance || 0) > 0 ? 'text-orange-600' : 'text-gray-500'}`}>
                              ₹{(permit.balance || 0).toLocaleString("en-IN")}
                            </div>
                            <div className={`text-[10px] 2xl:text-xs mt-0.5 ${(permit.balance || 0) > 0 ? 'text-orange-600' : 'text-gray-500'}`}>
                              {(permit.balance || 0) > 0 ? 'Pending' : 'Cleared'}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 2xl:px-6 py-3 2xl:py-5 pl-20 2xl:pl-32">
                          <span
                            className={`inline-flex items-center px-2 py-1 2xl:px-3 2xl:py-1.5 rounded-full text-[10px] 2xl:text-xs font-bold whitespace-nowrap ${getStatusColor(
                              permit.status
                            )}`}
                          >
                            {getStatusText(permit.status)}
                          </span>
                        </td>
                        <td className="px-4 2xl:px-6 py-3 2xl:py-5">
                          <div className="flex items-center justify-end gap-0.5 2xl:gap-1">
                            <button
                              onClick={() => handleEditClick(permit)}
                              className="p-1.5 2xl:p-2 text-amber-600 hover:bg-amber-100 rounded-lg transition-all group-hover:scale-110 duration-200"
                              title="Edit Permit"
                            >
                              <svg
                                className="w-4 h-4 2xl:w-5 2xl:h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDeletePermit(permit)}
                              className="p-1.5 2xl:p-2 text-red-600 hover:bg-red-100 rounded-lg transition-all group-hover:scale-110 duration-200"
                              title="Delete Permit"
                            >
                              <svg
                                className="w-4 h-4 2xl:w-5 2xl:h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="9" className="px-6 py-16">
                        <div className="flex flex-col items-center justify-center">
                          <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mb-6 shadow-lg">
                            <svg
                              className="w-12 h-12 text-indigo-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                              />
                            </svg>
                          </div>
                          <h3 className="text-xl font-black text-gray-700 mb-2">
                            No Temporary Permits Found
                          </h3>
                          <p className="text-sm text-gray-500 mb-6 max-w-md text-center">
                            {searchQuery
                              ? "No permits match your search criteria. Try adjusting your search terms."
                              : "Get started by adding your first temporary permit."}
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {permits.length > 0 && (
              <Pagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                onPageChange={handlePageChange}
                totalRecords={pagination.totalRecords}
                itemsPerPage={pagination.limit}
              />
            )}
          </div>

          {/* Add New Temporary Permit Modal - Lazy Loaded */}
          {showIssuePermitModal && (
                          <IssueTemporaryPermitModal
                isOpen={showIssuePermitModal}
                onClose={() => setShowIssuePermitModal(false)}
                onSubmit={handleIssuePermit}
              />
          )}

          {/* Edit Temporary Permit Modal - Lazy Loaded */}
          {showEditPermitModal && (
                          <EditTemporaryPermitModal
                isOpen={showEditPermitModal}
                onClose={() => {
                  setShowEditPermitModal(false);
                  setEditingPermit(null); // Clear editing data when closing
                }}
                onSubmit={handleEditPermit}
                permitData={editingPermit} // Pass permit data for editing
              />
          )}
        </div>
      </div>
    </>
  );
};

export default TemporaryPermit;
