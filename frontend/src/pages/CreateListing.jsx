import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Container from '@/components/layout/Container'
import Select from '@/components/ui/Select'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { api, endpoints, toArray } from '@/lib/api'
import MapPicker from '@/components/MapPicker'
import AddressAutocomplete from '@/components/AddressAutocomplete'
import { useAuth } from '@/context/AuthContext'

const EURO_OPTIONS = ['Euro 1','Euro 2','Euro 3','Euro 4','Euro 5','Euro 6']
const COLOR_OPTIONS = [
  'Dark blue','Banana','Beata','Beige','Bordeaux','Bronze','White','Wine','Violet','Vishnev','Graphite',
  'Yellow','Green','Golden','Brown','Tiled','Creamy','Purple','Metallic','Orange','Ochre','Ashy','Pearl',
  'Sandy','Residual','Pink','Sahara','Light grey','Light blue','grey','blue','ivory','silver','Dark grey',
  'Dark blue meth','Dark red','Tabacco','Chameleon','Red','Black'
]
const YT_VIMEO_RE = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be|vimeo\.com)\/.+/i

// ==== Extras & Features from the spec ====
const GROUPS = {
  Safety: [
    'GPS tracking system','Automatic stability control','Adaptive headlights','Anti-lock braking system',
    'Airbags - Rear','Airbags - Front','Airbags - Side','Electric brake force distribution',
    'Electronic stabilization program','Tire pressure monitoring','Parking sensors','ISOFIX system',
    'Dynamic Stability System','Anti-skid system','Pad drying system','Distance control system',
    'Descent control system','Brake assist system'
  ],
  Comfort: [
    'Auto Start Stop function','Bluetooth \\ handsfree system','DVD\\TV','Steptronic','Tiptronic',
    'USB, audio\\video, IN\\AUX outputs','Adaptive air suspension','Keyless ignition','Differential lock',
    'On-board computer','Fast \\ slow speeds','Light sensor','Electric mirrors','Electric windows',
    'Electric suspension adjustment','Electric seat adjustment','Electric power steering','Air conditioning',
    'Climatronic','Multifunction steering wheel','Navigation','Steering wheel heating','Stove',
    'Windshield heating','Seat heating','Steering wheel adjustment','Rain sensor','Power steering',
    'Headlight washer system','Cruise control system (autopilot)','Stereo system','Heat pump','Refrigerator compartment'
  ],
  Exterior: [
    '2(3) Doors','4(5) Doors','LED headlights','Xenon headlights','Alloy wheels','Metallic',
    'Panoramic sunroof','Roof rails','Spoilers','Towbar','Halogen headlights','Shibedah'
  ],
  Interior: [
    'Suede interior','Right-hand drive','Leather salon'
  ],
  Protection: [
    'OFFROAD package','Alarm','Armored','Casco','Winch','Central locking'
  ],
  Specialized: [
    'TAXI','For people with disabilities','Hearse','Ambulance','Educational','Refrigerated','Homologation N1'
  ],
  Others: [
    '4x4','7 seats','Buy back','Barter','Gas system','Long base','Seized\\Sold','Crashed','Short base',
    'Leasing','Methane system','In parts','Fully serviced','New import','With registration','Service book','Tuning'
  ],
}

function onlyDigitsNoLeadingZero(value) {
  if (value === '' || value === null || value === undefined) return true
  return /^[1-9]\d*$/.test(String(value))
}

