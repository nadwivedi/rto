import React, { useState, useEffect, useRef, useCallback } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'

// Real WhatsApp QR codes expire roughly every 20-60s.
// If ours hasn't changed within this window, force a fresh one.
const QR_SAFETY_REFRESH_MS = 45000

// If status stays "initializing" (no QR, no connected) for this long, show a warning + retry.
const STUCK_INIT_WARN_MS = 60000

const statusConfig = {
  authenticated: {
    label: '✅ Connected',
    color: 'bg-green-100 text-green-700 border-green-300',
    card: 'bg-green-50 border-green-200'
  },
  qr_ready: {
    label: '📱 Scan QR Code',
    color: 'bg-orange-100 text-orange-700 border-orange-300',
    card: 'bg-orange-50 border-orange-200'
  },
  initializing: {
    label: '⏳ Connecting...',
    color: 'bg-blue-100 text-blue-700 border-blue-300',
    card: 'bg-blue-50 border-blue-200'
  },
  auth_failure: {
    label: '❌ Auth Failed',
    color: 'bg-red-100 text-red-700 border-red-300',
    card: 'bg-red-50 border-red-200'
  },
  disconnected: {
    label: '🔌 Disconnected',
    color: 'bg-gray-100 text-gray-700 border-gray-300',
    card: 'bg-gray-50 border-gray-200'
  }
}

