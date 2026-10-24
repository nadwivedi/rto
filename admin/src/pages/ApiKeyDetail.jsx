import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import ApiKeySaleModal from '../components/ApiKeySaleModal'
import ApiKeyDeleteModal from '../components/ApiKeyDeleteModal'
import ShareApiDocButton from '../components/ShareApiDocButton'
import { PROVIDER_OPTIONS, providerLabel } from '../components/apiProviders'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://api.rtosarthi.com'
const IST = 'Asia/Kolkata'
const PAGE_SIZE = 50

const formatRupees = (n) => `₹${Math.abs(Number(n) || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
const formatNumber = (n) => Number(n || 0).toLocaleString('en-IN')
const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString('en-IN', { timeZone: IST, day: '2-digit', month: 'short', year: 'numeric' }) : '-'
const formatDateTime = (value) =>
  value
    ? new Date(value).toLocaleString('en-IN', {
        timeZone: IST,
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    : '-'
// 'YYYY-MM-DD' -> 'Thu, 08 Oct 2026'
const formatDay = (key) => {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-IN', {
    timeZone: 'UTC',
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

const Tile = ({ label, value, sub, accent = 'text-gray-900' }) => (
  <div className='bg-white rounded-xl border border-gray-100 p-2.5 sm:p-4 shadow-sm'>
    <p className='text-[10px] sm:text-xs text-gray-500 font-semibold uppercase tracking-wide'>{label}</p>
    <p className={`text-lg sm:text-2xl font-bold mt-0.5 sm:mt-1 tabular-nums ${accent}`}>{value}</p>
    {sub && <p className='text-[11px] text-gray-400 mt-0.5'>{sub}</p>}
  </div>
)

const ResultBadge = ({ call }) =>
  call.success ? (
    <span className='inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200'>
      Success
    </span>
  ) : (
    <span className='inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-50 text-rose-700 border border-rose-200'>
      {call.statusCode || 'Failed'}
    </span>
  )

const th = 'px-2.5 sm:px-4 py-2 sm:py-2.5 text-[10px] sm:text-[11px] font-semibold text-gray-500 uppercase tracking-wider'
const td = 'px-2.5 sm:px-4 py-2 sm:py-2.5 text-xs'
const smallInput = 'px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
const inputClass = 'w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
const labelClass = 'block text-xs sm:text-sm font-semibold text-gray-700 mb-1'

// The most useful fields of a vehicle response, shown above the raw JSON
const RESPONSE_FIELDS = [
  ['REGN_NO', 'Registration No'],
  ['OWNER_NAME', 'Owner'],
  ['MOBILE_NO', 'Mobile'],
  ['MAKER_DESC', 'Maker'],
  ['MAKER_MODEL', 'Model'],
  ['REGISTERED_AT', 'RTO'],
  ['STATUS', 'Status'],
  ['INSURANCE_UPTO', 'Insurance Upto'],
  ['FIT_UPTO', 'Fitness Upto'],
  ['TAX_UPTO', 'Tax Upto'],
  ['PUCC_UPTO', 'PUC Upto']
]

const ApiKeyDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [showDelete, setShowDelete] = useState(false)
  const [detail, setDetail] = useState(null)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [copied, setCopied] = useState('')

  // Day-wise range
  const [range, setRange] = useState({ from: '', to: '' })

  // Call log
  const [calls, setCalls] = useState([])
  const [callsPagination, setCallsPagination] = useState({ currentPage: 1, totalPages: 1, totalRecords: 0 })
  const [callFilters, setCallFilters] = useState({ from: '', to: '', vehicle: '', status: 'all' })
  const [callPage, setCallPage] = useState(1)
  const [openCall, setOpenCall] = useState(null)
  const [openCallLoading, setOpenCallLoading] = useState(false)

  const [showSell, setShowSell] = useState(false)
  const [editing, setEditing] = useState(null)
  const [editError, setEditError] = useState('')
  const [busy, setBusy] = useState(false)

  const loadDetail = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (range.from) params.set('from', range.from)
      if (range.to) params.set('to', range.to)
      const res = await fetch(`${BACKEND_URL}/api/admin/api-keys/${id}?${params}`, { credentials: 'include' })
      const json = await res.json()
      if (!json.success) throw new Error(json.message || 'Failed to load API key')
      setDetail(json.data)
    } catch (err) {
      setError(err.message || 'Failed to load API key')
    } finally {
      setLoading(false)
    }
  }, [id, range])

  const loadCalls = useCallback(async () => {
    try {
      const params = new URLSearchParams({ page: String(callPage), limit: String(PAGE_SIZE) })
      if (callFilters.from) params.set('from', callFilters.from)
      if (callFilters.to) params.set('to', callFilters.to)
      if (callFilters.vehicle.trim()) params.set('vehicle', callFilters.vehicle.trim())
      if (callFilters.status !== 'all') params.set('status', callFilters.status)
      const res = await fetch(`${BACKEND_URL}/api/admin/api-keys/${id}/calls?${params}`, { credentials: 'include' })
      const json = await res.json()
      if (!json.success) throw new Error(json.message || 'Failed to load calls')
      setCalls(json.data)
      setCallsPagination(json.pagination)
    } catch (err) {
      setError(err.message || 'Failed to load calls')
    }
  }, [id, callPage, callFilters])

  useEffect(() => {
    loadDetail()
  }, [loadDetail])

  useEffect(() => {
    loadCalls()
  }, [loadCalls])

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/admin/users?limit=1000`, { credentials: 'include' })
      .then((res) => res.json())
      .then((json) => json.success && setUsers([...json.data].sort((a, b) => a.name.localeCompare(b.name))))
      .catch(() => {})
  }, [])

  const refreshAll = () => {
    loadDetail()
    loadCalls()
  }

  const changeCallFilter = (name, value) => {
    setCallFilters((f) => ({ ...f, [name]: value }))
    setCallPage(1)
  }

  // Show the log of one day from the day-wise table
  const showDay = (date) => {
    setCallFilters((f) => ({ ...f, from: date, to: date }))
    setCallPage(1)
    document.getElementById('call-log')?.scrollIntoView({ behavior: 'smooth' })
  }

  const copy = async (text, what) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(what)
      setTimeout(() => setCopied(''), 1500)
    } catch {
      setError('Could not copy')
    }
  }

  const patchKey = async (body, message) => {
    try {
      setBusy(true)
      setError('')
      const res = await fetch(`${BACKEND_URL}/api/admin/api-keys/${id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const json = await res.json()
      if (!json.success) return json.message || 'Failed to update'
      setSuccess(message || json.message)
      await loadDetail()
      return null
    } catch {
      return 'Failed to update'
    } finally {
      setBusy(false)
    }
  }

  const toggleActive = async () => {
    const on = !detail.apiKey.active
    if (!on && !confirm('Switch off this API key? All calls with it will be refused until you switch it on again.')) return
    const err = await patchKey({ active: on }, on ? 'API key switched on' : 'API key switched off')
    if (err) setError(err)
  }

  const regenerate = async () => {
    if (!confirm('Generate a new key? The current key will stop working at once and the customer must use the new one.')) return
    try {
      setBusy(true)
      const res = await fetch(`${BACKEND_URL}/api/admin/api-keys/${id}/regenerate`, { method: 'POST', credentials: 'include' })
      const json = await res.json()
      if (!json.success) return setError(json.message || 'Failed to regenerate')
      setSuccess(json.message)
      setShowKey(true)
      await loadDetail()
    } catch {
      setError('Failed to regenerate')
    } finally {
      setBusy(false)
    }
  }

  const saveEdit = async (e) => {
    e.preventDefault()
    if (!editing.name.trim()) return setEditError('Name cannot be empty')
    const err = await patchKey(editing, 'API key updated')
    if (err) setEditError(err)
    else setEditing(null)
  }

  const deleteSale = async (sale) => {
    if (!confirm(`Delete this sale of ${sale.quantity} API calls?\n\nThe key's limit will be reduced by ${sale.quantity}.`)) return
    try {
      setBusy(true)
      const res = await fetch(`${BACKEND_URL}/api/admin/api-keys/${id}/sales/${sale._id}`, { method: 'DELETE', credentials: 'include' })
      const json = await res.json()
      if (!json.success) return setError(json.message || 'Failed to delete sale')
      setSuccess(json.message)
      await loadDetail()
    } catch {
      setError('Failed to delete sale')
    } finally {
      setBusy(false)
    }
  }

  const viewCall = async (call) => {
    setOpenCall(call)
    setOpenCallLoading(true)
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/api-keys/${id}/calls/${call._id}`, { credentials: 'include' })
      const json = await res.json()
      if (json.success) setOpenCall(json.data)
    } catch {
      // The row data is still shown
    } finally {
      setOpenCallLoading(false)
    }
  }

  if (loading) return <div className='max-w-[1500px] mx-auto h-64 bg-white rounded-xl border border-gray-100 animate-pulse' />
  if (!detail) {
    return (
      <div className='max-w-[1500px] mx-auto'>
        <Link to='/api-keys' className='text-sm text-indigo-600 font-semibold'>← API Keys</Link>
        <div className='mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm'>{error || 'API key not found'}</div>
      </div>
    )
  }

  const { apiKey, stats, days, sales } = detail
  const endpoint = `${BACKEND_URL}/api/v1/vehicle-info`
  const curl = `curl -H "x-api-key: ${apiKey.key}" "${endpoint}?vno=CG04AB1234"`
  const daysWithCalls = days.filter((d) => d.total > 0)

  return (
    <div className='max-w-[1500px] mx-auto'>
      <Link to='/api-keys' className='text-xs sm:text-sm text-indigo-600 font-semibold hover:text-indigo-800'>← All API Keys</Link>

      {/* Header */}
      <div className='flex flex-col lg:flex-row lg:justify-between lg:items-start gap-2.5 mt-2 mb-3 sm:mb-5'>
        <div>
          <h1 className='text-xl sm:text-3xl font-bold text-gray-800 flex items-center gap-2 flex-wrap'>
            {apiKey.name}
            <span
              className={`inline-flex px-2 py-0.5 rounded text-[11px] font-bold uppercase border ${
                apiKey.active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-500 border-gray-200'
              }`}
            >
              {apiKey.active ? 'Active' : 'Switched off'}
            </span>
          </h1>
          <p className='text-xs sm:text-sm text-gray-600 mt-1'>
            {apiKey.userId ? `${apiKey.userId.name} · ${apiKey.userId.mobile1}` : 'No user linked'} · Created {formatDate(apiKey.createdAt)}
            {' · Source: '}
            <span className='font-semibold text-gray-700'>{providerLabel(apiKey.provider)}</span>
            {apiKey.note && <span className='text-gray-400'> · {apiKey.note}</span>}
          </p>
        </div>
        <div className='flex flex-wrap gap-2'>
          <button
            onClick={() => {
              setEditing({ name: apiKey.name, userId: apiKey.userId?._id || '', note: apiKey.note || '', provider: apiKey.provider || 'api1' })
              setEditError('')
            }}
            className='px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold text-sm cursor-pointer'
          >
            Edit
          </button>
          <button
            onClick={toggleActive}
            disabled={busy}
            className='px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold text-sm disabled:opacity-50 cursor-pointer'
          >
            {apiKey.active ? 'Switch Off' : 'Switch On'}
          </button>
          <button
            onClick={() => setShowSell(true)}
            className='px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-semibold text-sm shadow-lg shadow-indigo-200 cursor-pointer'
          >
            + Sell API Calls
          </button>
          <button
            onClick={() => setShowDelete(true)}
            disabled={busy}
            className='px-3 py-2 bg-white border border-rose-200 text-rose-600 rounded-xl hover:bg-rose-50 font-semibold text-sm disabled:opacity-50 cursor-pointer'
          >
            Delete
          </button>
        </div>
      </div>

      {success && <div className='mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-green-800 text-sm font-medium'>{success}</div>}
      {error && <div className='mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium'>{error}</div>}

      {/* Limit */}
      <div className='grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-2 sm:mb-3'>
        <Tile label='Limit' value={formatNumber(apiKey.callLimit)} sub='API calls sold on this key' />
        <Tile label='Used' value={formatNumber(apiKey.callCount)} sub='calls that returned vehicle details' />
        <Tile
          label='Left'
          value={formatNumber(apiKey.remaining)}
          accent={apiKey.remaining <= 0 ? 'text-rose-600' : 'text-emerald-700'}
          sub={apiKey.remaining <= 0 ? 'Limit exhausted · calls are refused' : 'calls the customer can still make'}
        />
        <Tile label='Sold For' value={formatRupees(stats.soldAmount)} sub={`${formatNumber(stats.soldQty)} calls in ${sales.length} sale(s)`} />
      </div>
      <div className='grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-3 sm:mb-5'>
        <Tile label='Calls Today' value={formatNumber(stats.today)} />
        <Tile label='Last 7 Days' value={formatNumber(stats.last7)} />
        <Tile label='Last 30 Days' value={formatNumber(stats.last30)} />
        <Tile
          label='All Calls'
          value={formatNumber(stats.total)}
          sub={`${formatNumber(stats.success)} success · ${formatNumber(stats.failed)} failed`}
        />
      </div>

      {/* Key and how to use it */}
      <div className='bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-4 mb-3 sm:mb-5'>
        <div className='flex flex-wrap items-center justify-between gap-2 mb-2'>
          <h2 className='text-sm font-bold text-gray-800'>API Key &amp; How to Call</h2>
          <button
            onClick={regenerate}
            disabled={busy}
            className='text-xs font-semibold text-rose-600 hover:text-rose-800 disabled:opacity-50 cursor-pointer'
          >
            Generate new key
          </button>
        </div>
        <div className='flex flex-wrap items-center gap-2'>
          <code className='flex-1 min-w-0 break-all px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-800'>
            {showKey ? apiKey.key : `${apiKey.key.slice(0, 8)}${'•'.repeat(24)}${apiKey.key.slice(-4)}`}
          </code>
          <button onClick={() => setShowKey((s) => !s)} className='px-3 py-2 text-xs font-semibold rounded-lg border border-gray-300 hover:bg-gray-50 cursor-pointer'>
            {showKey ? 'Hide' : 'Show'}
          </button>
          <button onClick={() => copy(apiKey.key, 'key')} className='px-3 py-2 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer'>
            {copied === 'key' ? 'Copied' : 'Copy Key'}
          </button>
        </div>
        <div className='mt-2 flex flex-wrap items-center gap-2'>
          <ShareApiDocButton apiKey={apiKey.key} />
          <span className='text-xs text-gray-500'>API doc with this key filled in. Pick WhatsApp to send it to the customer.</span>
        </div>

        <div className='mt-3 grid grid-cols-1 xl:grid-cols-2 gap-3 text-xs text-gray-600'>
          <div className='space-y-1.5'>
            <p>
              <span className='font-semibold text-gray-800'>Endpoint:</span> <code className='break-all'>GET {endpoint}?vno=CG04AB1234</code>
            </p>
            <p>
              <span className='font-semibold text-gray-800'>Key:</span> send in the <code>x-api-key</code> header (or as <code>&amp;key=</code> in the URL).
            </p>
            <p>Only calls that return vehicle details use the limit. Not found / errors are free but still logged.</p>
            <p>Every reply has <code>usage: {'{ limit, used, remaining }'}</code> so the customer always knows how many calls are left.</p>
            <button onClick={() => copy(curl, 'curl')} className='mt-1 font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer'>
              {copied === 'curl' ? 'Copied' : 'Copy example (curl)'}
            </button>
          </div>
          <pre className='p-2.5 bg-gray-900 text-gray-100 rounded-lg overflow-x-auto text-[11px] leading-relaxed'>
{`{
  "success": true,
  "message": "Vehicle details fetched successfully",
  "vehicleNumber": "CG04AB1234",
  "data": { "OWNER_NAME": "...", "MAKER_MODEL": "...", ... },
  "usage": { "limit": ${apiKey.callLimit}, "used": ${apiKey.callCount}, "remaining": ${apiKey.remaining} }
}`}
          </pre>
        </div>
      </div>

      <div className='grid grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-5 mb-3 sm:mb-5'>
        {/* Day-wise */}
        <div className='bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden'>
          <div className='p-3 border-b border-gray-100 flex flex-wrap items-center gap-2'>
            <h2 className='text-sm font-bold text-gray-800 mr-auto'>Day-wise Calls</h2>
            <input type='date' value={range.from || detail.range.from} onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))} className={smallInput} />
            <span className='text-xs text-gray-400'>to</span>
            <input type='date' value={range.to || detail.range.to} onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))} className={smallInput} />
          </div>
          <div className='max-h-[420px] overflow-y-auto'>
            <table className='w-full'>
              <thead className='sticky top-0 bg-gray-50'>
                <tr className='border-b border-gray-100'>
                  <th className={`${th} text-left`}>Day</th>
                  <th className={`${th} text-right`}>Calls</th>
                  <th className={`${th} text-right`}>Success</th>
                  <th className={`${th} text-right`}>Failed</th>
                  <th className={`${th} text-right`}>Vehicles</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-gray-100'>
                {days.map((day) => (
                  <tr
                    key={day.date}
                    onClick={day.total ? () => showDay(day.date) : undefined}
                    className={day.total ? 'hover:bg-indigo-50/60 cursor-pointer' : ''}
                    title={day.total ? 'Show the calls of this day' : ''}
                  >
                    <td className={`${td} text-gray-700 whitespace-nowrap`}>
                      {formatDay(day.date)}
                      {day.date === detail.range.today && <span className='ml-1.5 text-[10px] font-bold text-indigo-600 uppercase'>Today</span>}
                    </td>
                    <td className={`${td} text-right tabular-nums ${day.total ? 'font-bold text-gray-900' : 'text-gray-400'}`}>{formatNumber(day.total)}</td>
                    <td className={`${td} text-right tabular-nums text-emerald-700`}>{day.success || ''}</td>
                    <td className={`${td} text-right tabular-nums text-rose-600`}>{day.failed || ''}</td>
                    <td className={`${td} text-right tabular-nums text-gray-700`}>{day.vehicles || ''}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className='bg-gray-50 border-t border-gray-200'>
                <tr>
                  <td className={`${td} font-bold text-gray-800`}>{daysWithCalls.length} day(s) with calls</td>
                  <td className={`${td} text-right font-bold tabular-nums`}>{formatNumber(days.reduce((s, d) => s + d.total, 0))}</td>
                  <td className={`${td} text-right font-bold tabular-nums text-emerald-700`}>{formatNumber(days.reduce((s, d) => s + d.success, 0))}</td>
                  <td className={`${td} text-right font-bold tabular-nums text-rose-600`}>{formatNumber(days.reduce((s, d) => s + d.failed, 0))}</td>
                  <td className={td}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Sales */}
        <div className='bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden'>
          <div className='p-3 border-b border-gray-100 flex items-center justify-between'>
            <h2 className='text-sm font-bold text-gray-800'>Sales on this Key</h2>
            <button onClick={() => setShowSell(true)} className='text-xs font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer'>
              + Sell API Calls
            </button>
          </div>
          {sales.length === 0 ? (
            <p className='p-6 text-center text-sm text-gray-500'>No sale yet. The key can't make calls until you sell API calls on it.</p>
          ) : (
            <div className='overflow-x-auto'>
              <table className='w-full'>
                <thead>
                  <tr className='border-b border-gray-100 bg-gray-50/60'>
                    <th className={`${th} text-left`}>Date</th>
                    <th className={`${th} text-right`}>API Calls</th>
                    <th className={`${th} text-right`}>Rate</th>
                    <th className={`${th} text-right`}>Amount</th>
                    <th className={`${th} text-left`}>Note</th>
                    <th className={th}></th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-gray-100'>
                  {sales.map((sale) => (
                    <tr key={sale._id} className='hover:bg-gray-50/80'>
                      <td className={`${td} text-gray-700 whitespace-nowrap`}>{formatDate(sale.date)}</td>
                      <td className={`${td} text-right tabular-nums text-gray-700`}>{formatNumber(sale.quantity)}</td>
                      <td className={`${td} text-right tabular-nums text-gray-700`}>{formatRupees(sale.rate)}</td>
                      <td className={`${td} text-right tabular-nums font-bold text-gray-900`}>{formatRupees(sale.amount)}</td>
                      <td className={`${td} text-gray-500 max-w-[180px] truncate`} title={sale.note || ''}>{sale.note || '-'}</td>
                      <td className={`${td} text-right`}>
                        <button
                          onClick={() => deleteSale(sale)}
                          disabled={busy}
                          className='p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md disabled:opacity-40 cursor-pointer'
                          title='Delete sale'
                        >
                          <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Call log */}
      <div id='call-log' className='bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden'>
        <div className='p-3 border-b border-gray-100 flex flex-col lg:flex-row lg:items-center gap-2'>
          <h2 className='text-sm font-bold text-gray-800 lg:mr-auto'>
            Call Log <span className='font-normal text-gray-400'>({formatNumber(callsPagination.totalRecords)})</span>
          </h2>
          <div className='flex flex-wrap items-center gap-2'>
            <input
              value={callFilters.vehicle}
              onChange={(e) => changeCallFilter('vehicle', e.target.value)}
              placeholder='Vehicle number'
              className={`${smallInput} w-36`}
            />
            <input type='date' value={callFilters.from} onChange={(e) => changeCallFilter('from', e.target.value)} className={smallInput} />
            <span className='text-xs text-gray-400'>to</span>
            <input type='date' value={callFilters.to} onChange={(e) => changeCallFilter('to', e.target.value)} className={smallInput} />
            <select value={callFilters.status} onChange={(e) => changeCallFilter('status', e.target.value)} className={`${smallInput} cursor-pointer`}>
              <option value='all'>All results</option>
              <option value='success'>Success</option>
              <option value='failed'>Failed</option>
            </select>
            {(callFilters.from || callFilters.to || callFilters.vehicle || callFilters.status !== 'all') && (
              <button
                onClick={() => {
                  setCallFilters({ from: '', to: '', vehicle: '', status: 'all' })
                  setCallPage(1)
                }}
                className='text-xs font-semibold text-gray-500 hover:text-gray-800 cursor-pointer'
              >
                Clear
              </button>
            )}
            <button onClick={refreshAll} className='text-xs font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer'>
              Refresh
            </button>
          </div>
        </div>

        {calls.length === 0 ? (
          <p className='p-8 text-center text-sm text-gray-500'>No calls match.</p>
        ) : (
          <div className='overflow-x-auto'>
            <table className='w-full'>
              <thead>
                <tr className='border-b border-gray-100 bg-gray-50/60'>
                  <th className={`${th} text-left`}>Date &amp; Time</th>
                  <th className={`${th} text-left`}>Vehicle</th>
                  <th className={`${th} text-left`}>Owner / Model</th>
                  <th className={`${th} text-left`}>Result</th>
                  <th className={`${th} text-right`}>Left After</th>
                  <th className={`${th} text-right`}>Time Taken</th>
                  <th className={`${th} text-left`}>IP</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-gray-100'>
                {calls.map((call) => (
                  <tr key={call._id} onClick={() => viewCall(call)} className='hover:bg-indigo-50/60 cursor-pointer' title='View the full response'>
                    <td className={`${td} text-gray-700 whitespace-nowrap`}>{formatDateTime(call.createdAt)}</td>
                    <td className={`${td} font-semibold text-gray-900 whitespace-nowrap`}>{call.vehicleNumber || '-'}</td>
                    <td className={`${td} text-gray-700 max-w-[260px]`}>
                      {call.success ? (
                        <>
                          <div className='truncate'>{call.ownerName || '-'}</div>
                          <div className='text-gray-400 truncate'>{call.makerModel}</div>
                        </>
                      ) : (
                        <span className='text-gray-500'>{call.message}</span>
                      )}
                    </td>
                    <td className={td}>
                      <ResultBadge call={call} />
                    </td>
                    <td className={`${td} text-right tabular-nums text-gray-700`}>{call.remaining ?? '-'}</td>
                    <td className={`${td} text-right tabular-nums text-gray-500 whitespace-nowrap`}>
                      {call.durationMs !== undefined ? `${(call.durationMs / 1000).toFixed(1)}s` : '-'}
                    </td>
                    <td className={`${td} text-gray-500 whitespace-nowrap`}>{call.ip || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {callsPagination.totalPages > 1 && (
          <div className='p-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500'>
            <span>
              Page {callsPagination.currentPage} of {callsPagination.totalPages}
            </span>
            <div className='flex gap-2'>
              <button
                onClick={() => setCallPage((p) => Math.max(1, p - 1))}
                disabled={callPage <= 1}
                className='px-3 py-1.5 rounded-lg border border-gray-300 font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-40 cursor-pointer'
              >
                Previous
              </button>
              <button
                onClick={() => setCallPage((p) => Math.min(callsPagination.totalPages, p + 1))}
                disabled={callPage >= callsPagination.totalPages}
                className='px-3 py-1.5 rounded-lg border border-gray-300 font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-40 cursor-pointer'
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* One call */}
      {openCall && (
        <div className='fixed inset-0 bg-black/50 z-50 overflow-y-auto' onMouseDown={() => setOpenCall(null)}>
          <div className='flex items-start justify-center min-h-full px-3 py-8 sm:py-12'>
            <div onMouseDown={(e) => e.stopPropagation()} className='bg-white rounded-lg shadow-xl max-w-2xl w-full p-4 sm:p-5'>
              <div className='flex justify-between items-start mb-3'>
                <div>
                  <h2 className='text-lg font-bold text-gray-800 flex items-center gap-2'>
                    {openCall.vehicleNumber || 'No vehicle number'} <ResultBadge call={openCall} />
                  </h2>
                  <p className='text-xs text-gray-500 mt-0.5'>
                    {formatDateTime(openCall.createdAt)} · {openCall.message}
                  </p>
                </div>
                <button onClick={() => setOpenCall(null)} className='text-gray-500 hover:text-gray-700 p-1 cursor-pointer' aria-label='Close'>
                  <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                  </svg>
                </button>
              </div>

              <div className='grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs mb-3'>
                <div className='p-2 rounded-lg bg-gray-50 border border-gray-100'>
                  <div className='text-gray-400'>HTTP status</div>
                  <div className='font-semibold text-gray-800'>{openCall.statusCode}</div>
                </div>
                <div className='p-2 rounded-lg bg-gray-50 border border-gray-100'>
                  <div className='text-gray-400'>Left after call</div>
                  <div className='font-semibold text-gray-800'>
                    {openCall.remaining ?? '-'} of {openCall.callLimit ?? '-'}
                  </div>
                </div>
                <div className='p-2 rounded-lg bg-gray-50 border border-gray-100'>
                  <div className='text-gray-400'>Time taken</div>
                  <div className='font-semibold text-gray-800'>{openCall.durationMs !== undefined ? `${(openCall.durationMs / 1000).toFixed(2)}s` : '-'}</div>
                </div>
                <div className='p-2 rounded-lg bg-gray-50 border border-gray-100'>
                  <div className='text-gray-400'>IP</div>
                  <div className='font-semibold text-gray-800 break-all'>{openCall.ip || '-'}</div>
                </div>
              </div>

              {openCallLoading ? (
                <div className='h-40 bg-gray-50 rounded-lg animate-pulse' />
              ) : openCall.response ? (
                <>
                  <div className='grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs mb-3'>
                    {RESPONSE_FIELDS.filter(([field]) => openCall.response[field]).map(([field, label]) => (
                      <div key={field} className='flex justify-between gap-2 border-b border-gray-50 py-1'>
                        <span className='text-gray-500'>{label}</span>
                        <span className='font-semibold text-gray-800 text-right'>{String(openCall.response[field])}</span>
                      </div>
                    ))}
                  </div>
                  <p className='text-xs font-semibold text-gray-700 mb-1'>Full data sent to the customer</p>
                  <pre className='p-2.5 bg-gray-900 text-gray-100 rounded-lg overflow-auto max-h-80 text-[11px]'>
                    {JSON.stringify(openCall.response, null, 2)}
                  </pre>
                </>
              ) : (
                <p className='text-xs text-gray-500'>No vehicle data was sent for this call.</p>
              )}
              {openCall.userAgent && <p className='text-[11px] text-gray-400 mt-2 break-all'>Client: {openCall.userAgent}</p>}
            </div>
          </div>
        </div>
      )}

      {showSell && (
        <ApiKeySaleModal
          apiKey={apiKey}
          defaultRate={sales[0]?.rate ?? ''}
          onClose={() => setShowSell(false)}
          onSaved={(message) => {
            setShowSell(false)
            setSuccess(message)
            loadDetail()
          }}
        />
      )}

      {editing && (
        <div className='fixed inset-0 bg-black/50 z-50 overflow-y-auto'>
          <div className='flex items-start justify-center min-h-full px-3 py-8 sm:py-16'>
            <form onSubmit={saveEdit} className='bg-white rounded-lg shadow-xl max-w-md w-full p-5 space-y-3'>
              <h2 className='text-lg font-bold text-gray-800'>Edit API Key</h2>
              <div>
                <label className={labelClass}>Name</label>
                <input value={editing.name} onChange={(e) => setEditing((f) => ({ ...f, name: e.target.value }))} className={inputClass} autoFocus />
              </div>
              <div>
                <label className={labelClass}>Linked User</label>
                <select value={editing.userId} onChange={(e) => setEditing((f) => ({ ...f, userId: e.target.value }))} className={`${inputClass} cursor-pointer`}>
                  <option value=''>No user</option>
                  {users.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.name} · {u.mobile1}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Vehicle data source</label>
                <select
                  value={editing.provider}
                  onChange={(e) => setEditing((f) => ({ ...f, provider: e.target.value }))}
                  className={`${inputClass} cursor-pointer`}
                >
                  {PROVIDER_OPTIONS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
                <p className='text-[11px] text-gray-400 mt-1'>Which API this key's calls go to. The customer always gets the same response format.</p>
              </div>
              <div>
                <label className={labelClass}>Note</label>
                <input value={editing.note} onChange={(e) => setEditing((f) => ({ ...f, note: e.target.value }))} className={inputClass} />
              </div>
              {editError && <div className='p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700'>{editError}</div>}
              <div className='flex gap-2 pt-1'>
                <button
                  type='button'
                  onClick={() => setEditing(null)}
                  className='flex-1 px-4 py-2 text-sm font-semibold rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer'
                >
                  Cancel
                </button>
                <button type='submit' disabled={busy} className='flex-1 px-4 py-2 text-sm font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 cursor-pointer'>
                  {busy ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDelete && (
        <ApiKeyDeleteModal
          apiKey={apiKey}
          onClose={() => setShowDelete(false)}
          onDeleted={() => navigate('/api-keys', { replace: true })}
        />
      )}
    </div>
  )
}

export default ApiKeyDetail
