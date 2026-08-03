import React, { useRef, useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { useAuth } from '../../context/AuthContext'

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'

const Profile = () => {
  const { user, setUser } = useAuth()
  const fileInputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [removing, setRemoving] = useState(false)

  const profileImage = user?.profileImage
    ? `${API_URL}${user.profileImage}`
    : null

  const initials = (user?.name || 'U')
    .split(' ')
    .map(word => word.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only JPG, JPEG, PNG and WebP image formats are accepted')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size exceeds the 5MB limit')
      return
    }

    const reader = new FileReader()
    reader.onload = async () => {
      try {
        setUploading(true)
        const response = await axios.post(
          `${API_URL}/api/auth/profile-picture`,
          { imageData: reader.result },
          { withCredentials: true }
        )
        if (response.data.success) {
          setUser(prev => ({ ...prev, profileImage: response.data.data.profileImage }))
          toast.success('Profile picture updated successfully')
        }
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to upload profile picture')
      } finally {
        setUploading(false)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleRemove = async () => {
    try {
      setRemoving(true)
      const response = await axios.delete(
        `${API_URL}/api/auth/profile-picture`,
        { withCredentials: true }
      )
      if (response.data.success) {
        setUser(prev => ({ ...prev, profileImage: null }))
        toast.success('Profile picture removed successfully')
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to remove profile picture')
    } finally {
      setRemoving(false)
    }
  }

  const details = [
    { label: 'Name', value: user?.name, icon: '👤' },
    { label: 'RTO', value: user?.rto, icon: '🏛️' },
    { label: 'State', value: user?.state, icon: '🗺️' },
    { label: 'Email', value: user?.email || 'Not set', icon: '✉️' },
    { label: 'Mobile 1', value: user?.mobile1 || 'Not set', icon: '📱' },
    { label: 'Mobile 2', value: user?.mobile2 || 'Not set', icon: '📞' },
    { label: 'Address', value: user?.address || 'Not set', icon: '📍' },
    { label: 'Bill Name', value: user?.billName || 'Not set', icon: '🧾' },
    { label: 'Bill Description', value: user?.billDescription || 'Not set', icon: '📝' }
  ]

  return (
    <div className='bg-white rounded-xl p-6 shadow-lg border border-gray-200'>
      <div className='flex items-center gap-3 mb-6'>
        <div className='w-10 h-10 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-lg flex items-center justify-center text-white text-xl'>
          👤
        </div>
        <div>
          <h2 className='text-lg font-bold text-gray-800'>My Profile</h2>
          <p className='text-xs text-gray-500'>Your account details and profile picture</p>
        </div>
      </div>

      <div className='flex flex-col sm:flex-row gap-6'>
        {/* Profile Picture */}
        <div className='flex flex-col items-center gap-4 sm:w-48 shrink-0'>
          <div className='relative'>
            <div className='w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-indigo-100 to-blue-200 border-4 border-indigo-200 flex items-center justify-center shadow-lg'>
              {profileImage ? (
                <img
                  src={profileImage}
                  alt='Profile'
                  className='w-full h-full object-cover'
                />
              ) : (
                <span className='text-4xl font-black text-indigo-600'>{initials}</span>
              )}
            </div>
            {uploading && (
              <div className='absolute inset-0 rounded-full bg-black/40 flex items-center justify-center'>
                <div className='w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
              </div>
            )}
          </div>

          <div className='flex flex-col gap-2 w-full'>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || removing}
              className='px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-lg font-semibold hover:from-indigo-700 hover:to-blue-700 transition text-sm disabled:opacity-50 disabled:cursor-not-allowed'
            >
              {profileImage ? 'Change Photo' : 'Upload Photo'}
            </button>
            {profileImage && (
              <button
                onClick={handleRemove}
                disabled={uploading || removing}
                className='px-4 py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-lg font-semibold hover:bg-red-100 transition text-sm disabled:opacity-50 disabled:cursor-not-allowed'
              >
                {removing ? 'Removing...' : 'Remove Photo'}
              </button>
            )}
          </div>

          <input
            ref={fileInputRef}
            type='file'
            accept='image/jpeg,image/png,image/webp'
            className='hidden'
            onChange={handleFileChange}
          />

          <p className='text-[11px] text-gray-400 text-center'>
            JPG, PNG or WebP. Max 5MB.
          </p>
        </div>

        {/* User Details */}
        <div className='flex-1'>
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
            {details.map((item) => (
              <div key={item.label} className='p-3 bg-gray-50 rounded-lg'>
                <p className='text-xs text-gray-500 font-semibold uppercase tracking-wide flex items-center gap-1'>
                  <span>{item.icon}</span>
                  {item.label}
                </p>
                <p className='text-sm font-semibold text-gray-800 mt-1 break-words'>
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile
