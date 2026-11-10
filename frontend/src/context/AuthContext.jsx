import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [admin, setAdmin] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false)

  const clearAuthState = () => {
    setUser(null)
    setAdmin(null)
    setIsAuthenticated(false)
    setIsAdminAuthenticated(false)
  }

  // Check if user is already logged in on mount
  useEffect(() => {
    checkAuth()
  }, [])

  // Features (HSRP, RC Details, ...) are switched on / off by the admin while the user is logged in.
  // Re-read the profile when the user comes back to the tab and every 2 minutes, so a change shows
  // up in the menu / Vahan page without logging out or reloading.
  const isUserLoggedIn = isAuthenticated && !!user
  useEffect(() => {
    if (!isUserLoggedIn) return
    let lastRefresh = Date.now()
    const refreshUser = async () => {
      if (Date.now() - lastRefresh < 15000) return
      lastRefresh = Date.now()
      try {
        const res = await axios.get(`${BACKEND_URL}/api/auth/profile`, { withCredentials: true })
        if (res.data?.success && res.data.data?.user) {
          setUser(prev => (prev ? { ...prev, ...res.data.data.user } : prev))
        }
      } catch (e) {
        // Keep the current state; a real logout is handled by the normal auth flow
      }
    }
    const onVisible = () => { if (document.visibilityState === 'visible') refreshUser() }
    window.addEventListener('focus', refreshUser)
    document.addEventListener('visibilitychange', onVisible)
    const timer = setInterval(() => { if (document.visibilityState === 'visible') refreshUser() }, 120000)
    return () => {
      window.removeEventListener('focus', refreshUser)
      document.removeEventListener('visibilitychange', onVisible)
      clearInterval(timer)
    }
  }, [isUserLoggedIn])

  const checkAuth = async () => {
    try {
      // Skip auth check if on certain pages
      const publicPaths = ['/login', '/admin-access', '/adm']
      if (publicPaths.includes(window.location.pathname)) {
        setLoading(false)
        return
      }

      // 1. Try checking for regular user session
      try {
        const userResponse = await axios.get(`${BACKEND_URL}/api/auth/profile`, {
          withCredentials: true
        })
        if (userResponse.data.success) {
          setUser(userResponse.data.data.user)
          setIsAuthenticated(true)
          setLoading(false)
          return
        }
      } catch (e) {
        // Fall through to admin check
      }

      // 2. Try checking for admin session
      try {
        const adminResponse = await axios.get(`${BACKEND_URL}/api/admin/auth/profile`, {
          withCredentials: true
        })
        if (adminResponse.data.success) {
          setAdmin(adminResponse.data.data.admin)
          setIsAdminAuthenticated(true)
          setLoading(false)
          return
        }
      } catch (e) {
        // Both failed
      }

      clearAuthState()
    } catch (error) {
      console.error('Auth check error:', error)
      if (error.response?.status === 401) {
        clearAuthState()
      }
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      // Call backend logout endpoint to clear cookie
      await axios.post(`${BACKEND_URL}/api/auth/logout`, {}, {
        withCredentials: true
      })
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      // Always clear local auth state, even if API call fails
      clearAuthState()
    }
  }


  const value = {
    user,
    setUser,
    admin,
    setAdmin,
    isAuthenticated,
    setIsAuthenticated,
    isAdminAuthenticated,
    setIsAdminAuthenticated,
    loading,
    logout,
    checkAuth
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
