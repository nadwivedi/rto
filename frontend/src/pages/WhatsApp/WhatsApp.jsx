import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'

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

  const fetchStatus = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/whatsapp/status`, { withCredentials: true })
      setStatusInfo(res.data)
    } catch (error) {
      console.error('[WhatsApp] Status fetch error:', error)
    }
  }

  const fetchLogs = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/whatsapp/logs`, { withCredentials: true })
      setLogs(res.data || [])
    } catch (error) {
      console.error('[WhatsApp] Logs fetch error:', error)
    }
  }

  const runCheckNow = async () => {
    setActionBusy('check')
    try {
      const res = await axios.post(`${API_URL}/api/whatsapp/trigger-check`, {}, { withCredentials: true })
      toast.success(res.data.message)
      await fetchLogs()
    } catch (error) {
      toast.error(`Check failed: ${error?.response?.data?.message || error.message}`)
    } finally {
      setActionBusy(null)
    }
  }

  // Dynamic polling: 400ms while connecting/scanning QR, 5s otherwise
  useEffect(() => {
    const init = async () => {
      await fetchStatus()
      await fetchLogs()
      setLoading(false)
    }
    init()
  }, [])

  useEffect(() => {
    const currentStatus = statusInfo?.status || 'disconnected'
    const isActivelyConnecting = ['qr_ready', 'initializing'].includes(currentStatus)
    const intervalMs = isActivelyConnecting ? 400 : 5000

    const interval = setInterval(fetchStatus, intervalMs)
    return () => clearInterval(interval)
  }, [statusInfo?.status])

  const doAction = async (action, successMsg) => {
    setActionBusy(action)
    try {
      await axios.post(`${API_URL}/api/whatsapp/${action}`, {}, { withCredentials: true })
      toast.success(successMsg)
      await fetchStatus()
    } catch (error) {
      toast.error(`Failed: ${error?.response?.data?.message || error.message}`)
    } finally {
      setActionBusy(null)
    }
  }

  const currentStatus = statusInfo?.status || 'disconnected'
  const config = statusConfig[currentStatus] || statusConfig.disconnected
  const isConnected = currentStatus === 'authenticated'
  const isRunning = ['authenticated', 'initializing', 'qr_ready'].includes(currentStatus)

  return (
    <div className='p-4 md:p-6 lg:p-8 pt-4 lg:pt-6 max-w-[1400px] mx-auto'>
      <div className='mb-6'>
        <h1 className='text-2xl font-black text-gray-800 mb-1'>📲 WhatsApp Automation</h1>
        <p className='text-sm text-gray-600'>Connect WhatsApp to send automated document expiry alerts to clients.</p>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
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
              <p className='text-[11px] text-orange-500 mt-2'>QR refreshes automatically every ~30s</p>
            </div>
          )}

          {/* Initializing spinner */}
          {currentStatus === 'initializing' && (
            <div className='flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg'>
              <div className='w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin flex-shrink-0' />
              <div>
                <p className='text-sm text-blue-800 font-semibold'>Connecting to WhatsApp...</p>
                <p className='text-xs text-blue-500'>If you scanned QR, please wait a moment</p>
              </div>
            </div>
          )}

          {/* Error */}
          {statusInfo?.lastError && !isConnected && (
            <div className='p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200'>
              <strong>Error:</strong> {statusInfo.lastError}
            </div>
          )}

          {/* ---- ACTION BUTTONS ---- */}
          <div className='flex flex-col gap-2 pt-2 border-t border-gray-100'>
            {/* START: show when disconnected, stopped, auth_failure */}
            {!isRunning && (
              <button
                onClick={() => doAction('start', 'Session started! Wait for QR or connection...')}
                disabled={actionBusy === 'start'}
                className='w-full py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold text-sm transition shadow-md flex items-center justify-center gap-2'
              >
                {actionBusy === 'start' ? (
                  <><div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' /> Starting...</>
                ) : (
                  <>▶ Start WhatsApp Session</>
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
            <p className='text-2xl font-black text-gray-800'>{logs.filter(l => {
              const today = new Date()
              const logDate = new Date(l.sentAt || l.createdAt)
              return l.status === 'sent' && logDate.toDateString() === today.toDateString()
            }).length} <span className='text-sm font-normal text-gray-400'>/ 30</span></p>
          </div>
        </div>

        {/* ---- LOGS CARD ---- */}
        <div className='bg-white rounded-xl shadow-lg border border-gray-200 p-6 lg:col-span-2'>
          <div className='flex items-center justify-between mb-4'>
            <h2 className='text-base font-bold text-gray-800 flex items-center gap-2'>
              📋 Recent Message Logs
            </h2>
            <button
              onClick={() => { fetchLogs(); toast.info('Logs refreshed') }}
              className='px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-semibold text-gray-700 border border-gray-300 transition'
            >
              🔄 Refresh
            </button>
          </div>

          <div className='overflow-x-auto'>
            <table className='w-full text-left border-collapse'>
              <thead>
                <tr className='bg-gray-50 border-y border-gray-200'>
                  <th className='py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider'>Date & Time</th>
                  <th className='py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider'>Mobile No.</th>
                  <th className='py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider'>Document</th>
                  <th className='py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider'>Message Preview</th>
                  <th className='py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider'>Status</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-gray-100'>
                {loading ? (
                  <tr><td colSpan='5' className='py-8 text-center text-sm text-gray-400'>Loading...</td></tr>
                ) : logs.length === 0 ? (
                  <tr><td colSpan='5' className='py-8 text-center text-sm text-gray-400'>No messages logged yet. They will appear here once alerts are triggered.</td></tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log._id} className='hover:bg-gray-50 transition'>
                      <td className='py-3 px-4 text-xs text-gray-600 whitespace-nowrap'>
                        {new Date(log.createdAt).toLocaleString('en-IN')}
                      </td>
                      <td className='py-3 px-4 text-sm text-gray-800 font-semibold'>
                        {log.targetNumber}
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
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WhatsApp
