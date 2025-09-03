import { createContext, useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, endpoints, setTokens, getAccess } from '@/lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  // Bootstrap session from existing token
  useEffect(() => {
    const token = getAccess()
    if (!token) {
      setLoading(false)
      return
    }
    api
      .get(endpoints.me)
      .then(({ data }) => setUser(data))
      .catch(() => {
        setTokens({ access: null, refresh: null })
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  // Login -> set tokens -> fetch /auth/me -> set user
  const login = async ({ username, password }) => {
    const { data } = await api.post(endpoints.login, { username, password })
    setTokens({ access: data.access, refresh: data.refresh })
    const me = await api.get(endpoints.me)
    setUser(me.data)
    return me.data
  }

  // Register -> create user -> AUTO-LOGIN with same credentials -> set user
  const register = async ({ username, email, password, role }) => {
    await api.post(endpoints.register, { username, email, password, role })
    const me = await login({ username, password }) // auto-login here
    return me
  }

  // Always go Home on logout (hard redirect beats route guards)
  const logout = () => {
    setTokens({ access: null, refresh: null })
    setUser(null)
    if (typeof window !== 'undefined' && window.location) {
      window.location.replace('/')
      return
    }
    navigate('/', { replace: true })
  }

  return (
    <AuthContext.Provider value={{ user, isAuthed: !!user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
