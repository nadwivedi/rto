import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import QuickDLApplicationForm from './DrivingLicence/components/QuickDLApplicationForm'
import axios from 'axios'
import { toast } from 'react-toastify'
import AddVehicleTransferModal from './VehicleTransfer/components/AddVehicleTransferModal'
import { Menu, X, FileText } from 'lucide-react'
import AddNocModal from './Noc/components/AddNocModal'
import AddRegistrationRenewalModal from './RegistrationRenewal/components/AddRegistrationRenewalModal'
import AddHpaHptModal from './HpaHpt/components/AddHpaHptModal'
import SarthiDashboard from './Sarthi/components/SarthiDashboard'

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'

const sarthiOptions = [
  { 
    title: 'Add DL', 
    note: 'New driving license application', 
    icon: <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"/></svg>, 
    bgGradient: 'bg-gradient-to-br from-indigo-500 to-purple-600',
    shadow: 'shadow-indigo-500/30'
  },
  { 
    title: 'Vehicle Transfer', 
    note: 'Ownership transfer service', 
    icon: <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/></svg>, 
    bgGradient: 'bg-gradient-to-br from-orange-400 to-red-500',
    shadow: 'shadow-orange-500/30'
  },
  { 
    title: 'NOC Issued', 
    note: 'No Objection Certificate service', 
    icon: <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>, 
    bgGradient: 'bg-gradient-to-br from-emerald-400 to-teal-500',
    shadow: 'shadow-emerald-500/30'
  },
  { 
    title: 'RC Renewal', 
    note: 'Vehicle registration renewal', 
    icon: <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>, 
    bgGradient: 'bg-gradient-to-br from-sky-400 to-blue-600',
    shadow: 'shadow-blue-500/30'
  },
  { 
    title: 'HPA+HPT', 
    note: 'Hypothecation addition & termination', 
    icon: <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>, 
    bgGradient: 'bg-gradient-to-br from-rose-400 to-pink-600',
    shadow: 'shadow-rose-500/30'
  }
]

