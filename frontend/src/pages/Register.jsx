import { useEffect, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import Container from '@/components/layout/Container'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'
import { useAuth } from '@/context/AuthContext'

export default function Register() {
  const { register, isAuthed } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('private') // 'private' | 'dealer'
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')

  const [loading, setLoading] = useState(false)

  const [fieldErrors, setFieldErrors] = useState({
    username: '',
    email: '',
    role: '',
    password: '',
    confirm: '',
    non_field_errors: '',
  })
  const [topError, setTopError] = useState('')

  // If already authenticated, leave this page
  useEffect(() => {
    if (isAuthed) {
      const dest = location.state?.from || '/'
      navigate(dest, { replace: true })
    }
  }, [isAuthed, location.state, navigate])

  const setOneTopErrorFromFields = (errsObj) => {
    const order = ['username', 'email', 'password', 'confirm', 'role', 'non_field_errors']
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

    if (password !== confirm) {
      const newErrs = { ...fieldErrors, confirm: 'Passwords do not match.' }
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
      // AuthContext.register auto-logs in; show home
      navigate('/', { replace: true })
    } catch (err) {
      const data = err?.response?.data
      const newErrs = { ...fieldErrors }
      if (data && typeof data === 'object') {
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
          <h1 className="mb-2 text-2xl font-semibold text-neutral-900 dark:text-white">Create account</h1>
          <p className="mb-6 text-sm text-neutral-600 dark:text-neutral-300">
            Join to post and manage your listings.
          </p>

          {topError && (
            <div className="mb-4 rounded-lg border border-danger-600 bg-danger-600/10 p-3 text-sm text-danger-600 dark:border-danger-600 dark:bg-danger-600/20">
              {topError}
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            <Field label="Username" error={fieldErrors.username} id="username">
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                aria-invalid={!!fieldErrors.username}
                aria-describedby={fieldErrors.username ? 'err-username' : undefined}
                required
              />
            </Field>

            <Field label="Email" error={fieldErrors.email} id="email">
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={!!fieldErrors.email}
                aria-describedby={fieldErrors.email ? 'err-email' : undefined}
                required
              />
            </Field>

            <Field label="Role" error={fieldErrors.role} id="role">
              <Select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                aria-invalid={!!fieldErrors.role}
                aria-describedby={fieldErrors.role ? 'err-role' : undefined}
              >
                <option value="private">Private individual</option>
                <option value="dealer">Dealer</option>
              </Select>
            </Field>

            <Field label="Password" error={fieldErrors.password} id="password">
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={!!fieldErrors.password}
                aria-describedby={fieldErrors.password ? 'err-password' : undefined}
                required
              />
            </Field>

            <Field label="Confirm password" error={fieldErrors.confirm} id="confirm">
              <Input
                id="confirm"
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                aria-invalid={!!fieldErrors.confirm}
                aria-describedby={fieldErrors.confirm ? 'err-confirm' : undefined}
                required
              />
            </Field>

            <Button disabled={loading} className="w-full">
              {loading ? 'Creating account…' : 'Register'}
            </Button>
          </form>

          <p className="mt-4 text-sm text-neutral-600 dark:text-neutral-300">
            Already have an account?{' '}
            <Link to="/login" className="text-info-500 hover:underline">Login</Link>
          </p>
        </Card>
      </div>
    </Container>
  )
}

function Field({ label, error, id, children }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm text-neutral-700 dark:text-neutral-200">
        {label}
      </label>
      {children}
      {error && <p id={`err-${id}`} className="mt-1 text-xs text-danger-600">{error}</p>}
    </div>
  )
}

function capitalize(s) {
  if (!s) return s
  return s.charAt(0).toUpperCase() + s.slice(1).replaceAll('_', ' ')
}
