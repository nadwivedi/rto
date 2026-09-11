import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-toastify'
import {
  Search,
  ArrowLeft,
  Home,
  History,
  Truck,
  Shield,
  FileText,
  User,
  MapPin,
  Phone,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  Printer,
  Share2,
  Sparkles,
  RefreshCw,
  Info,
  Car,
  FileCheck,
  Building2,
  Fuel,
  Activity,
  Award,
  Layers,
  X,
  Trash2,
  Eye,
  Database,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'

const VehicleDetails = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const historyIdParam = searchParams.get('historyId')

  const [vehicleNo, setVehicleNo] = useState('')
  const [loading, setLoading] = useState(false)
  const [vehicleData, setVehicleData] = useState(null)
  const [dataSourceMeta, setDataSourceMeta] = useState(null) // { isLiveApi: boolean, isSavedData: boolean, lastSearchedAt: string }
  const [copiedField, setCopiedField] = useState(null)
  const printRef = useRef(null)
  const resultsTopRef = useRef(null)

  // Dedicated Bottom Search History State
  const [historyList, setHistoryList] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historySearch, setHistorySearch] = useState('')
  const [historyPage, setHistoryPage] = useState(1)
  const [historyPagination, setHistoryPagination] = useState({ total: 0, totalPages: 1, limit: 10 })
  const [deletingId, setDeletingId] = useState(null)


  // Load history from database
  const fetchHistory = async (page = 1, search = historySearch) => {
    try {
      setHistoryLoading(true)
      let url = `${API_URL}/api/vehicle-info/history?page=${page}&limit=10`
      if (search) {
        url += `&search=${encodeURIComponent(search)}`
      }

      const response = await axios.get(url, { withCredentials: true })
      if (response.data.success) {
        setHistoryList(response.data.data || [])
        setHistoryPagination(response.data.pagination || { total: 0, totalPages: 1, limit: 10 })
      }
    } catch (error) {
      console.error('Error fetching search history:', error)
    } finally {
      setHistoryLoading(false)
    }
  }

  useEffect(() => {
    fetchHistory(historyPage, historySearch)
  }, [historyPage])

  // If historyId passed in URL query, load directly from DB (NO API CALL)
  useEffect(() => {
    if (historyIdParam) {
      loadFromHistoryId(historyIdParam)
    }
  }, [historyIdParam])

  // MANUAL Live RTO API Search (Only triggered when user enters number and clicks search)
  const handleLiveSearch = async (targetVno) => {
    const vnoToSearch = (targetVno || vehicleNo).trim().replace(/[\s-]/g, '').toUpperCase()
    if (!vnoToSearch) {
      toast.warn('Please enter a vehicle registration number')
      return
    }

    setLoading(true)
    setVehicleData(null)
    setDataSourceMeta(null)

    try {
      const response = await axios.get(
        `${API_URL}/api/vehicle-info/lookup?vno=${encodeURIComponent(vnoToSearch)}`,
        { withCredentials: true }
      )

      if (response.data.success && response.data.data) {
        setVehicleData(response.data.data)
        setDataSourceMeta({
          isLiveApi: true,
          isSavedData: false,
          lastSearchedAt: new Date().toISOString()
        })
        toast.success(`Live details loaded from RTO for ${response.data.data.REGN_NO || vnoToSearch}`)
        fetchHistory(1, historySearch) // refresh bottom history table

        if (resultsTopRef.current) {
          resultsTopRef.current.scrollIntoView({ behavior: 'smooth' })
        }
      } else {
        toast.error(response.data.message || 'Vehicle details not found')
      }
    } catch (error) {
      console.error('Vehicle lookup error:', error)
      const msg =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        'Failed to fetch vehicle details'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  // Load Saved Details from Database Record (ZERO API CALLS)
  const handleViewSavedRecord = (record) => {
    if (!record) return

    if (record.rawResponse && Object.keys(record.rawResponse).length > 0) {
      setVehicleData(record.rawResponse)
      setVehicleNo(record.vehicleNumber)
      setDataSourceMeta({
        isLiveApi: false,
        isSavedData: true,
        _id: record._id,
        vehicleNumber: record.vehicleNumber,
        lastSearchedAt: record.lastSearchedAt || record.updatedAt
      })
      toast.info(`Loaded saved details for ${record.vehicleNumber} from database`)

      if (resultsTopRef.current) {
        resultsTopRef.current.scrollIntoView({ behavior: 'smooth' })
      }
    } else {
      // Fetch the full record by ID from DB (NO API CALL)
      loadFromHistoryId(record._id)
    }
  }

  const loadFromHistoryId = async (id) => {
    try {
      setLoading(true)
      const res = await axios.get(`${API_URL}/api/vehicle-info/history/${id}`, {
        withCredentials: true
      })
      if (res.data.success && res.data.data) {
        setVehicleData(res.data.data)
        if (res.data.historyMeta) {
          setVehicleNo(res.data.historyMeta.vehicleNumber || '')
          setDataSourceMeta({
            isLiveApi: false,
            isSavedData: true,
            _id: res.data.historyMeta._id,
            vehicleNumber: res.data.historyMeta.vehicleNumber,
            lastSearchedAt: res.data.historyMeta.lastSearchedAt
          })
        }
        toast.info('Loaded saved record from database (No API call used)')
        if (resultsTopRef.current) {
          resultsTopRef.current.scrollIntoView({ behavior: 'smooth' })
        }
      } else {
        toast.error('Could not load saved record from database')
      }
    } catch (err) {
      console.error('Error loading history record:', err)
      toast.error('Failed to load saved history record')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteHistoryItem = async (id, vno) => {
    if (!window.confirm(`Delete ${vno} from your saved search history?`)) return
    try {
      setDeletingId(id)
      const res = await axios.delete(`${API_URL}/api/vehicle-info/history/${id}`, {
        withCredentials: true
      })
      if (res.data.success) {
        toast.success(`Deleted ${vno} from history`)
        fetchHistory(historyPage, historySearch)
        if (dataSourceMeta?._id === id) {
          setDataSourceMeta((prev) => (prev ? { ...prev, isSavedData: false } : null))
        }
      }
    } catch (err) {
      console.error('Delete error:', err)
      toast.error('Failed to delete record')
    } finally {
      setDeletingId(null)
    }
  }

  const handleCopy = (text, fieldKey) => {

    if (!text || text === 'NA') return
    navigator.clipboard.writeText(text)
    setCopiedField(fieldKey)
    toast.info(`Copied ${fieldKey}: ${text}`)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const handleCopyAllSummary = () => {
    if (!vehicleData) return
    const text = `🚗 *VEHICLE RC DETAILS*
━━━━━━━━━━━━━━━━━━━━
📌 *Reg No:* ${vehicleData.REGN_NO || 'NA'}
👤 *Owner:* ${vehicleData.OWNER_NAME || 'NA'}
👨‍👦 *Father:* ${vehicleData.F_NAME || 'NA'}
📱 *Mobile:* ${vehicleData.MOBILE_NO || 'NA'}
🏢 *RTO:* ${vehicleData.REGISTERED_AT || 'NA'}
🗓️ *Reg Date:* ${vehicleData.REGN_DT || 'NA'} (Valid upto ${vehicleData.REGN_UPTO || 'NA'})
━━━━━━━━━━━━━━━━━━━━
🚘 *Maker/Model:* ${vehicleData.MAKER_DESC || ''} ${vehicleData.MAKER_MODEL || ''}
🎨 *Color / Fuel:* ${vehicleData.COLOR || 'NA'} | ${vehicleData.FUEL_DESC || 'NA'}
🔢 *Chassis No:* ${vehicleData.CHASI_NO || 'NA'}
⚙️ *Engine No:* ${vehicleData.ENG_NO || 'NA'}
━━━━━━━━━━━━━━━━━━━━
🛡️ *Insurance:* ${vehicleData.INSURANCE_COMP || 'NA'} (Upto ${vehicleData.INSURANCE_UPTO || 'NA'})
📄 *Policy No:* ${vehicleData.POLICY_NO || vehicleData.INS_POLICY_NO || 'NA'}
✅ *Fitness Upto:* ${vehicleData.FIT_UPTO || 'NA'}
💰 *Tax Upto:* ${vehicleData.TAX_UPTO || 'NA'}
🌱 *PUC Upto:* ${vehicleData.PUCC_UPTO || vehicleData.PUC_UPTO || 'NA'}
🏦 *Financer:* ${vehicleData.FINANCER_DETAILS || 'NA'}
📜 *Permit No:* ${vehicleData.PERMIT_NO || 'NA'}
━━━━━━━━━━━━━━━━━━━━
📍 *Address:* ${vehicleData.PRESENT_ADDRESS || vehicleData.PERMANENT_ADDRESS || 'NA'}`

    navigator.clipboard.writeText(text)
    toast.success('Complete RC summary copied to clipboard!')
  }

  const handleShareWhatsApp = () => {
    if (!vehicleData) return
    const summary = `*VEHICLE RC DETAILS: ${vehicleData.REGN_NO || ''}*\nOwner: ${vehicleData.OWNER_NAME || 'NA'}\nModel: ${vehicleData.MAKER_MODEL || 'NA'}\nFitness: ${vehicleData.FIT_UPTO || 'NA'}\nInsurance: ${vehicleData.INSURANCE_UPTO || 'NA'}\nTax: ${vehicleData.TAX_UPTO || 'NA'}\nPUC: ${vehicleData.PUCC_UPTO || vehicleData.PUC_UPTO || 'NA'}`
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(summary)}`, '_blank')
  }

  const handlePrint = () => {
    window.print()
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
      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 space-y-6">
        {/* Page Top Header */}
        <div ref={resultsTopRef} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/')}
              className="p-2.5 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 shadow-sm text-slate-600 transition cursor-pointer"
              title="Back to Home"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="ml-1">

              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
                  <Truck className="w-6 h-6 text-indigo-600" />
                  Vehicle RC Details
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700 border border-indigo-200">
                  RTO System
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Manual live search & saved database records for vehicle specifications, owner, insurance & tax
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto print:hidden">
            {vehicleData && (
              <>
                <button
                  onClick={handleCopyAllSummary}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl border border-slate-200 shadow-sm text-xs font-semibold transition cursor-pointer"
                >
                  <Copy className="w-4 h-4 text-slate-500" />
                  Copy Summary
                </button>
                <button
                  onClick={handleShareWhatsApp}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl border border-emerald-200 shadow-sm text-xs font-semibold transition cursor-pointer"
                >
                  <Share2 className="w-4 h-4 text-emerald-600" />
                  WhatsApp
                </button>
                <button
                  onClick={handlePrint}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm text-xs font-semibold transition cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  Print RC
                </button>
              </>
            )}
          </div>
        </div>

        {/* MANUAL SEARCH HERO CARD (Clean - No clutter near search) */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-sm print:hidden">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleLiveSearch()
            }}
            className="flex flex-col md:flex-row gap-3 items-stretch md:items-center"
          >
            {/* Indian Plate Styled Input Wrapper */}
            <div className="relative flex-1 flex items-center bg-slate-50 border-2 border-slate-300 focus-within:border-indigo-500 focus-within:bg-white rounded-xl transition shadow-inner">
              <div className="flex items-center gap-1 px-3 py-2.5 bg-slate-200/80 border-r border-slate-300 rounded-l-[10px] text-slate-700 select-none">
                <span className="text-[11px] font-black tracking-tighter text-blue-900 flex flex-col items-center leading-none">
                  <span>🇮🇳</span>
                  <span>IND</span>
                </span>
              </div>
              <input
                type="text"
                value={vehicleNo}
                onChange={(e) => setVehicleNo(e.target.value.toUpperCase())}
                placeholder="ENTER VEHICLE NUMBER (e.g. CG12BU5574, MH02AB1234)"
                className="w-full px-3.5 py-3 text-slate-900 font-mono font-bold tracking-wider text-base sm:text-lg uppercase bg-transparent outline-none placeholder:normal-case placeholder:font-sans placeholder:text-slate-400 placeholder:text-sm placeholder:tracking-normal"
                autoFocus
              />
              {vehicleNo && (
                <button
                  type="button"
                  onClick={() => {
                    setVehicleNo('')
                    setVehicleData(null)
                    setDataSourceMeta(null)
                  }}
                  className="p-2 text-slate-400 hover:text-slate-600 mr-2 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !vehicleNo.trim()}
              className="px-6 py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 disabled:opacity-50 text-white font-bold text-sm sm:text-base rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Searching Live RTO...</span>
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  <span>Get Vehicle Details</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Data Origin & Cache Notice Banner */}
        {vehicleData && dataSourceMeta && (
          <div
            className={`p-3.5 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs ${
              dataSourceMeta.isSavedData
                ? 'bg-amber-50 border-amber-200 text-amber-900'
                : 'bg-emerald-50 border-emerald-200 text-emerald-900'
            } print:hidden`}
          >
            <div className="flex items-center gap-2">
              {dataSourceMeta.isSavedData ? (
                <Database className="w-4 h-4 text-amber-700 shrink-0" />
              ) : (
                <Sparkles className="w-4 h-4 text-emerald-700 shrink-0" />
              )}
              <span>
                {dataSourceMeta.isSavedData ? (
                  <>
                    <strong>Showing Saved Database Record</strong> (Searched on:{' '}
                    {formatDateTime(dataSourceMeta.lastSearchedAt)}) • Zero API credits used
                  </>
                ) : (
                  <>
                    <strong>Live RTO Verified Data</strong> (Fetched:{' '}
                    {formatDateTime(dataSourceMeta.lastSearchedAt)}) • Saved to database
                  </>
                )}
              </span>
            </div>

            {dataSourceMeta.isSavedData && (
              <button
                onClick={() => handleLiveSearch(vehicleData.REGN_NO || vehicleNo)}
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg shadow-sm transition cursor-pointer shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Re-fetch Live from RTO</span>
              </button>
            )}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-2xl p-12 border border-slate-200 shadow-sm text-center">
            <div className="inline-flex p-4 bg-indigo-50 text-indigo-600 rounded-2xl mb-4 animate-bounce">
              <Truck className="w-10 h-10" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">
              Fetching Official RTO Vehicle Details
            </h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              Connecting to RTO database for registration specs, owner details, fitness, insurance, and tax records...
            </p>
          </div>
        )}

        {/* RESULTS CONTAINER */}
        {vehicleData && !loading && (
          <div ref={printRef} className="space-y-6">
            {/* HERO BADGE CARD */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-5 sm:p-7 shadow-xl border border-slate-700 relative overflow-hidden">
              <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-3">
                  {/* Plate Look */}
                  <div className="inline-flex items-center bg-white text-slate-900 border-2 border-slate-950 rounded-lg shadow-md overflow-hidden">
                    <div className="bg-blue-800 text-white px-2 py-1.5 flex flex-col items-center justify-center font-black text-[10px] leading-tight select-none">
                      <span>🇮🇳</span>
                      <span>IND</span>
                    </div>
                    <span className="px-4 py-1.5 text-xl sm:text-2xl font-black font-mono tracking-widest">
                      {vehicleData.REGN_NO || 'UNKNOWN'}
                    </span>
                    <button
                      onClick={() => handleCopy(vehicleData.REGN_NO, 'Reg No')}
                      className="px-2.5 py-2 hover:bg-slate-100 text-slate-500 border-l border-slate-200 cursor-pointer print:hidden"
                      title="Copy Reg No"
                    >
                      {copiedField === 'Reg No' ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                      {vehicleData.MAKER_DESC || ''} {vehicleData.MAKER_MODEL || ''}
                    </h2>
                    <p className="text-slate-300 text-xs sm:text-sm mt-1 flex flex-wrap items-center gap-3">
                      <span>
                        Owner:{' '}
                        <strong className="text-white font-semibold">
                          {vehicleData.OWNER_NAME || 'NA'}
                        </strong>
                      </span>
                      {vehicleData.OWNER_SERIAL_NO && (
                        <span className="px-2 py-0.5 rounded bg-white/10 text-slate-200 text-xs">
                          Owner #{vehicleData.OWNER_SERIAL_NO}
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Right Status Tags */}
                <div className="flex flex-wrap md:flex-col md:items-end gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                        vehicleData.STATUS === 'ACTIVE'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-red-500/20 text-red-300 border border-red-500/30'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Status: {vehicleData.STATUS || 'ACTIVE'}
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {vehicleData.VEHICLE_CLASS || vehicleData.BODY_TYPE_DESC || 'Vehicle'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <span className="flex items-center gap-1">
                      <Fuel className="w-3.5 h-3.5 text-amber-400" />
                      {vehicleData.FUEL_DESC || 'PETROL'}
                    </span>
                    <span>•</span>
                    <span>{vehicleData.COLOR || 'STANDARD'}</span>
                    <span>•</span>
                    <span className="capitalize">
                      {vehicleData.IS_COMMERCIAL === 'TRUE' ? 'Commercial' : 'Private'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* GRID OF DETAILS CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* CARD 1: OWNER & CONTACT */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                  <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm sm:text-base">
                    <User className="w-4 h-4 text-indigo-600" />
                    Owner & Contact Info
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                    Identity
                  </span>
                </div>

                <div className="space-y-3.5 text-xs sm:text-sm">
                  <div>
                    <span className="text-slate-400 text-[11px] font-medium block">Owner Full Name</span>
                    <div className="flex items-center justify-between mt-0.5 font-bold text-slate-900">
                      <span>{vehicleData.OWNER_NAME || 'NA'}</span>
                      <button
                        onClick={() => handleCopy(vehicleData.OWNER_NAME, 'Owner Name')}
                        className="text-slate-400 hover:text-indigo-600 cursor-pointer print:hidden"
                      >
                        {copiedField === 'Owner Name' ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-400 text-[11px] font-medium block">Father's / Husband's Name</span>
                    <span className="font-semibold text-slate-800 block mt-0.5">
                      {vehicleData.F_NAME || 'NA'}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 text-[11px] font-medium block">Mobile Number</span>
                    <div className="flex items-center justify-between mt-0.5 font-semibold text-slate-800">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        {vehicleData.MOBILE_NO || 'NA'}
                      </span>
                      {vehicleData.MOBILE_NO && vehicleData.MOBILE_NO !== 'NA' && (
                        <button
                          onClick={() => handleCopy(vehicleData.MOBILE_NO, 'Mobile')}
                          className="text-slate-400 hover:text-indigo-600 cursor-pointer print:hidden"
                        >
                          {copiedField === 'Mobile' ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-400 text-[11px] font-medium block">Present Address</span>
                    <div className="flex items-start justify-between gap-2 mt-0.5 text-slate-700">
                      <span className="text-xs leading-relaxed">{vehicleData.PRESENT_ADDRESS || 'NA'}</span>
                      <button
                        onClick={() => handleCopy(vehicleData.PRESENT_ADDRESS, 'Address')}
                        className="text-slate-400 hover:text-indigo-600 cursor-pointer shrink-0 print:hidden"
                      >
                        {copiedField === 'Address' ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {vehicleData.PERMANENT_ADDRESS &&
                    vehicleData.PERMANENT_ADDRESS !== vehicleData.PRESENT_ADDRESS && (
                      <div>
                        <span className="text-slate-400 text-[11px] font-medium block">Permanent Address</span>
                        <span className="text-xs leading-relaxed text-slate-700 block mt-0.5">
                          {vehicleData.PERMANENT_ADDRESS}
                        </span>
                      </div>
                    )}
                </div>
              </div>

              {/* CARD 2: REGISTRATION & RTO */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                  <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm sm:text-base">
                    <Building2 className="w-4 h-4 text-emerald-600" />
                    Registration & Authority
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">
                    RTO Record
                  </span>
                </div>

                <div className="space-y-3 text-xs sm:text-sm">
                  <div className="flex justify-between items-center py-1 border-b border-slate-50">
                    <span className="text-slate-500 font-medium">Registered At</span>
                    <span className="font-bold text-slate-900 text-right">
                      {vehicleData.REGISTERED_AT || 'NA'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-1 border-b border-slate-50">
                    <span className="text-slate-500 font-medium">Registration Date</span>
                    <span className="font-semibold text-slate-800">{vehicleData.REGN_DT || 'NA'}</span>
                  </div>

                  <div className="flex justify-between items-center py-1 border-b border-slate-50">
                    <span className="text-slate-500 font-medium">Registration Valid Upto</span>
                    <span className="font-semibold text-slate-800">{vehicleData.REGN_UPTO || 'NA'}</span>
                  </div>

                  <div className="flex justify-between items-center py-1 border-b border-slate-50">
                    <span className="text-slate-500 font-medium">State & RTO Code</span>
                    <span className="font-semibold text-slate-800">
                      {vehicleData.STATE_CD || 'NA'} - {vehicleData.RTO_CD || 'NA'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-1 border-b border-slate-50">
                    <span className="text-slate-500 font-medium">Vehicle Category</span>
                    <span className="font-semibold text-slate-800">
                      {vehicleData.VEHICLE_CATEGORY || 'NA'} ({vehicleData.VEHICLE_CLASS || 'NA'})
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-500 font-medium">Record As On</span>
                    <span className="font-medium text-slate-600">{vehicleData.STATUS_AS_ON || 'Current'}</span>
                  </div>
                </div>
              </div>

              {/* CARD 3: TECHNICAL & ENGINE SPECS */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                  <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm sm:text-base">
                    <Activity className="w-4 h-4 text-violet-600" />
                    Engine & Vehicle Specs
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-violet-50 text-violet-700">
                    Specs
                  </span>
                </div>

                <div className="space-y-3 text-xs sm:text-sm">
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 text-[11px] font-medium">Chassis Number</span>
                      <button
                        onClick={() => handleCopy(vehicleData.CHASI_NO, 'Chassis No')}
                        className="text-slate-400 hover:text-indigo-600 cursor-pointer print:hidden"
                      >
                        {copiedField === 'Chassis No' ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                    <div className="font-mono font-bold text-slate-900 tracking-wider text-xs sm:text-sm break-all">
                      {vehicleData.CHASI_NO || 'NA'}
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 text-[11px] font-medium">Engine Number</span>
                      <button
                        onClick={() => handleCopy(vehicleData.ENG_NO, 'Engine No')}
                        className="text-slate-400 hover:text-indigo-600 cursor-pointer print:hidden"
                      >
                        {copiedField === 'Engine No' ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                    <div className="font-mono font-bold text-slate-900 tracking-wider text-xs sm:text-sm break-all">
                      {vehicleData.ENG_NO || 'NA'}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 bg-slate-50 rounded-lg">
                      <span className="text-slate-400 block text-[10px]">Cubic Capacity</span>
                      <span className="font-bold text-slate-800">
                        {vehicleData.CUBIC_CAPACITY ? `${vehicleData.CUBIC_CAPACITY} cc` : 'NA'}
                      </span>
                    </div>
                    <div className="p-2 bg-slate-50 rounded-lg">
                      <span className="text-slate-400 block text-[10px]">Fuel Norms</span>
                      <span className="font-bold text-slate-800">{vehicleData.FUEL_NORMS || 'NA'}</span>
                    </div>
                    <div className="p-2 bg-slate-50 rounded-lg">
                      <span className="text-slate-400 block text-[10px]">Mfg Month/Year</span>
                      <span className="font-bold text-slate-800">{vehicleData.MANU_MONTH_YR || 'NA'}</span>
                    </div>
                    <div className="p-2 bg-slate-50 rounded-lg">
                      <span className="text-slate-400 block text-[10px]">Seating / Weight</span>
                      <span className="font-bold text-slate-800">
                        {vehicleData.SEATING_CAPACITY || '2'} Seats / {vehicleData.UNLADEN_WEIGHT || 'NA'} kg
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* CARD 4: INSURANCE & POLICY */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                  <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm sm:text-base">
                    <Shield className="w-4 h-4 text-blue-600" />
                    Insurance Policy Details
                  </h3>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      isExpired(vehicleData.INSURANCE_UPTO)
                        ? 'bg-red-50 text-red-700'
                        : 'bg-blue-50 text-blue-700'
                    }`}
                  >
                    {isExpired(vehicleData.INSURANCE_UPTO) ? 'Expired' : 'Active'}
                  </span>
                </div>

                <div className="space-y-3 text-xs sm:text-sm">
                  <div>
                    <span className="text-slate-400 text-[11px] font-medium block">Insurance Company</span>
                    <span className="font-bold text-slate-900 block mt-0.5">
                      {vehicleData.INSURANCE_COMP || 'NA'}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 text-[11px] font-medium block">Policy Number</span>
                    <div className="flex items-center justify-between mt-0.5 font-mono font-semibold text-slate-800">
                      <span>{vehicleData.INS_POLICY_NO || vehicleData.POLICY_NO || 'NA'}</span>
                      {(vehicleData.INS_POLICY_NO || vehicleData.POLICY_NO) && (
                        <button
                          onClick={() =>
                            handleCopy(
                              vehicleData.INS_POLICY_NO || vehicleData.POLICY_NO,
                              'Policy No'
                            )
                          }
                          className="text-slate-400 hover:text-indigo-600 cursor-pointer print:hidden"
                        >
                          {copiedField === 'Policy No' ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between items-center py-2 px-3 bg-blue-50/60 rounded-xl border border-blue-100">
                    <div>
                      <span className="text-blue-900/70 text-[10px] font-bold uppercase tracking-wider block">
                        Insurance Valid Upto
                      </span>
                      <span className="font-bold text-blue-900 text-sm">
                        {vehicleData.INSURANCE_UPTO || 'NA'}
                      </span>
                    </div>
                    {isExpired(vehicleData.INSURANCE_UPTO) ? (
                      <span className="px-2 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> Expired
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Covered
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* CARD 5: FITNESS, ROAD TAX & PUC */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                  <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm sm:text-base">
                    <FileCheck className="w-4 h-4 text-emerald-600" />
                    Fitness, Tax & PUC
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">
                    Compliance
                  </span>
                </div>

                <div className="space-y-3 text-xs sm:text-sm">
                  {/* Fitness */}
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 flex justify-between items-center">
                    <div>
                      <span className="text-slate-400 text-[10px] font-semibold uppercase block">
                        Fitness Valid Upto
                      </span>
                      <span className="font-bold text-slate-900">{vehicleData.FIT_UPTO || 'NA'}</span>
                    </div>
                    {isExpired(vehicleData.FIT_UPTO) ? (
                      <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-[11px] font-bold">
                        Expired
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[11px] font-bold">
                        Valid
                      </span>
                    )}
                  </div>

                  {/* Road Tax */}
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 flex justify-between items-center">
                    <div>
                      <span className="text-slate-400 text-[10px] font-semibold uppercase block">
                        Road Tax Paid Upto
                      </span>
                      <span className="font-bold text-slate-900">{vehicleData.TAX_UPTO || 'NA'}</span>
                    </div>
                    {isExpired(vehicleData.TAX_UPTO) ? (
                      <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-[11px] font-bold">
                        Due
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[11px] font-bold">
                        Paid
                      </span>
                    )}
                  </div>

                  {/* PUC */}
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 flex justify-between items-center">
                    <div>
                      <span className="text-slate-400 text-[10px] font-semibold uppercase block">
                        PUCC No & Valid Upto
                      </span>
                      <span className="font-bold text-slate-900">
                        {vehicleData.PUCC_NO ? `${vehicleData.PUCC_NO} - ` : ''}
                        {vehicleData.PUCC_UPTO || vehicleData.PUC_UPTO || 'NA'}
                      </span>
                    </div>
                    {isExpired(vehicleData.PUCC_UPTO || vehicleData.PUC_UPTO) ? (
                      <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-[11px] font-bold">
                        Expired
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[11px] font-bold">
                        Valid
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* CARD 6: FINANCER, PERMIT & LEGAL */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                  <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm sm:text-base">
                    <FileText className="w-4 h-4 text-amber-600" />
                    Financer, Permit & Legal
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-700">
                    Hypothecation
                  </span>
                </div>

                <div className="space-y-3 text-xs sm:text-sm">
                  <div>
                    <span className="text-slate-400 text-[11px] font-medium block">Financer / Bank Details</span>
                    <span className="font-bold text-slate-900 block mt-0.5">
                      {vehicleData.FINANCER_DETAILS || 'No Hypothecation (Cash)'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-1 border-b border-slate-50">
                    <span className="text-slate-500 font-medium">Permit Number</span>
                    <span className="font-semibold text-slate-800">{vehicleData.PERMIT_NO || 'NA'}</span>
                  </div>

                  <div className="flex justify-between items-center py-1 border-b border-slate-50">
                    <span className="text-slate-500 font-medium">Permit Issue Date</span>
                    <span className="font-semibold text-slate-800">{vehicleData.PERMIT_ISSUE_DATE || 'NA'}</span>
                  </div>

                  <div className="flex justify-between items-center py-1 border-b border-slate-50">
                    <span className="text-slate-500 font-medium">National Permit (RC NP)</span>
                    <span className="font-semibold text-slate-800">{vehicleData.RC_NP_NO || 'NA'}</span>
                  </div>

                  <div className="flex justify-between items-center py-1 border-b border-slate-50">
                    <span className="text-slate-500 font-medium">Blacklist Status</span>
                    <span
                      className={`font-bold ${
                        vehicleData.BLACKLIST_STATUS && vehicleData.BLACKLIST_STATUS !== 'NA'
                          ? 'text-red-600'
                          : 'text-emerald-600'
                      }`}
                    >
                      {vehicleData.BLACKLIST_STATUS || 'Clean (NA)'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-500 font-medium">NOC Details</span>
                    <span className="font-semibold text-slate-800">{vehicleData.NOC_DETAILS || 'NA'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* QUICK ACTIONS BANNER */}
            <div className="bg-gradient-to-r from-indigo-50 via-white to-sky-50 rounded-2xl p-5 border border-indigo-100 flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
              <div>
                <h4 className="font-bold text-indigo-950 text-sm sm:text-base">
                  Ready to manage or create entries for this vehicle?
                </h4>
                <p className="text-xs text-indigo-700/80 mt-0.5">
                  Save time by adding this vehicle directly to Vahan registration records or party ledger.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => navigate(`/vehicle-registration`)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition cursor-pointer"
                >
                  Manage in Vehicle Registration
                </button>
                <button
                  onClick={() => navigate(`/insurance`)}
                  className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Insurance Entry
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Empty state / instructions if no vehicle loaded */}
        {!vehicleData && !loading && (
          <div className="bg-white rounded-2xl p-8 sm:p-10 border border-slate-200 shadow-sm text-center">
            <div className="inline-flex p-4 bg-indigo-50 text-indigo-600 rounded-2xl mb-4">
              <Car className="w-10 h-10" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">
              Search Vehicle or View Saved History
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto">
              Enter any Indian vehicle registration number above to fetch live verified RTO details, or click on any
              saved vehicle from your search history below to view details without making external API calls.
            </p>
          </div>
        )}

        {/* DEDICATED SEARCH HISTORY SECTION AT THE BOTTOM (Top 10 Recent) */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm print:hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                <History className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  Recent 10 Vehicle Searches
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                    {historyPagination.total} Total Saved
                  </span>
                </h3>
                <p className="text-xs text-slate-500">
                  Click 'View Details' on any vehicle to view complete details from database (No API call required)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                onClick={() => fetchHistory(1, historySearch)}
                className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl border border-slate-200 transition cursor-pointer"
                title="Refresh Recent History"
              >
                <RefreshCw className={`w-4 h-4 ${historyLoading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => navigate('/vehicle-search-history')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl border border-indigo-200 transition cursor-pointer"
              >
                <span>View Full History ({historyPagination.total}) →</span>
              </button>
            </div>
          </div>

          {/* History Search/Filter Bar */}
          <div className="mb-4">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={historySearch}
                onChange={(e) => {
                  setHistorySearch(e.target.value)
                  fetchHistory(1, e.target.value)
                }}
                placeholder="Filter saved history by vehicle number, owner name, maker, location..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:border-indigo-500 outline-none transition"
              />
              {historySearch && (
                <button
                  type="button"
                  onClick={() => {
                    setHistorySearch('')
                    fetchHistory(1, '')
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* History Records Table / Cards */}
          {historyLoading ? (
            <div className="p-8 text-center text-slate-500 text-sm">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
              Loading saved search records...
            </div>
          ) : historyList.length === 0 ? (
            <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-sm font-semibold text-slate-700">No search records saved yet</p>
              <p className="text-xs text-slate-400 mt-0.5">
                {historySearch
                  ? 'No search history matches your filter keyword.'
                  : 'Vehicles you search using the box above will automatically be saved here in database.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs sm:text-sm border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Vehicle & Owner</th>
                      <th className="py-3 px-4 hidden md:table-cell">Maker & Model</th>
                      <th className="py-3 px-4 hidden lg:table-cell">Fitness / Ins. Upto</th>
                      <th className="py-3 px-4">Search Date & Time</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {historyList.map((item) => (
                      <tr key={item._id} className="hover:bg-indigo-50/40 transition">
                        <td className="py-3 px-4">
                          <div className="flex flex-col items-start gap-1">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-900 text-white rounded text-xs font-mono font-bold">
                              <span className="text-[9px] text-blue-300 font-sans">IND</span>
                              {item.vehicleNumber}
                            </span>
                            <div className="flex items-center gap-1 text-xs font-semibold text-slate-900">
                              <User className="w-3 h-3 text-indigo-500 shrink-0" />
                              <span className="line-clamp-1">{item.ownerName || 'NA'}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-600 hidden md:table-cell">
                          {item.makerModel || 'NA'}
                        </td>

                        <td className="py-3 px-4 text-slate-600 hidden lg:table-cell text-xs">
                          <div>
                            Fit: <span className="font-medium text-slate-800">{item.fitnessUpto || 'NA'}</span>
                          </div>
                          <div>
                            Ins: <span className="font-medium text-slate-800">{item.insuranceUpto || 'NA'}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-500 text-xs">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {formatDateTime(item.lastSearchedAt || item.updatedAt)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleViewSavedRecord(item)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs transition cursor-pointer shadow-sm"
                              title="View saved detail from database (No API call)"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              View Details
                            </button>
                            <button
                              onClick={() => handleDeleteHistoryItem(item._id, item.vehicleNumber)}
                              disabled={deletingId === item._id}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                              title="Delete from history"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Show All History Button */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <span className="text-slate-500">
                  Showing {Math.min(10, historyList.length)} most recent vehicle searches out of {historyPagination.total} total
                </span>
                <button
                  onClick={() => navigate('/vehicle-search-history')}
                  className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold rounded-xl shadow-sm hover:shadow transition flex items-center justify-center gap-2 cursor-pointer text-xs sm:text-sm"
                >
                  <History className="w-4 h-4" />
                  <span>Show All Vehicle Search History ({historyPagination.total}) →</span>
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

export default VehicleDetails
