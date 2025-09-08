import axios from 'axios'

// ---- Base URL normalization ----
const raw = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/+$/,'')
const rootBaseURL = raw.endsWith('/api') ? raw.slice(0, -4) : raw
const apiPrefix = raw.endsWith('/api') ? '' : '/api'

// ---- Axios instance ----
export const api = axios.create({
  baseURL: rootBaseURL,
  withCredentials: false, // we use Bearer tokens, not cookies
})

// ---- Endpoints ----
export const endpoints = {
  // Auth (root)
  login: '/auth/login',
  refresh: '/auth/refresh',
  me: '/auth/me',
  register: '/auth/register',

  // Profile (contact defaults)
  profile: '/api/profile/',

  // Data (under /api)
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
  features: `${apiPrefix}/features/`,
}

// ---- Helper: normalize DRF list responses to plain arrays ----
/**
 * Accepts an axios Response or a raw object.
 * Returns [] | data | data.results | data.data (first array it finds)
 */
export function toArray(resOrObj) {
  const d = resOrObj && resOrObj.data !== undefined ? resOrObj.data : resOrObj
  if (Array.isArray(d)) return d
  if (d && Array.isArray(d.results)) return d.results
  if (d && Array.isArray(d.data)) return d.data
  return []
}

// ---- Token storage ----
const ACCESS_KEY = 'auth_access'
const REFRESH_KEY = 'auth_refresh'

export function setTokens({ access, refresh }) {
  if (access) localStorage.setItem(ACCESS_KEY, access); else localStorage.removeItem(ACCESS_KEY)
  if (typeof refresh !== 'undefined') {
    if (refresh) localStorage.setItem(REFRESH_KEY, refresh); else localStorage.removeItem(REFRESH_KEY)
  }
}

export function getAccess() {
  return localStorage.getItem(ACCESS_KEY)
}

export function getRefresh() {
  return localStorage.getItem(REFRESH_KEY)
}

// ---- Attach Authorization header ----
api.interceptors.request.use((config) => {
  const token = getAccess()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ---- Auto-refresh on 401 ----
let isRefreshing = false
let waitQueue = []

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const { response, config: original } = error
    if (response?.status !== 401 || original?._retry) {
      return Promise.reject(error)
    }

    const refresh = getRefresh()
    if (!refresh) return Promise.reject(error)

    original._retry = true

    // queue requests while refreshing
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        waitQueue.push({ resolve, reject })
      })
        .then((token) => {
          original.headers.Authorization = `Bearer ${token}`
          return api(original)
        })
        .catch(Promise.reject)
    }

    isRefreshing = true
    try {
      const { data } = await axios.post(`${rootBaseURL}/auth/refresh`, { refresh })
      const newAccess = data?.access
      if (!newAccess) throw new Error('No access token in refresh response')

      setTokens({ access: newAccess })
      // release the queue
      waitQueue.forEach(({ resolve }) => resolve(newAccess))
      waitQueue = []

      // retry the original
      original.headers.Authorization = `Bearer ${newAccess}`
      return api(original)
    } catch (e) {
      waitQueue.forEach(({ reject }) => reject(e))
      waitQueue = []
      setTokens({ access: null, refresh: null })
      return Promise.reject(e)
    } finally {
      isRefreshing = false
    }
  }
)
