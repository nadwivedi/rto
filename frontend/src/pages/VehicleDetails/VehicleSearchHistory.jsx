import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-toastify'
import {
  Search,
  ArrowLeft,
  History,
  Eye,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Car,
  X,
  CheckCircle2,
  UserPlus,
  Users,
  Save
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import RcFormsMenu from './RcFormsMenu'
import { ExpiryStatus } from './historyUi'
import { saveVehicleRecords } from '../../utils/saveVehicleRecords'
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
const SEARCH_TYPE_OPTIONS = [
  { value: 'all', label: 'All fields' },
  { value: 'vehicleNumber', label: 'Vehicle no' },
  { value: 'ownerName', label: 'Owner name' },
  { value: 'rtoLocation', label: 'RTO location' }
]

const filterSelectClass = (isActive) =>
  `px-3 py-2.5 border rounded-xl text-xs font-semibold outline-none cursor-pointer ${
    isActive ? 'bg-indigo-50 border-indigo-400 text-indigo-700' : 'bg-slate-50 border-slate-200 text-slate-700'
  }`

const VehicleSearchHistory = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  // Moving vehicles to leads adds records, so staff need the add permission and the leads section
  const isStaff = user?.type === 'staff'
  const canOpenLeads = !isStaff || user?.sections?.leads !== false
  const canMoveToLeads = !isStaff || (Boolean(user?.permissions?.add) && canOpenLeads)
  // RC forms the admin switched on for this user
  const rcFormTypes = ['form23', 'tempRc', 'nlParticular'].filter((t) => user?.features?.[t] === true)
  // Save to Vehicle Registration, Fitness, Insurance and PUC (switched on from admin)
  const canSaveRecords = user?.features?.saveVehicleRecords === true
  const [savingId, setSavingId] = useState(null)

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

  // Full details of a saved search, from the database (NO API call)
  const openDetail = (item) => navigate(`/vehicle-details?historyId=${item._id}`)

  const handleSave = async (item) => {
    setSavingId(item._id)
    await saveVehicleRecords({ historyId: item._id })
    setSavingId(null)
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
      <div className="max-w-6xl mx-auto px-3 sm:px-6 py-6 space-y-4">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/vehicle-details')}
              className="p-2.5 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 shadow-sm text-slate-600 transition cursor-pointer"
              title="Back to Vehicle Lookup"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="ml-1">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
                <History className="w-6 h-6 text-indigo-600" />
                Vehicle Search History
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                {pagination.total} saved ·{' '}
                <span className={`font-semibold ${quota.rcSearchRemaining <= 0 ? 'text-rose-600' : quota.rcSearchRemaining <= 3 ? 'text-amber-600' : 'text-emerald-600'}`}>
                  {quota.rcSearchRemaining} of {quota.rcSearchLimit} searches left
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {canOpenLeads && (
              <button
                onClick={() => navigate('/leads')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl shadow-sm text-xs sm:text-sm font-semibold transition cursor-pointer"
              >
                <Users className="w-4 h-4" />
                Leads
              </button>
            )}
            <button
              onClick={() => navigate('/vehicle-details')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm text-xs sm:text-sm font-semibold transition cursor-pointer"
            >
              <Search className="w-4 h-4" />
              New Search
            </button>
          </div>
        </div>

        {/* Search + filters in one bar */}
        <form
          onSubmit={handleSearchSubmit}
          className="bg-white rounded-2xl p-3 border border-slate-200 shadow-sm flex flex-wrap items-center gap-2"
        >
          <div className="relative flex-1 min-w-[220px]">
            {loading
              ? <RefreshCw className="w-4 h-4 text-indigo-500 animate-spin absolute left-3.5 top-1/2 -translate-y-1/2" />
              : <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            }
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => handleSearchInputChange(e.target.value)}
              placeholder="Search vehicle no, owner, RTO..."
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
          <select
            value={searchType}
            onChange={(e) => handleSearchTypeChange(e.target.value)}
            className={filterSelectClass(searchType !== 'all')}
            aria-label="Search by"
          >
            {SEARCH_TYPE_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
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
          {(hasFilters || searchTerm || searchType !== 'all') && (
            <button
              type="button"
              onClick={handleResetAll}
              className="px-2 text-xs font-semibold text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
            >
              Clear
            </button>
          )}
        </form>

        {/* List */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {loading && historyList.length === 0 ? (
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
                  <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider select-none">
                    <tr>
                      {canMoveToLeads && (
                        <th className="py-3 pl-4 pr-1 w-8">
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
                      <th className="py-3 px-4">Vehicle</th>
                      <th className="py-3 px-4 hidden sm:table-cell">Expiry</th>
                      <th className="py-3 px-4 hidden md:table-cell">Searched</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {historyList.map((item) => {
                      const inLeads = Boolean(item.lead?.isOpen)
                      const isSelected = !inLeads && (selectAllMatching || selected.has(item._id))
                      const searchedAt = item.lastSearchedAt || item.updatedAt
                      const busy = pdfId === item._id || particularId === item._id || deletingId === item._id
                      return (
                        <tr
                          key={item._id}
                          className={`transition ${isSelected ? 'bg-indigo-50/70' : 'hover:bg-slate-50'}`}
                        >
                          {canMoveToLeads && (
                            <td className="py-3 pl-4 pr-1">
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

                          {/* Vehicle no + owner; everything else is on the detail page */}
                          <td className="py-3 px-4">
                            <button
                              type="button"
                              onClick={() => openDetail(item)}
                              className="text-left cursor-pointer group"
                              title="View full details"
                            >
                              <span className="font-mono font-bold text-slate-900 tracking-wide group-hover:text-indigo-700">
                                {item.vehicleNumber}
                              </span>
                              <span className="block text-xs text-slate-500 line-clamp-1">{item.ownerName || 'NA'}</span>
                            </button>
                            <div className="flex flex-wrap items-center gap-1 mt-1">
                              {inLeads && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700">
                                  <CheckCircle2 className="w-3 h-3" />
                                  In Leads
                                </span>
                              )}
                              <div className="sm:hidden"><ExpiryStatus documents={item.documents} /></div>
                            </div>
                          </td>

                          <td className="py-3 px-4 hidden sm:table-cell">
                            <ExpiryStatus documents={item.documents} />
                          </td>

                          <td className="py-3 px-4 hidden md:table-cell text-xs text-slate-500 whitespace-nowrap" title={formatDateTime(searchedAt)}>
                            {formatDate(searchedAt)}
                          </td>

                          {/* Actions: View, Save, and the rest behind "..." */}
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => openDetail(item)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-lg text-xs transition cursor-pointer"
                                title="View full details (No API call)"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                View
                              </button>
                              {canSaveRecords && (
                                <button
                                  onClick={() => handleSave(item)}
                                  disabled={savingId === item._id}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-violet-50 hover:bg-violet-100 text-violet-700 font-semibold rounded-lg text-xs transition cursor-pointer disabled:opacity-50"
                                  title="Save to Vehicle Registration, Fitness, Insurance and PUC (fee 0)"
                                >
                                  {savingId === item._id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                                  Save
                                </button>
                              )}
                              {busy ? (
                                <span className="p-1.5"><RefreshCw className="w-4 h-4 animate-spin text-slate-400" /></span>
                              ) : (
                                <RcFormsMenu
                                  historyId={item._id}
                                  types={rcFormTypes}
                                  actions={[
                                    { label: 'Download RC PDF', onClick: () => handleDownloadPdf(item) },
                                    { label: 'Download Particular', onClick: () => handleDownloadParticular(item) },
                                    { label: 'Delete from history', danger: true, onClick: () => handleDeleteItem(item._id, item.vehicleNumber) }
                                  ]}
                                />
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Footer: count, rows per page, pages */}
              <div className="border-t border-slate-200 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-semibold text-slate-600">
                <div className="flex items-center gap-3">
                  <span>
                    {(currentPage - 1) * limit + 1}-{Math.min(currentPage * limit, pagination.total)} of {pagination.total}
                  </span>
                  <select
                    value={limit}
                    onChange={(e) => {
                      const newLimit = parseInt(e.target.value)
                      setLimit(newLimit)
                      setCurrentPage(1)
                      fetchHistory(1, searchTerm, newLimit, searchType)
                    }}
                    className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none cursor-pointer"
                    title="Rows per page"
                  >
                    <option value={10}>10 / page</option>
                    <option value={20}>20 / page</option>
                    <option value={50}>50 / page</option>
                    <option value={100}>100 / page</option>
                  </select>
                </div>

                {pagination.totalPages > 1 && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage <= 1}
                      className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 transition cursor-pointer"
                      aria-label="Previous page"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="px-2">
                      Page {currentPage} of {pagination.totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                      disabled={currentPage >= pagination.totalPages}
                      className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 transition cursor-pointer"
                      aria-label="Next page"
                    >
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