const quickButtons = [
  { title: 'DL List', shortLabel: 'DL', path: '/driving', tone: 'border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100' },
  { title: 'Transfer List', shortLabel: 'Transfer', path: '/vehicle-transfer', tone: 'border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100' },
  { title: 'NOC List', shortLabel: 'NOC', path: '/noc', tone: 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100' },
  { title: 'Renewal List', shortLabel: 'Renewal', path: '/registration-renewal', tone: 'border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100' },
  { title: 'HPA+HPT List', shortLabel: 'HPA+HPT', path: '/hpa-hpt', tone: 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100' },
]

const Sarthi = () => {
  const navigate = useNavigate()
  const [activeModal, setActiveModal] = useState(null)
  const [focusedIndex, setFocusedIndex] = useState(0)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const [dashboardRefreshKey, setDashboardRefreshKey] = useState(0)

  const openModal = (title) => {
    const option = sarthiOptions.find((o) => o.title === title)
    if (option && option.path) {
      navigate(option.path)
      return
    }
    setActiveModal(title)
    setIsMobileMenuOpen(false)
    setIsReportModalOpen(false)
  }
  const closeModal = () => {
    setActiveModal(null)
    setFocusedIndex(prev => prev ?? 0)
  }

  const handleVehicleTransferSuccess = () => {
    setDashboardRefreshKey(prev => prev + 1)
    closeModal()
  }

  // Global arrow-key navigation for sidebar
  useEffect(() => {
    if (activeModal || isMobileMenuOpen || isReportModalOpen) return
    const handleKeyDown = (e) => {
      if (['ArrowDown', 'ArrowUp', 'Enter'].includes(e.key)) {
        e.preventDefault()
      }
      if (e.key === 'ArrowDown') {
        setFocusedIndex(prev => {
          const next = (prev === null ? 0 : prev + 1)
          return next >= sarthiOptions.length ? 0 : next
        })
      } else if (e.key === 'ArrowUp') {
        setFocusedIndex(prev => {
          const next = (prev === null ? sarthiOptions.length - 1 : prev - 1)
          return next < 0 ? sarthiOptions.length - 1 : next
        })
      } else if (e.key === 'Enter') {
        if (focusedIndex !== null) {
          openModal(sarthiOptions[focusedIndex].title)
        }
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [activeModal, focusedIndex, isMobileMenuOpen, isReportModalOpen])

  const handleDlSubmit = async (formData) => {
    try {
      const convertDateToISO = (dateStr) => {
        if (!dateStr) return null
        const [day, month, year] = dateStr.split('-')
        return `${year}-${month}-${day}`
      }

      const applicationData = {
        name: formData.name,
        dateOfBirth: convertDateToISO(formData.dateOfBirth),
        gender: formData.gender,
        fatherName: formData.fatherName,
        mobileNumber: formData.mobileNumber,
        email: formData.email,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        licenseClass: formData.licenseClass,
        licenseNumber: formData.licenseNumber,
        licenseIssueDate: formData.licenseIssueDate,
        licenseExpiryDate: formData.licenseExpiryDate,
        learningLicenseApplicationNumber: formData.learningLicenseApplicationNumber,
        learningLicenseNumber: formData.learningLicenseNumber,
        learningLicenseIssueDate: formData.learningLicenseIssueDate,
        learningLicenseExpiryDate: formData.learningLicenseExpiryDate,
        panNumber: formData.panNumber,
        emergencyContact: formData.emergencyContact,
        emergencyRelation: formData.emergencyRelation,
        totalAmount: parseFloat(formData.totalAmount) || 0,
        paidAmount: parseFloat(formData.paidAmount) || 0,
        balanceAmount: parseFloat(formData.balanceAmount) || 0,
        applicationStatus: 'pending',
        documents: formData.documents
      }

      const response = await axios.post(`${API_URL}/api/driving-licenses`, applicationData, { withCredentials: true })

      if (response.data.success) {
        toast.success('Application submitted successfully!', { autoClose: 700 })
        closeModal()
      }
    } catch (error) {
      console.error('Error submitting application:', error)
      toast.error('Failed to submit application. Please try again.', { autoClose: 700 })
    }
  }

  return (
    <>
      <nav className='sticky top-0 z-[60] border-b border-slate-200 bg-white px-4 py-2 shadow-sm'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className='lg:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-600'
              aria-label="Menu"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <div className='hidden lg:flex flex-wrap items-center gap-2 lg:gap-3 xl:gap-4 2xl:gap-5'>
              {quickButtons.map((button) => (
                <Link
                  key={button.title}
                  to={button.path}
                  className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${button.tone}`}
                >
                  {button.title}
                </Link>
              ))}
            </div>
          </div>
          
          <div className='lg:hidden flex items-center gap-2'>
             <button
                onClick={() => setIsReportModalOpen(true)}
                className='flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 transition-colors font-bold text-xs'
             >
                <FileText size={16} />
                Reports
             </button>
          </div>
        </div>
      </nav>

      {/* Report Modal */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
           <div className="w-full max-w-lg bg-white rounded-[2rem] shadow-2xl overflow-hidden relative transform transition-all animate-scaleIn">
              <div className="bg-slate-50 px-6 py-5 border-b border-slate-100 flex justify-between items-center">
                 <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-600 rounded-xl shadow-lg shadow-blue-600/20">
                       <FileText className="text-white" size={20} />
                    </div>
                    <h3 className="text-xl font-black text-slate-800 tracking-tight">System Reports</h3>
                 </div>
                 <button onClick={() => setIsReportModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-200 rounded-full transition-all">
                    <X size={20} />
                 </button>
              </div>
              <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[70vh] overflow-y-auto">
                 {quickButtons.map((button) => (
                    <Link
                       key={button.title}
                       to={button.path}
                       onClick={() => setIsReportModalOpen(false)}
                       className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all active:scale-95 group ${button.tone}`}
                    >
                       <div className="w-10 h-10 rounded-full bg-white/50 flex items-center justify-center mb-2 shadow-sm group-hover:scale-110 transition-transform">
                          <FileText size={18} />
                       </div>
                       <span className="text-[10px] font-bold uppercase tracking-wider text-center">{button.shortLabel}</span>
                    </Link>
                 ))}
              </div>
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 text-center">
                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">Generated by RTO Sarthi</p>
              </div>
           </div>
        </div>
      )}

      {/* Mobile Drawer Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[55] lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Drawer Content */}
      <aside className={`fixed top-0 left-0 h-full w-72 bg-slate-900 text-white z-[56] transition-transform duration-300 ease-in-out lg:hidden ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-white/10 flex justify-between items-center">
            <h2 className="font-bold text-lg">Sarthi Options</h2>
            <button onClick={() => setIsMobileMenuOpen(false)} className="p-1 hover:bg-white/10 rounded-lg">
              <X size={20} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {sarthiOptions.map((option, index) => (
              <button
                key={option.title}
                onClick={() => openModal(option.title)}
                className="w-full group relative overflow-hidden rounded-xl bg-white/5 hover:bg-white/10 transition-all border border-white/5 p-4 text-left"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${option.bgGradient} shadow-lg transition-transform group-active:scale-95`}>
                    {option.icon}
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{option.title}</div>
                    <div className="text-[10px] text-slate-400">{option.note}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
          <div className="p-6 border-t border-white/10 bg-slate-950/50">
             <p className="text-[10px] text-slate-500 uppercase tracking-widest text-center">RTO Sarthi Management</p>
          </div>
        </div>
      </aside>

      <div className='min-h-screen bg-slate-100 px-0.5 pb-8 pt-4 sm:px-4 lg:px-6 lg:pt-5'>
        <div className='flex w-full flex-col gap-6 lg:flex-row'>
          <aside className='hidden lg:block lg:fixed lg:left-0 lg:top-[4.75rem] lg:h-[calc(100vh-4.75rem)] lg:w-60 xl:w-64 2xl:w-[19rem] lg:overflow-y-auto'>
            <div className='overflow-hidden rounded-[28px] bg-slate-900 text-white shadow-2xl'>
              {/* Keyboard hint bar */}
              <div className='px-4 pt-3 pb-1 flex items-center gap-2 border-b border-white/10'>
                <span className='text-[10px] text-slate-400 font-medium tracking-wide flex items-center gap-1'>
                  <kbd className='bg-white/10 text-slate-300 px-1 py-0.5 rounded text-[10px] font-mono'>↑↓</kbd>
                  Navigate
                  <kbd className='bg-white/10 text-slate-300 px-1.5 py-0.5 rounded text-[10px] font-mono ml-1'>↵</kbd>
                  Open
                </span>
                {focusedIndex !== null && (
                  <span className='ml-auto text-[10px] font-semibold text-amber-300 bg-amber-900/40 px-2 py-0.5 rounded-full truncate max-w-[100px]'>
                    {sarthiOptions[focusedIndex]?.title}
                  </span>
                )}
              </div>
              <div className='space-y-3 p-5'>
                {sarthiOptions.map((option, index) => {
                  const isFocused = focusedIndex === index
                  return (
                    <button
                      key={option.title}
                      type='button'
                      onClick={() => { setFocusedIndex(index); openModal(option.title) }}
                      onMouseEnter={() => setFocusedIndex(index)}
                      className={`group relative block w-full overflow-hidden rounded-2xl border transition-all duration-300 ${
                        isFocused 
                        ? 'border-amber-400 bg-amber-500/20 shadow-lg shadow-amber-500/20 scale-[1.02]' 
                        : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10 hover:shadow-xl'
                      } p-3 text-left`}
                    >
                      <div className='absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 opacity-0 transition-opacity duration-500 group-hover:opacity-100' />
                      <div className='relative flex items-center gap-3'>
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl md:rounded-lg ${option.bgGradient} shadow-md ${option.shadow} transition-transform duration-300 ${isFocused ? 'scale-110 rotate-3' : 'group-hover:scale-110 group-hover:rotate-3'}`}>
                          {option.icon}
                        </div>
                        <div className='min-w-0 flex-1'>
                          <h2 className={`text-[13.5px] sm:text-sm font-bold tracking-wide ${isFocused ? 'text-amber-300' : 'text-white'}`}>{option.title}</h2>
                          <p className={`mt-0.5 text-[10.5px] sm:text-[11px] font-medium line-clamp-1 transition-colors ${isFocused ? 'text-slate-300' : 'text-slate-400 group-hover:text-slate-300'}`}>{option.note}</p>
                        </div>
                        <div className={`shrink-0 transition-all duration-300 ${isFocused ? 'text-white translate-x-1' : 'text-slate-500 group-hover:text-white group-hover:translate-x-1'}`}>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </aside>

          <main className='flex-1 lg:ml-60 xl:ml-64 2xl:ml-[19rem]'>
            <div className='bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-200 min-h-[calc(100vh-6rem)]'>
              <div className="flex items-center px-4 py-2.5 sm:px-5 sm:py-3 border-b border-gray-100">
                <button
                  onClick={() => navigate('/')}
                  className='flex items-center justify-center w-10 h-10 rounded-xl bg-white border border-gray-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer flex-shrink-0'
                  title='Back to Home'
                >
                  <svg className='w-5 h-5 text-gray-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M10 19l-7-7m0 0l7-7m-7 7h18' />
                  </svg>
                </button>
                <span className="ml-3 text-sm font-semibold text-gray-500">Dashboard</span>
              </div>
              <SarthiDashboard refreshKey={dashboardRefreshKey} />
            </div>
          </main>
        </div>
      </div>

      {activeModal === 'Add DL' && (
        <QuickDLApplicationForm
          isOpen={true}
          onClose={closeModal}
          onSubmit={handleDlSubmit}
        />
      )}

      {activeModal === 'Vehicle Transfer' && (
        <AddVehicleTransferModal
          isOpen={true}
          onClose={closeModal}
          onSuccess={handleVehicleTransferSuccess}
        />
      )}

      {activeModal === 'NOC Issued' && (
        <AddNocModal
          isOpen={true}
          onClose={closeModal}
          onSuccess={closeModal}
        />
      )}

      {activeModal === 'RC Renewal' && (
        <AddRegistrationRenewalModal
          isOpen={true}
          onClose={closeModal}
          onSuccess={closeModal}
        />
      )}

      {activeModal === 'HPA+HPT' && (
        <AddHpaHptModal
          isOpen={true}
          onClose={closeModal}
          onSubmit={closeModal}
        />
      )}
    </>
  )
}

export default Sarthi

