import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-toastify'
import { 
  Search, Plus, ShieldCheck, FileText, 
  Trash2, Edit3, Eye, ArrowLeft, Upload, 
  CheckCircle, FileCheck, Layers, FileDown
} from 'lucide-react'

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'

const KycZone = () => {
  const navigate = useNavigate()
  const [kycRecords, setKycRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDocType, setSelectedDocType] = useState('All')
  const [stats, setStats] = useState({ total: 0, aadhar: 0, pan: 0, gst: 0, other: 0 })
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState('add') // 'add' or 'edit'
  const [currentRecordId, setCurrentRecordId] = useState(null)
  
  // Form State
  const [clientName, setClientName] = useState('')
  const [documentType, setDocumentType] = useState('Aadhar')
  const [documentNumber, setDocumentNumber] = useState('')
  const [aadharFront, setAadharFront] = useState('')
  const [aadharBack, setAadharBack] = useState('')
  const [documentFile, setDocumentFile] = useState('')
  const [remarks, setRemarks] = useState('')
  
  // File upload previews/loading
  const [uploadingFront, setUploadingFront] = useState(false)
  const [uploadingBack, setUploadingBack] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)

  const [previewUrl, setPreviewUrl] = useState(null)

  useEffect(() => {
    fetchKycRecords()
  }, [searchQuery, selectedDocType])

  useEffect(() => {
    if (!isModalOpen) return

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsModalOpen(false)
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isModalOpen])

  const fetchKycRecords = async () => {
    try {
      setLoading(true)
      let url = `${API_URL}/api/kyc?limit=100`
      if (searchQuery) {
        url += `&search=${encodeURIComponent(searchQuery)}`
      }
      if (selectedDocType !== 'All') {
        url += `&documentType=${selectedDocType}`
      }
      
      const response = await axios.get(url, { withCredentials: true })
      if (response.data.success) {
        const records = response.data.data
        setKycRecords(records)
        
        // Calculate statistics based on current full search / or from local
        const total = records.length
        const aadhar = records.filter(r => r.documentType === 'Aadhar').length
        const pan = records.filter(r => r.documentType === 'PAN').length
        const gst = records.filter(r => r.documentType === 'GST').length
        const other = records.filter(r => r.documentType === 'Other').length
        
        setStats({ total, aadhar, pan, gst, other })
      }
    } catch (error) {
      console.error('Error fetching KYC records:', error)
      toast.error('Failed to load KYC records')
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (e, field) => {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadstart = () => {
      if (field === 'front') setUploadingFront(true)
      if (field === 'back') setUploadingBack(true)
      if (field === 'file') setUploadingFile(true)
    }

    reader.onloadend = async () => {
      try {
        const base64Data = reader.result
        const payload = {
          imageData: base64Data,
          clientName: clientName || 'Unnamed Client',
          documentType,
          side: field
        }

        const response = await axios.post(`${API_URL}/api/upload/kyc-document`, payload, { withCredentials: true })
        if (response.data.success) {
          const filePath = response.data.data.path
          if (field === 'front') setAadharFront(filePath)
          if (field === 'back') setAadharBack(filePath)
          if (field === 'file') setDocumentFile(filePath)
          toast.success('Document uploaded successfully!')
        }
      } catch (error) {
        console.error('Upload failed:', error)
        toast.error('Document upload failed')
      } finally {
        setUploadingFront(false)
        setUploadingBack(false)
        setUploadingFile(false)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!clientName.trim()) {
      toast.warning('Client Name is required')
      return
    }

    try {
      const payload = {
        clientName,
        documentType,
        documentNumber,
        aadharFront: documentType === 'Aadhar' ? aadharFront : '',
        aadharBack: documentType === 'Aadhar' ? aadharBack : '',
        documentFile: documentType !== 'Aadhar' ? documentFile : '',
        remarks
      }

      let response
      if (modalMode === 'add') {
        response = await axios.post(`${API_URL}/api/kyc`, payload, { withCredentials: true })
      } else {
        response = await axios.put(`${API_URL}/api/kyc/${currentRecordId}`, payload, { withCredentials: true })
      }

      if (response.data.success) {
        toast.success(modalMode === 'add' ? 'KYC added successfully!' : 'KYC updated successfully!')
        setIsModalOpen(false)
        resetForm()
        fetchKycRecords()
      }
    } catch (error) {
      console.error('Error saving KYC record:', error)
      toast.error('Failed to save KYC record')
    }
  }

  const handleEdit = (record) => {
    setModalMode('edit')
    setCurrentRecordId(record._id)
    setClientName(record.clientName)
    setDocumentType(record.documentType)
    setDocumentNumber(record.documentNumber || '')
    setAadharFront(record.aadharFront || '')
    setAadharBack(record.aadharBack || '')
    setDocumentFile(record.documentFile || '')
    setRemarks(record.remarks || '')
    setIsModalOpen(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this KYC record? This will also remove the physical files.')) return

    try {
      const response = await axios.delete(`${API_URL}/api/kyc/${id}`, { withCredentials: true })
      if (response.data.success) {
        toast.success('KYC record deleted')
        fetchKycRecords()
      }
    } catch (error) {
      console.error('Error deleting KYC record:', error)
      toast.error('Failed to delete KYC record')
    }
  }

  const resetForm = () => {
    setClientName('')
    setDocumentType('Aadhar')
    setDocumentNumber('')
    setAadharFront('')
    setAadharBack('')
    setDocumentFile('')
    setRemarks('')
    setCurrentRecordId(null)
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-12">


      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {/* Statistics Cards - Light Mode */}
        <div className="flex items-center gap-3 mb-4 md:mb-8">
          <button
            onClick={() => navigate('/')}
            className='flex items-center justify-center w-10 h-10 rounded-xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer flex-shrink-0'
            title='Back to Home'
          >
            <svg className='w-5 h-5 text-gray-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M10 19l-7-7m0 0l7-7m-7 7h18' />
            </svg>
          </button>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 md:gap-4 flex-1">
          {[
            { label: 'Total KYC Records', val: stats.total, color: 'border-slate-200 bg-white hover:border-indigo-300', icon: <Layers className="text-indigo-600" size={12} />, iconBg: 'bg-indigo-50' },
            { label: 'Aadhar Card', val: stats.aadhar, color: 'border-slate-200 bg-white hover:border-emerald-300', icon: <FileCheck className="text-emerald-600" size={12} />, iconBg: 'bg-emerald-50' },
            { label: 'PAN Card', val: stats.pan, color: 'border-slate-200 bg-white hover:border-amber-300', icon: <FileText className="text-amber-600" size={12} />, iconBg: 'bg-amber-50' },
            { label: 'GST Document', val: stats.gst, color: 'border-slate-200 bg-white hover:border-pink-300', icon: <ShieldCheck className="text-pink-600" size={12} />, iconBg: 'bg-pink-50' },
            { label: 'Other Docs', val: stats.other, color: 'border-slate-200 bg-white hover:border-slate-350', icon: <FileText className="text-slate-600" size={12} />, iconBg: 'bg-slate-100' },
          ].map((card, i) => (
            <div key={i} className={`${i >= 2 ? 'hidden lg:block' : ''} bg-white border ${card.color} rounded-2xl p-2.5 md:p-3.5 shadow-sm transition-all duration-300 hover:shadow-md hover:translate-y-[-2px]`}>
              <div className="flex items-center justify-between mb-1 md:mb-1.5">
                <span className="text-slate-400 text-[9px] sm:text-xs font-bold uppercase tracking-wider">{card.label}</span>
                <div className={`p-1 md:p-1.5 ${card.iconBg} rounded-lg flex items-center justify-center`}>{card.icon}</div>
              </div>
              <span className="text-[15px] sm:text-2xl font-black text-slate-800 leading-none">{card.val}</span>
            </div>
          ))}
        </div>
        </div>

        {/* Search & Filtering Area - Light Mode */}
        <div className="bg-white border border-slate-200 rounded-[2rem] p-4 sm:p-5 mb-8 shadow-sm flex flex-col sm:flex-row sm:items-center gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by client name or document number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 transition-all text-xs sm:text-sm font-semibold"
            />
          </div>

          {/* Dropdown Filter */}
          <select
            value={selectedDocType}
            onChange={(e) => setSelectedDocType(e.target.value)}
            className="px-4 py-3 bg-slate-50 border border-slate-200 text-slate-700 rounded-2xl focus:outline-none focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 font-bold text-sm shadow-sm transition-all cursor-pointer w-full sm:w-auto"
          >
            <option value="All">All Documents</option>
            <option value="Aadhar">Aadhar Card</option>
            <option value="PAN">PAN Card</option>
            <option value="GST">GST Document</option>
            <option value="Other">Other Docs</option>
          </select>

          {/* Add Button — same row */}
          <button 
            onClick={() => { setModalMode('add'); resetForm(); setIsModalOpen(true) }}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-2xl font-bold text-sm shadow-md transition-all duration-300 hover:scale-[1.02] active:scale-95 whitespace-nowrap w-full sm:w-auto"
          >
            <Plus size={16} />
            Add KYC
          </button>
        </div>

        {/* Documents Grid - Light Mode */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-600 rounded-full animate-spin mb-4" />
            <span className="text-slate-500 text-xs font-black uppercase tracking-wider animate-pulse">Scanning KYC Registry...</span>
          </div>
        ) : kycRecords.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-12 text-center shadow-sm">
            <ShieldCheck className="mx-auto text-slate-350 mb-4 animate-bounce" size={60} />
            <h3 className="text-xl font-bold text-slate-700 mb-2">No KYC Records Found</h3>
            <p className="text-slate-450 text-sm max-w-md mx-auto mb-6">
              Establish a secure records repository by uploading document credentials for your clients.
            </p>
            <button 
              onClick={() => { setModalMode('add'); resetForm(); setIsModalOpen(true) }}
              className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all"
            >
              Add Your First Record
            </button>
          </div>
        ) : (
          <>
          {/* ── Desktop Table View ── */}
          <div className="hidden lg:block bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-4 py-3.5 text-[10px] font-black uppercase tracking-wider text-slate-500">Client Name</th>
                    <th className="text-left px-4 py-3.5 text-[10px] font-black uppercase tracking-wider text-slate-500">Document Type</th>
                    <th className="text-left px-4 py-3.5 text-[10px] font-black uppercase tracking-wider text-slate-500">Document Number</th>
                    <th className="text-left px-4 py-3.5 text-[10px] font-black uppercase tracking-wider text-slate-500">Preview</th>
                    <th className="text-left px-4 py-3.5 text-[10px] font-black uppercase tracking-wider text-slate-500">Remarks</th>
                    <th className="text-center px-4 py-3.5 text-[10px] font-black uppercase tracking-wider text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {kycRecords.map((record) => (
                    <tr key={record._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3.5">
                        <span className="font-bold text-slate-800">{record.clientName}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                          record.documentType === 'Aadhar' ? 'bg-teal-50 text-teal-700' :
                          record.documentType === 'PAN' ? 'bg-orange-50 text-orange-700' :
                          record.documentType === 'GST' ? 'bg-pink-50 text-pink-700' :
                          'bg-slate-50 text-slate-600'
                        }`}>
                          {record.documentType}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="font-mono text-xs font-semibold text-slate-600">
                          {record.documentNumber || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          {record.documentType === 'Aadhar' ? (
                            <>
                              {record.aadharFront ? (
                                <button onClick={() => setPreviewUrl(record.aadharFront)} className="flex items-center gap-1 px-2 py-1 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-lg text-[10px] font-bold transition-all" title="View Front">
                                  <Eye size={10} /> Front
                                </button>
                              ) : (
                                <span className="text-[10px] text-slate-400 italic">No Front</span>
                              )}
                              {record.aadharBack ? (
                                <button onClick={() => setPreviewUrl(record.aadharBack)} className="flex items-center gap-1 px-2 py-1 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-lg text-[10px] font-bold transition-all" title="View Back">
                                  <Eye size={10} /> Back
                                </button>
                              ) : (
                                <span className="text-[10px] text-slate-400 italic">No Back</span>
                              )}
                            </>
                          ) : record.documentFile ? (
                            <button onClick={() => setPreviewUrl(record.documentFile)} className="flex items-center gap-1 px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-[10px] font-bold transition-all" title="View Document">
                              <Eye size={10} /> View File
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">No file</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 max-w-[200px]">
                        {record.remarks ? (
                          <span className="text-xs text-slate-500 line-clamp-1">{record.remarks}</span>
                        ) : (
                          <span className="text-xs text-slate-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => handleEdit(record)} className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all" title="Edit">
                            <Edit3 size={13} className="text-slate-600" />
                          </button>
                          <button onClick={() => handleDelete(record._id)} className="p-1.5 bg-rose-50 hover:bg-rose-100 rounded-lg transition-all" title="Delete">
                            <Trash2 size={13} className="text-rose-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Mobile Card View ── */}
          <div className="lg:hidden grid grid-cols-1 gap-2">
            {kycRecords.map((record) => (
              <div key={record._id} className="bg-white border border-slate-200 rounded-2xl p-2.5 shadow-sm">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider ${
                      record.documentType === 'Aadhar' ? 'bg-teal-50 text-teal-700 border border-teal-100' :
                      record.documentType === 'PAN' ? 'bg-orange-50 text-orange-700 border border-orange-100' :
                      record.documentType === 'GST' ? 'bg-pink-50 text-pink-700 border border-pink-100' :
                      'bg-slate-50 text-slate-600 border border-slate-150'
                    }`}>
                      {record.documentType}
                    </span>
                    {record.documentNumber && (
                      <span className="text-[9px] text-slate-500 font-mono font-bold">{record.documentNumber}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-0.5">
                    <button onClick={() => handleEdit(record)} className="p-1 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all" title="Edit">
                      <Edit3 size={11} className="text-slate-600" />
                    </button>
                    <button onClick={() => handleDelete(record._id)} className="p-1 bg-rose-50 hover:bg-rose-100 rounded-lg transition-all" title="Delete">
                      <Trash2 size={11} className="text-rose-600" />
                    </button>
                  </div>
                </div>

                {record.remarks && (
                  <p className="text-[10px] text-slate-500 mb-1.5 bg-slate-50 p-1.5 rounded-lg border border-slate-100">{record.remarks}</p>
                )}

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                  <h3 className="text-sm font-bold text-slate-800 truncate">{record.clientName}</h3>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {record.documentType === 'Aadhar' ? (
                      <>
                        {record.aadharFront ? (
                          <button onClick={() => setPreviewUrl(record.aadharFront)} className="flex items-center gap-1 px-2 py-1 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-lg text-[9px] font-bold transition-all">
                            <Eye size={10} /> Front
                          </button>
                        ) : (
                          <span className="text-[9px] text-slate-400 italic">No Front</span>
                        )}
                        {record.aadharBack ? (
                          <button onClick={() => setPreviewUrl(record.aadharBack)} className="flex items-center gap-1 px-2 py-1 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-lg text-[9px] font-bold transition-all">
                            <Eye size={10} /> Back
                          </button>
                        ) : (
                          <span className="text-[9px] text-slate-400 italic">No Back</span>
                        )}
                      </>
                    ) : record.documentFile ? (
                      <button onClick={() => setPreviewUrl(record.documentFile)} className="flex items-center gap-1 px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-[9px] font-bold transition-all">
                        <Eye size={10} /> View File
                      </button>
                    ) : (
                      <span className="text-[9px] text-slate-400 italic">No file</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          </>
        )}
      </div>

      {/* View Document Dialog Overlay - Light Mode Lightbox */}
      {previewUrl && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-4xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden relative flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <span className="text-sm font-black uppercase tracking-widest text-slate-500">Document Preview</span>
              <div className="flex items-center gap-2">
                <a 
                  href={`${API_URL}${previewUrl}`} 
                  download
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-lg text-xs font-bold transition-all"
                >
                  <FileDown size={14} />
                  Download
                </a>
                <a 
                  href={`${API_URL}${previewUrl}`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold transition-all"
                >
                  Open in New Tab
                </a>
                <button 
                  onClick={() => setPreviewUrl(null)} 
                  className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-200 rounded-xl transition-all text-lg font-bold"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="flex-1 bg-slate-100 flex items-center justify-center p-6 overflow-auto">
              {previewUrl.toLowerCase().endsWith('.pdf') ? (
                <iframe 
                  src={`${API_URL}${previewUrl}`} 
                  title="PDF Document" 
                  className="w-full h-[60vh] border-0 rounded-xl"
                />
              ) : (
                <img 
                  src={`${API_URL}${previewUrl}`} 
                  alt="KYC Document Preview" 
                  className="max-w-full max-h-[60vh] object-contain rounded-xl shadow-lg border border-slate-200"
                />
              )}\n            </div>
          </div>
        </div>
      )}

      {/* ── Add / Edit KYC Modal ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-2 md:p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl md:rounded-2xl shadow-2xl max-w-2xl w-full max-h-[95vh] overflow-hidden flex flex-col">

            {/* Gradient Header */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-3 md:p-4 text-white flex-shrink-0">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg md:text-xl font-bold">
                    {modalMode === 'add' ? 'Store Client KYC' : 'Edit KYC Record'}
                  </h2>
                  <p className="text-purple-200 text-xs mt-0.5">
                    {modalMode === 'add'
                      ? 'Add a new verified document record for your client.'
                      : 'Update the details of the existing KYC record.'}
                  </p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-white hover:bg-white/20 rounded-lg p-1.5 md:p-2 transition cursor-pointer flex-shrink-0"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5">

                {/* Section 1 — Client Information */}
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-indigo-200 rounded-xl p-4 md:p-5">
                  <h3 className="text-sm md:text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <span className="bg-indigo-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-black">1</span>
                    Client Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                        Client Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Enter client's full name"
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-gray-800 placeholder-gray-400 font-medium transition"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">Document Type</label>
                      <select
                        value={documentType}
                        onChange={(e) => { setDocumentType(e.target.value); resetFormFiles() }}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-gray-800 font-medium transition cursor-pointer"
                      >
                        <option value="Aadhar">Aadhar Card</option>
                        <option value="PAN">PAN Card</option>
                        <option value="GST">GST Document</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">Document Number</label>
                      <input
                        type="text"
                        placeholder="e.g. 1234 5678 9012"
                        value={documentNumber}
                        onChange={(e) => setDocumentNumber(e.target.value)}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-gray-800 placeholder-gray-400 font-medium font-mono transition"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2 — Document Upload */}
                <div className="bg-gradient-to-r from-slate-50 to-gray-50 border-2 border-gray-200 rounded-xl p-4 md:p-5">
                  <h3 className="text-sm md:text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <span className="bg-indigo-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-black">2</span>
                    Document Upload
                  </h3>

                  {documentType === 'Aadhar' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Front */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-2">Aadhar — Front Side</label>
                        <label className={`flex flex-col items-center justify-center gap-2 w-full border-2 border-dashed rounded-xl p-4 cursor-pointer transition-all ${aadharFront ? 'border-green-400 bg-green-50' : 'border-gray-300 bg-white hover:border-indigo-400 hover:bg-indigo-50'}`}>
                          {uploadingFront ? (
                            <div className="w-5 h-5 border-2 border-indigo-500/30 border-t-indigo-600 rounded-full animate-spin" />
                          ) : aadharFront ? (
                            <>
                              <svg className="w-7 h-7 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="text-xs font-bold text-green-700">Front Uploaded ✓</span>
                            </>
                          ) : (
                            <>
                              <Upload size={22} className="text-gray-400" />
                              <span className="text-xs font-semibold text-gray-500">Click to upload front</span>
                              <span className="text-[10px] text-gray-400">Image or PDF</span>
                            </>
                          )}
                          <input type="file" accept="image/*,application/pdf" onChange={(e) => handleFileUpload(e, 'front')} className="hidden" />
                        </label>
                      </div>
                      {/* Back */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-2">Aadhar — Back Side</label>
                        <label className={`flex flex-col items-center justify-center gap-2 w-full border-2 border-dashed rounded-xl p-4 cursor-pointer transition-all ${aadharBack ? 'border-green-400 bg-green-50' : 'border-gray-300 bg-white hover:border-indigo-400 hover:bg-indigo-50'}`}>
                          {uploadingBack ? (
                            <div className="w-5 h-5 border-2 border-indigo-500/30 border-t-indigo-600 rounded-full animate-spin" />
                          ) : aadharBack ? (
                            <>
                              <svg className="w-7 h-7 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="text-xs font-bold text-green-700">Back Uploaded ✓</span>
                            </>
                          ) : (
                            <>
                              <Upload size={22} className="text-gray-400" />
                              <span className="text-xs font-semibold text-gray-500">Click to upload back</span>
                              <span className="text-[10px] text-gray-400">Image or PDF</span>
                            </>
                          )}
                          <input type="file" accept="image/*,application/pdf" onChange={(e) => handleFileUpload(e, 'back')} className="hidden" />
                        </label>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-2">
                        {documentType} Document <span className="text-gray-400">(Image or PDF)</span>
                      </label>
                      <label className={`flex flex-col items-center justify-center gap-3 w-full border-2 border-dashed rounded-xl p-6 cursor-pointer transition-all ${documentFile ? 'border-green-400 bg-green-50' : 'border-gray-300 bg-white hover:border-indigo-400 hover:bg-indigo-50'}`}>
                        {uploadingFile ? (
                          <div className="w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-600 rounded-full animate-spin" />
                        ) : documentFile ? (
                          <>
                            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-sm font-bold text-green-700">Document Uploaded ✓</span>
                          </>
                        ) : (
                          <>
                            <Upload size={26} className="text-gray-400" />
                            <span className="text-sm font-semibold text-gray-500">Click to upload {documentType} document</span>
                            <span className="text-xs text-gray-400">Supports: JPG, PNG, PDF</span>
                          </>
                        )}
                        <input type="file" accept="image/*,application/pdf" onChange={(e) => handleFileUpload(e, 'file')} className="hidden" />
                      </label>
                    </div>
                  )}
                </div>

                {/* Remarks */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Remarks / Notes</label>
                  <textarea
                    rows={3}
                    placeholder="Additional information about this client's document..."
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-gray-800 placeholder-gray-400 font-medium text-sm transition resize-none"
                  />
                </div>
              </div>

              {/* Sticky Footer */}
              <div className="flex gap-3 p-4 md:p-5 border-t border-gray-200 bg-white flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl font-bold text-sm transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-bold text-sm shadow-md transition-all hover:scale-[1.02] active:scale-95"
                >
                  {modalMode === 'add' ? '✓ Save KYC Record' : '✓ Update Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )

  function resetFormFiles() {
    setAadharFront('')
    setAadharBack('')
    setDocumentFile('')
  }
}

export default KycZone

