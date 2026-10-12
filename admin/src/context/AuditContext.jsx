import { createContext, useContext, useState, useCallback } from 'react'
import { useAuth } from './AuthContext'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://api.rtosarthi.com'
const STORAGE_KEY = 'rs_ac'

export const ACTIVITY_PATH = '/activity-center'

const readFlag = () => {
  try {
    return sessionStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

const writeFlag = (value) => {
  try {
    if (value) sessionStorage.setItem(STORAGE_KEY, '1')
    else sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // Storage blocked: unlock still lasts until the tab reloads
  }
}

const AuditContext = createContext(null)

// Whether the activity center is unlocked in this tab. The real check is the
// server cookie; this flag only decides whether to show the page and its link.
export const AuditProvider = ({ children }) => {
  const { isAuthenticated, loading } = useAuth()
  const [unlocked, setUnlocked] = useState(readFlag)

  const setFlag = useCallback((value) => {
    writeFlag(value)
    setUnlocked(value)
  }, [])

  // Logging out of the admin panel always locks it again
  const signedOut = !loading && !isAuthenticated
  const [wasSignedOut, setWasSignedOut] = useState(signedOut)
  if (signedOut !== wasSignedOut) {
    setWasSignedOut(signedOut)
    if (signedOut) {
      writeFlag(false)
      setUnlocked(false)
    }
  }

  const unlock = useCallback(async (password) => {
    const res = await fetch(`${BACKEND_URL}/api/admin/audit/unlock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ password })
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok || !data.success) throw new Error(data.message || 'Incorrect password')
    setFlag(true)
  }, [setFlag])

  const lock = useCallback(async () => {
    setFlag(false)
    try {
      await fetch(`${BACKEND_URL}/api/admin/audit/lock`, { method: 'POST', credentials: 'include' })
    } catch {
      // The cookie expires on its own anyway
    }
  }, [setFlag])

  // Server said the session is gone (expired / logged out elsewhere)
  const expire = useCallback(() => setFlag(false), [setFlag])

  return (
    <AuditContext.Provider value={{ unlocked, unlock, lock, expire }}>
      {children}
    </AuditContext.Provider>
  )
}

export const useAudit = () => {
  const context = useContext(AuditContext)
  if (!context) throw new Error('useAudit must be used within an AuditProvider')
  return context
}
