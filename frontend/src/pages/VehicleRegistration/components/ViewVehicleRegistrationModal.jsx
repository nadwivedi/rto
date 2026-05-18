import { useState, useEffect } from 'react'
import ImageViewer from '../../../components/ImageViewer'
import AddFitnessModal from '../../Fitness/components/AddFitnessModal'
import AddTaxModal from '../../Tax/components/AddTaxModal'
import AddPucModal from '../../Puc/components/AddPucModal'
import AddGpsModal from '../../Gps/components/AddGpsModal'
import AddInsuranceModal from '../../Insurance/components/AddInsuranceModal'
import IssueCgPermitModal from '../../CgPermit/components/IssueCgPermitModal'
import IssueNewPermitModal from '../../NationalPermit/components/IssueNewPermitModal'

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'

const getPartyDisplayId = (registration) => {
  if (!registration?.partyId) return ''
  return typeof registration.partyId === 'object' ? registration.partyId._id || '' : registration.partyId
}

const ViewVehicleRegistrationModal = ({ isOpen, onClose, selectedRegistration, onRefresh }) => {
  const [showImageViewer, setShowImageViewer] = useState(false)
  const [currentImageUrl, setCurrentImageUrl] = useState('')
  const [currentImageTitle, setCurrentImageTitle] = useState('')

  // State for quick-add modals
  const [showAddFitnessModal, setShowAddFitnessModal] = useState(false)
  const [showAddTaxModal, setShowAddTaxModal] = useState(false)
  const [showAddPucModal, setShowAddPucModal] = useState(false)
  const [showAddGpsModal, setShowAddGpsModal] = useState(false)
  const [showAddInsuranceModal, setShowAddInsuranceModal] = useState(false)
  const [showAddCgPermitModal, setShowAddCgPermitModal] = useState(false)
  const [showAddNationalPermitModal, setShowAddNationalPermitModal] = useState(false)

  // ESC key closes the popup
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen || !selectedRegistration) {
    return null
  }

  const getImageUrl = (imageData) => {
    if (!imageData) return null
    return imageData.startsWith('data:') ? imageData : `${API_URL}${imageData}`
  }

  const isPDF = (url) => {
    if (!url) return false
    return url.toLowerCase().includes('.pdf') || url.startsWith('data:application/pdf')
  }

  const rcImageUrl = getImageUrl(selectedRegistration.rcImage)
  const rcBackImageUrl = getImageUrl(selectedRegistration.rcBackImage)
  const aadharImageUrl = getImageUrl(selectedRegistration.aadharImage)
  const panImageUrl = getImageUrl(selectedRegistration.panImage)
  const speedGovernorImageUrl = getImageUrl(selectedRegistration.speedGovernorImage)
  const partyDisplayId = getPartyDisplayId(selectedRegistration)

  const handleImageClick = (url, title) => {
    setCurrentImageUrl(url)
    setCurrentImageTitle(title)
    setShowImageViewer(true)
  }

  // Handle successful record addition
  const handleRecordAdded = () => {
    // Refresh the parent data if callback provided
    if (onRefresh) {
      onRefresh()
    }
  }

  return (
    <div className='fixed inset-0 bg-black/70  flex items-center justify-center z-[70] p-2 md:p-4 animate-fadeIn'>
      <div className='bg-white rounded-xl md:rounded-3xl shadow-2xl w-full md:w-[95%] lg:w-[95%] xl:w-[92%] 2xl:w-[90%] max-h-[98vh] md:max-h-[95vh] overflow-hidden animate-slideUp'>
        {/* Header */}
        <div className='sticky top-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white p-3 md:p-5 z-10 shadow-lg'>
          <div className='flex items-center justify-between gap-2'>
            <div className='flex items-center gap-2 md:gap-3 min-w-0'>
              <div className='bg-white/20 -lg p-1.5 md:p-2 rounded-lg md:rounded-xl flex-shrink-0'>
                <svg className='w-4 h-4 md:w-6 md:h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' />
                </svg>
              </div>
              <div className='min-w-0'>
                <h2 className='text-base md:text-xl font-bold truncate'>Vehicle Details</h2>
                <p className='text-white/80 text-xs md:text-sm mt-0.5 truncate'>{selectedRegistration.vehicleNumber || selectedRegistration.registrationNumber}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className='text-white/90 hover:text-white hover:bg-white/20 p-1.5 md:p-2.5 rounded-lg md:rounded-xl transition-all duration-200 hover:rotate-90 flex-shrink-0'
            >
              <svg className='w-5 h-5 md:w-6 md:h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className='overflow-y-auto max-h-[calc(98vh-100px)] md:max-h-[calc(95vh-130px)] p-3 md:p-5'>
          {/* Document Images Section */}
          {(rcImageUrl || rcBackImageUrl || aadharImageUrl || panImageUrl || speedGovernorImageUrl) && (
            <div className='mb-4 bg-gradient-to-br from-green-50 to-emerald-50 p-3 md:p-4 rounded-lg md:rounded-xl border-2 border-green-200'>
              <h3 className='text-sm md:text-base font-bold text-green-900 mb-3 flex items-center gap-2'>
                <svg className='w-4 h-4 text-green-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' />
                </svg>
                Document Images
              </h3>
              <div className='grid grid-cols-2 lg:grid-cols-4 gap-3'>
                {/* RC Front Image */}
                {rcImageUrl && (
                  <div className='bg-white rounded-lg p-2 border-2 border-blue-300 group relative'>
                    <div className='text-[10px] font-bold text-blue-800 mb-2 text-center uppercase tracking-wide'>RC Front {isPDF(rcImageUrl) ? 'PDF' : 'Image'}</div>
                    <div className='relative'>
                      {isPDF(rcImageUrl) ? (
                        <div
                          onClick={() => handleImageClick(rcImageUrl, 'RC Front PDF')}
                          className='w-full h-32 bg-red-50 rounded cursor-pointer hover:bg-red-100 transition-colors flex items-center justify-center border-2 border-red-200'
                          title='Click to view PDF'
                        >
                          <svg className='w-10 h-10 text-red-500' fill='currentColor' viewBox='0 0 20 20'>
                            <path fillRule='evenodd' d='M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z' clipRule='evenodd' />
                          </svg>
                        </div>
                      ) : (
                        <img
                          src={rcImageUrl}
                          alt='RC Front'
                          onClick={() => handleImageClick(rcImageUrl, 'RC Front Image')}
                          className='w-full h-32 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity'
                          title='Click to view full image with zoom'
                        />
                      )}
                      <div className='absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded cursor-pointer' onClick={() => handleImageClick(rcImageUrl, isPDF(rcImageUrl) ? 'RC Front PDF' : 'RC Front Image')}>
                        <div className='bg-white text-gray-800 px-2 py-1 rounded text-xs font-bold flex items-center gap-1'>
                          <svg className='w-3 h-3' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7' />
                          </svg>
                          View
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* RC Back Image */}
                {rcBackImageUrl && (
                  <div className='bg-white rounded-lg p-2 border-2 border-sky-300 group relative'>
                    <div className='text-[10px] font-bold text-sky-800 mb-2 text-center uppercase tracking-wide'>RC Back {isPDF(rcBackImageUrl) ? 'PDF' : 'Image'}</div>
                    <div className='relative'>
                      {isPDF(rcBackImageUrl) ? (
                        <div
                          onClick={() => handleImageClick(rcBackImageUrl, 'RC Back PDF')}
                          className='w-full h-32 bg-red-50 rounded cursor-pointer hover:bg-red-100 transition-colors flex items-center justify-center border-2 border-red-200'
                          title='Click to view PDF'
                        >
                          <svg className='w-10 h-10 text-red-500' fill='currentColor' viewBox='0 0 20 20'>
                            <path fillRule='evenodd' d='M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z' clipRule='evenodd' />
                          </svg>
                        </div>
                      ) : (
                        <img
                          src={rcBackImageUrl}
                          alt='RC Back'
                          onClick={() => handleImageClick(rcBackImageUrl, 'RC Back Image')}
                          className='w-full h-32 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity'
                          title='Click to view full image with zoom'
                        />
                      )}
                      <div className='absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded cursor-pointer' onClick={() => handleImageClick(rcBackImageUrl, isPDF(rcBackImageUrl) ? 'RC Back PDF' : 'RC Back Image')}>
                        <div className='bg-white text-gray-800 px-2 py-1 rounded text-xs font-bold flex items-center gap-1'>
                          <svg className='w-3 h-3' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7' />
                          </svg>
                          View
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Aadhar Image */}
                {aadharImageUrl && (
                  <div className='bg-white rounded-lg p-2 border-2 border-orange-300 group relative'>
                    <div className='text-[10px] font-bold text-orange-800 mb-2 text-center uppercase tracking-wide'>Aadhar {isPDF(aadharImageUrl) ? 'PDF' : 'Image'}</div>
                    <div className='relative'>
                      {isPDF(aadharImageUrl) ? (
                        <div
                          onClick={() => handleImageClick(aadharImageUrl, 'Aadhar Document PDF')}
                          className='w-full h-32 bg-red-50 rounded cursor-pointer hover:bg-red-100 transition-colors flex items-center justify-center border-2 border-red-200'
                          title='Click to view PDF'
                        >
                          <svg className='w-10 h-10 text-red-500' fill='currentColor' viewBox='0 0 20 20'>
                            <path fillRule='evenodd' d='M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z' clipRule='evenodd' />
                          </svg>
                        </div>
                      ) : (
                        <img
                          src={aadharImageUrl}
                          alt='Aadhar Document'
                          onClick={() => handleImageClick(aadharImageUrl, 'Aadhar Document Image')}
                          className='w-full h-32 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity'
                          title='Click to view full image with zoom'
                        />
                      )}
                      <div className='absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded cursor-pointer' onClick={() => handleImageClick(aadharImageUrl, isPDF(aadharImageUrl) ? 'Aadhar Document PDF' : 'Aadhar Document Image')}>
                        <div className='bg-white text-gray-800 px-2 py-1 rounded text-xs font-bold flex items-center gap-1'>
                          <svg className='w-3 h-3' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7' />
                          </svg>
                          View
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* PAN Image */}
                {panImageUrl && (
                  <div className='bg-white rounded-lg p-2 border-2 border-purple-300 group relative'>
                    <div className='text-[10px] font-bold text-purple-800 mb-2 text-center uppercase tracking-wide'>PAN {isPDF(panImageUrl) ? 'PDF' : 'Image'}</div>
                    <div className='relative'>
                      {isPDF(panImageUrl) ? (
                        <div
                          onClick={() => handleImageClick(panImageUrl, 'PAN Card PDF')}
                          className='w-full h-32 bg-red-50 rounded cursor-pointer hover:bg-red-100 transition-colors flex items-center justify-center border-2 border-red-200'
                          title='Click to view PDF'
                        >
                          <svg className='w-10 h-10 text-red-500' fill='currentColor' viewBox='0 0 20 20'>
                            <path fillRule='evenodd' d='M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z' clipRule='evenodd' />
                          </svg>
                        </div>
                      ) : (
                        <img
                          src={panImageUrl}
                          alt='PAN Card'
                          onClick={() => handleImageClick(panImageUrl, 'PAN Card Image')}
                          className='w-full h-32 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity'
                          title='Click to view full image with zoom'
                        />
                      )}
                      <div className='absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded cursor-pointer' onClick={() => handleImageClick(panImageUrl, isPDF(panImageUrl) ? 'PAN Card PDF' : 'PAN Card Image')}>
                        <div className='bg-white text-gray-800 px-2 py-1 rounded text-xs font-bold flex items-center gap-1'>
                          <svg className='w-3 h-3' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7' />
                          </svg>
                          View
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Speed Governor Image */}
                {speedGovernorImageUrl && (
                  <div className='bg-white rounded-lg p-2 border-2 border-teal-300 group relative'>
                    <div className='text-[10px] font-bold text-teal-800 mb-2 text-center uppercase tracking-wide'>Speed Governor {isPDF(speedGovernorImageUrl) ? 'PDF' : 'Image'}</div>
                    <div className='relative'>
                      {isPDF(speedGovernorImageUrl) ? (
                        <div
                          onClick={() => handleImageClick(speedGovernorImageUrl, 'Speed Governor PDF')}
                          className='w-full h-32 bg-red-50 rounded cursor-pointer hover:bg-red-100 transition-colors flex items-center justify-center border-2 border-red-200'
                          title='Click to view PDF'
                        >
                          <svg className='w-10 h-10 text-red-500' fill='currentColor' viewBox='0 0 20 20'>
                            <path fillRule='evenodd' d='M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z' clipRule='evenodd' />
                          </svg>
                        </div>
                      ) : (
                        <img
                          src={speedGovernorImageUrl}
                          alt='Speed Governor'
                          onClick={() => handleImageClick(speedGovernorImageUrl, 'Speed Governor Image')}
                          className='w-full h-32 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity'
                          title='Click to view full image with zoom'
                        />
                      )}
                      <div className='absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded cursor-pointer' onClick={() => handleImageClick(speedGovernorImageUrl, isPDF(speedGovernorImageUrl) ? 'Speed Governor PDF' : 'Speed Governor Image')}>
                        <div className='bg-white text-gray-800 px-2 py-1 rounded text-xs font-bold flex items-center gap-1'>
                          <svg className='w-3 h-3' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7' />
                          </svg>
                          View
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Vehicle Related Documents Section */}
          {(selectedRegistration.fitness || selectedRegistration.tax || selectedRegistration.insurance || selectedRegistration.puc || selectedRegistration.gps || selectedRegistration.cgPermit || selectedRegistration.nationalPermit) && (
            <div className='mb-4 bg-gradient-to-br from-orange-50 to-amber-50 p-3 md:p-4 rounded-lg md:rounded-xl border-2 border-orange-200'>
              <h3 className='text-sm md:text-base font-bold text-orange-900 mb-3 flex items-center gap-2'>
                <svg className='w-4 h-4 text-orange-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' />
                </svg>
                Vehicle Documents & Compliance
              </h3>
              <div className='grid grid-cols-2 xl:grid-cols-7 gap-2'>
                {/* Fitness Card */}
                {selectedRegistration.fitness && (
                  <div className='bg-white rounded-lg p-2 md:p-3 border-2 border-green-200 hover:shadow-md transition-shadow'>
                    <div className='flex items-center gap-1 md:gap-2 mb-1.5 md:mb-2'>
                      <div className='bg-green-100 p-1 md:p-1.5 rounded-lg'>
                        <svg className='w-3 h-3 md:w-4 md:h-4 text-green-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' />
                        </svg>
                      </div>
                      <h4 className='text-xs md:text-sm font-bold text-green-900'>Fitness</h4>
                    </div>
                    <div className='space-y-1 md:space-y-1.5'>
                      <div className='bg-green-50 p-1.5 md:p-2 rounded'>
                        <p className='text-[8px] md:text-[9px] text-green-600 font-semibold uppercase'>Valid From</p>
                        <p className='text-[10px] md:text-xs font-bold text-green-900'>{selectedRegistration.fitness.validFrom}</p>
                      </div>
                      <div className='bg-green-50 p-1.5 md:p-2 rounded'>
                        <p className='text-[8px] md:text-[9px] text-green-600 font-semibold uppercase'>Valid To</p>
                        <p className='text-[10px] md:text-xs font-bold text-green-900'>{selectedRegistration.fitness.validTo}</p>
                      </div>
                      <div className='bg-green-50 p-1.5 md:p-2 rounded'>
                        <p className='text-[8px] md:text-[9px] text-green-600 font-semibold uppercase'>Status</p>
                        <p className='text-[10px] md:text-xs font-bold text-green-900 capitalize'>{selectedRegistration.fitness.status}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tax Card */}
                {selectedRegistration.tax && (
                  <div className='bg-white rounded-lg p-2 md:p-3 border-2 border-blue-200 hover:shadow-md transition-shadow'>
                    <div className='flex items-center gap-1 md:gap-2 mb-1.5 md:mb-2'>
                      <div className='bg-blue-100 p-1 md:p-1.5 rounded-lg'>
                        <svg className='w-3 h-3 md:w-4 md:h-4 text-blue-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
                        </svg>
                      </div>
                      <h4 className='text-xs md:text-sm font-bold text-blue-900'>Tax</h4>
                    </div>
                    <div className='space-y-1 md:space-y-1.5'>
                      <div className='bg-blue-50 p-1.5 md:p-2 rounded'>
                        <p className='text-[8px] md:text-[9px] text-blue-600 font-semibold uppercase'>Tax From</p>
                        <p className='text-[10px] md:text-xs font-bold text-blue-900'>{selectedRegistration.tax.taxFrom}</p>
                      </div>
                      <div className='bg-blue-50 p-1.5 md:p-2 rounded'>
                        <p className='text-[8px] md:text-[9px] text-blue-600 font-semibold uppercase'>Tax To</p>
                        <p className='text-[10px] md:text-xs font-bold text-blue-900'>{selectedRegistration.tax.taxTo}</p>
                      </div>
                      <div className='bg-blue-50 p-1.5 md:p-2 rounded'>
                        <p className='text-[8px] md:text-[9px] text-blue-600 font-semibold uppercase'>Status</p>
                        <p className='text-[10px] md:text-xs font-bold text-blue-900 capitalize'>{selectedRegistration.tax.status}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Insurance Card */}
                {selectedRegistration.insurance && (
                  <div className='bg-white rounded-lg p-2 md:p-3 border-2 border-purple-200 hover:shadow-md transition-shadow'>
                    <div className='flex items-center gap-1 md:gap-2 mb-1.5 md:mb-2'>
                      <div className='bg-purple-100 p-1 md:p-1.5 rounded-lg'>
                        <svg className='w-3 h-3 md:w-4 md:h-4 text-purple-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' />
                        </svg>
                      </div>
                      <h4 className='text-xs md:text-sm font-bold text-purple-900'>Insurance</h4>
                    </div>
                    <div className='space-y-1 md:space-y-1.5'>
                      {selectedRegistration.insurance.policyNumber && (
                        <div className='bg-purple-50 p-1.5 md:p-2 rounded'>
                          <p className='text-[8px] md:text-[9px] text-purple-600 font-semibold uppercase'>Policy No.</p>
                          <p className='text-[10px] md:text-xs font-bold text-purple-900'>{selectedRegistration.insurance.policyNumber}</p>
                        </div>
                      )}
                      <div className='bg-purple-50 p-1.5 md:p-2 rounded'>
                        <p className='text-[8px] md:text-[9px] text-purple-600 font-semibold uppercase'>Valid From</p>
                        <p className='text-[10px] md:text-xs font-bold text-purple-900'>{selectedRegistration.insurance.validFrom}</p>
                      </div>
                      <div className='bg-purple-50 p-1.5 md:p-2 rounded'>
                        <p className='text-[8px] md:text-[9px] text-purple-600 font-semibold uppercase'>Valid To</p>
                        <p className='text-[10px] md:text-xs font-bold text-purple-900'>{selectedRegistration.insurance.validTo}</p>
                      </div>
                      <div className='bg-purple-50 p-1.5 md:p-2 rounded'>
                        <p className='text-[8px] md:text-[9px] text-purple-600 font-semibold uppercase'>Status</p>
                        <p className='text-[10px] md:text-xs font-bold text-purple-900 capitalize'>{selectedRegistration.insurance.status}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* PUC Card */}
                {selectedRegistration.puc && (
                  <div className='bg-white rounded-lg p-2 md:p-3 border-2 border-teal-200 hover:shadow-md transition-shadow'>
                    <div className='flex items-center gap-1 md:gap-2 mb-1.5 md:mb-2'>
                      <div className='bg-teal-100 p-1 md:p-1.5 rounded-lg'>
                        <svg className='w-3 h-3 md:w-4 md:h-4 text-teal-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9' />
                        </svg>
                      </div>
                      <h4 className='text-xs md:text-sm font-bold text-teal-900'>PUC</h4>
                    </div>
                    <div className='space-y-1 md:space-y-1.5'>
                      <div className='bg-teal-50 p-1.5 md:p-2 rounded'>
                        <p className='text-[8px] md:text-[9px] text-teal-600 font-semibold uppercase'>Valid From</p>
                        <p className='text-[10px] md:text-xs font-bold text-teal-900'>{selectedRegistration.puc.validFrom}</p>
                      </div>
                      <div className='bg-teal-50 p-1.5 md:p-2 rounded'>
                        <p className='text-[8px] md:text-[9px] text-teal-600 font-semibold uppercase'>Valid To</p>
                        <p className='text-[10px] md:text-xs font-bold text-teal-900'>{selectedRegistration.puc.validTo}</p>
                      </div>
                      <div className='bg-teal-50 p-1.5 md:p-2 rounded'>
                        <p className='text-[8px] md:text-[9px] text-teal-600 font-semibold uppercase'>Status</p>
                        <p className='text-[10px] md:text-xs font-bold text-teal-900 capitalize'>{selectedRegistration.puc.status}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* GPS Card */}
                {selectedRegistration.gps && (
                  <div className='bg-white rounded-lg p-2 md:p-3 border-2 border-amber-200 hover:shadow-md transition-shadow'>
                    <div className='flex items-center gap-1 md:gap-2 mb-1.5 md:mb-2'>
                      <div className='bg-amber-100 p-1 md:p-1.5 rounded-lg'>
                        <svg className='w-3 h-3 md:w-4 md:h-4 text-amber-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z' />
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 11a3 3 0 11-6 0 3 3 0 016 0z' />
                        </svg>
                      </div>
                      <h4 className='text-xs md:text-sm font-bold text-amber-900'>GPS</h4>
                    </div>
                    <div className='space-y-1 md:space-y-1.5'>
                      <div className='bg-amber-50 p-1.5 md:p-2 rounded'>
                        <p className='text-[8px] md:text-[9px] text-amber-600 font-semibold uppercase'>Valid From</p>
                        <p className='text-[10px] md:text-xs font-bold text-amber-900'>{selectedRegistration.gps.validFrom}</p>
                      </div>
                      <div className='bg-amber-50 p-1.5 md:p-2 rounded'>
                        <p className='text-[8px] md:text-[9px] text-amber-600 font-semibold uppercase'>Valid To</p>
                        <p className='text-[10px] md:text-xs font-bold text-amber-900'>{selectedRegistration.gps.validTo}</p>
                      </div>
                      <div className='bg-amber-50 p-1.5 md:p-2 rounded'>
                        <p className='text-[8px] md:text-[9px] text-amber-600 font-semibold uppercase'>Status</p>
                        <p className='text-[10px] md:text-xs font-bold text-amber-900 capitalize'>{selectedRegistration.gps.status}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* CG Permit Card */}
                {selectedRegistration.cgPermit && (
                  <div className='bg-white rounded-lg p-2 md:p-3 border-2 border-rose-200 hover:shadow-md transition-shadow'>
                    <div className='flex items-center gap-1 md:gap-2 mb-1.5 md:mb-2'>
                      <div className='bg-rose-100 p-1 md:p-1.5 rounded-lg'>
                        <svg className='w-3 h-3 md:w-4 md:h-4 text-rose-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' />
                        </svg>
                      </div>
                      <h4 className='text-xs md:text-sm font-bold text-rose-900'>CG Permit</h4>
                    </div>
                    <div className='space-y-1 md:space-y-1.5'>
                      <div className='bg-rose-50 p-1.5 md:p-2 rounded'>
                        <p className='text-[8px] md:text-[9px] text-rose-600 font-semibold uppercase'>Valid From</p>
                        <p className='text-[10px] md:text-xs font-bold text-rose-900'>{selectedRegistration.cgPermit.validFrom}</p>
                      </div>
                      <div className='bg-rose-50 p-1.5 md:p-2 rounded'>
                        <p className='text-[8px] md:text-[9px] text-rose-600 font-semibold uppercase'>Valid To</p>
                        <p className='text-[10px] md:text-xs font-bold text-rose-900'>{selectedRegistration.cgPermit.validTo}</p>
                      </div>
                      <div className='bg-rose-50 p-1.5 md:p-2 rounded'>
                        <p className='text-[8px] md:text-[9px] text-rose-600 font-semibold uppercase'>Status</p>
                        <p className='text-[10px] md:text-xs font-bold text-rose-900 capitalize'>{selectedRegistration.cgPermit.status}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* National Permit Card - Full width on mobile, single column on desktop */}
                {selectedRegistration.nationalPermit && (
                  <div className='col-span-2 xl:col-span-1 bg-white rounded-lg p-2 md:p-3 border-2 border-indigo-200 hover:shadow-md transition-shadow'>
                    <div className='flex items-center gap-1 md:gap-2 mb-1.5 md:mb-2'>
                      <div className='bg-indigo-100 p-1 md:p-1.5 rounded-lg'>
                        <svg className='w-3 h-3 md:w-4 md:h-4 text-indigo-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
                        </svg>
                      </div>
                      <h4 className='text-xs md:text-sm font-bold text-indigo-900'>National Permit</h4>
                    </div>

                    <div className='space-y-2'>
                      {/* Part A Section */}
                      <div className='bg-indigo-50 p-2 rounded-lg border border-indigo-200'>
                        <p className='text-[9px] font-bold text-indigo-700 mb-1 uppercase tracking-wide'>Part A (5 Years)</p>
                        <div className='space-y-1'>
                          <div className='flex justify-between items-center'>
                            <p className='text-[8px] md:text-[9px] text-indigo-600 font-semibold'>Valid From:</p>
                            <p className='text-[9px] md:text-[10px] font-bold text-indigo-900'>{selectedRegistration.nationalPermit.partAValidFrom}</p>
                          </div>
                          <div className='flex justify-between items-center'>
                            <p className='text-[8px] md:text-[9px] text-indigo-600 font-semibold'>Valid To:</p>
                            <p className='text-[9px] md:text-[10px] font-bold text-indigo-900'>{selectedRegistration.nationalPermit.partAValidTo}</p>
                          </div>
                          <div className='flex justify-between items-center'>
                            <p className='text-[8px] md:text-[9px] text-indigo-600 font-semibold'>Status:</p>
                            <p className='text-[9px] md:text-[10px] font-bold text-indigo-900 capitalize'>{selectedRegistration.nationalPermit.partAStatus}</p>
                          </div>
                        </div>
                      </div>

                      {/* Part B Section */}
                      <div className='bg-violet-50 p-2 rounded-lg border border-violet-200'>
                        <p className='text-[9px] font-bold text-violet-700 mb-1 uppercase tracking-wide'>Part B (1 Year)</p>
                        <div className='space-y-1'>
                          <div className='flex justify-between items-center'>
                            <p className='text-[8px] md:text-[9px] text-violet-600 font-semibold'>Valid From:</p>
                            <p className='text-[9px] md:text-[10px] font-bold text-violet-900'>{selectedRegistration.nationalPermit.partBValidFrom}</p>
                          </div>
                          <div className='flex justify-between items-center'>
                            <p className='text-[8px] md:text-[9px] text-violet-600 font-semibold'>Valid To:</p>
                            <p className='text-[9px] md:text-[10px] font-bold text-violet-900'>{selectedRegistration.nationalPermit.partBValidTo}</p>
                          </div>
                          <div className='flex justify-between items-center'>
                            <p className='text-[8px] md:text-[9px] text-violet-600 font-semibold'>Status:</p>
                            <p className='text-[9px] md:text-[10px] font-bold text-violet-900 capitalize'>{selectedRegistration.nationalPermit.partBStatus}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className='grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4'>
            {/* Column 1: Registration & Vehicle Details */}
            <div className='bg-gradient-to-br from-indigo-50 to-purple-50 p-3 md:p-4 rounded-lg md:rounded-xl border-2 border-indigo-200 flex flex-col'>
              <h3 className='text-sm md:text-base font-bold text-indigo-900 mb-2 md:mb-3 flex items-center gap-1.5 md:gap-2'>
                <svg className='w-3.5 h-3.5 md:w-4 md:h-4 text-indigo-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' />
                </svg>
                Registration & Vehicle
              </h3>
              <div className='space-y-1.5 md:space-y-2 flex-1'>
                {/* First Row: Registration Number and Date of Registration */}
                <div className='grid grid-cols-2 gap-1.5 md:gap-2'>
                  {selectedRegistration.registrationNumber && (
                    <div className='bg-white/80 p-2 rounded-lg'>
                      <div className='text-[10px] md:text-xs font-semibold text-gray-600'>Registration Number</div>
                      <div className='text-xs md:text-sm font-bold text-gray-900 mt-0.5'>{selectedRegistration.registrationNumber}</div>
                    </div>
                  )}
                  {selectedRegistration.dateOfRegistration && (
                    <div className='bg-white/80 p-2 rounded-lg'>
                      <div className='text-[10px] md:text-xs font-semibold text-gray-600'>Date of Registration</div>
                      <div className='text-xs md:text-sm font-bold text-gray-900 mt-0.5'>{selectedRegistration.dateOfRegistration}</div>
                    </div>
                  )}
                </div>

                {/* Second Row: Chassis Number and Engine Number */}
                <div className='grid grid-cols-2 gap-1.5 md:gap-2'>
                  {selectedRegistration.chassisNumber && (
                    <div className='bg-gradient-to-br from-blue-100 to-cyan-100 p-2 md:p-2.5 rounded-lg border-2 border-blue-300'>
                      <div className='text-[10px] md:text-xs font-semibold text-blue-700'>
                        Chassis Number
                      </div>
                      <div className='text-[10px] md:text-[15px] font-bold text-blue-900 mt-1 font-mono break-all'>{selectedRegistration.chassisNumber}</div>
                    </div>
                  )}
                  {selectedRegistration.engineNumber && (
                    <div className='bg-gradient-to-br from-green-100 to-emerald-100 p-2 md:p-2.5 rounded-lg border-2 border-green-300'>
                      <div className='text-[10px] md:text-xs font-semibold text-green-700 flex items-center gap-1'>
                        <svg className='w-3 h-3' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' />
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 12a3 3 0 11-6 0 3 3 0 016 0z' />
                        </svg>
                        Engine Number
                      </div>
                      <div className='text-[10px] md:text-[15px] font-bold text-green-900 mt-1 font-mono break-all'>{selectedRegistration.engineNumber}</div>
                    </div>
                  )}
                </div>

                {/* Rest of the vehicle details */}
                <div className='grid grid-cols-2 gap-1.5 md:gap-2'>
                {selectedRegistration.makerName && (
                  <div className='bg-white/80 p-2 rounded-lg'>
                    <div className='text-[10px] md:text-xs font-semibold text-gray-600'>Maker Name</div>
                    <div className='text-xs md:text-sm font-bold text-gray-900 mt-0.5'>{selectedRegistration.makerName}</div>
                  </div>
                )}
                {selectedRegistration.makerModel && (
                  <div className='bg-white/80 p-2 rounded-lg'>
                    <div className='text-[10px] md:text-xs font-semibold text-gray-600'>Maker Model</div>
                    <div className='text-xs md:text-sm font-bold text-gray-900 mt-0.5'>{selectedRegistration.makerModel}</div>
                  </div>
                )}
                {selectedRegistration.colour && (
                  <div className='bg-white/80 p-2 rounded-lg'>
                    <div className='text-[10px] md:text-xs font-semibold text-gray-600'>Colour</div>
                    <div className='text-xs md:text-sm font-bold text-gray-900 mt-0.5'>{selectedRegistration.colour}</div>
                  </div>
                )}
                {selectedRegistration.vehicleClass && (
                  <div className='bg-white/80 p-2 rounded-lg'>
                    <div className='text-[10px] md:text-xs font-semibold text-gray-600'>Vehicle Class</div>
                    <div className='text-xs md:text-sm font-bold text-gray-900 mt-0.5'>{selectedRegistration.vehicleClass}</div>
                  </div>
                )}
                {selectedRegistration.vehicleType && (
                  <div className='bg-white/80 p-2 rounded-lg'>
                    <div className='text-[10px] md:text-xs font-semibold text-gray-600'>Vehicle Type</div>
                    <div className='text-xs md:text-sm font-bold text-gray-900 mt-0.5'>{selectedRegistration.vehicleType}</div>
                  </div>
                )}
                {selectedRegistration.vehicleCategory && (
                  <div className='bg-white/80 p-2 rounded-lg'>
                    <div className='text-[10px] md:text-xs font-semibold text-gray-600'>Vehicle Category</div>
                    <div className='text-xs md:text-sm font-bold text-gray-900 mt-0.5'>{selectedRegistration.vehicleCategory}</div>
                  </div>
                )}
              </div>
              </div>
            </div>

            {/* Column 2: Owner Details */}
            <div className='bg-gradient-to-br from-purple-50 to-pink-50 p-3 md:p-4 rounded-lg md:rounded-xl border-2 border-purple-200 flex flex-col'>
              <h3 className='text-sm md:text-base font-bold text-purple-900 mb-2 md:mb-3 flex items-center gap-1.5 md:gap-2'>
                <svg className='w-3.5 h-3.5 md:w-4 md:h-4 text-purple-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' />
                </svg>
                Owner Details
              </h3>
              <div className='space-y-1.5 md:space-y-2 flex-1'>
                {selectedRegistration.ownerName && (
                  <div className='bg-white/80 p-2 rounded-lg'>
                    <div className='text-[10px] md:text-xs font-semibold text-gray-600'>Owner Name</div>
                    <div className='text-xs md:text-sm font-bold text-gray-900 mt-0.5'>{selectedRegistration.ownerName}</div>
                    {partyDisplayId && (
                      <div className='mt-1 text-[10px] md:text-xs font-mono font-semibold text-purple-600 break-all'>
                        Party ID: {partyDisplayId}
                      </div>
                    )}
                  </div>
                )}
                {selectedRegistration.sonWifeDaughterOf && (
                  <div className='bg-white/80 p-2 rounded-lg'>
                    <div className='text-[10px] md:text-xs font-semibold text-gray-600'>Son/Wife/Daughter of</div>
                    <div className='text-xs md:text-sm font-bold text-gray-900 mt-0.5'>{selectedRegistration.sonWifeDaughterOf}</div>
                    {partyDisplayId && (
                      <div className='mt-1 text-[10px] md:text-xs font-mono font-semibold text-purple-600 break-all'>
                        Party ID: {partyDisplayId}
                      </div>
                    )}
                  </div>
                )}
                {selectedRegistration.address && (
                  <div className='bg-white/80 p-2 rounded-lg'>
                    <div className='text-[10px] md:text-xs font-semibold text-gray-600'>Address</div>
                    <div className='text-xs md:text-sm font-bold text-gray-900 mt-0.5 leading-relaxed'>{selectedRegistration.address}</div>
                  </div>
                )}
                {selectedRegistration.mobileNumber && (
                  <div className='bg-white/80 p-2 rounded-lg'>
                    <div className='text-[10px] md:text-xs font-semibold text-gray-600 flex items-center gap-1'>
                      <svg className='w-3 h-3 text-purple-500' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z' />
                      </svg>
                      Mobile Number
                    </div>
                    <div className='text-xs md:text-sm font-bold text-gray-900 mt-0.5'>{selectedRegistration.mobileNumber}</div>
                  </div>
                )}
                {selectedRegistration.email && (
                  <div className='bg-white/80 p-2 rounded-lg'>
                    <div className='text-[10px] md:text-xs font-semibold text-gray-600 flex items-center gap-1'>
                      <svg className='w-3 h-3 text-purple-500' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' />
                      </svg>
                      Email Address
                    </div>
                    <div className='text-xs md:text-sm font-bold text-gray-900 mt-0.5 break-all'>{selectedRegistration.email}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Column 3: Additional Details */}
            <div className='bg-gradient-to-br from-blue-50 to-indigo-50 p-3 md:p-4 rounded-lg md:rounded-xl border-2 border-blue-200 flex flex-col'>
              <h3 className='text-sm md:text-base font-bold text-blue-900 mb-2 md:mb-3 flex items-center gap-1.5 md:gap-2'>
                <svg className='w-3.5 h-3.5 md:w-4 md:h-4 text-blue-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
                </svg>
                Additional Details
              </h3>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-2.5 flex-1'>
                {selectedRegistration.seatingCapacity && (
                  <div className='bg-white/80 p-2 rounded-lg'>
                    <div className='text-[10px] md:text-xs font-semibold text-gray-600'>Seating Capacity</div>
                    <div className='text-xs md:text-sm font-bold text-gray-900 mt-0.5'>{selectedRegistration.seatingCapacity} seats</div>
                  </div>
                )}
                {selectedRegistration.manufactureYear && (
                  <div className='bg-white/80 p-2 rounded-lg'>
                    <div className='text-[10px] md:text-xs font-semibold text-gray-600'>Manufacture Year</div>
                    <div className='text-xs md:text-sm font-bold text-gray-900 mt-0.5'>{selectedRegistration.manufactureYear}</div>
                  </div>
                )}
                {(selectedRegistration.numberOfCylinders !== undefined && selectedRegistration.numberOfCylinders !== null) && (
                  <div className='bg-white/80 p-2 rounded-lg'>
                    <div className='text-[10px] md:text-xs font-semibold text-gray-600'>No. of Cylinders</div>
                    <div className='text-xs md:text-sm font-bold text-gray-900 mt-0.5'>{selectedRegistration.numberOfCylinders}</div>
                  </div>
                )}
                {(selectedRegistration.cubicCapacity !== undefined && selectedRegistration.cubicCapacity !== null) && (
                  <div className='bg-white/80 p-2 rounded-lg'>
                    <div className='text-[10px] md:text-xs font-semibold text-gray-600'>Cubic Capacity (CC)</div>
                    <div className='text-xs md:text-sm font-bold text-gray-900 mt-0.5'>{selectedRegistration.cubicCapacity} CC</div>
                  </div>
                )}
                {selectedRegistration.fuelType && (
                  <div className='bg-white/80 p-2 rounded-lg'>
                    <div className='text-[10px] md:text-xs font-semibold text-gray-600'>Fuel Type</div>
                    <div className='text-xs md:text-sm font-bold text-gray-900 mt-0.5'>{selectedRegistration.fuelType}</div>
                  </div>
                )}
                {selectedRegistration.bodyType && (
                  <div className='bg-white/80 p-2 rounded-lg'>
                    <div className='text-[10px] md:text-xs font-semibold text-gray-600'>Body Type</div>
                    <div className='text-xs md:text-sm font-bold text-gray-900 mt-0.5'>{selectedRegistration.bodyType}</div>
                  </div>
                )}
                {(selectedRegistration.ladenWeight !== undefined && selectedRegistration.ladenWeight !== null) && (
                  <div className='bg-white/80 p-2 rounded-lg'>
                    <div className='text-[10px] md:text-xs font-semibold text-gray-600'>Laden Weight</div>
                    <div className='text-xs md:text-sm font-bold text-gray-900 mt-0.5'>{selectedRegistration.ladenWeight} kg</div>
                  </div>
                )}
                {(selectedRegistration.unladenWeight !== undefined && selectedRegistration.unladenWeight !== null) && (
                  <div className='bg-white/80 p-2 rounded-lg'>
                    <div className='text-[10px] md:text-xs font-semibold text-gray-600'>Unladen Weight</div>
                    <div className='text-xs md:text-sm font-bold text-gray-900 mt-0.5'>{selectedRegistration.unladenWeight} kg</div>
                  </div>
                )}
                {selectedRegistration.purchaseDeliveryDate && (
                  <div className='bg-white/80 p-2 rounded-lg'>
                    <div className='text-[10px] md:text-xs font-semibold text-gray-600'>Purchase/Delivery Date</div>
                    <div className='text-xs md:text-sm font-bold text-gray-900 mt-0.5'>{selectedRegistration.purchaseDeliveryDate}</div>
                  </div>
                )}
                {selectedRegistration.saleAmount && (
                  <div className='bg-white/80 p-2 rounded-lg'>
                    <div className='text-[10px] md:text-xs font-semibold text-gray-600'>Sale Amount</div>
                    <div className='text-xs md:text-sm font-bold text-gray-900 mt-0.5'>₹{selectedRegistration.saleAmount.toLocaleString()}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer with Quick Add Actions */}
        <div className='sticky bottom-0 bg-gradient-to-r from-gray-50 to-gray-100 px-3 py-2.5 md:px-5 md:py-3 border-t-2 border-gray-300 flex flex-wrap items-center justify-between gap-2'>
          {/* Quick Add Buttons */}
          <div className='flex flex-wrap items-center gap-2'>
            <span className='text-xs font-semibold text-gray-600 hidden md:inline'>Quick Add:</span>

            <button
              onClick={() => setShowAddFitnessModal(true)}
              className='px-3 py-1.5 md:px-4 md:py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200 font-bold text-xs md:text-sm shadow-md hover:shadow-lg flex items-center gap-1'
              title='Add Fitness Record'
            >
              <svg className='w-3 h-3 md:w-4 md:h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 4v16m8-8H4' />
              </svg>
              Fitness
            </button>

            <button
              onClick={() => setShowAddTaxModal(true)}
              className='px-3 py-1.5 md:px-4 md:py-2 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-lg hover:from-blue-600 hover:to-cyan-700 transition-all duration-200 font-bold text-xs md:text-sm shadow-md hover:shadow-lg flex items-center gap-1'
              title='Add Tax Record'
            >
              <svg className='w-3 h-3 md:w-4 md:h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 4v16m8-8H4' />
              </svg>
              Tax
            </button>

            <button
              onClick={() => setShowAddPucModal(true)}
              className='px-3 py-1.5 md:px-4 md:py-2 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-lg hover:from-teal-600 hover:to-cyan-700 transition-all duration-200 font-bold text-xs md:text-sm shadow-md hover:shadow-lg flex items-center gap-1'
              title='Add PUC Record'
            >
              <svg className='w-3 h-3 md:w-4 md:h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 4v16m8-8H4' />
              </svg>
              PUC
            </button>

            <button
              onClick={() => setShowAddGpsModal(true)}
              className='px-3 py-1.5 md:px-4 md:py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-lg hover:from-amber-600 hover:to-orange-700 transition-all duration-200 font-bold text-xs md:text-sm shadow-md hover:shadow-lg flex items-center gap-1'
              title='Add GPS Record'
            >
              <svg className='w-3 h-3 md:w-4 md:h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 4v16m8-8H4' />
              </svg>
              GPS
            </button>

            <button
              onClick={() => setShowAddInsuranceModal(true)}
              className='px-3 py-1.5 md:px-4 md:py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg hover:from-purple-600 hover:to-pink-700 transition-all duration-200 font-bold text-xs md:text-sm shadow-md hover:shadow-lg flex items-center gap-1'
              title='Add Insurance Record'
            >
              <svg className='w-3 h-3 md:w-4 md:h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 4v16m8-8H4' />
              </svg>
              Insurance
            </button>

            <button
              onClick={() => setShowAddCgPermitModal(true)}
              className='px-3 py-1.5 md:px-4 md:py-2 bg-gradient-to-r from-rose-500 to-red-600 text-white rounded-lg hover:from-rose-600 hover:to-red-700 transition-all duration-200 font-bold text-xs md:text-sm shadow-md hover:shadow-lg flex items-center gap-1'
              title='Issue CG Permit'
            >
              <svg className='w-3 h-3 md:w-4 md:h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 4v16m8-8H4' />
              </svg>
              CG Permit
            </button>

            <button
              onClick={() => setShowAddNationalPermitModal(true)}
              className='px-3 py-1.5 md:px-4 md:py-2 bg-gradient-to-r from-indigo-500 to-violet-600 text-white rounded-lg hover:from-indigo-600 hover:to-violet-700 transition-all duration-200 font-bold text-xs md:text-sm shadow-md hover:shadow-lg flex items-center gap-1'
              title='Issue National Permit'
            >
              <svg className='w-3 h-3 md:w-4 md:h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 4v16m8-8H4' />
              </svg>
              NP
            </button>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className='px-4 py-2 md:px-6 md:py-2 bg-gray-600 text-white rounded-lg md:rounded-xl hover:bg-gray-700 transition-all duration-200 font-bold text-sm shadow-md hover:shadow-lg'
          >
            Close
          </button>
        </div>

        {/* Image Viewer Modal */}
        <ImageViewer
          isOpen={showImageViewer}
          onClose={() => setShowImageViewer(false)}
          imageUrl={currentImageUrl}
          title={currentImageTitle}
        />
      </div>

      {/* Quick Add Modals */}
      {showAddFitnessModal && (
        <AddFitnessModal
          isOpen={showAddFitnessModal}
          onClose={() => setShowAddFitnessModal(false)}
          onSubmit={handleRecordAdded}
          prefilledVehicleNumber={selectedRegistration.registrationNumber || selectedRegistration.vehicleNumber}
          prefilledOwnerName={selectedRegistration.ownerName || ''}
          prefilledMobileNumber={selectedRegistration.mobileNumber || ''}
        />
      )}

      {showAddTaxModal && (
        <AddTaxModal
          isOpen={showAddTaxModal}
          onClose={() => setShowAddTaxModal(false)}
          onSubmit={() => {
            setShowAddTaxModal(false)
            handleRecordAdded()
          }}
          prefilledVehicleNumber={selectedRegistration.registrationNumber || selectedRegistration.vehicleNumber}
          prefilledOwnerName={selectedRegistration.ownerName || ''}
          prefilledMobileNumber={selectedRegistration.mobileNumber || ''}
        />
      )}

      {showAddPucModal && (
        <AddPucModal
          isOpen={showAddPucModal}
          onClose={() => setShowAddPucModal(false)}
          onSubmit={() => {
            setShowAddPucModal(false)
            handleRecordAdded()
          }}
          prefilledVehicleNumber={selectedRegistration.registrationNumber || selectedRegistration.vehicleNumber}
          prefilledOwnerName={selectedRegistration.ownerName || ''}
          prefilledMobileNumber={selectedRegistration.mobileNumber || ''}
        />
      )}

      {showAddGpsModal && (
        <AddGpsModal
          isOpen={showAddGpsModal}
          onClose={() => setShowAddGpsModal(false)}
          onSubmit={() => {
            setShowAddGpsModal(false)
            handleRecordAdded()
          }}
          prefilledVehicleNumber={selectedRegistration.registrationNumber || selectedRegistration.vehicleNumber}
          prefilledOwnerName={selectedRegistration.ownerName || ''}
          prefilledMobileNumber={selectedRegistration.mobileNumber || ''}
        />
      )}

      {showAddInsuranceModal && (
        <AddInsuranceModal
          isOpen={showAddInsuranceModal}
          onClose={() => setShowAddInsuranceModal(false)}
          onSubmit={() => {
            setShowAddInsuranceModal(false)
            handleRecordAdded()
          }}
          prefilledVehicleNumber={selectedRegistration.registrationNumber || selectedRegistration.vehicleNumber}
          prefilledOwnerName={selectedRegistration.ownerName || ''}
          prefilledMobileNumber={selectedRegistration.mobileNumber || ''}
        />
      )}

      {showAddCgPermitModal && (
        <IssueCgPermitModal
          isOpen={showAddCgPermitModal}
          onClose={() => setShowAddCgPermitModal(false)}
          onSubmit={() => {
            setShowAddCgPermitModal(false)
            handleRecordAdded()
          }}
          prefilledVehicleNumber={selectedRegistration.registrationNumber || selectedRegistration.vehicleNumber}
          prefilledOwnerName={selectedRegistration.ownerName || ''}
          prefilledMobileNumber={selectedRegistration.mobileNumber || ''}
        />
      )}

      {showAddNationalPermitModal && (
        <IssueNewPermitModal
          isOpen={showAddNationalPermitModal}
          onClose={() => setShowAddNationalPermitModal(false)}
          onSubmit={() => {
            setShowAddNationalPermitModal(false)
            handleRecordAdded()
          }}
          prefilledVehicleNumber={selectedRegistration.registrationNumber || selectedRegistration.vehicleNumber}
          prefilledOwnerName={selectedRegistration.ownerName || ''}
          prefilledMobileNumber={selectedRegistration.mobileNumber || ''}
        />
      )}
    </div>
  )
}

export default ViewVehicleRegistrationModal
