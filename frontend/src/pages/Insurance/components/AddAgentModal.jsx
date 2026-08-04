import { useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'

const AddAgentModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({ name: '', contact: '' })
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast.error('Agent name is required', { position: 'top-right', autoClose: 3000 })
      return
    }

    setLoading(true)
    try {
      const response = await axios.post(`${API_URL}/api/agents`, formData, { withCredentials: true })

      if (response.data.success) {
        toast.success('Agent added successfully!', { position: 'top-right', autoClose: 3000 })
        setFormData({ name: '', contact: '' })
        onSuccess(response.data.data)
        onClose()
      } else {
        toast.error(response.data.message || 'Failed to save agent', { position: 'top-right', autoClose: 3000 })
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error saving agent. Please try again.'
      toast.error(errorMessage, { position: 'top-right', autoClose: 3000 })
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-[80] p-3 md:p-4'>
      <div className='bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden'>
        {/* Header */}
        <div className='bg-amber-600 text-white px-4 py-3'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <div className='bg-white/20 p-1.5 rounded-lg'>
                <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z' />
                </svg>
              </div>
              <h3 className='text-base font-bold'>Add New Broker/Agent</h3>
            </div>
            <button
              onClick={onClose}
              className='p-1 rounded-lg hover:bg-white/20 transition cursor-pointer'
            >
              <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className='p-4 md:p-5 space-y-4'>
          <div>
            <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1'>
              Name <span className='text-red-500'>*</span>
            </label>
            <input
              type='text'
              name='name'
              value={formData.name}
              onChange={handleChange}
              placeholder='Enter broker/agent name'
              className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white'
              autoFocus
            />
          </div>

          <div>
            <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1'>
              Mobile Number
            </label>
            <input
              type='tel'
              name='contact'
              value={formData.contact}
              onChange={handleChange}
              placeholder='10-digit mobile number'
              pattern='[0-9]{10}'
              maxLength='10'
              className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white'
            />
          </div>

          <div className='flex gap-3 pt-2'>
            <button
              type='submit'
              disabled={loading}
              className='flex-1 bg-amber-600 text-white py-2.5 rounded-lg font-bold text-sm hover:bg-amber-700 transition disabled:opacity-50 cursor-pointer'
            >
              {loading ? 'Saving...' : 'Save Agent'}
            </button>
            <button
              type='button'
              onClick={onClose}
              className='px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-bold text-sm hover:bg-gray-50 transition cursor-pointer'
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddAgentModal
