import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { validateVehicleNumberRealtime, enforceVehicleNumberFormat } from '../../../utils/vehicleNoCheck'
import { handlePaymentCalculation } from '../../../utils/paymentValidation'
import { handleSmartDateInput } from '../../../utils/dateFormatter'

const EditNationalPermitModal = ({ isOpen, onClose, onSubmit, permit }) => {
  const [showOptionalFields, setShowOptionalFields] = useState(true) // Show optional fields by default in edit mode
  const [partAImage, setPartAImage] = useState(null)
  const [partBImage, setPartBImage] = useState(null)
  const [vehicleValidation, setVehicleValidation] = useState({ isValid: false, message: '' })
  const [paidExceedsTotal, setPaidExceedsTotal] = useState(false)

  // Helper function to format date as DD-MM-YYYY
  const formatDate = (date) => {
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    return `${day}-${month}-${year}`
  }

  // Helper function to calculate date 1 year from now
  const getOneYearFromNow = () => {
    const today = new Date()
    const oneYearLater = new Date(today)
    oneYearLater.setFullYear(oneYearLater.getFullYear() + 1)
    oneYearLater.setDate(oneYearLater.getDate() - 1) // Minus 1 day
    return formatDate(oneYearLater)
  }

  const [formData, setFormData] = useState({
    // Required fields
    permitNumber: '',
    permitHolderName: '',
    validFrom: '',
    validTo: '',
    issueDate: '',
    status: 'Active',

    // Contact
    mobileNumber: '',
    partyId: '',

    // Vehicle details
    vehicleNumber: '',

    // Type B Authorization details
    authorizationNumber: '',
    typeBValidFrom: '',
    typeBValidTo: '',

    // Fees
    totalFee: '',
    paid: '',
    balance: '',

    // Notes
    notes: ''
  })

  // Populate form when permit changes
  useEffect(() => {
    if (permit && permit.partA) {
      setFormData({
        permitNumber: permit.permitNumber || '',
        permitHolderName: permit.permitHolder || '',
        validFrom: permit.partA.permitValidFrom || '',
        validTo: permit.partA.permitValidUpto || '',
        issueDate: permit.partA.issueDate || '',
        status: permit.status || 'Active',
        mobileNumber: permit.partA.ownerMobile?.replace('+91 ', '') || '',
        partyId: permit.partyId?._id || permit.partyId || '',
        vehicleNumber: permit.vehicleNo || '',
        authorizationNumber: permit.partB?.authorizationNumber || '',
        typeBValidFrom: permit.partB?.validFrom || '',
        typeBValidTo: permit.partB?.validTo || '',
        totalFee: permit.totalFee?.toString() || '',
        paid: permit.paid?.toString() || '',
        balance: permit.balance?.toString() || '',
        notes: permit.notes || ''
      })
    }
  }, [permit])

  // Calculate valid to date (5 years minus 1 day from valid from) for Type A
  useEffect(() => {
    if (formData.validFrom) {
      // Parse DD-MM-YYYY or DD/MM/YYYY format
      const parts = formData.validFrom.split(/[/-]/)
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10)
        const month = parseInt(parts[1], 10) - 1 // Month is 0-indexed
        const year = parseInt(parts[2], 10)

        // Check if date is valid
        if (!isNaN(day) && !isNaN(month) && !isNaN(year) && year > 1900) {
          const validFromDate = new Date(year, month, day)

          // Check if the date object is valid
          if (!isNaN(validFromDate.getTime())) {
            const validToDate = new Date(validFromDate)
            validToDate.setFullYear(validToDate.getFullYear() + 5)
            // Subtract 1 day (5 years minus 1 day)
            validToDate.setDate(validToDate.getDate() - 1)

            // Format date to DD-MM-YYYY
            const calculatedDate = formatDate(validToDate)

            setFormData(prev => ({
              ...prev,
              validTo: calculatedDate
            }))
          }
        }
      }
    }
  }, [formData.validFrom])

  // Calculate Type B valid to date (1 year from Type B valid from)
  useEffect(() => {
    if (formData.typeBValidFrom) {
      // Parse DD-MM-YYYY or DD/MM/YYYY format
      const parts = formData.typeBValidFrom.split(/[/-]/)
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10)
        const month = parseInt(parts[1], 10) - 1 // Month is 0-indexed
        const year = parseInt(parts[2], 10)

        // Check if date is valid
        if (!isNaN(day) && !isNaN(month) && !isNaN(year) && year > 1900) {
          const validFromDate = new Date(year, month, day)

          // Check if the date object is valid
          if (!isNaN(validFromDate.getTime())) {
            const validToDate = new Date(validFromDate)
            validToDate.setFullYear(validToDate.getFullYear() + 1)
            // Subtract 1 day (1 year minus 1 day)
            validToDate.setDate(validToDate.getDate() - 1)

            // Format date to DD-MM-YYYY
            const calculatedDate = formatDate(validToDate)

            setFormData(prev => ({
              ...prev,
              typeBValidTo: calculatedDate
            }))
          }
        }
      }
    }
  }, [formData.typeBValidFrom])

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

    // Handle vehicle number with format enforcement and validation
    if (name === 'vehicleNumber') {
      // Enforce format: only allow correct characters at each position
      const enforcedValue = enforceVehicleNumberFormat(formData.vehicleNumber, value)

      // Validate in real-time
      const validation = validateVehicleNumberRealtime(enforcedValue)
      setVehicleValidation(validation)

      setFormData(prev => ({
        ...prev,
        [name]: enforcedValue
      }))
      return
    }

    // Auto-uppercase for permit numbers (Type A and Type B)
    if (name === 'permitNumber' || name === 'authorizationNumber') {
      setFormData(prev => ({
        ...prev,
        [name]: value.toUpperCase()
      }))
      return
    }

    // Auto-calculate balance when totalFee or paid changes
    if (name === 'totalFee' || name === 'paid') {
      setFormData(prev => {
        const paymentResult = handlePaymentCalculation(name, value, prev)

        // Reset validation flag since paid is now capped
        setPaidExceedsTotal(paymentResult.paidExceedsTotal)

        return {
          ...prev,
          [name]: name === 'paid' ? paymentResult.paid : value,
          totalFee: name === 'totalFee' ? value : prev.totalFee,
          paid: name === 'paid' ? paymentResult.paid : prev.paid,
          balance: paymentResult.balance
        }
      })
      return
    }

    // Auto-format date fields with smart date input
    if (name === 'validFrom' || name === 'validTo' || name === 'typeBValidFrom' || name === 'typeBValidTo') {
      const formatted = handleSmartDateInput(value, formData[name] || '')
      if (formatted !== null) {
        setFormData(prev => ({
          ...prev,
          [name]: formatted
        }))
      }
      return
    }

    // For other fields, just store the value as-is
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleFileChange = (e, type) => {
    const file = e.target.files[0]
    if (file) {
      if (type === 'partA') {
        setPartAImage(file)
      } else {
        setPartBImage(file)
      }
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    // Validate paid amount doesn't exceed total fee
    if (paidExceedsTotal) {
      toast.error('Paid amount cannot be more than the total fee!', {
        position: 'top-right',
        autoClose: 3000
      })
      return
    }

    if (onSubmit) {
      onSubmit({
        ...formData,
        partAImage,
        partBImage
      })
    }
    // Reset form
    setFormData({
      permitNumber: '',
      permitHolderName: '',
      validFrom: '',
      validTo: '',
      issueDate: '',
      status: 'Active',
      mobileNumber: '',
      vehicleNumber: '',
      authorizationNumber: '',
      typeBValidFrom: '',
      typeBValidTo: '',
      totalFee: '',
      paid: '',
      balance: '',
      notes: ''
    })
    setPartAImage(null)
    setPartBImage(null)
    setShowOptionalFields(false)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className='fixed inset-0 bg-black/60  z-[70] flex items-center justify-center p-2 md:p-4'>
      <div className='bg-white rounded-xl md:rounded-2xl shadow-2xl max-w-7xl w-full max-h-[95vh] overflow-hidden flex flex-col'>
        {/* Header */}
        <div className='bg-gradient-to-r from-blue-600 to-indigo-600 p-3 md:p-4 text-white flex-shrink-0'>
          <div className='flex justify-between items-center'>
            <div>
              <h2 className='text-lg md:text-2xl font-bold'>Edit National Permit</h2>
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
            {/* Essential Fields Section */}
            <div className='bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-indigo-200 rounded-xl p-3 md:p-6 mb-4 md:mb-6'>
              <h3 className='text-base md:text-lg font-bold text-gray-800 mb-3 md:mb-4 flex items-center gap-2'>
                <span className='bg-indigo-600 text-white w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm'>1</span>
                Type A
              </h3>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4'>
                {/* Vehicle Number */}
                <div>
                  <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1'>
                    Vehicle Number <span className='text-red-500'>*</span>
                  </label>
                  <div className='relative'>
                    <input
                      type='text'
                      name='vehicleNumber'
                      value={formData.vehicleNumber}
                      onChange={handleChange}
                      placeholder='CG04AA1234'
                      maxLength='10'
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent font-mono ${
                        formData.vehicleNumber && !vehicleValidation.isValid
                          ? 'border-red-500 focus:ring-red-500'
                          : formData.vehicleNumber && vehicleValidation.isValid
                          ? 'border-green-500 focus:ring-green-500'
                          : 'border-gray-300 focus:ring-indigo-500'
                      }`}
                      autoFocus
                      required
                    />
                    {vehicleValidation.isValid && formData.vehicleNumber && (
                      <div className='absolute right-3 top-2.5'>
                        <svg className='h-5 w-5 text-green-500' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
                        </svg>
                      </div>
                    )}
                  </div>
                  {vehicleValidation.message && (
                    <p className={`text-xs mt-1 ${vehicleValidation.isValid ? 'text-green-600' : 'text-red-600'}`}>
                      {vehicleValidation.message}
                    </p>
                  )}
                  <p className='text-xs text-gray-500 mt-1'>
                    <span className='font-semibold'>Format:</span> <span className='text-blue-600'>AA</span> (letters) + <span className='text-green-600'>00</span> (digits) + <span className='text-blue-600'>AA</span> (letters) + <span className='text-green-600'>0000</span> (digits)
                  </p>
                </div>

                {/* Permit Number */}
                <div>
                  <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1'>
                    Permit Number <span className='text-xs text-gray-500 font-normal'>(Optional)</span>
                  </label>
                  <input
                    type='text'
                    name='permitNumber'
                    value={formData.permitNumber}
                    onChange={handleChange}
                    placeholder='Enter Type A Permit Number'
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono'
                  />
                  <p className='text-xs text-gray-500 mt-1'>Optional field - please go ahead</p>
                </div>

                {/* Permit Holder Name */}
                <div>
                  <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1'>
                    Name of Permit Holder <span className='text-red-500'>*</span>
                  </label>
                  <input
                    type='text'
                    name='permitHolderName'
                    value={formData.permitHolderName}
                    onChange={handleChange}
                    placeholder='Rajesh Transport Services'
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
                    required
                  />
                </div>

                {/* Mobile Number */}
                <div>
                  <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1'>
                    Mobile Number
                  </label>
                  <input
                    type='tel'
                    name='mobileNumber'
                    value={formData.mobileNumber}
                    onChange={handleChange}
                    placeholder='10-digit number'
                    maxLength='10'
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
                  />
                </div>

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
                    placeholder='Type: 240125 or 24012025'
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
                    required
                  />
                </div>

                {/* Valid To (Auto-calculated) */}
                <div>
                  <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1'>
                    Valid To (Auto-calculated - 5 Years) <span className='text-red-500'>*</span>
                  </label>
                  <input
                    type='text'
                    name='validTo'
                    value={formData.validTo}
                    onChange={handleChange}
                    placeholder='Will be calculated automatically'
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-indigo-50'
                    required
                  />
                </div>
              </div>
            </div>

            {/* Authorization & Route Section - NOW EDITABLE */}
            <div className='bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-3 md:p-6 mb-4 md:mb-6'>
              <div className='flex items-center justify-between mb-3 md:mb-4'>
                <h3 className='text-base md:text-lg font-bold text-gray-800 flex items-center gap-2'>
                  <span className='bg-purple-600 text-white w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm'>2</span>
                  <span className='text-sm md:text-base'>Type B Authorization</span>
                </h3>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <div>
                  <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1'>
                    Authorization Number <span className='text-xs text-gray-500 font-normal'>(Optional)</span>
                  </label>
                  <input
                    type='text'
                    name='authorizationNumber'
                    value={formData.authorizationNumber}
                    onChange={handleChange}
                    placeholder='Enter Authorization Number'
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono'
                  />
                  <p className='text-xs text-gray-500 mt-1'>Optional field - please go ahead</p>
                </div>

                <div>
                  <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1'>
                    Valid From
                  </label>
                  <input
                    type='text'
                    name='typeBValidFrom'
                    value={formData.typeBValidFrom}
                    onChange={handleChange}
                    placeholder='Type: 240125 or 24012025'
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent'
                  />
                </div>

                <div>
                  <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1'>
                    Valid To (Auto-calculated - 1 Year)
                  </label>
                  <input
                    type='text'
                    name='typeBValidTo'
                    value={formData.typeBValidTo}
                    onChange={handleChange}
                    placeholder='Will be calculated automatically'
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-purple-50'
                  />
                </div>
              </div>
            </div>

            {/* Fees Section */}
            <div className='bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-3 md:p-6 mb-4 md:mb-6'>
              <h3 className='text-base md:text-lg font-bold text-gray-800 mb-3 md:mb-4 flex items-center gap-2'>
                <span className='bg-green-600 text-white w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm'>3</span>
                Permit Fees
              </h3>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <div>
                  <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1'>
                    Total Fee (₹) <span className='text-red-500'>*</span>
                  </label>
                  <input
                    type='number'
                    name='totalFee'
                    value={formData.totalFee}
                    onChange={handleChange}
                    placeholder=''
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent font-semibold'
                    required
                  />
                </div>
                <div>
                  <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1'>
                    Paid (₹) <span className='text-red-500'>*</span>
                  </label>
                  <input
                    type='number'
                    name='paid'
                    value={formData.paid}
                    onChange={handleChange}
                    placeholder=''
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 font-semibold ${
                      paidExceedsTotal
                        ? 'border-red-500 focus:ring-red-500 bg-red-50'
                        : 'border-gray-300 focus:ring-green-500 focus:border-transparent'
                    }`}
                    required
                  />
                  {paidExceedsTotal && (
                    <p className='text-xs mt-1 text-red-600 font-semibold'>
                      Paid amount cannot exceed total fee!
                    </p>
                  )}
                </div>
                <div>
                  <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1'>
                    Balance (₹) <span className='text-red-500'>*</span>
                  </label>
                  <input
                    type='number'
                    name='balance'
                    value={formData.balance}
                    onChange={handleChange}
                    placeholder=''
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent font-semibold'
                    required
                  />
                </div>
              </div>
            </div>

            {/* Expandable Optional Fields */}
            <div className='border-2 border-gray-200 rounded-xl p-3 md:p-6'>
              <button
                type='button'
                onClick={() => setShowOptionalFields(!showOptionalFields)}
                className='flex items-center justify-between w-full text-left cursor-pointer'
              >
                <h3 className='text-base md:text-lg font-bold text-gray-800'>
                  Additional Details (Optional)
                </h3>
                <svg
                  className={`w-5 h-5 md:w-6 md:h-6 transition-transform ${showOptionalFields ? 'rotate-180' : ''}`}
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
                </svg>
              </button>

              {showOptionalFields && (
                <div className='mt-4 md:mt-6'>
                  {/* Document Uploads */}
                  <div>
                    <h4 className='text-xs md:text-sm font-bold mb-3 uppercase text-blue-600'>Document Uploads</h4>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                      {/* Part A Image Upload */}
                      <div className='border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-500 transition cursor-pointer'>
                        <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-2 cursor-pointer'>
                          <div className='flex items-center gap-2'>
                            <svg className='w-5 h-5 text-blue-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12' />
                            </svg>
                            <span>Upload Part A Document</span>
                          </div>
                        </label>
                        <input
                          type='file'
                          accept='image/*,application/pdf'
                          onChange={(e) => handleFileChange(e, 'partA')}
                          className='w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer'
                        />
                        <p className='text-xs text-gray-500 mt-2'>JPG, PNG, PDF (Max 5MB)</p>
                        {partAImage && (
                          <p className='text-xs text-green-600 mt-1 font-semibold'>✓ {partAImage.name}</p>
                        )}
                      </div>

                      {/* Part B Image Upload */}
                      <div className='border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-purple-500 transition cursor-pointer'>
                        <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-2 cursor-pointer'>
                          <div className='flex items-center gap-2'>
                            <svg className='w-5 h-5 text-purple-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12' />
                            </svg>
                            <span>Upload Part B Document</span>
                          </div>
                        </label>
                        <input
                          type='file'
                          accept='image/*,application/pdf'
                          onChange={(e) => handleFileChange(e, 'partB')}
                          className='w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 cursor-pointer'
                        />
                        <p className='text-xs text-gray-500 mt-2'>JPG, PNG, PDF (Max 5MB)</p>
                        {partBImage && (
                          <p className='text-xs text-green-600 mt-1 font-semibold'>✓ {partBImage.name}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions - Fixed at Bottom */}
          <div className='border-t border-gray-200 p-3 md:p-4 bg-gray-50 flex justify-between items-center flex-shrink-0 sticky bottom-0 shadow-lg'>
            <div className='text-sm text-gray-600 hidden md:block'>
              <kbd className='px-2 py-1 bg-gray-200 rounded text-xs font-mono'>Ctrl+Enter</kbd> to submit quickly
            </div>

            <div className='flex gap-2 md:gap-3 w-full md:w-auto'>
              <button
                type='button'
                onClick={onClose}
                className='flex-1 md:flex-none px-4 md:px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-semibold transition cursor-pointer text-sm md:text-base'
              >
                Cancel
              </button>

              <button
                type='submit'
                className='flex-1 md:flex-none px-4 md:px-8 py-2 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-lg hover:shadow-lg font-semibold transition flex items-center justify-center gap-2 cursor-pointer text-sm md:text-base'
              >
                <svg className='w-4 h-4 md:w-5 md:h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
                </svg>
                Update Permit
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditNationalPermitModal
