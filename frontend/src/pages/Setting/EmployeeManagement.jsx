import React, { useState, useEffect, useMemo } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import sectionGroups from '../../utils/sectionConfig'
import { useAuth } from '../../context/AuthContext'

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'

const EmployeeManagement = () => {
  const { user } = useAuth()
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState(null)

  const enabledFeatures = user?.features || {}
  const visibleGroups = useMemo(() =>
    sectionGroups.map(group => ({
      ...group,
      sections: group.sections.filter(s => {
        if (s.key === 'greenTax') return enabledFeatures.greenTax === true
        if (s.key === 'professionalTax') return enabledFeatures.professionalTax === true
        return true
      })
    })).filter(group => group.sections.length > 0),
    [enabledFeatures.greenTax, enabledFeatures.professionalTax]
  )
  const visibleSectionKeys = useMemo(() => visibleGroups.flatMap(g => g.sections.map(s => s.key)), [visibleGroups])
  const visibleDefaultSections = useMemo(() => Object.fromEntries(visibleSectionKeys.map(k => [k, true])), [visibleSectionKeys])
  
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    password: '',
    isActive: true,
    permissions: {
      view: true,
      add: false,
      edit: false
    },
    sections: { ...visibleDefaultSections }
  })

  // Fetch all employees
  const fetchEmployees = async () => {
    try {
      setLoading(true)
      const res = await axios.get(`${API_URL}/api/employees`, { withCredentials: true })
      if (res.data.success) {
        setEmployees(res.data.data)
      }
    } catch (error) {
      console.error('Error fetching employees:', error)
      toast.error('Failed to load employees')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEmployees()
  }, [])

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    if (name.startsWith('perm_')) {
      const permName = name.replace('perm_', '')
      setFormData({
        ...formData,
        permissions: {
          ...formData.permissions,
          [permName]: checked
        }
      })
    } else if (name.startsWith('sec_')) {
      const secKey = name.replace('sec_', '')
      setFormData({
        ...formData,
        sections: {
          ...formData.sections,
          [secKey]: checked
        }
      })
    } else if (name === 'mobile') {
      const digits = value.replace(/\D/g, '').slice(0, 10)
      setFormData({ ...formData, mobile: digits })
    } else {
      setFormData({
        ...formData,
        [name]: type === 'checkbox' ? checked : value
      })
    }
  }

  const handleGroupToggle = (groupId, checked) => {
    const group = visibleGroups.find(g => g.id === groupId)
    if (!group) return
    const updated = { ...formData.sections }
    group.sections.forEach(s => { updated[s.key] = checked })
    setFormData({ ...formData, sections: updated })
  }

  const resetForm = () => {
    setFormData({
      name: '',
      mobile: '',
      password: '',
      isActive: true,
      permissions: { view: true, add: false, edit: false },
      sections: { ...visibleDefaultSections }
    })
    setEditingId(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name || !formData.mobile || (!editingId && !formData.password)) {
      toast.error('Name, mobile, and password are required.')
      return
    }

    try {
      if (editingId) {
        const payload = { ...formData }
        if (!payload.password) delete payload.password // don't send empty string if unchanged
        
        await axios.put(`${API_URL}/api/employees/${editingId}`, payload, { withCredentials: true })
        toast.success('Employee updated successfully')
      } else {
        await axios.post(`${API_URL}/api/employees`, formData, { withCredentials: true })
        toast.success('Employee created successfully')
      }
      
      fetchEmployees()
      setShowModal(false)
      resetForm()
    } catch (error) {
      console.error('Error saving employee:', error)
      toast.error(error.response?.data?.message || 'Failed to save employee')
    }
  }

  const handleEdit = (emp) => {
    setFormData({
      name: emp.name,
      mobile: emp.mobile,
      password: '', // leave blank unless they want to change
      isActive: emp.isActive,
      permissions: emp.permissions || { view: true, add: false, edit: false },
      sections: emp.sections
        ? { ...visibleDefaultSections, ...Object.fromEntries(Object.entries(emp.sections).filter(([k]) => visibleSectionKeys.includes(k))) }
        : { ...visibleDefaultSections }
    })
    setEditingId(emp._id)
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      try {
        await axios.delete(`${API_URL}/api/employees/${id}`, { withCredentials: true })
        toast.success('Employee deleted successfully')
        fetchEmployees()
      } catch (error) {
        toast.error('Failed to delete employee')
      }
    }
  }
  
  const enabledSectionCount = (sections) => {
    if (!sections) return visibleSectionKeys.length
    return visibleSectionKeys.filter(k => sections[k] !== false).length
  }

  return (
    <div className='bg-white rounded-xl p-6 shadow-lg border border-gray-200'>
      <div className='flex items-center justify-between mb-4'>
        <div className='flex items-center gap-3'>
          <div className='w-10 h-10 bg-gradient-to-br from-teal-500 to-green-600 rounded-lg flex items-center justify-center text-white text-xl'>
            👥
          </div>
          <div>
            <h2 className='text-lg font-bold text-gray-800'>Employee Management</h2>
            <p className='text-xs text-gray-500'>Create and manage staff accounts and permissions</p>
          </div>
        </div>
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          className='bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-teal-700 transition'
        >
          + Add Employee
        </button>
      </div>

      {loading ? (
        <div className='text-center py-4'>Loading employees...</div>
      ) : (
        <div className='mt-4'>
          {/* Table for Desktop */}
          <div className='hidden md:block overflow-x-auto'>
            <table className='w-full text-sm text-left border'>
              <thead className='bg-gray-50 text-gray-600 font-semibold border-b'>
                <tr>
                  <th className='px-4 py-3'>Name</th>
                  <th className='px-4 py-3'>Mobile</th>
                  <th className='px-4 py-3'>Status</th>
                  <th className='px-4 py-3'>Permissions</th>
                  <th className='px-4 py-3'>Sections</th>
                  <th className='px-4 py-3 text-right'>Actions</th>
                </tr>
              </thead>
              <tbody>
                  {employees.length === 0 ? (
                    <tr>
                      <td colSpan="6" className='text-center py-4 text-gray-500'>No employees found.</td>
                    </tr>
                  ) : (
                    employees.map(emp => (
                      <tr key={emp._id} className='border-b hover:bg-gray-50 transition-colors'>
                        <td className='px-4 py-3 font-medium text-gray-900'>{emp.name}</td>
                        <td className='px-4 py-3'>{emp.mobile}</td>
                        <td className='px-4 py-3'>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${emp.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {emp.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className='px-4 py-3'>
                          <div className='flex gap-1 text-xs'>
                            <span className={`px-1.5 py-0.5 rounded ${emp.permissions?.view ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-400'}`}>View</span>
                            <span className={`px-1.5 py-0.5 rounded ${emp.permissions?.add ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>Add</span>
                            <span className={`px-1.5 py-0.5 rounded ${emp.permissions?.edit ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-400'}`}>Edit</span>
                          </div>
                        </td>
                        <td className='px-4 py-3'>
                          <span className='text-xs font-medium text-gray-600'>
                            {enabledSectionCount(emp.sections)}/{visibleSectionKeys.length}
                          </span>
                        </td>
                        <td className='px-4 py-3 text-right'>
                          <button onClick={() => handleEdit(emp)} className='text-blue-600 hover:text-blue-800 mr-3 font-semibold transition-colors'>Edit</button>
                          <button onClick={() => handleDelete(emp._id)} className='text-red-500 hover:text-red-700 font-semibold transition-colors'>Delete</button>
                        </td>
                      </tr>
                    ))
                  )}
              </tbody>
            </table>
          </div>

          {/* Cards for Mobile */}
          <div className='md:hidden space-y-3'>
            {employees.length === 0 ? (
              <div className='text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-300 text-gray-500 text-sm font-medium'>
                No employees found
              </div>
            ) : (
              employees.map(emp => (
                <div key={emp._id} className='bg-slate-50/50 rounded-xl p-4 border border-slate-200 shadow-sm'>
                  <div className='flex justify-between items-start mb-3'>
                    <div className='flex items-center gap-3'>
                      <div className='w-10 h-10 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-sm'>
                        {emp.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className='font-bold text-slate-900 text-sm'>{emp.name}</h3>
                        <p className='text-xs text-slate-500 font-medium mt-0.5'>{emp.mobile}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${emp.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                      {emp.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  <div className='flex items-center justify-between mt-4 pt-3 border-t border-slate-200'>
                    <div className='flex gap-1.5'>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tight ${emp.permissions?.view ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-400'}`}>View</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tight ${emp.permissions?.add ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>Add</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tight ${emp.permissions?.edit ? 'bg-violet-100 text-violet-700' : 'bg-slate-100 text-slate-400'}`}>Edit</span>
                    </div>
                  </div>
                  <div className='flex items-center justify-between mt-2'>
                    <span className='text-[10px] font-medium text-slate-500'>
                      Sections: {enabledSectionCount(emp.sections)}/{visibleSectionKeys.length}
                    </span>
                    <div className='flex gap-4'>
                      <button onClick={() => handleEdit(emp)} className='text-xs font-bold text-blue-600 active:scale-95 transition-transform'>Edit</button>
                      <button onClick={() => handleDelete(emp._id)} className='text-xs font-bold text-rose-500 active:scale-95 transition-transform'>Delete</button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Modal for Add/Edit */}
      {showModal && (
        <div className='fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm'>
          <div className='bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]'>
            <div className='bg-gradient-to-r from-teal-600 to-green-600 p-4 text-white flex justify-between items-center shrink-0'>
              <h3 className='font-bold text-lg'>{editingId ? 'Edit Employee' : 'Add New Employee'}</h3>
              <button onClick={() => setShowModal(false)} className='text-white/80 hover:text-white'>✕</button>
            </div>
            <div className='p-6 overflow-y-auto flex-1'>
              <form id='employee-form' onSubmit={handleSubmit} className='space-y-4'>
                <div>
                  <label className='block text-sm font-semibold text-gray-700 mb-1'>Name *</label>
                  <input type='text' name='name' value={formData.name} onChange={handleInputChange} required className='w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 text-sm' />
                </div>
                <div>
                  <label className='block text-sm font-semibold text-gray-700 mb-1'>Mobile Number *</label>
                  <input type='text' name='mobile' value={formData.mobile} onChange={handleInputChange} maxLength={10} required className='w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 text-sm' />
                </div>
                <div>
                  <label className='block text-sm font-semibold text-gray-700 mb-1'>Password {editingId && '(Leave blank to keep current)'}</label>
                  <input type='password' name='password' value={formData.password} onChange={handleInputChange} required={!editingId} className='w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 text-sm' />
                </div>
                
                <div className='pt-2'>
                  <label className='block text-sm font-semibold text-gray-700 mb-2'>Permissions</label>
                  <div className='flex gap-4'>
                    <label className='flex items-center gap-2 text-sm'>
                      <input type='checkbox' name='perm_view' checked={formData.permissions.view} onChange={handleInputChange} className='rounded text-teal-600 focus:ring-teal-500' />
                      View Data
                    </label>
                    <label className='flex items-center gap-2 text-sm'>
                      <input type='checkbox' name='perm_add' checked={formData.permissions.add} onChange={handleInputChange} className='rounded text-teal-600 focus:ring-teal-500' />
                      Add New
                    </label>
                    <label className='flex items-center gap-2 text-sm'>
                      <input type='checkbox' name='perm_edit' checked={formData.permissions.edit} onChange={handleInputChange} className='rounded text-teal-600 focus:ring-teal-500' />
                      Edit Existing
                    </label>
                  </div>
                </div>

                <div className='pt-2'>
                  <label className='flex items-center gap-2 text-sm font-semibold text-gray-700'>
                    <input type='checkbox' name='isActive' checked={formData.isActive} onChange={handleInputChange} className='rounded text-teal-600 focus:ring-teal-500' />
                    Account is Active
                  </label>
                </div>

                <div className='pt-2 border-t mt-4'>
                  <div className='flex items-center justify-between mb-3'>
                    <label className='text-sm font-semibold text-gray-700'>Accessible Sections</label>
                    <span className='text-xs text-gray-400'>
                      {visibleSectionKeys.filter(k => formData.sections[k] !== false).length}/{visibleSectionKeys.length} enabled
                    </span>
                  </div>
                  <div className='space-y-3 pr-1'>
                    {visibleGroups.map(group => {
                      const allChecked = group.sections.every(s => formData.sections[s.key] !== false)
                      const someChecked = group.sections.some(s => formData.sections[s.key] !== false)
                      return (
                        <div key={group.id} className='bg-gray-50 rounded-lg p-3'>
                          <label className='flex items-center gap-2 text-xs font-bold text-gray-600 uppercase tracking-wider mb-2 cursor-pointer'>
                            <input
                              type='checkbox'
                              checked={allChecked}
                              ref={el => { if (el) el.indeterminate = someChecked && !allChecked }}
                              onChange={(e) => handleGroupToggle(group.id, e.target.checked)}
                              className='rounded text-teal-600 focus:ring-teal-500'
                            />
                            {group.label}
                          </label>
                          <div className='grid grid-cols-2 gap-1.5'>
                            {group.sections.map(s => (
                              <label key={s.key} className='flex items-center gap-1.5 text-xs cursor-pointer'>
                                <input
                                  type='checkbox'
                                  name={`sec_${s.key}`}
                                  checked={formData.sections[s.key] !== false}
                                  onChange={handleInputChange}
                                  className='rounded text-teal-500 focus:ring-teal-500'
                                />
                                <span>{s.icon}</span>
                                <span>{s.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </form>
            </div>
            <div className='flex gap-3 shrink-0 border-t p-4 bg-white'>
              <button type='button' onClick={() => setShowModal(false)} className='flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-semibold text-sm'>Cancel</button>
              <button type='submit' form='employee-form' className='flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition font-semibold text-sm'>Save Employee</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default EmployeeManagement
