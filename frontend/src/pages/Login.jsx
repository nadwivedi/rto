import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Mail, Lock, User, ShieldCheck, ArrowRight, Loader2, Download, Smartphone } from 'lucide-react'
import axios from 'axios'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL

const Login = () => {
  const navigate = useNavigate()
  const { setUser, setIsAuthenticated, isAuthenticated, loading: authLoading } = useAuth()
  const [formData, setFormData] = useState({
    identifier: '',
    password: ''
  })
  const [loginType, setLoginType] = useState('admin') // 'admin' or 'staff'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // PWA Install State
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showInstallBtn, setShowInstallBtn] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [installDismissed, setInstallDismissed] = useState(false)

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate('/')
    }
  }, [isAuthenticated, authLoading, navigate])

  // Check if app is already installed (standalone mode)
  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
      setIsInstalled(true)
    }
  }, [])

  // Capture the beforeinstallprompt event
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowInstallBtn(true)
    }

    window.addEventListener('beforeinstallprompt', handler)

    // Listen for successful install
    const installedHandler = () => {
      setIsInstalled(true)
      setShowInstallBtn(false)
      setDeferredPrompt(null)
    }
    window.addEventListener('appinstalled', installedHandler)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      window.removeEventListener('appinstalled', installedHandler)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setShowInstallBtn(false)
    }
    setDeferredPrompt(null)
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!formData.identifier || !formData.password) {
      setError('Please enter email/mobile and password')
      return
    }

    setLoading(true)

    try {
      const endpoint = loginType === 'staff' ? '/api/auth/staff-login' : '/api/auth/login'
      const response = await axios.post(`${BACKEND_URL}${endpoint}`, {
        identifier: formData.identifier,
        password: formData.password
      }, {
        withCredentials: true
      })

      if (response.data.success) {
        setUser(response.data.data.user)
        setIsAuthenticated(true)
        navigate('/')
      } else {
        setError(response.data.message || 'Login failed')
      }
    } catch (err) {
      console.error('Login error:', err)
      setError(err.response?.data?.message || 'Invalid credentials. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className='min-h-screen bg-[#0f172a] flex items-center justify-center p-4'>
        <div className='flex flex-col items-center gap-4'>
          <Loader2 className='animate-spin text-blue-500 w-12 h-12' />
          <p className='text-slate-400 font-medium animate-pulse'>Authenticating...</p>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden font-inter'>
      {/* Background Decorative Elements */}
      <div className='absolute top-0 left-0 w-full h-full overflow-hidden z-0'>
        <div className='absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]'></div>
        <div className='absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-emerald-600/10 rounded-full blur-[120px]'></div>
      </div>

      <div className='w-full max-w-md z-10'>
        <div className='bg-white/95 backdrop-blur-md rounded-[2.5rem] shadow-2xl p-6 sm:p-8 border border-white/20'>
          <div className='text-center mb-6'>
            <div className='mb-4'>
              <img
                src='/rtosarthi.avif'
                alt='RTO Sarthi Logo'
                className='h-16 mx-auto drop-shadow-lg transform hover:scale-105 transition-transform duration-300'
              />
            </div>
            <h1 className='text-2xl font-black text-slate-900 mb-0.5 tracking-tight'>Sign In</h1>
            <p className='text-slate-500 text-[10px] font-medium uppercase tracking-[0.2em]'>RTO Management System</p>
          </div>

          {/* Login Type Toggle */}
          <div className='flex p-1 mb-6 bg-slate-100 rounded-xl border border-slate-200'>
            <button
              onClick={() => { setLoginType('admin'); setError(''); }}
              className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition-all duration-300 flex items-center justify-center gap-2 ${loginType === 'admin'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              <ShieldCheck size={12} />
              ADMIN
            </button>
            <button
              onClick={() => { setLoginType('staff'); setError(''); }}
              className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition-all duration-300 flex items-center justify-center gap-2 ${loginType === 'staff'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              <User size={12} />
              STAFF
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className='mb-4 p-3 bg-red-50 border border-red-100 rounded-xl animate-in fade-in slide-in-from-top-1'>
              <div className='flex items-center gap-2'>
                <div className='bg-red-500 rounded-md p-1 shadow-md shadow-red-500/10'>
                  <ShieldCheck className='w-2.5 h-2.5 text-white' />
                </div>
                <p className='text-xs text-red-600 font-semibold'>{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className='space-y-4'>
            <div>
              <label className='block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1'>
                Email or Mobile
              </label>
              <div className='relative group'>
                <div className='absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none'>
                  <Mail className='w-4 h-4 text-slate-400 group-focus-within:text-blue-600 transition-colors' />
                </div>
                <input
                  type='text'
                  name='identifier'
                  value={formData.identifier}
                  onChange={handleChange}
                  placeholder='Enter mobile or email'
                  className='w-full bg-slate-50 border border-slate-200 text-slate-900 pl-10 pr-4 py-2.5 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 transition-all placeholder:text-slate-400 placeholder:text-xs font-medium'
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className='block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1'>
                Password
              </label>
              <div className='relative group'>
                <div className='absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none'>
                  <Lock className='w-4 h-4 text-slate-400 group-focus-within:text-blue-600 transition-colors' />
                </div>
                <input
                  type='password'
                  name='password'
                  value={formData.password}
                  onChange={handleChange}
                  placeholder='••••••••'
                  className='w-full bg-slate-50 border border-slate-200 text-slate-900 pl-10 pr-4 py-2.5 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 transition-all placeholder:text-slate-400 placeholder:text-xs font-medium'
                  disabled={loading}
                />
              </div>
            </div>

            <button
              type='submit'
              disabled={loading}
              className='w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3 rounded-xl font-bold transition-all duration-300 shadow-lg shadow-blue-600/10 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] mt-2'
            >
              {loading ? (
                <Loader2 className='animate-spin h-4 w-4 text-white' />
              ) : (
                <>
                  <span className='text-sm'>Sign In</span>
                  <ArrowRight className='w-4 h-4 group-hover:translate-x-1 transition-transform' />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className='mt-6 pt-4 border-t border-slate-100 text-center'>
            <p className='text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em]'>
              © {new Date().getFullYear()} RTO Sarthi
            </p>
            <a 
              href="https://softwarebytes.in" 
              target="_blank" 
              rel="noopener noreferrer"
              className="mt-4 flex items-center justify-center gap-2 group hover:opacity-80 transition-opacity"
            >
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Developed by</span>
              <img src="/softwarebytes logo.webp" alt="Softwarebytes" className="h-10 opacity-70 group-hover:opacity-100 transition-opacity" />
            </a>
          </div>
        </div>

        {/* PWA Install Banner */}
        {showInstallBtn && !installDismissed && !isInstalled && (
          <div className='mt-4 w-full animate-in fade-in slide-in-from-bottom-2 duration-500'>
            <div className='bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-4 shadow-xl shadow-blue-600/20 border border-blue-500/30'>
              <div className='flex items-center gap-3'>
                <div className='bg-white/20 backdrop-blur-sm rounded-xl p-2.5 flex-shrink-0'>
                  <Smartphone className='w-5 h-5 text-white' />
                </div>
                <div className='flex-1 min-w-0'>
                  <p className='text-white font-bold text-sm leading-tight'>Install RTO Sarthi</p>
                  <p className='text-blue-100 text-[10px] mt-0.5 leading-tight'>Get quick access from your home screen</p>
                </div>
                <button
                  onClick={handleInstallClick}
                  id='pwa-install-btn'
                  className='bg-white text-blue-600 px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-50 transition-all duration-200 active:scale-95 flex items-center gap-1.5 flex-shrink-0 shadow-lg'
                >
                  <Download className='w-3.5 h-3.5' />
                  Install
                </button>
                <button
                  onClick={() => setInstallDismissed(true)}
                  className='text-white/60 hover:text-white transition-colors p-1 flex-shrink-0'
                  aria-label='Dismiss install prompt'
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Login
