import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Container from '@/components/layout/Container'
import Card from '@/components/ui/Card'
import Select from '@/components/ui/Select'
import Input from '@/components/ui/Input'
import { api, endpoints } from '@/lib/api'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import '@/styles/map-card.css';

const bulgariaCenter = [42.7339, 25.4858]
const bulgariaZoom = 7

const pinIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})
// get all the info for catalogs
async function fetchAllPages(url, params = { page_size: 500 }) {
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
    } else nextUrl = null
  }
  return out
}

// Make absolute URL if API returns relative paths
function resolveImage(u) {
  if (!u) return null
  if (/^https?:\/\//i.test(u)) return u
  const base = (api?.defaults?.baseURL || '').replace(/\/+$/, '')
  const path = String(u).replace(/^\/+/, '')
  return base ? `${base}/${path}` : `/${path}`
}

// Tiny sanitizer for tooltip text
function escapeHtml(str) {
  try {
    return String(str).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  } catch { return str }
}

export default function MapView() {
  // catalogs
  const [regions, setRegions] = useState([])
  const [cities, setCities] = useState([])
  const [brands, setBrands] = useState([])
  const [models, setModels] = useState([])
  const [fuelTypes, setFuelTypes] = useState([])
  const [gearboxes, setGearboxes] = useState([])

  // filters
  const [f, setF] = useState({
    region: '',
    city: '',
    brand: '',
    model: '',
    price_min: '',
    price_max: '',
    year_min: '',
    year_max: '',
    fuel_type: '',
    transmission: '',
  })
  const onF = (k, v) => setF(s => ({ ...s, [k]: v }))

  // map refs (safe init)
  const mapElRef = useRef(null) //DOM element of the map mountet by Leaflet
  const mapRef = useRef(null) //holds the leaflet map instance
  // layer for the pins, for easy manipulation
  const layerRef = useRef(L.layerGroup())

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [noResults, setNoResults] = useState(false)

  // preload catalogs
  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const [rs, bs, fuels, gears] = await Promise.all([
          fetchAllPages(endpoints.regions, { page_size: 500 }),
          fetchAllPages(endpoints.brands, { page_size: 500 }),
          fetchAllPages(endpoints.fueltypes, { page_size: 200 }),
          fetchAllPages(endpoints.transmissions, { page_size: 200 }),
        ])
        if (!alive) return
        setRegions(rs)
        setBrands(bs)
        setFuelTypes(fuels)
        setGearboxes(gears)
      } catch (e) {
        console.error('MapView preload error:', e)
      }
    })()
    return () => { alive = false }
  }, [])

  // region to cities
  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        if (!f.region) { setCities([]); onF('city', ''); return }
        const cs = await fetchAllPages(endpoints.cities, { region: f.region, page_size: 500 })
        if (!alive) return
        setCities(cs)
        if (f.city && !cs.some(c => String(c.id) === String(f.city))) onF('city', '')
      } catch (e) {
        console.error(e)
      }
    })()
    return () => { alive = false }
  }, [f.region])

  // brand to models
  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        if (!f.brand) { setModels([]); onF('model', ''); return }
        const ms = await fetchAllPages(endpoints.models, { brand: f.brand, page_size: 500 })
        if (!alive) return
        setModels(ms)
        if (f.model && !ms.some(m => String(m.id) === String(f.model))) onF('model', '')
      } catch (e) {
        console.error(e)
      }
    })()
    return () => { alive = false }
  }, [f.brand])

  // init map once
  useEffect(() => {
    if (mapRef.current) return
    const m = L.map(mapElRef.current, { zoomControl: true }).setView(bulgariaCenter, bulgariaZoom)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(m)
    layerRef.current.addTo(m)
    mapRef.current = m

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  // build params for /api/listings/map/
  const queryParams = useMemo(() => {
    const p = {}
    ;[
      'region','city','brand','model',
      'price_min','price_max','year_min','year_max',
      'fuel_type','transmission',
    ].forEach(k => {
      const v = String(f[k] ?? '').trim() //only non-empty values
      if (v) p[k] = v
    })
    return p
  }, [f])

  // fetch points whenever filters change
  useEffect(() => {
    if (!mapRef.current) return
    let alive = true
    ;(async () => {
      setLoading(true); setError(null)
      try {
        const { data } = await api.get(endpoints.listingsMap, { params: queryParams }) //array of points
        const points = Array.isArray(data) ? data : (data?.results || [])

        // clear previous pins
        layerRef.current.clearLayers()

        if (points.length === 0) {
          setNoResults(true)
          mapRef.current.setView(bulgariaCenter, bulgariaZoom)
          return
        }
        setNoResults(false)

        const bounds = []
        for (const p of points) {
          const lat = Number(p.lat ?? p.latitude)
          const lng = Number(p.lng ?? p.longitude)
          if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue

          const title = p.title || [p.brand_name, p.model_name].filter(Boolean).join(' ') || 'Listing'
          const price = p.price != null ? `${Number(p.price).toLocaleString('bg-BG')} €` : ''

          // first image (thumbnail)
          const imgRaw =
            p.thumbnail ||
            (p.images && p.images[0] && (p.images[0].image || p.images[0].url)) ||
            p.first_image ||
            null
          const img = resolveImage(imgRaw)

          const marker = L.marker([lat, lng], { icon: pinIcon })

          // Rich hover: title, price, first photo (if there is one)
          const tooltipHtml = `
            <div class="map-card">
              ${img
                ? `<img class="map-card__img" src="${img}" alt="">`
                : `<div class="map-card__img map-card__img--placeholder">No image</div>`
              }
              <div class="map-card__body">
                <div class="map-card__title" title="${escapeHtml(title)}">${escapeHtml(title)}</div>
                ${price ? `<div class="map-card__price">${escapeHtml(price)}</div>` : ''}
                <div class="map-card__link">Open details</div>
              </div>
            </div>
          `;
          marker.bindTooltip(tooltipHtml, {
            direction: 'top',
            opacity: 0.98,
            sticky: true,
            className: 'leaflet-custom-tooltip',
          });

          // When click on the pin, open listing in new tab (/listings/:id)
          marker.on('click', () => {
            const url = `/listings/${p.id}`
            window.open(url, '_blank', 'noopener,noreferrer')
          })

          marker.addTo(layerRef.current)
          bounds.push([lat, lng])
        }

        if (bounds.length > 1) {
          mapRef.current.fitBounds(bounds, { padding: [30, 30] })
        } else if (bounds.length === 1) {
          mapRef.current.setView(bounds[0], 14)
        }
      } catch (e) {
        console.error('Map points load failed:', e)
        if (alive) setError('Failed to load points.')
        setNoResults(false)
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [queryParams])
  // null city on region change and zoom in the map
  const onRegionChange = (v) => {
    onF('region', v)
    onF('city', '')
    if (mapRef.current && v) {
      mapRef.current.setView(bulgariaCenter, 8)
    }
  }

  return (
    <div className="py-6">
      <Container>
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white">Map search</h1>
          </div>
          <Link to="/search" className="text-sm text-info-500 hover:underline">Back to list search</Link>
        </div>

        <div className="grid gap-4 md:grid-cols-[320px_1fr]">
          <Card className="p-4 space-y-3">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">Filters</h3>

            <Select value={f.region} onChange={e => onRegionChange(e.target.value)}>
              <option value="">Region</option>
              {regions.map(r => <option key={r.id} value={String(r.id)}>{r.name}</option>)}
            </Select>

            <Select value={f.city} onChange={e => onF('city', e.target.value)} disabled={!f.region}>
              <option value="">{f.region ? 'City' : 'Choose region first'}</option>
              {cities.map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
            </Select>

            <Select value={f.brand} onChange={e => onF('brand', e.target.value)}>
              <option value="">Brand</option>
              {brands.map(b => <option key={b.id} value={String(b.id)}>{b.name}</option>)}
            </Select>

            <Select value={f.model} onChange={e => onF('model', e.target.value)} disabled={!f.brand}>
              <option value="">{f.brand ? 'Model' : 'Choose brand first'}</option>
              {models.map(m => <option key={m.id} value={String(m.id)}>{m.name}</option>)}
            </Select>

            <div className="grid grid-cols-2 gap-2">
              <Input type="number" min="0" placeholder="Price from" value={f.price_min} onChange={e => onF('price_min', e.target.value)} />
              <Input type="number" min="0" placeholder="Price to" value={f.price_max} onChange={e => onF('price_max', e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Input type="number" min="1930" placeholder="Year from" value={f.year_min} onChange={e => onF('year_min', e.target.value)} />
              <Input type="number" min="1930" placeholder="Year to" value={f.year_max} onChange={e => onF('year_max', e.target.value)} />
            </div>

            <Select value={f.fuel_type} onChange={e => onF('fuel_type', e.target.value)}>
              <option value="">Fuel type</option>
              {fuelTypes.map(ft => <option key={ft.id} value={String(ft.id)}>{ft.name}</option>)}
            </Select>

            <Select value={f.transmission} onChange={e => onF('transmission', e.target.value)}>
              <option value="">Gearbox</option>
              {gearboxes.map(g => <option key={g.id} value={String(g.id)}>{g.name}</option>)}
            </Select>

            {error && (
              <div className="rounded-md border border-red-300 bg-red-50 p-2 text-xs text-red-800 dark:border-red-800 dark:bg-red-950/60 dark:text-red-300">
                {error}
              </div>
            )}
            {loading && <div className="text-xs text-neutral-500">Loading pins…</div>}
            {noResults && !loading && !error && (
              <div className="rounded-md border border-amber-300 bg-amber-50 p-2 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
                No listings match the selected filters.
              </div>
            )}
          </Card>

          <Card className="p-0 overflow-hidden">
            <div ref={mapElRef} style={{ height: '70vh', width: '100%' }} />
          </Card>
        </div>
      </Container>
    </div>
  )
}
