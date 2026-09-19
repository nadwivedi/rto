import React, { useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { RefreshCw, Trash2, Loader2 } from 'lucide-react'

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'

const TABS = [
  { key: 'all', label: 'All', active: 'bg-gray-800 text-white border-gray-800', inactive: 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50' },
  { key: 'sent', label: 'Sent', active: 'bg-green-600 text-white border-green-600', inactive: 'bg-white text-green-700 border-green-300 hover:bg-green-50' },
  { key: 'pending', label: 'Pending', active: 'bg-yellow-500 text-white border-yellow-500', inactive: 'bg-white text-yellow-700 border-yellow-300 hover:bg-yellow-50' },
  { key: 'failed', label: 'Failed', active: 'bg-red-600 text-white border-red-600', inactive: 'bg-white text-red-700 border-red-300 hover:bg-red-50' },
]

const DOC_COLORS = {
  Tax: 'bg-yellow-100 text-yellow-800',
  Fitness: 'bg-blue-100 text-blue-800',
  Puc: 'bg-purple-100 text-purple-800',
  Gps: 'bg-teal-100 text-teal-800',
}

const STATUS_STYLES = {
  sent: ['bg-green-100 text-green-700', 'Sent'],
  pending: ['bg-yellow-100 text-yellow-800', 'Pending'],
  failed: ['bg-red-100 text-red-700', 'Failed'],
}

const fmtDate = (d) => {
  const date = new Date(d)
  return {
    day: date.toLocaleDateString('en-IN'),
    time: date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
  }
}

export default function MessageLogs({ logs, loading, page, totalPages, onPageChange, onRefresh, onRemoved }) {
  const [filter, setFilter] = useState('all')
  const [selected, setSelected] = useState([])
  const [deleting, setDeleting] = useState(false)

  const visible = logs.filter(l => filter === 'all' || l.status === filter)
  const counts = TABS.reduce((acc, t) => ({ ...acc, [t.key]: t.key === 'all' ? logs.length : logs.filter(l => l.status === t.key).length }), {})
  const allSelected = visible.length > 0 && visible.every(l => selected.includes(l._id))

  const toggle = (id) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  const toggleAll = () => {
    const ids = visible.map(l => l._id)
    setSelected(prev => allSelected ? prev.filter(id => !ids.includes(id)) : [...new Set([...prev, ...ids])])
  }

  const deleteOne = async (id) => {
    if (!window.confirm('Delete this log entry?')) return
    try {
      await axios.delete(`${API_URL}/api/whatsapp/logs/${id}`, { withCredentials: true })
      toast.success('Log deleted')
      onRemoved([id])
      setSelected(prev => prev.filter(x => x !== id))
    } catch (err) {
      toast.error(`Failed to delete: ${err?.response?.data?.message || err.message}`)
    }
  }

  const deleteSelected = async () => {
    if (!selected.length) return
    if (!window.confirm(`Delete ${selected.length} selected log${selected.length === 1 ? '' : 's'}? This cannot be undone.`)) return
    setDeleting(true)
    try {
      const res = await axios.post(`${API_URL}/api/whatsapp/logs/bulk-delete`, { ids: selected }, { withCredentials: true })
      toast.success(res.data.message || 'Selected logs deleted')
      onRemoved(selected)
      setSelected([])
    } catch (err) {
      toast.error(`Failed to delete: ${err?.response?.data?.message || err.message}`)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div>
      <div className='flex flex-wrap items-center justify-between gap-2 mb-4'>
        <h2 className='text-base font-bold text-gray-800'>Message log</h2>
        <div className='flex items-center gap-2'>
          {selected.length > 0 && (
            <button
              onClick={deleteSelected}
              disabled={deleting}
              className='px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-60'
            >
              {deleting ? <Loader2 className='w-3.5 h-3.5 animate-spin' /> : <Trash2 className='w-3.5 h-3.5' />}
              Delete ({selected.length})
            </button>
          )}
          <button
            onClick={() => { setSelected([]); onRefresh() }}
            className='px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-semibold text-gray-700 border border-gray-300 transition flex items-center gap-1.5'
          >
            <RefreshCw className='w-3.5 h-3.5' /> Refresh
          </button>
        </div>
      </div>

      <div className='flex flex-wrap gap-2 mb-4'>
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => { setFilter(tab.key); setSelected([]) }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition ${filter === tab.key ? tab.active : tab.inactive}`}
          >
            {tab.label}
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${filter === tab.key ? 'bg-white/20' : 'bg-gray-100 text-gray-700'}`}>
              {counts[tab.key]}
            </span>
          </button>
        ))}
      </div>

      <div className='overflow-x-auto -mx-4 md:mx-0'>
        <table className='w-full text-left border-collapse min-w-[760px]'>
          <thead>
            <tr className='bg-gray-50 border-y border-gray-200'>
              <th className='py-3 px-4 text-center w-10'>
                <input type='checkbox' checked={allSelected} onChange={toggleAll} className='w-4 h-4 cursor-pointer accent-red-600' title='Select all' />
              </th>
              {['Created', 'Party / Mobile', 'Document', 'Message', 'Status', 'Sent at', ''].map(h => (
                <th key={h} className='py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider'>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className='divide-y divide-gray-100'>
            {loading ? (
              <tr><td colSpan='8' className='py-10 text-center text-sm text-gray-400'>Loading...</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan='8' className='py-10 text-center text-sm text-gray-400'>No messages yet. Alerts appear here once they are queued.</td></tr>
            ) : visible.length === 0 ? (
              <tr><td colSpan='8' className='py-10 text-center text-sm text-gray-400'>No {filter} messages on this page.</td></tr>
            ) : visible.map(log => {
              const created = fmtDate(log.createdAt)
              const sent = log.sentAt ? fmtDate(log.sentAt) : null
              const [statusClass, statusLabel] = STATUS_STYLES[log.status] || STATUS_STYLES.failed
              return (
                <tr key={log._id} className={`transition ${selected.includes(log._id) ? 'bg-red-50' : 'hover:bg-gray-50'}`}>
                  <td className='py-3 px-4 text-center'>
                    <input type='checkbox' checked={selected.includes(log._id)} onChange={() => toggle(log._id)} className='w-4 h-4 cursor-pointer accent-red-600' />
                  </td>
                  <td className='py-3 px-4 whitespace-nowrap'>
                    <div className='text-sm text-gray-800 font-medium'>{created.day}</div>
                    <div className='text-xs text-gray-500'>{created.time}</div>
                  </td>
                  <td className='py-3 px-4'>
                    <div className='text-sm text-gray-800 font-bold'>{log.ownerName || 'Unknown party'}</div>
                    <div className='text-xs text-gray-500'>{log.targetNumber}</div>
                  </td>
                  <td className='py-3 px-4'>
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${DOC_COLORS[log.documentType] || 'bg-pink-100 text-pink-800'}`}>
                      {log.documentType}
                    </span>
                  </td>
                  <td className='py-3 px-4 text-xs text-gray-500 max-w-[240px]'>
                    <div className='truncate' title={log.messageBody}>{log.messageBody}</div>
                  </td>
                  <td className='py-3 px-4'>
                    <span className={`px-2 py-1 rounded-full text-[11px] font-bold ${statusClass}`}>{statusLabel}</span>
                    {log.errorReason && (
                      <div className={`text-[10px] mt-1 max-w-[160px] truncate ${log.status === 'pending' ? 'text-amber-600' : 'text-red-500'}`} title={log.errorReason}>
                        {log.errorReason}
                      </div>
                    )}
                  </td>
                  <td className='py-3 px-4 whitespace-nowrap'>
                    {sent ? (
                      <>
                        <div className='text-sm text-gray-800 font-medium'>{sent.day}</div>
                        <div className='text-xs text-gray-500'>{sent.time}</div>
                      </>
                    ) : <span className='text-xs text-gray-400'>—</span>}
                  </td>
                  <td className='py-3 px-4 text-center'>
                    <button onClick={() => deleteOne(log._id)} className='text-red-500 hover:text-red-700 hover:bg-red-50 transition p-1.5 rounded-md' title='Delete'>
                      <Trash2 className='w-4 h-4' />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className='flex items-center justify-between mt-4 pt-3 border-t border-gray-200'>
          <span className='text-sm text-gray-500'>Page <b className='text-gray-800'>{page}</b> of <b className='text-gray-800'>{totalPages}</b></span>
          <div className='flex gap-2'>
            <button
              onClick={() => { setSelected([]); onPageChange(page - 1) }}
              disabled={page <= 1}
              className='px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
            >Previous</button>
            <button
              onClick={() => { setSelected([]); onPageChange(page + 1) }}
              disabled={page >= totalPages}
              className='px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
            >Next</button>
          </div>
        </div>
      )}
    </div>
  )
}
