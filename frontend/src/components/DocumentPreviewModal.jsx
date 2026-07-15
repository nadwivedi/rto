import { useState } from 'react'

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'

const DocumentPreviewModal = ({ isOpen, onClose, docField, title }) => {
  const [docError, setDocError] = useState(false)

  if (!isOpen || !docField) return null

  const docUrl = docField.startsWith('http')
    ? docField
    : `${API_URL}${docField}`

  const isPDF = docUrl?.includes('.pdf') || docUrl?.includes('application/pdf')
  const isImage = docUrl && !isPDF

  return (
    <div className='fixed inset-0 bg-black/60 z-[80] flex items-center justify-center p-2 md:p-4' onClick={onClose}>
      <div className='bg-white rounded-xl md:rounded-2xl shadow-2xl max-w-3xl w-full max-h-[95vh] overflow-hidden flex flex-col' onClick={(e) => e.stopPropagation()}>
        <div className='bg-gradient-to-r from-sky-600 to-blue-600 p-3 md:p-4 text-white flex-shrink-0 flex justify-between items-center'>
          <h2 className='text-lg md:text-xl font-bold'>{title || 'Document Preview'}</h2>
          <button onClick={onClose} className='text-white hover:bg-white/20 rounded-lg p-1.5 md:p-2 transition cursor-pointer'>
            <svg className='w-5 h-5 md:w-6 md:h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
            </svg>
          </button>
        </div>

        <div className='flex-1 overflow-y-auto p-4 md:p-6 flex items-center justify-center min-h-[300px]'>
          <div className='w-full max-h-[70vh] rounded-lg overflow-hidden border border-gray-200 bg-gray-50'>
            {isPDF ? (
              <div className='flex flex-col items-center justify-center p-8 md:p-12'>
                <svg className='w-20 h-20 text-red-500 mb-4' fill='currentColor' viewBox='0 0 20 20'>
                  <path fillRule='evenodd' d='M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z' clipRule='evenodd' />
                </svg>
                <p className='text-sm font-semibold text-gray-600 mb-4'>This document is a PDF file</p>
                <a
                  href={docUrl}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition font-semibold text-sm shadow-lg'
                >
                  Open PDF in New Tab
                </a>
              </div>
            ) : isImage ? (
              <img
                src={docUrl}
                alt='Document'
                className='w-full h-auto max-h-[70vh] object-contain mx-auto'
                onError={() => setDocError(true)}
              />
            ) : null}
            {docError && (
              <div className='p-8 text-center'>
                <svg className='w-16 h-16 mx-auto text-red-400 mb-3' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z' />
                </svg>
                <p className='text-red-600 font-semibold'>Failed to load document</p>
                <p className='text-gray-500 text-sm mt-1'>The file may have been removed or is unavailable.</p>
              </div>
            )}
          </div>
        </div>

        <div className='border-t border-gray-200 p-3 md:p-4 bg-gray-50 flex justify-end flex-shrink-0 gap-2'>
          {docUrl && (
            <a
              href={docUrl}
              target='_blank'
              rel='noopener noreferrer'
              className='px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-semibold text-sm cursor-pointer'
            >
              Open in New Tab
            </a>
          )}
          <button onClick={onClose} className='px-6 py-2 bg-gradient-to-r from-sky-600 to-blue-600 text-white rounded-lg hover:shadow-lg font-semibold transition cursor-pointer'>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default DocumentPreviewModal
