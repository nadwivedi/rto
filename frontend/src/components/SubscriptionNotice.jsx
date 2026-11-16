import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'

// Yearly plan notices:
// - 15 days or less left: a banner, at most once a day (localStorage remembers the day it was shown,
//   so closing it or opening the software again that day does not bring it back).
// - Expired: a popup every time the software is opened / the user logs in (sessionStorage only hides
//   it for the rest of this visit once it is closed).
const WARN_DAYS = 15
const DAY_MS = 24 * 60 * 60 * 1000
const SUPPORT_MOBILE = '+91-6264682508'
const SUPPORT_EMAIL = 'rtosarthi@gmail.com'

const storage = (kind) => {
  try {
    return kind === 'session' ? window.sessionStorage : window.localStorage
  } catch {
    return null
  }
}
const readKey = (kind, key) => {
  try { return storage(kind)?.getItem(key) ?? null } catch { return null }
}
const writeKey = (kind, key, value) => {
  try { storage(kind)?.setItem(key, value) } catch { /* storage blocked: the notice just shows again */ }
}

// Local date (not UTC), so "once a day" follows the user's own day
const todayKey = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const formatDate = (date) => new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })

export default function SubscriptionNotice() {
  const { user } = useAuth()
  const [notice, setNotice] = useState(null) // 'warning' | 'expired' | null

  const expiresAt = user?.subscriptionExpiresAt
  const isYearly = (user?.planType || 'yearly') === 'yearly'
  const daysLeft = expiresAt ? Math.ceil((new Date(expiresAt) - new Date()) / DAY_MS) : null
  const userId = user?.id || user?._id || 'user'
  const warnKey = `rtosarthi:subscriptionWarningShown:${userId}`
  const expiredKey = `rtosarthi:subscriptionExpiredClosed:${userId}`

  useEffect(() => {
    if (!user || !isYearly || daysLeft === null || Number.isNaN(daysLeft)) {
      setNotice(null)
      return
    }
    if (daysLeft <= 0) {
      setNotice(readKey('session', expiredKey) ? null : 'expired')
    } else if (daysLeft <= WARN_DAYS) {
      if (notice === 'warning') return
      if (readKey('local', warnKey) !== todayKey()) {
        writeKey('local', warnKey, todayKey())
        setNotice('warning')
      }
    } else {
      setNotice(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, isYearly, daysLeft, expiresAt])

  // Logging out ends the visit, so the next login shows the expired popup again
  const lastExpiredKey = useRef(null)
  useEffect(() => {
    if (user) {
      lastExpiredKey.current = expiredKey
    } else if (lastExpiredKey.current) {
      try { storage('session')?.removeItem(lastExpiredKey.current) } catch { /* ignore */ }
      lastExpiredKey.current = null
    }
  }, [user, expiredKey])

  if (!notice) return null

  if (notice === 'expired') {
    const close = () => {
      writeKey('session', expiredKey, '1')
      setNotice(null)
    }
    return (
      <div className='fixed inset-0 z-[190] flex items-center justify-center bg-black/50 px-4' role='dialog' aria-modal='true'>
        <div className='w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-2xl sm:p-8'>
          <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100'>
            <svg className='h-8 w-8 text-red-500' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z' />
            </svg>
          </div>
          <h2 className='mb-2 text-xl font-bold text-gray-900'>Subscription Expired</h2>
          <p className='mb-1 text-gray-600'>Your subscription for RTO Sarthi has expired.</p>
          <p className='mb-6 text-sm text-gray-500'>
            Expired on <span className='font-semibold text-red-600'>{formatDate(expiresAt)}</span>. Please renew your annual plan to keep using RTO Sarthi.
          </p>
          <a
            href={`tel:${SUPPORT_MOBILE.replace(/-/g, '')}`}
            className='mb-3 block w-full rounded-xl bg-indigo-600 py-3 font-bold text-white transition-colors hover:bg-indigo-700'
          >
            Call to Renew: {SUPPORT_MOBILE}
          </a>
          <button
            onClick={close}
            className='w-full cursor-pointer rounded-xl border border-gray-200 py-2.5 font-semibold text-gray-600 transition-colors hover:bg-gray-50'
          >
            Close
          </button>
          <p className='mt-3 text-xs text-gray-400'>
            Contact support: <span className='font-bold text-indigo-600'>{SUPPORT_EMAIL}</span>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className='fixed left-1/2 top-[72px] z-[150] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2' role='status'>
      <div className='flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-3 shadow-lg sm:p-4'>
        <div className='flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-amber-100'>
          <svg className='h-5 w-5 text-amber-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' />
          </svg>
        </div>
        <div className='min-w-0 flex-1'>
          <p className='text-sm font-bold text-amber-900'>
            Your RTO Sarthi subscription expires in {daysLeft} day{daysLeft === 1 ? '' : 's'}
          </p>
          <p className='mt-0.5 text-xs text-amber-800 sm:text-sm'>
            Annual plan ends on <span className='font-semibold'>{formatDate(expiresAt)}</span>. Renew now to avoid interruption — call{' '}
            <a href={`tel:${SUPPORT_MOBILE.replace(/-/g, '')}`} className='font-bold underline'>{SUPPORT_MOBILE}</a>.
          </p>
        </div>
        <button
          onClick={() => setNotice(null)}
          aria-label='Close'
          className='flex-shrink-0 cursor-pointer rounded-lg p-1 text-amber-700 transition-colors hover:bg-amber-100'
        >
          <svg className='h-5 w-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
          </svg>
        </button>
      </div>
    </div>
  )
}
