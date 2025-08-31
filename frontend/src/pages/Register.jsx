import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Container from '@/components/layout/Container'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'
import { useAuth } from '@/context/AuthContext'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('buyer') // 'buyer' | 'seller'
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')

  const [loading, setLoading] = useState(false)

  // Field-level errors from server or client validation
  const [fieldErrors, setFieldErrors] = useState({
    username: '',
    email: '',
    role: '',
    password: '',
    confirm: '',
    non_field_errors: '',
  })

  // Single top error (only one at a time)
  const [topError, setTopError] = useState('')

  const setOneTopErrorFromFields = (errsObj) => {
    // Prefer a specific field first, then non_field_errors
    const order = ['username', 'email', 'password', 'confirm', 'role', 'non_field_errors']
    for (const key of order) {
      if (errsObj[key]) {
        const label = key === 'non_field_errors' ? 'Error' : capitalize(key)
        setTopError(`${label}: ${errsObj[key]}`)
        return
      }
    }
    setTopError('') // fallback
  }

  const clearErrors = () => {
    setFieldErrors({
      username: '',
      email: '',
      role: '',
      password: '',
      confirm: '',
      non_field_errors: '',
    })
    setTopError('')
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    clearErrors()

    // Client-side checks first
    if (password !== confirm) {
      const newErrs = {
        username: '',
        email: '',
        role: '',
        password: '',
        confirm: 'Passwords do not match.',
        non_field_errors: '',
      }
      setFieldErrors(newErrs)
      setOneTopErrorFromFields(newErrs)
      return
    }

    setLoading(true)
    try {
      await register({
        username: username.trim(),
        email: email.trim(),
        password,
        role,
      })
      navigate('/', { replace: true })
    } catch (err) {
      // Normalize DRF error shapes to fieldErrors
      const data = err?.response?.data
      const newErrs = {
        username: '',
        email: '',
        role: '',
        password: '',
        confirm: '',
        non_field_errors: '',
      }

      if (data && typeof data === 'object') {
        // Example: { "email": ["user with this email already exists."] }
        // or { "password": ["Ensure this field has at least 6 characters."] }
        for (const [key, val] of Object.entries(data)) {
          const msg = Array.isArray(val) ? String(val[0]) : String(val)
          if (key in newErrs) newErrs[key] = msg
          else newErrs.non_field_errors = msg
        }
      } else if (typeof data !== 'undefined') {
        newErrs.non_field_errors = String(data)
      } else {
        newErrs.non_field_errors = err?.message || 'Registration failed'
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
          <h1 className="mb-2 text-2xl font-semibold text-neutral-900 dark:text-white">
            Create account
          </h1>
          <p className="mb-6 text-sm text-neutral-600 dark:text-neutral-300">
            Choose your role to match what you need.
          </p>

          {/* Single top error only (first relevant field) */}
          {topError && (
            <div className="mb-4 rounded-lg border border-danger-600 bg-danger-600/10 p-3 text-sm text-danger-600 dark:border-danger-600 dark:bg-danger-600/20">
              {topError}
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            {/* Username */}
            <div>
              <label className="mb-1 block text-sm text-neutral-700 dark:text-neutral-200">
                Username
              </label>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                aria-invalid={!!fieldErrors.username}
                aria-describedby={fieldErrors.username ? 'err-username' : undefined}
                required
              />
              {fieldErrors.username && (
                <p id="err-username" className="mt-1 text-xs text-danger-600">
                  {fieldErrors.username}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="mb-1 block text-sm text-neutral-700 dark:text-neutral-200">
                Email
              </label>
              <Input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={!!fieldErrors.email}
                aria-describedby={fieldErrors.email ? 'err-email' : undefined}
                required
              />
              {fieldErrors.email && (
                <p id="err-email" className="mt-1 text-xs text-danger-600">
                  {fieldErrors.email}
                </p>
              )}
            </div>

            {/* Role */}
            <div>
              <label className="mb-1 block text-sm text-neutral-700 dark:text-neutral-200">
                Role
              </label>
              <Select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                aria-invalid={!!fieldErrors.role}
                aria-describedby={fieldErrors.role ? 'err-role' : undefined}
              >
                <option value="buyer">Buyer</option>
                <option value="seller">Seller</option>
              </Select>
              {fieldErrors.role && (
                <p id="err-role" className="mt-1 text-xs text-danger-600">
                  {fieldErrors.role}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="mb-1 block text-sm text-neutral-700 dark:text-neutral-200">
                Password
              </label>
              <Input
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={!!fieldErrors.password}
                aria-describedby={fieldErrors.password ? 'err-password' : undefined}
                required
              />
              {fieldErrors.password && (
                <p id="err-password" className="mt-1 text-xs text-danger-600">
                  {fieldErrors.password}
                </p>
              )}
            </div>

            {/* Confirm */}
            <div>
              <label className="mb-1 block text-sm text-neutral-700 dark:text-neutral-200">
                Confirm password
              </label>
              <Input
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                aria-invalid={!!fieldErrors.confirm}
                aria-describedby={fieldErrors.confirm ? 'err-confirm' : undefined}
                required
              />
              {fieldErrors.confirm && (
                <p id="err-confirm" className="mt-1 text-xs text-danger-600">
                  {fieldErrors.confirm}
                </p>
              )}
            </div>

            <Button disabled={loading} className="w-full">
              {loading ? 'Creating account…' : 'Register'}
            </Button>
          </form>

          <p className="mt-4 text-sm text-neutral-600 dark:text-neutral-300">
            Already have an account?{' '}
            <Link to="/login" className="text-info-500 hover:underline">
              Login
            </Link>
          </p>
        </Card>
      </div>
    </Container>
  )
}

/* ------------------------------ helpers ------------------------------ */

function capitalize(s) {
  if (!s) return s
  return s.charAt(0).toUpperCase() + s.slice(1).replaceAll('_', ' ')
}
