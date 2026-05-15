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
