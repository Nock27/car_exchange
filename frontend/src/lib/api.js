import axios from 'axios'

const baseURL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, '') ||
  'http://localhost:8000/api'

export const api = axios.create({
  baseURL,
  withCredentials: true, // keep if you use cookies; harmless otherwise
})

// Token store helpers
export const getToken = () => localStorage.getItem('auth_token')
export const setToken = (t) => (t ? localStorage.setItem('auth_token', t) : localStorage.removeItem('auth_token'))

// Attach token on each request
api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})
