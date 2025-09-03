import axios from 'axios'

// Base URL normalization
const raw = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/+$/,'')
const rootBaseURL = raw.endsWith('/api') ? raw.slice(0, -4) : raw
const apiPrefix = raw.endsWith('/api') ? '' : '/api'

export const api = axios.create({
  baseURL: rootBaseURL,
  withCredentials: false,
})

// Endpoints
export const endpoints = {
  // AUTH at root
  login: '/auth/login',
  refresh: '/auth/refresh',
  me: '/auth/me',
  register: '/auth/register',

  // DATA under /api
  brands: `${apiPrefix}/brands/`,
  models: `${apiPrefix}/models/`,
  categories: `${apiPrefix}/categories/`,
  fueltypes: `${apiPrefix}/fueltypes/`,
  transmissions: `${apiPrefix}/transmissions/`,
  bodytypes: `${apiPrefix}/bodytypes/`,
  drivetypes: `${apiPrefix}/drivetypes/`,
  regions: `${apiPrefix}/regions/`,
  cities: `${apiPrefix}/cities/`,
  listings: `${apiPrefix}/listings`,
}

// ----- helpers -----
/**
 * Normalizes a DRF list response to a plain array.
 * Accepts: [] or {results: []} or {data: []} (axios wraps .data outside)
 */
export function toArray(res) {
  const d = res?.data
  if (Array.isArray(d)) return d
  if (Array.isArray(d?.results)) return d.results
  if (Array.isArray(d?.data)) return d.data
  return []
}

// Token storage
const ACCESS_KEY = 'auth_access'
const REFRESH_KEY = 'auth_refresh'
export const getAccess = () => localStorage.getItem(ACCESS_KEY)
export const getRefresh = () => localStorage.getItem(REFRESH_KEY)
export const setTokens = ({ access, refresh }) => {
  if (access) localStorage.setItem(ACCESS_KEY, access); else localStorage.removeItem(ACCESS_KEY)
  if (typeof refresh !== 'undefined') {
    if (refresh) localStorage.setItem(REFRESH_KEY, refresh); else localStorage.removeItem(REFRESH_KEY)
  }
}

// Attach Authorization header
api.interceptors.request.use((config) => {
  const token = getAccess()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auto-refresh on 401
let isRefreshing = false
let pending = []
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const { config: original, response } = error
    if (response?.status === 401 && !original._retry) {
      const refresh = getRefresh()
      if (!refresh) return Promise.reject(error)

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pending.push({ resolve, reject })
        })
          .then((token) => {
            original.headers.Authorization = `Bearer ${token}`
            return api(original)
          })
          .catch(Promise.reject)
      }

      original._retry = true
      isRefreshing = true
      try {
        const { data } = await api.post(endpoints.refresh, { refresh })
        const newAccess = data?.access
        if (!newAccess) throw new Error('No access in refresh response')
        setTokens({ access: newAccess })
        pending.forEach(({ resolve }) => resolve(newAccess))
        pending = []
        original.headers.Authorization = `Bearer ${newAccess}`
        return api(original)
      } catch (e) {
        pending.forEach(({ reject }) => reject(e))
        pending = []
        setTokens({ access: null, refresh: null })
        return Promise.reject(e)
      } finally {
        isRefreshing = false
      }
    }
    return Promise.reject(error)
  }
)
