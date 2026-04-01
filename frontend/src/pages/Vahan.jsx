import { Link } from 'react-router-dom'

const vahanOptions = [
  { title: 'Manage Vehicle', path: '/vehicle-registration', note: 'Vehicle registration and record handling', image: '/buttons/add vehicle.png' },
  { title: 'Add NP', path: '/national-permit', note: 'National permit work', image: '/buttons/add national permit.png' },
  { title: 'Add CG Permit', path: '/cg-permit', note: 'CG state permit entries', image: '/buttons/add statepermit.png' },
  { title: 'Add Temp Permit', path: '/temporary-permit', note: 'Temporary permit requests', image: '/buttons/add temporary permit.png' },
  { title: 'Add Temp Other State', path: '/temporary-permit-other-state', note: 'Temporary permit requests for other states', image: '/buttons/add temp other state.png' },
  { title: 'Add Fitness', path: '/fitness', note: 'Fitness certificate work', image: '/buttons/add fitness.png' },
  { title: 'Add Tax', path: '/tax', note: 'Tax records and renewals', image: '/buttons/add tax.png' },
  { title: 'PUC', path: '/puc', note: 'Pollution certificate records', image: '/buttons/add puc.png' },
  { title: 'Add GPS', path: '/gps', note: 'GPS device and renewal work', image: '/buttons/add gps.png' },
  { title: 'Insurance', path: '/insurance', note: 'Insurance details and renewals', image: '/buttons/addinsurance.png' },
  { title: 'Bill', path: '/dealer-bill', note: 'Billing and dealer bills', image: '/buttons/add bill.png' }
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
          <div className='rounded-[32px] bg-white p-5 shadow-xl ring-1 ring-slate-200 sm:p-8'>
            <div className='rounded-[28px] bg-gradient-to-br from-sky-50 via-white to-teal-50 p-6 ring-1 ring-sky-100'>
              <p className='text-sm font-bold uppercase tracking-[0.35em] text-sky-700'>
                Dashboard
              </p>
              <h2 className='mt-3 text-3xl font-black text-slate-900'>
                Vahan related work list
              </h2>
              <p className='mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base'>
                Use the fixed sidebar to move between vehicle registration, permits, fitness, tax, PUC, GPS, insurance and billing work.
              </p>
            </div>

            <div className='mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3'>
              {vahanOptions.map((option) => (
                <Link
                  key={option.title}
                  to={option.path}
                  className={
                    option.image
                      ? 'transition duration-200 hover:-translate-y-1'
                      : 'rounded-[24px] bg-slate-50 p-5 shadow-sm ring-1 ring-slate-200 transition duration-200 hover:-translate-y-1 hover:bg-white hover:shadow-lg'
                  }
                >
                  {option.image ? (
                    <img
                      src={option.image}
                      alt={option.title}
                      className='mx-auto h-auto w-[92%] object-contain'
                    />
                  ) : (
                    <>
                      <h3 className='text-lg font-black text-slate-900'>{option.title}</h3>
                      <p className='mt-2 text-sm leading-6 text-slate-600'>{option.note}</p>
                    </>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default Vahan
