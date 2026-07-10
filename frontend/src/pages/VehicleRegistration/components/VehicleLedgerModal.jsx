import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { getVehicleNumberDesign } from '../../../context/ThemeContext'
import { getVehicleNumberParts } from '../../../utils/vehicleNoCheck'

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'

// ─── Section Configuration ────────────────────────────────────────────────────
// Defines how each service section is displayed in the ledger.
const SECTION_CONFIG = [
  {
    key: 'fitness',
    label: 'Fitness Certificate',
    shortLabel: 'Fitness',
    color: 'emerald',
    bgFrom: 'from-emerald-500',
    bgTo: 'to-teal-600',
    lightBg: 'bg-emerald-50',
    lightBorder: 'border-emerald-200',
    lightText: 'text-emerald-700',
    icon: (
      <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' />
      </svg>
    ),
    getAmount: r => ({ total: r.totalFee || 0, paid: r.paid || 0, balance: r.balance || 0 }),
    getDateInfo: r => r.validFrom && r.validTo ? `${r.validFrom} → ${r.validTo}` : '—',
    getDetails: r => [
      r.status && { label: 'Status', value: r.status },
    ].filter(Boolean),
  },
  {
    key: 'tax',
    label: 'Road Tax',
    shortLabel: 'Tax',
    color: 'blue',
    bgFrom: 'from-blue-500',
    bgTo: 'to-indigo-600',
    lightBg: 'bg-blue-50',
    lightBorder: 'border-blue-200',
    lightText: 'text-blue-700',
    icon: (
      <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z' />
      </svg>
    ),
    getAmount: r => ({ total: r.totalAmount || 0, paid: r.paidAmount || 0, balance: r.balanceAmount || 0 }),
    getDateInfo: r => r.taxFrom && r.taxTo ? `${r.taxFrom} → ${r.taxTo}` : '—',
    getDetails: r => [
      r.receiptNo && { label: 'Receipt No', value: r.receiptNo },
      r.status && { label: 'Status', value: r.status },
    ].filter(Boolean),
  },
  {
    key: 'insurance',
    label: 'Insurance',
    shortLabel: 'Insurance',
    color: 'violet',
    bgFrom: 'from-violet-500',
    bgTo: 'to-purple-600',
    lightBg: 'bg-violet-50',
    lightBorder: 'border-violet-200',
    lightText: 'text-violet-700',
    icon: (
      <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' />
      </svg>
    ),
    getAmount: r => ({ total: r.totalFee || 0, paid: r.paid || 0, balance: r.balance || 0 }),
    getDateInfo: r => r.validFrom && r.validTo ? `${r.validFrom} → ${r.validTo}` : '—',
    getDetails: r => [
      r.policyNumber && { label: 'Policy No', value: r.policyNumber },
      r.insuranceCompany && { label: 'Company', value: r.insuranceCompany },
      r.status && { label: 'Status', value: r.status },
    ].filter(Boolean),
  },
  {
    key: 'puc',
    label: 'PUC Certificate',
    shortLabel: 'PUC',
    color: 'amber',
    bgFrom: 'from-amber-500',
    bgTo: 'to-orange-500',
    lightBg: 'bg-amber-50',
    lightBorder: 'border-amber-200',
    lightText: 'text-amber-700',
    icon: (
      <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z' />
      </svg>
    ),
    getAmount: r => ({ total: r.totalFee || 0, paid: r.paid || 0, balance: r.balance || 0 }),
    getDateInfo: r => r.validFrom && r.validTo ? `${r.validFrom} → ${r.validTo}` : '—',
    getDetails: r => [
      r.vehicleModel && { label: 'Vehicle Model', value: r.vehicleModel },
      r.status && { label: 'Status', value: r.status },
    ].filter(Boolean),
  },
  {
    key: 'gps',
    label: 'GPS / Speed Governor',
    shortLabel: 'GPS',
    color: 'cyan',
    bgFrom: 'from-cyan-500',
    bgTo: 'to-sky-600',
    lightBg: 'bg-cyan-50',
    lightBorder: 'border-cyan-200',
    lightText: 'text-cyan-700',
    icon: (
      <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z' />
        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 11a3 3 0 11-6 0 3 3 0 016 0z' />
      </svg>
    ),
    getAmount: r => ({ total: r.totalFee || 0, paid: r.paid || 0, balance: r.balance || 0 }),
    getDateInfo: r => r.validFrom && r.validTo ? `${r.validFrom} → ${r.validTo}` : '—',
    getDetails: r => [
      r.status && { label: 'Status', value: r.status },
    ].filter(Boolean),
  },
  {
    key: 'cgPermit',
    label: 'State Permit',
    shortLabel: 'State Permit',
    color: 'rose',
    bgFrom: 'from-rose-500',
    bgTo: 'to-pink-600',
    lightBg: 'bg-rose-50',
    lightBorder: 'border-rose-200',
    lightText: 'text-rose-700',
    icon: (
      <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' />
      </svg>
    ),
    getAmount: r => ({ total: r.totalFee || 0, paid: r.paid || 0, balance: r.balance || 0 }),
    getDateInfo: r => r.validFrom && r.validTo ? `${r.validFrom} → ${r.validTo}` : '—',
    getDetails: r => [
      r.permitNumber && { label: 'Permit No', value: r.permitNumber },
      r.permitHolder && { label: 'Holder', value: r.permitHolder },
      r.status && { label: 'Status', value: r.status },
    ].filter(Boolean),
  },
  {
    key: 'nationalPermit',
    label: 'National Permit',
    shortLabel: 'NP',
    color: 'indigo',
    bgFrom: 'from-indigo-500',
    bgTo: 'to-blue-700',
    lightBg: 'bg-indigo-50',
    lightBorder: 'border-indigo-200',
    lightText: 'text-indigo-700',
    icon: (
      <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064' />
      </svg>
    ),
    getAmount: r => ({ total: r.totalFee || 0, paid: r.paid || 0, balance: r.balance || 0 }),
    getDateInfo: r => r.partAValidFrom && r.partAValidTo ? `A: ${r.partAValidFrom} → ${r.partAValidTo}` : '—',
    getDetails: r => [
      r.permitNumber && { label: 'Permit No', value: r.permitNumber },
      r.authNumber && { label: 'Auth No', value: r.authNumber },
      r.partBValidFrom && { label: 'Part-B', value: `${r.partBValidFrom} → ${r.partBValidTo}` },
      r.partAStatus && { label: 'Part-A Status', value: r.partAStatus },
      r.partBStatus && { label: 'Part-B Status', value: r.partBStatus },
    ].filter(Boolean),
  },
  {
    key: 'busPermit',
    label: 'Bus Permit',
    shortLabel: 'Bus Permit',
    color: 'orange',
    bgFrom: 'from-orange-500',
    bgTo: 'to-red-500',
    lightBg: 'bg-orange-50',
    lightBorder: 'border-orange-200',
    lightText: 'text-orange-700',
    icon: (
      <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4' />
      </svg>
    ),
    getAmount: r => ({ total: r.totalFee || 0, paid: r.paid || 0, balance: r.balance || 0 }),
    getDateInfo: r => r.validFrom && r.validTo ? `${r.validFrom} → ${r.validTo}` : '—',
    getDetails: r => [
      r.permitNumber && { label: 'Permit No', value: r.permitNumber },
      r.routeFrom && r.routeTo && { label: 'Route', value: `${r.routeFrom} → ${r.routeTo}` },
      r.category && { label: 'Category', value: r.category },
      r.status && { label: 'Status', value: r.status },
    ].filter(Boolean),
  },
  {
    key: 'temporaryPermit',
    label: 'Temporary Permit',
    shortLabel: 'Temp Permit',
    color: 'fuchsia',
    bgFrom: 'from-fuchsia-500',
    bgTo: 'to-purple-600',
    lightBg: 'bg-fuchsia-50',
    lightBorder: 'border-fuchsia-200',
    lightText: 'text-fuchsia-700',
    icon: (
      <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' />
      </svg>
    ),
    getAmount: r => ({ total: r.totalFee || 0, paid: r.paid || 0, balance: r.balance || 0 }),
    getDateInfo: r => r.validFrom && r.validTo ? `${r.validFrom} → ${r.validTo}` : '—',
    getDetails: r => [
      r.permitNumber && { label: 'Permit No', value: r.permitNumber },
      r.vehicleType && { label: 'Type', value: r.vehicleType },
      r.status && { label: 'Status', value: r.status },
    ].filter(Boolean),
  },
  {
    key: 'temporaryPermitOtherState',
    label: 'Temp Permit (Other State)',
    shortLabel: 'TP Other State',
    color: 'pink',
    bgFrom: 'from-pink-500',
    bgTo: 'to-rose-600',
    lightBg: 'bg-pink-50',
    lightBorder: 'border-pink-200',
    lightText: 'text-pink-700',
    icon: (
      <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M17 8l4 4m0 0l-4 4m4-4H3' />
      </svg>
    ),
    getAmount: r => ({ total: r.totalFee || 0, paid: r.paid || 0, balance: r.balance || 0 }),
    getDateInfo: r => r.validFrom && r.validTo ? `${r.validFrom} → ${r.validTo}` : '—',
    getDetails: r => [
      r.permitNumber && { label: 'Permit No', value: r.permitNumber },
      r.permitHolder && { label: 'Holder', value: r.permitHolder },
      r.status && { label: 'Status', value: r.status },
    ].filter(Boolean),
  },
  {
    key: 'hpaHpt',
    label: 'HPA / HPT',
    shortLabel: 'HPA/HPT',
    color: 'teal',
    bgFrom: 'from-teal-500',
    bgTo: 'to-cyan-600',
    lightBg: 'bg-teal-50',
    lightBorder: 'border-teal-200',
    lightText: 'text-teal-700',
    icon: (
      <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' />
      </svg>
    ),
    getAmount: r => ({ total: r.totalFee || 0, paid: r.paid || 0, balance: r.balance || 0 }),
    getDateInfo: () => '—',
    getDetails: r => [
      r.type && { label: 'Type', value: r.type.toUpperCase() },
      r.remarks && { label: 'Remarks', value: r.remarks },
    ].filter(Boolean),
  },
  {
    key: 'noc',
    label: 'NOC',
    shortLabel: 'NOC',
    color: 'slate',
    bgFrom: 'from-slate-500',
    bgTo: 'to-gray-600',
    lightBg: 'bg-slate-50',
    lightBorder: 'border-slate-200',
    lightText: 'text-slate-700',
    icon: (
      <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10' />
      </svg>
    ),
    getAmount: r => ({ total: r.totalFee || 0, paid: r.paid || 0, balance: r.balance || 0 }),
    getDateInfo: r => r.nocFrom && r.nocTo ? `${r.nocFrom} → ${r.nocTo}` : '—',
    getDetails: r => [
      r.remarks && { label: 'Remarks', value: r.remarks },
    ].filter(Boolean),
  },
]

