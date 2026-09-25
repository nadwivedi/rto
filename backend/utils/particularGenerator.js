const PDFDocument = require('pdfkit')
const QRCode = require('qrcode')
const path = require('path')
const fs = require('fs')
const sharp = require('sharp')

// State logos live in assets/particular/<state name>.png (e.g. maharashtra.png)
const LOGO_DIR = path.join(__dirname, '..', 'assets', 'particular')

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
  if (v === undefined || v === null) return ''
  const s = String(v).trim()
  return s.toUpperCase() === 'NA' ? '' : s
}

// "27-11-2040" -> "27-Nov-2040"; other formats are returned unchanged
const fmtDate = (v) => {
  const s = val(v)
  const m = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/)
  if (!m || +m[2] < 1 || +m[2] > 12) return s
  return `${m[1].padStart(2, '0')}-${MONTHS[+m[2] - 1]}-${m[3]}`
}

const titleCase = (s) => s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())

// "Pimpri Chinchwad RTO, Maharashtra" -> "RTO PIMPRI CHINCHWAD"
const officeName = (registeredAt) => {
  const place = val(registeredAt).split(',')[0].trim()
  const m = place.match(/\b(A?RTO|DTO|SRTO)\b/i)
  if (!m) return place.toUpperCase()
  const rest = place.replace(m[0], '').replace(/\s+/g, ' ').trim()
  return `${m[1].toUpperCase()} ${rest.toUpperCase()}`.trim()
}

const printedOn = () => {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    }).formatToParts(new Date()).map((p) => [p.type, p.value])
  )
  return `${parts.day}-${parts.month.slice(0, 3)}-${parts.year} ${parts.hour}:${parts.minute}:${parts.second}`
}

// States without their own logo yet fall back to the Maharashtra one
const DEFAULT_LOGO = path.join(LOGO_DIR, 'maharashtra.png')

const findLogo = (stateName) => {
  const file = path.join(LOGO_DIR, `${stateName.toLowerCase().replace(/[^a-z]+/g, '_')}.png`)
  if (fs.existsSync(file)) return file
  return fs.existsSync(DEFAULT_LOGO) ? DEFAULT_LOGO : null
}

// Grey copy of the logo for the faded background watermark, cached per file
const watermarkCache = new Map()
const watermarkFor = async (logo) => {
  if (!watermarkCache.has(logo)) {
    watermarkCache.set(logo, await sharp(logo).grayscale().png().toBuffer())
  }
  return watermarkCache.get(logo)
}

/**
 * Generate a Vahan "Vehicle Particulars (For Internal Use)" style PDF buffer.
 */
