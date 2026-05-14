import { useState, useEffect } from 'react'
import { handlePaymentCalculation } from '../../../utils/paymentValidation'
import { handleSmartDateInput } from '../../../utils/dateFormatter'

const RenewInsuranceModal = ({ isOpen, onClose, onSubmit, insuranceData }) => {
  const [formData, setFormData] = useState({
    policyNumber: '',
    vehicleNumber: '',
    mobileNumber: '',
    validFrom: '',
    validTo: '',
    totalFee: '',
    paid: '',
    balance: '',
    insuranceCompany: '',
    remarks: ''
  })
  const [paidExceedsTotal, setPaidExceedsTotal] = useState(false)

  // Pre-fill vehicle details when insuranceData is provided
  useEffect(() => {
    if (insuranceData && isOpen) {
      setFormData(prev => ({
        ...prev,
        vehicleNumber: insuranceData.vehicleNumber || '',
        mobileNumber: insuranceData.mobileNumber || '',
        insuranceCompany: insuranceData.insuranceCompany || '',
        remarks: insuranceData.remarks || ''
      }))
    } else if (!isOpen) {
      // Reset form when modal closes
      setFormData({
        policyNumber: '',
        vehicleNumber: '',
        mobileNumber: '',
        validFrom: '',
        validTo: '',
        totalFee: '',
        paid: '',
        balance: '',
        insuranceCompany: '',
        remarks: ''
      })
      setPaidExceedsTotal(false)
    }
  }, [insuranceData, isOpen])

  // Calculate valid to date (1 year from valid from for insurance)
  useEffect(() => {
    if (formData.validFrom) {
      // Parse DD-MM-YYYY
      const parts = formData.validFrom.split(/[/-]/)
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10)
        const month = parseInt(parts[1], 10) - 1
        const year = parseInt(parts[2], 10)

        if (!isNaN(day) && !isNaN(month) && !isNaN(year) && year > 1900) {
          const validFromDate = new Date(year, month, day)

          if (!isNaN(validFromDate.getTime())) {
            const validToDate = new Date(validFromDate)
            // Insurance is typically valid for 1 year
            validToDate.setFullYear(validToDate.getFullYear() + 1)
            validToDate.setDate(validToDate.getDate() - 1)

            const newDay = String(validToDate.getDate()).padStart(2, '0')
            const newMonth = String(validToDate.getMonth() + 1).padStart(2, '0')
            const newYear = validToDate.getFullYear()

            setFormData(prev => ({
              ...prev,
              validTo: `${newDay}-${newMonth}-${newYear}`
            }))
          }
        }
      }
    }
  }, [formData.validFrom])

  // Auto-calculate balance when total fee or paid changes
  useEffect(() => {
    const total = parseFloat(formData.totalFee) || 0
    let paid = parseFloat(formData.paid) || 0

    if (paid > total && total > 0) {
      paid = total
      setPaidExceedsTotal(false)
      setFormData(prev => ({
        ...prev,
        paid: paid.toString(),
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
  }, [formData.totalFee, formData.paid])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault()
        document.querySelector('form')?.requestSubmit()
      }
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

    // Handle date fields with smart validation and formatting
    if (name === 'validFrom' || name === 'validTo') {
      const formatted = handleSmartDateInput(value, formData[name] || '')
      if (formatted !== null) {
        setFormData(prev => ({
          ...prev,
          [name]: formatted
        }))
      }
      return
    }

    // Convert text fields to uppercase
    const uppercaseFields = ['policyNumber', 'vehicleNumber']
    const finalValue = uppercaseFields.includes(name) ? value.toUpperCase() : value

    setFormData(prev => ({
      ...prev,
      [name]: finalValue
    }))
  }

  const handleDateBlur = (e) => {
    const { name, value } = e.target

    if (!value) return

    let digitsOnly = value.replace(/[^\d]/g, '')
    digitsOnly = digitsOnly.slice(0, 8)

    let day = ''
    let month = ''
    let year = ''

    if (digitsOnly.length >= 2) {
      day = digitsOnly.slice(0, 2)
      let dayNum = parseInt(day, 10)
      if (dayNum === 0) dayNum = 1
      if (dayNum > 31) dayNum = 31
      day = String(dayNum).padStart(2, '0')
    } else if (digitsOnly.length === 1) {
      day = '0' + digitsOnly[0]
    }

    if (digitsOnly.length >= 4) {
      month = digitsOnly.slice(2, 4)
      let monthNum = parseInt(month, 10)
      if (monthNum === 0) monthNum = 1
      if (monthNum > 12) monthNum = 12
      month = String(monthNum).padStart(2, '0')
    } else if (digitsOnly.length === 3) {
      month = '0' + digitsOnly[2]
    }

    if (digitsOnly.length >= 5) {
      year = digitsOnly.slice(4)
      if (year.length === 2) {
        const yearNum = parseInt(year, 10)
        year = String(yearNum <= 50 ? 2000 + yearNum : 1900 + yearNum)
      } else if (year.length === 4) {
        // Keep as is
      } else if (year.length > 4) {
        year = year.slice(0, 4)
      }
    }

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

    if (paidExceedsTotal) {
      alert('Paid amount cannot be more than the total fee!')
      return
    }

    if (onSubmit && insuranceData) {
      onSubmit({
        ...formData,
        oldInsuranceId: insuranceData._id || insuranceData.id
      })
    }

    // Reset form
    setFormData({
      policyNumber: '',
      vehicleNumber: '',
      mobileNumber: '',
      validFrom: '',
      validTo: '',
      totalFee: '',
      paid: '',
      balance: '',
      insuranceCompany: '',
      remarks: ''
    })
    setPaidExceedsTotal(false)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className='fixed inset-0 bg-black/60  z-50 flex items-center justify-center p-2 md:p-4'>
      <div className='bg-white rounded-xl md:rounded-2xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-hidden flex flex-col'>
        {/* Header */}
        <div className='bg-gradient-to-r from-teal-600 to-cyan-600 p-2 md:p-3 text-white flex-shrink-0'>
          <div className='flex justify-between items-center'>
            <div>
              <h2 className='text-lg md:text-2xl font-bold'>
                Renew Insurance
              </h2>
              <p className='text-teal-100 text-xs md:text-sm mt-1'>
                Renew insurance for {insuranceData?.vehicleNumber}
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
            {/* Old Insurance Info Banner */}
            {insuranceData && (
              <div className='bg-amber-50 border-l-4 border-amber-500 p-3 md:p-4 rounded mb-4 md:mb-6'>
                <div className='flex items-start gap-2'>
                  <svg className='w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
                  </svg>
                  <div>
                    <p className='text-sm md:text-base font-semibold text-amber-800'>Renewing Existing Insurance</p>
                    <p className='text-xs md:text-sm text-amber-700 mt-1'>
                      Vehicle: <span className='font-mono font-bold'>{insuranceData.vehicleNumber}</span> |
                      Previous Validity: {insuranceData.validFrom} to {insuranceData.validTo}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Section 1: Basic Details */}
            <div className='bg-gradient-to-r from-teal-50 to-cyan-50 border-2 border-teal-200 rounded-xl p-3 md:p-6 mb-4 md:mb-6'>
              <h3 className='text-base md:text-lg font-bold text-gray-800 mb-3 md:mb-4 flex items-center gap-2'>
                <span className='bg-teal-600 text-white w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm'>1</span>
                Basic Details
              </h3>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4'>
                {/* Policy Number */}
                <div>
                  <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1'>
                    Policy Number <span className='text-red-500'>*</span>
                  </label>
                  <input
                    type='text'
                    name='policyNumber'
                    value={formData.policyNumber}
                    onChange={handleChange}
                    placeholder='INS-001234567'
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent font-mono'
                    required
                    autoFocus
                  />
                </div>

                {/* Vehicle Number - Read Only */}
                <div>
                  <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1'>
                    Vehicle Number <span className='text-red-500'>*</span>
                    <span className='ml-2 text-xs text-teal-600 font-normal'>(Auto-filled)</span>
                  </label>
                  <div className='relative'>
                    <input
                      type='text'
                      name='vehicleNumber'
                      value={formData.vehicleNumber}
                      placeholder='Vehicle Number'
                      maxLength='10'
                      className='w-full px-3 py-2 border border-teal-300 rounded-lg bg-teal-50 font-mono font-semibold text-gray-700'
                      readOnly
                      required
                    />
                    <div className='absolute right-3 top-2.5'>
                      <svg className='h-5 w-5 text-teal-500' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Mobile Number */}
                <div>
                  <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1'>
                    Mobile Number
                    {insuranceData?.mobileNumber && (
                      <span className='ml-2 text-xs text-teal-600 font-normal'>(Pre-filled)</span>
                    )}
                  </label>
                  <input
                    type='text'
                    name='mobileNumber'
                    value={formData.mobileNumber}
                    onChange={handleChange}
                    placeholder='10-digit mobile number'
                    maxLength='10'
                    className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                      insuranceData?.mobileNumber ? 'bg-teal-50' : ''
                    }`}
                  />
                </div>

                {/* Insurance Company */}
                <div>
                  <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1'>
                    Insurance Company
                  </label>
                  <input
                    type='text'
                    name='insuranceCompany'
                    value={formData.insuranceCompany}
                    onChange={handleChange}
                    placeholder='e.g., HDFC ERGO, ICICI Lombard'
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent'
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Validity Period */}
            <div className='bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-3 md:p-6 mb-4 md:mb-6'>
              <h3 className='text-base md:text-lg font-bold text-gray-800 mb-3 md:mb-4 flex items-center gap-2'>
                <span className='bg-blue-600 text-white w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm'>2</span>
                Validity Period (1 Year)
              </h3>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4'>
                {/* Valid From */}
                <div>
                  <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1'>
                    Valid From <span className='text-red-500'>*</span>
                  </label>
                  <input
                    type='text'
                    name='validFrom'
                    value={formData.validFrom}
                    onChange={handleChange}
                    onBlur={handleDateBlur}
                    placeholder='DD-MM-YYYY (e.g., 24-01-2025)'
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                    required
                  />
                </div>

                {/* Valid To (Auto-calculated) */}
                <div>
                  <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1'>
                    Valid To <span className='text-xs text-blue-500'>(Auto-calculated - 1 Year)</span>
                  </label>
                  <input
                    type='text'
                    name='validTo'
                    value={formData.validTo}
                    onChange={handleChange}
                    onBlur={handleDateBlur}
                    placeholder='DD-MM-YYYY (auto-calculated)'
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-blue-50/50'
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Payment Information */}
            <div className='bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-3 md:p-6 mb-4 md:mb-6'>
              <h3 className='text-base md:text-lg font-bold text-gray-800 mb-3 md:mb-4 flex items-center gap-2'>
                <span className='bg-purple-600 text-white w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm'>3</span>
                Payment Information
              </h3>

              <div className='grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4'>
                {/* Total Fee */}
                <div>
                  <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1'>
                    Total Fee (₹) <span className='text-red-500'>*</span>
                  </label>
                  <input
                    type='number'
                    name='totalFee'
                    value={formData.totalFee}
                    onChange={handleChange}
                    placeholder='0'
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-semibold'
                    required
                  />
                </div>

                {/* Paid */}
                <div>
                  <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1'>
                    Paid (₹) <span className='text-red-500'>*</span>
                  </label>
                  <input
                    type='number'
                    name='paid'
                    value={formData.paid}
                    onChange={handleChange}
                    placeholder='0'
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 font-semibold ${
                      paidExceedsTotal
                        ? 'border-red-500 focus:ring-red-500 bg-red-50'
                        : 'border-gray-300 focus:ring-purple-500 focus:border-transparent'
                    }`}
                    required
                  />
                  {paidExceedsTotal && (
                    <p className='text-xs mt-1 text-red-600 font-semibold'>
                      Paid amount cannot exceed total fee!
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
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg bg-purple-50 font-semibold text-gray-700'
                  />
                </div>
              </div>

              {/* Payment Status Indicator */}
              {parseFloat(formData.balance) > 0 && parseFloat(formData.paid) > 0 && (
                <div className='mt-3 bg-amber-50 border-l-4 border-amber-500 p-2 md:p-3 rounded'>
                  <p className='text-xs md:text-sm font-semibold text-amber-700 flex items-center gap-1'>
                    <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' />
                    </svg>
                    Partial Payment - Balance: ₹{formData.balance}
                  </p>
                </div>
              )}
              {parseFloat(formData.balance) === 0 && parseFloat(formData.totalFee) > 0 && (
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

            {/* Section 4: Notes (Optional) */}
            <div className='bg-gradient-to-r from-gray-50 to-slate-50 border-2 border-gray-200 rounded-xl p-3 md:p-6'>
              <h3 className='text-base md:text-lg font-bold text-gray-800 mb-3 md:mb-4 flex items-center gap-2'>
                <span className='bg-gray-600 text-white w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm'>4</span>
                Remarks (Optional)
              </h3>

              <div>
                <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1'>
                  Additional Remarks
                </label>
                <textarea
                  name='remarks'
                  value={formData.remarks}
                  onChange={handleChange}
                  placeholder='Enter any additional remarks'
                  rows='3'
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent'
                />
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
                className='flex-1 md:flex-none px-6 md:px-8 py-2 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-lg hover:shadow-lg font-semibold transition flex items-center justify-center gap-2 cursor-pointer'
              >
                <svg className='w-4 h-4 md:w-5 md:h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' />
                </svg>
                Renew Insurance
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default RenewInsuranceModal
