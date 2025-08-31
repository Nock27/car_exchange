import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { api, endpoints, setTokens, getAccess } from '@/lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Restore session
  useEffect(() => {
    const init = async () => {
      const access = getAccess()
      if (!access) {
        setLoading(false)
        return
      }
      try {
        const { data } = await api.get(endpoints.me)
        setUser(data?.user ?? data)
      } catch {
        setTokens({ access: null, refresh: null })
        setUser(null)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  const login = async (username, password) => {
    // SimpleJWT expects username + password
    const { data } = await api.post(endpoints.login, { username, password })
    const access = data?.access
    const refresh = data?.refresh
    if (!access) throw new Error('No access token returned')
    setTokens({ access, refresh })
    const me = await api.get(endpoints.me)
    setUser(me.data?.user ?? me.data)
    return true
  }

  const register = async ({ username, email, password, role }) => {
    await api.post(endpoints.register, { username, email, password, role })
    // Auto-login after register
    await login(username, password)
    return true
  }

  const logout = () => {
    setTokens({ access: null, refresh: null })
    setUser(null)
  }

  const value = useMemo(
    () => ({ user, loading, isAuthed: !!user, login, register, logout }),
    [user, loading]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
