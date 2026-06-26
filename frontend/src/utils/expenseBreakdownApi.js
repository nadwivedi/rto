import axios from 'axios'

const API = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080'

export const getExpensesByWork = (workType, workId) =>
  axios.get(`${API}/api/expense-breakdown/${workType}/${workId}`, { withCredentials: true })

export const replaceExpensesForWork = (workType, workId, expenses) =>
  axios.put(`${API}/api/expense-breakdown/${workType}/${workId}`, { expenses }, { withCredentials: true })

export const deleteExpense = (id) =>
  axios.delete(`${API}/api/expense-breakdown/${id}`, { withCredentials: true })
