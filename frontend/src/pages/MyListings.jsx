import Container from '@/components/layout/Container'

export default function MyListings() {
  return (
    <Container className="py-8">
      <h2 className="mb-4 text-2xl font-semibold">My Listings</h2>
      <div className="rounded-lg border p-6 text-neutral-600">No listings yet.</div>
    </Container>
  )
}
