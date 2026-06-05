import { useEffect, useState } from 'react'
import { getDaysRemaining } from '../../../utils/dateHelpers'

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'

const NationalPermitDetailsModal = ({ isOpen, onClose, permit, onViewBill }) => {
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

  return (
    <div className='fixed inset-0 bg-black/60  flex items-center justify-center z-[70] p-4'>
      <div className='bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden'>
        {/* Modal Header */}
        <div className='bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-6 text-white'>
          <div className='flex justify-between items-center'>
            <div>
              <h2 className='text-2xl font-black mb-1'>National Permit Details</h2>
              <p className='text-blue-100 text-sm'>Permit No: {permit.permitNumber}</p>
            </div>
            <button
              onClick={onClose}
              className='w-10 h-10 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-all'
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
              Main Permit Details
            </h3>
            <div className='bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <label className='text-xs font-bold text-blue-700 uppercase'>Vehicle Number</label>
                  <p className='text-sm font-semibold text-gray-800 mt-1'>{permit.partA.vehicleNumber}</p>
                </div>
                <div>
                  <label className='text-xs font-bold text-blue-700 uppercase'>Permit Number</label>
                  <p className='text-sm font-semibold text-gray-800 mt-1'>{permit.partA.permitNumber}</p>
                </div>
                <div>
                  <label className='text-xs font-bold text-blue-700 uppercase'>Permit Holder Name</label>
                  <p className='text-sm font-semibold text-gray-800 mt-1'>{permit.partA.ownerName}</p>
                </div>
                <div>
                  <label className='text-xs font-bold text-blue-700 uppercase'>Mobile Number</label>
                  <p className='text-sm font-semibold text-gray-800 mt-1'>{permit.partA.ownerMobile}</p>
                </div>
                <div>
                  <label className='text-xs font-bold text-blue-700 uppercase'>Valid From</label>
                  <p className='text-sm font-semibold text-gray-800 mt-1'>{permit.partA.permitValidFrom}</p>
                </div>
                <div>
                  <label className='text-xs font-bold text-blue-700 uppercase'>Valid Upto</label>
                  <p className='text-sm font-semibold text-gray-800 mt-1'>{permit.partA.permitValidUpto}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Type B Authorization & Fees */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-6'>
            <div className='bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-200'>
              <div className='flex justify-between items-start mb-3'>
                <h4 className='text-sm font-black text-purple-700 flex items-center gap-2'>
                  <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' />
                  </svg>
                  TYPE B AUTHORIZATION - CURRENT
                </h4>
                {/* Active Badge */}
                <span className='px-2 py-1 bg-green-500 text-white text-xs font-bold rounded-full'>
                  ACTIVE
                </span>
              </div>
              <p className='text-sm font-semibold text-gray-800 font-mono'>{permit.partB.authorizationNumber}</p>
              <div className='mt-3 pt-3 border-t border-purple-200'>
                <div className='grid grid-cols-2 gap-2 text-xs'>
                  <div>
                    <span className='text-purple-600 font-bold'>Valid From:</span>
                    <p className='text-gray-800 font-semibold'>{permit.partB.validFrom}</p>
                  </div>
                  <div>
                    <span className='text-purple-600 font-bold'>Valid To:</span>
                    <p className='text-gray-800 font-semibold'>{permit.partB.validTo}</p>
                  </div>
                </div>
                {/* Days Remaining */}
                {permit.partB?.validTo && (
                  <div className='mt-2 pt-2 border-t border-purple-200'>
                    <span className='text-purple-600 font-bold text-xs'>Days Remaining:</span>
                    <p className={`text-sm font-black mt-1 ${
                      getDaysRemaining(permit.partB.validTo) <= 7
                        ? 'text-red-600'
                        : getDaysRemaining(permit.partB.validTo) <= 35
                          ? 'text-orange-600'
                          : 'text-green-600'
                    }`}>
                      {getDaysRemaining(permit.partB.validTo)} days
                    </p>
                  </div>
                )}
              </div>

              {/* Download/Share buttons for renewed Part B */}
              {permit.partB?.renewalHistory && permit.partB.renewalHistory.length > 0 && (() => {
                console.log('Renewal History:', permit.partB.renewalHistory)
                // Find the latest renewal (current Part B bill)
                const latestRenewal = permit.partB.renewalHistory
                  .filter(r => !r.isOriginal)
                  .sort((a, b) => new Date(b.renewalDate) - new Date(a.renewalDate))[0]

                console.log('Latest Renewal:', latestRenewal)
                console.log('Has billPdfPath?', latestRenewal?.billPdfPath)

                return latestRenewal && latestRenewal.billPdfPath ? (
                  <div className='mt-3 pt-3 border-t border-purple-200'>
                    <div className='flex gap-2'>
                      <button
                        onClick={async () => {
                          try {
                            const downloadUrl = `${API_URL}/api/national-permits/${permit.id}/part-b-renewals/${latestRenewal._id}/download-pdf`
                            const link = document.createElement('a')
                            link.href = downloadUrl
                            link.download = `${latestRenewal.billNumber}.pdf`
                            link.target = '_blank'
                            document.body.appendChild(link)
                            link.click()
                            document.body.removeChild(link)
                          } catch (error) {
                            console.error('Error downloading Part B bill:', error)
                            alert('Failed to download bill')
                          }
                        }}
                        className='flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all text-xs font-semibold'
                      >
                        <svg className='w-3 h-3' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' />
                        </svg>
                        Bill
                      </button>
                      <button
                        onClick={() => {
                          const pdfUrl = `${API_URL}${latestRenewal.billPdfPath}`
                          const message = `Hello ${permit.permitHolder},

Your Part B Renewal Bill is ready!

*Bill Number:* ${latestRenewal.billNumber}
*Authorization Number:* ${latestRenewal.authorizationNumber}
*Permit Number:* ${permit.permitNumber}
*Valid From:* ${latestRenewal.validFrom}
*Valid To:* ${latestRenewal.validTo}
*Amount:* ₹${latestRenewal.fees?.toLocaleString('en-IN')}

Download your Part B renewal bill here:
${pdfUrl}

Thank you for your business!
- Ashok Kumar (Transport Consultant)`

                          const encodedMessage = encodeURIComponent(message)
                          const phoneNumber = (permit.partA?.ownerMobile || '').replace(/\D/g, '')

                          if (!phoneNumber) {
                            alert('No mobile number found')
                            return
                          }

                          const formattedPhone = phoneNumber.startsWith('91') ? phoneNumber : `91${phoneNumber}`
                          const whatsappWebUrl = `https://web.whatsapp.com/send?phone=${formattedPhone}&text=${encodedMessage}`
                          window.open(whatsappWebUrl, 'whatsapp_share')
                        }}
                        className='flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all text-xs font-semibold'
                      >
                        <svg className='w-3 h-3' fill='currentColor' viewBox='0 0 24 24'>
                          <path d='M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z'/>
                        </svg>
                        WhatsApp
                      </button>
                    </div>
                  </div>
                ) : null
              })()}

              {/* Renewal History Link - if available */}
              {permit.partB?.renewalHistory && permit.partB.renewalHistory.length > 0 && (
                <div className='mt-3 pt-3 border-t border-purple-200'>
                  <button
                    className='text-xs text-purple-600 font-bold hover:text-purple-800 flex items-center gap-1'
                    onClick={(e) => {
                      e.stopPropagation()
                      alert(`Renewal History: ${permit.partB.renewalHistory.length} renewals found`)
                    }}
                  >
                    <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' />
                    </svg>
                    View Renewal History ({permit.partB.renewalHistory.length})
                  </button>
                </div>
              )}
            </div>

            <div className='bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200'>
              <h4 className='text-sm font-black text-green-700 mb-4 flex items-center gap-2'>
                <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
                </svg>
                FEE BREAKDOWN
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
          </div>

          {/* Documents Preview */}
          {(permit.partA?.partADocument || permit.partB?.partBDocument) && (
            <div className='mb-6'>
              <h3 className='text-xl font-black text-gray-800 mb-4 flex items-center gap-2'>
                <svg className='w-6 h-6 text-blue-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z' />
                </svg>
                Documents
              </h3>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                {permit.partA?.partADocument && (
                  <div className='bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-200'>
                    <h4 className='text-sm font-black text-blue-700 mb-3 flex items-center gap-2'>
                      <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' />
                      </svg>
                      Part A Document
                    </h4>
                    {permit.partA.partADocument.match(/\.pdf$/i) ? (
                      <iframe
                        src={`${API_URL}${permit.partA.partADocument}`}
                        className='w-full h-48 rounded-lg border border-blue-200'
                        title='Part A Document'
                      />
                    ) : (
                      <img
                        src={`${API_URL}${permit.partA.partADocument}`}
                        alt='Part A Document'
                        className='w-full h-48 object-contain rounded-lg border border-blue-200 bg-white'
                      />
                    )}
                    <a
                      href={`${API_URL}${permit.partA.partADocument}`}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='mt-2 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800'
                    >
                      <svg className='w-3 h-3' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14' />
                      </svg>
                      Open in new tab
                    </a>
                  </div>
                )}
                {permit.partB?.partBDocument && (
                  <div className='bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-4 border border-purple-200'>
                    <h4 className='text-sm font-black text-purple-700 mb-3 flex items-center gap-2'>
                      <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' />
                      </svg>
                      Part B Document
                    </h4>
                    {permit.partB.partBDocument.match(/\.pdf$/i) ? (
                      <iframe
                        src={`${API_URL}${permit.partB.partBDocument}`}
                        className='w-full h-48 rounded-lg border border-purple-200'
                        title='Part B Document'
                      />
                    ) : (
                      <img
                        src={`${API_URL}${permit.partB.partBDocument}`}
                        alt='Part B Document'
                        className='w-full h-48 object-contain rounded-lg border border-purple-200 bg-white'
                      />
                    )}
                    <a
                      href={`${API_URL}${permit.partB.partBDocument}`}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='mt-2 inline-flex items-center gap-1 text-xs font-semibold text-purple-600 hover:text-purple-800'
                    >
                      <svg className='w-3 h-3' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14' />
                      </svg>
                      Open in new tab
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
            <div className='p-6 space-y-6'>
              {/* Helper function to check if value exists and is not N/A */}
              {(() => {
                const hasValue = (val) => val && val !== 'N/A' && val !== ''

                // Check for Personal Information fields
                const hasFatherName = hasValue(permit.partA.fatherName)
                const hasEmail = hasValue(permit.partA.email)
                const hasAddress = hasValue(permit.partA.ownerAddress)
                const hasPersonalInfo = hasFatherName || hasEmail || hasAddress

                // Check for Vehicle Information fields
                const hasVehicleModel = hasValue(permit.partA.makerModel)
                const hasVehicleType = hasValue(permit.partA.vehicleType)
                const hasVehicleClass = hasValue(permit.partA.vehicleClass)
                const hasYearOfManufacture = hasValue(permit.partA.yearOfManufacture)
                const hasChassisNumber = hasValue(permit.partA.chassisNumber)
                const hasEngineNumber = hasValue(permit.partA.engineNumber)
                const hasSeatingCapacity = hasValue(permit.partA.seatingCapacity)
                const hasMaxLoadCapacity = hasValue(permit.partB.maxLoadCapacity)
                const hasVehicleInfo = hasVehicleModel || hasVehicleType || hasVehicleClass || hasYearOfManufacture ||
                                      hasChassisNumber || hasEngineNumber || hasSeatingCapacity || hasMaxLoadCapacity

                // Check for Insurance Details
                const hasPolicyNumber = hasValue(permit.partB.insuranceDetails?.policyNumber)
                const hasCompany = hasValue(permit.partB.insuranceDetails?.company)
                const hasInsuranceValidUpto = hasValue(permit.partB.insuranceDetails?.validUpto)
                const hasInsuranceInfo = hasPolicyNumber || hasCompany || hasInsuranceValidUpto

                // Check for Tax Details
                const hasTaxPaidUpto = hasValue(permit.partB.taxDetails?.taxPaidUpto)
                const hasTaxAmount = hasValue(permit.partB.taxDetails?.taxAmount)
                const hasTaxInfo = hasTaxPaidUpto || hasTaxAmount

                return (
                  <>
                    {/* Personal Information */}
                    {hasPersonalInfo && (
                      <div>
                        <h4 className='text-sm font-black text-indigo-700 mb-3 uppercase'>Personal Information</h4>
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-4 bg-indigo-50/50 rounded-xl p-4'>
                          {hasFatherName && (
                            <div>
                              <label className='text-xs font-bold text-gray-600 uppercase'>Father's Name</label>
                              <p className='text-sm font-semibold text-gray-800 mt-1'>{permit.partA.fatherName}</p>
                            </div>
                          )}
                          {hasEmail && (
                            <div>
                              <label className='text-xs font-bold text-gray-600 uppercase'>Email</label>
                              <p className='text-sm font-semibold text-gray-800 mt-1'>{permit.partA.email}</p>
                            </div>
                          )}
                          {hasAddress && (
                            <div className='md:col-span-2'>
                              <label className='text-xs font-bold text-gray-600 uppercase'>Address</label>
                              <p className='text-sm font-semibold text-gray-800 mt-1'>{permit.partA.ownerAddress}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Vehicle Information */}
                    {hasVehicleInfo && (
                      <div>
                        <h4 className='text-sm font-black text-purple-700 mb-3 uppercase'>Vehicle Information</h4>
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-4 bg-purple-50/50 rounded-xl p-4'>
                          {hasVehicleModel && (
                            <div>
                              <label className='text-xs font-bold text-gray-600 uppercase'>Vehicle Model</label>
                              <p className='text-sm font-semibold text-gray-800 mt-1'>{permit.partA.makerModel}</p>
                            </div>
                          )}
                          {hasVehicleType && (
                            <div>
                              <label className='text-xs font-bold text-gray-600 uppercase'>Vehicle Type</label>
                              <p className='text-sm font-semibold text-gray-800 mt-1'>{permit.partA.vehicleType}</p>
                            </div>
                          )}
                          {hasVehicleClass && (
                            <div>
                              <label className='text-xs font-bold text-gray-600 uppercase'>Vehicle Class</label>
                              <p className='text-sm font-semibold text-gray-800 mt-1'>{permit.partA.vehicleClass}</p>
                            </div>
                          )}
                          {hasYearOfManufacture && (
                            <div>
                              <label className='text-xs font-bold text-gray-600 uppercase'>Year of Manufacture</label>
                              <p className='text-sm font-semibold text-gray-800 mt-1'>{permit.partA.yearOfManufacture}</p>
                            </div>
                          )}
                          {hasChassisNumber && (
                            <div>
                              <label className='text-xs font-bold text-gray-600 uppercase'>Chassis Number</label>
                              <p className='text-sm font-semibold text-gray-800 mt-1 font-mono'>{permit.partA.chassisNumber}</p>
                            </div>
                          )}
                          {hasEngineNumber && (
                            <div>
                              <label className='text-xs font-bold text-gray-600 uppercase'>Engine Number</label>
                              <p className='text-sm font-semibold text-gray-800 mt-1 font-mono'>{permit.partA.engineNumber}</p>
                            </div>
                          )}
                          {hasSeatingCapacity && (
                            <div>
                              <label className='text-xs font-bold text-gray-600 uppercase'>Seating Capacity</label>
                              <p className='text-sm font-semibold text-gray-800 mt-1'>{permit.partA.seatingCapacity}</p>
                            </div>
                          )}
                          {hasMaxLoadCapacity && (
                            <div>
                              <label className='text-xs font-bold text-gray-600 uppercase'>Max Load Capacity</label>
                              <p className='text-sm font-semibold text-gray-800 mt-1'>{permit.partB.maxLoadCapacity}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Insurance Details */}
                    {hasInsuranceInfo && (
                      <div>
                        <h4 className='text-sm font-black text-orange-700 mb-3 uppercase'>Insurance Details</h4>
                        <div className='grid grid-cols-1 md:grid-cols-3 gap-4 bg-orange-50/50 rounded-xl p-4'>
                          {hasPolicyNumber && (
                            <div>
                              <label className='text-xs font-bold text-gray-600 uppercase'>Policy Number</label>
                              <p className='text-sm font-semibold text-gray-800 mt-1'>{permit.partB.insuranceDetails.policyNumber}</p>
                            </div>
                          )}
                          {hasCompany && (
                            <div>
                              <label className='text-xs font-bold text-gray-600 uppercase'>Company</label>
                              <p className='text-sm font-semibold text-gray-800 mt-1'>{permit.partB.insuranceDetails.company}</p>
                            </div>
                          )}
                          {hasInsuranceValidUpto && (
                            <div>
                              <label className='text-xs font-bold text-gray-600 uppercase'>Valid Upto</label>
                              <p className='text-sm font-semibold text-gray-800 mt-1'>{permit.partB.insuranceDetails.validUpto}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Tax Details */}
                    {hasTaxInfo && (
                      <div>
                        <h4 className='text-sm font-black text-red-700 mb-3 uppercase'>Tax Details</h4>
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-4 bg-red-50/50 rounded-xl p-4'>
                          {hasTaxPaidUpto && (
                            <div>
                              <label className='text-xs font-bold text-gray-600 uppercase'>Tax Paid Upto</label>
                              <p className='text-sm font-semibold text-gray-800 mt-1'>{permit.partB.taxDetails.taxPaidUpto}</p>
                            </div>
                          )}
                          {hasTaxAmount && (
                            <div>
                              <label className='text-xs font-bold text-gray-600 uppercase'>Tax Amount</label>
                              <p className='text-sm font-semibold text-gray-800 mt-1'>{permit.partB.taxDetails.taxAmount}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )
              })()}
            </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className='border-t border-gray-200 p-6 bg-gray-50'>
          <div className='flex justify-end gap-3'>
            <button
              onClick={onClose}
              className='px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all font-semibold'
            >
              Close
            </button>
            <button
              onClick={() => {
                onViewBill(permit)
              }}
              className='px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl hover:shadow-lg transition-all font-semibold'
            >
              View Bill
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NationalPermitDetailsModal
