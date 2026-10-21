import React, { useState, useEffect, useRef } from 'react'
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
  Download,
  FileText,
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
  Phone,
  UserPlus,
  Users
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import RcFormsMenu from './RcFormsMenu'
import { toInputDate } from '../../utils/dateHelpers'

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'

// Expiry filters. Keep the values in sync with backend/controllers/vehicleInfoController.js
const DOC_OPTIONS = [
  { value: 'all', label: 'All documents' },
  { value: 'Insurance', label: 'Insurance' },
  { value: 'Fitness', label: 'Fitness' },
  { value: 'Tax', label: 'Road Tax' },
  { value: 'PUC', label: 'PUC' }
]
const EXPIRY_OPTIONS = [
  { value: 'any', label: 'Any expiry date' },
  { value: 'expired', label: 'Already expired' },
  { value: '30', label: 'Expiring in 30 days' },
  { value: '60', label: 'Expiring in 60 days' },
  { value: '90', label: 'Expiring in 90 days' },
  { value: '180', label: 'Expiring in 180 days' },
  { value: '365', label: 'Expiring in 365 days' }
]
const LEAD_OPTIONS = [
  { value: 'all', label: 'All vehicles' },
  { value: 'notIn', label: 'Not in leads' },
  { value: 'in', label: 'Already in leads' }
]
const NO_FILTERS = { docType: 'all', expiry: 'any', leadFilter: 'all' }

const filterSelectClass = (isActive) =>
  `px-3 py-2.5 border rounded-xl text-xs font-semibold outline-none cursor-pointer ${
    isActive ? 'bg-indigo-50 border-indigo-400 text-indigo-700' : 'bg-slate-50 border-slate-200 text-slate-700'
  }`

// Expiry date of one document, coloured red when expired and amber when 30 days or less are left
const ExpiryCell = ({ item, type, value }) => {
  const doc = item.documents?.find((d) => d.type === type)
  const isExpired = doc && doc.daysLeft < 0
  const isSoon = doc && doc.daysLeft >= 0 && doc.daysLeft <= 30
  return (
    <span className={`font-semibold ${isExpired ? 'text-red-600' : isSoon ? 'text-amber-600' : 'text-slate-800'}`}>
      {value || 'NA'}
      {(isExpired || isSoon) && (
        <span className="block text-[10px] font-bold uppercase">
          {isExpired ? 'Expired' : doc.daysLeft === 0 ? 'Today' : `${doc.daysLeft}d left`}
        </span>
      )}
    </span>
  )
}

const VehicleSearchHistory = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  // Moving vehicles to leads adds records, so staff need the add permission and the leads section
  const isStaff = user?.type === 'staff'
  const canOpenLeads = !isStaff || user?.sections?.leads !== false
  const canMoveToLeads = !isStaff || (Boolean(user?.permissions?.add) && canOpenLeads)
  // RC forms the admin switched on for this user
  const rcFormTypes = ['form23', 'tempRc', 'nlParticular'].filter((t) => user?.features?.[t] === true)

  const [historyList, setHistoryList] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchType, setSearchType] = useState('all')
  const [filters, setFilters] = useState(NO_FILTERS)
  // Rows ticked on this page; selectAllMatching means every record matching the filters, on all pages
  const [selected, setSelected] = useState(() => new Set())
  const [selectAllMatching, setSelectAllMatching] = useState(false)
  const [moving, setMoving] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, limit: 20 })
  const [deletingId, setDeletingId] = useState(null)
  const [pdfId, setPdfId] = useState(null)
  const [particularId, setParticularId] = useState(null)

  const handleDownloadPdf = async (item) => {
    try {
      setPdfId(item._id)
      const res = await axios.get(`${API_URL}/api/vehicle-info/history/${item._id}/rc-pdf`, {
        withCredentials: true,
        responseType: 'blob'
      })
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      const a = document.createElement('a')
      a.href = url
      a.download = `RC-${String(item.vehicleNumber || 'vehicle').replace(/[^A-Za-z0-9]/g, '')}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('RC PDF error:', err)
      toast.error('Failed to generate RC PDF')
    } finally {
      setPdfId(null)
    }
  }

  const handleDownloadParticular = async (item) => {
    try {
      setParticularId(item._id)
      const res = await axios.get(`${API_URL}/api/vehicle-info/history/${item._id}/particular-pdf`, {
        withCredentials: true,
        responseType: 'blob'
      })
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      const a = document.createElement('a')
      a.href = url
      a.download = `${String(item.vehicleNumber || 'vehicle').replace(/[^A-Za-z0-9]/g, '')} Particular.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Particular PDF error:', err)
      toast.error('Failed to generate Particular PDF')
    } finally {
      setParticularId(null)
    }
  }
  const [quota, setQuota] = useState({ rcSearchLimit: 0, rcSearchCount: 0, rcSearchRemaining: 0 })

  const fetchHistory = async (page = currentPage, search = searchTerm, pageLimit = limit, type = searchType, activeFilters = filters) => {
    try {
      setLoading(true)
      // The list is about to change, so ticks from the old list no longer apply
      setSelected(new Set())
      setSelectAllMatching(false)
      let url = `${API_URL}/api/vehicle-info/history?page=${page}&limit=${pageLimit}&today=${toInputDate(new Date())}`
      if (search) {
        url += `&search=${encodeURIComponent(search)}&searchType=${encodeURIComponent(type)}`
      }
      if (activeFilters.docType !== 'all') url += `&docType=${activeFilters.docType}`
      if (activeFilters.expiry !== 'any') url += `&expiry=${activeFilters.expiry}`
      if (activeFilters.leadFilter !== 'all') url += `&leadFilter=${activeFilters.leadFilter}`

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
        if (response.data.quota) setQuota(response.data.quota)
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

  // Debounced live backend search: fires 400ms after user stops typing
  const debounceTimer = useRef(null)
  const handleSearchInputChange = (value) => {
    setSearchTerm(value)
    setCurrentPage(1)
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => {
      fetchHistory(1, value, limit, searchType)
    }, 400)
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    setCurrentPage(1)
    fetchHistory(1, searchTerm, limit, searchType)
  }

  const handleSearchTypeChange = (type) => {
    setSearchType(type)
    setCurrentPage(1)
    fetchHistory(1, searchTerm, limit, type)
  }

  const handleResetSearch = () => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    setSearchTerm('')
    setSearchType('all')
    setCurrentPage(1)
    fetchHistory(1, '', limit, 'all')
  }

  const hasFilters = filters.docType !== 'all' || filters.expiry !== 'any' || filters.leadFilter !== 'all'

  const handleFilterChange = (key, value) => {
    const next = { ...filters, [key]: value }
    setFilters(next)
    setCurrentPage(1)
    fetchHistory(1, searchTerm, limit, searchType, next)
  }

  // Clears the search box and every filter
  const handleResetAll = () => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    setSearchTerm('')
    setSearchType('all')
    setFilters(NO_FILTERS)
    setCurrentPage(1)
    fetchHistory(1, '', limit, 'all', NO_FILTERS)
  }

  // A vehicle that already has an open lead can't be moved again, so it can't be ticked
  const selectableIds = historyList.filter((item) => !item.lead?.isOpen).map((item) => item._id)
  const allOnPageSelected = selectableIds.length > 0 && selectableIds.every((id) => selected.has(id))
  const selectedCount = selectAllMatching ? pagination.total : selected.size

  const toggleAllOnPage = () => {
    setSelectAllMatching(false)
    setSelected(allOnPageSelected ? new Set() : new Set(selectableIds))
  }

  const toggleOne = (id) => {
    setSelectAllMatching(false)
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const clearSelection = () => {
    setSelected(new Set())
    setSelectAllMatching(false)
  }

  const handleMoveToLeads = async () => {
    if (!selectedCount) return
    if (selectAllMatching && !window.confirm(`Move all ${pagination.total} matching vehicles to Lead Management?`)) return
    try {
      setMoving(true)
      const res = await axios.post(
        `${API_URL}/api/vehicle-info/history/move-to-leads`,
        {
          ...filters,
          today: toInputDate(new Date()),
          ...(selectAllMatching ? { selectAll: true, search: searchTerm, searchType } : { ids: [...selected] })
        },
        { withCredentials: true }
      )
      const { moved = 0, alreadyInLeads = 0, noExpiryDate = 0 } = res.data
      const skipped = [
        alreadyInLeads ? `${alreadyInLeads} already in leads` : '',
        noExpiryDate ? `${noExpiryDate} skipped (no expiry date)` : ''
      ].filter(Boolean).join(', ')
      if (moved) {
        toast.success(`${moved} vehicle${moved > 1 ? 's' : ''} moved to Lead Management${skipped ? ` · ${skipped}` : ''}`)
      } else {
        toast.info(skipped ? `Nothing moved: ${skipped}` : 'Nothing to move')
      }
      fetchHistory(currentPage, searchTerm, limit, searchType)
    } catch (err) {
      console.error('Move to leads error:', err)
      toast.error(err.response?.data?.message || 'Failed to move vehicles to Lead Management')
    } finally {
      setMoving(false)
    }
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
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                  quota.rcSearchRemaining <= 0
                    ? 'bg-rose-100 text-rose-800 border-rose-300'
                    : quota.rcSearchRemaining <= 3
                    ? 'bg-amber-100 text-amber-800 border-amber-300'
                    : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${
                    quota.rcSearchRemaining <= 0 ? 'bg-rose-500 animate-ping' : quota.rcSearchRemaining <= 3 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}></span>
                  {quota.rcSearchRemaining} Limits Left
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                  Lifetime Searches: <b>{quota.rcSearchCount}</b>
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                  Total Limit: <b>{quota.rcSearchLimit}</b>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {canOpenLeads && (
              <button
                onClick={() => navigate('/leads')}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl shadow-sm text-xs sm:text-sm font-bold transition cursor-pointer"
              >
                <Users className="w-4 h-4" />
                Lead Management
              </button>
            )}
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
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
          {/* Search Type Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mr-1">Search by:</span>
            {[
              { key: 'all', label: 'All Fields' },
              { key: 'vehicleNumber', label: '🚗 Vehicle No' },
              { key: 'ownerName', label: '👤 Owner Name' },
              { key: 'rtoLocation', label: '📍 RTO Location' }
            ].map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => handleSearchTypeChange(opt.key)}
                className={`px-3 py-1 rounded-full text-[11px] font-bold border transition cursor-pointer ${
                  searchType === opt.key
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-indigo-400 hover:text-indigo-600'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Search input + actions */}
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              {loading
                ? <RefreshCw className="w-4 h-4 text-indigo-500 animate-spin absolute left-3.5 top-1/2 -translate-y-1/2" />
                : <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              }
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => handleSearchInputChange(e.target.value)}
                placeholder={
                  searchType === 'vehicleNumber' ? 'Type vehicle registration number (e.g. CG04AB1234)...'
                  : searchType === 'ownerName' ? 'Type owner name to search database...'
                  : searchType === 'rtoLocation' ? 'Type RTO location or district name...'
                  : 'Type to search database by vehicle no, owner name, RTO location, maker...'
                }
                className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:border-indigo-500 outline-none transition"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={handleResetSearch}
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
                  fetchHistory(1, searchTerm, newLimit, searchType)
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
                type="button"
                onClick={handleResetAll}
                className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition cursor-pointer"
                title="Reset search and filters"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </form>

          {/* Expiry + lead filters */}
          <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mr-1">Expiry filter:</span>
            <select
              value={filters.docType}
              onChange={(e) => handleFilterChange('docType', e.target.value)}
              className={filterSelectClass(filters.docType !== 'all')}
              aria-label="Document"
            >
              {DOC_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
            <select
              value={filters.expiry}
              onChange={(e) => handleFilterChange('expiry', e.target.value)}
              className={filterSelectClass(filters.expiry !== 'any')}
              aria-label="Expiry"
            >
              {EXPIRY_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
            <select
              value={filters.leadFilter}
              onChange={(e) => handleFilterChange('leadFilter', e.target.value)}
              className={filterSelectClass(filters.leadFilter !== 'all')}
              aria-label="Lead Management status"
            >
              {LEAD_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
            {hasFilters && (
              <button
                type="button"
                onClick={() => {
                  setFilters(NO_FILTERS)
                  setCurrentPage(1)
                  fetchHistory(1, searchTerm, limit, searchType, NO_FILTERS)
                }}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
              >
                Clear filters
              </button>
            )}
          </div>
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
              <h3 className="text-base font-bold text-slate-800 mb-1">{hasFilters ? 'No Vehicle Matches These Filters' : 'No Search History Found'}</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                {hasFilters
                  ? 'Try a longer expiry period or a different document.'
                  : searchTerm
                  ? 'No search history matches your query keyword.'
                  : 'You have not searched for any vehicle registration numbers yet.'}
              </p>
              <button
                onClick={hasFilters ? handleResetAll : () => navigate('/vehicle-details')}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition cursor-pointer"
              >
                {hasFilters ? 'Clear Filters' : 'Lookup a Vehicle Now'}
              </button>
            </div>
          ) : (
            <div>
              {/* Selection bar: move the ticked vehicles to Lead Management */}
              {canMoveToLeads && selectedCount > 0 && (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 bg-indigo-50 border-b border-indigo-100 text-xs sm:text-sm">
                  <span className="font-bold text-indigo-900">
                    {selectAllMatching ? `All ${pagination.total} matching vehicles selected` : `${selected.size} selected`}
                  </span>
                  {!selectAllMatching && allOnPageSelected && pagination.total > historyList.length && (
                    <button
                      type="button"
                      onClick={() => setSelectAllMatching(true)}
                      className="font-semibold text-indigo-700 hover:text-indigo-900 underline cursor-pointer"
                    >
                      Select all {pagination.total} matching vehicles
                    </button>
                  )}
                  <div className="flex items-center gap-3 ml-auto">
                    <button
                      type="button"
                      onClick={clearSelection}
                      className="font-semibold text-slate-600 hover:text-slate-800 cursor-pointer"
                    >
                      Clear
                    </button>
                    <button
                      type="button"
                      onClick={handleMoveToLeads}
                      disabled={moving}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm transition cursor-pointer disabled:opacity-60"
                    >
                      {moving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                      Move to Lead Management
                    </button>
                  </div>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider select-none">
                    <tr>
                      {canMoveToLeads && (
                        <th className="py-3.5 pl-4 pr-1 w-8">
                          <input
                            type="checkbox"
                            checked={selectAllMatching || allOnPageSelected}
                            onChange={toggleAllOnPage}
                            disabled={selectableIds.length === 0}
                            className="w-4 h-4 cursor-pointer accent-indigo-600 disabled:cursor-default"
                            aria-label="Select all on this page"
                          />
                        </th>
                      )}
                      <th className="py-3.5 px-4 text-center w-12">#</th>
                      <th className="py-3.5 px-4 min-w-[200px]">Vehicle & Owner</th>
                      <th className="py-3.5 px-4 min-w-[200px]">Maker & Model</th>
                      <th className="py-3.5 px-4 min-w-[160px] hidden md:table-cell">Registered RTO</th>
                      <th className="py-3.5 px-3 min-w-[110px] hidden lg:table-cell">Fitness Upto</th>
                      <th className="py-3.5 px-3 min-w-[110px] hidden lg:table-cell">Insurance Upto</th>
                      <th className="py-3.5 px-3 min-w-[110px] hidden xl:table-cell">Road Tax Upto</th>
                      <th className="py-3.5 px-3 min-w-[110px] hidden xl:table-cell">PUC Upto</th>
                      <th className="py-3.5 px-4 min-w-[170px]">Search Time</th>
                      <th className="py-3.5 px-4 text-right min-w-[130px] sticky right-0 bg-slate-50">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {historyList.map((item, index) => {
                      const serialNumber = (currentPage - 1) * limit + index + 1
                      const inLeads = Boolean(item.lead?.isOpen)
                      const isSelected = !inLeads && (selectAllMatching || selected.has(item._id))
                      // Documents that need attention: expired or 30 days or less left
                      const alerts = (item.documents || []).filter((doc) => doc.daysLeft <= 30)
                      return (
                        <tr
                          key={item._id}
                          className={`transition group ${isSelected ? 'bg-indigo-50/70' : 'hover:bg-indigo-50/40'}`}
                        >
                          {canMoveToLeads && (
                            <td className="py-3.5 pl-4 pr-1">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleOne(item._id)}
                                disabled={inLeads}
                                className="w-4 h-4 cursor-pointer accent-indigo-600 disabled:cursor-default"
                                aria-label={`Select ${item.vehicleNumber}`}
                                title={inLeads ? 'Already in Lead Management' : undefined}
                              />
                            </td>
                          )}

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
                              {/* Is this vehicle already in Lead Management? */}
                              {item.lead && (
                                inLeads ? (
                                  <button
                                    type="button"
                                    onClick={() => canOpenLeads && navigate('/leads')}
                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 ${canOpenLeads ? 'cursor-pointer hover:bg-emerald-200' : 'cursor-default'}`}
                                    title="This vehicle is already in Lead Management"
                                  >
                                    <CheckCircle2 className="w-3 h-3" />
                                    In Leads
                                  </button>
                                ) : (
                                  <span
                                    className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200"
                                    title="An earlier lead for this vehicle is closed, so it can be moved again"
                                  >
                                    Lead {item.lead.status === 'converted' ? 'converted' : 'lost'}
                                  </span>
                                )
                              )}
                              {/* Expiry alerts, for screens too narrow to show every date column */}
                              {alerts.length > 0 && (
                                <div className="flex flex-wrap gap-1 xl:hidden">
                                  {alerts.map((doc) => (
                                    <span
                                      key={doc.type}
                                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                        doc.daysLeft < 0 ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
                                      }`}
                                    >
                                      {doc.type === 'Tax' ? 'Road Tax' : doc.type}{' '}
                                      {doc.daysLeft < 0 ? 'expired' : doc.daysLeft === 0 ? 'today' : `${doc.daysLeft}d left`}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Maker & Model */}
                          <td className="py-3.5 px-4 text-slate-700">
                            <span className="font-medium text-[11px] sm:text-xs leading-snug break-words whitespace-normal block max-w-[240px]">
                              {item.makerModel || 'NA'}
                            </span>
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
                            <ExpiryCell item={item} type="Fitness" value={item.fitnessUpto} />
                          </td>

                          {/* Insurance */}
                          <td className="py-3.5 px-3 hidden lg:table-cell text-xs">
                            <ExpiryCell item={item} type="Insurance" value={item.insuranceUpto} />
                          </td>

                          {/* Tax */}
                          <td className="py-3.5 px-3 hidden xl:table-cell text-xs">
                            <ExpiryCell item={item} type="Tax" value={item.taxUpto} />
                          </td>

                          {/* PUC */}
                          <td className="py-3.5 px-3 hidden xl:table-cell text-xs">
                            <ExpiryCell item={item} type="PUC" value={item.pucUpto || item.rawResponse?.PUCC_UPTO || item.rawResponse?.PUC_UPTO} />
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
                                onClick={() => handleDownloadPdf(item)}
                                disabled={pdfId === item._id}
                                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer disabled:opacity-50"
                                title="Download RC PDF"
                              >
                                {pdfId === item._id ? (
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Download className="w-3.5 h-3.5" />
                                )}
                              </button>
                              <button
                                onClick={() => handleDownloadParticular(item)}
                                disabled={particularId === item._id}
                                className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition cursor-pointer disabled:opacity-50"
                                title="Download Particular PDF"
                              >
                                {particularId === item._id ? (
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <FileText className="w-3.5 h-3.5" />
                                )}
                              </button>
                              {rcFormTypes.length > 0 && <RcFormsMenu historyId={item._id} types={rcFormTypes} />}
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
