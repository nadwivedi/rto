import { useEffect, useState } from 'react'

const ApplicationDetailModal = ({ isOpen, onClose, application }) => {
  const [status, setStatus] = useState(application?.status || 'Pending')
  const [remarks, setRemarks] = useState('')
  const [isImageModalOpen, setIsImageModalOpen] = useState(false)

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

  if (!isOpen || !application) return null

  // Helper function to format date from ISO to DD-MM-YYYY
  const formatDate = (dateString) => {
    if (!dateString) return ''

    const date = new Date(dateString)
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()

    return `${day}-${month}-${year}`
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Approved': return 'bg-green-100 text-green-700 border-green-300'
      case 'Pending': return 'bg-yellow-100 text-yellow-700 border-yellow-300'
      case 'Under Review': return 'bg-blue-100 text-blue-700 border-blue-300'
      case 'Rejected': return 'bg-red-100 text-red-700 border-red-300'
      default: return 'bg-gray-100 text-gray-700 border-gray-300'
    }
  }

  const handleStatusChange = (newStatus) => {
    setStatus(newStatus)
    // In production, this would trigger an API call
    console.log('Status changed to:', newStatus)
  }

  const handleApprove = () => {
    handleStatusChange('Approved')
    // Additional approval logic here
  }

  const handleReject = () => {
    if (remarks.trim()) {
      handleStatusChange('Rejected')
      // Additional rejection logic here
    } else {
      alert('Please provide remarks for rejection')
    }
  }

  const handleViewPdf = (base64String) => {
    if (!base64String) return;
    try {
      if (base64String.startsWith('http') || base64String.startsWith('blob:')) {
        window.open(base64String, '_blank');
        return;
      }
      const base64Data = base64String.includes(',') ? base64String.split(',')[1] : base64String;
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, '_blank');
    } catch (error) {
      console.error('Error opening PDF:', error);
      alert('Unable to open PDF. It may be corrupted.');
    }
  }

  return (
    <div className='fixed inset-0 bg-black/70  z-50 flex items-center justify-center p-2 md:p-4'>
      <div className='bg-white rounded-xl md:rounded-3xl shadow-2xl w-full md:w-[95%] lg:w-[90%] xl:w-[85%] max-h-[98vh] md:max-h-[95vh] overflow-hidden flex flex-col'>
        {/* Header */}
        <div className='bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 p-3 md:p-5 text-white shadow-lg'>
          <div className='flex justify-between items-start gap-2'>
            <div className='min-w-0 flex-1'>
              <div className='flex items-center gap-2 mb-1 md:mb-2 flex-wrap'>
                <h2 className='text-base md:text-xl font-bold truncate'>DL Application Details</h2>
              </div>
              <p className='text-[10px] md:text-sm text-white/90 truncate'>Application ID: {application.id}</p>
            </div>
            <button
              onClick={onClose}
              className='text-white/90 hover:text-white hover:bg-white/20 rounded-lg md:rounded-xl p-1.5 md:p-2.5 transition-all duration-200 hover:rotate-90 flex-shrink-0'
            >
              <svg className='w-5 h-5 md:w-6 md:h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className='flex-1 overflow-y-auto p-3 md:p-5'>
          {/* Document Preview Section - Render on Top if Learning License Document exists */}
          {application.fullData?.documents?.learningLicense && (
            <div className='mb-4 bg-gray-50 rounded-lg md:rounded-xl p-3 md:p-4 border-2 border-gray-200 shadow-sm'>
              <h3 className='text-sm md:text-base font-bold text-gray-800 mb-2 flex items-center gap-2'>
                <svg className='w-4 h-4 text-indigo-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13' />
                </svg>
                Uploaded Learning License
              </h3>
              <div className='w-full flex justify-center bg-white rounded-lg border border-gray-200 p-3'>
                {application.fullData.documents.learningLicenseType === 'application/pdf' ? (
                  <button 
                    onClick={() => handleViewPdf(application.fullData.documents.learningLicense)}
                    className='flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 rounded-md text-xs font-semibold transition-colors shadow-sm'
                  >
                    <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 20 20'>
                      <path fillRule='evenodd' d='M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z' clipRule='evenodd' />
                    </svg>
                    View PDF
                  </button>
                ) : (
                  <img 
                    src={application.fullData.documents.learningLicense} 
                    alt='Learning License' 
                    onClick={() => setIsImageModalOpen(true)}
                    className='max-w-full h-32 md:h-40 object-contain rounded cursor-pointer border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105'
                    title='Click to view full size'
                  />
                )}
              </div>
            </div>
          )}
          {/* Application Details */}
          <div className='space-y-3 md:space-y-4'>
            {/* Personal Information */}
            <div className='bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg md:rounded-xl p-3 md:p-5 border-2 border-indigo-200'>
              <h3 className='text-sm md:text-base font-bold text-indigo-900 mb-2 md:mb-3 flex items-center gap-1.5 md:gap-2'>
                <svg className='w-3.5 h-3.5 md:w-4 md:h-4 text-indigo-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' />
                </svg>
                Personal Information
              </h3>
              <div className='grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3'>
                {/* Full Name - Always show */}
                <div className='bg-white/80 p-2 rounded-lg'>
                  <label className='text-[10px] md:text-xs font-semibold text-gray-600'>Full Name</label>
                  <p className='text-xs md:text-sm font-bold text-gray-900 mt-0.5'>{application.name}</p>
                </div>

                {/* Date of Birth - Always show */}
                <div className='bg-white/80 p-2 rounded-lg'>
                  <label className='text-[10px] md:text-xs font-semibold text-gray-600'>Date of Birth</label>
                  <p className='text-xs md:text-sm font-bold text-gray-900 mt-0.5'>{formatDate(application.fullData?.dateOfBirth) || '15-08-1995'}</p>
                </div>

                {/* Gender - Always show */}
                <div className='bg-white/80 p-2 rounded-lg'>
                  <label className='text-[10px] md:text-xs font-semibold text-gray-600'>Gender</label>
                  <p className='text-xs md:text-sm font-bold text-gray-900 mt-0.5'>{application.fullData?.gender || 'Male'}</p>
                </div>

                {/* Father's Name - Always show */}
                <div className='bg-white/80 p-2 rounded-lg'>
                  <label className='text-[10px] md:text-xs font-semibold text-gray-600'>Father's Name</label>
                  <p className='text-xs md:text-sm font-bold text-gray-900 mt-0.5'>{application.fullData?.fatherName || 'Ramesh Kumar'}</p>
                </div>


                {/* Phone Number - Always show */}
                <div className='bg-white/80 p-2 rounded-lg'>
                  <label className='text-[10px] md:text-xs font-semibold text-gray-600'>Phone Number</label>
                  <p className='text-xs md:text-sm font-bold text-gray-900 mt-0.5'>{application.mobile || application.fullData?.mobileNumber || '+91 9876543210'}</p>
                </div>

                {/* Email - Show only if filled */}
                {(application.email || application.fullData?.email) && (
                  <div className='bg-white/80 p-2 rounded-lg'>
                    <label className='text-[10px] md:text-xs font-semibold text-gray-600'>Email</label>
                    <p className='text-xs md:text-sm font-bold text-gray-900 mt-0.5 break-all'>{application.email || application.fullData?.email}</p>
                  </div>
                )}

                {/* Address - Always show */}
                <div className='bg-white/80 p-2 rounded-lg col-span-2 md:col-span-4'>
                  <label className='text-[10px] md:text-xs font-semibold text-gray-600'>Address</label>
                  <p className='text-xs md:text-sm font-bold text-gray-900 mt-0.5 leading-relaxed'>
                    {application.fullData?.address || '123, MG Road, Sector 15, Mumbai, Maharashtra - 400001'}
                  </p>
                </div>
              </div>
            </div>

            {/* License Information - All three cards in same row for desktop */}
            <div className='grid grid-cols-1 lg:grid-cols-7 gap-3 md:gap-4'>
              {/* License Class */}
              <div className='bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg md:rounded-xl p-3 md:p-4 border-2 border-blue-200 lg:col-span-1'>
                <h3 className='text-sm md:text-base font-bold text-blue-900 mb-2 md:mb-3 flex items-center gap-1.5 md:gap-2'>
                  <svg className='w-3.5 h-3.5 md:w-4 md:h-4 text-blue-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' />
                  </svg>
                  License Class
                </h3>
                <div className='bg-white/80 p-2 rounded-lg'>
                  <label className='text-[10px] md:text-xs font-semibold text-gray-600'>Class</label>
                  <p className='text-sm md:text-lg font-bold text-gray-900 mt-0.5'>{application.type || application.fullData?.licenseClass || 'N/A'}</p>
                </div>
              </div>

              {/* Learning License Information - Always show */}
              <div className='bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg md:rounded-xl p-3 md:p-4 border-2 border-yellow-200 lg:col-span-3'>
                <h3 className='text-sm md:text-base font-bold text-orange-900 mb-2 md:mb-3 flex items-center gap-1.5 md:gap-2'>
                  <svg className='w-3.5 h-3.5 md:w-4 md:h-4 text-orange-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' />
                  </svg>
                  Learning License
                </h3>
                <div className='grid grid-cols-1 md:grid-cols-4 gap-2'>
                  {/* LL Application Number */}
                  <div className='bg-white/80 p-2 rounded-lg'>
                    <label className='text-[10px] md:text-xs font-semibold text-gray-600'>LL Application No.</label>
                    <p className='text-xs md:text-sm font-bold text-gray-900 mt-0.5 font-mono'>{application.fullData?.learningLicenseApplicationNumber || 'N/A'}</p>
                  </div>

                  {/* LL Number */}
                  <div className='bg-white/80 p-2 rounded-lg'>
                    <label className='text-[10px] md:text-xs font-semibold text-gray-600'>LL Number</label>
                    <p className='text-xs md:text-sm font-bold text-gray-900 mt-0.5 font-mono'>{application.fullData?.learningLicenseNumber || 'N/A'}</p>
                  </div>

                  {/* LL Issue Date */}
                  <div className='bg-white/80 p-2 rounded-lg'>
                    <label className='text-[10px] md:text-xs font-semibold text-gray-600'>Issue Date</label>
                    <p className='text-xs md:text-sm font-bold text-green-700 mt-0.5'>
                      {application.fullData?.learningLicenseIssueDate ? formatDate(application.fullData.learningLicenseIssueDate) : 'N/A'}
                    </p>
                  </div>

                  {/* LL Expiry Date */}
                  <div className='bg-white/80 p-2 rounded-lg'>
                    <label className='text-[10px] md:text-xs font-semibold text-gray-600'>Expiry Date</label>
                    <p className='text-xs md:text-sm font-bold text-red-700 mt-0.5'>
                      {application.fullData?.learningLicenseExpiryDate ? formatDate(application.fullData.learningLicenseExpiryDate) : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Driving License Information - Always show */}
              <div className='bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg md:rounded-xl p-3 md:p-4 border-2 border-purple-200 lg:col-span-3'>
                <h3 className='text-sm md:text-base font-bold text-purple-900 mb-2 md:mb-3 flex items-center gap-1.5 md:gap-2'>
                  <svg className='w-3.5 h-3.5 md:w-4 md:h-4 text-purple-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2' />
                  </svg>
                  Driving License
                </h3>
                <div className='grid grid-cols-1 md:grid-cols-3 gap-2'>
                  {/* License Number */}
                  <div className='bg-white/80 p-2 rounded-lg'>
                    <label className='text-[10px] md:text-xs font-semibold text-gray-600'>DL Number</label>
                    <p className='text-xs md:text-sm font-bold text-gray-900 mt-0.5 font-mono'>{application.licenseNumber || application.fullData?.licenseNumber || application.fullData?.LicenseNumber || 'N/A'}</p>
                  </div>

                  {/* License Issue Date */}
                  <div className='bg-white/80 p-2 rounded-lg'>
                    <label className='text-[10px] md:text-xs font-semibold text-gray-600'>Issue Date</label>
                    <p className='text-xs md:text-sm font-bold text-green-700 mt-0.5'>
                      {application.issueDate ||
                       (application.fullData?.LicenseIssueDate && formatDate(application.fullData?.LicenseIssueDate)) ||
                       application.fullData?.licenseIssueDate || 'N/A'}
                    </p>
                  </div>

                  {/* License Expiry Date */}
                  <div className='bg-white/80 p-2 rounded-lg'>
                    <label className='text-[10px] md:text-xs font-semibold text-gray-600'>Expiry Date</label>
                    <p className='text-xs md:text-sm font-bold text-red-700 mt-0.5'>
                      {application.expiryDate ||
                       (application.fullData?.LicenseExpiryDate && formatDate(application.fullData?.LicenseExpiryDate)) ||
                       application.fullData?.licenseExpiryDate || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Information */}
            <div className='bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg md:rounded-xl p-3 md:p-5 border-2 border-green-200 relative'>
              {/* PAID Stamp - Show only when balance is 0 */}
              {(application.fullData?.balanceAmount === 0 || application.balanceAmount === 0) && (
                <div className='absolute top-2 right-2 md:top-4 md:right-4 z-10'>
                  <div className='text-3xl md:text-5xl lg:text-6xl font-black text-green-600 opacity-25 transform -rotate-12 border-4 md:border-6 border-green-600 rounded-lg px-2 py-1 md:px-3 md:py-1.5'>
                    PAID
                  </div>
                </div>
              )}

              <h3 className='text-sm md:text-base font-bold text-green-900 mb-2 md:mb-3 flex items-center gap-1.5 md:gap-2'>
                <svg className='w-3.5 h-3.5 md:w-4 md:h-4 text-green-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z' />
                </svg>
                Payment Details
              </h3>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-3'>
                {/* Total Amount */}
                <div className='bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-2.5 md:p-3 border-2 border-blue-200'>
                  <label className='text-[10px] md:text-xs font-semibold text-blue-700'>Total Amount</label>
                  <p className='text-base md:text-xl lg:text-2xl font-black text-blue-900 mt-1'>
                    ₹{application.fullData?.totalAmount?.toLocaleString() || application.totalAmount?.toLocaleString() || '0'}
                  </p>
                </div>

                {/* Paid Amount */}
                <div className='bg-gradient-to-br from-green-100 to-emerald-100 rounded-lg p-2.5 md:p-3 border-2 border-green-300'>
                  <label className='text-[10px] md:text-xs font-semibold text-green-700'>Paid Amount</label>
                  <p className='text-base md:text-xl lg:text-2xl font-black text-green-800 mt-1'>
                    ₹{application.fullData?.paidAmount?.toLocaleString() || application.paidAmount?.toLocaleString() || '0'}
                  </p>
                </div>

                {/* Balance Amount */}
                <div className={`rounded-lg p-2.5 md:p-3 border-2 ${(application.fullData?.balanceAmount || application.balanceAmount || 0) > 0 ? 'bg-gradient-to-br from-orange-50 to-red-50 border-orange-200' : 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200'}`}>
                  <label className={`text-[10px] md:text-xs font-semibold ${(application.fullData?.balanceAmount || application.balanceAmount || 0) > 0 ? 'text-orange-700' : 'text-green-700'}`}>Balance</label>
                  <p className={`text-base md:text-xl lg:text-2xl font-black mt-1 ${(application.fullData?.balanceAmount || application.balanceAmount || 0) > 0 ? 'text-orange-800' : 'text-green-800'}`}>
                    ₹{application.fullData?.balanceAmount?.toLocaleString() || application.balanceAmount?.toLocaleString() || '0'}
                  </p>
                </div>
              </div>
            </div>

            {/* Additional Details - Show only if aadhar or signature is uploaded */}
            {(application.fullData?.aadharCard || application.fullData?.signature) && (
              <div className='bg-gradient-to-br from-gray-50 to-slate-50 rounded-lg md:rounded-xl p-3 md:p-5 border-2 border-gray-200'>
                <h3 className='text-sm md:text-base font-bold text-gray-900 mb-2 md:mb-3 flex items-center gap-1.5 md:gap-2'>
                  <svg className='w-3.5 h-3.5 md:w-4 md:h-4 text-gray-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13' />
                  </svg>
                  Documents
                </h3>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3'>
                  {/* Aadhar Card - Show only if uploaded */}
                  {application.fullData?.aadharCard && (
                    <div className='bg-white/80 p-2 rounded-lg'>
                      <label className='text-[10px] md:text-xs font-semibold text-gray-600'>Aadhar Card</label>
                      <p className='text-xs md:text-sm font-bold text-gray-900 mt-0.5'>{application.fullData.aadharCard}</p>
                    </div>
                  )}

                  {/* Signature - Show only if uploaded */}
                  {application.fullData?.signature && (
                    <div className='bg-white/80 p-2 rounded-lg'>
                      <label className='text-[10px] md:text-xs font-semibold text-gray-600'>Signature</label>
                      <p className='text-xs md:text-sm font-bold text-gray-900 mt-0.5'>{application.fullData.signature}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className='border-t border-gray-200 px-3 py-2.5 md:px-5 md:py-3 bg-gray-50'>
          <div className='flex justify-end'>
            <button
              onClick={onClose}
              className='px-4 py-2 md:px-6 md:py-2 bg-gray-600 text-white rounded-lg md:rounded-xl hover:bg-gray-700 transition-all duration-200 font-bold text-sm shadow-md hover:shadow-lg'
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Fullscreen Image Modal */}
      {isImageModalOpen && (
        <div 
          className='fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm'
          onClick={() => setIsImageModalOpen(false)}
        >
          <button 
            className='absolute top-4 right-4 md:top-6 md:right-6 text-white hover:text-red-400 transition-colors p-2'
            onClick={(e) => { e.stopPropagation(); setIsImageModalOpen(false); }}
          >
            <svg className='w-8 h-8 md:w-10 md:h-10' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
            </svg>
          </button>
          <img 
            src={application.fullData?.documents?.learningLicense} 
            className='max-w-full max-h-full object-contain rounded-lg shadow-2xl select-none'
            onClick={(e) => e.stopPropagation()} 
            alt='Full Size Learning License' 
          />
        </div>
      )}
    </div>
  )
}

export default ApplicationDetailModal
