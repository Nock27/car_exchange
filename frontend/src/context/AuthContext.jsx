import { createContext, useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, endpoints, setTokens, getAccess } from '@/lib/api'

// create the context
const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  // Get the current user if there is one
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  // Bootstrap session from existing token
  useEffect(() => {
    const token = getAccess()
    // if there is no token return, otherwise tries to get the token, if unsuccessful null the tokens
    if (!token) {
      setLoading(false)
      return
    }
    api
      .get(endpoints.me) //trying to get the current user (/api/profile/)
      .then(({ data }) => setUser(data))
      .catch(() => {
        setTokens({ access: null, refresh: null })
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  // Login -> set tokens -> fetch /auth/me -> set user
  const login = async ({ username, password }) => {
    const { data } = await api.post(endpoints.login, { username, password }) //trying to get the user
    setTokens({ access: data.access, refresh: data.refresh }) //set the tokens, 401 is handled by axious
    const me = await api.get(endpoints.me)
    setUser(me.data) //sets the user
    return me.data
  }

  // Register -> create user -> AUTO-LOGIN with same credentials -> set user
  const register = async ({ username, email, password, role }) => {
    await api.post(endpoints.register, { username, email, password, role }) //creates the account
    const me = await login({ username, password }) // auto-login
    return me
  }

  // Always go Home on logout
  const logout = () => {
    setTokens({ access: null, refresh: null }) //unset the authorization tokens
    setUser(null) //unset the user
    if (typeof window !== 'undefined' && window.location) {
      window.location.replace('/')
      return
    }
    navigate('/', { replace: true })
  }
  // the double !! returns true boolean
  return (
    <AuthContext.Provider value={{ user, isAuthed: !!user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}
// use hook to get the context
export function useAuth() {
  return useContext(AuthContext)
}
