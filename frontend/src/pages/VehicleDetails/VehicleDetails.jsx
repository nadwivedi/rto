import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-toastify'
import {
  Search,
  History,
  Shield,
  FileText,
  User,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  Printer,
  Download,
  Share2,
  Sparkles,
  RefreshCw,
  Car,
  FileCheck,
  Building2,
  Fuel,
  Activity,
  Award,
  X,
  Database,
  ChevronLeft,
  ChevronRight,
  Save,
  Receipt,
  Leaf
} from 'lucide-react'

import { useAuth } from '../../context/AuthContext'
import RcFormModal from '../forms/components/RcFormModal'
import { HistoryCard } from './historyUi'
import { saveVehicleRecords } from '../../utils/saveVehicleRecords'

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'

// ---------- Small building blocks for the details page ----------

// Copy icon next to a value; turns into a green tick for 2s after copying
const CopyBtn = ({ value, field, copiedField, onCopy }) => {
  if (!value || value === 'NA') return null
  return (
    <button
      type="button"
      onClick={() => onCopy(value, field)}
      className="shrink-0 cursor-pointer rounded-md p-1 text-slate-300 transition hover:bg-slate-100 hover:text-blue-600 print:hidden"
      title={`Copy ${field}`}
    >
      {copiedField === field ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  )
}

// White panel with an icon title and label / value rows
const Panel = ({ icon, title, tone, badge, badgeTone = 'bg-slate-50 text-slate-600 ring-slate-200', children }) => {
  const Icon = icon
  return (
    <section className="rounded-2xl bg-white shadow-xs ring-1 ring-slate-200">
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
        <h3 className="flex items-center gap-2.5 text-sm font-semibold text-slate-900">
          <span className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br text-white shadow-sm ${tone}`}>
            <Icon className="h-4 w-4" />
          </span>
          {title}
        </h3>
        {badge && (
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${badgeTone}`}>{badge}</span>
        )}
      </div>
      <dl className="divide-y divide-slate-100 px-4">{children}</dl>
    </section>
  )
}

// One label / value line. stacked = label above value (for addresses and long text)
const Row = ({ label, value, mono, copy, stacked, valueClass = 'text-slate-800' }) => (
  <div className={`py-2.5 ${stacked ? '' : 'flex items-center justify-between gap-4'}`}>
    <dt className="shrink-0 text-xs text-slate-500">{label}</dt>
    <dd className={`flex min-w-0 items-center gap-1 text-[13px] font-semibold ${stacked ? 'mt-0.5 justify-between' : 'justify-end text-right'} ${mono ? 'font-mono tracking-wide' : ''} ${valueClass}`}>
      <span className={`min-w-0 break-words ${stacked ? 'font-medium leading-relaxed' : ''}`}>{value || 'NA'}</span>
      {copy}
    </dd>
  </div>
)

const VALIDITY_TONES = {
  ok: { card: 'from-emerald-50 to-teal-50 ring-emerald-200', icon: 'bg-emerald-600', value: 'text-emerald-800', chip: 'bg-emerald-600 text-white' },
  bad: { card: 'from-rose-50 to-pink-50 ring-rose-200', icon: 'bg-rose-600', value: 'text-rose-800', chip: 'bg-rose-600 text-white' },
  none: { card: 'from-slate-50 to-gray-50 ring-slate-200', icon: 'bg-slate-400', value: 'text-slate-500', chip: 'bg-slate-200 text-slate-600' }
}

