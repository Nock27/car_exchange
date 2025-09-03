import { useEffect, useMemo, useRef, useState } from 'react'

/**
 * AddressAutocomplete (no-portal version)
 * - Tries Photon (komoot) first, falls back to Nominatim.
 * - Biases by selected city when given.
 * - Dropdown absolutely positioned with a very high z-index so it floats above Leaflet.
 */

const CONTACT_EMAIL = 'thesis@example.com' // etiquette for Nominatim

function getCenter(obj) {
  if (!obj) return null
  const lat = obj.lat ?? obj.latitude
  const lng = obj.lng ?? obj.longitude
  if (typeof lat === 'number' && typeof lng === 'number') return { lat, lng }
  if (typeof lat === 'string' && typeof lng === 'string') return { lat: parseFloat(lat), lng: parseFloat(lng) }
  return null
}

async function searchPhoton(q, center) {
  const url = new URL('https://photon.komoot.io/api/')
  url.searchParams.set('q', q)
  url.searchParams.set('limit', '8')
  url.searchParams.set('lang', 'bg')
  if (center) {
    url.searchParams.set('lat', String(center.lat))
    url.searchParams.set('lon', String(center.lng))
  }
  const res = await fetch(url.toString(), { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(`Photon ${res.status}`)
  const data = await res.json()
  if (!data || !Array.isArray(data.features)) return []
  return data.features.map(f => {
    const c = f.geometry?.coordinates || []
    const p = f.properties || {}
    const lon = Number(c[0]); const lat = Number(c[1])
    const parts = [p.name, p.street, p.housenumber, p.city || p.locality, p.postcode, p.state, p.country].filter(Boolean)
    return {
      id: `${p.osm_id || f.id || `${lat},${lon}`}`,
      label: parts.join(', ') || p.name || `${lat.toFixed(5)}, ${lon.toFixed(5)}`,
      lat, lon
    }
  })
}

async function searchNominatim(q, cityObj, regionObj, center) {
  const base = 'https://nominatim.openstreetmap.org/search'
  const params = new URLSearchParams({
    format: 'jsonv2',
    q,
    addressdetails: '1',
    limit: '8',
    'accept-language': 'bg',
    email: CONTACT_EMAIL,
  })
  const hint = [cityObj?.name, regionObj?.name].filter(Boolean).join(', ')
  if (hint) params.set('q', `${q}, ${hint}`)
  if (center) {
    const dLat = 0.08, dLng = 0.12
    const box = [center.lng - dLng, center.lat - dLat, center.lng + dLng, center.lat + dLat]
    params.set('bounded', '1')
    params.set('viewbox', box.join(','))
  }
  const res = await fetch(`${base}?${params.toString()}`, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(`Nominatim ${res.status}`)
  const data = await res.json()
  if (!Array.isArray(data)) return []
  return data.map(d => ({
    id: String(d.place_id),
    label: d.display_name,
    lat: parseFloat(d.lat),
    lon: parseFloat(d.lon),
  }))
}

export default function AddressAutocomplete({
  value = '',
  cityObj = null,
  regionObj = null,
  onChangeText,
  onSelect,
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState([])
  const boxRef = useRef(null)
  const inputRef = useRef(null)
  const timerRef = useRef(null)
  const cityCenter = useMemo(() => getCenter(cityObj), [cityObj])

  const placeHint = useMemo(() => {
    const parts = []
    if (cityObj?.name) parts.push(cityObj.name)
    if (regionObj?.name && regionObj?.name !== cityObj?.name) parts.push(regionObj.name)
    return parts.length ? ` (${parts.join(', ')})` : ''
  }, [cityObj, regionObj])

  useEffect(() => {
    const onDoc = (e) => {
      if (!boxRef.current) return
      if (!boxRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const fetchSuggestions = async (q) => {
    setLoading(true)
    try {
      const first = await searchPhoton(q, cityCenter)
      if (first.length) { setItems(first); setOpen(true); return }
      const second = await searchNominatim(q, cityObj, regionObj, cityCenter)
      setItems(second); setOpen(true)
    } catch (e) {
      console.error('Autocomplete error:', e)
      try {
        const second = await searchNominatim(q, cityObj, regionObj, cityCenter)
        setItems(second)
      } catch (e2) {
        console.error('Fallback failed:', e2)
        setItems([])
      } finally {
        setOpen(true)
      }
    } finally {
      setLoading(false)
    }
  }

  const debouncedFetch = (q) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (!q || q.trim().length < 2) { setItems([]); setOpen(false); return }
    timerRef.current = setTimeout(() => fetchSuggestions(q.trim()), 250)
  }

  const onInput = (e) => {
    const txt = e.target.value
    onChangeText?.(txt)
    debouncedFetch(txt)
  }

  const pick = (opt) => {
    onSelect?.({ address: opt.label, latitude: opt.lat, longitude: opt.lon })
    setOpen(false)
    // keep focus on the input for smooth editing
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  return (
    <div ref={boxRef} className="relative z-20 card-overflow-visible">
      <input
        ref={inputRef}
        value={value}
        onChange={onInput}
        onFocus={() => { if (value.trim().length >= 2) debouncedFetch(value); setOpen(true) }}
        placeholder={`Street, number${placeHint}`}
        className="w-full rounded-lg border border-neutral-300 bg-white/80 px-3 py-2 text-sm shadow-sm dark:border-gray-700 dark:bg-gray-900/80"
        autoComplete="off"
      />
      {open && (
        <div
          className="autocomplete-dropdown mt-1 max-h-64 w-full overflow-auto rounded-lg border border-neutral-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900"
        >
          {loading && (<div className="px-3 py-2 text-sm text-neutral-500">Searching…</div>)}
          {!loading && items.length === 0 && (
            <div className="px-3 py-2 text-sm text-neutral-500">No suggestions</div>
          )}
          {!loading && items.map(opt => (
            <button
              key={opt.id}
              type="button"
              onClick={() => pick(opt)}
              className="block w-full cursor-pointer px-3 py-2 text-left text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
