import { useState } from 'react'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://api.rtosarthi.com'

const inputClass =
  'w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
const labelClass = 'block text-xs sm:text-sm font-semibold text-gray-700 mb-1'

// Delete popup: the admin has to type "delete" before the key can go
const ApiKeyDeleteModal = ({ apiKey, onClose, onDeleted }) => {
  const [text, setText] = useState('')
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(false)
  const confirmed = text.trim().toLowerCase() === 'delete'
  const close = () => !deleting && onClose()

  const deleteKey = async (e) => {
    e.preventDefault()
    if (!confirmed) return setError('Type delete to confirm')
    try {
      setDeleting(true)
      setError('')
      const res = await fetch(`${BACKEND_URL}/api/admin/api-keys/${apiKey._id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: 'delete' })
      })
      const json = await res.json()
      if (!json.success) return setError(json.message || 'Failed to delete')
      onDeleted(json.message || `API key "${apiKey.name}" deleted`)
    } catch {
      setError('Failed to delete')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className='fixed inset-0 bg-black/50 z-50 overflow-y-auto' onMouseDown={close}>
      <div className='flex items-start justify-center min-h-full px-3 py-8 sm:py-16'>
        <form onSubmit={deleteKey} onMouseDown={(e) => e.stopPropagation()} className='bg-white rounded-lg shadow-xl max-w-md w-full p-5 space-y-3'>
          <div className='flex items-start gap-3'>
            <span className='flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-600'>
              <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z' />
              </svg>
            </span>
            <div>
              <h2 className='text-lg font-bold text-gray-800'>Delete API key?</h2>
              <p className='text-sm text-gray-600 mt-0.5'>
                <span className='font-semibold text-gray-900'>{apiKey.name}</span> will stop working at once and its call log will be removed. This cannot
                be undone. Sales on this key stay in your sales totals.
              </p>
              {apiKey.active && (
                <p className='text-xs text-gray-500 mt-1.5'>To stop it only for now, use Switch Off instead. You can switch it on again later.</p>
              )}
            </div>
          </div>
          <div>
            <label className={labelClass}>
              Type <span className='font-mono text-rose-600'>delete</span> to confirm
            </label>
            <input
              value={text}
              onChange={(e) => {
                setText(e.target.value)
                setError('')
              }}
              onKeyDown={(e) => e.key === 'Escape' && close()}
              placeholder='delete'
              autoComplete='off'
              className={inputClass}
              autoFocus
            />
          </div>
          {error && <p className='text-sm text-red-600'>{error}</p>}
          <div className='flex gap-2 pt-1'>
            <button
              type='button'
              onClick={close}
              disabled={deleting}
              className='flex-1 px-4 py-2 text-sm font-semibold rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 cursor-pointer'
            >
              Cancel
            </button>
            <button
              type='submit'
              disabled={deleting || !confirmed}
              className='flex-1 px-4 py-2 text-sm font-semibold rounded-lg bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer'
            >
              {deleting ? 'Deleting...' : 'Delete API Key'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ApiKeyDeleteModal
