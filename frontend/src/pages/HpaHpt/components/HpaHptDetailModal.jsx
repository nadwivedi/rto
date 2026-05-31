const HpaHptDetailModal = ({ isOpen, onClose, record, onEdit, onDelete, onMarkAsPaid }) => {
  if (!isOpen || !record) return null;

  const typeLabel = record.type === 'hpa' ? 'HPA' : 'HPT';
  const typeFullLabel = record.type === 'hpa' ? 'Hypothecation Addition' : 'Hypothecation Termination';
  const hasBalance = (record.balance || 0) > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-2">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-rose-600 to-pink-600 rounded-t-2xl px-6 py-4 z-10">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  record.type === 'hpa'
                    ? 'bg-rose-200 text-rose-800'
                    : 'bg-pink-200 text-pink-800'
                }`}>{typeLabel}</span>
                <span className="text-rose-200 text-xs">{typeFullLabel}</span>
              </div>
              <h2 className="text-xl font-bold text-white font-mono tracking-widest">{record.vehicleNumber}</h2>
              {record.ownerName && <p className="text-rose-100 text-sm mt-0.5">{record.ownerName}</p>}
            </div>
            <button onClick={onClose} className="text-white hover:text-rose-200 transition-colors mt-1">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Date */}
          {record.date && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap='round' strokeLinejoin='round' d='M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5' />
                </svg>
              </div>
              <div>
                <p className="text-xs text-gray-500">Date of Work</p>
                <p className="font-semibold text-gray-800">{record.date}</p>
              </div>
            </div>
          )}

          {/* Info */}
          {record.mobileNumber && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-gray-500">Mobile</p>
                <p className="font-semibold text-gray-800">{record.mobileNumber}</p>
              </div>
            </div>
          )}

          {/* Fee Summary */}
          <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-xl p-4 border border-rose-100">
            <h3 className="text-sm font-bold text-rose-700 mb-3">Fee Summary</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                <p className="text-xs text-gray-500 mb-1">Total Fee</p>
                <p className="text-lg font-bold text-gray-800">₹{(record.totalFee || 0).toLocaleString('en-IN')}</p>
              </div>
              <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                <p className="text-xs text-gray-500 mb-1">Paid</p>
                <p className="text-lg font-bold text-green-600">₹{(record.paid || 0).toLocaleString('en-IN')}</p>
              </div>
              <div className={`text-center p-3 rounded-lg shadow-sm ${hasBalance ? 'bg-amber-50 border border-amber-200' : 'bg-green-50 border border-green-200'}`}>
                <p className="text-xs text-gray-500 mb-1">Balance</p>
                <p className={`text-lg font-bold ${hasBalance ? 'text-amber-600' : 'text-green-600'}`}>
                  ₹{(record.balance || 0).toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          </div>

          {/* Fee Breakup */}
          {record.feeBreakup && record.feeBreakup.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-gray-700 mb-2">Fee Breakup</h3>
              <div className="border border-gray-100 rounded-xl overflow-hidden">
                {record.feeBreakup.map((item, index) => (
                  <div key={index} className={`flex justify-between items-center px-4 py-2.5 text-sm ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                    <span className="text-gray-700">{item.name}</span>
                    <span className="font-semibold text-gray-800">₹{(item.amount || 0).toLocaleString('en-IN')}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center px-4 py-2.5 text-sm bg-rose-50 border-t border-rose-100">
                  <span className="font-bold text-rose-700">Total</span>
                  <span className="font-bold text-rose-700">
                    ₹{record.feeBreakup.reduce((sum, item) => sum + (item.amount || 0), 0).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Remarks */}
          {record.remarks && (
            <div className="p-3 bg-gray-50 rounded-xl">
              <p className="text-xs font-semibold text-gray-500 mb-1">Remarks</p>
              <p className="text-sm text-gray-700">{record.remarks}</p>
            </div>
          )}

          {/* Date */}
          <div className="text-xs text-gray-400 text-right">
            Added: {record.createdAt ? new Date(record.createdAt).toLocaleDateString('en-IN') : '-'}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-2">
            {hasBalance && (
              <button
                onClick={() => { onMarkAsPaid(record); onClose(); }}
                className="flex-1 py-2.5 rounded-xl bg-green-500 text-white font-semibold text-sm hover:bg-green-600 transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Mark Paid
              </button>
            )}
            <button
              onClick={() => { onEdit(record); onClose(); }}
              className="flex-1 py-2.5 rounded-xl bg-amber-500 text-white font-semibold text-sm hover:bg-amber-600 transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </button>
            <button
              onClick={() => { onDelete(record); onClose(); }}
              className="py-2.5 px-4 rounded-xl bg-red-500 text-white font-semibold text-sm hover:bg-red-600 transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HpaHptDetailModal;
