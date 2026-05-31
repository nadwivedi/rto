import { useState } from 'react'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://api.rtosarthi.com'

const CreateVehicleFromJson = () => {
  const [jsonInput, setJsonInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const exampleJson = {
    userId: "<USER_OBJECT_ID>",
    registrationNumber: "CG04JC6675",
    dateOfRegistration: "13-02-2012",
    chassisNumber: "MAT447212B3N33914",
    engineNumber: "11L63203629",
    ownerName: "Karamjeet Kaur",
    sonWifeDaughterOf: "Balkar Singh",
    address: "Plot No-018, SEC-03, Tatibandh, Raipur, Chhattisgarh - 492099",
    mobileNumber: null,
    email: null,
    makerName: "Tata Motors Ltd",
    makerModel: "LPS/4018/CAB",
    colour: "Brown",
    seatingCapacity: 3,
    vehicleClass: "Goods Carrier",
    vehicleType: "Truck",
    ladenWeight: 24000,
    unladenWeight: 13200,
    manufactureYear: 2012,
    vehicleCategory: "Transport",
    rcImage: "<RC_IMAGE_URL>",
    numberOfCylinders: 6,
    cubicCapacity: 178,
    fuelType: "Diesel",
    bodyType: "MXL TLR M",
    wheelBase: 3200
  }

  const handleLoadExample = () => {
    setJsonInput(JSON.stringify(exampleJson, null, 2))
    setError('')
    setSuccess('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!jsonInput.trim()) {
      setError('Please enter JSON data')
      return
    }

    try {
      // Parse JSON to validate
      const vehicleData = JSON.parse(jsonInput)

      // Validate required fields
      if (!vehicleData.userId) {
        setError('userId is required in JSON data')
        return
      }
      if (!vehicleData.registrationNumber) {
        setError('registrationNumber is required in JSON data')
        return
      }
      if (!vehicleData.chassisNumber) {
        setError('chassisNumber is required in JSON data')
        return
      }

      setLoading(true)

      const response = await fetch(`${BACKEND_URL}/api/admin/vehicle-registrations/create-from-json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: jsonInput
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setSuccess(`Vehicle registration created successfully! Registration Number: ${data.data.registrationNumber}`)
        setJsonInput('')
      } else {
        setError(data.message || 'Failed to create vehicle registration')

        // Show validation errors if present
        if (data.errors && Array.isArray(data.errors)) {
          const errorMessages = data.errors.map(err => `${err.field}: ${err.message}`).join(', ')
          setError(`${data.message}: ${errorMessages}`)
        }
      }
    } catch (err) {
      if (err instanceof SyntaxError) {
        setError('Invalid JSON format. Please check your input.')
      } else {
        setError(err.message || 'Failed to create vehicle registration')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleClear = () => {
    setJsonInput('')
    setError('')
    setSuccess('')
  }

  return (
    <div className='max-w-5xl mx-auto'>
      <div className='bg-white rounded-lg shadow-md p-6'>
        <h1 className='text-2xl font-bold text-gray-800 mb-6'>Create Vehicle Registration from JSON</h1>

        <form onSubmit={handleSubmit}>
          {/* JSON Input */}
          <div className='mb-4'>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Vehicle Registration JSON Data
            </label>
            <textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm'
              rows={20}
              placeholder='Paste your JSON data here...'
            />
          </div>

          {/* Action Buttons */}
          <div className='flex flex-wrap gap-3 mb-4'>
            <button
              type='submit'
              disabled={loading}
              className='px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
            >
              {loading ? 'Creating...' : 'Create Vehicle Registration'}
            </button>

            <button
              type='button'
              onClick={handleLoadExample}
              className='px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors'
            >
              Load Example
            </button>

            <button
              type='button'
              onClick={handleClear}
              className='px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors'
            >
              Clear
            </button>
          </div>

          {/* Success Message */}
          {success && (
            <div className='p-4 bg-green-50 border border-green-200 rounded-lg mb-4'>
              <p className='text-green-800 text-sm'>{success}</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className='p-4 bg-red-50 border border-red-200 rounded-lg mb-4'>
              <p className='text-red-800 text-sm'>{error}</p>
            </div>
          )}
        </form>

        {/* Instructions */}
        <div className='mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg'>
          <h3 className='font-semibold text-blue-900 mb-2'>Instructions:</h3>
          <ul className='list-disc list-inside text-sm text-blue-800 space-y-1'>
            <li>Paste valid JSON data in the textarea above</li>
            <li>Click "Load Example" to see the expected JSON format</li>
            <li>Required fields: <code className='bg-blue-100 px-1 rounded'>userId</code>, <code className='bg-blue-100 px-1 rounded'>registrationNumber</code>, <code className='bg-blue-100 px-1 rounded'>chassisNumber</code></li>
            <li>The userId should be a valid MongoDB ObjectId of an existing user</li>
            <li>The system will validate the JSON and create the vehicle registration</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default CreateVehicleFromJson