// ─── Sub-component: Status Badge ─────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  if (!status) return null
  const s = status.toLowerCase()
  if (s === 'active') return (
    <span className='inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700 border border-green-200'>
      <span className='w-1.5 h-1.5 rounded-full bg-green-500'></span> Active
    </span>
  )
  if (s === 'expired') return (
    <span className='inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 border border-red-200'>
      <span className='w-1.5 h-1.5 rounded-full bg-red-500'></span> Expired
    </span>
  )
  if (s === 'expiring_soon') return (
    <span className='inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200'>
      <span className='w-1.5 h-1.5 rounded-full bg-amber-500'></span> Expiring Soon
    </span>
  )
  return (
    <span className='inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600 border border-gray-200'>
      {status}
    </span>
  )
}

// ─── Sub-component: Amount Cell ───────────────────────────────────────────────
const AmtCell = ({ value, isBalance }) => {
  const fmt = v => `₹${Number(v || 0).toLocaleString('en-IN')}`
  if (isBalance) {
    if ((value || 0) <= 0) return <span className='text-green-600 font-bold text-xs'>{fmt(value)}</span>
    return <span className='text-red-600 font-bold text-xs'>{fmt(value)}</span>
  }
  return <span className='text-gray-800 font-semibold text-xs'>{fmt(value)}</span>
}

