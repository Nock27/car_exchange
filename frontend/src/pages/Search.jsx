import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Container from '@/components/layout/Container'
import SectionHeader from '@/components/ui/SectionHeader'
import Select from '@/components/ui/Select'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import ListingCard, { ListingCardSkeleton } from '@/components/ui/ListingCard'
import { api, endpoints } from '@/lib/api'

/* ----------------------------- helpers ----------------------------- */

function useQuery() {
  const { search } = useLocation()
  return useMemo(() => new URLSearchParams(search), [search])
}

function normalizeApiUrl(nextOrPrev) {
  if (!nextOrPrev) return null
  const base = api?.defaults?.baseURL || ''
  try {
    return nextOrPrev.startsWith(base) ? nextOrPrev.slice(base.length) : nextOrPrev
  } catch {
    return nextOrPrev
  }
}

// map UI select -> DRF ordering strings
const ORDER_UI_TO_API = {
  latest: '-created_at',
  price_asc: 'price',
  price_desc: '-price',
  year_desc: '-year',
  mileage_asc: 'mileage',
}
const ORDER_API_TO_UI = Object.fromEntries(Object.entries(ORDER_UI_TO_API).map(([k, v]) => [v, k]))

// tiny paginator for DRF endpoints (same behavior you use elsewhere)
async function fetchAllPages(url, params = { page_size: 200 }) {
  const out = []
  let nextUrl = url
  let nextParams = { ...params }
  while (nextUrl) {
    const { data } = await api.get(nextUrl, { params: nextParams })
    const chunk = Array.isArray(data) ? data : (data?.results || [])
    out.push(...chunk)
    const next = data?.next || null
    if (next) {
      const base = api?.defaults?.baseURL || ''
      nextUrl = next.startsWith(base) ? next.slice(base.length) : next
      nextParams = {}
    } else {
      nextUrl = null
    }
  }
  return out
}

/* ------------------------------- page ------------------------------ */

