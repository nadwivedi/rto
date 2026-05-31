import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { validateVehicleNumberRealtime } from '../../../utils/vehicleNoCheck';
import { handlePaymentCalculation } from '../../../utils/paymentValidation';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

const AddHpaHptModal = ({ isOpen, onClose, onSubmit, prefilledVehicleNumber = '', prefilledOwnerName = '', prefilledMobileNumber = '' }) => {
  const [formData, setFormData] = useState({
    date: '',
    vehicleNumber: prefilledVehicleNumber,
    ownerName: prefilledOwnerName,
    mobileNumber: prefilledMobileNumber,
    partyId: '',
    type: 'hpa',
    totalFee: '0',
    paid: '0',
    balance: '0',
    remarks: '',
    feeBreakup: [
      { name: 'HPA/HPT Fee', amount: '' }
    ]
  });
  const [vehicleValidation, setVehicleValidation] = useState({ isValid: false, message: '' });
  const [paidExceedsTotal, setPaidExceedsTotal] = useState(false);
  const [fetchingVehicle, setFetchingVehicle] = useState(false);
  const [vehicleError, setVehicleError] = useState('');
  const [vehicleMatches, setVehicleMatches] = useState([]);
  const [showVehicleDropdown, setShowVehicleDropdown] = useState(false);
  const [selectedDropdownIndex, setSelectedDropdownIndex] = useState(0);
  const dropdownItemRefs = useRef([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setFormData({
      date: '',
      vehicleNumber: prefilledVehicleNumber,
      ownerName: prefilledOwnerName,
      mobileNumber: prefilledMobileNumber,
      partyId: '',
      type: 'hpa',
      totalFee: '0',
      paid: '0',
      balance: '0',
      remarks: '',
      feeBreakup: [
        { name: 'HPA/HPT Fee', amount: '' }
      ]
    });
    setPaidExceedsTotal(false);
    setVehicleValidation({ isValid: false, message: '' });
    setFetchingVehicle(false);
    setVehicleError('');
    setVehicleMatches([]);
    setShowVehicleDropdown(false);
    setSelectedDropdownIndex(0);
  };

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && (prefilledVehicleNumber || prefilledOwnerName || prefilledMobileNumber)) {
      setFormData(prev => ({
        ...prev,
        vehicleNumber: prefilledVehicleNumber,
        ownerName: prefilledOwnerName,
        mobileNumber: prefilledMobileNumber
      }));
      if (prefilledVehicleNumber) {
        setVehicleValidation({ isValid: true, message: 'Vehicle number prefilled' });
      }
    }
  }, [isOpen, prefilledVehicleNumber, prefilledOwnerName, prefilledMobileNumber]);

  // Fetch vehicle details when registration number is entered
  useEffect(() => {
    const fetchVehicleDetails = async () => {
      const searchInput = formData.vehicleNumber.trim();
      if (searchInput.length < 4) {
        setVehicleError('');
        setVehicleMatches([]);
        setShowVehicleDropdown(false);
        setSelectedDropdownIndex(0);
        return;
      }
      setFetchingVehicle(true);
      setVehicleError('');
      try {
        const response = await axios.get(`${API_URL}/api/vehicle-registrations/search/${searchInput}`, { withCredentials: true });
        if (response.data.success) {
          if (response.data.multiple) {
            setVehicleMatches(response.data.data);
            setShowVehicleDropdown(true);
            setSelectedDropdownIndex(0);
            setVehicleError('');
          } else {
            const vehicleData = response.data.data;
            setFormData(prev => ({
              ...prev,
              vehicleNumber: vehicleData.registrationNumber,
              ownerName: vehicleData.ownerName || '',
              mobileNumber: vehicleData.mobileNumber || prev.mobileNumber,
              partyId: vehicleData.partyId?._id || vehicleData.partyId || ''
            }));
            const validation = validateVehicleNumberRealtime(vehicleData.registrationNumber);
            setVehicleValidation(validation);
            setVehicleError('');
            setVehicleMatches([]);
            setShowVehicleDropdown(false);
          }
        }
      } catch (error) {
        if (error.response && error.response.status === 404) {
          setVehicleError('No vehicles found matching the search');
        } else {
          setVehicleError('Error fetching vehicle details');
        }
        setVehicleMatches([]);
        setShowVehicleDropdown(false);
        setSelectedDropdownIndex(0);
      } finally {
        setFetchingVehicle(false);
      }
    };

    const timeoutId = setTimeout(() => {
      if (formData.vehicleNumber) {
        fetchVehicleDetails();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [formData.vehicleNumber]);

  const handleDropdownSelect = (vehicle) => {
    setFormData(prev => ({
      ...prev,
      vehicleNumber: vehicle.registrationNumber,
      ownerName: vehicle.ownerName || '',
      mobileNumber: vehicle.mobileNumber || prev.mobileNumber,
      partyId: vehicle.partyId?._id || vehicle.partyId || ''
    }));
    const validation = validateVehicleNumberRealtime(vehicle.registrationNumber);
    setVehicleValidation(validation);
    setVehicleMatches([]);
    setShowVehicleDropdown(false);
    setSelectedDropdownIndex(0);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      if (!showVehicleDropdown || vehicleMatches.length === 0) return;
      e.preventDefault();
      const next = Math.min(selectedDropdownIndex + 1, vehicleMatches.length - 1);
      setSelectedDropdownIndex(next);
      dropdownItemRefs.current[next]?.scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'ArrowUp') {
      if (!showVehicleDropdown || vehicleMatches.length === 0) return;
      e.preventDefault();
      const prev = Math.max(selectedDropdownIndex - 1, 0);
      setSelectedDropdownIndex(prev);
      dropdownItemRefs.current[prev]?.scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (showVehicleDropdown && vehicleMatches.length > 0 && vehicleMatches[selectedDropdownIndex]) {
        handleDropdownSelect(vehicleMatches[selectedDropdownIndex]);
      }
      const nextField = document.getElementById('ownerName');
      if (nextField) nextField.focus();
    } else if (e.key === 'Escape') {
      setShowVehicleDropdown(false);
    }
  };

  const handleEnterKey = (e, nextFieldId) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const nextField = document.getElementById(nextFieldId);
      if (nextField) nextField.focus();
    }
  };

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
    if (!formData.vehicleNumber) {
      toast.error('Vehicle number is required');
      return;
    }
    if (paidExceedsTotal) {
      toast.error('Paid amount cannot exceed total fee');
      return;
    }
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

      const response = await axios.post(`${API_URL}/api/hpa-hpt`, payload, { withCredentials: true });
      if (response.data.success) {
        toast.success('HPA/HPT record created successfully!');
        onSubmit();
        onClose();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create HPA/HPT record');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null

  return (
    <div className='fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-2 md:p-4'>
      <div className='bg-white rounded-xl md:rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden flex flex-col'>
        <style>{`
          .hpahpt-add-form input,
          .hpahpt-add-form select,
          .hpahpt-add-form textarea {
            background-color: #ffffff;
          }
        `}</style>

        {/* Header */}
        <div className='bg-gradient-to-r from-rose-600 to-pink-600 p-3 md:p-4 text-white flex-shrink-0'>
          <div className='flex justify-between items-center'>
            <div>
              <h2 className='text-lg md:text-2xl font-bold'>Add HPA / HPT</h2>
              <p className='text-rose-100 text-xs md:text-sm mt-1'>Hypothecation Addition / Termination</p>
            </div>
            <button
              onClick={onClose}
              className='text-white hover:bg-white/20 rounded-lg p-1.5 md:p-2 transition cursor-pointer hover:rotate-90 duration-200'
            >
              <svg className='w-5 h-5 md:w-6 md:h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
              </svg>
            </button>
          </div>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className='hpahpt-add-form flex flex-col flex-1 overflow-hidden'>
          <div className='flex-1 overflow-y-auto p-3 md:p-6'>
            {/* Section 1 - Vehicle Information */}
            <div className='bg-gradient-to-r from-teal-50 to-cyan-50 border-2 border-teal-200 rounded-xl p-3 md:p-6 mb-4 md:mb-6'>
              <h3 className='text-base md:text-lg font-bold text-gray-800 mb-3 md:mb-4 flex items-center gap-2'>
                <span className='bg-teal-600 text-white w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm'>1</span>
                Vehicle Information
              </h3>

              <div className='grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4'>
                <div>
                  <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1'>
                    Date of Work
                  </label>
                  <input
                    type='date'
                    name='date'
                    value={formData.date}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (!val) { setFormData(p => ({ ...p, date: '' })); return; }
                      const [y, m, d] = val.split('-');
                      setFormData(p => ({ ...p, date: `${d}-${m}-${y}` }));
                    }}
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent'
                  />
                </div>

                <div className='relative'>
                  <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1'>
                    Vehicle Number <span className='text-red-500'>*</span>
                  </label>
                  <div className='relative'>
                    <input
                      id='vehicleNumber'
                      type='text'
                      name='vehicleNumber'
                      value={formData.vehicleNumber}
                      onChange={handleChange}
                      onKeyDown={handleKeyDown}
                      placeholder='CG04AB1234'
                      className={`w-full px-3 py-2 border rounded-lg font-mono uppercase tracking-widest focus:ring-2 focus:border-transparent ${
                        vehicleValidation.isValid
                          ? 'border-green-500 focus:ring-green-500'
                          : 'border-gray-300 focus:ring-teal-500'
                      }`}
                    />
                    {fetchingVehicle && (
                      <div className='absolute right-3 top-2.5'>
                        <div className='w-5 h-5 border-2 border-teal-400 border-t-transparent rounded-full animate-spin' />
                      </div>
                    )}
                  </div>
                  {vehicleError && <p className='text-red-500 text-xs mt-1'>{vehicleError}</p>}
                  {vehicleValidation.isValid && (
                    <p className='text-green-600 text-xs mt-1 flex items-center gap-1'>
                      <svg className='w-3 h-3' fill='currentColor' viewBox='0 0 20 20'><path fillRule='evenodd' d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z' clipRule='evenodd'/></svg>
                      Vehicle found
                    </p>
                  )}
                  {/* Vehicle Dropdown */}
                  {showVehicleDropdown && vehicleMatches.length > 0 && (
                    <div className='absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto'>
                      {vehicleMatches.map((vehicle, index) => (
                        <div
                          key={vehicle._id}
                          ref={el => (dropdownItemRefs.current[index] = el)}
                          onClick={() => handleDropdownSelect(vehicle)}
                          className={`px-3 py-2 cursor-pointer hover:bg-teal-50 transition-colors ${selectedDropdownIndex === index ? 'bg-teal-50' : ''}`}
                        >
                          <p className='font-mono font-semibold text-gray-800'>{vehicle.registrationNumber}</p>
                          <p className='text-xs text-gray-500'>{vehicle.ownerName}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1'>
                    Owner Name
                  </label>
                  <input
                    id='ownerName'
                    type='text'
                    name='ownerName'
                    value={formData.ownerName}
                    onChange={handleChange}
                    onKeyDown={(e) => handleEnterKey(e, 'mobileNumber')}
                    placeholder='Enter owner name'
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent'
                  />
                </div>

                <div className='md:col-span-3'>
                  <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1'>
                    Mobile Number
                  </label>
                  <input
                    id='mobileNumber'
                    type='text'
                    name='mobileNumber'
                    value={formData.mobileNumber}
                    onChange={handleChange}
                    onKeyDown={(e) => handleEnterKey(e, 'type')}
                    placeholder='Enter mobile number'
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent'
                  />
                </div>
              </div>
            </div>

            {/* Section 2 - Type & Payment */}
            <div className='bg-gradient-to-r from-rose-50 to-pink-50 border-2 border-rose-200 rounded-xl p-3 md:p-6 mb-4 md:mb-6'>
              <h3 className='text-base md:text-lg font-bold text-gray-800 mb-3 md:mb-4 flex items-center gap-2'>
                <span className='bg-rose-600 text-white w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm'>2</span>
                Type & Payment Details
              </h3>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-4'>
                <div className='md:col-span-2'>
                  <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-2'>Type <span className='text-red-500'>*</span></label>
                  <div className='flex gap-3'>
                    {['hpa', 'hpt'].map(t => (
                      <button
                        key={t}
                        type='button'
                        onClick={() => setFormData(prev => ({ ...prev, type: t }))}
                        className={`flex-1 py-2 rounded-lg font-bold uppercase tracking-wider text-sm transition-all cursor-pointer ${
                          formData.type === t
                            ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-md'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {t === 'hpa' ? 'HPA' : 'HPT'}
                        <p className={`text-xs font-normal normal-case mt-0.5 ${formData.type === t ? 'text-rose-100' : 'text-gray-400'}`}>
                          {t === 'hpa' ? 'Hypothecation Addition' : 'Hypothecation Termination'}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1'>Total Fee (₹)</label>
                  <input
                    id='totalFee'
                    type='number'
                    name='totalFee'
                    value={formData.totalFee}
                    onChange={handleChange}
                    onKeyDown={(e) => handleEnterKey(e, 'paid')}
                    min='0'
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent text-right font-semibold'
                  />
                </div>
                <div>
                  <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1'>Paid (₹)</label>
                  <input
                    id='paid'
                    type='number'
                    name='paid'
                    value={formData.paid}
                    onChange={handleChange}
                    min='0'
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent text-right font-semibold ${
                      paidExceedsTotal ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-rose-500'
                    }`}
                  />
                  {paidExceedsTotal && <p className='text-red-500 text-xs mt-1'>Paid exceeds total!</p>}
                </div>
              </div>

              <div className='bg-white rounded-lg p-3 border-2 border-rose-200 mb-4'>
                <div className='flex justify-between items-center'>
                  <span className='text-sm font-semibold text-gray-700'>Balance</span>
                  <span className={`text-xl font-black ${parseFloat(formData.balance) > 0 ? 'text-rose-600' : 'text-green-600'}`}>
                    ₹ {parseFloat(formData.balance || '0').toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Fee Breakup */}
              <div>
                <div className='flex items-center justify-between mb-2'>
                  <label className='text-xs md:text-sm font-bold text-gray-700'>Fee Breakup</label>
                  <button
                    type='button'
                    onClick={addFeeBreakupRow}
                    className='text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1 transition-colors cursor-pointer'
                  >
                    <svg className='w-3.5 h-3.5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 4v16m8-8H4' />
                    </svg>
                    Add Row
                  </button>
                </div>
                <div className='space-y-2'>
                  {formData.feeBreakup.map((item, index) => (
                    <div key={index} className='flex gap-2 items-center'>
                      <input
                        type='text'
                        value={item.name}
                        onChange={e => handleFeeBreakupChange(index, 'name', e.target.value)}
                        placeholder='Description'
                        className='flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-rose-500 focus:border-transparent'
                      />
                      <input
                        type='number'
                        value={item.amount}
                        onChange={e => handleFeeBreakupChange(index, 'amount', e.target.value)}
                        placeholder='₹ Amount'
                        className='w-28 px-3 py-2 border border-gray-300 rounded-lg text-sm text-right focus:ring-2 focus:ring-rose-500 focus:border-transparent'
                      />
                      <button
                        type='button'
                        onClick={() => removeFeeBreakupRow(index)}
                        className='text-red-400 hover:text-red-600 transition-colors p-1 cursor-pointer'
                      >
                        <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Remarks */}
            <div className='bg-gradient-to-r from-gray-50 to-slate-50 border-2 border-gray-200 rounded-xl p-3 md:p-6 mb-4 md:mb-6'>
              <h3 className='text-base md:text-lg font-bold text-gray-800 mb-3 md:mb-4 flex items-center gap-2'>
                <span className='bg-gray-600 text-white w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm'>3</span>
                Remarks (Optional)
              </h3>
              <textarea
                name='remarks'
                value={formData.remarks}
                onChange={handleChange}
                placeholder='Optional remarks...'
                rows={2}
                className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent resize-none'
              />
            </div>
          </div>

          {/* Footer Actions - Fixed at Bottom */}
          <div className='border-t border-gray-200 p-3 md:p-4 bg-gray-50 flex justify-between items-center flex-shrink-0 sticky bottom-0 shadow-lg'>
            <div className='text-sm text-gray-600 hidden md:block'>
              <kbd className='px-2 py-1 bg-gray-200 rounded text-xs font-mono'>Ctrl+Enter</kbd> to submit quickly
            </div>

            <div className='flex gap-2 md:gap-3 w-full md:w-auto'>
              <button
                type='button'
                onClick={onClose}
                className='flex-1 md:flex-none px-4 md:px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-semibold transition cursor-pointer text-sm md:text-base'
              >
                Cancel
              </button>
              <button
                type='submit'
                disabled={isSubmitting || paidExceedsTotal}
                className='flex-1 md:flex-none px-4 md:px-8 py-2 bg-gradient-to-r from-rose-600 to-pink-600 text-white rounded-lg hover:shadow-lg font-semibold transition flex items-center justify-center gap-2 cursor-pointer text-sm md:text-base disabled:opacity-60 disabled:cursor-not-allowed'
              >
                {isSubmitting ? (
                  <span className='flex items-center justify-center gap-2'>
                    <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' />
                    Saving...
                  </span>
                ) : (
                  <>
                    <svg className='w-4 h-4 md:w-5 md:h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
                    </svg>
                    Save Application
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddHpaHptModal;