export default function CreateListing() {
  const navigate = useNavigate()
  const { isAuthed } = useAuth()
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  // catalogs
  const [categories, setCategories] = useState([])
  const [brands, setBrands] = useState([])
  const [models, setModels] = useState([])
  const [fuelTypes, setFuelTypes] = useState([])
  const [transmissions, setTransmissions] = useState([])
  const [bodyTypes, setBodyTypes] = useState([])
  const [driveTypes, setDriveTypes] = useState([])
  const [regions, setRegions] = useState([])
  const [cities, setCities] = useState([])

  // form
  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '',
    year: '',
    mileage: '',
    category: '',
    brand: '',
    model: '',
    fuel_type: '',
    transmission: '',
    body_type: '',
    drive_type: '',
    engine_cc: '',
    power_hp: '',
    color: '',
    euro_standard: '',
    vin: '',
    video_url: '',
    region: '',
    city: '',
    address: '',
    latitude: '',
    longitude: '',
  })
  const [images, setImages] = useState([])

  // extras state: map group -> Set of strings
  const [extras, setExtras] = useState(() => {
    const obj = {}
    Object.keys(GROUPS).forEach(k => { obj[k] = new Set() })
    return obj
  })

  // Load catalogs
  useEffect(() => {
    let alive = true
    const load = async () => {
      try {
        setLoading(true)
        const [
          catRes, brandRes, fuelRes, transRes, bodyRes, driveRes, regionRes
        ] = await Promise.all([
          api.get(endpoints.categories),
          api.get(endpoints.brands),
          api.get(endpoints.fueltypes),
          api.get(endpoints.transmissions),
          api.get(endpoints.bodytypes),
          api.get(endpoints.drivetypes),
          api.get(endpoints.regions),
        ])
        if (!alive) return
        setCategories(toArray(catRes))
        setBrands(toArray(brandRes))
        setFuelTypes(toArray(fuelRes))
        setTransmissions(toArray(transRes))
        setBodyTypes(toArray(bodyRes))
        setDriveTypes(toArray(driveRes))
        setRegions(toArray(regionRes))
      } catch (e) {
        console.error(e)
        setError('Failed to load form catalogs. Check API server.')
      } finally {
        setLoading(false)
      }
    }
    load()
    return () => { alive = false }
  }, [])

  // brand → models
  useEffect(() => {
    const brandId = form.brand
    if (!brandId) {
      setModels([])
      setForm(prev => ({ ...prev, model: '' }))
      return
    }
    let alive = true
    api.get(endpoints.models, { params: { brand: brandId } })
      .then(res => { if (alive) setModels(toArray(res)) })
      .catch(err => console.error(err))
    return () => { alive = false }
  }, [form.brand])

  // region → cities
  useEffect(() => {
    const regionId = form.region
    if (!regionId) {
      setCities([])
      setForm(prev => ({ ...prev, city: '' }))
      return
    }
    let alive = true
    api.get(endpoints.cities, { params: { region: regionId } })
      .then(res => { if (alive) setCities(toArray(res)) })
      .catch(err => console.error(err))
    return () => { alive = false }
  }, [form.region])

  const onChange = (name, value) => setForm(prev => ({ ...prev, [name]: value }))
  const onChangeNumber = (name) => (e) => {
    const raw = e.target.value.trim()
    if (raw === '') return onChange(name, '')
    if (onlyDigitsNoLeadingZero(raw)) onChange(name, raw)
  }
  const onSelect = (name) => (e) => onChange(name, e.target.value)
  const onVideoURLChange = (e) => onChange('video_url', e.target.value.trim())

  // helpers to locate selected region/city objects
  const regionsArr = Array.isArray(regions) ? regions : []
  const citiesArr = Array.isArray(cities) ? cities : []
  const selectedRegion = regionsArr.find(r => String(r.id) === String(form.region)) || null
  const selectedCity = citiesArr.find(c => String(c.id) === String(form.city)) || null

  // center map on selected city
  const mapCenter = useMemo(() => {
    const lat = selectedCity?.lat ?? selectedCity?.latitude
    const lng = selectedCity?.lng ?? selectedCity?.longitude
    if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat: Number(lat), lng: Number(lng) }
    if (typeof lat === 'string' && typeof lng === 'string') return { lat: parseFloat(lat), lng: parseFloat(lng) }
    return null
  }, [selectedCity])

  // value for MapPicker
  const mapValue = useMemo(() => ({
    address: form.address,
    latitude: form.latitude,
    longitude: form.longitude,
  }), [form.address, form.latitude, form.longitude])

  const onPickAddress = ({ address, latitude, longitude }) => {
    setForm(prev => ({ ...prev, address, latitude, longitude }))
  }
  const onAutoSelect = ({ address, latitude, longitude }) => {
    setForm(prev => ({ ...prev, address, latitude, longitude }))
  }

  const onFiles = (e) => {
    const files = Array.from(e.target.files || [])
    const imgs = files.filter(f => f.type.startsWith('image/')).slice(0, 15)
    setImages(imgs)
  }

  const toggleExtra = (group, label) => {
    setExtras(prev => {
      const copy = { ...prev }
      const set = new Set(copy[group])
      if (set.has(label)) set.delete(label); else set.add(label)
      copy[group] = set
      return copy
    })
  }

  const flattenExtras = () => {
    const list = []
    for (const [group, set] of Object.entries(extras)) {
      for (const label of set) list.push(`${group}: ${label}`)
    }
    return list
  }

  const canSubmit = useMemo(() => {
    const needed = [
      'title','price','year','mileage','category','brand','model',
      'fuel_type','transmission','body_type','drive_type',
      'engine_cc','power_hp','color','euro_standard',
      'region','city','address','latitude','longitude'
    ]
    return needed.every(k => !!form[k])
  }, [form])

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    if (!isAuthed) return setError('You must be logged in to post a listing.')
    if (!canSubmit) return setError('Please fill in all required fields.')
    if (form.video_url && !YT_VIMEO_RE.test(form.video_url)) {
      return setError('Video URL must be a valid YouTube or Vimeo link.')
    }

    const extrasList = flattenExtras()
    const basePayload = {
      title: form.title,
      description: form.description,
      price: Number(form.price),
      year: Number(form.year),
      mileage: Number(form.mileage),
      category: Number(form.category),
      brand: Number(form.brand),
      model: Number(form.model),
      city: Number(form.city),
      fuel_type: Number(form.fuel_type),
      transmission: Number(form.transmission),
      body_type: Number(form.body_type),
      drive_type: Number(form.drive_type),
      engine_cc: Number(form.engine_cc),
      power_hp: Number(form.power_hp),
      color: form.color,
      euro_standard: form.euro_standard,
      vin: form.vin || null,
      video_url: form.video_url || '',
      address: form.address,
      latitude: Number(form.latitude),
      longitude: Number(form.longitude),
    }

    // Try with `extras` if backend supports it; else fall back by appending to description
    const tryPayloads = []
    tryPayloads.push({ ...basePayload, extras: extrasList }) // optimistic
    if (extrasList.length) {
      const appended = `${basePayload.description || ''}\n\nExtras:\n- ${extrasList.join('\n- ')}`
      tryPayloads.push({ ...basePayload, description: appended }) // fallback (no extras field)
    } else {
      tryPayloads.push(basePayload)
    }

    try {
      setSubmitting(true)
      let created = null
      let lastErr = null
      for (const payload of tryPayloads) {
        try {
          const { data } = await api.post(`${endpoints.listings}/`, payload)
          created = data
          break
        } catch (er) {
          lastErr = er
          // if 400 and mentions unknown field 'extras', we try next payload
          const msg = er?.response?.data
          const raw = typeof msg === 'string' ? msg : JSON.stringify(msg || {})
          if (!raw.includes('extras') && tryPayloads.length === 1) throw er
        }
      }
      if (!created) throw lastErr || new Error('Failed to create listing.')

      // images
      if (images.length) {
        for (const file of images) {
          const formData = new FormData()
          formData.append('image', file)
          await api.post(`${endpoints.listings}/${created.id}/upload_image/`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          })
        }
      }
      navigate(`/my-listings`)
    } catch (err) {
      console.error(err)
      const msg = err?.response?.data?.detail || 'Failed to create listing. Please check your inputs.'
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const categoriesArr = Array.isArray(categories) ? categories : []
  const brandsArr = Array.isArray(brands) ? brands : []
  const modelsArr = Array.isArray(models) ? models : []
  const fuelArr = Array.isArray(fuelTypes) ? fuelTypes : []
  const transArr = Array.isArray(transmissions) ? transmissions : []
  const bodyArr = Array.isArray(bodyTypes) ? bodyTypes : []
  const driveArr = Array.isArray(driveTypes) ? driveTypes : []

  return (
    <Container className="py-8">
      <h2 className="mb-4 text-2xl font-semibold">Post a new listing</h2>

      <form onSubmit={submit} className="grid gap-6">
        <Card className="p-4">
          <h3 className="mb-3 text-lg font-semibold">Basic info</h3>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium">Title *</label>
              <Input value={form.title} onChange={(e)=>setForm(s=>({...s,title:e.target.value}))} placeholder="e.g., 2017 BMW 320d xDrive" />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Price (лв) *</label>
              <Input inputMode="numeric" value={form.price} onChange={onChangeNumber('price')} placeholder="e.g., 17900" />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Mileage (km) *</label>
              <Input inputMode="numeric" value={form.mileage} onChange={onChangeNumber('mileage')} placeholder="e.g., 145000" />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Production year *</label>
              <Input inputMode="numeric" value={form.year} onChange={onChangeNumber('year')} placeholder="e.g., 2017" />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Euro standard *</label>
              <Select value={form.euro_standard} onChange={onSelect('euro_standard')}>
                <option value="">Select</option>
                {EURO_OPTIONS.map(e => <option key={e} value={e}>{e}</option>)}
              </Select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Engine (cc) *</label>
              <Input inputMode="numeric" value={form.engine_cc} onChange={onChangeNumber('engine_cc')} placeholder="e.g., 1995" />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Power (HP) *</label>
              <Input inputMode="numeric" value={form.power_hp} onChange={onChangeNumber('power_hp')} placeholder="e.g., 190" />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium">Description</label>
              <textarea
                className="w-full rounded-lg border border-neutral-300 bg-white/80 px-3 py-2 text-sm shadow-sm dark:border-gray-700 dark:bg-gray-900/80"
                rows={4}
                value={form.description}
                onChange={(e)=>setForm(s=>({...s,description:e.target.value}))}
                placeholder="Describe the vehicle, condition, service history, etc."
              />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="mb-3 text-lg font-semibold">Classification</h3>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Category *</label>
              <Select value={form.category} onChange={onSelect('category')}>
                <option value="">Select</option>
                {categoriesArr.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}
              </Select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Brand *</label>
              <Select value={form.brand} onChange={onSelect('brand')}>
                <option value="">Select</option>
                {brandsArr.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}
              </Select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Model *</label>
              <Select value={form.model} onChange={onSelect('model')} disabled={!form.brand}>
                <option value="">Select</option>
                {modelsArr.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}
              </Select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Fuel type *</label>
              <Select value={form.fuel_type} onChange={onSelect('fuel_type')}>
                <option value="">Select</option>
                {fuelArr.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}
              </Select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Gearbox *</label>
              <Select value={form.transmission} onChange={onSelect('transmission')}>
                <option value="">Select</option>
                {transArr.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}
              </Select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Body type *</label>
              <Select value={form.body_type} onChange={onSelect('body_type')}>
                <option value="">Select</option>
                {bodyArr.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}
              </Select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Drive type *</label>
              <Select value={form.drive_type} onChange={onSelect('drive_type')}>
                <option value="">Select</option>
                {driveArr.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}
              </Select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Color *</label>
              <Select value={form.color} onChange={onSelect('color')}>
                <option value="">Select</option>
                {COLOR_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
              </Select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">VIN</label>
              <Input maxLength={17} value={form.vin} onChange={(e)=>onChange('vin', e.target.value.toUpperCase())} placeholder="17 chars (no I, O, Q)" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="mb-3 text-lg font-semibold">Location</h3>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Region *</label>
              <Select value={form.region} onChange={onSelect('region')}>
                <option value="">Select</option>
                {regionsArr.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </Select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">City *</label>
              <Select value={form.city} onChange={onSelect('city')} disabled={!form.region}>
                <option value="">Select</option>
                {citiesArr.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium">Address *</label>
              <AddressAutocomplete
                value={form.address}
                cityObj={selectedCity}
                regionObj={selectedRegion}
                onChangeText={(txt) => setForm(s => ({ ...s, address: txt }))}
                onSelect={onAutoSelect}
              />
            </div>

            <div className="md:col-span-2">
              <MapPicker
                value={mapValue}
                center={mapCenter}
                zoom={mapCenter ? 12 : undefined}
                focusOnChangeZoom={17}   // ← NEW
                onChange={onPickAddress}
              />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="mb-3 text-lg font-semibold">Extras & Features</h3>
          <div className="space-y-6">
            {Object.entries(GROUPS).map(([group, options]) => (
              <div key={group}>
                <div className="mb-2 text-sm font-semibold">{group}</div>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {options.map(opt => {
                    const checked = extras[group]?.has(opt)
                    return (
                      <label key={opt} className="inline-flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={!!checked}
                          onChange={() => toggleExtra(group, opt)}
                        />
                        <span className="text-sm">{opt}</span>
                      </label>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="mb-3 text-lg font-semibold">Photos & Video</h3>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Photos (up to 15)</label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={onFiles}
                className="block w-full text-sm file:mr-4 file:rounded-md file:border-0 file:bg-brand-600 file:px-3 file:py-2 file:font-medium file:text-white hover:file:bg-brand-700"
              />
              {images?.length > 0 && (
                <div className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
                  Selected: {images.length} file{images.length > 1 ? 's' : ''}
                </div>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Video URL (YouTube/Vimeo)</label>
              <Input value={form.video_url} onChange={onVideoURLChange} placeholder="https://youtu.be/..." />
            </div>
          </div>
        </Card>

        {error && (
          <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/60 dark:text-red-300">
            {String(error)}
          </div>
        )}

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={submitting || loading || !canSubmit}>
            {submitting ? 'Publishing…' : 'Publish listing'}
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate(-1)}>Cancel</Button>
        </div>
      </form>
    </Container>
  )
}
