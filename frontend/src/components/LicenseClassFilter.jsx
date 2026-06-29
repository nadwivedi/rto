import { useState, useEffect } from 'react'
import { getLicenseClasses } from '../utils/licenseClassApi'

const LicenseClassFilter = ({ value, onChange }) => {
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getLicenseClasses()
        if (res.data.success) setClasses(res.data.data)
      } catch {} finally {
        setLoading(false)
      }
    }
    fetch()
  }, [])

  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className='w-[calc(50%-0.25rem)] lg:w-auto px-2 lg:px-4 py-2 lg:py-3 text-xs lg:text-sm border-2 border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 font-semibold bg-white hover:border-indigo-300 transition-all shadow-sm'
    >
      <option value='All'>All Types</option>
      {loading ? (
        <option value='' disabled>Loading...</option>
      ) : (
        classes.map(cls => (
          <option key={`${cls.userId || 'default'}-${cls.value}`} value={cls.value}>
            {cls.label}
          </option>
        ))
      )}
    </select>
  )
}

export default LicenseClassFilter
