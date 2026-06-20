import { useState, useEffect } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { validateVehicleNumberRealtime, enforceVehicleNumberFormat } from '../../../utils/vehicleNoCheck'
import { handlePaymentCalculation } from '../../../utils/paymentValidation'
import { handleSmartDateInput } from '../../../utils/dateFormatter'
import { replacePaymentsForWork, getPaymentsByWork } from '../../../utils/paymentReceivedApi'

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080'

const AddRegistrationRenewalModal = ({ isOpen, onClose, onSuccess, editData }) => {
  const [formData, setFormData] = useState({
    vehicleNumber: '',
    ownerName: '',
    ownerMobile: '',
    ownerAddress: '',
    date: '',
    validFrom: '',
    validTo: '',
    byName: '',
    byMobile: '',
    totalFee: '',
    paid: '',
    profit: '',
    expenseBreakup: [],
    paymentMode: 'Cash',
    feeBreakup: [
      { name: 'Insurance', amount: '' },
      { name: 'PUC', amount: '' },
      { name: 'Fees', amount: '' },
      { name: 'Fine', amount: '' }
    ]
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [vehicleValidation, setVehicleValidation] = useState({ isValid: false, message: '' })
  const [paidExceedsTotal, setPaidExceedsTotal] = useState(false)
  const [paymentReceived, setPaymentReceived] = useState([])

  useEffect(() => {
    if (!isOpen) return undefined

    const handleEscapeKey = (event) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleEscapeKey)

    return () => {
      window.removeEventListener('keydown', handleEscapeKey)
    }
  }, [isOpen, onClose])

  useEffect(() => {
    if (editData) {
      const defaultFeeBreakup = [
        { name: 'Insurance', amount: '' },
        { name: 'PUC', amount: '' },
        { name: 'Fees', amount: '' },
        { name: 'Fine', amount: '' }
      ]

      const feeBreakup = editData.feeBreakup && editData.feeBreakup.length > 0
        ? editData.feeBreakup
        : defaultFeeBreakup

      setFormData({
        ...editData,
        date: editData.date || '',
        profit: editData.profit?.toString() || '',
        expenseBreakup: (editData.expenseBreakup || []).map(item => ({ ...item })),
        paymentMode: editData.paymentMode || 'Cash',
        feeBreakup
      })
      if (editData.vehicleNumber) {
        const validation = validateVehicleNumberRealtime(editData.vehicleNumber)
        setVehicleValidation(validation)
      }
    } else {
      setFormData({
        vehicleNumber: '',
        ownerName: '',
        ownerMobile: '',
        ownerAddress: '',
        date: '',
        validFrom: '',
        validTo: '',
        byName: '',
        byMobile: '',
        totalFee: '',
        paid: '',
        profit: '',
        expenseBreakup: [],
        paymentMode: 'Cash',
        feeBreakup: [
          { name: 'Insurance', amount: '' },
          { name: 'PUC', amount: '' },
          { name: 'Fees', amount: '' },
          { name: 'Fine', amount: '' }
        ]
      })
      setVehicleValidation({ isValid: false, message: '' })
    }
    setError('')
    if (editData?._id) {
      getPaymentsByWork('RR', editData._id).then(res => {
        setPaymentReceived(res.data.map(p => ({ date: p.date, amount: p.amount, paymentMode: p.paymentMode })))
      }).catch(() => setPaymentReceived([]))
    } else {
      setPaymentReceived([])
    }
  }, [editData, isOpen])

  const handleChange = (e) => {
    const { name, value } = e.target

    if (name === 'vehicleNumber') {
      const enforcedValue = enforceVehicleNumberFormat(formData.vehicleNumber, value)
      const validation = validateVehicleNumberRealtime(enforcedValue)
      setVehicleValidation(validation)

      setFormData(prev => ({
        ...prev,
        [name]: enforcedValue
      }))
      return
    }

    if (name === 'totalFee' || name === 'paid') {
      setFormData(prev => {
        const paymentResult = handlePaymentCalculation(name, value, prev)
        setPaidExceedsTotal(paymentResult.paidExceedsTotal)

        return {
          ...prev,
          [name]: name === 'paid' ? paymentResult.paid : value,
          totalFee: name === 'totalFee' ? value : prev.totalFee,
          paid: name === 'paid' ? paymentResult.paid : prev.paid,
          balance: paymentResult.balance
        }
      })
      return
    }

    if (name === 'validFrom' || name === 'validTo') {
      const formatted = handleSmartDateInput(value, formData[name] || '')

      if (formatted !== null) {
        setFormData(prev => ({
          ...prev,
          [name]: formatted
        }))
      }
      return
    }

    const uppercaseFields = [
      'vehicleNumber',
      'ownerName',
      'ownerAddress',
      'byName'
    ]

    const finalValue = uppercaseFields.includes(name) ? value.toUpperCase() : value

    setFormData(prev => ({
      ...prev,
      [name]: finalValue
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (paidExceedsTotal) {
      setError('Paid amount cannot be more than the total fee!')
      return
    }

    setLoading(true)
    setError('')

    try {
      const filteredFeeBreakup = formData.feeBreakup.filter(item =>
        item.name && item.amount && parseFloat(item.amount) > 0
      )

      const filteredExpenseBreakup = formData.expenseBreakup.filter(item =>
        item.name && item.amount && parseFloat(item.amount) > 0
      )

      const dataToSend = {
        ...formData,
        date: formData.date || undefined,
        feeBreakup: filteredFeeBreakup,
        expenseBreakup: filteredExpenseBreakup
      }

      const url = editData
        ? `${API_URL}/api/registration-renewals/${editData._id}`
        : `${API_URL}/api/registration-renewals`

      const method = editData ? 'PUT' : 'POST'

      const response = editData
        ? await axios.put(url, dataToSend, { withCredentials: true })
        : await axios.post(url, dataToSend, { withCredentials: true })

      const data = response.data

      if (data.success) {
        const recordId = data.data?._id || editData?._id
        const validPayments = paymentReceived.filter(p => p.date && p.amount && parseFloat(p.amount) > 0)
        if (validPayments.length > 0 && recordId) {
          try {
            await replacePaymentsForWork('RR', recordId, validPayments)
          } catch (paymentErr) {
            console.error('Failed to save payment received entries:', paymentErr)
          }
        }
        toast.success(editData ? 'RC renewal updated successfully' : 'RC renewal added successfully', {
          autoClose: 1200
        })
        onSuccess()
        onClose()
      } else {
        setError(data.message || 'Failed to save registration renewal')
      }
    } catch (error) {
      setError('Error saving registration renewal. Please try again.')
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFieldKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const form = e.target.form
      const inputs = Array.from(form.querySelectorAll('input:not([type="hidden"]):not([disabled]):not([readonly]), textarea'))
      const index = inputs.indexOf(e.target)
      if (index > -1 && index < inputs.length - 1) {
        inputs[index + 1].focus()
      }
    }
  }

  const addFeeBreakupItem = () => {
    setFormData(prev => ({
      ...prev,
      feeBreakup: [...prev.feeBreakup, { name: '', amount: '' }]
    }))
  }

  const removeFeeBreakupItem = (index) => {
    setFormData(prev => ({
      ...prev,
      feeBreakup: prev.feeBreakup.filter((_, i) => i !== index)
    }))
  }

  const handleFeeBreakupChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      feeBreakup: prev.feeBreakup.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    }))
  }

  // Expense Breakup Handlers
  const addExpenseBreakupItem = () => {
    setFormData(prev => ({
      ...prev,
      expenseBreakup: [...prev.expenseBreakup, { name: '', amount: '' }]
    }))
  }

  const removeExpenseBreakupItem = (index) => {
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

  const addPaymentReceivedItem = () => {
    setPaymentReceived(prev => [...prev, { date: '', amount: '', paymentMode: 'Cash' }])
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
      <div className='bg-white rounded-xl md:rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden flex flex-col'>
        <div className='bg-gradient-to-r from-teal-600 to-cyan-600 p-2 md:p-3 text-white flex-shrink-0'>
          <div className='flex justify-between items-center'>
            <div>
              <h2 className='text-lg md:text-2xl font-bold'>
                {editData ? 'Edit Registration Renewal' : 'Add New RC Renewal'}
              </h2>
              <p className='text-teal-100 text-xs md:text-sm mt-1'>Vehicle registration renewal details</p>
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

        <style>{`
          .rr-add-form input,
          .rr-add-form select,
          .rr-add-form textarea {
            background-color: #ffffff;
          }
        `}</style>
        <form onSubmit={handleSubmit} className='rr-add-form flex flex-col flex-1 overflow-hidden'>
          <div className='flex-1 overflow-y-auto p-3 md:p-6'>
            {error && (
              <div className='mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2'>
                <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
                </svg>
                {error}
              </div>
            )}

            <div className='bg-gradient-to-r from-teal-50 to-cyan-50 border-2 border-teal-200 rounded-xl p-3 md:p-6 mb-4 md:mb-6'>
              <h3 className='text-base md:text-lg font-bold text-gray-800 mb-3 md:mb-4 flex items-center gap-2'>
                <span className='bg-teal-600 text-white w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm'>1</span>
                Vehicle Information
              </h3>

              <div className='grid grid-cols-1 md:grid-cols-6 gap-3 md:gap-4'>
                <div className='md:col-span-2'>
                  <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1'>
                    Date of Work <span className='text-red-500'>*</span>
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
                    required
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent'
                  />
                </div>
                <div className='md:col-span-2'>
                  <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1'>
                    Vehicle Number <span className='text-red-500'>*</span>
                  </label>
                  <div className='relative'>
                    <input
                      type='text'
                      name='vehicleNumber'
                      value={formData.vehicleNumber}
                      onChange={handleChange}
                      onKeyDown={handleFieldKeyDown}
                      required
                      placeholder='CG01AB1234'
                      maxLength='10'
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent font-mono ${
                        formData.vehicleNumber && !vehicleValidation.isValid
                          ? 'border-red-500 focus:ring-red-500'
                          : formData.vehicleNumber && vehicleValidation.isValid
                          ? 'border-green-500 focus:ring-green-500'
                          : 'border-gray-300 focus:ring-teal-500'
                      }`}
                    />
                    {vehicleValidation.isValid && formData.vehicleNumber && (
                      <div className='absolute right-3 top-2.5'>
                        <svg className='h-5 w-5 text-green-500' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
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
                </div>

                <div className='md:col-span-2'>
                  <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1'>
                    Owner Name <span className='text-red-500'>*</span>
                  </label>
                  <input
                    type='text'
                    name='ownerName'
                    value={formData.ownerName}
                    onChange={handleChange}
                    onKeyDown={handleFieldKeyDown}
                    required
                    placeholder='Enter owner full name'
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent'
                  />
                </div>

                <div className='md:col-span-3'>
                  <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1'>
                    Mobile Number <span className='text-red-500'>*</span>
                  </label>
                  <input
                    type='tel'
                    name='ownerMobile'
                    value={formData.ownerMobile}
                    onChange={handleChange}
                    onKeyDown={handleFieldKeyDown}
                    required
                    placeholder='10-digit mobile number'
                    pattern='[0-9]{10}'
                    maxLength='10'
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent'
                  />
                </div>

                <div className='md:col-span-3'>
                  <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1'>
                    Address <span className='text-red-500'>*</span>
                  </label>
                  <textarea
                    name='ownerAddress'
                    value={formData.ownerAddress}
                    onChange={handleChange}
                    onKeyDown={handleFieldKeyDown}
                    required
                    rows='2'
                    placeholder='Enter complete address'
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none'
                  />
                </div>
              </div>
            </div>

            <div className='bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-3 md:p-6 mb-4 md:mb-6'>
              <h3 className='text-base md:text-lg font-bold text-gray-800 mb-3 md:mb-4 flex items-center gap-2'>
                <span className='bg-blue-600 text-white w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm'>2</span>
                Validity Period
              </h3>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4'>
                <div>
                  <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1'>
                    Valid From <span className='text-red-500'>*</span>
                  </label>
                  <input
                    type='text'
                    name='validFrom'
                    value={formData.validFrom}
                    onChange={handleChange}
                    onKeyDown={handleFieldKeyDown}
                    required
                    placeholder='22-12-2023'
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  />
                </div>

                <div>
                  <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1'>
                    Valid To <span className='text-red-500'>*</span>
                  </label>
                  <input
                    type='text'
                    name='validTo'
                    value={formData.validTo}
                    onChange={handleChange}
                    onKeyDown={handleFieldKeyDown}
                    required
                    placeholder='22-12-2024'
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  />
                </div>
              </div>
            </div>

            <div className='bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-200 rounded-xl p-3 md:p-6 mb-4 md:mb-6'>
              <h3 className='text-base md:text-lg font-bold text-gray-800 mb-3 md:mb-4 flex items-center gap-2'>
                <span className='bg-amber-600 text-white w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm'>3</span>
                By/Referral Details (Optional)
              </h3>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4'>
                <div>
                  <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1'>
                    Name
                  </label>
                  <input
                    type='text'
                    name='byName'
                    value={formData.byName}
                    onChange={handleChange}
                    onKeyDown={handleFieldKeyDown}
                    placeholder='Enter name'
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent'
                  />
                </div>

                <div>
                  <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1'>
                    Mobile Number
                  </label>
                  <input
                    type='tel'
                    name='byMobile'
                    value={formData.byMobile}
                    onChange={handleChange}
                    onKeyDown={handleFieldKeyDown}
                    placeholder='10-digit mobile number'
                    pattern='[0-9]{10}'
                    maxLength='10'
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent'
                  />
                </div>
              </div>

              <div className='mt-3 bg-amber-100 border-l-4 border-amber-500 p-2 md:p-3 rounded'>
                <p className='text-xs md:text-sm text-amber-700 flex items-center gap-1'>
                  <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
                  </svg>
                  Referral/Agent who facilitated this renewal
                </p>
              </div>
            </div>

            <div className='bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-3 md:p-6 mb-4 md:mb-6'>
              <h3 className='text-base md:text-lg font-bold text-gray-800 mb-3 md: items-center gap-mb-4 flex2'>
                <span className='bg-purple-600 text-white w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm'>4</span>
                Payment Information
              </h3>

              <div className='grid grid-cols-1 md:grid-cols-5 gap-3 md:gap-4'>
                <div>
                  <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1'>
                    Total Fee (₹) <span className='text-red-500'>*</span>
                  </label>
                  <input
                    type='number'
                    name='totalFee'
                    value={formData.totalFee}
                    onChange={handleChange}
                    onKeyDown={handleFieldKeyDown}
                    placeholder='0'
                    required
                    min='0'
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-semibold'
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
                    onKeyDown={handleFieldKeyDown}
                    placeholder='0'
                    required
                    min='0'
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 font-semibold ${
                      paidExceedsTotal
                        ? 'border-red-500 focus:ring-red-500 bg-red-50'
                        : 'border-gray-300 focus:ring-purple-500 focus:border-transparent'
                    }`}
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
                    value={formData.balance || 0}
                    readOnly
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg bg-purple-50 font-semibold text-gray-700'
                  />
                </div>

                <div>
                  <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1'>Profit (₹)</label>
                  <div className='relative'>
                    <span className='absolute left-3 top-2.5 text-gray-500 font-semibold'>₹</span>
                    <input
                      type='number'
                      name='profit'
                      value={formData.profit}
                      onChange={handleChange}
                      onKeyDown={handleFieldKeyDown}
                      placeholder='0'
                      min='0'
                      className='w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-semibold'
                    />
                  </div>
                </div>

                <div>
                  <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1'>Payment Mode</label>
                  <select
                    name='paymentMode'
                    value={formData.paymentMode || 'Cash'}
                    onChange={handleChange}
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-semibold bg-white'
                  >
                    <option value='Cash'>Cash</option>
                    <option value='Bank'>Bank</option>
                    <option value='UPI'>UPI</option>
                  </select>
                </div>
              </div>

              <div className='mt-4 pt-4 border-t border-purple-200'>
                <div className='flex justify-between items-center mb-3'>
                  <h4 className='text-sm md:text-base font-bold text-gray-800'>Fee Breakup (Optional)</h4>
                  <button
                    type='button'
                    onClick={addFeeBreakupItem}
                    className='px-3 py-1.5 text-xs md:text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-semibold flex items-center gap-1'
                  >
                    <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 4v16m8-8H4' />
                    </svg>
                    Add Item
                  </button>
                </div>

                <div className='space-y-2'>
                  {formData.feeBreakup.map((item, index) => (
                    <div key={index} className='grid grid-cols-1 md:grid-cols-12 gap-2 bg-purple-50 p-2 rounded-lg border border-purple-200'>
                      <div className='md:col-span-5'>
                        <input
                          type='text'
                          placeholder='Fee name'
                          value={item.name}
                          onChange={(e) => handleFeeBreakupChange(index, 'name', e.target.value)}
                          onKeyDown={handleFieldKeyDown}
                          className='w-full px-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm font-semibold'
                        />
                      </div>
                      <div className='md:col-span-6'>
                        <div className='relative'>
                          <span className='absolute left-3 top-2.5 text-gray-500 font-semibold'>₹</span>
                          <input
                            type='number'
                            placeholder='Amount'
                            value={item.amount}
                            onChange={(e) => handleFeeBreakupChange(index, 'amount', e.target.value)}
                            onKeyDown={handleFieldKeyDown}
                            min='0'
                            className='w-full pl-8 pr-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm font-semibold'
                          />
                        </div>
                      </div>
                      <div className='md:col-span-1 flex items-center justify-center'>
                        <button
                          type='button'
                          onClick={() => removeFeeBreakupItem(index)}
                          className='p-2 text-red-600 hover:bg-red-100 rounded-lg transition'
                          title='Remove this item'
                        >
                          <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className='mt-4 pt-4 border-t border-purple-200'>
                <div className='flex justify-between items-center mb-3'>
                  <h4 className='text-sm md:text-base font-bold text-gray-800'>Expense Breakdown (Optional)</h4>
                  <button
                    type='button'
                    onClick={addExpenseBreakupItem}
                    className='px-3 py-1.5 text-xs md:text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-semibold flex items-center gap-1'
                  >
                    <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 4v16m8-8H4' />
                    </svg>
                    Add Expense
                  </button>
                </div>

                {formData.expenseBreakup.length === 0 ? (
                  <div className='bg-purple-50 border-2 border-dashed border-purple-300 rounded-lg p-4 text-center'>
                    <p className='text-sm text-purple-600 font-semibold'>No expenses added yet. Click "Add Expense" to add expense details.</p>
                  </div>
                ) : (
                  <div className='space-y-2'>
                    {formData.expenseBreakup.map((item, index) => (
                      <div key={index} className='grid grid-cols-1 md:grid-cols-12 gap-2 bg-purple-50 p-2 rounded-lg border border-purple-200'>
                        <div className='md:col-span-5'>
                          <input
                            type='text'
                            placeholder='Expense name'
                            value={item.name}
                            onChange={(e) => handleExpenseBreakupChange(index, 'name', e.target.value)}
                            onKeyDown={handleFieldKeyDown}
                            className='w-full px-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm font-semibold'
                          />
                        </div>
                        <div className='md:col-span-6'>
                          <div className='relative'>
                            <span className='absolute left-3 top-2.5 text-gray-500 font-semibold'>₹</span>
                            <input
                              type='number'
                              placeholder='Amount'
                              value={item.amount}
                              onChange={(e) => handleExpenseBreakupChange(index, 'amount', e.target.value)}
                              onKeyDown={handleFieldKeyDown}
                              min='0'
                              className='w-full pl-8 pr-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm font-semibold'
                            />
                          </div>
                        </div>
                        <div className='md:col-span-1 flex items-center justify-center'>
                          <button
                            type='button'
                            onClick={() => removeExpenseBreakupItem(index)}
                            className='p-2 text-red-600 hover:bg-red-100 rounded-lg transition'
                            title='Remove this expense'
                          >
                            <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                    <div className='flex justify-end items-center bg-purple-100 p-2 rounded-lg border border-purple-300'>
                      <span className='text-sm font-bold text-gray-800'>Total Expense: </span>
                      <span className='text-sm font-bold text-purple-700 ml-2'>
                        ₹{formData.expenseBreakup.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                )}
              </div>

            {/* Payment Received Breakdown Section */}
            <div className='mt-4 pt-4 border-t border-purple-200'>
              <div className='flex justify-between items-center mb-3'>
                <h4 className='text-sm md:text-base font-bold text-gray-800'>Payment Received Breakdown (Optional)</h4>
                <button
                  type='button'
                  onClick={addPaymentReceivedItem}
                  className='px-3 py-1.5 text-xs md:text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-semibold flex items-center gap-1'
                >
                  <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 4v16m8-8H4' />
                  </svg>
                  Add Payment
                </button>
              </div>

              {paymentReceived.length === 0 ? (
                <div className='bg-purple-50 border-2 border-dashed border-purple-300 rounded-lg p-4 text-center'>
                  <p className='text-sm text-purple-600 font-semibold'>No payments recorded yet. Click "Add Payment" to add payment received details.</p>
                </div>
              ) : (
                <div className='space-y-2'>
                  {paymentReceived.map((item, index) => (
                    <div key={index} className='grid grid-cols-1 md:grid-cols-12 gap-2 bg-purple-50 p-2 rounded-lg border border-purple-200'>
                      <div className='md:col-span-4'>
                        <input
                          type='date'
                          value={item.date}
                          onChange={(e) => handlePaymentReceivedChange(index, 'date', e.target.value)}
                          className='w-full px-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm font-semibold'
                        />
                      </div>
                      <div className='md:col-span-3'>
                        <div className='relative'>
                          <span className='absolute left-3 top-2.5 text-gray-500 font-semibold'>₹</span>
                          <input
                            type='number'
                            placeholder='Amount'
                            value={item.amount}
                            onChange={(e) => handlePaymentReceivedChange(index, 'amount', e.target.value)}
                            min='0'
                            className='w-full pl-8 pr-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm font-semibold'
                          />
                        </div>
                      </div>
                      <div className='md:col-span-3'>
                        <select
                          value={item.paymentMode}
                          onChange={(e) => handlePaymentReceivedChange(index, 'paymentMode', e.target.value)}
                          className='w-full px-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm font-semibold bg-white'
                        >
                          <option value='Cash'>Cash</option>
                          <option value='Bank'>Bank</option>
                          <option value='UPI'>UPI</option>
                        </select>
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
                  <div className='flex justify-end items-center bg-purple-100 p-2 rounded-lg border border-purple-300'>
                    <span className='text-sm font-bold text-gray-800'>Total Received: </span>
                    <span className='text-sm font-bold text-purple-700 ml-2'>
                      ₹{paymentReceived.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              )}
            </div>

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

          <div className='flex-shrink-0 bg-gray-50 p-3 md:p-4 border-t border-gray-200 flex justify-end gap-2 md:gap-3'>
            <button
              type='button'
              onClick={onClose}
              className='px-4 md:px-6 py-2 text-sm md:text-base text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-100 transition font-semibold'
            >
              Cancel
            </button>
            <button
              type='submit'
              disabled={loading}
              className='px-4 md:px-6 py-2 text-sm md:text-base bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-lg hover:from-teal-700 hover:to-cyan-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2'
            >
              {loading ? (
                <>
                  <svg className='animate-spin h-4 w-4 md:h-5 md:w-5' fill='none' viewBox='0 0 24 24'>
                    <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' />
                    <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z' />
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <svg className='w-4 h-4 md:w-5 md:h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
                  </svg>
                  {editData ? 'Update' : 'Save'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddRegistrationRenewalModal
