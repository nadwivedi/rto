import React, { useMemo, useState } from 'react'
import { toast } from 'react-toastify'

// FORM 23 - Certificate of Registration, filled from a vehicle RC search (raw Vahan fields).
// Anything the search did not return stays empty and can be typed in by hand.

const STATES = {
  AN: 'Andaman & Nicobar', AP: 'Andhra Pradesh', AR: 'Arunachal Pradesh', AS: 'Assam', BR: 'Bihar',
  CG: 'Chhattisgarh', CH: 'Chandigarh', DD: 'Daman & Diu', DL: 'Delhi', DN: 'Dadra & Nagar Haveli',
  GA: 'Goa', GJ: 'Gujarat', HP: 'Himachal Pradesh', HR: 'Haryana', JH: 'Jharkhand',
  JK: 'Jammu & Kashmir', KA: 'Karnataka', KL: 'Kerala', LA: 'Ladakh', LD: 'Lakshadweep',
  MH: 'Maharashtra', ML: 'Meghalaya', MN: 'Manipur', MP: 'Madhya Pradesh', MZ: 'Mizoram',
  NL: 'Nagaland', OD: 'Odisha', OR: 'Odisha', PB: 'Punjab', PY: 'Puducherry', RJ: 'Rajasthan',
  SK: 'Sikkim', TN: 'Tamil Nadu', TR: 'Tripura', TS: 'Telangana', UK: 'Uttarakhand',
  UP: 'Uttar Pradesh', WB: 'West Bengal'
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const val = (v) => {
  if (v === undefined || v === null || typeof v === 'object') return ''
  const s = String(v).trim()
  return s.toUpperCase() === 'NA' ? '' : s
}

// "27-11-2040" -> "27-Nov-2040"; other formats are kept as they are
const fmtDate = (v) => {
  const s = val(v)
  const m = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/)
  if (!m || +m[2] < 1 || +m[2] > 12) return s
  return `${m[1].padStart(2, '0')}-${MONTHS[+m[2] - 1]}-${m[3]}`
}

const today = () => {
  const d = new Date()
  return `${String(d.getDate()).padStart(2, '0')}-${MONTHS[d.getMonth()]}-${d.getFullYear()}`
}

