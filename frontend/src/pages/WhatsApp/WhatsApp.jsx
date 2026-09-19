import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-toastify'
import { ArrowLeft, Search, Loader2, Send, Clock } from 'lucide-react'
import useWhatsAppStatus from './useWhatsAppStatus'
import ConnectionCard from './components/ConnectionCard'
import MessageLogs from './components/MessageLogs'

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'
const LOGS_REFRESH_MS = 30000

const ACTION_MESSAGES = {
  connect: 'Connecting to WhatsApp...',
  cancel: 'Connection cancelled',
  stop: 'Sending paused. Your login is saved.',
  logout: 'Logged out of WhatsApp',
  'renew-qr': 'Getting a new QR code...',
}

const WhatsApp = () => {
  const navigate = useNavigate()
  const { status, error: statusError, refresh: refreshStatus } = useWhatsAppStatus()
  const [busy, setBusy] = useState(null)

  const [logs, setLogs] = useState([])
  const [logsLoading, setLogsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [todaySentCount, setTodaySentCount] = useState(0)
  const [dailyLimit, setDailyLimit] = useState(null)

  const fetchLogs = useCallback(async (p) => {
    try {
      const res = await axios.get(`${API_URL}/api/whatsapp/logs?page=${p}&limit=50`, { withCredentials: true })
      setLogs(res.data.logs || [])
      setTotalPages(res.data.totalPages || 1)
      setTodaySentCount(res.data.todaySentCount || 0)
    } catch (err) {
      console.error('[WhatsApp] Logs fetch error:', err)
    } finally {
      setLogsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLogs(page)
    const t = setInterval(() => { if (!document.hidden) fetchLogs(page) }, LOGS_REFRESH_MS)
    return () => clearInterval(t)
  }, [page, fetchLogs])

  useEffect(() => {
    axios.get(`${API_URL}/api/whatsapp-settings`, { withCredentials: true })
      .then(res => setDailyLimit(res.data?.maxMessagesPerDay ?? null))
      .catch(() => {})
  }, [])

  const doAction = async (action) => {
    setBusy(action)
    try {
      await axios.post(`${API_URL}/api/whatsapp/${action}`, {}, { withCredentials: true })
      if (ACTION_MESSAGES[action]) toast.success(ACTION_MESSAGES[action])
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message)
    } finally {
      await refreshStatus()
      setBusy(null)
    }
  }

  const runCheckNow = async () => {
    setBusy('check')
    try {
      const res = await axios.post(`${API_URL}/api/whatsapp/trigger-check`, {}, { withCredentials: true })
      toast.success(res.data.message, { autoClose: 5000 })
      await Promise.all([fetchLogs(page), refreshStatus()])
    } catch (err) {
      toast.error(`Check failed: ${err?.response?.data?.message || err.message}`)
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className='p-4 md:p-6 lg:p-8 pt-4 lg:pt-6 max-w-[1400px] mx-auto'>
      <div className='mb-6 flex items-center gap-3'>
        <button
          onClick={() => navigate('/')}
          className='flex items-center justify-center w-10 h-10 rounded-xl bg-white border border-gray-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition flex-shrink-0'
          title='Back to Home'
        >
          <ArrowLeft className='w-5 h-5 text-gray-600' />
        </button>
        <div>
          <h1 className='text-2xl font-black text-gray-800'>WhatsApp Automation</h1>
          <p className='text-sm text-gray-600'>Send document expiry alerts to your clients automatically.</p>
        </div>
      </div>

      {statusError && !status && (
        <div className='mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700'>
          Could not reach the server: {statusError}
        </div>
      )}

      <div className='grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6 items-start'>
        <div className='space-y-4'>
          <div className='bg-white rounded-xl shadow-lg border border-gray-200 p-5'>
            <ConnectionCard status={status} onAction={doAction} busy={busy} />
          </div>

          <div className='grid grid-cols-2 gap-3'>
            <div className='bg-white rounded-xl border border-gray-200 shadow-sm p-3'>
              <p className='text-xs text-gray-500 flex items-center gap-1'><Send className='w-3.5 h-3.5' /> Sent today</p>
              <p className='text-2xl font-black text-gray-800 mt-1'>
                {todaySentCount}
                {dailyLimit !== null && <span className='text-sm font-normal text-gray-400'> / {dailyLimit}</span>}
              </p>
            </div>
            <div className='bg-white rounded-xl border border-gray-200 shadow-sm p-3'>
              <p className='text-xs text-gray-500 flex items-center gap-1'><Clock className='w-3.5 h-3.5' /> Waiting</p>
              <p className='text-2xl font-black text-gray-800 mt-1'>{status?.pendingCount ?? '—'}</p>
            </div>
          </div>

          <button
            onClick={runCheckNow}
            disabled={busy === 'check'}
            className='w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold text-sm transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-60'
          >
            {busy === 'check' ? <Loader2 className='w-4 h-4 animate-spin' /> : <Search className='w-4 h-4' />}
            {busy === 'check' ? 'Checking...' : 'Run expiry check now'}
          </button>
        </div>

        <div className='bg-white rounded-xl shadow-lg border border-gray-200 p-4 md:p-6 min-w-0'>
          <MessageLogs
            logs={logs}
            loading={logsLoading}
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            onRefresh={() => { fetchLogs(page); toast.info('Logs refreshed') }}
            onRemoved={(ids) => setLogs(prev => prev.filter(l => !ids.includes(l._id)))}
          />
        </div>
      </div>
    </div>
  )
}

export default WhatsApp
