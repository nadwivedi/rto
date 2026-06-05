import { useState, useEffect } from 'react'
import { getDaysRemaining } from '../../../utils/dateHelpers'

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080'

const BusPermitDetailsModal = ({ isOpen, onClose, permit }) => {
  const [showAdditionalDetails, setShowAdditionalDetails] = useState(false)

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

  if (!isOpen || !permit) return null

  const documentUrl = permit.documents?.permitDocument
    ? `${API_URL}${permit.documents.permitDocument}`
    : null
  const isPDF = documentUrl?.toLowerCase().endsWith('.pdf')

  return (
    <div className='fixed inset-0 bg-black/60 flex items-center justify-center z-[70] p-4'>
      <div className='bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden'>
        {/* Modal Header */}
        <div className='bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-6 text-white'>
          <div className='flex justify-between items-center'>
            <div>
              <h2 className='text-2xl font-black mb-1'>Bus Permit Details</h2>
              <p className='text-blue-100 text-sm'>Permit: {permit.permitNumber || 'N/A'} | Vehicle: {permit.vehicleNo}</p>
            </div>
            <button
              onClick={onClose}
              className='w-10 h-10 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-all cursor-pointer'
            >
              <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
              </svg>
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className='overflow-y-auto max-h-[calc(90vh-100px)] p-6'>
          {/* Main Details */}
          <div className='mb-6'>
            <h3 className='text-xl font-black text-gray-800 mb-4 flex items-center gap-2'>
              <svg className='w-6 h-6 text-blue-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' />
              </svg>
              Permit Information
            </h3>
            <div className='bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <label className='text-xs font-bold text-blue-700 uppercase'>Vehicle Number</label>
                  <p className='text-sm font-semibold text-gray-800 mt-1 font-mono'>{permit.vehicleNo}</p>
                </div>
                <div>
                  <label className='text-xs font-bold text-blue-700 uppercase'>Permit Number</label>
                  <p className='text-sm font-semibold text-gray-800 mt-1'>{permit.permitNumber || 'N/A'}</p>
                </div>
                <div>
                  <label className='text-xs font-bold text-blue-700 uppercase'>Permit Holder</label>
                  <p className='text-sm font-semibold text-gray-800 mt-1'>{permit.permitHolder}</p>
                </div>
                <div>
                  <label className='text-xs font-bold text-blue-700 uppercase'>Mobile Number</label>
                  <p className='text-sm font-semibold text-gray-800 mt-1'>{permit.mobileNumber || 'N/A'}</p>
                </div>
                <div>
                  <label className='text-xs font-bold text-blue-700 uppercase'>Valid From</label>
                  <p className='text-sm font-semibold text-gray-800 mt-1'>{permit.validFrom}</p>
                </div>
                <div>
                  <label className='text-xs font-bold text-blue-700 uppercase'>Valid To</label>
                  <p className='text-sm font-semibold text-gray-800 mt-1'>{permit.validTill || permit.validTo}</p>
                </div>
                <div>
                  <label className='text-xs font-bold text-blue-700 uppercase'>Category</label>
                  <p className='text-sm font-semibold text-gray-800 mt-1'>{permit.category || 'N/A'}</p>
                </div>
                <div>
                  <label className='text-xs font-bold text-blue-700 uppercase'>Route</label>
                  <p className='text-sm font-semibold text-gray-800 mt-1'>{permit.routeFrom} - {permit.routeTo}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Fee Breakdown */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-6'>
            <div className='bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200'>
              <h4 className='text-sm font-black text-green-700 mb-4 flex items-center gap-2'>
                <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
                </svg>
                Fee Breakdown
              </h4>
              <div className='space-y-3'>
                <div className='flex justify-between items-center pb-2 border-b border-green-200'>
                  <span className='text-xs font-bold text-gray-600 uppercase'>Total Fee</span>
                  <span className='text-lg font-black text-gray-800'>₹{(permit.totalFee || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className='flex justify-between items-center pb-2 border-b border-green-200'>
                  <span className='text-xs font-bold text-gray-600 uppercase'>Paid</span>
                  <span className='text-lg font-black text-emerald-600'>₹{(permit.paid || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className='flex justify-between items-center'>
                  <span className='text-xs font-bold text-gray-600 uppercase'>Balance</span>
                  <span className={`text-lg font-black ${(permit.balance || 0) > 0 ? 'text-orange-600' : 'text-gray-500'}`}>
                    ₹{(permit.balance || 0).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            {/* Status & Validity */}
            <div className='bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-200'>
              <h4 className='text-sm font-black text-purple-700 mb-4 flex items-center gap-2'>
                <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' />
                </svg>
                Status & Validity
              </h4>
              <div className='space-y-3'>
                <div className='flex justify-between items-center pb-2 border-b border-purple-200'>
                  <span className='text-xs font-bold text-gray-600 uppercase'>Status</span>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
                    permit.status === 'active' ? 'bg-green-100 text-green-700' :
                    permit.status === 'expiring_soon' ? 'bg-orange-100 text-orange-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {permit.status === 'active' ? 'Active' :
                     permit.status === 'expiring_soon' ? 'Expiring Soon' :
                     permit.status === 'expired' ? 'Expired' : permit.status}
                  </span>
                </div>
                {permit.validTill && (
                  <div className='flex justify-between items-center'>
                    <span className='text-xs font-bold text-gray-600 uppercase'>Days Remaining</span>
                    <span className={`text-lg font-black ${
                      getDaysRemaining(permit.validTill) <= 7
                        ? 'text-red-600'
                        : getDaysRemaining(permit.validTill) <= 30
                          ? 'text-orange-600'
                          : 'text-green-600'
                    }`}>
                      {getDaysRemaining(permit.validTill)} days
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Document Preview */}
          {documentUrl && (
            <div className='mb-6'>
              <h3 className='text-xl font-black text-gray-800 mb-4 flex items-center gap-2'>
                <svg className='w-6 h-6 text-amber-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z' />
                </svg>
                Bus Permit Document
              </h3>
              <div className='bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl p-4 border border-amber-200'>
                {isPDF ? (
                  <div className='w-full'>
                    <iframe
                      src={documentUrl}
                      className='w-full h-[500px] rounded-xl border border-amber-300'
                      title='Bus Permit Document'
                    />
                    <div className='mt-3 flex justify-center'>
                      <a
                        href={documentUrl}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-all text-sm font-semibold'
                      >
                        <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' />
                        </svg>
                        Open in new tab
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className='flex flex-col items-center'>
                    <img
                      src={documentUrl}
                      alt='Bus Permit Document'
                      className='max-w-full max-h-[500px] rounded-xl border border-amber-300 object-contain'
                    />
                    <a
                      href={documentUrl}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='mt-3 inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-all text-sm font-semibold'
                    >
                      <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' />
                      </svg>
                      View full size
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Additional Details - Expandable */}
          <div className='border-2 border-gray-200 rounded-2xl overflow-hidden'>
            <button
              onClick={() => setShowAdditionalDetails(!showAdditionalDetails)}
              className='w-full bg-gray-50 p-4 hover:bg-gray-100 transition-colors cursor-pointer'
            >
              <div className='flex items-center justify-between'>
                <h3 className='text-lg font-black text-gray-800 flex items-center gap-2'>
                  <svg className='w-5 h-5 text-gray-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
                  </svg>
                  Additional Details
                </h3>
                <svg
                  className={`w-6 h-6 text-gray-600 transition-transform duration-200 ${showAdditionalDetails ? 'rotate-180' : ''}`}
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
                </svg>
              </div>
            </button>

            {showAdditionalDetails && (
              <div className='p-6'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div>
                    <label className='text-xs font-bold text-gray-600 uppercase'>Address</label>
                    <p className='text-sm font-semibold text-gray-800 mt-1'>{permit.address || 'N/A'}</p>
                  </div>
                  <div>
                    <label className='text-xs font-bold text-gray-600 uppercase'>WhatsApp Messages</label>
                    <p className='text-sm font-semibold text-gray-800 mt-1'>{permit.whatsappMessageCount || 0}</p>
                  </div>
                  {permit.lastWhatsappSentAt && (
                    <div>
                      <label className='text-xs font-bold text-gray-600 uppercase'>Last WhatsApp Sent</label>
                      <p className='text-sm font-semibold text-gray-800 mt-1'>
                        {new Date(permit.lastWhatsappSentAt).toLocaleString('en-IN')}
                      </p>
                    </div>
                  )}
                  <div>
                    <label className='text-xs font-bold text-gray-600 uppercase'>Created At</label>
                    <p className='text-sm font-semibold text-gray-800 mt-1'>
                      {permit.createdAt ? new Date(permit.createdAt).toLocaleDateString('en-IN') : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className='border-t border-gray-200 p-6 bg-gray-50'>
          <div className='flex justify-end'>
            <button
              onClick={onClose}
              className='px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all font-semibold cursor-pointer'
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BusPermitDetailsModal