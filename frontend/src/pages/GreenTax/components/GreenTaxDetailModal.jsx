import { useState, useEffect } from 'react'

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'

const GreenTaxDetailModal = ({ isOpen, onClose, record }) => {
  const [docError, setDocError] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen || !record) return null

  const docUrl = record.greenTaxDocument
    ? record.greenTaxDocument.startsWith('http')
      ? record.greenTaxDocument
      : `${API_URL}${record.greenTaxDocument}`
    : null

  const isPDF = docUrl?.includes('.pdf') || docUrl?.includes('application/pdf')
  const isImage = docUrl && !isPDF

  const getStatusBadge = (status) => {
    const styles = {
      'active': 'bg-green-100 text-green-700 border-green-200',
      'expiring_soon': 'bg-amber-100 text-amber-700 border-amber-200',
      'expired': 'bg-red-100 text-red-700 border-red-200'
    }
    const labels = { 'active': 'Active', 'expiring_soon': 'Expiring Soon', 'expired': 'Expired' }
    return <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold border ${styles[record.status] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>{labels[record.status] || record.status}</span>
  }

  return (
    <div className='fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-2 md:p-4'>
      <div className='bg-white rounded-xl md:rounded-2xl shadow-2xl max-w-2xl w-full max-h-[95vh] overflow-hidden flex flex-col'>
        <div className='bg-gradient-to-r from-green-600 to-emerald-600 p-3 md:p-4 text-white flex-shrink-0'>
          <div className='flex justify-between items-center'>
            <div>
              <h2 className='text-lg md:text-2xl font-bold'>Green Tax Details</h2>
              <p className='text-green-100 text-xs md:text-sm mt-1'>Vehicle: {record.vehicleNumber || 'N/A'}</p>
            </div>
            <button onClick={onClose} className='text-white hover:bg-white/20 rounded-lg p-1.5 md:p-2 transition cursor-pointer'>
              <svg className='w-5 h-5 md:w-6 md:h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
              </svg>
            </button>
          </div>
        </div>

        <div className='flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6'>
          <div className='bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4 md:p-5'>
            <h3 className='text-base md:text-lg font-bold text-gray-800 mb-3 flex items-center gap-2'>
              <span className='bg-green-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs'>1</span>
              Vehicle & Owner Details
            </h3>
            <div className='grid grid-cols-2 gap-3 md:gap-4 text-xs md:text-sm'>
              <div>
                <span className='block text-gray-500 font-medium'>Vehicle Number</span>
                <span className='block font-bold text-gray-800 mt-0.5'>{record.vehicleNumber || 'N/A'}</span>
              </div>
              <div>
                <span className='block text-gray-500 font-medium'>Owner Name</span>
                <span className='block font-bold text-gray-800 mt-0.5'>{record.ownerName || 'N/A'}</span>
              </div>
              <div>
                <span className='block text-gray-500 font-medium'>Mobile Number</span>
                <span className='block font-bold text-gray-800 mt-0.5'>{record.mobileNumber || 'N/A'}</span>
              </div>
              <div>
                <span className='block text-gray-500 font-medium'>Date of Work</span>
                <span className='block font-bold text-gray-800 mt-0.5'>{record.date || 'N/A'}</span>
              </div>
            </div>
          </div>

          <div className='bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-4 md:p-5'>
            <h3 className='text-base md:text-lg font-bold text-gray-800 mb-3 flex items-center gap-2'>
              <span className='bg-purple-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs'>2</span>
              Green Tax Period
            </h3>
            <div className='grid grid-cols-2 gap-3 md:gap-4 text-xs md:text-sm'>
              <div>
                <span className='block text-gray-500 font-medium'>Tax From</span>
                <span className='block font-bold text-green-700 mt-0.5'>{record.taxFrom || 'N/A'}</span>
              </div>
              <div>
                <span className='block text-gray-500 font-medium'>Tax To</span>
                <span className='block font-bold text-red-700 mt-0.5'>{record.taxTo || 'N/A'}</span>
              </div>
              <div>
                <span className='block text-gray-500 font-medium'>Status</span>
                <div className='mt-0.5'>{getStatusBadge(record.status)}</div>
              </div>
            </div>
          </div>

          <div className='bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-xl p-4 md:p-5'>
            <h3 className='text-base md:text-lg font-bold text-gray-800 mb-3 flex items-center gap-2'>
              <span className='bg-amber-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs'>3</span>
              Payment Information
            </h3>
            <div className='grid grid-cols-3 gap-3 md:gap-4 text-xs md:text-sm'>
              <div>
                <span className='block text-gray-500 font-medium'>Total Amount</span>
                <span className='block font-bold text-gray-800 mt-0.5'>₹{(record.totalAmount || 0).toLocaleString('en-IN')}</span>
              </div>
              <div>
                <span className='block text-gray-500 font-medium'>Paid</span>
                <span className='block font-bold text-emerald-600 mt-0.5'>₹{(record.paidAmount || 0).toLocaleString('en-IN')}</span>
              </div>
              <div>
                <span className='block text-gray-500 font-medium'>Balance</span>
                <span className={`block font-bold mt-0.5 ${(record.balanceAmount || 0) > 0 ? 'text-orange-600' : 'text-gray-500'}`}>
                  ₹{(record.balanceAmount || 0).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          {docUrl && (
            <div className='bg-gradient-to-r from-sky-50 to-blue-50 border-2 border-sky-200 rounded-xl p-4 md:p-5'>
              <h3 className='text-base md:text-lg font-bold text-gray-800 mb-3 flex items-center gap-2'>
                <span className='bg-sky-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs'>4</span>
                Green Tax Document
              </h3>
              <div className='w-full max-h-72 rounded-lg overflow-hidden border border-sky-200 bg-white'>
                {isPDF ? (
                  <div className='flex flex-col items-center justify-center p-8'>
                    <svg className='w-16 h-16 text-red-500 mb-3' fill='currentColor' viewBox='0 0 20 20'>
                      <path fillRule='evenodd' d='M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z' clipRule='evenodd' />
                    </svg>
                    <p className='text-sm font-semibold text-gray-600 mb-2'>Green Tax Document (PDF)</p>
                    <a href={docUrl} target='_blank' rel='noopener noreferrer' className='px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold text-sm'>View PDF</a>
                  </div>
                ) : isImage ? (
                  <img src={docUrl} alt='Green Tax Document' className='w-full h-auto max-h-72 object-contain mx-auto' onError={() => setDocError(true)} />
                ) : null}
                {docError && <div className='p-4 text-center text-red-600 font-semibold text-sm'>Failed to load document</div>}
              </div>
            </div>
          )}

          {record.remarks && (
            <div className='bg-gradient-to-r from-gray-50 to-slate-50 border-2 border-gray-200 rounded-xl p-4 md:p-5'>
              <h3 className='text-base md:text-lg font-bold text-gray-800 mb-3 flex items-center gap-2'>
                <span className='bg-gray-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs'>5</span>
                Remarks
              </h3>
              <p className='text-xs md:text-sm text-gray-700'>{record.remarks}</p>
            </div>
          )}
        </div>

        <div className='border-t border-gray-200 p-3 md:p-4 bg-gray-50 flex justify-end flex-shrink-0'>
          <button onClick={onClose} className='px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:shadow-lg font-semibold transition cursor-pointer'>Close</button>
        </div>
      </div>
    </div>
  )
}

export default GreenTaxDetailModal
