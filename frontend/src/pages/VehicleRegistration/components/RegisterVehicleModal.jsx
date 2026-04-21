import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { validateVehicleNumberRealtime, enforceVehicleNumberFormat } from '../../../utils/vehicleNoCheck'
import { handleSmartDateInput, normalizeAIExtractedDate } from '../../../utils/dateFormatter'
import ImageViewer from '../../../components/ImageViewer'
import DocumentScannerPreview from '../../../components/DocumentScannerPreview'

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'

const RegisterVehicleModal = ({ isOpen, onClose, onSuccess, editData }) => {
  const [vehicleValidation, setVehicleValidation] = useState({ isValid: false, message: '' })
  const [showImageViewer, setShowImageViewer] = useState(false)
  const [vehicleAlreadyExists, setVehicleAlreadyExists] = useState(false)
  const [checkingVehicle, setCheckingVehicle] = useState(false)
  const [formData, setFormData] = useState({
    registrationNumber: '',
    dateOfRegistration: '',
    chassisNumber: '',
    engineNumber: '',
    ownerName: '',
    sonWifeDaughterOf: '',
    address: '',
    mobileNumber: '',
    email: '',
    subPartyName: '',
    subPartyMobile: '',
    makerName: '',
    makerModel: '',
    colour: '',
    seatingCapacity: '',
    vehicleType: '',
    ladenWeight: '',
    unladenWeight: '',
    manufactureYear: '',
    vehicleCategory: '',
    rcImage: '',
    rcBackImage: '',
    aadharImage: '',
    panImage: '',
    speedGovernorImage: '',
    numberOfCylinders: '',
    cubicCapacity: '',
    fuelType: '',
    bodyType: '',
    wheelBase: '',
    partyId: ''
  })

  // Party-related state
  const [parties, setParties] = useState([])
  const [showPartySuggestions, setShowPartySuggestions] = useState(false)
  const [filteredParties, setFilteredParties] = useState([])
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const [showAddPartyModal, setShowAddPartyModal] = useState(false)
  const [selectedPartyName, setSelectedPartyName] = useState('')
  const [newParty, setNewParty] = useState({
    partyName: '',
    sonWifeDaughterOf: '',
    mobile: '',
    email: '',
    address: ''
  })
  const [savingParty, setSavingParty] = useState(false)

  // Refs for party modal Enter key navigation
  const partyNameRef = useRef(null)
  const partySWDRef = useRef(null)
  const partyMobileRef = useRef(null)
  const partyEmailRef = useRef(null)
  const partyAddressRef = useRef(null)
  const partySaveButtonRef = useRef(null)

  // Handle Enter key navigation in Add Party modal
  const handlePartyKeyDown = (e, nextRef) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (nextRef && nextRef.current) {
        nextRef.current.focus()
      }
    }
  }

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [rcImagePreview, setRcImagePreview] = useState(null)
  const [rcBackImagePreview, setRcBackImagePreview] = useState(null)
  const [aadharImagePreview, setAadharImagePreview] = useState(null)
  const [panImagePreview, setPanImagePreview] = useState(null)
  const [speedGovernorImagePreview, setSpeedGovernorImagePreview] = useState(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadingBackImage, setUploadingBackImage] = useState(false)
  const [uploadingAadhar, setUploadingAadhar] = useState(false)
  const [uploadingPan, setUploadingPan] = useState(false)
  const [uploadingSpeedGovernor, setUploadingSpeedGovernor] = useState(false)
  const [isExtractingRc, setIsExtractingRc] = useState(false)
  const [scanningFile, setScanningFile] = useState(null)
  const [scanningBackFile, setScanningBackFile] = useState(null)

  const uploadRcDocument = async (imageData, side = 'front', vehicleNumberOverride = '') => {
    const vehicleNumber = (vehicleNumberOverride || formData.registrationNumber || '').trim().toUpperCase()

    if (!vehicleNumber) {
      toast.error('Vehicle registration number is required before saving RC image.', { position: 'top-right', autoClose: 3000 })
      return null
    }

    const endpoint = side === 'back' ? 'rc-back-image' : 'rc-image'
    const response = await axios.post(
      `${API_URL}/api/upload/${endpoint}`,
      {
        imageData,
        vehicleRegistrationId: editData?._id || null,
        vehicleNumber
      },
      { withCredentials: true }
    )

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to upload RC document')
    }

    const imagePath = response.data.data.path
    setFormData(prev => ({
      ...prev,
      [side === 'back' ? 'rcBackImage' : 'rcImage']: imagePath
    }))

    return response.data.data
  }

  // Handle Enter key to move to next field in order and arrow keys for party suggestions
  const handleKeyDown = (e) => {
    const currentFieldName = e.target.name

    if (e.altKey && e.key.toLowerCase() === 'n') {
      e.preventDefault()
      openAddPartyModal()
      return
    }

    // Handle arrow keys for party suggestions dropdown.
    if (currentFieldName === 'partySearch' && showPartySuggestions && filteredParties.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setHighlightedIndex(prev =>
          prev < filteredParties.length - 1 ? prev + 1 : 0
        )
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setHighlightedIndex(prev =>
          prev > 0 ? prev - 1 : filteredParties.length - 1
        )
        return
      }
      if (e.key === 'Enter' && highlightedIndex >= 0) {
        e.preventDefault()
        handlePartySelect(filteredParties[highlightedIndex])
        return
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        setShowPartySuggestions(false)
        setHighlightedIndex(-1)
        return
      }
    }

    if (currentFieldName === 'partySearch' && e.key === 'Enter' && !formData.partyId) {
      e.preventDefault()
      const exactParty = findMatchingParty(formData.ownerName)

      if (exactParty) {
        handlePartySelect(exactParty)
      } else if (formData.ownerName.trim()) {
        toast.error('Party is required. Choose an existing party or create a new party with Alt+N.', { position: 'top-right', autoClose: 3000 })
        setNewParty(prev => ({ ...prev, partyName: formData.ownerName }))
      } else {
        toast.error('Please choose a party from dropdown or create a new party.', { position: 'top-right', autoClose: 3000 })
      }
      return
    }

    if (e.key === 'Enter') {
      e.preventDefault() // Prevent default form submission

      // Define complete navigation order - all fields from top to bottom
      const navigationOrder = [
        'registrationNumber',
        'dateOfRegistration',
        'chassisNumber',
        'engineNumber',
        'makerName',
        'makerModel',
        'colour',
        'seatingCapacity',
        'vehicleType',
        'vehicleCategory',
        'ladenWeight',
        'unladenWeight',
        'manufactureYear',
        'numberOfCylinders',
        'cubicCapacity',
        'fuelType',
        'bodyType',
        'wheelBase',
        'partySearch',
        'subPartyName',
        'subPartyMobile'
      ]

      const currentIndex = navigationOrder.indexOf(currentFieldName)

      // Move to next field in the order
      if (currentIndex > -1 && currentIndex < navigationOrder.length - 1) {
        const nextFieldName = navigationOrder[currentIndex + 1]
        const nextField = e.target.form.elements[nextFieldName]
        if (nextField) {
          nextField.focus()
        }
      } else if (currentIndex === navigationOrder.length - 1) {
        // Last field (email) - submit the form
        e.target.form.requestSubmit()
      }
    }
  }

  // Fetch all parties on component mount
  useEffect(() => {
    const fetchParties = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/parties?all=true`, { withCredentials: true })
        if (response.data.success) {
          setParties(response.data.data)
        }
      } catch (error) {
        console.error('Error fetching parties:', error)
      }
    }
    if (isOpen) {
      fetchParties()
    }
  }, [isOpen])

  // Auto-focus on party name when Add Party modal opens
  useEffect(() => {
    if (showAddPartyModal && partyNameRef.current) {
      setTimeout(() => {
        partyNameRef.current.focus()
      }, 100)
    }
  }, [showAddPartyModal])

  useEffect(() => {
    if (editData) {
      // Set registrationNumber from either registrationNumber or vehicleNumber for backward compatibility
      const regNumber = editData.registrationNumber || editData.vehicleNumber || ''
      setFormData({
        ...editData,
        registrationNumber: regNumber,
        partyId: editData.partyId?._id || editData.partyId || ''
      })

      // Set selected party name if party is linked
      if (editData.partyId?.partyName) {
        setSelectedPartyName(editData.partyId.partyName)
      } else if (editData.partyId && editData.ownerName) {
        setSelectedPartyName(editData.ownerName)
      } else {
        setSelectedPartyName('')
      }

      // Validate existing registration number
      if (regNumber) {
        const validation = validateVehicleNumberRealtime(regNumber)
        setVehicleValidation(validation)
      }

      // Set RC image preview if exists
      if (editData.rcImage) {
        setRcImagePreview(`${API_URL}${editData.rcImage}`)
      } else {
        setRcImagePreview(null)
      }

      // Set RC Back image preview if exists
      if (editData.rcBackImage) {
        setRcBackImagePreview(`${API_URL}${editData.rcBackImage}`)
      } else {
        setRcBackImagePreview(null)
      }

      // Set Aadhar image preview if exists
      if (editData.aadharImage) {
        setAadharImagePreview(`${API_URL}${editData.aadharImage}`)
      } else {
        setAadharImagePreview(null)
      }

      // Set PAN image preview if exists
      if (editData.panImage) {
        setPanImagePreview(`${API_URL}${editData.panImage}`)
      } else {
        setPanImagePreview(null)
      }
      if (editData.speedGovernorImage) {
        setSpeedGovernorImagePreview(`${API_URL}${editData.speedGovernorImage}`)
      } else {
        setSpeedGovernorImagePreview(null)
      }
    } else {
      setFormData({
        registrationNumber: '',
        dateOfRegistration: '',
        chassisNumber: '',
        engineNumber: '',
        ownerName: '',
        sonWifeDaughterOf: '',
        address: '',
        mobileNumber: '',
        email: '',
        subPartyName: '',
        subPartyMobile: '',
        makerName: '',
        makerModel: '',
        colour: '',
        seatingCapacity: '',
        vehicleType: '',
        ladenWeight: '',
        unladenWeight: '',
        manufactureYear: '',
        vehicleCategory: '',
        rcImage: '',
        rcBackImage: '',
        aadharImage: '',
        panImage: '',
        speedGovernorImage: '',
        numberOfCylinders: '',
        cubicCapacity: '',
        fuelType: '',
        bodyType: '',
        wheelBase: '',
        partyId: ''
      })
      setVehicleValidation({ isValid: false, message: '' })
      setSelectedPartyName('')
      setRcImagePreview(null)
      setRcBackImagePreview(null)
      setAadharImagePreview(null)
      setPanImagePreview(null)
      setSpeedGovernorImagePreview(null)
    }
    setError('')
    setVehicleAlreadyExists(false)
  }, [editData, isOpen])

  // Check if vehicle already exists when registration number is complete
  useEffect(() => {
    const checkVehicleExists = async () => {
      const regNumber = formData.registrationNumber.trim()

      // Only check if:
      // 1. Registration number is 9 or 10 characters (complete)
      // 2. Vehicle validation is valid
      // 3. Not in edit mode (editData is null)
      if ((regNumber.length === 9 || regNumber.length === 10) && vehicleValidation.isValid && !editData) {
        setCheckingVehicle(true)
        setVehicleAlreadyExists(false)

        try {
          const response = await axios.get(`${API_URL}/api/vehicle-registrations/check-exists/${regNumber}`, {
            withCredentials: true
          })

          if (response.data.success) {
            // Set exists status from response
            setVehicleAlreadyExists(response.data.exists)
          }
        } catch (error) {
          console.error('Error checking vehicle:', error)
          setVehicleAlreadyExists(false)
        } finally {
          setCheckingVehicle(false)
        }
      } else {
        setVehicleAlreadyExists(false)
      }
    }

    // Debounce the check
    const timer = setTimeout(() => {
      checkVehicleExists()
    }, 500)

    return () => clearTimeout(timer)
  }, [formData.registrationNumber, vehicleValidation.isValid, editData])

  // Keyboard shortcut handling for modal dismissal
  useEffect(() => {
    const handleModalKeyDown = (e) => {
      if (e.altKey && e.key.toLowerCase() === 'n' && !showAddPartyModal) {
        e.preventDefault()
        openAddPartyModal()
        return
      }

      if (e.key !== 'Escape') return

      if (showPartySuggestions && filteredParties.length > 0) {
        e.preventDefault()
        setShowPartySuggestions(false)
        setHighlightedIndex(-1)
        return
      }

      if (showAddPartyModal) {
        e.preventDefault()
        setShowAddPartyModal(false)
        return
      }

      e.preventDefault()
      onClose()
    }

    if (isOpen) {
      document.addEventListener('keydown', handleModalKeyDown)
    }

    return () => {
      document.removeEventListener('keydown', handleModalKeyDown)
    }
  }, [isOpen, onClose, showPartySuggestions, filteredParties.length, showAddPartyModal, formData.ownerName])

  const handleChange = (e) => {
    const { name, value } = e.target

    // Handle registration number (vehicle number) with format enforcement and validation
    if (name === 'registrationNumber') {
      // Enforce format: only allow correct characters at each position
      const enforcedValue = enforceVehicleNumberFormat(formData.registrationNumber, value)

      // Validate in real-time
      const validation = validateVehicleNumberRealtime(enforcedValue)
      setVehicleValidation(validation)

      setFormData(prev => ({
        ...prev,
        [name]: enforcedValue
      }))
      return
    }

    // Convert specific fields to uppercase
    const uppercaseFields = ['chassisNumber', 'engineNumber', 'makerName', 'makerModel', 'colour', 'ownerName', 'sonWifeDaughterOf', 'address', 'subPartyName']
    const processedValue = uppercaseFields.includes(name) ? value.toUpperCase() : value

    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }))
  }

  // Handle owner name change with party suggestions
  const handleOwnerNameChange = (e) => {
    const value = e.target.value.toUpperCase()
    setFormData(prev => ({ ...prev, ownerName: value, partyId: '' }))
    setSelectedPartyName('')

    // Filter parties based on input (start from 1 character)
    if (value.length >= 1) {
      const filtered = parties.filter(party =>
        party.partyName.toUpperCase().includes(value)
      )
      setFilteredParties(filtered)
      setShowPartySuggestions(filtered.length > 0)
      setHighlightedIndex(filtered.length > 0 ? 0 : -1) // Reset highlighted index when filtering
    } else {
      setShowPartySuggestions(false)
      setFilteredParties([])
      setHighlightedIndex(-1)
    }
  }

  const handlePartySearchFocus = () => {
    setFilteredParties(parties)
    setShowPartySuggestions(parties.length > 0)
    setHighlightedIndex(parties.length > 0 ? 0 : -1)
  }

  const openAddPartyModal = () => {
    setNewParty(prev => ({
      ...prev,
      partyName: selectedPartyName || formData.ownerName || prev.partyName
    }))
    setShowPartySuggestions(false)
    setShowAddPartyModal(true)
  }

  // Handle party selection from suggestions
  const handlePartySelect = (party) => {
    setFormData(prev => ({
      ...prev,
      ownerName: party.partyName,
      sonWifeDaughterOf: party.sonWifeDaughterOf || '',
      mobileNumber: party.mobile || '',
      email: party.email || '',
      address: party.address || '',
      partyId: party._id
    }))
    setSelectedPartyName(party.partyName)
    setShowPartySuggestions(false)
    setHighlightedIndex(-1)
  }

  const normalizePartyName = (value = '') =>
    String(value).trim().toUpperCase().replace(/\s+/g, ' ')

  const findMatchingParty = (partyName) => {
    const normalizedPartyName = normalizePartyName(partyName)
    if (!normalizedPartyName) return null

    return parties.find(party => normalizePartyName(party.partyName) === normalizedPartyName) || null
  }

  const mergeExtractedRcData = (previousData, extractedData, options = {}) => {
    const { onlyEmpty = false, matchedParty = null } = options
    const updated = { ...previousData }
    const partyControlledFields = ['ownerName', 'sonWifeDaughterOf', 'address', 'mobileNumber', 'email', 'partyId']

    Object.keys(extractedData).forEach(key => {
      if (!extractedData[key] || !Object.prototype.hasOwnProperty.call(updated, key)) return
      if (matchedParty && partyControlledFields.includes(key)) return
      if (onlyEmpty && updated[key]) return

      if (key === 'dateOfRegistration') {
        const normalizedStr = normalizeAIExtractedDate(extractedData[key])
        const formatted = handleSmartDateInput(normalizedStr, '')
        if (formatted) updated[key] = formatted
      } else {
        updated[key] = String(extractedData[key]).toUpperCase()
      }
    })

    if (matchedParty) {
      updated.ownerName = matchedParty.partyName
      updated.sonWifeDaughterOf = matchedParty.sonWifeDaughterOf || ''
      updated.mobileNumber = matchedParty.mobile || ''
      updated.email = matchedParty.email || ''
      updated.address = matchedParty.address || ''
      updated.partyId = matchedParty._id
    } else if (extractedData.ownerName) {
      updated.partyId = ''
    }

    return updated
  }

  // Clear party selection
  const clearPartySelection = () => {
    setFormData(prev => ({
      ...prev,
      ownerName: '',
      sonWifeDaughterOf: '',
      mobileNumber: '',
      email: '',
      address: '',
      partyId: ''
    }))
    setSelectedPartyName('')
    setFilteredParties([])
    setShowPartySuggestions(false)
    setHighlightedIndex(-1)
  }

  // Handle new party form change
  const handleNewPartyChange = (e) => {
    const { name, value } = e.target
    const uppercaseFields = ['partyName', 'sonWifeDaughterOf', 'address']
    const processedValue = uppercaseFields.includes(name) ? value.toUpperCase() : value
    setNewParty(prev => ({ ...prev, [name]: processedValue }))
  }

  // Save new party
  const handleSaveParty = async () => {
    if (!newParty.partyName.trim()) {
      toast.error('Party name is required', { position: 'top-right', autoClose: 3000 })
      return
    }

    const existingParty = findMatchingParty(newParty.partyName)
    if (existingParty) {
      toast.error('Already exists this party. Please choose it from the dropdown.', { position: 'top-right', autoClose: 3000 })
      handlePartySelect(existingParty)
      setShowAddPartyModal(false)
      return
    }

    setSavingParty(true)
    try {
      const response = await axios.post(`${API_URL}/api/parties`, newParty, { withCredentials: true })
      if (response.data.success) {
        const savedParty = response.data.data
        // Add to parties list
        setParties(prev => [...prev, savedParty])
        // Auto-select the new party
        handlePartySelect(savedParty)
        // Close modal and reset form
        setShowAddPartyModal(false)
        setNewParty({
          partyName: '',
          sonWifeDaughterOf: '',
          mobile: '',
          email: '',
          address: ''
        })
        toast.success('Party added successfully!', { position: 'top-right', autoClose: 2000 })
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to add party'
      toast.error(errorMessage, { position: 'top-right', autoClose: 3000 })
    } finally {
      setSavingParty(false)
    }
  }

  const partyDetailInputClass = 'w-full pl-9 md:pl-12 pr-2.5 md:pr-4 py-1.5 md:py-2 text-xs md:text-sm bg-gray-100 border-2 border-gray-200 rounded-lg md:rounded-xl font-semibold text-gray-700 placeholder-gray-400 cursor-not-allowed uppercase'
  const partyDetailInputClassNormalCase = 'w-full pl-9 md:pl-12 pr-2.5 md:pr-4 py-1.5 md:py-2 text-xs md:text-sm bg-gray-100 border-2 border-gray-200 rounded-lg md:rounded-xl font-semibold text-gray-700 placeholder-gray-400 cursor-not-allowed'

  const handleDateChange = (e) => {
    const { name, value } = e.target
    const formatted = handleSmartDateInput(value, formData[name] || '')

    if (formatted !== null) {
      setFormData(prev => ({
        ...prev,
        [name]: formatted
      }))
    }
  }

  // Handle RC image/PDF upload and convert images to WebP
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type (images or PDF)
    const isImage = file.type.startsWith('image/')
    const isPDF = file.type === 'application/pdf'

    if (!isImage && !isPDF) {
      toast.error('Please select a valid image or PDF file', { position: 'top-right', autoClose: 3000 })
      return
    }

    // Validate file size (max 12MB)
    if (file.size > 12 * 1024 * 1024) {
      toast.error('File size should be less than 12MB', { position: 'top-right', autoClose: 3000 })
      return
    }

    setUploadingImage(true)

    try {
      // If PDF, upload directly without conversion
      if (isPDF) {
        const reader = new FileReader()
        reader.onloadend = async () => {
          try {
            const base64String = reader.result

            // Upload to server
            const response = await axios.post(
              `${API_URL}/api/upload/rc-image`,
              {
                imageData: base64String,
                vehicleRegistrationId: editData?._id || null,
                vehicleNumber: formData.registrationNumber
              },
              { withCredentials: true }
            )

            if (response.data.success) {
              setFormData(prev => ({
                ...prev,
                rcImage: response.data.data.path
              }))

              setRcImagePreview(base64String)
              setUploadingImage(false)
              toast.success(`RC PDF uploaded successfully! (${response.data.data.sizeInMB}MB)`, {
                position: 'top-right',
                autoClose: 2000
              })
            } else {
              setUploadingImage(false)
              toast.error(response.data.message || 'Failed to upload PDF', {
                position: 'top-right',
                autoClose: 3000
              })
            }
          } catch (uploadError) {
            console.error('Error uploading PDF:', uploadError)
            setUploadingImage(false)
            toast.error(uploadError.response?.data?.message || 'Failed to upload PDF to server', {
              position: 'top-right',
              autoClose: 3000
            })
          }
        }

        reader.onerror = () => {
          setUploadingImage(false)
          toast.error('Failed to read PDF file', { position: 'top-right', autoClose: 3000 })
        }

        reader.readAsDataURL(file)
        return
      }

      // For images, create canvas to convert to WebP
      const img = new Image()
      const reader = new FileReader()

      reader.onload = (event) => {
        img.onload = async () => {
          // Create canvas with image dimensions
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')

          // Set max dimensions while maintaining aspect ratio
          const maxWidth = 1920
          const maxHeight = 1920
          let width = img.width
          let height = img.height

          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height)
            width = width * ratio
            height = height * ratio
          }

          canvas.width = width
          canvas.height = height

          // Draw image on canvas
          ctx.drawImage(img, 0, 0, width, height)

          // Convert to WebP blob
          canvas.toBlob(
            async (blob) => {
              if (blob) {
                // Convert blob to base64 for upload
                const webpReader = new FileReader()
                webpReader.onloadend = async () => {
                  try {
                    const base64String = webpReader.result

                    // Upload to server (include vehicleRegistrationId if editing to replace old image)
                    const response = await axios.post(
                      `${API_URL}/api/upload/rc-image`,
                      {
                        imageData: base64String,
                        vehicleRegistrationId: editData?._id || null,
                        vehicleNumber: formData.registrationNumber
                      },
                      { withCredentials: true }
                    )

                    if (response.data.success) {
                      // Set the server path in form data
                      setFormData(prev => ({
                        ...prev,
                        rcImage: response.data.data.path
                      }))

                      // Create preview URL from base64
                      const previewUrl = URL.createObjectURL(blob)
                      setRcImagePreview(previewUrl)

                      setUploadingImage(false)
                      toast.success(`RC document uploaded successfully! (${response.data.data.sizeInMB}MB, ${response.data.data.format})`, {
                        position: 'top-right',
                        autoClose: 2000
                      })
                    } else {
                      setUploadingImage(false)
                      toast.error(response.data.message || 'Failed to upload document', {
                        position: 'top-right',
                        autoClose: 3000
                      })
                    }
                  } catch (uploadError) {
                    console.error('Error uploading to server:', uploadError)
                    setUploadingImage(false)
                    toast.error(uploadError.response?.data?.message || 'Failed to upload document to server', {
                      position: 'top-right',
                      autoClose: 3000
                    })
                  }
                }
                webpReader.readAsDataURL(blob)
              } else {
                setUploadingImage(false)
                toast.error('Failed to convert image', { position: 'top-right', autoClose: 3000 })
              }
            },
            'image/webp',
            0.8 // Quality: 0.8 for good balance between quality and size
          )
        }

        img.onerror = () => {
          setUploadingImage(false)
          toast.error('Failed to load image', { position: 'top-right', autoClose: 3000 })
        }

        img.src = event.target.result
      }

      reader.onerror = () => {
        setUploadingImage(false)
        toast.error('Failed to read file', { position: 'top-right', autoClose: 3000 })
      }

      reader.readAsDataURL(file)
    } catch (error) {
      console.error('Error uploading document:', error)
      setUploadingImage(false)
      toast.error('Error uploading document', { position: 'top-right', autoClose: 3000 })
    }
  }

  // Handle Aadhar upload
  const handleAadharUpload = async (e) => {
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

    setUploadingAadhar(true)

    try {
      if (isPDF) {
        const reader = new FileReader()
        reader.onloadend = async () => {
          try {
            const base64String = reader.result
            const response = await axios.post(
              `${API_URL}/api/upload/aadhar-image`,
              {
                imageData: base64String,
                vehicleRegistrationId: editData?._id || null,
                vehicleNumber: formData.registrationNumber
              },
              { withCredentials: true }
            )

            if (response.data.success) {
              setFormData(prev => ({ ...prev, aadharImage: response.data.data.path }))
              setAadharImagePreview(base64String)
              setUploadingAadhar(false)
              toast.success(`Aadhar PDF uploaded successfully!`, { position: 'top-right', autoClose: 2000 })
            }
          } catch (uploadError) {
            setUploadingAadhar(false)
            toast.error('Failed to upload Aadhar PDF', { position: 'top-right', autoClose: 3000 })
          }
        }
        reader.readAsDataURL(file)
        return
      }

      const img = new Image()
      const reader = new FileReader()
      reader.onload = (event) => {
        img.onload = async () => {
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          const maxWidth = 1920, maxHeight = 1920
          let width = img.width, height = img.height

          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height)
            width *= ratio
            height *= ratio
          }

          canvas.width = width
          canvas.height = height
          ctx.drawImage(img, 0, 0, width, height)

          canvas.toBlob(async (blob) => {
            if (blob) {
              const webpReader = new FileReader()
              webpReader.onloadend = async () => {
                try {
                  const response = await axios.post(
                    `${API_URL}/api/upload/aadhar-image`,
                    {
                      imageData: webpReader.result,
                      vehicleRegistrationId: editData?._id || null,
                      vehicleNumber: formData.registrationNumber
                    },
                    { withCredentials: true }
                  )

                  if (response.data.success) {
                    setFormData(prev => ({ ...prev, aadharImage: response.data.data.path }))
                    setAadharImagePreview(URL.createObjectURL(blob))
                    setUploadingAadhar(false)
                    toast.success(`Aadhar uploaded successfully!`, { position: 'top-right', autoClose: 2000 })
                  }
                } catch (uploadError) {
                  setUploadingAadhar(false)
                  toast.error('Failed to upload Aadhar', { position: 'top-right', autoClose: 3000 })
                }
              }
              webpReader.readAsDataURL(blob)
            }
          }, 'image/webp', 0.8)
        }
        img.src = event.target.result
      }
      reader.readAsDataURL(file)
    } catch (error) {
      setUploadingAadhar(false)
      toast.error('Error uploading Aadhar', { position: 'top-right', autoClose: 3000 })
    }
  }

  // Handle PAN upload
  const handlePanUpload = async (e) => {
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

    setUploadingPan(true)

    try {
      if (isPDF) {
        const reader = new FileReader()
        reader.onloadend = async () => {
          try {
            const base64String = reader.result
            const response = await axios.post(
              `${API_URL}/api/upload/pan-image`,
              {
                imageData: base64String,
                vehicleRegistrationId: editData?._id || null,
                vehicleNumber: formData.registrationNumber
              },
              { withCredentials: true }
            )

            if (response.data.success) {
              setFormData(prev => ({ ...prev, panImage: response.data.data.path }))
              setPanImagePreview(base64String)
              setUploadingPan(false)
              toast.success(`PAN PDF uploaded successfully!`, { position: 'top-right', autoClose: 2000 })
            }
          } catch (uploadError) {
            setUploadingPan(false)
            toast.error('Failed to upload PAN PDF', { position: 'top-right', autoClose: 3000 })
          }
        }
        reader.readAsDataURL(file)
        return
      }

      const img = new Image()
      const reader = new FileReader()
      reader.onload = (event) => {
        img.onload = async () => {
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          const maxWidth = 1920, maxHeight = 1920
          let width = img.width, height = img.height

          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height)
            width *= ratio
            height *= ratio
          }

          canvas.width = width
          canvas.height = height
          ctx.drawImage(img, 0, 0, width, height)

          canvas.toBlob(async (blob) => {
            if (blob) {
              const webpReader = new FileReader()
              webpReader.onloadend = async () => {
                try {
                  const response = await axios.post(
                    `${API_URL}/api/upload/pan-image`,
                    {
                      imageData: webpReader.result,
                      vehicleRegistrationId: editData?._id || null,
                      vehicleNumber: formData.registrationNumber
                    },
                    { withCredentials: true }
                  )

                  if (response.data.success) {
                    setFormData(prev => ({ ...prev, panImage: response.data.data.path }))
                    setPanImagePreview(URL.createObjectURL(blob))
                    setUploadingPan(false)
                    toast.success(`PAN uploaded successfully!`, { position: 'top-right', autoClose: 2000 })
                  }
                } catch (uploadError) {
                  setUploadingPan(false)
                  toast.error('Failed to upload PAN', { position: 'top-right', autoClose: 3000 })
                }
              }
              webpReader.readAsDataURL(blob)
            }
          }, 'image/webp', 0.8)
        }
        img.src = event.target.result
      }
      reader.readAsDataURL(file)
    } catch (error) {
      setUploadingPan(false)
      toast.error('Error uploading PAN', { position: 'top-right', autoClose: 3000 })
    }
  }

  // Remove RC image
  const handleRemoveImage = () => {
    setRcImagePreview(null)
    setFormData(prev => ({
      ...prev,
      rcImage: ''
    }))
    toast.info('RC document removed', { position: 'top-right', autoClose: 2000 })
  }

  // Remove Aadhar image
  const handleRemoveAadhar = () => {
    setAadharImagePreview(null)
    setFormData(prev => ({
      ...prev,
      aadharImage: ''
    }))
    toast.info('Aadhar document removed', { position: 'top-right', autoClose: 2000 })
  }

  // Remove PAN image
  const handleRemovePan = () => {
    setPanImagePreview(null)
    setFormData(prev => ({
      ...prev,
      panImage: ''
    }))
    toast.info('PAN document removed', { position: 'top-right', autoClose: 2000 })
  }

  // Handle Speed Governor upload
  const handleSpeedGovernorUpload = async (e) => {
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

    setUploadingSpeedGovernor(true)

    try {
      if (isPDF) {
        const reader = new FileReader()
        reader.onloadend = async () => {
          try {
            const base64String = reader.result
            const response = await axios.post(
              `${API_URL}/api/upload/speed-governor-image`,
              {
                imageData: base64String,
                vehicleRegistrationId: editData?._id || null,
                vehicleNumber: formData.registrationNumber
              },
              { withCredentials: true }
            )

            if (response.data.success) {
              setFormData(prev => ({ ...prev, speedGovernorImage: response.data.data.path }))
              setSpeedGovernorImagePreview(base64String)
              setUploadingSpeedGovernor(false)
              toast.success(`Speed Governor PDF uploaded successfully!`, { position: 'top-right', autoClose: 2000 })
            }
          } catch (uploadError) {
            setUploadingSpeedGovernor(false)
            toast.error('Failed to upload Speed Governor PDF', { position: 'top-right', autoClose: 3000 })
          }
        }
        reader.readAsDataURL(file)
        return
      }

      const img = new Image()
      const reader = new FileReader()
      reader.onload = (event) => {
        img.onload = async () => {
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          const maxWidth = 1920, maxHeight = 1920
          let width = img.width, height = img.height

          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height)
            width *= ratio
            height *= ratio
          }

          canvas.width = width
          canvas.height = height
          ctx.drawImage(img, 0, 0, width, height)

          canvas.toBlob(async (blob) => {
            if (blob) {
              const webpReader = new FileReader()
              webpReader.onloadend = async () => {
                try {
                  const response = await axios.post(
                    `${API_URL}/api/upload/speed-governor-image`,
                    {
                      imageData: webpReader.result,
                      vehicleRegistrationId: editData?._id || null,
                      vehicleNumber: formData.registrationNumber
                    },
                    { withCredentials: true }
                  )

                  if (response.data.success) {
                    setFormData(prev => ({ ...prev, speedGovernorImage: response.data.data.path }))
                    setSpeedGovernorImagePreview(URL.createObjectURL(blob))
                    setUploadingSpeedGovernor(false)
                    toast.success(`Speed Governor uploaded successfully!`, { position: 'top-right', autoClose: 2000 })
                  }
                } catch (uploadError) {
                  setUploadingSpeedGovernor(false)
                  toast.error('Failed to upload Speed Governor', { position: 'top-right', autoClose: 3000 })
                }
              }
              webpReader.readAsDataURL(blob)
            }
          }, 'image/webp', 0.8)
        }
        img.src = event.target.result
      }
      reader.readAsDataURL(file)
    } catch (error) {
      setUploadingSpeedGovernor(false)
      toast.error('Error uploading Speed Governor', { position: 'top-right', autoClose: 3000 })
    }
  }

  // Remove Speed Governor image
  const handleRemoveSpeedGovernor = () => {
    setSpeedGovernorImagePreview(null)
    setFormData(prev => ({
      ...prev,
      speedGovernorImage: ''
    }))
    toast.info('Speed Governor document removed', { position: 'top-right', autoClose: 2000 })
  }

  const handleRcExtractionUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      toast.error('Please upload an image or PDF file for extraction.', { position: 'top-right', autoClose: 3000 });
      return;
    }

    // PDF: no scanner step, send directly
    if (file.type === 'application/pdf') {
      setIsExtractingRc(true);
      const updateToast = toast.info('Analyzing RC PDF, please wait...', { autoClose: false, isLoading: true });
      try {
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64String = reader.result;
          try {
            const response = await axios.post(
              `${API_URL}/api/ocr/rc`,
              { imageBase64: base64String },
              { withCredentials: true }
            );
            if (response.data.success && response.data.data) {
              const resultData = response.data.data;
              const uploadData = await uploadRcDocument(base64String, 'front', resultData.registrationNumber);
              const matchedParty = findMatchingParty(resultData.ownerName);
              if (matchedParty) {
                setSelectedPartyName(matchedParty.partyName);
              } else if (resultData.ownerName) {
                setSelectedPartyName('');
              }
              setFormData(prev => {
                const updated = mergeExtractedRcData(prev, resultData, { matchedParty });
                if (resultData.registrationNumber) {
                  const validation = validateVehicleNumberRealtime(resultData.registrationNumber);
                  setVehicleValidation(validation);
                }
                return updated;
              });
              setRcImagePreview(base64String);
              toast.dismiss(updateToast);
              toast.success(
                uploadData ? `RC Details Extracted and PDF saved! (${uploadData.sizeInMB}MB)` : 'RC Details Extracted Successfully!',
                { position: 'top-right', autoClose: 3000 }
              );
            } else {
              toast.dismiss(updateToast);
              toast.error('Failed to extract data correctly.', { position: 'top-right', autoClose: 3000 });
            }
          } catch (err) {
            console.error(err);
            toast.dismiss(updateToast);
            toast.error('Server error during OCR processing.', { position: 'top-right', autoClose: 3000 });
          } finally {
            setIsExtractingRc(false);
          }
        };
        reader.readAsDataURL(file);
      } catch (err) {
        toast.dismiss(updateToast);
        toast.error('Error reading the PDF file.', { position: 'top-right', autoClose: 3000 });
        setIsExtractingRc(false);
      }
      return;
    }

    // Image: open scanner preview
    setScanningFile(file);
    e.target.value = '';
  }

  const handleScannerConfirm = async (processedFile) => {
    setScanningFile(null);
    setIsExtractingRc(true);
    const updateToast = toast.info('Analyzing RC front image, please wait...', { autoClose: false, isLoading: true });

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const frontBase64 = reader.result;

          // Check if there is a back image preview already
          let backToUse = null;
          if (rcBackImagePreview && !rcBackImagePreview.startsWith('http')) {
            // local preview (base64)
            backToUse = rcBackImagePreview;
          }

          const response = await axios.post(
            `${API_URL}/api/ocr/rc`,
            { imageBase64: frontBase64, backImageBase64: backToUse },
            { withCredentials: true }
          );

          if (response.data.success && response.data.data) {
            const resultData = response.data.data;
            const uploadData = await uploadRcDocument(frontBase64, 'front', resultData.registrationNumber);
            const matchedParty = findMatchingParty(resultData.ownerName);
            if (matchedParty) {
              setSelectedPartyName(matchedParty.partyName);
            } else if (resultData.ownerName) {
              setSelectedPartyName('');
            }
            setFormData(prev => {
              const updated = mergeExtractedRcData(prev, resultData, { matchedParty });
              if (resultData.registrationNumber) {
                const validation = validateVehicleNumberRealtime(resultData.registrationNumber);
                setVehicleValidation(validation);
              }
              return updated;
            });

            // Always set the front preview after AI extraction so user can see the image
            // and so the Back upload slot becomes visible
            setRcImagePreview(frontBase64);
            toast.dismiss(updateToast);
            toast.success(
              uploadData ? `RC Details Extracted and Front saved! (${uploadData.sizeInMB}MB)` : 'RC Details Extracted Successfully!',
              { position: 'top-right', autoClose: 3000 }
            );
          } else {
            toast.dismiss(updateToast);
            toast.error('Failed to extract data correctly.', { position: 'top-right', autoClose: 3000 });
          }
        } catch (err) {
          console.error(err);
          toast.dismiss(updateToast);
          toast.error('Server error during OCR processing.', { position: 'top-right', autoClose: 3000 });
        } finally {
          setIsExtractingRc(false);
        }
      };
      reader.readAsDataURL(processedFile);
    } catch (err) {
      toast.dismiss(updateToast);
      toast.error('Error reading the image file.', { position: 'top-right', autoClose: 3000 });
      setIsExtractingRc(false);
    }
  }

  // Handle RC Back image upload (direct, no scanner step) + OCR extraction
  const handleBackImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Back side must be an image file.', { position: 'top-right', autoClose: 3000 });
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      toast.error('File size should be less than 12MB', { position: 'top-right', autoClose: 3000 });
      return;
    }
    e.target.value = '';
    setUploadingBackImage(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result;
      // Show local preview immediately
      setRcBackImagePreview(base64String);

      // Run upload + OCR in parallel
      const [uploadResult, ocrResult] = await Promise.allSettled([
        // 1. Upload to server
        axios.post(
          `${API_URL}/api/upload/rc-back-image`,
          {
            imageData: base64String,
            vehicleRegistrationId: editData?._id || null,
            vehicleNumber: formData.registrationNumber
          },
          { withCredentials: true }
        ),
        // 2. OCR: send back image as primary image to extract any remaining fields
        axios.post(
          `${API_URL}/api/ocr/rc`,
          { imageBase64: base64String },
          { withCredentials: true }
        )
      ]);

      let backUploadSaved = false;

      // Handle upload result
      if (uploadResult.status === 'fulfilled' && uploadResult.value.data.success) {
        setFormData(prev => ({ ...prev, rcBackImage: uploadResult.value.data.data.path }));
        backUploadSaved = true;
        toast.success(`RC Back uploaded! (${uploadResult.value.data.data.sizeInMB}MB)`, {
          position: 'top-right', autoClose: 2000
        });
      } else {
        toast.error('Failed to upload RC back image', { position: 'top-right', autoClose: 3000 });
        setRcBackImagePreview(null);
      }

      // Handle OCR result — fill only empty fields so front-side data isn't overwritten
      if (ocrResult.status === 'fulfilled' && ocrResult.value.data.success && ocrResult.value.data.data) {
        const resultData = ocrResult.value.data.data;
        const matchedParty = findMatchingParty(resultData.ownerName);
        if (matchedParty) {
          setSelectedPartyName(matchedParty.partyName);
        } else if (resultData.ownerName) {
          setSelectedPartyName('');
        }
        if (!backUploadSaved && resultData.registrationNumber) {
          try {
            const uploadData = await uploadRcDocument(base64String, 'back', resultData.registrationNumber);
            if (uploadData) {
              backUploadSaved = true;
              setRcBackImagePreview(base64String);
              toast.success(`RC Back saved! (${uploadData.sizeInMB}MB)`, {
                position: 'top-right', autoClose: 2000
              });
            }
          } catch (uploadError) {
            console.error('Error saving RC back after OCR:', uploadError);
          }
        }
        setFormData(prev => {
          const updated = mergeExtractedRcData(prev, resultData, { onlyEmpty: true, matchedParty });
          if (resultData.registrationNumber && !updated.registrationNumber) {
            const validation = validateVehicleNumberRealtime(resultData.registrationNumber);
            setVehicleValidation(validation);
          }
          return updated;
        });
        toast.info('Back side data also extracted!', { position: 'top-right', autoClose: 2000 });
      }

      setUploadingBackImage(false);
    };
    reader.readAsDataURL(file);
  }



  const handleBackScannerConfirm = async (processedFile) => {
    setScanningBackFile(null);
    setUploadingBackImage(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result;
        const uploadData = await uploadRcDocument(base64String, 'back');
        if (uploadData) {
          setRcBackImagePreview(base64String);
          toast.success(`RC Back uploaded! (${uploadData.sizeInMB}MB, ${uploadData.format})`, {
            position: 'top-right', autoClose: 2000
          });
        } else {
          toast.error('Failed to upload RC back image', {
            position: 'top-right', autoClose: 3000
          });
        }
        setUploadingBackImage(false);
      };
      reader.readAsDataURL(processedFile);
    } catch (err) {
      console.error(err);
      toast.error('Error uploading RC back image.', { position: 'top-right', autoClose: 3000 });
      setUploadingBackImage(false);
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validate registration number before submitting
    if (!vehicleValidation.isValid && formData.registrationNumber) {
      toast.error('Please enter a valid registration number in the format: CG04AA1234 (10 characters, no spaces)')
      return
    }

    // Check if vehicle already exists (only for new registrations)
    if (vehicleAlreadyExists && !editData) {
      toast.error('This vehicle is already registered. Please use a different registration number.')
      return
    }

    if (!formData.partyId) {
      toast.error('Please select a party from the dropdown or create a new party with Alt+N.')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Set vehicleNumber same as registrationNumber for backend compatibility
      const submitData = {
        ...formData,
        vehicleNumber: formData.registrationNumber
      }

      // Only include rcImage if it has a value (optional field)
      if (!submitData.rcImage) {
        delete submitData.rcImage
      }
      if (!submitData.rcBackImage) {
        delete submitData.rcBackImage
      }

      let response
      if (editData) {
        response = await axios.put(`${API_URL}/api/vehicle-registrations/${editData._id}`, submitData, { withCredentials: true })
      } else {
        response = await axios.post(`${API_URL}/api/vehicle-registrations`, submitData, { withCredentials: true })
      }

      if (response.data.success) {
        toast.success(
          editData ? 'Vehicle registration updated successfully!' : 'Vehicle registered successfully!',
          { position: 'top-right', autoClose: 3000 }
        )
        onSuccess()
        onClose()
      } else {
        const errorMessage = response.data.message || 'Failed to save vehicle registration'
        setError(errorMessage)
        toast.error(errorMessage, { position: 'top-right', autoClose: 3000 })
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error saving vehicle registration. Please try again.'
      setError(errorMessage)
      toast.error(errorMessage, { position: 'top-right', autoClose: 3000 })
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className='fixed inset-0 bg-black/70  flex items-center justify-center z-50 p-2 md:p-4 animate-fadeIn'>
      <div className='bg-white rounded-2xl md:rounded-3xl shadow-2xl w-full max-w-full md:max-w-[90%] max-h-[98vh] md:max-h-[95vh] overflow-hidden animate-slideUp'>
        {/* Header with gradient and icon */}
        <div className='sticky top-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white px-3 py-2 md:px-6 md:py-3 z-10 shadow-lg'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2 md:gap-3'>
              <div className='bg-white/20 -lg p-1.5 md:p-2 rounded-lg'>
                <svg className='w-4 h-4 md:w-5 md:h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' />
                </svg>
              </div>
              <div>
                <h2 className='text-sm md:text-lg font-bold'>
                  {editData ? 'Edit Vehicle Registration' : 'Register New Vehicle'}
                </h2>
                <p className='text-white/80 text-[10px] md:text-xs mt-0.5 hidden md:block'>
                  {editData ? 'Update vehicle information' : 'Fill in all the required details'}
                </p>
              </div>
            </div>
            <div className='flex shrink-0 items-center gap-2'>
              {/* Upload Front RC button */}
              <div className='relative overflow-hidden rounded-lg'>
                <button
                  type='button'
                  disabled={isExtractingRc || uploadingImage}
                  className='flex max-w-full items-center gap-1.5 rounded-lg bg-white/15 px-3 py-1.5 text-xs font-semibold text-white shadow-sm ring-1 ring-white/30 transition hover:bg-white/25 disabled:opacity-60 md:px-4 md:py-2 md:text-sm'
                >
                  {(isExtractingRc || uploadingImage) ? (
                    <>
                      <svg className='h-3.5 w-3.5 animate-spin text-white' fill='none' viewBox='0 0 24 24'>
                        <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' />
                        <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z' />
                      </svg>
                      Processing...
                    </>
                  ) : (
                    <>
                      <svg className='h-3.5 w-3.5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12'/>
                      </svg>
                      {rcImagePreview ? 'Change Front' : 'Upload Front'}
                    </>
                  )}
                </button>
                <input
                  type='file'
                  accept='image/*,application/pdf'
                  disabled={isExtractingRc || uploadingImage}
                  onChange={handleRcExtractionUpload}
                  className='absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed'
                />
              </div>

              {/* Upload Back RC button — only when not a PDF */}
              {(!rcImagePreview || (!rcImagePreview.startsWith('data:application/pdf') && !rcImagePreview.includes('.pdf'))) && (
                <div className='relative overflow-hidden rounded-lg'>
                  <button
                    type='button'
                    disabled={uploadingBackImage}
                    className='flex max-w-full items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold text-white shadow-sm ring-1 ring-white/20 transition hover:bg-white/20 disabled:opacity-60 md:px-4 md:py-2 md:text-sm'
                  >
                    {uploadingBackImage ? (
                      <>
                        <svg className='h-3.5 w-3.5 animate-spin text-white' fill='none' viewBox='0 0 24 24'>
                          <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' />
                          <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z' />
                        </svg>
                        Uploading...
                      </>
                    ) : (
                      <>
                        <svg className='h-3.5 w-3.5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12'/>
                        </svg>
                        {rcBackImagePreview ? 'Change Back' : 'Upload Back'}
                      </>
                    )}
                  </button>
                  <input
                    type='file'
                    accept='image/*'
                    disabled={uploadingBackImage}
                    onChange={handleBackImageUpload}
                    className='absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed'
                  />
                </div>
              )}
              <button
                onClick={onClose}
                className='text-white/90 hover:text-white hover:bg-white/20 p-1.5 md:p-2 rounded-lg transition-all duration-200 hover:rotate-90'
              >
                <svg className='w-4 h-4 md:w-5 md:h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className='overflow-y-auto max-h-[calc(98vh-100px)] md:max-h-[calc(95vh-140px)] custom-scrollbar'>
          <form id='vehicle-registration-form' onSubmit={handleSubmit} className='p-3 md:p-8'>
            {error && (
              <div className='mb-3 md:mb-6 p-2.5 md:p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg flex items-start gap-2 md:gap-3 animate-shake'>
                <svg className='w-4 h-4 md:w-5 md:h-5 text-red-500 flex-shrink-0 mt-0.5' fill='currentColor' viewBox='0 0 20 20'>
                  <path fillRule='evenodd' d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z' clipRule='evenodd' />
                </svg>
                <span className='text-xs md:text-sm font-medium'>{error}</span>
              </div>
            )}

            {/* Vehicle Details Section */}
            <div className='mb-4 md:mb-8'>
              <div className='flex items-center gap-2 md:gap-3 mb-3 md:mb-6'>
                <div className='bg-gradient-to-br from-indigo-500 to-purple-600 p-1.5 md:p-2.5 rounded-lg md:rounded-xl shadow-lg'>
                  <svg className='w-4 h-4 md:w-6 md:h-6 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' />
                  </svg>
                </div>
                <div>
                  <h3 className='text-sm md:text-xl font-bold text-gray-800'>Vehicle Details</h3>
                  <p className='text-[10px] md:text-sm text-gray-500 hidden md:block'>Enter vehicle identification information</p>
                </div>
              </div>
              <div className='bg-gradient-to-br from-indigo-50 to-purple-50 p-3 md:p-6 rounded-xl md:rounded-2xl border border-indigo-100'>

                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5'>
                  {/* Registration Number */}
                  <div className='group'>
                    <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1.5 md:mb-2'>
                      Registration Number <span className='text-red-500'>*</span>
                    </label>
                    <div className='relative'>
                      <div className='absolute inset-y-0 left-0 pl-2.5 md:pl-4 flex items-center pointer-events-none'>
                        <svg className='w-4 h-4 md:w-5 md:h-5 text-indigo-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z' />
                        </svg>
                      </div>
                      <input
                        type='text'
                        name='registrationNumber'
                        value={formData.registrationNumber}
                        onChange={handleChange}
                        onKeyDown={handleKeyDown}
                        required
                        maxLength='10'
                        placeholder='CG04AA1234'
                        className={`w-full pl-9 md:pl-12 pr-10 md:pr-12 py-1.5 md:py-2 text-xs md:text-sm bg-white border-2 rounded-lg md:rounded-xl focus:ring-2 transition-all duration-200 font-semibold text-gray-800 placeholder-gray-400 ${
                          formData.registrationNumber && !vehicleValidation.isValid
                            ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                            : formData.registrationNumber && vehicleValidation.isValid
                            ? 'border-green-500 focus:ring-green-500 focus:border-green-500'
                            : 'border-gray-200 focus:ring-indigo-500 focus:border-indigo-500'
                        }`}
                      />
                      {vehicleValidation.isValid && formData.registrationNumber && (
                        <div className='absolute inset-y-0 right-0 pr-2.5 md:pr-4 flex items-center pointer-events-none'>
                          <svg className='h-4 w-4 md:h-5 md:w-5 text-green-500' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
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
                    {checkingVehicle && (
                      <p className='text-xs mt-1 text-blue-600 flex items-center gap-1'>
                        <svg className='animate-spin h-3 w-3' fill='none' viewBox='0 0 24 24'>
                          <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' />
                          <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z' />
                        </svg>
                        Checking vehicle...
                      </p>
                    )}
                    {vehicleAlreadyExists && !checkingVehicle && (
                      <p className='text-xs mt-1 text-red-600 font-semibold flex items-center gap-1'>
                        <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 20 20'>
                          <path fillRule='evenodd' d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z' clipRule='evenodd' />
                        </svg>
                        Vehicle already registered
                      </p>
                    )}

                  </div>

                  {/* Date of Registration */}
                  <div className='group'>
                    <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1.5 md:mb-2'>
                      Date of Registration
                    </label>
                    <div className='relative'>
                      <div className='absolute inset-y-0 left-0 pl-2.5 md:pl-4 flex items-center pointer-events-none'>
                        <svg className='w-4 h-4 md:w-5 md:h-5 text-indigo-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' />
                        </svg>
                      </div>
                      <input
                        type='text'
                        name='dateOfRegistration'
                        value={formData.dateOfRegistration}
                        onChange={handleDateChange}
                        onKeyDown={handleKeyDown}
                        placeholder='22-12-2023'
                        className='w-full pl-9 md:pl-12 pr-2.5 md:pr-4 py-1.5 md:py-2 text-xs md:text-sm bg-white border-2 border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 font-semibold text-gray-800 placeholder-gray-400'
                      />
                    </div>
                  </div>

                  {/* Chassis Number */}
                  <div className='group'>
                    <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1.5 md:mb-2'>
                      Chassis Number <span className='text-red-500'>*</span>
                      <span className='text-xs text-gray-500 ml-1'>(14-17 digits)</span>
                    </label>
                    <div className='relative'>
                      <div className='absolute inset-y-0 left-0 pl-2.5 md:pl-4 flex items-center pointer-events-none'>
                        <svg className='w-4 h-4 md:w-5 md:h-5 text-indigo-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' />
                        </svg>
                      </div>
                      <input
                        type='text'
                        name='chassisNumber'
                        value={formData.chassisNumber}
                        onChange={handleChange}
                        onKeyDown={handleKeyDown}
                        required
                        minLength='14'
                        maxLength='17'
                        placeholder='Enter 14-17 digit chassis number'
                        className='w-full pl-9 md:pl-12 pr-2.5 md:pr-4 py-1.5 md:py-2 text-xs md:text-sm bg-white border-2 border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 uppercase font-semibold text-gray-800 placeholder-gray-400'
                      />
                      {formData.chassisNumber && formData.chassisNumber.length < 14 && (
                        <div className='absolute inset-y-0 right-0 pr-2.5 md:pr-4 flex items-center pointer-events-none'>
                          <span className='text-xs font-semibold text-red-500'>
                            {formData.chassisNumber.length}/17
                          </span>
                        </div>
                      )}
                      {formData.chassisNumber && formData.chassisNumber.length >= 14 && (
                        <div className='absolute inset-y-0 right-0 pr-2.5 md:pr-4 flex items-center pointer-events-none'>
                          <span className='text-xs font-semibold text-green-500'>✓</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Engine/Motor Number */}
                  <div className='group'>
                    <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1.5 md:mb-2'>
                      Engine/Motor Number
                    </label>
                    <div className='relative'>
                      <div className='absolute inset-y-0 left-0 pl-2.5 md:pl-4 flex items-center pointer-events-none'>
                        <svg className='w-4 h-4 md:w-5 md:h-5 text-indigo-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13 10V3L4 14h7v7l9-11h-7z' />
                        </svg>
                      </div>
                      <input
                        type='text'
                        name='engineNumber'
                        value={formData.engineNumber}
                        onChange={handleChange}
                        onKeyDown={handleKeyDown}
                        placeholder='Enter engine/motor number'
                        className='w-full pl-9 md:pl-12 pr-2.5 md:pr-4 py-1.5 md:py-2 text-xs md:text-sm bg-white border-2 border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 uppercase font-semibold text-gray-800 placeholder-gray-400'
                      />
                    </div>
                  </div>

                  {/* Maker Name */}
                  <div className='group'>
                    <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1.5 md:mb-2'>
                      Maker Name
                    </label>
                    <div className='relative'>
                      <div className='absolute inset-y-0 left-0 pl-2.5 md:pl-4 flex items-center pointer-events-none'>
                        <svg className='w-4 h-4 md:w-5 md:h-5 text-indigo-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' />
                        </svg>
                      </div>
                      <input
                        type='text'
                        name='makerName'
                        value={formData.makerName}
                        onChange={handleChange}
                        onKeyDown={handleKeyDown}
                        placeholder='e.g., Maruti Suzuki, Tata, Honda'
                        className='w-full pl-9 md:pl-12 pr-2.5 md:pr-4 py-1.5 md:py-2 text-xs md:text-sm bg-white border-2 border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 uppercase font-semibold text-gray-800 placeholder-gray-400'
                      />
                    </div>
                  </div>

                  {/* Maker Model */}
                  <div className='group'>
                    <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1.5 md:mb-2'>
                      Maker Model
                    </label>
                    <div className='relative'>
                      <div className='absolute inset-y-0 left-0 pl-2.5 md:pl-4 flex items-center pointer-events-none'>
                        <svg className='w-4 h-4 md:w-5 md:h-5 text-indigo-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' />
                        </svg>
                      </div>
                      <input
                        type='text'
                        name='makerModel'
                        value={formData.makerModel}
                        onChange={handleChange}
                        onKeyDown={handleKeyDown}
                        placeholder='e.g., Maruti Swift DXI'
                        className='w-full pl-9 md:pl-12 pr-2.5 md:pr-4 py-1.5 md:py-2 text-xs md:text-sm bg-white border-2 border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 uppercase font-semibold text-gray-800 placeholder-gray-400'
                      />
                    </div>
                  </div>

                  {/* Colour */}
                  <div className='group'>
                    <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1.5 md:mb-2'>
                      Colour
                    </label>
                    <div className='relative'>
                      <div className='absolute inset-y-0 left-0 pl-2.5 md:pl-4 flex items-center pointer-events-none'>
                        <svg className='w-4 h-4 md:w-5 md:h-5 text-indigo-400' fill='currentColor' viewBox='0 0 20 20'>
                          <path fillRule='evenodd' d='M4 2a2 2 0 00-2 2v11a3 3 0 106 0V4a2 2 0 00-2-2H4zm1 14a1 1 0 100-2 1 1 0 000 2zm5-1.757l4.9-4.9a2 2 0 000-2.828L13.485 5.1a2 2 0 00-2.828 0L10 5.757v8.486zM16 18H9.071l6-6H16a2 2 0 012 2v2a2 2 0 01-2 2z' clipRule='evenodd' />
                        </svg>
                      </div>
                      <input
                        type='text'
                        name='colour'
                        value={formData.colour}
                        onChange={handleChange}
                        onKeyDown={handleKeyDown}
                        placeholder='e.g., White, Red, Blue'
                        className='w-full pl-9 md:pl-12 pr-2.5 md:pr-4 py-1.5 md:py-2 text-xs md:text-sm bg-white border-2 border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 uppercase font-semibold text-gray-800 placeholder-gray-400'
                      />
                    </div>
                  </div>

                  {/* Seating Capacity */}
                  <div className='group'>
                    <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1.5 md:mb-2'>
                      Seating Capacity
                    </label>
                    <div className='relative'>
                      <div className='absolute inset-y-0 left-0 pl-2.5 md:pl-4 flex items-center pointer-events-none'>
                        <svg className='w-4 h-4 md:w-5 md:h-5 text-indigo-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' />
                        </svg>
                      </div>
                      <input
                        type='number'
                        name='seatingCapacity'
                        value={formData.seatingCapacity}
                        onChange={handleChange}
                        onKeyDown={handleKeyDown}
                        placeholder='e.g., 5, 7, 50'
                        className='w-full pl-9 md:pl-12 pr-2.5 md:pr-4 py-1.5 md:py-2 text-xs md:text-sm bg-white border-2 border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 font-semibold text-gray-800 placeholder-gray-400'
                      />
                    </div>
                  </div>

                  {/* Vehicle Type */}
                  <div className='group'>
                    <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1.5 md:mb-2'>
                      Vehicle Type
                    </label>
                    <div className='relative'>
                      <div className='absolute inset-y-0 left-0 pl-2.5 md:pl-4 flex items-center pointer-events-none'>
                        <svg className='w-4 h-4 md:w-5 md:h-5 text-indigo-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' />
                        </svg>
                      </div>
                      <select
                        name='vehicleType'
                        value={formData.vehicleType}
                        onChange={handleChange}
                        onKeyDown={handleKeyDown}
                        className='w-full pl-9 md:pl-12 pr-8 md:pr-10 py-1.5 md:py-2 text-xs md:text-sm bg-white border-2 border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 font-semibold text-gray-800 appearance-none cursor-pointer'
                      >
                        <option value=''>Select Vehicle Type</option>
                        <option value='Transport'>Transport</option>
                        <option value='Non-Transport'>Non-Transport</option>
                      </select>
                      <div className='absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none'>
                        <svg className='w-5 h-5 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Vehicle Category */}
                  <div className='group'>
                    <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1.5 md:mb-2'>
                      Vehicle Category
                    </label>
                    <div className='relative'>
                      <div className='absolute inset-y-0 left-0 pl-2.5 md:pl-4 flex items-center pointer-events-none'>
                        <svg className='w-4 h-4 md:w-5 md:h-5 text-indigo-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z' />
                        </svg>
                      </div>
                      <select
                        name='vehicleCategory'
                        value={formData.vehicleCategory}
                        onChange={handleChange}
                        onKeyDown={handleKeyDown}
                        className='w-full pl-9 md:pl-12 pr-8 md:pr-10 py-1.5 md:py-2 text-xs md:text-sm bg-white border-2 border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 font-semibold text-gray-800 appearance-none cursor-pointer'
                      >
                        <option value=''>Select Category</option>
                        <option value='LMV'>LMV (Light Motor Vehicle)</option>
                        <option value='MMV'>MMV (Medium Motor Vehicle)</option>
                        <option value='HMV'>HMV (Heavy Motor Vehicle)</option>
                        <option value='HGV'>HGV (Heavy Goods Vehicle)</option>
                        <option value='MGV'>MGV (Medium Goods Vehicle)</option>
                        <option value='LGV'>LGV (Light Goods Vehicle)</option>
                        <option value='MCWG'>MCWG (Motor Cycle With Gear)</option>
                        <option value='MCWOG'>MCWOG (Motor Cycle Without Gear)</option>
                        <option value='LMV-NT'>LMV-NT (Non-Transport)</option>
                        <option value='LMV-TR'>LMV-TR (Light Motor Vehicle - Transport)</option>
                        <option value='Motor Cab'>Motor Cab</option>
                        <option value='Multiaxle Trailer'>Multiaxle Trailer</option>
                        <option value='Tractor'>Tractor</option>
                        <option value='Construction Vehicle'>Construction Vehicle</option>
                        <option value='E-Rickshaw'>E-Rickshaw (Electric Rickshaw)</option>
                      </select>
                      <div className='absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none'>
                        <svg className='w-5 h-5 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Laden Weight */}
                  <div className='group'>
                    <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1.5 md:mb-2'>
                      Laden Weight (kg)
                    </label>
                    <div className='relative'>
                      <div className='absolute inset-y-0 left-0 pl-2.5 md:pl-4 flex items-center pointer-events-none'>
                        <svg className='w-4 h-4 md:w-5 md:h-5 text-indigo-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3' />
                        </svg>
                      </div>
                      <input
                        type='number'
                        name='ladenWeight'
                        value={formData.ladenWeight}
                        onChange={handleChange}
                        onKeyDown={handleKeyDown}
                        placeholder='e.g., 2500'
                        className='w-full pl-9 md:pl-12 pr-2.5 md:pr-4 py-1.5 md:py-2 text-xs md:text-sm bg-white border-2 border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 font-semibold text-gray-800 placeholder-gray-400'
                      />
                    </div>
                  </div>

                  {/* Unladen Weight */}
                  <div className='group'>
                    <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1.5 md:mb-2'>
                      Unladen Weight (kg)
                    </label>
                    <div className='relative'>
                      <div className='absolute inset-y-0 left-0 pl-2.5 md:pl-4 flex items-center pointer-events-none'>
                        <svg className='w-4 h-4 md:w-5 md:h-5 text-indigo-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3' />
                        </svg>
                      </div>
                      <input
                        type='number'
                        name='unladenWeight'
                        value={formData.unladenWeight}
                        onChange={handleChange}
                        onKeyDown={handleKeyDown}
                        placeholder='e.g., 1200'
                        className='w-full pl-9 md:pl-12 pr-2.5 md:pr-4 py-1.5 md:py-2 text-xs md:text-sm bg-white border-2 border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 font-semibold text-gray-800 placeholder-gray-400'
                      />
                    </div>
                  </div>

                  {/* Manufacture Year */}
                  <div className='group'>
                    <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1.5 md:mb-2'>
                      Manufacture Year
                    </label>
                    <div className='relative'>
                      <div className='absolute inset-y-0 left-0 pl-2.5 md:pl-4 flex items-center pointer-events-none'>
                        <svg className='w-4 h-4 md:w-5 md:h-5 text-indigo-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' />
                        </svg>
                      </div>
                      <select
                        name='manufactureYear'
                        value={formData.manufactureYear}
                        onChange={handleChange}
                        onKeyDown={handleKeyDown}
                        className='w-full pl-9 md:pl-12 pr-8 md:pr-10 py-1.5 md:py-2 text-xs md:text-sm bg-white border-2 border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 font-semibold text-gray-800 appearance-none cursor-pointer'
                      >
                        <option value=''>Select Year</option>
                        {Array.from({ length: 60 }, (_, i) => new Date().getFullYear() - i).map(year => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                      <div className='absolute inset-y-0 right-0 pr-2.5 md:pr-4 flex items-center pointer-events-none'>
                        <svg className='w-4 h-4 md:w-5 md:h-5 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Number of Cylinders */}
                  <div className='group'>
                    <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1.5 md:mb-2'>
                      No. of Cylinders
                    </label>
                    <div className='relative'>
                      <div className='absolute inset-y-0 left-0 pl-2.5 md:pl-4 flex items-center pointer-events-none'>
                        <svg className='w-4 h-4 md:w-5 md:h-5 text-indigo-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' />
                        </svg>
                      </div>
                      <input
                        type='number'
                        name='numberOfCylinders'
                        value={formData.numberOfCylinders}
                        onChange={handleChange}
                        onKeyDown={handleKeyDown}
                        placeholder='e.g., 4, 6, 8'
                        className='w-full pl-9 md:pl-12 pr-2.5 md:pr-4 py-1.5 md:py-2 text-xs md:text-sm bg-white border-2 border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 font-semibold text-gray-800 placeholder-gray-400'
                      />
                    </div>
                  </div>

                  {/* Cubic Capacity (CC) */}
                  <div className='group'>
                    <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1.5 md:mb-2'>
                      Cubic Capacity (CC)
                    </label>
                    <div className='relative'>
                      <div className='absolute inset-y-0 left-0 pl-2.5 md:pl-4 flex items-center pointer-events-none'>
                        <svg className='w-4 h-4 md:w-5 md:h-5 text-indigo-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13 10V3L4 14h7v7l9-11h-7z' />
                        </svg>
                      </div>
                      <input
                        type='number'
                        name='cubicCapacity'
                        value={formData.cubicCapacity}
                        onChange={handleChange}
                        onKeyDown={handleKeyDown}
                        placeholder='e.g., 1200, 1500, 2000'
                        className='w-full pl-9 md:pl-12 pr-2.5 md:pr-4 py-1.5 md:py-2 text-xs md:text-sm bg-white border-2 border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 font-semibold text-gray-800 placeholder-gray-400'
                      />
                    </div>
                  </div>

                  {/* Fuel Type */}
                  <div className='group'>
                    <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1.5 md:mb-2'>
                      Fuel Type
                    </label>
                    <div className='relative'>
                      <div className='absolute inset-y-0 left-0 pl-2.5 md:pl-4 flex items-center pointer-events-none'>
                        <svg className='w-4 h-4 md:w-5 md:h-5 text-indigo-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13 10V3L4 14h7v7l9-11h-7z' />
                        </svg>
                      </div>
                      <select
                        name='fuelType'
                        value={formData.fuelType}
                        onChange={handleChange}
                        onKeyDown={handleKeyDown}
                        className='w-full pl-9 md:pl-12 pr-8 md:pr-10 py-1.5 md:py-2 text-xs md:text-sm bg-white border-2 border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 font-semibold text-gray-800 appearance-none cursor-pointer'
                      >
                        <option value=''>Select Fuel Type</option>
                        <option value='Petrol'>Petrol</option>
                        <option value='Diesel'>Diesel</option>
                        <option value='CNG'>CNG</option>
                        <option value='LPG'>LPG</option>
                        <option value='Electric'>Electric</option>
                        <option value='Hybrid'>Hybrid</option>
                        <option value='Petrol+CNG'>Petrol+CNG</option>
                        <option value='Petrol+LPG'>Petrol+LPG</option>
                      </select>
                      <div className='absolute inset-y-0 right-0 pr-2.5 md:pr-4 flex items-center pointer-events-none'>
                        <svg className='w-4 h-4 md:w-5 md:h-5 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Body Type */}
                  <div className='group'>
                    <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1.5 md:mb-2'>
                      Body Type
                    </label>
                    <div className='relative'>
                      <div className='absolute inset-y-0 left-0 pl-2.5 md:pl-4 flex items-center pointer-events-none'>
                        <svg className='w-4 h-4 md:w-5 md:h-5 text-indigo-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' />
                        </svg>
                      </div>
                      <input
                        type='text'
                        name='bodyType'
                        value={formData.bodyType}
                        onChange={handleChange}
                        onKeyDown={handleKeyDown}
                        placeholder='e.g., Sedan, SUV, Truck'
                        className='w-full pl-9 md:pl-12 pr-2.5 md:pr-4 py-1.5 md:py-2 text-xs md:text-sm bg-white border-2 border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 uppercase font-semibold text-gray-800 placeholder-gray-400'
                      />
                    </div>
                  </div>

                  {/* Wheel Base */}
                  <div className='group'>
                    <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1.5 md:mb-2'>
                      Wheel Base (mm)
                    </label>
                    <div className='relative'>
                      <div className='absolute inset-y-0 left-0 pl-2.5 md:pl-4 flex items-center pointer-events-none'>
                        <svg className='w-4 h-4 md:w-5 md:h-5 text-indigo-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' />
                        </svg>
                      </div>
                      <input
                        type='number'
                        name='wheelBase'
                        value={formData.wheelBase}
                        onChange={handleChange}
                        onKeyDown={handleKeyDown}
                        placeholder='e.g., 2400, 2600'
                        className='w-full pl-9 md:pl-12 pr-2.5 md:pr-4 py-1.5 md:py-2 text-xs md:text-sm bg-white border-2 border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 font-semibold text-gray-800 placeholder-gray-400'
                      />
                    </div>
                  </div>

                </div>
              </div>
            </div>

            {/* Owner Details Section */}
            <div className='mb-4 md:mb-8'>
              <div className='flex flex-wrap items-center gap-3 md:gap-4 mb-3 md:mb-6'>
                <div className='bg-gradient-to-br from-purple-500 to-pink-600 p-1.5 md:p-2.5 rounded-lg md:rounded-xl shadow-lg'>
                  <svg className='w-4 h-4 md:w-6 md:h-6 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' />
                  </svg>
                </div>
                <div>
                  <h3 className='text-sm md:text-xl font-bold text-gray-800'>Party / Owner Details</h3>
                </div>
                {selectedPartyName && (
                  <div className='flex items-center gap-1.5 bg-green-100 text-green-700 px-2.5 py-1.5 rounded-lg text-xs md:text-sm font-medium'>
                    <svg className='w-3.5 h-3.5 md:w-4 md:h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
                    </svg>
                    <span className='hidden md:inline'>{selectedPartyName}</span>
                    <span className='md:hidden'>{selectedPartyName.length > 12 ? selectedPartyName.substring(0, 12) + '...' : selectedPartyName}</span>
                    <button
                      type='button'
                      onClick={clearPartySelection}
                      className='ml-0.5 hover:text-green-900'
                    >
                      <svg className='w-3.5 h-3.5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
              <div className='bg-gradient-to-br from-purple-50 to-pink-50 p-3 md:p-6 rounded-xl md:rounded-2xl border border-purple-100'>
                {/* Row 1: Party and Son/Wife/Daughter of */}
                <div className='grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-5 mb-3 md:mb-5'>
                  {/* Party selector */}
                  <div className='group'>
                    <label className='flex items-center justify-between gap-2 text-xs md:text-sm font-semibold text-gray-700 mb-1.5 md:mb-2'>
                      <span>
                        Party / Owner <span className='text-red-500'>*</span>
                        <span className='text-purple-500 text-[10px] md:text-xs font-normal'> (select from dropdown)</span>
                      </span>
                      <button
                        type='button'
                        onClick={openAddPartyModal}
                        className='hidden shrink-0 items-center gap-2 rounded-lg border border-purple-200 bg-white px-2.5 py-1 text-[10px] font-bold text-purple-700 shadow-sm transition hover:bg-purple-50 md:flex md:text-xs'
                        title='Create new party (Alt+N)'
                      >
                        <kbd className='rounded border border-purple-200 bg-purple-50 px-1.5 py-0.5 font-mono text-[10px] text-purple-800'>Alt+N</kbd>
                        <span>Create Party</span>
                      </button>
                    </label>
                    <div className='relative'>
                      <div className='absolute inset-y-0 left-0 pl-2.5 md:pl-4 flex items-center pointer-events-none'>
                        <svg className='w-4 h-4 md:w-5 md:h-5 text-purple-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' />
                        </svg>
                      </div>
                      <input
                        type='text'
                        name='partySearch'
                        value={formData.ownerName}
                        onChange={handleOwnerNameChange}
                        onKeyDown={handleKeyDown}
                        onFocus={handlePartySearchFocus}
                        onBlur={() => setTimeout(() => setShowPartySuggestions(false), 200)}
                        placeholder='Choose party from dropdown'
                        autoComplete='off'
                        className={`w-full pl-9 md:pl-12 pr-2.5 md:pr-4 py-1.5 md:py-2 text-xs md:text-sm bg-white border-2 rounded-lg md:rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 uppercase font-semibold text-gray-800 placeholder-gray-400 ${
                          formData.partyId ? 'border-green-300 bg-green-50' : 'border-gray-200'
                        }`}
                      />
                      {/* Party Suggestions Dropdown */}
                      {showPartySuggestions && filteredParties.length > 0 && (
                        <div className='absolute z-50 w-full mt-1 bg-white border-2 border-purple-200 rounded-xl shadow-lg max-h-48 overflow-y-auto'>
                          {filteredParties.map((party, index) => (
                            <button
                              key={party._id}
                              type='button'
                              onMouseDown={(e) => {
                                e.preventDefault()
                                handlePartySelect(party)
                              }}
                              onMouseEnter={() => setHighlightedIndex(index)}
                              className={`w-full px-3 py-2 text-left transition-colors border-b border-gray-100 last:border-b-0 ${
                                index === highlightedIndex
                                  ? 'bg-purple-100 border-l-4 border-l-purple-500'
                                  : 'hover:bg-purple-50'
                              }`}
                            >
                              <div className='font-semibold text-gray-800 text-xs md:text-sm'>{party.partyName}</div>
                              <div className='text-[10px] md:text-xs text-gray-500'>
                                {party.mobile && <span>{party.mobile}</span>}
                                {party.address && <span className='ml-2'>| {party.address.substring(0, 30)}...</span>}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                      {formData.ownerName && !formData.partyId && !showPartySuggestions && (
                        <div className='mt-1.5 flex items-start justify-between gap-2 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-2 text-[10px] text-amber-700 md:text-xs'>
                          <span>Select a party from the dropdown. Typed text will not be saved as owner.</span>
                          <button
                            type='button'
                            onMouseDown={(e) => {
                              e.preventDefault()
                              openAddPartyModal()
                            }}
                            className='shrink-0 font-bold text-amber-800 hover:text-amber-900'
                          >
                            Create
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Son/Wife/Daughter of */}
                  <div className='group'>
                    <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1.5 md:mb-2'>
                      Son/Wife/Daughter of
                    </label>
                    <div className='relative'>
                      <div className='absolute inset-y-0 left-0 pl-2.5 md:pl-4 flex items-center pointer-events-none'>
                        <svg className='w-4 h-4 md:w-5 md:h-5 text-purple-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' />
                        </svg>
                      </div>
                      <input
                        type='text'
                        name='sonWifeDaughterOf'
                        value={formData.sonWifeDaughterOf}
                        readOnly
                        tabIndex={-1}
                        placeholder='Selected party detail'
                        className={partyDetailInputClass}
                      />
                    </div>
                  </div>
                </div>

                {/* Row 2: Address, Mobile Number and Email */}
                <div className='grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-5'>
                  {/* Address - Takes 2 columns (50%) */}
                  <div className='group md:col-span-2'>
                    <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1.5 md:mb-2'>
                      Address
                    </label>
                    <div className='relative'>
                      <div className='absolute inset-y-0 left-0 pl-2.5 md:pl-4 flex items-center pointer-events-none'>
                        <svg className='w-4 h-4 md:w-5 md:h-5 text-purple-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z' />
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 11a3 3 0 11-6 0 3 3 0 016 0z' />
                        </svg>
                      </div>
                      <input
                        type='text'
                        name='address'
                        value={formData.address}
                        readOnly
                        tabIndex={-1}
                        placeholder='Selected party address'
                        className={partyDetailInputClass}
                      />
                    </div>
                  </div>

                  {/* Mobile Number - Takes 1 column (25%) */}
                  <div className='group md:col-span-1'>
                    <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1.5 md:mb-2'>
                      Mobile Number
                    </label>
                    <div className='relative'>
                      <div className='absolute inset-y-0 left-0 pl-2.5 md:pl-4 flex items-center pointer-events-none'>
                        <svg className='w-4 h-4 md:w-5 md:h-5 text-purple-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z' />
                        </svg>
                      </div>
                      <input
                        type='tel'
                        name='mobileNumber'
                        value={formData.mobileNumber}
                        readOnly
                        tabIndex={-1}
                        maxLength='10'
                        placeholder='Selected party mobile'
                        className={partyDetailInputClassNormalCase}
                      />
                    </div>
                  </div>

                  {/* Email - Takes 1 column (25%) */}
                  <div className='group md:col-span-1'>
                    <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1.5 md:mb-2'>
                      Email Address
                    </label>
                    <div className='relative'>
                      <div className='absolute inset-y-0 left-0 pl-2.5 md:pl-4 flex items-center pointer-events-none'>
                        <svg className='w-4 h-4 md:w-5 md:h-5 text-purple-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' />
                        </svg>
                      </div>
                      <input
                        type='email'
                        name='email'
                        value={formData.email}
                        readOnly
                        tabIndex={-1}
                        placeholder='Selected party email'
                        className={partyDetailInputClassNormalCase}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sub Party Details Section */}
            <div className='mb-4 md:mb-8'>
              <div className='flex items-center gap-2 md:gap-3 mb-3 md:mb-6'>
                <div className='bg-gradient-to-br from-fuchsia-500 to-rose-500 p-1.5 md:p-2.5 rounded-lg md:rounded-xl shadow-lg'>
                  <svg className='w-4 h-4 md:w-6 md:h-6 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' />
                  </svg>
                </div>
                <div>
                  <h3 className='text-sm md:text-xl font-bold text-gray-800'>Sub Party Details <span className='text-xs font-normal text-gray-500'>(Optional)</span></h3>
                  <p className='text-[10px] md:text-sm text-gray-500 hidden md:block'>Enter sub party name and mobile if applicable</p>
                </div>
              </div>
              <div className='bg-gradient-to-br from-fuchsia-50 to-rose-50 p-3 md:p-6 rounded-xl md:rounded-2xl border border-fuchsia-100'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-5'>
                  {/* Sub Party Name */}
                  <div className='group'>
                    <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1.5 md:mb-2'>
                      Sub Party Name
                    </label>
                    <div className='relative'>
                      <div className='absolute inset-y-0 left-0 pl-2.5 md:pl-4 flex items-center pointer-events-none'>
                        <svg className='w-4 h-4 md:w-5 md:h-5 text-fuchsia-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' />
                        </svg>
                      </div>
                      <input
                        type='text'
                        name='subPartyName'
                        value={formData.subPartyName}
                        onChange={handleChange}
                        onKeyDown={handleKeyDown}
                        placeholder='Enter sub party name'
                        className='w-full pl-9 md:pl-12 pr-2.5 md:pr-4 py-1.5 md:py-2 text-xs md:text-sm bg-white border-2 border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500 transition-all duration-200 uppercase font-semibold text-gray-800 placeholder-gray-400'
                      />
                    </div>
                  </div>

                  {/* Sub Party Mobile */}
                  <div className='group'>
                    <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1.5 md:mb-2'>
                      Sub Party Mobile
                    </label>
                    <div className='relative'>
                      <div className='absolute inset-y-0 left-0 pl-2.5 md:pl-4 flex items-center pointer-events-none'>
                        <svg className='w-4 h-4 md:w-5 md:h-5 text-fuchsia-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z' />
                        </svg>
                      </div>
                      <input
                        type='tel'
                        name='subPartyMobile'
                        value={formData.subPartyMobile}
                        onChange={handleChange}
                        onKeyDown={handleKeyDown}
                        maxLength='10'
                        placeholder='Enter 10-digit mobile number'
                        className='w-full pl-9 md:pl-12 pr-2.5 md:pr-4 py-1.5 md:py-2 text-xs md:text-sm bg-white border-2 border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500 transition-all duration-200 font-semibold text-gray-800 placeholder-gray-400'
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Document Upload Section */}
            <div className='mb-4 md:mb-8'>
              <div className='flex items-center gap-2 md:gap-3 mb-3 md:mb-6'>
                <div className='bg-gradient-to-br from-green-500 to-emerald-600 p-1.5 md:p-2.5 rounded-lg md:rounded-xl shadow-lg'>
                  <svg className='w-4 h-4 md:w-6 md:h-6 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' />
                  </svg>
                </div>
                <div>
                  <h3 className='text-sm md:text-xl font-bold text-gray-800'>Document Upload</h3>
                  <p className='text-[10px] md:text-sm text-gray-500 hidden md:block'>Upload RC, Aadhar, and PAN documents (Optional - Images auto-convert to WebP, PDFs supported)</p>
                </div>
              </div>
              <div className='bg-gradient-to-br from-green-50 to-emerald-50 p-3 md:p-6 rounded-xl md:rounded-2xl border border-green-100'>
                <div className='grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6'>
                  {/* RC Document — Preview Section */}
                  <div className='flex flex-col md:col-span-2'>
                    <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-2'>
                      RC Document
                      {rcImagePreview && <span className='text-green-600 ml-1'>(Front ✓)</span>}
                      {rcBackImagePreview && <span className='text-blue-600 ml-1'>(Back ✓)</span>}
                      {!rcImagePreview && !rcBackImagePreview && <span className='text-gray-400 text-[10px] ml-1'>Use Upload Front / Back buttons above</span>}
                    </label>
                    <div className='flex gap-3 min-h-[80px]'>
                      {/* Front preview */}
                      {rcImagePreview ? (
                        <div className='relative flex-1'>
                          <p className='text-[10px] text-center font-bold text-green-700 mb-1'>FRONT</p>
                          {rcImagePreview.startsWith('data:application/pdf') || rcImagePreview.includes('.pdf') ? (
                            <div className='w-full h-28 md:h-36 flex flex-col items-center justify-center bg-white rounded-lg border-2 border-green-300'>
                              <svg className='w-8 h-8 text-red-500 mb-1' fill='currentColor' viewBox='0 0 20 20'>
                                <path fillRule='evenodd' d='M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z' clipRule='evenodd' />
                              </svg>
                              <p className='text-xs font-semibold text-gray-600'>RC PDF</p>
                              <a href={rcImagePreview} target='_blank' rel='noopener noreferrer' className='text-xs text-blue-600 hover:underline mt-1'>View PDF</a>
                            </div>
                          ) : (
                            <img
                              src={rcImagePreview}
                              alt='RC Front'
                              onClick={() => setShowImageViewer(true)}
                              className='w-full h-28 md:h-36 object-contain bg-white rounded-lg border-2 border-green-300 cursor-pointer hover:border-green-500 transition-all'
                            />
                          )}
                          <button
                            type='button'
                            onClick={handleRemoveImage}
                            className='absolute -top-2 -right-2 bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 transition-all shadow-lg'
                            title='Remove RC front'
                          >
                            <svg className='w-3 h-3' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <div className='flex-1 flex items-center justify-center h-28 md:h-36 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50'>
                          <p className='text-[10px] text-gray-400 text-center px-2'>No front uploaded yet</p>
                        </div>
                      )}

                      {/* Back preview — only for images */}
                      {!rcImagePreview?.includes('.pdf') && !rcImagePreview?.startsWith('data:application/pdf') && (
                        rcBackImagePreview ? (
                          <div className='relative flex-1'>
                            <p className='text-[10px] text-center font-bold text-blue-700 mb-1'>BACK</p>
                            <img
                              src={rcBackImagePreview}
                              alt='RC Back'
                              className='w-full h-28 md:h-36 object-contain bg-white rounded-lg border-2 border-blue-300 cursor-pointer hover:border-blue-500 transition-all'
                            />
                            <button
                              type='button'
                              onClick={() => { setRcBackImagePreview(null); setFormData(prev => ({ ...prev, rcBackImage: '' })) }}
                              className='absolute -top-2 -right-2 bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 transition-all shadow-lg'
                              title='Remove RC back'
                            >
                              <svg className='w-3 h-3' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                              </svg>
                            </button>
                          </div>
                        ) : (
                          <div className='flex-1 flex items-center justify-center h-28 md:h-36 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50'>
                            <p className='text-[10px] text-gray-400 text-center px-2'>No back uploaded yet</p>
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  {/* Aadhar Document Upload */}
                  <div className='flex flex-col'>
                    <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-2'>
                      Aadhar Document {aadharImagePreview && <span className='text-green-600'>(Uploaded)</span>}
                    </label>
                    <div className='relative flex-1'>
                      {!aadharImagePreview ? (
                        <>
                          <input
                            type='file'
                            accept='image/*,application/pdf'
                            onChange={handleAadharUpload}
                            disabled={uploadingAadhar}
                            className='hidden'
                            id='aadharImageInput'
                          />
                          <label
                            htmlFor='aadharImageInput'
                            className={`flex flex-col items-center justify-center w-full h-32 md:h-40 border-2 border-dashed rounded-lg cursor-pointer transition-all duration-200 ${
                              uploadingAadhar
                                ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
                                : 'border-blue-300 bg-white hover:bg-blue-50 hover:border-blue-400'
                            }`}
                          >
                            {uploadingAadhar ? (
                              <div className='flex flex-col items-center'>
                                <svg className='animate-spin h-8 w-8 text-blue-600 mb-2' fill='none' viewBox='0 0 24 24'>
                                  <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' />
                                  <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z' />
                                </svg>
                                <p className='text-sm text-gray-600 font-semibold'>Uploading...</p>
                              </div>
                            ) : (
                              <>
                                <svg className='w-10 h-10 md:w-12 md:h-12 text-blue-400 mb-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12' />
                                </svg>
                                <p className='text-xs md:text-sm text-gray-600 font-semibold mb-1'>Upload Aadhar</p>
                                <p className='text-[10px] md:text-xs text-gray-500'>Image or PDF</p>
                                <p className='text-[10px] text-blue-600 font-semibold mt-1'>Max 12MB</p>
                              </>
                            )}
                          </label>
                        </>
                      ) : (
                        <div className='relative'>
                          {aadharImagePreview.startsWith('data:application/pdf') || aadharImagePreview.includes('.pdf') ? (
                            <div className='w-full h-32 md:h-40 flex flex-col items-center justify-center bg-white rounded-lg border-2 border-blue-300'>
                              <svg className='w-12 h-12 md:w-16 md:h-16 text-red-500 mb-2' fill='currentColor' viewBox='0 0 20 20'>
                                <path fillRule='evenodd' d='M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z' clipRule='evenodd' />
                              </svg>
                              <p className='text-xs md:text-sm font-semibold text-gray-600'>Aadhar PDF</p>
                              <a
                                href={aadharImagePreview}
                                target='_blank'
                                rel='noopener noreferrer'
                                className='text-xs text-blue-600 hover:underline mt-1'
                              >
                                View PDF
                              </a>
                            </div>
                          ) : (
                            <img
                              src={aadharImagePreview}
                              alt='Aadhar Preview'
                              className='w-full h-32 md:h-40 object-contain bg-white rounded-lg border-2 border-blue-300 cursor-pointer hover:border-blue-500 transition-all'
                            />
                          )}
                          <button
                            type='button'
                            onClick={handleRemoveAadhar}
                            className='absolute -top-2 -right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-all shadow-lg'
                            title='Delete Aadhar document'
                          >
                            <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* PAN Document Upload */}
                  <div className='flex flex-col'>
                    <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-2'>
                      PAN Document {panImagePreview && <span className='text-green-600'>(Uploaded)</span>}
                    </label>
                    <div className='relative flex-1'>
                      {!panImagePreview ? (
                        <>
                          <input
                            type='file'
                            accept='image/*,application/pdf'
                            onChange={handlePanUpload}
                            disabled={uploadingPan}
                            className='hidden'
                            id='panImageInput'
                          />
                          <label
                            htmlFor='panImageInput'
                            className={`flex flex-col items-center justify-center w-full h-32 md:h-40 border-2 border-dashed rounded-lg cursor-pointer transition-all duration-200 ${
                              uploadingPan
                                ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
                                : 'border-purple-300 bg-white hover:bg-purple-50 hover:border-purple-400'
                            }`}
                          >
                            {uploadingPan ? (
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
                                <p className='text-xs md:text-sm text-gray-600 font-semibold mb-1'>Upload PAN</p>
                                <p className='text-[10px] md:text-xs text-gray-500'>Image or PDF</p>
                                <p className='text-[10px] text-purple-600 font-semibold mt-1'>Max 12MB</p>
                              </>
                            )}
                          </label>
                        </>
                      ) : (
                        <div className='relative'>
                          {panImagePreview.startsWith('data:application/pdf') || panImagePreview.includes('.pdf') ? (
                            <div className='w-full h-32 md:h-40 flex flex-col items-center justify-center bg-white rounded-lg border-2 border-purple-300'>
                              <svg className='w-12 h-12 md:w-16 md:h-16 text-red-500 mb-2' fill='currentColor' viewBox='0 0 20 20'>
                                <path fillRule='evenodd' d='M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z' clipRule='evenodd' />
                              </svg>
                              <p className='text-xs md:text-sm font-semibold text-gray-600'>PAN PDF</p>
                              <a
                                href={panImagePreview}
                                target='_blank'
                                rel='noopener noreferrer'
                                className='text-xs text-blue-600 hover:underline mt-1'
                              >
                                View PDF
                              </a>
                            </div>
                          ) : (
                            <img
                              src={panImagePreview}
                              alt='PAN Preview'
                              className='w-full h-32 md:h-40 object-contain bg-white rounded-lg border-2 border-purple-300 cursor-pointer hover:border-purple-500 transition-all'
                            />
                          )}
                          <button
                            type='button'
                            onClick={handleRemovePan}
                            className='absolute -top-2 -right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-all shadow-lg'
                            title='Delete PAN document'
                          >
                            <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Speed Governor Document Upload */}
                  <div className='flex flex-col'>
                    <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-2'>
                      Speed Governor {speedGovernorImagePreview && <span className='text-green-600'>(Uploaded)</span>}
                    </label>
                    <div className='relative flex-1'>
                      {!speedGovernorImagePreview ? (
                        <>
                          <input
                            type='file'
                            accept='image/*,application/pdf'
                            onChange={handleSpeedGovernorUpload}
                            disabled={uploadingSpeedGovernor}
                            className='hidden'
                            id='speedGovernorImageInput'
                          />
                          <label
                            htmlFor='speedGovernorImageInput'
                            className={`flex flex-col items-center justify-center w-full h-32 md:h-40 border-2 border-dashed rounded-lg cursor-pointer transition-all duration-200 ${
                              uploadingSpeedGovernor
                                ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
                                : 'border-yellow-300 bg-white hover:bg-yellow-50 hover:border-yellow-400'
                            }`}
                          >
                            {uploadingSpeedGovernor ? (
                              <div className='flex flex-col items-center'>
                                <svg className='animate-spin h-8 w-8 text-yellow-600 mb-2' fill='none' viewBox='0 0 24 24'>
                                  <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' />
                                  <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z' />
                                </svg>
                                <p className='text-sm text-gray-600 font-semibold'>Uploading...</p>
                              </div>
                            ) : (
                              <>
                                <svg className='w-10 h-10 md:w-12 md:h-12 text-yellow-400 mb-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12' />
                                </svg>
                                <p className='text-xs md:text-sm text-gray-600 font-semibold mb-1'>Upload Speed Governor</p>
                                <p className='text-[10px] md:text-xs text-gray-500'>Image or PDF</p>
                                <p className='text-[10px] text-yellow-600 font-semibold mt-1'>Max 12MB</p>
                              </>
                            )}
                          </label>
                        </>
                      ) : (
                        <div className='relative'>
                          {speedGovernorImagePreview.startsWith('data:application/pdf') || speedGovernorImagePreview.includes('.pdf') ? (
                            <div className='w-full h-32 md:h-40 flex flex-col items-center justify-center bg-white rounded-lg border-2 border-yellow-300'>
                              <svg className='w-12 h-12 md:w-16 md:h-16 text-red-500 mb-2' fill='currentColor' viewBox='0 0 20 20'>
                                <path fillRule='evenodd' d='M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z' clipRule='evenodd' />
                              </svg>
                              <p className='text-xs md:text-sm font-semibold text-gray-600'>Speed Governor PDF</p>
                              <a
                                href={speedGovernorImagePreview}
                                target='_blank'
                                rel='noopener noreferrer'
                                className='text-xs text-blue-600 hover:underline mt-1'
                              >
                                View PDF
                              </a>
                            </div>
                          ) : (
                            <img
                              src={speedGovernorImagePreview}
                              alt='Speed Governor Preview'
                              className='w-full h-32 md:h-40 object-contain bg-white rounded-lg border-2 border-yellow-300 cursor-pointer hover:border-yellow-500 transition-all'
                            />
                          )}
                          <button
                            type='button'
                            onClick={handleRemoveSpeedGovernor}
                            className='absolute -top-2 -right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-all shadow-lg'
                            title='Delete Speed Governor document'
                          >
                            <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </form>
        </div>

        {/* Action Buttons - Fixed at bottom */}
        <div className='sticky bottom-0 bg-white border-t border-gray-200 px-3 md:px-6 py-2 md:py-3 shadow-lg z-10'>
          <div className='flex gap-2 md:gap-3 justify-end'>
            <button
              type='button'
              onClick={onClose}
              className='px-3 md:px-5 py-1.5 md:py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all duration-200 font-semibold border border-gray-200 hover:border-gray-300 flex items-center gap-1.5 md:gap-2 text-xs md:text-sm'
            >
              <svg className='w-3.5 h-3.5 md:w-4 md:h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
              </svg>
              <span className='hidden sm:inline'>Cancel</span>
            </button>
            <button
              type='submit'
              form='vehicle-registration-form'
              disabled={loading}
              className='px-3 md:px-5 py-1.5 md:py-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white rounded-lg hover:from-indigo-700 hover:via-purple-700 hover:to-pink-600 transition-all duration-200 font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 md:gap-2 shadow-md hover:shadow-lg text-xs md:text-sm'
            >
              {loading ? (
                <>
                  <svg className='animate-spin h-3.5 w-3.5 md:h-4 md:w-4' fill='none' viewBox='0 0 24 24'>
                    <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' />
                    <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z' />
                  </svg>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <svg className='w-3.5 h-3.5 md:w-4 md:h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' />
                  </svg>
                  <span className='hidden sm:inline'>{editData ? 'Update Registration' : 'Register Vehicle'}</span>
                  <span className='sm:hidden'>{editData ? 'Update' : 'Register'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Image Viewer Modal */}
      <ImageViewer
        isOpen={showImageViewer}
        onClose={() => setShowImageViewer(false)}
        imageUrl={rcImagePreview}
        title='RC Document Image'
      />

      {/* Add Party Modal */}
      {showAddPartyModal && (
        <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-3 md:p-4'>
          <div className='bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden'>
            {/* Header */}
            <div className='bg-purple-600 text-white px-4 py-3'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <div className='bg-white/20 p-1.5 rounded-lg'>
                    <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z' />
                    </svg>
                  </div>
                  <h3 className='text-base font-bold'>Add New Party</h3>
                </div>
                <button
                  type='button'
                  onClick={() => setShowAddPartyModal(false)}
                  className='text-white/80 hover:text-white hover:bg-white/20 p-1.5 rounded-lg transition-all'
                >
                  <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                  </svg>
                </button>
              </div>
            </div>

            {/* Form */}
            <div className='p-4 space-y-3 max-h-[65vh] overflow-y-auto'>
              {/* Party Name */}
              <div>
                <label className='block text-sm font-semibold text-gray-700 mb-1'>
                  Party Name <span className='text-red-500'>*</span>
                </label>
                <input
                  type='text'
                  name='partyName'
                  ref={partyNameRef}
                  value={newParty.partyName}
                  onChange={handleNewPartyChange}
                  onKeyDown={(e) => handlePartyKeyDown(e, partySWDRef)}
                  placeholder='Enter party/company name'
                  className='w-full px-3 py-2 text-sm bg-white border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all uppercase font-semibold text-gray-800 placeholder:font-normal placeholder-gray-400'
                />
              </div>

              {/* Son/Wife/Daughter of */}
              <div>
                <label className='block text-sm font-semibold text-gray-700 mb-1'>
                  S/o, W/o, D/o
                </label>
                <input
                  type='text'
                  name='sonWifeDaughterOf'
                  ref={partySWDRef}
                  value={newParty.sonWifeDaughterOf}
                  onChange={handleNewPartyChange}
                  onKeyDown={(e) => handlePartyKeyDown(e, partyMobileRef)}
                  placeholder='Father/Husband name'
                  className='w-full px-3 py-2 text-sm bg-white border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all uppercase font-semibold text-gray-800 placeholder:font-normal placeholder-gray-400'
                />
              </div>

              {/* Mobile */}
              <div>
                <label className='block text-sm font-semibold text-gray-700 mb-1'>
                  Mobile
                </label>
                <input
                  type='tel'
                  name='mobile'
                  ref={partyMobileRef}
                  value={newParty.mobile}
                  onChange={handleNewPartyChange}
                  onKeyDown={(e) => handlePartyKeyDown(e, partyEmailRef)}
                  maxLength='10'
                  placeholder='9876543210'
                  className='w-full px-3 py-2 text-sm bg-white border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all font-semibold text-gray-800 placeholder:font-normal placeholder-gray-400'
                />
              </div>

              {/* Email */}
              <div>
                <label className='block text-sm font-semibold text-gray-700 mb-1'>
                  Email
                </label>
                <input
                  type='email'
                  name='email'
                  ref={partyEmailRef}
                  value={newParty.email}
                  onChange={handleNewPartyChange}
                  onKeyDown={(e) => handlePartyKeyDown(e, partyAddressRef)}
                  placeholder='email@example.com'
                  className='w-full px-3 py-2 text-sm bg-white border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all font-semibold text-gray-800 placeholder:font-normal placeholder-gray-400'
                />
              </div>

              {/* Address */}
              <div>
                <label className='block text-sm font-semibold text-gray-700 mb-1'>
                  Address
                </label>
                <textarea
                  name='address'
                  ref={partyAddressRef}
                  value={newParty.address}
                  onChange={handleNewPartyChange}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      if (partySaveButtonRef.current) {
                        partySaveButtonRef.current.focus()
                      }
                    }
                  }}
                  rows='2'
                  placeholder='Complete address'
                  className='w-full px-3 py-2 text-sm bg-white border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all uppercase font-semibold text-gray-800 placeholder:font-normal placeholder-gray-400 resize-none'
                />
              </div>
            </div>

            {/* Footer */}
            <div className='flex gap-3 px-4 py-3 bg-gray-50 border-t border-gray-200'>
              <button
                type='button'
                onClick={() => setShowAddPartyModal(false)}
                className='flex-1 px-4 py-2 text-sm font-semibold text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-all'
              >
                Cancel
              </button>
              <button
                type='button'
                ref={partySaveButtonRef}
                onClick={handleSaveParty}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleSaveParty()
                  }
                }}
                disabled={savingParty || !newParty.partyName.trim()}
                className='flex-1 px-4 py-2 text-sm font-semibold text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2'
              >
                {savingParty ? (
                  <>
                    <svg className='animate-spin h-4 w-4' fill='none' viewBox='0 0 24 24'>
                      <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' />
                      <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z' />
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
                    <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
                    </svg>
                    Save Party
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {scanningFile && (
        <DocumentScannerPreview
          file={scanningFile}
          onCancel={() => setScanningFile(null)}
          onConfirm={handleScannerConfirm}
        />
      )}
      {scanningBackFile && (
        <DocumentScannerPreview
          file={scanningBackFile}
          onCancel={() => setScanningBackFile(null)}
          onConfirm={handleBackScannerConfirm}
        />
      )}
    </div>
  )
}

export default RegisterVehicleModal
