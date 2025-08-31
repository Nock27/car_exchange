import axios from 'axios'

const baseURL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, '') ||
  'http://localhost:8000' // root, not /api

export const api = axios.create({
  baseURL,
  withCredentials: false,
})

export const endpoints = {
  // AUTH (root)
  login: '/auth/login',
  refresh: '/auth/refresh',
  me: '/auth/me',
  register: '/auth/register',
  // DATA lives under /api (we'll use these later in Step 4)
  brands: '/api/brands',
  models: '/api/models',
  regions: '/api/regions',
  cities: '/api/cities',
  listings: '/api/listings',
}

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

// attach access token
api.interceptors.request.use((config) => {
  const access = getAccess()
  if (access) config.headers.Authorization = `Bearer ${access}`
  return config
})

// refresh on 401
let isRefreshing = false
let pending = []

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    const status = error?.response?.status

    if (status === 401 && !original._retry) {
      const refresh = getRefresh()
      if (!refresh) {
        // no refresh → hard fail
        return Promise.reject(error)
      }
      if (isRefreshing) {
        // queue the request until refresh finishes
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
        setTokens({ access: newAccess }) // keep old refresh
        // flush queue
        pending.forEach(({ resolve }) => resolve(newAccess))
        pending = []
        // retry original
        original.headers.Authorization = `Bearer ${newAccess}`
        return api(original)
      } catch (e) {
        // flush queue with error
        pending.forEach(({ reject }) => reject(e))
        pending = []
        // clear tokens
        setTokens({ access: null, refresh: null })
        return Promise.reject(e)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)
