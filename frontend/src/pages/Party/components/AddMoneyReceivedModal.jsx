import { useEffect, useRef, useState } from 'react'
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

// ─── Combobox: input IS the search, list opens downward via position:fixed ─────
const VehicleCombobox = ({ vehicles, value, onChange, disabled, loading }) => {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [showQuery, setShowQuery] = useState(false)
  const [dropdownStyle, setDropdownStyle] = useState({})
  const wrapperRef = useRef(null)
  const inputRef = useRef(null)

  const selected = vehicles.find(v => v.registrationNumber === value)

  const filtered = query.trim()
    ? vehicles.filter(v =>
        v.registrationNumber.toLowerCase().includes(query.toLowerCase())
      )
    : vehicles

  // Recompute dropdown position every time it opens or window resizes
  useEffect(() => {
    if (!open) return
    const compute = () => {
      if (!wrapperRef.current) return
      const rect = wrapperRef.current.getBoundingClientRect()
      const gap = 6
      const top = rect.bottom + gap
      const height = window.innerHeight - top - 12   // 12px breathing room at bottom
      setDropdownStyle({
        position: 'fixed',
        top,
        left: rect.left,
        width: rect.width,
        height: Math.max(height, 120),               // minimum sensible height
        zIndex: 9999,
      })
    }
    compute()
    window.addEventListener('resize', compute)
    window.addEventListener('scroll', compute, true)
    return () => {
      window.removeEventListener('resize', compute)
      window.removeEventListener('scroll', compute, true)
    }
  }, [open])

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (
        wrapperRef.current && !wrapperRef.current.contains(e.target) &&
        !document.getElementById('vehicle-combobox-portal')?.contains(e.target)
      ) {
        setOpen(false)
        setQuery('')
        setShowQuery(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleFocus = () => {
    if (!disabled) {
      setOpen(true)
      setShowQuery(true)
      setQuery('')
    }
  }

  const handleInputChange = (e) => {
    setQuery(e.target.value)
    setShowQuery(true)
    setOpen(true)
  }

  const handleSelect = (regNum) => {
    onChange(regNum)
    setOpen(false)
    setQuery('')
    setShowQuery(false)
    inputRef.current?.blur()
  }

  const handleClear = (e) => {
    e.stopPropagation()
    onChange('')
    setQuery('')
    setShowQuery(false)
    setOpen(false)
  }

  const displayValue = showQuery ? query : (selected?.registrationNumber || '')

  // Render the dropdown into a fixed-positioned div via inline style
  const Dropdown = open ? (
    <div
      id='vehicle-combobox-portal'
      style={dropdownStyle}
      className='rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden flex flex-col'
    >
      {/* Scrollable list fills all height */}
      <div className='flex-1 overflow-y-auto py-1.5'>
        {/* None/clear option */}
        <button
          type='button'
          tabIndex={-1}
          onMouseDown={(e) => { e.preventDefault(); handleSelect('') }}
          className={`w-full flex items-center gap-3 px-3 py-2 text-sm transition
            ${!value ? 'bg-emerald-50 text-emerald-700' : 'text-slate-500 hover:bg-slate-50'}
          `}
        >
          <span className='w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0'>
            <svg className='h-3.5 w-3.5 text-slate-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
            </svg>
          </span>
          <span className='font-semibold italic text-slate-400'>None — clear selection</span>
        </button>

        {filtered.length === 0 && query && (
          <div className='px-5 py-8 text-center'>
            <svg className='mx-auto h-8 w-8 text-slate-300 mb-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' />
            </svg>
            <p className='text-sm text-slate-400 font-semibold'>
              No vehicle matching <span className='font-black text-slate-600'>"{query}"</span>
            </p>
          </div>
        )}

        {filtered.map(v => {
          const isSelected = v.registrationNumber === value
          const reg = v.registrationNumber
          const idx = query ? reg.toLowerCase().indexOf(query.toLowerCase()) : -1
          return (
            <button
              key={v._id}
              type='button'
              tabIndex={-1}
              onMouseDown={(e) => { e.preventDefault(); handleSelect(v.registrationNumber) }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm transition
                ${isSelected ? 'bg-emerald-50' : 'hover:bg-slate-50'}
              `}
            >
              <span className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0
                ${isSelected ? 'bg-emerald-500' : 'bg-slate-100'}`}>
                <svg className={`h-4 w-4 ${isSelected ? 'text-white' : 'text-slate-500'}`} fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2}
                    d='M5 17H3a2 2 0 01-2-2V9a2 2 0 012-2h1l2-4h10l2 4h1a2 2 0 012 2v6a2 2 0 01-2 2h-2m-8 0a2 2 0 104 0m-4 0a2 2 0 114 0' />
                </svg>
              </span>
              <div className='flex-1 text-left min-w-0'>
                <span className={`font-black tracking-widest block ${isSelected ? 'text-emerald-700' : 'text-slate-900'}`}>
                  {idx >= 0 ? (
                    <>
                      {reg.slice(0, idx)}
                      <mark className='bg-yellow-200 text-yellow-900 rounded-sm px-0.5'>{reg.slice(idx, idx + query.length)}</mark>
                      {reg.slice(idx + query.length)}
                    </>
                  ) : reg}
                </span>
                {v.partyId?.partyName && (
                  <span className='block text-[11px] text-slate-400 font-medium truncate mt-0.5'>
                    {v.partyId.partyName}
                  </span>
                )}
              </div>
              {isSelected && (
                <svg className='h-4 w-4 text-emerald-600 flex-shrink-0' fill='currentColor' viewBox='0 0 20 20'>
                  <path fillRule='evenodd' d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z' clipRule='evenodd' />
                </svg>
              )}
            </button>
          )
        })}
      </div>

      {/* Footer */}
      <div className='flex-shrink-0 px-3 py-2 border-t border-slate-100 bg-slate-50 text-[11px] text-slate-400 font-semibold flex items-center gap-1.5'>
        <svg className='h-3 w-3' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' />
        </svg>
        {filtered.length} vehicle{filtered.length !== 1 ? 's' : ''} {query ? 'found' : 'available'}
      </div>
    </div>
  ) : null

  return (
    <>
      <div ref={wrapperRef} className='relative w-full'>
        {/* ── Input (combobox trigger + search) ── */}
        <div
          className={`flex items-center gap-2 w-full rounded-xl border px-3 py-2.5 transition
            ${open ? 'border-emerald-500 ring-2 ring-emerald-100' : 'border-slate-300'}
            ${disabled ? 'bg-slate-100' : 'bg-white hover:border-emerald-400'}
          `}
        >
          <svg
            className={`h-4 w-4 flex-shrink-0 transition-colors ${selected && !showQuery ? 'text-emerald-600' : 'text-slate-400'}`}
            fill='none' stroke='currentColor' viewBox='0 0 24 24'
          >
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2}
              d='M5 17H3a2 2 0 01-2-2V9a2 2 0 012-2h1l2-4h10l2 4h1a2 2 0 012 2v6a2 2 0 01-2 2h-2m-8 0a2 2 0 104 0m-4 0a2 2 0 114 0' />
          </svg>
          <input
            ref={inputRef}
            type='text'
            value={displayValue}
            onFocus={handleFocus}
            onChange={handleInputChange}
            disabled={disabled}
            placeholder={loading ? 'Loading vehicles…' : 'Search or select vehicle…'}
            autoComplete='off'
            className={`flex-1 min-w-0 bg-transparent text-sm outline-none
              ${disabled ? 'cursor-not-allowed text-slate-400' : 'cursor-text'}
              ${selected && !showQuery ? 'font-black tracking-widest text-slate-900' : 'font-semibold text-slate-700 placeholder:text-slate-400'}
            `}
          />
          <span className='flex items-center gap-1 flex-shrink-0'>
            {(selected || query) && !disabled && (
              <button
                type='button'
                tabIndex={-1}
                onMouseDown={handleClear}
                className='rounded-md p-0.5 text-slate-400 hover:text-red-500 hover:bg-red-50 transition'
                title='Clear'
              >
                <svg className='h-4 w-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                </svg>
              </button>
            )}
            <svg
              className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
              fill='none' stroke='currentColor' viewBox='0 0 24 24'
            >
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
            </svg>
          </span>
        </div>
      </div>

      {/* Dropdown rendered outside any overflow container */}
      {Dropdown}
    </>
  )
}

