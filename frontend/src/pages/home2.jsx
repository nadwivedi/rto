const portalCards = [
  {
    title: 'RTO Vahan',
    description: 'Vehicle registration, RC services, ownership and transport-related records.',
    accent: 'from-sky-500 via-cyan-500 to-teal-500',
    image: '/rto vahan.avif',
    url: 'https://vahan.parivahan.gov.in/vahanservice/vahan/ui/statevalidation/homepage.xhtml'
  },
  {
    title: 'RTO Sarthi',
    description: 'Driving licence services, learner applications, appointments and licence workflows.',
    accent: 'from-amber-500 via-orange-500 to-rose-500',
    image: '/rto sarthi.avif',
    url: 'https://sarathi.parivahan.gov.in/sarathiservice/stateSelection.do'
  }
]

const Home2 = () => {
  return (
    <div className='min-h-screen bg-slate-100 px-4 py-10 sm:px-6 lg:px-10'>
      <div className='mx-auto max-w-6xl'>
        <div className='mt-20 grid gap-6 md:grid-cols-2'>
          {portalCards.map((card) => (
            <a
              key={card.title}
              href={card.url}
              target='_blank'
              rel='noreferrer'
              className='group overflow-hidden rounded-[28px] bg-white shadow-lg ring-1 ring-slate-200 transition duration-300 hover:-translate-y-1 hover:shadow-2xl'
              aria-label={card.title}
            >
              <div className='relative h-64 overflow-hidden sm:h-72'>
                <img
                  src={card.image}
                  alt={card.title}
                  className='h-full w-full object-cover transition duration-500 group-hover:scale-105'
                />
                <div className={`absolute inset-x-0 top-0 h-2 bg-gradient-to-r ${card.accent}`} />
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Home2
