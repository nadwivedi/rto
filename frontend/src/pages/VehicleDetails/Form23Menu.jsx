import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import axios from 'axios'
import { toast } from 'react-toastify'
import { FileCheck, ChevronDown, RefreshCw } from 'lucide-react'
import Form23Modal from '../forms/components/Form23Modal'

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'

/**
 * "Form 23" dropdown for a saved vehicle search row: open the form filled from the saved
 * RC data (no API credit) or a blank one. The menu and the form are portalled to <body>
 * so the table's scroll container does not clip them.
 */
const Form23Menu = ({ historyId }) => {
  const btnRef = useRef(null)
  const menuRef = useRef(null)
  const [menuPos, setMenuPos] = useState(null)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState(null) // { data } - data null = blank form

  useEffect(() => {
    if (!menuPos) return
    const close = (e) => {
      if (menuRef.current?.contains(e.target) || btnRef.current?.contains(e.target)) return
      setMenuPos(null)
    }
    const closeNow = () => setMenuPos(null)
    document.addEventListener('mousedown', close)
    window.addEventListener('scroll', closeNow, true)
    window.addEventListener('resize', closeNow)
    return () => {
      document.removeEventListener('mousedown', close)
      window.removeEventListener('scroll', closeNow, true)
      window.removeEventListener('resize', closeNow)
    }
  }, [menuPos])

  const toggleMenu = () => {
    if (menuPos) return setMenuPos(null)
    const r = btnRef.current.getBoundingClientRect()
    const width = 190
    setMenuPos({ top: r.bottom + 4, left: Math.max(8, Math.min(r.right - width, window.innerWidth - width - 8)), width })
  }

  const openFilled = async () => {
    setMenuPos(null)
    try {
      setLoading(true)
      const res = await axios.get(`${API_URL}/api/vehicle-info/history/${historyId}`, { withCredentials: true })
      if (res.data.success && res.data.data) {
        setForm({ data: res.data.data })
      } else {
        toast.error('Saved RC details not found')
      }
    } catch (err) {
      console.error('Form 23 load error:', err)
      toast.error('Failed to load saved RC details')
    } finally {
      setLoading(false)
    }
  }

  const item = 'w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-sky-50 hover:text-sky-800 transition cursor-pointer'

  return (
    <>
      <button
        ref={btnRef}
        onClick={toggleMenu}
        disabled={loading}
        className='inline-flex items-center gap-1 px-2.5 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 font-bold rounded-lg text-xs transition cursor-pointer disabled:opacity-50 whitespace-nowrap'
        title='Form 23 - Certificate of Registration'
        aria-haspopup='menu'
        aria-expanded={Boolean(menuPos)}
      >
        {loading ? <RefreshCw className='w-3.5 h-3.5 animate-spin' /> : <FileCheck className='w-3.5 h-3.5' />}
        Form 23
        <ChevronDown className='w-3 h-3' />
      </button>

      {menuPos && createPortal(
        <div
          ref={menuRef}
          role='menu'
          className='fixed z-[65] bg-white rounded-xl border border-slate-200 shadow-xl py-1 overflow-hidden'
          style={{ top: menuPos.top, left: menuPos.left, width: menuPos.width }}
        >
          <button role='menuitem' onClick={openFilled} className={item}>
            Auto-filled Form 23
            <span className='block text-[10px] font-normal text-slate-500'>From saved RC details, no credit used</span>
          </button>
          <button role='menuitem' onClick={() => { setMenuPos(null); setForm({ data: null }) }} className={item}>
            Blank Form 23
            <span className='block text-[10px] font-normal text-slate-500'>Empty form to fill manually</span>
          </button>
        </div>,
        document.body
      )}

      {form && createPortal(
        <div className='text-left'>
          <Form23Modal vehicleData={form.data} onClose={() => setForm(null)} />
        </div>,
        document.body
      )}
    </>
  )
}

export default Form23Menu
