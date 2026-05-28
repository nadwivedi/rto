import { useEffect, useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
// Gets today's date as YYYY-MM-DD for the native date input default value
const getTodayISO = () => {
  const today = new Date()
  const y = today.getFullYear()
  const m = String(today.getMonth() + 1).padStart(2, '0')
  const d = String(today.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'

const AddMoneyReceivedModal = ({ isOpen, onClose, onSuccess }) => {
  const [parties, setParties] = useState([])
  const [loadingParties, setLoadingParties] = useState(false)
  const [allVehicles, setAllVehicles] = useState([])
  const [loadingVehicles, setLoadingVehicles] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    partyId: '',
    amount: '',
    moneyReceivedDate: getTodayISO(),   // stored as YYYY-MM-DD (native date input format)
    vehicleNumber: '',
    remark: ''
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

    const fetchData = async () => {
      try {
        setLoadingParties(true)
        setLoadingVehicles(true)

        const [partiesRes, vehiclesRes] = await Promise.all([
          axios.get(`${API_URL}/api/parties`, { params: { all: true }, withCredentials: true }),
          axios.get(`${API_URL}/api/vehicle-registrations`, { params: { limit: 1000 }, withCredentials: true })
        ])

        if (partiesRes.data.success) {
          setParties(partiesRes.data.data || [])
        }
        if (vehiclesRes.data.success) {
          setAllVehicles(vehiclesRes.data.data || [])
        }
      } catch (error) {
        console.error('Error fetching modal options:', error)
        toast.error('Unable to load dropdown options')
      } finally {
        setLoadingParties(false)
        setLoadingVehicles(false)
      }
    }

    fetchData()
  }, [isOpen])

  const handleVehicleChange = (event) => {
    const vehNum = event.target.value
    setFormData(prev => {
      const selectedVeh = allVehicles.find(v => v.registrationNumber === vehNum)
      const partyIdObj = selectedVeh?.partyId
      const matchedPartyId = partyIdObj
        ? (typeof partyIdObj === 'object' ? partyIdObj._id : partyIdObj)
        : ''

      return {
        ...prev,
        vehicleNumber: vehNum,
        partyId: matchedPartyId || prev.partyId
      }
    })
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((current) => ({
      ...current,
      [name]: value
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!formData.partyId && !formData.vehicleNumber) {
      toast.error('Please select either a Party or a Vehicle Number')
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

      // Convert YYYY-MM-DD → DD-MM-YYYY for the backend
      const [yr, mo, dy] = formData.moneyReceivedDate.split('-')
      const dateForBackend = `${dy}-${mo}-${yr}`

      const response = await axios.post(
        `${API_URL}/api/parties/money-received`,
        {
          partyId: formData.partyId || undefined,
          amount,
          moneyReceivedDate: dateForBackend,
          vehicleNumber: formData.vehicleNumber || undefined,
          remark: formData.remark || undefined
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

  // Filter vehicles by party if a party is selected
  const displayedVehicles = formData.partyId
    ? allVehicles.filter(v => {
        const pId = v.partyId && typeof v.partyId === 'object' ? v.partyId._id : v.partyId
        return pId === formData.partyId
      })
    : allVehicles

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
          <p className='mt-1 text-sm font-semibold text-emerald-50'>Record a payment received from a party or for a vehicle.</p>
        </div>

        <form onSubmit={handleSubmit} className='space-y-4 p-6'>

          <div>
            <label className='mb-1 block text-sm font-bold text-slate-700'>Date</label>
            <input
              type='date'
              name='moneyReceivedDate'
              value={formData.moneyReceivedDate}
              onChange={handleChange}
              disabled={saving}
              className='w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-100'
              required
            />
          </div>

          <div>
            <label className='mb-1 block text-sm font-bold text-slate-700'>Vehicle Number (Optional)</label>
            <select
              name='vehicleNumber'
              value={formData.vehicleNumber}
              onChange={handleVehicleChange}
              disabled={loadingVehicles || saving}
              className='w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-100'
            >
              <option value=''>{loadingVehicles ? 'Loading vehicles...' : 'Select Vehicle (Optional)'}</option>
              {displayedVehicles.map((v) => (
                <option key={v._id} value={v.registrationNumber}>
                  {v.registrationNumber}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className='mb-1 block text-sm font-bold text-slate-700'>Party (Optional)</label>
            <select
              name='partyId'
              value={formData.partyId}
              onChange={handleChange}
              disabled={loadingParties || saving}
              className='w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-100'
            >
              <option value=''>{loadingParties ? 'Loading parties...' : 'Select Party (Optional)'}</option>
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

          <div>
            <label className='mb-1 block text-sm font-bold text-slate-700'>Remark (Optional)</label>
            <input
              type='text'
              name='remark'
              value={formData.remark}
              onChange={handleChange}
              placeholder='e.g. Received via GPay, Cash, etc.'
              disabled={saving}
              className='w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-100'
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
