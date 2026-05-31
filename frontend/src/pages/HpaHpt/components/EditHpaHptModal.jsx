import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { validateVehicleNumberRealtime } from '../../../utils/vehicleNoCheck';
import { handlePaymentCalculation } from '../../../utils/paymentValidation';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

const EditHpaHptModal = ({ isOpen, onClose, onSubmit, record }) => {
  const [formData, setFormData] = useState({
    date: '',
    vehicleNumber: '',
    ownerName: '',
    mobileNumber: '',
    partyId: '',
    type: 'hpa',
    totalFee: '0',
    paid: '0',
    balance: '0',
    remarks: '',
    feeBreakup: []
  });
  const [vehicleValidation, setVehicleValidation] = useState({ isValid: false, message: '' });
  const [paidExceedsTotal, setPaidExceedsTotal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && record) {
      setFormData({
        date: record.date || '',
        vehicleNumber: record.vehicleNumber || '',
        ownerName: record.ownerName || '',
        mobileNumber: record.mobileNumber || '',
        partyId: record.partyId || '',
        type: record.type || 'hpa',
        totalFee: String(record.totalFee ?? '0'),
        paid: String(record.paid ?? '0'),
        balance: String(record.balance ?? '0'),
        remarks: record.remarks || '',
        feeBreakup: record.feeBreakup?.length
          ? record.feeBreakup.map(f => ({ name: f.name, amount: String(f.amount) }))
          : [{ name: 'HPA/HPT Fee', amount: '' }, { name: 'Service Charge', amount: '' }]
      });
      if (record.vehicleNumber) {
        setVehicleValidation({ isValid: true, message: 'Vehicle number loaded' });
      }
      setPaidExceedsTotal(false);
    }
  }, [isOpen, record]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'vehicleNumber') {
      const upperValue = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
      setFormData(prev => ({ ...prev, vehicleNumber: upperValue }));
      const validation = validateVehicleNumberRealtime(upperValue);
      setVehicleValidation(validation);
      return;
    }
    if (name === 'totalFee' || name === 'paid') {
      const result = handlePaymentCalculation(name, value, formData);
      setFormData(prev => ({
        ...prev,
        ...(name === 'totalFee' ? { totalFee: value } : {}),
        paid: result.paid,
        balance: result.balance
      }));
      setPaidExceedsTotal(result.paidExceedsTotal);
      return;
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFeeBreakupChange = (index, field, value) => {
    setFormData(prev => {
      const updated = [...prev.feeBreakup];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, feeBreakup: updated };
    });
  };

  const addFeeBreakupRow = () => {
    setFormData(prev => ({
      ...prev,
      feeBreakup: [...prev.feeBreakup, { name: '', amount: '' }]
    }));
  };

  const removeFeeBreakupRow = (index) => {
    setFormData(prev => ({
      ...prev,
      feeBreakup: prev.feeBreakup.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.vehicleNumber) { toast.error('Vehicle number is required'); return; }
    if (paidExceedsTotal) { toast.error('Paid amount cannot exceed total fee'); return; }

    setIsSubmitting(true);
    try {
      const cleanedFeeBreakup = formData.feeBreakup
        .filter(item => item.name && item.name.trim())
        .map(item => ({ name: item.name.trim(), amount: parseFloat(item.amount) || 0 }));

      const payload = {
        date: formData.date || undefined,
        vehicleNumber: formData.vehicleNumber,
        ownerName: formData.ownerName,
        mobileNumber: formData.mobileNumber,
        partyId: formData.partyId || undefined,
        type: formData.type,
        totalFee: parseFloat(formData.totalFee) || 0,
        paid: parseFloat(formData.paid) || 0,
        balance: parseFloat(formData.balance) || 0,
        remarks: formData.remarks,
        feeBreakup: cleanedFeeBreakup
      };

      const response = await axios.put(`${API_URL}/api/hpa-hpt/id/${record._id}`, payload, { withCredentials: true });
      if (response.data.success) {
        toast.success('HPA/HPT record updated successfully!');
        onSubmit();
        onClose();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update HPA/HPT record');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEnterKey = (e, nextFieldId) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const nextField = document.getElementById(nextFieldId);
      if (nextField) nextField.focus();
    }
  };

  if (!isOpen || !record) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-2">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-amber-500 to-orange-500 rounded-t-2xl px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-xl font-bold text-white">Edit HPA / HPT</h2>
            <p className="text-amber-100 text-sm font-mono">{record.vehicleNumber}</p>
          </div>
          <button onClick={onClose} className="text-white hover:text-amber-200 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Date of Work */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Date of Work</label>
            <input
              type='date'
              name='date'
              value={formData.date ? formData.date.split('-').reverse().join('-') : ''}
              onChange={(e) => {
                const val = e.target.value;
                if (!val) { setFormData(p => ({ ...p, date: '' })); return; }
                const [y, m, d] = val.split('-');
                setFormData(p => ({ ...p, date: `${d}-${m}-${y}` }));
              }}
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all"
            />
          </div>

          {/* Vehicle Info Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Vehicle Number */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Vehicle Number *</label>
              <input
                id="vehicleNumber"
                type="text"
                name="vehicleNumber"
                value={formData.vehicleNumber}
                onChange={handleChange}
                onKeyDown={(e) => handleEnterKey(e, 'ownerName')}
                className={`w-full px-4 py-2.5 border-2 rounded-xl font-mono uppercase tracking-widest transition-all focus:outline-none focus:ring-2 ${
                  vehicleValidation.isValid
                    ? 'border-green-400 focus:border-green-500 focus:ring-green-200'
                    : 'border-gray-200 focus:border-amber-400 focus:ring-amber-100'
                }`}
              />
            </div>

            {/* Owner Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Owner Name</label>
              <input
                id="ownerName"
                type="text"
                name="ownerName"
                value={formData.ownerName}
                onChange={handleChange}
                onKeyDown={(e) => handleEnterKey(e, 'mobileNumber')}
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all"
              />
            </div>

            {/* Mobile Number */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Mobile Number</label>
              <input
                id="mobileNumber"
                type="text"
                name="mobileNumber"
                value={formData.mobileNumber}
                onChange={handleChange}
                onKeyDown={(e) => handleEnterKey(e, 'totalFee')}
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all"
              />
            </div>
          </div>

          {/* Type Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Type *</label>
            <div className="flex gap-3">
              {['hpa', 'hpt'].map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, type: t }))}
                  className={`flex-1 py-2.5 rounded-xl font-bold uppercase tracking-wider transition-all ${
                    formData.type === t
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md scale-105'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {t === 'hpa' ? 'HPA' : 'HPT'}
                  <p className={`text-xs font-normal normal-case mt-0.5 ${formData.type === t ? 'text-amber-100' : 'text-gray-400'}`}>
                    {t === 'hpa' ? 'Hypothecation Addition' : 'Hypothecation Termination'}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Fee Section */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-100">
            <h3 className="text-sm font-bold text-amber-700 mb-3 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Fee Details
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Total Fee (₹)</label>
                <input id="totalFee" type="number" name="totalFee" value={formData.totalFee} onChange={handleChange} onKeyDown={(e) => handleEnterKey(e, 'paid')} min="0"
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-amber-400 text-right font-semibold" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Paid (₹)</label>
                <input id="paid" type="number" name="paid" value={formData.paid} onChange={handleChange} min="0"
                  className={`w-full px-3 py-2 border-2 rounded-lg focus:outline-none text-right font-semibold ${paidExceedsTotal ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-amber-400'}`} />
                {paidExceedsTotal && <p className="text-red-500 text-xs mt-0.5">Exceeds total!</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Balance (₹)</label>
                <input type="number" name="balance" value={formData.balance} readOnly
                  className={`w-full px-3 py-2 border-2 rounded-lg text-right font-bold cursor-not-allowed ${parseFloat(formData.balance) > 0 ? 'border-amber-300 bg-amber-50 text-amber-700' : 'border-green-300 bg-green-50 text-green-700'}`} />
              </div>
            </div>
          </div>

          {/* Fee Breakup */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-bold text-gray-700">Fee Breakup</label>
              <button type="button" onClick={addFeeBreakupRow}
                className="text-xs text-amber-600 hover:text-amber-700 font-semibold flex items-center gap-1 transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Row
              </button>
            </div>
            <div className="space-y-2">
              {formData.feeBreakup.map((item, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <input type="text" value={item.name} onChange={e => handleFeeBreakupChange(index, 'name', e.target.value)}
                    placeholder="Description"
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-amber-400" />
                  <input type="number" value={item.amount} onChange={e => handleFeeBreakupChange(index, 'amount', e.target.value)}
                    placeholder="₹ Amount"
                    className="w-28 px-3 py-2 border border-gray-200 rounded-lg text-sm text-right focus:outline-none focus:border-amber-400" />
                  <button type="button" onClick={() => removeFeeBreakupRow(index)} className="text-red-400 hover:text-red-600 transition-colors p-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Remarks</label>
            <textarea name="remarks" value={formData.remarks} onChange={handleChange} rows={2}
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all resize-none text-sm" />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-all">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting || paidExceedsTotal}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold hover:from-amber-600 hover:to-orange-600 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-md">
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </span>
              ) : 'Update Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditHpaHptModal;
