import { useState, useEffect, useCallback, useRef } from 'react'
import { Eye, RefreshCw, Search, X } from 'lucide-react'
import { providerOption } from '../components/apiProviders'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://api.rtosarthi.com'
const IST = 'Asia/Kolkata'

const formatDateTime = (value) =>
  value
    ? new Date(value).toLocaleString('en-IN', { timeZone: IST, day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '-'
const formatSeconds = (ms) => (ms === undefined || ms === null ? '-' : `${(ms / 1000).toFixed(1)}s`)

const RESULTS = {
  found: { label: 'Found', chip: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  not_found: { label: 'Not found', chip: 'bg-gray-100 text-gray-600 border-gray-200' },
  unavailable: { label: 'API failed', chip: 'bg-red-50 text-red-700 border-red-200' }
}

// Readable names for the vehicle fields; any other field is shown with its own name
const FIELD_LABELS = {
  REGN_NO: 'Registration No',
  REGN_DT: 'Registration Date',
  REGN_UPTO: 'Registration Upto',
  OWNER_NAME: 'Owner',
  F_NAME: 'Father / Husband',
  MOBILE_NO: 'Mobile',
  PRESENT_ADDRESS: 'Present Address',
  PERMANENT_ADDRESS: 'Permanent Address',
  CHASI_NO: 'Chassis No',
  ENG_NO: 'Engine No',
  MAKER_DESC: 'Maker',
  MAKER_MODEL: 'Model',
  BODY_TYPE_DESC: 'Body Type',
  FUEL_DESC: 'Fuel',
  COLOR: 'Colour',
  VEHICLE_CLASS: 'Vehicle Class',
  REGISTERED_AT: 'RTO',
  STATUS: 'RC Status',
  INSURANCE_COMP: 'Insurance Company',
  INSURANCE_UPTO: 'Insurance Upto',
  POLICY_NO: 'Policy No',
  FIT_UPTO: 'Fitness Upto',
  TAX_UPTO: 'Tax Upto',
  PUCC_UPTO: 'PUC Upto',
  PUCC_NO: 'PUC No',
  FINANCER_DETAILS: 'Financer',
  PERMIT_NO: 'Permit No',
  PERMIT_TYPE: 'Permit Type',
  PERMIT_VALID_UPTO: 'Permit Upto',
  MANU_MONTH_YR: 'Manufactured',
  SEATING_CAPACITY: 'Seats',
  CUBIC_CAPACITY: 'CC',
  UNLADEN_WEIGHT: 'Unladen Weight',
  LADEN_WEIGHT: 'Laden Weight',
  FUEL_NORMS: 'Fuel Norms',
  IS_COMMERCIAL: 'Commercial'
}
// Repeats of another field, not shown twice in the list (still in the full JSON)
const DUPLICATE_FIELDS = new Set(['INS_POLICY_NO', 'PUC_UPTO'])
const hasValue = (v) => v !== undefined && v !== null && v !== '' && v !== 'NA'

const providerShort = (value) => (value ? providerOption(value).short : '-')

// The source the user / key is set to, and which API(s) actually answered when that differs
const ProviderCell = ({ row }) => {
  const opt = row.provider ? providerOption(row.provider) : null
  const answered = (row.servedBy || []).map(providerShort).join(' + ')
  const differs = answered && row.servedBy.join('') !== row.provider
  return (
    <div className='flex flex-col items-start gap-0.5'>
      {opt && (
        <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold border whitespace-nowrap ${opt.tag}`} title={opt.label}>
          {opt.short}
        </span>
      )}
      {differs && <span className='text-[10px] text-gray-500 whitespace-nowrap'>answered: {answered}</span>}
    </div>
  )
}

const th = 'px-2.5 sm:px-3 py-2 text-[10px] sm:text-[11px] font-semibold text-gray-500 uppercase tracking-wider text-left whitespace-nowrap'
const td = 'px-2.5 sm:px-3 py-2 text-xs align-top'

const ApiSearches = () => {
  const [rows, setRows] = useState([])
  const [nextBefore, setNextBefore] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')
  const [type, setType] = useState('all')
  const [result, setResult] = useState('all')
  const [query, setQuery] = useState('')
  const [appliedQuery, setAppliedQuery] = useState('')
  const [open, setOpen] = useState(null)
  const [detail, setDetail] = useState({ loading: false, response: null, error: '' })
  const [showJson, setShowJson] = useState(false)
  const requestId = useRef(0)

  const load = useCallback(async (before) => {
    const id = ++requestId.current
    before ? setLoadingMore(true) : setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({ type, result, limit: '50' })
      if (appliedQuery) params.set('q', appliedQuery)
      if (before) params.set('before', before)
      const response = await fetch(`${BACKEND_URL}/api/admin/searches?${params}`, { credentials: 'include' })
      const json = await response.json()
      if (id !== requestId.current) return
      if (!json.success) throw new Error(json.message || 'Failed to load searches')
      setRows((prev) => (before ? [...prev, ...json.data] : json.data))
      setNextBefore(json.nextBefore)
    } catch (err) {
      if (id === requestId.current) setError(err.message || 'Failed to load searches')
    } finally {
      if (id === requestId.current) {
        setLoading(false)
        setLoadingMore(false)
      }
    }
  }, [type, result, appliedQuery])

  useEffect(() => {
    load()
  }, [load])

  const viewRow = async (row) => {
    setOpen(row)
    setShowJson(false)
    setDetail({ loading: true, response: null, error: '' })
    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/searches/${row.kind}/${row._id}`, { credentials: 'include' })
      const json = await response.json()
      if (!json.success) throw new Error(json.message || 'Failed to load the details')
      setDetail({ loading: false, response: json.data.response, error: '' })
    } catch (err) {
      setDetail({ loading: false, response: null, error: err.message || 'Failed to load the details' })
    }
  }

  const fields = detail.response
    ? [
        ...Object.entries(detail.response).filter(([field, value]) => hasValue(value) && !DUPLICATE_FIELDS.has(field) && typeof value !== 'object'),
        // Every other detail the API sent (API 8 puts them in EXTRA_DETAILS: { 'Label': 'value' })
        ...Object.entries(detail.response.EXTRA_DETAILS && typeof detail.response.EXTRA_DETAILS === 'object' ? detail.response.EXTRA_DETAILS : {})
          .filter(([, value]) => hasValue(value) && typeof value !== 'object')
          .map(([label, value]) => [`extra:${label}`, value])
      ]
    : []

  const select = 'px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent'

  return (
    <div>
      <div className='flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-3 sm:mb-4'>
        <div>
          <h1 className='text-xl sm:text-2xl font-bold text-gray-800'>API Searches</h1>
          <p className='text-xs sm:text-sm text-gray-500 mt-0.5'>
            Every vehicle RC search, by app users and API keys, with the API that answered. Click the eye to see the details it sent.
          </p>
        </div>
        <button
          onClick={() => load()}
          disabled={loading}
          className='self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 cursor-pointer'
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      <div className='bg-white rounded-xl shadow-sm border border-gray-100 p-3 mb-3 flex flex-wrap items-center gap-2'>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            setAppliedQuery(query.trim())
          }}
          className='flex items-center gap-1.5 flex-1 min-w-[220px]'
        >
          <div className='relative flex-1'>
            <Search className='w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2' />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder='Vehicle no, user name / mobile or API key name'
              className={`${select} w-full pl-8`}
            />
          </div>
          <button type='submit' className='px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 cursor-pointer'>
            Search
          </button>
          {appliedQuery && (
            <button
              type='button'
              onClick={() => {
                setQuery('')
                setAppliedQuery('')
              }}
              className='px-2 py-1.5 text-xs text-gray-500 hover:text-gray-800 cursor-pointer'
            >
              Clear
            </button>
          )}
        </form>
        <select value={type} onChange={(e) => setType(e.target.value)} className={select} aria-label='Searched by'>
          <option value='all'>App users + API keys</option>
          <option value='app'>App users only</option>
          <option value='key'>API keys only</option>
        </select>
        <select value={result} onChange={(e) => setResult(e.target.value)} className={select} aria-label='Result'>
          <option value='all'>Any result</option>
          <option value='found'>Found</option>
          <option value='not_found'>Not found</option>
          <option value='unavailable'>API failed</option>
        </select>
      </div>

      {error && <p className='mb-3 text-sm text-red-600'>{error}</p>}

      <div className='bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden'>
        <div className='overflow-x-auto'>
          <table className='w-full'>
            <thead>
              <tr className='border-b border-gray-100 bg-gray-50/60'>
                <th className={th}>Time</th>
                <th className={th}>User</th>
                <th className={th}>Vehicle No</th>
                <th className={th}>API</th>
                <th className={th}>Result</th>
                <th className={th}>Owner / Model</th>
                <th className={`${th} text-right`}>Took</th>
                <th className={`${th} text-center`}>View</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-100'>
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={8} className='px-3 py-3'>
                      <div className='h-4 bg-gray-100 rounded animate-pulse' />
                    </td>
                  </tr>
                ))
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className='px-3 py-10 text-center text-sm text-gray-500'>
                    No searches found.
                  </td>
                </tr>
              ) : (
                rows.map((row) => {
                  const res = RESULTS[row.result] || RESULTS.not_found
                  return (
                    <tr key={`${row.kind}-${row._id}`} className='hover:bg-gray-50/80'>
                      <td className={`${td} text-gray-600 whitespace-nowrap`}>{formatDateTime(row.createdAt)}</td>
                      <td className={td}>
                        {row.kind === 'app' ? (
                          <>
                            <div className='font-semibold text-gray-800'>{row.userName}</div>
                            <div className='text-[11px] text-gray-500'>
                              {row.userMobile}
                              {row.staffName && <> · by staff {row.staffName}</>}
                            </div>
                          </>
                        ) : (
                          <>
                            <div className='font-semibold text-gray-800'>
                              <span className='inline-flex mr-1 px-1 py-px rounded text-[9px] font-bold uppercase bg-slate-100 text-slate-600 border border-slate-200 align-middle'>API key</span>
                              {row.keyName}
                            </div>
                            {row.userName && <div className='text-[11px] text-gray-500'>{row.userName}{row.userMobile && <> · {row.userMobile}</>}</div>}
                          </>
                        )}
                      </td>
                      <td className={`${td} font-mono font-semibold text-gray-900 whitespace-nowrap`}>{row.vehicleNumber || '-'}</td>
                      <td className={td}><ProviderCell row={row} /></td>
                      <td className={td}>
                        <span className={`inline-flex px-1.5 py-0.5 rounded-full border text-[10px] font-bold whitespace-nowrap ${res.chip}`} title={row.message || ''}>
                          {res.label}
                        </span>
                        {row.result === 'found' && row.charged === false && <div className='text-[10px] text-gray-400 mt-0.5'>free</div>}
                      </td>
                      <td className={`${td} text-gray-700`}>
                        {row.result === 'found' ? (
                          <>
                            <div className='font-medium'>{row.ownerName || '-'}</div>
                            <div className='text-[11px] text-gray-500'>{row.makerModel}</div>
                          </>
                        ) : (
                          <span className='text-[11px] text-gray-400 line-clamp-2 max-w-[220px]'>{row.message}</span>
                        )}
                      </td>
                      <td className={`${td} text-right text-gray-500 tabular-nums whitespace-nowrap`}>{formatSeconds(row.durationMs)}</td>
                      <td className={`${td} text-center`}>
                        <button
                          onClick={() => viewRow(row)}
                          disabled={row.result !== 'found'}
                          className='p-1.5 rounded-md text-indigo-600 hover:bg-indigo-50 disabled:text-gray-300 disabled:hover:bg-transparent cursor-pointer disabled:cursor-default'
                          title={row.result === 'found' ? 'View the vehicle details the API sent' : 'No vehicle details for this search'}
                          aria-label='View vehicle details'
                        >
                          <Eye className='w-4 h-4' />
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
        {nextBefore && !loading && (
          <div className='p-3 border-t border-gray-100 text-center'>
            <button
              onClick={() => load(nextBefore)}
              disabled={loadingMore}
              className='px-4 py-1.5 text-xs font-semibold text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 cursor-pointer'
            >
              {loadingMore ? 'Loading…' : 'Load more'}
            </button>
          </div>
        )}
      </div>

      {open && (
        <div className='fixed inset-0 bg-black/50 z-50 overflow-y-auto' onMouseDown={() => setOpen(null)}>
          <div className='flex items-start justify-center min-h-full px-3 py-8 sm:py-12'>
            <div onMouseDown={(e) => e.stopPropagation()} className='bg-white rounded-lg shadow-xl max-w-3xl w-full p-4 sm:p-5'>
              <div className='flex justify-between items-start gap-3 mb-3'>
                <div>
                  <h2 className='text-lg font-bold text-gray-800 font-mono'>{open.vehicleNumber}</h2>
                  <p className='text-xs text-gray-500 mt-0.5'>
                    {formatDateTime(open.createdAt)} · {open.kind === 'app' ? open.userName : `API key: ${open.keyName}`}
                    {open.staffName && <> (staff {open.staffName})</>}
                  </p>
                  <div className='mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px] text-gray-600'>
                    <ProviderCell row={open} />
                    {open.servedBy?.length > 0 && (
                      <span>
                        Answered by <span className='font-semibold'>{open.servedBy.map((s) => providerOption(s).label).join(' + ')}</span>
                      </span>
                    )}
                  </div>
                </div>
                <button onClick={() => setOpen(null)} className='text-gray-500 hover:text-gray-700 p-1 cursor-pointer' aria-label='Close'>
                  <X className='w-5 h-5' />
                </button>
              </div>

              {detail.loading ? (
                <div className='h-48 bg-gray-50 rounded-lg animate-pulse' />
              ) : detail.error ? (
                <p className='text-sm text-red-600'>{detail.error}</p>
              ) : !detail.response ? (
                <p className='text-sm text-gray-500'>No vehicle details were saved for this search.</p>
              ) : (
                <>
                  <div className='grid grid-cols-1 sm:grid-cols-2 gap-x-5 text-xs'>
                    {fields.map(([field, value]) => (
                      <div key={field} className='flex justify-between gap-3 border-b border-gray-100 py-1.5'>
                        <span className='text-gray-500 shrink-0'>{field.startsWith('extra:') ? field.slice(6) : FIELD_LABELS[field] || field}</span>
                        <span className='font-semibold text-gray-800 text-right break-words min-w-0'>{String(value)}</span>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => setShowJson((v) => !v)} className='mt-3 text-xs font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer'>
                    {showJson ? 'Hide' : 'Show'} full response (JSON)
                  </button>
                  {showJson && (
                    <pre className='mt-2 p-2.5 bg-gray-900 text-gray-100 rounded-lg overflow-auto max-h-80 text-[11px]'>
                      {JSON.stringify(detail.response, null, 2)}
                    </pre>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ApiSearches
