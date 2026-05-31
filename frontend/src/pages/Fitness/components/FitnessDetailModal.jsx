import { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import ImageViewer from '../../../components/ImageViewer'

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'

const FitnessDetailModal = ({ isOpen, onClose, fitness }) => {
  const [showImageViewer, setShowImageViewer] = useState(false)

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

  const documentUrl = useMemo(() => {
    if (!fitness?.fitnessDocument) return ''
    return fitness.fitnessDocument.startsWith('data:')
      ? fitness.fitnessDocument
      : `${API_URL}${fitness.fitnessDocument}`
  }, [fitness?.fitnessDocument])

  const isPdfDocument = useMemo(() => {
    if (!documentUrl) return false
    return documentUrl.toLowerCase().includes('.pdf') || (fitness?.fitnessDocumentType || '').includes('pdf')
  }, [documentUrl, fitness?.fitnessDocumentType])

  if (!isOpen || !fitness) return null

  const handleViewDocument = () => {
    if (!documentUrl) return

    if (isPdfDocument) {
      window.open(documentUrl, '_blank', 'noopener,noreferrer')
      return
    }

    setShowImageViewer(true)
  }

  const handleShareDocument = async () => {
    if (!documentUrl) return

    try {
      const response = await fetch(documentUrl, { credentials: 'include' })
      const blob = await response.blob()
      const fallbackName = fitness.fitnessDocumentName || `${fitness.vehicleNumber || 'fitness-document'}${isPdfDocument ? '.pdf' : '.jpg'}`
      const file = new File([blob], fallbackName, {
        type: blob.type || (isPdfDocument ? 'application/pdf' : 'image/jpeg')
      })

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `Fitness Document - ${fitness.vehicleNumber}`,
          text: `Fitness document for ${fitness.vehicleNumber}`,
          files: [file]
        })
        return
      }

      if (navigator.share) {
        try {
          await navigator.share({
            title: `Fitness Document - ${fitness.vehicleNumber}`,
            text: `Fitness document for ${fitness.vehicleNumber}`,
            files: [file]
          })
          return
        } catch (shareError) {
          if (shareError.name === 'AbortError') return
        }
      }

      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`Fitness document for ${fitness.vehicleNumber}: ${documentUrl}`)}`
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer')
    } catch (error) {
      console.error('Error sharing fitness document:', error)
      toast.error('Unable to share document right now.')
    }
  }

  return (
    <div className='fixed inset-0 bg-black/70 z-[70] flex items-center justify-center p-2 md:p-4'>
      <div className='bg-white rounded-xl md:rounded-2xl shadow-2xl w-full md:w-[90%] lg:w-[85%] xl:w-[80%] max-h-[95vh] overflow-hidden flex flex-col'>
        <div className='bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 p-3 md:p-4 text-white shadow-lg'>
          <div className='flex justify-between items-center gap-2'>
            <div className='flex items-center gap-3'>
              <div className='bg-white/20 rounded-lg p-2'>
                <svg className='w-5 h-5 md:w-6 md:h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' />
                </svg>
              </div>
              <div>
                <h2 className='text-base md:text-xl font-bold'>Fitness Certificate Details</h2>
                <p className='text-xs md:text-sm text-white/90 font-mono mt-0.5'>{fitness.vehicleNumber}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className='text-white/90 hover:text-white hover:bg-white/20 rounded-lg p-2 transition-all duration-200 flex-shrink-0'
            >
              <svg className='w-5 h-5 md:w-6 md:h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
              </svg>
            </button>
          </div>
        </div>

        <div className='flex-1 overflow-y-auto p-4 md:p-5'>
          <div className='space-y-4'>
            {documentUrl && (
              <div className='bg-gradient-to-r from-sky-50 to-blue-50 rounded-lg p-4 border-l-4 border-sky-500'>
                <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
                  <div className='flex items-center gap-3'>
                    {isPdfDocument ? (
                      <div className='flex h-20 w-20 items-center justify-center rounded-lg border-2 border-red-200 bg-red-50'>
                        <svg className='h-10 w-10 text-red-500' fill='currentColor' viewBox='0 0 20 20'>
                          <path fillRule='evenodd' d='M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z' clipRule='evenodd' />
                        </svg>
                      </div>
                    ) : (
                      <button
                        type='button'
                        onClick={handleViewDocument}
                        className='overflow-hidden rounded-lg border-2 border-sky-200 bg-white shadow-sm transition hover:shadow-md'
                      >
                        <img
                          src={documentUrl}
                          alt='Fitness document preview'
                          className='h-20 w-20 object-cover'
                        />
                      </button>
                    )}
                    <div>
                      <p className='text-xs font-semibold uppercase tracking-wide text-sky-600'>
                        {isPdfDocument ? 'Uploaded PDF' : 'Uploaded Image'}
                      </p>
                      <p className='mt-1 text-sm font-bold text-sky-900'>
                        {fitness.fitnessDocumentName || (isPdfDocument ? 'Fitness Document PDF' : 'Fitness Document Image')}
                      </p>
                      <p className='mt-1 text-xs text-gray-600'>
                        {isPdfDocument ? 'PDF preview is hidden here. Use View to open it.' : 'Click the preview or View to open the full image.'}
                      </p>
                    </div>
                  </div>

                  <div className='flex flex-wrap items-center gap-2'>
                    <button
                      type='button'
                      onClick={handleViewDocument}
                      className='px-4 py-2 rounded-lg bg-sky-600 text-white text-sm font-bold hover:bg-sky-700 transition-all duration-200'
                    >
                      View
                    </button>
                    <button
                      type='button'
                      onClick={handleShareDocument}
                      className='px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-bold hover:bg-green-700 transition-all duration-200'
                    >
                      Share
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className='bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border-l-4 border-green-500'>
              <h3 className='text-sm md:text-base font-bold text-green-900 mb-3 flex items-center gap-2'>
                <svg className='w-4 h-4 md:w-5 md:h-5 text-green-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
                </svg>
                Vehicle & Certificate Details
              </h3>
              <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
                <div className='bg-white/70 p-3 rounded-lg'>
                  <label className='text-xs font-semibold text-gray-600 block mb-1'>Vehicle Number</label>
                  <p className='text-sm md:text-base font-bold text-gray-900 font-mono'>{fitness.vehicleNumber}</p>
                </div>
                {fitness.ownerName && (
                  <div className='bg-white/70 p-3 rounded-lg'>
                    <label className='text-xs font-semibold text-gray-600 block mb-1'>Owner Name</label>
                    <p className='text-sm md:text-base font-bold text-gray-900'>{fitness.ownerName}</p>
                  </div>
                )}
                {fitness.mobileNumber && (
                  <div className='bg-white/70 p-3 rounded-lg'>
                    <label className='text-xs font-semibold text-gray-600 block mb-1'>Mobile Number</label>
                    <p className='text-sm md:text-base font-bold text-gray-900'>{fitness.mobileNumber}</p>
                  </div>
                )}
                {fitness.date && (
                  <div className='bg-white/70 p-3 rounded-lg'>
                    <label className='text-xs font-semibold text-gray-600 block mb-1'>Date of Work</label>
                    <p className='text-sm md:text-base font-bold text-gray-900'>{fitness.date}</p>
                  </div>
                )}
                <div className='bg-white/70 p-3 rounded-lg'>
                  <label className='text-xs font-semibold text-gray-600 block mb-1'>Valid From</label>
                  <p className='text-sm md:text-base font-bold text-gray-900'>{fitness.validFrom}</p>
                </div>
                <div className='bg-white/70 p-3 rounded-lg'>
                  <label className='text-xs font-semibold text-gray-600 block mb-1'>Valid To</label>
                  <p className='text-sm md:text-base font-bold text-gray-900'>{fitness.validTo}</p>
                </div>
                <div className='bg-white/70 p-3 rounded-lg'>
                  <label className='text-xs font-semibold text-gray-600 block mb-1'>Status</label>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                    fitness.status === 'active'
                      ? 'bg-green-100 text-green-700 border border-green-300'
                      : fitness.status === 'expiring_soon'
                        ? 'bg-amber-100 text-amber-700 border border-amber-300'
                        : 'bg-red-100 text-red-700 border border-red-300'
                  }`}>
                    {fitness.status === 'active' ? 'Active' : fitness.status === 'expiring_soon' ? 'Expiring Soon' : 'Expired'}
                  </span>
                </div>
                <div className='bg-white/70 p-3 rounded-lg'>
                  <label className='text-xs font-semibold text-gray-600 block mb-1'>Payment Status</label>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                    fitness.balance > 0
                      ? 'bg-amber-100 text-amber-700 border border-amber-300'
                      : 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                  }`}>
                    {fitness.balance > 0 ? 'Pending Payment' : 'Fully Paid'}
                  </span>
                </div>
              </div>
            </div>

            <div className='bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border-l-4 border-purple-500 relative'>
              {fitness.balance === 0 && (
                <div className='absolute top-2 right-2 md:top-3 md:right-3'>
                  <div className='text-2xl md:text-4xl font-black text-green-600 opacity-20 transform -rotate-12 border-4 border-green-600 rounded-lg px-2 py-1'>
                    PAID
                  </div>
                </div>
              )}

              <h3 className='text-sm md:text-base font-bold text-purple-900 mb-3 flex items-center gap-2'>
                <svg className='w-4 h-4 md:w-5 md:h-5 text-purple-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z' />
                </svg>
                Payment Information
              </h3>
              <div className='grid grid-cols-3 gap-3'>
                <div className='bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg p-3 border border-blue-300'>
                  <label className='text-xs font-semibold text-blue-700 block mb-1'>Total Fee</label>
                  <p className='text-lg md:text-xl font-black text-blue-900'>
                    ₹{(fitness.totalFee || 0).toLocaleString('en-IN')}
                  </p>
                </div>
                <div className='bg-gradient-to-br from-green-100 to-emerald-100 rounded-lg p-3 border border-green-300'>
                  <label className='text-xs font-semibold text-green-700 block mb-1'>Paid Amount</label>
                  <p className='text-lg md:text-xl font-black text-green-900'>
                    ₹{(fitness.paid || 0).toLocaleString('en-IN')}
                  </p>
                </div>
                <div className={`rounded-lg p-3 border ${
                  fitness.balance > 0
                    ? 'bg-gradient-to-br from-orange-100 to-red-100 border-orange-300'
                    : 'bg-gradient-to-br from-green-100 to-emerald-100 border-green-300'
                }`}>
                  <label className={`text-xs font-semibold block mb-1 ${
                    fitness.balance > 0 ? 'text-orange-700' : 'text-green-700'
                  }`}>Balance</label>
                  <p className={`text-lg md:text-xl font-black ${
                    fitness.balance > 0 ? 'text-orange-900' : 'text-green-900'
                  }`}>
                    ₹{(fitness.balance || 0).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>

              {(() => {
                const validFeeItems = fitness.feeBreakup?.filter(item => {
                  if (!item || !item.name) return false
                  const amount = parseFloat(item.amount)
                  return !isNaN(amount) && amount > 0
                }) || []

                return validFeeItems.length > 0 && (
                  <div className='mt-4 pt-4 border-t border-purple-300'>
                    <h4 className='text-xs md:text-sm font-bold text-purple-900 mb-3 flex items-center gap-2'>
                      <svg className='w-4 h-4 text-purple-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' />
                      </svg>
                      Fee Breakup Details
                    </h4>
                    <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
                      {validFeeItems.map((item, index) => (
                        <div key={index} className='bg-white p-3 md:p-4 rounded-lg border border-gray-200 shadow-md hover:shadow-lg transition-all duration-200'>
                          <div className='flex items-center gap-2 mb-2'>
                            <div className='bg-purple-500 rounded-full p-1'>
                              <svg className='w-3 h-3 md:w-4 md:h-4 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' />
                              </svg>
                            </div>
                            <label className='text-xs font-bold text-purple-700 uppercase tracking-wide'>{item.name}</label>
                          </div>
                          <p className='text-base md:text-lg font-black text-gray-800 pl-1'>
                            ₹{(item.amount || 0).toLocaleString('en-IN')}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })()}
            </div>
          </div>
        </div>
      </div>
      <ImageViewer
        isOpen={showImageViewer}
        onClose={() => setShowImageViewer(false)}
        imageUrl={documentUrl}
        title='Fitness Document'
      />
    </div>
  )
}

export default FitnessDetailModal