// ─── Sub-component: Section Accordion ────────────────────────────────────────
const SectionAccordion = ({ config, section }) => {
  const [open, setOpen] = useState(false)
  const records = section?.records || []
  const { totalFee, paid, balance } = section || { totalFee: 0, paid: 0, balance: 0 }
  const hasPending = balance > 0

  if (records.length === 0) return null

  return (
    <div className={`rounded-xl border-2 overflow-hidden transition-all duration-300 ${hasPending ? 'border-red-200 shadow-red-50' : 'border-gray-200'} shadow-sm`}>
      {/* Section Header */}
      <button
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all duration-200 ${hasPending ? 'bg-gradient-to-r from-red-50 to-orange-50 hover:from-red-100 hover:to-orange-100' : 'bg-gradient-to-r from-gray-50 to-white hover:from-gray-100 hover:to-gray-50'}`}
      >
        {/* Icon */}
        <div className={`flex-shrink-0 w-9 h-9 rounded-lg bg-gradient-to-br ${config.bgFrom} ${config.bgTo} flex items-center justify-center text-white shadow-sm`}>
          {config.icon}
        </div>

        {/* Service name + record count */}
        <div className='flex-1 min-w-0'>
          <div className='flex items-center gap-2 flex-wrap'>
            <span className='font-bold text-gray-800 text-sm'>{config.label}</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${config.lightBg} ${config.lightText} ${config.lightBorder} border`}>
              {records.length} record{records.length !== 1 ? 's' : ''}
            </span>
            {hasPending && (
              <span className='text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200 animate-pulse'>
                ⚠ Pending
              </span>
            )}
          </div>
        </div>

        {/* Amounts */}
        <div className='hidden sm:flex items-center gap-4 text-right flex-shrink-0'>
          <div>
            <p className='text-[9px] text-gray-500 font-semibold uppercase'>Total</p>
            <p className='text-xs font-bold text-gray-700'>₹{Number(totalFee).toLocaleString('en-IN')}</p>
          </div>
          <div>
            <p className='text-[9px] text-gray-500 font-semibold uppercase'>Paid</p>
            <p className='text-xs font-bold text-green-600'>₹{Number(paid).toLocaleString('en-IN')}</p>
          </div>
          <div>
            <p className='text-[9px] text-gray-500 font-semibold uppercase'>Balance</p>
            <p className={`text-xs font-bold ${balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
              ₹{Number(balance).toLocaleString('en-IN')}
            </p>
          </div>
        </div>

        {/* Expand chevron */}
        <svg
          className={`w-4 h-4 flex-shrink-0 text-gray-400 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
          fill='none' stroke='currentColor' viewBox='0 0 24 24'
        >
          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
        </svg>
      </button>

      {/* Mobile amounts */}
      <div className={`sm:hidden flex items-center gap-3 px-4 pb-2 ${hasPending ? 'bg-gradient-to-r from-red-50 to-orange-50' : 'bg-gradient-to-r from-gray-50 to-white'}`}>
        <span className='text-[10px] text-gray-500'>Total: <b className='text-gray-700'>₹{Number(totalFee).toLocaleString('en-IN')}</b></span>
        <span className='text-[10px] text-gray-500'>Paid: <b className='text-green-600'>₹{Number(paid).toLocaleString('en-IN')}</b></span>
        <span className='text-[10px] text-gray-500'>Balance: <b className={balance > 0 ? 'text-red-600' : 'text-green-600'}>₹{Number(balance).toLocaleString('en-IN')}</b></span>
      </div>

      {/* Expanded Records Table */}
      {open && (
        <div className='border-t border-gray-200 overflow-x-auto'>
          <table className='w-full text-xs'>
            <thead>
              <tr className='bg-gray-50 border-b border-gray-200'>
                <th className='px-3 py-2 text-left font-bold text-gray-500 uppercase tracking-wide text-[10px] whitespace-nowrap'>#</th>
                <th className='px-3 py-2 text-left font-bold text-gray-500 uppercase tracking-wide text-[10px] whitespace-nowrap'>Date</th>
                <th className='px-3 py-2 text-left font-bold text-gray-500 uppercase tracking-wide text-[10px] whitespace-nowrap'>Validity</th>
                <th className='px-3 py-2 text-right font-bold text-gray-500 uppercase tracking-wide text-[10px] whitespace-nowrap'>Total Fee</th>
                <th className='px-3 py-2 text-right font-bold text-gray-500 uppercase tracking-wide text-[10px] whitespace-nowrap'>Paid</th>
                <th className='px-3 py-2 text-right font-bold text-gray-500 uppercase tracking-wide text-[10px] whitespace-nowrap'>Balance</th>
                <th className='px-3 py-2 text-left font-bold text-gray-500 uppercase tracking-wide text-[10px] whitespace-nowrap'>Details</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-100'>
              {records.map((record, idx) => {
                const amt = config.getAmount(record)
                const dateInfo = config.getDateInfo(record)
                const details = config.getDetails(record)
                const createdAt = record.createdAt
                  ? new Date(record.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                  : '—'
                return (
                  <tr key={record._id || idx} className={`transition-colors ${amt.balance > 0 ? 'bg-red-50/40 hover:bg-red-50' : 'bg-white hover:bg-gray-50'}`}>
                    <td className='px-3 py-2.5 text-gray-400 font-mono'>{idx + 1}</td>
                    <td className='px-3 py-2.5 text-gray-600 whitespace-nowrap'>{createdAt}</td>
                    <td className='px-3 py-2.5 text-gray-700 whitespace-nowrap font-medium'>{dateInfo}</td>
                    <td className='px-3 py-2.5 text-right'><AmtCell value={amt.total} /></td>
                    <td className='px-3 py-2.5 text-right'><AmtCell value={amt.paid} /></td>
                    <td className='px-3 py-2.5 text-right'><AmtCell value={amt.balance} isBalance /></td>
                    <td className='px-3 py-2.5'>
                      <div className='flex flex-wrap gap-1.5 items-center'>
                        {details.map((d, di) => (
                          d.label === 'Status' ? (
                            <StatusBadge key={di} status={d.value} />
                          ) : (
                            <span key={di} className='text-[10px] text-gray-500'>
                              <span className='font-semibold text-gray-600'>{d.label}:</span> {d.value}
                            </span>
                          )
                        ))}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ─── Main Modal ───────────────────────────────────────────────────────────────
const VehicleLedgerModal = ({ isOpen, onClose, registration }) => {
  const vehicleDesign = getVehicleNumberDesign()
  const [ledger, setLedger] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const vehicleNum = registration?.registrationNumber || registration?.vehicleNumber || ''
  const ownerName = registration?.ownerName || ''
  const parts = getVehicleNumberParts(vehicleNum)

  const fetchLedger = useCallback(async () => {
    if (!vehicleNum) return
    setLoading(true)
    setError(null)
    try {
      const res = await axios.get(`${API_URL}/api/vehicle-registrations/ledger/${vehicleNum}`, { withCredentials: true })
      if (res.data.success) {
        setLedger(res.data.data)
      } else {
        setError('Failed to load ledger data.')
      }
    } catch (err) {
      setError('Error loading ledger. Please try again.')
      console.error('Ledger fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [vehicleNum])

  useEffect(() => {
    if (isOpen && vehicleNum) {
      fetchLedger()
    }
    return () => { setLedger(null); setError(null) }
  }, [isOpen, vehicleNum, fetchLedger])

  // Close on Escape
  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose() }
    if (isOpen) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const grandTotal = ledger?.grandTotal || { totalFee: 0, paid: 0, balance: 0 }
  const totalRecords = ledger?.totalRecords || 0
  const sections = ledger?.sections || {}
  const hasPendingBalance = grandTotal.balance > 0

  const fmt = v => `₹${Number(v || 0).toLocaleString('en-IN')}`

  return (
    <div className='fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-4 px-2 sm:px-4'>
      {/* Backdrop */}
      <div
        className='fixed inset-0 bg-black/60 backdrop-blur-sm'
        onClick={onClose}
      />

      {/* Modal Panel */}
      <div className='relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden my-auto'>

        {/* ── Header ── */}
        <div className='relative bg-gradient-to-br from-slate-800 via-slate-900 to-gray-900 px-6 pt-6 pb-5 overflow-hidden'>
          {/* Decorative blobs */}
          <div className='absolute -top-8 -right-8 w-40 h-40 rounded-full bg-indigo-500/10 blur-2xl pointer-events-none' />
          <div className='absolute -bottom-6 -left-6 w-32 h-32 rounded-full bg-purple-500/10 blur-2xl pointer-events-none' />

          <div className='relative flex items-start justify-between gap-4'>
            <div className='flex-1 min-w-0'>
              {/* Title */}
              <p className='text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2'>Vehicle Ledger</p>

              {/* Vehicle Number */}
              <div className='mb-1'>
                {parts ? (
                  <div className={vehicleDesign.container}>
                    <span className={vehicleDesign.stateCode}>{parts.stateCode}</span>
                    <span className={vehicleDesign.districtCode}>{parts.districtCode}</span>
                    <span className={vehicleDesign.series}>{parts.series}</span>
                    <span className={vehicleDesign.last4Digits}>{parts.last4Digits}</span>
                  </div>
                ) : (
                  <span className='text-2xl font-black text-white font-mono tracking-widest'>{vehicleNum}</span>
                )}
              </div>

              {/* Owner name */}
              {ownerName && (
                <p className='text-sm font-semibold text-slate-300 mt-1'>{ownerName}</p>
              )}
              {registration?.mobileNumber && (
                <p className='text-xs text-slate-500 mt-0.5'>{registration.mobileNumber}</p>
              )}
            </div>

            {/* Close */}
            <button
              onClick={onClose}
              className='flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all duration-200'
              title='Close'
            >
              <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
              </svg>
            </button>
          </div>

          {/* Grand total summary strip */}
          {ledger && (
            <div className='relative mt-5 grid grid-cols-2 sm:grid-cols-4 gap-2'>
              {/* Work Items */}
              <div className='bg-white/8 rounded-xl px-3 py-2.5 backdrop-blur-sm border border-white/10'>
                <p className='text-[10px] font-semibold text-slate-400 uppercase tracking-wide'>Work Items</p>
                <p className='text-xl font-black text-white mt-0.5'>{totalRecords}</p>
              </div>
              {/* Total Fee */}
              <div className='bg-white/8 rounded-xl px-3 py-2.5 backdrop-blur-sm border border-white/10'>
                <p className='text-[10px] font-semibold text-slate-400 uppercase tracking-wide'>Total Fees</p>
                <p className='text-xl font-black text-white mt-0.5'>{fmt(grandTotal.totalFee)}</p>
              </div>
              {/* Paid */}
              <div className='bg-white/8 rounded-xl px-3 py-2.5 backdrop-blur-sm border border-white/10'>
                <p className='text-[10px] font-semibold text-slate-400 uppercase tracking-wide'>Total Paid</p>
                <p className='text-xl font-black text-emerald-400 mt-0.5'>{fmt(grandTotal.paid)}</p>
              </div>
              {/* Pending Balance */}
              <div className={`rounded-xl px-3 py-2.5 backdrop-blur-sm border ${hasPendingBalance ? 'bg-red-500/20 border-red-400/40' : 'bg-white/8 border-white/10'}`}>
                <p className='text-[10px] font-semibold text-slate-400 uppercase tracking-wide'>Pending Balance</p>
                <p className={`text-xl font-black mt-0.5 ${hasPendingBalance ? 'text-red-300' : 'text-emerald-400'}`}>
                  {fmt(grandTotal.balance)}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── Body ── */}
        <div className='px-4 sm:px-6 py-5 max-h-[60vh] overflow-y-auto bg-gray-50/50'>
          {/* Loading */}
          {loading && (
            <div className='flex flex-col items-center justify-center py-16 gap-3'>
              <div className='relative w-12 h-12'>
                <div className='absolute inset-0 rounded-full border-4 border-indigo-100' />
                <div className='absolute inset-0 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin' />
              </div>
              <p className='text-sm font-semibold text-gray-500'>Loading ledger for {vehicleNum}…</p>
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className='flex flex-col items-center justify-center py-12 gap-3'>
              <div className='w-12 h-12 rounded-full bg-red-100 flex items-center justify-center'>
                <svg className='w-6 h-6 text-red-500' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
                </svg>
              </div>
              <p className='text-sm font-semibold text-red-600'>{error}</p>
              <button
                onClick={fetchLedger}
                className='text-xs font-semibold text-indigo-600 hover:underline'
              >
                Try Again
              </button>
            </div>
          )}

          {/* No Records */}
          {!loading && !error && ledger && totalRecords === 0 && (
            <div className='flex flex-col items-center justify-center py-12 gap-3'>
              <div className='w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center'>
                <svg className='w-7 h-7 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' />
                </svg>
              </div>
              <p className='text-sm font-bold text-gray-600'>No work records found</p>
              <p className='text-xs text-gray-400'>No services have been recorded for {vehicleNum} yet.</p>
            </div>
          )}

          {/* Sections */}
          {!loading && !error && ledger && totalRecords > 0 && (
            <div className='space-y-3'>
              {SECTION_CONFIG.map(config => (
                <SectionAccordion
                  key={config.key}
                  config={config}
                  section={sections[config.key]}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        {ledger && (
          <div className={`px-6 py-4 border-t-2 flex items-center justify-between gap-4 ${hasPendingBalance ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}>
            <div className='flex items-center gap-2'>
              {hasPendingBalance ? (
                <>
                  <div className='w-8 h-8 rounded-full bg-red-100 flex items-center justify-center'>
                    <svg className='w-4 h-4 text-red-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
                    </svg>
                  </div>
                  <div>
                    <p className='text-xs font-bold text-red-700'>Outstanding Balance</p>
                    <p className='text-[10px] text-red-500'>Payment pending across {SECTION_CONFIG.filter(c => (sections[c.key]?.balance || 0) > 0).length} service(s)</p>
                  </div>
                </>
              ) : (
                <>
                  <div className='w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center'>
                    <svg className='w-4 h-4 text-emerald-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' />
                    </svg>
                  </div>
                  <div>
                    <p className='text-xs font-bold text-emerald-700'>All Cleared</p>
                    <p className='text-[10px] text-emerald-600'>No pending balance for this vehicle</p>
                  </div>
                </>
              )}
            </div>

            <div className='text-right flex-shrink-0'>
              <p className='text-[10px] font-semibold text-gray-500 uppercase tracking-wide'>Total Pending</p>
              <p className={`text-2xl font-black ${hasPendingBalance ? 'text-red-600' : 'text-emerald-600'}`}>
                {fmt(grandTotal.balance)}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default VehicleLedgerModal
