import { useState, useEffect, useMemo } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { handleSmartDateInput, normalizeAIExtractedDate } from '../../../utils/dateFormatter'
import { validateMobileNumberRealtime, enforceMobileNumberFormat } from '../../../utils/contactValidation'
import { replacePaymentsForWork, getPaymentsByWork } from '../../../utils/paymentReceivedApi'
import DefaultExpenseSettingsModal from '../../../components/DefaultExpenseSettingsModal'
import { getDefaultExpensesApi } from '../../../utils/defaultExpenseSettingsApi'

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'

const QuickDLApplicationForm = ({ isOpen, onClose, application }) => {
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
    applicationType: 'New DL',
    date: '',
    name: '',
    dateOfBirth: '',
    gender: 'Male',
    fatherName: '',

    // Contact Information
    mobileNumber: '',
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
    balanceAmount: 2000,
    profit: '',
    byName: '',
    byMobile: '',
    expenseBreakup: [{ name: '', amount: '', remark: '' }],
    documents: {
      learningLicense: '',
      learningLicenseType: '',
      drivingLicense: '',
      drivingLicenseType: ''
    }
  })

  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  // Validation states
  const [mobileValidation, setMobileValidation] = useState({ isValid: false, message: '' })
  const [isExtractingLl, setIsExtractingLl] = useState(false)
  const [isExtractingDl, setIsExtractingDl] = useState(false)
  const [scanningFile, setScanningFile] = useState(null)
  const [paymentReceived, setPaymentReceived] = useState([{ date: '', amount: '', paymentMode: 'Cash', remark: '' }])
  const [showAdditionalDetails, setShowAdditionalDetails] = useState(localStorage.getItem('expandAdditionalDetails') === 'yes')

  // Date of Birth state
  const [dobDay, setDobDay] = useState('')
  const [dobMonth, setDobMonth] = useState('')
  const [dobYear, setDobYear] = useState('2000')

  // Convert ISO date to DD-MM-YYYY format
  const convertISOToDD_MM_YYYY = (isoDate) => {
    if (!isoDate) return ''
    const date = new Date(isoDate)
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    return `${day}-${month}-${year}`
  }

  // Extract date parts from DD-MM-YYYY format
  const extractDateParts = (dateStr) => {
    if (!dateStr) return { day: '', month: '', year: '' }
    const parts = dateStr.split('-')
    return {
      day: parts[0] || '',
      month: parts[1] || '',
      year: parts[2] || ''
    }
  }

  // Pre-populate form with application data
  useEffect(() => {
    if (application && application.fullData) {
      const appData = application.fullData

      // Extract date parts from date of birth
      const dobParts = extractDateParts(convertISOToDD_MM_YYYY(appData.dateOfBirth))
      setDobDay(dobParts.day)
      setDobMonth(dobParts.month)
      setDobYear(dobParts.year)

      const totalAmt = parseFloat(appData.totalAmount) || 0
      const paidAmt = parseFloat(appData.paidAmount) || 0
      const calculatedBalance = totalAmt - paidAmt

      const mobileNum = appData.mobileNumber || ''

      setFormData({
        applicationType: appData.applicationType || 'New DL',
        date: appData.date || '',
        name: appData.name || '',
        dateOfBirth: convertISOToDD_MM_YYYY(appData.dateOfBirth) || '',
        gender: appData.gender || 'Male',
        fatherName: appData.fatherName || '',
        mobileNumber: mobileNum,
        address: appData.address || '',
        city: appData.city || '',
        state: appData.state || '',
        pincode: appData.pincode || '',
        licenseClass: appData.licenseClass || 'MCWG+LMV',
        licenseNumber: appData.licenseNumber || appData.LicenseNumber || '',
        licenseIssueDate: convertISOToDD_MM_YYYY(appData.LicenseIssueDate) || '',
        licenseExpiryDate: convertISOToDD_MM_YYYY(appData.LicenseExpiryDate) || '',
        drivingLicenseNumber: appData.drivingLicenseNumber || '',
        drivingLicenseIssueDate: convertISOToDD_MM_YYYY(appData.drivingLicenseIssueDate) || '',
        drivingLicenseExpiryDate: convertISOToDD_MM_YYYY(appData.drivingLicenseExpiryDate) || '',
        learningLicenseApplicationNumber: appData.learningLicenseApplicationNumber || '',
        learningLicenseNumber: appData.learningLicenseNumber || '',
        learningLicenseIssueDate: convertISOToDD_MM_YYYY(appData.learningLicenseIssueDate) || '',
        learningLicenseExpiryDate: convertISOToDD_MM_YYYY(appData.learningLicenseExpiryDate) || '',
        panNumber: appData.panNumber || '',
        emergencyContact: appData.emergencyContact || '',
        emergencyRelation: appData.emergencyRelation || 'Father',
        totalAmount: appData.totalAmount?.toString() || '4000',
        paidAmount: appData.paidAmount?.toString() || '2000',
        balanceAmount: calculatedBalance >= 0 ? calculatedBalance : 0,
        profit: appData.profit?.toString() || '',
        byName: appData.byName || '',
        byMobile: appData.byMobile || '',
        expenseBreakup: (appData.expenseBreakup || []).length > 0
          ? (appData.expenseBreakup || []).map(item => ({
              name: item.name || '',
              amount: item.amount ? item.amount.toString() : '',
              remark: item.remark || ''
            }))
          : [{ name: '', amount: '', remark: '' }],
        documents: appData.documents || {
          learningLicense: '',
          learningLicenseType: '',
          drivingLicense: '',
          drivingLicenseType: ''
        }
      })

      // Validate pre-filled mobile number
      if (mobileNum) {
        const validation = validateMobileNumberRealtime(mobileNum)
        setMobileValidation(validation)
      }

      if (appData?._id) {
        getPaymentsByWork('DL', appData._id).then(res => {
          const payments = res.data.map(p => ({ date: p.date, amount: p.amount, paymentMode: p.paymentMode, remark: p.remark || '' }))
          setPaymentReceived(payments.length > 0 ? payments : [{ date: '', amount: '', paymentMode: 'Cash', remark: '' }])
        }).catch(() => setPaymentReceived([{ date: '', amount: '', paymentMode: 'Cash', remark: '' }]))
      } else {
        setPaymentReceived([{ date: '', amount: '', paymentMode: 'Cash', remark: '' }])
      }
    }
  }, [application])

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

  // Populate default expenses when modal is opened
  useEffect(() => {
    if (isOpen) {
      // Don't fetch default expenses if we're editing an existing application with saved expenses
      if (application?.fullData?.expenseBreakup && application.fullData.expenseBreakup.length > 0) {
        return
      }

      getDefaultExpensesApi('DL')
        .then(res => {
          const fetched = res.data?.expenses
          if (Array.isArray(fetched) && fetched.length > 0) {
            setFormData(prev => ({
              ...prev,
              expenseBreakup: fetched.map(item => ({ name: item.name || '', amount: item.amount || '', remark: '' }))
            }))
          } else {
            setFormData(prev => ({
              ...prev,
              expenseBreakup: [{ name: '', amount: '', remark: '' }]
            }))
          }
        })
        .catch(err => {
          console.error(err)
          setFormData(prev => ({
            ...prev,
            expenseBreakup: [{ name: '', amount: '', remark: '' }]
          }))
        })
    }
  }, [isOpen, application])

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

  // Auto-fill paidAmount from paymentReceived total
  useEffect(() => {
    const totalReceived = paymentReceived.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0)
    const hasEnteredAmount = paymentReceived.some(p => p.amount !== '' && parseFloat(p.amount) > 0)
    if (hasEnteredAmount) {
      setFormData(prev => {
        const totalAmount = parseFloat(prev.totalAmount) || 0
        const newPaid = totalReceived > totalAmount ? totalAmount : totalReceived
        if (prev.paidAmount === newPaid.toString()) return prev
        return {
          ...prev,
          paidAmount: newPaid.toString()
        }
      })
    }
  }, [paymentReceived])

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

  // Auto-calculate profit from totalAmount - totalExpenses (only when expenses are entered)
  useEffect(() => {
    const totalExpenses = formData.expenseBreakup.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0)
    const totalFee = parseFloat(formData.totalAmount) || 0
    if (totalExpenses > 0) {
      const calculatedProfit = totalFee - totalExpenses
      setFormData(prev => {
        if (prev.profit === calculatedProfit.toString()) return prev
        return { ...prev, profit: calculatedProfit.toString() }
      })
    }
  }, [formData.expenseBreakup, formData.totalAmount])


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

              if (!updated.documents) {
                  updated.documents = {};
              }
              updated.documents.learningLicense = base64String;
              updated.documents.learningLicenseType = file.type;

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

  const handleDlUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      toast.error('Please upload an image or PDF file.', { position: 'top-right', autoClose: 3000 });
      return;
    }

    setScanningFile(file);
    e.target.value = '';

    setIsExtractingDl(true);
    const updateToast = toast.info('Analyzing Driving License document, please wait...', { autoClose: false, isLoading: true });

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64String = reader.result;
          const response = await axios.post(
            `${API_URL}/api/ocr/dl`,
            { imageBase64: base64String },
            { withCredentials: true }
          );

          if (response.data.success && response.data.data) {
            const resultData = response.data.data;
            
            setFormData(prev => {
              const updated = { ...prev };
              
              if (resultData.drivingLicenceNumber) {
                updated.licenseNumber = resultData.drivingLicenceNumber.toUpperCase();
                updated.drivingLicenseNumber = resultData.drivingLicenceNumber.toUpperCase();
              }
              
              if (resultData.validFrom) {
                const normalizedStr = normalizeAIExtractedDate(resultData.validFrom);
                const formatted = handleSmartDateInput(normalizedStr, '');
                if (formatted) {
                  updated.licenseIssueDate = formatted;
                  updated.drivingLicenseIssueDate = formatted;
                }
              }
              
              if (resultData.validTo) {
                const normalizedStr = normalizeAIExtractedDate(resultData.validTo);
                const formatted = handleSmartDateInput(normalizedStr, '');
                if (formatted) {
                  updated.licenseExpiryDate = formatted;
                  updated.drivingLicenseExpiryDate = formatted;
                }
              }

              if (!updated.documents) {
                updated.documents = {};
              }
              updated.documents.drivingLicense = base64String;
              updated.documents.drivingLicenseType = file.type;

              return updated;
            });

            toast.dismiss(updateToast);
            toast.success('Driving License Details Extracted Successfully!', { position: 'top-right', autoClose: 3000 });
          } else {
            toast.dismiss(updateToast);
            toast.error('Failed to extract data correctly.', { position: 'top-right', autoClose: 3000 });
          }
        } catch (err) {
          console.error(err);
          toast.dismiss(updateToast);
          toast.error('Server error during OCR processing.', { position: 'top-right', autoClose: 3000 });
        } finally {
          setIsExtractingDl(false);
          setScanningFile(null);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      toast.dismiss(updateToast);
      toast.error('Error reading the file.', { position: 'top-right', autoClose: 3000 });
      setIsExtractingDl(false);
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

  // Expense Breakup handlers
  const addExpenseItem = () => {
    setFormData(prev => ({
      ...prev,
      expenseBreakup: [...prev.expenseBreakup, { name: '', amount: '', remark: '' }]
    }))
  }

  const removeExpenseItem = (index) => {
    setFormData(prev => ({
      ...prev,
      expenseBreakup: prev.expenseBreakup.filter((_, i) => i !== index)
    }))
  }

  const handleExpenseBreakupChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      expenseBreakup: prev.expenseBreakup.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    }))
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

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validate mobile number before submitting
    if (!mobileValidation.isValid && formData.mobileNumber) {
      toast.error('Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9')
      return
    }

    const totalReceived = paymentReceived.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0)
    const totalFee = parseFloat(formData.totalAmount) || 0
    if (totalReceived > totalFee) {
      toast.error('Total received amount in payment breakdown cannot be greater than the total amount!')
      return
    }

    // Filter out empty optional fields to avoid backend validation errors
    const filteredExpenseBreakup = formData.expenseBreakup.filter(item =>
      item.name && item.amount && parseFloat(item.amount) > 0
    )
    const filteredData = Object.keys(formData).reduce((acc, key) => {
      const value = formData[key]
      // Only include fields that have non-empty values
      if (value !== '' && value !== null && value !== undefined && key !== 'expenseBreakup') {
        acc[key] = value
      }
      return acc
    }, {})
    if (filteredExpenseBreakup.length > 0) {
      filteredData.expenseBreakup = filteredExpenseBreakup
    }

    try {
      let response;
      if (application) {
        response = await axios.put(`${API_URL}/api/driving-licenses/${application.id}`, filteredData, { withCredentials: true })
      } else {
        response = await axios.post(`${API_URL}/api/driving-licenses`, filteredData, { withCredentials: true })
      }

      if (response.data.success) {
        const recordId = response.data.data?._id
        const validPayments = paymentReceived.filter(p => p.date && p.amount && parseFloat(p.amount) > 0)
        if (validPayments.length > 0 && recordId) {
          try {
            await replacePaymentsForWork('DL', recordId, validPayments)
          } catch (paymentErr) {
            console.error('Failed to save payment received entries:', paymentErr)
            toast.warn('Payment records saved, but payment breakdown could not be saved.')
          }
        }

        toast.success(`Application ${application ? 'updated' : 'submitted'} successfully!`, { autoClose: 1200 })
        if (application) {
          onClose()
          return
        }
      } else {
        toast.error(response.data.message || 'Failed to save application')
        return
      }
    } catch (error) {
      console.error('Error submitting application:', error)
      toast.error('Failed to save application. Please try again.')
      return
    }

    // Reset form
    setFormData({
      date: '',
      name: '',
      dateOfBirth: '',
      gender: 'Male',
      fatherName: '',
      mobileNumber: '',
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
      balanceAmount: 2000,
      profit: '',
      expenseBreakup: [{ name: '', amount: '', remark: '' }],
      documents: {
        learningLicense: '',
        learningLicenseType: ''
      }
    })
    // Reset date dropdowns
    setDobDay('')
    setDobMonth('')
    setDobYear('2000')
    setPaymentReceived([{ date: '', amount: '', paymentMode: 'Cash', remark: '' }])
    onClose()
  }

  const addPaymentReceivedItem = () => {
    setPaymentReceived(prev => [...prev, { date: '', amount: '', paymentMode: 'Cash', remark: '' }])
  }

  const removePaymentReceivedItem = (index) => {
    setPaymentReceived(prev => prev.filter((_, i) => i !== index))
  }

  const handlePaymentReceivedChange = (index, field, value) => {
    setPaymentReceived(prev => prev.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    ))
  }

  if (!isOpen) return null

  return (
    <div className='fixed inset-0 bg-black/60  z-[70] flex items-center justify-center p-2 md:p-4'>
      <div className='bg-white rounded-xl md:rounded-2xl shadow-2xl max-w-[67rem] w-full max-h-[95vh] overflow-hidden flex flex-col'>
        {/* Header */}
        <div className='bg-gradient-to-r from-indigo-600 to-purple-600 p-3 md:p-4 text-white flex-shrink-0'>
          <div className='flex justify-between items-center'>
            <div>
              <h2 className='text-lg md:text-2xl font-bold'>{application ? 'Edit Driving Licence' : 'Add New Driving Licence'}</h2>
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

              {/* DL Upload Button */}
              <div className='relative overflow-hidden rounded-lg'>
                <button
                  type='button'
                  disabled={isExtractingDl}
                  className='flex max-w-full items-center gap-1.5 rounded-lg bg-white/20 px-3 py-1.5 text-xs font-semibold text-white shadow-sm ring-1 ring-white/30 transition hover:bg-white/30 disabled:opacity-60 md:px-4 md:py-2 md:text-sm cursor-pointer'
                >
                  {isExtractingDl ? (
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
                      DL Upload
                    </>
                  )}
                </button>
                <input
                  type='file'
                  accept='image/*,application/pdf'
                  disabled={isExtractingDl}
                  onChange={handleDlUpload}
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

              <div className='grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-4'>
                {/* Application Type */}
                <div>
                  <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1'>
                    Application Type <span className='text-red-500'>*</span>
                  </label>
                  <select
                    name='applicationType'
                    value={formData.applicationType}
                    onChange={handleChange}
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
                    required
                  >
                    <option value='New DL'>New DL</option>
                    <option value='DL Renewal'>DL Renewal</option>
                  </select>
                </div>

                {/* Date of Work */}
                <div>
                  <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1'>
                    Date of Work
                  </label>
                  <input
                    type='date'
                    name='date'
                    value={formData.date ? formData.date.split('-').reverse().join('-') : ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (!val) { setFormData(p => ({ ...p, date: '' })); return; }
                      const [y, m, d] = val.split('-');
                      setFormData(p => ({ ...p, date: `${d}-${m}-${y}` }));
                    }}
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
                  />
                </div>
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
                  <textarea
                    name='address'
                    value={formData.address}
                    onChange={handleChange}
                    placeholder='Complete address'
                    rows={2}
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-y min-h-[42px]'
                    required
                  />
                </div>
              </div>
            </div>

            {/* Middle Sections Grid - Flat Layout for better alignment */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-4 md:mb-6 items-stretch'>
              
              {/* --- ROW 1 --- */}

              {/* License Class (Left) */}
              <div className='bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-200 rounded-xl p-3 md:p-6 flex flex-col'>
                <h3 className='text-base md:text-lg font-bold text-gray-800 mb-3 md:mb-4 flex items-start gap-2'>
                  <span className='bg-orange-600 text-white flex-shrink-0 w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm mt-0.5'>2</span>
                  License Class
                </h3>
                <div className='mt-auto'>
                  <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1'>
                    License Class <span className='text-red-500'>*</span>
                  </label>
                  <select
                    name='licenseClass'
                    value={formData.licenseClass}
                    onChange={handleChange}
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent font-semibold'
                    required
                  >
                    <option value='MCWG'>MCWG - Two Wheeler</option>
                    <option value='LMV'>LMV - Four Wheeler</option>
                    <option value='MCWG+LMV'>MCWG+LMV - Both</option>
                    <option value='HMV'>HMV - Heavy Vehicle</option>
                    <option value='Commercial'>Commercial</option>
                    <option value='Transport'>Transport</option>
                    <option value='E-Rikshaw'>E-Rikshaw - 3 wheeler</option>
                  </select>
                </div>
              </div>

              {/* By / Referral Details (Right) */}
              <div className='bg-gradient-to-r from-cyan-50 to-blue-50 border-2 border-cyan-200 rounded-xl p-3 md:p-6 flex flex-col'>
                <h3 className='text-base md:text-lg font-bold text-gray-800 mb-3 md:mb-4 flex items-start gap-2'>
                  <span className='bg-cyan-600 text-white flex-shrink-0 w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm mt-0.5'>3</span>
                  <div className='flex flex-col'>
                    <span>By / Referral <span className='text-xs font-normal text-gray-500'>(Optional)</span></span>
                    <span className='text-[10px] md:text-xs font-normal text-cyan-700 mt-0.5'>Referral/agent who brought this DL work</span>
                  </div>
                </h3>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-3 mt-auto'>
                  <div>
                    <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1'>Name</label>
                    <input
                      type='text'
                      name='byName'
                      value={formData.byName}
                      onChange={handleChange}
                      placeholder='Referral / agent name'
                      className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent'
                    />
                  </div>
                  <div>
                    <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1'>Mobile Number</label>
                    <input
                      type='tel'
                      name='byMobile'
                      value={formData.byMobile}
                      onChange={handleChange}
                      placeholder='10-digit mobile number'
                      maxLength='10'
                      pattern='[0-9]{10}'
                      className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent'
                    />
                  </div>
                </div>
              </div>

              {/* --- ROW 2 --- */}

              {/* Learning License Details (Left) */}
              <div className='bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-200 rounded-xl p-3 md:p-6'>
                <h3 className='text-base md:text-lg font-bold text-gray-800 mb-3 md:mb-4 flex items-center gap-2'>
                  <span className='bg-yellow-600 text-white w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm'>4</span>
                  Learning License Details
                </h3>
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
                        className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent placeholder:text-xs'
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
                        className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent placeholder:text-xs'
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

              {/* Driving License Details (Right) */}
              <div className='bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-3 md:p-6'>
                <h3 className='text-base md:text-lg font-bold text-gray-800 mb-3 md:mb-4 flex items-center gap-2'>
                  <span className='bg-purple-600 text-white w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm'>5</span>
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

              {/* --- ROW 3 --- */}

              {/* Payment Details (Full Width Bottom) */}
              <div className='md:col-span-2 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-3 md:p-6'>
                <h3 className='text-base md:text-lg font-bold text-gray-800 mb-3 md:mb-4 flex items-center gap-2'>
                  <span className='bg-green-600 text-white w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm'>6</span>
                  Payment Details
                </h3>
                <div className='grid grid-cols-1 md:grid-cols-4 gap-3'>
                  {/* Total Amount */}
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

                  {/* Paid Now */}
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

                  {/* Balance */}
                  <div>
                    <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1'>
                      Balance
                    </label>
                    <div className='bg-white rounded-lg px-3 py-2 border-2 border-green-300 flex justify-center items-center h-[42px] md:h-[44px]'>
                      <span className='text-lg font-black text-green-600'>
                        ₹ {formData.balanceAmount.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Profit */}
                  <div>
                    <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1'>
                      Profit (Commission)
                    </label>
                    <div className='relative'>
                      <span className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-semibold'>₹</span>
                      <input
                        type='number'
                        name='profit'
                        value={formData.profit}
                        onChange={handleChange}
                        min='0'
                        step='1'
                        placeholder='0'
                        className='w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent font-semibold text-base md:text-lg'
                      />
                    </div>
                  </div>
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
                  {/* Expense Breakup Section */}
                  <div className='bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-200 rounded-xl p-3 md:p-6'>
                    <div className='flex flex-col items-start md:flex-row md:justify-between md:items-center gap-3 mb-4'>
                      <h3 className='text-base md:text-lg font-bold text-gray-800 flex items-center gap-2'>
                        <span className='bg-orange-600 text-white w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm'>5</span>
                        Expense Breakdown
                        <button
                          type='button'
                          onClick={() => setIsSettingsOpen(true)}
                          className='p-1 text-orange-600 hover:bg-orange-100 rounded-lg transition ml-1'
                          title='Set Default Expenses'
                        >
                          <svg className='w-4.5 h-4.5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z' />
                          </svg>
                        </button>
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

                    {formData.expenseBreakup.length === 0 ? (
                      <p className='text-sm text-gray-500 italic'>No expenses added. Click "Add Expense" to record expenses.</p>
                    ) : (
                      <div className='space-y-3'>
                        {formData.expenseBreakup.map((item, index) => (
                          <div key={index} className='grid grid-cols-1 md:grid-cols-12 gap-3 items-center'>
                            <div className='md:col-span-4'>
                              <input
                                type='text'
                                placeholder='Expense name (e.g. Fitness, Commission)'
                                value={item.name}
                                onChange={(e) => handleExpenseBreakupChange(index, 'name', e.target.value)}
                                className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm font-semibold'
                              />
                            </div>
                            <div className='md:col-span-3'>
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
                            ₹{formData.expenseBreakup.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0).toLocaleString('en-IN')}
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
                            <div className='md:col-span-4'>
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
                          {paymentReceived.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0) > (parseFloat(formData.totalAmount) || 0) && (
                            <p className='text-xs text-red-600 font-semibold mt-1'>
                              Total received cannot exceed total amount (₹{formData.totalAmount || 0})
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Document Preview Section */}
            {formData.documents?.learningLicense && (
              <div className='bg-gray-100 border border-gray-300 rounded-xl p-3 md:p-6 mb-4 md:mb-6 mt-4'>
                <h3 className='text-base md:text-lg font-bold text-gray-800 mb-3 md:mb-4'>
                  Learning License Preview
                </h3>
                <div className='w-full rounded-lg overflow-hidden flex justify-center bg-white border border-gray-200'>
                  {formData.documents.learningLicenseType === 'application/pdf' ? (
                     <iframe src={formData.documents.learningLicense} className='w-full h-96' title='PDF Preview'></iframe>
                  ) : (
                     <img src={formData.documents.learningLicense} alt='Preview' className='max-h-96 object-contain' />
                  )}
                </div>
              </div>
            )}

            {formData.documents?.drivingLicense && (
              <div className='bg-gray-100 border border-gray-300 rounded-xl p-3 md:p-6 mb-4 md:mb-6 mt-4'>
                <h3 className='text-base md:text-lg font-bold text-gray-800 mb-3 md:mb-4'>
                  Driving License Preview
                </h3>
                <div className='w-full rounded-lg overflow-hidden flex justify-center bg-white border border-gray-200'>
                  {formData.documents.drivingLicenseType === 'application/pdf' ? (
                     <iframe src={formData.documents.drivingLicense} className='w-full h-96' title='DL PDF Preview'></iframe>
                  ) : (
                     <img src={formData.documents.drivingLicense} alt='DL Preview' className='max-h-96 object-contain' />
                  )}
                </div>
              </div>
            )}

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
                className='bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 md:px-10 py-2.5 md:py-3.5 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-sm md:text-base flex items-center gap-2 cursor-pointer'
              >
                <svg className='w-4 h-4 md:w-5 md:h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
                </svg>
                {application ? 'Update Application' : 'Save Application'}
              </button>
            </div>
          </div>
        </form>
      </div>
      <DefaultExpenseSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        type="DL"
        onSave={(newDefaults) => {
          setFormData(prev => ({
            ...prev,
            expenseBreakup: newDefaults.map(item => ({ name: item.name || '', amount: item.amount || '', remark: '' }))
          }))
        }}
      />
    </div>
  )
}

export default QuickDLApplicationForm
