import { useState } from 'react'
import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'

const SharePermitModal = ({ permit, onClose }) => {
  const [phoneNumber, setPhoneNumber] = useState(permit.partA?.ownerMobile || '')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleDownloadPDF = async () => {
    setLoading(true)
    setError('')
    setMessage('')

    try {
      // Use the dedicated download endpoint
      const downloadUrl = `${API_BASE_URL}/national-permits/${permit.id}/download-bill-pdf`

      // Create a link element with download attribute
      const link = document.createElement('a')
      link.href = downloadUrl
      link.target = '_blank'
      link.rel = 'noopener noreferrer'

      // Append to body, click, and remove
      document.body.appendChild(link)
      link.click()

      // Clean up
      setTimeout(() => {
        document.body.removeChild(link)
      }, 100)

      setMessage('PDF downloaded successfully!')
      setTimeout(() => {
        setMessage('')
      }, 3000)
    } catch (error) {
      console.error('Error downloading PDF:', error)
      setError(error.message || 'Failed to download PDF. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleShare = async () => {
    // Validate phone number
    if (!phoneNumber || phoneNumber.trim() === '') {
      setError('Please enter a phone number')
      return
    }

    // Basic validation for 10-digit number
    const cleanedNumber = phoneNumber.replace(/\D/g, '')
    if (cleanedNumber.length !== 10) {
      setError('Please enter a valid 10-digit phone number')
      return
    }

    setLoading(true)
    setError('')
    setMessage('')

    try {
      // Check if PDF already exists, otherwise generate it
      let pdfUrl = null

      if (permit.partA?.billPdfPath) {
        // PDF already exists, use it directly
        pdfUrl = `${API_BASE_URL}${permit.partA.billPdfPath}`
      } else {
        // Need to generate PDF
        const response = await axios.post(`${API_BASE_URL}/api/national-permits/${permit.id}/generate-bill-pdf`, {}, {
          withCredentials: true
        })

        const data = response.data

        if (!data.success) {
          throw new Error(data.message || 'Failed to generate PDF')
        }

        pdfUrl = data.data.pdfUrl || `${API_BASE_URL}${data.data.pdfPath}`
      }

      // Create WhatsApp message
      const message = `Hello ${permit.partA?.ownerName || 'Sir/Madam'},

Your National Permit Bill is ready!

*Bill Number:* ${permit.partA?.billNumber || 'N/A'}
*Permit Number:* ${permit.permitNumber}
*Vehicle Number:* ${permit.partA?.vehicleNumber || 'N/A'}
*Amount:* ${permit.partA?.fees || '₹0'}

Download your bill here:
${pdfUrl}

Thank you for your business!
- Ashok Kumar (Transport Consultant)`

      // Encode message for URL
      const encodedMessage = encodeURIComponent(message)

      // Clear loading state
      setLoading(false)

      // Format phone number for WhatsApp with country code
      const formattedPhone = `91${cleanedNumber}`

      // Use WhatsApp Web for reliable message pre-fill (works for saved and unsaved contacts)
      const whatsappWebUrl = `https://web.whatsapp.com/send?phone=${formattedPhone}&text=${encodedMessage}`

      // Open in same tab named 'whatsapp_share' - reuses tab if already open
      const whatsappWindow = window.open(whatsappWebUrl, 'whatsapp_share')
      if (whatsappWindow) {
        whatsappWindow.focus()
      } else {
        // If popup blocked, show message
        setError('Please allow popups for this site to share via WhatsApp.')
        return
      }

      setMessage('Opening WhatsApp...')
      setTimeout(() => {
        onClose()
      }, 2000)

    } catch (error) {
      console.error('Error sharing permit:', error)
      setError(error.message || 'Failed to share permit. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 z-[70] flex items-center justify-center p-4'>
      <div className='bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col'>
        {/* Header */}
        <div className='bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6 flex justify-between items-center'>
          <div>
            <h2 className='text-2xl font-bold'>Share National Permit Bill</h2>
            <p className='text-sm text-green-100 mt-1'>Share bill via WhatsApp</p>
          </div>
          <button
            onClick={onClose}
            className='text-white hover:bg-white/20 p-2 rounded-lg transition cursor-pointer'
          >
            <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
            </svg>
          </button>
        </div>

        {/* Permit Information Summary */}
        <div className='p-6 bg-gradient-to-br from-gray-50 to-white'>
          <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-4'>
            <h3 className='text-lg font-bold text-gray-800 mb-4 flex items-center gap-2'>
              <svg className='w-5 h-5 text-green-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' />
              </svg>
              Permit Summary
            </h3>

            <div className='space-y-3'>
              <div className='flex justify-between items-center pb-3 border-b border-gray-100'>
                <span className='text-sm text-gray-600 font-medium'>Permit Holder:</span>
                <span className='font-bold text-gray-900'>{permit.permitHolder}</span>
              </div>

              <div className='flex justify-between items-center pb-3 border-b border-gray-100'>
                <span className='text-sm text-gray-600 font-medium'>Permit Number:</span>
                <span className='font-mono font-bold text-gray-900'>{permit.permitNumber}</span>
              </div>

              <div className='flex justify-between items-center pb-3 border-b border-gray-100'>
                <span className='text-sm text-gray-600 font-medium'>Vehicle Number:</span>
                <span className='font-mono font-bold text-gray-900'>{permit.vehicleNo}</span>
              </div>

              <div className='flex justify-between items-center'>
                <span className='text-sm text-gray-600 font-medium'>Bill Amount:</span>
                <span className='text-xl font-black text-green-600'>{permit.partA?.fees || '₹15,000'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer with Share Options */}
        <div className='bg-white border-t border-gray-200 p-6'>
          {/* Phone Number Input */}
          <div className='mb-4'>
            <label className='block text-sm font-semibold text-gray-700 mb-2'>
              WhatsApp Number <span className='text-red-500'>*</span>
            </label>
            <div className='relative'>
              <span className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-semibold'>
                +91
              </span>
              <input
                type='tel'
                value={phoneNumber}
                onChange={(e) => {
                  setPhoneNumber(e.target.value)
                  setError('')
                }}
                placeholder='Enter 10-digit mobile number'
                maxLength='10'
                className='w-full pl-12 pr-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent font-mono'
                disabled={loading}
              />
            </div>
          </div>

          {/* Success Message */}
          {message && (
            <div className='mb-3 bg-green-50 border-l-4 border-green-500 p-3 rounded-lg'>
              <div className='flex items-center'>
                <svg className='w-5 h-5 text-green-500 mr-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
                </svg>
                <p className='text-sm text-green-700 font-semibold'>{message}</p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className='mb-3 bg-red-50 border-l-4 border-red-500 p-3 rounded-lg'>
              <div className='flex items-center'>
                <svg className='w-5 h-5 text-red-500 mr-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
                </svg>
                <p className='text-sm text-red-700 font-semibold'>{error}</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className='flex gap-3'>
            <button
              onClick={onClose}
              className='px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition font-semibold cursor-pointer'
            >
              Close
            </button>
            <button
              onClick={handleDownloadPDF}
              className='px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold cursor-pointer flex items-center gap-2'
              disabled={loading}
            >
              <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' />
              </svg>
              Download PDF
            </button>
            <button
              onClick={handleShare}
              className='flex-1 px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:shadow-lg transition font-semibold cursor-pointer flex items-center justify-center gap-2'
              disabled={loading}
            >
              {loading ? (
                <>
                  <svg className='animate-spin h-5 w-5 text-white' xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24'>
                    <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4'></circle>
                    <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'></path>
                  </svg>
                  Sharing...
                </>
              ) : (
                <>
                  <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z' />
                  </svg>
                  Share on WhatsApp
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SharePermitModal
