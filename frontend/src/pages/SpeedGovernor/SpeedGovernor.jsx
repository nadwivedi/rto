import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import AddButton from "../../components/AddButton";
import AddSpeedGovernorModal from "./components/AddSpeedGovernorModal";
import EditSpeedGovernorModal from "./components/EditSpeedGovernorModal";
import Pagination from "../../components/Pagination";
import SearchBar from "../../components/SearchBar";
import MobileCardView from "../../components/MobileCardView";
import { getTheme, getVehicleNumberDesign } from "../../context/ThemeContext";
import { getVehicleNumberParts } from "../../utils/vehicleNoCheck";

const API_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";

const SpeedGovernor = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = getTheme();
  const vehicleDesign = getVehicleNumberDesign();
  const [records, setRecords] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalRecords: 0,
    limit: 20,
  });

  useEffect(() => {
    if (!location.state?.openAddModal) return;
    setIsAddModalOpen(true);
    navigate(location.pathname, { replace: true, state: {} });
  }, [location.pathname, location.state, navigate]);

  const fetchRecords = async (page = pagination.currentPage) => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/speed-governor`, {
        params: { page, limit: pagination.limit, search: searchQuery },
        withCredentials: true,
      });

      if (response.data.success) {
        const transformed = response.data.data.map((r) => ({
          id: r._id,
          _id: r._id,
          date: r.date,
          vehicleNumber: r.vehicleNumber,
          ownerName: r.ownerName,
          mobileNumber: r.mobileNumber,
          totalFee: r.totalFee || 0,
          paid: r.paid || 0,
          balance: r.balance || 0,
          remark: r.remark || '',
        }));
        setRecords(transformed);

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
      console.error("Error fetching records:", error);
      toast.error("Failed to fetch records. Check if the backend server is running.", {
        position: "top-right", autoClose: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords(1);
  }, [searchQuery]);

  const handlePageChange = (newPage) => {
    fetchRecords(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleAdd = async () => {
    await fetchRecords();
  };

  const handleEdit = async (formData) => {
    setLoading(true);
    try {
      const id = selectedRecord._id || selectedRecord.id;
      const response = await axios.put(
        `${API_URL}/api/speed-governor/${id}`,
        {
          date: formData.date,
          vehicleNumber: formData.vehicleNumber,
          ownerName: formData.ownerName,
          mobileNumber: formData.mobileNumber,
          totalFee: parseFloat(formData.totalFee),
          paid: parseFloat(formData.paid),
          balance: parseFloat(formData.balance),
          remark: formData.remark,
        },
        { withCredentials: true }
      );

      if (response.data.success) {
        toast.success("Record updated successfully!", { position: "top-right", autoClose: 3000 });
        await fetchRecords();
        setIsEditModalOpen(false);
        setSelectedRecord(null);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update record", {
        position: "top-right", autoClose: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (record) => {
    setSelectedRecord(record);
    setIsEditModalOpen(true);
  };

  const handleDelete = async (record) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete this record?\n\nVehicle: ${record.vehicleNumber}\nDate: ${record.date}\n\nThis action cannot be undone.`
    );
    if (!confirmDelete) return;

    setLoading(true);
    try {
      const response = await axios.delete(`${API_URL}/api/speed-governor/${record.id}`, { withCredentials: true });
      if (response.data.success) {
        toast.success("Record deleted successfully!", { position: "top-right", autoClose: 3000 });
        await fetchRecords();
      }
    } catch (error) {
      toast.error(`Failed to delete: ${error.message}`, { position: "top-right", autoClose: 3000 });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsPaid = async (record) => {
    const confirmPaid = window.confirm(
      `Mark as PAID?\n\nVehicle: ${record.vehicleNumber}\nTotal: ₹${(record.totalFee || 0).toLocaleString('en-IN')}\nBalance: ₹${(record.balance || 0).toLocaleString('en-IN')}`
    );
    if (!confirmPaid) return;

    setLoading(true);
    try {
      const response = await axios.patch(`${API_URL}/api/speed-governor/${record.id}/mark-paid`, {}, { withCredentials: true });
      if (response.data.success) {
        toast.success('Payment marked as paid!', { position: 'top-right', autoClose: 3000 });
        await fetchRecords();
      }
    } catch (error) {
      toast.error(`Failed: ${error.message}`, { position: 'top-right', autoClose: 3000 });
    } finally {
      setLoading(false);
    }
  };

  const totalStats = records.reduce((acc, r) => ({
    totalFee: acc.totalFee + (r.totalFee || 0),
    totalPaid: acc.totalPaid + (r.paid || 0),
    totalBalance: acc.totalBalance + (r.balance || 0),
  }), { totalFee: 0, totalPaid: 0, totalBalance: 0 });

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
        <div className="w-full px-3 md:px-4 lg:px-6 pt-4 lg:pt-6 pb-8">
          <div className="flex items-center gap-3 mb-5 mt-3">
            <button
              onClick={() => navigate('/')}
              className='flex items-center justify-center w-10 h-10 rounded-xl bg-white border border-gray-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer flex-shrink-0'
              title='Back to Home'
            >
              <svg className='w-5 h-5 text-gray-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M10 19l-7-7m0 0l7-7m-7 7h18' />
              </svg>
            </button>
            <div className="grid grid-cols-3 gap-2 lg:gap-3 flex-1">
              <div className="bg-white rounded-xl border border-blue-200 p-3 shadow-sm">
                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wide">Total Fee</p>
                <p className="text-lg font-black text-blue-800">₹{totalStats.totalFee.toLocaleString('en-IN')}</p>
              </div>
              <div className="bg-white rounded-xl border border-emerald-200 p-3 shadow-sm">
                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide">Total Paid</p>
                <p className="text-lg font-black text-emerald-800">₹{totalStats.totalPaid.toLocaleString('en-IN')}</p>
              </div>
              <div className="bg-white rounded-xl border border-amber-200 p-3 shadow-sm">
                <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wide">Balance</p>
                <p className="text-lg font-black text-amber-800">₹{totalStats.totalBalance.toLocaleString('en-IN')}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-5 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border-b border-gray-200">
              <div className="flex flex-col lg:flex-row gap-2 items-stretch lg:items-center">
                <SearchBar
                  value={searchQuery}
                  onChange={(value) => setSearchQuery(value)}
                  placeholder="Search by vehicle number..."
                  toUpperCase={true}
                />
                <AddButton
                  onClick={() => setIsAddModalOpen(true)}
                  title="Add Speed Governor"
                />
              </div>
              <div className="mt-3 text-xs text-gray-600 font-semibold">
                Showing {records.length} of {pagination.totalRecords} records
              </div>
            </div>

            {loading && (
              <div className="p-8 text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                <p className="mt-4 text-gray-600 font-semibold">Loading records...</p>
              </div>
            )}

            <MobileCardView
              records={records}
              emptyMessage={{
                title: 'No Speed Governor records found',
                description: 'Click "Add Speed Governor" to add your first record',
              }}
              loadingMessage='Loading records...'
              cardConfig={{
                header: {
                  title: (r) => r.vehicleNumber,
                  subtitle: (r) => r.mobileNumber ? (
                    <a href={`tel:${r.mobileNumber}`} className='flex items-center mt-1 text-blue-600 font-semibold hover:text-blue-700 underline decoration-blue-400 underline-offset-2'>
                      <svg className='w-3.5 h-3.5 mr-1 text-blue-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z' />
                      </svg>
                      {r.mobileNumber}
                    </a>
                  ) : null,
                  showVehicleParts: true,
                },
                body: {
                  showStatus: false,
                  showPayment: true,
                  showValidity: false,
                },
              }}
              actions={[
                {
                  title: 'Mark Paid',
                  condition: (r) => (r.balance || 0) > 0,
                  onClick: handleMarkAsPaid,
                  bgColor: 'bg-emerald-50',
                  textColor: 'text-emerald-600',
                  hoverBgColor: 'bg-emerald-100',
                  icon: (
                    <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' />
                    </svg>
                  ),
                },
                {
                  title: 'Edit',
                  onClick: (r) => { setSelectedRecord(r); setIsEditModalOpen(true); },
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

            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead className={theme.tableHeader}>
                  <tr>
                    <th className="px-4 2xl:px-6 py-3 2xl:py-4 text-left text-[10px] 2xl:text-xs font-bold text-white uppercase tracking-wide">Date</th>
                    <th className="px-4 2xl:px-6 py-3 2xl:py-4 text-left text-[10px] 2xl:text-xs font-bold text-white uppercase tracking-wide">Vehicle Number</th>
                    <th className="px-4 2xl:px-6 py-3 2xl:py-4 text-left text-[10px] 2xl:text-xs font-bold text-white uppercase tracking-wide">Owner</th>
                    <th className="px-4 2xl:px-6 py-3 2xl:py-4 text-right text-[10px] 2xl:text-xs font-bold text-white uppercase tracking-wide bg-white/10 pl-12 2xl:pl-16">Total Fee</th>
                    <th className="px-4 2xl:px-6 py-3 2xl:py-4 text-right text-[10px] 2xl:text-xs font-bold text-white uppercase tracking-wide bg-white/10">Paid</th>
                    <th className="px-4 2xl:px-6 py-3 2xl:py-4 text-right text-[10px] 2xl:text-xs font-bold text-white uppercase tracking-wide bg-white/10">Balance</th>
                    <th className="px-4 2xl:px-6 py-3 2xl:py-4 text-left text-[10px] 2xl:text-xs font-bold text-white uppercase tracking-wide">Remark</th>
                    <th className="px-4 2xl:px-6 py-3 2xl:py-4 text-center text-[10px] 2xl:text-xs font-bold text-white uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {records.length > 0 ? (
                    records.map((record) => (
                      <tr key={record.id} className="hover:bg-gradient-to-r hover:from-blue-50/50 hover:via-indigo-50/50 hover:to-purple-50/50 transition-all duration-200 group">
                        <td className="px-4 2xl:px-6 py-3 2xl:py-4">
                          <div className="flex items-center gap-1 text-[11px] 2xl:text-sm font-semibold text-gray-800">
                            <svg className='w-[14px] h-[14px] 2xl:w-4 2xl:h-4 text-gray-800' fill='none' stroke='currentColor' viewBox='0 0 24 24' strokeWidth={1.5}>
                              <path strokeLinecap='round' strokeLinejoin='round' d='M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5' />
                            </svg>
                            {record.date || '-'}
                          </div>
                        </td>
                        <td className="px-4 2xl:px-6 py-3 2xl:py-4">
                          <div className="flex items-center gap-2 2xl:gap-3">
                            {(() => {
                              const parts = getVehicleNumberParts(record.vehicleNumber);
                              if (!parts) {
                                return <div className="text-[11px] 2xl:text-sm font-inter font-bold text-gray-900">{record.vehicleNumber}</div>;
                              }
                              return (
                                <div className={vehicleDesign.container}>
                                  <svg className="w-3.5 h-5 2xl:w-4 2xl:h-6 mr-0.5 text-blue-800 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
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
                        </td>
                        <td className='px-4 2xl:px-6 py-3 2xl:py-5'>
                          <div className='flex items-center'>
                            <div className='flex-shrink-0 h-8 w-8 2xl:h-10 2xl:w-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold shadow-md text-xs 2xl:text-sm'>
                              {record.ownerName?.charAt(0) || 'O'}
                            </div>
                            <div className='ml-2 2xl:ml-4'>
                              <div className='text-[11px] 2xl:text-sm font-bold text-gray-900'>{record.ownerName || 'N/A'}</div>
                              {record.mobileNumber && (
                                <div className='text-[10px] 2xl:text-xs text-gray-500 flex items-center mt-0.5'>{record.mobileNumber}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 bg-gray-50/50 group-hover:bg-purple-50/30 pl-12 2xl:pl-16">
                          <div className="text-right">
                            <div className="text-[11px] 2xl:text-sm font-bold text-gray-900">₹{(record.totalFee || 0).toLocaleString("en-IN")}</div>
                          </div>
                        </td>
                        <td className="px-4 py-4 bg-gray-50/50 group-hover:bg-emerald-50/30">
                          <div className="text-right">
                            <div className="text-[11px] 2xl:text-sm font-bold text-emerald-600">₹{(record.paid || 0).toLocaleString("en-IN")}</div>
                          </div>
                        </td>
                        <td className={`px-4 py-4 bg-gray-50/50 ${(record.balance || 0) > 0 ? 'group-hover:bg-amber-50/30' : ''}`}>
                          <div className="text-right">
                            <div className={`text-[11px] 2xl:text-sm font-bold ${(record.balance || 0) > 0 ? 'text-orange-600' : 'text-gray-500'}`}>
                              ₹{(record.balance || 0).toLocaleString("en-IN")}
                            </div>
                            <div className={`text-[10px] 2xl:text-xs mt-0.5 ${(record.balance || 0) > 0 ? 'text-orange-600' : 'text-gray-500'}`}>
                              {(record.balance || 0) > 0 ? 'Pending' : 'Cleared'}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 2xl:px-6 py-3 2xl:py-4">
                          <div className="text-[11px] 2xl:text-sm text-gray-700 max-w-[200px] truncate" title={record.remark}>
                            {record.remark || '-'}
                          </div>
                        </td>
                        <td className="px-1 2xl:px-2 py-3 2xl:py-4">
                          <div className="flex items-center justify-end gap-0.5 pr-1">
                            {(record.balance || 0) > 0 && (
                              <button
                                onClick={() => handleMarkAsPaid(record)}
                                className="p-1.5 2xl:p-2 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-all group-hover:scale-110 duration-200"
                                title="Mark as Paid"
                              >
                                <svg className="w-4 h-4 2xl:w-5 2xl:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </button>
                            )}
                            <button
                              onClick={() => handleEditClick(record)}
                              className="p-1.5 2xl:p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-all group-hover:scale-110 duration-200"
                              title="Edit"
                            >
                              <svg className="w-4 h-4 2xl:w-5 2xl:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDelete(record)}
                              className="p-1.5 2xl:p-2 text-red-600 hover:bg-red-100 rounded-lg transition-all group-hover:scale-110 duration-200"
                              title="Delete"
                            >
                              <svg className="w-4 h-4 2xl:w-5 2xl:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="px-4 py-8 text-center">
                        <div className="text-gray-400">
                          <svg className="mx-auto h-8 w-8 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <p className="text-sm font-semibold text-gray-600">No records found</p>
                          <p className="text-xs text-gray-500 mt-1">Click "Add Speed Governor" to add your first record</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {!loading && records.length > 0 && (
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

      {isAddModalOpen && (
        <AddSpeedGovernorModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSubmit={handleAdd}
        />
      )}

      {isEditModalOpen && (
        <EditSpeedGovernorModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSubmit={handleEdit}
          record={selectedRecord}
        />
      )}
    </>
  );
};

export default SpeedGovernor;
