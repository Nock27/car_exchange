import { createContext, useContext, useEffect, useState } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [accessToken, setAccessToken] = useState(null)

  // restore from localStorage on load
  useEffect(() => {
    const t = localStorage.getItem('access_token')
    const u = localStorage.getItem('user_json')
    if (t) setAccessToken(t)
    if (u) setUser(JSON.parse(u))
  }, [])

  const login = (userObj, token) => {
    setUser(userObj)
    setAccessToken(token)
    localStorage.setItem('access_token', token)
    localStorage.setItem('user_json', JSON.stringify(userObj))
  }

  const logout = () => {
    setUser(null)
    setAccessToken(null)
    localStorage.removeItem('access_token')
    localStorage.removeItem('user_json')
  }

  return (
    <AuthContext.Provider value={{ user, accessToken, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)