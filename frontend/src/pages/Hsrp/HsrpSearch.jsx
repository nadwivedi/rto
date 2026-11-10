import React, { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { Search, Copy, Check, RefreshCw, History, Trash2, ShieldCheck, Car, Fuel, Calendar, Hash, MapPin, AlertTriangle, Loader2 } from 'lucide-react'

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'

// 'cg 04-ab 1234' -> 'CG04AB1234'
const cleanNumber = (raw) => String(raw || '').replace(/[\s-]/g, '').toUpperCase()
const real = (v) => v !== undefined && v !== null && String(v).trim() !== '' && !/^(na|n\/a|null|none|-)$/i.test(String(v).trim())
const show = (v) => (real(v) ? String(v) : '—')
const formatWhen = (value) =>
  value
    ? new Date(value).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : ''

const CopyButton = ({ value, label }) => {
  const [copied, setCopied] = useState(false)
  if (!real(value)) return null
  return (
    <button
      type='button'
      onClick={() => {
        navigator.clipboard?.writeText(String(value)).then(() => {
          setCopied(true)
          setTimeout(() => setCopied(false), 1500)
        })
      }}
      className='shrink-0 cursor-pointer rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-teal-700'
      title={`Copy ${label}`}
      aria-label={`Copy ${label}`}
    >
      {copied ? <Check className='h-4 w-4 text-emerald-600' /> : <Copy className='h-4 w-4' />}
    </button>
  )
}

// One front / rear plate laser code, shown big
const LaserCode = ({ side, code }) => (
  <div className='rounded-2xl bg-gradient-to-br from-teal-50 to-emerald-50 p-4 ring-1 ring-teal-200'>
    <p className='text-xs font-semibold uppercase tracking-wide text-teal-700'>{side} plate laser code</p>
    <div className='mt-1.5 flex items-center justify-between gap-2'>
      <p className='min-w-0 break-all font-mono text-lg font-bold tracking-wider text-slate-900 sm:text-xl'>{show(code)}</p>
      <CopyButton value={code} label={`${side.toLowerCase()} laser code`} />
    </div>
  </div>
)

const Detail = ({ icon, label, value, mono }) => {
  const Icon = icon
  return (
  <div className='flex items-start gap-3 py-2.5'>
    <span className='mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500'>
      <Icon className='h-4 w-4' />
    </span>
    <div className='min-w-0 flex-1'>
      <p className='text-xs text-slate-500'>{label}</p>
      <p className={`break-words text-sm font-semibold text-slate-800 ${mono ? 'font-mono tracking-wide' : ''}`}>{show(value)}</p>
    </div>
    {mono && <CopyButton value={value} label={label} />}
  </div>
  )
}

const HsrpResult = ({ result }) => {
  const d = result.data || {}
  const h = d.hsrp_response || {}
  const vehicleType = [h.vchType, h.vchCatg].filter(real).join(' · ')
  return (
    <div className='space-y-4'>
      <div className='rounded-2xl bg-white p-4 shadow-xs ring-1 ring-slate-200 sm:p-5'>
        <div className='flex flex-wrap items-start justify-between gap-3'>
          <div>
            <p className='text-xs font-semibold uppercase tracking-wide text-slate-500'>Vehicle number</p>
            <p className='mt-0.5 font-mono text-2xl font-extrabold tracking-wider text-slate-900 sm:text-3xl'>{show(d.regno || result.vehicleNumber)}</p>
            <p className='mt-1 text-sm text-slate-600'>{[h.maker, vehicleType].filter(real).join(' · ') || ' '}</p>
          </div>
          <div className='flex flex-col items-end gap-1'>
            <span className='inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200'>
              <ShieldCheck className='h-3.5 w-3.5' />
              {real(h.message) ? h.message : real(d.status) ? d.status : 'HSRP found'}
            </span>
            {result.fromHistory && result.when && <span className='text-[11px] text-slate-400'>Saved search · {formatWhen(result.when)}</span>}
          </div>
        </div>

        <div className='mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2'>
          <LaserCode side='Front' code={h.hsrpFrontLaserCode} />
          <LaserCode side='Rear' code={h.hsrpRearLaserCode} />
        </div>
      </div>

      <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
        <section className='rounded-2xl bg-white px-4 py-2 shadow-xs ring-1 ring-slate-200 sm:px-5'>
          <h3 className='border-b border-slate-100 py-2.5 text-sm font-semibold text-slate-900'>Vehicle</h3>
          <div className='divide-y divide-slate-100'>
            <Detail icon={Car} label='Maker' value={h.maker} />
            <Detail icon={Car} label='Vehicle type / category' value={vehicleType} />
            <Detail icon={Fuel} label='Fuel' value={h.fuel} />
            <Detail icon={ShieldCheck} label='Emission norms' value={h.norms} />
            <Detail icon={Calendar} label='Registration date' value={h.regnDate} />
          </div>
        </section>
        <section className='rounded-2xl bg-white px-4 py-2 shadow-xs ring-1 ring-slate-200 sm:px-5'>
          <h3 className='border-b border-slate-100 py-2.5 text-sm font-semibold text-slate-900'>Identification</h3>
          <div className='divide-y divide-slate-100'>
            <Detail icon={Hash} label='Chassis number' value={d.chassis} mono />
            <Detail icon={Hash} label='Engine number' value={d.engine} mono />
            <Detail icon={MapPin} label='State / RTO office code' value={[h.stateCd, h.offCd].filter(real).join(' · ')} />
          </div>
        </section>
      </div>
    </div>
  )
}

const HsrpSearch = () => {
  const [vno, setVno] = useState('')
  const [quota, setQuota] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [history, setHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(true)

  const loadQuota = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/api/hsrp/quota`, { withCredentials: true })
      if (res.data?.success) setQuota(res.data)
    } catch {
      // The search itself reports a missing limit
    }
  }, [])

  const loadHistory = useCallback(async () => {
    try {
      setHistoryLoading(true)
      const res = await axios.get(`${API_URL}/api/hsrp/history?limit=20`, { withCredentials: true })
      if (res.data?.success) setHistory(res.data.data || [])
    } catch {
      setHistory([])
    } finally {
      setHistoryLoading(false)
    }
  }, [])

  useEffect(() => {
    loadQuota()
    loadHistory()
  }, [loadQuota, loadHistory])

  const left = quota?.hsrpSearchRemaining ?? null
  const number = cleanNumber(vno)
  const saved = history.find((h) => h.vehicleNumber === number)

  const search = async (e) => {
    e?.preventDefault()
    if (number.length < 4) {
      setError('Please enter a valid vehicle number, e.g. CG04AB1234')
      return
    }
    if (saved && !window.confirm(`${number} was already searched on ${formatWhen(saved.lastSearchedAt)}.\n\nSearch again? This uses 1 HSRP search. (Cancel shows the saved details.)`)) {
      setResult({ data: saved.data, vehicleNumber: saved.vehicleNumber, fromHistory: true, when: saved.lastSearchedAt })
      setError('')
      return
    }
    try {
      setLoading(true)
      setError('')
      const res = await axios.get(`${API_URL}/api/hsrp/lookup`, { params: { vno: number }, withCredentials: true })
      if (res.data?.success) {
        setResult({ data: res.data.data, vehicleNumber: res.data.vehicleNumber })
        setQuota((q) => ({ ...(q || {}), hsrpSearchLimit: res.data.hsrpSearchLimit, hsrpSearchCount: res.data.hsrpSearchCount, hsrpSearchRemaining: res.data.hsrpSearchRemaining }))
        toast.success('HSRP details fetched')
        loadHistory()
      }
    } catch (err) {
      const data = err.response?.data
      setResult(null)
      setError(data?.message || 'Failed to fetch HSRP details. Please try again.')
      if (data && data.hsrpSearchRemaining !== undefined) {
        setQuota((q) => ({ ...(q || {}), hsrpSearchLimit: data.hsrpSearchLimit, hsrpSearchCount: data.hsrpSearchCount, hsrpSearchRemaining: data.hsrpSearchRemaining }))
      }
    } finally {
      setLoading(false)
    }
  }

  const removeHistory = async (item) => {
    if (!window.confirm(`Remove ${item.vehicleNumber} from your HSRP history?`)) return
    try {
      await axios.delete(`${API_URL}/api/hsrp/history/${item._id}`, { withCredentials: true })
      setHistory((list) => list.filter((h) => h._id !== item._id))
    } catch {
      toast.error('Failed to remove')
    }
  }

  return (
    <div className='min-h-screen bg-slate-50 px-3 pb-10 pt-4 sm:px-6 sm:pt-6'>
      <div className='mx-auto max-w-5xl space-y-4 sm:space-y-5'>
        {/* Header */}
        <div className='flex flex-wrap items-end justify-between gap-3'>
          <div>
            <h1 className='text-xl font-bold text-slate-900 sm:text-2xl'>HSRP Details</h1>
            <p className='text-sm text-slate-500'>High Security Registration Plate details and laser codes for a vehicle number</p>
          </div>
          {left !== null && (
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ring-1 ${
                left <= 0 ? 'bg-rose-50 text-rose-700 ring-rose-200' : 'bg-teal-50 text-teal-700 ring-teal-200'
              }`}
            >
              {left} HSRP search{left === 1 ? '' : 'es'} left
            </span>
          )}
        </div>

        {/* Search */}
        <form onSubmit={search} className='rounded-2xl bg-white p-3 shadow-xs ring-1 ring-slate-200 sm:p-4'>
          <label htmlFor='hsrp-vno' className='mb-1.5 block text-sm font-semibold text-slate-700'>Vehicle number</label>
          <div className='flex flex-col gap-2 sm:flex-row'>
            <input
              id='hsrp-vno'
              value={vno}
              onChange={(e) => {
                setVno(e.target.value.toUpperCase())
                setError('')
              }}
              placeholder='e.g. CG04AB1234'
              autoComplete='off'
              autoFocus
              className='min-w-0 flex-1 rounded-xl border border-slate-300 px-4 py-3 font-mono text-lg font-bold uppercase tracking-wider text-slate-900 outline-none placeholder:font-sans placeholder:text-base placeholder:font-normal placeholder:tracking-normal focus:border-transparent focus:ring-2 focus:ring-teal-500'
            />
            <button
              type='submit'
              disabled={loading || left === 0}
              className='inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-md shadow-teal-700/20 transition hover:from-teal-700 hover:to-emerald-700 disabled:cursor-not-allowed disabled:opacity-60'
            >
              {loading ? <Loader2 className='h-4 w-4 animate-spin' /> : <Search className='h-4 w-4' />}
              {loading ? 'Searching…' : 'Get HSRP Details'}
            </button>
          </div>
          <p className='mt-2 text-xs text-slate-500'>
            {left === 0
              ? 'No HSRP searches left. Please contact admin to buy more.'
              : saved
                ? `Searched before on ${formatWhen(saved.lastSearchedAt)} — you can open it from Recent searches without using a search.`
                : 'Each new search uses 1 HSRP search. Earlier searches open free from Recent searches.'}
          </p>
        </form>

        {error && (
          <div className='flex items-start gap-2 rounded-xl bg-rose-50 p-3 text-sm font-medium text-rose-700 ring-1 ring-rose-200' role='alert'>
            <AlertTriangle className='mt-0.5 h-4 w-4 shrink-0' />
            {error}
          </div>
        )}

        {loading && (
          <div className='space-y-3'>
            <div className='h-40 animate-pulse rounded-2xl bg-white ring-1 ring-slate-200' />
            <div className='h-56 animate-pulse rounded-2xl bg-white ring-1 ring-slate-200' />
          </div>
        )}

        {!loading && result && <HsrpResult result={result} />}

        {/* Recent searches (no API call) */}
        <section className='rounded-2xl bg-white shadow-xs ring-1 ring-slate-200'>
          <div className='flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-3'>
            <h2 className='flex items-center gap-2 text-sm font-semibold text-slate-900'>
              <History className='h-4 w-4 text-slate-500' />
              Recent searches
            </h2>
            <button
              type='button'
              onClick={loadHistory}
              className='cursor-pointer rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700'
              title='Reload'
              aria-label='Reload recent searches'
            >
              <RefreshCw className={`h-4 w-4 ${historyLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
          {history.length === 0 ? (
            <p className='px-4 py-6 text-center text-sm text-slate-500'>{historyLoading ? 'Loading…' : 'No HSRP search yet.'}</p>
          ) : (
            <ul className='divide-y divide-slate-100'>
              {history.map((item) => {
                const h = item.data?.hsrp_response || {}
                return (
                  <li key={item._id} className='flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50'>
                    <button
                      type='button'
                      onClick={() => {
                        setVno(item.vehicleNumber)
                        setError('')
                        setResult({ data: item.data, vehicleNumber: item.vehicleNumber, fromHistory: true, when: item.lastSearchedAt })
                        window.scrollTo({ top: 0, behavior: 'smooth' })
                      }}
                      className='min-w-0 flex-1 cursor-pointer text-left'
                    >
                      <p className='font-mono text-sm font-bold tracking-wide text-slate-900'>{item.vehicleNumber}</p>
                      <p className='truncate text-xs text-slate-500'>
                        {[h.maker, h.fuel].filter(real).join(' · ') || 'HSRP details'} · {formatWhen(item.lastSearchedAt)}
                      </p>
                    </button>
                    <button
                      type='button'
                      onClick={() => removeHistory(item)}
                      className='cursor-pointer rounded-md p-1.5 text-slate-300 hover:bg-rose-50 hover:text-rose-600'
                      title='Remove from history'
                      aria-label={`Remove ${item.vehicleNumber}`}
                    >
                      <Trash2 className='h-4 w-4' />
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}

export default HsrpSearch