// Tinted tile for one validity date (insurance / fitness / tax / PUC)
const ValidityTile = ({ icon, label, date, expired, okText = 'Valid', badText = 'Expired', hint }) => {
  const Icon = icon
  const known = date && date !== 'NA'
  const t = VALIDITY_TONES[!known ? 'none' : expired ? 'bad' : 'ok']
  return (
    <div className={`rounded-2xl bg-gradient-to-br p-3 ring-1 sm:p-3.5 ${t.card}`}>
      <div className="flex items-center justify-between gap-2">
        <span className={`flex h-8 w-8 items-center justify-center rounded-full text-white ${t.icon}`}>
          <Icon className="h-4 w-4" />
        </span>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${t.chip}`}>
          {!known ? 'No data' : expired ? badText : okText}
        </span>
      </div>
      <p className="mt-2.5 text-xs font-medium text-slate-600">{label}</p>
      <p className={`text-base font-bold leading-tight sm:text-lg ${t.value}`}>{known ? date : '—'}</p>
      {hint && <p className="mt-0.5 truncate text-[11px] text-slate-500" title={hint}>{hint}</p>}
    </div>
  )
}

// Toolbar button styles
const toolBtn = 'inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60'
const toolSecondary = `${toolBtn} border border-slate-300 bg-white text-slate-700 hover:bg-slate-100`
const toolPrimary = `${toolBtn} bg-gradient-to-r from-blue-700 to-blue-600 text-white shadow-md shadow-blue-700/20 hover:from-blue-800 hover:to-blue-700`

const chip = 'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset'

// A field the API actually sent (not empty, not its 'NA' placeholder)
const has = (value) => value !== undefined && value !== null && !/^(|na|n\/a)$/i.test(String(value).trim())
// '2739846' -> '₹27,39,846'
const formatRupees = (value) => {
  const n = Number(value)
  return Number.isFinite(n) ? `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}` : String(value)
}

const VehicleDetails = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const historyIdParam = searchParams.get('historyId')
  const { user } = useAuth()
  // RC forms are switched on per user from the admin panel (features.form23 / tempRc / nlParticular).
  // rcForm: { type: 'form23' | 'tempRc' | 'nlParticular', blank } - blank opens an empty form
  const canForm23 = user?.features?.form23 === true
  const canTempRc = user?.features?.tempRc === true
  const canNlParticular = user?.features?.nlParticular === true
  const rcFormTypes = [canForm23 && 'form23', canTempRc && 'tempRc', canNlParticular && 'nlParticular'].filter(Boolean)
  const BLANK_LABELS = { form23: 'Blank Form 23', tempRc: 'Blank Temp RC', nlParticular: 'Blank NL Particulars' }
  const [rcForm, setRcForm] = useState(null)
  // Save adds the vehicle to Vehicle Registration, Fitness, Insurance and PUC (switched on from admin: features.saveVehicleRecords)
  const canSaveRecords = user?.features?.saveVehicleRecords === true
  const [savingRecords, setSavingRecords] = useState(false)

  const [vehicleNo, setVehicleNo] = useState('')
  const [loading, setLoading] = useState(false)
  const [vehicleData, setVehicleData] = useState(null)
  const [dataSourceMeta, setDataSourceMeta] = useState(null) // { isLiveApi: boolean, isSavedData: boolean, lastSearchedAt: string }
  const [copiedField, setCopiedField] = useState(null)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [particularLoading, setParticularLoading] = useState(false)
  const [historyPdfId, setHistoryPdfId] = useState(null)
  const [historyParticularId, setHistoryParticularId] = useState(null)
  const printRef = useRef(null)
  const resultsTopRef = useRef(null)

  // Dedicated Bottom Search History State
  const [historyList, setHistoryList] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historySearch, setHistorySearch] = useState('')
  const [historyPage, setHistoryPage] = useState(1)
  const [historyPagination, setHistoryPagination] = useState({ total: 0, totalPages: 1, limit: 10 })
  const [deletingId, setDeletingId] = useState(null)
  const [quota, setQuota] = useState({
    rcDetailsEnabled: true,
    rcSearchLimit: 0,
    rcSearchCount: 0,
    rcSearchRemaining: 0,
    limitExhausted: false
  })

  const fetchQuota = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/vehicle-info/quota`, { withCredentials: true })
      if (res.data.success && res.data.data) {
        setQuota(res.data.data)
      }
    } catch (err) {
      console.error('Error fetching quota:', err)
    }
  }

  useEffect(() => {
    fetchQuota()
  }, [])


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
        if (response.data.quota) setQuota(response.data.quota)
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

  // While typing: once the number is 9+ characters, check the DB for an earlier lookup
  // (no RTO API call, no quota used) so the user knows before pressing Get Details.
  const [prevSearch, setPrevSearch] = useState(null) // { status: 'checking' | 'found' | 'new', vno, data }
  useEffect(() => {
    const vno = vehicleNo.replace(/[\s-]/g, '').toUpperCase()
    if (vno.length < 9 || vno.length > 19) {
      setPrevSearch(null)
      return
    }
    let cancelled = false
    setPrevSearch(prev => (prev?.vno === vno ? prev : { status: 'checking', vno }))
    const timer = setTimeout(async () => {
      try {
        const res = await axios.get(
          `${API_URL}/api/vehicle-info/history/check/${encodeURIComponent(vno)}`,
          { withCredentials: true }
        )
        if (cancelled) return
        setPrevSearch(
          res.data?.found
            ? { status: 'found', vno, data: res.data.data }
            : { status: 'new', vno }
        )
      } catch (err) {
        if (!cancelled) setPrevSearch(null)
      }
    }, 400)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [vehicleNo, dataSourceMeta])

  const formatLastSearched = (dateStr) => {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return ''
    const date = d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })
    const days = Math.floor((Date.now() - d.getTime()) / 86400000)
    const ago = days <= 0 ? 'today' : days === 1 ? 'yesterday' : `${days} days ago`
    return `${date} (${ago})`
  }

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
        if (response.data.rcSearchLimit !== undefined) {
          setQuota({
            rcDetailsEnabled: true,
            rcSearchLimit: response.data.rcSearchLimit,
            rcSearchCount: response.data.rcSearchCount,
            rcSearchRemaining: response.data.rcSearchRemaining,
            limitExhausted: response.data.rcSearchRemaining <= 0
          })
        }
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
      if (error.response?.data?.limitExhausted) {
        setQuota(prev => ({
          ...prev,
          rcSearchRemaining: 0,
          rcSearchLimit: error.response?.data?.rcSearchLimit ?? prev.rcSearchLimit,
          rcSearchCount: error.response?.data?.rcSearchCount ?? prev.rcSearchCount,
          limitExhausted: true
        }))
      }
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
📜 *Permit No:* ${vehicleData.PERMIT_NO || 'NA'}${vehicleData.PERMIT_TYPE && vehicleData.PERMIT_TYPE !== 'NA' ? ` (${vehicleData.PERMIT_TYPE})` : ''}${vehicleData.PERMIT_VALID_UPTO && vehicleData.PERMIT_VALID_UPTO !== 'NA' ? ` · Upto ${vehicleData.PERMIT_VALID_UPTO}` : ''}
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

  const saveBlob = (blob, vno) => {
    const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `RC-${String(vno || 'vehicle').replace(/[^A-Za-z0-9]/g, '')}.pdf`
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.URL.revokeObjectURL(url)
  }

  // RC PDF for the vehicle currently shown in results
  const handleDownloadPdf = async () => {
    if (!vehicleData) return
    try {
      setPdfLoading(true)
      const res = await axios.post(
        `${API_URL}/api/vehicle-info/rc-pdf`,
        { data: vehicleData },
        { withCredentials: true, responseType: 'blob' }
      )
      saveBlob(res.data, vehicleData.REGN_NO)
    } catch (err) {
      console.error('RC PDF error:', err)
      toast.error('Failed to generate RC PDF')
    } finally {
      setPdfLoading(false)
    }
  }

  // Vahan "Vehicle Particulars" PDF for the vehicle currently shown in results
  const handleDownloadParticular = async () => {
    if (!vehicleData) return
    try {
      setParticularLoading(true)
      const res = await axios.post(
        `${API_URL}/api/vehicle-info/particular-pdf`,
        { data: vehicleData },
        { withCredentials: true, responseType: 'blob' }
      )
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      const a = document.createElement('a')
      a.href = url
      a.download = `${String(vehicleData.REGN_NO || 'vehicle').replace(/[^A-Za-z0-9]/g, '')} Particular.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Particular PDF error:', err)
      toast.error('Failed to generate Particular PDF')
    } finally {
      setParticularLoading(false)
    }
  }

  // RC PDF for a recent-search row (from saved record, no API credit)
  const handleDownloadHistoryPdf = async (item) => {
    try {
      setHistoryPdfId(item._id)
      const res = await axios.get(`${API_URL}/api/vehicle-info/history/${item._id}/rc-pdf`, {
        withCredentials: true,
        responseType: 'blob'
      })
      saveBlob(res.data, item.vehicleNumber)
    } catch (err) {
      console.error('RC PDF error:', err)
      toast.error('Failed to generate RC PDF')
    } finally {
      setHistoryPdfId(null)
    }
  }

  // Particular PDF for a recent-search row (from saved record, no API credit)
  const handleDownloadHistoryParticular = async (item) => {
    try {
      setHistoryParticularId(item._id)
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
      setHistoryParticularId(null)
    }
  }

  // Saves the RC on screen into the user's sections with 0 fee (NO API call)
  const handleSaveRecords = async () => {
    if (!vehicleData) return
    setSavingRecords(true)
    await saveVehicleRecords({ data: vehicleData })
    setSavingRecords(false)
  }

  // Save for a recent-search row, from its saved record
  const [savingHistoryId, setSavingHistoryId] = useState(null)
  const handleSaveHistoryRecords = async (item) => {
    setSavingHistoryId(item._id)
    await saveVehicleRecords({ historyId: item._id })
    setSavingHistoryId(null)
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

  const v = vehicleData || {}
  const pucUpto = v.PUCC_UPTO || v.PUC_UPTO
  const policyNo = v.INS_POLICY_NO || v.POLICY_NO
  const isActive = (v.STATUS || 'ACTIVE') === 'ACTIVE'
  const quotaTone =
    quota.rcSearchRemaining <= 0
      ? 'bg-rose-500/15 text-rose-200 ring-rose-400/40'
      : quota.rcSearchRemaining <= 3
      ? 'bg-amber-500/15 text-amber-200 ring-amber-400/40'
      : 'bg-emerald-500/15 text-emerald-200 ring-emerald-400/40'
  const quotaDot =
    quota.rcSearchRemaining <= 0 ? 'bg-rose-400' : quota.rcSearchRemaining <= 3 ? 'bg-amber-400' : 'bg-emerald-400'
  const copyProps = { copiedField, onCopy: handleCopy }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800" style={{ fontFamily: "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <div className="mx-auto max-w-6xl space-y-4 px-3 pt-3 pb-10 sm:px-4 lg:pt-5">
        {/* ───── Dark header: title, quota and the number-plate search ───── */}
        <div
          ref={resultsTopRef}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#334155] p-4 shadow-[0_18px_42px_rgba(15,23,42,0.18)] sm:p-5 print:hidden"
        >
          <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-blue-500/25 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 left-1/4 h-48 w-48 rounded-full bg-cyan-400/10 blur-3xl" />

          <div className="relative">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate('/')}
                  className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg bg-white/10 text-slate-200 ring-1 ring-white/10 transition hover:bg-white/20 hover:text-white"
                  title="Back to Home"
                >
                  <ChevronLeft className="h-[18px] w-[18px]" />
                </button>
                <div>
                  <h1 className="text-lg font-bold leading-tight text-white sm:text-xl">Vehicle RC Details</h1>
                  <p className="mt-0.5 text-xs text-slate-400">Owner, registration, insurance, fitness, tax and PUC from RTO</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${quotaTone}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${quotaDot} ${quota.rcSearchRemaining <= 0 ? 'animate-pulse' : ''}`} />
                  {quota.rcSearchRemaining} searches left
                </span>
                <span className="text-[11px] text-slate-400">
                  Used <b className="text-slate-200">{quota.rcSearchCount}</b> of <b className="text-slate-200">{quota.rcSearchLimit}</b>
                </span>
                {!vehicleData && rcFormTypes.length > 0 && (
                  <button
                    onClick={() => setRcForm({ type: rcFormTypes[0], blank: true })}
                    className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg bg-white/10 px-3 text-xs font-semibold text-slate-100 ring-1 ring-white/10 transition hover:bg-white/20"
                  >
                    <FileCheck className="h-3.5 w-3.5" />
                    {rcFormTypes.length > 1 ? 'Blank RC Forms' : BLANK_LABELS[rcFormTypes[0]]}
                  </button>
                )}
              </div>
            </div>

            {/* Search */}
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleLiveSearch()
              }}
              className="mt-4 flex flex-col gap-2 sm:flex-row"
            >
              <div className="flex h-12 flex-1 items-center overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-white/20 transition focus-within:ring-4 focus-within:ring-blue-500/40">
                <span className="flex h-full select-none flex-col items-center justify-center bg-blue-800 px-2.5 text-[10px] font-black leading-tight text-white">
                  <span>🇮🇳</span>
                  <span>IND</span>
                </span>
                <input
                  type="text"
                  value={vehicleNo}
                  onChange={(e) => setVehicleNo(e.target.value.toUpperCase())}
                  placeholder="Enter vehicle number, e.g. CG04AB1234"
                  className="h-full min-w-0 flex-1 bg-transparent px-3.5 font-mono text-base font-bold uppercase tracking-widest text-slate-900 outline-none placeholder:font-sans placeholder:text-sm placeholder:font-normal placeholder:normal-case placeholder:tracking-normal placeholder:text-slate-400 sm:text-lg"
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
                    className="mr-2 cursor-pointer rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    title="Clear"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <button
                type="submit"
                disabled={loading || quota.rcSearchRemaining <= 0 || !vehicleNo.trim()}
                className="inline-flex h-12 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-6 text-sm font-semibold text-white shadow-lg shadow-blue-900/40 transition hover:from-blue-700 hover:to-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                {loading ? 'Searching RTO...' : 'Get Details'}
              </button>
            </form>

            {/* Earlier lookup check (from database, no API call) */}
            {prevSearch && (
              <div className="mt-2.5 text-xs">
                {prevSearch.status === 'checking' && (
                  <p className="flex items-center gap-1.5 text-slate-400">
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    Checking your search history…
                  </p>
                )}
                {prevSearch.status === 'new' && (
                  <p className="flex items-center gap-1.5 text-slate-300">
                    <Search className="h-3.5 w-3.5 text-slate-400" />
                    <span><b className="font-mono text-white">{prevSearch.vno}</b> has not been searched before. Get Details will use 1 search.</span>
                  </p>
                )}
                {prevSearch.status === 'found' && (
                  <div className="flex flex-col gap-2 rounded-xl bg-amber-400/10 px-3 py-2 ring-1 ring-amber-400/30 sm:flex-row sm:items-center sm:justify-between">
                    <p className="flex items-start gap-1.5 text-amber-100">
                      <History className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-300" />
                      <span>
                        Last searched on <b className="text-white">{formatLastSearched(prevSearch.data.lastSearchedAt)}</b>
                        {prevSearch.data.searchCount > 1 && <> · searched {prevSearch.data.searchCount} times</>}
                        {prevSearch.data.ownerName && <> · {prevSearch.data.ownerName}</>}
                      </span>
                    </p>
                    <button
                      type="button"
                      onClick={() => loadFromHistoryId(prevSearch.data._id)}
                      disabled={loading}
                      className="inline-flex h-8 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-amber-400 px-3 text-xs font-semibold text-slate-900 transition hover:bg-amber-300 disabled:opacity-50"
                    >
                      <Database className="h-3.5 w-3.5" />
                      View saved (free)
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Limit exhausted */}
        {quota.rcSearchRemaining <= 0 && (
          <div className="flex items-start gap-3 rounded-2xl bg-rose-50 p-3.5 ring-1 ring-rose-200 print:hidden">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rose-600 text-white">
              <AlertTriangle className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-semibold text-rose-900">Search limit used up</p>
              <p className="mt-0.5 text-xs text-rose-700">
                All <b>{quota.rcSearchLimit}</b> live searches are used. Saved vehicles below still open for free — ask your administrator to raise the limit.
              </p>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-xs ring-1 ring-slate-200">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <RefreshCw className="h-5 w-5 animate-spin" />
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-900">Fetching details from RTO…</p>
              <p className="text-xs text-slate-500">Registration, owner, fitness, insurance and tax records</p>
            </div>
          </div>
        )}

        {/* ───── Results ───── */}
        {vehicleData && !loading && (
          <div ref={printRef} className="space-y-4">
            {/* Summary card */}
            <div className="overflow-hidden rounded-2xl bg-white shadow-xs ring-1 ring-slate-200">
              {dataSourceMeta && (
                <div
                  className={`flex flex-col gap-2 px-4 py-2 text-xs sm:flex-row sm:items-center sm:justify-between print:hidden ${
                    dataSourceMeta.isSavedData ? 'bg-amber-50 text-amber-900' : 'bg-emerald-50 text-emerald-900'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    {dataSourceMeta.isSavedData ? <Database className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
                    <b className="font-semibold">{dataSourceMeta.isSavedData ? 'Saved record' : 'Live from RTO'}</b>
                    <span className="opacity-80">
                      · {formatDateTime(dataSourceMeta.lastSearchedAt)} · {dataSourceMeta.isSavedData ? 'no search used' : 'saved to history'}
                    </span>
                  </span>
                  {dataSourceMeta.isSavedData && (
                    <button
                      onClick={() => handleLiveSearch(vehicleData.REGN_NO || vehicleNo)}
                      disabled={loading}
                      className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 self-start rounded-md bg-amber-600 px-2.5 py-1 font-semibold text-white transition hover:bg-amber-700 sm:self-auto"
                    >
                      <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
                      Refresh from RTO
                    </button>
                  )}
                </div>
              )}

              <div className="flex flex-col gap-4 p-4 sm:p-5 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0 space-y-2.5">
                  {/* Number plate */}
                  <div className="inline-flex items-stretch overflow-hidden rounded-lg border-2 border-slate-900 bg-white shadow-sm">
                    <span className="flex select-none flex-col items-center justify-center bg-blue-800 px-2 text-[10px] font-black leading-tight text-white">
                      <span>🇮🇳</span>
                      <span>IND</span>
                    </span>
                    <span className="px-3.5 py-1 font-mono text-xl font-black tracking-widest text-slate-900 sm:text-2xl">
                      {v.REGN_NO || 'UNKNOWN'}
                    </span>
                    <span className="flex items-center border-l border-slate-200 px-1">
                      <CopyBtn value={v.REGN_NO} field="Reg No" {...copyProps} />
                    </span>
                  </div>

                  <div>
                    <h2 className="truncate text-lg font-bold text-slate-900 sm:text-xl">
                      {[v.MAKER_DESC, v.MAKER_MODEL].filter(Boolean).join(' ') || 'Vehicle'}
                    </h2>
                    <p className="mt-0.5 text-sm text-slate-500">
                      Owner <span className="font-semibold text-slate-800">{v.OWNER_NAME || 'NA'}</span>
                      {v.OWNER_SERIAL_NO && <span className="ml-2 text-xs text-slate-400">Owner #{v.OWNER_SERIAL_NO}</span>}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className={isActive ? chip + ' bg-emerald-50 text-emerald-700 ring-emerald-200' : chip + ' bg-rose-50 text-rose-700 ring-rose-200'}>
                      <CheckCircle2 className="h-3 w-3" />
                      {v.STATUS || 'ACTIVE'}
                    </span>
                    <span className={`${chip} bg-blue-50 text-blue-700 ring-blue-200`}>{v.VEHICLE_CLASS || v.BODY_TYPE_DESC || 'Vehicle'}</span>
                    {v.FUEL_DESC && (
                      <span className={`${chip} bg-amber-50 text-amber-700 ring-amber-200`}>
                        <Fuel className="h-3 w-3" />
                        {v.FUEL_DESC}
                      </span>
                    )}
                    {v.COLOR && <span className={`${chip} bg-slate-100 text-slate-600 ring-slate-200`}>{v.COLOR}</span>}
                    <span className={`${chip} bg-slate-100 text-slate-600 ring-slate-200`}>{String(v.IS_COMMERCIAL).toUpperCase() === 'TRUE' ? 'Commercial' : 'Private'}</span>
                  </div>
                </div>

                <div className="flex shrink-0 flex-row gap-2 md:flex-col md:items-end print:hidden">
                  <button onClick={handlePrint} className={toolPrimary}>
                    <Printer className="h-4 w-4" />
                    Print RC
                  </button>
                  <button onClick={handleDownloadPdf} disabled={pdfLoading} className={toolSecondary}>
                    {pdfLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4 text-rose-600" />}
                    {pdfLoading ? 'Generating…' : 'RC PDF'}
                  </button>
                </div>
              </div>

              {/* Toolbar */}
              <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 bg-slate-50/60 px-4 py-3 sm:px-5 print:hidden">
                <button onClick={handleDownloadParticular} disabled={particularLoading} className={toolSecondary}>
                  {particularLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4 text-amber-600" />}
                  {particularLoading ? 'Generating…' : 'Particular PDF'}
                </button>
                {canForm23 && (
                  <button onClick={() => setRcForm({ type: 'form23' })} className={toolSecondary}>
                    <FileCheck className="h-4 w-4 text-sky-600" />
                    Form 23
                  </button>
                )}
                {canTempRc && (
                  <button onClick={() => setRcForm({ type: 'tempRc' })} className={toolSecondary}>
                    <FileCheck className="h-4 w-4 text-sky-600" />
                    Temp RC
                  </button>
                )}
                {canNlParticular && (
                  <button onClick={() => setRcForm({ type: 'nlParticular' })} className={toolSecondary}>
                    <FileCheck className="h-4 w-4 text-sky-600" />
                    NL Particulars
                  </button>
                )}
                {canSaveRecords && (
                  <button
                    onClick={handleSaveRecords}
                    disabled={savingRecords}
                    title="Save to Vehicle Registration, Fitness, Insurance and PUC (fee 0)"
                    className={toolSecondary}
                  >
                    {savingRecords ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 text-violet-600" />}
                    {savingRecords ? 'Saving…' : 'Save Records'}
                  </button>
                )}
                <span className="mx-1 hidden h-5 w-px bg-slate-200 sm:block" />
                <button onClick={handleShareWhatsApp} className={toolSecondary}>
                  <Share2 className="h-4 w-4 text-emerald-600" />
                  WhatsApp
                </button>
                <button onClick={handleCopyAllSummary} className={toolSecondary}>
                  <Copy className="h-4 w-4 text-slate-500" />
                  Copy Summary
                </button>
              </div>
            </div>

            {/* Validity tiles */}
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <ValidityTile icon={Shield} label="Insurance" date={v.INSURANCE_UPTO} expired={isExpired(v.INSURANCE_UPTO)} okText="Covered" hint={v.INSURANCE_COMP} />
              <ValidityTile icon={FileCheck} label="Fitness" date={v.FIT_UPTO} expired={isExpired(v.FIT_UPTO)} />
              <ValidityTile icon={Receipt} label="Road Tax" date={v.TAX_UPTO} expired={isExpired(v.TAX_UPTO)} okText="Paid" badText="Due" />
              <ValidityTile icon={Leaf} label="PUC" date={pucUpto} expired={isExpired(pucUpto)} hint={v.PUCC_NO ? `PUCC ${v.PUCC_NO}` : undefined} />
            </div>

            {/* Detail panels */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Panel icon={User} title="Owner & Contact" tone="from-blue-600 to-indigo-500">
                <Row label="Owner name" value={v.OWNER_NAME} copy={<CopyBtn value={v.OWNER_NAME} field="Owner Name" {...copyProps} />} />
                <Row label="Father / Husband" value={v.F_NAME} />
                <Row
                  label="Mobile"
                  value={v.MOBILE_NO}
                  copy={<CopyBtn value={v.MOBILE_NO} field="Mobile" {...copyProps} />}
                />
                <Row
                  stacked
                  label="Present address"
                  value={v.PRESENT_ADDRESS}
                  copy={<CopyBtn value={v.PRESENT_ADDRESS} field="Address" {...copyProps} />}
                />
                {v.PERMANENT_ADDRESS && v.PERMANENT_ADDRESS !== v.PRESENT_ADDRESS && (
                  <Row stacked label="Permanent address" value={v.PERMANENT_ADDRESS} />
                )}
              </Panel>

              <Panel icon={Building2} title="Registration" tone="from-emerald-600 to-teal-500" badge="RTO Record" badgeTone="bg-emerald-50 text-emerald-700 ring-emerald-200">
                <Row label="Registered at" value={v.REGISTERED_AT} />
                <Row label="Registration date" value={v.REGN_DT} />
                {has(v.VEHICLE_AGE) && <Row label="Vehicle age" value={v.VEHICLE_AGE.replace(/\s+,/g, ',')} />}
                <Row label="Valid upto" value={v.REGN_UPTO} />
                <Row label="State / RTO code" value={`${v.STATE_CD || 'NA'} - ${v.RTO_CD || 'NA'}`} />
                <Row label="Category" value={`${v.VEHICLE_CATEGORY || 'NA'} (${v.VEHICLE_CLASS || 'NA'})`} />
                {has(v.PURCHASE_DT) && <Row label="Purchase date" value={v.PURCHASE_DT} />}
                {has(v.SALE_AMT) && <Row label="Sale amount" value={formatRupees(v.SALE_AMT)} />}
                {has(v.RTO_ADDRESS) && <Row stacked label="RTO office" value={v.RTO_ADDRESS} />}
                {has(v.RTO_PHONE) && <Row label="RTO phone" value={v.RTO_PHONE} />}
                {has(v.RTO_CITY) && <Row label="RTO city" value={v.RTO_CITY} />}
                {has(v.RTO_WEBSITE) && (
                  <Row
                    label="RTO website"
                    value={
                      <a href={v.RTO_WEBSITE} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">
                        {v.RTO_WEBSITE.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                      </a>
                    }
                  />
                )}
                {has(v.OWNERSHIP_CHANGE) && <Row label="Ownership changed" value={v.OWNERSHIP_CHANGE} />}
                <Row label="Record as on" value={v.STATUS_AS_ON || 'Current'} valueClass="text-slate-500" />
              </Panel>

              <Panel icon={Activity} title="Engine & Specs" tone="from-violet-600 to-fuchsia-500">
                <Row label="Chassis no" value={v.CHASI_NO} mono copy={<CopyBtn value={v.CHASI_NO} field="Chassis No" {...copyProps} />} />
                <Row label="Engine no" value={v.ENG_NO} mono copy={<CopyBtn value={v.ENG_NO} field="Engine No" {...copyProps} />} />
                <Row label="Cubic capacity" value={v.CUBIC_CAPACITY ? `${v.CUBIC_CAPACITY} cc` : 'NA'} />
                <Row label="Fuel norms" value={v.FUEL_NORMS} />
                <Row label="Mfg month / year" value={v.MANU_MONTH_YR} />
                <Row label="Seats / unladen wt" value={`${v.SEATING_CAPACITY || '2'} seats · ${v.UNLADEN_WEIGHT || 'NA'} kg`} />
                {has(v.LADEN_WEIGHT) && <Row label="Laden wt (GVW)" value={`${v.LADEN_WEIGHT} kg`} />}
                {(has(v.NO_OF_CYLINDERS) || has(v.WHEELBASE)) && (
                  <Row
                    label="Cylinders / wheelbase"
                    value={`${has(v.NO_OF_CYLINDERS) ? v.NO_OF_CYLINDERS : 'NA'} · ${has(v.WHEELBASE) ? `${v.WHEELBASE} mm` : 'NA'}`}
                  />
                )}
              </Panel>

              <Panel
                icon={Shield}
                title="Insurance"
                tone="from-sky-600 to-cyan-500"
                badge={isExpired(v.INSURANCE_UPTO) ? 'Expired' : 'Active'}
                badgeTone={isExpired(v.INSURANCE_UPTO) ? 'bg-rose-50 text-rose-700 ring-rose-200' : 'bg-sky-50 text-sky-700 ring-sky-200'}
              >
                <Row stacked label="Company" value={v.INSURANCE_COMP} />
                <Row label="Policy no" value={policyNo} mono copy={<CopyBtn value={policyNo} field="Policy No" {...copyProps} />} />
                <Row
                  label="Valid upto"
                  value={v.INSURANCE_UPTO}
                  valueClass={isExpired(v.INSURANCE_UPTO) ? 'text-rose-600' : 'text-emerald-700'}
                />
                {has(v.INSURANCE_STATUS) && <Row label="Status" value={v.INSURANCE_STATUS} />}
                {has(v.CLAIM_MADE) && <Row label="Claim made" value={v.CLAIM_MADE} />}
                {has(v.PREV_NCB) && <Row label="Previous NCB" value={`${v.PREV_NCB}%`} />}
              </Panel>

              <Panel icon={FileText} title="Financer & Permit" tone="from-orange-500 to-amber-500" badge="Hypothecation" badgeTone="bg-orange-50 text-orange-700 ring-orange-200">
                <Row stacked label="Financer / bank" value={v.FINANCER_DETAILS || 'No hypothecation (cash)'} />
                <Row label="Permit no" value={v.PERMIT_NO} />
                <Row label="Permit type" value={v.PERMIT_TYPE} />
                <Row label="Permit issue date" value={v.PERMIT_ISSUE_DATE} />
                {v.PERMIT_VALID_FROM && v.PERMIT_VALID_FROM !== 'NA' && <Row label="Permit valid from" value={v.PERMIT_VALID_FROM} />}
                <Row
                  label="Permit valid upto"
                  value={v.PERMIT_VALID_UPTO}
                  valueClass={
                    !v.PERMIT_VALID_UPTO || v.PERMIT_VALID_UPTO === 'NA'
                      ? 'text-slate-800'
                      : isExpired(v.PERMIT_VALID_UPTO) ? 'text-rose-600' : 'text-emerald-700'
                  }
                />
                {v.PERMIT_ISSUING_AUTHORITY && v.PERMIT_ISSUING_AUTHORITY !== 'NA' && (
                  <Row stacked label="Permit issued by" value={v.PERMIT_ISSUING_AUTHORITY} />
                )}
                <Row label="National permit" value={v.RC_NP_NO} />
              </Panel>

              <Panel icon={Award} title="Legal Status" tone="from-slate-600 to-slate-500">
                <Row
                  label="Blacklist"
                  value={v.BLACKLIST_STATUS || 'Clean'}
                  valueClass={v.BLACKLIST_STATUS && v.BLACKLIST_STATUS !== 'NA' ? 'text-rose-600' : 'text-emerald-700'}
                />
                <Row label="NOC details" value={v.NOC_DETAILS} />
                <Row label="Status" value={v.STATUS || 'ACTIVE'} valueClass={isActive ? 'text-emerald-700' : 'text-rose-600'} />
              </Panel>
            </div>

            {/* Next steps */}
            <div className="flex flex-col items-start justify-between gap-3 rounded-2xl bg-gradient-to-r from-blue-50 to-sky-50 p-4 ring-1 ring-blue-100 sm:flex-row sm:items-center print:hidden">
              <div>
                <p className="text-sm font-semibold text-slate-900">Add this vehicle to your records</p>
                <p className="text-xs text-slate-500">Open it in Vehicle Registration or make an insurance entry.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button onClick={() => navigate('/vehicle-registration')} className={toolPrimary}>
                  Vehicle Registration
                  <ChevronRight className="h-4 w-4" />
                </button>
                <button onClick={() => navigate('/insurance')} className={toolSecondary}>
                  <Shield className="h-4 w-4 text-sky-600" />
                  Insurance Entry
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!vehicleData && !loading && (
          <div className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-xs ring-1 ring-slate-200 sm:p-5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-500 text-white shadow-sm">
              <Car className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-900">Search a vehicle or open a saved one</p>
              <p className="text-xs text-slate-500">
                Type a registration number above for live RTO details, or open any vehicle from Recent Searches — saved ones don't use a search.
              </p>
            </div>
          </div>
        )}

        {/* ───── Recent searches ───── */}
        <section className="rounded-2xl bg-white shadow-xs ring-1 ring-slate-200 print:hidden">
          <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="flex items-center gap-2.5 text-sm font-semibold text-slate-900">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-slate-700 to-slate-500 text-white shadow-sm">
                <History className="h-4 w-4" />
              </span>
              Recent Searches
              <span className="rounded-full bg-slate-100 px-2 py-px text-[11px] font-semibold text-slate-600">{historyPagination.total}</span>
            </h3>
            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-64 sm:flex-none">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={historySearch}
                  onChange={(e) => {
                    setHistorySearch(e.target.value)
                    fetchHistory(1, e.target.value)
                  }}
                  placeholder="Filter by vehicle no, owner..."
                  className="h-9 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-8 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
                />
                {historySearch && (
                  <button
                    type="button"
                    onClick={() => {
                      setHistorySearch('')
                      fetchHistory(1, '')
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer p-1 text-slate-400 hover:text-slate-700"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <button
                onClick={() => fetchHistory(1, historySearch)}
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-slate-300 text-slate-500 transition hover:bg-slate-100"
                title="Refresh"
              >
                <RefreshCw className={`h-4 w-4 ${historyLoading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => navigate('/vehicle-search-history')}
                className="inline-flex h-9 cursor-pointer items-center gap-1 whitespace-nowrap rounded-lg px-2 text-xs font-semibold text-blue-700 hover:bg-blue-50"
              >
                View all
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="p-4">
            {historyLoading ? (
              <div className="flex items-center justify-center gap-2 py-8 text-sm text-slate-500">
                <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
                Loading saved searches…
              </div>
            ) : historyList.length === 0 ? (
              <div className="rounded-xl bg-slate-50 py-8 text-center">
                <p className="text-sm font-semibold text-slate-700">No saved searches yet</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {historySearch ? 'Nothing matches your filter.' : 'Vehicles you search are saved here automatically.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                {historyList.map((item) => (
                  <HistoryCard
                    key={item._id}
                    item={item}
                    onView={() => handleViewSavedRecord(item)}
                    onSave={() => handleSaveHistoryRecords(item)}
                    onRcPdf={() => handleDownloadHistoryPdf(item)}
                    onParticular={() => handleDownloadHistoryParticular(item)}
                    onDelete={() => handleDeleteHistoryItem(item._id, item.vehicleNumber)}
                    canSave={canSaveRecords}
                    rcFormTypes={rcFormTypes}
                    saving={savingHistoryId === item._id}
                    pdfLoading={historyPdfId === item._id}
                    particularLoading={historyParticularId === item._id}
                    deleting={deletingId === item._id}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      {rcForm && rcFormTypes.includes(rcForm.type) && (
        <RcFormModal
          key={`${rcForm.type}-${rcForm.blank ? 'blank' : vehicleData?.REGN_NO}`}
          type={rcForm.type}
          types={rcFormTypes}
          vehicleData={rcForm.blank ? null : vehicleData}
          onClose={() => setRcForm(null)}
        />
      )}
    </div>
  )
}

export default VehicleDetails
