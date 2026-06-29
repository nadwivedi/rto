import axios from 'axios'

const API = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'

export const getLicenseClasses = () =>
  axios.get(`${API}/api/license-classes`, { withCredentials: true })

export const addLicenseClass = (name) =>
  axios.post(`${API}/api/license-classes`, { name }, { withCredentials: true })

export const deleteLicenseClass = (value) =>
  axios.delete(`${API}/api/license-classes/${encodeURIComponent(value)}`, { withCredentials: true })
