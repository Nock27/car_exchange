import { useEffect, useState } from 'react'
import Container from '@/components/layout/Container'
import ListingCard, { ListingCardSkeleton } from '@/components/ui/ListingCard'
import { api, endpoints } from '@/lib/api'

export default function Favorites() {
  const [items, setItems] = useState(null) //fav arr

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const { data } = await api.get(endpoints.favorites, { params: { page_size: 200 } })
        const rows = Array.isArray(data) ? data : (data?.results || [])
        if (!cancelled) setItems(rows)
      } catch (e) {
        console.error(e)
        if (!cancelled) setItems([])
      }
    })()
    return () => { cancelled = true }
  }, [])
  const handleToggle = async (listingId, shouldFav) => { //favorite toggle
    try {
      if (shouldFav) await api.post(endpoints.favorite(listingId))
      else await api.delete(endpoints.favorite(listingId))
      setItems(prev => prev.filter(f => f.listing.id !== listingId))
    } catch (e) { console.error(e) }
  }

  return (
    <Container className="py-8">
      <h2 className="mb-6 text-2xl font-semibold">My favorites</h2>

      {!items && (
        <div className="grid grid-cols-1 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <ListingCardSkeleton key={i} />)}
        </div>
      )}

      {items && items.length === 0 && (
        <div className="rounded-lg border p-6 text-neutral-600">No favorites yet.</div>
      )}

      {Array.isArray(items) && items.length > 0 && (
        <div className="grid grid-cols-1 gap-4">
          {items.map(({ id, listing }) => (
            <ListingCard
              key={id}
              id={listing.id}
              image={listing.images?.[0]?.image}
              title={listing.title}
              price={`${Number(listing.price).toLocaleString('bg-BG')} €`}
              specs={[
                listing.fuel_type?.name,
                listing.mileage != null ? `${Number(listing.mileage).toLocaleString('bg-BG')} km` : null,
                listing.transmission?.name,
                listing.year ? `Year ${listing.year}` : null,
              ].filter(Boolean).join(' • ')}
              location={
                [listing.city_name, listing.region_name].filter(Boolean).join(', ')
                || listing.city?.name
                || ''
              }
              isFavorited={true}
              onToggleFavorite={handleToggle}
            />
          ))}
        </div>
      )}
    </Container>
  )
}
