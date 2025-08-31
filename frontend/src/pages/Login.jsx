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

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email.trim(), password)
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setError(err?.response?.data?.message || 'Invalid credentials')
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
            Welcome back. Enter your account details.
          </p>

          {error && (
            <div className="mb-4 rounded-lg border border-danger-600 bg-danger-600/10 p-3 text-sm text-danger-600 dark:border-danger-600 dark:bg-danger-600/20">
              {error}
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-3">
            <div>
              <label className="mb-1 block text-sm text-neutral-700 dark:text-neutral-200">Email</label>
              <Input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm text-neutral-700 dark:text-neutral-200">Password</label>
              <Input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button disabled={loading} className="w-full">
              {loading ? 'Signing in…' : 'Login'}
            </Button>
          </form>

          <p className="mt-4 text-sm text-neutral-600 dark:text-neutral-300">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="text-info-500 hover:underline">
              Register
            </Link>
          </p>
        </Card>
      </div>
    </Container>
  )
}
