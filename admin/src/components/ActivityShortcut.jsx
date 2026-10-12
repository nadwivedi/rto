import { useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useAudit, ACTIVITY_PATH } from '../context/AuditContext'

// Ctrl+Alt+Space (only after admin login) opens the activity center.
// Nothing on screen points to it, and leaving the page closes it again.
const ActivityShortcut = () => {
  const { isAuthenticated } = useAuth()
  const { unlocked, unlock, lock } = useAudit()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  // Close it as soon as the admin moves from the activity center to any other page
  const previousPath = useRef(pathname)
  useEffect(() => {
    if (previousPath.current === ACTIVITY_PATH && pathname !== ACTIVITY_PATH && unlocked) lock()
    previousPath.current = pathname
  }, [pathname, unlocked, lock])

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
