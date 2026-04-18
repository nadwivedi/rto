import { useState, useEffect } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { enforceVehicleNumberFormat } from '../../../utils/vehicleNoCheck'

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'

const AddJavakModal = ({ isOpen, onClose, onSuccess, editData }) => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0], // Default today
    vehicleNo: '',
    partyName: '',
    purpose: '',
    remark: ''
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (editData) {
      setFormData({
        date: editData.date || new Date().toISOString().split('T')[0],
        vehicleNo: editData.vehicleNo || '',
        partyName: editData.partyName || '',
        purpose: editData.purpose || '',
        remark: editData.remark || ''
      })
    } else {
      setFormData({
        date: new Date().toISOString().split('T')[0],
        vehicleNo: '',
        partyName: '',
        purpose: '',
        remark: ''
      })
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [editData, isOpen, onClose])

  const handleChange = (e) => {
    let { name, value } = e.target
    if (name === 'vehicleNo') {
      value = enforceVehicleNumberFormat(formData.vehicleNo, value)
    }
    if (name === 'partyName') {
      value = value.toUpperCase()
    }
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.date || !formData.partyName) {
      toast.error('Date and Party Name are required')
      return
    }

    setLoading(true)
    try {
      if (editData) {
        await axios.put(`${API_URL}/api/javak/${editData._id}`, formData, { withCredentials: true })
        toast.success('Task updated successfully')
      } else {
        await axios.post(`${API_URL}/api/javak`, formData, { withCredentials: true })
        toast.success('Task created successfully')
      }
      onSuccess() // triggers refetch and close
    } catch (error) {
      console.error('Error saving task:', error)
      toast.error(error.response?.data?.message || 'Error saving task')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className='fixed inset-0 bg-slate-900/60 flex items-center justify-center z-[100] p-4 backdrop-blur-sm animate-fadeIn'>
      <div className='w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]'>
        <div className='px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50'>
          <h2 className='text-lg font-bold text-gray-800'>
            {editData ? 'Edit Javak Task' : 'Add New Javak Task'}
          </h2>
          <button onClick={onClose} className='p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors'>
            <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M6 18L18 6M6 6l12 12' /></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className='p-6 overflow-y-auto space-y-4'>
          <div>
            <label className='block text-sm font-semibold text-gray-700 mb-1'>Date <span className="text-red-500">*</span></label>
            <input
              type='date'
              name='date'
              value={formData.date}
              onChange={handleChange}
              className='w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all'
              required
            />
          </div>

          <div>
            <label className='block text-sm font-semibold text-gray-700 mb-1'>Vehicle Number</label>
            <input
              type='text'
              name='vehicleNo'
              value={formData.vehicleNo}
              onChange={handleChange}
              placeholder='Ex: CG04XX1234'
              className='w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all uppercase'
            />
          </div>

          <div>
            <label className='block text-sm font-semibold text-gray-700 mb-1'>Party Name <span className="text-red-500">*</span></label>
            <input
              type='text'
              name='partyName'
              value={formData.partyName}
              onChange={handleChange}
              placeholder='Enter Party Name'
              className='w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all uppercase'
              required
            />
          </div>

          <div>
            <label className='block text-sm font-semibold text-gray-700 mb-1'>Purpose / Work Details</label>
            <input
              type='text'
              name='purpose'
              value={formData.purpose}
              onChange={handleChange}
              placeholder='What needs to be done?'
              className='w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all'
            />
          </div>

          <div>
            <label className='block text-sm font-semibold text-gray-700 mb-1'>Remark</label>
            <textarea
              name='remark'
              value={formData.remark}
              onChange={handleChange}
              placeholder='Additional notes or remarks...'
              rows="3"
              className='w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all resize-none'
            />
          </div>
        </form>

        <div className='p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3'>
          <button
            type='button'
            onClick={onClose}
            className='px-5 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50'
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className='px-5 py-2 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-600/20 rounded-xl transition-all disabled:opacity-50 active:scale-[0.98] flex items-center gap-2'
          >
            {loading ? (
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            ) : null}
            {editData ? 'Update Task' : 'Add Task'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default AddJavakModal
