import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { api, setToken, getToken } from '@/lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Restore session
  useEffect(() => {
    const init = async () => {
      const token = getToken()
      if (!token) {
        setLoading(false)
        return
      }
      try {
        const { data } = await api.get('/auth/me')
        setUser(data?.user ?? data)
      } catch {
        setToken(null)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    // Expect either { token, user } or just { token }:
    if (data?.token) setToken(data.token)
    if (data?.user) setUser(data.user)
    else {
      // fetch profile if not returned in login
      const me = await api.get('/auth/me')
      setUser(me.data?.user ?? me.data)
    }
    return true
  }

  const register = async (payload) => {
    const { data } = await api.post('/auth/register', payload)
    // Option A: auto-login if API returns token
    if (data?.token) setToken(data.token)
    if (data?.user) setUser(data.user)
    else if (data?.token) {
      const me = await api.get('/auth/me')
      setUser(me.data?.user ?? me.data)
    }
    return true
  }

  const logout = () => {
    setToken(null)
    setUser(null)
  }

  const value = useMemo(
    () => ({ user, loading, login, register, logout, isAuthed: !!user }),
    [user, loading]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
