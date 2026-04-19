import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'
import { toast } from 'react-toastify'
import { getAllThemes, getAllVehicleNumberDesigns } from '../context/ThemeContext'
import EmployeeManagement from './Setting/EmployeeManagement'
import WhatsAppSettings from './Setting/WhatsAppSettings'

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'

const Setting = () => {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPasswords, setShowPasswords] = useState(false)

  const themes = getAllThemes()
  const currentTheme = localStorage.getItem('theme') || 'theme1'

  const vehicleNumberDesigns = getAllVehicleNumberDesigns()
  const currentVehicleDesign = localStorage.getItem('vehicleNumberDesign') || 'design1'

  const handleThemeChange = (themeName) => {
    localStorage.setItem('theme', themeName)
    window.location.reload()
  }

  const handleVehicleDesignChange = (designName) => {
    localStorage.setItem('vehicleNumberDesign', designName)
    window.location.reload()
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Please fill in all password fields')
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match')
      return
    }

    if (newPassword.length < 4) {
      toast.error('New password must be at least 4 characters long')
      return
    }

    try {
      const response = await axios.post(
        `${API_URL}/api/auth/change-password`,
        { currentPassword, newPassword },
        { withCredentials: true }
      )

      if (response.data.success) {
        toast.success(response.data.message)
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password')
    }
  }



  return (
    <div className='p-4 md:p-6 lg:p-8 pt-4 lg:pt-6 max-w-[1400px] mx-auto'>
      {/* Header */}
      <div className='mb-6'>
        <h1 className='text-2xl font-black text-gray-800 mb-1'>Settings</h1>
        <p className='text-sm text-gray-600'>Manage your application preferences and configuration</p>
      </div>

      {/* Settings Cards */}
      <div className='space-y-4'>
        {/* Theme Settings */}
        <div className='bg-white rounded-xl p-6 shadow-lg border border-gray-200'>
          <div className='flex items-center gap-3 mb-4'>
            <div className='w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center text-white text-xl'>
              🎨
            </div>
            <div>
              <h2 className='text-lg font-bold text-gray-800'>Theme Settings</h2>
              <p className='text-xs text-gray-500'>Customize the appearance of your application</p>
            </div>
          </div>

          <div className='space-y-3'>
            <label className='text-sm font-semibold text-gray-700'>Select Theme</label>
            <div className='flex flex-wrap gap-3'>
              {Object.keys(themes).map((themeName) => {
                const themeData = themes[themeName]
                const isSelected = currentTheme === themeName
                return (
                  <button
                    key={themeName}
                    onClick={() => handleThemeChange(themeName)}
                    className={`px-3 py-2 rounded-lg border-2 transition-all flex items-center gap-2 ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50 shadow-md'
                        : 'border-gray-200 bg-white hover:border-indigo-300 hover:shadow-sm'
                    }`}
                  >
                    <span className='font-semibold text-gray-800 text-xs capitalize'>
                      {themeName.replace('theme', 'Theme ')}
                    </span>
                    <div className={`w-16 h-5 rounded ${themeData.navbar}`}></div>
                    {isSelected && (
                      <div className='w-4 h-4 bg-indigo-600 rounded-full flex items-center justify-center text-white text-[10px]'>
                        ✓
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Vehicle Number Design Settings */}
        <div className='bg-white rounded-xl p-6 shadow-lg border border-gray-200'>
          <div className='flex items-center gap-3 mb-4'>
            <div className='w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center text-white text-xl'>
              🚗
            </div>
            <div>
              <h2 className='text-lg font-bold text-gray-800'>Vehicle Number Design</h2>
              <p className='text-xs text-gray-500'>Customize how vehicle numbers are displayed</p>
            </div>
          </div>

          <div className='space-y-3'>
            <label className='text-sm font-semibold text-gray-700'>Select Design</label>
            <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3'>
              {Object.keys(vehicleNumberDesigns).map((designName) => {
                const design = vehicleNumberDesigns[designName]
                const isSelected = currentVehicleDesign === designName
                return (
                  <button
                    key={designName}
                    onClick={() => handleVehicleDesignChange(designName)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50 shadow-md'
                        : 'border-gray-200 bg-white hover:border-indigo-300 hover:shadow-sm'
                    }`}
                  >
                    <div className='flex flex-col items-center mb-2'>
                      <div className='text-center mb-1.5'>
                        <div className='font-semibold text-gray-800 text-xs leading-tight'>{design.name}</div>
                      </div>
                      {isSelected && (
                        <div className='w-4 h-4 bg-indigo-600 rounded-full flex items-center justify-center text-white text-[10px]'>
                          ✓
                        </div>
                      )}
                    </div>
                    {/* Preview with larger text */}
                    <div className='mt-2 p-2 bg-gray-50 rounded flex justify-center items-center min-h-[55px]'>
                      <div className={design.container}>
                        <span className={design.stateCode.replace('text-sm', 'text-xs')}>CG</span>
                        <span className={design.districtCode.replace('text-sm', 'text-xs')}>04</span>
                        <span className={design.series.replace('text-sm', 'text-xs')}>AA</span>
                        <span className={design.last4Digits.replace('text-sm', 'text-xs')}>4793</span>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Two-Column Row: Employee Management & Change Password */}
        <div className={`grid grid-cols-1 ${user?.type !== 'staff' ? 'lg:grid-cols-2' : ''} gap-4`}>
          {/* Employee Management Section */}
          {user?.type !== 'staff' && <EmployeeManagement />}

          {/* Change Password */}
          <div className='bg-white rounded-xl p-6 shadow-lg border border-gray-200 flex flex-col h-full'>
            <div className='flex items-center gap-3 mb-4'>
              <div className='w-10 h-10 bg-gradient-to-br from-red-500 to-pink-600 rounded-lg flex items-center justify-center text-white text-xl flex-shrink-0'>
                🔒
              </div>
              <div>
                <h2 className='text-lg font-bold text-gray-800'>Change Password</h2>
                <p className='text-xs text-gray-500'>Update your account password</p>
              </div>
            </div>

            <div className='space-y-4 flex-grow'>
              <div className='grid grid-cols-1 gap-4'>
                <div>
                  <label className='text-sm font-semibold text-gray-700 block mb-2'>
                    Current Password
                  </label>
                  <div className='relative'>
                    <input
                      type={showPasswords ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder='Enter current password'
                      className='w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm pr-10'
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(!showPasswords)}
                      className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none'
                    >
                      {showPasswords ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>

                <div>
                  <label className='text-sm font-semibold text-gray-700 block mb-2'>
                    New Password
                  </label>
                  <div className='relative'>
                    <input
                      type={showPasswords ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder='Enter new password'
                      className='w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm pr-10'
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(!showPasswords)}
                      className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none'
                    >
                      {showPasswords ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>

                <div>
                  <label className='text-sm font-semibold text-gray-700 block mb-2'>
                    Confirm New Password
                  </label>
                  <div className='relative'>
                    <input
                      type={showPasswords ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder='Confirm new password'
                      className='w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm pr-10'
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(!showPasswords)}
                      className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none'
                    >
                      {showPasswords ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>
              </div>

              <div className='flex gap-3 pt-4 mt-auto'>
                <button 
                  onClick={handleChangePassword}
                  className='px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition text-sm flex-1'
                >
                  Update Password
                </button>
                <button 
                  onClick={() => {
                    setCurrentPassword('')
                    setNewPassword('')
                    setConfirmPassword('')
                  }}
                  className='px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition text-sm flex-1'
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>

        {user?.type !== 'staff' && <WhatsAppSettings />}



        {/* Logout Section */}
        <div className='bg-white rounded-xl p-6 shadow-lg border border-red-200'>
          <div className='flex items-center gap-3 mb-4'>
            <div className='w-10 h-10 bg-gradient-to-br from-red-500 to-red-700 rounded-lg flex items-center justify-center text-white text-xl'>
              🚪
            </div>
            <div>
              <h2 className='text-lg font-bold text-gray-800'>Logout</h2>
              <p className='text-xs text-gray-500'>Sign out of your account</p>
            </div>
          </div>

          <div className='space-y-3'>
            <div className='p-4 bg-red-50 border border-red-200 rounded-lg'>
              <p className='text-sm text-red-800 mb-4'>
                You will be signed out of your account and redirected to the login page. Make sure you have saved any unsaved work before logging out.
              </p>
              <button
                onClick={handleLogout}
                className='w-full flex items-center justify-center gap-3 p-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg transition font-semibold text-sm shadow-lg hover:shadow-xl transform hover:scale-105'
              >
                <span className='text-xl'>🚪</span>
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>


    </div>
  )
}

export default Setting
