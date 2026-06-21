import { useState, useEffect } from 'react'
import { getDefaultExpensesApi, updateDefaultExpensesApi } from '../utils/defaultExpenseSettingsApi'
import { toast } from 'react-toastify'

const DefaultExpenseSettingsModal = ({ isOpen, onClose, type, onSave }) => {
  const [items, setItems] = useState([{ name: '', amount: '' }])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen && type) {
      setLoading(true)
      getDefaultExpensesApi(type)
        .then(res => {
          const fetched = res.data?.expenses
          if (Array.isArray(fetched) && fetched.length > 0) {
            setItems(fetched.map(item => ({ name: item.name || '', amount: item.amount || '' })))
          } else {
            setItems([{ name: '', amount: '' }])
          }
        })
        .catch(err => {
          console.error(err)
          toast.error('Failed to load default expenses.')
          setItems([{ name: '', amount: '' }])
        })
        .finally(() => {
          setLoading(false)
        })
    }
  }, [isOpen, type])

  const handleItemChange = (index, field, value) => {
    setItems(prev => prev.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    ))
  }

  const addItem = () => {
    setItems(prev => [...prev, { name: '', amount: '' }])
  }

  const removeItem = (index) => {
    setItems(prev => prev.filter((_, i) => i !== index))
  }

  const handleSave = () => {
    // Filter out items that are completely blank
    const filteredItems = items.filter(item => item.name.trim() || item.amount.trim())
    setLoading(true)
    updateDefaultExpensesApi(type, filteredItems)
      .then(res => {
        toast.success('Default expenses saved successfully!')
        if (onSave) {
          onSave(res.data.expenses)
        }
        onClose()
      })
      .catch(err => {
        console.error(err)
        toast.error('Failed to save settings.')
      })
      .finally(() => {
        setLoading(false)
      })
  }

  if (!isOpen) return null

  const getTitle = () => {
    switch (type) {
      case 'DL': return 'Driving License Default Expenses'
      case 'VT': return 'Vehicle Transfer Default Expenses'
      case 'NOC': return 'NOC Default Expenses'
      case 'RR': return 'Registration Renewal Default Expenses'
      default: return 'Default Expenses Settings'
    }
  }

  return (
    <div className='fixed inset-0 bg-black/60 z-[80] flex items-center justify-center p-4'>
      <div className='bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-hidden flex flex-col'>
        {/* Header */}
        <div className='bg-gradient-to-r from-gray-700 to-gray-900 p-4 text-white flex justify-between items-center'>
          <h3 className='text-lg font-bold flex items-center gap-2'>
            <svg className='w-5 h-5 text-gray-300' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' />
            </svg>
            {getTitle()}
          </h3>
          <button onClick={onClose} className='text-gray-400 hover:text-white transition'>
            <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className='p-6 overflow-y-auto flex-1 space-y-4'>
          <p className='text-xs text-gray-500'>
            Configure the template for default expense rows. These will automatically populate when you open a new form.
          </p>

          {loading ? (
            <div className='flex justify-center items-center py-10'>
              <svg className='animate-spin h-8 w-8 text-gray-600' fill='none' viewBox='0 0 24 24'>
                <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' />
                <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z' />
              </svg>
            </div>
          ) : (
            <div className='space-y-3'>
              {items.map((item, index) => (
                <div key={index} className='flex items-center gap-2'>
                  <input
                    type='text'
                    placeholder='Expense Name (e.g. RTO Fee)'
                    value={item.name}
                    onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                    className='flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-500 focus:border-transparent bg-white text-gray-800 font-semibold'
                  />
                  <div className='relative w-32'>
                    <span className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-semibold'>₹</span>
                    <input
                      type='number'
                      placeholder='Amount'
                      value={item.amount}
                      onChange={(e) => handleItemChange(index, 'amount', e.target.value)}
                      className='w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-500 focus:border-transparent bg-white text-gray-800 font-semibold'
                    />
                  </div>
                  <button
                    type='button'
                    onClick={() => removeItem(index)}
                    className='p-2 text-red-500 hover:bg-red-50 rounded-full transition shrink-0'
                    title='Remove'
                  >
                    <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          <button
            type='button'
            onClick={addItem}
            className='inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 font-semibold transition'
            disabled={loading}
          >
            <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 4v16m8-8H4' />
            </svg>
            Add Default Expense
          </button>
        </div>

        {/* Footer */}
        <div className='p-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3'>
          <button
            type='button'
            onClick={onClose}
            className='px-4 py-2 border border-gray-300 text-gray-700 bg-white rounded-lg hover:bg-gray-100 transition text-sm font-semibold'
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type='button'
            onClick={handleSave}
            className='px-5 py-2 bg-gradient-to-r from-gray-700 to-gray-900 text-white rounded-lg hover:shadow-lg transition text-sm font-semibold flex items-center gap-1.5 disabled:opacity-50'
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Template'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default DefaultExpenseSettingsModal
