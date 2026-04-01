import { Link } from 'react-router-dom'

const vahanOptions = [
  { title: 'Manage Vehicle', path: '/vehicle-registration', note: 'Vehicle registration and record handling', image: '/buttons/add vehicle.png', category: 'vehicle', badgeTone: 'bg-sky-100 text-sky-700' },
  { title: 'Add NP', path: '/national-permit', note: 'National permit work', image: '/buttons/add national permit.png', category: 'permit', badgeTone: 'bg-emerald-100 text-emerald-700' },
  { title: 'Add CG Permit', path: '/cg-permit', note: 'CG state permit entries', image: '/buttons/add statepermit.png', category: 'permit', badgeTone: 'bg-emerald-100 text-emerald-700' },
  { title: 'Add Temp Permit', path: '/temporary-permit', note: 'Temporary permit requests', image: '/buttons/add temporary permit.png', category: 'permit', badgeTone: 'bg-emerald-100 text-emerald-700' },
  { title: 'Add Temp Other State', path: '/temporary-permit-other-state', note: 'Temporary permit requests for other states', image: '/buttons/add temp other state.png', category: 'permit', badgeTone: 'bg-emerald-100 text-emerald-700' },
  { title: 'Add Fitness', path: '/fitness', note: 'Fitness certificate work', image: '/buttons/add fitness.png', category: 'compliance', badgeTone: 'bg-violet-100 text-violet-700' },
  { title: 'Add Tax', path: '/tax', note: 'Tax records and renewals', image: '/buttons/add tax.png', category: 'compliance', badgeTone: 'bg-violet-100 text-violet-700' },
  { title: 'PUC', path: '/puc', note: 'Pollution certificate records', image: '/buttons/add puc.png', category: 'compliance', badgeTone: 'bg-violet-100 text-violet-700' },
  { title: 'Add GPS', path: '/gps', note: 'GPS device and renewal work', image: '/buttons/add gps.png', category: 'compliance', badgeTone: 'bg-violet-100 text-violet-700' },
  { title: 'Insurance', path: '/insurance', note: 'Insurance details and renewals', image: '/buttons/addinsurance.png', category: 'billing', badgeTone: 'bg-amber-100 text-amber-700' },
  { title: 'Bill', path: '/dealer-bill', note: 'Billing and dealer bills', image: '/buttons/add bill.png', category: 'billing', badgeTone: 'bg-amber-100 text-amber-700' }
]

const quickButtons = [
  { title: 'Manage Vehicle', shortLabel: 'Vehicle', tone: 'border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100' },
  { title: 'Add NP', shortLabel: 'NP', tone: 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100' },
  { title: 'Add CG Permit', shortLabel: 'State Permit', tone: 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100' },
  { title: 'Add Temp Permit', shortLabel: 'Temp Permit', tone: 'border-teal-200 bg-teal-50 text-teal-700 hover:bg-teal-100' },
  { title: 'Add Temp Other State', shortLabel: 'Temp Other State', tone: 'border-lime-200 bg-lime-50 text-lime-700 hover:bg-lime-100' },
  { title: 'Insurance', shortLabel: 'Insurance', tone: 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100' },
  { title: 'Add Fitness', shortLabel: 'Fitness', tone: 'border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100' },
  { title: 'Add Tax', shortLabel: 'Tax', tone: 'border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700 hover:bg-fuchsia-100' },
  { title: 'PUC', shortLabel: 'PUC', tone: 'border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100' },
  { title: 'Add GPS', shortLabel: 'GPS', tone: 'border-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-cyan-100' },
  { title: 'Bill', shortLabel: 'Bill', tone: 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100' },
  { title: 'Day Book', shortLabel: 'Day Book', tone: 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100', path: '/day-book' },
  { title: 'Party Ledger', shortLabel: 'Party Ledger', tone: 'border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100', path: '/parties' }
]

const Vahan = () => {
  return (
    <div className='min-h-screen bg-slate-100 pt-4 lg:pt-6'>
      <div className='flex w-full flex-col gap-6 px-4 pb-8 lg:flex-row lg:px-6'>
        <aside className='lg:fixed lg:left-6 lg:top-6 lg:h-[calc(100vh-3rem)] lg:w-80 lg:overflow-y-auto'>
          <div className='overflow-hidden rounded-[28px] bg-slate-900 text-white shadow-2xl'>
            <div className='space-y-2 p-4'>
              {vahanOptions.map((option, index) => (
                <Link
                  key={option.title}
                  to={option.path}
                  className={
                    option.image
                      ? 'block transition duration-200 hover:opacity-95'
                      : 'block rounded-2xl border border-white/10 bg-white/5 px-4 py-3 transition duration-200 hover:bg-white/10 hover:shadow-lg'
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
                </Link>
              ))}
            </div>
          </div>
        </aside>

        <section className='lg:ml-[21rem] lg:flex-1'>
          <div className='w-full rounded-[28px] border border-slate-200/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(241,245,249,0.96))] shadow-[0_28px_70px_rgba(15,23,42,0.18)]'>
            <div className='space-y-5 p-5 sm:p-6'>
              <div className='rounded-[24px] border border-slate-200 bg-white p-4 sm:p-5'>
                <p className='text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500'>Quick Access</p>
                <div className='mt-3 flex flex-wrap gap-2'>
                  {quickButtons.map((button) => {
                    const option = vahanOptions.find((item) => item.title === button.title)
                    const targetPath = button.path || option?.path

                    if (!targetPath) return null

                    return (
                      <Link
                        key={button.title}
                        to={targetPath}
                        className={`inline-flex items-center justify-center rounded-lg border px-3 py-2 text-[11px] font-semibold transition sm:text-xs ${button.tone}`}
                      >
                        {button.shortLabel}
                      </Link>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default Vahan
