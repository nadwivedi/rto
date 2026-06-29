import { useState } from 'react'
import { addLicenseClass } from '../utils/licenseClassApi'
import { toast } from 'react-toastify'

const AddLicenseClassModal = ({ isOpen, onClose, onAdded }) => {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('License class name is required')
      return
    }
    setLoading(true)
    try {
      const res = await addLicenseClass(name.trim())
      if (res.data.success) {
        toast.success('License class added')
        setName('')
        onAdded(res.data.data)
        onClose()
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add license class')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40' onClick={onClose}>
      <div className='bg-white rounded-xl shadow-xl w-full max-w-md mx-3 overflow-hidden' onClick={e => e.stopPropagation()}>
        <div className='px-5 py-4 border-b border-gray-200 flex items-center justify-between'>
          <h2 className='text-sm font-bold text-gray-800'>Add License Class</h2>
          <button onClick={onClose} className='text-gray-400 hover:text-gray-600 cursor-pointer'>
            <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
            </svg>
          </button>
        </div>
        <div className='p-5'>
          <label className='block text-xs font-bold text-gray-700 mb-1'>License Class Name <span className='text-red-500'>*</span></label>
          <input
            type='text'
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder='e.g. Heavy Commercial Vehicle'
            className='w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none'
          />
        </div>
        <div className='px-5 py-3 border-t border-gray-200 flex justify-end gap-2'>
          <button
            onClick={onClose}
            className='px-4 py-2 text-xs font-bold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all cursor-pointer'
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className='px-4 py-2 text-xs font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-all cursor-pointer disabled:opacity-50'
          >
            {loading ? 'Adding...' : 'Add'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default AddLicenseClassModal
