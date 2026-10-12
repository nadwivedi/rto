import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useAudit, ACTIVITY_PATH } from '../context/AuditContext'

// Ctrl+` (only after admin login) asks for the activity center password.
// Nothing on screen points to it.
const QuickUnlock = () => {
  const { isAuthenticated } = useAuth()
  const { unlocked, unlock } = useAudit()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    if (!isAuthenticated) return
    const onKeyDown = (e) => {
      if (!e.ctrlKey || e.altKey || e.metaKey || e.code !== 'Backquote') return
      e.preventDefault()
      if (unlocked) navigate(ACTIVITY_PATH)
      else setOpen(true)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isAuthenticated, unlocked, navigate])

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  const close = () => {
    setOpen(false)
    setPassword('')
    setError('')
  }

  const submit = async () => {
    if (!password || busy) return
    setBusy(true)
    setError('')
    try {
      await unlock(password)
      close()
      navigate(ACTIVITY_PATH)
    } catch (err) {
      setError(err.message)
      setPassword('')
      inputRef.current?.focus()
    } finally {
      setBusy(false)
    }
  }

  if (!open || !isAuthenticated) return null

  return (
    <div className='fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4' onMouseDown={close}>
      <div
        className='w-full max-w-xs rounded-xl bg-white p-4 shadow-2xl'
        onMouseDown={(e) => e.stopPropagation()}
      >
        <input
          ref={inputRef}
          type='password'
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit()
            if (e.key === 'Escape') close()
          }}
          placeholder='Password'
          autoComplete='off'
          disabled={busy}
          className='w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200'
        />
        {error && <p className='mt-2 text-xs font-medium text-red-600'>{error}</p>}
      </div>
    </div>
  )
}

export default QuickUnlock
