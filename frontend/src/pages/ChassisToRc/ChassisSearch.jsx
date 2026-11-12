import React, { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { Search, Copy, Check, RefreshCw, History, Trash2, Car, AlertTriangle, Loader2, ScanLine } from 'lucide-react'

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'

// 'MA3 EWB-22S00 123456' -> 'MA3EWB22S00123456'
const cleanChassis = (raw) => String(raw || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase()
const real = (v) => v !== undefined && v !== null && String(v).trim() !== '' && !/^(na|n\/a|null|none|-)$/i.test(String(v).trim())
const show = (v) => (real(v) ? String(v) : '—')
const formatWhen = (value) =>
  value
    ? new Date(value).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : ''

// The vehicle record fields (same names as RC Details), grouped; only the ones with a value are shown
const GROUPS = [
  {
    title: 'Vehicle',
    fields: [
      ['MAKER_DESC', 'Maker'],
      ['MAKER_MODEL', 'Model'],
      ['VEHICLE_CLASS', 'Vehicle class'],
      ['VEHICLE_CATEGORY', 'Category'],
      ['BODY_TYPE_DESC', 'Body type'],
      ['FUEL_DESC', 'Fuel'],
      ['COLOR', 'Colour'],
      ['FUEL_NORMS', 'Emission norms'],
      ['MANU_MONTH_YR', 'Manufactured'],
      ['CUBIC_CAPACITY', 'Cubic capacity (cc)'],
      ['SEATING_CAPACITY', 'Seats'],
      ['UNLADEN_WEIGHT', 'Unladen weight'],
      ['LADEN_WEIGHT', 'Laden weight']
    ]
  },
  {
    title: 'Identification & registration',
    fields: [
      ['CHASI_NO', 'Chassis number', true],
      ['ENG_NO', 'Engine number', true],
      ['REGN_DT', 'Registration date'],
      ['REGN_UPTO', 'Registration valid upto'],
      ['REGISTERED_AT', 'Registered at'],
      ['STATE_CD', 'State'],
      ['STATUS', 'RC status'],
      ['OWNER_SERIAL_NO', 'Owner serial no.'],
      ['FINANCER_DETAILS', 'Financier'],
      ['BLACKLIST_STATUS', 'Blacklist status'],
      ['NOC_DETAILS', 'NOC details']
    ]
  },
  {
    title: 'Owner',
    fields: [
      ['OWNER_NAME', 'Owner name'],
      ['F_NAME', 'Father / husband name'],
      ['MOBILE_NO', 'Mobile', true],
      ['PRESENT_ADDRESS', 'Present address'],
      ['PERMANENT_ADDRESS', 'Permanent address']
    ]
  },
  {
    title: 'Validity',
    fields: [
      ['INSURANCE_COMP', 'Insurance company'],
      ['INSURANCE_UPTO', 'Insurance upto'],
      ['POLICY_NO', 'Policy number', true],
      ['FIT_UPTO', 'Fitness upto'],
      ['TAX_UPTO', 'Tax upto'],
      ['PUCC_UPTO', 'PUC upto'],
      ['PERMIT_NO', 'Permit number', true],
      ['PERMIT_TYPE', 'Permit type'],
      ['PERMIT_VALID_UPTO', 'Permit valid upto']
    ]
  }
]

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
      className='shrink-0 cursor-pointer rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-violet-700'
      title={`Copy ${label}`}
      aria-label={`Copy ${label}`}
    >
      {copied ? <Check className='h-4 w-4 text-emerald-600' /> : <Copy className='h-4 w-4' />}
    </button>
  )
}

const Detail = ({ label, value, mono }) => (
  <div className='flex items-start gap-2 py-2.5'>
    <div className='min-w-0 flex-1'>
      <p className='text-xs text-slate-500'>{label}</p>
      <p className={`break-words text-sm font-semibold text-slate-800 ${mono ? 'font-mono tracking-wide' : ''}`}>{show(value)}</p>
    </div>
    {mono && <CopyButton value={value} label={label} />}
  </div>
)

