import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'

const AddEditPartyModal = ({ isOpen, onClose, onSuccess, editData }) => {
  const [formData, setFormData] = useState({
    partyName: '',
    sonWifeDaughterOf: '',
    mobile: '',
    email: '',
    address: ''
  })
  const [loading, setLoading] = useState(false)

  // Refs for Enter key navigation
  const partyNameRef = useRef(null)
  const swdRef = useRef(null)
  const mobileRef = useRef(null)
  const emailRef = useRef(null)
  const addressRef = useRef(null)
  const saveButtonRef = useRef(null)

  useEffect(() => {
    if (editData) {
      setFormData({
        partyName: editData.partyName || '',
        sonWifeDaughterOf: editData.sonWifeDaughterOf || '',
        mobile: editData.mobile || '',
        email: editData.email || '',
        address: editData.address || ''
      })
    } else {
      setFormData({
        partyName: '',
        sonWifeDaughterOf: '',
        mobile: '',
        email: '',
        address: ''
      })
    }
  }, [editData])

  // Auto-focus on party name when modal opens
  useEffect(() => {
    if (isOpen && partyNameRef.current) {
      setTimeout(() => {
        partyNameRef.current.focus()
      }, 100)
    }
  }, [isOpen])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleKeyDown = (e, nextRef) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (nextRef && nextRef.current) {
        nextRef.current.focus()
      }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.partyName.trim()) {
      toast.error('Party name is required', { position: 'top-right', autoClose: 3000 })
      return
    }

    if (!editData && !formData.mobile.trim()) {
      toast.error('Mobile number is required', { position: 'top-right', autoClose: 3000 })
      return
    }

    setLoading(true)
    try {
      let response
      if (editData) {
        response = await axios.put(`${API_URL}/api/parties/${editData._id}`, formData, { withCredentials: true })
      } else {
        response = await axios.post(`${API_URL}/api/parties`, formData, { withCredentials: true })
      }

      if (response.data.success) {
        toast.success(editData ? 'Party updated successfully!' : 'Party added successfully!', { position: 'top-right', autoClose: 3000 })
        onSuccess()
        onClose()
      } else {
        toast.error(response.data.message || 'Failed to save party', { position: 'top-right', autoClose: 3000 })
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error saving party. Please try again.'
      toast.error(errorMessage, { position: 'top-right', autoClose: 3000 })
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-3 md:p-4'>
      <div className='bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden'>
        {/* Header */}
        <div className='bg-purple-600 text-white px-4 py-3'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <div className='bg-white/20 p-1.5 rounded-lg'>
                <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z' />
                </svg>
              </div>
              <h3 className='text-base font-bold'>{editData ? 'Edit Party' : 'Add New Party'}</h3>
            </div>
            <button
              type='button'
              onClick={onClose}
              className='text-white/80 hover:text-white hover:bg-white/20 p-1.5 rounded-lg transition-all'
            >
              <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
              </svg>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className='p-4 space-y-3 max-h-[65vh] overflow-y-auto'>
            {/* Party Name */}
            <div>
              <label className='block text-sm font-semibold text-gray-700 mb-1'>
                Party Name <span className='text-red-500'>*</span>
              </label>
              <input
                type='text'
                name='partyName'
                ref={partyNameRef}
                value={formData.partyName}
                onChange={handleChange}
                onKeyDown={(e) => handleKeyDown(e, swdRef)}
                placeholder='Enter party/company name'
                className='w-full px-3 py-2 text-sm bg-white border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all uppercase font-semibold text-gray-800 placeholder:font-normal placeholder-gray-400'
              />
            </div>

            {/* Son/Wife/Daughter of */}
            <div>
              <label className='block text-sm font-semibold text-gray-700 mb-1'>
                S/o, W/o, D/o
              </label>
              <input
                type='text'
                name='sonWifeDaughterOf'
                ref={swdRef}
                value={formData.sonWifeDaughterOf}
                onChange={handleChange}
                onKeyDown={(e) => handleKeyDown(e, mobileRef)}
                placeholder='Father/Husband name'
                className='w-full px-3 py-2 text-sm bg-white border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all uppercase font-semibold text-gray-800 placeholder:font-normal placeholder-gray-400'
              />
            </div>

            {/* Mobile Number */}
            <div>
              <label className='block text-sm font-semibold text-gray-700 mb-1'>
                Mobile {!editData && <span className='text-red-500'>*</span>}
              </label>
              <input
                type='tel'
                name='mobile'
                ref={mobileRef}
                value={formData.mobile}
                onChange={handleChange}
                onKeyDown={(e) => handleKeyDown(e, emailRef)}
                maxLength='10'
                placeholder='9876543210'
                className='w-full px-3 py-2 text-sm bg-white border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all font-semibold text-gray-800 placeholder:font-normal placeholder-gray-400'
              />
            </div>

            {/* Email */}
            <div>
              <label className='block text-sm font-semibold text-gray-700 mb-1'>
                Email
              </label>
              <input
                type='email'
                name='email'
                ref={emailRef}
                value={formData.email}
                onChange={handleChange}
                onKeyDown={(e) => handleKeyDown(e, addressRef)}
                placeholder='email@example.com'
                className='w-full px-3 py-2 text-sm bg-white border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all font-semibold text-gray-800 placeholder:font-normal placeholder-gray-400'
              />
            </div>

            {/* Address */}
            <div>
              <label className='block text-sm font-semibold text-gray-700 mb-1'>
                Address
              </label>
              <textarea
                name='address'
                ref={addressRef}
                value={formData.address}
                onChange={handleChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    if (saveButtonRef.current) {
                      saveButtonRef.current.focus()
                    }
                  }
                }}
                rows='2'
                placeholder='Complete address'
                className='w-full px-3 py-2 text-sm bg-white border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all uppercase font-semibold text-gray-800 placeholder:font-normal placeholder-gray-400 resize-none'
              />
            </div>
          </div>

          {/* Footer */}
          <div className='flex gap-3 px-4 py-3 bg-gray-50 border-t border-gray-200'>
            <button
              type='button'
              onClick={onClose}
              className='flex-1 px-4 py-2 text-sm font-semibold text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-all'
            >
              Cancel
            </button>
            <button
              type='submit'
              ref={saveButtonRef}
              disabled={loading}
              className='flex-1 px-4 py-2 text-sm font-semibold text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2'
            >
              {loading ? (
                <>
                  <svg className='animate-spin h-4 w-4' fill='none' viewBox='0 0 24 24'>
                    <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' />
                    <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z' />
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
                  </svg>
                  {editData ? 'Update Party' : 'Save Party'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddEditPartyModal
