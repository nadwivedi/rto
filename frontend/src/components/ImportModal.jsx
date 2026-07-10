import { useState, useEffect } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'

const ImportModal = ({ isOpen, onClose }) => {
  const [dataTypes] = useState([
    { value: 'driving-license', label: 'Driving License' },
    { value: 'insurance', label: 'Insurance' },
    { value: 'tax', label: 'Tax Records' },
    { value: 'fitness', label: 'Fitness Certificates' },
    { value: 'cg-permit', label: 'State Permits' },
    { value: 'national-permit', label: 'National Permits' },
    { value: 'temporary-permit', label: 'Temporary Permits' },
    { value: 'vehicle-registration', label: 'Vehicle Registrations' }
  ])
  const [selectedDataType, setSelectedDataType] = useState('')
  const [jsonFile, setJsonFile] = useState(null)
  const [jsonData, setJsonData] = useState(null)
  const [loading, setLoading] = useState(false)

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedDataType('')
      setJsonFile(null)
      setJsonData(null)
    }
  }, [isOpen])

  const handleFileChange = (event) => {
    const file = event.target.files[0]
    setJsonFile(file)

    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const json = JSON.parse(e.target.result)
          setJsonData(json)
          toast.success('JSON file loaded successfully', {
            position: 'top-right',
            autoClose: 2000
          })
        } catch (error) {
          toast.error('Invalid JSON file', {
            position: 'top-right',
            autoClose: 3000
          })
          setJsonFile(null)
          setJsonData(null)
        }
      }
      reader.readAsText(file)
    }
  }

  const handleImport = async () => {
    if (!selectedDataType) {
      toast.error('Please select a data type', {
        position: 'top-right',
        autoClose: 3000
      })
      return
    }

    if (!jsonData) {
      toast.error('Please upload a JSON file', {
        position: 'top-right',
        autoClose: 3000
      })
      return
    }

    setLoading(true)

    try {
      const response = await axios.post(`${API_URL}/api/import`, {
        dataType: selectedDataType,
        data: jsonData
      }, {
        withCredentials: true
      })

      const result = response.data

      if (result.success) {
        toast.success(`✅ ${result.message}`, {
          position: 'top-right',
          autoClose: 4000
        })

        // Show detailed results
        if (result.data.success > 0) {
          toast.info(`📊 Imported: ${result.data.success} records`, {
            position: 'top-right',
            autoClose: 3000
          })
        }

        // Show skipped duplicates
        if (result.data.skipped > 0) {
          toast.warning(`⏭️ Skipped: ${result.data.skipped} duplicate records`, {
            position: 'top-right',
            autoClose: 5000
          })

          // Log skipped records for debugging
          if (result.data.skippedRecords && result.data.skippedRecords.length > 0) {
            console.log('Skipped duplicate records:', result.data.skippedRecords)

            // Show first few skipped records
            const firstSkipped = result.data.skippedRecords.slice(0, 3)
            const skippedDetails = firstSkipped.map(s => {
              const key = Object.keys(s).find(k => k !== 'index' && k !== 'reason')
              return key ? s[key] : 'Unknown'
            }).join(', ')

            toast.info(`🔄 Duplicates: ${skippedDetails}${result.data.skippedRecords.length > 3 ? '...' : ''}`, {
              position: 'top-right',
              autoClose: 6000
            })
          }
        }

        if (result.data.failed > 0) {
          toast.error(`⚠️ Failed: ${result.data.failed} records`, {
            position: 'top-right',
            autoClose: 5000
          })

          // Show first error for debugging
          if (result.data.errors && result.data.errors.length > 0) {
            console.error('Import errors:', result.data.errors)
            toast.error(`First error: ${result.data.errors[0].error}`, {
              position: 'top-right',
              autoClose: 5000
            })
          }
        }

        // Only close if all succeeded or only skipped (no failures)
        if (result.data.failed === 0) {
          setSelectedDataType('')
          setJsonFile(null)
          setJsonData(null)
          onClose()
        }
      } else {
        toast.error(result.message || 'Import failed', {
          position: 'top-right',
          autoClose: 3000
        })
      }
    } catch (error) {
      console.error('Error importing data:', error)
      toast.error('Failed to import data. Please try again.', {
        position: 'top-right',
        autoClose: 3000
      })
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

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
          className='bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto'
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className='px-6 py-5 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border-b border-gray-200 flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <div className='w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white text-xl'>
                📥
              </div>
              <div>
                <h2 className='text-xl font-bold text-gray-800'>Import Data</h2>
                <p className='text-xs text-gray-500'>Upload JSON file to import</p>
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
          <div className='p-6 space-y-5'>
            {/* Data Type Selection */}
            <div>
              <label className='block text-sm font-bold text-gray-700 mb-2'>
                Select Data Type *
              </label>
              <select
                value={selectedDataType}
                onChange={(e) => setSelectedDataType(e.target.value)}
                className='w-full px-4 py-3 border-2 border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 transition-all bg-white text-sm font-semibold'
              >
                <option value=''>Choose data type...</option>
                {dataTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* File Upload */}
            <div>
              <label className='block text-sm font-bold text-gray-700 mb-2'>
                Upload JSON File *
              </label>
              <input
                type='file'
                accept='.json'
                onChange={handleFileChange}
                className='w-full px-4 py-3 border-2 border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 transition-all bg-white text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100'
              />
              {jsonFile && (
                <p className='mt-2 text-sm text-green-600 font-semibold flex items-center gap-2'>
                  <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
                  </svg>
                  {jsonFile.name} ({Array.isArray(jsonData) ? jsonData.length : 0} records)
                </p>
              )}
            </div>

            {/* Info Box */}
            <div className='p-4 bg-blue-50 border border-blue-200 rounded-xl'>
              <h3 className='text-sm font-bold text-blue-800 mb-2 flex items-center gap-2'>
                <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
                </svg>
                Instructions
              </h3>
              <ul className='text-xs text-blue-700 space-y-1 list-disc list-inside'>
                <li>Select the type of data you want to import</li>
                <li>Upload a valid JSON file with an array of records</li>
                <li>Duplicate records will be automatically skipped</li>
                <li>Click Import to add records to the database</li>
              </ul>
            </div>
          </div>

          {/* Footer */}
          <div className='px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3 rounded-b-2xl'>
            <button
              onClick={onClose}
              className='px-5 py-2.5 text-sm font-semibold text-gray-700 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 transition-all'
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={!selectedDataType || !jsonData || loading}
              className='px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2'
            >
              {loading ? (
                <>
                  <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
                  Importing...
                </>
              ) : (
                <>
                  <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12' />
                  </svg>
                  Import Data
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default ImportModal
