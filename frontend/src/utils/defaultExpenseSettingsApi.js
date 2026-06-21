import axios from 'axios'

const API = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080'

export const getDefaultExpensesApi = (type) =>
  axios.get(`${API}/api/default-expense-settings/${type}`, { withCredentials: true })

export const updateDefaultExpensesApi = (type, expenses) =>
  axios.post(`${API}/api/default-expense-settings`, { type, expenses }, { withCredentials: true })
