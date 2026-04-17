import { useState } from 'react'
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

const vahanOptions = [
  { title: 'Manage Vehicle', path: '/vehicle-registration', note: 'Vehicle registration and master details', image: '/buttons/add vehicle.png', category: 'vehicle', badgeTone: 'bg-sky-100 text-sky-700' },
  { title: 'Add Permit', path: '/national-permit', note: 'National, state, and temporary permits', image: '/buttons/add permit.png', category: 'permit', badgeTone: 'bg-emerald-100 text-emerald-700' },
  { title: 'Add Tax', path: '/tax', note: 'Tax records and renewals', image: '/buttons/add tax.png', category: 'compliance', badgeTone: 'bg-violet-100 text-violet-700' },
  { title: 'Add Fitness', path: '/fitness', note: 'Fitness certificate work', image: '/buttons/add fitness.png', category: 'compliance', badgeTone: 'bg-violet-100 text-violet-700' },
  { title: 'PUC', path: '/puc', note: 'Pollution certificate records', image: '/buttons/add puc.png', category: 'compliance', badgeTone: 'bg-violet-100 text-violet-700' },
  { title: 'Add GPS', path: '/gps', note: 'GPS device and renewal work', image: '/buttons/add gps.png', category: 'compliance', badgeTone: 'bg-violet-100 text-violet-700' },
  { title: 'Money Received', path: '/parties', note: 'Party-wise money received entries', image: '/buttons/money received.png', category: 'billing', badgeTone: 'bg-amber-100 text-amber-700' },
  { title: 'Insurance', path: '/insurance', note: 'Insurance details and renewals', image: '/buttons/addinsurance.png', category: 'billing', badgeTone: 'bg-amber-100 text-amber-700' },
  { title: 'Bill', path: '/dealer-bill', note: 'Billing and dealer bills', image: '/buttons/add bill.png', category: 'billing', badgeTone: 'bg-amber-100 text-amber-700' }
]

const quickButtons = [
  { title: 'Party', shortLabel: 'Party', tone: 'border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100', path: '/parties' },
  { title: 'Manage Vehicle', shortLabel: 'Vehicle', tone: 'border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100' },
  { title: 'Add NP', shortLabel: 'NP', tone: 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100', path: '/national-permit' },
  { title: 'Add CG Permit', shortLabel: 'State Permit', tone: 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100', path: '/cg-permit' },
  { title: 'Add Temp Permit', shortLabel: 'Temp Permit', tone: 'border-teal-200 bg-teal-50 text-teal-700 hover:bg-teal-100', path: '/temporary-permit' },
  { title: 'Add Temp Other State', shortLabel: 'Temp Other State', tone: 'border-lime-200 bg-lime-50 text-lime-700 hover:bg-lime-100', path: '/temporary-permit-other-state' },
  { title: 'Insurance', shortLabel: 'Insurance', tone: 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100' },
  { title: 'Add Fitness', shortLabel: 'Fitness', tone: 'border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100' },
  { title: 'Add Tax', shortLabel: 'Tax', tone: 'border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700 hover:bg-fuchsia-100' },
  { title: 'PUC', shortLabel: 'PUC', tone: 'border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100' },
  { title: 'Add GPS', shortLabel: 'GPS', tone: 'border-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-cyan-100' },
  { title: 'Bill', shortLabel: 'Bill', tone: 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100', path: '/dealer-bill' },
  { title: 'Day Book', shortLabel: 'Day Book', tone: 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100', path: '/day-book' }
]

const actionNavbarButtons = []

const Vahan = () => {
  const [activeModal, setActiveModal] = useState(null)

  const openModal = (title) => setActiveModal(title)
  const closeModal = () => setActiveModal(null)

  return (
    <>
      <nav className='sticky top-0 z-50 border-b border-slate-200 bg-white px-4 py-2 shadow-sm'>
        <div className='flex flex-wrap items-center gap-2 lg:gap-3 xl:gap-4 2xl:gap-5'>
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
      </nav>

      <div className='min-h-screen bg-slate-100 px-4 pb-8 pt-4 lg:px-6 lg:pt-5'>
        <div className='flex w-full flex-col gap-6 lg:flex-row'>
          <aside className='lg:fixed lg:left-0 lg:top-[4.75rem] lg:h-[calc(100vh-4.75rem)] lg:w-60 xl:w-64 2xl:w-[19rem] lg:overflow-y-auto'>
            <div className='overflow-hidden rounded-[28px] bg-slate-900 text-white shadow-2xl'>
              <div className='space-y-2 p-4'>
                {vahanOptions.map((option, index) => (
                  <button
                    key={option.title}
                    type='button'
                    onClick={() => openModal(option.title)}
                    className={
                      option.image
                        ? 'block w-full transition duration-200 hover:opacity-95'
                        : 'block w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left transition duration-200 hover:bg-white/10 hover:shadow-lg'
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
                        <span className='mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-cyan-200'>
                          {index + 1}
                        </span>
                        <div>
                          <h2 className='text-sm font-bold text-white'>{option.title}</h2>
                          <p className='mt-1 text-xs leading-5 text-slate-300'>{option.note}</p>
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          <main className='flex-1 lg:ml-60 xl:ml-64 2xl:ml-[19rem]'>
            <div className='bg-white rounded-2xl shadow-lg border border-gray-200 min-h-[calc(100vh-6rem)]'>
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden p-6 relative">
             <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
             >
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
               </svg>
             </button>
             <h3 className="text-xl font-bold text-slate-800 mb-4 text-center">Select Permit Type</h3>
             <div className="space-y-3">
               <button
                 onClick={() => openModal('Add NP')}
                 className="w-full py-3 px-4 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-xl font-semibold transition"
               >
                 Add National Permit
               </button>
               <button
                 onClick={() => openModal('Add CG Permit')}
                 className="w-full py-3 px-4 bg-green-50 hover:bg-green-100 border border-green-200 text-green-700 rounded-xl font-semibold transition"
               >
                 Add State Permit
               </button>
               <button
                 onClick={() => openModal('Issue Temp Permit')}
                 className="w-full py-3 px-4 bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-700 rounded-xl font-semibold transition"
               >
                 Add Temporary Permit
               </button>
               <button
                 onClick={() => openModal('Issue Temp Permit Other State')}
                 className="w-full py-3 px-4 bg-lime-50 hover:bg-lime-100 border border-lime-200 text-lime-700 rounded-xl font-semibold transition"
               >
                 Add Temporary Permit Other State
               </button>
             </div>
          </div>
        </div>
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

      {activeModal === 'Add CG Permit' && (
        <IssueCgPermitModal
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
