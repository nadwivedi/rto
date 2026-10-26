import React from 'react'
import { Shield, FileCheck, Receipt, Leaf, Clock, Eye, Save, Download, FileText, Trash2, RefreshCw, CheckCircle2, Database } from 'lucide-react'
import RcFormsMenu from './RcFormsMenu'

const formatSearchedAt = (dateStr) => {
  if (!dateStr) return 'N/A'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return String(dateStr)
  return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })
}

// One validity line: red when expired, amber when 30 days or less are left
const Validity = ({ icon, label, value, doc }) => {
  const Icon = icon
  const isExpired = doc && doc.daysLeft < 0
  const isSoon = doc && doc.daysLeft >= 0 && doc.daysLeft <= 30
  const tone = isExpired ? 'text-red-600' : isSoon ? 'text-amber-600' : doc ? 'text-emerald-700' : 'text-slate-400'
  return (
    <div className="flex items-center justify-between gap-2 text-xs">
      <span className="flex items-center gap-1.5 text-slate-500">
        <Icon className="w-3.5 h-3.5 shrink-0" />
        {label}
      </span>
      <span className={`font-semibold ${tone} text-right`}>
        {value || 'NA'}
        {(isExpired || isSoon) && (
          <span className="ml-1 text-[10px] font-bold uppercase">
            {isExpired ? 'Expired' : doc.daysLeft === 0 ? 'Today' : `${doc.daysLeft}d left`}
          </span>
        )}
      </span>
    </div>
  )
}

const actionBtn = 'inline-flex items-center justify-center gap-1 px-2.5 py-1.5 font-semibold rounded-lg text-xs transition cursor-pointer disabled:opacity-50'

/**
 * Card for one saved vehicle search: insurance / fitness / tax / PUC validity and search time,
 * with View, Save, RC PDF and Particular as buttons. Only the RC forms sit in a dropdown.
 */
export const HistoryCard = ({
  item,
  onView,
  onSave,
  onRcPdf,
  onParticular,
  onDelete,
  canSave,
  rcFormTypes = [],
  saving,
  pdfLoading,
  particularLoading,
  deleting,
  selectable,
  selected,
  selectDisabled,
  selectDisabledReason,
  onToggleSelect
}) => {
  const docOf = (type) => item.documents?.find((d) => d.type === type)
  const inLeads = Boolean(item.lead?.isOpen)
  const pucUpto = item.pucUpto || item.rawResponse?.PUCC_UPTO || item.rawResponse?.PUC_UPTO

  return (
    <div className={`flex flex-col bg-white rounded-2xl border shadow-sm p-4 transition ${selected ? 'border-indigo-400 ring-2 ring-indigo-100' : 'border-slate-200 hover:border-indigo-200 hover:shadow'}`}>
      {/* Vehicle no + owner */}
      <div className="flex items-start gap-2">
        {selectable && (
          <input
            type="checkbox"
            checked={selected}
            onChange={onToggleSelect}
            disabled={selectDisabled}
            className="mt-1 w-4 h-4 cursor-pointer accent-indigo-600 disabled:cursor-default"
            aria-label={`Select ${item.vehicleNumber}`}
            title={selectDisabled ? selectDisabledReason : undefined}
          />
        )}
        <button type="button" onClick={onView} className="min-w-0 flex-1 text-left cursor-pointer group" title="View full details">
          <span className="font-mono font-bold text-base text-slate-900 tracking-wide group-hover:text-indigo-700">
            {item.vehicleNumber}
          </span>
          <span className="block text-xs text-slate-500 truncate">{item.ownerName || 'NA'}</span>
        </button>
        {inLeads && (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 shrink-0">
            <CheckCircle2 className="w-3 h-3" />
            In Leads
          </span>
        )}
        {item.saved && (
          <span
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-violet-50 text-violet-700 shrink-0"
            title="Saved to Vehicle Registration"
          >
            <Database className="w-3 h-3" />
            Saved
          </span>
        )}
        {onDelete && (
          <button
            onClick={onDelete}
            disabled={deleting}
            className="p-1 -mr-1 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer shrink-0"
            title="Delete from history"
          >
            {deleting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>

      {/* Validity */}
      <div className="mt-3 space-y-1.5 rounded-xl bg-slate-50 px-3 py-2.5">
        <Validity icon={Shield} label="Insurance" value={item.insuranceUpto} doc={docOf('Insurance')} />
        <Validity icon={FileCheck} label="Fitness" value={item.fitnessUpto} doc={docOf('Fitness')} />
        <Validity icon={Receipt} label="Tax" value={item.taxUpto} doc={docOf('Tax')} />
        <Validity icon={Leaf} label="PUC" value={pucUpto} doc={docOf('PUC')} />
      </div>

      <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-400">
        <Clock className="w-3 h-3" />
        Searched {formatSearchedAt(item.lastSearchedAt || item.updatedAt)}
      </div>

      {/* Actions */}
      <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
        <button onClick={onView} className={`${actionBtn} bg-indigo-600 hover:bg-indigo-700 text-white`} title="View full details (No API call)">
          <Eye className="w-3.5 h-3.5" />
          View
        </button>
        {canSave && (
          <button
            onClick={onSave}
            disabled={saving}
            className={`${actionBtn} bg-violet-50 hover:bg-violet-100 text-violet-700`}
            title="Save to Vehicle Registration, Fitness, Insurance and PUC (fee 0)"
          >
            {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save
          </button>
        )}
        <button onClick={onRcPdf} disabled={pdfLoading} className={`${actionBtn} bg-rose-50 hover:bg-rose-100 text-rose-700`} title="Download RC PDF">
          {pdfLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
          RC
        </button>
        <button onClick={onParticular} disabled={particularLoading} className={`${actionBtn} bg-amber-50 hover:bg-amber-100 text-amber-700`} title="Download Particular PDF">
          {particularLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
          Particular
        </button>
        {rcFormTypes.length > 0 && <RcFormsMenu historyId={item._id} types={rcFormTypes} />}
      </div>
    </div>
  )
}
