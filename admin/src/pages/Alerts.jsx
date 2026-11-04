import { useState, useEffect, useCallback } from 'react'
import { AlertTriangle, CheckCircle2, OctagonAlert, RefreshCw } from 'lucide-react'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://api.rtosarthi.com'

const TABS = [
  { id: 'open', label: 'Open' },
  { id: 'resolved', label: 'Resolved' },
  { id: 'all', label: 'All' }
]

const formatDateTime = (value) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const SEVERITY = {
  critical: { label: 'Critical', icon: OctagonAlert, chip: 'bg-red-50 text-red-700 border-red-200', bar: 'border-l-red-600' },
  warning: { label: 'Warning', icon: AlertTriangle, chip: 'bg-amber-50 text-amber-700 border-amber-200', bar: 'border-l-amber-500' }
}

// Tells the sidebar badge to reload after an alert is resolved here
export const ALERTS_CHANGED_EVENT = 'admin-alerts-changed'

const Alerts = () => {
  const [tab, setTab] = useState('open')
  const [alerts, setAlerts] = useState([])
  const [counts, setCounts] = useState({ openCount: 0, criticalCount: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState(null)

  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const response = await fetch(`${BACKEND_URL}/api/admin/alerts?status=${tab}`, { credentials: 'include' })
      const json = await response.json()
      if (json.success) {
        setAlerts(json.data || [])
        setCounts({ openCount: json.openCount || 0, criticalCount: json.criticalCount || 0 })
      } else {
        setError(json.message || 'Failed to load alerts')
      }
    } catch {
      setError('Failed to load alerts')
    } finally {
      setLoading(false)
    }
  }, [tab])

  useEffect(() => {
    fetchAlerts()
  }, [fetchAlerts])

  const resolve = async (id) => {
    setBusyId(id)
    try {
      const url = id === 'all' ? `${BACKEND_URL}/api/admin/alerts/resolve-all` : `${BACKEND_URL}/api/admin/alerts/${id}/resolve`
      const response = await fetch(url, { method: 'PATCH', credentials: 'include' })
      const json = await response.json()
      if (!json.success) setError(json.message || 'Failed to resolve')
      window.dispatchEvent(new Event(ALERTS_CHANGED_EVENT))
      await fetchAlerts()
    } catch {
      setError('Failed to resolve')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div>
      <div className='flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-3 sm:mb-6'>
        <div>
          <h1 className='text-xl sm:text-3xl font-bold text-gray-800'>Alerts</h1>
          <p className='text-xs sm:text-base text-gray-600 mt-0.5 sm:mt-1'>
            Problems only you can fix, like a provider wallet running out or an API going down. Users only see “service temporarily unavailable”.
          </p>
        </div>
        <div className='flex items-center gap-2 shrink-0'>
          <button
            onClick={fetchAlerts}
            disabled={loading}
            className='inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 cursor-pointer'
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Reload
          </button>
          {counts.openCount > 0 && (
            <button
              onClick={() => resolve('all')}
              disabled={busyId !== null}
              className='inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-white bg-stone-900 rounded-lg hover:bg-stone-700 disabled:opacity-50 cursor-pointer'
            >
              <CheckCircle2 className='h-4 w-4' />
              Resolve all
            </button>
          )}
        </div>
      </div>

      <div className='flex items-center gap-1 mb-3 sm:mb-4 border-b border-gray-200'>
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-3 py-2 text-sm font-semibold border-b-2 -mb-px cursor-pointer ${
              tab === t.id ? 'border-stone-900 text-stone-900' : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            {t.label}
            {t.id === 'open' && counts.openCount > 0 && (
              <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[11px] text-white ${counts.criticalCount > 0 ? 'bg-red-600' : 'bg-amber-500'}`}>
                {counts.openCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {error && <div className='mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800'>{error}</div>}

      {loading && alerts.length === 0 ? (
        <div className='p-8 text-center'>
          <div className='inline-block animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full'></div>
        </div>
      ) : alerts.length === 0 ? (
        <div className='bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center'>
          <CheckCircle2 className='h-8 w-8 text-emerald-600 mx-auto' />
          <p className='mt-2 text-sm font-semibold text-gray-800'>{tab === 'open' ? 'All clear' : 'No alerts here'}</p>
          <p className='text-xs text-gray-500 mt-1'>{tab === 'open' ? 'Nothing needs your attention right now.' : 'Resolved alerts show up here.'}</p>
        </div>
      ) : (
        <div className='flex flex-col gap-3'>
          {alerts.map((alert) => {
            const sev = SEVERITY[alert.severity] || SEVERITY.warning
            const Icon = sev.icon
            const user = alert.lastUserId
            return (
              <div
                key={alert._id}
                className={`bg-white rounded-xl border border-gray-100 border-l-4 shadow-sm p-3 sm:p-4 ${alert.resolved ? 'border-l-gray-300 opacity-75' : sev.bar}`}
              >
                <div className='flex flex-col sm:flex-row sm:items-start gap-3'>
                  <div className='min-w-0 flex-1'>
                    <div className='flex flex-wrap items-center gap-2'>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-bold ${sev.chip}`}>
                        <Icon className='h-3 w-3' />
                        {sev.label}
                      </span>
                      {alert.code && <span className='text-[11px] font-mono text-gray-500'>{alert.code}</span>}
                      {alert.count > 1 && (
                        <span className='text-[11px] font-semibold text-gray-600 bg-gray-100 rounded-full px-2 py-0.5'>
                          {alert.count.toLocaleString('en-IN')} times
                        </span>
                      )}
                      {alert.resolved && (
                        <span className='text-[11px] font-semibold text-emerald-700 bg-emerald-50 rounded-full px-2 py-0.5'>
                          Resolved{alert.resolvedBy === 'auto' ? ' automatically' : ''}
                        </span>
                      )}
                    </div>
                    <h2 className='mt-1.5 text-sm sm:text-base font-bold text-gray-900'>{alert.title}</h2>
                    {alert.message && <p className='mt-0.5 text-xs sm:text-sm text-gray-600 break-words'>{alert.message}</p>}
                    <div className='mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-gray-500'>
                      <span>Last: {formatDateTime(alert.lastSeenAt)}</span>
                      {alert.count > 1 && <span>First: {formatDateTime(alert.firstSeenAt)}</span>}
                      {alert.lastVehicleNumber && <span>Vehicle: {alert.lastVehicleNumber}</span>}
                      {user && <span>User: {user.name || user.email || user.mobile1}</span>}
                      {alert.lastVia && <span>Via: {alert.lastVia}</span>}
                      {alert.resolved && alert.resolvedAt && (
                        <span>
                          Resolved {formatDateTime(alert.resolvedAt)}
                          {alert.resolvedBy && alert.resolvedBy !== 'auto' ? ` by ${alert.resolvedBy}` : ''}
                        </span>
                      )}
                    </div>
                  </div>
                  {!alert.resolved && (
                    <button
                      onClick={() => resolve(alert._id)}
                      disabled={busyId !== null}
                      className='shrink-0 self-start inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 disabled:opacity-50 cursor-pointer'
                    >
                      <CheckCircle2 className='h-3.5 w-3.5' />
                      {busyId === alert._id ? 'Resolving…' : 'Mark resolved'}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default Alerts
