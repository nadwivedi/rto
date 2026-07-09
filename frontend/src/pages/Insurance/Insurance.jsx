import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";
import Pagination from "../../components/Pagination";
import AddInsuranceModal from "./components/AddInsuranceModal";
import InsuranceDetailModal from "./components/InsuranceDetailModal";
import AddButton from "../../components/AddButton";
import SearchBar from "../../components/SearchBar";
import StatisticsCard from "../../components/StatisticsCard";
import MobileCardView from "../../components/MobileCardView";
import { getTheme, getVehicleNumberDesign } from "../../context/ThemeContext";

const API_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

import { getStatusColor, getStatusText } from "../../utils/statusUtils";
import { getVehicleNumberParts } from "../../utils/vehicleNoCheck";

const Insurance = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = getTheme();
  const vehicleDesign = getVehicleNumberDesign();
  const [insurances, setInsurances] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedInsurance, setSelectedInsurance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [companyFilter, setCompanyFilter] = useState("");
  const [companies, setCompanies] = useState([]);
  const [productFilter, setProductFilter] = useState("");
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalRecords: 0,
    limit: 20,
  });
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    expiringSoon: 0,
    expired: 0,
    pendingPaymentCount: 0,
    pendingPaymentAmount: 0,
  });

  useEffect(() => {
    if (!location.state?.openAddModal) return;

    setIsAddModalOpen(true);
    navigate(location.pathname, { replace: true, state: {} });
  }, [location.pathname, location.state, navigate]);

  const fetchStatistics = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/insurance/statistics`, { withCredentials: true });
      if (response.data.success) {
        const { insurance, pendingPayments } = response.data.data;
        setStats({
          total: insurance.total,
          active: insurance.active,
          expiringSoon: insurance.expiringSoon,
          expired: insurance.expired,
          pendingPaymentCount: pendingPayments.count,
          pendingPaymentAmount: pendingPayments.amount,
        });
      }
    } catch (error) {
      console.error("Error fetching statistics:", error);
    }
  };

  const fetchCompanies = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/insurance/companies`, { withCredentials: true });
      if (res.data.success) setCompanies(res.data.data);
    } catch (e) {
      console.error('Error fetching companies:', e);
    }
  };

  const handleExportExcel = async () => {
    try {
      const params = {
        ...(statusFilter !== "all" ? { status: statusFilter } : {}),
        ...(companyFilter ? { company: companyFilter } : {}),
        ...(productFilter ? { product: productFilter } : {}),
        ...(debouncedSearchQuery ? { search: debouncedSearchQuery } : {}),
      };

      const response = await axios.get(`${API_URL}/api/insurance/export`, {
        params,
        withCredentials: true,
      });

      if (!response.data.success) {
        toast.error("Failed to export insurance data", { position: "top-right", autoClose: 3000 });
        return;
      }

      const data = response.data.data;

      if (!data || data.length === 0) {
        toast.info("No insurance records to export", { position: "top-right", autoClose: 3000 });
        return;
      }

      const mappedData = data.map((item) => ({
        "Policy Number": item.policyNumber,
        "Insurance Company": item.insuranceCompany,
        "Product Type": item.productType,
        "Policy Holder": item.policyHolderName,
        "Vehicle Number": item.vehicleNumber,
        "Mobile Number": item.mobileNumber,
        "Valid From": item.validFrom,
        "Valid To": item.validTo,
        "Total Fee": item.totalFee || 0,
        "Paid": item.paid || 0,
        "Balance": item.balance || 0,
        "Status": item.status,
        "Commission": item.commission || 0,
        "Renew Premium": item.renewPremium || 0,
        "Remarks": item.remarks || "",
      }));

      const worksheet = XLSX.utils.json_to_sheet(mappedData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Insurance");
      XLSX.writeFile(workbook, `Insurance_${new Date().toISOString().split("T")[0]}.xlsx`);

      toast.success(`Exported ${data.length} insurance records`, { position: "top-right", autoClose: 3000 });
    } catch (error) {
      console.error("Error exporting insurance:", error);
      toast.error("Failed to export insurance data", { position: "top-right", autoClose: 3000 });
    }
  };

  // Fetch insurance records from API
  const fetchInsurances = async (page = pagination.currentPage) => {
    setLoading(true);
    try {
      let url = `${API_URL}/api/insurance`;
      const params = {
        page,
        limit: pagination.limit,
        search: debouncedSearchQuery,
        ...(companyFilter ? { company: companyFilter } : {}),
        ...(productFilter ? { product: productFilter } : {}),
      };

      if (statusFilter !== "all") {
        // Convert underscore to hyphen for API endpoints
        const filterPath = statusFilter.replace("_", "-");
        url = `${API_URL}/api/insurance/${filterPath}`;
      }

      const response = await axios.get(url, { params, withCredentials: true });

      if (response.data.success) {
        setInsurances(response.data.data);

        // Update pagination state
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
      console.error("Error fetching insurance records:", error);
      toast.error(
        "Failed to fetch insurance records. Please check if the backend server is running.",
        {
          position: "top-right",
          autoClose: 3000,
        }
      );
    } finally {
      setLoading(false);
    }
  };

  // Debounce search query to avoid losing focus on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load insurance records on component mount and when filters change
  useEffect(() => {
    if (debouncedSearchQuery.length === 0 || debouncedSearchQuery.length >= 4) {
      fetchInsurances(1);
      fetchStatistics();
    }
  }, [debouncedSearchQuery, statusFilter, companyFilter, productFilter]);

  const fetchProducts = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/insurance/products`, { withCredentials: true });
      if (res.data.success) setProducts(res.data.data);
    } catch (e) {
      console.error('Error fetching products:', e);
    }
  };

  useEffect(() => { fetchCompanies(); fetchProducts(); }, []);

  // Page change handler
  const handlePageChange = (newPage) => {
    fetchInsurances(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // No need for client-side filtering anymore - server handles it
  const filteredInsurances = insurances;

  const handleAddInsurance = async () => {
    // Modal handles API call internally, just refresh data
    await fetchInsurances();
    await fetchStatistics();
  };

  const handleEditClick = (insurance) => {
    setSelectedInsurance(insurance);
    setIsEditModalOpen(true);
  };

  const handleViewClick = (insurance) => {
    setSelectedInsurance(insurance);
    setIsDetailModalOpen(true);
  };

  const handleEditInsurance = async () => {
    // Modal handles API call internally, just refresh data
    await fetchInsurances();
    await fetchStatistics();
    setIsEditModalOpen(false);
    setSelectedInsurance(null);
  };

  const handleDeleteInsurance = async (insurance) => {
    // Show confirmation dialog
    const confirmDelete = window.confirm(
      `Are you sure you want to delete this insurance?\n\n` +
        `Vehicle Number: ${insurance.vehicleNumber}\n` +
        `Policy Number: ${insurance.policyNumber}\n\n` +
        `This action cannot be undone.`
    );

    if (!confirmDelete) {
      return;
    }

    try {
      const response = await axios.delete(
        `${API_URL}/api/insurance/${insurance._id}`,
        { withCredentials: true }
      );

      if (response.data.success) {
        toast.success("Insurance record deleted successfully!", {
          position: "top-right",
          autoClose: 3000,
        });
        await fetchInsurances();
      } else {
        toast.error(
          response.data.message || "Failed to delete insurance record",
          {
            position: "top-right",
            autoClose: 3000,
          }
        );
      }
    } catch (error) {
      toast.error("Error deleting insurance record. Please try again.", {
        position: "top-right",
        autoClose: 3000,
      });
      console.error("Error:", error);
    }
  };

  // Mark insurance as paid
  const handleMarkAsPaid = async (insurance) => {
    const confirmPaid = window.confirm(
      `Are you sure you want to mark this payment as PAID?\n\n` +
      `Vehicle Number: ${insurance.vehicleNumber}\n` +
      `Policy Number: ${insurance.policyNumber}\n` +
      `Total Fee: ₹${(insurance.totalFee || 0).toLocaleString('en-IN')}\n` +
      `Current Balance: ₹${(insurance.balance || 0).toLocaleString('en-IN')}\n\n` +
      `This will set Paid = ₹${(insurance.totalFee || 0).toLocaleString('en-IN')} and Balance = ₹0`
    );

    if (!confirmPaid) return;

    try {
      const response = await axios.patch(`${API_URL}/api/insurance/${insurance._id}/mark-as-paid`, {}, { withCredentials: true });
      if (!response.data.success) throw new Error(response.data.message || 'Failed to mark payment as paid');

      toast.success('Payment marked as paid successfully!', { position: 'top-right', autoClose: 3000 });
      await fetchInsurances();
    } catch (error) {
      console.error('Error marking payment as paid:', error);
      toast.error(`Failed to mark payment as paid: ${error.message}`, { position: 'top-right', autoClose: 3000 });
    }
  };


  // Helper function to open WhatsApp with custom message
  const handleWhatsAppClick = async (insurance) => {
    if (!insurance.mobileNumber || insurance.mobileNumber === 'N/A') {
      toast.error('Mobile number not available for this record', {
        position: 'top-right',
        autoClose: 3000
      });
      return;
    }

    try {
      // Increment WhatsApp message count in backend
      const response = await axios.patch(
        `${API_URL}/api/insurance/${insurance._id}/whatsapp-increment`,
        {},
        { withCredentials: true }
      );

      if (response.data.success) {
        // Update the local state with new count and last sent time
        setInsurances(prevInsurances =>
          prevInsurances.map(ins =>
            ins._id === insurance._id
              ? {
                  ...ins,
                  whatsappMessageCount: response.data.data.whatsappMessageCount,
                  lastWhatsappSentAt: response.data.data.lastWhatsappSentAt
                }
              : ins
          )
        );
      }
    } catch (error) {
      console.error('Error incrementing WhatsApp count:', error);
      // Continue with WhatsApp even if count update fails
    }

    // Format mobile number (remove spaces, dashes, etc.)
    let phoneNumber = insurance.mobileNumber.replace(/\D/g, '');

    // Add +91 country code if not already present
    if (!phoneNumber.startsWith('91')) {
      phoneNumber = '91' + phoneNumber;
    }

    // Create custom message
    let message = `Hello,\n\n`;

    if ((insurance.balance || 0) > 0) {
      message += `Your payment of ₹${(insurance.balance || 0).toLocaleString('en-IN')} is pending for Insurance.\n`;
      message += `Vehicle Number: ${insurance.vehicleNumber}\n`;
      message += `Policy Number: ${insurance.policyNumber}\n\n`;
    }

    if (insurance.status === 'expiring_soon' || insurance.status === 'expired') {
      const statusText = insurance.status === 'expired' ? 'has expired' : 'is going to expire';
      message += `Your insurance ${statusText} on ${insurance.validTo}.\n`;
      message += `Vehicle Number: ${insurance.vehicleNumber}\n`;
      message += `Policy Number: ${insurance.policyNumber}\n`;
      message += `Please renew your insurance at the earliest.\n\n`;
    }

    message += `Thank you for your cooperation.`;

    // Open WhatsApp directly (not web)
    const whatsappURL = `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`;
    window.location.href = whatsappURL;
  };

  // Determine if WhatsApp button should be shown
  const shouldShowWhatsAppButton = (insurance) => {
    return (insurance.status === 'expiring_soon' || insurance.status === 'expired' || (insurance.balance || 0) > 0);
  };

  // Handler to send insurance document via WhatsApp
  const handleSendDocumentWhatsApp = (insurance) => {
    if (!insurance.mobileNumber || insurance.mobileNumber === 'N/A') {
      toast.error('Mobile number not available for this record', {
        position: 'top-right',
        autoClose: 3000
      });
      return;
    }

    if (!insurance.insuranceDocument) {
      toast.error('No insurance document available to send', {
        position: 'top-right',
        autoClose: 3000
      });
      return;
    }

    // Format mobile number (remove spaces, dashes, etc.)
    let phoneNumber = insurance.mobileNumber.replace(/\D/g, '');

    // Add country code if not present (assuming India +91)
    if (!phoneNumber.startsWith('91') && phoneNumber.length === 10) {
      phoneNumber = '91' + phoneNumber;
    }

    // Create WhatsApp message with document link
    const documentURL = `${API_URL}${insurance.insuranceDocument}`;

    let message = `Hello,\n\n`;
    message += `Here is your Insurance Document for vehicle *${insurance.vehicleNumber}*\n\n`;
    message += `📋 *Policy Details:*\n`;
    message += `Policy Number: ${insurance.policyNumber}\n`;
    message += `Valid From: ${insurance.validFrom}\n`;
    message += `Valid To: ${insurance.validTo}\n\n`;
    message += `📄 *Document Link:*\n${documentURL}\n\n`;
    message += `Thank you!`;

    // Open WhatsApp directly (not web)
    const whatsappURL = `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`;
    window.location.href = whatsappURL;
  };

  // Determine if document WhatsApp button should be shown
  const shouldShowDocumentWhatsAppButton = (insurance) => {
    return insurance.insuranceDocument && insurance.insuranceDocument.trim() !== '';
  };

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
                title="Total Insurance Records"
                value={stats.total}
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
                value={stats.expiringSoon}
                subtext="Within 30 days"
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
                value={stats.expired}
                subtext="expired insurance"
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
                value={stats.pendingPaymentCount}
                extraValue={`₹${stats.pendingPaymentAmount.toLocaleString('en-IN')}`}
                color="amber"
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
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex flex-col justify-center items-center py-20">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl animate-pulse shadow-lg"></div>
                <div className="absolute inset-0 w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-2xl animate-spin"></div>
              </div>
              <div className="mt-6 text-center">
                <p className="text-xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-1">
                  Loading Insurance Records
                </p>
                <p className="text-sm text-gray-600">
                  Please wait while we fetch your data...
                </p>
              </div>
            </div>
          )}

          {!loading && (
            <>
              {/* Insurance Table */}
              <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
                {/* Search and Filters Header */}
                <div className="px-6 py-5 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border-b border-gray-200">
                  <div className="flex flex-col lg:flex-row gap-2 items-stretch lg:items-center">
                    {/* Search Bar */}
                    <SearchBar
                      value={searchQuery}
                      onChange={(value) => setSearchQuery(value)}
                      placeholder="Search by vehicle no, policy no, or owner..."
                      toUpperCase={true}
                    />

                    {/* New Insurance Button */}
                    <AddButton
                      onClick={() => setIsAddModalOpen(true)}
                      title="New Insurance Record"
                    />

                    {/* Insurance Company Filter */}
                    <select
                      value={companyFilter}
                      onChange={(e) => setCompanyFilter(e.target.value)}
                      className='px-3 py-2.5 border border-gray-300 rounded-xl bg-white text-xs font-semibold text-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer'
                    >
                      <option value=''>All Companies</option>
                      {companies.map((company) => (
                        <option key={company} value={company}>{company}</option>
                      ))}
                    </select>

                    {/* Product Type Filter */}
                    <select
                      value={productFilter}
                      onChange={(e) => setProductFilter(e.target.value)}
                      className='px-3 py-2.5 border border-gray-300 rounded-xl bg-white text-xs font-semibold text-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer'
                    >
                      <option value=''>All Products</option>
                      {products.map((product) => (
                        <option key={product} value={product}>{product}</option>
                      ))}
                    </select>

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

                    {/* Report Button */}
                    <button
                      onClick={() => navigate('/insurance/reports')}
                      className='flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl hover:shadow-lg font-bold text-xs transition-all hover:scale-105 cursor-pointer'
                    >
                      <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' />
                      </svg>
                      Report
                    </button>

                  </div>
                </div>

                {/* Mobile Card View */}
                <MobileCardView
                  records={filteredInsurances}
                  loading={loading}
                  searchQuery={searchQuery}
                  emptyMessage={{
                    title: 'No Insurance Records Found',
                    description: 'Get started by adding your first insurance record.',
                  }}
                  loadingMessage='Loading insurance records...'
                  headerGradient='from-indigo-50 via-purple-50 to-pink-50'
                  avatarGradient='from-indigo-500 to-purple-500'
                  emptyIconGradient='from-indigo-100 to-purple-100'
                  emptyIconColor='text-indigo-400'
                  cardConfig={{
                    header: {
                      avatar: null,
                      title: (record) => record.vehicleNumber,
                      subtitle: (record) => (
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
                      extraInfo: null,
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
                                <span className='text-xs font-medium text-gray-700'>{record.policyNumber}</span>
                              </div>
                            </div>
                          ),
                        },
                        {
                          render: (record) => record.productType ? (
                            <div className='flex items-center gap-2 pt-2'>
                              <span className='inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-100 text-indigo-700 border border-indigo-200'>
                                {record.productType}
                              </span>
                            </div>
                          ) : null,
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
                      title: 'Send Document',
                      condition: shouldShowDocumentWhatsAppButton,
                      onClick: handleSendDocumentWhatsApp,
                      bgColor: 'bg-blue-50',
                      textColor: 'text-blue-600',
                      hoverBgColor: 'bg-blue-100',
                      icon: (
                        <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 24 24'>
                          <path d='M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z'/>
                        </svg>
                      ),
                    },
                    {
                      title: 'Mark as Paid',
                      condition: (insurance) => (insurance.balance || 0) > 0,
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
                      title: 'Edit Insurance',
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
                      title: 'Delete Insurance',
                      onClick: handleDeleteInsurance,
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
                  pagination={{
                    currentPage: pagination.currentPage,
                    totalPages: pagination.totalPages,
                    onPageChange: handlePageChange,
                    totalRecords: pagination.totalRecords,
                    limit: pagination.limit,
                  }}
                />

                {/* Desktop Table View */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full">
                    <thead className={theme.tableHeader}>
                      <tr>
                        <th className="px-4 2xl:px-6 py-3 2xl:py-4 text-left text-[10px] 2xl:text-xs font-bold text-white uppercase tracking-wider">
                          Issue Date
                        </th>
                        <th className="px-4 2xl:px-6 py-3 2xl:py-4 text-left text-[10px] 2xl:text-xs font-bold text-white uppercase tracking-wider">
                          Client Info
                        </th>
                        <th className="px-4 2xl:px-6 py-3 2xl:py-4 text-left text-[10px] 2xl:text-xs font-bold text-white uppercase tracking-wider">
                          Insurance Company
                        </th>
                        <th className="px-4 2xl:px-6 py-3 2xl:py-4 text-left text-[10px] 2xl:text-xs font-bold text-white uppercase tracking-wider">
                          Validity
                        </th>
                        <th className="px-4 2xl:px-6 py-3 2xl:py-4 text-left text-[10px] 2xl:text-xs font-bold text-white uppercase tracking-wider">
                          Product
                        </th>
                        <th className="px-4 2xl:px-6 py-3 2xl:py-4 text-center text-[10px] 2xl:text-xs font-bold text-white uppercase tracking-wider bg-white/10">
                          Payment
                        </th>
                        <th className="px-4 2xl:px-6 py-3 2xl:py-4 text-center text-[10px] 2xl:text-xs font-bold text-white uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-4 2xl:px-6 py-3 2xl:py-4 text-center text-[10px] 2xl:text-xs font-bold text-white uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredInsurances.length > 0 ? (
                        filteredInsurances.map((insurance) => (
                          <tr
                            key={insurance.id}
                            className="hover:bg-gradient-to-r hover:from-blue-50 hover:via-indigo-50 hover:to-purple-50 transition-all duration-300 group"
                          >
                            {/* Issue Date */}
                            <td className="px-4 2xl:px-6 py-3 2xl:py-5 whitespace-nowrap">
                              {insurance.issueDate ? (
                                <span className="inline-flex items-center px-2 py-1 2xl:px-3 2xl:py-1.5 rounded-lg bg-blue-50 text-blue-700 font-semibold border border-blue-200 text-[11px] 2xl:text-[13.8px] whitespace-nowrap">
                                  <svg className="w-3 h-3 2xl:w-4 2xl:h-4 mr-1 2xl:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                  </svg>
                                  {insurance.issueDate}
                                </span>
                              ) : (
                                <span className="text-[11px] text-gray-400">—</span>
                              )}
                            </td>

                            {/* Client Info Column */}
                            <td className="px-4 2xl:px-6 py-3 2xl:py-5">
                              <div className='flex flex-col gap-1.5'>
                                <span className='text-[11px] 2xl:text-[13px] font-bold text-gray-900 truncate max-w-[200px] block'>
                                  {insurance.policyHolderName || 'N/A'}
                                </span>
                                {insurance.vehicleNumber && (
                                  <div className='flex items-center gap-2'>
                                    <svg className='w-4 h-4 text-gray-500 flex-shrink-0 mr-0.5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z' />
                                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 004 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0' />
                                    </svg>
                                    {(() => {
                                      const parts = getVehicleNumberParts(insurance.vehicleNumber);
                                      if (!parts) return <span className='text-[12px] 2xl:text-[14px] font-bold text-blue-900'>{insurance.vehicleNumber}</span>;
                                      return (
                                        <div className={vehicleDesign.container + " scale-90 -ml-2 origin-left"}>
                                          <span className={vehicleDesign.stateCode}>{parts.stateCode}</span>
                                          <span className={vehicleDesign.districtCode}>{parts.districtCode}</span>
                                          <span className={vehicleDesign.series}>{parts.series}</span>
                                          <span className={vehicleDesign.last4Digits}>{parts.last4Digits}</span>
                                        </div>
                                      );
                                    })()}
                                  </div>
                                )}
                                {insurance.mobileNumber && (
                                  <div className='flex items-center gap-1.5'>
                                    <svg className='w-3 h-3 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z' />
                                    </svg>
                                    <span className='text-[10px] 2xl:text-[12px] font-semibold text-gray-500'>{insurance.mobileNumber}</span>
                                  </div>
                                )}
                              </div>
                            </td>

                            {/* Insurance Company Column */}
                            <td className='px-4 2xl:px-6 py-3 2xl:py-5'>
                              <div className='flex items-center gap-1.5'>
                                <div className='bg-blue-100 p-1 rounded-md'>
                                  <svg className='w-3 h-3 text-blue-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' />
                                  </svg>
                                </div>
                                <span className='text-[10px] 2xl:text-[12px] font-medium text-gray-600 truncate max-w-[110px]'>
                                  {insurance.insuranceCompany || 'N/A'}
                                </span>
                              </div>
                            </td>

                            {/* Validity (Valid From green top / Valid To red bottom) */}
                            <td className="px-4 2xl:px-6 py-3 2xl:py-5 whitespace-nowrap">
                              <div className="flex flex-col text-[11px] 2xl:text-[13px]">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-t-lg bg-green-50 text-green-700 font-semibold border border-green-200 whitespace-nowrap">
                                  <svg className="w-3 h-3 2xl:w-3.5 2xl:h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                                  </svg>
                                  {insurance.validFrom}
                                </span>
                                <span className="inline-flex items-center px-2 py-0.5 rounded-b-lg bg-red-50 text-red-700 font-semibold border border-red-200 whitespace-nowrap -mt-px">
                                  <svg className="w-3 h-3 2xl:w-3.5 2xl:h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                  </svg>
                                  {insurance.validTo}
                                </span>
                              </div>
                            </td>
                            {/* Product Type */}
                            <td className="px-4 2xl:px-6 py-3 2xl:py-5">
                              <span className='inline-flex items-center px-2.5 py-1 rounded-full text-[10px] 2xl:text-xs font-bold bg-indigo-100 text-indigo-700 border border-indigo-200'>
                                {insurance.productType || 'N/A'}
                              </span>
                            </td>
                            {/* Payment (Total / Paid / Balance) */}
                            <td className="px-4 py-3 2xl:py-4 bg-gray-50/50 group-hover:bg-purple-50/30">
                              <div className="flex items-center justify-center gap-3 2xl:gap-4">
                                <div className="text-center min-w-[60px]">
                                  <div className="text-[11px] 2xl:text-sm font-bold text-gray-900">₹{(insurance.totalFee || 0).toLocaleString("en-IN")}</div>
                                  <div className="text-[9px] 2xl:text-[10px] text-gray-500">Total</div>
                                </div>
                                <div className="w-px h-8 bg-gray-200"></div>
                                <div className="text-center min-w-[60px]">
                                  <div className="text-[11px] 2xl:text-sm font-bold text-emerald-600">₹{(insurance.paid || 0).toLocaleString("en-IN")}</div>
                                  <div className="text-[9px] 2xl:text-[10px] text-emerald-600">Paid</div>
                                </div>
                                <div className="w-px h-8 bg-gray-200"></div>
                                <div className="text-center min-w-[60px]">
                                  <div className={`text-[11px] 2xl:text-sm font-bold ${(insurance.balance || 0) > 0 ? 'text-orange-600' : 'text-gray-500'}`}>
                                    ₹{(insurance.balance || 0).toLocaleString("en-IN")}
                                  </div>
                                  <div className={`text-[9px] 2xl:text-[10px] ${(insurance.balance || 0) > 0 ? 'text-orange-600' : 'text-gray-500'}`}>
                                    {(insurance.balance || 0) > 0 ? 'Due' : 'Cleared'}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 2xl:px-6 py-3 2xl:py-5">
                              <div className="flex items-center justify-center">
                                <span
                                  className={`px-2 py-1 2xl:px-3 2xl:py-1.5 rounded-full text-[10px] 2xl:text-xs font-bold ${getStatusColor(
                                    insurance.status
                                  )}`}
                                >
                                  {getStatusText(insurance.status)}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 2xl:px-6 py-3 2xl:py-5">
                              <div className="flex items-center justify-end gap-0.5 2xl:gap-0.5 pr-1">
                                {/* View Details Button — always visible */}
                                <button
                                  onClick={() => handleViewClick(insurance)}
                                  className="p-1.5 2xl:p-2 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-all group-hover:scale-110 duration-200"
                                  title="View Insurance Details"
                                >
                                  <svg className="w-4 h-4 2xl:w-5 2xl:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => handleEditClick(insurance)}
                                  className="p-1.5 2xl:p-2 text-amber-600 hover:bg-amber-100 rounded-lg transition-all group-hover:scale-110 duration-200"
                                  title="Edit Insurance"
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
                                  onClick={() =>
                                    handleDeleteInsurance(insurance)
                                  }
                                  className="p-1.5 2xl:p-2 text-red-600 hover:bg-red-100 rounded-lg transition-all group-hover:scale-110 duration-200"
                                  title="Delete Insurance"
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
                          <td colSpan="8" className="px-6 py-16">
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
                                No Insurance Records Found
                              </h3>
                              <p className="text-sm text-gray-500 mb-6 max-w-md text-center">
                                {searchQuery
                                  ? "No insurance records match your search criteria. Try adjusting your search terms."
                                  : "Get started by adding your first insurance record."}
                              </p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {!loading && filteredInsurances.length > 0 && (
                  <Pagination
                    currentPage={pagination.currentPage}
                    totalPages={pagination.totalPages}
                    onPageChange={handlePageChange}
                    totalRecords={pagination.totalRecords}
                    itemsPerPage={pagination.limit}
                  />
                )}
              </div>
            </>
          )}

          {/* Add Insurance Modal - Lazy Loaded */}
          {isAddModalOpen && (
                          <AddInsuranceModal
                isOpen={isAddModalOpen}
                onClose={() => {
                  setIsAddModalOpen(false);
                }}
                onSubmit={handleAddInsurance}
              />
          )}

          {/* Edit Insurance Modal - Lazy Loaded */}
          {isEditModalOpen && (
                          <AddInsuranceModal
                isOpen={isEditModalOpen}
                onClose={() => {
                  setIsEditModalOpen(false);
                  setSelectedInsurance(null); // Clear selected insurance when closing
                }}
                onSubmit={handleEditInsurance}
                initialData={selectedInsurance} // Pass selected insurance data for editing
                isEditMode={true}
              />
          )}

          {/* Insurance Detail Modal */}
          {isDetailModalOpen && (
            <InsuranceDetailModal
              isOpen={isDetailModalOpen}
              onClose={() => {
                setIsDetailModalOpen(false);
                setSelectedInsurance(null);
              }}
              insurance={selectedInsurance}
            />
          )}
        </div>
      </div>
    </>
  );
};

export default Insurance;