async function generateParticularPDF(d = {}) {
  const regNo = val(d.REGN_NO)
  const stateCode = (val(d.STATE_CD) || regNo.slice(0, 2)).toUpperCase().slice(0, 2)
  const stateName = STATES[stateCode] || val(d.STATE_NAME) || stateCode
  const logo = findLogo(stateName)
  const watermark = logo ? await watermarkFor(logo) : null

  const qrPayload = [
    `Regn No: ${regNo}`,
    `Owner: ${val(d.OWNER_NAME)}`,
    `Chassis: ${val(d.CHASI_NO)}`,
    `Engine: ${val(d.ENG_NO)}`,
    `Regn Date: ${val(d.REGN_DT)}`,
    `Valid Upto: ${val(d.REGN_UPTO)}`
  ].join('\n')
  const qrBuf = await QRCode.toBuffer(qrPayload, { margin: 0, width: 300, errorCorrectionLevel: 'M' })

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 0, info: { Title: `${regNo} Particular` } })
    const chunks = []
    doc.on('data', (c) => chunks.push(c))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    const PAGE_W = 595.28
    const FS = 7
    const ROW = 10.2
    const C1 = 49
    const C2 = 174
    const C3 = 300
    const C4 = 426
    const IND = 56

    const text = (t, x, y, opts = {}) => {
      doc.fillColor('#000').font(opts.bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(opts.size || FS)
      // pdfkit needs a width to draw an underline
      const width = opts.width || (opts.underline ? doc.widthOfString(t || '') + 1 : undefined)
      doc.text(t || '', x, y, {
        lineBreak: !!width,
        width,
        align: opts.align,
        underline: opts.underline
      })
    }
    const centered = (t, y, opts = {}) => text(t, 0, y, { ...opts, width: PAGE_W, align: 'center' })

    // Faint logo watermark behind the details
    if (watermark) {
      doc.save()
      doc.opacity(0.13)
      doc.image(watermark, 100, 200, { width: 290 })
      doc.restore()
    }

    // ================= HEADER =================
    if (logo) doc.image(logo, 42, 29, { width: 55 })
    doc.image(qrBuf, 499, 79, { width: 54, height: 54 })

    centered(`GOVERNMENT OF ${stateName.toUpperCase()}`, 84, { bold: true, size: 8.5, underline: true })
    const office = officeName(d.REGISTERED_AT)
    if (office) centered(`[ ${office} ]`, 99, { bold: true, size: 6.5 })
    centered('VEHICLE PARTICULARS (FOR INTERNAL USE)', 115, { bold: true, size: 8.5, underline: true })

    // ================= DETAILS GRID =================
    let y = 146
    const row = (l1, v1, l3, v3) => {
      text(l1, C1, y)
      text(v1, C2, y)
      if (l3 !== undefined) {
        text(l3, C3, y)
        text(v3, C4, y)
      }
      y += ROW
    }

    const vehicleClass = val(d.VEHICLE_CLASS).replace(/\s*\([^)]*\)\s*$/, '')
    const status = val(d.STATUS)

    row('Application No:', val(d.APPL_NO), 'Registration No:', regNo)
    row('Registration Date:', val(d.REGN_DT), 'Previous Registration No', `: ${val(d.PREV_REGN_NO)}`.trim())
    row('Owner Serial No:', val(d.OWNER_SERIAL_NO), 'Owner Name:', val(d.OWNER_NAME))
    row('Son/Wife/Daughter of:', val(d.F_NAME))

    text('Present Address:', C1, y)
    doc.font('Helvetica').fontSize(FS)
    const address = val(d.PRESENT_ADDRESS) || val(d.PERMANENT_ADDRESS)
    const addrH = doc.heightOfString(address || ' ', { width: PAGE_W - C2 - 30 })
    text(address, C2, y, { width: PAGE_W - C2 - 30 })
    y += Math.max(ROW, addrH + 2)

    row('Vehicle Class:', vehicleClass, 'Vehicle Maker:', val(d.MAKER_DESC))
    row('Body Type:', val(d.BODY_TYPE_DESC), 'No of Cylinders:', val(d.NO_OF_CYLINDERS || d.NO_CYL))
    row('Month/Year of Manufacturing:', val(d.MANU_MONTH_YR))
    row('Chassis No:', val(d.CHASI_NO), 'Engine No:', val(d.ENG_NO))
    row('Horse Power:', val(d.HORSE_POWER || d.HP), 'Seat(including driver):', val(d.SEATING_CAPACITY))
    row('Unladen Wt(kg):', val(d.UNLADEN_WEIGHT), 'Laden Wt(kg):', val(d.LADEN_WEIGHT))
    row('GCW(kg):', val(d.GCW), 'Registration Valid upto:', fmtDate(d.REGN_UPTO))
    row('Tax Amount:', val(d.TAX_AMOUNT), 'Tax Paid upto:', fmtDate(d.TAX_UPTO))
    row('Cubic Capacity:', val(d.CUBIC_CAPACITY), 'Color:', val(d.COLOR))
    row('Fuel:', val(d.FUEL_DESC), 'Fitness upto:', fmtDate(d.FIT_UPTO))
    row('Vehicle Model', val(d.MAKER_MODEL), 'Vehicle Norms', val(d.FUEL_NORMS))
    row('Floor Area', val(d.FLOOR_AREA), 'Vehicle Status', status ? titleCase(status) : '')
    row('Wheel Base', val(d.WHEELBASE || d.WHEEL_BASE), 'Ownership Type', val(d.OWNERSHIP_TYPE))

    // ================= REMARKS =================
    const SUB = 6.5
    const RS = 9.6
    text('Last Change of Address done on:', IND, y, { size: SUB }); y += RS
    text('Last Alteration of Vehicle done on', IND, y, { size: SUB }); y += RS + 1

    const insComp = val(d.INSURANCE_COMP).replace(/\s+/g, ' ')
    if (insComp) {
      const policy = val(d.INS_POLICY_NO) || val(d.POLICY_NO)
      const from = fmtDate(d.INSURANCE_FROM)
      const upto = fmtDate(d.INSURANCE_UPTO)
      const validity = from ? `is valid from ${from} to ${upto}` : `is valid upto ${upto}`
      text(`Insurance From ${insComp} vide policy certificate/covernote no ${policy} ${validity}.`,
        IND, y, { width: PAGE_W - IND - 30 })
    }
    y += ROW
    text('HP Details:', IND, y); y += ROW * 2
    text(val(d.FINANCER_DETAILS), IND, y); y += ROW
    text(`NOC Details: ${val(d.NOC_DETAILS)}`.trim(), IND, y); y += ROW
    text(`Black List Details: ${val(d.BLACKLIST_STATUS)}`.trim(), IND, y); y += ROW * 1.5

    text('Mobile No:', IND, y, { size: SUB })
    text(val(d.MOBILE_NO), C3 + 3, y, { size: SUB }); y += ROW
    text('Email Id:', IND, y, { size: SUB })
    text(val(d.EMAIL_ID), C3 + 3, y, { size: SUB }); y += ROW * 1.4

    // ================= OTHER STATE / TRANSFER =================
    text('Other State/Transfer/Conversion Details', C1, y); y += ROW * 1.5
    const colonRow = (l1, v1, l3, v3) => {
      text(l1, C1, y)
      text(`: ${v1}`.trim(), C2, y)
      text(l3, C3, y)
      text(`: ${v3}`.trim(), C4, y)
      y += ROW
    }
    colonRow('Previous Owner', '', 'Previous RegNo', '')
    colonRow('Old State', '', 'Entry Date', '')
    colonRow('Transfer Date', '', 'Conversion Date', '')

    // ================= ADDITIONAL PARTICULARS =================
    y += ROW * 1.2
    text('Additional Particulars', 62, y, { underline: true }); y += ROW * 1.2
    text('Number,Desc & size of', 217, y, { size: 6 })
    text('Regd. Axle Weight(in kgs)', 382, y, { size: 6 }); y += ROW * 0.85
    for (const axle of ['a) Front:', 'b) Rear:', 'c) Other:', 'd) Tandem:']) {
      text(axle, 53, y, { size: 6 }); y += 8.4
    }

    y += ROW * 1.5
    centered(`Printed On: ${printedOn()}`, y)
    y += ROW * 2.6
    centered("Note: This is a computer generated document. Authority Signature is not required. The document can't be used a MV document in the Vehicle.", y, { size: 6.5 })

    text('1/1', 560, 812, { size: 7 })

    doc.end()
  })
}

module.exports = { generateParticularPDF }
