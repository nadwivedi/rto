import { useState } from 'react'
import axios from 'axios'
import { formatDate, getFiveYearsFromNow, parseFormattedDate } from '../../../utils/dateHelpers'
import { handleSmartDateInput } from '../../../utils/dateFormatter'

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'

const RenewPartAModal = ({ permit, onClose, onRenewalSuccess }) => {
  // Get latest Part B data (active or most recent expired)
  const getLatestPartB = () => {
    // Check if there's an active Part B
    if (permit.partB) {
      const authNum = permit.partB.authorizationNumber
      const validFrom = permit.partB.validFrom
      const validTo = permit.partB.validTo

      // Check if Part B data exists (not 'N/A')
      if (authNum !== 'N/A' && validFrom !== 'N/A' && validTo !== 'N/A') {
        // Check if it's actually active (not expired)
        const validToDate = parseFormattedDate(validTo)
        const today = new Date()
        const isActive = validToDate && validToDate >= today

        if (isActive) {
          // Part B is active
          return {
            authorizationNumber: authNum,
            validFrom: validFrom,
            validTo: validTo,
            isActive: true,
            expiredData: null
          }
        } else {
          // Part B exists but expired
          return {
            authorizationNumber: '',
            validFrom: '',
            validTo: '',
            isActive: false,
            expiredData: {
              authorizationNumber: authNum,
              validFrom: validFrom,
              validTo: validTo
            }
          }
        }
      }
    }

    // No Part B data found
    return {
      authorizationNumber: '',
      validFrom: '',
      validTo: '',
      isActive: false,
      expiredData: null
    }
  }

  const latestPartB = getLatestPartB()

  const [formData, setFormData] = useState({
    permitNumber: permit.permitNumber || '',
    validFrom: formatDate(new Date()),
    validTo: formatDate(getFiveYearsFromNow()),
    totalFee: '',
    paid: '',
    balance: '',
    notes: 'Part A renewal (5 years)',
    // Part B fields
    partBNumber: latestPartB.authorizationNumber,
    partBValidFrom: latestPartB.validFrom,
    partBValidTo: latestPartB.validTo
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [partBInfo, setPartBInfo] = useState({
    isActive: latestPartB.isActive,
    message: latestPartB.isActive ? 'Active Part B (auto-filled, editable)' : 'No active Part B found'
  })

  const handleChange = (e) => {
    const { name, value } = e.target

    // Auto-format date fields with smart date input
    if (name === 'validFrom' || name === 'validTo' || name === 'partBValidFrom' || name === 'partBValidTo') {
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

    // Auto-calculate balance when totalFee or paid changes
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
    if (!formData.validFrom || !formData.validTo) {
      setError('Valid From and Valid To dates are required')
      return
    }

    if (!formData.totalFee || parseFloat(formData.totalFee) <= 0) {
      setError('Please enter valid total fee')
      return
    }

    if (formData.paid === '' || formData.balance === '') {
      setError('Please enter paid and balance amounts')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await axios.post(`${API_BASE_URL}/api/national-permits/${permit.id}/smart-renew`, {
        renewType: 'partA',
        partAPermitNumber: formData.permitNumber,
        partAValidFrom: formData.validFrom,
        partAValidTo: formData.validTo,
        totalFee: parseFloat(formData.totalFee),
        paid: parseFloat(formData.paid),
        balance: parseFloat(formData.balance),
        notes: formData.notes,
        // Part B data (only if provided)
        partBNumber: formData.partBNumber || '',
        partBValidFrom: formData.partBValidFrom || '',
        partBValidTo: formData.partBValidTo || ''
      }, {
        withCredentials: true
      })

      const data = response.data

      if (!data.success) {
        throw new Error(data.message || 'Failed to renew Part A')
      }

      alert('Part A renewed successfully! A new permit document has been created and a new bill has been generated.')
      onRenewalSuccess && onRenewalSuccess(data.data)
      onClose()
    } catch (err) {
      console.error('Error renewing Part A:', err)
      setError(err.message || 'Failed to renew Part A. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='fixed inset-0 bg-black/60  flex items-center justify-center z-[70] p-4'>
      <div className='bg-white rounded-3xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col'>
        {/* Header */}
        <div className='bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 p-6 text-white flex-shrink-0'>
          <div className='flex justify-between items-center'>
            <div>
              <h2 className='text-2xl font-black mb-1'>Renew Part A (National Permit)</h2>
              <p className='text-blue-100 text-sm'>Generate new permit for 5 years</p>
            </div>
            <button
              type='button'
              onClick={onClose}
              className='w-10 h-10 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-all'
            >
              <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
              </svg>
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <form onSubmit={handleSubmit} className='flex flex-col flex-1 overflow-hidden'>
          <div className='flex-1 overflow-y-auto p-6'>
          {/* Current Part A Info */}
          <div className='mb-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded'>
            <h3 className='text-sm font-bold text-blue-800 mb-2'>Current Part A Details</h3>
            <div className='grid grid-cols-2 gap-3 text-sm'>
              <div>
                <span className='text-blue-600 font-semibold'>Current Permit Number:</span>
                <p className='text-gray-800 font-mono'>{permit.permitNumber || 'N/A'}</p>
              </div>
              <div>
                <span className='text-blue-600 font-semibold'>Valid To:</span>
                <p className='text-gray-800 font-semibold'>{permit.partA?.permitValidUpto || permit.validTo || 'N/A'}</p>
              </div>
            </div>
            <p className='text-xs text-blue-600 mt-2 font-semibold'>
              ℹ️ You can keep the same permit number or enter a new one
            </p>
          </div>

          {/* Permit Holder Reference */}
          <div className='mb-6 p-4 bg-gray-50 rounded-lg'>
            <div className='grid grid-cols-2 gap-3 text-sm'>
              <div>
                <span className='text-gray-600 font-semibold'>Permit Holder:</span>
                <p className='text-gray-900'>{permit.permitHolder || permit.partA?.ownerName}</p>
              </div>
              <div>
                <span className='text-gray-600 font-semibold'>Vehicle Number:</span>
                <p className='text-gray-900 font-mono'>{permit.vehicleNo || permit.partA?.vehicleNumber}</p>
              </div>
            </div>
          </div>

          {/* Renewal Form */}
          <div className='space-y-4'>
            {/* Row 1: Permit Number, Valid From, Valid To */}
            <div className='grid grid-cols-3 gap-4'>
              {/* Permit Number */}
              <div>
                <label className='block text-sm font-bold text-gray-700 mb-2'>
                  Permit Number <span className='text-red-500'>*</span>
                </label>
                <input
                  type='text'
                  name='permitNumber'
                  value={formData.permitNumber}
                  onChange={handleChange}
                  placeholder='e.g., NP-2025-0001'
                  className='w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono'
                  required
                />
              </div>

              {/* Valid From */}
              <div>
                <label className='block text-sm font-bold text-gray-700 mb-2'>
                  Valid From <span className='text-red-500'>*</span>
                </label>
                <input
                  type='text'
                  name='validFrom'
                  value={formData.validFrom}
                  onChange={handleChange}
                  placeholder='Type: 271025 or 27102025'
                  className='w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  required
                />
              </div>

              {/* Valid To */}
              <div>
                <label className='block text-sm font-bold text-gray-700 mb-2'>
                  Valid To <span className='text-red-500'>*</span>
                </label>
                <input
                  type='text'
                  name='validTo'
                  value={formData.validTo}
                  onChange={handleChange}
                  placeholder='Auto-calculated'
                  className='w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50'
                  required
                />
              </div>
            </div>

            {/* Row 2: Payment Fields */}
            <div className='grid grid-cols-3 gap-4'>
              {/* Total Fee */}
              <div>
                <label className='block text-sm font-bold text-gray-700 mb-2'>
                  Total Fee (₹) <span className='text-red-500'>*</span>
                </label>
                <input
                  type='number'
                  name='totalFee'
                  value={formData.totalFee}
                  onChange={handleChange}
                  placeholder='0'
                  min='0'
                  step='100'
                  className='w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent font-semibold'
                  required
                />
              </div>

              {/* Paid */}
              <div>
                <label className='block text-sm font-bold text-gray-700 mb-2'>
                  Paid (₹) <span className='text-red-500'>*</span>
                </label>
                <input
                  type='number'
                  name='paid'
                  value={formData.paid}
                  onChange={handleChange}
                  placeholder='0'
                  min='0'
                  step='100'
                  className='w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent font-semibold'
                  required
                />
              </div>

              {/* Balance */}
              <div>
                <label className='block text-sm font-bold text-gray-700 mb-2'>
                  Balance (₹)
                </label>
                <input
                  type='number'
                  name='balance'
                  value={formData.balance}
                  onChange={handleChange}
                  placeholder='Auto-calculated'
                  className='w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 font-semibold'
                  readOnly
                />
              </div>
            </div>

            {/* Row 3: Notes */}
            <div>
              <label className='block text-sm font-bold text-gray-700 mb-2'>
                Notes (Optional)
              </label>
              <input
                type='text'
                name='notes'
                value={formData.notes}
                onChange={handleChange}
                placeholder='Add any notes about this renewal...'
                className='w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              />
            </div>

            {/* Helper Text */}
            <div className='grid grid-cols-3 gap-4 text-xs text-gray-500'>
              <p>Can be same as current or new</p>
              <p>Smart input: auto-formats as you type</p>
              <p>Auto-calculated (5 years - 1 day)</p>
            </div>
          </div>

          {/* Part B Section */}
          <div className='mt-6 p-5 bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-2xl'>
            <div className='flex items-center justify-between mb-4'>
              <h3 className='text-lg font-black text-red-700 flex items-center gap-2'>
                <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' />
                </svg>
                Part B Authorization (Optional)
              </h3>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                partBInfo.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
              }`}>
                {partBInfo.message}
              </span>
            </div>

            {/* Show Active Part B Info */}
            {latestPartB.isActive && (
              <div className='mb-4 p-4 bg-green-50 border-l-4 border-green-500 rounded-lg'>
                <h4 className='text-sm font-bold text-green-800 mb-2 flex items-center gap-2'>
                  <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' />
                  </svg>
                  Current Active Part B Details (Auto-filled below)
                </h4>
                <div className='grid grid-cols-3 gap-3 text-sm'>
                  <div>
                    <span className='text-green-700 font-semibold'>Auth Number:</span>
                    <p className='text-gray-800 font-mono'>{latestPartB.authorizationNumber}</p>
                  </div>
                  <div>
                    <span className='text-green-700 font-semibold'>Valid From:</span>
                    <p className='text-gray-800'>{latestPartB.validFrom}</p>
                  </div>
                  <div>
                    <span className='text-green-700 font-semibold'>Valid To:</span>
                    <p className='text-gray-800'>{latestPartB.validTo}</p>
                  </div>
                </div>
                <p className='text-xs text-green-700 mt-2 font-semibold'>
                  ✓ These values have been automatically filled in the fields below. You can modify them if needed.
                </p>
              </div>
            )}

            {/* Show Expired Part B Info */}
            {latestPartB.expiredData && (
              <div className='mb-4 p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded-lg'>
                <h4 className='text-sm font-bold text-yellow-800 mb-2 flex items-center gap-2'>
                  <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
                  </svg>
                  Latest Expired Part B Details
                </h4>
                <div className='grid grid-cols-3 gap-3 text-sm'>
                  <div>
                    <span className='text-yellow-700 font-semibold'>Auth Number:</span>
                    <p className='text-gray-800 font-mono'>{latestPartB.expiredData.authorizationNumber}</p>
                  </div>
                  <div>
                    <span className='text-yellow-700 font-semibold'>Valid From:</span>
                    <p className='text-gray-800'>{latestPartB.expiredData.validFrom}</p>
                  </div>
                  <div>
                    <span className='text-yellow-700 font-semibold'>Valid To:</span>
                    <p className='text-gray-800'>{latestPartB.expiredData.validTo}</p>
                  </div>
                </div>
              </div>
            )}

            <div className='space-y-4'>
              {/* Row 1: Auth Number, Valid From, Valid To */}
              <div className='grid grid-cols-3 gap-4'>
                {/* Authorization Number */}
                <div>
                  <label className='block text-sm font-bold text-gray-700 mb-2'>
                    Authorization Number
                  </label>
                  <input
                    type='text'
                    name='partBNumber'
                    value={formData.partBNumber}
                    onChange={handleChange}
                    placeholder='e.g., AUTH-2025-001'
                    className='w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent font-mono'
                  />
                </div>

                {/* Part B Valid From */}
                <div>
                  <label className='block text-sm font-bold text-gray-700 mb-2'>
                    Valid From
                  </label>
                  <input
                    type='text'
                    name='partBValidFrom'
                    value={formData.partBValidFrom}
                    onChange={handleChange}
                    placeholder='Type: 271025 or 27102025'
                    className='w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent'
                  />
                </div>

                {/* Part B Valid To */}
                <div>
                  <label className='block text-sm font-bold text-gray-700 mb-2'>
                    Valid To
                  </label>
                  <input
                    type='text'
                    name='partBValidTo'
                    value={formData.partBValidTo}
                    onChange={handleChange}
                    placeholder='Auto-calculated'
                    className='w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent'
                  />
                </div>
              </div>

              {/* Helper Text */}
              <div className='p-3 bg-white rounded-lg border border-red-200'>
                <p className='text-xs text-red-700 font-semibold'>
                  💡 Part B is typically valid for 1 year. {partBInfo.isActive ? 'Active Part B data has been auto-filled. You can modify these fields as needed.' : 'Enter new Part B details if needed, or leave empty to skip.'}
                </p>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className='mt-4 p-3 bg-red-50 border-l-4 border-red-500 rounded'>
              <p className='text-sm text-red-700 font-semibold'>{error}</p>
            </div>
          )}

          {/* Info Box */}
          <div className='mt-6 p-4 bg-amber-50 border-l-4 border-amber-500 rounded'>
            <p className='text-xs text-amber-700 font-semibold'>
              ℹ️ Upon renewal, a NEW permit document will be created with a new bill for the 5-year Part A permit.
              The old permit will be marked as renewed and moved to renewal history.
            </p>
          </div>
          </div>

          {/* Fixed Bottom Action Bar */}
          <div className='flex-shrink-0 border-t border-gray-200 bg-gray-50 p-4'>
            <div className='flex gap-3'>
              <button
                type='button'
                onClick={onClose}
                className='flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all font-semibold'
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type='submit'
                disabled={loading}
                className='flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl hover:shadow-lg transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed'
              >
                {loading ? (
                  <span className='flex items-center justify-center gap-2'>
                    <svg className='animate-spin h-5 w-5' viewBox='0 0 24 24'>
                      <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' fill='none'></circle>
                      <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  'Renew Part A'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default RenewPartAModal
