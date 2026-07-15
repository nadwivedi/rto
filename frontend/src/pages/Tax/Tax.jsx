import { useState, useMemo, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";
import AddButton from "../../components/AddButton";
import AddTaxModal from "./components/AddTaxModal";
import EditTaxModal from "./components/EditTaxModal";
import DocumentPreviewModal from "../../components/DocumentPreviewModal";
import Pagination from "../../components/Pagination";
import SearchBar from "../../components/SearchBar";
import StatisticsCard from "../../components/StatisticsCard";
import MobileCardView from "../../components/MobileCardView";
import { getTheme, getVehicleNumberDesign } from "../../context/ThemeContext";

const API_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

import { getStatusColor, getStatusText } from "../../utils/statusUtils";
import { getVehicleNumberParts } from "../../utils/vehicleNoCheck";

const Tax = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = getTheme();
  const vehicleDesign = getVehicleNumberDesign();
  const [taxRecords, setTaxRecords] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTax, setSelectedTax] = useState(null);
  const [loading, setLoading] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all"); // 'all', 'active', 'expiring', 'expired'
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalRecords: 0,
    limit: 20,
  });
  const [statistics, setStatistics] = useState({
    total: 0,
    active: 0,
    expiring: 0,
    expired: 0,
    pendingPaymentCount: 0,
    pendingPaymentAmount: 0,
  });

  useEffect(() => {
    if (!location.state?.openAddModal) return;

    setIsAddModalOpen(true);
    navigate(location.pathname, { replace: true, state: {} });
  }, [location.pathname, location.state, navigate]);

  // Fetch tax statistics from API
  const fetchStatistics = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/tax/statistics`, { withCredentials: true });
      console.log(response);

      if (response.data.success) {
        setStatistics({
          total: response.data.data.total,
          active: response.data.data.active,
          expiring: response.data.data.expiringSoon,
          expired: response.data.data.expired,
          pendingPaymentCount: response.data.data.pendingPaymentCount,
          pendingPaymentAmount: response.data.data.pendingPaymentAmount,
        });
      }
    } catch (error) {
      console.error("Error fetching statistics:", error);
    }
  };

  const handleExportExcel = async () => {
    try {
      const params = {
        ...(statusFilter !== "all" ? { status: statusFilter } : {}),
        ...(searchQuery ? { search: searchQuery } : {}),
      };

      const response = await axios.get(`${API_URL}/api/tax/export`, {
        params,
        withCredentials: true,
      });

      if (!response.data.success) {
        toast.error("Failed to export tax data", { position: "top-right", autoClose: 3000 });
        return;
      }

      const data = response.data.data;

      if (!data || data.length === 0) {
        toast.info("No tax records to export", { position: "top-right", autoClose: 3000 });
        return;
      }

      const mappedData = data.map((item) => ({
        "Receipt No": item.receiptNo,
        "Vehicle Number": item.vehicleNumber,
        "Owner Name": item.ownerName,
        "Mobile Number": item.mobileNumber,
        "Date": item.date,
        "Tax From": item.taxFrom,
        "Tax To": item.taxTo,
        "Total Amount": item.totalAmount || 0,
        "Paid Amount": item.paidAmount || 0,
        "Balance Amount": item.balanceAmount || 0,
        "Tax Amount": item.taxAmount || 0,
        "Status": item.status,
      }));

      const worksheet = XLSX.utils.json_to_sheet(mappedData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Tax");
      XLSX.writeFile(workbook, `Tax_${new Date().toISOString().split("T")[0]}.xlsx`);

      toast.success(`Exported ${data.length} tax records`, { position: "top-right", autoClose: 3000 });
    } catch (error) {
      console.error("Error exporting tax:", error);
      toast.error("Failed to export tax data", { position: "top-right", autoClose: 3000 });
    }
  };

  // Fetch tax records from API
  const fetchTaxRecords = async (page = 1) => {
    setLoading(true);
    let url = `${API_URL}/api/tax`;
    const params = {
      page,
      limit: pagination.limit,
      search: searchQuery,
    };

    if (statusFilter !== "all") {
      if (statusFilter === "expiring_soon") {
        url = `${API_URL}/api/tax/expiring-soon`;
      } else if (statusFilter === "expired") {
        url = `${API_URL}/api/tax/expired`;
      } else if (statusFilter === "pending") {
        url = `${API_URL}/api/tax/pending-payment`;
      }
    }

    try {
      const response = await axios.get(url, { params, withCredentials: true });

      if (response.data.success) {
        const transformedRecords = response.data.data.map((record) => ({
          id: record._id,
          _id: record._id, // Keep _id for operations
          receiptNo: record.receiptNo,
          vehicleNumber: record.vehicleNumber,
          ownerName: record.ownerName,
          mobileNumber: record.mobileNumber,
          date: record.date,
          totalAmount: record.totalAmount || 0,
          paidAmount: record.paidAmount || 0,
          balanceAmount: record.balanceAmount || 0,
          taxAmount: record.taxAmount,
          taxFrom: record.taxFrom,
          taxTo: record.taxTo,
          status: record.status,
          isRenewed: record.isRenewed || false, // IMPORTANT: Include isRenewed field
          roadTaxDocument: record.roadTaxDocument,
          whatsappMessageCount: record.whatsappMessageCount || 0, // WhatsApp message count
          lastWhatsappSentAt: record.lastWhatsappSentAt, // Last WhatsApp sent time
        }));
        setTaxRecords(transformedRecords);

        if (response.data.pagination) {
          setPagination({
            currentPage: response.data.pagination.currentPage,
            totalPages: response.data.pagination.totalPages,
            totalRecords: response.data.pagination.totalRecords,
            limit: pagination.limit,
          });
        }
      }
    } catch (error) {
      console.error("Error fetching tax records:", error);
      toast.error(
        "Failed to fetch tax records. Please check if the backend server is running.",
        {
          position: "top-right",
          autoClose: 3000,
        }
      );
    } finally {
      setLoading(false);
    }
  };

  // Load tax records and statistics on component mount and when filters change
  useEffect(() => {
    fetchTaxRecords(1); // Reset to page 1 when filters change
    fetchStatistics(); // Fetch fresh statistics
  }, [searchQuery, statusFilter]);

  // Page change handler
  const handlePageChange = (newPage) => {
    fetchTaxRecords(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Helper function to parse date string (DD-MM-YYYY or DD/MM/YYYY)
  const parseDateString = (dateStr) => {
    if (!dateStr) return new Date(0);
    const parts = dateStr.split(/[/-]/);
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      return new Date(year, month, day);
    }
    return new Date(0);
  };

  const handleAddTax = async () => {
    // Modal handles API call internally, just refresh data
    await fetchTaxRecords();
    await fetchStatistics();
  };

  const handleEditTax = async (formData) => {
    setLoading(true);
    try {
      const response = await axios.put(`${API_URL}/api/tax/${selectedTax.id}`, {
        date: formData.date,
        receiptNo: formData.receiptNo,
        vehicleNumber: formData.vehicleNumber,
        ownerName: formData.ownerName,
        mobileNumber: formData.mobileNumber,
        totalAmount: parseFloat(formData.totalAmount),
        paidAmount: parseFloat(formData.paidAmount),
        balanceAmount: parseFloat(formData.balance),
        taxAmount: formData.taxAmount ? parseFloat(formData.taxAmount) : undefined,
        taxFrom: formData.taxFrom,
        taxTo: formData.taxTo,
        roadTaxDocument: formData.roadTaxDocument,
      }, { withCredentials: true });

      if (response.data.success) {
        toast.success("Tax record updated successfully!", {
          position: "top-right",
          autoClose: 3000,
        });
        // Refresh the list and statistics from the server
        await fetchTaxRecords();
        await fetchStatistics();
      } else {
        toast.error(`Error: ${response.data.message}`, {
          position: "top-right",
          autoClose: 3000,
        });
      }
    } catch (error) {
      console.error("Error updating tax record:", error);
      toast.error(error.response?.data?.message || "Failed to update tax record.", {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (record) => {
    setSelectedTax(record);
    setIsEditModalOpen(true);
  };

  const handlePreviewDoc = (record) => { setPreviewDoc(record.roadTaxDocument) }

  // Helper function to open WhatsApp with custom message
  const handleWhatsAppClick = async (record) => {
    if (!record.mobileNumber || record.mobileNumber === 'N/A') {
      toast.error('Mobile number not available for this record', {
        position: 'top-right',
        autoClose: 3000
      });
      return;
    }

    try {
      // Increment WhatsApp message count in backend
      const response = await axios.patch(
        `${API_URL}/api/tax/${record.id}/whatsapp-increment`,
        {},
        { withCredentials: true }
      );

      if (response.data.success) {
        // Update the local state with new count and last sent time
        setTaxRecords(prevRecords =>
          prevRecords.map(r =>
            r.id === record.id
              ? {
                  ...r,
                  whatsappMessageCount: response.data.data.whatsappMessageCount,
                  lastWhatsappSentAt: response.data.data.lastWhatsappSentAt
                }
              : r
          )
        );
      }
    } catch (error) {
      console.error('Error incrementing WhatsApp count:', error);
      // Continue with WhatsApp even if count update fails
    }

    // Format mobile number (remove spaces, dashes, etc.)
    let phoneNumber = record.mobileNumber.replace(/\D/g, '');

    // Add +91 country code if not already present
    if (!phoneNumber.startsWith('91')) {
      phoneNumber = '91' + phoneNumber;
    }

    // Create custom message
    let message = `Hello ${record.ownerName || ''},\n\n`;

    if ((record.balanceAmount || 0) > 0) {
      message += `Your payment of ₹${(record.balanceAmount || 0).toLocaleString('en-IN')} is pending for Tax.\n`;
      message += `Vehicle Number: ${record.vehicleNumber}\n`;
      message += `Receipt No: ${record.receiptNo}\n\n`;
    }

    if (record.status === 'expiring_soon' || record.status === 'expired') {
      const statusText = record.status === 'expired' ? 'has expired' : 'is going to expire';
      message += `Your tax ${statusText} on ${record.taxTo}.\n`;
      message += `Vehicle Number: ${record.vehicleNumber}\n`;
      message += `Please renew your tax at the earliest.\n\n`;
    }

    message += `Thank you for your cooperation.`;

    // Open WhatsApp directly (not web)
    const whatsappURL = `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`;
    window.location.href = whatsappURL;
  };

  // Determine if WhatsApp button should be shown
  const shouldShowWhatsAppButton = (record) => {
    return (record.status === 'expiring_soon' || record.status === 'expired' || (record.balanceAmount || 0) > 0);
  };

  const handleDeleteTax = async (id) => {
    if (!window.confirm("Are you sure you want to delete this tax record?")) {
      return;
    }

    try {
      const response = await axios.delete(`${API_URL}/api/tax/${id}`, { withCredentials: true });

      if (response.data.success) {
        toast.success("Tax record deleted successfully!", {
          position: "top-right",
          autoClose: 3000,
        });
        await fetchTaxRecords();
        await fetchStatistics();
      } else {
        toast.error(response.data.message || "Failed to delete tax record", {
          position: "top-right",
          autoClose: 3000,
        });
      }
    } catch (error) {
      toast.error("Error deleting tax record. Please try again.", {
        position: "top-right",
        autoClose: 3000,
      });
      console.error("Error:", error);
    }
  };

  // Mark tax as paid
  const handleMarkAsPaid = async (record) => {
    const confirmPaid = window.confirm(
      `Are you sure you want to mark this payment as PAID?\n\n` +
      `Receipt No: ${record.receiptNo}\n` +
      `Vehicle Number: ${record.vehicleNumber}\n` +
      `Total Amount: ₹${(record.totalAmount || 0).toLocaleString('en-IN')}\n` +
      `Current Balance: ₹${(record.balanceAmount || 0).toLocaleString('en-IN')}\n\n` +
      `This will set Paid = ₹${(record.totalAmount || 0).toLocaleString('en-IN')} and Balance = ₹0`
    );

    if (!confirmPaid) return;

    try {
      const response = await axios.patch(`${API_URL}/api/tax/${record.id}/mark-as-paid`, {}, { withCredentials: true });
      if (!response.data.success) throw new Error(response.data.message || 'Failed to mark payment as paid');

      toast.success('Payment marked as paid successfully!', { position: 'top-right', autoClose: 3000 });
      await fetchTaxRecords();
      await fetchStatistics();
    } catch (error) {
      console.error('Error marking payment as paid:', error);
      toast.error(`Failed to mark payment as paid: ${error.message}`, { position: 'top-right', autoClose: 3000 });
    }
  };

  // Statistics are now fetched from backend, removed useMemo calculation

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
        <div className="w-full px-3 md:px-4 lg:px-6 pt-4 lg:pt-6 pb-8">
          {/* Statistics Cards */}
          <div className="mb-2 mt-3">
            <div className="flex items-center gap-3 mb-5">
              <button
                onClick={() => navigate('/')}
                className='flex items-center justify-center w-10 h-10 rounded-xl bg-white border border-gray-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer flex-shrink-0'
                title='Back to Home'
              >
                <svg className='w-5 h-5 text-gray-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M10 19l-7-7m0 0l7-7m-7 7h18' />
                </svg>
              </button>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-3 flex-1">
              <StatisticsCard
                title="Total Tax Records"
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
                title="Tax Expiring Soon"
                value={statistics.expiring}
                subtext="Within 15 days"
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
                title="Tax Expired"
                value={statistics.expired}
                subtext="expired tax"
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
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                }
              />
            </div>
          </div>
          </div>

          {/* Tax Table */}
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-5 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border-b border-gray-200">
              <div className="flex flex-col lg:flex-row gap-2 items-stretch lg:items-center">
                {/* Search Bar */}
                <SearchBar
                  value={searchQuery}
                  onChange={(value) => setSearchQuery(value)}
                  placeholder="Search by vehicle number or name..."
                  toUpperCase={false}
                />

                {/* Add Button */}
                <AddButton
                  onClick={() => setIsAddModalOpen(true)}

                  title="Add New Road Tax Record"
                />

                {/* Export Excel Button */}
                <button
                  onClick={handleExportExcel}
                  className='flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:shadow-lg font-bold text-xs transition-all hover:scale-105 cursor-pointer'
                >
                  <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4' />
                  </svg>
                  Export Excel
                </button>
              </div>

              {/* Results count and filter status */}
              <div className="mt-3 text-xs text-gray-600 font-semibold flex items-center gap-2">
                {statusFilter !== "all" && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-[10px]">
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                      />
                    </svg>
                    {statusFilter === "expiring_soon" && "Expiring Soon Only"}
                    {statusFilter === "expired" && "Expired Only"}
                    {statusFilter === "pending" && "Pending Payment Only"}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setStatusFilter("all");
                      }}
                      className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
                    >
                      <svg
                        className="w-3 h-3"
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
                    </button>
                  </span>
                )}
              </div>
            </div>

            {/* Loading Indicator */}
            {loading && (
              <div className="p-8 text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-600 font-semibold">
                  Loading tax records...
                </p>
              </div>
            )}

            {/* Mobile Card View */}
            <MobileCardView
              records={taxRecords}
              emptyMessage={{
                title: 'No tax records found',
                description: 'Click "Add New" to add your first record',
              }}
              loadingMessage='Loading tax records...'
              headerGradient='from-indigo-50 via-purple-50 to-pink-50'
              avatarGradient='from-indigo-500 to-purple-500'
              cardConfig={{
                header: {
                  avatar: null,
                  title: (record) => record.vehicleNumber,
                  subtitle: (record) => record.ownerName || '-',
                  extraInfo: (record) => (
                    record.mobileNumber && (
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
                      render: (record, { getStatusColor, getStatusText }) => (
                        <div className='flex items-center justify-between gap-2 pb-2.5 border-b border-gray-100'>
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap ${getStatusColor(record.status)}`}>
                            {getStatusText(record.status)}
                          </span>
                          <div className='flex items-center gap-1.5'>
                            <svg className='w-3.5 h-3.5 text-indigo-600 flex-shrink-0' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' />
                            </svg>
                            <span className='text-xs font-medium text-gray-700'>{record.receiptNo}</span>
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
                  title: 'View Document', condition: (record) => !!record.roadTaxDocument, onClick: (record) => handlePreviewDoc(record),
                  bgColor: 'bg-sky-100', textColor: 'text-sky-600', hoverBgColor: 'bg-sky-200',
                  icon: <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 12a3 3 0 11-6 0 3 3 0 016 0z' /><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' /></svg>,
                },
                {
                  title: 'Edit',
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
                  title: 'Delete',
                  onClick: (record) => handleDeleteTax(record.id),
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
                    <th className="px-4 2xl:px-6 py-3 2xl:py-4 text-left text-[10px] 2xl:text-xs font-bold text-white uppercase tracking-wide">
                      Date
                    </th>
                    <th className="px-4 2xl:px-6 py-3 2xl:py-4 text-left text-[10px] 2xl:text-xs font-bold text-white uppercase tracking-wide">
                      Vehicle / Owner
                    </th>
                    <th className="px-0.5 2xl:px-1 py-3 2xl:py-4 text-left text-[10px] 2xl:text-xs font-bold text-white uppercase tracking-wide pl-8 2xl:pl-12">
                      Tax From
                    </th>
                    <th className="px-0.5 2xl:px-1 py-3 2xl:py-4 text-left text-[10px] 2xl:text-xs font-bold text-white uppercase tracking-wide">
                      Tax To
                    </th>
                    <th className="px-4 2xl:px-6 py-3 2xl:py-4 text-right text-[10px] 2xl:text-xs font-bold text-white uppercase tracking-wide">
                      Tax Amt
                    </th>
                    <th className="px-4 2xl:px-6 py-3 2xl:py-4 text-right text-[10px] 2xl:text-xs font-bold text-white uppercase tracking-wide bg-white/10 pl-12 2xl:pl-16">
                      Total Fee
                    </th>
                    <th className="px-4 2xl:px-6 py-3 2xl:py-4 text-right text-[10px] 2xl:text-xs font-bold text-white uppercase tracking-wide bg-white/10">
                      Paid
                    </th>
                    <th className="px-4 2xl:px-6 py-3 2xl:py-4 text-right text-[10px] 2xl:text-xs font-bold text-white uppercase tracking-wide bg-white/10">
                      Balance
                    </th>
                    <th className="px-4 2xl:px-6 py-3 2xl:py-4 text-left text-[10px] 2xl:text-xs font-bold text-white uppercase tracking-wide pl-20 2xl:pl-32">
                      Status
                    </th>
                    <th className="px-4 2xl:px-6 py-3 2xl:py-4 text-center text-[10px] 2xl:text-xs font-bold text-white uppercase tracking-wide">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {taxRecords.length > 0 ? (
                    taxRecords.map((record) => (
                      <tr
                        key={record.id}
                        className="hover:bg-gradient-to-r hover:from-indigo-50/50 hover:via-purple-50/50 hover:to-pink-50/50 transition-all duration-200 group"
                      >
                        {/* Date */}
                        <td className="px-4 2xl:px-6 py-3 2xl:py-4">
                          <div className="flex items-center gap-1 text-[11px] 2xl:text-sm font-semibold text-gray-800 whitespace-nowrap">
                            <svg className='w-[14px] h-[14px] 2xl:w-4 2xl:h-4 text-gray-800' fill='none' stroke='currentColor' viewBox='0 0 24 24' strokeWidth={1.5}>
                              <path strokeLinecap='round' strokeLinejoin='round' d='M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5' />
                            </svg>
                            {record.date || '-'}
                          </div>
                        </td>

                        {/* Vehicle / Owner / Mobile */}
                        <td className="px-4 2xl:px-6 py-3 2xl:py-4">
                          <div>
                            <div className="flex items-center gap-2 2xl:gap-3">
                              {(() => {
                                const parts = getVehicleNumberParts(
                                  record.vehicleNumber
                                );
                                if (!parts) {
                                  return (
                                    <div className="text-[11px] 2xl:text-sm font-inter font-bold text-gray-900">
                                      {record.vehicleNumber}
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
                            {record.ownerName && (
                              <div className="flex items-center mt-0.5 text-[10px] 2xl:text-xs text-gray-600">
                                <svg className="w-3 h-3 2xl:w-3.5 2xl:h-3.5 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1.5} d='M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z' />
                                </svg>
                                {record.ownerName}
                              </div>
                            )}
                            {record.mobileNumber && (
                              <div className="flex items-center mt-0.5 text-[10px] 2xl:text-xs text-gray-500">
                                <svg className="w-3 h-3 2xl:w-3.5 2xl:h-3.5 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                                {record.mobileNumber}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Tax From */}
                        <td className="px-0.5 2xl:px-1 py-3 2xl:py-5 pl-8 2xl:pl-12">
                          <div className="flex items-center text-[11px] 2xl:text-[13.8px]">
                            <span className="inline-flex items-center px-2 py-1 2xl:px-3 2xl:py-1.5 rounded-lg bg-green-100 text-green-700 font-semibold border border-green-200 whitespace-nowrap">
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
                              {record.taxFrom}
                            </span>
                          </div>
                        </td>

                        {/* Tax To */}
                        <td className="px-0.5 2xl:px-1 py-3 2xl:py-5">
                          <div className="flex items-center text-[11px] 2xl:text-[13.8px]">
                            <span className="inline-flex items-center px-2 py-1 2xl:px-3 2xl:py-1.5 rounded-lg bg-red-100 text-red-700 font-semibold border border-red-200 whitespace-nowrap">
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
                              {record.taxTo}
                            </span>
                          </div>
                        </td>

                        {/* Tax Amount */}
                        <td className="px-4 2xl:px-6 py-3 2xl:py-4">
                          {record.taxAmount && record.taxAmount > 0 ? (
                            <div className="text-right">
                              <div className="text-[11px] 2xl:text-sm font-bold text-purple-600">
                                ₹{record.taxAmount.toLocaleString("en-IN")}
                              </div>
                              <div className="text-[10px] 2xl:text-xs text-purple-600 mt-0.5">Tax Amt</div>
                            </div>
                          ) : (
                            <div className="text-right">
                              <div className="text-[11px] 2xl:text-sm font-medium text-gray-400">
                                -
                              </div>
                            </div>
                          )}
                        </td>

                        {/* Total Fee */}
                        <td className="px-4 py-4 bg-gray-50/50 group-hover:bg-purple-50/30 pl-12 2xl:pl-16">
                          <div className="text-right">
                            <div className="text-[11px] 2xl:text-sm font-bold text-gray-900">₹{(record.totalAmount || 0).toLocaleString("en-IN")}</div>
                            <div className="text-[10px] 2xl:text-xs text-gray-500 mt-0.5">Total Fee</div>
                          </div>
                        </td>

                        {/* Paid Amount */}
                        <td className="px-4 py-4 bg-gray-50/50 group-hover:bg-emerald-50/30">
                          <div className="text-right">
                            <div className="text-[11px] 2xl:text-sm font-bold text-emerald-600">₹{(record.paidAmount || 0).toLocaleString("en-IN")}</div>
                            <div className="text-[10px] 2xl:text-xs text-emerald-600 mt-0.5">Paid Amount</div>
                          </div>
                        </td>

                        {/* Balance Amount */}
                        <td className={`px-4 py-4 bg-gray-50/50 ${record.balanceAmount > 0 ? 'group-hover:bg-amber-50/30' : 'group-hover:bg-gray-50'}`}>
                          <div className="text-right">
                            <div className={`text-[11px] 2xl:text-sm font-bold ${record.balanceAmount > 0 ? 'text-orange-600' : 'text-gray-500'}`}>
                              ₹{record.balanceAmount.toLocaleString("en-IN")}
                            </div>
                            <div className={`text-[10px] 2xl:text-xs mt-0.5 ${record.balanceAmount > 0 ? 'text-orange-600' : 'text-gray-500'}`}>
                              {record.balanceAmount > 0 ? 'Pending' : 'Cleared'}
                            </div>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-4 2xl:px-6 py-3 2xl:py-4 pl-20 2xl:pl-32">
                          <span
                            className={`inline-flex items-center px-2 py-1 2xl:px-3 2xl:py-1.5 rounded-full text-[10px] 2xl:text-xs font-bold ${getStatusColor(
                              record.status
                            )}`}
                          >
                            {getStatusText(record.status)}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-4 2xl:px-6 py-3 2xl:py-4">
                          <div className="flex items-center justify-end gap-0.5 2xl:gap-0.5 pr-1">
                            {/* Preview Document Button */}
                            {record.roadTaxDocument && (
                              <button
                                onClick={() => handlePreviewDoc(record)}
                                className="p-1.5 2xl:p-2 text-sky-600 hover:bg-sky-100 rounded-lg transition-all group-hover:scale-110 duration-200"
                                title="View Document"
                              >
                                <svg className='w-4 h-4 2xl:w-5 2xl:h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 14l-7 7m0 0l-7-7m7 7V3' /></svg>
                              </button>
                            )}
                            {/* Edit Button */}
                            <button
                              onClick={() => handleEditClick(record)}

                              className="p-1.5 2xl:p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-all group-hover:scale-110 duration-200"
                              title="Edit Record"
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
                            {/* Delete Button */}
                            <button
                              onClick={() => handleDeleteTax(record.id)}
                              className="p-1.5 2xl:p-2 text-red-600 hover:bg-red-100 rounded-lg transition-all group-hover:scale-110 duration-200"
                              title="Delete Record"
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
                      <td colSpan="10" className="px-4 py-8 text-center">
                        <div className="text-gray-400">
                          <svg
                            className="mx-auto h-8 w-8 mb-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <p className="text-sm font-semibold text-gray-600">
                            No tax records found
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Click &quot;Add New Road Tax Record&quot; to add your
                            first record
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {!loading && taxRecords.length > 0 && (
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

      {/* Add Tax Modal - Lazy Loaded */}
      {isAddModalOpen && (
                  <AddTaxModal
            isOpen={isAddModalOpen}
            onClose={() => setIsAddModalOpen(false)}
            onSubmit={handleAddTax}
          />
      )}

      {/* Edit Tax Modal - Lazy Loaded */}
      {isEditModalOpen && (
                  <EditTaxModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            onSubmit={handleEditTax}
            tax={selectedTax}
          />
      )}
      {previewDoc && <DocumentPreviewModal isOpen={!!previewDoc} onClose={() => setPreviewDoc(null)} docField={previewDoc} title='Road Tax Document' />}
    </>
  );
};

export default Tax;
