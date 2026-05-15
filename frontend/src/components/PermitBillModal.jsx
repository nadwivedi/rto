import React, { useState, useEffect } from 'react'
import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'

const PermitBillModal = ({ permit, onClose, permitType = 'National' }) => {
  const [pdfUrl, setPdfUrl] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadBillPDF()
  }, [])

  const loadBillPDF = async () => {
    try {
      // Determine bill PDF path based on permit type
      let billPdfPath = null

      switch (permitType) {
        case 'National':
          billPdfPath = permit.partA?.billPdfPath || permit.bill?.billPdfPath
          break
        case 'CG':
          billPdfPath = permit.bill?.billPdfPath
          break
        case 'Temporary':
          billPdfPath = permit.bill?.billPdfPath
          break
        default:
          throw new Error('Invalid permit type')
      }

      // Check if PDF exists - if yes, show it immediately without loading
      if (billPdfPath) {
        const url = `${API_BASE_URL}${billPdfPath}`
        setPdfUrl(url)
        setLoading(false)
        return
      }

      // If PDF doesn't exist, show error
      setLoading(false)
      setError('Bill PDF not found. Please contact administrator.')
    } catch (err) {
      console.error('Error loading PDF:', err)
      setError(err.message)
      setLoading(false)
    }
  }

  const handleDownload = () => {
    if (permit.id) {
      try {
        // Determine download endpoint based on permit type
        let downloadUrl = ''
        switch (permitType) {
          case 'National':
            downloadUrl = `${API_BASE_URL}/api/national-permits/${permit.id}/download-bill-pdf`
            break
          case 'CG':
            downloadUrl = `${API_BASE_URL}/api/cg-permits/${permit.id}/download-bill-pdf`
            break
          case 'Temporary':
            downloadUrl = `${API_BASE_URL}/api/temporary-permits/${permit.id}/download-bill-pdf`
            break
          default:
            throw new Error('Invalid permit type')
        }

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
      } catch (error) {
        console.error('Error downloading PDF:', error)
        alert('Failed to download PDF. Please try again.')
      }
    }
  }

  const handleShare = async () => {
    if (!pdfUrl) return

    try {
      // Fetch the PDF file as a blob
      const response = await axios.get(pdfUrl, {
        responseType: 'blob',
        withCredentials: true
      })

      const blob = response.data
      const billNumber = permit.partA?.billNumber || permit.bill?.billNumber || 'Bill'
      const fileName = `${billNumber}_${permit.permitNumber}.pdf`

      // Check if Web Share API with files support is available
      if (navigator.share && navigator.canShare) {
        // Create a File object from the blob
        const file = new File([blob], fileName, { type: 'application/pdf' })

        // Check if we can share this file
        const shareData = {
          title: `Bill Receipt - ${billNumber}`,
          text: `Bill receipt for Permit ${permit.permitNumber}`,
          files: [file]
        }

        if (navigator.canShare(shareData)) {
          // Share the actual PDF file
          await navigator.share(shareData)
          return
        }
      }

      // Fallback 1: Try sharing without canShare check (some browsers support it)
      if (navigator.share) {
        try {
          const file = new File([blob], fileName, { type: 'application/pdf' })
          const billNumber = permit.partA?.billNumber || permit.bill?.billNumber || 'Bill'
          await navigator.share({
            title: `Bill Receipt - ${billNumber}`,
            text: `Bill receipt for Permit ${permit.permitNumber}`,
            files: [file]
          })
          return
        } catch (shareError) {
          // If files not supported, try sharing URL
          if (shareError.name !== 'AbortError') {
            const billNumber = permit.partA?.billNumber || permit.bill?.billNumber || 'Bill'
            await navigator.share({
              title: `Bill Receipt - ${billNumber}`,
              text: `Bill receipt for Permit ${permit.permitNumber}`,
              url: pdfUrl
            })
            return
          }
          throw shareError
        }
      }

      // Fallback 2: Create a temporary download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      alert('PDF downloaded! You can now share it from your downloads folder.')

    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error sharing PDF:', error)
        // Last resort: try to copy link to clipboard
        try {
          await navigator.clipboard.writeText(pdfUrl)
          alert('Bill link copied to clipboard! You can paste and share it.')
        } catch (clipboardError) {
          console.error('Clipboard error:', clipboardError)
          alert('Unable to share. PDF URL: ' + pdfUrl)
        }
      }
    }
  }

  const handlePrint = () => {
    if (pdfUrl) {
      const printWindow = window.open(pdfUrl, '_blank')
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print()
        }
      }
    }
  }

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 z-[70] flex items-center justify-center p-4'>
      <div className='bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col'>
        {/* Modal Header */}
        <div className='bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6 flex justify-between items-center'>
          <div>
            <h2 className='text-2xl font-bold'>Bill Receipt</h2>
            <p className='text-sm text-green-100 mt-1'>
              {permit.partA?.billNumber || permit.bill?.billNumber || 'Bill Number'}
            </p>
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

        {/* PDF Content */}
        <div className='flex-1 overflow-hidden bg-gray-100'>
          {loading && (
            <div className='flex flex-col items-center justify-center h-full p-8'>
              <div className='relative'>
                <div className='w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl animate-pulse shadow-lg'></div>
                <div className='absolute inset-0 w-16 h-16 border-4 border-green-600 border-t-transparent rounded-2xl animate-spin'></div>
              </div>
              <div className='mt-6 text-center'>
                <p className='text-xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-1'>
                  Generating Bill PDF
                </p>
                <p className='text-sm text-gray-600'>Please wait...</p>
              </div>
            </div>
          )}

          {error && (
            <div className='flex flex-col items-center justify-center h-full p-8'>
              <div className='w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4'>
                <svg className='w-8 h-8 text-red-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                </svg>
              </div>
              <p className='text-lg font-bold text-gray-800 mb-2'>Failed to Load Bill</p>
              <p className='text-sm text-gray-600'>{error}</p>
              <button
                onClick={loadBillPDF}
                className='mt-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold'
              >
                Retry
              </button>
            </div>
          )}

          {pdfUrl && !loading && !error && (
            <iframe
              src={pdfUrl}
              className='w-full h-full'
              title='Bill PDF'
              style={{ minHeight: '500px' }}
            />
          )}
        </div>

        {/* Modal Footer - Action Buttons */}
        <div className='bg-white border-t border-gray-200 p-4 flex justify-end gap-3'>
          <button
            onClick={onClose}
            className='px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition font-semibold cursor-pointer'
          >
            Close
          </button>
          <button
            onClick={handleShare}
            disabled={!pdfUrl || loading}
            className='px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-semibold cursor-pointer flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed'
            title='Share Bill'
          >
            <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z' />
            </svg>
            Share
          </button>
          <button
            onClick={handlePrint}
            disabled={!pdfUrl || loading}
            className='px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold cursor-pointer flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed'
          >
            <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z' />
            </svg>
            Print Bill
          </button>
          <button
            onClick={handleDownload}
            disabled={!pdfUrl || loading}
            className='px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:shadow-lg transition font-semibold cursor-pointer flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed'
          >
            <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' />
            </svg>
            Download PDF
          </button>
        </div>
      </div>
    </div>
  )
}

export default PermitBillModal
