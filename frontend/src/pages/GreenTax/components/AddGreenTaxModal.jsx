import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { handleDateBlur, handleSmartDateInput } from '../../../utils/dateFormatter'
import { validateVehicleNumberRealtime } from '../../../utils/vehicleNoCheck'

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'

const AddGreenTaxModal = ({ isOpen, onClose, onSubmit, initialData, isEditMode = false, prefilledVehicleNumber = '', prefilledOwnerName = '', prefilledMobileNumber = '' }) => {
  const [fetchingVehicle, setFetchingVehicle] = useState(false)
  const [vehicleError, setVehicleError] = useState('')
  const [dateError, setDateError] = useState({ taxFrom: '', taxTo: '' })
  const [vehicleValidation, setVehicleValidation] = useState({ isValid: false, message: '' })
  const [paidExceedsTotal, setPaidExceedsTotal] = useState(false)
  const [vehicleMatches, setVehicleMatches] = useState([])
  const [showVehicleDropdown, setShowVehicleDropdown] = useState(false)
  const [selectedDropdownIndex, setSelectedDropdownIndex] = useState(0)
  const dropdownItemRefs = useRef([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadingDoc, setUploadingDoc] = useState(false)

  const [formData, setFormData] = useState({
    date: '',
    vehicleNumber: prefilledVehicleNumber,
    ownerName: prefilledOwnerName,
    mobileNumber: prefilledMobileNumber,
    partyId: '',
    totalAmount: '0',
    paidAmount: '0',
    balance: '0',
    taxFrom: '',
    taxTo: '',
    remarks: ''
  })
  const [greenTaxDocument, setGreenTaxDocument] = useState('')
  const [docPreview, setDocPreview] = useState(null)

  useEffect(() => {
    if (!isOpen) {
      if (!isEditMode) {
        setFormData({
          date: '', vehicleNumber: prefilledVehicleNumber, ownerName: prefilledOwnerName, mobileNumber: prefilledMobileNumber,
          partyId: '', totalAmount: '0', paidAmount: '0', balance: '0', taxFrom: '', taxTo: '', remarks: ''
        })
        setGreenTaxDocument('')
        setDocPreview(null)
        setDateError({ taxFrom: '', taxTo: '' })
        setVehicleError('')
        setFetchingVehicle(false)
        setVehicleMatches([])
        setShowVehicleDropdown(false)
        setSelectedDropdownIndex(0)
        setPaidExceedsTotal(false)
        setVehicleValidation({ isValid: false, message: '' })
      }
    }
  }, [isOpen, prefilledVehicleNumber, prefilledOwnerName, prefilledMobileNumber, isEditMode])

  useEffect(() => {
    if (isOpen && isEditMode && initialData) {
      setFormData({
        date: initialData.date || '',
        vehicleNumber: initialData.vehicleNumber || '',
        ownerName: initialData.ownerName || '',
        mobileNumber: initialData.mobileNumber || '',
        partyId: initialData.partyId || '',
        totalAmount: String(initialData.totalAmount || '0'),
        paidAmount: String(initialData.paidAmount || '0'),
        balance: String(initialData.balanceAmount || '0'),
        taxFrom: initialData.taxFrom || '',
        taxTo: initialData.taxTo || '',
        remarks: initialData.remarks || ''
      })
      if (initialData.greenTaxDocument) {
        setGreenTaxDocument(initialData.greenTaxDocument)
      }
    }
  }, [isOpen, isEditMode, initialData])

  useEffect(() => {
    if (isOpen && (prefilledVehicleNumber || prefilledOwnerName || prefilledMobileNumber)) {
      setFormData(prev => ({
        ...prev, vehicleNumber: prefilledVehicleNumber, ownerName: prefilledOwnerName, mobileNumber: prefilledMobileNumber
      }))
      if (prefilledVehicleNumber) setVehicleValidation({ isValid: true, message: 'Vehicle number prefilled' })
    }
  }, [isOpen, prefilledVehicleNumber, prefilledOwnerName, prefilledMobileNumber])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  useEffect(() => {
    const fetchVehicleDetails = async () => {
      const searchInput = formData.vehicleNumber.trim()
      if (searchInput.length < 4) {
        setVehicleError(''); setVehicleMatches([]); setShowVehicleDropdown(false); setSelectedDropdownIndex(0); return
      }
      setFetchingVehicle(true); setVehicleError('')
      try {
        const response = await axios.get(`${API_URL}/api/vehicle-registrations/search/${searchInput}`, { withCredentials: true })
        if (response.data.success) {
          if (response.data.multiple) {
            setVehicleMatches(response.data.data || [])
            setShowVehicleDropdown(true)
            setSelectedDropdownIndex(0)
            setVehicleError('')
          } else {
            const vehicle = response.data.data
            setFormData(prev => ({
              ...prev, ownerName: vehicle.ownerName || prev.ownerName, mobileNumber: vehicle.mobileNumber || prev.mobileNumber,
              partyId: vehicle.partyId || prev.partyId
            }))
            setVehicleMatches([]); setShowVehicleDropdown(false)
            setVehicleValidation({ isValid: true, message: 'Vehicle found' })
          }
        }
      } catch (e) {
        if (e.response?.status === 404) {
          setVehicleError('Vehicle not found. You can still enter details manually.')
          setVehicleMatches([]); setShowVehicleDropdown(false)
        } else { setVehicleError('Error searching vehicle') }
      } finally { setFetchingVehicle(false) }
    }
    if (formData.vehicleNumber.trim().length >= 4 && !vehicleValidation.isValid) {
      const timer = setTimeout(fetchVehicleDetails, 300)
      return () => clearTimeout(timer)
    }
  }, [formData.vehicleNumber])

  const handleSelectVehicle = (vehicle) => {
    setFormData(prev => ({
      ...prev, vehicleNumber: vehicle.vehicleNumber, ownerName: vehicle.ownerName || prev.ownerName,
      mobileNumber: vehicle.mobileNumber || prev.mobileNumber, partyId: vehicle.partyId || prev.partyId
    }))
    setVehicleMatches([]); setShowVehicleDropdown(false)
    setVehicleValidation({ isValid: true, message: 'Vehicle selected' })
    setVehicleError('')
  }

  const handlePaymentChange = (field, value) => {
    const total = field === 'totalAmount' ? parseFloat(value) || 0 : parseFloat(formData.totalAmount) || 0
    let paid = field === 'paidAmount' ? parseFloat(value) || 0 : parseFloat(formData.paidAmount) || 0
    if (field === 'paidAmount' && paid > total && total > 0) paid = total
    const balance = total - paid
    setFormData(prev => ({ ...prev, totalAmount: String(total), paidAmount: String(paid), balance: String(balance) }))
    if (paid > total && total > 0) setPaidExceedsTotal(true)
    else setPaidExceedsTotal(false)
  }

  const handleDateInput = (field, value) => {
    const result = handleSmartDateInput(value)
    setFormData(prev => ({ ...prev, [field]: result }))
  }

  const handleDateFieldBlur = (field, value) => {
    const corrected = handleDateBlur(value)
    setFormData(prev => ({ ...prev, [field]: corrected }))
    if (field === 'taxFrom' || field === 'taxTo') {
      setDateError(prev => ({ ...prev, [field]: corrected === value ? '' : 'Invalid date' }))
    }
  }

  const handleDocUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const maxSize = 12 * 1024 * 1024
    if (file.size > maxSize) {
      toast.error('File size exceeds 12MB limit')
      return
    }
    if (!['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(file.type)) {
      toast.error('Only JPG, PNG, WebP, and PDF formats are accepted')
      return
    }
    const reader = new FileReader()
    reader.onload = async (event) => {
      const base64Data = event.target.result
      setDocPreview(base64Data)
      setUploadingDoc(true)
      try {
        const response = await axios.post(`${API_URL}/api/upload/green-tax-document`,
          { imageData: base64Data, vehicleNumber: formData.vehicleNumber },
          { withCredentials: true }
        )
        if (response.data.success) {
          setGreenTaxDocument(response.data.data.path)
          toast.success('Document uploaded successfully')
        }
      } catch (error) {
        toast.error('Failed to upload document')
        setDocPreview(null)
      } finally { setUploadingDoc(false) }
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveDoc = () => {
    setGreenTaxDocument('')
    setDocPreview(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.vehicleNumber.trim()) {
      toast.error('Vehicle number is required')
      return
    }
    if (!formData.taxFrom.trim() || !formData.taxTo.trim()) {
      toast.error('Green tax period (from/to) is required')
      return
    }
    if (paidExceedsTotal) {
      toast.error('Paid amount cannot exceed total amount')
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        vehicleNumber: formData.vehicleNumber.toUpperCase(),
        ownerName: formData.ownerName,
        mobileNumber: formData.mobileNumber,
        date: formData.date,
        partyId: formData.partyId || undefined,
        totalAmount: parseFloat(formData.totalAmount) || 0,
        paidAmount: parseFloat(formData.paidAmount) || 0,
        balanceAmount: parseFloat(formData.balance) || 0,
        taxFrom: formData.taxFrom,
        taxTo: formData.taxTo,
        greenTaxDocument: greenTaxDocument || undefined,
        remarks: formData.remarks
      }

      let response
      if (isEditMode && initialData?._id) {
        response = await axios.put(`${API_URL}/api/green-tax/${initialData._id}`, payload, { withCredentials: true })
      } else {
        response = await axios.post(`${API_URL}/api/green-tax`, payload, { withCredentials: true })
      }

      if (response.data.success) {
        toast.success(response.data.message || `Green tax record ${isEditMode ? 'updated' : 'created'} successfully`)
        onSubmit && onSubmit()
        onClose()
      } else {
        toast.error(response.data.message || 'Failed to save green tax record')
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save green tax record')
    } finally { setIsSubmitting(false) }
  }

  if (!isOpen) return null

  return (
    <div className='fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-2 md:p-4'>
      <div className='bg-white rounded-xl md:rounded-2xl shadow-2xl max-w-2xl w-full max-h-[95vh] overflow-hidden flex flex-col'>
        <div className='bg-gradient-to-r from-green-600 to-emerald-600 p-3 md:p-4 text-white flex-shrink-0'>
          <div className='flex justify-between items-center'>
            <div>
              <h2 className='text-lg md:text-2xl font-bold'>{isEditMode ? 'Edit' : 'Add New'} Green Tax Record</h2>
              <p className='text-green-100 text-xs md:text-sm mt-1'>Record green tax payment details</p>
            </div>
            <button onClick={onClose} className='text-white hover:bg-white/20 rounded-lg p-1.5 md:p-2 transition cursor-pointer'>
              <svg className='w-5 h-5 md:w-6 md:h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className='flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-5'>
          <div className='bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4 md:p-5'>
            <h3 className='text-base md:text-lg font-bold text-gray-800 mb-3 flex items-center gap-2'>
              <span className='bg-green-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs'>1</span>
              Vehicle & Owner Details
            </h3>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 text-xs md:text-sm'>
              <div>
                <label className='block text-gray-500 font-medium mb-1'>Date of Work</label>
                <input type='text' placeholder='DD-MM-YYYY'
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: handleSmartDateInput(e.target.value) }))}
                  onBlur={(e) => { const d = handleDateBlur(e.target.value); setFormData(prev => ({ ...prev, date: d })) }}
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-800 focus:ring-2 focus:ring-green-500 focus:border-transparent'
                />
              </div>
              <div className='relative'>
                <label className='block text-gray-500 font-medium mb-1'>Vehicle Number <span className='text-red-500'>*</span></label>
                <input
                  type='text' placeholder='Enter vehicle number'
                  value={formData.vehicleNumber}
                  onChange={(e) => { setFormData(prev => ({ ...prev, vehicleNumber: e.target.value.toUpperCase() })); setVehicleValidation({ isValid: false, message: '' }) }}
                  className={`w-full px-3 py-2 border rounded-lg font-bold text-gray-800 uppercase focus:ring-2 focus:ring-green-500 focus:border-transparent ${vehicleError ? 'border-red-400' : vehicleValidation.isValid ? 'border-green-400' : 'border-gray-300'}`}
                  autoComplete='off'
                />
                {fetchingVehicle && <div className='absolute right-3 top-9'><div className='w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin'></div></div>}
                {vehicleError && <p className='text-red-500 text-[10px] mt-1'>{vehicleError}</p>}
                {vehicleValidation.isValid && <p className='text-green-600 text-[10px] mt-1'>✓ {vehicleValidation.message}</p>}
                {showVehicleDropdown && vehicleMatches.length > 0 && (
                  <div className='absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-40 overflow-y-auto'>
                    {vehicleMatches.map((v, idx) => (
                      <button key={v._id} type='button' ref={el => dropdownItemRefs.current[idx] = el}
                        className={`w-full text-left px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-green-50 transition ${idx === selectedDropdownIndex ? 'bg-green-50' : ''}`}
                        onClick={() => handleSelectVehicle(v)}
                      >{v.vehicleNumber} - {v.ownerName || 'N/A'}</button>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className='block text-gray-500 font-medium mb-1'>Owner Name</label>
                <input type='text' placeholder='Owner name'
                  value={formData.ownerName}
                  onChange={(e) => setFormData(prev => ({ ...prev, ownerName: e.target.value }))}
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-800 focus:ring-2 focus:ring-green-500 focus:border-transparent'
                />
              </div>
              <div>
                <label className='block text-gray-500 font-medium mb-1'>Mobile Number</label>
                <input type='text' placeholder='Mobile number'
                  value={formData.mobileNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, mobileNumber: e.target.value }))}
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-800 focus:ring-2 focus:ring-green-500 focus:border-transparent'
                />
              </div>
            </div>
          </div>

          <div className='bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-4 md:p-5'>
            <h3 className='text-base md:text-lg font-bold text-gray-800 mb-3 flex items-center gap-2'>
              <span className='bg-purple-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs'>2</span>
              Green Tax Period
            </h3>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 text-xs md:text-sm'>
              <div>
                <label className='block text-gray-500 font-medium mb-1'>Tax From <span className='text-red-500'>*</span></label>
                <input type='text' placeholder='DD-MM-YYYY'
                  value={formData.taxFrom}
                  onChange={(e) => handleDateInput('taxFrom', e.target.value)}
                  onBlur={(e) => handleDateFieldBlur('taxFrom', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg text-xs font-semibold text-gray-800 focus:ring-2 focus:ring-green-500 focus:border-transparent ${dateError.taxFrom ? 'border-red-400' : 'border-gray-300'}`}
                />
                {dateError.taxFrom && <p className='text-red-500 text-[10px] mt-1'>{dateError.taxFrom}</p>}
              </div>
              <div>
                <label className='block text-gray-500 font-medium mb-1'>Tax To <span className='text-red-500'>*</span></label>
                <input type='text' placeholder='DD-MM-YYYY'
                  value={formData.taxTo}
                  onChange={(e) => handleDateInput('taxTo', e.target.value)}
                  onBlur={(e) => handleDateFieldBlur('taxTo', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg text-xs font-semibold text-gray-800 focus:ring-2 focus:ring-green-500 focus:border-transparent ${dateError.taxTo ? 'border-red-400' : 'border-gray-300'}`}
                />
                {dateError.taxTo && <p className='text-red-500 text-[10px] mt-1'>{dateError.taxTo}</p>}
              </div>
            </div>
          </div>

          <div className='bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-xl p-4 md:p-5'>
            <h3 className='text-base md:text-lg font-bold text-gray-800 mb-3 flex items-center gap-2'>
              <span className='bg-amber-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs'>3</span>
              Payment Information
            </h3>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 text-xs md:text-sm'>
              <div>
                <label className='block text-gray-500 font-medium mb-1'>Total Amount <span className='text-red-500'>*</span></label>
                <input type='number' min='0' step='0.01' placeholder='0'
                  value={formData.totalAmount}
                  onChange={(e) => { handlePaymentChange('totalAmount', e.target.value) }}
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-bold text-gray-800 focus:ring-2 focus:ring-green-500 focus:border-transparent'
                />
              </div>
              <div>
                <label className='block text-gray-500 font-medium mb-1'>Paid Amount</label>
                <input type='number' min='0' step='0.01' placeholder='0'
                  value={formData.paidAmount}
                  onChange={(e) => { handlePaymentChange('paidAmount', e.target.value) }}
                  className={`w-full px-3 py-2 border rounded-lg text-xs font-bold text-gray-800 focus:ring-2 focus:ring-green-500 focus:border-transparent ${paidExceedsTotal ? 'border-red-400' : 'border-gray-300'}`}
                />
                {paidExceedsTotal && <p className='text-red-500 text-[10px] mt-1'>Paid exceeds total</p>}
              </div>
              <div>
                <label className='block text-gray-500 font-medium mb-1'>Balance</label>
                <input type='number' min='0' step='0.01' placeholder='0'
                  value={formData.balance}
                  onChange={(e) => { handlePaymentChange('balance', e.target.value) }}
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-bold text-gray-800 focus:ring-2 focus:ring-green-500 focus:border-transparent'
                />
              </div>
            </div>
          </div>

          <div className='bg-gradient-to-r from-sky-50 to-blue-50 border-2 border-sky-200 rounded-xl p-4 md:p-5'>
            <h3 className='text-base md:text-lg font-bold text-gray-800 mb-3 flex items-center gap-2'>
              <span className='bg-sky-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs'>4</span>
              Document Upload
            </h3>
            <div className='text-xs md:text-sm'>
              {!greenTaxDocument ? (
                <div className='flex items-center gap-3'>
                  <label className='flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-dashed border-sky-300 rounded-xl text-sky-700 font-semibold hover:bg-sky-50 hover:border-sky-400 transition-all cursor-pointer'>
                    <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12' />
                    </svg>
                    {uploadingDoc ? 'Uploading...' : 'Upload Document'}
                    <input type='file' accept='image/*,application/pdf' onChange={handleDocUpload} className='hidden' disabled={uploadingDoc} />
                  </label>
                  <span className='text-[10px] text-gray-400'>JPG, PNG, PDF (max 12MB)</span>
                </div>
              ) : (
                <div className='flex items-center gap-3'>
                  <span className='inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs font-semibold'>
                    <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
                    </svg>
                    Document uploaded
                  </span>
                  <button type='button' onClick={handleRemoveDoc} className='text-red-500 hover:text-red-600 text-xs font-semibold cursor-pointer'>Remove</button>
                </div>
              )}
              {docPreview && (
                <div className='mt-3 max-h-48 overflow-hidden rounded-lg border border-sky-200'>
                  {docPreview.startsWith('data:image') ? (
                    <img src={docPreview} alt='Preview' className='w-full h-48 object-contain bg-white' />
                  ) : (
                    <div className='flex items-center justify-center h-32 bg-white'>
                      <svg className='w-10 h-10 text-red-500' fill='currentColor' viewBox='0 0 20 20'>
                        <path fillRule='evenodd' d='M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z' clipRule='evenodd' />
                      </svg>
                      <span className='ml-2 text-xs text-gray-500 font-semibold'>PDF Document</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className='bg-gradient-to-r from-gray-50 to-slate-50 border-2 border-gray-200 rounded-xl p-4 md:p-5'>
            <h3 className='text-base md:text-lg font-bold text-gray-800 mb-3 flex items-center gap-2'>
              <span className='bg-gray-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs'>5</span>
              Remarks
            </h3>
            <textarea placeholder='Additional notes...' rows={2}
              value={formData.remarks}
              onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
              className='w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-800 focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none'
            />
          </div>

          <div className='flex justify-end gap-3 pt-2'>
            <button type='button' onClick={onClose}
              className='px-5 py-2.5 border border-gray-300 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 transition cursor-pointer'>
              Cancel
            </button>
            <button type='submit' disabled={isSubmitting}
              className='px-5 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl text-xs font-bold hover:shadow-lg transition disabled:opacity-50 cursor-pointer'>
              {isSubmitting ? 'Saving...' : isEditMode ? 'Update Record' : 'Save Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddGreenTaxModal
