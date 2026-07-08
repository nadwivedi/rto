import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { getTodayDate as utilGetTodayDate, handleSmartDateInput } from '../../../utils/dateFormatter'
import { validateVehicleNumberRealtime } from '../../../utils/vehicleNoCheck'
import { handlePaymentCalculation } from '../../../utils/paymentValidation'
import { pdfToImages } from '../../../utils/pdfToImages'

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'

const AddInsuranceModal = ({ isOpen, onClose, onSubmit, initialData = null, isEditMode = false, prefilledVehicleNumber = '', prefilledOwnerName = '', prefilledMobileNumber = '' }) => {
  // Helper function to get today's date in DD-MM-YYYY format
  const getTodayDate = () => {
    return utilGetTodayDate()
  }

  const [formData, setFormData] = useState({
    vehicleNumber: prefilledVehicleNumber,
    policyNumber: '',
    policyHolderName: prefilledOwnerName,
    mobileNumber: prefilledMobileNumber,
    issueDate: '',
    validFrom: '',
    validTo: '',
    totalFee: '0',
    paid: '0',
    balance: '0',
    insuranceCompany: '',
    productType: '',
    customProductType: '',
    insuranceDocument: '',
    renewPremium: '0',
    commission: '0',
    // RC fields extracted from insurance document
    chassisNumber: '',
    engineNumber: '',
    makerName: '',
    makerModel: '',
    manufactureYear: '',
    cubicCapacity: '',
    seatingCapacity: '',
    bodyType: '',
    address: ''
  })

  const [fetchingVehicle, setFetchingVehicle] = useState(false)
  const [vehicleError, setVehicleError] = useState('')
  const [vehicleValidation, setVehicleValidation] = useState({ isValid: false, message: '' })
  const [paidExceedsTotal, setPaidExceedsTotal] = useState(false)
  const [isManualValidTo, setIsManualValidTo] = useState(false)

  // Insurance document upload states
  const [insuranceDocPreview, setInsuranceDocPreview] = useState(null)
  const [uploadingInsuranceDoc, setUploadingInsuranceDoc] = useState(false)
  const [isExtractingInsurance, setIsExtractingInsurance] = useState(false)

  // Vehicle search dropdown states
  const [vehicleMatches, setVehicleMatches] = useState([])
  const [showVehicleDropdown, setShowVehicleDropdown] = useState(false)
  const [selectedDropdownIndex, setSelectedDropdownIndex] = useState(0)
  const dropdownItemRefs = useRef([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeInsuranceCheck, setActiveInsuranceCheck] = useState(null) // { loading, exists, policyNumber, validTo } | null
  const [policyNumberCheck, setPolicyNumberCheck] = useState(null) // { loading, exists, productType, policyHolderName, validFrom, validTo } | null
  const isOcrUpdate = useRef(false)

  // Pre-fill form when initialData is provided (for edit/renewal) or reset on open
  useEffect(() => {
    if (initialData && isOpen) {
      const vehicleNum = initialData.vehicleNumber || ''
      setFormData({
        vehicleNumber: vehicleNum,
        policyNumber: initialData.policyNumber || '',
        policyHolderName: initialData.policyHolderName || '',
        issueDate: initialData.issueDate || '',
        validFrom: initialData.validFrom || '',
        validTo: initialData.validTo || '',
        totalFee: initialData.totalFee?.toString() || '',
        paid: initialData.paid?.toString() || '',
        balance: initialData.balance?.toString() || '',
        vehicleType: initialData.vehicleType || '',
        insuranceCompany: initialData.insuranceCompany || '',
        productType: initialData.productType || '',
        customProductType: '',
        policyType: initialData.policyType || '',
        mobileNumber: initialData.mobileNumber || '',
        agentName: initialData.agentName || '',
        agentContact: initialData.agentContact || '',
        insuranceDocument: initialData.insuranceDocument || '',
        renewPremium: initialData.renewPremium?.toString() || '0',
        commission: initialData.commission?.toString() || '0',
        address: ''
      })

      // Set insurance document preview if exists
      if (initialData.insuranceDocument) {
        setInsuranceDocPreview(`${API_URL}${initialData.insuranceDocument}`)
      } else {
        setInsuranceDocPreview(null)
      }

      // Validate pre-filled vehicle number
      if (vehicleNum) {
        const validation = validateVehicleNumberRealtime(vehicleNum)
        setVehicleValidation(validation)
      }
    } else if (!isOpen) {
      // Reset form when modal closes
      setFormData({
        vehicleNumber: prefilledVehicleNumber,
        policyNumber: '',
        policyHolderName: prefilledOwnerName,
        mobileNumber: prefilledMobileNumber,
        issueDate: '',
        validFrom: '',
        validTo: '',
        totalFee: '0',
        paid: '0',
        balance: '0',
        insuranceCompany: '',
        productType: '',
        customProductType: '',
        insuranceDocument: '',
        renewPremium: '0',
        commission: '0',
        address: '',
        chassisNumber: '',
        engineNumber: '',
        makerName: '',
        makerModel: '',
        manufactureYear: '',
        cubicCapacity: '',
        seatingCapacity: '',
        bodyType: ''
      })
      setFetchingVehicle(false)
      setVehicleValidation({ isValid: false, message: '' })
      setInsuranceDocPreview(null)
      setIsManualValidTo(false)
      setActiveInsuranceCheck(null)
      setPolicyNumberCheck(null)
    }
  }, [initialData, isOpen, prefilledVehicleNumber, prefilledOwnerName, prefilledMobileNumber])

  // Set prefilled values when modal opens (for quick add from vehicle registration)
  useEffect(() => {
    if (isOpen && !initialData && (prefilledVehicleNumber || prefilledOwnerName || prefilledMobileNumber)) {
      setFormData(prev => ({
        ...prev,
        vehicleNumber: prefilledVehicleNumber,
        policyHolderName: prefilledOwnerName,
        mobileNumber: prefilledMobileNumber
      }));
      // Mark vehicle as valid if prefilled
      if (prefilledVehicleNumber) {
        setVehicleValidation({ isValid: true, message: 'Vehicle number prefilled' });
      }
    }
  }, [isOpen, prefilledVehicleNumber, prefilledOwnerName, prefilledMobileNumber, initialData])

  // Fetch vehicle details when registration number is entered
  useEffect(() => {
    const fetchVehicleDetails = async () => {
      const searchInput = formData.vehicleNumber.trim()

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
            // Single match found - auto-fill vehicle number, mobile number, and owner name
            const vehicleData = response.data.data
            setFormData(prev => ({
              ...prev,
              vehicleNumber: vehicleData.registrationNumber,
              mobileNumber: vehicleData.mobileNumber || prev.mobileNumber,
              policyHolderName: vehicleData.ownerName || prev.policyHolderName
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
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [formData.vehicleNumber])

  // Calculate valid to date (1 year from valid from)
  useEffect(() => {
    if (isOcrUpdate.current || isManualValidTo) return; // Prevent overwriting if populated via OCR or manual edit
    if (formData.validFrom) {
      // Parse DD-MM-YYYY format
      const parts = formData.validFrom.trim().split('-')
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10)
        const month = parseInt(parts[1], 10) - 1 // Month is 0-indexed
        const year = parseInt(parts[2], 10)

        // Check if date is valid
        if (!isNaN(day) && !isNaN(month) && !isNaN(year) && year > 1900) {
          const validFromDate = new Date(year, month, day)

          // Check if the date object is valid
          if (!isNaN(validFromDate.getTime())) {
            // Verify the date object has the same day/month/year we set
            if (validFromDate.getDate() === day &&
                validFromDate.getMonth() === month &&
                validFromDate.getFullYear() === year) {

              const validToDate = new Date(validFromDate)
              validToDate.setFullYear(validToDate.getFullYear() + 1)
              // Subtract 1 day
              validToDate.setDate(validToDate.getDate() - 1)

              // Format date to DD-MM-YYYY
              const newDay = String(validToDate.getDate()).padStart(2, '0')
              const newMonth = String(validToDate.getMonth() + 1).padStart(2, '0')
              const newYear = validToDate.getFullYear()
              const formattedValidTo = `${newDay}-${newMonth}-${newYear}`

              // Only update if different to avoid infinite loop
              if (formData.validTo !== formattedValidTo) {
                setFormData(prev => ({
                  ...prev,
                  validTo: formattedValidTo
                }))
              }
            }
          }
        }
      }
    }
  }, [formData.validFrom, formData.validTo])

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
      mobileNumber: vehicle.mobileNumber || prev.mobileNumber,
      policyHolderName: vehicle.ownerName || prev.policyHolderName
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

  // Check if vehicle already has active insurance
  useEffect(() => {
    if (isEditMode) return

    const vehicleNum = formData.vehicleNumber.trim()
    if (vehicleNum.length < 4) {
      setActiveInsuranceCheck(null)
      return
    }

    setActiveInsuranceCheck({ loading: true })

    const timeoutId = setTimeout(async () => {
      try {
        const res = await axios.get(`${API_URL}/api/insurance/check-vehicle/${encodeURIComponent(vehicleNum)}`, {
          withCredentials: true
        })
        if (res.data.success) {
          setActiveInsuranceCheck(res.data.data.hasActiveInsurance
            ? { loading: false, exists: true, policyNumber: res.data.data.policyNumber, validTo: res.data.data.validTo, insuranceCompany: res.data.data.insuranceCompany }
            : { loading: false, exists: false }
          )
        } else {
          setActiveInsuranceCheck(null)
        }
      } catch {
        setActiveInsuranceCheck(null)
      }
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [formData.vehicleNumber, isEditMode])

  // Check if policy number already exists (for non-motor / no vehicle number scenarios)
  useEffect(() => {
    if (isEditMode) return

    const policyNum = formData.policyNumber.trim()
    if (policyNum.length < 4) {
      setPolicyNumberCheck(null)
      return
    }

    setPolicyNumberCheck({ loading: true })

    const timeoutId = setTimeout(async () => {
      try {
        const res = await axios.get(`${API_URL}/api/insurance/policy/${encodeURIComponent(policyNum)}`, {
          withCredentials: true
        })
        if (res.data.success && res.data.data) {
          const d = res.data.data
          setPolicyNumberCheck({
            loading: false,
            exists: true,
            productType: d.productType || '',
            policyHolderName: d.policyHolderName || '',
            validFrom: d.validFrom || '',
            validTo: d.validTo || '',
          })
        } else {
          setPolicyNumberCheck({ loading: false, exists: false })
        }
      } catch (err) {
        // 404 means policy not found — that's fine
        if (err.response?.status === 404) {
          setPolicyNumberCheck({ loading: false, exists: false })
        } else {
          setPolicyNumberCheck(null)
        }
      }
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [formData.policyNumber, isEditMode])

  const handleChange = (e) => {
    const { name, value } = e.target

    // Handle vehicle number - convert to uppercase and validate only (no enforcement)
    if (name === 'vehicleNumber') {
      // Convert to uppercase only (preserves spaces like KA23 8968)
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
        } else if (name === 'renewPremium' && formData.renewPremium === '0') {
          finalValue = value.replace(/^0+/, '') || '0'
        }
      }

      if (name === 'renewPremium') {
        setFormData(prev => ({ ...prev, renewPremium: finalValue }))
        return
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

    // Auto-uppercase for policy number
    if (name === 'policyNumber') {
      setFormData(prev => ({
        ...prev,
        [name]: value.toUpperCase()
      }))
      return
    }

    // Issue Date from calendar picker (YYYY-MM-DD → DD-MM-YYYY)
    if (name === 'issueDate') {
      if (!value) {
        setFormData(prev => ({ ...prev, issueDate: '' }))
      } else {
        const [yyyy, mm, dd] = value.split('-')
        setFormData(prev => ({ ...prev, issueDate: `${dd}-${mm}-${yyyy}` }))
      }
      return
    }

    // Auto-format date fields with automatic dash insertion
    if (name === 'validFrom' || name === 'validTo') {
      if (name === 'validTo') setIsManualValidTo(true)
      const formatted = handleSmartDateInput(value, formData[name] || '')

      // If smart formatting returns a value, use it
      if (formatted !== null) {
        setFormData(prev => ({
          ...prev,
          [name]: formatted
        }))
      } else {
        // If smart formatting rejects (e.g. invalid first digit),
        // still allow the user to type/delete so the field isn't "locked"
        setFormData(prev => ({
          ...prev,
          [name]: value
        }))
      }
      return
    }

    // Handle product type - clear custom if switching away from "Other"
    if (name === 'productType') {
      setFormData(prev => ({
        ...prev,
        productType: value,
        customProductType: value !== 'Other' ? '' : prev.customProductType
      }))
      return
    }

    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const INSURANCE_COMPANIES = [
    'ACKO', 'BAJAJ GENERAL INSURANCE', 'BHARTI AXA', 'CHOLAMANDALAM MS',
    'EDELWEISS', 'FUTURE GENERALI', 'GO DIGIT', 'HDFC ERGO',
    'ICICI LOMBARD', 'IFFCO TOKIO', 'INDUSIND', 'KOTAK MAHINDRA',
    'KSHEMA', 'LIBERTY GENERAL INSURANCE', 'MAGMA GENERAL INSURANCE', 'NATIONAL INSURANCE',
    'NAVI INSURANCE', 'NEW INDIA ASSURANCE', 'ORIENTAL INSURANCE', 'RAHEJA QBE',
    'RELIANCE GENERAL INSURANCE', 'ROYAL SUNDARAM', 'SBI GENERAL INSURANCE', 'SHRIRAM GENERAL INSURANCE',
    'TATA AIG GENERAL INSURANCE', 'UNITED INDIA INSURANCE', 'UNIVERSAL SOMPO', 'ZUNO', 'ZURICH KOTAK'
  ]

  const matchInsuranceCompany = (extractedText) => {
    if (!extractedText) return ''
    const upper = extractedText.toUpperCase().replace(/[^A-Z0-9 ]/g, '').trim()

    // Priority map: unique brand keywords that unambiguously identify a company
    // Checked FIRST before any fuzzy matching to prevent false positives (e.g. IFFCO matching BAJAJ GENERAL INSURANCE)
    const PRIORITY_KEYWORDS = [
      { keywords: ['IFFCO', 'TOKIO'], company: 'IFFCO TOKIO' },
      { keywords: ['HDFC', 'ERGO'], company: 'HDFC ERGO' },
      { keywords: ['ICICI', 'LOMBARD'], company: 'ICICI LOMBARD' },
      { keywords: ['TATA', 'AIG'], company: 'TATA AIG GENERAL INSURANCE' },
      { keywords: ['BAJAJ'], company: 'BAJAJ GENERAL INSURANCE' },
      { keywords: ['BHARTI', 'AXA'], company: 'BHARTI AXA' },
      { keywords: ['CHOLAMANDALAM'], company: 'CHOLAMANDALAM MS' },
      { keywords: ['FUTURE', 'GENERALI'], company: 'FUTURE GENERALI' },
      { keywords: ['GO DIGIT', 'GODIGIT', 'DIGIT'], company: 'GO DIGIT' },
      { keywords: ['NATIONAL INSURANCE', 'NATIONAL INS'], company: 'NATIONAL INSURANCE' },
      { keywords: ['NEW INDIA'], company: 'NEW INDIA ASSURANCE' },
      { keywords: ['ORIENTAL'], company: 'ORIENTAL INSURANCE' },
      { keywords: ['UNITED INDIA'], company: 'UNITED INDIA INSURANCE' },
      { keywords: ['SBI GENERAL', 'SBI GEN'], company: 'SBI GENERAL INSURANCE' },
      { keywords: ['SHRIRAM'], company: 'SHRIRAM GENERAL INSURANCE' },
      { keywords: ['ROYAL SUNDARAM', 'SUNDARAM'], company: 'ROYAL SUNDARAM' },
      { keywords: ['RELIANCE GENERAL', 'RELIANCE GEN'], company: 'RELIANCE GENERAL INSURANCE' },
      { keywords: ['UNIVERSAL SOMPO', 'SOMPO'], company: 'UNIVERSAL SOMPO' },
      { keywords: ['KOTAK MAHINDRA', 'KOTAK'], company: 'KOTAK MAHINDRA' },
      { keywords: ['ZURICH KOTAK'], company: 'ZURICH KOTAK' },
      { keywords: ['LIBERTY'], company: 'LIBERTY GENERAL INSURANCE' },
      { keywords: ['MAGMA'], company: 'MAGMA GENERAL INSURANCE' },
      { keywords: ['INDUSIND'], company: 'INDUSIND' },
      { keywords: ['EDELWEISS'], company: 'EDELWEISS' },
      { keywords: ['NAVI'], company: 'NAVI INSURANCE' },
      { keywords: ['KSHEMA'], company: 'KSHEMA' },
      { keywords: ['RAHEJA', 'QBE'], company: 'RAHEJA QBE' },
      { keywords: ['ZUNO'], company: 'ZUNO' },
      { keywords: ['ACKO'], company: 'ACKO' },
    ]

    // Check priority map first — any single keyword hit is enough for specific brands
    for (const { keywords, company } of PRIORITY_KEYWORDS) {
      if (keywords.every(kw => upper.includes(kw)) || keywords.some(kw => upper.includes(kw) && kw.length >= 5)) {
        return company
      }
    }

    // Fallback Check 1: extracted text contains a full list company name exactly
    for (const company of INSURANCE_COMPANIES) {
      if (upper.includes(company)) return company
    }

    // Fallback Check 2: company name contains the short extracted form
    if (upper.length >= 5) {
      for (const company of INSURANCE_COMPANIES) {
        if (company.includes(upper)) return company
      }
    }

    return upper
  }

  const matchProductType = (extractedText) => {
    if (!extractedText) return ''
    // Normalize: uppercase and replace hyphens with spaces so TWO-WHEELER and TWO WHEELER both match
    const t = extractedText.toUpperCase().replace(/-/g, ' ')

    if (/PRIVATE\s*CAR|PRIVATE\s*VEHICLE|PRIVATE\s*MOTORCAR|PKG\s*OD/.test(t)) return 'Pvt. Car'
    if (/TWO\s*WHEEL|2\s*WHEEL|MOTOR\s*CYCLE|BIKE|SCOOTER|MOTORCYCLE/.test(t)) return 'Two Wheeler'
    if (/GCV\s*3W|GOODS.*THREE\s*WHEEL|THREE\s*WHEEL.*GOODS|3\s*WHEEL.*GOODS|GOODS.*3\s*WHEEL/.test(t)) return 'GCV-3W'
    if (/GCV|GOODS\s*CARR|GOODS\s*VEHICLE|LIGHT\s*GOODS|HEAVY\s*GOODS|COMMERCIAL\s*GOODS|HGV|LGV/.test(t)) return 'GCV'
    if (/PCV\s*3W|PASS.*THREE\s*WHEEL|THREE\s*WHEEL.*PASS|AUTO\s*RICKSHAW|E\s*RICKSHAW/.test(t)) return 'PCV-3W'
    if (/TAXI|CAB|HACKNEY/.test(t)) return 'Taxi'
    if (/PCV|PASS.*CAR|PASSENGER\s*CAR|PASSENGER\s*VEHICLE|BUS|PASSENGER\s*CARR/.test(t)) return 'PCV'
    if (/MIS\s*D|MISC.*DOMESTIC|MISCELLANEOUS/.test(t)) return 'Mis-D'
    if (/HEALTH/.test(t)) return 'Health'
    if (/LIFE/.test(t)) return 'Life'
    if (/FIRE/.test(t)) return 'Fire'
    if (/BURGLARY/.test(t)) return 'Burglary'
    if (/MARINE/.test(t)) return 'Marine'
    if (/TRAVEL/.test(t)) return 'Travel'
    if (/GPA|PERSONAL\s*ACCIDENT/.test(t)) return 'GPA'
    if (/GMC|GROUP\s*MED/.test(t)) return 'GMC'
    if (/CPM|CONTRACTOR/.test(t)) return 'CPM'
    if (/WC|WORKER.*COMP|WORKMEN/.test(t)) return 'WC'
    return ''
  }

  const normalizeAIExtractedDate = (dateStr) => {
    if (!dateStr) return '';
    
    // If it's already in DD-MM-YYYY format, return it
    if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) return dateStr;
    
    // Replace / or . with -
    let normalized = dateStr.replace(/[\/\.]/g, '-');
    
    // Handle DD-MM-YYYY if it was DD/MM/YYYY
    if (/^\d{2}-\d{2}-\d{4}$/.test(normalized)) return normalized;

    // Try standard parsing
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}-${month}-${year}`;
    }
    return dateStr;
  };

  // AI Extraction logic
  const processExtraction = async (base64String, originalFile = null) => {
    setIsExtractingInsurance(true)
    const updateToast = toast.info('Analyzing insurance document, please wait...', { autoClose: false, isLoading: true })

    try {
      const response = await axios.post(
        `${API_URL}/api/ocr/insurance`,
        { imageBase64: base64String },
        { withCredentials: true }
      )

      if (response.data.success && response.data.data) {
        const resultData = response.data.data
        
        isOcrUpdate.current = true; // Block auto-calculate effect

        setFormData(prev => {
          const updated = { ...prev }
          
          if (resultData.vehicleNumber) {
            updated.vehicleNumber = resultData.vehicleNumber.toUpperCase()
            // Validate the vehicle number
            const validation = validateVehicleNumberRealtime(updated.vehicleNumber)
            setVehicleValidation(validation)
          }
          
          if (resultData.policyNumber) {
            updated.policyNumber = resultData.policyNumber.toUpperCase()
          }
          
          if (resultData.policyHolderName) {
            updated.policyHolderName = resultData.policyHolderName.toUpperCase()
          }

          if (resultData.validFrom) {
            const normalized = normalizeAIExtractedDate(resultData.validFrom);
            const formatted = handleSmartDateInput(normalized, '');
            if (formatted) updated.validFrom = formatted;
          }

          if (resultData.validTo) {
            const normalized = normalizeAIExtractedDate(resultData.validTo);
            const formatted = handleSmartDateInput(normalized, '');
            if (formatted) updated.validTo = formatted;
          }

          if (resultData.issueDate) {
            const normalized = normalizeAIExtractedDate(resultData.issueDate);
            const formatted = handleSmartDateInput(normalized, '');
            if (formatted) updated.issueDate = formatted;
          }

          if (resultData.insuranceCompany) {
            updated.insuranceCompany = matchInsuranceCompany(resultData.insuranceCompany)
          }

          // RC fields extracted from insurance document
          if (resultData.chassisNumber) updated.chassisNumber = resultData.chassisNumber.toUpperCase()
          if (resultData.engineNumber) updated.engineNumber = resultData.engineNumber.toUpperCase()
          if (resultData.makerName) updated.makerName = resultData.makerName.toUpperCase()
          if (resultData.makerModel) updated.makerModel = resultData.makerModel.toUpperCase()
          if (resultData.manufactureYear) updated.manufactureYear = resultData.manufactureYear
          if (resultData.cubicCapacity) updated.cubicCapacity = resultData.cubicCapacity
          if (resultData.seatingCapacity) updated.seatingCapacity = resultData.seatingCapacity
          if (resultData.bodyType) updated.bodyType = resultData.bodyType.toUpperCase()
          if (resultData.address) updated.address = resultData.address.toUpperCase()

          if (resultData.totalPremium) {
            const numericPremium = resultData.totalPremium.replace(/[^0-9.]/g, '')
            if (numericPremium) {
              updated.totalFee = numericPremium
              updated.paid = numericPremium
            }
          }

          if (resultData.productType) {
            const matched = matchProductType(resultData.productType)
            if (matched) updated.productType = matched
          }
          // Fallback: infer productType from bodyType if still not set
          if (!updated.productType && updated.bodyType) {
            updated.productType = matchProductType(updated.bodyType)
          }
          
          return updated
        })

        // Release the block after rendering
        setTimeout(() => { isOcrUpdate.current = false; }, 500);

        toast.dismiss(updateToast)
        toast.success('Insurance Details Extracted Successfully!', { position: 'top-right', autoClose: 3000 })
      } else {
        console.error('OCR extraction failed - response:', response.data)
        toast.dismiss(updateToast)
        toast.error('Failed to extract data from document.', { position: 'top-right', autoClose: 3000 })
      }
    } catch (err) {
      toast.dismiss(updateToast)
      // Specific error for scanned/image-only PDFs (HTTP 422)
      if (err.response?.status === 422 && err.response?.data?.isScannedPdf && originalFile) {
        const fallbackToast = toast.info('Scanned PDF detected. Converting to images for visual analysis...', { autoClose: false, isLoading: true });
        try {
          // Convert up to 2 pages to images. Use scale=1.2 to keep tokens under 8000 TPM limit.
          const pageImages = await pdfToImages(originalFile, 2, 1.2, 0.7);
          
          if (pageImages && pageImages.length > 0) {
            toast.update(fallbackToast, { render: 'Analyzing scanned document with Vision AI...', isLoading: true });
            
            const visionResponse = await axios.post(
              `${API_URL}/api/ocr/insurance`,
              { imageBase64: pageImages[0], backImageBase64: pageImages[1] || null },
              { withCredentials: true }
            );

            if (visionResponse.data.success && visionResponse.data.data) {
              const resultData = visionResponse.data.data;
              isOcrUpdate.current = true;
              
              setFormData(prev => {
                const updated = { ...prev };
                if (resultData.vehicleNumber) {
                  updated.vehicleNumber = resultData.vehicleNumber.toUpperCase();
                  setVehicleValidation(validateVehicleNumberRealtime(updated.vehicleNumber));
                }
                if (resultData.policyNumber) updated.policyNumber = resultData.policyNumber.toUpperCase();
                if (resultData.policyHolderName) updated.policyHolderName = resultData.policyHolderName.toUpperCase();
                if (resultData.validFrom) {
                  const formatted = handleSmartDateInput(normalizeAIExtractedDate(resultData.validFrom), '');
                  if (formatted) updated.validFrom = formatted;
                }
                if (resultData.validTo) {
                  const formatted = handleSmartDateInput(normalizeAIExtractedDate(resultData.validTo), '');
                  if (formatted) updated.validTo = formatted;
                }
                if (resultData.issueDate) {
                  const formatted = handleSmartDateInput(normalizeAIExtractedDate(resultData.issueDate), '');
                  if (formatted) updated.issueDate = formatted;
                }
                if (resultData.insuranceCompany) updated.insuranceCompany = matchInsuranceCompany(resultData.insuranceCompany);
                if (resultData.chassisNumber) updated.chassisNumber = resultData.chassisNumber.toUpperCase();
                if (resultData.engineNumber) updated.engineNumber = resultData.engineNumber.toUpperCase();
                if (resultData.makerName) updated.makerName = resultData.makerName.toUpperCase();
                if (resultData.makerModel) updated.makerModel = resultData.makerModel.toUpperCase();
                if (resultData.manufactureYear) updated.manufactureYear = resultData.manufactureYear;
                if (resultData.cubicCapacity) updated.cubicCapacity = resultData.cubicCapacity;
                if (resultData.seatingCapacity) updated.seatingCapacity = resultData.seatingCapacity;
                if (resultData.bodyType) updated.bodyType = resultData.bodyType.toUpperCase();
                if (resultData.address) updated.address = resultData.address.toUpperCase();
                if (resultData.totalPremium) {
                  const numericPremium = resultData.totalPremium.replace(/[^0-9.]/g, '');
                  if (numericPremium) {
                    updated.totalFee = numericPremium;
                    updated.paid = numericPremium;
                  }
                }
                if (resultData.productType) {
                  const matched = matchProductType(resultData.productType);
                  if (matched) updated.productType = matched;
                }
                // Fallback: infer productType from bodyType if still not set
                if (!updated.productType && updated.bodyType) {
                  updated.productType = matchProductType(updated.bodyType);
                }
                return updated;
              });

              setTimeout(() => { isOcrUpdate.current = false; }, 500);
              toast.dismiss(fallbackToast);
              toast.success('Insurance Details Extracted Successfully via Vision!', { position: 'top-right', autoClose: 3000 });
              return; // Success!
            }
          }
        } catch (visionErr) {
          console.error('Vision fallback failed:', visionErr);
        }
        
        toast.dismiss(fallbackToast);
        toast.error('Could not analyze the scanned PDF. Please fill details manually.', { position: 'top-right', autoClose: 4000 });
      } else {
        console.error('OCR extraction error:', {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status
        })
        toast.error('Error during OCR processing. Please fill details manually.', { position: 'top-right', autoClose: 3000 })
      }
    } finally {
      setIsExtractingInsurance(false)
    }
  }


  // Handle insurance document upload
  const handleInsuranceDocUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const isImage = file.type.startsWith('image/')
    const isPDF = file.type === 'application/pdf'

    if (!isImage && !isPDF) {
      toast.error('Please select a valid image or PDF file', { position: 'top-right', autoClose: 3000 })
      return
    }

    if (file.size > 12 * 1024 * 1024) {
      toast.error('File size should be less than 12MB', { position: 'top-right', autoClose: 3000 })
      return
    }

    setUploadingInsuranceDoc(true)

    try {
      const reader = new FileReader()
      reader.onloadend = async () => {
        try {
          const base64String = reader.result
          
          // Trigger OCR extraction
          await processExtraction(base64String, file)

          // If vehicle number is not set, we might need it for the path, 
          // but we can try to use what was extracted or just upload.
          // The current upload endpoint uses vehicleNumber for folder naming.
          
          const response = await axios.post(
            `${API_URL}/api/upload/insurance-document`,
            {
              imageData: base64String,
              insuranceId: initialData?._id || null,
              vehicleNumber: formData.vehicleNumber || 'EXTRACTED'
            },
            { withCredentials: true }
          )

          if (response.data.success) {
            setFormData(prev => ({ ...prev, insuranceDocument: response.data.data.path }))
            setInsuranceDocPreview(`${API_URL}${response.data.data.path}`)
            setUploadingInsuranceDoc(false)
            toast.success(`Insurance document uploaded successfully!`, { position: 'top-right', autoClose: 2000 })
          }
        } catch (uploadError) {
          setUploadingInsuranceDoc(false)
          toast.error('Failed to upload insurance document', { position: 'top-right', autoClose: 3000 })
        }
      }
      reader.readAsDataURL(file)
    } catch (error) {
      setUploadingInsuranceDoc(false)
      toast.error('Error processing insurance document', { position: 'top-right', autoClose: 3000 })
    }
  }

  // Remove insurance document
  const handleRemoveInsuranceDoc = () => {
    setInsuranceDocPreview(null)
    setFormData(prev => ({
      ...prev,
      insuranceDocument: ''
    }))
    toast.info('Insurance document removed', { position: 'top-right', autoClose: 2000 })
  }

  // Handle Enter key to navigate to next field instead of submitting
  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()

      // Get current tabIndex
      const currentTabIndex = parseInt(e.target.getAttribute('tabIndex'))

      // If we're on the last field (commission = tabIndex 14), submit the form
      if (currentTabIndex === 14) {
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

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validate paid amount doesn't exceed total fee
    if (paidExceedsTotal) {
      toast.error('Paid amount cannot be more than the total fee!')
      return
    }

    // Block if active vehicle insurance already exists
    if (!isEditMode && activeInsuranceCheck?.exists) {
      toast.error(
        `Cannot save — vehicle already has an active insurance policy (Policy: ${activeInsuranceCheck.policyNumber || 'N/A'}).`,
        { autoClose: 5000 }
      )
      return
    }

    // Block if the same policy number already exists
    if (!isEditMode && policyNumberCheck?.exists) {
      toast.error(
        `Cannot save — Policy Number already exists for ${policyNumberCheck.policyHolderName || 'another policyholder'} (${policyNumberCheck.productType || 'Insurance'}, valid ${policyNumberCheck.validFrom || '—'} to ${policyNumberCheck.validTo || '—'}).`,
        { autoClose: 6000 }
      )
      return
    }

    // Prepare data for submission
    const submitData = {
      vehicleNumber: formData.vehicleNumber,
      policyNumber: formData.policyNumber,
      policyHolderName: formData.policyHolderName,
      mobileNumber: formData.mobileNumber,
      issueDate: formData.issueDate || '',
      validFrom: formData.validFrom,
      validTo: formData.validTo,
      totalFee: parseFloat(formData.totalFee) || 0,
      paid: parseFloat(formData.paid) || 0,
      balance: parseFloat(formData.balance) || 0,
      insuranceCompany: formData.insuranceCompany || '',
      productType: formData.productType === 'Other' ? (formData.customProductType || 'Other') : formData.productType,
      insuranceDocument: formData.insuranceDocument || '',
      renewPremium: parseFloat(formData.renewPremium) || 0,
      commission: parseFloat(formData.commission) || 0,
      status: 'Active',
      // RC details extracted from insurance document (used for auto-creating vehicle record)
      rcDetails: {
        chassisNumber: formData.chassisNumber || '',
        engineNumber: formData.engineNumber || '',
        makerName: formData.makerName || '',
        makerModel: formData.makerModel || '',
        manufactureYear: formData.manufactureYear ? Number(formData.manufactureYear) : null,
        cubicCapacity: formData.cubicCapacity ? Number(formData.cubicCapacity) : null,
        seatingCapacity: formData.seatingCapacity ? Number(formData.seatingCapacity) : null,
        bodyType: formData.bodyType || '',
        address: formData.address || ''
      }
    }

    setIsSubmitting(true)
    try {
      const endpoint = isEditMode ? `${API_URL}/api/insurance/${initialData._id}` : `${API_URL}/api/insurance`
      const method = isEditMode ? 'put' : 'post'
      
      const response = await axios[method](endpoint, submitData, {
        withCredentials: true
      })

      if (response.data.success) {
        toast.success(isEditMode ? 'Insurance record updated successfully!' : 'Insurance record added successfully!')

        // If vehicle was auto-created, inform the user
        if (!isEditMode && response.data.vehicleAutoCreated) {
          toast.info('âœ… Vehicle record also auto-created in Vahan from insurance data.', { autoClose: 5000 })
        }

        // Call onSubmit callback to notify parent (for refresh)
        if (onSubmit) {
          onSubmit(submitData)
        }

        // Close modal
        onClose()
      }
    } catch (error) {
      console.error(`Error ${isEditMode ? 'updating' : 'adding'} insurance:`, error)
      toast.error(error.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'add'} insurance record`)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className='fixed inset-0 bg-black/60  z-[70] flex items-center justify-center p-2 md:p-4'>
      <div className='bg-white rounded-xl md:rounded-2xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-hidden flex flex-col'>
        {/* Header */}
        <div className='bg-gradient-to-r from-blue-600 to-indigo-600 p-2 md:p-3 text-white flex-shrink-0'>
          <div className='flex justify-between items-center gap-2'>
            <div>
              <h2 className='text-lg md:text-2xl font-bold'>
                {isEditMode ? 'Edit Insurance' : 'Add New Insurance'}
              </h2>
              <p className='text-blue-100 text-xs md:text-sm mt-1'>
                {isEditMode ? 'Update vehicle insurance record' : 'Vehicle insurance record (1 year validity)'}
              </p>
            </div>
            
            <div className='flex items-center gap-2 shrink-0'>
              {/* AI Upload Quick Button */}
              {!isEditMode && (
                <div className='relative overflow-hidden rounded-lg'>
                  <button
                    type='button'
                    disabled={isExtractingInsurance || uploadingInsuranceDoc}
                    className='flex items-center gap-1.5 rounded-lg bg-white/15 px-3 py-1.5 text-xs font-semibold text-white shadow-sm ring-1 ring-white/30 transition hover:bg-white/25 disabled:opacity-60 md:px-4 md:py-2 md:text-sm'
                  >
                    {isExtractingInsurance ? (
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
                        AI Upload
                      </>
                    )}
                  </button>
                  <input
                    type='file'
                    accept='image/*, application/pdf'
                    disabled={isExtractingInsurance || uploadingInsuranceDoc}
                    onChange={handleInsuranceDocUpload}
                    className='absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed'
                  />
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
            {/* Section 1: Vehicle & Policy Details */}
            <div className='bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-indigo-200 rounded-xl p-3 md:p-6 mb-4 md:mb-6'>
              <h3 className='text-base md:text-lg font-bold text-gray-800 mb-3 md:mb-4 flex items-center gap-2'>
                <span className='bg-indigo-600 text-white w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm'>1</span>
                Vehicle & Policy Details
              </h3>

              <div className='grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-4'>
                {/* Issue Date */}
                <div>
                  <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1'>
                    Issue Date
                  </label>
                  <input
                    type='date'
                    name='issueDate'
                    value={(() => {
                      const d = formData.issueDate
                      if (!d || d.length !== 10) return ''
                      const [dd, mm, yyyy] = d.split('-')
                      return yyyy && mm && dd ? `${yyyy}-${mm}-${dd}` : ''
                    })()}
                    onChange={handleChange}
                    tabIndex="1"
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white'
                  />
                  <p className='text-[10px] text-gray-400 mt-1'>When document was issued</p>
                </div>

                {/* Vehicle Number */}
                <div>
                  <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1'>
                    Vehicle Number
                  </label>
                  <div className='relative'>
                    <input
                      type='text'
                      name='vehicleNumber'
                      value={formData.vehicleNumber}
                      onChange={handleChange}
                      onKeyDown={handleInputKeyDown}
                      placeholder='CG04AA1234 or 4793'
                      maxLength='10'
                      tabIndex="2"
                      className={`w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:border-transparent font-mono bg-white ${
                        formData.vehicleNumber && !vehicleValidation.isValid
                          ? 'border-red-500 focus:ring-red-500'
                          : formData.vehicleNumber && vehicleValidation.isValid
                          ? 'border-green-500 focus:ring-green-500'
                          : 'border-gray-300 focus:ring-indigo-500'
                      }`}
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
                          {vehicleMatches.length} vehicle{vehicleMatches.length !== 1 ? 's' : ''} found - Use â†‘â†“ to navigate, Enter to select
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

                  {/* Active insurance warning */}
                  {activeInsuranceCheck?.loading && formData.vehicleNumber.trim().length >= 4 && (
                    <div className='mt-2 flex items-center gap-1.5 text-amber-700 bg-amber-50 border border-amber-300 rounded-md px-2.5 py-1.5'>
                      <svg className='w-3.5 h-3.5 animate-spin' fill='none' viewBox='0 0 24 24'>
                        <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' />
                        <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z' />
                      </svg>
                      <span className='text-xs font-medium'>Checking active insurance...</span>
                    </div>
                  )}
                  {activeInsuranceCheck?.exists && (
                    <div className='mt-2 flex items-start gap-1.5 bg-red-50 border border-red-300 rounded-md px-2.5 py-2'>
                      <svg className='w-4 h-4 mt-0.5 shrink-0 text-red-500' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' />
                      </svg>
                      <div className='text-xs'>
                        <span className='font-semibold text-red-700'>Insurance is Active Already</span>
                        <br />
                        <span className='text-red-600'>
                          Policy: {activeInsuranceCheck.policyNumber || 'N/A'}
                          {activeInsuranceCheck.insuranceCompany ? ` Â· ${activeInsuranceCheck.insuranceCompany}` : ''}
                          {activeInsuranceCheck.validTo ? ` Â· Valid till ${activeInsuranceCheck.validTo}` : ''}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Policy Number */}
                <div>
                  <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1'>
                    Policy Number
                  </label>
                  <input
                    type='text'
                    name='policyNumber'
                    value={formData.policyNumber}
                    onChange={handleChange}
                    onKeyDown={handleInputKeyDown}
                    placeholder='INS001234567'
                    tabIndex="2"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent font-mono bg-white ${
                      policyNumberCheck?.exists
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-indigo-500'
                    }`}
                  />

                  {/* Policy number checking spinner */}
                  {policyNumberCheck?.loading && formData.policyNumber.trim().length >= 4 && (
                    <div className='mt-2 flex items-center gap-1.5 text-amber-700 bg-amber-50 border border-amber-300 rounded-md px-2.5 py-1.5'>
                      <svg className='w-3.5 h-3.5 animate-spin' fill='none' viewBox='0 0 24 24'>
                        <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' />
                        <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z' />
                      </svg>
                      <span className='text-xs font-medium'>Checking policy number…</span>
                    </div>
                  )}

                  {/* Policy number duplicate alert */}
                  {policyNumberCheck?.exists && (
                    <div className='mt-2 flex items-start gap-1.5 bg-red-50 border border-red-300 rounded-md px-2.5 py-2'>
                      <svg className='w-4 h-4 mt-0.5 shrink-0 text-red-500' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' />
                      </svg>
                      <div className='text-xs'>
                        <span className='font-semibold text-red-700'>Policy Number already exists.</span>
                        <ul className='mt-1 space-y-0.5 text-red-600'>
                          {policyNumberCheck.productType && (
                            <li>Insurance Type: <span className='font-medium'>{policyNumberCheck.productType}</span></li>
                          )}
                          {policyNumberCheck.policyHolderName && (
                            <li>Policyholder: <span className='font-medium'>{policyNumberCheck.policyHolderName}</span></li>
                          )}
                          {(policyNumberCheck.validFrom || policyNumberCheck.validTo) && (
                            <li>
                              Policy Validity:{' '}
                              <span className='font-medium'>
                                {policyNumberCheck.validFrom || '—'} to {policyNumberCheck.validTo || '—'}
                              </span>
                            </li>
                          )}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>

                {/* Policy Holder Name */}
                <div>
                  <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1'>
                    Policy Holder Name
                  </label>
                  <input
                    type='text'
                    name='policyHolderName'
                    value={formData.policyHolderName}
                    onChange={handleChange}
                    onKeyDown={handleInputKeyDown}
                    placeholder='Enter policy holder name'
                    tabIndex="3"
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white'
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
                    tabIndex="5"
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white'
                  />
                </div>

                {/* Product Type */}
                <div>
                  <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1'>
                    Product Type
                  </label>
                  <select
                    name='productType'
                    value={formData.productType}
                    onChange={handleChange}
                    onKeyDown={handleInputKeyDown}
                    tabIndex="6"
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white'
                  >
                    <option value=''>-- Select Product --</option>
                    <option value='GCV'>GCV</option>
                    <option value='GCV-3W'>GCV-3W</option>
                    <option value='Pvt. Car'>Pvt. Car</option>
                    <option value='Taxi'>Taxi</option>
                    <option value='Two Wheeler'>Two Wheeler</option>
                    <option value='Mis-D'>Mis-D</option>
                    <option value='PCV'>PCV</option>
                    <option value='PCV-3W'>PCV-3W</option>
                    <option value='Health'>Health</option>
                    <option value='Life'>Life</option>
                    <option value='Fire'>Fire</option>
                    <option value='Burglary'>Burglary</option>
                    <option value='WC'>WC</option>
                    <option value='CPM'>CPM</option>
                    <option value='Travel'>Travel</option>
                    <option value='Marine'>Marine</option>
                    <option value='GPA'>GPA</option>
                    <option value='GMC'>GMC</option>
                    <option value='Other'>Other</option>
                  </select>
                  {formData.productType === 'Other' && (
                    <input
                      type='text'
                      name='customProductType'
                      value={formData.customProductType || ''}
                      onChange={handleChange}
                      placeholder='Type custom product'
                      className='w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white'
                    />
                  )}
                </div>

                {/* Insurance Company */}
                <div className='md:col-span-2'>
                  <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1'>
                    Insurance Company
                  </label>
                  <select
                    name='insuranceCompany'
                    value={formData.insuranceCompany}
                    onChange={handleChange}
                    onKeyDown={handleInputKeyDown}
                    tabIndex="7"
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white'
                  >
                    <option value=''>-- Select Insurance Company --</option>
                    <option value='ACKO'>Acko</option>
                    <option value='BAJAJ GENERAL INSURANCE'>Bajaj General Insurance</option>
                    <option value='BHARTI AXA'>Bharti AXA</option>
                    <option value='CHOLAMANDALAM MS'>Cholamandalam MS</option>
                    <option value='EDELWEISS'>Edelweiss</option>
                    <option value='FUTURE GENERALI'>Future Generali</option>
                    <option value='GO DIGIT'>Go Digit</option>
                    <option value='HDFC ERGO'>HDFC ERGO</option>
                    <option value='ICICI LOMBARD'>ICICI Lombard</option>
                    <option value='IFFCO TOKIO'>IFFCO Tokio</option>
                    <option value='INDUSIND'>IndusInd General Insurance</option>
                    <option value='KOTAK MAHINDRA'>Kotak Mahindra</option>
                    <option value='KSHEMA'>Kshema</option>
                    <option value='LIBERTY GENERAL INSURANCE'>Liberty General Insurance</option>
                    <option value='MAGMA GENERAL INSURANCE'>Magma General Insurance</option>
                    <option value='NATIONAL INSURANCE'>National Insurance</option>
                    <option value='NAVI INSURANCE'>Navi Insurance</option>
                    <option value='NEW INDIA ASSURANCE'>New India Assurance</option>
                    <option value='ORIENTAL INSURANCE'>Oriental Insurance</option>
                    <option value='RAHEJA QBE'>Raheja QBE</option>
                    <option value='RELIANCE GENERAL INSURANCE'>Reliance General Insurance</option>
                    <option value='ROYAL SUNDARAM'>Royal Sundaram</option>
                    <option value='SBI GENERAL INSURANCE'>SBI General Insurance</option>
                    <option value='SHRIRAM GENERAL INSURANCE'>Shriram General Insurance</option>
                    <option value='TATA AIG GENERAL INSURANCE'>Tata AIG General Insurance</option>
                    <option value='UNITED INDIA INSURANCE'>United India Insurance</option>
                    <option value='UNIVERSAL SOMPO'>Universal Sompo</option>
                    <option value='ZUNO'>Zuno</option>
                    <option value='ZURICH KOTAK'>Zurich Kotak</option>
                  </select>
                </div>

                {/* Owner's Address */}
                <div className='md:col-span-4'>
                  <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1'>
                    Owner's Address
                  </label>
                  <input
                    type='text'
                    name='address'
                    value={formData.address}
                    onChange={handleChange}
                    onKeyDown={handleInputKeyDown}
                    placeholder="Enter owner's address (extracted automatically from PDF)"
                    tabIndex="8"
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white uppercase'
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Validity Period */}
            <div className='bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-3 md:p-6 mb-4 md:mb-6'>
              <h3 className='text-base md:text-lg font-bold text-gray-800 mb-3 md:mb-4 flex items-center gap-2'>
                <span className='bg-purple-600 text-white w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm'>2</span>
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
                    tabIndex="9"
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white'
                    required
                  />
                  <p className='text-xs text-gray-500 mt-1'>Type 2-digit year (24) to auto-expand to 2024</p>
                </div>

                {/* Valid To (Auto-calculated) */}
                <div>
                  <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1'>
                    Valid To <span className='text-xs text-blue-500'>(Auto-calculated)</span>
                  </label>
                  <input
                    type='text'
                    name='validTo'
                    value={formData.validTo}
                    onChange={handleChange}
                    onKeyDown={handleInputKeyDown}
                    placeholder='DD-MM-YYYY'
                    tabIndex="10"
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white'
                  />
                  <p className='text-xs text-gray-500 mt-1'>Auto-calculated: 1 year from Valid From date minus 1 day</p>
                </div>
              </div>
            </div>

            {/* Section 3: Payment Information */}
            <div className='bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-emerald-200 rounded-xl p-3 md:p-6 mb-4 md:mb-6'>
              <h3 className='text-base md:text-lg font-bold text-gray-800 mb-3 md:mb-4 flex items-center gap-2'>
                <span className='bg-emerald-600 text-white w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm'>3</span>
                Payment Information
              </h3>

              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4'>
                {/* Total Fee */}
                <div>
                  <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1'>
                    Total Premium (₹) <span className='text-red-500'>*</span>
                  </label>
                  <input
                    type='number'
                    name='totalFee'
                    value={formData.totalFee}
                    onChange={handleChange}
                    onFocus={(e) => e.target.select()}
                    onKeyDown={handleInputKeyDown}
                    placeholder=''
                    tabIndex="11"
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-semibold bg-white'
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
                    onFocus={(e) => e.target.select()}
                    onKeyDown={handleInputKeyDown}
                    placeholder=''
                    tabIndex="12"
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

                {/* Renew Premium */}
                <div>
                  <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1'>
                    Renew Premium (₹)
                  </label>
                  <input
                    type='number'
                    name='renewPremium'
                    value={formData.renewPremium}
                    onChange={handleChange}
                    onFocus={(e) => e.target.select()}
                    onKeyDown={handleInputKeyDown}
                    placeholder='For next year'
                    tabIndex="13"
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-semibold bg-white'
                  />
                </div>

                {/* Commission */}
                <div>
                  <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1'>
                    Commission (₹)
                  </label>
                  <input
                    type='number'
                    name='commission'
                    value={formData.commission}
                    onChange={handleChange}
                    onFocus={(e) => e.target.select()}
                    onKeyDown={handleInputKeyDown}
                    placeholder='Agent commission'
                    tabIndex="14"
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-semibold bg-white'
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

            {/* Section 4: Insurance Document Upload */}
            <div className='bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-3 md:p-6 mb-4 md:mb-6'>
              <h3 className='text-base md:text-lg font-bold text-gray-800 mb-3 md:mb-4 flex items-center gap-2'>
                <span className='bg-purple-600 text-white w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm'>4</span>
                Insurance Document
              </h3>

              {!insuranceDocPreview ? (
                <>
                  <input
                    type='file'
                    accept='image/*,application/pdf'
                    onChange={handleInsuranceDocUpload}
                    disabled={uploadingInsuranceDoc}
                    className='hidden'
                    id='insuranceDocInput'
                  />
                  <label
                    htmlFor='insuranceDocInput'
                    className={`flex flex-col items-center justify-center w-full h-32 md:h-40 border-2 border-dashed rounded-lg cursor-pointer transition-all duration-200 ${
                      uploadingInsuranceDoc
                        ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
                        : 'border-purple-300 bg-white hover:bg-purple-50 hover:border-purple-400'
                    }`}
                  >
                    {uploadingInsuranceDoc ? (
                      <div className='flex flex-col items-center'>
                        <svg className='animate-spin h-8 w-8 text-purple-600 mb-2' fill='none' viewBox='0 0 24 24'>
                          <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' />
                          <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z' />
                        </svg>
                        <p className='text-sm text-gray-600 font-semibold'>Uploading...</p>
                      </div>
                    ) : (
                      <>
                        <svg className='w-10 h-10 md:w-12 md:h-12 text-purple-400 mb-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12' />
                        </svg>
                        <p className='text-xs md:text-sm text-gray-600 font-semibold mb-1'>Upload Insurance Document</p>
                        <p className='text-[10px] md:text-xs text-gray-500'>Image or PDF (Optional)</p>
                        <p className='text-[10px] text-purple-600 font-semibold mt-1'>Max 12MB</p>
                      </>
                    )}
                  </label>
                </>
              ) : (
                <div className='relative'>
                  {insuranceDocPreview.startsWith('data:application/pdf') || insuranceDocPreview.includes('.pdf') ? (
                    <div className='w-full h-32 md:h-40 flex flex-col items-center justify-center bg-white rounded-lg border-2 border-purple-300'>
                      <svg className='w-12 h-12 md:w-16 md:h-16 text-red-500 mb-2' fill='currentColor' viewBox='0 0 20 20'>
                        <path fillRule='evenodd' d='M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z' clipRule='evenodd' />
                      </svg>
                      <p className='text-xs md:text-sm font-semibold text-gray-600'>Insurance PDF</p>
                      <a
                        href={insuranceDocPreview}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='text-xs text-blue-600 hover:underline mt-1'
                      >
                        View PDF
                      </a>
                    </div>
                  ) : (
                    <img
                      src={insuranceDocPreview}
                      alt='Insurance Document Preview'
                      className='w-full h-32 md:h-40 object-contain bg-white rounded-lg border-2 border-purple-300'
                    />
                  )}
                  <button
                    type='button'
                    onClick={handleRemoveInsuranceDoc}
                    className='absolute -top-2 -right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-all shadow-lg'
                    title='Delete insurance document'
                  >
                    <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' />
                    </svg>
                  </button>
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
                disabled={isSubmitting}
                className='flex-1 md:flex-none px-6 md:px-8 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg font-semibold transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
              >
                {isSubmitting ? (
                  <>
                    <svg className='animate-spin h-5 w-5 text-white' xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24'>
                      <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4'></circle>
                      <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'></path>
                    </svg>
                    {isEditMode ? 'Updating...' : 'Adding...'}
                  </>
                ) : (
                  <>
                    <svg className='w-4 h-4 md:w-5 md:h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
                    </svg>
                    {isEditMode ? 'Update Insurance' : 'Add Insurance'}
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

export default AddInsuranceModal
