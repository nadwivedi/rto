import { useEffect, useState } from 'react'
import { getPaymentsByWork } from '../../../utils/paymentReceivedApi'

const NocDetailModal = ({ isOpen, onClose, record }) => {
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  const [paymentReceived, setPaymentReceived] = useState([])

  useEffect(() => {
    if (record?._id) {
      getPaymentsByWork('NOC', record._id).then(res => {
        setPaymentReceived(res.data)
      }).catch(() => setPaymentReceived([]))
    } else {
      setPaymentReceived([])
    }
  }, [record?._id])

  if (!isOpen || !record) return null

  const validFeeItems = record.feeBreakup?.filter((item) => item.amount && Number(item.amount) > 0) || []

  return (
    <div className='fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-2 md:p-4'>
      <div className='bg-white rounded-xl md:rounded-2xl shadow-2xl max-w-3xl w-full max-h-[95vh] overflow-hidden flex flex-col'>
        <div className='bg-gradient-to-r from-teal-600 to-cyan-600 p-3 md:p-4 text-white flex-shrink-0'>
          <div className='flex justify-between items-center'>
            <div>
              <h2 className='text-lg md:text-xl font-bold'>NOC Details</h2>
              <p className='text-xs md:text-sm text-white/90 font-mono mt-0.5'>{record.vehicleNumber}</p>
            </div>
            <button type='button' onClick={onClose} className='text-white hover:bg-white/20 rounded-lg p-2 transition'>
              <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
              </svg>
            </button>
          </div>
        </div>

        <div className='p-4 md:p-6 overflow-y-auto'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-4'>
            <div className='bg-teal-50 rounded-lg border border-teal-200 p-3'>
              <p className='text-xs text-teal-700 font-semibold uppercase'>Owner Name</p>
              <p className='text-sm font-bold text-gray-900'>{record.ownerName}</p>
            </div>
            <div className='bg-teal-50 rounded-lg border border-teal-200 p-3'>
              <p className='text-xs text-teal-700 font-semibold uppercase'>Mobile Number</p>
              <p className='text-sm font-bold text-gray-900'>{record.mobileNumber}</p>
            </div>
            <div className='bg-blue-50 rounded-lg border border-blue-200 p-3'>
              <p className='text-xs text-blue-700 font-semibold uppercase'>NOC From</p>
              <p className='text-sm font-bold text-gray-900'>{record.nocFrom}</p>
            </div>
            <div className='bg-blue-50 rounded-lg border border-blue-200 p-3'>
              <p className='text-xs text-blue-700 font-semibold uppercase'>NOC To</p>
              <p className='text-sm font-bold text-gray-900'>{record.nocTo}</p>
            </div>
          </div>

          <div className='bg-teal-50 rounded-lg border border-teal-200 p-3 mb-4'>
            <p className='text-xs text-teal-700 font-semibold uppercase'>Date of Work</p>
            <p className='text-sm font-bold text-gray-900'>{record.date || '-'}</p>
          </div>

          <div className='bg-purple-50 rounded-lg border border-purple-200 p-4 mb-4'>
            <h4 className='text-sm font-bold text-purple-800 mb-3'>Payment Information</h4>
            <div className='grid grid-cols-4 gap-3'>
              <div>
                <p className='text-xs text-gray-500 font-semibold'>Total Fee</p>
                <p className='text-sm font-bold text-gray-900'>Rs {(record.totalFee || 0).toLocaleString('en-IN')}</p>
              </div>
              <div>
                <p className='text-xs text-gray-500 font-semibold'>Paid</p>
                <p className='text-sm font-bold text-emerald-700'>Rs {(record.paid || 0).toLocaleString('en-IN')}</p>
              </div>
              <div>
                <p className='text-xs text-gray-500 font-semibold'>Balance</p>
                <p className={`text-sm font-bold ${record.balance > 0 ? 'text-orange-600' : 'text-gray-600'}`}>
                  Rs {(record.balance || 0).toLocaleString('en-IN')}
                </p>
              </div>
              <div>
                <p className='text-xs text-gray-500 font-semibold'>Payment Mode</p>
                <p className='text-sm font-bold text-cyan-700'>{record.paymentMode || 'Cash'}</p>
              </div>
            </div>
          </div>

          {record.profit > 0 && (
            <div className='bg-green-50 rounded-lg border border-green-200 p-4 mb-4'>
              <h4 className='text-sm font-bold text-green-800 mb-2'>Profit</h4>
              <p className='text-lg font-bold text-green-900'>₹{(record.profit || 0).toLocaleString('en-IN')}</p>
            </div>
          )}

          {(() => {
            const validExpenseItems = record.expenseBreakup?.filter(item => item.name && Number(item.amount) > 0) || []
            return validExpenseItems.length > 0 && (
              <div className='bg-orange-50 rounded-lg border border-orange-200 p-4 mb-4'>
                <h4 className='text-sm font-bold text-orange-800 mb-3'>Expense Breakdown</h4>
                <div className='space-y-2'>
                  {validExpenseItems.map((item, index) => (
                    <div key={index} className='flex items-center justify-between text-sm bg-white border border-orange-200 rounded-md px-3 py-2'>
                      <span className='font-semibold text-gray-700'>{item.name}</span>
                      <span className='font-bold text-gray-900'>₹{Number(item.amount).toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                  <div className='flex items-center justify-between text-sm bg-orange-100 border border-orange-300 rounded-md px-3 py-2 font-bold'>
                    <span className='text-gray-800'>Total Expense</span>
                    <span className='text-orange-700'>₹{validExpenseItems.reduce((sum, item) => sum + Number(item.amount), 0).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            )
          })()}

              {/* Payment Received Breakdown */}
              {paymentReceived.length > 0 && (
                <div className='bg-gradient-to-br from-cyan-50 to-teal-50 rounded-xl p-4 border border-cyan-200 mb-4'>
                  <h4 className='text-sm font-bold text-cyan-800 mb-3'>Payment Received Breakdown</h4>
                  <div className='overflow-x-auto'>
                    <table className='w-full text-sm'>
                      <thead>
                        <tr className='border-b-2 border-cyan-200'>
                          <th className='text-left py-2 px-3 text-cyan-700 font-bold'>Date</th>
                          <th className='text-right py-2 px-3 text-cyan-700 font-bold'>Amount</th>
                          <th className='text-center py-2 px-3 text-cyan-700 font-bold'>Method</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paymentReceived.map((p, i) => (
                          <tr key={i} className='border-b border-cyan-100'>
                            <td className='py-2 px-3 text-gray-700 font-semibold'>{p.date}</td>
                            <td className='py-2 px-3 text-right font-bold text-gray-900'>₹{(p.amount || 0).toLocaleString('en-IN')}</td>
                            <td className='py-2 px-3 text-center'>
                              <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${
                                p.paymentMode === 'Cash' ? 'bg-green-100 text-green-700' :
                                p.paymentMode === 'Bank' ? 'bg-blue-100 text-blue-700' :
                                'bg-purple-100 text-purple-700'
                              }`}>
                                {p.paymentMode}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className='bg-cyan-100 font-bold'>
                          <td className='py-2 px-3 text-cyan-800'>Total</td>
                          <td className='py-2 px-3 text-right text-cyan-900'>₹{paymentReceived.reduce((sum, p) => sum + (p.amount || 0), 0).toLocaleString('en-IN')}</td>
                          <td className='py-2 px-3'></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}

          {validFeeItems.length > 0 && (
            <div className='bg-gray-50 rounded-lg border border-gray-200 p-4 mb-4'>
              <h4 className='text-sm font-bold text-gray-800 mb-3'>Fee Breakdown</h4>
              <div className='space-y-2'>
                {validFeeItems.map((item, index) => (
                  <div key={index} className='flex items-center justify-between text-sm bg-white border border-gray-200 rounded-md px-3 py-2'>
                    <span className='font-semibold text-gray-700'>{item.name}</span>
                    <span className='font-bold text-gray-900'>Rs {Number(item.amount).toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {record.remarks && (
            <div className='bg-amber-50 rounded-lg border border-amber-200 p-4'>
              <h4 className='text-sm font-bold text-amber-800 mb-2'>Remarks</h4>
              <p className='text-sm text-gray-800'>{record.remarks}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default NocDetailModal
