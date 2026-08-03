import { useEffect, useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { useNavigate } from 'react-router-dom'
import { Plus, ArrowLeft, Wallet, Users, Truck, Receipt } from 'lucide-react'
import AddMoneyReceivedModal from '../Party/components/AddMoneyReceivedModal'

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'

const formatINR = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`

const formatDate = (value) => {
  if (!value) return '-'
  return String(value)
}

const MoneyReceived = () => {
  const navigate = useNavigate()
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)

  const fetchRecords = async () => {
    try {
      setLoading(true)
      const res = await axios.get(`${API_URL}/api/parties/money-received`, { withCredentials: true })
      if (res.data.success) setRecords(res.data.data || [])
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load money received records')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRecords()
  }, [])

  const totalAmount = records.reduce((sum, r) => sum + (Number(r.amount) || 0), 0)

  return (
    <div className='min-h-screen bg-slate-100 px-4 py-6 sm:px-6 lg:px-10'>
      <div className='mx-auto max-w-6xl'>
        {/* Header */}
        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6'>
          <div className='flex items-center gap-3'>
            <button
              onClick={() => navigate('/vahan')}
              className='flex items-center justify-center w-10 h-10 rounded-xl bg-white border border-gray-200 shadow-sm hover:shadow-md hover:border-amber-300 transition-all cursor-pointer'
              title='Back to Vahan'
            >
              <ArrowLeft size={20} className='text-gray-600' />
            </button>
            <div>
              <h1 className='text-2xl font-black text-slate-800'>Money Received</h1>
              <p className='text-sm text-slate-500 mt-0.5'>All money received entries</p>
            </div>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className='inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 px-5 py-2.5 text-sm font-bold text-white shadow-md hover:from-emerald-600 hover:to-green-600 transition-all cursor-pointer'
          >
            <svg className='h-4 w-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 4v16m8-8H4' />
            </svg>
            Add Money Received
          </button>
        </div>

        {/* Summary cards */}
        <div className='grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6'>
          <div className='bg-white rounded-2xl border border-gray-200 p-5 shadow-sm flex items-center gap-4'>
            <div className='w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center'>
              <Wallet size={24} className='text-amber-600' />
            </div>
            <div>
              <p className='text-xs font-semibold text-slate-500 uppercase tracking-wide'>Entries</p>
              <p className='text-2xl font-black text-slate-800'>{records.length}</p>
            </div>
          </div>
          <div className='bg-white rounded-2xl border border-emerald-200 p-5 shadow-sm flex items-center gap-4'>
            <div className='w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center'>
              <Receipt size={24} className='text-emerald-600' />
            </div>
            <div>
              <p className='text-xs font-semibold text-slate-500 uppercase tracking-wide'>Total Amount</p>
              <p className='text-2xl font-black text-emerald-600'>{formatINR(totalAmount)}</p>
            </div>
          </div>
          <div className='bg-white rounded-2xl border border-indigo-200 p-5 shadow-sm flex items-center gap-4'>
            <div className='w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center'>
              <Users size={24} className='text-indigo-600' />
            </div>
            <div>
              <p className='text-xs font-semibold text-slate-500 uppercase tracking-wide'>Parties</p>
              <p className='text-2xl font-black text-slate-800'>
                {new Set(records.map(r => r.party?._id).filter(Boolean)).size}
              </p>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className='bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden'>
          {loading ? (
            <div className='p-8 space-y-4'>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className='animate-pulse h-6 bg-gray-100 rounded'></div>
              ))}
            </div>
          ) : records.length === 0 ? (
            <div className='p-14 text-center'>
              <div className='w-16 h-16 mx-auto bg-amber-50 rounded-2xl flex items-center justify-center mb-4'>
                <Wallet size={32} className='text-amber-400' />
              </div>
              <p className='text-slate-500 font-semibold'>No money received entries yet</p>
              <p className='text-slate-400 text-sm mt-1'>Click "Add Money Received" to record the first entry.</p>
            </div>
          ) : (
            <div className='overflow-x-auto'>
              <table className='w-full'>
                <thead>
                  <tr className='border-b border-gray-100 bg-slate-50/50'>
                    <th className='px-5 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider'>Date</th>
                    <th className='px-5 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider'>Party</th>
                    <th className='px-5 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider'>Vehicle Number</th>
                    <th className='px-5 py-3.5 text-right text-xs font-bold text-slate-500 uppercase tracking-wider'>Amount</th>
                    <th className='px-5 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider'>Remark</th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-gray-50'>
                  {records.map((record) => (
                    <tr key={record._id} className='hover:bg-amber-50/30 transition-colors'>
                      <td className='px-5 py-3.5 text-sm font-medium text-slate-700 whitespace-nowrap'>
                        {formatDate(record.moneyReceivedDate)}
                      </td>
                      <td className='px-5 py-3.5 text-sm font-semibold text-slate-800'>
                        {record.party?.partyName || '-'}
                        {record.party?.mobile && (
                          <span className='block text-xs font-normal text-slate-400'>{record.party.mobile}</span>
                        )}
                      </td>
                      <td className='px-5 py-3.5 text-sm font-semibold text-slate-700 whitespace-nowrap'>
                        {record.vehicleNumber || '-'}
                      </td>
                      <td className='px-5 py-3.5 text-sm font-bold text-emerald-600 text-right whitespace-nowrap'>
                        {formatINR(record.amount)}
                      </td>
                      <td className='px-5 py-3.5 text-sm text-slate-500'>{record.remark || '-'}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className='border-t border-gray-100 bg-gray-50/70'>
                    <td colSpan='3' className='px-5 py-3.5 text-right text-sm font-bold text-slate-700'>
                      Total
                    </td>
                    <td className='px-5 py-3.5 text-right text-sm font-black text-emerald-600 whitespace-nowrap'>
                      {formatINR(totalAmount)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>

      {showAddModal && (
        <AddMoneyReceivedModal
          isOpen={true}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => { setShowAddModal(false); fetchRecords() }}
        />
      )}
    </div>
  )
}

export default MoneyReceived