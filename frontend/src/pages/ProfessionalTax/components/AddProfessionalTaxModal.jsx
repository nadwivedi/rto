import { useState, useEffect } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { handleDateBlur, handleSmartDateInput } from '../../../utils/dateFormatter'

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'

const AddProfessionalTaxModal = ({ isOpen, onClose, onSubmit, initialData, isEditMode = false }) => {
  const [paidExceedsTotal, setPaidExceedsTotal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadingDoc, setUploadingDoc] = useState(false)
  const [dateError, setDateError] = useState({ taxFrom: '', taxTo: '' })

  const [formData, setFormData] = useState({
    date: '',
    ownerName: '',
    grnNo: '',
    dealerTIN: '',
    totalAmount: '0',
    paidAmount: '0',
    balance: '0',
    taxFrom: '',
    taxTo: '',
    remarks: ''
  })
  const [professionalTaxDocument, setProfessionalTaxDocument] = useState('')
  const [docPreview, setDocPreview] = useState(null)

  useEffect(() => {
    if (!isOpen) {
      if (!isEditMode) {
        setFormData({ date: '', ownerName: '', grnNo: '', dealerTIN: '', totalAmount: '0', paidAmount: '0', balance: '0', taxFrom: '', taxTo: '', remarks: '' })
        setProfessionalTaxDocument('')
        setDocPreview(null)
        setPaidExceedsTotal(false)
        setDateError({ taxFrom: '', taxTo: '' })
      }
    }
  }, [isOpen, isEditMode])

  useEffect(() => {
    if (isOpen && isEditMode && initialData) {
      setFormData({
        date: initialData.date || '',
        ownerName: initialData.ownerName || '',
        grnNo: initialData.grnNo || '',
        dealerTIN: initialData.dealerTIN || '',
        totalAmount: String(initialData.totalAmount || '0'),
        paidAmount: String(initialData.paidAmount || '0'),
        balance: String(initialData.balanceAmount || '0'),
        taxFrom: initialData.taxFrom || '',
        taxTo: initialData.taxTo || '',
        remarks: initialData.remarks || ''
      })
      if (initialData.professionalTaxDocument) {
        setProfessionalTaxDocument(initialData.professionalTaxDocument)
      }
    }
  }, [isOpen, isEditMode, initialData])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

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
        const response = await axios.post(`${API_URL}/api/upload/professional-tax-document`,
          { imageData: base64Data, professionalTaxId: initialData?._id || undefined },
          { withCredentials: true }
        )
        if (response.data.success) {
          setProfessionalTaxDocument(response.data.data.path)
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
    setProfessionalTaxDocument('')
    setDocPreview(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.taxFrom.trim() || !formData.taxTo.trim()) {
      toast.error('Professional tax period (from/to) is required')
      return
    }
    if (paidExceedsTotal) {
      toast.error('Paid amount cannot exceed total amount')
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        date: formData.date,
        ownerName: formData.ownerName,
        grnNo: formData.grnNo,
        dealerTIN: formData.dealerTIN,
        totalAmount: parseFloat(formData.totalAmount) || 0,
        paidAmount: parseFloat(formData.paidAmount) || 0,
        balanceAmount: parseFloat(formData.balance) || 0,
        taxFrom: formData.taxFrom,
        taxTo: formData.taxTo,
        professionalTaxDocument: professionalTaxDocument || undefined,
        remarks: formData.remarks
      }

      let response
      if (isEditMode && initialData?._id) {
        response = await axios.put(`${API_URL}/api/professional-tax/${initialData._id}`, payload, { withCredentials: true })
      } else {
        response = await axios.post(`${API_URL}/api/professional-tax`, payload, { withCredentials: true })
      }

      if (response.data.success) {
        toast.success(response.data.message || `Professional tax record ${isEditMode ? 'updated' : 'created'} successfully`)
        onSubmit && onSubmit()
        onClose()
      } else {
        toast.error(response.data.message || 'Failed to save professional tax record')
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save professional tax record')
    } finally { setIsSubmitting(false) }
  }

  if (!isOpen) return null

  return (
    <div className='fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-2 md:p-4'>
      <div className='bg-white rounded-xl md:rounded-2xl shadow-2xl max-w-2xl w-full max-h-[95vh] overflow-hidden flex flex-col'>
        <div className='bg-gradient-to-r from-indigo-600 to-violet-600 p-3 md:p-4 text-white flex-shrink-0'>
          <div className='flex justify-between items-center'>
            <div>
              <h2 className='text-lg md:text-2xl font-bold'>{isEditMode ? 'Edit' : 'Add New'} Professional Tax Record</h2>
              <p className='text-indigo-100 text-xs md:text-sm mt-1'>Record professional tax details</p>
            </div>
            <button onClick={onClose} className='text-white hover:bg-white/20 rounded-lg p-1.5 md:p-2 transition cursor-pointer'>
              <svg className='w-5 h-5 md:w-6 md:h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className='flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-5'>
          <div className='bg-gradient-to-r from-indigo-50 to-blue-50 border-2 border-indigo-200 rounded-xl p-4 md:p-5'>
            <h3 className='text-base md:text-lg font-bold text-gray-800 mb-3 flex items-center gap-2'>
              <span className='bg-indigo-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs'>1</span>
              Details
            </h3>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 text-xs md:text-sm'>
              <div>
                <label className='block text-gray-500 font-medium mb-1'>Date of Work</label>
                <input type='text' placeholder='DD-MM-YYYY'
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: handleSmartDateInput(e.target.value) }))}
                  onBlur={(e) => { const d = handleDateBlur(e.target.value); setFormData(prev => ({ ...prev, date: d })) }}
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-800 focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
                />
              </div>
              <div>
                <label className='block text-gray-500 font-medium mb-1'>Owner Name</label>
                <input type='text' placeholder='Owner name'
                  value={formData.ownerName}
                  onChange={(e) => setFormData(prev => ({ ...prev, ownerName: e.target.value }))}
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-800 focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
                />
              </div>
              <div>
                <label className='block text-gray-500 font-medium mb-1'>GRN No</label>
                <input type='text' placeholder='GRN number'
                  value={formData.grnNo}
                  onChange={(e) => setFormData(prev => ({ ...prev, grnNo: e.target.value }))}
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-800 focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
                />
              </div>
              <div>
                <label className='block text-gray-500 font-medium mb-1'>Dealer TIN / PAN</label>
                <input type='text' placeholder='Dealer TIN or PAN'
                  value={formData.dealerTIN}
                  onChange={(e) => setFormData(prev => ({ ...prev, dealerTIN: e.target.value }))}
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-800 focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
                />
              </div>
            </div>
          </div>

          <div className='bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-4 md:p-5'>
            <h3 className='text-base md:text-lg font-bold text-gray-800 mb-3 flex items-center gap-2'>
              <span className='bg-purple-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs'>2</span>
              Professional Tax Period
            </h3>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 text-xs md:text-sm'>
              <div>
                <label className='block text-gray-500 font-medium mb-1'>Tax From <span className='text-red-500'>*</span></label>
                <input type='text' placeholder='DD-MM-YYYY'
                  value={formData.taxFrom}
                  onChange={(e) => handleDateInput('taxFrom', e.target.value)}
                  onBlur={(e) => handleDateFieldBlur('taxFrom', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg text-xs font-semibold text-gray-800 focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${dateError.taxFrom ? 'border-red-400' : 'border-gray-300'}`}
                />
                {dateError.taxFrom && <p className='text-red-500 text-[10px] mt-1'>{dateError.taxFrom}</p>}
              </div>
              <div>
                <label className='block text-gray-500 font-medium mb-1'>Tax To <span className='text-red-500'>*</span></label>
                <input type='text' placeholder='DD-MM-YYYY'
                  value={formData.taxTo}
                  onChange={(e) => handleDateInput('taxTo', e.target.value)}
                  onBlur={(e) => handleDateFieldBlur('taxTo', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg text-xs font-semibold text-gray-800 focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${dateError.taxTo ? 'border-red-400' : 'border-gray-300'}`}
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
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-bold text-gray-800 focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
                />
              </div>
              <div>
                <label className='block text-gray-500 font-medium mb-1'>Paid Amount</label>
                <input type='number' min='0' step='0.01' placeholder='0'
                  value={formData.paidAmount}
                  onChange={(e) => { handlePaymentChange('paidAmount', e.target.value) }}
                  className={`w-full px-3 py-2 border rounded-lg text-xs font-bold text-gray-800 focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${paidExceedsTotal ? 'border-red-400' : 'border-gray-300'}`}
                />
                {paidExceedsTotal && <p className='text-red-500 text-[10px] mt-1'>Paid exceeds total</p>}
              </div>
              <div>
                <label className='block text-gray-500 font-medium mb-1'>Balance</label>
                <input type='number' min='0' step='0.01' placeholder='0'
                  value={formData.balance}
                  readOnly
                  className='w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-bold text-gray-800 bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
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
              {!professionalTaxDocument ? (
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
              className='w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-800 focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none'
            />
          </div>

          <div className='flex justify-end gap-3 pt-2'>
            <button type='button' onClick={onClose}
              className='px-5 py-2.5 border border-gray-300 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 transition cursor-pointer'>
              Cancel
            </button>
            <button type='submit' disabled={isSubmitting}
              className='px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl text-xs font-bold hover:shadow-lg transition disabled:opacity-50 cursor-pointer'>
              {isSubmitting ? 'Saving...' : isEditMode ? 'Update Record' : 'Save Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddProfessionalTaxModal
