import { useEffect, useState } from 'react'
import axios from 'axios'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL

const AdminAccess = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { setUser, setIsAuthenticated } = useAuth()
  const [message, setMessage] = useState('Opening account access...')

  useEffect(() => {
    const token = searchParams.get('token')

    const loginWithAccessToken = async () => {
      if (!token) {
        setMessage('Access token is missing.')
        return
      }

      try {
        const response = await axios.post(
          `${BACKEND_URL}/api/auth/admin-access-login`,
          { token },
          { withCredentials: true }
        )

        if (response.data.success) {
          setUser(response.data.data.user)
          setIsAuthenticated(true)
          navigate('/', { replace: true })
          return
        }

        setMessage(response.data.message || 'Unable to open account access.')
      } catch (error) {
        setMessage(error.response?.data?.message || 'Unable to open account access.')
      }
    }

    loginWithAccessToken()
  }, [navigate, searchParams, setIsAuthenticated, setUser])

  return (
    <div className='min-h-screen bg-gray-50 flex items-center justify-center px-4'>
      <div className='w-full max-w-sm bg-white border border-gray-200 rounded-lg shadow-sm p-6 text-center'>
        <div className='mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent'></div>
        <h1 className='text-lg font-semibold text-gray-900'>Admin Access</h1>
        <p className='mt-2 text-sm text-gray-600'>{message}</p>
      </div>
    </div>
  )
}

export default AdminAccess
