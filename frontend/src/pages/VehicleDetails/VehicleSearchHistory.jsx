import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-toastify'
import {
  Search,
  ArrowLeft,
  Home,
  Truck,
  History,
  Trash2,
  Eye,
  RefreshCw,
  Calendar,
  User,
  Shield,
  FileCheck,
  ChevronLeft,
  ChevronRight,
  Car,
  Clock,
  X,
  Building2,
  Fuel,
  CheckCircle2,
  AlertTriangle,
  Phone
} from 'lucide-react'

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'

const VehicleSearchHistory = () => {
  const navigate = useNavigate()
  const [historyList, setHistoryList] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, limit: 20 })
  const [deletingId, setDeletingId] = useState(null)

  const fetchHistory = async (page = currentPage, search = searchTerm, pageLimit = limit) => {
    try {
      setLoading(true)
      let url = `${API_URL}/api/vehicle-info/history?page=${page}&limit=${pageLimit}`
      if (search) {
        url += `&search=${encodeURIComponent(search)}`
      }

      const response = await axios.get(url, { withCredentials: true })
      if (response.data.success) {
        setHistoryList(response.data.data || [])
        setPagination(
          response.data.pagination || {
            total: 0,
            totalPages: 1,
            limit: pageLimit
          }
        )
      }
    } catch (error) {
      console.error('Error fetching search history:', error)
      toast.error('Failed to load vehicle search history')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHistory(currentPage, searchTerm, limit)
  }, [currentPage, limit])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchHistory(1, searchTerm, limit)
  }

  const handleDeleteItem = async (id, vehicleNumber) => {
    if (!window.confirm(`Remove ${vehicleNumber} from your search history?`)) return
    try {
      setDeletingId(id)
      const res = await axios.delete(`${API_URL}/api/vehicle-info/history/${id}`, {
        withCredentials: true
      })
      if (res.data.success) {
        toast.success(`Removed ${vehicleNumber} from history`)
        fetchHistory(currentPage, searchTerm, limit)
      }
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('Failed to delete search record')
    } finally {
      setDeletingId(null)
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A'
    try {
      const d = new Date(dateStr)
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      })
    } catch {
      return dateStr
    }
  }

  const formatTime = (dateStr) => {
    if (!dateStr) return ''
    try {
      const d = new Date(dateStr)
      return d.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
    } catch {
      return ''
    }
  }

  const formatDateTime = (dateStr) => {
    if (!dateStr) return 'N/A'
    try {
      const d = new Date(dateStr)
      return d.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
    } catch {
      return dateStr
    }
  }

  const isExpired = (dateStr) => {
    if (!dateStr || dateStr === 'NA') return false
    try {
      const parsed = new Date(dateStr)
      if (isNaN(parsed.getTime())) return false
      return parsed < new Date()
    } catch {
      return false
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/')}
              className="p-2.5 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 shadow-sm text-slate-600 transition cursor-pointer"
              title="Back to Home Dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => navigate('/vehicle-details')}
              className="p-2.5 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 shadow-sm text-slate-600 transition cursor-pointer"
              title="Vehicle Lookup"
            >
              <Truck className="w-5 h-5" />
            </button>
            <div className="ml-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
                  <History className="w-6 h-6 text-indigo-600" />
                  Vehicle Search History
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700 border border-indigo-200">
                  {pagination.total} Total Saved
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Complete database records of all verified vehicle searches performed in your account
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={() => navigate('/vehicle-details')}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm text-xs sm:text-sm font-bold transition cursor-pointer"
            >
              <Search className="w-4 h-4" />
              New Live Search
            </button>
          </div>
        </div>

        {/* Filter / Search Bar */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search history by vehicle number, owner name, maker, RTO location..."
                className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:border-indigo-500 outline-none transition"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('')
                    setCurrentPage(1)
                    fetchHistory(1, '', limit)
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <select
                value={limit}
                onChange={(e) => {
                  const newLimit = parseInt(e.target.value)
                  setLimit(newLimit)
                  setCurrentPage(1)
                  fetchHistory(1, searchTerm, newLimit)
                }}
                className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none cursor-pointer"
                title="Rows per page"
              >
                <option value={10}>10 per page</option>
                <option value={20}>20 per page</option>
                <option value={50}>50 per page</option>
                <option value={100}>100 per page</option>
              </select>

              <button
                type="submit"
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs rounded-xl shadow-sm transition cursor-pointer"
              >
                Filter
              </button>
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('')
                  setCurrentPage(1)
                  fetchHistory(1, '', limit)
                }}
                className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition cursor-pointer"
                title="Reset Filter"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </form>
        </div>

        {/* TABLE VIEW CONTAINER */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-16 text-center text-slate-500 text-sm">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-indigo-600" />
              <p className="font-semibold text-slate-700">Loading saved search history...</p>
            </div>
          ) : historyList.length === 0 ? (
            <div className="p-16 text-center text-slate-500">
              <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Car className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-800 mb-1">No Search History Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                {searchTerm
                  ? 'No search history matches your query keyword.'
                  : 'You have not searched for any vehicle registration numbers yet.'}
              </p>
              <button
                onClick={() => navigate('/vehicle-details')}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition cursor-pointer"
              >
                Lookup a Vehicle Now
              </button>
            </div>
          ) : (
            <div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider select-none">
                    <tr>
                      <th className="py-3.5 px-4 text-center w-12">#</th>
                      <th className="py-3.5 px-4 min-w-[200px]">Vehicle & Owner</th>
                      <th className="py-3.5 px-4 min-w-[200px]">Maker & Model</th>
                      <th className="py-3.5 px-4 min-w-[160px] hidden md:table-cell">Registered RTO</th>
                      <th className="py-3.5 px-3 min-w-[110px] hidden lg:table-cell">Fitness Upto</th>
                      <th className="py-3.5 px-3 min-w-[110px] hidden lg:table-cell">Insurance Upto</th>
                      <th className="py-3.5 px-3 min-w-[110px] hidden xl:table-cell">Road Tax Upto</th>
                      <th className="py-3.5 px-4 min-w-[170px]">Search Time</th>
                      <th className="py-3.5 px-4 text-right min-w-[130px] sticky right-0 bg-slate-50">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {historyList.map((item, index) => {
                      const serialNumber = (currentPage - 1) * limit + index + 1
                      return (
                        <tr
                          key={item._id}
                          className="hover:bg-indigo-50/40 transition group"
                        >
                          {/* Serial Number */}
                          <td className="py-3.5 px-4 text-center text-slate-400 font-mono text-xs">
                            {serialNumber}
                          </td>

                          {/* Plate Look + Owner Name + Mobile No below */}
                          <td className="py-3.5 px-4">
                            <div className="flex flex-col items-start gap-1.5">
                              <span className="inline-flex items-center bg-slate-900 text-white rounded-lg shadow-sm font-mono font-black text-xs sm:text-sm tracking-wider overflow-hidden border border-slate-800">
                                <span className="bg-blue-800 text-[9px] text-white px-1.5 py-0.5 font-sans font-black flex items-center leading-none">
                                  IND
                                </span>
                                <span className="px-2.5 py-0.5">{item.vehicleNumber}</span>
                              </span>
                              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900">
                                <User className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                                <span className="line-clamp-1">{item.ownerName || 'NA'}</span>
                              </div>
                              {(item.mobileNo || item.rawResponse?.MOBILE_NO) &&
                               (item.mobileNo !== 'NA' && item.rawResponse?.MOBILE_NO !== 'NA') && (
                                <div className="flex items-center gap-1 text-[11px] text-slate-600 font-medium">
                                  <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                                  <span>{item.mobileNo || item.rawResponse?.MOBILE_NO}</span>
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Maker & Model */}
                          <td className="py-3.5 px-4 text-slate-700">
                            <span className="line-clamp-1 font-medium">{item.makerModel || 'NA'}</span>
                          </td>


                          {/* Registered RTO */}
                          <td className="py-3.5 px-4 text-slate-600 hidden md:table-cell text-xs">
                            <span className="line-clamp-1 flex items-center gap-1">
                              <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              {item.registeredAt || 'NA'}
                            </span>
                          </td>

                          {/* Fitness */}
                          <td className="py-3.5 px-3 hidden lg:table-cell text-xs">
                            <span
                              className={`font-semibold ${
                                isExpired(item.fitnessUpto) ? 'text-red-600' : 'text-slate-800'
                              }`}
                            >
                              {item.fitnessUpto || 'NA'}
                            </span>
                          </td>

                          {/* Insurance */}
                          <td className="py-3.5 px-3 hidden lg:table-cell text-xs">
                            <span
                              className={`font-semibold ${
                                isExpired(item.insuranceUpto) ? 'text-red-600' : 'text-slate-800'
                              }`}
                            >
                              {item.insuranceUpto || 'NA'}
                            </span>
                          </td>

                          {/* Tax */}
                          <td className="py-3.5 px-3 hidden xl:table-cell text-xs">
                            <span
                              className={`font-semibold ${
                                isExpired(item.taxUpto) ? 'text-red-600' : 'text-slate-800'
                              }`}
                            >
                              {item.taxUpto || 'NA'}
                            </span>
                          </td>

                          {/* Search Date on top & Time on bottom */}
                          <td className="py-3.5 px-4 text-xs">
                            <div className="flex flex-col items-start gap-0.5 whitespace-nowrap">
                              <span className="flex items-center gap-1 font-semibold text-slate-800">
                                <Calendar className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                                {formatDate(item.lastSearchedAt || item.updatedAt)}
                              </span>
                              <span className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                                <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                                {formatTime(item.lastSearchedAt || item.updatedAt)}
                              </span>
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right sticky right-0 bg-white group-hover:bg-indigo-50/40 transition">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => navigate(`/vehicle-details?historyId=${item._id}`)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs transition cursor-pointer shadow-sm"
                                title="View saved detail from database (No API call)"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                View
                              </button>
                              <button
                                onClick={() => handleDeleteItem(item._id, item.vehicleNumber)}
                                disabled={deletingId === item._id}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                                title="Delete from history"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls Footer */}
              <div className="bg-slate-50 border-t border-slate-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-semibold text-slate-600">
                <span>
                  Showing {(currentPage - 1) * limit + 1} to{' '}
                  {Math.min(currentPage * limit, pagination.total)} of {pagination.total} records
                </span>

                {pagination.totalPages > 1 && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage <= 1}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 transition cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Previous
                    </button>

                    <div className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800">
                      Page {currentPage} of {pagination.totalPages}
                    </div>

                    <button
                      onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                      disabled={currentPage >= pagination.totalPages}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 transition cursor-pointer"
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default VehicleSearchHistory
