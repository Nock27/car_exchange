import Container from '@/components/layout/Container'
import { useParams } from 'react-router-dom'

export default function ListingDetails() {
  const { id } = useParams()
  return (
    <Container className="py-8">
      <h2 className="mb-4 text-2xl font-semibold">Listing #{id}</h2>
      <div className="rounded-lg border p-6 text-neutral-600">Details coming soon</div>
    </Container>
  )
}
