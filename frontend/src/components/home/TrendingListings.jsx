import { useEffect, useState } from 'react'
import ListingCard, { ListingCardSkeleton } from '@/components/ui/ListingCard'
import { api, endpoints } from '@/lib/api'

export default function TrendingListings({ limit = 6 }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let alive = true
    ;(async () => {
      setLoading(true); setError(null)
      try {
        const { data } = await api.get(endpoints.listings, {
          params: { ordering: '-created_at', page: 1, page_size: limit },
        })
        const results = Array.isArray(data) ? data : (data?.results || [])
        if (alive) setItems(results.slice(0, limit)) // client-side cap too (in case pagination is off)
      } catch (e) {
        console.error(e)
        if (alive) setError('Failed to load trending listings.')
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [limit])

  const fmtPrice = (price) => {
    if (price == null) return '—'
    try { return `${Number(price).toLocaleString('bg-BG')} лв` }
    catch { return `${price} лв` }
  }

  if (loading) {
    // Return exactly `limit` skeletons; Home's grid will place them
    return (
      <>
        {Array.from({ length: limit }).map((_, i) => <ListingCardSkeleton key={i} />)}
      </>
    )
  }

  if (error) {
    return (
      <div className="col-span-full rounded-md border border-red-300 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/60 dark:text-red-300">
        {error}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="col-span-full rounded-md border p-4 text-sm text-neutral-600 dark:text-neutral-300">
        No listings yet.
      </div>
    )
  }

  return (
    <>
      {items.map(item => {
        const title = item.title || [item.brand_name, item.model_name].filter(Boolean).join(' ')
        const price = fmtPrice(item.price)
        const specsParts = [
          item.fuel_type_name,
          item.mileage != null ? `${Number(item.mileage).toLocaleString('bg-BG')} km` : null,
          item.transmission_name,
          item.year ? `Year ${item.year}` : null,
        ].filter(Boolean)
        const specs = specsParts.join(' • ')
        const location = [item.city_name, item.region_name].filter(Boolean).join(', ')
        const image = item.thumbnail || (item.images?.[0]?.image || null)

        return (
          <ListingCard
            key={item.id}
            title={title}
            price={price}
            specs={specs}
            location={location}
            image={image}
            id={item.id}
            showFavorite={false}
          />
        )
      })}
    </>
  )
}
