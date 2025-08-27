import Container from '@/components/layout/Container'
import { Link } from 'react-router-dom'

export default function Login() {
  return (
    <Container className="py-8">
      <h2 className="mb-4 text-2xl font-semibold">Login</h2>
      <div className="rounded-lg border p-6">
        {/* TODO: real login form */}
        <p className="text-neutral-600">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="text-brand-600 hover:underline">
            Register
          </Link>
        </p>
      </div>
    </Container>
  )
}
