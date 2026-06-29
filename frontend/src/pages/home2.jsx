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
  <div className={`relative overflow-hidden ${gradient} p-2.5 sm:p-3`}>
    <div className='absolute right-0 top-0 h-20 w-20 translate-x-6 translate-y-[-1/2] rounded-full bg-white/10' />
    <div className='absolute -bottom-6 -left-6 h-16 w-16 rounded-full bg-white/10' />
    <div className='relative flex items-center gap-2'>
      <div className='flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-white/20 text-lg sm:text-xl backdrop-blur-sm'>
        {icon}
      </div>
      <div>
        <h2 className='text-base sm:text-lg font-bold text-white'>{title}</h2>
        <p className='text-[10px] sm:text-xs text-white/80 hidden sm:block'>{subtitle}</p>
      </div>
    </div>
  </div>
)

import React, { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Plus, X, Globe, ExternalLink } from 'lucide-react'

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

  // ── Bookmarks ──
  const [bookmarks, setBookmarks] = useState([])
  const [showBookmarkModal, setShowBookmarkModal] = useState(false)
  const [bmName, setBmName] = useState('')
  const [bmUrl, setBmUrl] = useState('')
  const [bmToDelete, setBmToDelete] = useState(null)
  const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'

  const fetchBookmarks = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/api/bookmarks`, { withCredentials: true })
      if (res.data.success) setBookmarks(res.data.data)
    } catch { /* ignore */ }
  }, [API_URL])

  useEffect(() => { fetchBookmarks() }, [fetchBookmarks])

  const addBookmark = useCallback(async (e) => {
    e.preventDefault()
    const name = bmName.trim()
    let url = bmUrl.trim()
    if (!name || !url) return
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url
    try {
      const res = await axios.post(`${API_URL}/api/bookmarks`, { name, url }, { withCredentials: true })
      if (res.data.success) {
        setBookmarks(prev => [res.data.data, ...prev])
        setBmName('')
        setBmUrl('')
        setShowBookmarkModal(false)
      }
    } catch { /* ignore */ }
  }, [bmName, bmUrl, API_URL])

  const removeBookmark = useCallback(async (id) => {
    try {
      await axios.delete(`${API_URL}/api/bookmarks/${id}`, { withCredentials: true })
      setBookmarks(prev => prev.filter(b => b._id !== id))
    } catch { /* ignore */ }
  }, [API_URL])

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
    <div className='min-h-screen bg-slate-100 px-2 py-6 sm:px-6 lg:px-10 pb-16'>
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
            Javak(notes)
          </button>
          <button
            onClick={() => navigate('/setting')}
            className='flex items-center gap-1 sm:gap-2 px-2.5 py-1.5 sm:px-4 sm:py-2 bg-slate-700 text-white rounded-lg sm:rounded-xl shadow-md hover:bg-slate-800 transition-all duration-300 font-bold text-xs sm:text-base'
          >
            <span className='text-base sm:text-xl'>⚙️</span>
            Setting
          </button>
          <button
            onClick={() => navigate('/cashflow-report')}
            className='flex items-center gap-1 sm:gap-2 px-2.5 py-1.5 sm:px-4 sm:py-2 bg-emerald-600 text-white rounded-lg sm:rounded-xl shadow-md hover:bg-emerald-700 transition-all duration-300 font-bold text-xs sm:text-base'
          >
            <span className='text-base sm:text-xl'>💰</span>
            Cashflow
          </button>
        </div>
      </div>

        <div className='grid gap-4 lg:gap-5 md:grid-cols-2 lg:grid-cols-3'>
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
            <div className='p-1.5 sm:p-2'>
              <div className='grid grid-cols-3 gap-1.5 sm:gap-2'>
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
            <div className='p-1.5 sm:p-2'>
              <div className='grid grid-cols-3 gap-1.5 sm:gap-2'>
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
            <div className='p-1.5 sm:p-2'>
              <div className='grid grid-cols-3 gap-2 sm:gap-3'>
                {kycServices.map((service) => (
                  <ServiceCard key={service.name} service={service} color={kycColors} />
                ))}
              </div>
            </div>
          </button>
        </div>

        {/* ── Bookmark Strip ── */}
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-t border-slate-200 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
          <div className="max-w-[1500px] mx-auto px-2 sm:px-6 lg:px-10 py-1.5 sm:py-2 flex items-center gap-1.5 overflow-x-auto">
            {bookmarks.map(bm => (
              <div key={bm._id} className="group relative flex-shrink-0">
                <a
                  href={bm.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-indigo-100 text-slate-700 hover:text-indigo-700 rounded-lg text-[11px] sm:text-xs font-bold transition-all whitespace-nowrap"
                >
                  <img src={`https://www.google.com/s2/favicons?domain=${new URL(bm.url).hostname}&sz=32`} alt="" className="w-[18px] h-[18px] flex-shrink-0" />
                  {bm.name}
                  <ExternalLink size={10} className="opacity-40 flex-shrink-0" />
                </a>
                <button
                  onClick={() => setBmToDelete(bm)}
                  className="absolute -top-1.5 -right-1.5 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 bg-red-500 text-white rounded-full shadow hover:bg-red-600"
                >
                  <X size={10} />
                </button>
              </div>
            ))}
            <button
              onClick={() => setShowBookmarkModal(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-[11px] sm:text-xs font-bold transition-all flex-shrink-0 shadow-sm"
            >
              <Plus size={13} />
              Add
            </button>
          </div>
        </div>

        {/* ── Add Bookmark Modal ── */}
        {showBookmarkModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 text-white">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold">Add Bookmark</h2>
                  <button onClick={() => { setShowBookmarkModal(false); setBmName(''); setBmUrl('') }} className="text-white hover:bg-white/20 rounded-lg p-1 transition">
                    <X size={20} />
                  </button>
                </div>
              </div>
              <form onSubmit={addBookmark} className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Name</label>
                  <input
                    type="text" required value={bmName} onChange={e => setBmName(e.target.value)}
                    placeholder="e.g. Google Drive"
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm font-medium"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">URL</label>
                  <input
                    type="url" required value={bmUrl} onChange={e => setBmUrl(e.target.value)}
                    placeholder="e.g. https://drive.google.com"
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm font-medium"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => { setShowBookmarkModal(false); setBmName(''); setBmUrl('') }}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold text-sm transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-bold text-sm shadow-md transition-all"
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── Delete Confirmation Modal ── */}
        {bmToDelete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden p-6 text-center">
              <div className="text-red-500 text-4xl mb-3">⚠️</div>
              <h3 className="text-lg font-bold text-slate-800 mb-1">Delete Bookmark?</h3>
              <p className="text-sm text-slate-500 mb-5">
                Are you sure you want to remove <span className="font-semibold text-slate-700">{bmToDelete.name}</span>?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setBmToDelete(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    removeBookmark(bmToDelete._id)
                    setBmToDelete(null)
                  }}
                  className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold text-sm shadow-md transition-all"
                >
                  Yes, Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Home2