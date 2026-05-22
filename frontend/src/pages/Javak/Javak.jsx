import { useState, useEffect, useRef, useMemo } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { enforceVehicleNumberFormat } from '../../utils/vehicleNoCheck'
import AddJavakModal from './components/AddJavakModal'

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'
const inputClass = 'w-full px-3 py-2 border border-slate-400/80 rounded-lg bg-white/95 focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-600 outline-none text-sm transition-all shadow-sm shadow-slate-200/60'

// Component for Inline Editing
const EditableCell = ({ value, onSave, onCancel, uppercase }) => {
  const [val, setVal] = useState(value || '');
  const handleSave = () => onSave(val);
  
  return (
    <input
      autoFocus
      type='text'
      className={`w-full px-2 py-1 text-sm border-2 border-cyan-400 bg-white focus:ring-2 focus:ring-cyan-200 rounded-lg outline-none shadow-sm ${uppercase ? 'uppercase' : ''}`}
      value={val}
      onChange={e => setVal(uppercase ? e.target.value.toUpperCase() : e.target.value)}
      onBlur={handleSave}
      onKeyDown={e => {
        if (e.key === 'Enter') handleSave();
        if (e.key === 'Escape') onCancel();
      }}
    />
  )
}

const Javak = () => {
  const [javaks, setJavaks] = useState([])
  const [loading, setLoading] = useState(true)
  
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
  
  // Cell inline editing state: { id, field }
  const [editingCell, setEditingCell] = useState(null)

  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editTask, setEditTask] = useState(null)

  // Search (backend query on every keystroke)
  const [searchQuery, setSearchQuery] = useState('')
  const [totalRecords, setTotalRecords] = useState(0)
  const searchDebounceRef = useRef(null)
  const isInitialFetch = useRef(true)

  const fetchJavaks = async (search = searchQuery) => {
    const trimmed = search.trim()
    try {
      setLoading(true)
      const response = await axios.get(`${API_URL}/api/javak`, {
        params: trimmed ? { search: trimmed } : {},
        withCredentials: true
      })
      if (response.data.success) {
        setJavaks(response.data.data)
        setTotalRecords(response.data.totalRecords ?? response.data.data.length)
      }
    } catch (error) {
      console.error('Error fetching javaks:', error)
      toast.error('Failed to load tasks')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isInitialFetch.current) {
      isInitialFetch.current = false
      fetchJavaks(searchQuery)
      return
    }
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
    searchDebounceRef.current = setTimeout(() => {
      fetchJavaks(searchQuery)
    }, 300)
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
    }
  }, [searchQuery])

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

  const handleCellSave = async (id, field, newValue) => {
    setEditingCell(null)
    const task = javaks.find(t => t._id === id)
    if (!task || task[field] === newValue) return

    try {
      // Optimistic locally
      setJavaks(prev => prev.map(j => j._id === id ? { ...j, [field]: newValue } : j))
      // Save it to backend completely
      await axios.put(`${API_URL}/api/javak/${id}`, { ...task, [field]: newValue }, { withCredentials: true })
      toast.success('Updated successfully')
    } catch (err) {
      toast.error('Failed to update field')
      fetchJavaks()
    }
  }

  const handleEdit = (task) => {
    setEditTask(task)
    setIsEditModalOpen(true)
  }

  const handleEditModalClose = () => {
    setIsEditModalOpen(false)
    setEditTask(null)
  }

  const handleEditSuccess = () => {
    handleEditModalClose()
    fetchJavaks()
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
      
      // Refresh list (respects active search / recent limit)
      fetchJavaks()
      
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

  const groupedJavaks = useMemo(() => {
    return javaks.reduce((groups, task) => {
      const date = task.date
      if (!groups[date]) groups[date] = []
      groups[date].push(task)
      return groups
    }, {})
  }, [javaks])

  const sortedDates = useMemo(
    () => Object.keys(groupedJavaks).sort((a, b) => new Date(b) - new Date(a)),
    [groupedJavaks]
  )

  const hasSearch = searchQuery.trim().length > 0

  return (
    <div className='min-h-screen bg-gray-100 px-4 pb-8 pt-4 lg:px-8 lg:pt-6'>
      <div className='max-w-7xl mx-auto space-y-6'>
        
        {/* Combined Header & Quick Add Row */}
        <div className='bg-white/90 rounded-lg shadow-xl shadow-cyan-950/10 border border-white/80 overflow-hidden ring-1 ring-cyan-100/80 relative z-10 backdrop-blur'>
          <div className='bg-gradient-to-r from-indigo-600 via-sky-500 to-emerald-400 px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-white'>
            <div>
              <h1 className='text-2xl font-bold tracking-tight'>Javak Register</h1>
              <div className='flex items-center gap-2 mt-0.5'>
                <span className='w-2 h-2 bg-white rounded-full animate-pulse shadow-sm'></span>
                <h2 className='text-[10px] font-bold text-white/90 uppercase tracking-widest'>Quick Add Task</h2>
              </div>
            </div>
            <div className='text-xs text-white font-medium bg-white/20 px-3 py-2 rounded-lg border border-white/30 shadow-sm backdrop-blur'>
              Press <kbd className='bg-white text-cyan-800 border border-white/80 px-1.5 py-0.5 rounded shadow-sm mx-1 font-bold font-mono text-[10px]'>ENTER</kbd> on Remark to save
            </div>
          </div>
          
          <div className='px-6 py-5 overflow-x-auto bg-gradient-to-br from-white via-sky-50/80 to-emerald-50/70'>
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
                  className={inputClass}
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
                  className={`${inputClass} uppercase`}
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
                  className={`${inputClass} uppercase placeholder:normal-case`}
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
                  className={inputClass}
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
                    className={`${inputClass} pl-3 pr-10 bg-amber-50/70`}
                  />
                  <div className='absolute right-2 top-0 h-full flex items-center justify-center opacity-40'>
                    <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M14 5l7 7m0 0l-7 7m7-7H3'/></svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {isSaving && (
            <div className="absolute top-0 left-0 w-full h-1 bg-cyan-100 overflow-hidden">
               <div className="h-full bg-gradient-to-r from-cyan-500 to-amber-400 animate-[moveIndeterminate_1s_infinite_linear] w-1/3"></div>
            </div>
          )}
        </div>

        {/* Search */}
        <div className='bg-white rounded-lg border border-gray-200 shadow-sm px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3'>
          <div className='relative flex-1 max-w-xl'>
            <svg
              className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' />
            </svg>
            <input
              type='text'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder='Search by party name or vehicle number...'
              className='w-full pl-10 pr-10 py-2.5 text-sm border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-600 outline-none transition-all uppercase placeholder:normal-case'
            />
            {searchQuery && (
              <button
                type='button'
                onClick={() => setSearchQuery('')}
                className='absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded'
                title='Clear search'
              >
                <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                </svg>
              </button>
            )}
          </div>
          {hasSearch ? (
            <p className='text-sm text-slate-600 shrink-0'>
              <span className='font-semibold text-cyan-700'>{javaks.length}</span>
              {' '}of {totalRecords} match{totalRecords !== 1 ? 'es' : ''}
              {totalRecords > javaks.length && (
                <span className='text-slate-400'> (showing first {javaks.length})</span>
              )}
            </p>
          ) : (
            <p className='text-sm text-slate-500 shrink-0'>
              Showing recent <span className='font-semibold text-slate-700'>{javaks.length}</span>
              {totalRecords > javaks.length && (
                <> of <span className='font-semibold text-slate-700'>{totalRecords}</span> — search to find older records</>
              )}
            </p>
          )}
        </div>

        {/* Data List grouped by date */}
        {loading ? (
          <div className='flex justify-center items-center h-64 rounded-lg border border-gray-200 bg-white'>
            <div className='w-12 h-12 border-4 border-cyan-600 border-t-transparent rounded-full animate-spin'></div>
          </div>
        ) : sortedDates.length === 0 ? (
          <div className='rounded-lg border border-gray-200 bg-white p-12 text-center'>
            <div className='mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 text-gray-500'>
              {hasSearch ? (
                <svg className='h-6 w-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' /></svg>
              ) : (
                <svg className='h-6 w-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M12 4v16m8-8H4' /></svg>
              )}
            </div>
            {hasSearch ? (
              <>
                <h3 className='text-lg font-bold text-slate-800 mb-1'>No matching tasks</h3>
                <p className='text-slate-500'>No party name or vehicle number matches &quot;{searchQuery.trim()}&quot;</p>
                <button
                  type='button'
                  onClick={() => setSearchQuery('')}
                  className='mt-4 text-sm font-medium text-cyan-700 hover:text-cyan-800 underline'
                >
                  Clear search
                </button>
              </>
            ) : (
              <>
                <h3 className='text-lg font-bold text-slate-800 mb-1'>No tracked tasks yet</h3>
                <p className='text-slate-500'>Type into the boxes above and press Enter to save your first task!</p>
              </>
            )}
          </div>
        ) : (
          <div className='space-y-6'>
            {sortedDates.map(date => (
              <div key={date} className='overflow-hidden rounded-lg border border-gray-200 bg-white'>
                <div className='border-b border-blue-100 bg-blue-50 px-5 py-3'>
                  <h2 className='flex items-center justify-start gap-2 text-left text-sm font-bold text-blue-900'>
                    <svg className='h-4 w-4 text-blue-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M8 7V3m8 4V3M5 11h14M5 5h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z' />
                    </svg>
                    {formatDateHeader(date)}
                    <span className='rounded bg-white px-1.5 py-0.5 text-[11px] font-semibold text-blue-700 border border-blue-100'>{groupedJavaks[date].length}</span>
                  </h2>
                </div>
                
                <div className='overflow-x-auto'>
                  <table className='w-full'>
                    <thead>
                      <tr className='border-b border-gray-200 bg-gray-50 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-600'>
                        <th className='px-3 py-2 w-44'>Vehicle No</th>
                        <th className='px-3 py-2 w-64'>Party Name</th>
                        <th className='px-3 py-2 w-56'>Purpose</th>
                        <th className='px-3 py-2 w-56'>Remark</th>
                        <th className='px-3 py-2 w-32 text-center'>Status</th>
                        <th className='px-3 py-2 w-28 text-right'>Action</th>
                      </tr>
                    </thead>
                    <tbody className='divide-y divide-gray-200'>
                      {groupedJavaks[date].map((task) => (
                        <tr key={task._id} className='transition-colors hover:bg-gray-50 group'>
                          <td className='px-3 py-2 text-xs font-bold text-blue-900 w-44 cursor-pointer hover:bg-gray-100' onClick={() => setEditingCell({ id: task._id, field: 'vehicleNo'})}>
                            {editingCell?.id === task._id && editingCell?.field === 'vehicleNo' ? 
                              <EditableCell uppercase value={task.vehicleNo} onCancel={() => setEditingCell(null)} onSave={(val) => handleCellSave(task._id, 'vehicleNo', val)} /> : 
                              (task.vehicleNo || '-')}
                          </td>
                          <td className='px-3 py-2 text-xs font-semibold text-gray-800 w-64 cursor-pointer hover:bg-gray-100' onClick={() => setEditingCell({ id: task._id, field: 'partyName'})}>
                            {editingCell?.id === task._id && editingCell?.field === 'partyName' ? 
                              <EditableCell uppercase value={task.partyName} onCancel={() => setEditingCell(null)} onSave={(val) => handleCellSave(task._id, 'partyName', val)} /> : 
                              task.partyName}
                          </td>
                          <td className='px-3 py-2 text-sm text-gray-700 w-56 cursor-pointer hover:bg-gray-100' onClick={() => setEditingCell({ id: task._id, field: 'purpose'})}>
                            {editingCell?.id === task._id && editingCell?.field === 'purpose' ? 
                              <EditableCell value={task.purpose} onCancel={() => setEditingCell(null)} onSave={(val) => handleCellSave(task._id, 'purpose', val)} /> : 
                              (task.purpose || '-')}
                          </td>
                          <td className='px-3 py-2 text-sm text-gray-700 w-56 max-w-xs truncate cursor-pointer hover:bg-gray-100' title={task.remark} onClick={() => setEditingCell({ id: task._id, field: 'remark'})}>
                            {editingCell?.id === task._id && editingCell?.field === 'remark' ? 
                              <EditableCell value={task.remark} onCancel={() => setEditingCell(null)} onSave={(val) => handleCellSave(task._id, 'remark', val)} /> : 
                              (task.remark || '-')}
                          </td>
                          <td className='px-3 py-2 text-center w-32'>
                            <button
                              onClick={() => handleToggleStatus(task._id, task.isWorkDone)}
                              className={`inline-flex items-center justify-center w-10 h-10 rounded-full transition-all flex-shrink-0 ${
                                task.isWorkDone 
                                  ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 shadow-sm shadow-emerald-100' 
                                  : 'bg-rose-50 text-rose-500 hover:bg-rose-100'
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
                          <td className='px-3 py-2 text-right w-28'>
                            <div className='flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity'>
                              <button onClick={() => handleEdit(task)} className='p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors' title='Edit'>
                                <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' /></svg>
                              </button>
                              <button onClick={() => handleDelete(task._id)} className='p-1.5 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors' title='Delete'>
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
        isOpen={isEditModalOpen}
        onClose={handleEditModalClose}
        onSuccess={handleEditSuccess}
        editData={editTask}
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
