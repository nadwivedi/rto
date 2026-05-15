import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { handleDateBlur as utilHandleDateBlur, handleSmartDateInput } from '../../../utils/dateFormatter'
import { validateVehicleNumberRealtime } from '../../../utils/vehicleNoCheck'
import { handlePaymentCalculation } from '../../../utils/paymentValidation'

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'

const EditTaxModal = ({ isOpen, onClose, onSubmit, tax }) => {
  const [fetchingVehicle, setFetchingVehicle] = useState(false)
  const [vehicleError, setVehicleError] = useState('')
  const [dateError, setDateError] = useState({ taxFrom: '', taxTo: '' })
  const [vehicleValidation, setVehicleValidation] = useState({ isValid: false, message: '' })
  const [paidExceedsTotal, setPaidExceedsTotal] = useState(false)

  // Vehicle search dropdown states
  const [vehicleMatches, setVehicleMatches] = useState([])
  const [showVehicleDropdown, setShowVehicleDropdown] = useState(false)
  const [selectedDropdownIndex, setSelectedDropdownIndex] = useState(0)
  const dropdownItemRefs = useRef([])

  const [formData, setFormData] = useState({
    receiptNo: '',
    vehicleNumber: '',
    ownerName: '',
    mobileNumber: '',
    totalAmount: '0',
    paidAmount: '0',
    balance: '0',
    taxAmount: '',
    taxFrom: '',
    taxTo: ''
  })

  // Validate date and check if it's valid
  const isValidDate = (day, month, year) => {
    // Basic range checks
    if (day < 1 || day > 31) return false
    if (month < 1 || month > 12) return false
    if (year < 1900 || year > 2100) return false

    // Check days in month
    const daysInMonth = new Date(year, month, 0).getDate()
    return day <= daysInMonth
  }

  // Populate form when tax prop changes
  useEffect(() => {
    if (tax) {
      const vehicleNum = tax.vehicleNumber || ''

      setFormData({
        receiptNo: tax.receiptNo || '',
        vehicleNumber: vehicleNum,
        ownerName: tax.ownerName || '',
        mobileNumber: tax.mobileNumber || '',
        totalAmount: tax.totalAmount?.toString() || '0',
        paidAmount: tax.paidAmount?.toString() || '0',
        balance: tax.balanceAmount?.toString() || '0',
        taxAmount: tax.taxAmount ? tax.taxAmount.toString() : '',
        taxFrom: tax.taxFrom || '',
        taxTo: tax.taxTo || ''
      })

      // Validate the vehicle number if it exists
      if (vehicleNum) {
        const validation = validateVehicleNumberRealtime(vehicleNum)
        setVehicleValidation(validation)
      }
    }
  }, [tax])

  // Fetch vehicle details when registration number is entered
  useEffect(() => {
    const fetchVehicleDetails = async () => {
      const searchInput = formData.vehicleNumber.trim()

      // Don't search for the original vehicle number from tax record
      if (tax && searchInput === tax.vehicleNumber) {
        setVehicleError('')
        setVehicleMatches([])
        setShowVehicleDropdown(false)
        return
      }

      // Only fetch if search input has at least 4 characters
      if (searchInput.length < 4) {
        setVehicleError('')
        setVehicleMatches([])
        setShowVehicleDropdown(false)
        return
      }

      setFetchingVehicle(true)
      setVehicleError('')

      try {
        const response = await axios.get(`${API_URL}/api/vehicle-registrations/search/${searchInput}`, {
          withCredentials: true
        })

        if (response.data.success) {
          // Check if multiple vehicles found
          if (response.data.multiple) {
            // Show dropdown with multiple matches
            setVehicleMatches(response.data.data)
            setShowVehicleDropdown(true)
            setSelectedDropdownIndex(0)
            setVehicleError('')
          } else {
            // Single match found - auto-fill vehicle number, owner name, and mobile number
            const vehicleData = response.data.data
            setFormData(prev => ({
              ...prev,
              vehicleNumber: vehicleData.registrationNumber,
              ownerName: vehicleData.ownerName || prev.ownerName,
              mobileNumber: vehicleData.mobileNumber || prev.mobileNumber
            }))
            // Validate the auto-filled vehicle number
            const validation = validateVehicleNumberRealtime(vehicleData.registrationNumber)
            setVehicleValidation(validation)
            setVehicleError('')
            setVehicleMatches([])
            setShowVehicleDropdown(false)
          }
        }
      } catch (error) {
        console.error('Error fetching vehicle details:', error)
        if (error.response && error.response.status === 404) {
          setVehicleError('No vehicles found matching the search')
        } else {
          setVehicleError('Error fetching vehicle details')
        }
        setVehicleMatches([])
        setShowVehicleDropdown(false)
      } finally {
        setFetchingVehicle(false)
      }
    }

    // Debounce the API call - wait 500ms after user stops typing
    const timeoutId = setTimeout(() => {
      if (formData.vehicleNumber) {
        fetchVehicleDetails()
      }
    }, 500) // Wait 500ms after user stops typing

    return () => clearTimeout(timeoutId)
  }, [formData.vehicleNumber, tax])

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

  // Calculate tax to date (3 months from tax from)
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
            taxToDate.setMonth(taxToDate.getMonth() + 3)
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
  }, [formData.taxFrom])

  // Auto-scroll to selected dropdown item
  useEffect(() => {
    if (showVehicleDropdown && dropdownItemRefs.current[selectedDropdownIndex]) {
      dropdownItemRefs.current[selectedDropdownIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      })
    }
  }, [selectedDropdownIndex, showVehicleDropdown])

  // Handle vehicle selection from dropdown
  const handleVehicleSelect = (vehicle) => {
    setFormData(prev => ({
      ...prev,
      vehicleNumber: vehicle.registrationNumber,
      ownerName: vehicle.ownerName || prev.ownerName,
      mobileNumber: vehicle.mobileNumber || prev.mobileNumber
    }))
    setShowVehicleDropdown(false)
    setVehicleMatches([])
    setVehicleError('')
    setSelectedDropdownIndex(0)

    // Validate the selected vehicle number
    const validation = validateVehicleNumberRealtime(vehicle.registrationNumber)
    setVehicleValidation(validation)
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Handle dropdown navigation
      if (showVehicleDropdown && vehicleMatches.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault()
          setSelectedDropdownIndex(prev => (prev + 1) % vehicleMatches.length)
        } else if (e.key === 'ArrowUp') {
          e.preventDefault()
          setSelectedDropdownIndex(prev => (prev - 1 + vehicleMatches.length) % vehicleMatches.length)
        } else if (e.key === 'Enter') {
          e.preventDefault()
          handleVehicleSelect(vehicleMatches[selectedDropdownIndex])
        } else if (e.key === 'Escape') {
          e.preventDefault()
          setShowVehicleDropdown(false)
          setVehicleMatches([])
        }
        return
      }

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
  }, [isOpen, onClose, showVehicleDropdown, vehicleMatches, selectedDropdownIndex])


  const handleChange = (e) => {
    const { name, value } = e.target

    // Handle vehicle number - convert to uppercase and validate only (no enforcement)
    if (name === 'vehicleNumber') {
      // Convert to uppercase
      const upperValue = value.toUpperCase()

      // Validate in real-time (only show validation if 9 or 10 characters)
      const validation = (upperValue.length === 9 || upperValue.length === 10)
        ? validateVehicleNumberRealtime(upperValue)
        : { isValid: false, message: '' }
      setVehicleValidation(validation)

      setFormData(prev => ({
        ...prev,
        [name]: upperValue
      }))
      return
    }

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
    const uppercaseFields = ['ownerName']
    const finalValue = uppercaseFields.includes(name) ? value.toUpperCase() : value

    setFormData(prev => ({
      ...prev,
      [name]: finalValue
    }))
  }

  const handleDateBlur = (e) => {
    utilHandleDateBlur(e, setFormData)
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    // Validate vehicle number before submitting
    if (!vehicleValidation.isValid && formData.vehicleNumber) {
      alert('Please enter a valid vehicle number in the format: CG04AA1234 (10 characters, no spaces)')
      return
    }

    // Validate paid amount doesn't exceed total fee
    if (paidExceedsTotal) {
      alert('Paid amount cannot be more than the total fee!')
      return
    }

    if (onSubmit) {
      onSubmit(formData)
    }
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className='fixed inset-0 bg-black/60  z-[70] flex items-center justify-center p-2 md:p-4'>
      <div className='bg-white rounded-xl md:rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden flex flex-col'>
        {/* Header */}
        <div className='bg-gradient-to-r from-green-600 to-emerald-600 p-3 md:p-4 text-white flex-shrink-0'>
          <div className='flex justify-between items-center'>
            <div>
              <h2 className='text-lg md:text-2xl font-bold'>Edit Tax Record</h2>
              <p className='text-green-100 text-xs md:text-sm mt-1'>Update vehicle tax payment record</p>
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
            {/* Section 1: Vehicle & Receipt Details */}
            <div className='bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-indigo-200 rounded-xl p-3 md:p-6 mb-4 md:mb-6'>
              <h3 className='text-base md:text-lg font-bold text-gray-800 mb-3 md:mb-4 flex items-center gap-2'>
                <span className='bg-indigo-600 text-white w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm'>1</span>
                Vehicle & Receipt Details
              </h3>

              <div className='grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4'>
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
                      placeholder='CG04AA1234 or 4793'
                      maxLength='10'
                      className={`w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:border-transparent font-mono ${
                        formData.vehicleNumber && !vehicleValidation.isValid
                          ? 'border-red-500 focus:ring-red-500'
                          : formData.vehicleNumber && vehicleValidation.isValid
                          ? 'border-green-500 focus:ring-green-500'
                          : 'border-gray-300 focus:ring-indigo-500'
                      }`}
                      required
                      autoFocus
                    />
                    {/* Loading spinner */}
                    {fetchingVehicle && (
                      <div className='absolute right-3 top-2.5'>
                        <svg className='animate-spin h-5 w-5 text-indigo-600' fill='none' viewBox='0 0 24 24'>
                          <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4'></circle>
                          <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'></path>
                        </svg>
                      </div>
                    )}
                    {/* Success checkmark */}
                    {!fetchingVehicle && vehicleValidation.isValid && formData.vehicleNumber && !showVehicleDropdown && (
                      <div className='absolute right-3 top-2.5'>
                        <svg className='h-5 w-5 text-green-500' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
                        </svg>
                      </div>
                    )}

                    {/* Dropdown for multiple matches */}
                    {showVehicleDropdown && vehicleMatches.length > 0 && (
                      <div className='absolute z-50 w-full mt-1 bg-white border border-indigo-300 rounded-lg shadow-xl max-h-60 overflow-y-auto'>
                        <div className='p-2 bg-indigo-50 border-b border-indigo-200 text-xs font-semibold text-indigo-800 flex items-center gap-2'>
                          <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' />
                          </svg>
                          {vehicleMatches.length} vehicle{vehicleMatches.length !== 1 ? 's' : ''} found - Use ↑↓ to navigate, Enter to select
                        </div>
                        {vehicleMatches.map((vehicle, index) => (
                          <div
                            key={vehicle._id}
                            ref={(el) => (dropdownItemRefs.current[index] = el)}
                            onClick={() => handleVehicleSelect(vehicle)}
                            className={`p-3 cursor-pointer border-b border-gray-100 hover:bg-indigo-50 transition ${
                              index === selectedDropdownIndex ? 'bg-indigo-100 border-l-4 border-l-indigo-600' : ''
                            }`}
                          >
                            <div className='font-mono font-bold text-indigo-700'>{vehicle.registrationNumber}</div>
                            <div className='text-xs text-gray-600 mt-1'>
                              Owner: {vehicle.ownerName || 'N/A'}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Error message */}
                  {vehicleError && !fetchingVehicle && (
                    <p className='text-xs mt-1 text-red-600'>
                      {vehicleError}
                    </p>
                  )}

                  {/* Validation message */}
                  {vehicleValidation.message && !vehicleError && (
                    <p className={`text-xs mt-1 ${vehicleValidation.isValid ? 'text-green-600' : 'text-red-600'}`}>
                      {vehicleValidation.message}
                    </p>
                  )}

                  {/* Helper text */}
                  {!vehicleValidation.message && !formData.vehicleNumber && !vehicleError && (
                    <p className='text-xs mt-1 text-gray-500'>
                      Search by: Full number (CG04AA1234), Series (AA4793), or Last 4 digits (4793)
                    </p>
                  )}
                </div>

                {/* Receipt Number */}
                <div>
                  <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1'>
                    Receipt Number
                  </label>
                  <input
                    type='text'
                    name='receiptNo'
                    value={formData.receiptNo}
                    onChange={handleChange}
                    placeholder='RCP001'
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono uppercase'
                  />
                </div>

                {/* Owner Name */}
                <div>
                  <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1'>
                    Owner Name
                  </label>
                  <input
                    type='text'
                    name='ownerName'
                    value={formData.ownerName}
                    onChange={handleChange}
                    placeholder='Enter owner name'
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
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
                    placeholder=''
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
                    placeholder=''
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 font-semibold ${
                      paidExceedsTotal
                        ? 'border-red-500 focus:ring-red-500 bg-red-50'
                        : 'border-gray-300 focus:ring-emerald-500 focus:border-transparent'
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
            <div className='bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-3 md:p-6 mb-4 md:mb-6'>
              <h3 className='text-base md:text-lg font-bold text-gray-800 mb-3 md:mb-4 flex items-center gap-2'>
                <span className='bg-purple-600 text-white w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm'>3</span>
                Tax Period (Quarterly - 3 Months)
              </h3>

              <div className='grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4'>
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
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                      dateError.taxFrom ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                    required
                  />
                  {dateError.taxFrom && (
                    <p className='text-xs text-red-600 mt-1 flex items-center gap-1'>
                      <svg className='w-3 h-3' fill='currentColor' viewBox='0 0 20 20'>
                        <path fillRule='evenodd' d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z' clipRule='evenodd' />
                      </svg>
                      {dateError.taxFrom}
                    </p>
                  )}
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
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-purple-50/50 ${
                      dateError.taxTo ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                  />
                  {dateError.taxTo && (
                    <p className='text-xs text-red-600 mt-1 flex items-center gap-1'>
                      <svg className='w-3 h-3' fill='currentColor' viewBox='0 0 20 20'>
                        <path fillRule='evenodd' d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z' clipRule='evenodd' />
                      </svg>
                      {dateError.taxTo}
                    </p>
                  )}
                </div>

                {/* Tax Amount (Optional) */}
                <div>
                  <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1'>
                    Tax Amount (₹) <span className='text-xs text-gray-500'>(Optional)</span>
                  </label>
                  <input
                    type='number'
                    name='taxAmount'
                    value={formData.taxAmount}
                    onChange={handleChange}
                    placeholder=''
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-semibold'
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
                className='flex-1 md:flex-none px-6 md:px-8 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:shadow-lg font-semibold transition flex items-center justify-center gap-2 cursor-pointer'
              >
                <svg className='w-4 h-4 md:w-5 md:h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
                </svg>
                Update Tax Record
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditTaxModal
