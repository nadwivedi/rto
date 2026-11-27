import { useState, useEffect, useCallback, useRef } from 'react'
import { AlertTriangle, Car, Copy, Info, KeyRound, OctagonAlert, RefreshCw, ScrollText, Search, Trash2, User } from 'lucide-react'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://api.rtosarthi.com'
const AUTO_REFRESH_MS = 10000
// Longer lines are cut in the list; click a line to see all of it
const PREVIEW_CHARS = 400

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'error', label: 'Errors' },
  { id: 'warn', label: 'Warnings' },
  { id: 'info', label: 'Info' }
]

const LEVEL = {
  error: { label: 'ERROR', icon: OctagonAlert, chip: 'bg-red-50 text-red-700 border-red-200', bar: 'border-l-red-600' },
  warn: { label: 'WARN', icon: AlertTriangle, chip: 'bg-amber-50 text-amber-700 border-amber-200', bar: 'border-l-amber-500' },
  info: { label: 'INFO', icon: Info, chip: 'bg-sky-50 text-sky-700 border-sky-200', bar: 'border-l-sky-400' }
}

const formatDateTime = (value) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// 'API key: Fleet App' -> key; 'User search' / 'User HSRP search' -> app
const viaLabel = (via = '') => {
  const key = via.match(/^API key:\s*(.+)$/)
  if (key) return { kind: 'key', text: key[1] }
  return { kind: 'app', text: via.replace(/^User\s+/, '').replace(/^search$/, 'RC search') }
}

// The search a log line was printed for: vehicle / chassis number, who searched and how, as one line
const contextText = (c) => {
  if (!c) return ''
  const who = [c.userName, c.userMobile].filter(Boolean).join(' ')
  return [
    c.vehicleNumber && `Vehicle ${c.vehicleNumber}`,
    c.chassisNumber && `Chassis ${c.chassisNumber}`,
    who && `User ${who}`,
    c.staffName && `staff ${c.staffName}`,
    c.via
  ].filter(Boolean).join(' · ')
}

const Logs = () => {
  const [level, setLevel] = useState('all')
  const [source, setSource] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [query, setQuery] = useState('')
  const [logs, setLogs] = useState([])
  const [hasMore, setHasMore] = useState(false)
  const [last24h, setLast24h] = useState({ error: 0, warn: 0, info: 0 })
  const [sources, setSources] = useState([])
  const [retentionDays, setRetentionDays] = useState(30)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')
  const [expanded, setExpanded] = useState({})
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [clearing, setClearing] = useState(false)
  const [copiedId, setCopiedId] = useState(null)
  const requestId = useRef(0)

  const buildUrl = useCallback((before) => {
    const params = new URLSearchParams()
    if (level !== 'all') params.set('level', level)
    if (source) params.set('source', source)
    if (query) params.set('q', query)
    if (before) params.set('before', before)
    return `${BACKEND_URL}/api/admin/logs?${params.toString()}`
  }, [level, source, query])

  const fetchLogs = useCallback(async ({ quiet = false } = {}) => {
    const id = ++requestId.current
    try {
      if (!quiet) setLoading(true)
      setError('')
      const response = await fetch(buildUrl(), { credentials: 'include' })
      const json = await response.json()
      if (id !== requestId.current) return
      if (json.success) {
        setLogs(json.data || [])
        setHasMore(Boolean(json.hasMore))
        setLast24h(json.last24h || { error: 0, warn: 0, info: 0 })
        setSources(json.sources || [])
        if (json.retentionDays) setRetentionDays(json.retentionDays)
      } else {
        setError(json.message || 'Failed to load logs')
      }
    } catch {
      if (id === requestId.current) setError('Failed to load logs')
    } finally {
      if (id === requestId.current) setLoading(false)
    }
  }, [buildUrl])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  useEffect(() => {
    if (!autoRefresh) return undefined
    const timer = setInterval(() => fetchLogs({ quiet: true }), AUTO_REFRESH_MS)
    return () => clearInterval(timer)
  }, [autoRefresh, fetchLogs])

  const loadMore = async () => {
    if (!logs.length) return
    setLoadingMore(true)
    try {
      const response = await fetch(buildUrl(logs[logs.length - 1]._id), { credentials: 'include' })
      const json = await response.json()
      if (json.success) {
        setLogs((prev) => [...prev, ...(json.data || [])])
        setHasMore(Boolean(json.hasMore))
      } else {
        setError(json.message || 'Failed to load more logs')
      }
    } catch {
      setError('Failed to load more logs')
    } finally {
      setLoadingMore(false)
    }
  }

  const clearLogs = async () => {
    const what = level === 'all' ? 'ALL logs' : `all ${TABS.find((t) => t.id === level)?.label.toLowerCase()}`
    if (!window.confirm(`Delete ${what}? This cannot be undone.`)) return
    setClearing(true)
    try {
      const url = `${BACKEND_URL}/api/admin/logs${level === 'all' ? '' : `?level=${level}`}`
      const response = await fetch(url, { method: 'DELETE', credentials: 'include' })
      const json = await response.json()
      if (!json.success) setError(json.message || 'Failed to clear logs')
      await fetchLogs()
    } catch {
      setError('Failed to clear logs')
    } finally {
      setClearing(false)
    }
  }

  const copyLog = async (log) => {
    try {
      const context = contextText(log.context)
      await navigator.clipboard.writeText(`${formatDateTime(log.createdAt)} ${log.level.toUpperCase()} ${context ? `[${context}] ` : ''}${log.message}`)
      setCopiedId(log._id)
      setTimeout(() => setCopiedId(null), 1500)
    } catch {
      // Clipboard blocked; nothing to do
    }
  }

  const searchFor = (text) => {
    setSearchInput(text)
    setQuery(text)
  }

  const submitSearch = (e) => {
    e.preventDefault()
    setQuery(searchInput.trim())
  }

  return (
    <div>
      <div className='flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-3 sm:mb-6'>
        <div>
          <h1 className='text-xl sm:text-3xl font-bold text-gray-800'>Logs</h1>
          <p className='text-xs sm:text-base text-gray-600 mt-0.5 sm:mt-1'>
            Everything the server prints: API errors, warnings and info. Kept for {retentionDays} days.
          </p>
        </div>
        <div className='flex items-center gap-2 shrink-0'>
          <label className='inline-flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer select-none'>
            <input type='checkbox' checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} className='h-4 w-4' />
            Live
          </label>
          <button
            onClick={() => fetchLogs()}
            disabled={loading}
            className='inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 cursor-pointer'
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Reload
          </button>
          <button
            onClick={clearLogs}
            disabled={clearing || !logs.length}
            className='inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-red-700 bg-white border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50 cursor-pointer'
          >
            <Trash2 className='h-4 w-4' />
            {clearing ? 'Clearing…' : 'Clear'}
          </button>
        </div>
      </div>

      <div className='grid grid-cols-3 gap-2 sm:gap-3 mb-3 sm:mb-4'>
        {['error', 'warn', 'info'].map((key) => {
          const cfg = LEVEL[key]
          const Icon = cfg.icon
          return (
            <button
              key={key}
              onClick={() => setLevel(key)}
              className={`text-left bg-white rounded-xl border border-gray-100 border-l-4 ${cfg.bar} shadow-sm p-2.5 sm:p-3 cursor-pointer hover:bg-gray-50`}
            >
              <div className='flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold text-gray-500'>
                <Icon className='h-3.5 w-3.5' />
                {TABS.find((t) => t.id === key)?.label} · 24h
              </div>
              <div className='mt-0.5 text-lg sm:text-2xl font-bold text-gray-900'>{(last24h[key] || 0).toLocaleString('en-IN')}</div>
            </button>
          )
        })}
      </div>

      <div className='flex flex-col sm:flex-row sm:items-center gap-2 mb-3 sm:mb-4'>
        <div className='flex items-center gap-1 border-b border-gray-200 sm:border-b-0 overflow-x-auto'>
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setLevel(t.id)}
              className={`px-3 py-2 text-sm font-semibold border-b-2 -mb-px cursor-pointer whitespace-nowrap ${
                level === t.id ? 'border-stone-900 text-stone-900' : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className='flex flex-1 items-center gap-2 sm:justify-end'>
          <select
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className='px-2 py-2 text-sm bg-white border border-gray-200 rounded-lg max-w-[40%] sm:max-w-none'
          >
            <option value=''>All sources</option>
            {sources.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <form onSubmit={submitSearch} className='flex flex-1 sm:flex-none items-center gap-1.5 px-2.5 py-2 bg-white border border-gray-200 rounded-lg'>
            <Search className='h-4 w-4 text-gray-400 shrink-0' />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onBlur={() => setQuery(searchInput.trim())}
              placeholder='Search vehicle no, user, error…'
              className='w-full sm:w-56 text-sm outline-none bg-transparent'
            />
          </form>
        </div>
      </div>

      {error && <div className='mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800'>{error}</div>}

      {loading && logs.length === 0 ? (
        <div className='p-8 text-center'>
          <div className='inline-block animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full'></div>
        </div>
      ) : logs.length === 0 ? (
        <div className='bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center'>
          <ScrollText className='h-8 w-8 text-gray-400 mx-auto' />
          <p className='mt-2 text-sm font-semibold text-gray-800'>No logs here</p>
          <p className='text-xs text-gray-500 mt-1'>New server logs show up here a few seconds after they are printed.</p>
        </div>
      ) : (
        <div className='bg-white rounded-xl border border-gray-100 shadow-sm divide-y divide-gray-100 overflow-hidden'>
          {logs.map((log) => {
            const cfg = LEVEL[log.level] || LEVEL.info
            const isOpen = expanded[log._id]
            const long = log.message.length > PREVIEW_CHARS || log.message.includes('\n')
            const text = isOpen || !long ? log.message : `${log.message.split('\n')[0].slice(0, PREVIEW_CHARS)}…`
            return (
              <div key={log._id} className={`border-l-4 ${cfg.bar} px-3 py-2 sm:px-4 hover:bg-gray-50`}>
                <div className='flex flex-wrap items-center gap-2'>
                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded border text-[10px] font-bold ${cfg.chip}`}>{cfg.label}</span>
                  <span className='text-[11px] text-gray-500 tabular-nums'>{formatDateTime(log.createdAt)}</span>
                  {log.source && (
                    <button
                      onClick={() => setSource(log.source)}
                      className='text-[11px] font-semibold text-gray-700 bg-gray-100 rounded px-1.5 py-0.5 hover:bg-gray-200 cursor-pointer'
                    >
                      {log.source}
                    </button>
                  )}
                  <button
                    onClick={() => copyLog(log)}
                    className='ml-auto inline-flex items-center gap-1 text-[11px] text-gray-500 hover:text-gray-800 cursor-pointer'
                    title='Copy'
                  >
                    <Copy className='h-3 w-3' />
                    {copiedId === log._id ? 'Copied' : ''}
                  </button>
                </div>
                {log.context && (log.context.vehicleNumber || log.context.chassisNumber || log.context.userId) && (
                  <div className='mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-gray-700'>
                    {(log.context.vehicleNumber || log.context.chassisNumber) && (
                      <button
                        onClick={() => searchFor(log.context.vehicleNumber || log.context.chassisNumber)}
                        className='inline-flex items-center gap-1 font-mono font-bold text-gray-900 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5 hover:bg-amber-100 cursor-pointer'
                        title='Show every log for this number'
                      >
                        <Car className='h-3 w-3' />
                        {log.context.chassisNumber && !log.context.vehicleNumber ? `Chassis ${log.context.chassisNumber}` : log.context.vehicleNumber}
                      </button>
                    )}
                    {log.context.userName && (
                      <button
                        onClick={() => searchFor(log.context.userMobile || log.context.userName)}
                        className='inline-flex items-center gap-1 hover:text-indigo-700 cursor-pointer'
                        title='Show every log for this user'
                      >
                        <User className='h-3 w-3 text-gray-400' />
                        <span className='font-semibold'>{log.context.userName}</span>
                        {log.context.userMobile && <span className='text-gray-500'>{log.context.userMobile}</span>}
                        {log.context.staffName && <span className='text-gray-500'>· by staff {log.context.staffName}</span>}
                      </button>
                    )}
                    {log.context.via && (() => {
                      const via = viaLabel(log.context.via)
                      return (
                        <span className='inline-flex items-center gap-1 text-gray-500'>
                          {via.kind === 'key' ? <KeyRound className='h-3 w-3' /> : null}
                          {via.kind === 'key' ? `API key: ${via.text}` : via.text}
                        </span>
                      )
                    })()}
                  </div>
                )}
                <pre
                  onClick={() => long && setExpanded((prev) => ({ ...prev, [log._id]: !prev[log._id] }))}
                  className={`mt-1 text-xs font-mono text-gray-800 whitespace-pre-wrap break-all ${long ? 'cursor-pointer' : ''}`}
                >
                  {text}
                </pre>
                {long && (
                  <button
                    onClick={() => setExpanded((prev) => ({ ...prev, [log._id]: !prev[log._id] }))}
                    className='mt-0.5 text-[11px] font-semibold text-indigo-600 hover:underline cursor-pointer'
                  >
                    {isOpen ? 'Show less' : 'Show full log'}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {hasMore && (
        <div className='mt-3 text-center'>
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className='px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 cursor-pointer'
          >
            {loadingMore ? 'Loading…' : 'Load older logs'}
          </button>
        </div>
      )}
    </div>
  )
}

export default Logs
