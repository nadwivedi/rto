import { useEffect } from 'react'

const ViewTaxDetailModal = ({ isOpen, onClose, tax }) => {
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen || !tax) return null

  const getStatusColor = (taxTo) => {
    if (!taxTo) return 'bg-gray-100 text-gray-700'
    const today = new Date()
    const dateParts = taxTo.split(/[/-]/)
    const taxToDate = new Date(`${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`)
    const diffTime = taxToDate - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) return 'bg-red-100 text-red-700 border-red-300'
    if (diffDays <= 15) return 'bg-orange-100 text-orange-700 border-orange-300'
    return 'bg-green-100 text-green-700 border-green-300'
  }

  const getStatusText = (taxTo) => {
    if (!taxTo) return 'Unknown'
    const today = new Date()
    const dateParts = taxTo.split(/[/-]/)
    const taxToDate = new Date(`${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`)
    const diffTime = taxToDate - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) return 'Expired'
    if (diffDays <= 15) return 'Expiring Soon'
    return 'Active'
  }

  const paymentStatus = tax.balanceAmount > 0 ? 'Pending' : 'Paid'
  const paymentStatusColor = tax.balanceAmount > 0
    ? 'bg-amber-100 text-amber-800 border-amber-300'
    : 'bg-emerald-100 text-emerald-800 border-emerald-300'

  return (
    <div className='fixed inset-0 bg-black/60  z-[70] flex items-center justify-center p-2 md:p-4'>
      <div className='bg-white rounded-xl md:rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden flex flex-col'>
        {/* Header */}
        <div className='bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-4 md:p-6 text-white flex-shrink-0'>
          <div className='flex justify-between items-start'>
            <div className='flex-1'>
              <h2 className='text-xl md:text-3xl font-bold mb-2'>Tax Record Details</h2>
              <p className='text-indigo-100 text-sm md:text-base'>Receipt No: {tax.receiptNo}</p>
            </div>
            <button
              onClick={onClose}
              className='text-white hover:bg-white/20 rounded-lg p-2 transition cursor-pointer ml-4'
              aria-label='Close modal'
            >
              <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className='flex-1 overflow-y-auto p-4 md:p-6 bg-gradient-to-br from-gray-50 via-indigo-50 to-purple-50'>
          {/* Status Cards */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-6'>
            {/* Tax Status Card */}
            <div className='bg-white rounded-xl shadow-lg border-2 border-indigo-100 p-4'>
              <div className='flex items-center justify-between mb-3'>
                <h3 className='text-sm font-bold text-gray-600 uppercase tracking-wide'>Tax Status</h3>
                <svg className='w-6 h-6 text-indigo-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' />
                </svg>
              </div>
              <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold border-2 ${getStatusColor(tax.taxTo)}`}>
                {getStatusText(tax.taxTo)}
              </span>
            </div>

            {/* Payment Status Card */}
            <div className='bg-white rounded-xl shadow-lg border-2 border-purple-100 p-4'>
              <div className='flex items-center justify-between mb-3'>
                <h3 className='text-sm font-bold text-gray-600 uppercase tracking-wide'>Payment Status</h3>
                <svg className='w-6 h-6 text-purple-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
                </svg>
              </div>
              <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold border-2 ${paymentStatusColor}`}>
                {paymentStatus}
              </span>
            </div>
          </div>

          {/* Vehicle Information */}
          <div className='bg-white rounded-xl shadow-lg border-2 border-indigo-100 p-4 md:p-6 mb-4'>
            <h3 className='text-lg md:text-xl font-bold text-gray-800 mb-4 flex items-center gap-2 border-b-2 border-indigo-100 pb-3'>
              <div className='w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center'>
                <svg className='w-5 h-5 text-white' fill='currentColor' viewBox='0 0 20 20'>
                  <path d='M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z' />
                  <path d='M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z' />
                </svg>
              </div>
              Vehicle Information
            </h3>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-4 border border-indigo-200'>
                <p className='text-xs font-bold text-gray-500 uppercase tracking-wide mb-2'>Vehicle Number</p>
                <p className='text-lg font-mono font-black text-gray-900'>{tax.vehicleNumber}</p>
              </div>
              <div className='bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200'>
                <p className='text-xs font-bold text-gray-500 uppercase tracking-wide mb-2'>Owner Name</p>
                <p className='text-lg font-bold text-gray-900'>{tax.ownerName || '-'}</p>
              </div>
            </div>
          </div>

          {/* Payment Information */}
          <div className='bg-white rounded-xl shadow-lg border-2 border-emerald-100 p-4 md:p-6 mb-4'>
            <h3 className='text-lg md:text-xl font-bold text-gray-800 mb-4 flex items-center gap-2 border-b-2 border-emerald-100 pb-3'>
              <div className='w-8 h-8 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg flex items-center justify-center'>
                <svg className='w-5 h-5 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
                </svg>
              </div>
              Payment Information
            </h3>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              <div className='bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border-2 border-blue-200'>
                <p className='text-xs font-bold text-gray-500 uppercase tracking-wide mb-2'>Total Amount</p>
                <p className='text-2xl font-black text-blue-700'>₹{(tax.totalAmount || 0).toLocaleString('en-IN')}</p>
              </div>
              <div className='bg-gradient-to-br from-emerald-50 to-green-50 rounded-lg p-4 border-2 border-emerald-200'>
                <p className='text-xs font-bold text-gray-500 uppercase tracking-wide mb-2'>Paid Amount</p>
                <p className='text-2xl font-black text-emerald-700'>₹{(tax.paidAmount || 0).toLocaleString('en-IN')}</p>
              </div>
              <div className={`rounded-lg p-4 border-2 ${
                tax.balanceAmount > 0
                  ? 'bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200'
                  : 'bg-gradient-to-br from-gray-50 to-slate-50 border-gray-200'
              }`}>
                <p className='text-xs font-bold text-gray-500 uppercase tracking-wide mb-2'>Balance Amount</p>
                <p className={`text-2xl font-black ${
                  tax.balanceAmount > 0 ? 'text-orange-700' : 'text-gray-500'
                }`}>
                  ₹{(tax.balanceAmount || 0).toLocaleString('en-IN')}
                </p>
              </div>
            </div>

            {/* Payment Status Alert */}
            {tax.balanceAmount > 0 && (
              <div className='mt-4 bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg'>
                <div className='flex items-center'>
                  <svg className='w-5 h-5 text-amber-600 mr-3 flex-shrink-0' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' />
                  </svg>
                  <div>
                    <p className='text-sm font-bold text-amber-800'>Partial Payment</p>
                    <p className='text-xs text-amber-700 mt-1'>Balance of ₹{tax.balanceAmount.toLocaleString('en-IN')} is pending</p>
                  </div>
                </div>
              </div>
            )}
            {tax.balanceAmount === 0 && (
              <div className='mt-4 bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-r-lg'>
                <div className='flex items-center'>
                  <svg className='w-5 h-5 text-emerald-600 mr-3 flex-shrink-0' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' />
                  </svg>
                  <div>
                    <p className='text-sm font-bold text-emerald-800'>Fully Paid</p>
                    <p className='text-xs text-emerald-700 mt-1'>All payments have been completed</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Tax Period */}
          <div className='bg-white rounded-xl shadow-lg border-2 border-purple-100 p-4 md:p-6'>
            <h3 className='text-lg md:text-xl font-bold text-gray-800 mb-4 flex items-center gap-2 border-b-2 border-purple-100 pb-3'>
              <div className='w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center'>
                <svg className='w-5 h-5 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' />
                </svg>
              </div>
              Tax Period
            </h3>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border-2 border-green-200'>
                <p className='text-xs font-bold text-gray-500 uppercase tracking-wide mb-2'>Tax From</p>
                <div className='flex items-center text-green-700'>
                  <svg className='w-5 h-5 mr-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' />
                  </svg>
                  <p className='text-lg font-black'>{tax.taxFrom}</p>
                </div>
              </div>
              <div className='bg-gradient-to-r from-red-50 to-orange-50 rounded-lg p-4 border-2 border-red-200'>
                <p className='text-xs font-bold text-gray-500 uppercase tracking-wide mb-2'>Tax To</p>
                <div className='flex items-center text-red-700'>
                  <svg className='w-5 h-5 mr-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' />
                  </svg>
                  <p className='text-lg font-black'>{tax.taxTo}</p>
                </div>
              </div>
            </div>

            {/* Expiry Warning */}
            {getStatusText(tax.taxTo) === 'Expiring Soon' && (
              <div className='mt-4 bg-orange-50 border-l-4 border-orange-500 p-4 rounded-r-lg'>
                <div className='flex items-center'>
                  <svg className='w-5 h-5 text-orange-600 mr-3 flex-shrink-0' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' />
                  </svg>
                  <div>
                    <p className='text-sm font-bold text-orange-800'>Expiring Soon</p>
                    <p className='text-xs text-orange-700 mt-1'>This tax will expire within 15 days. Please renew it soon.</p>
                  </div>
                </div>
              </div>
            )}
            {getStatusText(tax.taxTo) === 'Expired' && (
              <div className='mt-4 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg'>
                <div className='flex items-center'>
                  <svg className='w-5 h-5 text-red-600 mr-3 flex-shrink-0' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' />
                  </svg>
                  <div>
                    <p className='text-sm font-bold text-red-800'>Tax Expired</p>
                    <p className='text-xs text-red-700 mt-1'>This tax has expired. Please renew immediately to avoid penalties.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className='border-t border-gray-200 p-4 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 flex-shrink-0'>
          <button
            onClick={onClose}
            className='w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all font-bold shadow-lg hover:shadow-xl transform hover:scale-105 cursor-pointer'
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default ViewTaxDetailModal
