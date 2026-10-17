import React from 'react'

// Printable RC forms filled from a vehicle RC search (raw Vahan fields). Each form has its
// fields (key -> label and the raw RC fields to try), a fromRc() mapper and a Sheet layout.
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
const pad = (n) => String(n).padStart(2, '0')

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
  return `${pad(d.getDate())}-${MONTHS[d.getMonth()]}-${d.getFullYear()}`
}

// "15-09-2026 17:58:58", as printed on the temporary RC
const nowStamp = () => {
  const d = new Date()
  return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

const keysOf = (fields) => Object.keys(fields)
const emptyOf = (fields) => Object.fromEntries(keysOf(fields).map((k) => [k, '']))

// Common part of fromRc: every field with `from`, plus the state and RTO heading
const fillFromRc = (fields, d) => {
  const form = emptyOf(fields)
  for (const k of keysOf(fields)) {
    if (!fields[k].from) continue
    const raw = fields[k].from.map((f) => val(d[f])).find(Boolean) || ''
    form[k] = fields[k].date ? fmtDate(raw) : raw
  }
  const regNo = val(d.REGN_NO)
  const stateCode = (val(d.STATE_CD) || regNo.slice(0, 2)).toUpperCase().slice(0, 2)
  form.stateName = (STATES[stateCode] || val(d.STATE_NAME)).toUpperCase()
  form.office = val(d.REGISTERED_AT).split(',')[0].trim().toUpperCase()
  return form
}

const FONT = 'Arial, Helvetica, sans-serif'

/**
 * Layout helpers shared by the sheets. `edit` renders inputs (screen, empty ones highlighted);
 * without it the values are plain text (print).
 */
const kit = (fields, { v, edit, onChange }, { boldLabels = true, colon = true, cols = [22, 28, 22, 28] } = {}) => {
  const cell = { padding: '1px 3px', verticalAlign: 'top', fontSize: '11.5px', lineHeight: 1.35 }
  const labelCell = { ...cell, fontWeight: boldLabels ? 'bold' : 'normal', whiteSpace: 'nowrap' }

  const field = (k) => {
    if (!edit) return <span>{v[k]}</span>
    const style = {
      width: '100%', border: 'none', borderBottom: '1px dashed #cbd5e1', outline: 'none', font: 'inherit',
      padding: '0 2px', background: v[k] ? 'transparent' : '#fef9c3', resize: 'vertical'
    }
    return fields[k].wide ? (
      <textarea name={k} value={v[k]} onChange={onChange} rows={2} style={style} />
    ) : (
      <input name={k} value={v[k]} onChange={onChange} style={style} />
    )
  }
  const valueCell = (k, span) => (
    <td key={`${k}-v`} style={cell} colSpan={span}>
      <div style={{ display: 'flex', gap: '3px' }}>{colon && <span>:</span>}<div style={{ flex: 1 }}>{field(k)}</div></div>
    </td>
  )
  const pair = (k) => [<td key={`${k}-l`} style={labelCell}>{fields[k].label}</td>, valueCell(k)]

  return {
    cell,
    labelCell,
    field,
    row: (a, b) => <tr key={a}>{pair(a)}{b ? pair(b) : <><td /><td /></>}</tr>,
    wideRow: (k) => <tr key={k}><td style={labelCell}>{fields[k].label}</td>{valueCell(k, 3)}</tr>,
    table: (rows) => (
      <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
        <colgroup>{cols.map((w, i) => <col key={i} style={{ width: `${w}%` }} />)}</colgroup>
        <tbody>{rows}</tbody>
      </table>
    ),
    // Inline value inside a sentence; keeps a blank gap only when there is nothing to print
    inline: (k, width) => (
      <span style={{ display: 'inline-block', minWidth: edit || !v[k] ? width : 0, textAlign: 'left', verticalAlign: 'bottom' }}>
        {field(k)}
      </span>
    )
  }
}

/* ---------------------------------- FORM 23 ---------------------------------- */

const FORM23_FIELDS = {
  stateName: {},
  office: {},
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
  financer: { from: ['FINANCER_DETAILS'], wide: true },
  hypoDate: {},
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
  printDate: {},
  signDate: {}
}

// Render functions (not components): called directly with { v, edit, onChange }
const form23Sheet = (props) => {
  const { v, edit } = props
  const { row, wideRow, table, inline, field, cell, labelCell } = kit(FORM23_FIELDS, props)
  const heading = { fontWeight: 'bold', fontSize: '12.5px', margin: '6px 0 2px' }

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

/* ------------------------- TEMPORARY AUTHORIZATION OF RC ------------------------- */

const TEMP_RC_FIELDS = {
  stateName: {},
  office: {},
  regnNo: { from: ['REGN_NO'] },
  printedDate: {},
  applNo: { label: 'Application No:', from: ['APPL_NO'] },
  ownerName: { label: 'Owner Name:', from: ['OWNER_NAME'] },
  relation: { label: 'Son/wife/daughter of:', from: ['F_NAME'] },
  ownershipType: { label: 'Ownership Type:', from: ['OWNERSHIP_TYPE', 'OWNER_CD_DESC'] },
  regnDate: { label: 'Date of Registration:', from: ['REGN_DT'], date: true },
  purchaseDate: { label: 'Purchase Date:', from: ['PURCHASE_DT', 'PURCHASE_DATE'], date: true },
  chassis: { label: 'Chassis No:', from: ['CHASI_NO'] },
  engine: { label: 'Engine No:', from: ['ENG_NO'] },
  passport: { label: 'Passport No:', from: ['PASSPORT_NO'] },
  pan: { label: 'Pan No:', from: ['PAN_NO'] },
  aadhaar: { label: 'Aadhaar No:' },
  mobile: { label: 'Mobile No:', from: ['MOBILE_NO'] },
  email: { label: 'Email ID:', from: ['EMAIL_ID'] },
  voterId: { label: 'Voter Id:', from: ['VOTER_ID'] },
  permanentAddress: { label: 'Full Address (Permanent):', from: ['PERMANENT_ADDRESS'], wide: true },
  temporaryAddress: { label: 'Full Address (Temporary):', from: ['PRESENT_ADDRESS'], wide: true },
  dealer: { label: "Dealer's Name and Address:", from: ['DEALER_DETAILS', 'DEALER_NAME'], wide: true },
  maker: { label: "Maker's Name:", from: ['MAKER_DESC'] },
  makerClass: { label: "Maker's Classification:", from: ['MAKER_MODEL'] },
  saleAmount: { label: 'Sale Amount:', from: ['SALE_AMT', 'SALE_AMOUNT'] },
  regnType: { label: 'Registration Type:' },
  norms: { label: 'Norms:', from: ['FUEL_NORMS', 'NORMS_DESC'] },
  manuMonthYr: { label: 'Month/Year of Manuf:', from: ['MANU_MONTH_YR'] },
  seating: { label: 'Seating Cap(inc. driver):', from: ['SEATING_CAPACITY'] },
  standing: { label: 'Standing Cap:', from: ['STANDING_CAPACITY'] },
  hp: { label: 'Horse Power(BHP):', from: ['HORSE_POWER', 'HP'] },
  cc: { label: 'Cubic Capacity:', from: ['CUBIC_CAPACITY'] },
  cylinders: { label: 'No of Cylinders:', from: ['NO_OF_CYLINDERS', 'NO_CYL', 'NO_CYLINDERS', 'NO_OF_CYL'] },
  wheelBase: { label: 'Wheel base:', from: ['WHEELBASE', 'WHEEL_BASE'] },
  vehicleClass: { label: 'Class of Vehicle:', from: ['VEHICLE_CLASS', 'VH_CLASS_DESC'] },
  bodyType: { label: 'Type of Body:', from: ['BODY_TYPE_DESC'] },
  fuel: { label: 'Fuel used in engine:', from: ['FUEL_DESC'] },
  colour: { label: 'Colour:', from: ['COLOR'] },
  unladen: { label: 'Unladen Weight(in kgs):', from: ['UNLADEN_WEIGHT'] },
  gvw: { label: 'GVW(in kgs):', from: ['LADEN_WEIGHT', 'GVW'] },
  acFitted: { label: 'AC Fitted:', from: ['AC_FITTED'] },
  audioFitted: { label: 'Audio Fitted:', from: ['AUDIO_FITTED'] },
  videoFitted: { label: 'Video Fitted:', from: ['VIDEO_FITTED'] },
  length: { label: 'Length (in mm):', from: ['LENGTH'] },
  width: { label: 'Width (in mm):', from: ['WIDTH'] },
  height: { label: 'Height (in mm):', from: ['HEIGHT'] },
  ownerSerial: { label: 'Owner Serial No:', from: ['OWNER_SERIAL_NO'] },
  fitUpto: { label: 'Fitness Valid Upto:', from: ['FIT_UPTO'], date: true },
  taxUpto: { label: 'Tax Paid Upto:', from: ['TAX_UPTO'], date: true },
  hypothecation: { from: ['FINANCER_DETAILS'], wide: true },
  insurance: { wide: true },
  validFrom: {},
  validTo: {},
  date: {}
}

const tempRcSheet = (props) => {
  const { v, edit } = props
  const { row, wideRow, table, inline, field } = kit(TEMP_RC_FIELDS, props, { boldLabels: false, colon: false, cols: [22, 24, 22, 32] })
  const title = { fontWeight: 'bold', fontSize: '13px' }
  const tag = { fontWeight: 'bold', textDecoration: 'underline', marginRight: '4px' }
  const para = (label, k) => (
    <div style={{ margin: '4px 0', lineHeight: 1.5 }}>
      <span style={tag}>{label}</span>
      {edit ? <div style={{ marginTop: '2px' }}>{field(k)}</div> : <span>{v[k]}</span>}
    </div>
  )

  return (
    <div style={{ fontFamily: FONT, color: '#000', fontSize: '11.5px' }}>
      <div style={{ textAlign: 'center', marginBottom: '4px' }}>
        <div style={{ fontSize: '16px', fontWeight: 'bold', textDecoration: 'underline' }}>
          GOVERNMENT OF {inline('stateName', '180px')}
        </div>
        <div style={{ ...title, marginTop: '3px' }}>[ {inline('office', '140px')} ]</div>
        <div style={{ ...title, textDecoration: 'underline', marginTop: '3px' }}>TEMPORARY AUTHORIZATION OF REGISTRATION CERTIFICATE</div>
        <div style={{ ...title, marginTop: '3px' }}>REGISTRATION NO : {inline('regnNo', '160px')}</div>
      </div>
      <div style={{ textAlign: 'right', fontWeight: 'bold', marginBottom: '8px' }}>
        Printed Date: {inline('printedDate', '150px')}
      </div>

      {table([
        wideRow('applNo'),
        wideRow('ownerName'),
        wideRow('relation'),
        row('ownershipType', 'regnDate'),
        row('purchaseDate', 'chassis'),
        row('engine', 'passport'),
        row('pan', 'aadhaar'),
        row('mobile', 'email'),
        wideRow('voterId'),
        wideRow('permanentAddress'),
        wideRow('temporaryAddress'),
        wideRow('dealer'),
        wideRow('maker'),
        wideRow('makerClass'),
        row('saleAmount', 'regnType'),
        row('norms', 'manuMonthYr'),
        row('seating', 'standing'),
        row('hp', 'cc'),
        row('cylinders', 'wheelBase'),
        row('vehicleClass', 'bodyType'),
        row('fuel', 'colour'),
        row('unladen', 'gvw'),
        row('acFitted', 'audioFitted'),
        row('videoFitted', 'length'),
        row('width', 'height'),
        row('ownerSerial', 'fitUpto'),
        wideRow('taxUpto')
      ])}

      {para('Hypothecation Details:', 'hypothecation')}
      {para('Insurance Details:', 'insurance')}
      <div style={{ margin: '4px 0', lineHeight: 1.5 }}>
        <span style={tag}>Valid up to the date with effect from :</span>
        {inline('validFrom', '100px')} To {inline('validTo', '100px')}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '36px' }}>
        <div>Date: {inline('date', '110px')}</div>
        <div>(Registering Authority)</div>
      </div>
    </div>
  )
}

