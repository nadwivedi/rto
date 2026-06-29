import { useState, useEffect } from 'react'
import { getLicenseClasses } from '../utils/licenseClassApi'
import AddLicenseClassModal from './AddLicenseClassModal'

const LicenseClassDropdown = ({ value, onChange, required, className }) => {
  const [classes, setClasses] = useState([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [loading, setLoading] = useState(true)

  const fetchClasses = async () => {
    setLoading(true)
    try {
      const res = await getLicenseClasses()
      if (res.data.success) {
        setClasses(res.data.data)
      }
    } catch {
      console.error('Failed to fetch license classes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchClasses() }, [])

  const handleAdded = (newClass) => {
    setClasses(prev => [...prev, newClass])
    onChange({ target: { name: 'licenseClass', value: newClass.value } })
  }

  return (
    <>
      <div className='flex gap-2 items-start'>
        <select
          name='licenseClass'
          value={value}
          onChange={onChange}
          required={required}
          className={className || 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent font-semibold'}
        >
          {loading ? (
            <option value=''>Loading...</option>
          ) : classes.length === 0 ? (
            <option value=''>No classes available</option>
          ) : (
            classes.map(cls => (
              <option key={`${cls.userId || 'default'}-${cls.value}`} value={cls.value}>
                {cls.label}
              </option>
            ))
          )}
        </select>
        <button
          type='button'
          onClick={() => setShowAddModal(true)}
          className='p-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-all cursor-pointer shrink-0 mt-0'
          title='Add new license class'
        >
          <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 4v16m8-8H4' />
          </svg>
        </button>
      </div>
      <AddLicenseClassModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdded={handleAdded}
      />
    </>
  )
}

export default LicenseClassDropdown
