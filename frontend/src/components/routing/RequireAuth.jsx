import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import Container from '@/components/layout/Container'

export default function RequireAuth() {
  const { isAuthed, loading } = useAuth()
  const loc = useLocation()

  if (loading) {
    return (
      <Container className="py-10">
        <div className="mx-auto w-full max-w-sm rounded-2xl border border-neutral-200 p-6 text-center dark:border-gray-800">
          <p className="text-neutral-600 dark:text-neutral-300">Checking session…</p>
        </div>
      </Container>
    )
  }

  if (!isAuthed) {
    return <Navigate to="/login" replace state={{ from: loc.pathname + loc.search }} />
  }

  return <Outlet />
}
