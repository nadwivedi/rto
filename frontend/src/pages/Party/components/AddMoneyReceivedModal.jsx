import { useEffect, useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { getTodayDate, handleDateBlur, handleSmartDateInput } from '../../../utils/dateFormatter'

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'

const AddMoneyReceivedModal = ({ isOpen, onClose, onSuccess }) => {
  const [parties, setParties] = useState([])
  const [loadingParties, setLoadingParties] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    partyId: '',
    amount: '',
    moneyReceivedDate: getTodayDate()
  })

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !saving) {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose, saving])

  useEffect(() => {
    if (!isOpen) return

    const fetchParties = async () => {
      try {
        setLoadingParties(true)
        const response = await axios.get(`${API_URL}/api/parties`, {
          params: { all: true },
          withCredentials: true
        })

        if (response.data.success) {
          setParties(response.data.data || [])
        }
      } catch (error) {
        console.error('Error fetching parties:', error)
        toast.error('Unable to load parties')
      } finally {
        setLoadingParties(false)
      }
    }

    fetchParties()
  }, [isOpen])

  const handleChange = (event) => {
    const { name, value } = event.target

    if (name === 'moneyReceivedDate') {
      const formatted = handleSmartDateInput(value, formData.moneyReceivedDate || '')
      if (formatted !== null) {
        setFormData((current) => ({
          ...current,
          moneyReceivedDate: formatted
        }))
      }
      return
    }

    setFormData((current) => ({
      ...current,
      [name]: value
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!formData.partyId) {
      toast.error('Please select a party')
      return
    }

    const amount = Number(formData.amount)
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    if (!formData.moneyReceivedDate) {
      toast.error('Please select a date')
      return
    }

    try {
      setSaving(true)
      const response = await axios.post(
        `${API_URL}/api/parties/money-received`,
        {
          partyId: formData.partyId,
          amount,
          moneyReceivedDate: formData.moneyReceivedDate
        },
        { withCredentials: true }
      )

      if (response.data.success) {
        toast.success('Money received entry added successfully')
        onSuccess?.()
        onClose()
      } else {
        toast.error(response.data.message || 'Failed to add money received entry')
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to add money received entry'
      toast.error(message)
      console.error('Error adding money received:', error)
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className='fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm'>
      <div className='relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl'>
        <div className='border-b border-emerald-900/20 bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-700 px-6 py-5'>
          <button
            type='button'
            onClick={onClose}
            className='absolute right-4 top-4 rounded-lg p-1 text-white/80 transition hover:bg-white/15 hover:text-white'
            aria-label='Close'
          >
            <svg className='h-5 w-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
            </svg>
          </button>
          <h3 className='text-xl font-black text-white'>Add Money Received</h3>
          <p className='mt-1 text-sm font-semibold text-emerald-50'>Record a payment received from a party.</p>
        </div>

        <form onSubmit={handleSubmit} className='space-y-4 p-6'>
          <div>
            <label className='mb-1 block text-sm font-bold text-slate-700'>Date</label>
            <input
              type='text'
              name='moneyReceivedDate'
              value={formData.moneyReceivedDate}
              onChange={handleChange}
              onBlur={(event) => handleDateBlur(event, setFormData)}
              disabled={saving}
              placeholder='DD-MM-YYYY'
              maxLength='10'
              className='w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-100'
              required
            />
          </div>

          <div>
            <label className='mb-1 block text-sm font-bold text-slate-700'>Party</label>
            <select
              name='partyId'
              value={formData.partyId}
              onChange={handleChange}
              disabled={loadingParties || saving}
              className='w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-100'
              required
            >
              <option value=''>{loadingParties ? 'Loading parties...' : 'Select party'}</option>
              {parties.map((party) => (
                <option key={party._id} value={party._id}>
                  {party.partyName}{party.mobile ? ` - ${party.mobile}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className='mb-1 block text-sm font-bold text-slate-700'>Amount</label>
            <input
              type='number'
              name='amount'
              value={formData.amount}
              onChange={handleChange}
              min='1'
              step='1'
              placeholder='0'
              disabled={saving}
              className='w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-100'
              required
            />
          </div>

          <div className='flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end'>
            <button
              type='button'
              onClick={onClose}
              disabled={saving}
              className='rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60'
            >
              Cancel
            </button>
            <button
              type='submit'
              disabled={saving || loadingParties}
              className='inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:from-emerald-600 hover:to-green-600 disabled:cursor-not-allowed disabled:opacity-60'
            >
              <svg className='h-5 w-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 4v16m8-8H4' />
              </svg>
              {saving ? 'Saving...' : 'Add Money Received'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddMoneyReceivedModal
