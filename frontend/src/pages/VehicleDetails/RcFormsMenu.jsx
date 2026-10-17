import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import axios from 'axios'
import { toast } from 'react-toastify'
import { FileCheck, ChevronDown, RefreshCw } from 'lucide-react'
import RcFormModal from '../forms/components/RcFormModal'

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'

const ITEMS = [
  { type: 'form23', filled: true, label: 'Form 23', hint: 'Certificate of Registration, auto-filled' },
  { type: 'tempRc', filled: true, label: 'Temporary RC', hint: 'Temporary authorization, auto-filled' },
  { type: 'form23', filled: false, label: 'Blank Form 23', hint: 'Empty form to fill manually' },
  { type: 'tempRc', filled: false, label: 'Blank Temporary RC', hint: 'Empty form to fill manually' }
]

/**
 * "RC Forms" dropdown for a saved vehicle search row: Form 23 or Temporary RC, filled from the
 * saved RC data (no API credit) or blank. The menu and the form are portalled to <body> so the
 * table's scroll container does not clip them.
 */
const RcFormsMenu = ({ historyId }) => {
  const btnRef = useRef(null)
  const menuRef = useRef(null)
  const [menuPos, setMenuPos] = useState(null)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(null) // { type, data } - data null = blank form

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
    const width = 210
    const height = 230
    // Open upwards when there is no room below (last rows of the table)
    const top = r.bottom + 4 + height > window.innerHeight ? Math.max(8, r.top - height - 4) : r.bottom + 4
    setMenuPos({ top, left: Math.max(8, Math.min(r.right - width, window.innerWidth - width - 8)), width })
  }

  const choose = async ({ type, filled }) => {
    setMenuPos(null)
    if (!filled) return setOpen({ type, data: null })
    try {
      setLoading(true)
      const res = await axios.get(`${API_URL}/api/vehicle-info/history/${historyId}`, { withCredentials: true })
      if (res.data.success && res.data.data) {
        setOpen({ type, data: res.data.data })
      } else {
        toast.error('Saved RC details not found')
      }
    } catch (err) {
      console.error('RC form load error:', err)
      toast.error('Failed to load saved RC details')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        ref={btnRef}
        onClick={toggleMenu}
        disabled={loading}
        className='inline-flex items-center gap-1 px-2.5 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 font-bold rounded-lg text-xs transition cursor-pointer disabled:opacity-50 whitespace-nowrap'
        title='Form 23 and Temporary RC'
        aria-haspopup='menu'
        aria-expanded={Boolean(menuPos)}
      >
        {loading ? <RefreshCw className='w-3.5 h-3.5 animate-spin' /> : <FileCheck className='w-3.5 h-3.5' />}
        RC Forms
        <ChevronDown className='w-3 h-3' />
      </button>

      {menuPos && createPortal(
        <div
          ref={menuRef}
          role='menu'
          className='fixed z-[65] bg-white rounded-xl border border-slate-200 shadow-xl py-1 overflow-hidden'
          style={{ top: menuPos.top, left: menuPos.left, width: menuPos.width }}
        >
          {ITEMS.map((it, i) => (
            <button
              key={it.label}
              role='menuitem'
              onClick={() => choose(it)}
              className={`w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-sky-50 hover:text-sky-800 transition cursor-pointer ${i === 2 ? 'border-t border-slate-100' : ''}`}
            >
              {it.label}
              <span className='block text-[10px] font-normal text-slate-500'>{it.hint}</span>
            </button>
          ))}
        </div>,
        document.body
      )}

      {open && createPortal(
        <div className='text-left'>
          <RcFormModal type={open.type} vehicleData={open.data} onClose={() => setOpen(null)} />
        </div>,
        document.body
      )}
    </>
  )
}

export default RcFormsMenu