const tempRcFromRc = (d) => {
  const form = fillFromRc(TEMP_RC_FIELDS, d)
  form.printedDate = nowStamp()
  form.regnType = 'TEMPORARY REGISTERED VEHICLE'
  if (form.hypothecation && !/^\(hypothecation\)/i.test(form.hypothecation)) {
    form.hypothecation = `(Hypothecation) ${form.hypothecation}`
  }
  // "THIRD PARTY Insurance From <company> vide policy certificate/covernote no <no> is valid from <from> to <upto>."
  const company = val(d.INSURANCE_COMP)
  if (company) {
    const type = val(d.INSURANCE_TYPE)
    const policy = val(d.INS_POLICY_NO) || val(d.POLICY_NO)
    const from = fmtDate(d.INSURANCE_FROM)
    const upto = fmtDate(d.INSURANCE_UPTO)
    form.insurance = [
      `${type ? `${type} ` : ''}Insurance From ${company}`,
      policy && `vide policy certificate/covernote no ${policy}`,
      from && upto ? `is valid from ${from} to ${upto}` : upto && `is valid upto ${upto}`
    ].filter(Boolean).join(' ') + '.'
  }
  return form
}

export const RC_FORMS = {
  form23: {
    title: 'Form 23',
    subtitle: 'Certificate of Registration',
    printTitle: 'Form 23 - Certificate of Registration',
    fields: FORM23_FIELDS,
    sheet: form23Sheet,
    fromRc: (d) => ({ ...fillFromRc(FORM23_FIELDS, d), printDate: today(), signDate: today() }),
    blank: () => ({ ...emptyOf(FORM23_FIELDS), printDate: today(), signDate: today() })
  },
  tempRc: {
    title: 'Temporary RC',
    subtitle: 'Temporary Authorization of Registration Certificate',
    printTitle: 'Temporary Authorization of Registration Certificate',
    fields: TEMP_RC_FIELDS,
    sheet: tempRcSheet,
    fromRc: tempRcFromRc,
    blank: () => ({ ...emptyOf(TEMP_RC_FIELDS), printedDate: nowStamp() })
  }
}

export const rcFieldCount = (type) => keysOf(RC_FORMS[type].fields).filter((k) => RC_FORMS[type].fields[k].from).length
export const emptyRcForm = (type) => emptyOf(RC_FORMS[type].fields)
