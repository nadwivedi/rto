import React from 'react'

const PermitPartModal = ({ permit, part, onClose }) => {
  if (!permit) return null

  const renderPartA = () => (
    <div className='space-y-6'>
      {/* Header Section */}
      <div className='bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200'>
        <h3 className='text-xl font-bold text-gray-800 mb-4 flex items-center gap-2'>
          <span className='text-2xl'>📋</span>
          Part A - Permit and Vehicle Details
        </h3>
        <div className='grid grid-cols-2 gap-4'>
          <div>
            <p className='text-xs text-gray-500 uppercase font-semibold mb-1'>Permit Number</p>
            <p className='text-lg font-mono font-bold text-blue-700'>{permit.partA.permitNumber}</p>
          </div>
          <div>
            <p className='text-xs text-gray-500 uppercase font-semibold mb-1'>Permit Type</p>
            <p className='text-lg font-semibold text-gray-800'>{permit.partA.permitType}</p>
          </div>
        </div>
      </div>

      {/* Owner Information */}
      <div className='bg-white rounded-xl p-6 border border-gray-200'>
        <h4 className='font-bold text-gray-800 mb-4 text-lg border-b pb-2'>Owner/Operator Information</h4>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div>
            <p className='text-xs text-gray-500 uppercase font-semibold mb-1'>Owner Name</p>
            <p className='text-sm font-semibold text-gray-800'>{permit.partA.ownerName}</p>
          </div>
          <div>
            <p className='text-xs text-gray-500 uppercase font-semibold mb-1'>Mobile Number</p>
            <p className='text-sm font-mono text-gray-800'>{permit.partA.ownerMobile}</p>
          </div>
          <div className='md:col-span-2'>
            <p className='text-xs text-gray-500 uppercase font-semibold mb-1'>Address</p>
            <p className='text-sm text-gray-800'>{permit.partA.ownerAddress}</p>
          </div>
        </div>
      </div>

      {/* Vehicle Information */}
      <div className='bg-white rounded-xl p-6 border border-gray-200'>
        <h4 className='font-bold text-gray-800 mb-4 text-lg border-b pb-2'>Vehicle Information</h4>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div>
            <p className='text-xs text-gray-500 uppercase font-semibold mb-1'>Vehicle Number</p>
            <p className='text-sm font-mono font-bold text-gray-800'>{permit.partA.vehicleNumber}</p>
          </div>
          <div>
            <p className='text-xs text-gray-500 uppercase font-semibold mb-1'>Vehicle Class</p>
            <p className='text-sm text-gray-800'>{permit.partA.vehicleClass}</p>
          </div>
          <div>
            <p className='text-xs text-gray-500 uppercase font-semibold mb-1'>Vehicle Type</p>
            <p className='text-sm text-gray-800'>{permit.partA.vehicleType}</p>
          </div>
          <div>
            <p className='text-xs text-gray-500 uppercase font-semibold mb-1'>Maker & Model</p>
            <p className='text-sm text-gray-800'>{permit.partA.makerModel}</p>
          </div>
          <div>
            <p className='text-xs text-gray-500 uppercase font-semibold mb-1'>Chassis Number</p>
            <p className='text-sm font-mono text-gray-800'>{permit.partA.chassisNumber}</p>
          </div>
          <div>
            <p className='text-xs text-gray-500 uppercase font-semibold mb-1'>Engine Number</p>
            <p className='text-sm font-mono text-gray-800'>{permit.partA.engineNumber}</p>
          </div>
          <div>
            <p className='text-xs text-gray-500 uppercase font-semibold mb-1'>Year of Manufacture</p>
            <p className='text-sm text-gray-800'>{permit.partA.yearOfManufacture}</p>
          </div>
          <div>
            <p className='text-xs text-gray-500 uppercase font-semibold mb-1'>Seating Capacity</p>
            <p className='text-sm text-gray-800'>{permit.partA.seatingCapacity}</p>
          </div>
        </div>
      </div>

      {/* Permit Validity */}
      <div className='bg-white rounded-xl p-6 border border-gray-200'>
        <h4 className='font-bold text-gray-800 mb-4 text-lg border-b pb-2'>Permit Validity & Route</h4>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div>
            <p className='text-xs text-gray-500 uppercase font-semibold mb-1'>Route</p>
            <p className='text-sm text-gray-800'>{permit.partA.route}</p>
          </div>
          <div>
            <p className='text-xs text-gray-500 uppercase font-semibold mb-1'>Fees Paid</p>
            <p className='text-sm font-semibold text-green-600'>{permit.partA.fees}</p>
          </div>
          <div>
            <p className='text-xs text-gray-500 uppercase font-semibold mb-1'>Valid From</p>
            <p className='text-sm text-gray-800'>{permit.partA.permitValidFrom}</p>
          </div>
          <div>
            <p className='text-xs text-gray-500 uppercase font-semibold mb-1'>Valid Upto</p>
            <p className='text-sm text-gray-800'>{permit.partA.permitValidUpto}</p>
          </div>
          <div>
            <p className='text-xs text-gray-500 uppercase font-semibold mb-1'>Issuing Authority</p>
            <p className='text-sm text-gray-800'>{permit.partA.issuingAuthority}</p>
          </div>
          <div>
            <p className='text-xs text-gray-500 uppercase font-semibold mb-1'>Issue Date</p>
            <p className='text-sm text-gray-800'>{permit.partA.issueDate}</p>
          </div>
        </div>
      </div>
    </div>
  )

  const renderPartB = () => (
    <div className='space-y-6'>
      {/* Header Section */}
      <div className='bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200'>
        <h3 className='text-xl font-bold text-gray-800 mb-4 flex items-center gap-2'>
          <span className='text-2xl'>📄</span>
          Part B - Authorization and Conditions
        </h3>
        <div className='grid grid-cols-2 gap-4'>
          <div>
            <p className='text-xs text-gray-500 uppercase font-semibold mb-1'>Permit Number</p>
            <p className='text-lg font-mono font-bold text-purple-700'>{permit.partB.permitNumber}</p>
          </div>
          <div>
            <p className='text-xs text-gray-500 uppercase font-semibold mb-1'>Authorization</p>
            <p className='text-lg font-semibold text-gray-800'>{permit.partB.authorization}</p>
          </div>
        </div>
      </div>

      {/* Goods & Load Information */}
      <div className='bg-white rounded-xl p-6 border border-gray-200'>
        <h4 className='font-bold text-gray-800 mb-4 text-lg border-b pb-2'>Goods & Load Information</h4>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div>
            <p className='text-xs text-gray-500 uppercase font-semibold mb-1'>Type of Goods</p>
            <p className='text-sm text-gray-800'>{permit.partB.goodsType}</p>
          </div>
          <div>
            <p className='text-xs text-gray-500 uppercase font-semibold mb-1'>Max Load Capacity</p>
            <p className='text-sm font-bold text-gray-800'>{permit.partB.maxLoadCapacity}</p>
          </div>
        </div>
      </div>

      {/* Routes and Restrictions */}
      <div className='bg-white rounded-xl p-6 border border-gray-200'>
        <h4 className='font-bold text-gray-800 mb-4 text-lg border-b pb-2'>Routes & Restrictions</h4>
        <div className='space-y-4'>
          <div>
            <p className='text-xs text-gray-500 uppercase font-semibold mb-2'>Valid Routes</p>
            <p className='text-sm text-gray-800 bg-blue-50 p-3 rounded-lg'>{permit.partB.validRoutes}</p>
          </div>
          <div>
            <p className='text-xs text-gray-500 uppercase font-semibold mb-2'>Restrictions</p>
            <p className='text-sm text-gray-800 bg-red-50 p-3 rounded-lg'>{permit.partB.restrictions}</p>
          </div>
          <div>
            <p className='text-xs text-gray-500 uppercase font-semibold mb-2'>Conditions</p>
            <p className='text-sm text-gray-800 bg-yellow-50 p-3 rounded-lg'>{permit.partB.conditions}</p>
          </div>
          <div>
            <p className='text-xs text-gray-500 uppercase font-semibold mb-2'>Endorsements</p>
            <p className='text-sm text-gray-800 bg-green-50 p-3 rounded-lg'>{permit.partB.endorsements}</p>
          </div>
        </div>
      </div>

      {/* Insurance Details */}
      <div className='bg-white rounded-xl p-6 border border-gray-200'>
        <h4 className='font-bold text-gray-800 mb-4 text-lg border-b pb-2'>Insurance Details</h4>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          <div>
            <p className='text-xs text-gray-500 uppercase font-semibold mb-1'>Policy Number</p>
            <p className='text-sm font-mono text-gray-800'>{permit.partB.insuranceDetails.policyNumber}</p>
          </div>
          <div>
            <p className='text-xs text-gray-500 uppercase font-semibold mb-1'>Insurance Company</p>
            <p className='text-sm text-gray-800'>{permit.partB.insuranceDetails.company}</p>
          </div>
          <div>
            <p className='text-xs text-gray-500 uppercase font-semibold mb-1'>Valid Upto</p>
            <p className='text-sm text-gray-800'>{permit.partB.insuranceDetails.validUpto}</p>
          </div>
        </div>
      </div>

      {/* Tax Details */}
      <div className='bg-white rounded-xl p-6 border border-gray-200'>
        <h4 className='font-bold text-gray-800 mb-4 text-lg border-b pb-2'>Tax Details</h4>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div>
            <p className='text-xs text-gray-500 uppercase font-semibold mb-1'>Tax Paid Upto</p>
            <p className='text-sm text-gray-800'>{permit.partB.taxDetails.taxPaidUpto}</p>
          </div>
          <div>
            <p className='text-xs text-gray-500 uppercase font-semibold mb-1'>Tax Amount</p>
            <p className='text-sm font-semibold text-green-600'>{permit.partB.taxDetails.taxAmount}</p>
          </div>
        </div>
      </div>

      {/* Renewal History */}
      {permit.partB.renewalHistory && permit.partB.renewalHistory.length > 0 && (
        <div className='bg-white rounded-xl p-6 border border-gray-200'>
          <h4 className='font-bold text-gray-800 mb-4 text-lg border-b pb-2'>Renewal History</h4>
          <div className='overflow-x-auto'>
            <table className='w-full'>
              <thead className='bg-gray-50'>
                <tr>
                  <th className='px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase'>Date</th>
                  <th className='px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase'>Amount</th>
                  <th className='px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase'>Status</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-gray-200'>
                {permit.partB.renewalHistory.map((renewal, index) => (
                  <tr key={index}>
                    <td className='px-4 py-2 text-sm text-gray-800'>{renewal.date}</td>
                    <td className='px-4 py-2 text-sm text-gray-800'>{renewal.amount}</td>
                    <td className='px-4 py-2'>
                      <span className='px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold'>
                        {renewal.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 z-[70] flex items-center justify-center p-4'>
      <div className='bg-gray-50 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col'>
        {/* Modal Header */}
        <div className='bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 flex justify-between items-center'>
          <div>
            <h2 className='text-2xl font-bold'>
              National Permit - Part {part}
            </h2>
            <p className='text-indigo-100 text-sm mt-1'>
              {permit.permitHolder} • {permit.vehicleNo}
            </p>
          </div>
          <button
            onClick={onClose}
            className='text-white hover:bg-white/20 p-2 rounded-lg transition cursor-pointer'
          >
            <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
            </svg>
          </button>
        </div>

        {/* Modal Content */}
        <div className='p-6 overflow-y-auto flex-1'>
          {part === 'A' ? renderPartA() : renderPartB()}
        </div>

        {/* Modal Footer */}
        <div className='bg-white border-t border-gray-200 p-4 flex justify-end gap-3'>
          <button
            onClick={onClose}
            className='px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition font-semibold cursor-pointer'
          >
            Close
          </button>
          <button className='px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition font-semibold cursor-pointer'>
            Print Part {part}
          </button>
        </div>
      </div>
    </div>
  )
}

export default PermitPartModal
