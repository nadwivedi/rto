import { useState, useEffect, useCallback, useRef } from 'react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'

// States where the screen changes quickly (QR rotates, progress steps) → poll fast.
const ACTIVE_STATES = ['initializing', 'qr_ready', 'syncing']
const FAST_POLL_MS = 2000
const SLOW_POLL_MS = 10000

// Polls /api/whatsapp/status. `watch=1` tells the server someone is looking at the page,
// which keeps a QR code alive; polling pauses while the browser tab is hidden.
export default function useWhatsAppStatus() {
  const [status, setStatus] = useState(null)
  const [error, setError] = useState(null)
  const timerRef = useRef(null)
  const statusRef = useRef(null)
  const scheduleRef = useRef(() => {})

  const refresh = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/api/whatsapp/status?watch=1`, { withCredentials: true })
      statusRef.current = res.data
      setStatus(res.data)
      setError(null)
      return res.data
    } catch (err) {
      setError(err?.response?.data?.message || err.message)
      return null
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    const schedule = () => {
      clearTimeout(timerRef.current)
      if (cancelled || document.hidden) return
      const active = ACTIVE_STATES.includes(statusRef.current?.status)
      timerRef.current = setTimeout(async () => {
        await refresh()
        schedule()
      }, active ? FAST_POLL_MS : SLOW_POLL_MS)
    }

    const onVisibility = async () => {
      if (document.hidden) {
        clearTimeout(timerRef.current)
      } else {
        await refresh()
        schedule()
      }
    }

    scheduleRef.current = schedule
    refresh().then(schedule)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      cancelled = true
      clearTimeout(timerRef.current)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [refresh])

  // After an action: fetch right away and restart the poll loop (fast if the state is now active).
  const refreshNow = useCallback(async () => {
    const data = await refresh()
    scheduleRef.current()
    return data
  }, [refresh])

  return { status, error, refresh: refreshNow }
}
