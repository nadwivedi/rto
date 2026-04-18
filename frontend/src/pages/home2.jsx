const vahanServices = [
  { name: 'Fitness', icon: '✅', desc: 'Certificate' },
  { name: 'Tax', icon: '💰', desc: 'Token Tax' },
  { name: 'Permit', icon: '📜', desc: 'Transport' },
  { name: 'GPS', icon: '📍', desc: 'Tracking' },
  { name: 'PUC', icon: '🌱', desc: 'Pollution' },
  { name: 'Registration', icon: '📝', desc: 'New RC' }
]

const sarthiServices = [
  { name: 'DL', icon: '🚘', desc: 'Driving Licence' },
  { name: 'Transfer', icon: '🔄', desc: 'Vehicle Transfer' },
  { name: 'RC Renewal', icon: '🔁', desc: 'Renew RC' },
  { name: 'NOC', icon: '📃', desc: 'Clearance' },
  { name: 'LL', icon: '📗', desc: 'Learner Licence' },
  { name: 'Dup RC', icon: '📋', desc: 'Duplicate RC' }
]

const ServiceCard = ({ service, color, onClick }) => (
  <button
    onClick={onClick}
    className={`group relative overflow-hidden rounded-xl border-2 border-transparent ${color.bg} p-2 sm:p-3 text-left transition-all duration-300 hover:border-current hover:shadow-lg hover:scale-[1.02]`}
  >
    <div className='relative flex flex-col items-center gap-1 sm:gap-2'>
      <div className={`flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-lg ${color.iconBg} text-base sm:text-xl shadow-sm`}>
        {service.icon}
      </div>
      <div className='flex-1 min-w-0 text-center'>
        <h3 className={`font-bold text-[10px] sm:text-xs ${color.text} truncate leading-tight`}>{service.name}</h3>
        <p className={`text-[8px] sm:text-xs ${color.subtext} truncate leading-tight`}>{service.desc}</p>
      </div>
    </div>
  </button>
)

const HeaderSection = ({ title, subtitle, gradient, icon }) => (
  <div className={`relative overflow-hidden ${gradient} p-4 sm:p-6`}>
    <div className='absolute right-0 top-0 h-20 w-20 translate-x-6 translate-y-[-1/2] rounded-full bg-white/10' />
    <div className='absolute -bottom-6 -left-6 h-16 w-16 rounded-full bg-white/10' />
    <div className='relative flex items-center gap-3'>
      <div className='flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-white/20 text-2xl sm:text-3xl backdrop-blur-sm'>
        {icon}
      </div>
      <div>
        <h2 className='text-lg sm:text-2xl font-bold text-white'>{title}</h2>
        <p className='text-[10px] sm:text-sm text-white/80 hidden sm:block'>{subtitle}</p>
      </div>
    </div>
  </div>
)

import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const Home2 = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const vahanColors = {
    bg: 'bg-sky-50',
    text: 'text-sky-700',
    subtext: 'text-sky-500',
    iconBg: 'bg-white shadow-sky-200/50',
    accent: 'bg-sky-500',
    border: 'border-sky-200'
  }

  const sarthiColors = {
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    subtext: 'text-orange-500',
    iconBg: 'bg-white shadow-orange-200/50',
    accent: 'bg-orange-500',
    border: 'border-orange-200'
  }

  return (
    <div className='min-h-screen bg-slate-100 px-2 py-6 sm:px-6 lg:px-10'>
      <div className='mx-auto max-w-6xl'>
        {/* Top Navbar Options */}
        <div className='flex justify-end gap-3 mb-8'>
          {user?.type !== 'staff' && (
            <button
              onClick={() => navigate('/whatsapp')}
              className='flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl shadow-md hover:bg-emerald-600 transition-all duration-300 font-bold'
            >
              <span className='text-xl'>💬</span>
              WhatsApp
            </button>
          )}
          <button
            onClick={() => navigate('/javak')}
            className='flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-xl shadow-md hover:bg-indigo-600 transition-all duration-300 font-bold'
          >
            <span className='text-xl'>📋</span>
            Javak
          </button>
          <button
            onClick={() => navigate('/setting')}
            className='flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-xl shadow-md hover:bg-slate-800 transition-all duration-300 font-bold'
          >
            <span className='text-xl'>⚙️</span>
            Setting
          </button>
        </div>

        <div className='grid gap-8 md:grid-cols-2'>
          <button
            onClick={() => navigate('/vahan')}
            className='group overflow-hidden rounded-2xl sm:rounded-3xl bg-white shadow-lg ring-1 ring-slate-200 transition duration-300 hover:-translate-y-1 hover:shadow-xl text-left'
          >
            <HeaderSection
              title='RTO Vahan'
              subtitle='Vehicle registration & transport services'
              gradient='bg-gradient-to-r from-sky-600 via-cyan-600 to-teal-600'
              icon='🚚'
            />
            <div className='p-2 sm:p-4'>
              <div className='grid grid-cols-3 gap-2 sm:gap-3'>
                {vahanServices.map((service) => (
                  <ServiceCard key={service.name} service={service} color={vahanColors} />
                ))}
              </div>
            </div>
          </button>

          <button
            onClick={() => navigate('/sarthi')}
            className='group overflow-hidden rounded-2xl sm:rounded-3xl bg-white shadow-lg ring-1 ring-slate-200 transition duration-300 hover:-translate-y-1 hover:shadow-xl text-left'
          >
            <HeaderSection
              title='RTO Sarthi'
              subtitle='Driving licence & learning services'
              gradient='bg-gradient-to-r from-orange-600 via-amber-600 to-rose-600'
              icon='🚗'
            />
            <div className='p-2 sm:p-4'>
              <div className='grid grid-cols-3 gap-2 sm:gap-3'>
                {sarthiServices.map((service) => (
                  <ServiceCard key={service.name} service={service} color={sarthiColors} />
                ))}
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}

export default Home2