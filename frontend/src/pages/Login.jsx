import { useEffect, useState } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import Container from '@/components/layout/Container'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { useAuth } from '@/context/AuthContext'

export default function Login() {
  const { login, isAuthed } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState({ username: '', password: '', form: '' })

  // If already logged in, leave this page immediately
  useEffect(() => {
    if (isAuthed) {
      const dest = location.state?.from || '/'
      navigate(dest, { replace: true })
    }
  }, [isAuthed, location.state, navigate])

  const onSubmit = async (e) => {
    e.preventDefault()
    setErrors({ username: '', password: '', form: '' })

    let has = false
    if (!username.trim()) { setErrors((s) => ({ ...s, username: 'This field is required.' })); has = true }
    if (!password) { setErrors((s) => ({ ...s, password: 'This field is required.' })); has = true }
    if (has) return

    try {
      setSubmitting(true)
      await login({ username: username.trim(), password })
      // after successful login, go to the intended page or home
      const dest = location.state?.from || '/'
      navigate(dest, { replace: true })
    } catch (err) {
      const msg = err?.response?.data?.detail || 'Invalid credentials.'
      setErrors((s) => ({ ...s, form: String(msg) }))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Container className="py-10">
      <div className="mx-auto max-w-md">
        <Card className="p-6">
          <h2 className="mb-4 text-2xl font-semibold">Login</h2>
          <p className="mb-4 text-sm text-neutral-500">
            Sign in with your username and password.
          </p>

          <form onSubmit={onSubmit} className="grid gap-4">
            {errors.form && (
              <div className="rounded-md border border-red-300 bg-red-50 p-2 text-sm text-red-700">
                {errors.form}
              </div>
            )}

            <div>
              <label className="mb-1 block text-sm font-medium">Username</label>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Your username"
                aria-invalid={!!errors.username}
              />
              {errors.username && <p className="mt-1 text-sm text-red-600">{errors.username}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Password</label>
              <Input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                type="password"
                aria-invalid={!!errors.password}
              />
              {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
            </div>

            <Button type="submit" disabled={submitting}>
              {submitting ? 'Signing in…' : 'Login'}
            </Button>
          </form>

          <p className="mt-4 text-sm">
            Don’t have an account? <Link className="text-brand-600 hover:underline" to="/register">Register</Link>
          </p>
        </Card>
      </div>
    </Container>
  )
}