// key -> raw RC fields to try in order (first non-empty wins). `date` fields are formatted.
const FIELDS = {
  stateName: { label: 'Government of' },
  office: { label: 'Motor Vehicles Department' },
  regnNo: { label: 'Registration No', from: ['REGN_NO'] },
  regnDate: { label: 'Registration Date', from: ['REGN_DT'], date: true },
  vehicleDesc: { label: 'Description of Vehicle', from: ['VEHICLE_CLASS', 'VH_CLASS_DESC'] },
  purpose: { label: 'Purpose For Printing RC' },
  dealer: { label: "Dealer's Name & Address", from: ['DEALER_DETAILS', 'DEALER_NAME'], wide: true },
  ownerName: { label: 'Owner Name', from: ['OWNER_NAME'] },
  relation: { label: 'Son/wife/daughter of', from: ['F_NAME'] },
  permanentAddress: { label: 'Full Address: (Permanent)', from: ['PERMANENT_ADDRESS'], wide: true },
  temporaryAddress: { label: 'Full Address: (Temporary)', from: ['PRESENT_ADDRESS'], wide: true },
  fitUpto: { label: 'Fitness UpTo', from: ['FIT_UPTO'], date: true },
  taxUpto: { label: 'Tax UpTo', from: ['TAX_UPTO'], date: true },
  ownerSerial: { label: 'Owner Serial No', from: ['OWNER_SERIAL_NO'] },
  vehicleClass: { label: 'Class of Vehicle', from: ['VEHICLE_CLASS', 'VH_CLASS_DESC'] },
  linkVehicle: { label: 'Link Vehicle No' },
  ownership: { label: 'Ownership', from: ['OWNERSHIP_TYPE', 'OWNER_CD_DESC'] },
  norms: { label: 'Norms', from: ['FUEL_NORMS', 'NORMS_DESC'] },
  maker: { label: "Maker's Name", from: ['MAKER_DESC'] },
  frontHsrp: { label: 'Front HSRP No', from: ['FRONT_HSRP_NO'] },
  rearHsrp: { label: 'Rear HSRP No', from: ['REAR_HSRP_NO'] },
  bodyType: { label: 'Type of Body', from: ['BODY_TYPE_DESC'] },
  manuMonthYr: { label: 'Month/Year of Manuf.', from: ['MANU_MONTH_YR'] },
  cylinders: { label: 'No of Cylinders', from: ['NO_OF_CYLINDERS', 'NO_CYL', 'NO_CYLINDERS', 'NO_OF_CYL'] },
  chassis: { label: 'Chassis No', from: ['CHASI_NO'] },
  engine: { label: 'Engine No', from: ['ENG_NO'] },
  fuel: { label: 'Fuel', from: ['FUEL_DESC'] },
  hp: { label: 'Horse Power(BHP)', from: ['HORSE_POWER', 'HP'] },
  cc: { label: 'Cubic Capacity', from: ['CUBIC_CAPACITY'] },
  makerClass: { label: "Maker's Classification", from: ['MAKER_MODEL'] },
  wheelBase: { label: 'Wheel base', from: ['WHEELBASE', 'WHEEL_BASE'] },
  seating: { label: 'Seating Cap(in all)', from: ['SEATING_CAPACITY'] },
  standing: { label: 'Standing Cap', from: ['STANDING_CAPACITY'] },
  sleeper: { label: 'Sleeper Cap', from: ['SLEEPER_CAPACITY'] },
  unladen: { label: 'Unladen Wt (kgs)', from: ['UNLADEN_WEIGHT'] },
  colour: { label: 'Colour', from: ['COLOR'] },
  laden: { label: 'Laden/GV Wt (kgs)', from: ['LADEN_WEIGHT'] },
  otherCriteria: { label: 'Other Criteria' },
  serviceType: { label: 'Service Type' },
  acFitted: { label: 'AC Fitted' },
  purchaseAs: { label: 'Vehicle Purchase As' },
  gvwManuf: { label: 'By Manuf.' },
  gvwRegd: { label: 'As Regd.' },
  frontDesc: {}, frontWt: {}, rearDesc: {}, rearWt: {}, otherDesc: {}, otherWt: {}, tandemDesc: {}, tandemWt: {},
  financer: { label: 'Hypothecation in favour of', from: ['FINANCER_DETAILS'], wide: true },
  hypoDate: { label: 'w.e.f.' },
  purchaseDate: { label: 'Purchase dt', from: ['PURCHASE_DT', 'PURCHASE_DATE'], date: true },
  saleAmount: { label: 'Sale Amt', from: ['SALE_AMT', 'SALE_AMOUNT'] },
  ottDate: { label: 'OTT Date' },
  receipt: { label: 'Amount/Rcpt No' },
  taxUpto2: { label: 'TaxUpTo', from: ['TAX_UPTO'], date: true },
  govtPvt: { label: 'Vehicle is Govt./ Pvt.' },
  taxExempted: { label: 'Tax Exempted or Not' },
  approvalDate: { label: 'Date of Approval' },
  previousOwner: { label: 'Previous Owner' },
  previousRegn: { label: 'Previous RegNo', from: ['PREV_REGN_NO'] },
  oldState: { label: 'Old State' },
  entryDate: { label: 'Entry Date' },
  transferDate: { label: 'Transfer Date' },
  conversionDate: { label: 'Conversion Date' },
  printDate: { label: 'Date' },
  signDate: { label: 'Date' }
}

const KEYS = Object.keys(FIELDS)
const RC_KEYS = KEYS.filter((k) => FIELDS[k].from)
const emptyForm = () => Object.fromEntries(KEYS.map((k) => [k, '']))

const fromRc = (d) => {
  const form = emptyForm()
  if (!d) return { ...form, printDate: today(), signDate: today() }
  for (const k of RC_KEYS) {
    const raw = FIELDS[k].from.map((f) => val(d[f])).find(Boolean) || ''
    form[k] = FIELDS[k].date ? fmtDate(raw) : raw
  }
  const regNo = val(d.REGN_NO)
  const stateCode = (val(d.STATE_CD) || regNo.slice(0, 2)).toUpperCase().slice(0, 2)
  form.stateName = (STATES[stateCode] || val(d.STATE_NAME)).toUpperCase()
  form.office = val(d.REGISTERED_AT).split(',')[0].trim().toUpperCase()
  form.printDate = today()
  form.signDate = today()
  return form
}

const FONT = 'Arial, Helvetica, sans-serif'
const cell = { padding: '1px 3px', verticalAlign: 'top', fontSize: '11.5px', lineHeight: 1.35 }
const labelCell = { ...cell, fontWeight: 'bold', whiteSpace: 'nowrap' }
const heading = { fontWeight: 'bold', fontSize: '12.5px', margin: '6px 0 2px' }

