import { useEffect, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { api, endpoints } from '@/lib/api'

export default function RequirePhone() {
  const [checking, setChecking] = useState(true)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    let alive = true
    const run = async () => {
      try {
        const { data } = await api.get(endpoints.profile)
        const phone = (data?.phone_e164 || '').trim()
        if (!phone) {
          // redirect to profile to set phone first
          navigate('/profile', { replace: true, state: { from: location.pathname } })
          return
        }
      } catch (e) {
        console.error('Profile check failed', e)
        // if profile cannot load, still send to profile page
        navigate('/profile', { replace: true, state: { from: location.pathname } })
        return
      } finally {
        if (alive) setChecking(false)
      }
    }
    run()
    return () => { alive = false }
  }, [navigate, location.pathname])

  if (checking) return null
  return <Outlet />
}
