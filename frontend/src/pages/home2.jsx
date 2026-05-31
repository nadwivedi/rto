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

const kycServices = [
  { name: 'Aadhar Card', icon: '🪪', desc: 'Front & Back' },
  { name: 'PAN Card', icon: '💳', desc: 'Verification' },
  { name: 'GST Doc', icon: '🏢', desc: 'Firm Details' },
  { name: 'Uploads', icon: '📂', desc: 'Document Hub' },
  { name: 'Compliance', icon: '🛡️', desc: 'Secured KYC' },
  { name: 'Registry', icon: '📝', desc: 'Search Database' }
]

const ServiceCard = ({ service, color, onClick }) => (
  <button
    onClick={onClick}
    className={`group relative overflow-hidden rounded-xl border-2 border-transparent ${color.bg} p-1.5 sm:p-2 text-left transition-all duration-300 hover:border-current hover:shadow-lg hover:scale-[1.02]`}
  >
    <div className='relative flex flex-col items-center gap-1 sm:gap-1.5'>
      <div className={`flex h-7 w-7 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg ${color.iconBg} text-sm sm:text-lg shadow-sm`}>
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
  <div className={`relative overflow-hidden ${gradient} p-3 sm:p-4.5`}>
    <div className='absolute right-0 top-0 h-20 w-20 translate-x-6 translate-y-[-1/2] rounded-full bg-white/10' />
    <div className='absolute -bottom-6 -left-6 h-16 w-16 rounded-full bg-white/10' />
    <div className='relative flex items-center gap-2.5'>
      <div className='flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-white/20 text-xl sm:text-2xl backdrop-blur-sm'>
        {icon}
      </div>
      <div>
        <h2 className='text-lg sm:text-2xl font-bold text-white'>{title}</h2>
        <p className='text-[10px] sm:text-sm text-white/80 hidden sm:block'>{subtitle}</p>
      </div>
    </div>
  </div>
)

import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const Home2 = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [isWhatsAppConnected, setIsWhatsAppConnected] = useState(true)

  useEffect(() => {
    const checkWhatsAppStatus = async () => {
      try {
        const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'
        const res = await axios.get(`${API_URL}/api/whatsapp/status`, { withCredentials: true })
        setIsWhatsAppConnected(res.data?.status === 'authenticated')
      } catch (error) {
        console.error('[WhatsApp] Status check error:', error)
        setIsWhatsAppConnected(false)
      }
    }
    
    if (user?.type !== 'staff') {
      checkWhatsAppStatus()
      const interval = setInterval(checkWhatsAppStatus, 10000)
      return () => clearInterval(interval)
    }
  }, [user])

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

  const kycColors = {
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    subtext: 'text-purple-500',
    iconBg: 'bg-white shadow-purple-200/50',
    accent: 'bg-purple-500',
    border: 'border-purple-200'
  }

  return (
    <div className='min-h-screen bg-slate-100 px-2 py-6 sm:px-6 lg:px-10'>
      <div className='mx-auto max-w-[1500px]'>
        {/* Top Navbar Options */}
        <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6 sm:mb-8 w-full bg-white/40 backdrop-blur-sm p-3 rounded-2xl border border-slate-200/50 shadow-sm'>
          {/* WhatsApp Not Connected Alert */}
          {!isWhatsAppConnected && user?.type !== 'staff' ? (
            <div 
              onClick={() => navigate('/whatsapp')}
              className='flex items-center gap-2 px-3.5 py-2 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl shadow-inner text-xs sm:text-sm font-bold animate-pulse hover:shadow-md hover:scale-[1.01] hover:bg-rose-100/80 transition-all duration-300 cursor-pointer w-full md:w-auto'
            >
              <span className='text-sm sm:text-base animate-bounce'>⚠️</span>
              <span>Your WhatsApp is not connected. Please connect your WhatsApp to send message</span>
            </div>
          ) : (
            <div className="hidden md:block"></div>
          )}

          {/* Buttons Group */}
          <div className='flex items-center justify-end gap-2 sm:gap-3 w-full md:w-auto'>
            {user?.type !== 'staff' && (
              <button
                onClick={() => navigate('/whatsapp')}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl shadow-sm transition-all duration-300 font-bold text-xs sm:text-base ${
                  isWhatsAppConnected 
                    ? 'bg-emerald-500 text-white hover:bg-emerald-600 hover:shadow-md' 
                    : 'bg-red-500 text-white hover:bg-red-600 hover:shadow-md animate-pulse border border-red-300'
                }`}
              >
                <span className='text-base sm:text-xl'>💬</span>
                {isWhatsAppConnected ? 'WhatsApp' : 'Connect WA'}
              </button>
            )}
          <button
            onClick={() => navigate('/javak')}
            className='flex items-center gap-1 sm:gap-2 px-2.5 py-1.5 sm:px-4 sm:py-2 bg-indigo-500 text-white rounded-lg sm:rounded-xl shadow-md hover:bg-indigo-600 transition-all duration-300 font-bold text-xs sm:text-base'
          >
            <span className='text-base sm:text-xl'>📋</span>
            Javak
          </button>
          <button
            onClick={() => navigate('/setting')}
            className='flex items-center gap-1 sm:gap-2 px-2.5 py-1.5 sm:px-4 sm:py-2 bg-slate-700 text-white rounded-lg sm:rounded-xl shadow-md hover:bg-slate-800 transition-all duration-300 font-bold text-xs sm:text-base'
          >
            <span className='text-base sm:text-xl'>⚙️</span>
            Setting
          </button>
        </div>
      </div>

        <div className='grid gap-8 md:grid-cols-2 lg:grid-cols-3'>
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
            <div className='p-2 sm:p-3'>
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
            <div className='p-2 sm:p-3'>
              <div className='grid grid-cols-3 gap-2 sm:gap-3'>
                {sarthiServices.map((service) => (
                  <ServiceCard key={service.name} service={service} color={sarthiColors} />
                ))}
              </div>
            </div>
          </button>

          <button
            onClick={() => navigate('/kyc')}
            className='group overflow-hidden rounded-2xl sm:rounded-3xl bg-white shadow-lg ring-1 ring-slate-200 transition duration-300 hover:-translate-y-1 hover:shadow-xl text-left'
          >
            <HeaderSection
              title='KYC Zone'
              subtitle='Store & search client KYC documents'
              gradient='bg-gradient-to-r from-purple-600 via-indigo-600 to-violet-600'
              icon='🛡️'
            />
            <div className='p-2 sm:p-3'>
              <div className='grid grid-cols-3 gap-2 sm:gap-3'>
                {kycServices.map((service) => (
                  <ServiceCard key={service.name} service={service} color={kycColors} />
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