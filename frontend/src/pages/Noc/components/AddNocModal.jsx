import { useState, useEffect } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { validateVehicleNumberRealtime, enforceVehicleNumberFormat } from '../../../utils/vehicleNoCheck'
import { handlePaymentCalculation, validatePaidAmount } from '../../../utils/paymentValidation'

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080'

const defaultFeeBreakup = [
  { name: 'NOC Fee', amount: '' },
  { name: 'RTO Charges', amount: '' }
]

const initialState = {
  date: '',
  vehicleNumber: '',
  ownerName: '',
  mobileNumber: '',
  nocFrom: '',
  nocTo: '',
  totalFee: '',
  paid: '',
  balance: '',
  profit: '',
  expenseBreakup: [],
  feeBreakup: defaultFeeBreakup,
  remarks: ''
}

const AddNocModal = ({ isOpen, onClose, onSuccess, editData }) => {
  const [formData, setFormData] = useState(initialState)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [vehicleValidation, setVehicleValidation] = useState({ isValid: false, message: '' })
  const [paidExceedsTotal, setPaidExceedsTotal] = useState(false)

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
    if (!isOpen) return

    if (editData) {
      setFormData({
        date: editData.date || '',
        vehicleNumber: editData.vehicleNumber || '',
        ownerName: editData.ownerName || '',
        mobileNumber: editData.mobileNumber || '',
        nocFrom: editData.nocFrom || '',
        nocTo: editData.nocTo || '',
        totalFee: editData.totalFee || '',
        paid: editData.paid || '',
        balance: editData.balance || '',
        profit: editData.profit?.toString() || '',
        expenseBreakup: (editData.expenseBreakup || []).map(item => ({ ...item })),
        feeBreakup: editData.feeBreakup?.length ? editData.feeBreakup : defaultFeeBreakup,
        remarks: editData.remarks || ''
      })

      if (editData.vehicleNumber) {
        setVehicleValidation(validateVehicleNumberRealtime(editData.vehicleNumber))
      }
    } else {
      setFormData(initialState)
      setVehicleValidation({ isValid: false, message: '' })
    }

    setError('')
    setPaidExceedsTotal(false)
  }, [isOpen, editData])

  const handleChange = (e) => {
    const { name, value } = e.target

    if (name === 'vehicleNumber') {
      const enforcedValue = enforceVehicleNumberFormat(formData.vehicleNumber, value)
      const validation = validateVehicleNumberRealtime(enforcedValue)
      setVehicleValidation(validation)

      setFormData((prev) => ({
        ...prev,
        vehicleNumber: enforcedValue
      }))
      return
    }

    if (name === 'totalFee' || name === 'paid') {
      setFormData((prev) => {
        const paymentResult = handlePaymentCalculation(name, value, prev)
        const totalFeeValue = name === 'totalFee' ? value : prev.totalFee
        const paidValue = name === 'paid' ? paymentResult.paid : prev.paid
        setPaidExceedsTotal(validatePaidAmount(paidValue, totalFeeValue))

        return {
          ...prev,
          totalFee: name === 'totalFee' ? value : prev.totalFee,
          paid: name === 'paid' ? paymentResult.paid : prev.paid,
          balance: paymentResult.balance
        }
      })
      return
    }

    const uppercaseFields = ['ownerName', 'nocFrom', 'nocTo']
    const finalValue = uppercaseFields.includes(name) ? value.toUpperCase() : value

    setFormData((prev) => ({
      ...prev,
      [name]: finalValue
    }))
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
    setFormData((prev) => ({
      ...prev,
      feeBreakup: [...prev.feeBreakup, { name: '', amount: '' }]
    }))
  }

  const removeFeeBreakupItem = (index) => {
    setFormData((prev) => ({
      ...prev,
      feeBreakup: prev.feeBreakup.filter((_, i) => i !== index)
    }))
  }

  const handleFeeBreakupChange = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      feeBreakup: prev.feeBreakup.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (paidExceedsTotal) {
      setError('Paid amount cannot be more than total fee')
      return
    }

    setLoading(true)
    setError('')

    try {
      const payload = {
        ...formData,
        date: formData.date || undefined,
        feeBreakup: formData.feeBreakup.filter((item) => item.name && item.amount && parseFloat(item.amount) > 0),
        expenseBreakup: formData.expenseBreakup.filter((item) => item.name && item.amount && parseFloat(item.amount) > 0)
      }

      const url = editData ? `${API_URL}/api/noc/${editData._id}` : `${API_URL}/api/noc`
      const response = editData
        ? await axios.put(url, payload, { withCredentials: true })
        : await axios.post(url, payload, { withCredentials: true })

      if (response.data.success) {
        toast.success(editData ? 'NOC updated successfully' : 'NOC added successfully', {
          autoClose: 1200
        })
        onSuccess()
        onClose()
      } else {
        setError(response.data.message || 'Failed to save NOC record')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save NOC record')
    } finally {
      setLoading(false)
    }
  }

  // Expense Breakup Handlers
  const addExpenseBreakupItem = () => {
    setFormData((prev) => ({
      ...prev,
      expenseBreakup: [...prev.expenseBreakup, { name: '', amount: '' }]
    }))
  }

  const removeExpenseBreakupItem = (index) => {
    setFormData((prev) => ({
      ...prev,
      expenseBreakup: prev.expenseBreakup.filter((_, i) => i !== index)
    }))
  }

  const handleExpenseBreakupChange = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      expenseBreakup: prev.expenseBreakup.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    }))
  }

  if (!isOpen) return null

  return (
    <div className='fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-2 md:p-4'>
      <div className='bg-white rounded-xl md:rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden flex flex-col'>
        <div className='bg-gradient-to-r from-teal-600 to-cyan-600 p-2 md:p-3 text-white flex-shrink-0'>
          <div className='flex justify-between items-center'>
            <div>
              <h2 className='text-lg md:text-2xl font-bold'>{editData ? 'Edit NOC' : 'New NOC'}</h2>
              <p className='text-teal-100 text-xs md:text-sm mt-1'>No Objection Certificate details</p>
            </div>
            <button
              type='button'
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
          .noc-add-form input,
          .noc-add-form select,
          .noc-add-form textarea {
            background-color: #ffffff;
          }
        `}</style>
        <form onSubmit={handleSubmit} className='noc-add-form flex flex-col flex-1 overflow-hidden'>
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

              <div className='grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4'>
                <div>
                  <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1'>Date <span className='text-red-500'>*</span></label>
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
                    onKeyDown={handleFieldKeyDown}
                    required
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent'
                  />
                </div>
                <div>
                  <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1'>Vehicle Number <span className='text-red-500'>*</span></label>
                  <input
                    type='text'
                    name='vehicleNumber'
                    value={formData.vehicleNumber}
                    onChange={handleChange}
                    onKeyDown={handleFieldKeyDown}
                    required
                    maxLength='10'
                    placeholder='CG01AB1234'
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent font-mono'
                  />
                  {vehicleValidation.message && (
                    <p className={`text-xs mt-1 ${vehicleValidation.isValid ? 'text-green-600' : 'text-red-600'}`}>
                      {vehicleValidation.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1'>Owner Name <span className='text-red-500'>*</span></label>
                  <input
                    type='text'
                    name='ownerName'
                    value={formData.ownerName}
                    onChange={handleChange}
                    onKeyDown={handleFieldKeyDown}
                    required
                    placeholder='Enter owner name'
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent'
                  />
                </div>

                <div>
                  <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1'>Mobile Number <span className='text-red-500'>*</span></label>
                  <input
                    type='tel'
                    name='mobileNumber'
                    value={formData.mobileNumber}
                    onChange={handleChange}
                    onKeyDown={handleFieldKeyDown}
                    required
                    pattern='[0-9]{10}'
                    maxLength='10'
                    placeholder='10-digit mobile number'
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent'
                  />
                </div>
              </div>
            </div>

            <div className='bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-3 md:p-6 mb-4 md:mb-6'>
              <h3 className='text-base md:text-lg font-bold text-gray-800 mb-3 md:mb-4 flex items-center gap-2'>
                <span className='bg-blue-600 text-white w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm'>2</span>
                Route Details
              </h3>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4'>
                <div>
                  <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1'>NOC From <span className='text-red-500'>*</span></label>
                  <input
                    type='text'
                    name='nocFrom'
                    value={formData.nocFrom}
                    onChange={handleChange}
                    onKeyDown={handleFieldKeyDown}
                    required
                    placeholder='Origin RTO/City'
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  />
                </div>

                <div>
                  <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1'>NOC To <span className='text-red-500'>*</span></label>
                  <input
                    type='text'
                    name='nocTo'
                    value={formData.nocTo}
                    onChange={handleChange}
                    onKeyDown={handleFieldKeyDown}
                    required
                    placeholder='Destination RTO/City'
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  />
                </div>
              </div>
            </div>

            <div className='bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-3 md:p-6 mb-4 md:mb-6'>
              <h3 className='text-base md:text-lg font-bold text-gray-800 mb-3 md:mb-4 flex items-center gap-2'>
                <span className='bg-purple-600 text-white w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm'>3</span>
                Payment Information
              </h3>

              <div className='grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-4'>
                <div>
                  <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1'>Total Fee (₹) <span className='text-red-500'>*</span></label>
                  <input
                    type='number'
                    name='totalFee'
                    value={formData.totalFee}
                    onChange={handleChange}
                    onKeyDown={handleFieldKeyDown}
                    required
                    min='0'
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-semibold'
                  />
                </div>

                <div>
                  <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1'>Paid (₹) <span className='text-red-500'>*</span></label>
                  <input
                    type='number'
                    name='paid'
                    value={formData.paid}
                    onChange={handleChange}
                    onKeyDown={handleFieldKeyDown}
                    required
                    min='0'
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 font-semibold ${
                      paidExceedsTotal ? 'border-red-500 focus:ring-red-500 bg-red-50' : 'border-gray-300 focus:ring-purple-500 focus:border-transparent'
                    }`}
                  />
                </div>

                <div>
                  <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1'>Balance (₹) <span className='text-xs text-gray-500'>(Auto)</span></label>
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
                        <input
                          type='number'
                          placeholder='Amount'
                          value={item.amount}
                          onChange={(e) => handleFeeBreakupChange(index, 'amount', e.target.value)}
                          onKeyDown={handleFieldKeyDown}
                          min='0'
                          className='w-full px-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm font-semibold'
                        />
                      </div>
                      <div className='md:col-span-1 flex items-center justify-center'>
                        <button
                          type='button'
                          onClick={() => removeFeeBreakupItem(index)}
                          className='p-2 text-red-600 hover:bg-red-100 rounded-lg transition'
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

              <div className='mt-4'>
                <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1'>Remarks (Optional)</label>
                <textarea
                  name='remarks'
                  value={formData.remarks}
                  onChange={handleChange}
                  onKeyDown={handleFieldKeyDown}
                  rows='2'
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none'
                />
              </div>
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
              className='px-4 md:px-6 py-2 text-sm md:text-base bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-lg hover:from-teal-700 hover:to-cyan-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed'
            >
              {loading ? 'Saving...' : (editData ? 'Update' : 'Save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddNocModal
