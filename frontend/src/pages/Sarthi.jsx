import { useState } from 'react'
import { Link } from 'react-router-dom'
import QuickDLApplicationForm from './DrivingLicence/components/QuickDLApplicationForm'
import AddVehicleTransferModal from './VehicleTransfer/components/AddVehicleTransferModal'
import AddNocModal from './Noc/components/AddNocModal'
import AddRegistrationRenewalModal from './RegistrationRenewal/components/AddRegistrationRenewalModal'
import SarthiDashboard from './Sarthi/components/SarthiDashboard'

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
  }
]

const quickButtons = [
  { title: 'DL List', path: '/driving', tone: 'border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100' },
  { title: 'Transfer List', path: '/vehicle-transfer', tone: 'border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100' },
  { title: 'NOC List', path: '/noc', tone: 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100' },
  { title: 'Renewal List', path: '/registration-renewal', tone: 'border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100' }
]

const Sarthi = () => {
  const [activeModal, setActiveModal] = useState(null)

  const openModal = (title) => setActiveModal(title)
  const closeModal = () => setActiveModal(null)

  return (
    <>
      <nav className='sticky top-0 z-50 border-b border-slate-200 bg-white px-4 py-2 shadow-sm'>
        <div className='flex flex-wrap items-center gap-2 lg:gap-3 xl:gap-4 2xl:gap-5'>
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
      </nav>

      <div className='min-h-screen bg-slate-100 px-4 pb-8 pt-4 lg:px-6 lg:pt-5'>
        <div className='flex w-full flex-col gap-6 lg:flex-row'>
          <aside className='lg:fixed lg:left-0 lg:top-[4.75rem] lg:h-[calc(100vh-4.75rem)] lg:w-60 xl:w-64 2xl:w-[19rem] lg:overflow-y-auto'>
            <div className='overflow-hidden rounded-[28px] bg-slate-900 text-white shadow-2xl'>
              <div className='space-y-3 p-5'>
                {sarthiOptions.map((option, index) => (
                  <button
                    key={option.title}
                    type='button'
                    onClick={() => openModal(option.title)}
                    className='group relative block w-full overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-3 text-left transition-all duration-300 hover:border-white/20 hover:bg-white/10 hover:-translate-y-0.5 hover:shadow-xl'
                  >
                    <div className='absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 opacity-0 transition-opacity duration-500 group-hover:opacity-100' />
                    <div className='relative flex items-center gap-3'>
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl md:rounded-lg ${option.bgGradient} shadow-md ${option.shadow} transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                        {option.icon}
                      </div>
                      <div className='min-w-0 flex-1'>
                        <h2 className='text-[13.5px] sm:text-sm font-bold text-white tracking-wide'>{option.title}</h2>
                        <p className='mt-0.5 text-[10.5px] sm:text-[11px] font-medium text-slate-400 line-clamp-1 group-hover:text-slate-300 transition-colors'>{option.note}</p>
                      </div>
                      <div className="shrink-0 text-slate-500 transition-all duration-300 group-hover:text-white group-hover:translate-x-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </aside>

          <main className='flex-1 lg:ml-60 xl:ml-64 2xl:ml-[19rem]'>
            <div className='bg-white rounded-2xl shadow-lg border border-gray-200 min-h-[calc(100vh-6rem)]'>
              <SarthiDashboard />
            </div>
          </main>
        </div>
      </div>

      {activeModal === 'Add DL' && (
        <QuickDLApplicationForm
          isOpen={true}
          onClose={closeModal}
          onSubmit={closeModal}
        />
      )}

      {activeModal === 'Vehicle Transfer' && (
        <AddVehicleTransferModal
          isOpen={true}
          onClose={closeModal}
          onSuccess={closeModal}
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
    </>
  )
}

export default Sarthi
