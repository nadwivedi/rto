import axios from 'axios'
import { toast } from 'react-toastify'

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'

// Saves an RC into Vehicle Registration, Fitness, Insurance and PUC with 0 fee (NO API call).
// payload: { data } for the RC on screen, or { historyId } for a saved search row.
export const saveVehicleRecords = async (payload) => {
  try {
    const res = await axios.post(`${API_URL}/api/vehicle-info/save-records`, payload, { withCredentials: true })
    const { vehicleNumber, registration, fitness, insurance, puc } = res.data.data
    const describe = (label, r) => {
      if (r.status === 'created') return `${label}: added`
      if (r.status === 'updated') return `${label}: updated`
      if (r.status === 'exists') return `${label}: already saved`
      return `${label}: no date on RC`
    }
    const lines = [
      describe('Vehicle', registration),
      describe('Fitness', fitness),
      describe('Insurance', insurance),
      describe('PUC', puc)
    ]
    toast.success(`${vehicleNumber} saved. ${lines.join(' | ')}`, { autoClose: 6000 })
  } catch (err) {
    console.error('Save records error:', err)
    toast.error(err.response?.data?.message || 'Failed to save vehicle records')
  }
}
