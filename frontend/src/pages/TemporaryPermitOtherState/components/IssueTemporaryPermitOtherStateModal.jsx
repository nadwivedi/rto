import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { validateVehicleNumberRealtime } from '../../../utils/vehicleNoCheck'
import { handlePaymentCalculation } from '../../../utils/paymentValidation'
import { handleSmartDateInput } from '../../../utils/dateFormatter'

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'

const IssueTemporaryPermitOtherStateModal = ({ onClose, onPermitIssued }) => {
  const [loading, setLoading] = useState(false)
  const [showOptionalFields, setShowOptionalFields] = useState(false)
  const [vehicleValidation, setVehicleValidation] = useState({ isValid: false, message: '' })
  const [paidExceedsTotal, setPaidExceedsTotal] = useState(false)
  const [fetchingVehicle, setFetchingVehicle] = useState(false)
  const [vehicleError, setVehicleError] = useState('')
  const [vehicleMatches, setVehicleMatches] = useState([])
  const [showVehicleDropdown, setShowVehicleDropdown] = useState(false)
  const [selectedDropdownIndex, setSelectedDropdownIndex] = useState(0)
  const [manuallyEditedValidTo, setManuallyEditedValidTo] = useState(false)
  const dropdownItemRefs = useRef([])
  const [formData, setFormData] = useState({
    permitNumber: '',
    permitHolder: '',
    vehicleNo: '',
    mobileNo: '',
    partyId: '',
    validFrom: '',
    validTo: '',
    totalFee: '0',
    paid: '0',
    balance: '0',
    notes: ''
  })

  // Handle Enter key to move to next field in order and dropdown navigation
  const handleKeyDown = (e) => {
    // Handle dropdown navigation
    if (showVehicleDropdown && vehicleMatches.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedDropdownIndex(prev =>
          prev < vehicleMatches.length - 1 ? prev + 1 : 0
        )
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedDropdownIndex(prev =>
          prev > 0 ? prev - 1 : vehicleMatches.length - 1
        )
        return
      }
      if (e.key === 'Enter') {
        e.preventDefault()
        if (vehicleMatches[selectedDropdownIndex]) {
          handleVehicleSelect(vehicleMatches[selectedDropdownIndex])
        }
        return
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        setShowVehicleDropdown(false)
        setVehicleMatches([])
        setSelectedDropdownIndex(0)
        return
      }
    }

    if (e.key === 'Enter' && !showVehicleDropdown) {
      e.preventDefault() // Prevent default form submission

      // Define complete navigation order - all fields from top to bottom
      const navigationOrder = [
        'vehicleNo',
        'permitNumber',
        'permitHolder',
        'mobileNo',
        'validFrom',
        'validTo',
        'totalFee',
        'paid'
      ]

      const currentFieldName = e.target.name
      const currentIndex = navigationOrder.indexOf(currentFieldName)

      // Move to next field in the order
      if (currentIndex > -1 && currentIndex < navigationOrder.length - 1) {
        const nextFieldName = navigationOrder[currentIndex + 1]
        const nextField = e.target.form.elements[nextFieldName]
        if (nextField) {
          nextField.focus()
        }
      } else if (currentIndex === navigationOrder.length - 1) {
        // Last field (paid) - submit the form
        e.target.form.requestSubmit()
      }
    }
  }

  useEffect(() => {
    // Only auto-calculate if user hasn't manually edited validTo
    if (formData.validFrom && !manuallyEditedValidTo) {
      const parts = formData.validFrom.split('-')
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10)
        const month = parseInt(parts[1], 10) - 1
        const year = parseInt(parts[2], 10)

        if (!isNaN(day) && !isNaN(month) && !isNaN(year) && year > 1900) {
          const validFromDate = new Date(year, month, day)
          if (!isNaN(validFromDate.getTime())) {
            const validToDate = new Date(validFromDate)
            validToDate.setDate(validToDate.getDate() + 27) // 28 days including start date

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
  }, [formData.validFrom, manuallyEditedValidTo])

  // Fetch vehicle details when registration number is entered
  useEffect(() => {
    const fetchVehicleDetails = async () => {
      const searchInput = formData.vehicleNo.trim()

      // Only fetch if search input has at least 4 characters
      if (searchInput.length < 4) {
        setVehicleError('')
        setVehicleMatches([])
        setShowVehicleDropdown(false)
        setSelectedDropdownIndex(0)
        return
      }

      setFetchingVehicle(true)
      setVehicleError('')

      try {
        const response = await axios.get(`${API_URL}/api/vehicle-registrations/search/${searchInput}`,{withCredentials:true})

        if (response.data.success) {
          // Check if multiple vehicles found
          if (response.data.multiple) {
            // Show dropdown with multiple matches
            setVehicleMatches(response.data.data)
            setShowVehicleDropdown(true)
            setSelectedDropdownIndex(0) // Reset to first item
            setVehicleError('')
          } else {
            // Single match found - auto-fill including full vehicle number and partyId
            const vehicleData = response.data.data
            setFormData(prev => ({
              ...prev,
              vehicleNo: vehicleData.registrationNumber, // Replace partial input with full number
              permitHolder: vehicleData.ownerName || prev.permitHolder,
              mobileNo: vehicleData.mobileNumber || prev.mobileNo,
              partyId: vehicleData.partyId?._id || vehicleData.partyId || ''
            }))
            // Validate the full vehicle number
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
        setSelectedDropdownIndex(0)
      } finally {
        setFetchingVehicle(false)
      }
    }

    // Debounce the API call - wait 500ms after user stops typing
    const timeoutId = setTimeout(() => {
      if (formData.vehicleNo) {
        fetchVehicleDetails()
      }
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [formData.vehicleNo])

  // Auto-scroll to selected dropdown item
  useEffect(() => {
    if (showVehicleDropdown && dropdownItemRefs.current[selectedDropdownIndex]) {
      dropdownItemRefs.current[selectedDropdownIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      })
    }
  }, [selectedDropdownIndex, showVehicleDropdown])

  // Keyboard shortcuts for modal actions
  useEffect(() => {
    const handleModalKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !showVehicleDropdown) {
        e.preventDefault()
        document.querySelector('form')?.requestSubmit()
        return
      }

      if (e.key === 'Escape' && !showVehicleDropdown) {
        e.preventDefault()
        onClose()
      }
    }

    document.addEventListener('keydown', handleModalKeyDown)
    return () => document.removeEventListener('keydown', handleModalKeyDown)
  }, [onClose, showVehicleDropdown])

  // Handle vehicle selection from dropdown
  const handleVehicleSelect = (vehicle) => {
    setFormData(prev => ({
      ...prev,
      vehicleNo: vehicle.registrationNumber,
      permitHolder: vehicle.ownerName || prev.permitHolder,
      mobileNo: vehicle.mobileNumber || prev.mobileNo,
      partyId: vehicle.partyId?._id || vehicle.partyId || ''
    }))
    setShowVehicleDropdown(false)
    setVehicleMatches([])
    setVehicleError('')
    setSelectedDropdownIndex(0)

    // Validate the selected vehicle number
    const validation = validateVehicleNumberRealtime(vehicle.registrationNumber)
    setVehicleValidation(validation)
  }

  const handleChange = (e) => {
    const { name, value } = e.target

    // Handle vehicle number with validation only (no enforcement)
    if (name === 'vehicleNo') {
      // Convert to uppercase
      const upperValue = value.toUpperCase()

      // Validate in real-time (only show validation if 9 or 10 characters)
      const validation = (upperValue.length === 9 || upperValue.length === 10) ? validateVehicleNumberRealtime(upperValue) : { isValid: false, message: '' }
      setVehicleValidation(validation)

      setFormData(prev => ({
        ...prev,
        [name]: upperValue
      }))
      return
    }

    if (name === 'totalFee' || name === 'paid') {
      // Remove leading zero when user starts typing
      let finalValue = value
      if (value.length > 0) {
        if (name === 'totalFee' && formData.totalFee === '0') {
          finalValue = value.replace(/^0+/, '') || '0'
        } else if (name === 'paid' && formData.paid === '0') {
          finalValue = value.replace(/^0+/, '') || '0'
        }
      }

      setFormData(prev => {
        const paymentResult = handlePaymentCalculation(name, finalValue, prev)

        // Reset validation flag since paid is now capped
        setPaidExceedsTotal(paymentResult.paidExceedsTotal)

        return {
          ...prev,
          [name]: name === 'paid' ? paymentResult.paid : finalValue,
          totalFee: name === 'totalFee' ? finalValue : prev.totalFee,
          paid: name === 'paid' ? paymentResult.paid : prev.paid,
          balance: paymentResult.balance
        }
      })
      return
    }

    // Auto-uppercase for permit number and permit holder
    if (name === 'permitNumber' || name === 'permitHolder') {
      setFormData(prev => ({
        ...prev,
        [name]: value.toUpperCase()
      }))
      return
    }

    if (name === 'validFrom' || name === 'validTo') {
      const formatted = handleSmartDateInput(value, formData[name] || '')
      if (formatted !== null) {
        setFormData(prev => ({
          ...prev,
          [name]: formatted
        }))

        // If user manually edits validTo, mark it as manually edited
        if (name === 'validTo') {
          setManuallyEditedValidTo(true)
        }
        // If user edits validFrom, allow auto-calculation again
        if (name === 'validFrom') {
          setManuallyEditedValidTo(false)
        }
      }
      return
    }

    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validate vehicle number before submitting (must be 9 or 10 characters and valid format)
    if ((formData.vehicleNo.length === 9 || formData.vehicleNo.length === 10) && !vehicleValidation.isValid) {
      toast.error('Please enter a valid vehicle number in the format: CG04AA1234 (10 chars) or CG04G1234 (9 chars)')
      return
    }

    // Ensure vehicle number is 9 or 10 characters for submission
    if (formData.vehicleNo && formData.vehicleNo.length !== 9 && formData.vehicleNo.length !== 10) {
      toast.error('Vehicle number must be 9 or 10 characters')
      return
    }

    // Validate paid amount doesn't exceed total fee
    if (paidExceedsTotal) {
      toast.error('Paid amount cannot be more than the total fee!')
      return
    }

    // Validation (permitNumber is now optional)
    if (!formData.permitHolder || !formData.vehicleNo ||
        !formData.mobileNo || !formData.validFrom || !formData.validTo) {
      toast.error('Please fill all required fields')
      return
    }

    try {
      setLoading(true)
      const response = await axios.post(`${API_URL}/api/temporary-permits-other-state`, formData, { withCredentials: true })

      if (response.data.success) {
        toast.success('Temporary permit (other state) issued successfully!')
        // Reset form
        setFormData({
          permitNumber: '',
          permitHolder: '',
          vehicleNo: '',
          mobileNo: '',
          validFrom: '',
          validTo: '',
          totalFee: '0',
          paid: '0',
          balance: '0',
          notes: ''
        })
        setShowOptionalFields(false)
        setVehicleValidation({ isValid: false, message: '' })
        setManuallyEditedValidTo(false)
        onPermitIssued()
      }
    } catch (error) {
      console.error('Error issuing permit:', error)

      // Handle detailed error response from backend
      if (error.response?.data) {
        const errorData = error.response.data

        // Show main error message
        const mainMessage = errorData.errorCount > 1
          ? `${errorData.message} (${errorData.errorCount} errors)`
          : (errorData.message || 'Failed to issue permit')

        toast.error(mainMessage, { position: 'top-right', autoClose: 5000 })

        // Show each detailed error if available
        if (errorData.errors && Array.isArray(errorData.errors)) {
          errorData.errors.forEach((err, index) => {
            setTimeout(() => {
              toast.error(`• ${err}`, { position: 'top-right', autoClose: 4000 })
            }, (index + 1) * 150)
          })
        }
      } else {
        // Network or other errors
        toast.error(`Failed to issue permit: ${error.message}`, { position: 'top-right', autoClose: 5000 })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='fixed inset-0 bg-black/60  z-[70] flex items-center justify-center p-2 md:p-4'>
      <div className='bg-white rounded-xl md:rounded-2xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden flex flex-col'>
        {/* Header */}
        <div className='bg-blue-700 p-2 md:p-3 text-white flex-shrink-0 shadow-lg'>
          <div className='flex justify-between items-center'>
            <div>
              <h2 className='text-lg md:text-2xl font-bold'>Add New Temporary Permit (Other State)</h2>
              <p className='text-blue-100 text-xs md:text-sm mt-1'>Issue temporary vehicle permit for vehicles from other states</p>
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

        {/* Form */}
        <form id='temp-permit-other-state-form' onSubmit={handleSubmit} className='flex flex-col flex-1 overflow-hidden'>
          <div className='flex-1 overflow-y-auto p-3 md:p-6'>
            {/* Section 1: Permit & Vehicle Details */}
            <div className='bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-200 rounded-xl p-3 md:p-6 mb-4 md:mb-6'>
              <h3 className='text-base md:text-lg font-bold text-gray-800 mb-3 md:mb-4 flex items-center gap-2'>
                <span className='bg-orange-600 text-white w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm'>1</span>
                Permit & Vehicle Details
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
                      name='vehicleNo'
                      value={formData.vehicleNo}
                      onChange={handleChange}
                      onKeyDown={handleKeyDown}
                      placeholder='CG04AA1234 or CG04G1234'
                      maxLength='10'
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent font-mono ${
                        formData.vehicleNo && !vehicleValidation.isValid
                          ? 'border-red-500 focus:ring-red-500'
                          : formData.vehicleNo && vehicleValidation.isValid
                          ? 'border-green-500 focus:ring-green-500'
                          : 'border-gray-300 focus:ring-orange-500'
                      }`}
                      required
                    />
                    {fetchingVehicle && (
                      <div className='absolute right-3 top-2.5'>
                        <svg className='animate-spin h-5 w-5 text-orange-500' xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24'>
                          <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4'></circle>
                          <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'></path>
                        </svg>
                      </div>
                    )}
                    {!fetchingVehicle && vehicleValidation.isValid && formData.vehicleNo && !showVehicleDropdown && (
                      <div className='absolute right-3 top-2.5'>
                        <svg className='h-5 w-5 text-green-500' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
                        </svg>
                      </div>
                    )}

                    {/* Dropdown for multiple vehicle matches */}
                    {showVehicleDropdown && vehicleMatches.length > 0 && (
                      <div className='absolute z-50 w-full mt-1 bg-white border border-orange-300 rounded-lg shadow-lg max-h-60 overflow-y-auto'>
                        <div className='p-2 bg-orange-50 border-b border-orange-200'>
                          <p className='text-xs font-semibold text-orange-700'>
                            {vehicleMatches.length} vehicles found - Use ↑↓ arrows to navigate, Enter to select
                          </p>
                        </div>
                        {vehicleMatches.map((vehicle, index) => (
                          <div
                            key={vehicle._id || index}
                            ref={(el) => (dropdownItemRefs.current[index] = el)}
                            onClick={() => handleVehicleSelect(vehicle)}
                            className={`p-3 cursor-pointer border-b border-gray-100 last:border-b-0 transition ${
                              index === selectedDropdownIndex
                                ? 'bg-orange-100 border-l-4 border-l-orange-600'
                                : 'hover:bg-orange-50'
                            }`}
                          >
                            <div className='flex justify-between items-start'>
                              <div>
                                <p className={`font-mono font-bold text-sm ${
                                  index === selectedDropdownIndex ? 'text-orange-800' : 'text-orange-700'
                                }`}>
                                  {vehicle.registrationNumber}
                                </p>
                                <p className='text-xs text-gray-700 mt-1'>
                                  {vehicle.ownerName || 'N/A'}
                                </p>
                                {vehicle.chassisNumber && (
                                  <p className='text-xs text-gray-500 mt-0.5'>
                                    Chassis: {vehicle.chassisNumber}
                                  </p>
                                )}
                              </div>
                              <svg className={`w-5 h-5 ${
                                index === selectedDropdownIndex ? 'text-orange-600' : 'text-orange-400'
                              }`} fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5l7 7-7 7' />
                              </svg>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className='text-xs text-gray-500 mt-1'>
                    Search by: Full number (CG04AA1234), Series (AA4793), or Last 4 digits (4793)
                  </p>
                  {vehicleValidation.message && !fetchingVehicle && !showVehicleDropdown && (
                    <p className={`text-xs mt-1 ${vehicleValidation.isValid ? 'text-green-600' : 'text-red-600'}`}>
                      {vehicleValidation.message}
                    </p>
                  )}
                  {vehicleError && (
                    <p className='text-xs text-amber-600 mt-1'>{vehicleError}</p>
                  )}
                  {!vehicleError && !fetchingVehicle && formData.vehicleNo && formData.permitHolder && vehicleValidation.isValid && !showVehicleDropdown && (
                    <p className='text-xs text-green-600 mt-1'>✓ Vehicle found - Owner details auto-filled</p>
                  )}
                  
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
                    onKeyDown={handleKeyDown}
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent font-mono'
                    placeholder='TP-OS-001'
                  />
                  <p className='text-xs text-gray-500 mt-1'>Optional field - please go ahead</p>
                </div>

                {/* Permit Holder Name */}
                <div>
                  <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1'>
                    Permit Holder Name <span className='text-red-500'>*</span>
                  </label>
                  <input
                    type='text'
                    name='permitHolder'
                    value={formData.permitHolder}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent'
                    placeholder='Enter holder name'
                    required
                  />
                </div>

                {/* Mobile Number */}
                <div>
                  <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1'>
                    Mobile Number <span className='text-red-500'>*</span>
                  </label>
                  <input
                    type='text'
                    name='mobileNo'
                    value={formData.mobileNo}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent'
                    placeholder='9876543210'
                    required
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Validity Period */}
            <div className='bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-indigo-200 rounded-xl p-3 md:p-6 mb-4 md:mb-6'>
              <h3 className='text-base md:text-lg font-bold text-gray-800 mb-3 md:mb-4 flex items-center gap-2'>
                <span className='bg-indigo-600 text-white w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm'>2</span>
                Validity Period
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
                    onKeyDown={handleKeyDown}
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
                    placeholder='DD-MM-YYYY'
                    required
                  />
                  <p className='text-xs text-gray-500 mt-1'>Smart input: type 5 → 05-, auto-expands years</p>
                </div>

                {/* Valid To */}
                <div>
                  <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1'>
                    Valid To <span className='text-red-500'>*</span> <span className='text-xs text-blue-500'>(Auto-filled, Editable)</span>
                  </label>
                  <input
                    type='text'
                    name='validTo'
                    value={formData.validTo}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
                    placeholder='DD-MM-YYYY or Auto-filled'
                    required
                  />
                  <p className='text-xs text-gray-500 mt-1'>Auto-filled: 28 days from Valid From date. You can edit this date.</p>
                </div>
              </div>
            </div>

            {/* Section 3: Fee Details */}
            <div className='bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-emerald-200 rounded-xl p-3 md:p-6 mb-4 md:mb-6'>
              <h3 className='text-base md:text-lg font-bold text-gray-800 mb-3 md:mb-4 flex items-center gap-2'>
                <span className='bg-emerald-600 text-white w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm'>3</span>
                Fee Details
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
                    onKeyDown={handleKeyDown}
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-semibold'
                    placeholder=''
                    min='0'
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
                    onKeyDown={handleKeyDown}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 font-semibold ${
                      paidExceedsTotal
                        ? 'border-red-500 focus:ring-red-500 bg-red-50'
                        : 'border-gray-300 focus:ring-emerald-500 focus:border-transparent'
                    }`}
                    placeholder=''
                    min='0'
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
                    Balance (₹) <span className='text-xs text-blue-500'>(Auto-calculated)</span>
                  </label>
                  <input
                    type='number'
                    name='balance'
                    value={formData.balance}
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-emerald-50/50 font-semibold'
                    readOnly
                  />
                  <p className='text-xs text-gray-500 mt-1'>Auto-calculated: Total - Paid</p>
                </div>
              </div>
            </div>

            {/* Section 4: Additional Notes */}
            <div className='bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-3 md:p-6'>
              <button
                type='button'
                onClick={() => setShowOptionalFields(!showOptionalFields)}
                className='flex items-center justify-between w-full text-left cursor-pointer'
              >
                <h3 className='text-base md:text-lg font-bold text-gray-800 flex items-center gap-2'>
                  <span className='bg-purple-600 text-white w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm'>4</span>
                  Additional Notes (Optional)
                </h3>
                <svg
                  className={`w-5 h-5 md:w-6 md:h-6 transition-transform text-gray-600 ${showOptionalFields ? 'rotate-180' : ''}`}
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
                </svg>
              </button>

              {showOptionalFields && (
                <div className='mt-3 md:mt-4'>
                  <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1'>
                    Notes
                  </label>
                  <textarea
                    name='notes'
                    value={formData.notes}
                    onChange={handleChange}
                    rows='3'
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none'
                    placeholder='Any additional notes or remarks...'
                  />
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className='flex-shrink-0 px-3 md:px-6 py-3 md:py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-2 md:gap-3'>
            <button
              type='button'
              onClick={onClose}
              className='px-4 md:px-6 py-2 md:py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-semibold text-sm md:text-base'
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type='submit'
              className='px-4 md:px-6 py-2 md:py-2.5 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg hover:from-orange-700 hover:to-red-700 transition font-bold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base'
              disabled={loading}
            >
              {loading ? (
                <span className='flex items-center gap-2'>
                  <svg className='animate-spin h-5 w-5' fill='none' viewBox='0 0 24 24'>
                    <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4'></circle>
                    <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'></path>
                  </svg>
                  Issuing Permit...
                </span>
              ) : (
                'Issue Permit'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default IssueTemporaryPermitOtherStateModal
