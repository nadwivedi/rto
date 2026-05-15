import { useState, useEffect } from 'react'
import axios from 'axios'
import { formatDate, getFiveYearsFromNow, getOneYearFromNow } from '../../../utils/dateHelpers'
import { handleSmartDateInput } from '../../../utils/dateFormatter'
import { toast } from 'react-toastify'

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'

const SmartRenewModal = ({ permit, onClose, onRenewalSuccess }) => {
  const [renewalInfo, setRenewalInfo] = useState({
    partANeedsRenewal: false,
    partBNeedsRenewal: false,
    partAStatus: '',
    partBStatus: ''
  })

  const [formData, setFormData] = useState({
    // Part A fields
    partAPermitNumber: '',
    partAValidFrom: formatDate(new Date()),
    partAValidTo: formatDate(getFiveYearsFromNow()),
    // Part B fields
    partBNumber: '',
    partBValidFrom: formatDate(new Date()),
    partBValidTo: formatDate(getOneYearFromNow()),
    // Payment fields (combined)
    totalFee: '',
    paid: '',
    balance: '',
    notes: ''
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    // Determine what needs renewal based on permit data
    const partAStatus = permit.partA?.status || permit.status || 'active'
    const partBStatus = permit.partB?.status || permit.status || 'active'

    const partANeedsRenewal = ['expiring_soon', 'expired'].includes(partAStatus)
    const partBNeedsRenewal = ['expiring_soon', 'expired'].includes(partBStatus)

    setRenewalInfo({
      partANeedsRenewal,
      partBNeedsRenewal,
      partAStatus,
      partBStatus
    })

    console.log('Renewal Info:', { partANeedsRenewal, partBNeedsRenewal, partAStatus, partBStatus })
  }, [permit])

  const handleChange = (e) => {
    const { name, value } = e.target

    // Auto-uppercase for permit numbers (Part A and Part B)
    if (name === 'partAPermitNumber' || name === 'partBNumber') {
      setFormData(prev => ({
        ...prev,
        [name]: value.toUpperCase()
      }))
      setError('')
      return
    }

    // Auto-format date fields
    if (name.includes('ValidFrom') || name.includes('ValidTo')) {
      const formatted = handleSmartDateInput(value, formData[name] || '')
      if (formatted !== null) {
        setFormData(prev => ({
          ...prev,
          [name]: formatted
        }))
      }
      setError('')
      return
    }

    // Auto-calculate balance
    if (name === 'totalFee' || name === 'paid') {
      const totalFee = name === 'totalFee' ? parseFloat(value) || 0 : parseFloat(formData.totalFee) || 0
      const paid = name === 'paid' ? parseFloat(value) || 0 : parseFloat(formData.paid) || 0
      const balance = Math.max(0, totalFee - paid)

      setFormData(prev => ({
        ...prev,
        [name]: value,
        balance: balance.toString()
      }))
      setError('')
      return
    }

    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validation
    if (renewalInfo.partANeedsRenewal) {
      if (!formData.partAPermitNumber || formData.partAPermitNumber.trim() === '') {
        setError('Part A: Permit Number is required')
        return
      }
      if (!formData.partAValidFrom || !formData.partAValidTo) {
        setError('Part A: Valid From and Valid To dates are required')
        return
      }
    }

    if (renewalInfo.partBNeedsRenewal) {
      if (!formData.partBNumber || formData.partBNumber.trim() === '') {
        setError('Part B: Authorization Number is required')
        return
      }
      if (!formData.partBValidFrom || !formData.partBValidTo) {
        setError('Part B: Valid From and Valid To dates are required')
        return
      }
    }

    // Payment validation (for both Part A and Part B renewals)
    if (!formData.totalFee || parseFloat(formData.totalFee) <= 0) {
      setError('Please enter valid total fee')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Determine renewal type based on what needs renewal
      let renewType = ''
      if (renewalInfo.partANeedsRenewal && renewalInfo.partBNeedsRenewal) {
        renewType = 'both'
      } else if (renewalInfo.partANeedsRenewal) {
        renewType = 'partA'
      } else if (renewalInfo.partBNeedsRenewal) {
        renewType = 'partB'
      }

      // Build renewal data for flat model
      const renewalData = {
        renewType,
        totalFee: parseFloat(formData.totalFee),
        paid: parseFloat(formData.paid || 0),
        balance: parseFloat(formData.balance || 0),
        notes: formData.notes || ''
      }

      // Add Part A data if needed
      if (renewalInfo.partANeedsRenewal) {
        renewalData.partAPermitNumber = formData.partAPermitNumber.trim()
        renewalData.partAValidFrom = formData.partAValidFrom
        renewalData.partAValidTo = formData.partAValidTo
      }

      // Add Part B data if needed
      if (renewalInfo.partBNeedsRenewal) {
        renewalData.partBNumber = formData.partBNumber.trim()
        renewalData.partBValidFrom = formData.partBValidFrom
        renewalData.partBValidTo = formData.partBValidTo
      }

      const response = await axios.post(
        `${API_BASE_URL}/api/national-permits/${permit.id}/smart-renew`,
        renewalData,
        { withCredentials: true }
      )

      const data = response.data

      if (!data.success) {
        throw new Error(data.message || 'Renewal failed')
      }

      toast.success(data.message, { position: 'top-right', autoClose: 3000 })

      if (onRenewalSuccess) {
        onRenewalSuccess(data.data)
      }

      onClose()
    } catch (error) {
      console.error('Renewal error:', error)
      const errorMsg = error.response?.data?.message || error.message || 'Failed to renew permit'
      setError(errorMsg)
      toast.error(errorMsg, { position: 'top-right', autoClose: 5000 })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70] p-4'>
      <div className='bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto'>
        {/* Header */}
        <div className='sticky top-0 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-4 rounded-t-2xl flex justify-between items-center'>
          <div>
            <h2 className='text-2xl font-bold'>Renew National Permit</h2>
            <p className='text-sm opacity-90 mt-1'>
              {renewalInfo.partANeedsRenewal && renewalInfo.partBNeedsRenewal
                ? 'Renewing Part A and Part B'
                : renewalInfo.partANeedsRenewal
                ? 'Renewing Part A (5-year permit)'
                : 'Renewing Part B (1-year authorization)'}
            </p>
          </div>
          <button
            onClick={onClose}
            className='text-white hover:bg-white/20 rounded-full p-2 transition-colors'
          >
            <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className='p-6 space-y-6'>
          {/* Error Message */}
          {error && (
            <div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg'>
              {error}
            </div>
          )}

          {/* Vehicle Info */}
          <div className='bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4'>
            <h3 className='text-lg font-bold text-gray-800 mb-3 flex items-center gap-2'>
              <svg className='w-5 h-5 text-blue-600' fill='currentColor' viewBox='0 0 20 20'>
                <path d='M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z' />
                <path d='M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z' />
              </svg>
              Vehicle Information
            </h3>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-3 text-sm'>
              <div className='flex items-center gap-2'>
                <span className='font-semibold text-gray-600'>Vehicle No:</span>
                <span className='font-mono font-bold text-gray-900'>{permit.vehicleNo}</span>
              </div>
              <div className='flex items-center gap-2'>
                <span className='font-semibold text-gray-600'>Mobile No:</span>
                <span className='font-mono font-bold text-gray-900'>{permit.partA?.ownerMobile || 'N/A'}</span>
              </div>
              <div className='flex items-center gap-2'>
                <span className='font-semibold text-gray-600'>Permit Holder:</span>
                <span className='font-bold text-gray-900'>{permit.permitHolder}</span>
              </div>
              <div className='flex items-center gap-2'>
                <span className='font-semibold text-gray-600'>Current Permit No:</span>
                <span className='font-mono font-bold text-gray-900'>{permit.permitNumber}</span>
              </div>
            </div>
          </div>

          {/* Part A Section */}
          {renewalInfo.partANeedsRenewal ? (
            <div className='bg-orange-50 border-2 border-orange-300 rounded-xl p-6'>
              <div className='flex items-center justify-between mb-4'>
                <h3 className='text-lg font-bold text-gray-800'>Part A - National Permit (Needs Renewal)</h3>
                <span className='px-3 py-1 bg-orange-500 text-white text-sm rounded-full font-semibold'>
                  {renewalInfo.partAStatus === 'expired' ? 'Expired' : 'Expiring Soon'}
                </span>
              </div>

              {/* Show last expired Part A details */}
              {renewalInfo.partAStatus === 'expired' && permit.partA && (
                <div className='mb-4 bg-red-50 border border-red-200 rounded-lg p-3'>
                  <p className='text-xs font-bold text-red-800 mb-2'>Last Expired Permit:</p>
                  <div className='grid grid-cols-2 gap-2 text-xs text-gray-700'>
                    <div>
                      <span className='font-semibold'>Permit No:</span> {permit.permitNumber || 'N/A'}
                    </div>
                    <div>
                      <span className='font-semibold'>Valid Till:</span> {permit.validTill || permit.partA?.permitValidUpto || 'N/A'}
                    </div>
                  </div>
                </div>
              )}

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-4'>
                <div>
                  <label className='block text-sm font-semibold text-gray-700 mb-1'>
                    New Permit Number <span className='text-red-500'>*</span>
                  </label>
                  <input
                    type='text'
                    name='partAPermitNumber'
                    value={formData.partAPermitNumber}
                    onChange={handleChange}
                    placeholder='Enter New Part A Permit Number'
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 font-mono'
                    required
                  />
                </div>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <label className='block text-sm font-semibold text-gray-700 mb-1'>
                    Valid From <span className='text-red-500'>*</span>
                  </label>
                  <input
                    type='text'
                    name='partAValidFrom'
                    value={formData.partAValidFrom}
                    onChange={handleChange}
                    placeholder='DD-MM-YYYY'
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500'
                    required
                  />
                </div>
                <div>
                  <label className='block text-sm font-semibold text-gray-700 mb-1'>
                    Valid To <span className='text-red-500'>*</span>
                  </label>
                  <input
                    type='text'
                    name='partAValidTo'
                    value={formData.partAValidTo}
                    onChange={handleChange}
                    placeholder='DD-MM-YYYY'
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500'
                    required
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className='bg-green-50 border-2 border-green-300 rounded-xl p-6'>
              <div className='flex items-center justify-between'>
                <h3 className='text-lg font-bold text-gray-800'>Part A - National Permit</h3>
                <span className='px-3 py-1 bg-green-500 text-white text-sm rounded-full font-semibold'>Active</span>
              </div>
              <p className='text-sm text-green-700 mt-2'>
                Part A is active and does not need renewal at this time.
              </p>
              <div className='mt-3 text-sm text-gray-600'>
                <p>Valid Until: <span className='font-semibold'>{permit.validTill || permit.partA?.permitValidUpto}</span></p>
              </div>
            </div>
          )}

          {/* Part B Section */}
          {renewalInfo.partBNeedsRenewal ? (
            <div className='bg-purple-50 border-2 border-purple-300 rounded-xl p-6'>
              <div className='flex items-center justify-between mb-4'>
                <h3 className='text-lg font-bold text-gray-800'>Part B - Authorization (Needs Renewal)</h3>
                <span className='px-3 py-1 bg-purple-500 text-white text-sm rounded-full font-semibold'>
                  {renewalInfo.partBStatus === 'expired' ? 'Expired' : 'Expiring Soon'}
                </span>
              </div>

              {/* Show last expired Part B details */}
              {renewalInfo.partBStatus === 'expired' && permit.partB && (
                <div className='mb-4 bg-red-50 border border-red-200 rounded-lg p-3'>
                  <p className='text-xs font-bold text-red-800 mb-2'>Last Expired Authorization:</p>
                  <div className='grid grid-cols-2 gap-2 text-xs text-gray-700'>
                    <div>
                      <span className='font-semibold'>Authorization No:</span> {permit.partB?.authorizationNumber || 'N/A'}
                    </div>
                    <div>
                      <span className='font-semibold'>Valid Till:</span> {permit.partB?.validTo || 'N/A'}
                    </div>
                  </div>
                </div>
              )}

              <div className='mb-4'>
                <label className='block text-sm font-semibold text-gray-700 mb-1'>
                  Authorization Number <span className='text-red-500'>*</span>
                </label>
                <input
                  type='text'
                  name='partBNumber'
                  value={formData.partBNumber}
                  onChange={handleChange}
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500'
                  required
                />
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <label className='block text-sm font-semibold text-gray-700 mb-1'>
                    Valid From <span className='text-red-500'>*</span>
                  </label>
                  <input
                    type='text'
                    name='partBValidFrom'
                    value={formData.partBValidFrom}
                    onChange={handleChange}
                    placeholder='DD-MM-YYYY'
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500'
                    required
                  />
                </div>
                <div>
                  <label className='block text-sm font-semibold text-gray-700 mb-1'>
                    Valid To <span className='text-red-500'>*</span>
                  </label>
                  <input
                    type='text'
                    name='partBValidTo'
                    value={formData.partBValidTo}
                    onChange={handleChange}
                    placeholder='DD-MM-YYYY'
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500'
                    required
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className='bg-green-50 border-2 border-green-300 rounded-xl p-6'>
              <div className='flex items-center justify-between'>
                <h3 className='text-lg font-bold text-gray-800'>Part B - Authorization</h3>
                <span className='px-3 py-1 bg-green-500 text-white text-sm rounded-full font-semibold'>Active</span>
              </div>
              <p className='text-sm text-green-700 mt-2'>
                Part B is active and does not need renewal at this time.
              </p>
              <div className='mt-3 text-sm text-gray-600'>
                <p>Authorization No: <span className='font-semibold'>{permit.partB?.authorizationNumber}</span></p>
                <p>Valid Until: <span className='font-semibold'>{permit.partB?.validTo}</span></p>
              </div>
            </div>
          )}

          {/* Payment Section */}
          <div className='bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-6'>
            <h3 className='text-lg font-bold text-gray-800 mb-2'>Renewal Fees</h3>
            <p className='text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 mb-4 font-medium'>
              💡 {renewalInfo.partANeedsRenewal && renewalInfo.partBNeedsRenewal
                ? 'Combined payment for Part A (5-year permit) + Part B (1-year authorization) renewal'
                : renewalInfo.partANeedsRenewal
                ? 'Payment for Part A (5-year permit) renewal'
                : 'Payment for Part B (1-year authorization) renewal'}
            </p>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              <div>
                <label className='block text-sm font-semibold text-gray-700 mb-1'>
                  Total Fee (₹) <span className='text-red-500'>*</span>
                </label>
                <input
                  type='number'
                  name='totalFee'
                  value={formData.totalFee}
                  onChange={handleChange}
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 font-semibold'
                  required
                />
              </div>
              <div>
                <label className='block text-sm font-semibold text-gray-700 mb-1'>Paid (₹)</label>
                <input
                  type='number'
                  name='paid'
                  value={formData.paid}
                  onChange={handleChange}
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 font-semibold'
                />
              </div>
              <div>
                <label className='block text-sm font-semibold text-gray-700 mb-1'>Balance (₹)</label>
                <input
                  type='number'
                  name='balance'
                  value={formData.balance}
                  readOnly
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 font-semibold'
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className='block text-sm font-semibold text-gray-700 mb-1'>Notes (Optional)</label>
            <textarea
              name='notes'
              value={formData.notes}
              onChange={handleChange}
              rows='3'
              className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500'
              placeholder='Add any additional notes here...'
            />
          </div>

          {/* Action Buttons */}
          <div className='flex justify-end gap-3 pt-4 border-t'>
            <button
              type='button'
              onClick={onClose}
              disabled={loading}
              className='px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold disabled:opacity-50'
            >
              Cancel
            </button>
            <button
              type='submit'
              disabled={loading}
              className='px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 font-semibold disabled:opacity-50 flex items-center gap-2'
            >
              {loading ? (
                <>
                  <svg className='animate-spin h-5 w-5' viewBox='0 0 24 24'>
                    <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' fill='none' />
                    <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z' />
                  </svg>
                  Processing...
                </>
              ) : (
                <>
                  <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' />
                  </svg>
                  Renew Permit
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default SmartRenewModal
