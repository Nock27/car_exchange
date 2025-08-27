import Container from '@/components/layout/Container'
import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <Container className="py-16 text-center">
      <h2 className="text-3xl font-semibold">404</h2>
      <p className="mt-2 text-neutral-600">Page not found.</p>
      <Link to="/" className="mt-6 inline-block rounded-md bg-neutral-900 px-5 py-2.5 text-white hover:bg-neutral-800">
        Go home
      </Link>
    </Container>
  )
}
