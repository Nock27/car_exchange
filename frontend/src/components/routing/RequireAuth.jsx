import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

export default function RequireAuth() {
  const { isAuthed, loading } = useAuth()
  const location = useLocation()
  // waiting the session to be checked
  if (loading) return null
  if (!isAuthed) {
    // remember where the user wanted to go
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }
  return <Outlet />
}
