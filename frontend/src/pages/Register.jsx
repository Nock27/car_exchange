import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Container from '@/components/layout/Container'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { useAuth } from '@/context/AuthContext'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    try {
      await register({ name: name.trim(), email: email.trim(), password })
      navigate('/', { replace: true })
    } catch (err) {
      setError(err?.response?.data?.message || 'Registration failed')
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

          {error && (
            <div className="mb-4 rounded-lg border border-danger-600 bg-danger-600/10 p-3 text-sm text-danger-600 dark:border-danger-600 dark:bg-danger-600/20">
              {error}
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-3">
            <div>
              <label className="mb-1 block text-sm text-neutral-700 dark:text-neutral-200">Name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required />
            </div>

            <div>
              <label className="mb-1 block text-sm text-neutral-700 dark:text-neutral-200">Email</label>
              <Input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>

            <div>
              <label className="mb-1 block text-sm text-neutral-700 dark:text-neutral-200">Password</label>
              <Input type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>

            <div>
              <label className="mb-1 block text-sm text-neutral-700 dark:text-neutral-200">Confirm password</label>
              <Input type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
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
