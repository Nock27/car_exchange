import axios from 'axios'

// HTTP client to centralize base url, manage the JWT tokens, puts 'Bearer' to every request
// do auto-refresh, holds endpoint map

// Base URL normalization
const raw = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/+$/,'')
const rootBaseURL = raw.endsWith('/api') ? raw.slice(0, -4) : raw
const apiPrefix = raw.endsWith('/api') ? '' : '/api'

// Axios instance - sets the base url
export const api = axios.create({
  baseURL: rootBaseURL,
  withCredentials: false, // we use Bearer tokens
})

// Setting the endpoints
export const endpoints = {
  // Auth
  login: '/auth/login',
  refresh: '/auth/refresh',
  me: '/auth/me',
  register: '/auth/register',

  // Profile
  profile: '/api/profile/',

  // Data
  brands: `${apiPrefix}/brands/`,
  models: `${apiPrefix}/models/`,
  categories: `${apiPrefix}/categories/`,
  fueltypes: `${apiPrefix}/fueltypes/`,
  transmissions: `${apiPrefix}/transmissions/`,
  bodytypes: `${apiPrefix}/bodytypes/`,
  drivetypes: `${apiPrefix}/drivetypes/`,
  regions: `${apiPrefix}/regions/`,
  cities: `${apiPrefix}/cities/`,
  colors: `${apiPrefix}/colors/`,
  listings: `${apiPrefix}/listings`,
  listingsMine: `${apiPrefix}/listings/mine/`,
  listingsMap: `${apiPrefix}/listings/map/`,
  listing: (id) => `${apiPrefix}/listings/${id}/`,
  features: `${apiPrefix}/features/`,
  favorite: (id) => `${apiPrefix}/listings/${id}/favorite/`,
  favorites: `${apiPrefix}/favorites/`,
  renew: (id) => `${apiPrefix}/listings/${id}/renew/`,
}
// helper to make sure the response from axios is always an array
export function toArray(resOrObj) {
  const d = resOrObj && resOrObj.data !== undefined ? resOrObj.data : resOrObj
  if (Array.isArray(d)) return d
  if (d && Array.isArray(d.results)) return d.results
  if (d && Array.isArray(d.data)) return d.data
  return []
}

// Token storage
const ACCESS_KEY = 'auth_access'
const REFRESH_KEY = 'auth_refresh'

// Function to set the tokens in the local storage
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

// Attach Authorization header to every request if there is an active token
api.interceptors.request.use((config) => {
  const token = getAccess()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auto-refresh on 401
let isRefreshing = false
let waitQueue = []
// Every request is being checked through here
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const { response, config: original } = error
    if (response?.status !== 401 || original?._retry) {
      return Promise.reject(error)
    }
    // check if we have refresh token
    const refresh = getRefresh()
    if (!refresh) return Promise.reject(error)
    // mark that for the current request, retry has been done
    original._retry = true

    // queue for the requests while refreshing
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
    // starts the refresh
    isRefreshing = true
    try {
      const { data } = await axios.post(`${rootBaseURL}/auth/refresh`, { refresh }) //trying to aquire new access token
      const newAccess = data?.access
      if (!newAccess) throw new Error('No access token in refresh response') //check if access is aquired successfuly

      setTokens({ access: newAccess }) //set the new access token
      // release the queue
      waitQueue.forEach(({ resolve }) => resolve(newAccess)) //give the new access token to all the waiting requests and give retry
      waitQueue = []

      // retry the original request but with retry=true
      original.headers.Authorization = `Bearer ${newAccess}`
      return api(original)
    } catch (e) {
      waitQueue.forEach(({ reject }) => reject(e)) //if refresh fail, we reject all the waiting requests
      waitQueue = [] //empties the queue
      setTokens({ access: null, refresh: null }) //clear the tokens
      return Promise.reject(e)
    } finally {
      isRefreshing = false //sets false to give path for the next request
    }
  }
)
