import { useState, useEffect } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL

const SarthiDashboard = () => {
  const [stats, setStats] = useState({
    dl: 0,
    transfer: 0,
    noc: 0,
    renewal: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setLoading(true)
      // For now using individual counts if summary endpoint doesn't exist
      // In a real scenario, you'd have an API that returns these counts
      const [dlRes, transferRes, nocRes, renewalRes] = await Promise.all([
        axios.get(`${BACKEND_URL}/api/driving-licence`, { withCredentials: true }),
        axios.get(`${BACKEND_URL}/api/vehicle-transfer`, { withCredentials: true }),
        axios.get(`${BACKEND_URL}/api/noc`, { withCredentials: true }),
        axios.get(`${BACKEND_URL}/api/registration-renewal`, { withCredentials: true })
      ])

      setStats({
        dl: dlRes.data.data?.length || 0,
        transfer: transferRes.data.data?.length || 0,
        noc: nocRes.data.data?.length || 0,
        renewal: renewalRes.data.data?.length || 0
      })
    } catch (error) {
      console.error('Error fetching Sarthi stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    { 
      title: 'Driving License', 
      count: stats.dl, 
      path: '/driving', 
      icon: <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"/></svg>, 
      gradient: 'from-indigo-500 to-purple-600', 
      glow: 'shadow-indigo-500/20' 
    },
    { 
      title: 'Vehicle Transfer', 
      count: stats.transfer, 
      path: '/vehicle-transfer', 
      icon: <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/></svg>, 
      gradient: 'from-orange-400 to-red-500', 
      glow: 'shadow-orange-500/20'
    },
    { 
      title: 'NOC Issued', 
      count: stats.noc, 
      path: '/noc', 
      icon: <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>, 
      gradient: 'from-emerald-400 to-teal-500', 
      glow: 'shadow-emerald-500/20'
    },
    { 
      title: 'RC Renewals', 
      count: stats.renewal, 
      path: '/registration-renewal', 
      icon: <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>, 
      gradient: 'from-sky-400 to-blue-600', 
      glow: 'shadow-blue-500/20'
    }
  ]

  return (
    <div className='p-6'>
      <div className='flex flex-wrap items-end justify-between gap-4 mb-8 pt-2 px-2'>
        <div>
          <h1 className='text-[28px] font-black text-slate-800 tracking-tight'>Sarthi Overview</h1>
          <p className='text-sm font-medium text-slate-500 mt-1'>Manage all your driving and vehicle applications</p>
        </div>
        <button 
          onClick={fetchStats}
          className='group flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl font-semibold shadow-lg shadow-slate-900/20 hover:-translate-y-0.5 hover:shadow-xl transition-all duration-300'
        >
          <svg className="w-4 h-4 transition-transform duration-500 group-hover:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6 px-2'>
        {statCards.map((card) => (
          <Link 
            key={card.title} 
            to={card.path}
            className="group relative block overflow-hidden rounded-[24px] bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]"
          >
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${card.gradient} opacity-5 rounded-bl-[100px] transition-transform duration-500 group-hover:scale-110`} />
            
            <div className='flex justify-between items-start relative z-10'>
              <div className={`flex w-14 h-14 bg-gradient-to-br ${card.gradient} items-center justify-center rounded-2xl shadow-lg ${card.glow} transition-transform duration-300 group-hover:-rotate-3 group-hover:scale-110`}>
                {card.icon}
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-50 text-slate-400 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </div>
            </div>
            
            <div className="mt-6 relative z-10">
              <h3 className='text-sm font-semibold text-slate-500'>{card.title}</h3>
              <div className="flex items-baseline gap-2 mt-1">
                <p className='text-3xl font-black text-slate-800 tracking-tight'>
                  {loading ? (
                    <span className="flex h-9 items-center"><span className="h-6 w-12 animate-pulse rounded-md bg-slate-200"></span></span>
                  ) : card.count}
                </p>
                <span className="text-xs font-semibold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-md">Total</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className='mt-12 px-2'>
        <h2 className='text-[18px] font-bold text-slate-800 mb-6 flex items-center gap-2'>
          <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Quick Shortcuts
        </h2>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-5'>
            <Link to='/driving' className='group p-5 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-between'>
                <div className='flex items-center gap-4'>
                    <div className='w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100/50 flex items-center justify-center text-indigo-600 font-bold transition-transform duration-300 group-hover:scale-110'>
                      DL
                    </div>
                    <div>
                        <p className='font-bold text-slate-800 text-[15px]'>DL List</p>
                        <p className='text-xs font-medium text-slate-500 mt-0.5'>View and manage all license applications</p>
                    </div>
                </div>
                <div className='flex h-8 w-8 items-center justify-center rounded-full bg-slate-50 text-indigo-600 transition-colors group-hover:bg-indigo-50'>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
            </Link>
            
            <Link to='/vehicle-transfer' className='group p-5 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-between'>
                <div className='flex items-center gap-4'>
                    <div className='w-12 h-12 rounded-xl bg-orange-50 border border-orange-100/50 flex items-center justify-center text-orange-600 font-bold transition-transform duration-300 group-hover:scale-110'>
                      VT
                    </div>
                    <div>
                        <p className='font-bold text-slate-800 text-[15px]'>Transfer List</p>
                        <p className='text-xs font-medium text-slate-500 mt-0.5'>View and manage all vehicle transfers</p>
                    </div>
                </div>
                <div className='flex h-8 w-8 items-center justify-center rounded-full bg-slate-50 text-orange-600 transition-colors group-hover:bg-orange-50'>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
            </Link>
        </div>
      </div>
    </div>
  )
}

export default SarthiDashboard
