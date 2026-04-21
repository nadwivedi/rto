import { useState, useEffect, useMemo } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { handleSmartDateInput, normalizeAIExtractedDate } from '../../../utils/dateFormatter'
import { validateMobileNumberRealtime, enforceMobileNumberFormat, validateEmailRealtime } from '../../../utils/contactValidation'

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'
const QuickDLApplicationForm = ({ isOpen, onClose, onSubmit }) => {
  // Get current date in DD-MM-YYYY format
  const getCurrentDate = () => {
    const today = new Date()
    const day = String(today.getDate()).padStart(2, '0')
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const year = today.getFullYear()
    return `${day}-${month}-${year}`
  }

  const [formData, setFormData] = useState({
    // Personal Information
    name: '',
    dateOfBirth: '',
    gender: 'Male',
    fatherName: '',

    // Contact Information
    mobileNumber: '',
    email: '',
    address: '',
    city: '',
    state: '',
    pincode: '',

    // License Information
    licenseClass: 'MCWG+LMV',
    licenseNumber: '',
    licenseIssueDate: '',
    licenseExpiryDate: '',

    // Learning License Information
    learningLicenseApplicationNumber: '',
    learningLicenseNumber: '',
    learningLicenseIssueDate: '',
    learningLicenseExpiryDate: '',

    // Identification
    panNumber: '',

    // Emergency Contact
    emergencyContact: '',
    emergencyRelation: 'Father',

    // Payment Information
    totalAmount: '4000',
    paidAmount: '2000',
    balanceAmount: 2000
  })

  // Validation states
  const [mobileValidation, setMobileValidation] = useState({ isValid: false, message: '' })
  const [emailValidation, setEmailValidation] = useState({ isValid: true, message: '' })
  const [isExtractingLl, setIsExtractingLl] = useState(false)
  const [scanningFile, setScanningFile] = useState(null)

  // Date of Birth state
  const [dobDay, setDobDay] = useState('')
  const [dobMonth, setDobMonth] = useState('')
  const [dobYear, setDobYear] = useState('2000')

  // Generate options for dropdowns
  const months = [
    { value: '01', label: 'January' },
    { value: '02', label: 'February' },
    { value: '03', label: 'March' },
    { value: '04', label: 'April' },
    { value: '05', label: 'May' },
    { value: '06', label: 'June' },
    { value: '07', label: 'July' },
    { value: '08', label: 'August' },
    { value: '09', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' }
  ]
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i)

  // Calculate days based on selected month and year
  const getDaysInMonth = (month, year) => {
    if (!month) return 31 // Default to 31 if no month selected

    const monthNum = parseInt(month)

    // Months with 30 days: April (4), June (6), September (9), November (11)
    if ([4, 6, 9, 11].includes(monthNum)) {
      return 30
    }

    // February
    if (monthNum === 2) {
      // Check for leap year
      if (year) {
        const yearNum = parseInt(year)
        const isLeapYear = (yearNum % 4 === 0 && yearNum % 100 !== 0) || (yearNum % 400 === 0)
        return isLeapYear ? 29 : 28
      }
      return 29 // Default to 29 if year not selected yet
    }

    // All other months have 31 days
    return 31
  }

  // Dynamically calculate days array based on selected month and year
  const days = useMemo(() => {
    const daysInMonth = getDaysInMonth(dobMonth, dobYear)
    return Array.from({ length: daysInMonth }, (_, i) => String(i + 1).padStart(2, '0'))
  }, [dobMonth, dobYear])

  // Keyboard shortcuts - only for desktop
  useEffect(() => {
    const isMobile = window.innerWidth < 768

    const handleKeyDown = (e) => {
      // Ctrl+Enter to submit (desktop only)
      if (!isMobile && (e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault()
        document.querySelector('form').requestSubmit()
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

  // Auto-calculate balance amount
  useEffect(() => {
    const total = parseFloat(formData.totalAmount) || 0
    const paid = parseFloat(formData.paidAmount) || 0
    const balance = total - paid

    setFormData(prev => ({
      ...prev,
      balanceAmount: balance >= 0 ? balance : 0
    }))
  }, [formData.totalAmount, formData.paidAmount])

  // Update dateOfBirth when day, month, or year changes
  useEffect(() => {
    if (dobDay && dobMonth && dobYear) {
      const formattedDate = `${dobDay}-${dobMonth}-${dobYear}`
      setFormData(prev => ({
        ...prev,
        dateOfBirth: formattedDate
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        dateOfBirth: ''
      }))
    }
  }, [dobDay, dobMonth, dobYear])

  // Reset day if it's invalid for the selected month
  useEffect(() => {
    if (dobDay && dobMonth) {
      const maxDays = getDaysInMonth(dobMonth, dobYear)
      if (parseInt(dobDay) > maxDays) {
        setDobDay('')
      }
    }
  }, [dobMonth, dobYear])


  const handleLlExtractionUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      toast.error('Please upload an image or PDF file for extraction.', { position: 'top-right', autoClose: 3000 });
      return;
    }

    setScanningFile(file);
    e.target.value = ''; // reset file input

    setIsExtractingLl(true);
    const updateToast = toast.info('Analyzing Learning License document, please wait...', { autoClose: false, isLoading: true });

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64String = reader.result;
          const response = await axios.post(
            `${API_URL}/api/ocr/ll`,
            { imageBase64: base64String },
            { withCredentials: true }
          );

          if (response.data.success && response.data.data) {
            const resultData = response.data.data;
            
            setFormData(prev => {
              const updated = { ...prev };
              if (resultData.name) updated.name = resultData.name.toUpperCase();
              if (resultData.fatherName) updated.fatherName = resultData.fatherName.toUpperCase();
              if (resultData.address) updated.address = resultData.address.toUpperCase();
              if (resultData.learningLicenseNumber) updated.learningLicenseNumber = resultData.learningLicenseNumber.toUpperCase();
              if (resultData.learningLicenseApplicationNumber) updated.learningLicenseApplicationNumber = resultData.learningLicenseApplicationNumber.toUpperCase();
              
              if (resultData.learningLicenseIssueDate) {
                  const normalizedStr = normalizeAIExtractedDate(resultData.learningLicenseIssueDate);
                  const formatted = handleSmartDateInput(normalizedStr, '');
                  if (formatted) updated.learningLicenseIssueDate = formatted;
              }
              if (resultData.learningLicenseExpiryDate) {
                  const normalizedStr = normalizeAIExtractedDate(resultData.learningLicenseExpiryDate);
                  const formatted = handleSmartDateInput(normalizedStr, '');
                  if (formatted) updated.learningLicenseExpiryDate = formatted;
              }
              return updated;
            });

            if (resultData.dateOfBirth) {
                const normalizedStr = normalizeAIExtractedDate(resultData.dateOfBirth);
                const formattedDob = handleSmartDateInput(normalizedStr, '');
                if (formattedDob) {
                    const parts = formattedDob.split('-');
                    if (parts.length === 3) {
                        setDobDay(parts[0]);
                        setDobMonth(parts[1]);
                        setDobYear(parts[2]);
                    }
                }
            }

            toast.dismiss(updateToast);
            toast.success('Learning License Details Extracted Successfully!', { position: 'top-right', autoClose: 3000 });
          } else {
            toast.dismiss(updateToast);
            toast.error('Failed to extract data correctly.', { position: 'top-right', autoClose: 3000 });
          }
        } catch (err) {
            console.error(err);
            toast.dismiss(updateToast);
            toast.error('Server error during OCR processing.', { position: 'top-right', autoClose: 3000 });
        } finally {
            setIsExtractingLl(false);
            setScanningFile(null);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      toast.dismiss(updateToast);
      toast.error('Error reading the file.', { position: 'top-right', autoClose: 3000 });
      setIsExtractingLl(false);
      setScanningFile(null);
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target

    // Handle mobile number with format enforcement and validation
    if (name === 'mobileNumber') {
      // Enforce format: only allow digits
      const enforcedValue = enforceMobileNumberFormat(value)

      // Validate in real-time
      const validation = validateMobileNumberRealtime(enforcedValue)
      setMobileValidation(validation)

      setFormData(prev => ({
        ...prev,
        [name]: enforcedValue
      }))
      return
    }

    // Handle email with validation
    if (name === 'email') {
      // Validate in real-time
      const validation = validateEmailRealtime(value)
      setEmailValidation(validation)

      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
      return
    }

    // Apply date formatting for license date fields
    if (name === 'licenseIssueDate' || name === 'licenseExpiryDate' || name === 'learningLicenseIssueDate' || name === 'learningLicenseExpiryDate') {
      const formatted = handleSmartDateInput(value, formData[name] || '')
      if (formatted !== null) {
        // Auto-calculate Learning License Expiry Date on manual edit (6 months from issue date, minus 1 day)
        if (name === 'learningLicenseIssueDate' && formatted.length === 10) {
          const parts = formatted.split('-')
          const day = parseInt(parts[0], 10)
          const month = parseInt(parts[1], 10) - 1 // Month is 0-indexed
          const year = parseInt(parts[2], 10)

          if (!isNaN(day) && !isNaN(month) && !isNaN(year) && year > 1900) {
            const issueDate = new Date(year, month, day)
            if (!isNaN(issueDate.getTime())) {
              const expiryDate = new Date(issueDate)
              expiryDate.setMonth(expiryDate.getMonth() + 6)
              expiryDate.setDate(expiryDate.getDate() - 1)

              const expiryDay = String(expiryDate.getDate()).padStart(2, '0')
              const expiryMonth = String(expiryDate.getMonth() + 1).padStart(2, '0')
              const expiryYear = expiryDate.getFullYear()

              setFormData(prev => ({
                ...prev,
                [name]: formatted,
                learningLicenseExpiryDate: `${expiryDay}-${expiryMonth}-${expiryYear}`
              }))
              return
            }
          }
        }

        setFormData(prev => ({
          ...prev,
          [name]: formatted
        }))
      }
    } else {
      // Convert to uppercase for text fields (name, father's name, mother's name, address, city, state, license numbers)
      const uppercaseFields = ['name', 'fatherName', 'address', 'city', 'state', 'licenseNumber', 'learningLicenseApplicationNumber', 'learningLicenseNumber']
      const finalValue = uppercaseFields.includes(name) ? value.toUpperCase() : value

      setFormData(prev => ({
        ...prev,
        [name]: finalValue
      }))
    }
  }

  // Handle Enter key to move to next field instead of submitting
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && e.target.type !== 'submit') {
      e.preventDefault()

      // Get all focusable elements
      const form = e.target.form
      const focusableElements = Array.from(
        form.querySelectorAll('input, select, textarea, button')
      ).filter(el => !el.disabled && el.type !== 'submit')

      const currentIndex = focusableElements.indexOf(e.target)
      const nextElement = focusableElements[currentIndex + 1]

      if (nextElement) {
        nextElement.focus()
      }
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    // Validate mobile number before submitting
    if (!mobileValidation.isValid && formData.mobileNumber) {
      alert('Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9')
      return
    }

    // Validate email before submitting
    if (!emailValidation.isValid && formData.email) {
      alert('Please enter a valid email address (e.g., user@example.com)')
      return
    }

    // Show confirmation popup
    const confirmed = window.confirm('Are you sure you want to save this application?')

    if (!confirmed) {
      return // Exit if user cancels
    }

    if (onSubmit) {
      // Filter out empty optional fields to avoid backend validation errors
      const filteredData = Object.keys(formData).reduce((acc, key) => {
        const value = formData[key]
        // Only include fields that have non-empty values
        if (value !== '' && value !== null && value !== undefined) {
          acc[key] = value
        }
        return acc
      }, {})

      onSubmit(filteredData)
    }
    // Reset form
    setFormData({
      name: '',
      dateOfBirth: '',
      gender: 'Male',
      fatherName: '',
      mobileNumber: '',
      email: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      applicationDate: getCurrentDate(),
      licenseClass: 'MCWG+LMV',
      licenseNumber: '',
      licenseIssueDate: '',
      licenseExpiryDate: '',
      learningLicenseApplicationNumber: '',
      learningLicenseNumber: '',
      learningLicenseIssueDate: '',
      learningLicenseExpiryDate: '',
      panNumber: '',
      emergencyContact: '',
      emergencyRelation: 'Father',
      totalAmount: '4000',
      paidAmount: '2000',
      balanceAmount: 2000
    })
    // Reset date dropdowns
    setDobDay('')
    setDobMonth('')
    setDobYear('2000')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className='fixed inset-0 bg-black/60  z-50 flex items-center justify-center p-2 md:p-4'>
      <div className='bg-white rounded-xl md:rounded-2xl shadow-2xl max-w-7xl w-full max-h-[95vh] overflow-hidden flex flex-col'>
        {/* Header */}
        <div className='bg-gradient-to-r from-indigo-600 to-purple-600 p-3 md:p-4 text-white flex-shrink-0'>
          <div className='flex justify-between items-center'>
            <div>
              <h2 className='text-lg md:text-2xl font-bold'>Add New Driving Licence</h2>
            </div>
            <div className='flex shrink-0 items-center gap-2'>
              <div className='relative overflow-hidden rounded-lg'>
                <button
                  type='button'
                  disabled={isExtractingLl}
                  className='flex max-w-full items-center gap-1.5 rounded-lg bg-white/20 px-3 py-1.5 text-xs font-semibold text-white shadow-sm ring-1 ring-white/30 transition hover:bg-white/30 disabled:opacity-60 md:px-4 md:py-2 md:text-sm cursor-pointer'
                >
                  {isExtractingLl ? (
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
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12'/>
                      </svg>
                      LL Upload
                    </>
                  )}
                </button>
                <input
                  type='file'
                  accept='image/*,application/pdf'
                  disabled={isExtractingLl}
                  onChange={handleLlExtractionUpload}
                  className='absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed'
                />
              </div>
              <button
                onClick={onClose}
                className='text-white hover:bg-white/20 rounded-lg p-1.5 md:p-2 transition cursor-pointer hover:rotate-90 duration-200'
              >
                <svg className='w-5 h-5 md:w-6 md:h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Form Content */}
        <style>{`
          .dl-add-form input,
          .dl-add-form select,
          .dl-add-form textarea {
            background-color: #ffffff;
          }
        `}</style>
        <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className='dl-add-form flex flex-col flex-1 overflow-hidden'>
          <div className='flex-1 overflow-y-auto p-3 md:p-6'>
            {/* Essential Fields Section */}
            <div className='bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-indigo-200 rounded-xl p-3 md:p-6 mb-4 md:mb-6'>
              <h3 className='text-base md:text-lg font-bold text-gray-800 mb-3 md:mb-4 flex items-center gap-2'>
                <span className='bg-indigo-600 text-white w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm'>1</span>
                Essential Information (Required)
              </h3>

              <div className='grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4'>
                {/* Name Field */}
                <div>
                  <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1'>
                    Full Name <span className='text-red-500'>*</span>
                  </label>
                  <input
                    type='text'
                    name='name'
                    value={formData.name}
                    onChange={handleChange}
                    placeholder='Enter full name'
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
                    required
                    autoFocus
                  />
                </div>

                {/* Contact */}
                <div>
                  <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1'>
                    Mobile <span className='text-red-500'>*</span>
                  </label>
                  <div className='relative'>
                    <input
                      type='tel'
                      name='mobileNumber'
                      value={formData.mobileNumber}
                      onChange={handleChange}
                      placeholder='10-digit number'
                      maxLength='10'
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent ${
                        formData.mobileNumber && !mobileValidation.isValid
                          ? 'border-red-500 focus:ring-red-500'
                          : formData.mobileNumber && mobileValidation.isValid
                          ? 'border-green-500 focus:ring-green-500'
                          : 'border-gray-300 focus:ring-indigo-500'
                      }`}
                      required
                    />
                    {formData.mobileNumber && mobileValidation.isValid && (
                      <div className='absolute right-3 top-2.5'>
                        <svg className='h-5 w-5 text-green-500' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
                        </svg>
                      </div>
                    )}
                  </div>
                  {mobileValidation.message && (
                    <p className={`text-xs mt-1 ${mobileValidation.isValid ? 'text-green-600' : 'text-red-600'}`}>
                      {mobileValidation.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1'>
                    Email
                  </label>
                  <div className='relative'>
                    <input
                      type='email'
                      name='email'
                      value={formData.email}
                      onChange={handleChange}
                      placeholder='user@example.com'
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent ${
                        formData.email && !emailValidation.isValid
                          ? 'border-red-500 focus:ring-red-500'
                          : formData.email && emailValidation.isValid
                          ? 'border-green-500 focus:ring-green-500'
                          : 'border-gray-300 focus:ring-indigo-500'
                      }`}
                    />
                    {formData.email && emailValidation.isValid && (
                      <div className='absolute right-3 top-2.5'>
                        <svg className='h-5 w-5 text-green-500' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
                        </svg>
                      </div>
                    )}
                  </div>
                  {emailValidation.message && formData.email && (
                    <p className={`text-xs mt-1 ${emailValidation.isValid ? 'text-green-600' : 'text-red-600'}`}>
                      {emailValidation.message}
                    </p>
                  )}
                </div>
                <div className='md:col-span-3'>
                  <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1'>
                    Date of Birth <span className='text-red-500'>*</span>
                  </label>
                  <div className='grid grid-cols-3 gap-2'>
                    {/* Day Dropdown */}
                    <select
                      value={dobDay}
                      onChange={(e) => setDobDay(e.target.value)}
                      className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
                      required
                    >
                      <option value=''>Day</option>
                      {days.map(day => (
                        <option key={day} value={day}>{day}</option>
                      ))}
                    </select>

                    {/* Month Dropdown */}
                    <select
                      value={dobMonth}
                      onChange={(e) => setDobMonth(e.target.value)}
                      className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
                      required
                    >
                      <option value=''>Month</option>
                      {months.map(month => (
                        <option key={month.value} value={month.value}>{month.label}</option>
                      ))}
                    </select>

                    {/* Year Dropdown */}
                    <select
                      value={dobYear}
                      onChange={(e) => setDobYear(e.target.value)}
                      className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
                      required
                    >
                      <option value=''>Year</option>
                      {years.map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                </div>

              </div>

              {/* Second Row - Gender, Father's Name, and Address */}
              <div className='grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-4 mt-3 md:mt-4'>
                <div>
                  <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1'>
                    Gender <span className='text-red-500'>*</span>
                  </label>
                  <select
                    name='gender'
                    value={formData.gender}
                    onChange={handleChange}
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
                    required
                  >
                    <option value=''>Select</option>
                    <option value='Male'>Male</option>
                    <option value='Female'>Female</option>
                    <option value='Other'>Other</option>
                  </select>
                </div>

                {/* Father's Name */}
                <div>
                  <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1'>
                    Father's Name <span className='text-red-500'>*</span>
                  </label>
                  <input
                    type='text'
                    name='fatherName'
                    value={formData.fatherName}
                    onChange={handleChange}
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
                    required
                  />
                </div>

                {/* Address Field - takes 2 columns (50% of 4-column grid) */}
                <div className='md:col-span-2'>
                  <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1'>
                    Address <span className='text-red-500'>*</span>
                  </label>
                  <input
                    type='text'
                    name='address'
                    value={formData.address}
                    onChange={handleChange}
                    placeholder='Complete address'
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
                    required
                  />
                </div>
              </div>
            </div>

            {/* License & Payment Section */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-4 md:mb-6'>
              {/* LEFT COLUMN - License Class & Learning License Combined */}
              <div className='bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-xl p-3 md:p-6'>
                <h3 className='text-base md:text-lg font-bold text-gray-800 mb-3 md:mb-4 flex items-center gap-2'>
                  <span className='bg-yellow-600 text-white w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm'>2</span>
                  License Class & Learning License
                </h3>

                <div className='space-y-4'>
                  {/* License Class */}
                  <div>
                    <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1'>
                      License Class <span className='text-red-500'>*</span>
                    </label>
                    <select
                      name='licenseClass'
                      value={formData.licenseClass}
                      onChange={handleChange}
                      className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent font-semibold'
                      required
                    >
                      <option value='MCWG'>MCWG - Two Wheeler</option>
                      <option value='LMV'>LMV - Four Wheeler</option>
                      <option value='MCWG+LMV'>MCWG+LMV - Both</option>
                      <option value='HMV'>HMV - Heavy Vehicle</option>
                      <option value='Commercial'>Commercial</option>
                      <option value='Transport'>Transport</option>
                    </select>
                  </div>

                  {/* Learning License Section */}
                  <div className='border-t border-yellow-300 pt-4'>
                    <h4 className='text-xs md:text-sm font-bold text-yellow-800 mb-3'>Learning License Details</h4>

                  <div className='space-y-3'>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                      <div>
                        <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1'>
                          LL Application No.
                        </label>
                        <input
                          type='text'
                          name='learningLicenseApplicationNumber'
                          value={formData.learningLicenseApplicationNumber}
                          onChange={handleChange}
                          placeholder='Enter LL application number'
                          className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent'
                        />
                      </div>

                      <div>
                        <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1'>
                          LL Number
                        </label>
                        <input
                          type='text'
                          name='learningLicenseNumber'
                          value={formData.learningLicenseNumber}
                          onChange={handleChange}
                          placeholder='Enter learning license number'
                          className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent'
                        />
                      </div>
                    </div>

                      <div className='grid grid-cols-2 gap-3'>
                        <div>
                          <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1'>
                            LL Issue Date
                          </label>
                          <input
                            type='text'
                            name='learningLicenseIssueDate'
                            value={formData.learningLicenseIssueDate}
                            onChange={handleChange}
                            placeholder='DD-MM-YYYY'
                            className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-green-600 font-semibold'
                          />
                        </div>

                        <div>
                          <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1'>
                            LL Expiry Date <span className='text-xs text-blue-500'>(Auto - 6 months)</span>
                          </label>
                          <input
                            type='text'
                            name='learningLicenseExpiryDate'
                            value={formData.learningLicenseExpiryDate}
                            onChange={handleChange}
                            placeholder='DD-MM-YYYY'
                            className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-red-600 font-semibold bg-yellow-50/50'
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN - Driving License & Payment */}
              <div className='space-y-4 md:space-y-6'>
                {/* Driving License Details */}
                <div className='bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-3 md:p-6'>
                  <h3 className='text-base md:text-lg font-bold text-gray-800 mb-3 md:mb-4 flex items-center gap-2'>
                    <span className='bg-purple-600 text-white w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm'>3</span>
                    Driving License Details
                  </h3>

                  <div className='space-y-3'>
                    <div>
                      <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1'>
                        DL Number
                      </label>
                      <input
                        type='text'
                        name='licenseNumber'
                        value={formData.licenseNumber}
                        onChange={handleChange}
                        placeholder='Enter driving license number'
                        className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent'
                      />
                    </div>

                    <div className='grid grid-cols-2 gap-3'>
                      <div>
                        <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1'>
                          DL Issue Date
                        </label>
                        <input
                          type='text'
                          name='licenseIssueDate'
                          value={formData.licenseIssueDate}
                          onChange={handleChange}
                          placeholder='DD-MM-YYYY'
                          className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-green-600 font-semibold'
                        />
                      </div>

                      <div>
                        <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1'>
                          DL Expiry Date
                        </label>
                        <input
                          type='text'
                          name='licenseExpiryDate'
                          value={formData.licenseExpiryDate}
                          onChange={handleChange}
                          placeholder='DD-MM-YYYY'
                          className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-red-600 font-semibold'
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Details */}
                <div className='bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-3 md:p-6'>
                  <h3 className='text-base md:text-lg font-bold text-gray-800 mb-3 md:mb-4 flex items-center gap-2'>
                    <span className='bg-green-600 text-white w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm'>4</span>
                    Payment Details
                  </h3>

                  <div className='space-y-3'>
                    {/* Total Amount and Paid Now in one line */}
                    <div className='grid grid-cols-2 gap-3'>
                      <div>
                        <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1'>
                          Total Amount
                        </label>
                        <div className='relative'>
                          <span className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-semibold'>₹</span>
                          <input
                            type='number'
                            name='totalAmount'
                            value={formData.totalAmount}
                            onChange={handleChange}
                            className='w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent font-semibold text-base md:text-lg'
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1'>
                          Paid Now
                        </label>
                        <div className='relative'>
                          <span className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-semibold'>₹</span>
                          <input
                            type='number'
                            name='paidAmount'
                            value={formData.paidAmount}
                            onChange={handleChange}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault()
                                e.target.form.requestSubmit()
                              }
                            }}
                            max={formData.totalAmount}
                            className='w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent font-semibold text-base md:text-lg'
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {/* Balance in separate line */}
                    <div className='bg-white rounded-lg p-3 border-2 border-green-300'>
                      <div className='flex justify-between items-center'>
                        <span className='text-sm font-semibold text-gray-700'>Balance</span>
                        <span className='text-xl font-black text-green-600'>
                          ₹ {formData.balanceAmount.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
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
                className='flex-1 md:flex-none px-4 md:px-8 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:shadow-lg font-semibold transition flex items-center justify-center gap-2 cursor-pointer text-sm md:text-base'
              >
                <svg className='w-4 h-4 md:w-5 md:h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
                </svg>
                Save Application
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default QuickDLApplicationForm
