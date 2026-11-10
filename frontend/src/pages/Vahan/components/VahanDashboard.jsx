import { useState, useEffect, useMemo } from 'react'
import axios from 'axios'
import * as XLSX from 'xlsx'
import { toast } from 'react-toastify'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL

const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

// "Days left" filter for the Expiry Soon list (and its Print / PDF / Excel)
const DAY_FILTERS = [
  { key: 'all', label: 'Any days', max: null },
  { key: '7', label: 'Within 7 days', max: 7 },
  { key: '15', label: 'Within 15 days', max: 15 },
  { key: '30', label: 'Within 30 days', max: 30 }
]

const parseAppDate = (value) => {
  if (!value) return null

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value
  }

  const rawValue = String(value).trim()
  if (!rawValue) return null

  const numericMatch = rawValue.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/)
  if (numericMatch) {
    const [, day, month, year] = numericMatch
    const parsedDate = new Date(Number(year), Number(month) - 1, Number(day))

    if (
      parsedDate.getFullYear() === Number(year) &&
      parsedDate.getMonth() === Number(month) - 1 &&
      parsedDate.getDate() === Number(day)
    ) {
      return parsedDate
    }

    return null
  }

  const parsedDate = new Date(rawValue)
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate
}

const getDaysRemaining = (date) => {
  const expDate = parseAppDate(date)
  if (!expDate) return null

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  expDate.setHours(0, 0, 0, 0)

  const diffTime = expDate - today
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

const formatDate = (date) => {
  const parsedDate = parseAppDate(date)
  if (!parsedDate) return '-'

  return parsedDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const formatDateTime = (value) => {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null

  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()

  let hours = date.getHours()
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const ampm = hours >= 12 ? 'PM' : 'AM'
  hours = hours % 12
  hours = hours ? hours : 12
  const strHours = String(hours).padStart(2, '0')

  return `${day}/${month}/${year} ${strHours}:${minutes} ${ampm}`
}

const getDateTime = (date) => parseAppDate(date)?.getTime() || Number.MAX_SAFE_INTEGER

const VahanDashboard = () => {
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [daysFilter, setDaysFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [allRecords, setAllRecords] = useState([])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${BACKEND_URL}/api/dashboard`, { withCredentials: true })
      const data = response.data.data

      const records = []

      ;(data.expiringRecords.tax || []).forEach(r => {
        records.push({
          ...r,
          docType: 'Road Tax',
          validFrom: r.taxFrom,
          validTo: r.taxTo
        })
      })

      ;(data.expiringRecords.fitness || []).forEach(r => {
        records.push({
          ...r,
          docType: 'Fitness'
        })
      })

      ;(data.expiringRecords.puc || []).forEach(r => {
        records.push({
          ...r,
          docType: 'PUC'
        })
      })

      ;(data.expiringRecords.gps || []).forEach(r => {
        records.push({
          ...r,
          docType: 'GPS'
        })
      })

      ;(data.expiringRecords.insurance || []).forEach(r => {
        records.push({
          ...r,
          docType: 'Insurance',
          ownerName: r.policyHolderName
        })
      })

      ;(data.expiringRecords.insuranceThirdParty || []).forEach(r => {
        records.push({
          ...r,
          docType: 'Insurance (Third Party)',
          ownerName: r.policyHolderName,
          validFrom: r.thirdPartyValidFrom,
          validTo: r.thirdPartyValidTo
        })
      })

      ;(data.expiringRecords.nationalPermit || []).forEach(r => {
        if (r.partAStatus === 'expiring_soon') {
          records.push({
            ...r,
            docType: 'NP (Part A)',
            ownerName: r.permitHolder || r.partyName,
            validFrom: r.partAValidFrom,
            validTo: r.partAValidTo
          })
        }
        if (r.partBStatus === 'expiring_soon') {
          records.push({
            ...r,
            docType: 'NP (Part B)',
            ownerName: r.permitHolder || r.partyName,
            validFrom: r.partBValidFrom,
            validTo: r.partBValidTo
          })
        }
        if (!r.partAStatus && !r.partBStatus) {
          records.push({
            ...r,
            docType: 'National Permit',
            ownerName: r.permitHolder || r.partyName,
            validFrom: r.validFrom || r.partAValidFrom,
            validTo: r.validTo || r.permitExpiryDate || r.partAValidTo
          })
        }
      })

      ;(data.expiringRecords.cgPermit || []).forEach(r => {
        records.push({
          ...r,
          docType: 'State Permit',
          ownerName: r.permitHolder || r.partyName,
          validFrom: r.validFrom,
          validTo: r.validTo || r.permitExpiryDate
        })
      })

      ;(data.expiringRecords.busPermit || []).forEach(r => {
        records.push({
          ...r,
          docType: 'Bus Permit',
          ownerName: r.permitHolder || r.partyName,
          validFrom: r.validFrom,
          validTo: r.validTo || r.permitExpiryDate
        })
      })

      ;(data.expiringRecords.temporaryPermit || []).forEach(r => {
        records.push({
          ...r,
          docType: 'Temp Permit',
          ownerName: r.permitHolder || r.partyName,
          validTo: r.validTo
        })
      })

      ;(data.expiringRecords.temporaryPermitOtherState || []).forEach(r => {
        records.push({
          ...r,
          docType: 'Temp Permit Other',
          ownerName: r.permitHolder || r.partyName,
          vehicleNumber: r.vehicleNo || r.vehicleNumber,
          validTo: r.validTo
        })
      })

      const nonExpiredRecords = records.filter(r => {
        const days = getDaysRemaining(r.validTo)
        return days !== null && days >= 0
      })

      setAllRecords(nonExpiredRecords)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const docTypeOrder = {
    'Road Tax': 1,
    'Fitness': 2,
    'PUC': 3,
    'GPS': 4,
    'National Permit': 5,
    'NP (Part A)': 6,
    'NP (Part B)': 7,
    'State Permit': 8,
    'Bus Permit': 9,
    'Temp Permit': 10,
    'Temp Permit Other': 11,
    'Insurance': 12,
    'Insurance (Third Party)': 13
  }

  const filteredRecords = useMemo(() => {
    let records = [...allRecords]

    if (filter !== 'all') {
      const filterMap = {
        'fitness': 'Fitness',
        'tax': 'Road Tax',
        'puc': 'PUC',
        'gps': 'GPS',
        'insurance': ['Insurance', 'Insurance (Third Party)'],
        'permit': ['National Permit', 'NP (Part A)', 'NP (Part B)', 'State Permit', 'Bus Permit', 'Temp Permit', 'Temp Permit Other']
      }
      const targetType = filterMap[filter]
      if (Array.isArray(targetType)) {
        records = records.filter(r => targetType.includes(r.docType))
      } else {
        records = records.filter(r => r.docType === targetType)
      }
    }

    const maxDays = DAY_FILTERS.find(d => d.key === daysFilter)?.max
    if (maxDays != null) {
      records = records.filter(r => {
        const days = getDaysRemaining(r.validTo)
        return days !== null && days <= maxDays
      })
    }

    const q = search.trim().toLowerCase()
    if (q) {
      const qCompact = q.replace(/\s+/g, '')
      records = records.filter(r =>
        String(r.vehicleNumber || '').toLowerCase().replace(/\s+/g, '').includes(qCompact) ||
        String(r.ownerName || r.partyName || '').toLowerCase().includes(q) ||
        String(r.mobileNumber || r.mobileNo || r.mobile || '').includes(q)
      )
    }

    return records.sort((a, b) => {
      const orderA = docTypeOrder[a.docType] || 999
      const orderB = docTypeOrder[b.docType] || 999
      if (orderA !== orderB) return orderA - orderB
      return getDateTime(a.validTo) - getDateTime(b.validTo)
    })
  }, [allRecords, filter, daysFilter, search])

  const formatExpiryText = (validTo) => {
    const days = getDaysRemaining(validTo)
    if (days === null) return '-'
    if (days < 0) return 'Expired'
    return `${days}d left`
  }

  const getDocTypeBadge = (docType) => {
    const styles = {
      'Road Tax': 'bg-violet-100 text-violet-700',
      'Fitness': 'bg-red-100 text-red-700',
      'PUC': 'bg-teal-100 text-teal-700',
      'GPS': 'bg-purple-100 text-purple-700',
      'National Permit': 'bg-emerald-100 text-emerald-700',
      'NP (Part A)': 'bg-emerald-100 text-emerald-700',
      'NP (Part B)': 'bg-emerald-100 text-emerald-700',
      'State Permit': 'bg-green-100 text-green-700',
      'Bus Permit': 'bg-amber-100 text-amber-700',
      'Temp Permit': 'bg-yellow-100 text-yellow-700',
      'Temp Permit Other': 'bg-orange-100 text-orange-700',
      'Insurance': 'bg-blue-100 text-blue-700',
      'Insurance (Third Party)': 'bg-purple-100 text-purple-700'
    }
    return styles[docType] || 'bg-gray-100 text-gray-700'
  }

  // Compact WhatsApp status for the mobile cards
  const renderWhatsAppBadge = (log) => {
    const notSent = <span className='rounded bg-gray-100 px-1.5 py-0.5 text-[11px] font-semibold text-gray-500'>Not Sent</span>
    if (!log) return notSent
    const map = {
      sent: { cls: 'bg-emerald-100 text-emerald-700', label: '✓ Sent', time: log.sentAt || log.createdAt },
      pending: { cls: 'bg-amber-100 text-amber-700', label: 'Pending', time: log.scheduledFor || log.createdAt },
      failed: { cls: 'bg-red-100 text-red-700', label: '✕ Failed', time: log.createdAt }
    }
    const item = map[log.status]
    if (!item) return notSent
    return (
      <span className='flex items-center gap-1.5'>
        <span className='text-[10px] font-medium text-gray-500'>{formatDateTime(item.time) || '-'}</span>
        <span className={`rounded px-1.5 py-0.5 text-[11px] font-semibold ${item.cls}`}>{item.label}</span>
      </span>
    )
  }

  const filterButtons = [
    { key: 'all', label: 'All' },
    { key: 'tax', label: 'Road Tax' },
    { key: 'fitness', label: 'Fitness' },
    { key: 'puc', label: 'PUC' },
    { key: 'gps', label: 'GPS' },
    { key: 'insurance', label: 'Insurance' },
    { key: 'permit', label: 'Permit' }
  ]

  // Excel / Print / PDF all use exactly what the filters show (document type, days left, search)
  const filterLabel = filterButtons.find(btn => btn.key === filter)?.label || 'All'
  const daysLabel = DAY_FILTERS.find(d => d.key === daysFilter)?.label || 'Any days'
  const filterSummary = [
    `Document: ${filterLabel}`,
    daysFilter !== 'all' ? daysLabel : null,
    search.trim() ? `Search: "${search.trim()}"` : null
  ].filter(Boolean).join('  ·  ')
  const fileBase = `Expiry_Soon_${filterLabel.replace(/\s+/g, '_')}${daysFilter !== 'all' ? `_${daysFilter}days` : ''}_${new Date().toISOString().split('T')[0]}`

  const exportColumns = ['S.No', 'Document', 'Vehicle Number', 'Owner / Party', 'Mobile Number', 'Valid From', 'Valid To', 'Days Left', 'WhatsApp Alert']
  const toExportRow = (record, index) => {
    const from = formatDate(record.validFrom)
    const to = formatDate(record.validTo)
    return {
      'S.No': index + 1,
      'Document': record.docType,
      'Vehicle Number': record.vehicleNumber || '',
      'Owner / Party': record.ownerName || record.partyName || '',
      'Mobile Number': record.mobileNumber || record.mobileNo || record.mobile || '',
      'Valid From': from === '-' ? '' : from,
      'Valid To': to === '-' ? '' : to,
      'Days Left': getDaysRemaining(record.validTo) ?? '',
      'WhatsApp Alert': record.whatsappLog?.status || 'not sent'
    }
  }

  // Records split by document type, in list order (Road Tax, Fitness, PUC...), numbered per group
  const groupedForPrint = () => {
    const groups = []
    filteredRecords.forEach(record => {
      let group = groups[groups.length - 1]
      if (!group || group.docType !== record.docType) {
        group = { docType: record.docType, rows: [] }
        groups.push(group)
      }
      group.rows.push(toExportRow(record, group.rows.length))
    })
    return groups
  }

  const nothingToOutput = () => {
    if (filteredRecords.length > 0) return false
    toast.info('No records for the selected filter')
    return true
  }

  const handleExport = () => {
    if (nothingToOutput()) return
    const rows = filteredRecords.map(toExportRow)
    const worksheet = XLSX.utils.json_to_sheet(rows)
    worksheet['!cols'] = [{ wch: 6 }, { wch: 22 }, { wch: 16 }, { wch: 28 }, { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 14 }]
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Expiry Soon')
    XLSX.writeFile(workbook, `${fileBase}.xlsx`)
    toast.success(`Exported ${rows.length} ${filterLabel === 'All' ? '' : `${filterLabel} `}records`)
  }

  // PDF download: one table per document type (each with its own heading), page numbers in the footer
  const handleExportPdf = () => {
    if (nothingToOutput()) return
    try {
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      const printedOn = formatDateTime(new Date())

      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.text('Expiry Soon Report', 14, 15)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(90)
      doc.text(`${filterSummary}  ·  ${filteredRecords.length} records  ·  Printed ${printedOn}`, 14, 21)
      doc.setTextColor(0)

      let startY = 27
      groupedForPrint().forEach(group => {
        if (startY > pageHeight - 30) {
          doc.addPage()
          startY = 15
        }
        doc.setFontSize(11)
        doc.setFont('helvetica', 'bold')
        doc.text(`${group.docType} (${group.rows.length})`, 14, startY)
        autoTable(doc, {
          startY: startY + 2,
          head: [exportColumns.filter(c => c !== 'Document')],
          body: group.rows.map(row => exportColumns.filter(c => c !== 'Document').map(c => String(row[c]))),
          styles: { fontSize: 8, cellPadding: 1.6 },
          headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
          alternateRowStyles: { fillColor: [245, 247, 250] },
          columnStyles: { 0: { cellWidth: 12, halign: 'center' }, 1: { fontStyle: 'bold' }, 6: { halign: 'center' } },
          margin: { left: 14, right: 14 }
        })
        startY = doc.lastAutoTable.finalY + 9
      })

      const pages = doc.getNumberOfPages()
      for (let i = 1; i <= pages; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setTextColor(120)
        doc.text(`Page ${i} of ${pages}`, pageWidth - 14, pageHeight - 6, { align: 'right' })
      }

      doc.save(`${fileBase}.pdf`)
      toast.success(`PDF downloaded (${filteredRecords.length} records)`)
    } catch (error) {
      console.error('Expiry Soon PDF export failed:', error)
      toast.error('Could not create the PDF')
    }
  }

  // Print: same layout as the PDF, printed through a hidden frame (the printer dialog can also "Save as PDF")
  const handlePrint = () => {
    if (nothingToOutput()) return
    const cols = exportColumns.filter(c => c !== 'Document')
    const sections = groupedForPrint().map(group => `
      <h2>${escapeHtml(group.docType)} <span>(${group.rows.length})</span></h2>
      <table>
        <thead><tr>${cols.map(c => `<th>${escapeHtml(c)}</th>`).join('')}</tr></thead>
        <tbody>${group.rows.map(row => `<tr>${cols.map(c => `<td>${escapeHtml(row[c])}</td>`).join('')}</tr>`).join('')}</tbody>
      </table>`).join('')

    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(fileBase)}</title>
      <style>
        @page { size: A4 landscape; margin: 10mm; }
        body { font-family: Arial, sans-serif; color: #111; margin: 0; }
        h1 { font-size: 18px; margin: 0 0 2px; }
        .meta { font-size: 11px; color: #555; margin-bottom: 10px; }
        h2 { font-size: 13px; margin: 14px 0 4px; page-break-after: avoid; }
        h2 span { color: #555; font-weight: normal; }
        table { width: 100%; border-collapse: collapse; font-size: 11px; }
        thead { display: table-header-group; }
        tr { page-break-inside: avoid; }
        th { background: #2563eb; color: #fff; text-align: left; padding: 4px 6px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        td { border-bottom: 1px solid #ddd; padding: 4px 6px; }
        td:nth-child(2) { font-weight: bold; font-family: monospace; }
      </style></head><body>
      <h1>Expiry Soon Report</h1>
      <div class="meta">${escapeHtml(filterSummary)} &nbsp;·&nbsp; ${filteredRecords.length} records &nbsp;·&nbsp; Printed ${escapeHtml(formatDateTime(new Date()))}</div>
      ${sections}
      </body></html>`

    const frame = document.createElement('iframe')
    frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;'
    document.body.appendChild(frame)
    const frameDoc = frame.contentWindow.document
    frameDoc.open()
    frameDoc.write(html)
    frameDoc.close()
    const cleanup = () => { if (frame.parentNode) frame.remove() }
    frame.contentWindow.addEventListener('afterprint', () => setTimeout(cleanup, 500))
    setTimeout(() => {
      frame.contentWindow.focus()
      frame.contentWindow.print()
      setTimeout(cleanup, 60000)
    }, 250)
  }

  const counts = {
    all: allRecords.length,
    tax: allRecords.filter(r => r.docType === 'Road Tax').length,
    fitness: allRecords.filter(r => r.docType === 'Fitness').length,
    puc: allRecords.filter(r => r.docType === 'PUC').length,
    gps: allRecords.filter(r => r.docType === 'GPS').length,
    insurance: allRecords.filter(r => r.docType === 'Insurance' || r.docType === 'Insurance (Third Party)').length,
    permit: allRecords.filter(r => ['National Permit', 'NP (Part A)', 'NP (Part B)', 'State Permit', 'Bus Permit', 'Temp Permit', 'Temp Permit Other'].includes(r.docType)).length
  }

  return (
    <div className='flex-1 min-h-0 flex flex-col p-2 sm:p-3 overflow-auto'>
      <div className='flex flex-col gap-3 flex-1 min-h-0'>
        <section className='min-w-0 flex flex-col flex-1'>
          <div className='mb-3 grid grid-cols-1 items-center gap-3 text-center md:grid-cols-[auto_1fr_auto]'>
            <h2 className='text-left text-base font-bold text-gray-800 lg:text-[15px] xl:text-base 2xl:text-lg'>Expiry Soon</h2>

            <div className='flex flex-wrap justify-center gap-1 lg:gap-1 xl:gap-1.5 2xl:gap-2'>
              {filterButtons.map(btn => (
                <button
                  key={btn.key}
                  onClick={() => setFilter(btn.key)}
                  className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition sm:px-2 sm:py-0.5 sm:text-[10px] lg:text-[10px] xl:px-2.5 xl:py-1 xl:text-[11px] 2xl:text-xs ${
                    filter === btn.key
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {btn.label} ({counts[btn.key]})
                </button>
              ))}
            </div>

            <div className='flex flex-wrap items-center justify-center gap-1.5 md:justify-end'>
              <button
                onClick={handlePrint}
                disabled={loading || filteredRecords.length === 0}
                className='inline-flex items-center gap-1.5 rounded-md bg-slate-700 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-slate-800 disabled:opacity-50 cursor-pointer md:px-3 md:py-1.5 md:text-xs'
                title='Print the records shown below'
              >
                <svg className='w-3.5 h-3.5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z' />
                </svg>
                Print
              </button>
              <button
                onClick={handleExportPdf}
                disabled={loading || filteredRecords.length === 0}
                className='inline-flex items-center gap-1.5 rounded-md bg-red-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-red-700 disabled:opacity-50 cursor-pointer md:px-3 md:py-1.5 md:text-xs'
                title='Download the records shown below as PDF'
              >
                <svg className='w-3.5 h-3.5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z' />
                </svg>
                PDF
              </button>
              <button
                onClick={handleExport}
                disabled={loading || filteredRecords.length === 0}
                className='inline-flex items-center gap-1.5 rounded-md bg-green-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-green-700 disabled:opacity-50 cursor-pointer md:px-3 md:py-1.5 md:text-xs'
                title='Download the records shown below as Excel'
              >
                <svg className='w-3.5 h-3.5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4' />
                </svg>
                Excel
              </button>
            </div>
          </div>

          {/* Days-left + search filters: the list, Print, PDF and Excel all follow them */}
          <div className='mb-2 flex flex-wrap items-center gap-2'>
            <select
              value={daysFilter}
              onChange={(e) => setDaysFilter(e.target.value)}
              className='rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-semibold text-gray-700 focus:border-blue-500 focus:outline-none'
              title='Show only documents expiring within these days'
            >
              {DAY_FILTERS.map(d => <option key={d.key} value={d.key}>{d.label}</option>)}
            </select>
            <input
              type='text'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder='Search vehicle / party / mobile'
              className='min-w-0 flex-1 rounded-md border border-gray-300 px-2 py-1 text-xs focus:border-blue-500 focus:outline-none sm:max-w-xs'
            />
            {(daysFilter !== 'all' || search) && (
              <button
                onClick={() => { setDaysFilter('all'); setSearch('') }}
                className='rounded-md px-2 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50 cursor-pointer'
              >
                Clear
              </button>
            )}
            {!loading && <span className='ml-auto text-xs font-medium text-gray-500'>{filteredRecords.length} shown</span>}
          </div>

          {loading ? (
            <div className='mt-4 animate-pulse space-y-2'>
              {[...Array(5)].map((_, i) => (
                <div key={i} className='h-12 rounded-lg bg-gray-100'></div>
              ))}
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className='mt-4 rounded-lg border border-gray-200 bg-white py-10 text-center'>
              <svg className='mx-auto mb-3 h-10 w-10 text-green-500' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
              </svg>
              <p className='font-medium text-gray-500'>No documents expiring soon</p>
            </div>
          ) : (
            <>
            {/* Mobile: compact card list */}
            <div className='mt-2 space-y-1.5 sm:hidden'>
              {filteredRecords.map((record, index) => {
                const days = getDaysRemaining(record.validTo)
                return (
                  <div key={index} className='rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 shadow-sm'>
                    <div className='flex items-center justify-between gap-2'>
                      <div className='min-w-0 leading-tight'>
                        <div className='truncate text-[13px] font-semibold text-gray-800'>{record.ownerName || record.partyName || '-'}</div>
                        <div className='font-mono text-[11px] font-bold text-blue-900'>{record.vehicleNumber || '-'}</div>
                      </div>
                      <span className={`shrink-0 rounded px-1.5 py-0.5 text-[11px] font-semibold ${getDocTypeBadge(record.docType)}`}>{record.docType}</span>
                    </div>
                    <div className='mt-1 flex items-center justify-between gap-2 text-[11px] font-semibold'>
                      <span className='min-w-0 truncate'>
                        <span className='text-green-700'>{formatDate(record.validFrom)}</span>
                        <span className='mx-1 text-gray-400'>→</span>
                        <span className='text-red-700'>{formatDate(record.validTo)}</span>
                      </span>
                      <span className={`shrink-0 font-bold ${days !== null && days < 0 ? 'text-red-600' : 'text-orange-600'}`}>{formatExpiryText(record.validTo)}</span>
                    </div>
                    <div className='mt-1 flex items-center justify-between gap-2 border-t border-gray-100 pt-1'>
                      <span className='text-[10px] font-semibold uppercase text-gray-400'>WhatsApp</span>
                      {renderWhatsAppBadge(record.whatsappLog)}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Tablet / desktop: table */}
            <div className='mt-2 sm:mt-4 flex-1 min-h-0 overflow-hidden rounded-lg border border-gray-200 bg-white hidden sm:block'>
              <div className='h-full overflow-auto'>
                <table className='w-full table-fixed'>
                  <thead className='border-b border-gray-200 bg-gray-50'>
                    <tr>
                      <th className='px-2 py-2 sm:px-3 lg:px-4 lg:py-3 text-left text-[11px] lg:text-xs xl:text-sm font-semibold uppercase tracking-wider text-gray-600'>Party / Vehicle</th>
                      <th className='px-2 py-2 sm:px-3 lg:px-4 lg:py-3 text-left text-[11px] lg:text-xs xl:text-sm font-semibold uppercase tracking-wider text-gray-600'>Doc</th>
                      <th className='px-2 py-2 sm:px-3 lg:px-4 lg:py-3 text-left text-[11px] lg:text-xs xl:text-sm font-semibold uppercase tracking-wider text-gray-600'>Validity</th>
                      <th className='px-2 py-2 sm:px-3 lg:px-4 lg:py-3 text-left text-[11px] lg:text-xs xl:text-sm font-semibold uppercase tracking-wider text-gray-600'>Days Left</th>
                      <th className='px-2 py-2 sm:px-3 lg:px-4 lg:py-3 text-left text-[11px] lg:text-xs xl:text-sm font-semibold uppercase tracking-wider text-gray-600'>WhatsApp Alert</th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-gray-200'>
                    {filteredRecords.map((record, index) => (
                      <tr key={index} className='transition-colors hover:bg-gray-50'>
                        <td className='px-2 py-2 sm:px-3 lg:px-4 lg:py-3'>
                          <div className='space-y-0.5'>
                            <div className='text-[10px] sm:text-xs font-semibold text-gray-800'>{record.ownerName || record.partyName || '-'}</div>
                            <div className='font-mono text-[10px] sm:text-xs font-bold text-blue-900'>{record.vehicleNumber || '-'}</div>
                          </div>
                        </td>
                        <td className='px-2 py-2 sm:px-3 lg:px-4 lg:py-3'>
                          <span className={`rounded px-1.5 py-0.5 text-[9px] sm:text-[11px] lg:text-xs xl:text-sm font-semibold ${getDocTypeBadge(record.docType)}`}>
                            {record.docType}
                          </span>
                        </td>
                        <td className='px-2 py-2 sm:px-3 lg:px-4 lg:py-3'>
                          <div className='space-y-0.5 text-[10px] sm:text-xs font-semibold'>
                            <div className='flex items-baseline'>
                              <span className='w-14 shrink-0 text-gray-900'>From:</span>
                              <span className='text-green-700'>{formatDate(record.validFrom)}</span>
                            </div>
                            <div className='flex items-baseline'>
                              <span className='w-14 shrink-0 text-gray-900'>To:</span>
                              <span className='text-red-700'>{formatDate(record.validTo)}</span>
                            </div>
                          </div>
                        </td>
                        <td className='px-2 py-2 sm:px-3 lg:px-4 lg:py-3'>
                          <span className={`text-[10px] sm:text-[11px] lg:text-xs xl:text-sm font-bold ${getDaysRemaining(record.validTo) < 0 ? 'text-red-600' : 'text-orange-600'}`}>
                            {formatExpiryText(record.validTo)}
                          </span>
                        </td>
                        <td className='px-2 py-2 sm:px-3 lg:px-4 lg:py-3'>
                          {record.whatsappLog?.status === 'sent' && (
                            <div className='space-y-0.5'>
                              <span className='inline-flex items-center gap-1 rounded bg-emerald-100 px-1.5 py-0.5 text-[9px] sm:text-[11px] lg:text-xs font-semibold text-emerald-700'>
                                <svg className='w-3 h-3' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
                                </svg>
                                Sent
                              </span>
                              <div className='text-[9px] sm:text-[10px] text-gray-500 font-medium'>
                                {formatDateTime(record.whatsappLog.sentAt || record.whatsappLog.createdAt) || '-'}
                              </div>
                            </div>
                          )}
                          {record.whatsappLog?.status === 'pending' && (
                            <div className='space-y-0.5'>
                              <span className='inline-flex items-center gap-1 rounded bg-amber-100 px-1.5 py-0.5 text-[9px] sm:text-[11px] lg:text-xs font-semibold text-amber-700'>
                                <svg className='w-3 h-3 animate-spin' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                  <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4'></circle>
                                  <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z'></path>
                                </svg>
                                Pending
                              </span>
                              <div className='text-[9px] sm:text-[10px] text-gray-500 font-medium'>
                                {formatDateTime(record.whatsappLog.scheduledFor || record.whatsappLog.createdAt) || '-'}
                              </div>
                            </div>
                          )}
                          {record.whatsappLog?.status === 'failed' && (
                            <div className='space-y-0.5'>
                              <span className='inline-flex items-center gap-1 rounded bg-red-100 px-1.5 py-0.5 text-[9px] sm:text-[11px] lg:text-xs font-semibold text-red-700' title={record.whatsappLog.errorReason || 'Failed to send'}>
                                <svg className='w-3 h-3' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                                </svg>
                                Failed
                              </span>
                              <div className='text-[9px] sm:text-[10px] text-red-500 font-medium truncate max-w-[120px]' title={record.whatsappLog.errorReason}>
                                {formatDateTime(record.whatsappLog.createdAt) || '-'}
                              </div>
                            </div>
                          )}
                          {!record.whatsappLog && (
                            <div className='space-y-0.5'>
                              <span className='inline-flex items-center rounded bg-gray-100 px-1.5 py-0.5 text-[9px] sm:text-[11px] lg:text-xs font-semibold text-gray-500'>
                                Not Sent
                              </span>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            </>
          )}
        </section>
      </div>
    </div>
  )
}

export default VahanDashboard
