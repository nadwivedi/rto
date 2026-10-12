import { createContext, useContext, useState, useCallback } from 'react'
import { useAuth } from './AuthContext'

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
    // Storage blocked: it stays open until the tab reloads
  }
}

const AuditContext = createContext(null)

// Whether the activity center has been opened (Ctrl+Alt+Space) in this tab.
// It only decides whether the page and its sidebar link are shown.
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

  const unlock = useCallback(() => setFlag(true), [setFlag])
  const lock = useCallback(() => setFlag(false), [setFlag])

  return (
    <AuditContext.Provider value={{ unlocked, unlock, lock }}>
      {children}
    </AuditContext.Provider>
  )
}

export const useAudit = () => {
  const context = useContext(AuditContext)
  if (!context) throw new Error('useAudit must be used within an AuditProvider')
  return context
}
