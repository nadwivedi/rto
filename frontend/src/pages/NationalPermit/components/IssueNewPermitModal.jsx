import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { validateVehicleNumberRealtime, cleanVehicleNumber } from '../../../utils/vehicleNoCheck'
import { handlePaymentCalculation } from '../../../utils/paymentValidation'
import { handleSmartDateInput } from '../../../utils/dateFormatter'
import { replacePaymentsForWork } from '../../../utils/paymentReceivedApi'
import { replaceExpensesForWork } from '../../../utils/expenseBreakdownApi'

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'

const IssueNewPermitModal = ({ isOpen, onClose, onSubmit, prefilledVehicleNumber = '', prefilledOwnerName = '', prefilledMobileNumber = '' }) => {
  const [fetchingVehicle, setFetchingVehicle] = useState(false)
  const [vehicleError, setVehicleError] = useState('')
  const [vehicleValidation, setVehicleValidation] = useState({ isValid: false, message: '' })
  const [paidExceedsTotal, setPaidExceedsTotal] = useState(false)
  const [vehicleMatches, setVehicleMatches] = useState([])
  const [showVehicleDropdown, setShowVehicleDropdown] = useState(false)
  const [selectedDropdownIndex, setSelectedDropdownIndex] = useState(0)
  const dropdownItemRefs = useRef([])
  const [existingPermitStatus, setExistingPermitStatus] = useState(null)
  const [permitCheckError, setPermitCheckError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [paymentReceived, setPaymentReceived] = useState([{ date: '', amount: '', paymentMode: 'Cash', remark: '', receivedBy: '' }])
  const [expenseItems, setExpenseItems] = useState([{ date: '', name: '', amount: '', remark: '' }])
  const [showAdditionalDetails, setShowAdditionalDetails] = useState(false)

  // Part A document upload state
  const [partASelectedFile, setPartASelectedFile] = useState(null)
  const [partADocumentBase64, setPartADocumentBase64] = useState('')
  const [uploadedPartAPath, setUploadedPartAPath] = useState('')
  const [uploadingPartA, setUploadingPartA] = useState(false)

  // Part B document upload state
  const [partBSelectedFile, setPartBSelectedFile] = useState(null)
  const [partBDocumentBase64, setPartBDocumentBase64] = useState('')
  const [uploadedPartBPath, setUploadedPartBPath] = useState('')
  const [uploadingPartB, setUploadingPartB] = useState(false)
  const [employees, setEmployees] = useState([])

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
    permitHolderName: prefilledOwnerName,
    validFrom: '',
    validTo: '',

    // Contact
    mobileNumber: prefilledMobileNumber,
    partyId: '',

    // Vehicle details
    vehicleNumber: prefilledVehicleNumber,

    // Type B Authorization details
    authorizationNumber: '',
    typeBValidFrom: '', // Empty - user will input
    typeBValidTo: '', // Empty - will be auto-calculated from typeBValidFrom

    // Fees
    totalFee: '0',
    paid: '0',
    balance: '0',

    // Notes
    notes: ''
  })

  // Set prefilled values when modal opens
  useEffect(() => {
    if (isOpen && (prefilledVehicleNumber || prefilledOwnerName || prefilledMobileNumber)) {
      setFormData(prev => ({
        ...prev,
        vehicleNumber: prefilledVehicleNumber,
        permitHolderName: prefilledOwnerName,
        mobileNumber: prefilledMobileNumber
      }));
      // Mark vehicle as valid if prefilled
      if (prefilledVehicleNumber) {
        setVehicleValidation({ isValid: true, message: 'Vehicle number prefilled' });
      }
    }
  }, [isOpen, prefilledVehicleNumber, prefilledOwnerName, prefilledMobileNumber])

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
        setExistingPermitStatus(null)
        setPermitCheckError('')
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
            setSelectedDropdownIndex(0) // Reset to first item
            setVehicleError('')
          } else {
            // Single match found - auto-fill including full vehicle number and partyId
            const vehicleData = response.data.data
            setFormData(prev => ({
              ...prev,
              vehicleNumber: vehicleData.registrationNumber, // Replace partial input with full number
              permitHolderName: vehicleData.ownerName || prev.permitHolderName,
              mobileNumber: vehicleData.mobileNumber || prev.mobileNumber,
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

  // Check for existing permits when vehicle number is complete (9 or 10 characters)
  useEffect(() => {
    const checkExistingPermit = async () => {
      const vehicleNumber = formData.vehicleNumber.trim()

      // Only check if vehicle number is 9 or 10 characters and valid
      if ((vehicleNumber.length !== 9 && vehicleNumber.length !== 10) || !vehicleValidation.isValid) {
        setExistingPermitStatus(null)
        setPermitCheckError('')
        return
      }

      try {
        const response = await axios.get(`${API_URL}/api/national-permits/check-existing/${vehicleNumber}`, {
          withCredentials: true
        })

        if (response.data.success) {
          const permitStatus = response.data.data
          setExistingPermitStatus(permitStatus)

          // If there's an active Part A, prefill Part A data
          if (permitStatus.hasActivePartA && permitStatus.activePartA) {
            const partA = permitStatus.activePartA
            setFormData(prev => ({
              ...prev,
              permitNumber: partA.permitNumber || prev.permitNumber,
              permitHolderName: partA.permitHolder || prev.permitHolderName,
              mobileNumber: partA.mobileNumber || prev.mobileNumber,
              validFrom: partA.validFrom || prev.validFrom,
              validTo: partA.validTo || prev.validTo
            }))
          }

          // If there's an active Part B, prefill Part B data
          if (permitStatus.hasActivePartB && permitStatus.activePartB) {
            const partB = permitStatus.activePartB
            setFormData(prev => ({
              ...prev,
              authorizationNumber: partB.partBNumber || prev.authorizationNumber,
              typeBValidFrom: partB.validFrom || prev.typeBValidFrom,
              typeBValidTo: partB.validTo || prev.typeBValidTo
            }))
          }

          setPermitCheckError('')
        }
      } catch (error) {
        console.error('Error checking existing permit:', error)
        setPermitCheckError('Error checking existing permit')
        setExistingPermitStatus(null)
      }
    }

    // Debounce the check - wait 300ms after vehicle number is complete
    const timeoutId = setTimeout(() => {
      if ((formData.vehicleNumber.length >= 7 && formData.vehicleNumber.length <= 10) && vehicleValidation.isValid) {
        checkExistingPermit()
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [formData.vehicleNumber, vehicleValidation.isValid])

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
  const handleVehicleSelect = async (vehicle) => {
    setFormData(prev => ({
      ...prev,
      vehicleNumber: vehicle.registrationNumber,
      permitHolderName: vehicle.ownerName || prev.permitHolderName,
      mobileNumber: vehicle.mobileNumber || prev.mobileNumber,
      partyId: vehicle.partyId?._id || vehicle.partyId || ''
    }))
    setShowVehicleDropdown(false)
    setVehicleMatches([])
    setVehicleError('')
    setSelectedDropdownIndex(0)

    // Validate the selected vehicle number
    const validation = validateVehicleNumberRealtime(vehicle.registrationNumber)
    setVehicleValidation(validation)

    // Check for existing permits for this vehicle
    if (validation.isValid && (vehicle.registrationNumber.length >= 7 && vehicle.registrationNumber.length <= 10)) {
      try {
        const response = await axios.get(`${API_URL}/api/national-permits/check-existing/${vehicle.registrationNumber}`, {
          withCredentials: true
        })

        if (response.data.success) {
          const permitStatus = response.data.data
          setExistingPermitStatus(permitStatus)

          // If there's an active Part A, prefill Part A data
          if (permitStatus.hasActivePartA && permitStatus.activePartA) {
            const partA = permitStatus.activePartA
            setFormData(prev => ({
              ...prev,
              permitNumber: partA.permitNumber || prev.permitNumber,
              permitHolderName: partA.permitHolder || prev.permitHolderName,
              mobileNumber: partA.mobileNumber || prev.mobileNumber,
              validFrom: partA.validFrom || prev.validFrom,
              validTo: partA.validTo || prev.validTo
            }))
          }

          // If there's an active Part B, prefill Part B data
          if (permitStatus.hasActivePartB && permitStatus.activePartB) {
            const partB = permitStatus.activePartB
            setFormData(prev => ({
              ...prev,
              authorizationNumber: partB.partBNumber || prev.authorizationNumber,
              typeBValidFrom: partB.validFrom || prev.typeBValidFrom,
              typeBValidTo: partB.validTo || prev.typeBValidTo
            }))
          }

          setPermitCheckError('')
        }
      } catch (error) {
        console.error('Error checking existing permit:', error)
        setPermitCheckError('Error checking existing permit')
        setExistingPermitStatus(null)
      }
    }
  }

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

  useEffect(() => {
    axios.get(`${API_URL}/api/employees`, { withCredentials: true })
      .then(res => setEmployees(res.data.data || []))
      .catch(() => {})
  }, [])

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

  const handlePartASelect = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const isImage = file.type.startsWith('image/')
    const isPDF = file.type === 'application/pdf'
    if (!isImage && !isPDF) {
      toast.error('Please upload an image or PDF file')
      e.target.value = ''
      return
    }
    if (file.size > 12 * 1024 * 1024) {
      toast.error('File size must be less than 12MB')
      e.target.value = ''
      return
    }
    setPartASelectedFile(file)
    setUploadedPartAPath('')
    const reader = new FileReader()
    reader.onloadend = () => setPartADocumentBase64(reader.result)
    reader.readAsDataURL(file)
  }

  const handlePartBSelect = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const isImage = file.type.startsWith('image/')
    const isPDF = file.type === 'application/pdf'
    if (!isImage && !isPDF) {
      toast.error('Please upload an image or PDF file')
      e.target.value = ''
      return
    }
    if (file.size > 12 * 1024 * 1024) {
      toast.error('File size must be less than 12MB')
      e.target.value = ''
      return
    }
    setPartBSelectedFile(file)
    setUploadedPartBPath('')
    const reader = new FileReader()
    reader.onloadend = () => setPartBDocumentBase64(reader.result)
    reader.readAsDataURL(file)
  }

  const handleRemovePartA = () => {
    setPartASelectedFile(null)
    setPartADocumentBase64('')
    setUploadedPartAPath('')
  }

  const handleRemovePartB = () => {
    setPartBSelectedFile(null)
    setPartBDocumentBase64('')
    setUploadedPartBPath('')
  }

  const handleQuickUploadPartA = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      toast.error('Please upload an image or PDF file')
      e.target.value = ''
      return
    }
    if (!formData.vehicleNumber) {
      toast.error('Please enter vehicle number first')
      e.target.value = ''
      return
    }
    setUploadingPartA(true)
    try {
      const reader = new FileReader()
      reader.onloadend = async () => {
        try {
          const base64 = reader.result
          const res = await axios.post(`${API_URL}/api/upload/np-part-a-document`, {
            imageData: base64,
            vehicleNumber: formData.vehicleNumber
          }, { withCredentials: true })
          if (res.data.success) {
            setPartASelectedFile(file)
            setPartADocumentBase64('')
            setUploadedPartAPath(res.data.data.path)
            toast.success('Part A document uploaded successfully!')
          }
        } catch {
          toast.error('Failed to upload Part A document')
        } finally {
          setUploadingPartA(false)
        }
      }
      reader.readAsDataURL(file)
    } catch {
      setUploadingPartA(false)
    }
  }

  const handleQuickUploadPartB = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      toast.error('Please upload an image or PDF file')
      e.target.value = ''
      return
    }
    if (!formData.vehicleNumber) {
      toast.error('Please enter vehicle number first')
      e.target.value = ''
      return
    }
    setUploadingPartB(true)
    try {
      const reader = new FileReader()
      reader.onloadend = async () => {
        try {
          const base64 = reader.result
          const res = await axios.post(`${API_URL}/api/upload/np-part-b-document`, {
            imageData: base64,
            vehicleNumber: formData.vehicleNumber
          }, { withCredentials: true })
          if (res.data.success) {
            setPartBSelectedFile(file)
            setPartBDocumentBase64('')
            setUploadedPartBPath(res.data.data.path)
            toast.success('Part B document uploaded successfully!')
          }
        } catch {
          toast.error('Failed to upload Part B document')
        } finally {
          setUploadingPartB(false)
        }
      }
      reader.readAsDataURL(file)
    } catch {
      setUploadingPartB(false)
    }
  }

  // Handle Enter key to navigate to next field instead of submitting
  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()

      // Get current tabIndex
      const currentTabIndex = parseInt(e.target.getAttribute('tabIndex'))

      // If we're on the last field (paid = tabIndex 11), submit the form
      if (currentTabIndex === 11) {
        document.querySelector('form')?.requestSubmit()
        return
      }

      // Find next input with tabIndex
      const nextTabIndex = currentTabIndex + 1
      const nextInput = document.querySelector(`input[tabIndex="${nextTabIndex}"]`)

      if (nextInput) {
        nextInput.focus()
      }
    }
  }

  const addExpenseItem = () => {
    setExpenseItems(prev => [...prev, { date: '', name: '', amount: '', remark: '' }])
  }

  const removeExpenseItem = (index) => {
    setExpenseItems(prev => prev.filter((_, i) => i !== index))
  }

  const handleExpenseBreakupChange = (index, field, value) => {
    setExpenseItems(prev => prev.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    ))
  }

  const addPaymentReceivedItem = () => {
    setPaymentReceived(prev => [...prev, { date: '', amount: '', paymentMode: 'Cash', remark: '', receivedBy: '' }])
  }

  const removePaymentReceivedItem = (index) => {
    setPaymentReceived(prev => prev.filter((_, i) => i !== index))
  }

  const handlePaymentReceivedChange = (index, field, value) => {
    setPaymentReceived(prev => prev.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    ))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Ensure vehicle number is 7-10 characters for submission
    if (formData.vehicleNumber && formData.vehicleNumber.length > 10) {
      toast.error('Vehicle number must be 10 characters or less', {
        position: 'top-right',
        autoClose: 3000
      })
      return
    }

    // Check if both Part A and Part B are active - don't allow creating new permit
    if (existingPermitStatus && existingPermitStatus.hasActivePermit) {
      toast.error(existingPermitStatus.message || 'This vehicle already has an active national permit. You cannot create another permit until one of the parts expires or is expiring soon.', {
        position: 'top-right',
        autoClose: 5000
      })
      return
    }

    // Validate paid amount doesn't exceed total fee
    if (paidExceedsTotal) {
      toast.error('Paid amount cannot be more than the total fee!', {
        position: 'top-right',
        autoClose: 3000
      })
      return
    }

    const totalReceived = paymentReceived.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0)
    if (totalReceived > parseFloat(formData.totalFee || 0)) {
      toast.error('Total received amount in payment breakdown cannot be greater than the total fee!')
      return
    }

    // Check that at least one of Part A or Part B is filled
    const hasPartA = formData.permitNumber.trim() || formData.permitHolderName.trim() || formData.validFrom.trim()
    const hasPartB = formData.authorizationNumber.trim() || formData.typeBValidFrom.trim()
    if (!hasPartA && !hasPartB) {
      toast.error('Either Part A or Part B must be filled!', {
        position: 'top-right',
        autoClose: 3000
      })
      return
    }

    const dataToSubmit = {
      permitNumber: formData.permitNumber,
      permitHolder: formData.permitHolderName,
      vehicleNumber: formData.vehicleNumber,
      partAValidFrom: formData.validFrom,
      partAValidTo: formData.validTo,
      mobileNumber: formData.mobileNumber,
      partyId: formData.partyId || null,
      partBNumber: formData.authorizationNumber,
      partBValidFrom: formData.typeBValidFrom,
      partBValidTo: formData.typeBValidTo,
      totalFee: parseFloat(formData.totalFee) || 0,
      paid: parseFloat(formData.paid) || 0,
      balance: parseFloat(formData.balance) || 0,
      notes: formData.notes,
      partADocument: uploadedPartAPath || partADocumentBase64 || '',
      partBDocument: uploadedPartBPath || partBDocumentBase64 || ''
    }

    setIsSubmitting(true)
    try {
      const response = await axios.post(`${API_URL}/api/national-permits`, dataToSubmit, {
        withCredentials: true
      })

      if (response.data.success) {
        const recordId = response.data.data?._id

        const validPayments = paymentReceived.filter(p => p.date && p.amount && parseFloat(p.amount) > 0)
        if (validPayments.length > 0 && recordId) {
          try {
            await replacePaymentsForWork('NP', recordId, validPayments)
          } catch (paymentErr) {
            console.error('Failed to save payment received entries:', paymentErr)
            toast.warn('National Permit saved, but payment breakdown could not be saved.')
          }
        }

        const validExpenses = expenseItems.filter(e => e.date && e.name && e.amount && parseFloat(e.amount) > 0)
        if (recordId) {
          try {
            await replaceExpensesForWork('NP', recordId, validExpenses)
          } catch (expErr) {
            console.error('Failed to save expense entries:', expErr)
            toast.warn('National Permit saved, but expense breakdown could not be saved.')
          }
        }

        toast.success('National Permit added successfully!')

        if (onSubmit) {
          onSubmit()
        }

        onClose()
        setPartASelectedFile(null)
        setPartADocumentBase64('')
        setUploadedPartAPath('')
        setPartBSelectedFile(null)
        setPartBDocumentBase64('')
        setUploadedPartBPath('')
      }
    } catch (error) {
      console.error('Error adding National Permit:', error)
      toast.error(error.response?.data?.message || 'Failed to add National Permit')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className='fixed inset-0 bg-black/60  z-[70] flex items-center justify-center p-2 md:p-4'>
      <div className='bg-white rounded-xl md:rounded-2xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-hidden flex flex-col'>
        {/* Header */}
        <div className='bg-gradient-to-r from-blue-600 to-indigo-600 p-3 md:p-4 text-white flex-shrink-0'>
          <div className='flex justify-between items-center'>
            <div>
              <h2 className='text-lg md:text-2xl font-bold'>Add New National Permit</h2>
            </div>
            <div className='flex items-center gap-2 shrink-0'>
              {/* Part A Upload Button */}
              <div className='relative overflow-hidden rounded-lg'>
                <button
                  type='button'
                  disabled={uploadingPartA}
                  className='flex items-center gap-1.5 rounded-lg bg-white/15 px-3 py-1.5 text-xs font-semibold text-white shadow-sm ring-1 ring-white/30 transition hover:bg-white/25 disabled:opacity-60 md:px-4 md:py-2 md:text-sm cursor-pointer'
                  title='Upload Part A'
                >
                  {uploadingPartA ? (
                    <>
                      <svg className='h-4 w-4 animate-spin text-white' fill='none' viewBox='0 0 24 24'>
                        <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4'></circle>
                        <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'></path>
                      </svg>
                      <span className='hidden md:inline'>Part A</span>
                    </>
                  ) : (
                    <>
                      <svg className='h-4 w-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12'/>
                      </svg>
                      <span className='hidden md:inline'>Part A</span>
                    </>
                  )}
                </button>
                <input
                  type='file'
                  accept='image/*,application/pdf'
                  disabled={uploadingPartA}
                  onChange={handleQuickUploadPartA}
                  className='absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed'
                />
              </div>
              {/* Part B Upload Button */}
              <div className='relative overflow-hidden rounded-lg'>
                <button
                  type='button'
                  disabled={uploadingPartB}
                  className='flex items-center gap-1.5 rounded-lg bg-white/15 px-3 py-1.5 text-xs font-semibold text-white shadow-sm ring-1 ring-white/30 transition hover:bg-white/25 disabled:opacity-60 md:px-4 md:py-2 md:text-sm cursor-pointer'
                  title='Upload Part B'
                >
                  {uploadingPartB ? (
                    <>
                      <svg className='h-4 w-4 animate-spin text-white' fill='none' viewBox='0 0 24 24'>
                        <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4'></circle>
                        <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'></path>
                      </svg>
                      <span className='hidden md:inline'>Part B</span>
                    </>
                  ) : (
                    <>
                      <svg className='h-4 w-4 text-purple-300' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12'/>
                      </svg>
                      <span className='hidden md:inline'>Part B</span>
                    </>
                  )}
                </button>
                <input
                  type='file'
                  accept='image/*,application/pdf'
                  disabled={uploadingPartB}
                  onChange={handleQuickUploadPartB}
                  className='absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed'
                />
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
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className='flex flex-col flex-1 overflow-hidden'>
          <div className='flex-1 overflow-y-auto p-3 md:p-6'>
            {/* Vehicle & Contact Info Section */}
            <div className='bg-gradient-to-r from-slate-50 to-gray-50 border-2 border-slate-300 rounded-xl p-3 md:p-6 mb-4 md:mb-6'>
              <h3 className='text-base md:text-lg font-bold text-gray-800 mb-3 md:mb-4 flex items-center gap-2'>
                <span className='bg-slate-600 text-white w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm'>1</span>
                Vehicle & Contact Information
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
                      onKeyDown={handleInputKeyDown}
                      placeholder='CG04AA1234 or AA4793 or 4793'
                      maxLength='10'
                      tabIndex="1"
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
                    {fetchingVehicle && (
                      <div className='absolute right-3 top-2.5'>
                        <svg className='animate-spin h-5 w-5 text-indigo-500' xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24'>
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
                      <div className='absolute z-50 w-full mt-1 bg-white border border-indigo-300 rounded-lg shadow-lg max-h-60 overflow-y-auto'>
                        <div className='p-2 bg-indigo-50 border-b border-indigo-200'>
                          <p className='text-xs font-semibold text-indigo-700'>
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
                                ? 'bg-indigo-100 border-l-4 border-l-indigo-600'
                                : 'hover:bg-indigo-50'
                            }`}
                          >
                            <div className='flex justify-between items-start'>
                              <div>
                                <p className={`font-mono font-bold text-sm ${
                                  index === selectedDropdownIndex ? 'text-indigo-800' : 'text-indigo-700'
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
                                index === selectedDropdownIndex ? 'text-indigo-600' : 'text-indigo-400'
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
                    tabIndex="2"
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent'
                  />
                </div>

                {/* Existing Permit Status Info */}
                {existingPermitStatus && vehicleValidation.isValid && formData.vehicleNumber.length >= 7 && formData.vehicleNumber.length <= 10 && (
                  <div className='md:col-span-2'>
                    {existingPermitStatus.hasActivePermit ? (
                      <div className='bg-red-100 border border-red-300 rounded-lg p-3'>
                        <div className='flex items-start gap-2'>
                          <svg className='w-5 h-5 text-red-600 mt-0.5 flex-shrink-0' fill='currentColor' viewBox='0 0 20 20'>
                            <path fillRule='evenodd' d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z' clipRule='evenodd' />
                          </svg>
                          <div>
                            <p className='text-sm font-bold text-red-800'>Active Permit Exists</p>
                            <p className='text-xs text-red-700 mt-1'>{existingPermitStatus.message}</p>
                          </div>
                        </div>
                      </div>
                    ) : existingPermitStatus.hasActivePartA && !existingPermitStatus.hasActivePartB ? (
                      <div className='bg-blue-100 border border-blue-300 rounded-lg p-3'>
                        <div className='flex items-start gap-2'>
                          <svg className='w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0' fill='currentColor' viewBox='0 0 20 20'>
                            <path fillRule='evenodd' d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z' clipRule='evenodd' />
                          </svg>
                          <div>
                            <p className='text-sm font-bold text-blue-800'>Part A is Active</p>
                            <p className='text-xs text-blue-700 mt-1'>{existingPermitStatus.message}</p>
                            <p className='text-xs text-blue-600 mt-1'>✓ Part A data has been auto-filled. Please add Part B details below.</p>
                          </div>
                        </div>
                      </div>
                    ) : existingPermitStatus.hasActivePartB && !existingPermitStatus.hasActivePartA ? (
                      <div className='bg-purple-100 border border-purple-300 rounded-lg p-3'>
                        <div className='flex items-start gap-2'>
                          <svg className='w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0' fill='currentColor' viewBox='0 0 20 20'>
                            <path fillRule='evenodd' d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z' clipRule='evenodd' />
                          </svg>
                          <div>
                            <p className='text-sm font-bold text-purple-800'>Part B is Active</p>
                            <p className='text-xs text-purple-700 mt-1'>{existingPermitStatus.message}</p>
                            <p className='text-xs text-purple-600 mt-1'>✓ Part B data has been auto-filled. Please add Part A details above.</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className='bg-green-100 border border-green-300 rounded-lg p-3'>
                        <div className='flex items-start gap-2'>
                          <svg className='w-5 h-5 text-green-600 mt-0.5 flex-shrink-0' fill='currentColor' viewBox='0 0 20 20'>
                            <path fillRule='evenodd' d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z' clipRule='evenodd' />
                          </svg>
                          <div>
                            <p className='text-sm font-bold text-green-800'>Ready to Create</p>
                            <p className='text-xs text-green-700 mt-1'>{existingPermitStatus.message}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Part A Section */}
            <div className='bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-indigo-200 rounded-xl p-3 md:p-6 mb-4 md:mb-6'>
              <h3 className='text-base md:text-lg font-bold text-gray-800 mb-3 md:mb-4 flex items-center gap-2'>
                <span className='bg-indigo-600 text-white w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm'>2</span>
                Part A - Permit Details (5 Years Validity) <span className='text-xs font-normal text-gray-500'>(Optional if Part B filled)</span>
              </h3>

              {/* Show old Part A details if not active */}
              {existingPermitStatus && existingPermitStatus.oldPartADetails && (
                <div className='mb-4 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-400 rounded-lg p-4 shadow-sm'>
                  <div className='flex items-center gap-2 mb-3'>
                    <svg className='w-5 h-5 text-amber-600' fill='currentColor' viewBox='0 0 20 20'>
                      <path fillRule='evenodd' d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z' clipRule='evenodd' />
                    </svg>
                    <p className='text-sm font-bold text-amber-800'>
                      Previous Part A
                      <span className={`ml-2 px-2 py-0.5 rounded text-xs ${
                        existingPermitStatus.oldPartADetails.status === 'expired'
                          ? 'bg-red-100 text-red-700 border border-red-300'
                          : 'bg-orange-100 text-orange-700 border border-orange-300'
                      }`}>
                        {existingPermitStatus.oldPartADetails.status === 'expired' ? 'Expired' : 'Expiring Soon'}
                      </span>
                    </p>
                  </div>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-3 bg-white rounded-md p-3 border border-amber-200'>
                    <div className='flex flex-col'>
                      <span className='text-xs text-gray-500 font-medium mb-1'>Permit Number</span>
                      <span className='text-sm font-semibold text-gray-800'>{existingPermitStatus.oldPartADetails.permitNumber}</span>
                    </div>
                    <div className='flex flex-col'>
                      <span className='text-xs text-gray-500 font-medium mb-1'>Permit Holder</span>
                      <span className='text-sm font-semibold text-gray-800'>{existingPermitStatus.oldPartADetails.permitHolder}</span>
                    </div>
                    <div className='flex flex-col'>
                      <span className='text-xs text-gray-500 font-medium mb-1'>Valid From</span>
                      <span className='text-sm font-semibold text-green-600'>{existingPermitStatus.oldPartADetails.validFrom}</span>
                    </div>
                    <div className='flex flex-col'>
                      <span className='text-xs text-gray-500 font-medium mb-1'>Valid To</span>
                      <span className={`text-sm font-semibold ${
                        existingPermitStatus.oldPartADetails.status === 'expired' ? 'text-red-600' : 'text-orange-600'
                      }`}>
                        {existingPermitStatus.oldPartADetails.validTo}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className='grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4'>
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
                    placeholder='Enter Type A Permit Number'
                    tabIndex="3"
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono'
                  />
                </div>

                {/* Permit Holder Name */}
                <div>
                  <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1'>
                    Name of Permit Holder
                  </label>
                  <input
                    type='text'
                    name='permitHolderName'
                    value={formData.permitHolderName}
                    onChange={handleChange}
                    onKeyDown={handleInputKeyDown}
                    placeholder='Rajesh Transport Services'
                    tabIndex="4"
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
                  />
                </div>

                {/* Valid From */}
                <div>
                  <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1'>
                    Valid From
                  </label>
                  <input
                    type='text'
                    name='validFrom'
                    value={formData.validFrom}
                    onChange={handleChange}
                    onKeyDown={handleInputKeyDown}
                    placeholder='Type: 240125 or 24012025'
                    tabIndex="5"
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
                  />
                </div>

                {/* Valid To (Auto-calculated) */}
                <div>
                  <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1'>
                    Valid To (Auto-calculated - 5 Years)
                  </label>
                  <input
                    type='text'
                    name='validTo'
                    value={formData.validTo}
                    onChange={handleChange}
                    onKeyDown={handleInputKeyDown}
                    placeholder='Will be calculated automatically'
                    tabIndex="6"
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-indigo-50'
                  />
                </div>
              </div>
            </div>

            {/* Part B Authorization Section */}
            <div className='bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-3 md:p-6 mb-4 md:mb-6'>
              <h3 className='text-base md:text-lg font-bold text-gray-800 mb-3 md:mb-4 flex items-center gap-2'>
                <span className='bg-purple-600 text-white w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm'>3</span>
                <span className='text-sm md:text-base'>Part B - Authorization (1 Year Validity)</span> <span className='text-xs font-normal text-gray-500'>(Optional if Part A filled)</span>
              </h3>

              {/* Show old Part B details if not active */}
              {existingPermitStatus && existingPermitStatus.oldPartBDetails && (
                <div className='mb-4 bg-amber-50 border border-amber-300 rounded-lg p-3'>
                  <p className='text-xs font-bold text-amber-800 mb-2'>Previous Part B ({existingPermitStatus.oldPartBDetails.status}):</p>
                  <div className='grid grid-cols-3 gap-2 text-xs text-amber-700'>
                    <div><strong>Auth No:</strong> {existingPermitStatus.oldPartBDetails.authNumber}</div>
                    <div><strong>Valid From:</strong> {existingPermitStatus.oldPartBDetails.validFrom}</div>
                    <div><strong>Valid To:</strong> {existingPermitStatus.oldPartBDetails.validTo}</div>
                  </div>
                </div>
              )}

              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <div>
                  <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1'>
                    Authorization Number
                  </label>
                  <input
                    type='text'
                    name='authorizationNumber'
                    value={formData.authorizationNumber}
                    onChange={handleChange}
                    onKeyDown={handleInputKeyDown}
                    placeholder='Enter National Permit Authorization No.'
                    tabIndex="7"
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-semibold'
                  />
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
                    onKeyDown={handleInputKeyDown}
                    placeholder='Type: 240125 or 24012025'
                    tabIndex="8"
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent'
                  />
                </div>

                <div>
                  <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1'>
                    Valid To
                    <span className='ml-2 text-xs font-normal text-green-600'>(Auto: 1 Year from Valid From)</span>
                  </label>
                  <input
                    type='text'
                    name='typeBValidTo'
                    value={formData.typeBValidTo}
                    onChange={handleChange}
                    onKeyDown={handleInputKeyDown}
                    placeholder='Will be calculated automatically'
                    tabIndex="9"
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-purple-50'
                  />
                </div>
              </div>
            </div>

            {/* Fees Section */}
            <div className='bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-3 md:p-6 mb-4 md:mb-6'>
              <h3 className='text-base md:text-lg font-bold text-gray-800 mb-3 md:mb-4 flex items-center gap-2'>
                <span className='bg-green-600 text-white w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm'>4</span>
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
                    onFocus={(e) => e.target.select()}
                    onKeyDown={handleInputKeyDown}
                    placeholder=''
                    tabIndex="10"
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
                    onFocus={(e) => e.target.select()}
                    onKeyDown={handleInputKeyDown}
                    placeholder=''
                    tabIndex="11"
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

            {/* Document Uploads */}
            <div className='bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-200 rounded-xl p-3 md:p-6 mb-4 md:mb-6'>
              <h3 className='text-base md:text-lg font-bold text-gray-800 mb-3 md:mb-4 flex items-center gap-2'>
                <span className='bg-amber-600 text-white w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm'>
                  <svg className='w-3 h-3 md:w-4 md:h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12' />
                  </svg>
                </span>
                Document Uploads
              </h3>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                {/* Part A Document Upload */}
                <div>
                  <h4 className='text-xs font-bold mb-2 uppercase text-blue-700'>Part A Document</h4>
                  {(partASelectedFile || uploadedPartAPath) ? (
                    <div className='bg-white rounded-lg border border-amber-300 p-3'>
                      {(uploadedPartAPath || partADocumentBase64) && !partASelectedFile?.type?.startsWith('image/') && partASelectedFile?.type !== 'application/pdf' ? null : (
                        <>
                          {(partADocumentBase64 || (uploadedPartAPath && partASelectedFile?.type?.startsWith('image/'))) && (
                            <div className='mb-2'>
                              <img
                                src={uploadedPartAPath ? `${API_URL}${uploadedPartAPath}` : partADocumentBase64}
                                alt='Part A preview'
                                className='w-full h-32 object-contain rounded border border-blue-200 bg-blue-50'
                              />
                            </div>
                          )}
                          {partASelectedFile?.type === 'application/pdf' && (
                            <div className='flex items-center gap-3 mb-2'>
                              <svg className='w-8 h-8 text-red-500' fill='currentColor' viewBox='0 0 24 24'>
                                <path d='M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z' />
                                <path d='M14 2v6h6M16 13H8m0 4h8m-8-8h2' fill='none' stroke='currentColor' />
                              </svg>
                              <span className='text-sm font-semibold text-gray-700 truncate'>{partASelectedFile?.name || 'Part A Document'}</span>
                            </div>
                          )}
                          {uploadedPartAPath && !partASelectedFile && (
                            <p className='text-xs text-green-600 font-semibold mb-2'>✓ Document uploaded</p>
                          )}
                        </>
                      )}
                      <button
                        type='button'
                        onClick={handleRemovePartA}
                        className='text-xs text-red-500 hover:text-red-700 font-semibold cursor-pointer'
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className='relative'>
                      <label className='flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-amber-300 rounded-lg cursor-pointer bg-amber-50/50 hover:bg-amber-100/50 transition'>
                        <div className='flex flex-col items-center justify-center py-3'>
                          <svg className='w-6 h-6 md:w-8 md:h-8 text-amber-500 mb-1' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12' />
                          </svg>
                          <p className='text-xs text-amber-700 font-semibold'>Click to upload</p>
                          <p className='text-xs text-amber-500 mt-0.5'>Image or PDF (max 12MB)</p>
                        </div>
                        <input
                          type='file'
                          accept='image/*,application/pdf'
                          onChange={handlePartASelect}
                          className='hidden'
                        />
                      </label>
                    </div>
                  )}
                </div>

                {/* Part B Document Upload */}
                <div>
                  <h4 className='text-xs font-bold mb-2 uppercase text-purple-700'>Part B Document</h4>
                  {(partBSelectedFile || uploadedPartBPath) ? (
                    <div className='bg-white rounded-lg border border-amber-300 p-3'>
                      {(uploadedPartBPath || partBDocumentBase64) && !partBSelectedFile?.type?.startsWith('image/') && partBSelectedFile?.type !== 'application/pdf' ? null : (
                        <>
                          {(partBDocumentBase64 || (uploadedPartBPath && partBSelectedFile?.type?.startsWith('image/'))) && (
                            <div className='mb-2'>
                              <img
                                src={uploadedPartBPath ? `${API_URL}${uploadedPartBPath}` : partBDocumentBase64}
                                alt='Part B preview'
                                className='w-full h-32 object-contain rounded border border-purple-200 bg-purple-50'
                              />
                            </div>
                          )}
                          {partBSelectedFile?.type === 'application/pdf' && (
                            <div className='flex items-center gap-3 mb-2'>
                              <svg className='w-8 h-8 text-red-500' fill='currentColor' viewBox='0 0 24 24'>
                                <path d='M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z' />
                                <path d='M14 2v6h6M16 13H8m0 4h8m-8-8h2' fill='none' stroke='currentColor' />
                              </svg>
                              <span className='text-sm font-semibold text-gray-700 truncate'>{partBSelectedFile?.name || 'Part B Document'}</span>
                            </div>
                          )}
                          {uploadedPartBPath && !partBSelectedFile && (
                            <p className='text-xs text-green-600 font-semibold mb-2'>✓ Document uploaded</p>
                          )}
                        </>
                      )}
                      <button
                        type='button'
                        onClick={handleRemovePartB}
                        className='text-xs text-red-500 hover:text-red-700 font-semibold cursor-pointer'
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className='relative'>
                      <label className='flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-amber-300 rounded-lg cursor-pointer bg-amber-50/50 hover:bg-amber-100/50 transition'>
                        <div className='flex flex-col items-center justify-center py-3'>
                          <svg className='w-6 h-6 md:w-8 md:h-8 text-amber-500 mb-1' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12' />
                          </svg>
                          <p className='text-xs text-amber-700 font-semibold'>Click to upload</p>
                          <p className='text-xs text-amber-500 mt-0.5'>Image or PDF (max 12MB)</p>
                        </div>
                        <input
                          type='file'
                          accept='image/*,application/pdf'
                          onChange={handlePartBSelect}
                          className='hidden'
                        />
                      </label>
                    </div>
                  )}
                </div>
              </div>
            </div>
            {/* Additional Details (Collapsible) */}
            <div className='mt-4 pt-4 border-t border-rose-200'>
            <button
              type='button'
              onClick={() => setShowAdditionalDetails(!showAdditionalDetails)}
              className='w-full flex items-center justify-between p-3 bg-gradient-to-r from-rose-50 via-pink-50 to-fuchsia-50 hover:from-rose-100 hover:via-pink-100 hover:to-fuchsia-100 rounded-lg transition group border border-rose-200 shadow-sm'
            >
              <span className='text-sm md:text-base font-bold text-rose-800 group-hover:text-rose-700 transition-colors flex items-center gap-2'>
                <svg className='w-4 h-4 text-rose-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' />
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 12a3 3 0 11-6 0 3 3 0 016 0z' />
                </svg>
                Additional Detail <span className='text-[10px] md:text-xs font-normal text-rose-600'>(Manage Expense & Payment Details)</span>
              </span>
              <div className='flex items-center gap-2'>
                <span className='text-[10px] text-rose-600 font-semibold bg-rose-100 px-2 py-0.5 rounded-full'>{showAdditionalDetails ? 'Hide' : 'Show'}</span>
                <svg className={'w-5 h-5 text-rose-600 transition-transform duration-200 ' + (showAdditionalDetails ? 'rotate-180' : '')} fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
                </svg>
              </div>
            </button>

            {showAdditionalDetails && (
              <div className='mt-4 space-y-4'>
                {/* Expense Breakdown Section */}
                <div className='bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-200 rounded-xl p-3 md:p-6'>
                  <div className='flex flex-col items-start md:flex-row md:justify-between md:items-center gap-3 mb-4'>
                    <h3 className='text-base md:text-lg font-bold text-gray-800 flex items-center gap-2'>
                      <span className='bg-orange-600 text-white w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm'>5</span>
                      Expense Breakdown
                    </h3>
                    <button
                      type='button'
                      onClick={addExpenseItem}
                      className='self-end md:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-semibold'
                    >
                      <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 4v16m8-8H4' />
                      </svg>
                      Add Expense
                    </button>
                  </div>

                  {expenseItems.length === 0 ? (
                    <p className='text-sm text-gray-500 italic'>No expenses added. Click "Add Expense" to record expenses.</p>
                  ) : (
                    <div className='space-y-3'>
                      {expenseItems.map((item, index) => (
                        <div key={index} className='grid grid-cols-1 md:grid-cols-12 gap-3 items-center'>
                          <div className='md:col-span-2'>
                            <input
                              type='date'
                              value={item.date}
                              onChange={(e) => handleExpenseBreakupChange(index, 'date', e.target.value)}
                              className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm font-semibold'
                            />
                          </div>
                          <div className='md:col-span-3'>
                            <input
                              type='text'
                              placeholder='Expense name (e.g. Commission)'
                              value={item.name}
                              onChange={(e) => handleExpenseBreakupChange(index, 'name', e.target.value)}
                              className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm font-semibold'
                            />
                          </div>
                          <div className='md:col-span-2'>
                            <div className='relative'>
                              <span className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold'>₹</span>
                              <input
                                type='number'
                                placeholder='Amount'
                                value={item.amount}
                                onChange={(e) => handleExpenseBreakupChange(index, 'amount', e.target.value)}
                                min='0'
                                step='1'
                                className='w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm font-semibold'
                              />
                            </div>
                          </div>
                          <div className='md:col-span-3'>
                            <input
                              type='text'
                              placeholder='Notes (optional)'
                              value={item.remark || ''}
                              onChange={(e) => handleExpenseBreakupChange(index, 'remark', e.target.value)}
                              className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm'
                            />
                          </div>
                          <div className='md:col-span-2 flex items-center justify-end'>
                            <button
                              type='button'
                              onClick={() => removeExpenseItem(index)}
                              className='p-2 text-orange-500 hover:bg-orange-100 rounded-full transition'
                              title='Remove expense'
                            >
                              <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))}
                      <div className='flex justify-between items-center bg-orange-100 rounded-lg px-4 py-2.5 border border-orange-300'>
                        <span className='text-sm font-bold text-orange-900'>Total Expense</span>
                        <span className='text-lg font-black text-orange-800'>
                          ₹{expenseItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Payment Received Breakdown Section */}
                <div className='bg-gradient-to-r from-cyan-50 to-teal-50 border border-cyan-200 rounded-lg p-3 md:p-4'>
                  <div className='flex justify-between items-center mb-3'>
                    <h4 className='text-sm md:text-base font-bold text-gray-800'>Payment Received Breakdown (Optional)</h4>
                    <button
                      type='button'
                      onClick={addPaymentReceivedItem}
                      className='px-3 py-1.5 text-xs md:text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition font-semibold flex items-center gap-1'
                    >
                      <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 4v16m8-8H4' />
                      </svg>
                      Add Payment
                    </button>
                  </div>

                  {paymentReceived.length === 0 ? (
                    <div className='bg-cyan-50 border-2 border-dashed border-cyan-300 rounded-lg p-4 text-center'>
                      <p className='text-sm text-cyan-700 font-semibold'>No payments recorded yet. Click "Add Payment" to add payment received details.</p>
                    </div>
                  ) : (
                    <div className='space-y-2'>
                      {paymentReceived.map((item, index) => (
                        <div key={index} className='grid grid-cols-1 md:grid-cols-12 gap-2 bg-white p-2 rounded-lg border border-cyan-200'>
                          <div className='md:col-span-2'>
                            <input
                              type='date'
                              value={item.date}
                              onChange={(e) => handlePaymentReceivedChange(index, 'date', e.target.value)}
                              className='w-full px-3 py-2 border border-cyan-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm font-semibold'
                            />
                          </div>
                          <div className='md:col-span-2'>
                            <div className='relative'>
                              <span className='absolute left-3 top-2.5 text-gray-500 font-semibold'>₹</span>
                              <input
                                type='number'
                                placeholder='Amount'
                                value={item.amount}
                                onChange={(e) => handlePaymentReceivedChange(index, 'amount', e.target.value)}
                                min='0'
                                className='w-full pl-8 pr-3 py-2 border border-cyan-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm font-semibold'
                              />
                            </div>
                          </div>
                          <div className='md:col-span-2'>
                            <select
                              value={item.paymentMode}
                              onChange={(e) => handlePaymentReceivedChange(index, 'paymentMode', e.target.value)}
                              className='w-full px-3 py-2 border border-cyan-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm font-semibold bg-white'
                            >
                              <option value='Cash'>Cash</option>
                              <option value='Bank'>Bank</option>
                              <option value='UPI'>UPI</option>
                            </select>
                          </div>
                          <div className='md:col-span-2'>
                            <select
                              value={item.receivedBy}
                              onChange={(e) => handlePaymentReceivedChange(index, 'receivedBy', e.target.value)}
                              className='w-full px-3 py-2 border border-cyan-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm font-semibold bg-white'
                            >
                              <option value=''>Admin</option>
                              {employees?.filter(e => e.isActive !== false).map(emp => (
                                <option key={emp._id} value={emp.name}>{emp.name}</option>
                              ))}
                            </select>
                          </div>
                            <div className='md:col-span-2'>
                              <input
                                type='text'
                                placeholder='Notes (optional)'
                                value={item.remark || ''}
                                onChange={(e) => handlePaymentReceivedChange(index, 'remark', e.target.value)}
                                className='w-full px-3 py-2 border border-cyan-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm'
                              />
                            </div>
                          <div className='md:col-span-2 flex items-center justify-center'>
                            <button
                              type='button'
                              onClick={() => removePaymentReceivedItem(index)}
                              className='p-2 text-red-600 hover:bg-red-100 rounded-lg transition'
                              title='Remove this payment'
                            >
                              <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))}
                      <div className='flex flex-col items-end w-full'>
                        <div className='flex justify-end items-center bg-cyan-100 p-2 rounded-lg border border-cyan-300 w-full md:w-auto'>
                          <span className='text-sm font-bold text-gray-800'>Total Received: </span>
                          <span className='text-sm font-bold text-teal-700 ml-2'>
                            ₹{paymentReceived.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0).toLocaleString('en-IN')}
                          </span>
                        </div>
                        {paymentReceived.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0) > (parseFloat(formData.totalFee) || 0) && (
                          <p className='text-xs text-red-600 font-semibold mt-1'>
                            Total received cannot exceed total fee (₹{formData.totalFee || 0})
                          </p>
                        )}
                      </div>
                    </div>
                  )}
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
                disabled={isSubmitting}
                className='flex-1 md:flex-none px-4 md:px-8 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg font-semibold transition flex items-center justify-center gap-2 cursor-pointer text-sm md:text-base disabled:opacity-50 disabled:cursor-not-allowed'
              >
                {isSubmitting ? (
                  <>
                    <svg className='animate-spin h-5 w-5 text-white' xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24'>
                      <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4'></circle>
                      <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'></path>
                    </svg>
                    Adding...
                  </>
                ) : (
                  <>
                    <svg className='w-4 h-4 md:w-5 md:h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
                    </svg>
                    Add Permit
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default IssueNewPermitModal