// One vehicle found for the chassis number
const VehicleCard = ({ record, index, total, result }) => {
  const groups = GROUPS.map((g) => ({ ...g, fields: g.fields.filter(([key]) => real(record[key])) })).filter((g) => g.fields.length)
  return (
    <div className='space-y-4'>
      <div className='rounded-2xl bg-white p-4 shadow-xs ring-1 ring-slate-200 sm:p-5'>
        <div className='flex flex-wrap items-start justify-between gap-3'>
          <div className='min-w-0'>
            <p className='text-xs font-semibold uppercase tracking-wide text-slate-500'>
              Vehicle number{total > 1 ? ` · match ${index + 1} of ${total}` : ''}
            </p>
            <div className='mt-0.5 flex items-center gap-1'>
              <p className='font-mono text-2xl font-extrabold tracking-wider text-slate-900 sm:text-3xl'>{show(record.REGN_NO)}</p>
              <CopyButton value={record.REGN_NO} label='vehicle number' />
            </div>
            <p className='mt-1 text-sm text-slate-600'>{[record.MAKER_DESC, record.MAKER_MODEL].filter(real).join(' · ') || ' '}</p>
          </div>
          <div className='flex flex-col items-end gap-1'>
            <span className='inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700 ring-1 ring-violet-200'>
              <Car className='h-3.5 w-3.5' />
              Vehicle found
            </span>
            <span className='font-mono text-[11px] text-slate-500'>Chassis {show(result.chassisNumber)}</span>
            {result.fromHistory && result.when && <span className='text-[11px] text-slate-400'>Saved search · {formatWhen(result.when)}</span>}
          </div>
        </div>
      </div>

      {groups.length > 0 && (
        <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
          {groups.map((g) => (
            <section key={g.title} className='rounded-2xl bg-white px-4 py-2 shadow-xs ring-1 ring-slate-200 sm:px-5'>
              <h3 className='border-b border-slate-100 py-2.5 text-sm font-semibold text-slate-900'>{g.title}</h3>
              <div className='divide-y divide-slate-100'>
                {g.fields.map(([key, label, mono]) => (
                  <Detail key={key} label={label} value={record[key]} mono={mono} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}

const ChassisResult = ({ result }) => {
  const matches = result.data?.matches || []
  return (
    <div className='space-y-6'>
      {matches.map((record, i) => (
        <VehicleCard key={`${record.REGN_NO}-${i}`} record={record} index={i} total={matches.length} result={result} />
      ))}
    </div>
  )
}

const inputClass =
  'w-full min-w-0 rounded-xl border border-slate-300 px-4 py-3 font-mono text-lg font-bold uppercase tracking-wider text-slate-900 outline-none placeholder:font-sans placeholder:text-base placeholder:font-normal placeholder:tracking-normal focus:border-transparent focus:ring-2 focus:ring-violet-500'

const ChassisSearch = () => {
  const [chassis, setChassis] = useState('')
  const [engine, setEngine] = useState('')
  const [quota, setQuota] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [history, setHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(true)

  const loadQuota = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/api/chassis-to-rc/quota`, { withCredentials: true })
      if (res.data?.success) setQuota(res.data)
    } catch {
      // The search itself reports a missing limit
    }
  }, [])

  const loadHistory = useCallback(async () => {
    try {
      setHistoryLoading(true)
      const res = await axios.get(`${API_URL}/api/chassis-to-rc/history?limit=20`, { withCredentials: true })
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

  const left = quota?.chassisSearchRemaining ?? null
  const number = cleanChassis(chassis)
  const engineNumber = cleanChassis(engine)
  // PeriOne needs the engine number with the chassis number (the server says so in /quota)
  const engineRequired = quota ? quota.engineRequired !== false : true
  const saved = history.find((h) => h.chassisNumber === number)
  const setQuotaFrom = (d) =>
    setQuota((q) => ({ ...(q || {}), chassisSearchLimit: d.chassisSearchLimit, chassisSearchCount: d.chassisSearchCount, chassisSearchRemaining: d.chassisSearchRemaining }))

  const search = async (e) => {
    e?.preventDefault()
    if (number.length < 5 || number.length > 25) {
      setError('Please enter a valid chassis number, e.g. MA3EWB22S00123456')
      return
    }
    if (engineRequired && (engineNumber.length < 4 || engineNumber.length > 25)) {
      setError('Please enter the engine number too')
      return
    }
    if (saved && !window.confirm(`${number} was already searched on ${formatWhen(saved.lastSearchedAt)}.\n\nSearch again? This uses 1 Chassis search. (Cancel shows the saved details.)`)) {
      setResult({ data: saved.data, chassisNumber: saved.chassisNumber, fromHistory: true, when: saved.lastSearchedAt })
      setError('')
      return
    }
    try {
      setLoading(true)
      setError('')
      const params = engineRequired ? { chassis: number, engine: engineNumber } : { chassis: number }
      const res = await axios.get(`${API_URL}/api/chassis-to-rc/lookup`, { params, withCredentials: true })
      if (res.data?.success) {
        setResult({ data: res.data.data, chassisNumber: res.data.chassisNumber })
        setQuotaFrom(res.data)
        toast.success('Vehicle details fetched')
        loadHistory()
      }
    } catch (err) {
      const data = err.response?.data
      setResult(null)
      setError(data?.message || 'Failed to fetch vehicle details. Please try again.')
      if (data && data.chassisSearchRemaining !== undefined) setQuotaFrom(data)
    } finally {
      setLoading(false)
    }
  }

  const removeHistory = async (item) => {
    if (!window.confirm(`Remove ${item.chassisNumber} from your Chassis search history?`)) return
    try {
      await axios.delete(`${API_URL}/api/chassis-to-rc/history/${item._id}`, { withCredentials: true })
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
            <h1 className='text-xl font-bold text-slate-900 sm:text-2xl'>Chassis to RC</h1>
            <p className='text-sm text-slate-500'>
              Find the vehicle number and RC details from a chassis number{engineRequired ? ' and engine number' : ''}
            </p>
          </div>
          {left !== null && (
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ring-1 ${
                left <= 0 ? 'bg-rose-50 text-rose-700 ring-rose-200' : 'bg-violet-50 text-violet-700 ring-violet-200'
              }`}
            >
              {left} Chassis search{left === 1 ? '' : 'es'} left
            </span>
          )}
        </div>

        {/* Search */}
        <form onSubmit={search} className='rounded-2xl bg-white p-3 shadow-xs ring-1 ring-slate-200 sm:p-4'>
          <div className='flex flex-col gap-2 sm:flex-row sm:items-end'>
            <div className='min-w-0 flex-[3]'>
              <label htmlFor='chassis-no' className='mb-1.5 block text-sm font-semibold text-slate-700'>Chassis number</label>
              <input
                id='chassis-no'
                value={chassis}
                onChange={(e) => {
                  setChassis(e.target.value.toUpperCase())
                  setError('')
                }}
                placeholder='e.g. MA3EWB22S00123456'
                autoComplete='off'
                autoFocus
                maxLength={40}
                className={inputClass}
              />
            </div>
            {engineRequired && (
              <div className='min-w-0 flex-[2]'>
                <label htmlFor='engine-no' className='mb-1.5 block text-sm font-semibold text-slate-700'>Engine number</label>
                <input
                  id='engine-no'
                  value={engine}
                  onChange={(e) => {
                    setEngine(e.target.value.toUpperCase())
                    setError('')
                  }}
                  placeholder='e.g. ABC12345'
                  autoComplete='off'
                  maxLength={40}
                  className={inputClass}
                />
              </div>
            )}
            <button
              type='submit'
              disabled={loading || left === 0}
              className='inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-md shadow-violet-700/20 transition hover:from-violet-700 hover:to-indigo-700 disabled:cursor-not-allowed disabled:opacity-60'
            >
              {loading ? <Loader2 className='h-4 w-4 animate-spin' /> : <Search className='h-4 w-4' />}
              {loading ? 'Searching…' : 'Find Vehicle'}
            </button>
          </div>
          <p className='mt-2 text-xs text-slate-500'>
            {left === 0
              ? 'No Chassis searches left. Please contact admin to buy more.'
              : saved
                ? `Searched before on ${formatWhen(saved.lastSearchedAt)} — you can open it from Recent searches without using a search.`
                : 'Each new search uses 1 Chassis search. Earlier searches open free from Recent searches.'}
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
            <div className='h-32 animate-pulse rounded-2xl bg-white ring-1 ring-slate-200' />
            <div className='h-56 animate-pulse rounded-2xl bg-white ring-1 ring-slate-200' />
          </div>
        )}

        {!loading && result && <ChassisResult result={result} />}

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
            <p className='px-4 py-6 text-center text-sm text-slate-500'>{historyLoading ? 'Loading…' : 'No chassis search yet.'}</p>
          ) : (
            <ul className='divide-y divide-slate-100'>
              {history.map((item) => {
                const first = item.data?.matches?.[0] || {}
                return (
                  <li key={item._id} className='flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50'>
                    <ScanLine className='h-4 w-4 shrink-0 text-violet-400' />
                    <button
                      type='button'
                      onClick={() => {
                        setChassis(item.chassisNumber)
                        setEngine(item.engineNumber || '')
                        setError('')
                        setResult({ data: item.data, chassisNumber: item.chassisNumber, fromHistory: true, when: item.lastSearchedAt })
                        window.scrollTo({ top: 0, behavior: 'smooth' })
                      }}
                      className='min-w-0 flex-1 cursor-pointer text-left'
                    >
                      <p className='truncate font-mono text-sm font-bold tracking-wide text-slate-900'>
                        {item.chassisNumber}
                        {item.vehicleNumbers?.length > 0 && <span className='text-violet-700'> → {item.vehicleNumbers.join(', ')}</span>}
                      </p>
                      <p className='truncate text-xs text-slate-500'>
                        {[first.MAKER_DESC, first.MAKER_MODEL].filter(real).join(' · ') || 'Vehicle details'} · {formatWhen(item.lastSearchedAt)}
                      </p>
                    </button>
                    <button
                      type='button'
                      onClick={() => removeHistory(item)}
                      className='cursor-pointer rounded-md p-1.5 text-slate-300 hover:bg-rose-50 hover:text-rose-600'
                      title='Remove from history'
                      aria-label={`Remove ${item.chassisNumber}`}
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

export default ChassisSearch