/**
 * The printable sheet. `edit` renders inputs (screen); without it the values are plain text (print).
 */
const Sheet = ({ v, edit, onChange }) => {
  const field = (k) => {
    if (!edit) return <span>{v[k]}</span>
    const style = {
      width: '100%', border: 'none', borderBottom: '1px dashed #cbd5e1', outline: 'none', font: 'inherit',
      padding: '0 2px', background: v[k] ? 'transparent' : '#fef9c3', resize: 'vertical'
    }
    return FIELDS[k].wide ? (
      <textarea name={k} value={v[k]} onChange={onChange} rows={2} style={style} />
    ) : (
      <input name={k} value={v[k]} onChange={onChange} style={style} />
    )
  }
  const pair = (k) => [
    <td key={`${k}-l`} style={labelCell}>{FIELDS[k].label}</td>,
    <td key={`${k}-v`} style={cell}>
      <div style={{ display: 'flex', gap: '3px' }}><span>:</span><div style={{ flex: 1 }}>{field(k)}</div></div>
    </td>
  ]
  const row = (a, b) => <tr key={a}>{pair(a)}{b ? pair(b) : <><td /><td /></>}</tr>
  const wideRow = (k) => (
    <tr key={k}>
      <td style={labelCell}>{FIELDS[k].label}</td>
      <td style={cell} colSpan={3}>
        <div style={{ display: 'flex', gap: '3px' }}><span>:</span><div style={{ flex: 1 }}>{field(k)}</div></div>
      </td>
    </tr>
  )
  const cols = (
    <colgroup>
      <col style={{ width: '22%' }} /><col style={{ width: '28%' }} /><col style={{ width: '22%' }} /><col style={{ width: '28%' }} />
    </colgroup>
  )
  const table = (rows) => (
    <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>{cols}<tbody>{rows}</tbody></table>
  )
  // Inline value inside a sentence; keeps a blank gap only when there is nothing to print
  const inline = (k, width) => (
    <span style={{ display: 'inline-block', minWidth: edit || !v[k] ? width : 0, textAlign: 'left', verticalAlign: 'bottom' }}>
      {field(k)}
    </span>
  )

  return (
    <div style={{ fontFamily: FONT, color: '#000', fontSize: '11.5px' }}>
      <div style={{ textAlign: 'center', marginBottom: '8px' }}>
        <div style={{ fontSize: '16px', fontWeight: 'bold', textDecoration: 'underline' }}>
          GOVERNMENT OF {inline('stateName', '180px')}
        </div>
        <div style={{ fontSize: '13px', fontWeight: 'bold', marginTop: '3px' }}>
          Motor Vehicles Department {inline('office', '160px')}
        </div>
        <div style={{ fontSize: '13px', fontWeight: 'bold' }}>FORM 23</div>
        <div style={{ fontSize: '13px', fontWeight: 'bold' }}>CERTIFICATE OF REGISTRATION</div>
      </div>

      {table([
        row('regnNo', 'regnDate'),
        row('vehicleDesc', 'purpose'),
        wideRow('dealer'),
        row('ownerName', 'relation'),
        wideRow('permanentAddress'),
        wideRow('temporaryAddress'),
        row('fitUpto', 'taxUpto'),
        row('ownerSerial')
      ])}

      <div style={{ ...heading, textDecoration: 'underline' }}>Detailed Description</div>
      {table([
        row('vehicleClass', 'linkVehicle'),
        row('ownership', 'norms'),
        row('maker'),
        row('frontHsrp', 'rearHsrp'),
        row('bodyType', 'manuMonthYr'),
        row('cylinders', 'chassis'),
        row('engine', 'fuel'),
        row('hp', 'cc'),
        row('makerClass', 'wheelBase'),
        row('seating', 'standing'),
        row('sleeper', 'unladen'),
        row('colour', 'laden'),
        row('otherCriteria', 'serviceType'),
        row('acFitted', 'purchaseAs')
      ])}

      <div style={{ ...heading, textAlign: 'center', borderBottom: '1px solid #000', paddingBottom: '1px' }}>
        Additional Particulars of all transport vehicles other than motor cabs (Gross Vehicle Weight)
      </div>
      {table([row('gvwManuf', 'gvwRegd')])}
      <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', marginTop: '2px' }}>
        <colgroup><col style={{ width: '22%' }} /><col style={{ width: '39%' }} /><col style={{ width: '39%' }} /></colgroup>
        <tbody>
          <tr>
            <td style={labelCell} />
            <td style={{ ...labelCell, textAlign: 'center' }}>Description</td>
            <td style={{ ...labelCell, textAlign: 'center' }}>Weight(in kgs)</td>
          </tr>
          {[['a) Front:', 'front'], ['b) Rear:', 'rear'], ['c) Other:', 'other'], ['d) Tandem:', 'tandem']].map(([label, k]) => (
            <tr key={k}>
              <td style={labelCell}>{label}</td>
              <td style={{ ...cell, textAlign: 'center' }}>{field(`${k}Desc`)}</td>
              <td style={{ ...cell, textAlign: 'center' }}>{field(`${k}Wt`)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ margin: '6px 0 2px', lineHeight: 1.45 }}>
        <b>The motor vehicle above described is subject to Hypothecation in favour of</b>{' '}
        {edit ? <div style={{ marginTop: '2px' }}>{field('financer')}</div> : <span>{v.financer}</span>}
        {' '}w.e.f. {inline('hypoDate', '110px')}.
      </div>
      {table([
        row('purchaseDate', 'saleAmount'),
        row('ottDate', 'receipt'),
        row('taxUpto2', 'govtPvt'),
        row('taxExempted', 'approvalDate')
      ])}

      <div style={heading}>Other State/Transfer/Conversion/Reassign Details</div>
      {table([
        row('previousOwner', 'previousRegn'),
        row('oldState', 'entryDate'),
        row('transferDate', 'conversionDate')
      ])}

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '18px', fontSize: '11px' }}>
        <div>
          <div>Date : {inline('printDate', '110px')}</div>
          <div>Taxation Particulars / Advance Registration Mark Fee Details</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div>Signature of Registering Authority</div>
          <div>Date : {inline('signDate', '110px')}</div>
        </div>
      </div>
    </div>
  )
}

