import { useState } from 'react'

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'

const InsuranceDetailModal = ({ isOpen, onClose, insurance }) => {
  const [docError, setDocError] = useState(false)

  if (!isOpen || !insurance) return null

  const docUrl = insurance.insuranceDocument
    ? insurance.insuranceDocument.startsWith('http')
      ? insurance.insuranceDocument
      : `${API_URL}${insurance.insuranceDocument}`
    : null

  const isPDF = docUrl?.includes('.pdf') || docUrl?.includes('application/pdf')
  const isImage = docUrl && !isPDF

  return (
    <div className='fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-2 md:p-4'>
      <div className='bg-white rounded-xl md:rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden flex flex-col'>
        {/* Header */}
        <div className='bg-gradient-to-r from-blue-600 to-indigo-600 p-3 md:p-4 text-white flex-shrink-0'>
          <div className='flex justify-between items-center'>
            <div>
              <h2 className='text-lg md:text-2xl font-bold'>Insurance Details</h2>
              <p className='text-blue-100 text-xs md:text-sm mt-1'>
                Policy: {insurance.policyNumber || 'N/A'} | Vehicle: {insurance.vehicleNumber || 'N/A'}
              </p>
            </div>
            <button onClick={onClose} className='text-white hover:bg-white/20 rounded-lg p-1.5 md:p-2 transition cursor-pointer'>
              <svg className='w-5 h-5 md:w-6 md:h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className='flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6'>
          {/* Vehicle & Policy Details */}
          <div className='bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-indigo-200 rounded-xl p-4 md:p-5'>
            <h3 className='text-base md:text-lg font-bold text-gray-800 mb-3 flex items-center gap-2'>
              <span className='bg-indigo-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs'>1</span>
              Vehicle & Policy Details
            </h3>
            <div className='grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 text-xs md:text-sm'>
              <div>
                <span className='block text-gray-500 font-medium'>Vehicle Number</span>
                <span className='block font-bold text-gray-800 mt-0.5'>{insurance.vehicleNumber || 'N/A'}</span>
              </div>
              <div>
                <span className='block text-gray-500 font-medium'>Policy Number</span>
                <span className='block font-bold text-gray-800 mt-0.5'>{insurance.policyNumber || 'N/A'}</span>
              </div>
              <div>
                <span className='block text-gray-500 font-medium'>Policy Holder</span>
                <span className='block font-bold text-gray-800 mt-0.5'>{insurance.policyHolderName || 'N/A'}</span>
              </div>
              <div>
                <span className='block text-gray-500 font-medium'>Owner Name</span>
                <span className='block font-bold text-gray-800 mt-0.5'>{insurance.ownerName || 'N/A'}</span>
              </div>
              <div>
                <span className='block text-gray-500 font-medium'>Mobile Number</span>
                <span className='block font-bold text-gray-800 mt-0.5'>{insurance.mobileNumber || 'N/A'}</span>
              </div>
              <div>
                <span className='block text-gray-500 font-medium'>Insurance Company</span>
                <span className='block font-bold text-gray-800 mt-0.5'>{insurance.insuranceCompany || 'N/A'}</span>
              </div>
              <div>
                <span className='block text-gray-500 font-medium'>Date of Work</span>
                <span className='block font-bold text-gray-800 mt-0.5'>{insurance.date || 'N/A'}</span>
              </div>
              <div>
                <span className='block text-gray-500 font-medium'>Status</span>
                <span className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  insurance.status === 'Active' ? 'bg-green-100 text-green-700' :
                  insurance.status === 'Expiring Soon' ? 'bg-amber-100 text-amber-700' :
                  insurance.status === 'Expired' ? 'bg-red-100 text-red-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {insurance.status || 'N/A'}
                </span>
              </div>
              <div className='col-span-2'>
                <span className='block text-gray-500 font-medium'>Address</span>
                <span className='block font-bold text-gray-800 mt-0.5'>{insurance.address || insurance.rcDetails?.address || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Validity Period */}
          <div className='bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-4 md:p-5'>
            <h3 className='text-base md:text-lg font-bold text-gray-800 mb-3 flex items-center gap-2'>
              <span className='bg-purple-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs'>2</span>
              Validity Period
            </h3>
            <div className='grid grid-cols-2 gap-3 md:gap-4 text-xs md:text-sm'>
              <div>
                <span className='block text-gray-500 font-medium'>Valid From</span>
                <span className='block font-bold text-green-700 mt-0.5'>{insurance.validFrom || 'N/A'}</span>
              </div>
              <div>
                <span className='block text-gray-500 font-medium'>Valid To</span>
                <span className='block font-bold text-red-700 mt-0.5'>{insurance.validTo || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Payment Information */}
          <div className='bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-emerald-200 rounded-xl p-4 md:p-5'>
            <h3 className='text-base md:text-lg font-bold text-gray-800 mb-3 flex items-center gap-2'>
              <span className='bg-emerald-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs'>3</span>
              Payment Information
            </h3>
            <div className='grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4 text-xs md:text-sm'>
              <div>
                <span className='block text-gray-500 font-medium'>Total Premium</span>
                <span className='block font-bold text-gray-800 mt-0.5'>₹{(insurance.totalFee || 0).toLocaleString('en-IN')}</span>
              </div>
              <div>
                <span className='block text-gray-500 font-medium'>Paid</span>
                <span className='block font-bold text-emerald-600 mt-0.5'>₹{(insurance.paid || 0).toLocaleString('en-IN')}</span>
              </div>
              <div>
                <span className='block text-gray-500 font-medium'>Balance</span>
                <span className={`block font-bold mt-0.5 ${(insurance.balance || 0) > 0 ? 'text-orange-600' : 'text-gray-500'}`}>
                  ₹{(insurance.balance || 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div>
                <span className='block text-gray-500 font-medium'>Commission</span>
                <span className='block font-bold text-purple-600 mt-0.5'>₹{(insurance.commission || 0).toLocaleString('en-IN')}</span>
              </div>
              <div>
                <span className='block text-gray-500 font-medium'>Renew Premium</span>
                <span className='block font-bold text-gray-800 mt-0.5'>₹{(insurance.renewPremium || 0).toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Insurance Document */}
          {docUrl && (
            <div className='bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-4 md:p-5'>
              <h3 className='text-base md:text-lg font-bold text-gray-800 mb-3 flex items-center gap-2'>
                <span className='bg-purple-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs'>4</span>
                Insurance Document
              </h3>
              <div className='w-full max-h-96 rounded-lg overflow-hidden border border-purple-200 bg-white'>
                {isPDF ? (
                  <div className='flex flex-col items-center justify-center p-8'>
                    <svg className='w-16 h-16 text-red-500 mb-3' fill='currentColor' viewBox='0 0 20 20'>
                      <path fillRule='evenodd' d='M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z' clipRule='evenodd' />
                    </svg>
                    <p className='text-sm font-semibold text-gray-600 mb-2'>Insurance Policy Document (PDF)</p>
                    <a
                      href={docUrl}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold text-sm'
                    >
                      View PDF
                    </a>
                  </div>
                ) : isImage ? (
                  <img
                    src={docUrl}
                    alt='Insurance Document'
                    className='w-full h-auto max-h-96 object-contain mx-auto'
                    onError={() => setDocError(true)}
                  />
                ) : null}
                {docError && (
                  <div className='p-4 text-center text-red-600 font-semibold text-sm'>
                    Failed to load document
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className='border-t border-gray-200 p-3 md:p-4 bg-gray-50 flex justify-end flex-shrink-0'>
          <button
            onClick={onClose}
            className='px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg font-semibold transition cursor-pointer'
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default InsuranceDetailModal
