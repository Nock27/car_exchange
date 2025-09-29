import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Container from '@/components/layout/Container'
import SectionHeader from '@/components/ui/SectionHeader'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import ListingCard, { ListingCardSkeleton } from '@/components/ui/ListingCard'
import { api, endpoints } from '@/lib/api'

function normalizeApiUrl(nextOrPrev) {
  if (!nextOrPrev) return null
  const base = api?.defaults?.baseURL || ''
  try { return nextOrPrev.startsWith(base) ? nextOrPrev.slice(base.length) : nextOrPrev }
  catch { return nextOrPrev }
}

const ORDER_UI_TO_API = {
  latest: '-created_at',
  price_asc: 'price',
  price_desc: '-price',
  year_desc: '-year',
  mileage_asc: 'mileage',
}
const ORDER_API_TO_UI = Object.fromEntries(Object.entries(ORDER_UI_TO_API).map(([k, v]) => [v, k]))

export default function MyListings() {
  const navigate = useNavigate()

  const [items, setItems] = useState([])
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const [nextUrl, setNextUrl] = useState(null)
  const [prevUrl, setPrevUrl] = useState(null)

  const [orderingUi, setOrderingUi] = useState('latest')
  const orderingApi = useMemo(() => ORDER_UI_TO_API[orderingUi] ?? '-created_at', [orderingUi])

  async function fetchMine(urlOrParams) {
    setLoading(true); setError(null)
    try {
      let res
      if (typeof urlOrParams === 'string') {
        res = await api.get(urlOrParams)
      } else {
        // Assumes backend supports ?mine=1 to filter owner’s listings.
        // If not, change to whatever your “my listings” endpoint is.
        res = await api.get(endpoints.listings, {
          params: { mine: 1, ordering: orderingApi, page_size: 24, ...urlOrParams }
        })
      }
      const { data } = await api.get(endpoints.listingsMine, { params: { page_size: 200, ordering: '-created_at' } })
      const results = Array.isArray(data) ? data : (data.results || [])
      setItems(results)
      setCount(data.count || (Array.isArray(data) ? data.length : 0))
      setNextUrl(normalizeApiUrl(data.next || null))
      setPrevUrl(normalizeApiUrl(data.previous || null))
    } catch (e) {
      console.error(e)
      setError('Failed to load your listings.')
      setItems([]); setCount(0); setNextUrl(null); setPrevUrl(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMine({}) // initial load
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderingApi])

  const goPage = (url) => {
    if (!url) return
    fetchMine(url) // keep it internal; no URL change
  }

  const onDelete = async (id) => {
    if (!confirm('Delete this listing? This cannot be undone.')) return
    try {
      await api.delete(`${endpoints.listings}/${id}/`)
      setItems(prev => prev.filter(x => x.id !== id))
      setCount(prev => Math.max(0, prev - 1))
    } catch (e) {
      console.error(e)
      alert('Failed to delete listing.')
    }
  }

  const fmtPrice = (price) => {
    if (price == null) return '—'
    try { return `${Number(price).toLocaleString('bg-BG')} лв` }
    catch { return `${price} лв` }
  }

  return (
    <div className="py-6">
      <Container>
        <SectionHeader
          title="My listings"
          subtitle="Manage your posted vehicles."
          actions={
            <div className="flex items-center gap-2">
              <Select
                className="w-[200px]"
                value={orderingUi}
                onChange={e => setOrderingUi(e.target.value)}
                aria-label="Sort results"
              >
                <option value="latest">Latest</option>
                <option value="price_asc">Price ↑</option>
                <option value="price_desc">Price ↓</option>
                <option value="year_desc">Production date ↓</option>
                <option value="mileage_asc">Mileage ↑</option>
              </Select>
              <Link to="/create-listing" className="hidden md:inline">
                <Button>Post new</Button>
              </Link>
            </div>
          }
        />

        <section aria-live="polite">
          <div className="mb-3 text-sm text-neutral-600 dark:text-neutral-300">
            {loading ? 'Loading…' : `You have ${count} listing${count === 1 ? '' : 's'}`}
          </div>

          <div className="grid grid-cols-1 gap-4">
            {loading && (<><ListingCardSkeleton /><ListingCardSkeleton /><ListingCardSkeleton /></>)}

            {!loading && error && (
              <div className="rounded-md border border-red-300 bg-red-50 p-6 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/60 dark:text-red-300">
                {error}
              </div>
            )}

            {!loading && !error && items.length === 0 && (
              <div className="rounded-md border p-6 text-sm text-neutral-600 dark:text-neutral-300">
                No listings yet. <Link className="text-info-500 underline" to="/create-listing">Create your first one →</Link>
              </div>
            )}

            {!loading && !error && items.map(item => {
              const title = item.title || [item.brand_name, item.model_name].filter(Boolean).join(' ')
              const price = fmtPrice(item.price)
              const specs = [
                item.fuel_type_name,
                item.mileage != null ? `${Number(item.mileage).toLocaleString('bg-BG')} km` : null,
                item.transmission_name,
                item.year ? `Year ${item.year}` : null,
              ].filter(Boolean).join(' • ')
              const location = [item.city_name, item.region_name].filter(Boolean).join(', ')
              const image = item.thumbnail || (item.images?.[0]?.image || null)

              return (
                <div key={item.id} className="rounded-xl border border-neutral-200 bg-white/70 p-3 shadow-sm backdrop-blur dark:border-gray-800 dark:bg-gray-900/70">
                  <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
                    <ListingCard
                      title={title}
                      price={price}
                      specs={specs}
                      location={location}
                      image={image}
                      id={item.id}
                    />
                    <div className="flex gap-2 md:flex-col md:items-stretch">
                      <Link to={`/listings/${item.id}/edit`} className="w-full md:w-auto">
                        {item.is_owner && (
                          <>
                            <Button as={Link} to={`/listings/${item.id}/edit`}>Edit</Button>
                            {/* ... */}
                          </>
                        )}
                      </Link>
                      <Button variant="danger" className="w-full" onClick={() => onDelete(item.id)}>Delete</Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-6 flex justify-center gap-2">
            <Button variant="secondary" className="px-3 py-1.5" onClick={() => goPage(prevUrl)} disabled={!prevUrl}>
              « Prev
            </Button>
            <Button className="px-3 py-1.5" onClick={() => goPage(nextUrl)} disabled={!nextUrl}>
              Next »
            </Button>
          </div>
        </section>
      </Container>
    </div>
  )
}
