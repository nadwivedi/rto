import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import ApiKeySaleModal from '../components/ApiKeySaleModal'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://api.rtosarthi.com'

const formatRupees = (n) => `₹${Math.abs(Number(n) || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
const formatNumber = (n) => Number(n || 0).toLocaleString('en-IN')
const formatDateTime = (value) =>
  value
    ? new Date(value).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
    : 'Never'

const maskKey = (key) => (key ? `${key.slice(0, 8)}••••${key.slice(-4)}` : '')

const Tile = ({ label, value, sub }) => (
  <div className='bg-white rounded-xl border border-gray-100 p-2.5 sm:p-4 shadow-sm'>
    <p className='text-[10px] sm:text-xs text-gray-500 font-semibold uppercase tracking-wide'>{label}</p>
    <p className='text-lg sm:text-2xl font-bold mt-0.5 sm:mt-1 tabular-nums text-gray-900'>{value}</p>
    {sub && <p className='text-[11px] text-gray-400 mt-0.5'>{sub}</p>}
  </div>
)

const th = 'px-2.5 sm:px-4 py-2 sm:py-2.5 text-[10px] sm:text-[11px] font-semibold text-gray-500 uppercase tracking-wider'
const td = 'px-2.5 sm:px-4 py-2 sm:py-2.5 text-xs'
const inputClass =
  'w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
const labelClass = 'block text-xs sm:text-sm font-semibold text-gray-700 mb-1'

const ApiKeys = () => {
  const navigate = useNavigate()
  const [keys, setKeys] = useState([])
  const [totals, setTotals] = useState(null)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [copiedId, setCopiedId] = useState(null)

  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState({ name: '', userId: '', note: '' })
  const [createError, setCreateError] = useState('')
  const [creating, setCreating] = useState(false)
  const [sellKey, setSellKey] = useState(null)

  const loadKeys = useCallback(async () => {
    try {
      setError('')
      const res = await fetch(`${BACKEND_URL}/api/admin/api-keys`, { credentials: 'include' })
      const json = await res.json()
      if (!json.success) throw new Error(json.message || 'Failed to load API keys')
      setKeys(json.data)
      setTotals(json.totals)
    } catch (err) {
      setError(err.message || 'Failed to load API keys')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadKeys()
    fetch(`${BACKEND_URL}/api/admin/users?limit=1000`, { credentials: 'include' })
      .then((res) => res.json())
      .then((json) => json.success && setUsers([...json.data].sort((a, b) => a.name.localeCompare(b.name))))
      .catch(() => {})
  }, [loadKeys])

  const copyKey = async (apiKey) => {
    try {
      await navigator.clipboard.writeText(apiKey.key)
      setCopiedId(apiKey._id)
      setTimeout(() => setCopiedId(null), 1500)
    } catch {
      setError('Could not copy. Open the key to copy it by hand.')
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!createForm.name.trim()) return setCreateError('Please enter a name')
    try {
      setCreating(true)
      const res = await fetch(`${BACKEND_URL}/api/admin/api-keys`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm)
      })
      const json = await res.json()
      if (!json.success) return setCreateError(json.message || 'Failed to create API key')
      navigate(`/api-keys/${json.data._id}`)
    } catch {
      setCreateError('Failed to create API key')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className='max-w-[1500px] mx-auto'>
      <div className='flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2.5 sm:gap-4 mb-3 sm:mb-6'>
        <div>
          <h1 className='text-xl sm:text-3xl font-bold text-gray-800'>Vehicle API Keys</h1>
          <p className='text-xs sm:text-base text-gray-600 mt-0.5 sm:mt-1'>
            Keys you share with customers to fetch vehicle details from their own software. Each key has its own limit.
          </p>
        </div>
        <button
          onClick={() => {
            setCreateForm({ name: '', userId: '', note: '' })
            setCreateError('')
            setShowCreate(true)
          }}
          className='px-4 py-2 sm:px-5 sm:py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-semibold text-sm shadow-lg shadow-indigo-200 cursor-pointer'
        >
          + New API Key
        </button>
      </div>

      {success && <div className='mb-5 p-4 bg-green-50 border border-green-200 rounded-xl text-green-800 text-sm font-medium'>{success}</div>}
      {error && <div className='mb-5 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium'>{error}</div>}

      {loading ? (
        <div className='h-64 bg-white rounded-xl border border-gray-100 animate-pulse' />
      ) : (
        <>
          <div className='grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-3 sm:mb-5'>
            <Tile label='API Keys' value={formatNumber(totals?.keys)} sub={`${formatNumber(totals?.active)} active`} />
            <Tile label='Calls Sold' value={formatNumber(totals?.soldQty)} sub={`for ${formatRupees(totals?.soldAmount)}`} />
            <Tile label='Calls Used' value={formatNumber(totals?.used)} sub='vehicle details returned' />
            <Tile label='Calls Today' value={formatNumber(totals?.callsToday)} sub='all calls, incl. failed' />
          </div>

          <div className='bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden'>
            {keys.length === 0 ? (
              <p className='p-8 text-center text-sm text-gray-500'>
                No API key yet. Click "New API Key", then sell API calls on it and share the key with your customer.
              </p>
            ) : (
              <div className='overflow-x-auto'>
                <table className='w-full'>
                  <thead>
                    <tr className='border-b border-gray-100 bg-gray-50/60'>
                      <th className={`${th} text-left`}>Name</th>
                      <th className={`${th} text-left`}>Key</th>
                      <th className={`${th} text-right`}>Used / Limit</th>
                      <th className={`${th} text-right`}>Left</th>
                      <th className={`${th} text-right`}>Today</th>
                      <th className={`${th} text-right`}>Sold</th>
                      <th className={`${th} text-left`}>Last Call</th>
                      <th className={`${th} text-right`}></th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-gray-100'>
                    {keys.map((k) => (
                      <tr key={k._id} className='hover:bg-gray-50/80 transition-colors'>
                        <td className={td}>
                          <Link to={`/api-keys/${k._id}`} className='font-semibold text-gray-900 hover:text-indigo-600'>
                            {k.name}
                          </Link>
                          {!k.active && (
                            <span className='ml-1.5 inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-gray-100 text-gray-500 border border-gray-200'>
                              Off
                            </span>
                          )}
                          <div className='text-gray-400'>{k.userId ? `${k.userId.name} · ${k.userId.mobile1}` : 'No user linked'}</div>
                        </td>
                        <td className={`${td} whitespace-nowrap`}>
                          <code className='text-gray-600'>{maskKey(k.key)}</code>
                          <button onClick={() => copyKey(k)} className='ml-2 text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer'>
                            {copiedId === k._id ? 'Copied' : 'Copy'}
                          </button>
                        </td>
                        <td className={`${td} text-right tabular-nums text-gray-700 whitespace-nowrap`}>
                          {formatNumber(k.callCount)} / {formatNumber(k.callLimit)}
                        </td>
                        <td className={`${td} text-right tabular-nums ${k.remaining <= 0 ? 'font-bold text-rose-600' : 'text-gray-700'}`}>
                          {formatNumber(k.remaining)}
                        </td>
                        <td className={`${td} text-right tabular-nums ${k.callsToday ? 'font-bold text-gray-900' : 'text-gray-400'}`}>
                          {formatNumber(k.callsToday)}
                        </td>
                        <td className={`${td} text-right tabular-nums text-gray-700 whitespace-nowrap`}>{formatRupees(k.soldAmount)}</td>
                        <td className={`${td} text-gray-500 whitespace-nowrap`}>{formatDateTime(k.lastUsedAt)}</td>
                        <td className={`${td} text-right whitespace-nowrap`}>
                          <button
                            onClick={() => setSellKey(k)}
                            className='px-2.5 py-1 rounded-lg border border-gray-300 font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer'
                          >
                            Sell Calls
                          </button>
                          <Link
                            to={`/api-keys/${k._id}`}
                            className='ml-1.5 px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700'
                          >
                            Details
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {sellKey && (
        <ApiKeySaleModal
          apiKey={sellKey}
          onClose={() => setSellKey(null)}
          onSaved={(message) => {
            setSellKey(null)
            setSuccess(message)
            loadKeys()
          }}
        />
      )}

      {showCreate && (
        <div className='fixed inset-0 bg-black/50 z-50 overflow-y-auto'>
          <div className='flex items-start justify-center min-h-full px-3 py-8 sm:py-16'>
            <form onSubmit={handleCreate} className='bg-white rounded-lg shadow-xl max-w-md w-full p-5 space-y-3'>
              <div>
                <h2 className='text-lg font-bold text-gray-800'>New API Key</h2>
                <p className='text-xs text-gray-500 mt-0.5'>The key starts with 0 calls. Sell API calls on it to give it a limit.</p>
              </div>
              <div>
                <label className={labelClass}>Name</label>
                <input
                  value={createForm.name}
                  onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder='e.g. Sharma Insurance Software'
                  autoFocus
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>
                  Link to User <span className='text-gray-400'>(Opt)</span>
                </label>
                <select
                  value={createForm.userId}
                  onChange={(e) => setCreateForm((f) => ({ ...f, userId: e.target.value }))}
                  className={`${inputClass} cursor-pointer`}
                >
                  <option value=''>No user</option>
                  {users.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.name} · {u.mobile1}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>
                  Note <span className='text-gray-400'>(Opt)</span>
                </label>
                <input
                  value={createForm.note}
                  onChange={(e) => setCreateForm((f) => ({ ...f, note: e.target.value }))}
                  className={inputClass}
                />
              </div>
              {createError && <div className='p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700'>{createError}</div>}
              <div className='flex gap-2 pt-1'>
                <button
                  type='button'
                  onClick={() => setShowCreate(false)}
                  className='flex-1 px-4 py-2 text-sm font-semibold rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer'
                >
                  Cancel
                </button>
                <button
                  type='submit'
                  disabled={creating}
                  className='flex-1 px-4 py-2 text-sm font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 cursor-pointer'
                >
                  {creating ? 'Creating...' : 'Create Key'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default ApiKeys
