import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import RegisterVehicleModal from './VehicleRegistration/components/RegisterVehicleModal'
import IssueNewPermitModal from './NationalPermit/components/IssueNewPermitModal'
import IssueCgPermitModal from './CgPermit/components/IssueCgPermitModal'
import IssueTemporaryPermitModal from './TemporaryPermit/components/IssueTemporaryPermitModal'
import IssueTemporaryPermitOtherStateModal from './TemporaryPermitOtherState/components/IssueTemporaryPermitOtherStateModal'
import AddFitnessModal from './Fitness/components/AddFitnessModal'
import AddTaxModal from './Tax/components/AddTaxModal'
import AddPucModal from './Puc/components/AddPucModal'
import AddGpsModal from './Gps/components/AddGpsModal'
import AddInsuranceModal from './Insurance/components/AddInsuranceModal'
import AddDealerBillModal from '../components/AddDealerBillModal'
import AddMoneyReceivedModal from './Party/components/AddMoneyReceivedModal'
import VahanDashboard from './Vahan/components/VahanDashboard'
import { Menu, X, FileText } from 'lucide-react'
import IssueBusPermitModal from './BusPermit/components/IssueBusPermitModal'

const vahanOptions = [
  { title: 'Manage Vehicle', path: '/vehicle-registration', note: 'Vehicle registration and master details', image: '/buttons/add vehicle.png', category: 'vehicle', badgeTone: 'bg-sky-100 text-sky-700' },
  { title: 'Add Permit', path: '/national-permit', note: 'National, state, and temporary permits', image: '/buttons/add permit.png', category: 'permit', badgeTone: 'bg-emerald-100 text-emerald-700' },
  { title: 'Add Tax', path: '/tax', note: 'Tax records and renewals', image: '/buttons/add tax.png', category: 'compliance', badgeTone: 'bg-violet-100 text-violet-700' },
  { title: 'Add Fitness', path: '/fitness', note: 'Fitness certificate work', image: '/buttons/add fitness.png', category: 'compliance', badgeTone: 'bg-violet-100 text-violet-700' },
  { title: 'PUC', path: '/puc', note: 'Pollution certificate records', image: '/buttons/add puc.png', category: 'compliance', badgeTone: 'bg-violet-100 text-violet-700' },
  { title: 'Add GPS', path: '/gps', note: 'GPS device and renewal work', image: '/buttons/add gps.png', category: 'compliance', badgeTone: 'bg-violet-100 text-violet-700' },
  { title: 'Money Received', path: '/party', note: 'Party-wise money received entries', image: '/buttons/money received.png', category: 'billing', badgeTone: 'bg-amber-100 text-amber-700' },
  { title: 'Insurance', path: '/insurance', note: 'Insurance details and renewals', image: '/buttons/addinsurance.png', category: 'billing', badgeTone: 'bg-amber-100 text-amber-700' },
  { title: 'Bill', path: '/dealer-bill', note: 'Billing and dealer bills', image: '/buttons/add bill.png', category: 'billing', badgeTone: 'bg-amber-100 text-amber-700' }
]

