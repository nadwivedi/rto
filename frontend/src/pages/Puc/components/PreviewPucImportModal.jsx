import React from 'react';
import { getVehicleNumberParts } from '../../../utils/vehicleNoCheck';
import { getVehicleNumberDesign } from '../../../context/ThemeContext';

const PreviewPucImportModal = ({ isOpen, onClose, data, onSave, isSaving }) => {
  if (!isOpen) return null;

  const vehicleDesign = getVehicleNumberDesign();

  return (
    <div className='fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-2 md:p-4'>
      <div className='bg-white rounded-xl md:rounded-2xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-hidden flex flex-col'>
        {/* Header */}
        <div className='bg-gradient-to-r from-blue-600 to-indigo-600 p-3 md:p-4 text-white flex-shrink-0'>
          <div className='flex justify-between items-center'>
            <div>
              <h2 className='text-lg md:text-2xl font-bold'>
                Preview Extracted Data
              </h2>
              <p className='text-blue-100 text-xs md:text-sm mt-1'>
                Review {data.length} records before saving.
              </p>
            </div>
            <button
              onClick={onClose}
              disabled={isSaving}
              className='text-white hover:bg-white/20 rounded-lg p-1.5 md:p-2 transition cursor-pointer disabled:opacity-50'
            >
              <svg className='w-5 h-5 md:w-6 md:h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className='flex-1 overflow-auto p-4 bg-gray-50'>
          <div className='bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden'>
            <div className='overflow-x-auto'>
              <table className='w-full text-left border-collapse'>
                <thead>
                  <tr className='bg-gray-100 text-gray-700 text-xs uppercase tracking-wider border-b border-gray-200'>
                    <th className='p-3 font-semibold'>S.No</th>
                    <th className='p-3 font-semibold'>Vehicle No</th>
                    <th className='p-3 font-semibold'>Mobile No</th>
                    <th className='p-3 font-semibold'>Model</th>
                    <th className='p-3 font-semibold'>Valid From</th>
                    <th className='p-3 font-semibold'>Valid To</th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-gray-100 text-sm'>
                  {data.map((record, idx) => {
                    const parts = getVehicleNumberParts(record.vehicleNumber);
                    return (
                      <tr key={idx} className='hover:bg-gray-50'>
                        <td className='p-3 text-gray-500 font-medium'>{idx + 1}</td>
                        <td className='p-3'>
                          {parts ? (
                            <div className={`scale-90 origin-left ${vehicleDesign.container}`}>
                              <svg className='w-3.5 h-5 mr-0.5 text-blue-800 flex-shrink-0' fill='currentColor' viewBox='0 0 20 20'>
                                <path d='M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z' />
                                <path d='M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z' />
                              </svg>
                              <span className={vehicleDesign.stateCode}>{parts.stateCode}</span>
                              <span className={vehicleDesign.districtCode}>{parts.districtCode}</span>
                              <span className={vehicleDesign.series}>{parts.series}</span>
                              <span className={vehicleDesign.last4Digits}>{parts.last4Digits}</span>
                            </div>
                          ) : (
                            <span className='font-bold font-mono text-gray-800'>{record.vehicleNumber}</span>
                          )}
                        </td>
                        <td className='p-3 text-gray-700'>{record.mobileNumber || '-'}</td>
                        <td className='p-3 text-gray-700'>{record.vehicleModel || '-'}</td>
                        <td className='p-3'>
                          <span className='bg-green-100 text-green-700 px-2 py-1 rounded font-medium text-xs'>
                            {record.validFrom}
                          </span>
                        </td>
                        <td className='p-3'>
                          <span className='bg-red-100 text-red-700 px-2 py-1 rounded font-medium text-xs'>
                            {record.validTo}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className='border-t border-gray-200 p-3 md:p-4 bg-white flex justify-end gap-3 flex-shrink-0'>
          <button
            type='button'
            onClick={onClose}
            disabled={isSaving}
            className='px-4 md:px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-semibold transition cursor-pointer disabled:opacity-50'
          >
            Cancel
          </button>
          <button
            type='button'
            onClick={onSave}
            disabled={isSaving}
            className='px-6 md:px-8 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg font-semibold transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed'
          >
            {isSaving ? (
              <>
                <svg className='animate-spin h-5 w-5 text-white' xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24'>
                  <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4'></circle>
                  <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'></path>
                </svg>
                Saving...
              </>
            ) : (
              <>
                <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
                </svg>
                Save {data.length} Records
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PreviewPucImportModal;