export default function Search() {
  const navigate = useNavigate()
  const q = useQuery()

  // sidebar catalogs
  const [brands, setBrands] = useState([])
  const [models, setModels] = useState([])
  const [regions, setRegions] = useState([])
  const [cities, setCities] = useState([])
  const [fuelTypes, setFuelTypes] = useState([])
  const [gearboxes, setGearboxes] = useState([])

  // sidebar form (reflects URL on load)
  const [side, setSide] = useState({
    category: '',     // (optional) if you later wire categories here
    brand: '',
    model: '',
    priceFrom: '',
    priceTo: '',
    yearFrom: '',
    yearTo: '',
    fuel_type: '',
    transmission: '',
    region: '',
    city: '',
  })
  const onSide = (k, v) => setSide(s => ({ ...s, [k]: v }))

  // results state
  const [filtersOpen, setFiltersOpen] = useState(true)
  const [items, setItems] = useState([])
  const [count, setCount] = useState(0)
  const [nextUrl, setNextUrl] = useState(null)
  const [prevUrl, setPrevUrl] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // ordering from QS -> UI
  const orderingApi = q.get('ordering') || '-created_at'
  const orderingUi = ORDER_API_TO_UI[orderingApi] ?? 'latest'

  // build API params (only allowed keys)
  const apiParams = useMemo(() => {
    const allowed = new Set([
      'category','brand','model','city','region',
      'fuel_type','transmission','body_type','drive_type','color',
      'price_min','price_max','mileage_max','year_min','year_max',
      'cc_from','cc_to','power_from','power_to',
      'euro','search',
      'ordering','page','page_size',
    ])
    const p = {}
    q.forEach((v, k) => {
      if (allowed.has(k) && v != null && v !== '') p[k] = v
    })
    if (!p.ordering) p.ordering = '-created_at'
    if (!p.page_size) p.page_size = 24
    if (p.category && !/^\d+$/.test(String(p.category))) {
      delete p.category
    }
    for (const key of [
      'brand','model','city','region','fuel_type','transmission','body_type','drive_type','color'
    ]) {
      if (p[key] && !/^\d+$/.test(String(p[key]))) delete p[key]
    }
    return p
  }, [q])

  // preload catalogs (brands, regions, fuel, gearboxes)
  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const [brandsAll, regionsAll, fuelsAll, gearAll] = await Promise.all([
          fetchAllPages(endpoints.brands, { page_size: 500 }),
          fetchAllPages(endpoints.regions, { page_size: 200 }),
          fetchAllPages(endpoints.fueltypes, { page_size: 200 }),
          fetchAllPages(endpoints.transmissions, { page_size: 200 }),
        ])
        if (!alive) return
        setBrands(brandsAll)
        setRegions(regionsAll)
        setFuelTypes(fuelsAll)
        setGearboxes(gearAll)
      } catch (e) {
        console.error(e)
      }
    })()
    return () => { alive = false }
  }, [])

  const { search: locationSearch } = useLocation();
  // reflect URL into sidebar once on mount
  useEffect(() => {
    setSide(s => ({
      ...s,
      brand: q.get('brand') || '',
      model: q.get('model') || '',
      priceFrom: q.get('price_min') || '',
      priceTo: q.get('price_max') || '',
      yearFrom: q.get('year_min') || '',
      yearTo: q.get('year_max') || '',
      fuel_type: q.get('fuel_type') || '',
      transmission: q.get('transmission') || '',
      region: q.get('region') || '',
      city: q.get('city') || '',
    }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationSearch])

  // brand → models
  useEffect(() => {
    const brandId = side.brand
    if (!brandId) { setModels([]); setSide(s => ({ ...s, model: '' })); return }
    let alive = true
    ;(async () => {
      try {
        const modelsAll = await fetchAllPages(endpoints.models, { brand: brandId, page_size: 500 })
        if (alive) setModels(modelsAll)
      } catch (e) {
        console.error(e)
      }
    })()
    return () => { alive = false }
  }, [side.brand])

  // ensure selected model belongs to the loaded list for the current brand
  useEffect(() => {
    if (!side.model) return;
    if (models.length === 0) return;
    const exists = models.some(m => String(m.id) === String(side.model));
    if (!exists) {
      setSide(s => ({ ...s, model: '' }));
    }
  }, [models]);

  // read model from the URL once per render
  const urlModel = q.get('model') || '';

  useEffect(() => {
    // only try to apply if we have a brand and we loaded its models
    if (!side.brand) return;
    if (!urlModel) return;
    if (!models || models.length === 0) return;

    // if the URL's model belongs to the loaded list, select it
    const exists = models.some(m => String(m.id) === String(urlModel));
    if (exists && String(side.model) !== String(urlModel)) {
      setSide(s => ({ ...s, model: String(urlModel) }));
    }
  }, [models, side.brand]);  // runs when the models for the brand arrive


  // region → cities
  useEffect(() => {
    const regionId = side.region
    if (!regionId) { setCities([]); setSide(s => ({ ...s, city: '' })); return }
    let alive = true
    ;(async () => {
      try {
        const citiesAll = await fetchAllPages(endpoints.cities, { region: regionId, page_size: 500 })
        if (alive) setCities(citiesAll)
      } catch (e) {
        console.error(e)
      }
    })()
    return () => { alive = false }
  }, [side.region])

  async function fetchListings(urlOrParams) {
    setLoading(true); setError(null)
    try {
      let res
      if (typeof urlOrParams === 'string') {
        res = await api.get(urlOrParams)
      } else {
        res = await api.get(endpoints.listings, { params: urlOrParams })
      }
      const data = res?.data || {}
      const results = Array.isArray(data) ? data : (data.results || [])
      setItems(results)
      setCount(data.count || (Array.isArray(data) ? data.length : 0))
      setNextUrl(normalizeApiUrl(data.next || null))
      setPrevUrl(normalizeApiUrl(data.previous || null))
    } catch (e) {
      console.error(e)
      setError('Failed to load search results.')
      setItems([]); setCount(0); setNextUrl(null); setPrevUrl(null)
    } finally {
      setLoading(false)
    }
  }

  // load on params change
  useEffect(() => {
    fetchListings(apiParams)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(apiParams)])

  // apply sidebar → write URL (AdvancedSearch stays as the “full” page)
  const applySidebar = () => {
    const params = new URLSearchParams(q)
    // basics
    if (side.brand) params.set('brand', side.brand); else params.delete('brand')
    if (side.model) params.set('model', side.model); else params.delete('model')
    // ranges
    if (side.priceFrom) params.set('price_min', side.priceFrom); else params.delete('price_min')
    if (side.priceTo) params.set('price_max', side.priceTo); else params.delete('price_max')
    if (side.yearFrom) params.set('year_min', side.yearFrom); else params.delete('year_min')
    if (side.yearTo) params.set('year_max', side.yearTo); else params.delete('year_max')
    // technical
    if (side.fuel_type) params.set('fuel_type', side.fuel_type); else params.delete('fuel_type')
    if (side.transmission) params.set('transmission', side.transmission); else params.delete('transmission')
    // location
    if (side.region) params.set('region', side.region); else params.delete('region')
    if (side.city) params.set('city', side.city); else params.delete('city')
    // keep ordering; reset page
    params.delete('page')
    navigate(`/search?${params.toString()}`)
  }

  const resetSidebar = () => {
    setSide({
      category: '',
      brand: '',
      model: '',
      priceFrom: '',
      priceTo: '',
      yearFrom: '',
      yearTo: '',
      fuel_type: '',
      transmission: '',
      region: '',
      city: '',
    })
    navigate('/search')
  }

  const onChangeOrdering = (uiValue) => {
    const ordering = ORDER_UI_TO_API[uiValue] ?? '-created_at'
    const params = new URLSearchParams(q)
    params.set('ordering', ordering)
    params.delete('page')
    navigate(`/search?${params.toString()}`)
  }

  const goPage = (url) => {
    if (!url) return
    const u = new URL(normalizeApiUrl(url), window.location.origin)
    navigate(`/search${u.search}`)
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
          title="Search results"
          subtitle="Use filters to narrow down vehicles."
          actions={
            <div className="flex items-center gap-2">
              <Link to="/advanced-search" className="hidden md:inline text-sm text-info-500 hover:underline">
                Advanced search
              </Link>
              <Button
                variant="secondary"
                onClick={() => setFiltersOpen(v => !v)}
                className="px-3 py-1.5"
                aria-expanded={filtersOpen}
                aria-controls="filters-panel"
              >
                {filtersOpen ? 'Hide filters' : 'Show filters'}
              </Button>
            </div>
          }
        />

        <div className={`grid gap-6 ${filtersOpen ? 'md:grid-cols-[320px_1fr]' : 'md:grid-cols-1'}`}>
          {filtersOpen && (
            <aside
              id="filters-panel"
              className="space-y-3 rounded-2xl border border-neutral-200 bg-white/70 p-4 shadow-sm backdrop-blur dark:border-gray-800 dark:bg-gray-900/70"
            >
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">Filters</h3>
              
              <Select value={side.brand} onChange={e => onSide('brand', e.target.value)}>
                <option value="">Brand</option>
                {brands.map(b => <option key={b.id} value={String(b.id)}>{b.name}</option>)}
              </Select>

              <Select value={side.model} onChange={e => onSide('model', e.target.value)} disabled={!side.brand}>
                <option value="">Model</option>
                {models.map(m => <option key={m.id} value={String(m.id)}>{m.name}</option>)}
              </Select>

              <div className="grid grid-cols-2 gap-2">
                <Input type="number" min="0" placeholder="Price from" value={side.priceFrom} onChange={e => onSide('priceFrom', e.target.value)} />
                <Input type="number" min="0" placeholder="Price to" value={side.priceTo} onChange={e => onSide('priceTo', e.target.value)} />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Select value={side.yearFrom} onChange={e => onSide('yearFrom', e.target.value)}>
                  <option value="">Year from</option>
                  {Array.from({ length: new Date().getFullYear() - 1929 }, (_, i) => 1930 + i).map(y => (
                    <option key={`yf-${y}`} value={y}>{y}</option>
                  ))}
                </Select>
                <Select value={side.yearTo} onChange={e => onSide('yearTo', e.target.value)}>
                  <option value="">Year to</option>
                  {Array.from({ length: new Date().getFullYear() - 1929 }, (_, i) => 1930 + i).map(y => (
                    <option key={`yt-${y}`} value={y}>{y}</option>
                  ))}
                </Select>
              </div>

              <Select value={side.fuel_type} onChange={e => onSide('fuel_type', e.target.value)}>
                <option value="">Fuel type</option>
                {fuelTypes.map(ft => <option key={ft.id} value={String(ft.id)}>{ft.name}</option>)}
              </Select>

              <Select value={side.transmission} onChange={e => onSide('transmission', e.target.value)}>
                <option value="">Gearbox</option>
                {gearboxes.map(g => <option key={g.id} value={String(g.id)}>{g.name}</option>)}
              </Select>

              <Select value={side.region} onChange={e => onSide('region', e.target.value)}>
                <option value="">Region</option>
                {regions.map(r => <option key={r.id} value={String(r.id)}>{r.name}</option>)}
              </Select>

              <Select value={side.city} onChange={e => onSide('city', e.target.value)} disabled={!side.region}>
                <option value="">City</option>
                {cities.map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
              </Select>

              <div className="flex gap-2 pt-1">
                <Button className="flex-1" onClick={applySidebar}>Apply</Button>
                <Button variant="secondary" className="flex-1" onClick={resetSidebar}>Reset</Button>
              </div>

              <Link to="/advanced-search" className="block pt-2 text-sm text-info-500 hover:underline">
                Need more filters? Open Advanced search →
              </Link>
            </aside>
          )}

          <section aria-live="polite">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-sm text-neutral-600 dark:text-neutral-300">
                {loading ? 'Loading…' : `Showing ${count} result${count === 1 ? '' : 's'}`}
              </p>
              <Select
                className="w-[200px]"
                value={orderingUi}
                onChange={e => onChangeOrdering(e.target.value)}
                aria-label="Sort results"
              >
                <option value="latest">Latest listings</option>
                <option value="price_asc">Price ↑</option>
                <option value="price_desc">Price ↓</option>
                <option value="year_desc">Production date ↓</option>
                <option value="mileage_asc">Mileage ↑</option>
              </Select>
            </div>

            {/* One card per line */}
            <div className="grid grid-cols-1 gap-4">
              {loading && (
                <>
                  <ListingCardSkeleton /><ListingCardSkeleton /><ListingCardSkeleton />
                </>
              )}

              {!loading && items.length === 0 && !error && (
                <div className="col-span-full rounded-md border p-6 text-sm text-neutral-600 dark:text-neutral-300">
                  No listings match your filters. Try broadening your search.
                </div>
              )}

              {!loading && error && (
                <div className="col-span-full rounded-md border border-red-300 bg-red-50 p-6 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/60 dark:text-red-300">
                  {error}
                </div>
              )}

              {!loading && !error && items.map(item => {
                const title = item.title || [item.brand_name, item.model_name].filter(Boolean).join(' ')
                const price = fmtPrice(item.price)
                const specsParts = [
                  item.fuel_type_name,
                  item.mileage != null ? `${Number(item.mileage).toLocaleString('bg-BG')} km` : null,
                  item.transmission_name,
                  item.body_type_name,
                  item.year ? `Year ${item.year}` : null,
                  item.power_hp ? `${item.power_hp} hp` : null,
                  item.engine_cc ? `${item.engine_cc} cc` : null,
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
                  />
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
        </div>
      </Container>
    </div>
  )
}
