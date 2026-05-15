import { useState } from 'react'
import { toast } from 'react-toastify'
import axios from 'axios'
import * as XLSX from 'xlsx'

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'

const ExportExcelModal = ({ isOpen, onClose }) => {
  const [selectedTypes, setSelectedTypes] = useState([])
  const [isExporting, setIsExporting] = useState(false)

  const dataTypes = [
    { id: 'vehicle-registration', name: 'Vehicle Registration', endpoint: '/api/vehicle-registrations/export', icon: '🚗' },
    { id: 'national-permit', name: 'National Permit', endpoint: '/api/national-permits/export', icon: '🛣️' },
    { id: 'cg-permit', name: 'CG Permit', endpoint: '/api/cg-permits/export', icon: '📄' },
    { id: 'temporary-permit', name: 'Temporary Permit', endpoint: '/api/temporary-permits/export', icon: '⏰' },
    { id: 'fitness', name: 'Fitness', endpoint: '/api/fitness/export', icon: '✅' },
    { id: 'tax', name: 'Tax', endpoint: '/api/tax/export', icon: '💰' },
    { id: 'insurance', name: 'Insurance', endpoint: '/api/insurance/export', icon: '🛡️' },
    { id: 'driving-license', name: 'Driving License', endpoint: '/api/driving-licenses/export', icon: '🪪' }
  ]

  const handleToggle = (id) => {
    setSelectedTypes(prev =>
      prev.includes(id)
        ? prev.filter(typeId => typeId !== id)
        : [...prev, id]
    )
  }

  const handleSelectAll = () => {
    if (selectedTypes.length === dataTypes.length) {
      setSelectedTypes([])
    } else {
      setSelectedTypes(dataTypes.map(type => type.id))
    }
  }

  const handleExport = async () => {
    if (selectedTypes.length === 0) {
      toast.error('Please select at least one data type to export', {
        position: 'top-right',
        autoClose: 3000
      })
      return
    }

    setIsExporting(true)
    let successCount = 0
    let failCount = 0

    try {
      toast.info(`Exporting ${selectedTypes.length} data type(s)...`, {
        position: 'top-right',
        autoClose: 2000
      })

      for (const typeId of selectedTypes) {
        const type = dataTypes.find(t => t.id === typeId)
        try {
          const response = await axios.get(`${API_URL}${type.endpoint}`, { withCredentials: true })
          const data = response.data.data || response.data || []

          if (data.length === 0) {
            console.log(`No data found for ${type.name}`)
            continue
          }

          // Convert to worksheet
          const worksheet = XLSX.utils.json_to_sheet(data)
          const workbook = XLSX.utils.book_new()
          XLSX.utils.book_append_sheet(workbook, worksheet, 'Data')

          // Generate filename with timestamp
          const timestamp = new Date().toISOString().split('T')[0]
          const filename = `${type.name.replace(/ /g, '_')}_${timestamp}.xlsx`

          // Download the file
          XLSX.writeFile(workbook, filename)

          successCount++
          await new Promise(resolve => setTimeout(resolve, 500)) // Small delay between downloads
        } catch (error) {
          console.error(`Error exporting ${type.name}:`, error)
          failCount++
        }
      }

      if (successCount > 0) {
        toast.success(`✅ Successfully exported ${successCount} data type(s)`, {
          position: 'top-right',
          autoClose: 3000
        })
      }

      if (failCount > 0) {
        toast.warning(`⚠️ Failed to export ${failCount} data type(s)`, {
          position: 'top-right',
          autoClose: 3000
        })
      }

      // Reset and close
      setSelectedTypes([])
      onClose()
    } catch (error) {
      console.error('Error during export:', error)
      toast.error('Failed to export data', {
        position: 'top-right',
        autoClose: 3000
      })
    } finally {
      setIsExporting(false)
    }
  }

  if (!isOpen) return null

  const allSelected = selectedTypes.length === dataTypes.length

  return (
    <>
      {/* Backdrop */}
      <div
        className='fixed inset-0 bg-black/60 z-[70] transition-opacity'
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className='fixed inset-0 z-[70] flex items-center justify-center p-4'>
        <div
          className='bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto'
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className='px-6 py-5 bg-gradient-to-r from-green-50 via-teal-50 to-emerald-50 border-b border-gray-200 flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <div className='w-10 h-10 bg-gradient-to-br from-green-500 to-teal-600 rounded-lg flex items-center justify-center text-white text-xl'>
                📊
              </div>
              <div>
                <h2 className='text-xl font-bold text-gray-800'>Export Data as Excel</h2>
                <p className='text-xs text-gray-500'>Select data types to export</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className='text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-lg'
            >
              <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className='p-6'>
            {/* Select All */}
            <div className='mb-4 pb-4 border-b border-gray-200'>
              <label className='flex items-center gap-3 p-3 bg-gradient-to-r from-green-50 to-teal-50 rounded-lg cursor-pointer hover:from-green-100 hover:to-teal-100 transition-all border-2 border-green-200'>
                <input
                  type='checkbox'
                  checked={allSelected}
                  onChange={handleSelectAll}
                  className='w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-2 focus:ring-green-500'
                />
                <div className='flex items-center gap-2 flex-1'>
                  <span className='text-2xl'>✓</span>
                  <div>
                    <span className='font-bold text-gray-800'>Select All</span>
                    <p className='text-xs text-gray-500'>Export all data types</p>
                  </div>
                </div>
                <span className='text-sm font-semibold text-green-600'>
                  {selectedTypes.length}/{dataTypes.length}
                </span>
              </label>
            </div>

            {/* Data Type Checkboxes */}
            <div className='space-y-2'>
              <label className='block text-sm font-bold text-gray-700 mb-3'>
                Select Data Types to Export:
              </label>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                {dataTypes.map((type) => (
                  <label
                    key={type.id}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all border-2 ${
                      selectedTypes.includes(type.id)
                        ? 'bg-green-50 border-green-300 shadow-sm'
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <input
                      type='checkbox'
                      checked={selectedTypes.includes(type.id)}
                      onChange={() => handleToggle(type.id)}
                      className='w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-2 focus:ring-green-500'
                    />
                    <span className='text-xl'>{type.icon}</span>
                    <span className='text-sm font-semibold text-gray-800'>{type.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Info Box */}
            <div className='mt-5 p-4 bg-blue-50 border border-blue-200 rounded-xl'>
              <h3 className='text-sm font-bold text-blue-800 mb-2 flex items-center gap-2'>
                <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
                </svg>
                Export Information
              </h3>
              <ul className='text-xs text-blue-700 space-y-1 list-disc list-inside'>
                <li>Select the data types you want to export</li>
                <li>Each data type will be downloaded as a separate Excel file</li>
                <li>Files will include the date in the filename</li>
                <li>Use "Select All" to export all data types at once</li>
              </ul>
            </div>
          </div>

          {/* Footer */}
          <div className='px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center rounded-b-2xl'>
            <div className='text-sm text-gray-600'>
              <span className='font-semibold'>{selectedTypes.length}</span> selected
            </div>
            <div className='flex gap-3'>
              <button
                onClick={onClose}
                className='px-5 py-2.5 text-sm font-semibold text-gray-700 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 transition-all'
              >
                Cancel
              </button>
              <button
                onClick={handleExport}
                disabled={selectedTypes.length === 0 || isExporting}
                className='px-5 py-2.5 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-xl hover:shadow-lg font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2'
              >
                {isExporting ? (
                  <>
                    <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
                    Exporting...
                  </>
                ) : (
                  <>
                    <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4' />
                    </svg>
                    Export Excel
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default ExportExcelModal
