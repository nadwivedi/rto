import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { validateVehicleNumberRealtime } from '../../../utils/vehicleNoCheck';
import { handlePaymentCalculation } from '../../../utils/paymentValidation';
import { handleSmartDateInput } from '../../../utils/dateFormatter';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

const AddFitnessModal = ({ isOpen, onClose, onSubmit, prefilledVehicleNumber = '', prefilledOwnerName = '', prefilledMobileNumber = '' }) => {
  const [formData, setFormData] = useState({
    vehicleNumber: prefilledVehicleNumber,
    ownerName: prefilledOwnerName,
    mobileNumber: prefilledMobileNumber,
    partyId: '',
    validFrom: '',
    validTo: '',
    totalFee: '0',
    paid: '0',
    balance: '0',
    feeBreakup: [
      { name: 'Fitness', amount: '' },
      { name: 'PUC', amount: '' },
      { name: 'Radium', amount: '' },
      { name: 'GPS', amount: '' },
      { name: 'Speed Governor', amount: '' }
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

  // Reset form when modal closes or when prefilled values change
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        vehicleNumber: prefilledVehicleNumber,
        ownerName: prefilledOwnerName,
        mobileNumber: prefilledMobileNumber,
        partyId: '',
        validFrom: '',
        validTo: '',
        totalFee: '0',
        paid: '0',
        balance: '0',
        feeBreakup: [
          { name: 'Fitness', amount: '' },
          { name: 'PUC', amount: '' },
          { name: 'Radium', amount: '' },
          { name: 'GPS', amount: '' },
          { name: 'Speed Governor', amount: '' }
        ]
      });
      setPaidExceedsTotal(false);
      setVehicleValidation({ isValid: false, message: '' });
      setFetchingVehicle(false);
      setVehicleError('');
      setVehicleMatches([]);
      setShowVehicleDropdown(false);
      setSelectedDropdownIndex(0);
    }
  }, [isOpen, prefilledVehicleNumber, prefilledOwnerName, prefilledMobileNumber]);

  // Set prefilled values when modal opens
  useEffect(() => {
    if (isOpen && (prefilledVehicleNumber || prefilledOwnerName || prefilledMobileNumber)) {
      setFormData(prev => ({
        ...prev,
        vehicleNumber: prefilledVehicleNumber,
        ownerName: prefilledOwnerName,
        mobileNumber: prefilledMobileNumber
      }));
      // Mark vehicle as valid if prefilled
      if (prefilledVehicleNumber) {
        setVehicleValidation({ isValid: true, message: 'Vehicle number prefilled' });
      }
    }
  }, [isOpen, prefilledVehicleNumber, prefilledOwnerName, prefilledMobileNumber]);

  // Calculate valid to date (1 year from valid from)
  useEffect(() => {
    if (formData.validFrom) {
      // Parse DD-MM-YYYY
      const parts = formData.validFrom.split(/[/-]/); // Splits on both "/" and "-"
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
        const year = parseInt(parts[2], 10);

        // Check if date is valid
        if (!isNaN(day) && !isNaN(month) && !isNaN(year) && year > 1900) {
          const validFromDate = new Date(year, month, day);

          // Check if the date object is valid
          if (!isNaN(validFromDate.getTime())) {
            const validToDate = new Date(validFromDate);
            validToDate.setFullYear(validToDate.getFullYear() + 1);
            // Subtract 1 day
            validToDate.setDate(validToDate.getDate() - 1);

            // Format date to DD-MM-YYYY
            const newDay = String(validToDate.getDate()).padStart(2, '0');
            const newMonth = String(validToDate.getMonth() + 1).padStart(2, '0');
            const newYear = validToDate.getFullYear();

            setFormData(prev => ({
              ...prev,
              validTo: `${newDay}-${newMonth}-${newYear}`
            }));
          }
        }
      }
    }
  }, [formData.validFrom]);

  // Fetch vehicle details when registration number is entered
  useEffect(() => {
    const fetchVehicleDetails = async () => {
      const searchInput = formData.vehicleNumber.trim();

      // Only fetch if search input has at least 4 characters
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
          // Check if multiple vehicles found
          if (response.data.multiple) {
            // Show dropdown with multiple matches
            setVehicleMatches(response.data.data);
            setShowVehicleDropdown(true);
            setSelectedDropdownIndex(0); // Reset to first item
            setVehicleError('');
          } else {
            // Single match found - auto-fill including full vehicle number, mobile number, and partyId
            const vehicleData = response.data.data;
            setFormData(prev => ({
              ...prev,
              vehicleNumber: vehicleData.registrationNumber, // Replace partial input with full number
              ownerName: vehicleData.ownerName || '',
              mobileNumber: vehicleData.mobileNumber || prev.mobileNumber,
              partyId: vehicleData.partyId?._id || vehicleData.partyId || ''
            }));
            // Validate the full vehicle number
            const validation = validateVehicleNumberRealtime(vehicleData.registrationNumber);
            setVehicleValidation(validation);
            setVehicleError('');
            setVehicleMatches([]);
            setShowVehicleDropdown(false);
          }
        }
      } catch (error) {
        console.error('Error fetching vehicle details:', error);
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

    // Debounce the API call - wait 500ms after user stops typing
    const timeoutId = setTimeout(() => {
      if (formData.vehicleNumber) {
        fetchVehicleDetails();
      }
    }, 500); // Wait 500ms after user stops typing

    return () => clearTimeout(timeoutId);
  }, [formData.vehicleNumber]);

  // Auto-scroll to selected dropdown item
  useEffect(() => {
    if (showVehicleDropdown && dropdownItemRefs.current[selectedDropdownIndex]) {
      dropdownItemRefs.current[selectedDropdownIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });
    }
  }, [selectedDropdownIndex, showVehicleDropdown]);

  // Handle vehicle selection from dropdown
  const handleVehicleSelect = (vehicle) => {
    setFormData(prev => ({
      ...prev,
      vehicleNumber: vehicle.registrationNumber,
      ownerName: vehicle.ownerName || '',
      mobileNumber: vehicle.mobileNumber || prev.mobileNumber,
      partyId: vehicle.partyId?._id || vehicle.partyId || ''
    }));
    setShowVehicleDropdown(false);
    setVehicleMatches([]);
    setVehicleError('');
    setSelectedDropdownIndex(0);

    // Validate the selected vehicle number
    const validation = validateVehicleNumberRealtime(vehicle.registrationNumber);
    setVehicleValidation(validation);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Handle dropdown navigation
      if (showVehicleDropdown && vehicleMatches.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedDropdownIndex(prev => (prev + 1) % vehicleMatches.length);
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedDropdownIndex(prev => (prev - 1 + vehicleMatches.length) % vehicleMatches.length);
        } else if (e.key === 'Enter') {
          e.preventDefault();
          handleVehicleSelect(vehicleMatches[selectedDropdownIndex]);
        } else if (e.key === 'Escape') {
          e.preventDefault();
          setShowVehicleDropdown(false);
          setVehicleMatches([]);
        }
        return;
      }

      // Ctrl+Enter to submit
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        document.querySelector('form')?.requestSubmit();
      }
      // Escape to close
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose, showVehicleDropdown, vehicleMatches, selectedDropdownIndex]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Handle vehicle number with validation only (no enforcement)
    if (name === 'vehicleNumber') {
      // Convert to uppercase
      const upperValue = value.toUpperCase();

      // Validate in real-time (only show validation if 9 or 10 characters)
      const validation = (upperValue.length === 9 || upperValue.length === 10) ? validateVehicleNumberRealtime(upperValue) : { isValid: false, message: '' };
      setVehicleValidation(validation);

      setFormData(prev => ({
        ...prev,
        [name]: upperValue
      }));
      return;
    }

    // Auto-calculate balance when totalFee or paid changes
    if (name === 'totalFee' || name === 'paid') {
      // Remove leading zero when user starts typing
      let finalValue = value;
      if (value.length > 0) {
        if (name === 'totalFee' && formData.totalFee === '0') {
          finalValue = value.replace(/^0+/, '') || '0';
        } else if (name === 'paid' && formData.paid === '0') {
          finalValue = value.replace(/^0+/, '') || '0';
        }
      }

      setFormData(prev => {
        const paymentResult = handlePaymentCalculation(name, finalValue, prev);

        // Reset validation flag since paid is now capped
        setPaidExceedsTotal(paymentResult.paidExceedsTotal);

        return {
          ...prev,
          [name]: name === 'paid' ? paymentResult.paid : finalValue,
          totalFee: name === 'totalFee' ? finalValue : prev.totalFee,
          paid: name === 'paid' ? paymentResult.paid : prev.paid,
          balance: paymentResult.balance
        };
      });
      return;
    }

    // Handle date fields with smart validation and formatting
    if (name === 'validFrom' || name === 'validTo') {
      const formatted = handleSmartDateInput(value, formData[name] || '');
      if (formatted !== null) {
        setFormData(prev => ({
          ...prev,
          [name]: formatted
        }));
      }
      return;
    }

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDateBlur = (e) => {
    const { name, value } = e.target;

    if (!value) return; // Skip if empty

    // Remove all non-digit characters
    let digitsOnly = value.replace(/[^\d]/g, '');

    // Limit to 8 digits (DDMMYYYY)
    digitsOnly = digitsOnly.slice(0, 8);

    // Parse parts
    let day = '';
    let month = '';
    let year = '';

    if (digitsOnly.length >= 2) {
      day = digitsOnly.slice(0, 2);
      let dayNum = parseInt(day, 10);

      // Validate day: 01-31
      if (dayNum === 0) dayNum = 1;
      if (dayNum > 31) dayNum = 31;
      day = String(dayNum).padStart(2, '0');
    } else if (digitsOnly.length === 1) {
      day = '0' + digitsOnly[0];
    }

    if (digitsOnly.length >= 4) {
      month = digitsOnly.slice(2, 4);
      let monthNum = parseInt(month, 10);

      // Validate month: 01-12
      if (monthNum === 0) monthNum = 1;
      if (monthNum > 12) monthNum = 12;
      month = String(monthNum).padStart(2, '0');
    } else if (digitsOnly.length === 3) {
      month = '0' + digitsOnly[2];
    }

    if (digitsOnly.length >= 5) {
      year = digitsOnly.slice(4);

      // Auto-expand 2-digit year to 4-digit
      if (year.length === 2) {
        const yearNum = parseInt(year, 10);
        year = String(yearNum <= 50 ? 2000 + yearNum : 1900 + yearNum);
      } else if (year.length === 4) {
        // Keep as is
      } else if (year.length > 4) {
        year = year.slice(0, 4);
      }
    }

    // Format the date only if we have at least day and month
    if (day && month) {
      let formatted = `${day}-${month}`;
      if (year) {
        formatted += `-${year}`;
      }

      setFormData(prev => ({
        ...prev,
        [name]: formatted
      }));
    }
  };

  // Handle Enter key to navigate to next field instead of submitting
  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();

      // Get current tabIndex
      const currentTabIndex = parseInt(e.target.getAttribute('tabIndex'));

      // Calculate the last fee breakup amount tabIndex (7 + number of fee breakup items - 1)
      const lastFeeBreakupTabIndex = 7 + formData.feeBreakup.length - 1;

      // If we're on the last fee breakup amount field, submit the form
      if (currentTabIndex === lastFeeBreakupTabIndex) {
        document.querySelector('form')?.requestSubmit();
        return;
      }

      // Find next input with tabIndex
      const nextTabIndex = currentTabIndex + 1;
      const nextInput = document.querySelector(`input[tabIndex="${nextTabIndex}"]`);

      if (nextInput) {
        nextInput.focus();
      }
    }
  };

  // Fee Breakup Handlers
  const addFeeBreakupItem = () => {
    setFormData(prev => ({
      ...prev,
      feeBreakup: [...prev.feeBreakup, { name: '', amount: '' }]
    }));
  };

  const removeFeeBreakupItem = (index) => {
    setFormData(prev => ({
      ...prev,
      feeBreakup: prev.feeBreakup.filter((_, i) => i !== index)
    }));
  };

  const handleFeeBreakupChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      feeBreakup: prev.feeBreakup.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate vehicle number before submitting (must be 9 or 10 characters and valid format)
    if ((formData.vehicleNumber.length === 9 || formData.vehicleNumber.length === 10) && !vehicleValidation.isValid) {
      toast.error('Please enter a valid vehicle number in the format: CG04AA1234 (10 chars) or CG04G1234 (9 chars)');
      return;
    }

    // Ensure vehicle number is 9 or 10 characters for submission
    if (formData.vehicleNumber && formData.vehicleNumber.length !== 9 && formData.vehicleNumber.length !== 10) {
      toast.error('Vehicle number must be 9 or 10 characters');
      return;
    }

    // Validate paid amount doesn't exceed total fee
    if (paidExceedsTotal) {
      toast.error('Paid amount cannot be more than the total fee!');
      return;
    }

    // Filter out empty fee breakup items
    const filteredFeeBreakup = formData.feeBreakup.filter(item =>
      item.name && item.amount && parseFloat(item.amount) > 0
    );

    const dataToSubmit = {
      vehicleNumber: formData.vehicleNumber,
      ownerName: formData.ownerName,
      mobileNumber: formData.mobileNumber,
      partyId: formData.partyId || null,
      validFrom: formData.validFrom,
      validTo: formData.validTo,
      totalFee: parseFloat(formData.totalFee),
      paid: parseFloat(formData.paid),
      balance: parseFloat(formData.balance),
      feeBreakup: filteredFeeBreakup
    };

    // Make API call
    setIsSubmitting(true);
    try {
      const response = await axios.post(`${API_URL}/api/fitness`, dataToSubmit, {
        withCredentials: true
      });

      if (response.data.success) {
        toast.success('Fitness record added successfully!');

        // Call onSubmit callback to notify parent (for refresh)
        if (onSubmit) {
          onSubmit();
        }

        // Close modal
        onClose();
      }
    } catch (error) {
      console.error('Error adding fitness:', error);
      toast.error(error.response?.data?.message || 'Failed to add fitness record');
    } finally {
      setIsSubmitting(false);
    }
    // Reset form
    setFormData({
      vehicleNumber: '',
      ownerName: '',
      mobileNumber: '',
      partyId: '',
      validFrom: '',
      validTo: '',
      totalFee: '0',
      paid: '0',
      balance: '0',
      feeBreakup: [
        { name: 'Fitness', amount: '' },
        { name: 'PUC', amount: '' },
        { name: 'Radium', amount: '' },
        { name: 'GPS', amount: '' },
        { name: 'Speed Governor', amount: '' }
      ]
    });
    setVehicleValidation({ isValid: false, message: '' });
    setPaidExceedsTotal(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-2 md:p-4'>
      <div className='bg-white rounded-xl md:rounded-2xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-hidden flex flex-col'>
        {/* Header */}
        <div className='bg-gradient-to-r from-blue-600 to-indigo-600 p-2 md:p-3 text-white flex-shrink-0'>
          <div className='flex justify-between items-center'>
            <div>
              <h2 className='text-lg md:text-2xl font-bold'>
                Add New Fitness Certificate
              </h2>
              <p className='text-blue-100 text-xs md:text-sm mt-1'>
                Enter the details for the new fitness certificate.
              </p>
            </div>
            <button
              onClick={onClose}
              className='text-white hover:bg-white/20 rounded-lg p-1.5 md:p-2 transition cursor-pointer'
            >
              <svg className='w-5 h-5 md:w-6 md:h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
              </svg>
            </button>
          </div>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className='flex flex-col flex-1 overflow-hidden'>
          <div className='flex-1 overflow-y-auto p-3 md:p-6'>
          {/* Section 1: Vehicle Details */}
          <div className='bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-indigo-200 rounded-xl p-3 md:p-6 mb-4 md:mb-6'>
            <h3 className='text-base md:text-lg font-bold text-gray-800 mb-3 md:mb-4 flex items-center gap-2'>
              <span className='bg-indigo-600 text-white w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm'>1</span>
              Vehicle Details
            </h3>

            <div className='grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4'>
              {/* Vehicle Number */}
              <div>
                <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1'>
                  Vehicle Number <span className='text-red-500'>*</span>
                </label>
                <div className='relative'>
                  <input
                    type='text'
                    name='vehicleNumber'
                    value={formData.vehicleNumber}
                    onChange={handleChange}
                    onKeyDown={handleInputKeyDown}
                    placeholder='e.g., CG04AA1234'
                    maxLength='10'
                    tabIndex="1"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent font-mono bg-white ${
                      formData.vehicleNumber && !vehicleValidation.isValid
                        ? 'border-red-500 focus:ring-red-500'
                        : formData.vehicleNumber && vehicleValidation.isValid
                        ? 'border-green-500 focus:ring-green-500'
                        : 'border-gray-300 focus:ring-indigo-500'
                    }`}
                    required
                    autoFocus
                  />
                  {fetchingVehicle && (
                    <div className='absolute right-3 top-2.5'>
                      <svg className='animate-spin h-5 w-5 text-indigo-500' xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24'>
                        <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4'></circle>
                        <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'></path>
                      </svg>
                    </div>
                  )}
                  {!fetchingVehicle && vehicleValidation.isValid && formData.vehicleNumber && !showVehicleDropdown && (
                    <div className='absolute right-3 top-2.5'>
                      <svg className='h-5 w-5 text-green-500' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
                      </svg>
                    </div>
                  )}

                  {/* Dropdown for multiple vehicle matches */}
                  {showVehicleDropdown && vehicleMatches.length > 0 && (
                    <div className='absolute z-10 w-full mt-1 bg-white border border-indigo-200 rounded-lg shadow-lg max-h-60 overflow-y-auto'>
                      {vehicleMatches.map((vehicle, index) => (
                        <div
                          key={vehicle._id}
                          ref={(el) => (dropdownItemRefs.current[index] = el)}
                          onClick={() => handleVehicleSelect(vehicle)}
                          className={`p-3 cursor-pointer border-b border-gray-100 last:border-b-0 transition ${
                            index === selectedDropdownIndex
                              ? 'bg-indigo-100 border-l-4 border-l-indigo-600'
                              : 'hover:bg-indigo-50'
                          }`}
                        >
                          <p className={`font-mono font-bold text-sm ${
                            index === selectedDropdownIndex ? 'text-indigo-800' : 'text-indigo-700'
                          }`}>{vehicle.registrationNumber}</p>
                          <p className='text-xs text-gray-700 mt-1'>{vehicle.ownerName}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {vehicleValidation.message && !fetchingVehicle && (
                  <p className={`text-xs mt-1 ${vehicleValidation.isValid ? 'text-green-600' : 'text-red-600'}`}>
                    {vehicleValidation.message}
                  </p>
                )}
                {vehicleError && (
                  <p className='text-xs text-amber-600 mt-1'>{vehicleError}</p>
                )}
              </div>

              {/* Mobile Number */}
              <div>
                <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1'>
                  Mobile Number
                </label>
                <input
                  type='tel'
                  name='mobileNumber'
                  value={formData.mobileNumber}
                  onChange={handleChange}
                  onKeyDown={handleInputKeyDown}
                  placeholder='10-digit number'
                  maxLength='10'
                  tabIndex="3"
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white'
                />
              </div>
               {/* Owner Name */}
               <div>
                <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1'>
                  Owner Name
                </label>
                <input
                  type='text'
                  name='ownerName'
                  value={formData.ownerName}
                  onChange={handleChange}
                  onKeyDown={handleInputKeyDown}
                  placeholder='Owner Name'
                  tabIndex="2"
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white'
                />
              </div>
            </div>
          </div>

          {/* Section 2: Validity Period */}
          <div className='bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-emerald-200 rounded-xl p-3 md:p-6 mb-4 md:mb-6'>
            <h3 className='text-base md:text-lg font-bold text-gray-800 mb-3 md:mb-4 flex items-center gap-2'>
              <span className='bg-emerald-600 text-white w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm'>2</span>
              Validity Period
            </h3>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4'>
              {/* Valid From */}
              <div>
                <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1'>
                  Valid From <span className='text-red-500'>*</span>
                </label>
                <input
                  type='text'
                  name='validFrom'
                  value={formData.validFrom}
                  onChange={handleChange}
                  onBlur={handleDateBlur}
                  onKeyDown={handleInputKeyDown}
                  placeholder='DD-MM-YYYY'
                  tabIndex="4"
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white'
                  required
                />
              </div>

              {/* Valid To (Auto-calculated) */}
              <div>
                <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1'>
                  Valid To <span className='text-xs text-emerald-600'>(Auto-calculated)</span>
                </label>
                <input
                  type='text'
                  name='validTo'
                  value={formData.validTo}
                  onChange={handleChange}
                  onBlur={handleDateBlur}
                  onKeyDown={handleInputKeyDown}
                  placeholder='DD-MM-YYYY'
                  tabIndex="5"
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg bg-emerald-50 text-gray-700'
                />
              </div>
            </div>
          </div>

          {/* Section 3: Payment Information */}
          <div className='bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-3 md:p-6 mb-4 md:mb-6'>
            <h3 className='text-base md:text-lg font-bold text-gray-800 mb-3 md:mb-4 flex items-center gap-2'>
              <span className='bg-purple-600 text-white w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm'>3</span>
              Payment Information
            </h3>

            <div className='grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4'>
              {/* Total Fee */}
              <div>
                <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1'>
                  Total Fee (₹) <span className='text-red-500'>*</span>
                </label>
                <input
                  type='number'
                  name='totalFee'
                  value={formData.totalFee}
                  onChange={handleChange}
                  onFocus={(e) => e.target.select()}
                  onKeyDown={handleInputKeyDown}
                  tabIndex="6"
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-semibold bg-white'
                  required
                />
              </div>

              {/* Paid Amount */}
              <div>
                <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1'>
                  Paid (₹) <span className='text-red-500'>*</span>
                </label>
                <input
                  type='number'
                  name='paid'
                  value={formData.paid}
                  onChange={handleChange}
                  onFocus={(e) => e.target.select()}
                  onKeyDown={handleInputKeyDown}
                  tabIndex="7"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 font-semibold ${
                    paidExceedsTotal
                      ? 'border-red-500 focus:ring-red-500 bg-red-50'
                      : 'border-gray-300 focus:ring-purple-500 focus:border-transparent bg-white'
                  }`}
                  required
                />
                {paidExceedsTotal && (
                  <p className='text-xs mt-1 text-red-600 font-semibold'>
                    Paid amount cannot exceed total fee!
                  </p>
                )}
              </div>

              {/* Balance (Auto-calculated) */}
              <div>
                <label className='block text-xs md:text-sm font-semibold text-gray-700 mb-1'>
                  Balance (₹) <span className='text-xs text-gray-500'>(Auto)</span>
                </label>
                <input
                  type='number'
                  name='balance'
                  value={formData.balance}
                  readOnly
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg bg-purple-50 font-semibold text-gray-700'
                />
              </div>
            </div>

            {/* Fee Breakup Section */}
            <div className='mt-5 pt-5 border-t border-purple-200'>
              <div className='flex flex-col md:flex-row md:justify-between md:items-center gap-3 mb-4'>
                <h4 className='text-sm md:text-base font-bold text-gray-800'>Fee Breakup (Optional)</h4>
                <button
                  type='button'
                  onClick={addFeeBreakupItem}
                  className='px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-semibold flex items-center justify-center gap-2 cursor-pointer'
                >
                  <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 4v16m8-8H4' />
                  </svg>
                  Add Item
                </button>
              </div>

              <div className='space-y-3'>
                {formData.feeBreakup.map((item, index) => (
                  <div key={index} className='grid grid-cols-1 md:grid-cols-12 gap-3 items-center'>
                    <div className='md:col-span-5'>
                      <input
                        type='text'
                        placeholder='Fee name'
                        value={item.name}
                        onChange={(e) => handleFeeBreakupChange(index, 'name', e.target.value)}
                        readOnly={index < 5}
                        className={`w-full px-3 py-2 border rounded-lg text-sm font-semibold ${
                          index < 5
                            ? 'border-purple-200 bg-purple-100 text-gray-700 cursor-not-allowed'
                            : 'border-gray-300 bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent'
                        }`}
                      />
                    </div>
                    <div className='md:col-span-6'>
                      <div className='relative'>
                        <span className='absolute left-3 top-2.5 text-gray-500 font-semibold'>₹</span>
                        <input
                          type='number'
                          placeholder='Amount'
                          value={item.amount}
                          onChange={(e) => handleFeeBreakupChange(index, 'amount', e.target.value)}
                          onKeyDown={handleInputKeyDown}
                          min='0'
                          tabIndex={8 + index}
                          className='w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm font-semibold bg-white'
                        />
                      </div>
                    </div>
                    <div className='md:col-span-1 flex items-center justify-end'>
                      <button
                        type='button'
                        onClick={() => removeFeeBreakupItem(index)}
                        className='p-2 text-purple-500 hover:bg-purple-100 rounded-full transition cursor-pointer'
                        title='Remove item'
                      >
                        <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6' />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          </div>

          <div className='border-t border-gray-200 p-3 md:p-4 bg-gray-50 flex flex-col md:flex-row justify-between items-center gap-3 flex-shrink-0'>
            <div className='text-xs md:text-sm text-gray-600'>
              <kbd className='px-2 py-1 bg-gray-200 rounded text-xs font-mono'>Ctrl+Enter</kbd> to submit quickly
            </div>

            <div className='flex gap-2 md:gap-3 w-full md:w-auto'>
              <button
                type='button'
                onClick={onClose}
                className='flex-1 md:flex-none px-4 md:px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-semibold transition cursor-pointer'
              >
                Cancel
              </button>

              <button
                type='submit'
                disabled={isSubmitting}
                onClick={() => document.querySelector('form').requestSubmit()}
                className='flex-1 md:flex-none px-6 md:px-8 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg font-semibold transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
              >
                {isSubmitting ? (
                  <>
                    <svg className='animate-spin h-5 w-5 text-white' xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24'>
                      <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4'></circle>
                      <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'></path>
                    </svg>
                    Adding...
                  </>
                ) : (
                  <>
                    <svg className='w-4 h-4 md:w-5 md:h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
                    </svg>
                    Add Fitness
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddFitnessModal;