const WhatsApp = () => {
  const [statusInfo, setStatusInfo] = useState(null)
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionBusy, setActionBusy] = useState(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [todaySentCount, setTodaySentCount] = useState(0)
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedIds, setSelectedIds] = useState([])
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const [dailyLimit, setDailyLimit] = useState(25)
  const [qrSecondsLeft, setQrSecondsLeft] = useState(null)
  const [initElapsed, setInitElapsed] = useState(0)  // seconds spent in initializing/preparing
  const [initStuck, setInitStuck] = useState(false)  // true when init has taken too long

  // Guards a single auto-start attempt per disconnected episode so we don't spam /start.
  const autoStartRef = useRef(false)
  // Tracks the currently-shown QR image so we can detect when a new one arrives vs. going stale.
  const lastQrRef = useRef(null)
  const qrGeneratedAtRef = useRef(null)
  // Tracks when the current "initializing/preparing" phase started
  const initStartedAtRef = useRef(null)

  const fetchStatus = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/api/whatsapp/status`, { withCredentials: true })
      setStatusInfo(res.data)
    } catch (error) {
      console.error('[WhatsApp] Status fetch error:', error)
    }
  }, [])

  const fetchLogs = async (currentPage = page) => {
    try {
      const res = await axios.get(`${API_URL}/api/whatsapp/logs?page=${currentPage}&limit=50`, { withCredentials: true })
      setLogs(res.data.logs || [])
      setTotalPages(res.data.totalPages || 1)
      setTodaySentCount(res.data.todaySentCount || 0)
      setSelectedIds([])
    } catch (error) {
      console.error('[WhatsApp] Logs fetch error:', error)
    }
  }

  const fetchSettings = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/whatsapp-settings`, { withCredentials: true })
      if (res.data?.maxMessagesPerDay) setDailyLimit(res.data.maxMessagesPerDay)
    } catch (error) {
      console.error('[WhatsApp] Settings fetch error:', error)
    }
  }

  const runCheckNow = async () => {
    setActionBusy('check')
    try {
      const res = await axios.post(`${API_URL}/api/whatsapp/trigger-check`, {}, { withCredentials: true })
      toast.success(res.data.message, { autoClose: 5000 })
      await fetchLogs(page)
    } catch (error) {
      toast.error(`Check failed: ${error?.response?.data?.message || error.message}`)
    } finally {
      setActionBusy(null)
    }
  }

  // Initial load
  useEffect(() => {
    const init = async () => {
      await fetchStatus()
      await fetchLogs(1)
      await fetchSettings()
      setLoading(false)
    }
    init()
  }, [])

  // Dynamic polling: fast while connecting/scanning, slow otherwise
  useEffect(() => {
    const currentStatus = statusInfo?.status || 'disconnected'
    const isActivelyConnecting = ['qr_ready', 'initializing'].includes(currentStatus)
    // Also poll faster when DB says initializing but browser is actively launching
    const browserLaunching = statusInfo?.isInitializing
    const intervalMs = (isActivelyConnecting || browserLaunching) ? 1000 : 5000

    const interval = setInterval(fetchStatus, intervalMs)
    return () => clearInterval(interval)
  }, [statusInfo?.status, statusInfo?.isInitializing])

  // Auto-start the session when disconnected (unless user explicitly stopped it).
  // Debounced by 1.2s so a previous destroy() has time to clean up Chrome lock files.
  useEffect(() => {
    if (!statusInfo) return
    const s = statusInfo.status

    if (['authenticated', 'qr_ready', 'initializing'].includes(s)) {
      autoStartRef.current = false
      return
    }

    if (statusInfo.isStopped) return
    if (autoStartRef.current || actionBusy) return
    autoStartRef.current = true

    const timer = setTimeout(() => {
      axios
        .post(`${API_URL}/api/whatsapp/start`, {}, { withCredentials: true })
        .then(() => fetchStatus())
        .catch((err) => console.error('[WhatsApp] Auto-start failed:', err))
    }, 1200)

    return () => clearTimeout(timer)
  }, [statusInfo?.status, statusInfo?.isStopped])

  const doAction = async (action, successMsg, silent = false) => {
    setActionBusy(action)
    try {
      await axios.post(`${API_URL}/api/whatsapp/${action}`, {}, { withCredentials: true })
      if (!silent) toast.success(successMsg)
      await fetchStatus()
    } catch (error) {
      if (!silent) toast.error(`Failed: ${error?.response?.data?.message || error.message}`)
    } finally {
      setActionBusy(null)
    }
  }

  // Track when initializing/preparing phase starts so we can show elapsed time + detect stuck
  useEffect(() => {
    const s = statusInfo?.status || 'disconnected'
    const isConnecting = s === 'initializing' || (s === 'disconnected' && !statusInfo?.isStopped)

    if (isConnecting) {
      if (!initStartedAtRef.current) {
        initStartedAtRef.current = Date.now()
        setInitElapsed(0)
        setInitStuck(false)
      }
    } else {
      initStartedAtRef.current = null
      setInitElapsed(0)
      setInitStuck(false)
    }
  }, [statusInfo?.status, statusInfo?.isStopped])

  // Elapsed timer tick — updates every second while in connecting/preparing phase
  useEffect(() => {
    const s = statusInfo?.status || 'disconnected'
    const isConnecting = s === 'initializing' || (s === 'disconnected' && !statusInfo?.isStopped)

    if (!isConnecting) return

    const tick = setInterval(() => {
      if (!initStartedAtRef.current) return
      const elapsed = Math.floor((Date.now() - initStartedAtRef.current) / 1000)
      setInitElapsed(elapsed)
      if (elapsed * 1000 >= STUCK_INIT_WARN_MS) {
        setInitStuck(true)
      }
    }, 1000)

    return () => clearInterval(tick)
  }, [statusInfo?.status, statusInfo?.isStopped])

  // QR tracking — detect new vs. stale QR images
  useEffect(() => {
    const qr = statusInfo?.qrCodeDataUrl
    if (statusInfo?.status === 'qr_ready' && qr) {
      if (lastQrRef.current !== qr) {
        lastQrRef.current = qr
        qrGeneratedAtRef.current = Date.now()
        // QR appeared — reset stuck/elapsed state since we're no longer stuck
        setInitStuck(false)
        initStartedAtRef.current = null
        setInitElapsed(0)
      }
    } else {
      lastQrRef.current = null
      qrGeneratedAtRef.current = null
      setQrSecondsLeft(null)
    }
  }, [statusInfo?.status, statusInfo?.qrCodeDataUrl])

  // Live QR countdown + safety-net auto-renew
  useEffect(() => {
    if (statusInfo?.status !== 'qr_ready') return

    const tick = () => {
      if (!qrGeneratedAtRef.current) return
      if (document.hidden) return
      const elapsed = Date.now() - qrGeneratedAtRef.current
      const left = Math.max(0, Math.ceil((QR_SAFETY_REFRESH_MS - elapsed) / 1000))
      setQrSecondsLeft(left)

      if (elapsed >= QR_SAFETY_REFRESH_MS && actionBusy !== 'renew-qr') {
        doAction('renew-qr', null, true)
      }
    }

    tick()
    const t = setInterval(tick, 1000)
    return () => clearInterval(t)
  }, [statusInfo?.status, actionBusy])

  const handleDeleteLog = async (id) => {
    if (!window.confirm('Are you sure you want to delete this log?')) return
    try {
      await axios.delete(`${API_URL}/api/whatsapp/logs/${id}`, { withCredentials: true })
      toast.success('Log deleted')
      setLogs((prev) => prev.filter((log) => log._id !== id))
      setSelectedIds((prev) => prev.filter((sid) => sid !== id))
    } catch (error) {
      toast.error(`Failed to delete: ${error?.response?.data?.message || error.message}`)
    }
  }

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return
    if (!window.confirm(`Delete ${selectedIds.length} selected message${selectedIds.length === 1 ? '' : 's'}? This cannot be undone.`)) return
    setBulkDeleting(true)
    try {
      const res = await axios.post(
        `${API_URL}/api/whatsapp/logs/bulk-delete`,
        { ids: selectedIds },
        { withCredentials: true }
      )
      toast.success(res.data.message || 'Selected logs deleted')
      setLogs((prev) => prev.filter((log) => !selectedIds.includes(log._id)))
      setSelectedIds([])
    } catch (error) {
      toast.error(`Failed to delete: ${error?.response?.data?.message || error.message}`)
    } finally {
      setBulkDeleting(false)
    }
  }

  const toggleSelect = (id) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id])
  }

  const currentStatus = statusInfo?.status || 'disconnected'
  const config = statusConfig[currentStatus] || statusConfig.disconnected
  const isConnected = currentStatus === 'authenticated'
  const isRunning = ['authenticated', 'initializing', 'qr_ready'].includes(currentStatus)
  const isPreparingScanner = !isRunning && !statusInfo?.isStopped  // disconnected but auto-starting

  const filteredLogs = logs.filter((log) => statusFilter === 'all' || log.status === statusFilter)
  const allVisibleSelected = filteredLogs.length > 0 && filteredLogs.every((log) => selectedIds.includes(log._id))

  const toggleSelectAll = () => {
    if (allVisibleSelected) {
      const visibleIds = filteredLogs.map((log) => log._id)
      setSelectedIds((prev) => prev.filter((id) => !visibleIds.includes(id)))
    } else {
      setSelectedIds((prev) => [...new Set([...prev, ...filteredLogs.map((log) => log._id)])])
    }
  }

  // Format elapsed seconds as "12s" or "1m 23s"
  const formatElapsed = (secs) => {
    if (secs < 60) return `${secs}s`
    return `${Math.floor(secs / 60)}m ${secs % 60}s`
  }

  return (
    <div className='p-4 md:p-6 lg:p-8 pt-4 lg:pt-6 max-w-[1400px] mx-auto'>
      <div className='mb-6'>
        <h1 className='text-2xl font-black text-gray-800 mb-1'>📲 WhatsApp Automation</h1>
        <p className='text-sm text-gray-600'>Connect WhatsApp to send automated document expiry alerts to clients.</p>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-5 gap-6'>
        {/* ---- STATUS + CONTROLS CARD ---- */}
        <div className='bg-white rounded-xl shadow-lg border border-gray-200 p-6 lg:col-span-1 space-y-4'>
          <h2 className='text-base font-bold text-gray-800 flex items-center gap-2'>
            💬 Connection Status
          </h2>

          {/* Status Badge */}
          <div className={`flex items-center justify-between p-3 rounded-lg border ${config.card}`}>
            <span className='text-xs font-semibold text-gray-500 uppercase tracking-wide'>Status</span>
            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${config.color}`}>
              {config.label}
            </span>
          </div>

          {/* Phone Number when connected */}
          {isConnected && statusInfo?.phoneNumber && (
            <div className='p-3 rounded-lg bg-green-50 border border-green-200'>
              <p className='text-xs text-green-600 font-semibold'>Active Number</p>
              <p className='text-sm text-green-800 font-bold mt-0.5'>+{statusInfo.phoneNumber}</p>
              {statusInfo?.lastConnectedAt && (
                <p className='text-[11px] text-green-500 mt-1'>
                  Connected: {new Date(statusInfo.lastConnectedAt).toLocaleString()}
                </p>
              )}
            </div>
          )}

          {/* QR Code */}
          {currentStatus === 'qr_ready' && statusInfo?.qrCodeDataUrl && (
            <div className='flex flex-col items-center p-4 border-2 border-dashed border-orange-300 rounded-xl bg-orange-50'>
              <p className='text-xs font-semibold text-orange-700 mb-2'>Open WhatsApp → Linked Devices → Link a Device</p>
              <img
                src={statusInfo.qrCodeDataUrl}
                alt='WhatsApp QR Code'
                className='w-52 h-52 rounded-xl border-4 border-white shadow-lg'
              />
              <p className='text-[11px] text-orange-500 mt-2 mb-3'>
                {actionBusy === 'renew-qr'
                  ? 'Getting a fresh code...'
                  : qrSecondsLeft !== null
                    ? `Auto-refreshing in ${qrSecondsLeft}s if not scanned`
                    : 'Waiting for scan...'}
              </p>

              <button
                onClick={() => doAction('renew-qr', 'Refreshing QR code...')}
                disabled={actionBusy === 'renew-qr'}
                className='flex items-center gap-2 px-4 py-2 bg-white border border-orange-200 text-orange-700 rounded-lg text-xs font-bold hover:bg-orange-100 transition shadow-sm'
              >
                {actionBusy === 'renew-qr' ? (
                  <div className='w-3 h-3 border-2 border-orange-500 border-t-transparent rounded-full animate-spin' />
                ) : (
                  <span>🔄 Get New QR Now</span>
                )}
              </button>
            </div>
          )}

          {/* Verifying session — after QR scan, before ready */}
          {currentStatus === 'authenticated' && statusInfo?.isInitializing && (
            <div className='flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg'>
              <div className='w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin flex-shrink-0' />
              <div>
                <p className='text-sm text-green-800 font-semibold'>Verifying session...</p>
                <p className='text-xs text-green-500'>WhatsApp confirmed — loading your chats</p>
              </div>
            </div>
          )}

          {/* Initializing spinner */}
          {currentStatus === 'initializing' && !initStuck && (
            <div className='flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg'>
              <div className='w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin flex-shrink-0' />
              <div>
                <p className='text-sm text-blue-800 font-semibold'>
                  Connecting to WhatsApp...
                  {initElapsed > 0 && (
                    <span className='ml-1 text-blue-400 font-normal text-xs'>{formatElapsed(initElapsed)}</span>
                  )}
                </p>
                <p className='text-xs text-blue-500'>If you scanned QR, please wait a moment</p>
              </div>
            </div>
          )}

          {/* Preparing scanner spinner (disconnected, auto-starting) */}
          {isPreparingScanner && !initStuck && (
            <div className='flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg'>
              <div className='w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin flex-shrink-0' />
              <div>
                <p className='text-sm text-blue-800 font-semibold'>
                  Preparing WhatsApp scanner...
                  {initElapsed > 5 && (
                    <span className='ml-1 text-blue-400 font-normal text-xs'>{formatElapsed(initElapsed)}</span>
                  )}
                </p>
                <p className='text-xs text-blue-500'>Your QR code will appear here in a moment</p>
              </div>
            </div>
          )}

          {/* Stuck init warning */}
          {initStuck && (currentStatus === 'initializing' || isPreparingScanner) && (
            <div className='p-3 bg-amber-50 border border-amber-200 rounded-lg'>
              <p className='text-sm text-amber-800 font-semibold mb-1'>⚠️ Taking longer than expected</p>
              <p className='text-xs text-amber-600 mb-2'>
                Connection has been running for {formatElapsed(initElapsed)}. Chrome may need a restart.
              </p>
              <button
                onClick={() => {
                  setInitStuck(false)
                  initStartedAtRef.current = null
                  setInitElapsed(0)
                  autoStartRef.current = false
                  doAction('renew-qr', 'Retrying connection...', true).then(() => fetchStatus())
                }}
                disabled={!!actionBusy}
                className='w-full py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition'
              >
                🔄 Retry Connection
              </button>
            </div>
          )}

          {/* Error */}
          {statusInfo?.lastError && !isConnected && currentStatus !== 'initializing' && !isPreparingScanner && (
            <div className='p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200'>
              <strong>Error:</strong> {statusInfo.lastError}
            </div>
          )}

          {/* ---- ACTION BUTTONS ---- */}
          <div className='flex flex-col gap-2 pt-2 border-t border-gray-100'>
            {/* START/RESUME: only when the user has intentionally stopped the session */}
            {!isRunning && statusInfo?.isStopped && (
              <button
                onClick={() => doAction('start', 'Session started! Wait for QR or connection...')}
                disabled={actionBusy === 'start'}
                className='w-full py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold text-sm transition shadow-md flex items-center justify-center gap-2'
              >
                {actionBusy === 'start' ? (
                  <><div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' /> Starting...</>
                ) : (
                  <>▶ Resume WhatsApp Session</>
                )}
              </button>
            )}

            {/* STOP: show when running (pauses sending, keeps auth) */}
            {isRunning && (
              <button
                onClick={() => doAction('stop', 'Session stopped. Auth saved — tap Start to resume.')}
                disabled={actionBusy === 'stop'}
                className='w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-bold text-sm transition shadow-md flex items-center justify-center gap-2'
              >
                {actionBusy === 'stop' ? (
                  <><div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' /> Stopping...</>
                ) : (
                  <>⏹ Stop Sending Messages</>
                )}
              </button>
            )}

            {/* LOGOUT: always show when authenticated or running — clears session */}
            {isRunning && (
              <button
                onClick={() => {
                  if (window.confirm('Are you sure? This will clear the WhatsApp session and you will need to scan QR again.')) {
                    doAction('logout', 'Logged out. Session cleared. Scan QR to reconnect.')
                  }
                }}
                disabled={actionBusy === 'logout'}
                className='w-full py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-sm transition shadow-md flex items-center justify-center gap-2'
              >
                {actionBusy === 'logout' ? (
                  <><div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' /> Logging out...</>
                ) : (
                  <>🚪 Logout & Clear Session</>
                )}
              </button>
            )}
          </div>

          {/* Run Check Now — manual trigger for testing */}
          <button
            onClick={runCheckNow}
            disabled={actionBusy === 'check'}
            className='w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-sm transition shadow-md flex items-center justify-center gap-2'
          >
            {actionBusy === 'check' ? (
              <><div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' /> Scanning...</>
            ) : (
              <>🔍 Run Expiry Check Now</>
            )}
          </button>

          {/* Sent Today Summary */}
          <div className='p-3 bg-gray-50 border border-gray-200 rounded-lg text-center'>
            <p className='text-xs text-gray-500'>Messages Sent Today</p>
            <p className='text-2xl font-black text-gray-800'>{todaySentCount} <span className='text-sm font-normal text-gray-400'>/ {dailyLimit}</span></p>
          </div>
        </div>

        {/* ---- LOGS CARD ---- */}
        <div className='bg-white rounded-xl shadow-lg border border-gray-200 p-6 lg:col-span-4'>
          <div className='flex items-center justify-between mb-4'>
            <h2 className='text-base font-bold text-gray-800 flex items-center gap-2'>
              📋 Recent Message Logs
            </h2>
            <div className='flex items-center gap-2'>
              {selectedIds.length > 0 && (
                <button
                  onClick={handleBulkDelete}
                  disabled={bulkDeleting}
                  className='px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold border border-red-600 transition flex items-center gap-2 disabled:opacity-60'
                >
                  {bulkDeleting ? (
                    <><div className='w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin' /> Deleting...</>
                  ) : (
                    <>🗑️ Delete Selected ({selectedIds.length})</>
                  )}
                </button>
              )}
              <button
                onClick={() => { fetchLogs(page); toast.info('Logs refreshed') }}
                className='px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-semibold text-gray-700 border border-gray-300 transition'
              >
                🔄 Refresh
              </button>
            </div>
          </div>

          {/* ---- STATUS FILTER TABS ---- */}
          {(() => {
            const counts = {
              all: logs.length,
              sent: logs.filter(l => l.status === 'sent').length,
              pending: logs.filter(l => l.status === 'pending').length,
              failed: logs.filter(l => l.status === 'failed').length,
            }
            const tabs = [
              { key: 'all',     label: 'All',     emoji: '📋', active: 'bg-gray-800 text-white border-gray-800',     inactive: 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50',     badge: 'bg-gray-200 text-gray-800' },
              { key: 'sent',    label: 'Sent',    emoji: '✅', active: 'bg-green-600 text-white border-green-600',   inactive: 'bg-white text-green-700 border-green-300 hover:bg-green-50',   badge: 'bg-green-100 text-green-800' },
              { key: 'pending', label: 'Pending', emoji: '⏳', active: 'bg-yellow-500 text-white border-yellow-500', inactive: 'bg-white text-yellow-700 border-yellow-300 hover:bg-yellow-50', badge: 'bg-yellow-100 text-yellow-800' },
              { key: 'failed',  label: 'Failed',  emoji: '❌', active: 'bg-red-600 text-white border-red-600',       inactive: 'bg-white text-red-700 border-red-300 hover:bg-red-50',         badge: 'bg-red-100 text-red-800' },
            ]
            return (
              <div className='flex flex-wrap gap-2 mb-4'>
                {tabs.map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => { setStatusFilter(tab.key); setSelectedIds([]) }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition ${
                      statusFilter === tab.key ? tab.active : tab.inactive
                    }`}
                  >
                    <span>{tab.emoji}</span>
                    <span>{tab.label}</span>
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                      statusFilter === tab.key ? 'bg-white/20 text-white' : tab.badge
                    }`}>
                      {counts[tab.key]}
                    </span>
                  </button>
                ))}
              </div>
            )
          })()}

          <div className='overflow-x-auto'>
            <table className='w-full text-left border-collapse'>
              <thead>
                <tr className='bg-gray-50 border-y border-gray-200'>
                  <th className='py-3 px-4 text-center'>
                    <input
                      type='checkbox'
                      checked={allVisibleSelected}
                      onChange={toggleSelectAll}
                      className='w-4 h-4 cursor-pointer accent-red-600'
                      title='Select all'
                    />
                  </th>
                  <th className='py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider'>Date & Time</th>
                  <th className='py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider'>Party / Mobile</th>
                  <th className='py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider'>Document</th>
                  <th className='py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider'>Message Preview</th>
                  <th className='py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider'>Status</th>
                  <th className='py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider'>Sent At</th>
                  <th className='py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center'>Action</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-gray-100'>
                {loading ? (
                  <tr><td colSpan='8' className='py-8 text-center text-sm text-gray-400'>Loading...</td></tr>
                ) : logs.length === 0 ? (
                  <tr><td colSpan='8' className='py-8 text-center text-sm text-gray-400'>No messages logged yet. They will appear here once alerts are triggered.</td></tr>
                ) : (
                  filteredLogs.length === 0 ? (
                    <tr><td colSpan='8' className='py-8 text-center text-sm text-gray-400'>No {statusFilter} messages found.</td></tr>
                  ) :
                  filteredLogs.map((log) => {
                    const d = new Date(log.createdAt);
                    const dateStr = d.toLocaleDateString('en-IN');
                    const timeStr = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
                    const sentD = log.sentAt ? new Date(log.sentAt) : null;
                    const sentDateStr = sentD ? sentD.toLocaleDateString('en-IN') : null;
                    const sentTimeStr = sentD ? sentD.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : null;
                    return (
                    <tr key={log._id} className={`transition ${selectedIds.includes(log._id) ? 'bg-red-50' : 'hover:bg-gray-50'}`}>
                      <td className='py-3 px-4 text-center'>
                        <input
                          type='checkbox'
                          checked={selectedIds.includes(log._id)}
                          onChange={() => toggleSelect(log._id)}
                          className='w-4 h-4 cursor-pointer accent-red-600'
                        />
                      </td>
                      <td className='py-3 px-4 whitespace-nowrap'>
                        <div className='text-sm text-gray-800 font-medium'>{dateStr}</div>
                        <div className='text-xs text-gray-500'>{timeStr}</div>
                      </td>
                      <td className='py-3 px-4'>
                        <div className='text-sm text-gray-800 font-bold'>{log.ownerName || 'Unknown Party'}</div>
                        <div className='text-xs text-gray-500'>{log.targetNumber}</div>
                      </td>
                      <td className='py-3 px-4'>
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                          log.documentType === 'Tax' ? 'bg-yellow-100 text-yellow-800' :
                          log.documentType === 'Fitness' ? 'bg-blue-100 text-blue-800' :
                          log.documentType === 'Puc' ? 'bg-purple-100 text-purple-800' :
                          log.documentType === 'Gps' ? 'bg-teal-100 text-teal-800' :
                          'bg-pink-100 text-pink-800'
                        }`}>
                          {log.documentType}
                        </span>
                      </td>
                      <td className='py-3 px-4 text-xs text-gray-500 max-w-[220px]'>
                        <div className='truncate' title={log.messageBody}>{log.messageBody}</div>
                      </td>
                      <td className='py-3 px-4'>
                        <span className={`px-2 py-1 rounded-full text-[11px] font-bold ${
                          log.status === 'sent' ? 'bg-green-100 text-green-700' :
                          log.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {log.status === 'sent' ? '✓ SENT' :
                           log.status === 'pending' ? '⏳ PENDING' : '✗ FAILED'}
                        </span>
                        {log.errorReason && (
                          <div className='text-[10px] text-red-500 mt-1 max-w-[120px] truncate' title={log.errorReason}>
                            {log.errorReason}
                          </div>
                        )}
                      </td>
                      <td className='py-3 px-4 whitespace-nowrap'>
                        {sentD ? (
                          <>
                            <div className='text-sm text-gray-800 font-medium'>{sentDateStr}</div>
                            <div className='text-xs text-gray-500'>{sentTimeStr}</div>
                          </>
                        ) : (
                          <span className='text-xs text-gray-400'>-</span>
                        )}
                      </td>
                      <td className='py-3 px-4 text-center border-l border-gray-100'>
                        <button
                          onClick={() => handleDeleteLog(log._id)}
                          className='text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 transition p-1.5 rounded-md'
                          title='Delete Log'
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className='flex items-center justify-between mt-4 px-4 py-3 bg-gray-50 border-t border-gray-200 rounded-b-xl'>
              <div className='text-sm text-gray-500'>
                Showing Page <span className='font-semibold text-gray-800'>{page}</span> of <span className='font-semibold text-gray-800'>{totalPages}</span>
              </div>
              <div className='flex items-center gap-2'>
                <button
                  onClick={() => {
                    const newPage = Math.max(1, page - 1);
                    setPage(newPage);
                    fetchLogs(newPage);
                  }}
                  disabled={page === 1}
                  className='px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition'
                >
                  Previous
                </button>
                <button
                  onClick={() => {
                    const newPage = Math.min(totalPages, page + 1);
                    setPage(newPage);
                    fetchLogs(newPage);
                  }}
                  disabled={page === totalPages}
                  className='px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition'
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default WhatsApp
