import axios from 'axios'

const API = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080'

export const getPaymentsByWork = (workType, workId) =>
  axios.get(`${API}/api/payment-received/${workType}/${workId}`)

export const replacePaymentsForWork = (workType, workId, payments) =>
  axios.put(`${API}/api/payment-received/${workType}/${workId}`, { payments })

export const deletePayment = (id) =>
  axios.delete(`${API}/api/payment-received/${id}`)
