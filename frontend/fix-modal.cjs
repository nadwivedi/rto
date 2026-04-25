const fs = require('fs');
const p = 'c:/Users/Naray/OneDrive/Desktop/code/rto2/frontend/src/pages/DrivingLicence/components/ApplicationDetailModal.jsx';
let c = fs.readFileSync(p, 'utf8');

const idx = c.indexOf('{/* Content */}');
if (idx === -1) {
  console.log('Could not find Content marker!');
  process.exit(1);
}

const topPart = `import { useEffect, useState } from 'react'

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

    return \`\${day}-\${month}-\${year}\`
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

        `;
fs.writeFileSync(p, topPart + c.substring(idx));
console.log('Success');
