import Container from '@/components/layout/Container'
import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <section className="bg-gradient-to-b from-brand-50 to-white">
      <Container className="py-10 md:py-16">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          Find your next car.
        </h1>
        <p className="mt-2 max-w-2xl text-neutral-600">
          Advanced filters, clean UI, and an interactive map to explore listings by location.
        </p>

        <div className="mt-6 flex gap-3">
          <Link
            to="/search"
            className="rounded-md bg-brand-500 px-5 py-2.5 text-white shadow hover:bg-brand-600"
          >
            Start browsing
          </Link>
          <Link
            to="/create-listing"
            className="rounded-md border border-neutral-300 px-5 py-2.5 hover:bg-neutral-50"
          >
            Post a listing
          </Link>
        </div>
      </Container>
    </section>
  )
}
