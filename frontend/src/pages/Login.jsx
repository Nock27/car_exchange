import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Container from '@/components/layout/Container'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { useAuth } from '@/context/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const loc = useLocation()
  const redirectTo = loc.state?.from || '/'

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const [fieldErrors, setFieldErrors] = useState({
    username: '',
    password: '',
    non_field_errors: '',
  })
  const [topError, setTopError] = useState('')

  const setOneTopErrorFromFields = (errsObj) => {
    const order = ['username', 'password', 'non_field_errors']
    for (const key of order) {
      if (errsObj[key]) {
        const label = key === 'non_field_errors' ? 'Error' : capitalize(key)
        setTopError(`${label}: ${errsObj[key]}`)
        return
      }
    }
    setTopError('')
  }

  const clearErrors = () => {
    setFieldErrors({ username: '', password: '', non_field_errors: '' })
    setTopError('')
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    clearErrors()
    setLoading(true)
    try {
      await login(username.trim(), password)
      navigate(redirectTo, { replace: true })
    } catch (err) {
      const data = err?.response?.data
      const newErrs = { username: '', password: '', non_field_errors: '' }

      if (data && typeof data === 'object') {
        for (const [key, val] of Object.entries(data)) {
          const msg = Array.isArray(val) ? String(val[0]) : String(val)
          if (key in newErrs) newErrs[key] = msg
          else newErrs.non_field_errors = msg
        }
      } else if (typeof data !== 'undefined') {
        newErrs.non_field_errors = String(data)
      } else {
        newErrs.non_field_errors = err?.message || 'Login failed'
      }

      setFieldErrors(newErrs)
      setOneTopErrorFromFields(newErrs)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container className="py-10">
      <div className="mx-auto w-full max-w-md">
        <Card>
          <h1 className="mb-2 text-2xl font-semibold text-neutral-900 dark:text-white">Login</h1>
          <p className="mb-6 text-sm text-neutral-600 dark:text-neutral-300">
            Sign in with your username and password.
          </p>

          {topError && (
            <div className="mb-4 rounded-lg border border-danger-600 bg-danger-600/10 p-3 text-sm text-danger-600 dark:border-danger-600 dark:bg-danger-600/20">
              {topError}
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm text-neutral-700 dark:text-neutral-200">Username</label>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                aria-invalid={!!fieldErrors.username}
                aria-describedby={fieldErrors.username ? 'err-username' : undefined}
                required
              />
              {fieldErrors.username && (
                <p id="err-username" className="mt-1 text-xs text-danger-600">{fieldErrors.username}</p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm text-neutral-700 dark:text-neutral-200">Password</label>
              <Input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={!!fieldErrors.password}
                aria-describedby={fieldErrors.password ? 'err-password' : undefined}
                required
              />
              {fieldErrors.password && (
                <p id="err-password" className="mt-1 text-xs text-danger-600">{fieldErrors.password}</p>
              )}
            </div>

            <Button disabled={loading} className="w-full">
              {loading ? 'Signing in…' : 'Login'}
            </Button>
          </form>

          <p className="mt-4 text-sm text-neutral-600 dark:text-neutral-300">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="text-info-500 hover:underline">Register</Link>
          </p>
        </Card>
      </div>
    </Container>
  )
}

function capitalize(s) {
  if (!s) return s
  return s.charAt(0).toUpperCase() + s.slice(1).replaceAll('_', ' ')
}
