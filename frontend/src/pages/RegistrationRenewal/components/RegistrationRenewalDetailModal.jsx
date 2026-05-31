import { useEffect } from 'react'
import { getVehicleNumberParts } from '../../../utils/vehicleNoCheck'
import { getVehicleNumberDesign } from '../../../context/ThemeContext'

const RegistrationRenewalDetailModal = ({ isOpen, onClose, renewal }) => {
  const vehicleDesign = getVehicleNumberDesign()

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

  if (!isOpen || !renewal) return null

  return (
    <div className='fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-2 md:p-4'>
      <div className='bg-white rounded-xl md:rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden flex flex-col'>
        <div className='bg-gradient-to-r from-indigo-600 to-purple-600 p-2 md:p-3 text-white flex-shrink-0'>
          <div className='flex justify-between items-center'>
            <div>
              <h2 className='text-lg md:text-2xl font-bold'>Registration Renewal Details</h2>
              <p className='text-indigo-100 text-xs md:text-sm mt-1'>View complete renewal information</p>
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

        <div className='flex-1 overflow-y-auto p-3 md:p-6'>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6'>
            <div className='bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 md:p-6 border border-gray-200'>
              <h3 className='text-sm md:text-base font-bold text-gray-800 mb-4 flex items-center gap-2'>
                <svg className='w-5 h-5 text-teal-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' />
                </svg>
                Vehicle Information
              </h3>
              
              <div className='space-y-3'>
                <div className='flex justify-between items-center py-2 border-b border-gray-200'>
                  <span className='text-xs md:text-sm text-gray-600 font-semibold'>Vehicle Number</span>
                  <div className='flex items-center gap-2'>
                    {(() => {
                      const parts = getVehicleNumberParts(renewal.vehicleNumber);
                      if (!parts) {
                        return (
                          <span className='text-xs md:text-sm font-bold text-gray-900'>
                            {renewal.vehicleNumber}
                          </span>
                        );
                      }
                      return (
                        <div className={vehicleDesign.container}>
                          <svg
                            className="w-4 h-6 mr-0.5 text-blue-800 flex-shrink-0"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                            <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z" />
                          </svg>
                          <span className={vehicleDesign.stateCode}>
                            {parts.stateCode}
                          </span>
                          <span className={vehicleDesign.districtCode}>
                            {parts.districtCode}
                          </span>
                          <span className={vehicleDesign.series}>
                            {parts.series}
                          </span>
                          <span className={vehicleDesign.last4Digits}>
                            {parts.last4Digits}
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                <div className='flex justify-between items-center py-2 border-b border-gray-200'>
                  <span className='text-xs md:text-sm text-gray-600 font-semibold'>Date of Work</span>
                  <span className='text-xs md:text-sm font-bold text-gray-900'>{renewal.date || '-'}</span>
                </div>

                <div className='flex justify-between items-center py-2 border-b border-gray-200'>
                  <span className='text-xs md:text-sm text-gray-600 font-semibold'>Owner Name</span>
                  <span className='text-xs md:text-sm font-bold text-gray-900'>{renewal.ownerName}</span>
                </div>

                <div className='flex justify-between items-center py-2 border-b border-gray-200'>
                  <span className='text-xs md:text-sm text-gray-600 font-semibold'>Mobile Number</span>
                  <span className='text-xs md:text-sm font-bold text-gray-900'>{renewal.ownerMobile}</span>
                </div>

                <div className='py-2'>
                  <span className='text-xs md:text-sm text-gray-600 font-semibold block mb-1'>Address</span>
                  <p className='text-xs md:text-sm text-gray-900 font-medium bg-gray-50 p-2 rounded-lg'>{renewal.ownerAddress}</p>
                </div>
              </div>
            </div>

            <div className='bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 md:p-6 border border-gray-200'>
              <h3 className='text-sm md:text-base font-bold text-gray-800 mb-4 flex items-center gap-2'>
                <svg className='w-5 h-5 text-blue-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' />
                </svg>
                Validity Period
              </h3>
              
              <div className='space-y-3'>
                <div className='flex justify-between items-center py-2 border-b border-gray-200'>
                  <span className='text-xs md:text-sm text-gray-600 font-semibold'>Valid From</span>
                  <span className='text-xs md:text-sm font-bold text-blue-700'>{renewal.validFrom}</span>
                </div>

                <div className='flex justify-between items-center py-2 border-b border-gray-200'>
                  <span className='text-xs md:text-sm text-gray-600 font-semibold'>Valid To</span>
                  <span className='text-xs md:text-sm font-bold text-red-600'>{renewal.validTo}</span>
                </div>

                {renewal.byName && (
                  <div className='flex justify-between items-center py-2 border-b border-gray-200'>
                    <span className='text-xs md:text-sm text-gray-600 font-semibold'>Referral Name</span>
                    <span className='text-xs md:text-sm font-bold text-gray-900'>{renewal.byName}</span>
                  </div>
                )}

                {renewal.byMobile && (
                  <div className='flex justify-between items-center py-2 border-b border-gray-200'>
                    <span className='text-xs md:text-sm text-gray-600 font-semibold'>Referral Mobile</span>
                    <span className='text-xs md:text-sm font-bold text-gray-900'>{renewal.byMobile}</span>
                  </div>
                )}
              </div>
            </div>

            <div className='bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 md:p-6 border border-gray-200'>
              <h3 className='text-sm md:text-base font-bold text-gray-800 mb-4 flex items-center gap-2'>
                <svg className='w-5 h-5 text-green-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
                </svg>
                Payment Details
              </h3>
              
              <div className='space-y-3'>
                <div className='flex justify-between items-center py-2 border-b border-gray-200'>
                  <span className='text-xs md:text-sm text-gray-600 font-semibold'>Total Fee</span>
                  <span className='text-xs md:text-sm font-bold text-gray-900'>₹{(renewal.totalFee || 0).toLocaleString('en-IN')}</span>
                </div>

                <div className='flex justify-between items-center py-2 border-b border-gray-200'>
                  <span className='text-xs md:text-sm text-gray-600 font-semibold'>Paid</span>
                  <span className='text-xs md:text-sm font-bold text-green-600'>₹{(renewal.paid || 0).toLocaleString('en-IN')}</span>
                </div>

                <div className='flex justify-between items-center py-2 border-b border-gray-200'>
                  <span className='text-xs md:text-sm text-gray-600 font-semibold'>Balance</span>
                  <span className={`text-xs md:text-sm font-bold ${renewal.balance > 0 ? 'text-orange-600' : 'text-gray-500'}`}>
                    ₹{(renewal.balance || 0).toLocaleString('en-IN')}
                  </span>
                </div>

                <div className='flex justify-between items-center py-2'>
                  <span className='text-xs md:text-sm text-gray-600 font-semibold'>Payment Status</span>
                  <span className={`px-2 py-1 rounded-full text-[10px] md:text-xs font-bold ${
                    renewal.balance > 0 
                      ? 'bg-amber-100 text-amber-700 border border-amber-200' 
                      : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                  }`}>
                    {renewal.balance > 0 ? 'Pending' : 'Paid'}
                  </span>
                </div>
              </div>
            </div>

            {renewal.feeBreakup && renewal.feeBreakup.length > 0 && (
              <div className='bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 md:p-6 border border-gray-200'>
                <h3 className='text-sm md:text-base font-bold text-gray-800 mb-4 flex items-center gap-2'>
                  <svg className='w-5 h-5 text-purple-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z' />
                  </svg>
                  Fee Breakup
                </h3>
                
                <div className='space-y-2'>
                  {renewal.feeBreakup.map((item, index) => (
                    <div key={index} className='flex justify-between items-center py-2 bg-purple-50 px-3 rounded-lg border border-purple-100'>
                      <span className='text-xs md:text-sm font-semibold text-gray-700'>{item.name}</span>
                      <span className='text-xs md:text-sm font-bold text-purple-700'>₹{(item.amount || 0).toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {renewal.remarks && (
              <div className='bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 md:p-6 border border-gray-200 lg:col-span-2'>
                <h3 className='text-sm md:text-base font-bold text-gray-800 mb-4 flex items-center gap-2'>
                  <svg className='w-5 h-5 text-gray-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z' />
                  </svg>
                  Remarks
                </h3>
                <p className='text-xs md:text-sm text-gray-700 font-medium bg-gray-50 p-3 rounded-lg'>{renewal.remarks}</p>
              </div>
            )}

            <div className='bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 md:p-6 border border-gray-200 lg:col-span-2'>
              <h3 className='text-sm md:text-base font-bold text-gray-800 mb-4 flex items-center gap-2'>
                <svg className='w-5 h-5 text-gray-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' />
                </svg>
                Timestamps
              </h3>
              
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div className='flex justify-between items-center py-2 border-b border-gray-200'>
                  <span className='text-xs md:text-sm text-gray-600 font-semibold'>Created At</span>
                  <span className='text-xs md:text-sm font-bold text-gray-900'>
                    {renewal.createdAt ? new Date(renewal.createdAt).toLocaleString('en-IN') : 'N/A'}
                  </span>
                </div>

                <div className='flex justify-between items-center py-2 border-b border-gray-200'>
                  <span className='text-xs md:text-sm text-gray-600 font-semibold'>Last Updated</span>
                  <span className='text-xs md:text-sm font-bold text-gray-900'>
                    {renewal.updatedAt ? new Date(renewal.updatedAt).toLocaleString('en-IN') : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className='flex-shrink-0 bg-gray-50 p-3 md:p-4 border-t border-gray-200 flex justify-end'>
          <button
            onClick={onClose}
            className='px-4 md:px-6 py-2 text-sm md:text-base text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-100 transition font-semibold'
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default RegistrationRenewalDetailModal
