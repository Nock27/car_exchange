import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const DEFAULT_CENTER = { lat: 42.7339, lng: 25.4858 }
const TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
const ATTRIB = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'

async function reverseGeocode(lat, lon) {
  try {
    const url = new URL('https://nominatim.openstreetmap.org/reverse')
    url.searchParams.set('format', 'jsonv2')
    url.searchParams.set('lat', lat)
    url.searchParams.set('lon', lon)
    url.searchParams.set('addressdetails', '1')
    url.searchParams.set('accept-language', 'bg')
    const res = await fetch(url.toString(), { headers: { 'Accept': 'application/json' } })
    const data = await res.json()
    return data?.display_name || `${lat.toFixed(5)}, ${lon.toFixed(5)}`
  } catch {
    return `${lat.toFixed(5)}, ${lon.toFixed(5)}`
  }
}

/**
 * Props:
 *  - value: { address, latitude, longitude }
 *  - center?: { lat, lng }
 *  - zoom?: number
 *  - focusOnChangeZoom?: number (default 17)  <-- NEW
 *  - onChange: ({ address, latitude, longitude }) => void
 */
export default function MapPicker({ value, center, zoom, focusOnChangeZoom = 17, onChange }) {
  const mapRef = useRef(null)
  const markerRef = useRef(null)
  const containerRef = useRef(null)

  useEffect(() => {
    if (mapRef.current) return

    const initialCenter = (center && isFinite(center.lat) && isFinite(center.lng))
      ? center
      : (value?.latitude && value?.longitude
          ? { lat: Number(value.latitude), lng: Number(value.longitude) }
          : DEFAULT_CENTER)

    const initialZoom = zoom ?? (center ? 12 : (value?.latitude ? focusOnChangeZoom : 7))

    const map = L.map(containerRef.current, {
      center: [initialCenter.lat, initialCenter.lng],
      zoom: initialZoom,
      zoomControl: true,
      scrollWheelZoom: false,
    })
    mapRef.current = map

    L.tileLayer(TILE_URL, { attribution: ATTRIB }).addTo(map)

    const createOrMoveMarker = (lat, lng) => {
      if (!markerRef.current) {
        const marker = L.marker([lat, lng], { draggable: true }).addTo(map)
        marker.on('dragend', async () => {
          const pos = marker.getLatLng()
          const addr = await reverseGeocode(pos.lat, pos.lng)
          // zoom in when user finishes drag
          map.setView([pos.lat, pos.lng], focusOnChangeZoom, { animate: true })
          onChange?.({ address: addr, latitude: pos.lat, longitude: pos.lng })
        })
        markerRef.current = marker
      } else {
        markerRef.current.setLatLng([lat, lng])
      }
    }

    if (value?.latitude && value?.longitude) {
      const lat = Number(value.latitude), lng = Number(value.longitude)
      createOrMoveMarker(lat, lng)
      map.setView([lat, lng], focusOnChangeZoom, { animate: true })
    }

    map.on('click', async (e) => {
      const { lat, lng } = e.latlng
      createOrMoveMarker(lat, lng)
      const addr = await reverseGeocode(lat, lng)
      map.setView([lat, lng], focusOnChangeZoom, { animate: true })
      onChange?.({ address: addr, latitude: lat, longitude: lng })
    })

    return () => {
      map.off()
      map.remove()
      mapRef.current = null
      markerRef.current = null
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // City change (center) – keep previous behavior
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const hasValidCenter = center && isFinite(center.lat) && isFinite(center.lng)
    if (hasValidCenter) map.setView([center.lat, center.lng], zoom ?? 12, { animate: true })
  }, [center, zoom])

  // External value change (e.g. autocomplete picked)
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const lat = Number(value?.latitude), lng = Number(value?.longitude)
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return

    if (!markerRef.current) {
      markerRef.current = L.marker([lat, lng], { draggable: true }).addTo(map)
      markerRef.current.on('dragend', async () => {
        const pos = markerRef.current.getLatLng()
        const addr = await reverseGeocode(pos.lat, pos.lng)
        map.setView([pos.lat, pos.lng], focusOnChangeZoom, { animate: true })
        onChange?.({ address: addr, latitude: pos.lat, longitude: pos.lng })
      })
    } else {
      markerRef.current.setLatLng([lat, lng])
    }

    map.setView([lat, lng], focusOnChangeZoom, { animate: true })
  }, [value?.latitude, value?.longitude, focusOnChangeZoom]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="w-full">
      <div
        ref={containerRef}
        className="h-80 w-full rounded-xl border border-neutral-200 shadow-sm overflow-hidden dark:border-gray-700"
        style={{ minHeight: 320, zIndex: 10 }}
      />
      <p className="mt-2 text-xs text-neutral-500">
        Tip: Click the map to drop a pin, or drag the pin to refine the exact address.
      </p>
    </div>
  )
}
