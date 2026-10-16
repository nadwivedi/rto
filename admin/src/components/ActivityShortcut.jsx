import { useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useAudit, ACTIVITY_PATH, DEPLOY_PATH } from '../context/AuditContext'

// Pages only Ctrl+Alt+Space opens; moving between them keeps them open
const HIDDEN_PATHS = [ACTIVITY_PATH, DEPLOY_PATH]

// Ctrl+Alt+Space (only after admin login) opens the activity center, which links to the deploy page.
// Nothing else on screen points to them, and leaving them closes them again.
const ActivityShortcut = () => {
  const { isAuthenticated } = useAuth()
  const { unlocked, unlock, lock } = useAudit()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  // Close them as soon as the admin moves from the hidden pages to any other page
  const previousPath = useRef(pathname)
  useEffect(() => {
    if (HIDDEN_PATHS.includes(previousPath.current) && !HIDDEN_PATHS.includes(pathname) && unlocked) lock()
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
