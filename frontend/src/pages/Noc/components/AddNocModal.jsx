import { useState, useEffect } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { validateVehicleNumberRealtime, enforceVehicleNumberFormat } from '../../../utils/vehicleNoCheck'
import { handlePaymentCalculation, validatePaidAmount } from '../../../utils/paymentValidation'
import { replacePaymentsForWork, getPaymentsByWork } from '../../../utils/paymentReceivedApi'
import { replaceExpensesForWork, getExpensesByWork } from '../../../utils/expenseBreakdownApi'
import DefaultExpenseSettingsModal from '../../../components/DefaultExpenseSettingsModal'
import { getDefaultExpensesApi } from '../../../utils/defaultExpenseSettingsApi'
import { useAuth } from '../../../context/AuthContext'

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
  feeBreakup: defaultFeeBreakup,
  remarks: ''
}

const AddNocModal = ({ isOpen, onClose, onSuccess, editData }) => {
  const { user } = useAuth()
  const [formData, setFormData] = useState(initialState)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [vehicleValidation, setVehicleValidation] = useState({ isValid: false, message: '' })
  const [paidExceedsTotal, setPaidExceedsTotal] = useState(false)
  const [paymentReceived, setPaymentReceived] = useState([{ date: '', amount: '', paymentMode: 'Cash', remark: '', receivedBy: '' }])
  const [showAdditionalDetails, setShowAdditionalDetails] = useState(user?.features?.expandAdditionalDetails === true)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [expenseItems, setExpenseItems] = useState([{ date: '', name: '', amount: '', remark: '' }])
  const [employees, setEmployees] = useState([])

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
        feeBreakup: editData.feeBreakup?.length ? editData.feeBreakup : defaultFeeBreakup,
        remarks: editData.remarks || ''
      })

      if (editData.vehicleNumber) {
        setVehicleValidation(validateVehicleNumberRealtime(editData.vehicleNumber))
      }
      // Fetch expenses for edit
      getExpensesByWork('NOC', editData._id).then(res => {
        const fetched = res.data
        if (Array.isArray(fetched) && fetched.length > 0) {
          const normalizeForInput = (d) => d && /^\d{2}-\d{2}-\d{4}$/.test(d) ? d.split('-').reverse().join('-') : (d || '')
          setExpenseItems(fetched.map(item => ({
            date: normalizeForInput(item.date),
            name: item.name || '',
            amount: item.amount || '',
            remark: item.remark || ''
          })))
        } else {
          setExpenseItems([{ date: '', name: '', amount: '', remark: '' }])
        }
      }).catch(() => setExpenseItems([{ date: '', name: '', amount: '', remark: '' }]))
    } else {
      setFormData(initialState)
      setVehicleValidation({ isValid: false, message: '' })
      
      // Fetch default expenses from DB for NOC
      getDefaultExpensesApi('NOC')
        .then(res => {
          const fetched = res.data?.expenses
          if (Array.isArray(fetched) && fetched.length > 0) {
            setExpenseItems(fetched.map(item => ({ date: '', name: item.name || '', amount: item.amount || '', remark: '' })))
          } else {
            setExpenseItems([{ date: '', name: '', amount: '', remark: '' }])
          }
        })
        .catch(err => {
          console.error(err)
          setExpenseItems([{ date: '', name: '', amount: '', remark: '' }])
        })
    }

    setError('')
    setPaidExceedsTotal(false)

    if (editData?._id) {
      getPaymentsByWork('NOC', editData._id).then(res => {
        const payments = res.data.map(p => ({ date: p.date, amount: p.amount, paymentMode: p.paymentMode, remark: p.remark || '' }))
        setPaymentReceived(payments.length > 0 ? payments : [{ date: '', amount: '', paymentMode: 'Cash', remark: '' }])
      }).catch(() => setPaymentReceived([{ date: '', amount: '', paymentMode: 'Cash', remark: '' }]))
    } else {
      setPaymentReceived([{ date: '', amount: '', paymentMode: 'Cash', remark: '' }])
    }
  }, [isOpen, editData])

  // Auto-calculate profit from totalFee - totalExpenses
  useEffect(() => {
    const totalExpenses = expenseItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0)
    const totalFee = parseFloat(formData.totalFee) || 0
    const calculatedProfit = totalFee - totalExpenses
    setFormData(prev => {
      if (prev.profit === calculatedProfit.toString()) return prev
      return { ...prev, profit: calculatedProfit.toString() }
    })
  }, [expenseItems, formData.totalFee])

  // Auto-fill paid from paymentReceived total
  useEffect(() => {
    const totalReceived = paymentReceived.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0)
    const hasEnteredAmount = paymentReceived.some(p => p.amount !== '' && parseFloat(p.amount) > 0)
    if (hasEnteredAmount) {
      setFormData(prev => {
        const totalFee = parseFloat(prev.totalFee) || 0
        const newPaid = totalReceived > totalFee ? totalFee : totalReceived
        const newBalance = totalFee - newPaid
        if (prev.paid === newPaid.toString() && prev.balance === newBalance.toString()) return prev
        return {
          ...prev,
          paid: newPaid.toString(),
          balance: newBalance.toString()
        }
      })
    }
  }, [paymentReceived])

  useEffect(() => {
    axios.get(`${API_URL}/api/employees`, { withCredentials: true })
      .then(res => setEmployees(res.data.data || []))
      .catch(() => {})
  }, [])

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
        feeBreakup: formData.feeBreakup.filter((item) => item.name && item.amount && parseFloat(item.amount) > 0)
      }

      const url = editData ? `${API_URL}/api/noc/${editData._id}` : `${API_URL}/api/noc`
      const response = editData
        ? await axios.put(url, payload, { withCredentials: true })
        : await axios.post(url, payload, { withCredentials: true })

      if (response.data.success) {
        const recordId = response.data.data?._id || editData?._id
        const validPayments = paymentReceived.filter(p => p.date && p.amount && parseFloat(p.amount) > 0)

        const defaultDate = formData.date || new Date().toISOString().slice(0, 10).split('-').reverse().join('-')
        const validExpenses = expenseItems
          .filter(e => e.name && e.amount && parseFloat(e.amount) > 0)
          .map(e => ({ ...e, date: e.date || defaultDate }))

        if (recordId) {
          try {
            if (validPayments.length > 0) {
              await replacePaymentsForWork('NOC', recordId, validPayments)
            }
          } catch (paymentErr) {
            console.error('Failed to save payment received entries:', paymentErr)
            toast.warn('NOC saved, but payment breakdown could not be saved.')
          }
          try {
            await replaceExpensesForWork('NOC', recordId, validExpenses)
          } catch (expenseErr) {
            console.error('Failed to save expense entries:', expenseErr)
            toast.warn('NOC saved, but expense breakdown could not be saved.')
          }
        }
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
    setExpenseItems(prev => [...prev, { date: '', name: '', amount: '', remark: '' }])
  }

  const removeExpenseBreakupItem = (index) => {
    setExpenseItems(prev => prev.filter((_, i) => i !== index))
  }

  const handleExpenseBreakupChange = (index, field, value) => {
    setExpenseItems(prev => prev.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    ))
  }

  const addPaymentReceivedItem = () => {
    setPaymentReceived(prev => [...prev, { date: '', amount: '', paymentMode: 'Cash', remark: '', receivedBy: '' }])
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
    <div className='fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-2 md:p-4'>
      <div className='bg-white rounded-xl md:rounded-2xl shadow-2xl max-w-[59rem] w-full max-h-[95vh] overflow-hidden flex flex-col'>
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
                  <svg className={`w-5 h-5 text-rose-600 transition-transform duration-200 ${showAdditionalDetails ? 'rotate-180' : ''}`} fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
                  </svg>
                </div>
              </button>

              {showAdditionalDetails && (
                <div className='mt-4 space-y-4'>
                  {/* Expense Breakdown Section */}
                  <div className='bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-lg p-3 md:p-4'>
                    <div className='flex justify-between items-center mb-3'>
                      <h4 className='text-sm md:text-base font-bold text-gray-800 flex items-center gap-2'>
                        Expense Breakdown (Optional)
                        <button
                          type='button'
                          onClick={() => setIsSettingsOpen(true)}
                          className='p-1 text-orange-600 hover:bg-orange-100 rounded-lg transition ml-1'
                          title='Set Default Expenses'
                        >
                          <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z' />
                          </svg>
                        </button>
                      </h4>
                      <button type='button' onClick={addExpenseBreakupItem} className='px-3 py-1.5 text-xs md:text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-semibold flex items-center gap-1'>
                        <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 4v16m8-8H4' /></svg>
                        Add Expense
                      </button>
                    </div>

                    {expenseItems.length === 0 ? (
                      <div className='bg-orange-100 border-2 border-dashed border-orange-300 rounded-lg p-4 text-center'>
                        <p className='text-sm text-orange-700 font-semibold'>No expenses added yet. Click &quot;Add Expense&quot; to add expense details.</p>
                      </div>
                    ) : (
                      <div className='space-y-2'>
                        {expenseItems.map((item, index) => (
                          <div key={index} className='grid grid-cols-1 md:grid-cols-12 gap-2 bg-white p-2 rounded-lg border border-orange-200'>
                            <div className='md:col-span-2'>
                              <input
                                type='date'
                                value={item.date || ''}
                                onChange={(e) => handleExpenseBreakupChange(index, 'date', e.target.value)}
                                className='w-full px-3 py-2 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm font-semibold'
                                title='Expense Date (Optional)'
                              />
                            </div>
                            <div className='md:col-span-3'>
                              <input
                                type='text'
                                placeholder='Expense name'
                                value={item.name}
                                onChange={(e) => handleExpenseBreakupChange(index, 'name', e.target.value)}
                                onKeyDown={handleFieldKeyDown}
                                className='w-full px-3 py-2 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm font-semibold'
                              />
                            </div>
                            <div className='md:col-span-2'>
                              <div className='relative'>
                                <span className='absolute left-3 top-2.5 text-gray-500 font-semibold'>₹</span>
                                <input
                                  type='number'
                                  placeholder='Amount'
                                  value={item.amount}
                                  onChange={(e) => handleExpenseBreakupChange(index, 'amount', e.target.value)}
                                  onKeyDown={handleFieldKeyDown}
                                  min='0'
                                  className='w-full pl-8 pr-3 py-2 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm font-semibold'
                                />
                              </div>
                            </div>
                            <div className='md:col-span-3'>
                              <input
                                type='text'
                                placeholder='Notes (optional)'
                                value={item.remark || ''}
                                onChange={(e) => handleExpenseBreakupChange(index, 'remark', e.target.value)}
                                onKeyDown={handleFieldKeyDown}
                                className='w-full px-3 py-2 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm'
                              />
                            </div>
                            <div className='md:col-span-2 flex items-center justify-center'>
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
                        <div className='flex justify-end items-center bg-orange-100 p-2 rounded-lg border border-orange-300'>
                          <span className='text-sm font-bold text-gray-800'>Total Expense: </span>
                          <span className='text-sm font-bold text-orange-700 ml-2'>
                            ₹{expenseItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0).toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Payment Received Breakdown Section */}
                  <div className='bg-gradient-to-r from-cyan-50 to-teal-50 border border-cyan-200 rounded-lg p-3 md:p-4'>
                    <div className='flex justify-between items-center mb-3'>
                      <h4 className='text-sm md:text-base font-bold text-gray-800'>Payment Received Breakdown (Optional)</h4>
                      <button type='button' onClick={addPaymentReceivedItem} className='px-3 py-1.5 text-xs md:text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition font-semibold flex items-center gap-1'>
                        <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 4v16m8-8H4' /></svg>
                        Add Payment
                      </button>
                    </div>

                    {paymentReceived.length === 0 ? (
                      <div className='bg-cyan-50 border-2 border-dashed border-cyan-300 rounded-lg p-4 text-center'>
                        <p className='text-sm text-cyan-700 font-semibold'>No payments recorded yet. Click &quot;Add Payment&quot; to add payment received details.</p>
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
                            <div className='md:col-span-2'>
                              <select
                                value={item.receivedBy}
                                onChange={(e) => handlePaymentReceivedChange(index, 'receivedBy', e.target.value)}
                                className='w-full px-3 py-2 border border-cyan-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm font-semibold bg-white'
                              >
                                <option value='' disabled>Payment Received By</option>
                                {employees?.filter(e => e.isActive !== false).map(emp => (
                                  <option key={emp._id} value={emp.name}>{emp.name}</option>
                                ))}
                              </select>
                            </div>
                            <div className='md:col-span-2'>
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
                          {paymentReceived.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0) > (parseFloat(formData.totalFee) || 0) && (
                            <p className='text-xs text-red-600 font-semibold mt-1'>
                              Total received cannot exceed total fee (₹{formData.totalFee || 0})
                            </p>
                          )}
                        </div>
                      </div>
                    )}
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
      <DefaultExpenseSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        type="NOC"
        onSave={(newDefaults) => {
          setExpenseItems(newDefaults.map(item => ({ date: '', name: item.name || '', amount: item.amount || '', remark: '' })))
        }}
      />
    </div>
  )
}

export default AddNocModal
