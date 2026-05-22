import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import AddButton from "../../components/AddButton";
import AddHpaHptModal from "./components/AddHpaHptModal";
import EditHpaHptModal from "./components/EditHpaHptModal";
import HpaHptDetailModal from "./components/HpaHptDetailModal";
import Pagination from "../../components/Pagination";
import SearchBar from "../../components/SearchBar";
import StatisticsCard from "../../components/StatisticsCard";
import MobileCardView from "../../components/MobileCardView";
import { getTheme, getVehicleNumberDesign } from "../../context/ThemeContext";

const API_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

import { getVehicleNumberParts } from "../../utils/vehicleNoCheck";

const HpaHpt = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = getTheme();
  const vehicleDesign = getVehicleNumberDesign();
  const [hpaHptRecords, setHpaHptRecords] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [selectedDetailRecord, setSelectedDetailRecord] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all"); // 'all', 'pending', 'hpa', 'hpt'
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalRecords: 0,
    limit: 20,
  });
  const [statistics, setStatistics] = useState({
    total: 0,
    hpaCount: 0,
    hptCount: 0,
    pendingPaymentCount: 0,
    pendingPaymentAmount: 0,
  });

  useEffect(() => {
    if (!location.state?.openAddModal) return;

    setIsAddModalOpen(true);
    navigate(location.pathname, { replace: true, state: {} });
  }, [location.pathname, location.state, navigate]);

  // Fetch HPA/HPT statistics from API
  const fetchStatistics = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/hpa-hpt/statistics`, { withCredentials: true });
      if (response.data.success) {
        setStatistics({
          total: response.data.data.total,
          hpaCount: response.data.data.hpaCount,
          hptCount: response.data.data.hptCount,
          pendingPaymentCount: response.data.data.pendingPaymentCount,
          pendingPaymentAmount: response.data.data.pendingPaymentAmount,
        });
      }
    } catch (error) {
      console.error("Error fetching statistics:", error);
    }
  };

  // Fetch HPA/HPT records from API
  const fetchHpaHptRecords = async (page = pagination.currentPage) => {
    setLoading(true);
    let url = `${API_URL}/api/hpa-hpt`;
    const params = {
      page,
      limit: pagination.limit,
      search: searchQuery,
    };

    if (statusFilter === "pending") {
      url = `${API_URL}/api/hpa-hpt/pending`;
    } else if (statusFilter === "hpa" || statusFilter === "hpt") {
      params.type = statusFilter;
    }

    try {
      const response = await axios.get(url, { params, withCredentials: true });

      if (response.data.success) {
        const transformedRecords = response.data.data.map((record) => ({
          id: record._id,
          _id: record._id,
          vehicleNumber: record.vehicleNumber,
          ownerName: record.ownerName,
          mobileNumber: record.mobileNumber,
          type: record.type,
          totalFee: record.totalFee || 0,
          paid: record.paid || 0,
          balance: record.balance || 0,
          feeBreakup: record.feeBreakup || [],
          remarks: record.remarks || '',
          createdAt: record.createdAt,
        }));

        setHpaHptRecords(transformedRecords);

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
      console.error("Error fetching HPA/HPT records:", error);
      toast.error(
        "Failed to fetch HPA/HPT records. Please check if the backend server is running.",
        {
          position: "top-right",
          autoClose: 3000,
        }
      );
    } finally {
      setLoading(false);
    }
  };

  // Load HPA/HPT records and statistics on component mount and when filters change
  useEffect(() => {
    fetchHpaHptRecords(1);
    fetchStatistics();
  }, [searchQuery, statusFilter]);

  // Page change handler
  const handlePageChange = (newPage) => {
    fetchHpaHptRecords(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleAddSuccess = async () => {
    await fetchHpaHptRecords();
    await fetchStatistics();
  };

  const handleEditSuccess = async () => {
    await fetchHpaHptRecords();
    await fetchStatistics();
    setSelectedRecord(null);
  };

  const handleViewClick = (record) => {
    setSelectedDetailRecord(record);
    setIsDetailModalOpen(true);
  };

  const handleEditClick = (record) => {
    setSelectedRecord(record);
    setIsEditModalOpen(true);
  };

  const handleDeleteRecord = async (record) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete this HPA/HPT record?\n\n` +
        `Vehicle Number: ${record.vehicleNumber}\n` +
        `Type: ${record.type === 'hpa' ? 'HPA' : 'HPT'}\n\n` +
        `This action cannot be undone.`
    );

    if (!confirmDelete) return;

    setLoading(true);
    try {
      const response = await axios.delete(
        `${API_URL}/api/hpa-hpt/id/${record.id}`,
        { withCredentials: true }
      );

      if (response.data.success) {
        toast.success("HPA/HPT record deleted successfully!", {
          position: "top-right",
          autoClose: 3000,
        });
        await fetchHpaHptRecords();
        await fetchStatistics();
      } else {
        throw new Error(response.data.message || "Failed to delete record");
      }
    } catch (error) {
      console.error("Error deleting HPA/HPT record:", error);
      toast.error(`Failed to delete record: ${error.message}`, {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Mark HPA/HPT as paid
  const handleMarkAsPaid = async (record) => {
    const confirmPaid = window.confirm(
      `Are you sure you want to mark this payment as PAID?\n\n` +
      `Vehicle Number: ${record.vehicleNumber}\n` +
      `Total Fee: ₹${(record.totalFee || 0).toLocaleString('en-IN')}\n` +
      `Current Balance: ₹${(record.balance || 0).toLocaleString('en-IN')}\n\n` +
      `This will set Paid = ₹${(record.totalFee || 0).toLocaleString('en-IN')} and Balance = ₹0`
    );

    if (!confirmPaid) return;

    setLoading(true);
    try {
      const response = await axios.patch(
        `${API_URL}/api/hpa-hpt/id/${record.id}/mark-as-paid`,
        {},
        { withCredentials: true }
      );

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to mark payment as paid');
      }

      toast.success('Payment marked as paid successfully!', {
        position: 'top-right',
        autoClose: 3000
      });

      await fetchHpaHptRecords();
      await fetchStatistics();
    } catch (error) {
      console.error('Error marking payment as paid:', error);
      toast.error(`Failed to mark payment as paid: ${error.message}`, {
        position: 'top-right',
        autoClose: 3000
      });
    } finally {
      setLoading(false);
    }
  };


  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-rose-50/50 via-pink-50/50 to-purple-50/50">
        <div className="w-full px-3 md:px-4 lg:px-6 pt-4 lg:pt-6 pb-8">
          {/* Statistics Cards */}
          <div className="mb-2 mt-3">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-3 mb-5">
              <StatisticsCard
                title="Total HPA+HPT"
                value={statistics.total}
                color="purple"
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
                title="HPA (Addition)"
                value={statistics.hpaCount}
                color="indigo"
                isActive={statusFilter === "hpa"}
                onClick={() => setStatusFilter(statusFilter === "hpa" ? "all" : "hpa")}
                subtext="Hypothecation Addition"
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
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                }
              />
              <StatisticsCard
                title="HPT (Termination)"
                value={statistics.hptCount}
                color="teal"
                isActive={statusFilter === "hpt"}
                onClick={() => setStatusFilter(statusFilter === "hpt" ? "all" : "hpt")}
                subtext="Hypothecation Termination"
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
                color="amber"
                isActive={statusFilter === "pending"}
                onClick={() => setStatusFilter(statusFilter === "pending" ? "all" : "pending")}
                extraValue={`₹${statistics.pendingPaymentAmount.toLocaleString("en-IN")}`}
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

          {/* HPA/HPT Table */}
          <div className="bg-white rounded-2xl shadow-2xl border border-rose-100 overflow-hidden">
            <div className="px-6 py-5 bg-gradient-to-r from-rose-50 via-pink-50 to-purple-50 border-b border-gray-200">
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
                  title="Add HPA / HPT"
                />
              </div>

              {/* Results count */}
              <div className="mt-3 text-xs text-gray-600 font-semibold">
                Showing {hpaHptRecords.length} of {pagination.totalRecords} records
              </div>
            </div>

            {/* Loading Indicator */}
            {loading && (
              <div className="p-8 text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600"></div>
                <p className="mt-4 text-gray-600 font-semibold">
                  Loading records...
                </p>
              </div>
            )}

            {/* Mobile Card View */}
            <MobileCardView
              records={hpaHptRecords}
              emptyMessage={{
                title: 'No HPA/HPT records found',
                description: 'Click "Add HPA / HPT" to add your first record',
              }}
              loadingMessage='Loading HPA/HPT records...'
              headerGradient='from-rose-50 via-pink-50 to-purple-50'
              avatarGradient='from-rose-500 to-pink-500'
              emptyIconGradient='from-rose-100 to-pink-100'
              emptyIconColor='text-rose-400'
              cardConfig={{
                header: {
                  avatar: null,
                  title: (record) => record.vehicleNumber,
                  subtitle: (record) => (
                    <div>
                      <p className="font-semibold text-gray-800">{record.ownerName || 'N/A'}</p>
                      {record.mobileNumber && (
                        <a
                          href={`tel:${record.mobileNumber}`}
                          className='flex items-center mt-1 text-blue-600 font-semibold hover:text-blue-700 active:text-blue-800 transition-all cursor-pointer underline decoration-blue-400 underline-offset-2'
                        >
                          <svg className='w-3.5 h-3.5 mr-1 text-blue-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z' />
                          </svg>
                          {record.mobileNumber}
                        </a>
                      )}
                    </div>
                  ),
                  extraInfo: null,
                  showVehicleParts: true,
                },
                body: {
                  showStatus: false,
                  showPayment: true,
                  showValidity: false,
                  customFields: [
                    {
                      render: (record) => (
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-xs text-gray-500 font-semibold uppercase">Type</span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            record.type === 'hpa'
                              ? 'bg-rose-100 text-rose-700 border border-rose-200'
                              : 'bg-pink-100 text-pink-700 border border-pink-200'
                          }`}>
                            {record.type === 'hpa' ? 'HPA' : 'HPT'}
                          </span>
                        </div>
                      )
                    }
                  ]
                },
                footer: null,
              }}
              actions={[
                {
                  title: 'View',
                  onClick: handleViewClick,
                  bgColor: 'bg-purple-100',
                  textColor: 'text-purple-600',
                  hoverBgColor: 'bg-purple-200',
                  icon: (
                    <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 12a3 3 0 11-6 0 3 3 0 016 0z' />
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' />
                    </svg>
                  ),
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
                  onClick: handleDeleteRecord,
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
                      Vehicle Number
                    </th>
                    <th className="px-4 2xl:px-6 py-3 2xl:py-4 text-left text-[10px] 2xl:text-xs font-bold text-white uppercase tracking-wide">
                      Owner Name
                    </th>
                    <th className="px-4 2xl:px-6 py-3 2xl:py-4 text-center text-[10px] 2xl:text-xs font-bold text-white uppercase tracking-wide">
                      Type
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
                    <th className="px-4 2xl:px-6 py-3 2xl:py-4 text-center text-[10px] 2xl:text-xs font-bold text-white uppercase tracking-wide">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {hpaHptRecords.length > 0 ? (
                    hpaHptRecords.map((record) => (
                      <tr
                        key={record.id}
                        className="hover:bg-gradient-to-r hover:from-rose-50/50 hover:via-pink-50/50 hover:to-purple-50/50 transition-all duration-200 group"
                      >
                        {/* Vehicle Number */}
                        <td className="px-4 2xl:px-6 py-3 2xl:py-4">
                          <div>
                            <div className="flex items-center gap-2 2xl:gap-3">
                              {(() => {
                                const parts = getVehicleNumberParts(record.vehicleNumber);
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
                                      className="w-3.5 h-5 2xl:w-4 2xl:h-6 mr-0.5 text-rose-800 flex-shrink-0"
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
                                );
                              })()}
                            </div>
                            {record.mobileNumber && (
                              <div className="flex items-center mt-1.5 text-[10px] 2xl:text-xs text-gray-600">
                                <svg className="w-3 h-3 2xl:w-3.5 2xl:h-3.5 mr-1 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                                {record.mobileNumber}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Owner Name */}
                        <td className="px-4 2xl:px-6 py-3 2xl:py-4">
                          <div className="text-[11px] 2xl:text-sm font-semibold text-gray-800">
                            {record.ownerName || 'N/A'}
                          </div>
                        </td>

                        {/* Type */}
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-[10px] 2xl:text-xs font-bold ${
                            record.type === 'hpa'
                              ? 'bg-rose-100 text-rose-700 border border-rose-200 shadow-sm'
                              : 'bg-pink-100 text-pink-700 border border-pink-200 shadow-sm'
                          }`}>
                            {record.type === 'hpa' ? 'HPA' : 'HPT'}
                          </span>
                        </td>

                        {/* Total Fee */}
                        <td className="px-4 py-4 bg-gray-50/50 group-hover:bg-purple-50/30 pl-12 2xl:pl-16">
                          <div className="text-right">
                            <div className="text-[11px] 2xl:text-sm font-bold text-gray-900">₹{(record.totalFee || 0).toLocaleString("en-IN")}</div>
                            <div className="text-[10px] 2xl:text-xs text-gray-500 mt-0.5">Total Amount</div>
                          </div>
                        </td>

                        {/* Paid */}
                        <td className="px-4 py-4 bg-gray-50/50 group-hover:bg-emerald-50/30">
                          <div className="text-right">
                            <div className="text-[11px] 2xl:text-sm font-bold text-emerald-600">₹{(record.paid || 0).toLocaleString("en-IN")}</div>
                            <div className="text-[10px] 2xl:text-xs text-emerald-600 mt-0.5">Paid Amount</div>
                          </div>
                        </td>

                        {/* Balance */}
                        <td className={`px-4 py-4 bg-gray-50/50 ${(record.balance || 0) > 0 ? 'group-hover:bg-amber-50/30' : 'group-hover:bg-gray-50'}`}>
                          <div className="text-right">
                            <div className={`text-[11px] 2xl:text-sm font-bold ${(record.balance || 0) > 0 ? 'text-orange-600' : 'text-gray-500'}`}>
                              ₹{(record.balance || 0).toLocaleString("en-IN")}
                            </div>
                            <div className={`text-[10px] 2xl:text-xs mt-0.5 ${(record.balance || 0) > 0 ? 'text-orange-600' : 'text-gray-500'}`}>
                              {(record.balance || 0) > 0 ? 'Pending' : 'Cleared'}
                            </div>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-1 2xl:px-2 py-3 2xl:py-4">
                          <div className="flex items-center justify-center gap-0.5 2xl:gap-0.5">


                            {/* View Details Button */}
                            <button
                              onClick={() => handleViewClick(record)}
                              className="p-1.5 2xl:p-2 text-purple-600 hover:bg-purple-100 rounded-lg transition-all group-hover:scale-110 duration-200"
                              title="View Details"
                            >
                              <svg className="w-4 h-4 2xl:w-5 2xl:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>

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
                              onClick={() => handleDeleteRecord(record)}
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
                      <td colSpan="7" className="px-4 py-8 text-center">
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
                            No HPA/HPT records found
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Click &quot;Add HPA / HPT&quot; to add your first record
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {!loading && hpaHptRecords.length > 0 && (
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

      {/* Add HpaHpt Modal */}
      {isAddModalOpen && (
        <AddHpaHptModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSubmit={handleAddSuccess}
        />
      )}

      {/* Edit HpaHpt Modal */}
      {isEditModalOpen && (
        <EditHpaHptModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedRecord(null);
          }}
          onSubmit={handleEditSuccess}
          record={selectedRecord}
        />
      )}

      {/* HpaHpt Detail Modal */}
      {isDetailModalOpen && (
        <HpaHptDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedDetailRecord(null);
          }}
          record={selectedDetailRecord}
          onEdit={handleEditClick}
          onDelete={handleDeleteRecord}
          onMarkAsPaid={handleMarkAsPaid}
        />
      )}
    </>
  );
};

export default HpaHpt;
