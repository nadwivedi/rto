import { useCallback, useEffect, useRef, useState } from 'react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://api.rtosarthi.com'
const ENDPOINT = `${BACKEND_URL}/api/admin/deploy`
const POLL_MS = 2000

const ICON_PATHS = {
  rocket: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12',
  phone: 'M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z',
  layout: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z',
  globe: 'M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9',
  server: 'M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01',
  box: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
  refresh: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
  commit: 'M12 15a3 3 0 100-6 3 3 0 000 6zm0-6V3m0 18v-6',
  check: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  x: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',
  warn: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
}

const Icon = ({ name, className = 'w-4 h-4' }) => (
  <svg className={className} fill='none' stroke='currentColor' viewBox='0 0 24 24'>
    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d={ICON_PATHS[name]} />
  </svg>
)

const Spinner = ({ className = 'w-4 h-4' }) => (
  <svg className={`${className} animate-spin`} fill='none' viewBox='0 0 24 24'>
    <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' />
    <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z' />
  </svg>
)

// What each button updates and how
const TARGET_CARDS = [
  { key: 'all', icon: 'rocket', title: 'Everything', hint: 'Pull, build app + admin + website, restart nginx and backend' },
  { key: 'frontend', icon: 'phone', title: 'App (frontend)', hint: 'Pull, build app.rtosarthi.com, restart nginx' },
  { key: 'admin', icon: 'layout', title: 'Admin panel', hint: 'Pull, build this admin panel, restart nginx' },
  { key: 'webpage', icon: 'globe', title: 'Website', hint: 'Pull, build rtosarthi.com, restart nginx' },
  { key: 'backend', icon: 'server', title: 'Backend', hint: 'Pull and pm2 restart the API' }
]

const STATUS = {
  running: { label: 'Running', spin: true, badge: 'bg-blue-50 text-blue-700 ring-blue-200' },
  success: { label: 'Success', icon: 'check', badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  failed: { label: 'Failed', icon: 'x', badge: 'bg-red-50 text-red-700 ring-red-200' },
  stopped: { label: 'Stopped', icon: 'warn', badge: 'bg-amber-50 text-amber-700 ring-amber-200' }
}

const formatDateTime = (value) => {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })
}

// "1m 12s"
const formatDuration = (from, to) => {
  if (!from) return ''
  const seconds = Math.max(0, Math.round(((to ? new Date(to) : new Date()) - new Date(from)) / 1000))
  return seconds >= 60 ? `${Math.floor(seconds / 60)}m ${seconds % 60}s` : `${seconds}s`
}

