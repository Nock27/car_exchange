import Container from '@/components/layout/Container'
import { Link } from 'react-router-dom'

export default function Register() {
  return (
    <Container className="py-8">
      <h2 className="mb-4 text-2xl font-semibold">Register</h2>
      <div className="rounded-lg border p-6">
        {/* TODO: real register form */}
        <p className="text-neutral-600">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-600 hover:underline">
            Login
          </Link>
        </p>
      </div>
    </Container>
  )
}
