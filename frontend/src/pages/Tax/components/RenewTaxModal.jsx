import { useState, useEffect } from 'react'
import { handlePaymentCalculation } from '../../../utils/paymentValidation'
import { handleSmartDateInput } from '../../../utils/dateFormatter'

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'

const RenewTaxModal = ({ isOpen, onClose, onSubmit, oldTax }) => {
  const [fetchingVehicle, setFetchingVehicle] = useState(false)
  const [vehicleError, setVehicleError] = useState('')
  const [formData, setFormData] = useState({
    receiptNo: '',
    vehicleNumber: '',
    ownerName: '',
    totalAmount: '',
    paidAmount: '',
    balance: '',
    taxFrom: '',
    taxTo: ''
  })
  const [taxPeriod, setTaxPeriod] = useState('Q1') // Q1=3mo, Q2=6mo, Q3=9mo, Q4=12mo
  const [paidExceedsTotal, setPaidExceedsTotal] = useState(false)

  // Pre-fill vehicle number and owner name when oldTax is provided
  useEffect(() => {
    if (oldTax && isOpen) {
      setFormData(prev => ({
        ...prev,
        vehicleNumber: oldTax.vehicleNumber || '',
        ownerName: oldTax.ownerName || ''
      }))
    } else if (!isOpen) {
      // Reset form when modal closes
      setFormData({
        receiptNo: '',
        vehicleNumber: '',
        ownerName: '',
        totalAmount: '',
        paidAmount: '',
        balance: '',
        taxFrom: '',
        taxTo: ''
      })
      setTaxPeriod('Q1')
      setPaidExceedsTotal(false)
      setVehicleError('')
    }
  }, [oldTax, isOpen])

  // Calculate tax to date based on selected quarter period
  useEffect(() => {
    if (formData.taxFrom) {
      // Parse DD-MM-YYYY or DD/MM/YYYY format
      const parts = formData.taxFrom.split(/[/-]/)
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10)
        const month = parseInt(parts[1], 10) - 1 // Month is 0-indexed
        const year = parseInt(parts[2], 10)

        // Check if date is valid
        if (!isNaN(day) && !isNaN(month) && !isNaN(year) && year > 1900) {
          const taxFromDate = new Date(year, month, day)

          // Check if the date object is valid
          if (!isNaN(taxFromDate.getTime())) {
            const taxToDate = new Date(taxFromDate)

            // Calculate based on selected quarter
            const monthsToAdd = {
              'Q1': 3,
              'Q2': 6,
              'Q3': 9,
              'Q4': 12
            }

            taxToDate.setMonth(taxToDate.getMonth() + monthsToAdd[taxPeriod])
            // Subtract 1 day
            taxToDate.setDate(taxToDate.getDate() - 1)

            // Format date to DD-MM-YYYY
            const newDay = String(taxToDate.getDate()).padStart(2, '0')
            const newMonth = String(taxToDate.getMonth() + 1).padStart(2, '0')
            const newYear = taxToDate.getFullYear()

            setFormData(prev => ({
              ...prev,
              taxTo: `${newDay}-${newMonth}-${newYear}`
            }))
          }
        }
      }
    }
  }, [formData.taxFrom, taxPeriod])

  // Auto-calculate balance when total amount or paid amount changes
  useEffect(() => {
    const total = parseFloat(formData.totalAmount) || 0
    let paid = parseFloat(formData.paidAmount) || 0

    // Cap paid amount at total if it exceeds
    if (paid > total && total > 0) {
      paid = total
      setPaidExceedsTotal(false)
      setFormData(prev => ({
        ...prev,
        paidAmount: paid.toString(),
        balance: '0'
      }))
    } else {
      const calculatedBalance = total - paid
      setPaidExceedsTotal(false)
      setFormData(prev => ({
        ...prev,
        balance: calculatedBalance.toString()
      }))
    }
  }, [formData.totalAmount, formData.paidAmount])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+Enter to submit
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault()
        document.querySelector('form')?.requestSubmit()
      }
      // Escape to close
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  const handleChange = (e) => {
    const { name, value } = e.target

    // Remove dashes from receipt number to store as uppercase
    if (name === 'receiptNo') {
      const cleanedValue = value.replace(/-/g, '').toUpperCase()
      setFormData(prev => ({
        ...prev,
        [name]: cleanedValue
      }))
      return
    }

    // Handle date fields with smart validation and formatting
    if (name === 'taxFrom' || name === 'taxTo') {
      const formatted = handleSmartDateInput(value, formData[name] || '')
      if (formatted !== null) {
        setFormData(prev => ({
          ...prev,
          [name]: formatted
        }))
      }
      return
    }

    // Convert owner name to uppercase
    if (name === 'ownerName') {
      setFormData(prev => ({
        ...prev,
        [name]: value.toUpperCase()
      }))
      return
    }

    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleDateBlur = (e) => {
    const { name, value } = e.target

    if (!value) return // Skip if empty

    // Remove all non-digit characters
    let digitsOnly = value.replace(/[^\d]/g, '')

    // Limit to 8 digits (DDMMYYYY)
    digitsOnly = digitsOnly.slice(0, 8)

    // Parse parts
    let day = ''
    let month = ''
    let year = ''

    if (digitsOnly.length >= 2) {
      day = digitsOnly.slice(0, 2)
      let dayNum = parseInt(day, 10)

      // Validate day: 01-31
      if (dayNum === 0) dayNum = 1
      if (dayNum > 31) dayNum = 31
      day = String(dayNum).padStart(2, '0')
    } else if (digitsOnly.length === 1) {
      day = '0' + digitsOnly[0]
    }

    if (digitsOnly.length >= 4) {
      month = digitsOnly.slice(2, 4)
      let monthNum = parseInt(month, 10)

      // Validate month: 01-12
      if (monthNum === 0) monthNum = 1
      if (monthNum > 12) monthNum = 12
      month = String(monthNum).padStart(2, '0')
    } else if (digitsOnly.length === 3) {
      month = '0' + digitsOnly[2]
    }

    if (digitsOnly.length >= 5) {
      year = digitsOnly.slice(4)

      // Auto-expand 2-digit year to 4-digit
      if (year.length === 2) {
        const yearNum = parseInt(year, 10)
        year = String(yearNum <= 50 ? 2000 + yearNum : 1900 + yearNum)
      } else if (year.length === 4) {
        // Keep as is
      } else if (year.length > 4) {
        year = year.slice(0, 4)
      }
    }

    // Format the date only if we have at least day and month
    if (day && month) {
      let formatted = `${day}-${month}`
      if (year) {
        formatted += `-${year}`
      }

      setFormData(prev => ({
        ...prev,
        [name]: formatted
      }))
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    // Validate paid amount doesn't exceed total fee
    if (paidExceedsTotal) {
      alert('Paid amount cannot be more than the total amount!')
      return
    }

    if (onSubmit && oldTax) {
      // Pass formData along with oldTaxId
      onSubmit({
        ...formData,
        oldTaxId: oldTax._id || oldTax.id
      })
    }

    // Reset form
    setFormData({
      receiptNo: '',
      vehicleNumber: '',
      ownerName: '',
      totalAmount: '',
      paidAmount: '',
      balance: '',
      taxFrom: '',
      taxTo: ''
    })
    setTaxPeriod('Q1')
    setPaidExceedsTotal(false)
    setVehicleError('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className='fixed inset-0 bg-black/60  z-[70] flex items-center justify-center p-2 md:p-4'>
      <div className='bg-white rounded-xl md:rounded-2xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-hidden flex flex-col'>
        {/* Header */}
        <div className='bg-gradient-to-r from-purple-600 to-pink-600 p-2 md:p-3 text-white flex-shrink-0'>
          <div className='flex justify-between items-center'>
            <div>
              <h2 className='text-lg md:text-2xl font-bold'>
                Renew Tax Record
              </h2>
              <p className='text-purple-100 text-xs md:text-sm mt-1'>
                Renew tax for {oldTax?.vehicleNumber}
              </p>
            </div>
            <button
              onClick={onClose}
              className='text-white hover:bg-white/20 rounded-lg p-1.5 md:p-2 transition cursor-pointer'
            >
              <svg className='w-5 h-5 md:w-6 md:h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
              </svg>
            </button>
          </div>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className='flex flex-col flex-1 overflow-hidden'>
          <div className='flex-1 overflow-y-auto p-3 md:p-6'>
            {/* Old Tax Info Banner */}
            {oldTax && (
              <div className='bg-amber-50 border-l-4 border-amber-500 p-3 md:p-4 rounded mb-4 md:mb-6'>
                <div className='flex items-start gap-2'>
                  <svg className='w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
                  </svg>
                  <div>
                    <p className='text-sm md:text-base font-semibold text-amber-800'>Renewing Existing Tax</p>
                    <p className='text-xs md:text-sm text-amber-700 mt-1'>
                      Vehicle: <span className='font-mono font-bold'>{oldTax.vehicleNumber}</span> |
                      Previous Period: {oldTax.taxFrom} to {oldTax.taxTo}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Section 1: Vehicle & Receipt Details */}
            <div className='bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-3 md:p-6 mb-4 md:mb-6'>
              <h3 className='text-base md:text-lg font-bold text-gray-800 mb-3 md:mb-4 flex items-center gap-2'>
                <span className='bg-purple-600 text-white w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm'>1</span>
                Vehicle & Receipt Details
              </h3>

              <div className='grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4'>
                {/* Vehicle Number - Read Only */}
                <div>
                  <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1'>
                    Vehicle Number <span className='text-red-500'>*</span>
                    <span className='ml-2 text-xs text-purple-600 font-normal'>(Auto-filled from existing record)</span>
                  </label>
                  <div className='relative'>
                    <input
                      type='text'
                      name='vehicleNumber'
                      value={formData.vehicleNumber}
                      placeholder='Vehicle Number'
                      maxLength='10'
                      className='w-full px-3 py-2 border border-purple-300 rounded-lg bg-purple-50 font-mono font-semibold text-gray-700'
                      readOnly
                      required
                    />
                    <div className='absolute right-3 top-2.5'>
                      <svg className='h-5 w-5 text-purple-500' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Receipt Number */}
                <div>
                  <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1'>
                    Receipt Number <span className='text-red-500'>*</span>
                  </label>
                  <input
                    type='text'
                    name='receiptNo'
                    value={formData.receiptNo}
                    onChange={handleChange}
                    placeholder='RCP001'
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono uppercase'
                    required
                    autoFocus
                  />
                </div>

                {/* Owner Name */}
                <div>
                  <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1'>
                    Owner Name
                    {oldTax?.ownerName && (
                      <span className='ml-2 text-xs text-purple-600 font-normal'>(Pre-filled)</span>
                    )}
                  </label>
                  <input
                    type='text'
                    name='ownerName'
                    value={formData.ownerName}
                    onChange={handleChange}
                    placeholder='Enter owner name'
                    className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                      oldTax?.ownerName ? 'bg-purple-50' : ''
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Payment Information */}
            <div className='bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-emerald-200 rounded-xl p-3 md:p-6 mb-4 md:mb-6'>
              <h3 className='text-base md:text-lg font-bold text-gray-800 mb-3 md:mb-4 flex items-center gap-2'>
                <span className='bg-emerald-600 text-white w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm'>2</span>
                Payment Information
              </h3>

              <div className='grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4'>
                {/* Total Amount */}
                <div>
                  <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1'>
                    Total Amount (₹) <span className='text-red-500'>*</span>
                  </label>
                  <input
                    type='number'
                    name='totalAmount'
                    value={formData.totalAmount}
                    onChange={handleChange}
                    placeholder='0'
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-semibold'
                    required
                  />
                </div>

                {/* Paid Amount */}
                <div>
                  <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1'>
                    Paid Amount (₹) <span className='text-red-500'>*</span>
                  </label>
                  <input
                    type='number'
                    name='paidAmount'
                    value={formData.paidAmount}
                    onChange={handleChange}
                    placeholder='0'
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 font-semibold ${
                      paidExceedsTotal
                        ? 'border-red-500 focus:ring-red-500 bg-red-50'
                        : 'border-gray-300 focus:ring-emerald-500 focus:border-transparent'
                    }`}
                    required
                  />
                  {paidExceedsTotal && (
                    <p className='text-xs mt-1 text-red-600 font-semibold'>
                      Paid amount cannot exceed total amount!
                    </p>
                  )}
                </div>

                {/* Balance (Auto-calculated) */}
                <div>
                  <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1'>
                    Balance (₹) <span className='text-xs text-gray-500'>(Auto)</span>
                  </label>
                  <input
                    type='number'
                    name='balance'
                    value={formData.balance}
                    readOnly
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg bg-emerald-50 font-semibold text-gray-700'
                  />
                </div>
              </div>

              {/* Payment Status Indicator */}
              {parseFloat(formData.balance) > 0 && parseFloat(formData.paidAmount) > 0 && (
                <div className='mt-3 bg-amber-50 border-l-4 border-amber-500 p-2 md:p-3 rounded'>
                  <p className='text-xs md:text-sm font-semibold text-amber-700 flex items-center gap-1'>
                    <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' />
                    </svg>
                    Partial Payment - Balance: ₹{formData.balance}
                  </p>
                </div>
              )}
              {parseFloat(formData.balance) === 0 && parseFloat(formData.totalAmount) > 0 && (
                <div className='mt-3 bg-green-50 border-l-4 border-green-500 p-2 md:p-3 rounded'>
                  <p className='text-xs md:text-sm font-semibold text-green-700 flex items-center gap-1'>
                    <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' />
                    </svg>
                    Fully Paid
                  </p>
                </div>
              )}
            </div>

            {/* Section 3: Tax Period */}
            <div className='bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-indigo-200 rounded-xl p-3 md:p-6 mb-4 md:mb-6'>
              <h3 className='text-base md:text-lg font-bold text-gray-800 mb-3 md:mb-4 flex items-center gap-2'>
                <span className='bg-indigo-600 text-white w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm'>3</span>
                Tax Period
              </h3>

              {/* Quarter Selection */}
              <div className='mb-4'>
                <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-2'>
                  Select Tax Period <span className='text-red-500'>*</span>
                </label>
                <div className='grid grid-cols-4 gap-2'>
                  <button
                    type='button'
                    onClick={() => setTaxPeriod('Q1')}
                    className={`px-3 py-2 rounded-lg font-semibold text-sm transition-all cursor-pointer ${
                      taxPeriod === 'Q1'
                        ? 'bg-indigo-600 text-white shadow-lg ring-2 ring-indigo-300'
                        : 'bg-white text-gray-700 border-2 border-indigo-200 hover:border-indigo-400'
                    }`}
                  >
                    Q1
                    <span className='block text-[10px] font-normal mt-0.5'>3 Months</span>
                  </button>
                  <button
                    type='button'
                    onClick={() => setTaxPeriod('Q2')}
                    className={`px-3 py-2 rounded-lg font-semibold text-sm transition-all cursor-pointer ${
                      taxPeriod === 'Q2'
                        ? 'bg-indigo-600 text-white shadow-lg ring-2 ring-indigo-300'
                        : 'bg-white text-gray-700 border-2 border-indigo-200 hover:border-indigo-400'
                    }`}
                  >
                    Q2
                    <span className='block text-[10px] font-normal mt-0.5'>6 Months</span>
                  </button>
                  <button
                    type='button'
                    onClick={() => setTaxPeriod('Q3')}
                    className={`px-3 py-2 rounded-lg font-semibold text-sm transition-all cursor-pointer ${
                      taxPeriod === 'Q3'
                        ? 'bg-indigo-600 text-white shadow-lg ring-2 ring-indigo-300'
                        : 'bg-white text-gray-700 border-2 border-indigo-200 hover:border-indigo-400'
                    }`}
                  >
                    Q3
                    <span className='block text-[10px] font-normal mt-0.5'>9 Months</span>
                  </button>
                  <button
                    type='button'
                    onClick={() => setTaxPeriod('Q4')}
                    className={`px-3 py-2 rounded-lg font-semibold text-sm transition-all cursor-pointer ${
                      taxPeriod === 'Q4'
                        ? 'bg-indigo-600 text-white shadow-lg ring-2 ring-indigo-300'
                        : 'bg-white text-gray-700 border-2 border-indigo-200 hover:border-indigo-400'
                    }`}
                  >
                    Q4
                    <span className='block text-[10px] font-normal mt-0.5'>12 Months</span>
                  </button>
                </div>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4'>
                {/* Tax From */}
                <div>
                  <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1'>
                    Tax From <span className='text-red-500'>*</span>
                  </label>
                  <input
                    type='text'
                    name='taxFrom'
                    value={formData.taxFrom}
                    onChange={handleChange}
                    onBlur={handleDateBlur}
                    placeholder='DD-MM-YYYY (e.g., 24-01-2025)'
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
                    required
                  />
                </div>

                {/* Tax To (Auto-calculated) */}
                <div>
                  <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1'>
                    Tax To <span className='text-xs text-blue-500'>(Auto-calculated, editable)</span>
                  </label>
                  <input
                    type='text'
                    name='taxTo'
                    value={formData.taxTo}
                    onChange={handleChange}
                    onBlur={handleDateBlur}
                    placeholder='DD-MM-YYYY (auto-calculated)'
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-indigo-50/50'
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className='border-t border-gray-200 p-3 md:p-4 bg-gray-50 flex flex-col md:flex-row justify-between items-center gap-3 flex-shrink-0'>
            <div className='text-xs md:text-sm text-gray-600'>
              <kbd className='px-2 py-1 bg-gray-200 rounded text-xs font-mono'>Ctrl+Enter</kbd> to submit quickly
            </div>

            <div className='flex gap-2 md:gap-3 w-full md:w-auto'>
              <button
                type='button'
                onClick={onClose}
                className='flex-1 md:flex-none px-4 md:px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-semibold transition cursor-pointer'
              >
                Cancel
              </button>

              <button
                type='submit'
                className='flex-1 md:flex-none px-6 md:px-8 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg font-semibold transition flex items-center justify-center gap-2 cursor-pointer'
              >
                <svg className='w-4 h-4 md:w-5 md:h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' />
                </svg>
                Renew Tax
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default RenewTaxModal