const Form23Modal = ({ vehicleData, onClose }) => {
  const autoFilled = useMemo(() => fromRc(vehicleData), [vehicleData])
  const [form, setForm] = useState(autoFilled)
  const [printing, setPrinting] = useState(false)

  const filledFromRc = RC_KEYS.filter((k) => autoFilled[k]).length
  const emptyCount = KEYS.filter((k) => !form[k]).length

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value.toUpperCase() }))
  }

  const handlePrint = async (blank = false) => {
    // Popup must open inside the click, before the async import
    const w = window.open('', '_blank')
    if (!w) {
      toast.error('Please allow pop-ups to print Form 23')
      return
    }
    setPrinting(true)
    try {
      const { renderToStaticMarkup } = await import('react-dom/server')
      const html = renderToStaticMarkup(<Sheet v={blank ? emptyForm() : form} />)
      const title = (blank ? 'Form 23 - Certificate of Registration' : `Form 23 - ${form.regnNo || 'Certificate of Registration'}`)
        .replace(/[<>&"]/g, '')
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
      console.error('Form 23 print error:', err)
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
            <Sheet v={form} edit onChange={handleChange} />
          </div>
        </div>

        <div className='w-full lg:w-80 bg-white rounded-2xl p-5 shadow-xl border border-gray-100 h-fit lg:sticky top-2 flex flex-col gap-4'>
          <div className='flex items-center justify-between pb-3 border-b border-gray-200'>
            <div>
              <h3 className='font-bold text-gray-900 text-lg'>Form 23</h3>
              <p className='text-xs text-gray-500'>Certificate of Registration</p>
            </div>
            <button onClick={onClose} className='p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer' aria-label='Close'>
              <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
              </svg>
            </button>
          </div>

          <div className='bg-sky-50/70 p-3.5 rounded-xl border border-sky-100 text-xs text-sky-900 space-y-1'>
            {vehicleData ? (
              <p><b>{filledFromRc}</b> of {RC_KEYS.length} RC fields filled automatically from the RC search{autoFilled.regnNo ? ` for ${autoFilled.regnNo}` : ''}.</p>
            ) : (
              <p>Blank Form 23. Type the details in the form.</p>
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
            <button
              onClick={() => setForm({ ...emptyForm(), printDate: today(), signDate: today() })}
              className={`${btn} bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200`}
            >
              Empty Form (fill manually)
            </button>
            {vehicleData && (
              <button onClick={() => setForm(autoFilled)} className={`${btn} bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200`}>
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

export default Form23Modal
