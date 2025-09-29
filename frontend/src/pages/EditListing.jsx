import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Container from '@/components/layout/Container'
import SectionHeader from '@/components/ui/SectionHeader'
import Card from '@/components/ui/Card'
import Select from '@/components/ui/Select'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { PhotosEditor } from '@/components/listings/PhotosEditor'
import { api, endpoints } from '@/lib/api'

export default function EditListing() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errorLines, setErrorLines] = useState([])

  // catalogs
  const [categories, setCategories] = useState([])
  const [brands, setBrands] = useState([])
  const [models, setModels] = useState([])
  const [fuelTypes, setFuelTypes] = useState([])
  const [gearboxes, setGearboxes] = useState([])
  const [bodyTypes, setBodyTypes] = useState([])
  const [driveTypes, setDriveTypes] = useState([])
  const [regions, setRegions] = useState([])
  const [cities, setCities] = useState([])
  const [colors, setColors] = useState([])
  const [images, setImages] = useState([])
  const [features, setFeatures] = useState([])
  const [selectedFeatures, setSelectedFeatures] = useState([])

  // fallback labels for selected region/city (if options not loaded yet)
  const [prefillNames, setPrefillNames] = useState({ region: '', city: '' })

  // form state (Euro removed)
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    brand: '',
    model: '',
    price: '',
    year: '',
    mileage: '',
    fuel_type: '',
    transmission: '',
    body_type: '',
    drive_type: '',
    engine_cc: '',
    power_hp: '',
    color: '',
    region: '',
    city: '',
    video_url: '',
  })
  const handle = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  /* -------------------- helpers -------------------- */
  const labelTextCls = 'text-xs font-medium text-neutral-700 dark:text-neutral-300'
  const fieldStackCls = 'grid gap-1'

  // Normalize possible API array shapes
  const parseArray = (data) => {
    if (Array.isArray(data)) return data
    if (Array.isArray(data?.results)) return data.results
    if (Array.isArray(data?.data)) return data.data
    return []
  }

  // Extract an ID from a value that could be number, string, or nested object
  const getId = (x) => {
    if (x == null || x === '') return ''
    if (typeof x === 'number') return String(x)
    if (typeof x === 'string') return /^\d+$/.test(x) ? x : ''
    if (typeof x === 'object') {
      if (x.id != null) return String(x.id)
      if (x.pk != null) return String(x.pk)
      if (x.value != null) return String(x.value)
      if (x.slug != null && /^\d+$/.test(String(x.slug))) return String(x.slug)
    }
    return ''
  }

  async function fetchCatalogSimple(url) {
    const { data } = await api.get(url)
    return parseArray(data)
  }
  async function fetchByQuery(url, params) {
    const { data } = await api.get(url, { params })
    return parseArray(data)
  }

  async function fetchAllPages(url, params = {}) {
    const out = []
    let nextUrl = url
    let nextParams = { ...params }
    while (nextUrl) {
      const { data } = await api.get(nextUrl, { params: nextParams })
      const chunk = Array.isArray(data) ? data : (data?.results || [])
      out.push(...chunk)
      const base = api?.defaults?.baseURL || ''
      const next = data?.next || null
      if (next) {
        nextUrl = next.startsWith(base) ? next.slice(base.length) : next
        nextParams = {} // DRF next already encodes paging
      } else {
        nextUrl = null
      }
    }
    return out
  }

  const labelOf = (x) => x?.name ?? x?.title ?? x?.label ?? `#${x?.id}`

  const toIntString = (val) => {
    if (val === null || val === undefined || val === '') return ''
    const n = Number(val)
    if (Number.isFinite(n)) return String(Math.round(n))
    const m = String(val ?? '').match(/\d+/)
    return m ? m[0] : ''
  }
  const idOrNull = (v) => (v === '' || v == null ? null : parseInt(v, 10))
  const intOrNull = (v) => (v === '' || v == null ? null : parseInt(v, 10))
  const toggleFeature = (id) => {
    setSelectedFeatures(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const years = useMemo(
    () => Array.from({ length: new Date().getFullYear() - 1929 }, (_, i) => 1930 + i).reverse(),
    []
  )

  const formatServerErrors = (payload) => {
    if (!payload || typeof payload !== 'object') return ['Saving failed. Please try again.']
    const lines = []
    const human = (k) => k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    const pushField = (k, v) => {
      if (Array.isArray(v)) lines.push(`${human(k)}: ${v.join('; ')}`)
      else if (typeof v === 'string') lines.push(`${human(k)}: ${v}`)
      else if (v && typeof v === 'object') {
        for (const [kk, vv] of Object.entries(v)) pushField(`${k}.${kk}`, vv)
      }
    }
    for (const [k, v] of Object.entries(payload)) pushField(k, v)
    return lines.length ? lines : ['Saving failed. Please try again.']
  }

  /* -------------------- preload static catalogs -------------------- */
  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const [cats, brs, fuels, gears, bodies, drives, cols, regs] = await Promise.all([
          fetchCatalogSimple(endpoints.categories),
          fetchCatalogSimple(endpoints.brands),
          fetchCatalogSimple(endpoints.fueltypes),
          fetchCatalogSimple(endpoints.transmissions),
          fetchCatalogSimple(endpoints.bodytypes),
          fetchCatalogSimple(endpoints.drivetypes),
          fetchCatalogSimple(endpoints.colors),
          fetchCatalogSimple(endpoints.regions),
        ])
        if (!alive) return
        setCategories(cats)
        setBrands(brs)
        setFuelTypes(fuels)
        setGearboxes(gears)
        setBodyTypes(bodies)
        setDriveTypes(drives)
        setColors(cols)
        setRegions(regs)
      } catch (e) {
        console.error('Catalog preload failed:', e)
      }
    })()
    return () => { alive = false }
  }, [])

  /* -------------------- load listing + warm deps -------------------- */
  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const detailUrl = `${endpoints.listings}/${id}/`
        const { data } = await api.get(detailUrl)
        if (!alive) return

        // Tolerant ID extraction
        let regionId = getId(data.region ?? data.region_id)
        const cityId  = getId(data.city ?? data.city_id)
        const brandId = getId(data.brand ?? data.brand_id)
        const modelId = getId(data.model ?? data.model_id)

        // If region is missing but city is present, derive region from city detail
        if (!regionId && cityId) {
          try {
            const { data: cityDetail } = await api.get(`${endpoints.cities}${cityId}/`)
            regionId = getId(cityDetail.region ?? cityDetail.region_id)
          } catch (e) {
            console.warn('Could not backfill region from city:', e)
          }
        }

        setForm({
          title: data.title || '',
          description: data.description || '',
          category: getId(data.category ?? data.category_id),
          brand: brandId,
          model: modelId,
          price: toIntString(data.price),
          year: toIntString(data.year),
          mileage: toIntString(data.mileage),
          fuel_type: getId(data.fuel_type ?? data.fuel_type_id),
          transmission: getId(data.transmission ?? data.transmission_id),
          body_type: getId(data.body_type ?? data.body_type_id),
          drive_type: getId(data.drive_type ?? data.drive_type_id),
          engine_cc: toIntString(data.engine_cc),
          power_hp: toIntString(data.power_hp),
          color: getId(data.color ?? data.color_id),
          region: regionId,
          city: cityId,
          video_url: data.video_url || '',
        })

        // Fallback names for immediate display
        setPrefillNames({
          region: data.region_name || data.region?.name || '',
          city:   data.city_name || data.city?.name || '',
        })

        setImages(Array.isArray(data.images) ? data.images : [])

        if (Array.isArray(data.features)) {
          setSelectedFeatures(data.features.map(n => Number(n)).filter(Number.isFinite))
        } else if (Array.isArray(data.features_detail)) {
          setSelectedFeatures(
            data.features_detail
              .map(f => Number(f?.id))
              .filter(Number.isFinite)
          )
        } else {
          setSelectedFeatures([])
}

        // Warm dependent lists so the selected IDs appear in options
        if (brandId) {
          try {
            const ms = await fetchByQuery(endpoints.models, { brand: brandId, page_size: 500 })
            if (!alive) return
            setModels(ms)
          } catch (e) { console.warn('Warm models failed:', e) }
        }

        if (regionId) {
          try {
            const cs = await fetchByQuery(endpoints.cities, { region: regionId, page_size: 500 })
            if (!alive) return
            setCities(cs)
            if (cityId && !cs.some(c => String(c.id) === String(cityId))) {
              setForm(f => ({ ...f, city: '' }))
            }
          } catch (e) { console.warn('Warm cities failed:', e) }
        }
      } catch (e) {
        console.error('Load listing failed:', e)
        setErrorLines(['Failed to load the listing.'])
      } finally {
        setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [id])

  /* -------------------- brand → models -------------------- */
  useEffect(() => {
    const brandId = form.brand
    if (!brandId) { setModels([]); handle('model', ''); return }
    let alive = true
    ;(async () => {
      try {
        const ms = await fetchByQuery(endpoints.models, { brand: brandId, page_size: 500 })
        if (!alive) return
        setModels(ms)
        if (form.model && !ms.some(m => String(m.id) === String(form.model))) {
          handle('model', '')
        }
      } catch (e) {
        console.error('Load models failed:', e)
      }
    })()
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.brand])

  /* -------------------- region → cities -------------------- */
  useEffect(() => {
    const regionId = form.region
    if (!regionId) { setCities([]); handle('city', ''); return }
    let alive = true
    ;(async () => {
      try {
        const cs = await fetchByQuery(endpoints.cities, { region: regionId, page_size: 500 })
        if (!alive) return
        setCities(cs)
        if (form.city && !cs.some(c => String(c.id) === String(form.city))) {
          handle('city', '')
        }
      } catch (e) {
        console.error('Load cities failed:', e)
      }
    })()
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.region])

  // load all available features (extras)
  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const rows = await fetchAllPages(endpoints.features, { page_size: 200 })
        if (alive) setFeatures(rows)
      } catch (e) {
        console.error('Failed to load features', e)
        if (alive) setFeatures([])
      }
    })()
    return () => { alive = false }
  }, [])

  /* -------------------- validation -------------------- */
  const validateForm = (f) => {
    const errs = []
    const mustBePosInt = [
      ['price', 'Price'],
      ['year', 'Year'],
      ['mileage', 'Mileage'],
      ['engine_cc', 'Engine CC'],
      ['power_hp', 'Power (hp)'],
    ]
    for (const [key, label] of mustBePosInt) {
      const v = String(f[key] ?? '').trim()
      if (v === '') continue
      if (!/^\d+$/.test(v)) errs.push(`${label} must be a whole number`)
    }
    if (f.video_url && !/^https?:\/\/(www\.)?(youtube\.com|youtu\.be|vimeo\.com)\//i.test(f.video_url)) {
      errs.push('Video URL must be a valid YouTube or Vimeo link.')
    }
    return errs
  }

  /* -------------------- submit -------------------- */
  const submit = async (e) => {
    e.preventDefault()
    setErrorLines([])

    const errs = validateForm(form)
    if (errs.length) {
      setErrorLines(errs)
      return
    }

    setSaving(true)
    try {
      const url = `${endpoints.listings}/${id}/`
      const payload = {
        title:        form.title || null,
        description:  form.description || null,
        category:     idOrNull(form.category),
        brand:        idOrNull(form.brand),
        model:        idOrNull(form.model),
        price:        intOrNull(form.price),
        year:         intOrNull(form.year),
        mileage:      intOrNull(form.mileage),
        fuel_type:    idOrNull(form.fuel_type),
        transmission: idOrNull(form.transmission),
        body_type:    idOrNull(form.body_type),
        drive_type:   idOrNull(form.drive_type),
        engine_cc:    intOrNull(form.engine_cc),
        power_hp:     intOrNull(form.power_hp),
        color:        idOrNull(form.color),
        region:       idOrNull(form.region),
        city:         idOrNull(form.city),
        features:     selectedFeatures,
      }
      const video = String(form.video_url || '').trim()
      if (video !== '') payload.video_url = video // omit entirely if empty

      await api.patch(url, payload)
      navigate('/my-listings')
    } catch (e) {
      console.error('Save failed:', e)
      const server = e?.response?.data
      setErrorLines(formatServerErrors(server))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="py-6">
        <Container>
          <SectionHeader title="Edit listing" subtitle="Loading…" />
        </Container>
      </div>
    )
  }

  return (
    <div className="py-6">
      <Container>
        <SectionHeader
          title="Edit listing"
          subtitle="Update your vehicle details and save changes."
          actions={<Button variant="secondary" onClick={() => navigate(-1)}>Back</Button>}
        />

        {errorLines.length > 0 && (
          <div className="mb-4 rounded-md border border-red-300 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/60 dark:text-red-300">
            <ul className="list-disc pl-5 space-y-1">
              {errorLines.map((l, i) => <li key={i}>{l}</li>)}
            </ul>
          </div>
        )}

        <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <Card>
            <h3 className="mb-3 text-sm font-semibold text-neutral-900 dark:text-white">Basics</h3>
            <div className="grid gap-3">
              <div className={fieldStackCls}>
                <label htmlFor="title" className={labelTextCls}>Title</label>
                <Input id="title" placeholder="Title" value={form.title} onChange={e => handle('title', e.target.value)} />
              </div>

              <div className={fieldStackCls}>
                <label htmlFor="category" className={labelTextCls}>Category</label>
                <Select id="category" value={form.category} onChange={e => handle('category', e.target.value)}>
                  <option value="">Select category…</option>
                  {categories.map(c => <option key={c.id} value={String(c.id)}>{labelOf(c)}</option>)}
                </Select>
              </div>

              <div className={fieldStackCls}>
                <label htmlFor="brand" className={labelTextCls}>Brand</label>
                <Select id="brand" value={form.brand} onChange={e => handle('brand', e.target.value)}>
                  <option value="">Select brand…</option>
                  {brands.map(b => <option key={b.id} value={String(b.id)}>{labelOf(b)}</option>)}
                </Select>
              </div>

              <div className={fieldStackCls}>
                <label htmlFor="model" className={labelTextCls}>Model</label>
                <Select id="model" value={form.model} onChange={e => handle('model', e.target.value)} disabled={!form.brand}>
                  <option value="">Select model…</option>
                  {models.map(m => <option key={m.id} value={String(m.id)}>{labelOf(m)}</option>)}
                </Select>
              </div>

              <div className={fieldStackCls}>
                <label htmlFor="price" className={labelTextCls}>Price</label>
                <Input id="price" type="number" step="1" min="0" placeholder="Price" value={form.price} onChange={e => handle('price', e.target.value)} />
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="mb-3 text-sm font-semibold text-neutral-900 dark:text-white">Production & specs</h3>
            <div className="grid gap-3 md:grid-cols-2">
              <div className={fieldStackCls}>
                <label htmlFor="year" className={labelTextCls}>Year</label>
                <Select id="year" value={form.year} onChange={e => handle('year', e.target.value)}>
                  <option value="">Select year…</option>
                  {years.map(y => <option key={y} value={String(y)}>{y}</option>)}
                </Select>
              </div>

              <div className={fieldStackCls}>
                <label htmlFor="mileage" className={labelTextCls}>Mileage (km)</label>
                <Input id="mileage" type="number" step="1" min="0" placeholder="Mileage (km)" value={form.mileage} onChange={e => handle('mileage', e.target.value)} />
              </div>

              <div className={fieldStackCls}>
                <label htmlFor="fuel_type" className={labelTextCls}>Fuel type</label>
                <Select id="fuel_type" value={form.fuel_type} onChange={e => handle('fuel_type', e.target.value)}>
                  <option value="">Select fuel…</option>
                  {fuelTypes.map(ft => <option key={ft.id} value={String(ft.id)}>{labelOf(ft)}</option>)}
                </Select>
              </div>

              <div className={fieldStackCls}>
                <label htmlFor="transmission" className={labelTextCls}>Gearbox</label>
                <Select id="transmission" value={form.transmission} onChange={e => handle('transmission', e.target.value)}>
                  <option value="">Select gearbox…</option>
                  {gearboxes.map(g => <option key={g.id} value={String(g.id)}>{labelOf(g)}</option>)}
                </Select>
              </div>

              <div className={fieldStackCls}>
                <label htmlFor="body_type" className={labelTextCls}>Body type</label>
                <Select id="body_type" value={form.body_type} onChange={e => handle('body_type', e.target.value)}>
                  <option value="">Select body…</option>
                  {bodyTypes.map(b => <option key={b.id} value={String(b.id)}>{labelOf(b)}</option>)}
                </Select>
              </div>

              <div className={fieldStackCls}>
                <label htmlFor="drive_type" className={labelTextCls}>Drive type</label>
                <Select id="drive_type" value={form.drive_type} onChange={e => handle('drive_type', e.target.value)}>
                  <option value="">Select drive…</option>
                  {driveTypes.map(d => <option key={d.id} value={String(d.id)}>{labelOf(d)}</option>)}
                </Select>
              </div>

              <div className={fieldStackCls}>
                <label htmlFor="engine_cc" className={labelTextCls}>Engine CC</label>
                <Input id="engine_cc" type="number" step="1" min="0" placeholder="Engine CC" value={form.engine_cc} onChange={e => handle('engine_cc', e.target.value)} />
              </div>

              <div className={fieldStackCls}>
                <label htmlFor="power_hp" className={labelTextCls}>Power (hp)</label>
                <Input id="power_hp" type="number" step="1" min="0" placeholder="Power (hp)" value={form.power_hp} onChange={e => handle('power_hp', e.target.value)} />
              </div>

              <div className={fieldStackCls}>
                <label htmlFor="color" className={labelTextCls}>Color</label>
                <Select id="color" value={form.color} onChange={e => handle('color', e.target.value)}>
                  <option value="">Select color…</option>
                  {colors.map(c => <option key={c.id} value={String(c.id)}>{labelOf(c)}</option>)}
                </Select>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="mb-3 text-sm font-semibold text-neutral-900 dark:text-white">Location & media</h3>
            <div className="grid gap-3 md:grid-cols-2">
              <div className={fieldStackCls}>
                <label htmlFor="region" className={labelTextCls}>Region</label>
                <Select id="region" value={form.region} onChange={e => handle('region', e.target.value)}>
                  <option value="">Select region…</option>
                  {/* fallback option so the saved value shows even if regions not loaded yet */}
                  {form.region && !regions.some(r => String(r.id) === String(form.region)) && (
                    <option value={form.region}>
                      {prefillNames.region || `Selected region (#${form.region})`}
                    </option>
                  )}
                  {regions.map(r => <option key={r.id} value={String(r.id)}>{labelOf(r)}</option>)}
                </Select>
              </div>

              <div className={fieldStackCls}>
                <label htmlFor="city" className={labelTextCls}>City</label>
                <Select id="city" value={form.city} onChange={e => handle('city', e.target.value)} disabled={!form.region}>
                  <option value="">{form.region ? 'Select city…' : 'Choose region first'}</option>
                  {/* fallback option so the saved value shows even if cities not loaded yet */}
                  {form.city && !cities.some(c => String(c.id) === String(form.city)) && (
                    <option value={form.city}>
                      {prefillNames.city || `Selected city (#${form.city})`}
                    </option>
                  )}
                  {cities.map(c => <option key={c.id} value={String(c.id)}>{labelOf(c)}</option>)}
                </Select>
              </div>

              <div className={fieldStackCls + ' md:col-span-2'}>
                <label htmlFor="video_url" className={labelTextCls}>YouTube/Vimeo URL (optional)</label>
                <Input id="video_url" placeholder="https://youtube.com/… or https://vimeo.com/…" value={form.video_url} onChange={e => handle('video_url', e.target.value)} />
              </div>
            </div>
          </Card>

          <PhotosEditor
            listingId={id}
            initialImages={images}
          />
          
          <Card className="lg:col-span-2">
            <h3 className="mb-3 text-sm font-semibold text-neutral-900 dark:text-white">Extras</h3>

            {features.length === 0 ? (
              <div className="text-sm text-neutral-500">No extras available.</div>
            ) : (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
                {features.map(f => {
                  const id = Number(f.id)
                  const checked = selectedFeatures.includes(id)
                  return (
                    <label key={id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        className="h-4 w-4"
                        checked={checked}
                        onChange={() => toggleFeature(id)}
                      />
                      <span>{f.name || f.label}</span>
                    </label>
                  )
                })}
              </div>
            )}
          </Card>

          <Card className="lg:col-span-2">
            <h3 className="mb-3 text-sm font-semibold text-neutral-900 dark:text-white">Description</h3>
            <div className={fieldStackCls}>
              <label htmlFor="description" className={labelTextCls}>Description</label>
              <textarea
                id="description"
                className="min-h-[140px] w-full rounded-lg border border-neutral-300 bg-white/80 p-3 text-sm text-neutral-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-300 dark:border-gray-700 dark:bg-gray-900/80 dark:text-neutral-100 dark:focus:ring-brand-500"
                value={form.description}
                onChange={e => handle('description', e.target.value)}
                placeholder="Add details about condition, service history, extras…"
              />
            </div>
          </Card>

          <div className="lg:col-span-2 flex justify-end gap-2">
            <Button variant="secondary" type="button" onClick={() => navigate(-1)} disabled={saving}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</Button>
          </div>
        </form>
      </Container>
    </div>
  )
}
