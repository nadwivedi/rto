import { createContext, useContext, useState, useCallback } from 'react'

export const ACTIVITY_PATH = '/activity-center'

const AuditContext = createContext(null)

// Whether the activity center may be shown right now. Only Ctrl+Alt+Space sets it;
// it is kept in memory only, so a refresh or leaving the page closes it again.
export const AuditProvider = ({ children }) => {
  const [unlocked, setUnlocked] = useState(false)

  const unlock = useCallback(() => setUnlocked(true), [])
  const lock = useCallback(() => setUnlocked(false), [])

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