// ─── Main Modal ───────────────────────────────────────────────────────────────
const AddMoneyReceivedModal = ({ isOpen, onClose, onSuccess }) => {
  const [parties, setParties] = useState([])
  const [loadingParties, setLoadingParties] = useState(false)
  const [allVehicles, setAllVehicles] = useState([])
  const [loadingVehicles, setLoadingVehicles] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    partyId: '',
    amount: '',
    moneyReceivedDate: getTodayISO(),
    vehicleNumber: '',
    remark: ''
  })

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !saving) onClose()
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
        if (partiesRes.data.success) setParties(partiesRes.data.data || [])
        if (vehiclesRes.data.success) setAllVehicles(vehiclesRes.data.data || [])
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

  const handleVehicleSelect = (vehNum) => {
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
    setFormData(current => ({ ...current, [name]: value }))
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

  if (!isOpen) return null

  return (
    <div className='fixed inset-0 z-[100] flex items-end justify-center sm:items-center bg-slate-900/60 p-0 sm:p-4 backdrop-blur-sm'>
      <div className='relative w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl flex flex-col max-h-[96vh]'>

        {/* Header */}
        <div className='border-b border-emerald-900/20 bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-700 px-6 py-5 flex-shrink-0 rounded-t-2xl'>
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
          <p className='mt-1 text-sm font-semibold text-emerald-50'>Record a payment for a vehicle or party.</p>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} className='flex flex-col flex-1 overflow-hidden'>
          <div className='flex-1 overflow-y-auto px-6 py-5 space-y-4'>

            {/* Hint */}
            <div className='bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-2.5 text-xs font-semibold text-indigo-700 flex items-start gap-2.5'>
              <svg className='w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
              </svg>
              <span>Select at least one: <strong>Vehicle</strong> or <strong>Party</strong> (or both). Picking a vehicle auto-fills its owner.</span>
            </div>

            {/* Date */}
            <div>
              <label className='mb-1 block text-sm font-bold text-slate-700'>
                Date <span className='text-red-500'>*</span>
              </label>
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

            {/* Vehicle — combobox, opens upward */}
            <div>
              <label className='mb-1 block text-sm font-bold text-slate-700'>
                Vehicle Number
                <span className='ml-2 text-xs font-semibold text-slate-400'>(Optional)</span>
              </label>
              <VehicleCombobox
                vehicles={allVehicles}
                value={formData.vehicleNumber}
                onChange={handleVehicleSelect}
                disabled={loadingVehicles || saving}
                loading={loadingVehicles}
              />
            </div>

            {/* Party */}
            <div>
              <label className='mb-1 block text-sm font-bold text-slate-700'>
                Party
                <span className='ml-2 text-xs font-semibold text-slate-400'>(Optional)</span>
              </label>
              <select
                name='partyId'
                value={formData.partyId}
                onChange={handleChange}
                disabled={loadingParties || saving}
                className='w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-100'
              >
                <option value=''>{loadingParties ? 'Loading parties…' : 'Select Party (Optional)'}</option>
                {parties.map((party) => (
                  <option key={party._id} value={party._id}>
                    {party.partyName}{party.mobile ? ` - ${party.mobile}` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Amount */}
            <div>
              <label className='mb-1 block text-sm font-bold text-slate-700'>
                Amount <span className='text-red-500'>*</span>
              </label>
              <div className='relative'>
                <span className='absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-500'>₹</span>
                <input
                  type='number'
                  name='amount'
                  value={formData.amount}
                  onChange={handleChange}
                  min='1'
                  step='1'
                  placeholder='0'
                  disabled={saving}
                  className='w-full rounded-xl border border-slate-300 pl-7 pr-3 py-2.5 text-sm font-semibold text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-100'
                  required
                />
              </div>
            </div>

            {/* Remark */}
            <div>
              <label className='mb-1 block text-sm font-bold text-slate-700'>
                Remark
                <span className='ml-2 text-xs font-semibold text-slate-400'>(Optional)</span>
              </label>
              <input
                type='text'
                name='remark'
                value={formData.remark}
                onChange={handleChange}
                placeholder='e.g. GPay, Cash, Cheque…'
                disabled={saving}
                className='w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-100'
              />
            </div>
          </div>

          {/* Action buttons — pinned at bottom */}
          <div className='flex-shrink-0 border-t border-slate-100 px-6 py-4 bg-slate-50 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end'>
            <button
              type='button'
              onClick={onClose}
              disabled={saving}
              className='rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-100 disabled:opacity-60'
            >
              Cancel
            </button>
            <button
              type='submit'
              disabled={saving || loadingParties}
              className='inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:from-emerald-600 hover:to-green-600 disabled:cursor-not-allowed disabled:opacity-60'
            >
              {saving ? (
                <>
                  <svg className='h-4 w-4 animate-spin' fill='none' viewBox='0 0 24 24'>
                    <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' />
                    <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8v8H4z' />
                  </svg>
                  Saving…
                </>
              ) : (
                <>
                  <svg className='h-4 w-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 4v16m8-8H4' />
                  </svg>
                  Add Money Received
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddMoneyReceivedModal
