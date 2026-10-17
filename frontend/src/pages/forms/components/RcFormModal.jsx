import React, { useState } from 'react'
import { toast } from 'react-toastify'
import { RC_FORMS, RC_FORM_CSS, rcFieldCount, emptyRcForm } from './rcForms'

/**
 * Editable RC form (Form 23 or Temporary RC) filled from a vehicle RC search. `vehicleData` null
 * opens a blank form. Both forms are kept, so switching tabs does not lose typed changes.
 */
const RcFormModal = ({ vehicleData, type: initialType = 'form23', onClose }) => {
  const [type, setType] = useState(initialType)
  const [forms, setForms] = useState(() => ({
    [initialType]: vehicleData ? RC_FORMS[initialType].fromRc(vehicleData) : RC_FORMS[initialType].blank()
  }))
  const [printing, setPrinting] = useState(false)

  const def = RC_FORMS[type]
  const form = forms[type] || (vehicleData ? def.fromRc(vehicleData) : def.blank())
  const autoFilled = vehicleData ? def.fromRc(vehicleData) : null
  const keys = Object.keys(def.fields)
  const filledFromRc = autoFilled ? keys.filter((k) => def.fields[k].from && autoFilled[k]).length : 0
  const emptyCount = keys.filter((k) => !form[k]).length

  const setForm = (next) => setForms((prev) => ({ ...prev, [type]: next }))

  const switchType = (next) => {
    if (next === type) return
    setForms((prev) => (prev[next] ? prev : { ...prev, [next]: vehicleData ? RC_FORMS[next].fromRc(vehicleData) : RC_FORMS[next].blank() }))
    setType(next)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForms((prev) => ({ ...prev, [type]: { ...(prev[type] || form), [name]: value.toUpperCase() } }))
  }

  const handlePrint = async (blank = false) => {
    // Popup must open inside the click, before the async import
    const w = window.open('', '_blank')
    if (!w) {
      toast.error(`Please allow pop-ups to print ${def.title}`)
      return
    }
    setPrinting(true)
    try {
      const { renderToStaticMarkup } = await import('react-dom/server')
      const html = renderToStaticMarkup(def.sheet({ v: blank ? emptyRcForm(type) : form }))
      const title = (blank || !form.regnNo ? def.printTitle : `${def.title} - ${form.regnNo}`).replace(/[<>&"]/g, '')
      w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${title}</title>
        <style>
          * { box-sizing: border-box; }
          body { margin: 0; padding: 12mm 14mm; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          @page { size: A4; margin: 0; }
        </style></head><body>${html}</body></html>`)
      w.document.close()
      w.focus()
      setTimeout(() => {
        w.print()
        w.close()
      }, 300)
    } catch (err) {
      console.error(`${def.title} print error:`, err)
      w.close()
    } finally {
      setPrinting(false)
    }
  }

  const btn = 'w-full py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer border disabled:opacity-60'

  return (
    <div className='fixed inset-0 bg-black/60 backdrop-blur-xs flex items-start justify-center z-[70] overflow-y-auto pt-2 pb-6 px-2 print:hidden'>
      <div className='w-full max-w-[1280px] flex flex-col lg:flex-row gap-4'>
        <div className='flex-1 bg-gray-200/80 rounded-2xl p-3 shadow-inner overflow-x-auto'>
          <div className='bg-white shadow-2xl mx-auto rounded-sm' style={{ width: '210mm', minHeight: '297mm', padding: '12mm 14mm' }}>
            <style>{RC_FORM_CSS}</style>
            {def.sheet({ v: form, edit: true, onChange: handleChange })}
          </div>
        </div>

        <div className='w-full lg:w-80 bg-white rounded-2xl p-5 shadow-xl border border-gray-100 h-fit lg:sticky top-2 flex flex-col gap-4'>
          <div className='flex items-center justify-between pb-3 border-b border-gray-200'>
            <div>
              <h3 className='font-bold text-gray-900 text-lg'>{def.title}</h3>
              <p className='text-xs text-gray-500'>{def.subtitle}</p>
            </div>
            <button onClick={onClose} className='p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer' aria-label='Close'>
              <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
              </svg>
            </button>
          </div>

          <div className='grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-xl' role='tablist'>
            {Object.entries(RC_FORMS).map(([key, f]) => (
              <button
                key={key}
                role='tab'
                aria-selected={key === type}
                onClick={() => switchType(key)}
                className={`py-2 rounded-lg text-xs font-bold transition cursor-pointer ${key === type ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
              >
                {f.title}
              </button>
            ))}
          </div>

          <div className='bg-sky-50/70 p-3.5 rounded-xl border border-sky-100 text-xs text-sky-900 space-y-1'>
            {vehicleData ? (
              <p><b>{filledFromRc}</b> of {rcFieldCount(type)} RC fields filled automatically from the RC search{autoFilled.regnNo ? ` for ${autoFilled.regnNo}` : ''}.</p>
            ) : (
              <p>Blank {def.title}. Type the details in the form.</p>
            )}
            <p>
              <span className='inline-block w-3 h-3 align-middle rounded-sm bg-yellow-100 border border-yellow-300 mr-1' />
              <b>{emptyCount}</b> empty fields are highlighted. Click any field to type or correct it.
            </p>
          </div>

          <div className='flex flex-col gap-2.5'>
            <button
              onClick={() => handlePrint(false)}
              disabled={printing}
              className='w-full py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60'
            >
              <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z' />
              </svg>
              Print / Save PDF
            </button>
            <button onClick={() => handlePrint(true)} disabled={printing} className={`${btn} bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300`}>
              Print Blank Form
            </button>
            <button onClick={() => setForm(def.blank())} className={`${btn} bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200`}>
              Empty Form (fill manually)
            </button>
            {vehicleData && (
              <button onClick={() => setForm(def.fromRc(vehicleData))} className={`${btn} bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200`}>
                Refill from RC Search
              </button>
            )}
          </div>

          <p className='text-[11px] text-gray-400 text-center border-t border-gray-100 pt-3'>
            Fields not available in the RC search are left empty.
          </p>
        </div>
      </div>
    </div>
  )
}

export default RcFormModal
