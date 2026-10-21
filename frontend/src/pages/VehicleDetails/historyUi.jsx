import React from 'react'

const DOC_LABELS = { Insurance: 'Insurance', Fitness: 'Fitness', Tax: 'Road Tax', PUC: 'PUC' }

// One-glance expiry status for a saved search row: only the documents that need attention
// (expired, or 30 days or less left). Every date is on the detail page.
export const ExpiryStatus = ({ documents }) => {
  const docs = documents || []
  const alerts = docs.filter((doc) => doc.daysLeft <= 30).sort((a, b) => a.daysLeft - b.daysLeft)

  if (!docs.length) return <span className="text-[11px] text-slate-400">No dates</span>
  if (!alerts.length) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
        All valid
      </span>
    )
  }
  return (
    <div className="flex flex-wrap gap-1">
      {alerts.map((doc) => (
        <span
          key={doc.type}
          className={`px-1.5 py-0.5 rounded text-[10px] font-bold whitespace-nowrap ${
            doc.daysLeft < 0 ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
          }`}
        >
          {DOC_LABELS[doc.type] || doc.type}{' '}
          {doc.daysLeft < 0 ? 'expired' : doc.daysLeft === 0 ? 'today' : `${doc.daysLeft}d`}
        </span>
      ))}
    </div>
  )
}
