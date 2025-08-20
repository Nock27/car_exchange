import { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet-control-geocoder'

/* Fix default marker icons in Leaflet (Vite + Leaflet quirk) */
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url),
  iconUrl: new URL('leaflet/dist/images/marker-icon.png', import.meta.url),
  shadowUrl: new URL('leaflet/dist/images/marker-shadow.png', import.meta.url),
})

function ClickHandler({ onPick }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng)
    }
  })
  return null
}

export default function MapPicker({ value, onChange }) {
  // value = { address, latitude, longitude } or undefined
  const [pos, setPos] = useState(
    value?.latitude && value?.longitude
      ? [value.latitude, value.longitude]
      : [42.6977, 23.3219] // default Sofia
  )
  const geocoderRef = useRef(null)
  const mapRef = useRef(null)

  const handlePick = (latlng) => {
    setPos([latlng.lat, latlng.lng])
    onChange?.({
      address: value?.address || '',
      latitude: latlng.lat,
      longitude: latlng.lng,
    })
  }

  useEffect(() => {
    if (!mapRef.current) return
    // add Geocoder control (uses Nominatim, no API key)
    if (!geocoderRef.current) {
      const map = mapRef.current
      const geocoder = L.Control.geocoder({
        defaultMarkGeocode: false,
      })
        .on('markgeocode', function(e) {
          const { center, name } = e.geocode
          setPos([center.lat, center.lng])
          onChange?.({ address: name, latitude: center.lat, longitude: center.lng })
          map.setView([center.lat, center.lng], 14)
        })
        .addTo(map)
      geocoderRef.current = geocoder
    }
  }, [onChange])

  return (
    <div className="space-y-2">
      <div className="text-sm text-gray-600">
        Start typing an address in the geocoder (top-left), or click on the map to set a pin.
      </div>
      <MapContainer
        center={pos}
        zoom={12}
        style={{ height: 360, width: '100%' }}
        whenCreated={(map) => (mapRef.current = map)}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickHandler onPick={handlePick} />
        {pos && <Marker position={pos} />}
      </MapContainer>

      <div className="grid grid-cols-3 gap-2 text-sm">
        <div>
          <label className="block mb-1">Address</label>
          <input
            className="border rounded px-2 py-1 w-full"
            value={value?.address || ''}
            onChange={e => onChange?.({ ...value, address: e.target.value })}
            placeholder="Type or use the geocoder"
          />
        </div>
        <div>
          <label className="block mb-1">Latitude</label>
          <input className="border rounded px-2 py-1 w-full" value={value?.latitude || ''} readOnly />
        </div>
        <div>
          <label className="block mb-1">Longitude</label>
          <input className="border rounded px-2 py-1 w-full" value={value?.longitude || ''} readOnly />
        </div>
      </div>
    </div>
  )
}