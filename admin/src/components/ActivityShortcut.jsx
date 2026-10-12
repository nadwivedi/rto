import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useAudit, ACTIVITY_PATH } from '../context/AuditContext'

// Ctrl+Alt+Space (only after admin login) opens the activity center.
// Nothing on screen points to it.
const ActivityShortcut = () => {
  const { isAuthenticated } = useAuth()
  const { unlock } = useAudit()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isAuthenticated) return
    const onKeyDown = (e) => {
      if (!e.ctrlKey || !e.altKey || e.metaKey || e.shiftKey || e.code !== 'Space') return
      e.preventDefault()
      unlock()
      navigate(ACTIVITY_PATH)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isAuthenticated, unlock, navigate])

  return null
}

export default ActivityShortcut