const quickButtons = [
  { title: 'Party', shortLabel: 'Party', tone: 'border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100', path: '/party' },
  { title: 'Manage Vehicle', shortLabel: 'Vehicle', tone: 'border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100' },
  { title: 'Add NP', shortLabel: 'NP', tone: 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100', path: '/national-permit' },
  { title: 'Add CG Permit', shortLabel: 'State Permit', tone: 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100', path: '/cg-permit' },
  { title: 'Add Bus Permit', shortLabel: 'Bus Permit', tone: 'border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100', path: '/bus-permit' },
  { title: 'Add Temp Permit', shortLabel: 'Temp Permit', tone: 'border-teal-200 bg-teal-50 text-teal-700 hover:bg-teal-100', path: '/temporary-permit' },
  { title: 'Add Temp Other State', shortLabel: 'Temp Other State', tone: 'border-lime-200 bg-lime-50 text-lime-700 hover:bg-lime-100', path: '/temporary-permit-other-state' },
  { title: 'Insurance', shortLabel: 'Insurance', tone: 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100' },
  { title: 'Add Fitness', shortLabel: 'Fitness', tone: 'border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100' },
  { title: 'Add Tax', shortLabel: 'Tax', tone: 'border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700 hover:bg-fuchsia-100' },
  { title: 'PUC', shortLabel: 'PUC', tone: 'border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100' },
  { title: 'Add GPS', shortLabel: 'GPS', tone: 'border-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-cyan-100' },
  { title: 'Bill', shortLabel: 'Bill', tone: 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100', path: '/dealer-bill' }
]

const actionNavbarButtons = []

const PermitTypeSelectModal = ({ onClose, openModal }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const options = [
    { id: 'Add NP', label: 'Add National Permit', icon: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z', colorClass: 'text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100 ring-emerald-400' },
    { id: 'Add CG Permit', label: 'Add State Permit', icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z', colorClass: 'text-green-700 bg-green-50 border-green-200 hover:bg-green-100 ring-green-400' },
    { id: 'Add Bus Permit', label: 'Add Bus Permit', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', colorClass: 'text-orange-700 bg-orange-50 border-orange-200 hover:bg-orange-100 ring-orange-400' },
    { id: 'Issue Temp Permit', label: 'Add Temporary Permit', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', colorClass: 'text-teal-700 bg-teal-50 border-teal-200 hover:bg-teal-100 ring-teal-400' },
    { id: 'Issue Temp Permit Other State', label: 'Add Temporary Permit Other State', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', colorClass: 'text-lime-700 bg-lime-50 border-lime-200 hover:bg-lime-100 ring-lime-400' }
  ];

  /* global document */
  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev < options.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : options.length - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        openModal(options[selectedIndex].id);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, onClose, openModal]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden relative transform transition-all scale-100">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-xl font-bold text-slate-800">Select Permit Type</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-200 p-1.5 rounded-full transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6 space-y-3">
          {options.map((opt, idx) => {
            const isSelected = selectedIndex === idx;
            return (
              <button
                key={opt.id}
                onClick={() => openModal(opt.id)}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={`w-full flex items-center text-left py-3 px-4 border rounded-xl font-semibold transition-all duration-200 ${opt.colorClass} ${
                  isSelected ? 'ring-2 ring-offset-2 scale-[1.02] shadow-md' : 'shadow-sm opacity-90'
                }`}
              >
                <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-white/60 mr-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={opt.icon} />
                  </svg>
                </span>
                {opt.label}
              </button>
            );
          })}
          <div className="text-center mt-4 pt-2 text-xs text-slate-400 flex justify-center gap-4">
            <span>Use <kbd className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 shadow-sm text-slate-500 mx-1">↑</kbd> <kbd className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 shadow-sm text-slate-500 mx-1">↓</kbd> to navigate</span>
            <span><kbd className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 shadow-sm text-slate-500 mr-1">Enter</kbd> to select</span>
            <span><kbd className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 shadow-sm text-slate-500 mr-1">Esc</kbd> to close</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const Vahan = () => {
  const [activeModal, setActiveModal] = useState(null)
  const [focusedIndex, setFocusedIndex] = useState(0)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)

  const openModal = (title) => {
    setActiveModal(title)
    setIsMobileMenuOpen(false)
    setIsReportModalOpen(false)
  }
  const closeModal = () => {
    setActiveModal(null)
    setFocusedIndex(prev => prev ?? 0)
  }

  // Global arrow-key navigation for sidebar — disabled while a modal is open
  useEffect(() => {
    if (activeModal || isMobileMenuOpen || isReportModalOpen) return
    const handleKeyDown = (e) => {
      if (['ArrowDown', 'ArrowUp', 'Enter'].includes(e.key)) {
        e.preventDefault()
      }
      if (e.key === 'ArrowDown') {
        setFocusedIndex(prev => {
          const next = (prev === null ? 0 : prev + 1)
          return next >= vahanOptions.length ? 0 : next
        })
      } else if (e.key === 'ArrowUp') {
        setFocusedIndex(prev => {
          const next = (prev === null ? vahanOptions.length - 1 : prev - 1)
          return next < 0 ? vahanOptions.length - 1 : next
        })
      } else if (e.key === 'Enter') {
        if (focusedIndex !== null) {
          openModal(vahanOptions[focusedIndex].title)
        }
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [activeModal, focusedIndex, isMobileMenuOpen])

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
              {quickButtons.map((button) => {
                const option = vahanOptions.find((item) => item.title === button.title)
                const targetPath = button.path || option?.path

                if (!targetPath) {
                  return (
                    <button
                      key={button.title}
                      onClick={() => openModal(button.title)}
                      className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${button.tone}`}
                    >
                      {button.shortLabel}
                    </button>
                  )
                }

                return (
                  <Link
                    key={button.title}
                    to={targetPath}
                    className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${button.tone}`}
                  >
                    {button.shortLabel}
                  </Link>
                )
              })}
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
                 {quickButtons.map((button) => {
                    const option = vahanOptions.find((item) => item.title === button.title)
                    const targetPath = button.path || option?.path

                    if (!targetPath) {
                       return (
                          <button
                             key={button.title}
                             onClick={() => openModal(button.title)}
                             className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all active:scale-95 group ${button.tone}`}
                          >
                             <div className="w-10 h-10 rounded-full bg-white/50 flex items-center justify-center mb-2 shadow-sm group-hover:scale-110 transition-transform">
                                <FileText size={18} />
                             </div>
                             <span className="text-[10px] font-bold uppercase tracking-wider text-center">{button.shortLabel}</span>
                          </button>
                       )
                    }

                    return (
                       <Link
                          key={button.title}
                          to={targetPath}
                          onClick={() => setIsReportModalOpen(false)}
                          className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all active:scale-95 group ${button.tone}`}
                       >
                          <div className="w-10 h-10 rounded-full bg-white/50 flex items-center justify-center mb-2 shadow-sm group-hover:scale-110 transition-transform">
                             <FileText size={18} />
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-center">{button.shortLabel}</span>
                       </Link>
                    )
                 })}
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
            <h2 className="font-bold text-lg">Vahan Options</h2>
            <button onClick={() => setIsMobileMenuOpen(false)} className="p-1 hover:bg-white/10 rounded-lg">
              <X size={20} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {vahanOptions.map((option, index) => (
              <button
                key={option.title}
                onClick={() => openModal(option.title)}
                className="w-full group relative overflow-hidden rounded-xl bg-white/5 hover:bg-white/10 transition-all border border-white/5 text-left"
              >
                {option.image ? (
                  <img
                    src={option.image}
                    alt={option.title}
                    className="w-full h-auto object-contain opacity-90 group-hover:opacity-100 transition-opacity"
                  />
                ) : (
                  <div className="p-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-amber-400/20 text-amber-400 flex items-center justify-center font-bold text-xs">
                      {index + 1}
                    </div>
                    <div>
                      <div className="text-sm font-semibold">{option.title}</div>
                      <div className="text-[10px] text-slate-400">{option.note}</div>
                    </div>
                  </div>
                )}
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
                    {vahanOptions[focusedIndex]?.title}
                  </span>
                )}
              </div>
              <div className='space-y-2 p-4'>
                {vahanOptions.map((option, index) => {
                  const isFocused = focusedIndex === index
                  return (
                    <button
                      key={option.title}
                      type='button'
                      onClick={() => { setFocusedIndex(index); openModal(option.title) }}
                      onMouseEnter={() => setFocusedIndex(index)}
                      className={
                        option.image
                          ? `block w-full transition duration-200 rounded-xl ${
                              isFocused
                                ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-slate-900 opacity-100 scale-[1.02] shadow-lg shadow-amber-500/30'
                                : 'hover:opacity-95'
                            }`
                          : `block w-full rounded-2xl border px-4 py-3 text-left transition duration-200 ${
                              isFocused
                                ? 'border-amber-400 bg-amber-500/20 shadow-lg shadow-amber-500/20 scale-[1.02]'
                                : 'border-white/10 bg-white/5 hover:bg-white/10 hover:shadow-lg'
                            }`
                      }
                    >
                      {option.image ? (
                        <img
                          src={option.image}
                          alt={option.title}
                          className='mx-auto h-auto w-[92%] object-contain'
                        />
                      ) : (
                        <div className='flex items-start gap-3'>
                          <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                            isFocused ? 'bg-amber-400 text-slate-900' : 'bg-white/10 text-amber-200'
                          }`}>
                            {index + 1}
                          </span>
                          <div>
                            <h2 className={`text-sm font-bold ${isFocused ? 'text-amber-300' : 'text-white'}`}>{option.title}</h2>
                            <p className='mt-1 text-xs leading-5 text-slate-300'>{option.note}</p>
                          </div>
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          </aside>

          <main id='vahan-dashboard' className='flex-1 lg:ml-60 xl:ml-64 2xl:ml-[19rem]'>
            <div className='bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-200 min-h-[calc(100vh-6rem)]'>
              <VahanDashboard />
            </div>
          </main>
        </div>
      </div>

      {activeModal === 'Manage Vehicle' && (
        <RegisterVehicleModal
          isOpen={true}
          onClose={closeModal}
          onSuccess={closeModal}
          editData={null}
        />
      )}

      {activeModal === 'Add Permit' && (
        <PermitTypeSelectModal onClose={closeModal} openModal={openModal} />
      )}

      {activeModal === 'Money Received' && (
        <AddMoneyReceivedModal
          isOpen={true}
          onClose={closeModal}
          onSuccess={closeModal}
        />
      )}

      {activeModal === 'Add NP' && (
        <IssueNewPermitModal
          isOpen={true}
          onClose={closeModal}
          onSubmit={closeModal}
        />
      )}

      { activeModal === 'Add CG Permit' && (
        <IssueCgPermitModal
          isOpen={true}
          onClose={closeModal}
          onSubmit={closeModal}
        />
      )}

      { activeModal === 'Add Bus Permit' && (
        <IssueBusPermitModal
          isOpen={true}
          onClose={closeModal}
          onSubmit={closeModal}
        />
      )}


      {activeModal === 'Issue Temp Permit' && (
        <IssueTemporaryPermitModal
          isOpen={true}
          onClose={closeModal}
          onSubmit={closeModal}
        />
      )}

      {activeModal === 'Issue Temp Permit Other State' && (
        <IssueTemporaryPermitOtherStateModal
          onClose={closeModal}
          onPermitIssued={closeModal}
        />
      )}

      {activeModal === 'Add Fitness' && (
        <AddFitnessModal
          isOpen={true}
          onClose={closeModal}
          onSubmit={closeModal}
        />
      )}

      {activeModal === 'Add Tax' && (
        <AddTaxModal
          isOpen={true}
          onClose={closeModal}
          onSubmit={closeModal}
        />
      )}

      {activeModal === 'PUC' && (
        <AddPucModal
          isOpen={true}
          onClose={closeModal}
          onSubmit={closeModal}
        />
      )}

      {activeModal === 'Add GPS' && (
        <AddGpsModal
          isOpen={true}
          onClose={closeModal}
          onSubmit={closeModal}
        />
      )}

      {activeModal === 'Insurance' && (
        <AddInsuranceModal
          isOpen={true}
          onClose={closeModal}
          onSubmit={closeModal}
        />
      )}

      {activeModal === 'Bill' && (
        <AddDealerBillModal
          isOpen={true}
          onClose={closeModal}
          onSuccess={closeModal}
        />
      )}
    </>
  )
}

export default Vahan
