import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { enforceVehicleNumberFormat } from '../../utils/vehicleNoCheck'
import AddJavakModal from './components/AddJavakModal'

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'

const Javak = () => {
  const [javaks, setJavaks] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editData, setEditData] = useState(null)
  
  // Inline entry state
  const [newEntry, setNewEntry] = useState({
    date: new Date().toISOString().split('T')[0],
    vehicleNo: '',
    partyName: '',
    purpose: '',
    remark: ''
  })
  
  // Refs for keyboard navigation
  const dateRef = useRef(null)
  const vehicleNoRef = useRef(null)
  const partyNameRef = useRef(null)
  const purposeRef = useRef(null)
  const remarkRef = useRef(null)
  
  const [isSaving, setIsSaving] = useState(false)

  const fetchJavaks = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${API_URL}/api/javak`, { withCredentials: true })
      if (response.data.success) {
        setJavaks(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching javaks:', error)
      toast.error('Failed to load tasks')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchJavaks()
  }, [])

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      // Optimistic update
      setJavaks(prev => prev.map(j => j._id === id ? { ...j, isWorkDone: !currentStatus } : j))
      await axios.patch(`${API_URL}/api/javak/${id}/status`, { isWorkDone: !currentStatus }, { withCredentials: true })
    } catch (error) {
      toast.error('Failed to update status')
      fetchJavaks()
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return
    try {
      await axios.delete(`${API_URL}/api/javak/${id}`, { withCredentials: true })
      toast.success('Task deleted')
      fetchJavaks()
    } catch (error) {
      toast.error('Failed to delete task')
    }
  }

  const openEditModal = (data) => {
    setEditData(data)
    setIsModalOpen(true)
  }

  // --- Inline Entry Logic ---
  const handleEntryChange = (e) => {
    let { name, value } = e.target
    if (name === 'vehicleNo') {
      value = enforceVehicleNumberFormat(newEntry.vehicleNo, value)
    }
    if (name === 'partyName') {
      value = value.toUpperCase()
    }
    setNewEntry(prev => ({ ...prev, [name]: value }))
  }

  const saveNewEntry = async () => {
    if (!newEntry.date || !newEntry.partyName) {
      toast.error('Date and Party Name are required')
      if (!newEntry.date) dateRef.current?.focus()
      else partyNameRef.current?.focus()
      return
    }

    setIsSaving(true)
    try {
      const response = await axios.post(`${API_URL}/api/javak`, newEntry, { withCredentials: true })
      toast.success('Task added successfully')
      
      // Update list without reloading completely
      setJavaks(prev => [response.data.data, ...prev].sort((a,b) => new Date(b.date) - new Date(a.date) || new Date(b.createdAt) - new Date(a.createdAt)))
      
      // Reset form but keep the date
      setNewEntry(prev => ({
        ...prev,
        vehicleNo: '',
        partyName: '',
        purpose: '',
        remark: ''
      }))
      
      // Focus back to first input box after save
      vehicleNoRef.current?.focus()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error saving task')
    } finally {
      setIsSaving(false)
    }
  }

  const handleKeyDown = (e, nextRef, isLast = false) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (isLast) {
        saveNewEntry()
      } else {
        nextRef.current?.focus()
      }
    }
  }

  const formatDateHeader = (dateString) => {
    if (!dateString) return 'Unknown Date'
    const parts = dateString.split('-')
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`
    }
    return dateString
  }

  const groupedJavaks = javaks.reduce((groups, task) => {
    const date = task.date
    if (!groups[date]) groups[date] = []
    groups[date].push(task)
    return groups
  }, {})

  const sortedDates = Object.keys(groupedJavaks).sort((a, b) => new Date(b) - new Date(a))

  return (
    <div className='min-h-screen bg-slate-50 px-4 pb-8 pt-4 lg:px-8 lg:pt-6'>
      <div className='max-w-7xl mx-auto space-y-6'>
        
        {/* Header */}
        <div>
          <h1 className='text-3xl font-bold text-slate-800 tracking-tight'>Javak Register</h1>
          <p className='text-slate-500 mt-1'>Type and press Enter to navigate. Saving is automatic on the final box.</p>
        </div>

        {/* Excel-Style Input Row */}
        <div className='bg-white rounded-2xl shadow-lg border border-amber-200 overflow-hidden ring-4 ring-amber-50/50 relative z-10'>
          <div className='bg-gradient-to-r from-amber-100 to-amber-50 px-6 py-3 border-b border-amber-200 flex items-center justify-between'>
            <h2 className='text-sm font-bold text-amber-900 flex items-center gap-2 uppercase tracking-wide'>
              <span className='w-6 h-6 flex items-center justify-center bg-amber-500 text-white rounded-full text-xs shadow-sm'>+</span>
              Quick Add Task
            </h2>
            <div className='text-xs text-amber-700 font-medium'>
              Press <kbd className='bg-white border-amber-200 text-amber-900 border px-1.5 py-0.5 rounded shadow-sm mx-1'>Enter ↵</kbd> to jump boxes
            </div>
          </div>
          
          <div className='px-6 py-4 overflow-x-auto'>
            {/* We align headers with inputs for seamless excel feel */}
            <div className='min-w-[800px] flex gap-3'>
              <div className='w-40 shrink-0'>
                <label className='block text-xs font-semibold text-slate-500 mb-1.5 uppercase ml-1'>Date *</label>
                <input
                  ref={dateRef}
                  type='date'
                  name='date'
                  value={newEntry.date}
                  onChange={handleEntryChange}
                  onKeyDown={(e) => handleKeyDown(e, vehicleNoRef)}
                  className='w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm transition-all shadow-sm'
                />
              </div>
              
              <div className='w-44 shrink-0'>
                <label className='block text-xs font-semibold text-slate-500 mb-1.5 uppercase ml-1'>Vehicle No</label>
                <input
                  ref={vehicleNoRef}
                  autoFocus
                  type='text'
                  name='vehicleNo'
                  value={newEntry.vehicleNo}
                  onChange={handleEntryChange}
                  onKeyDown={(e) => handleKeyDown(e, partyNameRef)}
                  placeholder='Ex: CG04...'
                  className='w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none text-sm uppercase transition-all shadow-sm'
                />
              </div>
              
              <div className='flex-1 min-w-[200px]'>
                <label className='block text-xs font-semibold text-slate-500 mb-1.5 uppercase ml-1'>Party Name *</label>
                <input
                  ref={partyNameRef}
                  type='text'
                  name='partyName'
                  value={newEntry.partyName}
                  onChange={handleEntryChange}
                  onKeyDown={(e) => handleKeyDown(e, purposeRef)}
                  placeholder='Type Party Name'
                  className='w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm uppercase transition-all shadow-sm placeholder:normal-case'
                />
              </div>
              
              <div className='w-48 shrink-0'>
                <label className='block text-xs font-semibold text-slate-500 mb-1.5 uppercase ml-1'>Purpose / Work</label>
                <input
                  ref={purposeRef}
                  type='text'
                  name='purpose'
                  value={newEntry.purpose}
                  onChange={handleEntryChange}
                  onKeyDown={(e) => handleKeyDown(e, remarkRef)}
                  placeholder='Permit, Tax, etc.'
                  className='w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm transition-all shadow-sm'
                />
              </div>
              
              <div className='w-64 shrink-0'>
                <label className='block text-xs font-semibold text-slate-500 mb-1.5 uppercase ml-1'>Remark</label>
                <div className='relative'>
                  <input
                    ref={remarkRef}
                    type='text'
                    name='remark'
                    value={newEntry.remark}
                    onChange={handleEntryChange}
                    onKeyDown={(e) => handleKeyDown(e, null, true)}
                    placeholder='Notes... (Press Enter to Save)'
                    className='w-full pl-3 pr-10 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm transition-all shadow-sm bg-yellow-50/30'
                  />
                  <div className='absolute right-2 top-0 h-full flex items-center justify-center opacity-40'>
                    <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M14 5l7 7m0 0l-7 7m7-7H3'/></svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {isSaving && (
            <div className="absolute top-0 left-0 w-full h-1 bg-blue-100 overflow-hidden">
               <div className="h-full bg-blue-500 animate-[moveIndeterminate_1s_infinite_linear] w-1/3"></div>
            </div>
          )}
        </div>

        {/* Data List grouped by date */}
        {loading ? (
          <div className='flex justify-center items-center h-64'>
            <div className='w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin'></div>
          </div>
        ) : sortedDates.length === 0 ? (
          <div className='bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center'>
            <h3 className='text-lg font-bold text-slate-800 mb-1'>No tracked tasks yet</h3>
            <p className='text-slate-500'>Type into the boxes above and press Enter to save your first task!</p>
          </div>
        ) : (
          <div className='space-y-6'>
            {sortedDates.map(date => (
              <div key={date} className='bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden'>
                <div className='bg-slate-100/90 px-6 py-2.5 border-b border-slate-200/80'>
                  <h2 className='text-md font-bold text-slate-700 flex items-center gap-2'>
                    {formatDateHeader(date)}
                    <span className='bg-white px-2 py-0.5 rounded-full text-[10px] text-slate-500 border border-slate-200'>{groupedJavaks[date].length}</span>
                  </h2>
                </div>
                
                <div className='overflow-x-auto'>
                  <table className='w-full'>
                    <tbody className='divide-y divide-slate-100'>
                      {groupedJavaks[date].map((task) => (
                        <tr key={task._id} className='hover:bg-slate-50/50 transition-colors group'>
                          <td className='px-6 py-4 text-sm font-bold text-slate-700 whitespace-nowrap w-44'>{task.vehicleNo || '-'}</td>
                          <td className='px-6 py-4 text-sm font-semibold text-slate-800 flex-1'>{task.partyName}</td>
                          <td className='px-6 py-4 text-sm text-slate-600 w-48'>{task.purpose || '-'}</td>
                          <td className='px-6 py-4 text-sm text-slate-600 w-64 max-w-xs truncate' title={task.remark}>{task.remark || '-'}</td>
                          <td className='px-6 py-4 text-center w-32'>
                            <button
                              onClick={() => handleToggleStatus(task._id, task.isWorkDone)}
                              className={`inline-flex items-center justify-center w-10 h-10 rounded-full transition-all flex-shrink-0 ${
                                task.isWorkDone 
                                  ? 'bg-green-100 text-green-600 hover:bg-green-200 shadow-sm shadow-green-100' 
                                  : 'bg-red-50 text-red-400 hover:bg-red-100'
                              }`}
                              title={task.isWorkDone ? "Mark as Not Done" : "Mark as Done"}
                            >
                              {task.isWorkDone ? (
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg>
                              ) : (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
                              )}
                            </button>
                          </td>
                          <td className='px-6 py-4 text-right w-24'>
                            <div className='flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity'>
                              <button onClick={() => openEditModal(task)} className='p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors' title='Edit'>
                                <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z' /></svg>
                              </button>
                              <button onClick={() => handleDelete(task._id)} className='p-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors' title='Delete'>
                                <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' /></svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AddJavakModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          setIsModalOpen(false)
          fetchJavaks()
        }}
        editData={editData}
      />
      
      {/* Simple animation definition for the loader */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes moveIndeterminate {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }
      `}} />
    </div>
  )
}

export default Javak