const StatusBadge = ({ status }) => {
  const s = STATUS[status] || STATUS.stopped
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${s.badge}`}>
      {s.spin ? <Spinner className='w-3 h-3' /> : <Icon name={s.icon} className='w-3 h-3' />}
      {s.label}
    </span>
  )
}

/**
 * Deploy: pull the latest code on the server and update the app, admin panel, website or backend
 * without signing in to the server. Builds run on the server; the log streams in here.
 */
const Deploy = () => {
  const { logout } = useAuth()
  // logout changes every render; a ref keeps load() stable so it isn't refetched in a loop
  const logoutRef = useRef(logout)
  logoutRef.current = logout
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [confirm, setConfirm] = useState(null)
  const [starting, setStarting] = useState(false)
  // Kept polling after a start until the deploy is over, also while the backend restarts and can't answer
  const [watching, setWatching] = useState(false)
  const [unreachable, setUnreachable] = useState(false)
  // { type: 'success' | 'error', text }
  const [notice, setNotice] = useState(null)
  const logRef = useRef(null)
  const watchedId = useRef(null)

  const load = useCallback(async () => {
    try {
      const response = await axios.get(ENDPOINT, {
        params: watchedId.current ? { id: watchedId.current } : {},
        withCredentials: true
      })
      const next = response.data?.data || null
      setData(next)
      setUnreachable(false)
      return next
    } catch (error) {
      if (error.response?.status === 401) {
        logoutRef.current()
        return null
      }
      // No answer: the backend is restarting
      setUnreachable(true)
      return undefined
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load().then((next) => {
      if (next?.state?.status === 'running') {
        watchedId.current = next.state.id
        setWatching(true)
      }
    })
  }, [load])

  useEffect(() => {
    if (!watching) return undefined
    const timer = setInterval(async () => {
      const next = await load()
      const state = next?.state
      if (state && state.id === watchedId.current && state.status !== 'running') {
        setWatching(false)
        setNotice(state.status === 'success'
          ? { type: 'success', text: 'Deploy finished' }
          : { type: 'error', text: 'Deploy failed — see the log' })
      }
    }, POLL_MS)
    return () => clearInterval(timer)
  }, [watching, load])

  // Follow the end of the log while it grows
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
  }, [data?.log])

  const startDeploy = async () => {
    if (!confirm) return
    try {
      setStarting(true)
      setNotice(null)
      const response = await axios.post(ENDPOINT, confirm, { withCredentials: true })
      watchedId.current = response.data?.data?.id || null
      setConfirm(null)
      setWatching(true)
      await load()
    } catch (error) {
      setConfirm(null)
      setNotice({ type: 'error', text: error.response?.data?.message || 'Could not start the deploy' })
    } finally {
      setStarting(false)
    }
  }

  if (loading) {
    return (
      <div className='flex flex-col items-center justify-center gap-3 py-20 text-gray-500'>
        <Spinner className='w-6 h-6 text-indigo-700' />
        <p className='text-sm'>Loading deploy status…</p>
      </div>
    )
  }

  const state = data?.state
  const running = state?.status === 'running'
  const targets = data?.config?.targets || {}
  const busy = running || watching || starting
  const updatedAdmin = state?.status === 'success' && ['all', 'admin'].includes(state.target)

  return (
    <div className='space-y-4'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h1 className='text-xl md:text-2xl font-bold text-gray-900'>Deploy</h1>
          <p className='mt-0.5 text-sm text-gray-500'>Pull the latest code from GitHub and update the live server</p>
        </div>
        <button type='button' onClick={load} className='flex items-center justify-center gap-1.5 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100'>
          <Icon name='refresh' />
          Refresh
        </button>
      </div>

      {notice && (
        <div className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm font-medium ${notice.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-red-200 bg-red-50 text-red-800'}`}>
          <span className='flex items-center gap-2'>
            <Icon name={notice.type === 'success' ? 'check' : 'x'} />
            {notice.text}
          </span>
          <button type='button' onClick={() => setNotice(null)} className='text-xs font-semibold opacity-70 hover:opacity-100'>Dismiss</button>
        </div>
      )}

      {data?.commit && (
        <div className='flex items-start gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm shadow-sm'>
          <Icon name='commit' className='mt-0.5 w-4 h-4 shrink-0 text-gray-500' />
          <p className='min-w-0 text-gray-600'>
            <span className='text-xs font-semibold uppercase tracking-wide text-gray-400'>Live code · </span>
            <span className='font-mono text-xs font-semibold text-gray-800'>{data.commit.hash}</span>{' '}
            <span className='font-medium text-gray-800'>{data.commit.subject}</span>
            <span className='text-gray-400'> · {data.commit.author} · {formatDateTime(data.commit.date)} · {data.config?.branch} · pm2 “{data.config?.pm2Name}”</span>
          </p>
        </div>
      )}

      {data && !data.supported && (
        <div className='flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800'>
          <Icon name='warn' className='mt-0.5 w-4 h-4 shrink-0' />
          Deploy works only on the live server (Linux with deploy/deploy.sh). The buttons are turned off here.
        </div>
      )}

      <section className='grid gap-2 sm:grid-cols-2 md:gap-3 xl:grid-cols-5'>
        {TARGET_CARDS.map((card) => {
          const disabled = busy || !data?.supported
          const main = card.key === 'all'
          return (
            <div key={card.key} className={`flex flex-col rounded-2xl border bg-white p-4 shadow-sm ${main ? 'border-indigo-300' : 'border-gray-200'}`}>
              <div className='flex items-center gap-2.5'>
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${main ? 'bg-indigo-900 text-white' : 'bg-indigo-50 text-indigo-700'}`}>
                  <Icon name={card.icon} />
                </span>
                <p className='text-sm font-bold text-gray-900'>{card.title}</p>
              </div>
              <p className='mt-2 flex-1 text-xs text-gray-500'>{card.hint}</p>
              <div className='mt-3 grid gap-1.5'>
                <button
                  type='button'
                  disabled={disabled}
                  onClick={() => setConfirm({ target: card.key, install: false })}
                  className='flex items-center justify-center gap-1.5 rounded-lg bg-indigo-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-indigo-800 disabled:opacity-40'
                >
                  <Icon name='rocket' className='w-3.5 h-3.5' />
                  Deploy
                </button>
                <button
                  type='button'
                  disabled={disabled}
                  onClick={() => setConfirm({ target: card.key, install: true })}
                  className='flex items-center justify-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-100 disabled:opacity-40'
                  title='Use when package.json changed (new or updated npm packages)'
                >
                  <Icon name='box' className='w-3.5 h-3.5' />
                  Deploy + npm install
                </button>
              </div>
            </div>
          )
        })}
      </section>

      <section className='overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm'>
        <div className='flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-gray-200 px-4 py-3 md:px-5'>
          <h2 className='text-sm font-bold text-gray-800'>{running || watching ? 'Current Deploy' : 'Last Deploy'}</h2>
          {state && (
            <>
              <StatusBadge status={state.status} />
              <span className='text-xs text-gray-500'>
                {targets[state.target] || state.target}{state.install ? ' + npm install' : ''} · {formatDateTime(state.startedAt)} · {formatDuration(state.startedAt, state.finishedAt)}
              </span>
            </>
          )}
          {unreachable && watching && (
            <span className='inline-flex items-center gap-1 text-xs font-semibold text-amber-700'>
              <Spinner className='w-3 h-3' />
              Backend restarting…
            </span>
          )}
          {updatedAdmin && !watching && (
            <button type='button' onClick={() => window.location.reload()} className='ml-auto rounded-lg border border-gray-300 bg-white px-3 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-100'>
              Reload to see the new admin panel
            </button>
          )}
        </div>
        {state ? (
          <pre ref={logRef} className='max-h-[28rem] min-h-40 overflow-auto whitespace-pre-wrap break-words bg-gray-950 px-4 py-3 font-mono text-[12px] leading-relaxed text-gray-200 md:px-5'>
            {data?.log || (running ? 'Starting…' : 'No log for this deploy.')}
          </pre>
        ) : (
          <p className='px-5 py-10 text-center text-sm text-gray-500'>No deploys yet. Push your code to GitHub, then press Deploy.</p>
        )}
      </section>

      {data?.history?.length > 0 && (
        <section className='overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm'>
          <h2 className='border-b border-gray-200 px-4 py-3 text-sm font-bold text-gray-800 md:px-5'>Recent Deploys</h2>
          <div className='overflow-x-auto'>
            <table className='w-full min-w-[620px] text-left text-sm'>
              <thead>
                <tr className='bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500'>
                  <th className='px-4 py-2.5 md:px-5'>When</th>
                  <th className='px-3 py-2.5'>What</th>
                  <th className='px-3 py-2.5'>Status</th>
                  <th className='px-3 py-2.5'>Time</th>
                  <th className='px-4 py-2.5 md:px-5'>Commit</th>
                </tr>
              </thead>
              <tbody>
                {data.history.map((row) => (
                  <tr key={row.id} className='border-t border-gray-200 text-gray-700'>
                    <td className='whitespace-nowrap px-4 py-2 md:px-5'>{formatDateTime(row.startedAt)}</td>
                    <td className='whitespace-nowrap px-3 py-2 font-medium text-gray-800'>
                      {targets[row.target] || row.target}
                      {row.install ? <span className='ml-1.5 text-[11px] font-semibold text-violet-700'>+ npm install</span> : null}
                    </td>
                    <td className='px-3 py-2'><StatusBadge status={row.status} /></td>
                    <td className='whitespace-nowrap px-3 py-2 tabular-nums'>{formatDuration(row.startedAt, row.finishedAt)}</td>
                    <td className='max-w-xs truncate px-4 py-2 font-mono text-xs md:px-5' title={row.commit}>{row.commit || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {confirm && (
        <div className='fixed inset-0 z-50 grid place-items-center bg-black/40 p-4' onClick={() => !starting && setConfirm(null)}>
          <div className='w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-2xl' onClick={(event) => event.stopPropagation()} role='alertdialog' aria-modal='true'>
            <span className='mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-indigo-900 text-white'>
              <Icon name='rocket' className='w-5 h-5' />
            </span>
            <h3 className='mt-3 text-base font-bold text-gray-900'>Deploy {(targets[confirm.target] || confirm.target).toLowerCase()}?</h3>
            <p className='mt-1 text-sm text-gray-500'>
              The server pulls the latest code from <span className='font-semibold text-gray-800'>{data?.config?.branch}</span>
              {confirm.install ? ', runs npm install' : ''}
              {confirm.target !== 'backend' ? ', builds and restarts nginx' : ''}
              {['all', 'backend'].includes(confirm.target) ? ', then restarts the backend (WhatsApp reconnects, up to ~30 seconds offline)' : ''}.
            </p>
            <div className='mt-5 flex gap-2'>
              <button type='button' onClick={() => setConfirm(null)} disabled={starting} className='flex flex-1 items-center justify-center rounded-lg border border-gray-300 bg-white py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 disabled:opacity-60'>
                Cancel
              </button>
              <button type='button' onClick={startDeploy} disabled={starting} className='flex flex-1 items-center justify-center gap-2 rounded-lg bg-indigo-900 py-2 text-sm font-semibold text-white transition hover:bg-indigo-800 disabled:opacity-60'>
                {starting ? <Spinner /> : null}
                {starting ? 'Starting…' : 'Deploy'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Deploy
