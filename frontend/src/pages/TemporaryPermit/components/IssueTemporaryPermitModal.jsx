import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { validateVehicleNumberRealtime } from '../../../utils/vehicleNoCheck'
import { handlePaymentCalculation } from '../../../utils/paymentValidation'
import { handleSmartDateInput } from '../../../utils/dateFormatter'

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'

const IssueTemporaryPermitModal = ({ isOpen, onClose, onSubmit, initialData = null }) => {
  const [formData, setFormData] = useState({
    // Required fields
    permitNumber: '',
    permitHolderName: '',
    vehicleNumber: '',
    vehicleType: '', // CV or PV
    validFrom: '',
    validTo: '',

    // Optional fields
    mobileNumber: '',
    partyId: '',

    // Fees
    totalFee: '0',
    paid: '0',
    balance: '0',

    // Document
    temporaryPermitDocument: ''
  })

  const [fetchingVehicle, setFetchingVehicle] = useState(false)
  const [vehicleError, setVehicleError] = useState('')
  const [vehicleValidation, setVehicleValidation] = useState({ isValid: false, message: '' })
  const [paidExceedsTotal, setPaidExceedsTotal] = useState(false)
  const [vehicleMatches, setVehicleMatches] = useState([])
  const [showVehicleDropdown, setShowVehicleDropdown] = useState(false)
  const [selectedDropdownIndex, setSelectedDropdownIndex] = useState(0)
  const [manuallyEditedValidTo, setManuallyEditedValidTo] = useState(false)
  const [isExtracting, setIsExtracting] = useState(false)
  const [uploadingDoc, setUploadingDoc] = useState(false)
  const [temporaryPermitDocumentBase64, setTemporaryPermitDocumentBase64] = useState('')
  const [docPreview, setDocPreview] = useState(null)
  const dropdownItemRefs = useRef([])
  const isOcrUpdate = useRef(false)

  // Pre-fill form when initialData is provided (for renewal)
  useEffect(() => {
    if (initialData && isOpen) {
      setFormData(prev => ({
        ...prev,
        vehicleNumber: initialData.vehicleNumber || '',
        permitHolderName: initialData.permitHolderName || '',
        vehicleType: initialData.vehicleType || '',
        mobileNumber: initialData.mobileNumber || '',
        temporaryPermitDocument: initialData.temporaryPermitDocument || ''
      }))
      if (initialData.temporaryPermitDocument) {
        setDocPreview(`${API_URL}${initialData.temporaryPermitDocument}`)
      } else {
        setDocPreview(null)
      }
    } else if (!isOpen) {
      // Reset form when modal closes
      setFormData({
        permitNumber: '',
        permitHolderName: '',
        vehicleNumber: '',
        vehicleType: '',
        validFrom: '',
        validTo: '',
        mobileNumber: '',
        partyId: '',
        totalFee: '0',
        paid: '0',
        balance: '0',
        temporaryPermitDocument: ''
      })
      setVehicleError('')
      setFetchingVehicle(false)
      setVehicleValidation({ isValid: false, message: '' })
      setVehicleMatches([])
      setShowVehicleDropdown(false)
      setSelectedDropdownIndex(0)
      setManuallyEditedValidTo(false)
      setTemporaryPermitDocumentBase64('')
      setDocPreview(null)
    }
  }, [initialData, isOpen])

  // Fetch vehicle details when registration number is entered
  useEffect(() => {
    const fetchVehicleDetails = async () => {
      const searchInput = formData.vehicleNumber.trim()

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
              vehicleNumber: vehicleData.registrationNumber, // Replace partial input with full number
              permitHolderName: vehicleData.ownerName || prev.permitHolderName,
              address: vehicleData.address || prev.address,
              chassisNumber: vehicleData.chassisNumber || prev.chassisNumber,
              engineNumber: vehicleData.engineNumber || prev.engineNumber,
              ladenWeight: vehicleData.ladenWeight || prev.ladenWeight,
              unladenWeight: vehicleData.unladenWeight || prev.unladenWeight,
              mobileNumber: vehicleData.mobileNumber || prev.mobileNumber,
              email: vehicleData.email || prev.email,
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
      if (formData.vehicleNumber) {
        fetchVehicleDetails()
      }
    }, 500) // Wait 500ms after user stops typing

    return () => clearTimeout(timeoutId)
  }, [formData.vehicleNumber])

  // Calculate valid to date based on vehicle type (CV=3 months, PV=4 months)
  useEffect(() => {
    // Only calculate if both validFrom and vehicleType are present and user hasn't manually edited
    if (!formData.validFrom || !formData.vehicleType || manuallyEditedValidTo) {
      return
    }

    // Parse DD-MM-YYYY format (with dashes)
    const parts = formData.validFrom.trim().split('-')

    // Need exactly 3 parts (day, month, year)
    if (parts.length !== 3) {
      return
    }

    const day = parseInt(parts[0], 10)
    const month = parseInt(parts[1], 10)
    const year = parseInt(parts[2], 10)

    // Validate the parsed values
    if (isNaN(day) || isNaN(month) || isNaN(year)) {
      return
    }

    // Year should be 4 digits and reasonable
    if (year < 1900 || year > 2100) {
      return
    }

    // Month should be 1-12
    if (month < 1 || month > 12) {
      return
    }

    // Day should be 1-31 (basic check)
    if (day < 1 || day > 31) {
      return
    }

    // Create date object (month is 0-indexed in JavaScript)
    const validFromDate = new Date(year, month - 1, day)

    // Check if the date is valid (handles invalid dates like Feb 30)
    if (isNaN(validFromDate.getTime())) {
      return
    }

    // Verify the date object has the same day/month/year we set
    // (protects against dates like "31/02/2025" which JavaScript adjusts)
    if (validFromDate.getDate() !== day ||
        validFromDate.getMonth() !== month - 1 ||
        validFromDate.getFullYear() !== year) {
      return
    }

    // Determine months to add based on vehicle type
    let monthsToAdd = 0
    if (formData.vehicleType === 'CV') {
      monthsToAdd = 3
    } else if (formData.vehicleType === 'PV') {
      monthsToAdd = 4
    } else {
      return
    }

    // Calculate valid to date
    const validToDate = new Date(validFromDate)
    validToDate.setMonth(validToDate.getMonth() + monthsToAdd)
    // Subtract 1 day because Valid From counts as day 1
    validToDate.setDate(validToDate.getDate() - 1)

    // Format date to DD-MM-YYYY (with dashes to match input format)
    const newDay = String(validToDate.getDate()).padStart(2, '0')
    const newMonth = String(validToDate.getMonth() + 1).padStart(2, '0')
    const newYear = validToDate.getFullYear()
    const formattedValidTo = `${newDay}-${newMonth}-${newYear}`

    // Only update if the calculated value is different
    if (formData.validTo !== formattedValidTo) {
      setFormData(prev => ({
        ...prev,
        validTo: formattedValidTo
      }))
    }
  }, [formData.validFrom, formData.vehicleType, formData.validTo, manuallyEditedValidTo])

  // Auto-scroll to selected dropdown item
  useEffect(() => {
    if (showVehicleDropdown && dropdownItemRefs.current[selectedDropdownIndex]) {
      dropdownItemRefs.current[selectedDropdownIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      })
    }
  }, [selectedDropdownIndex, showVehicleDropdown])

  // Keyboard shortcuts and dropdown navigation
  useEffect(() => {
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

      // Ctrl+Enter to submit (only when dropdown is not showing)
      if (!showVehicleDropdown && (e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault()
        document.querySelector('form')?.requestSubmit()
      }
      // Escape to close modal (only when dropdown is not showing)
      if (!showVehicleDropdown && e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose, showVehicleDropdown, vehicleMatches, selectedDropdownIndex])

  // Handle vehicle selection from dropdown
  const handleVehicleSelect = (vehicle) => {
    setFormData(prev => ({
      ...prev,
      vehicleNumber: vehicle.registrationNumber,
      permitHolderName: vehicle.ownerName || prev.permitHolderName,
      address: vehicle.address || prev.address,
      chassisNumber: vehicle.chassisNumber || prev.chassisNumber,
      engineNumber: vehicle.engineNumber || prev.engineNumber,
      ladenWeight: vehicle.ladenWeight || prev.ladenWeight,
      unladenWeight: vehicle.unladenWeight || prev.unladenWeight,
      mobileNumber: vehicle.mobileNumber || prev.mobileNumber,
      email: vehicle.email || prev.email,
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
    if (name === 'vehicleNumber') {
      // Convert to uppercase
      const upperValue = value.toUpperCase()

      const validation = validateVehicleNumberRealtime(upperValue)
      setVehicleValidation(validation)

      setFormData(prev => ({
        ...prev,
        [name]: upperValue
      }))
      return
    }

    // Auto-calculate balance when totalFee or paid changes
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

    // Auto-uppercase for permit number and permit holder name
    if (name === 'permitNumber' || name === 'permitHolderName') {
      setFormData(prev => ({
        ...prev,
        [name]: value.toUpperCase()
      }))
      return
    }

    // Auto-format date fields with smart date input
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

    // If vehicle type changes, allow auto-calculation again
    if (name === 'vehicleType') {
      setManuallyEditedValidTo(false)
    }

    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // Handle Enter key to navigate to next field instead of submitting
  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()

      // Get current tabIndex
      const currentTabIndex = parseInt(e.target.getAttribute('tabIndex'))

      // If we're on the last field (paid = tabIndex 9), submit the form
      if (currentTabIndex === 9) {
        document.querySelector('form')?.requestSubmit()
        return
      }

      // Find next input with tabIndex
      const nextTabIndex = currentTabIndex + 1
      const nextInput = document.querySelector(`input[tabIndex="${nextTabIndex}"], select[tabIndex="${nextTabIndex}"]`)

      if (nextInput) {
        nextInput.focus()
      }
    }
  }

  const normalizeAIExtractedDate = (dateStr) => {
    if (!dateStr) return '';
    if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) return dateStr;
    let normalized = dateStr.replace(/[\/\.]/g, '-');
    if (/^\d{2}-\d{2}-\d{4}$/.test(normalized)) return normalized;
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return `${String(d.getDate()).padStart(2,'0')}-${String(d.getMonth()+1).padStart(2,'0')}-${d.getFullYear()}`;
    }
    return dateStr;
  }

  const processExtraction = async (base64String) => {
    setIsExtracting(true)
    const updateToast = toast.info('Analyzing permit document, please wait...', { autoClose: false, isLoading: true })

    try {
      const response = await axios.post(
        `${API_URL}/api/ocr/temporary-permit`,
        { imageBase64: base64String },
        { withCredentials: true }
      )

      if (response.data.success && response.data.data) {
        const resultData = response.data.data
        isOcrUpdate.current = true

        setFormData(prev => {
          const updated = { ...prev }
          if (resultData.vehicleNumber) {
            updated.vehicleNumber = resultData.vehicleNumber.toUpperCase()
            const validation = validateVehicleNumberRealtime(resultData.vehicleNumber)
            setVehicleValidation(validation)
          }
          if (resultData.permitHolderName) updated.permitHolderName = resultData.permitHolderName.toUpperCase()
          if (resultData.vehicleType) {
            const vt = resultData.vehicleType.toUpperCase()
            if (vt === 'CV' || vt === 'PV') updated.vehicleType = vt
          }
          if (resultData.validFrom) {
            const normalizedStr = normalizeAIExtractedDate(resultData.validFrom)
            const formatted = handleSmartDateInput(normalizedStr, '')
            if (formatted) updated.validFrom = formatted
          }
          if (resultData.validTo) {
            const normalizedStr = normalizeAIExtractedDate(resultData.validTo)
            const formatted = handleSmartDateInput(normalizedStr, '')
            if (formatted) {
              updated.validTo = formatted
              setManuallyEditedValidTo(true)
            }
          }
          return updated
        })

        setTimeout(() => { isOcrUpdate.current = false }, 200)
        toast.success('Permit Details Extracted Successfully!')
      } else {
        toast.error('Failed to extract details from document')
      }
    } catch (error) {
      console.error('OCR extraction error:', error)
      toast.error(`Extraction failed: ${error.response?.data?.message || error.message}`)
    } finally {
      setIsExtracting(false)
      toast.dismiss(updateToast)
    }
  }

  const handlePermitDocUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const isImage = file.type.startsWith('image/')
    const isPDF = file.type === 'application/pdf'
    if (!isImage && !isPDF) {
      toast.error('Please upload an image or PDF file')
      return
    }
    if (file.size > 12 * 1024 * 1024) {
      toast.error('File size exceeds 12MB limit')
      return
    }

    setUploadingDoc(true)

    const reader = new FileReader()
    reader.onloadend = async () => {
      const base64String = reader.result
      setTemporaryPermitDocumentBase64(base64String)

      await processExtraction(base64String)

      try {
        const response = await axios.post(
          `${API_URL}/api/upload/temporary-permit-document`,
          {
            imageData: base64String,
            vehicleNumber: formData.vehicleNumber || 'EXTRACTED'
          },
          { withCredentials: true }
        )

        if (response.data.success) {
          setFormData(prev => ({ ...prev, temporaryPermitDocument: response.data.data.path }))
          setDocPreview(base64String)
          toast.success('Permit document uploaded successfully')
        }
      } catch (error) {
        console.error('Document upload error:', error)
        toast.error('Failed to upload document')
      } finally {
        setUploadingDoc(false)
      }
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const handleRemoveDoc = () => {
    setDocPreview(null)
    setFormData(prev => ({
      ...prev,
      temporaryPermitDocument: ''
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    // Ensure vehicle number is 7-10 characters for submission
    if (formData.vehicleNumber && formData.vehicleNumber.length > 10) {
      alert('Vehicle number must be 10 characters or less')
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
    // Reset form
    setFormData({
      permitNumber: '',
      permitHolderName: '',
      vehicleNumber: '',
      vehicleType: '',
      validFrom: '',
      validTo: '',
      mobileNumber: '',
      totalFee: '0',
      paid: '0',
      balance: '0',
      temporaryPermitDocument: ''
    })
    setVehicleError('')
    setFetchingVehicle(false)
    setVehicleValidation({ isValid: false, message: '' })
    setVehicleMatches([])
    setShowVehicleDropdown(false)
    setSelectedDropdownIndex(0)
    setManuallyEditedValidTo(false)
    setTemporaryPermitDocumentBase64('')
    setDocPreview(null)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className='fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-2 md:p-4'>
      <div className='bg-white rounded-xl md:rounded-2xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden flex flex-col'>
        {/* Header */}
        <div className='bg-gradient-to-r from-teal-600 to-cyan-600 p-2 md:p-3 text-white flex-shrink-0'>
          <div className='flex justify-between items-center'>
            <div>
              <h2 className='text-lg md:text-2xl font-bold'>Add New Temporary Permit</h2>
              <p className='text-teal-100 text-xs md:text-sm mt-1'>Issue temporary vehicle permit (CV: 3 months - 1 day, PV: 4 months - 1 day)</p>
            </div>
            <div className='flex items-center gap-2'>
              {!docPreview ? (
                <div className='relative overflow-hidden rounded-lg'>
                  <button
                    type='button'
                    disabled={isExtracting || uploadingDoc}
                    className='flex items-center gap-1.5 rounded-lg bg-white/15 px-3 py-1.5 text-xs font-semibold text-white shadow-sm ring-1 ring-white/30 transition hover:bg-white/25 disabled:opacity-60 md:px-4 md:py-2 md:text-sm'
                  >
                    {isExtracting ? (
                      <>
                        <svg className='h-4 w-4 animate-spin text-white' fill='none' viewBox='0 0 24 24'>
                          <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4'></circle>
                          <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'></path>
                        </svg>
                        Extracting
                      </>
                    ) : (
                      <>
                        <svg className='h-4 w-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3' />
                        </svg>
                        AI Upload
                      </>
                    )}
                  </button>
                  <input
                    type='file'
                    accept='image/*, application/pdf'
                    disabled={isExtracting || uploadingDoc}
                    onChange={handlePermitDocUpload}
                    className='absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed'
                  />
                </div>
              ) : (
                <div className='relative'>
                  {docPreview.startsWith('data:application/pdf') || docPreview.includes('.pdf') ? (
                    <div className='flex items-center gap-2 rounded-lg bg-white/15 px-3 py-1.5 text-xs md:text-sm text-white ring-1 ring-white/30'>
                      <svg className='w-5 h-5 text-red-300' fill='currentColor' viewBox='0 0 20 20'>
                        <path fillRule='evenodd' d='M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z' clipRule='evenodd' />
                      </svg>
                      <span className='font-semibold'>Permit PDF</span>
                      <a href={docPreview} target='_blank' rel='noopener noreferrer' className='text-cyan-200 hover:text-white underline'>
                        View
                      </a>
                    </div>
                  ) : (
                    <img src={docPreview} alt='Permit Document Preview' className='h-10 md:h-12 rounded-lg ring-1 ring-white/30' />
                  )}
                  <button
                    type='button'
                    onClick={handleRemoveDoc}
                    className='absolute -top-1.5 -right-1.5 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-all shadow-lg'
                    title='Remove document'
                  >
                    <svg className='w-3 h-3' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' />
                    </svg>
                  </button>
                </div>
              )}
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
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className='flex flex-col flex-1 overflow-hidden'>
          <div className='flex-1 overflow-y-auto p-3 md:p-6'>
            {/* Section 1: Basic Information */}
            <div className='bg-gradient-to-r from-teal-50 to-cyan-50 border-2 border-teal-200 rounded-xl p-3 md:p-6 mb-4 md:mb-6'>
              <h3 className='text-base md:text-lg font-bold text-gray-800 mb-3 md:mb-4 flex items-center gap-2'>
                <span className='bg-teal-600 text-white w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm'>1</span>
                Basic Information
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
                      onKeyDown={handleInputKeyDown}
                      placeholder='CG04AA1234 or CG04G1234'
                      maxLength='10'
                      tabIndex="1"
className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent font-mono bg-white ${
  formData.vehicleNumber && !vehicleValidation.isValid
    ? 'border-red-500 focus:ring-red-500'
    : formData.vehicleNumber && vehicleValidation.isValid
    ? 'border-green-500 focus:ring-green-500'
    : 'border-gray-300 focus:ring-teal-500'
}`}
                      required
                      autoFocus
                    />
                    {fetchingVehicle && (
                      <div className='absolute right-3 top-2.5'>
                        <svg className='animate-spin h-5 w-5 text-teal-500' xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24'>
                          <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4'></circle>
                          <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'></path>
                        </svg>
                      </div>
                    )}
                    {!fetchingVehicle && vehicleValidation.isValid && formData.vehicleNumber && !showVehicleDropdown && (
                      <div className='absolute right-3 top-2.5'>
                        <svg className='h-5 w-5 text-green-500' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
                        </svg>
                      </div>
                    )}

                    {/* Dropdown for multiple vehicle matches */}
                    {showVehicleDropdown && vehicleMatches.length > 0 && (
                      <div className='absolute z-50 w-full mt-1 bg-white border border-teal-300 rounded-lg shadow-lg max-h-60 overflow-y-auto'>
                        <div className='p-2 bg-teal-50 border-b border-teal-200'>
                          <p className='text-xs font-semibold text-teal-700'>
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
                                ? 'bg-teal-100 border-l-4 border-l-teal-600'
                                : 'hover:bg-teal-50'
                            }`}
                          >
                            <div className='flex justify-between items-start'>
                              <div>
                                <p className={`font-mono font-bold text-sm ${
                                  index === selectedDropdownIndex ? 'text-teal-800' : 'text-teal-700'
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
                                index === selectedDropdownIndex ? 'text-teal-600' : 'text-teal-400'
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

                  </p>
                  {vehicleValidation.message && !fetchingVehicle && !showVehicleDropdown && (
                    <p className={`text-xs mt-1 ${vehicleValidation.isValid ? 'text-green-600' : 'text-red-600'}`}>
                      {vehicleValidation.message}
                    </p>
                  )}
                  {vehicleError && (
                    <p className='text-xs text-amber-600 mt-1'>{vehicleError}</p>
                  )}
                  {!vehicleError && !fetchingVehicle && formData.vehicleNumber && formData.permitHolderName && vehicleValidation.isValid && !showVehicleDropdown && (
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
                    onKeyDown={handleInputKeyDown}
                    placeholder='TP001234567'
                    tabIndex="2"
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent font-mono bg-white'
                  />
                </div>

                {/* Permit Holder Name */}
                <div>
                  <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1'>
                    Permit Holder Name <span className='text-xs text-gray-500 font-normal'>(Optional)</span>
                  </label>
                  <input
                    type='text'
                    name='permitHolderName'
                    value={formData.permitHolderName}
                    onChange={handleChange}
                    onKeyDown={handleInputKeyDown}
                    placeholder='Rajesh Transport Services'
                    tabIndex="3"
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white'
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
                  onKeyDown={handleInputKeyDown}
                  placeholder='10-digit number'
                  maxLength='10'
                  tabIndex="4"
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white'
                />
                </div>

                {/* Vehicle Type */}
                <div>
                  <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1'>
                    Vehicle Type <span className='text-red-500'>*</span>
                  </label>
                  <select
                    name='vehicleType'
                    value={formData.vehicleType}
                    onChange={handleChange}
                    onKeyDown={handleInputKeyDown}
                    tabIndex="5"
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent font-semibold bg-white'
                    required
                  >
                    <option value=''>Select Vehicle Type</option>
                    <option value='CV'>CV - Commercial Vehicle (3 months)</option>
                    <option value='PV'>PV - Passenger Vehicle (4 months)</option>
                  </select>
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
                  onKeyDown={handleInputKeyDown}
                  placeholder='DD-MM-YYYY'
                  tabIndex="6"
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white'
                  required
                  />

                </div>

                {/* Valid To (Auto-calculated but editable) */}
                <div>
                  <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1'>
                    Valid To <span className='text-xs text-blue-500'>(Auto-filled, Editable)</span>
                  </label>
<input
                  type='text'
                  name='validTo'
                  value={formData.validTo}
                  onChange={handleChange}
                  onKeyDown={handleInputKeyDown}
                  placeholder='DD-MM-YYYY or Auto-filled'
                  tabIndex="7"
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white'
                />
                  <p className='text-xs text-gray-500 mt-1'>

                  </p>
                </div>
              </div>
            </div>

            {/* Section 3: Payment Information */}
            <div className='bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-emerald-200 rounded-xl p-3 md:p-6 mb-4 md:mb-6'>
              <h3 className='text-base md:text-lg font-bold text-gray-800 mb-3 md:mb-4 flex items-center gap-2'>
                <span className='bg-emerald-600 text-white w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm'>3</span>
                Payment Information
              </h3>

              <div className='grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4'>
                <div>
                  <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1'>
                    Total Fee (₹) <span className='text-red-500'>*</span>
                  </label>
                  <input
                    type='number'
                    name='totalFee'
                    value={formData.totalFee}
                    onChange={handleChange}
                    onFocus={(e) => e.target.select()}
                    onKeyDown={handleInputKeyDown}
                    placeholder=''
                    tabIndex="8"
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-semibold'
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
                    onFocus={(e) => e.target.select()}
                    onKeyDown={handleInputKeyDown}
                    placeholder=''
                    tabIndex="9"
className={`w-full px-3 py-2 border rounded-lg focus:ring-2 font-semibold ${
  paidExceedsTotal
    ? 'border-red-500 focus:ring-red-500 bg-red-50'
    : 'border-gray-300 focus:ring-emerald-500 focus:border-transparent bg-white'
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
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
                </svg>
                Add Permit
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default IssueTemporaryPermitModal
