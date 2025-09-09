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
const YT_VIMEO_RE = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be|vimeo\.com)\/.+/i

// Fetch all pages from a DRF endpoint (works with both paginated + non-paginated)
async function fetchAll(api, url, params = {}) {
  const out = [];
  let nextUrl = url;
  let nextParams = { page_size: 200, ...params };

  while (nextUrl) {
    const res = await api.get(nextUrl, { params: nextParams });
    const data = res?.data;
    const items = Array.isArray(data) ? data : (data?.results || []);
    out.push(...items);

    const next = data?.next || null;
    if (next) {
      const base = api?.defaults?.baseURL || '';
      nextUrl = next.startsWith(base) ? next.slice(base.length) : next;
      nextParams = {};
    } else {
      nextUrl = null;
    }
  }
  return out;
}


function onlyDigitsNoLeadingZero(value) {
  if (value === '' || value === null || value === undefined) return true
  return /^[1-9]\d*$/.test(String(value))
}

function formatApiErrors(data) {
  if (!data || typeof data === 'string') return data;
  if (data.detail) return data.detail;

  // Flatten { field: ["msg1", "msg2"], non_field_errors: [...] }
  const lines = [];
  for (const [field, messages] of Object.entries(data)) {
    if (Array.isArray(messages)) {
      messages.forEach(msg => {
        lines.push(`${field === 'non_field_errors' ? '' : `${field}: `}${msg}`);
      });
    } else if (typeof messages === 'string') {
      lines.push(`${field}: ${messages}`);
    }
  }
  return lines.join('\n');
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
  const [colors, setColors] = useState([]);

  //Features
  const [featuresByGroup, setFeaturesByGroup] = useState({});
  const [featureIdByKey, setFeatureIdByKey] = useState({});
  const [loadingFeatures, setLoadingFeatures] = useState(true);


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
  const [images, setImages] = useState([]); 

  const MAX_PHOTOS = 15;

  // stable signature to dedupe
  const sig = (f) => `${f.name}|${f.size}|${f.lastModified}`;

  function addFiles(newFiles) {
    setImages((prev) => {
      const existing = new Set(prev.map((p) => sig(p.file)));
      const toAdd = [];
      for (const f of newFiles) {
        if (!f.type?.startsWith?.('image/')) continue;
        const s = sig(f);
        if (existing.has(s)) continue; // skip duplicate
        toAdd.push({
          id: `${s}|${Math.random().toString(36).slice(2)}`,
          file: f,
          url: URL.createObjectURL(f),
        });
      }
      return [...prev, ...toAdd].slice(0, MAX_PHOTOS);
    });
  }

  function removeImage(id) {
    setImages((prev) => {
      const next = prev.filter((p) => p.id !== id);
      return next;
    });
  }

  // (optional) simple up/down reorder
  function moveImage(id, dir) {
    setImages((prev) => {
      const i = prev.findIndex((p) => p.id === id);
      if (i < 0) return prev;
      const j = dir === 'up' ? i - 1 : i + 1;
      if (j < 0 || j >= prev.length) return prev;
      const copy = [...prev];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });
  }

// cleanup blob urls on unmount
useEffect(() => {
  return () => { images.forEach((p) => URL.revokeObjectURL(p.url)); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

  const [selectedFeatureIds, setSelectedFeatureIds] = useState(new Set())
  const toggleFeature = (id) => {
    setSelectedFeatureIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Load catalogs
  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        setLoading(true);
        const [
          categoriesAll,
          brandsAll,
          fuelAll,
          transAll,
          bodyAll,
          driveAll,
          colorsAll,
          regionsAll,
        ] = await Promise.all([
          fetchAll(api, endpoints.categories),
          fetchAll(api, endpoints.brands),
          fetchAll(api, endpoints.fueltypes),
          fetchAll(api, endpoints.transmissions),
          fetchAll(api, endpoints.bodytypes),
          fetchAll(api, endpoints.drivetypes),
          fetchAll(api, endpoints.colors),
          fetchAll(api, endpoints.regions),
        ]);

        if (!alive) return;

        // Debug prints
        console.log('Loaded catalogs:', {
          categories: categoriesAll.length,
          brands: brandsAll.length,
          fueltypes: fuelAll.length,
          transmissions: transAll.length,
          bodytypes: bodyAll.length,
          drivetypes: driveAll.length,
          regions: regionsAll.length,
          colors: colorsAll.length,
        });

        setCategories(categoriesAll);
        setBrands(brandsAll);
        setFuelTypes(fuelAll);
        setTransmissions(transAll);
        setBodyTypes(bodyAll);
        setDriveTypes(driveAll);
        setColors(colorsAll);
        setRegions(regionsAll);
      } catch (e) {
        console.error('Failed to load form catalogs:', e);
        setError('Failed to load form catalogs. Check API server.');
      } finally {
        setLoading(false);
      }
    };
    load();
    return () => { alive = false; };
  }, []);




  // brand → models
  useEffect(() => {
    const brandId = form.brand
    if (!brandId) {
      setModels([])
      setForm(prev => ({ ...prev, model: '' }))
      return
    }

    let alive = true
    ;(async () => {
      try {
        const modelsAll = await fetchAll(api, endpoints.models, { brand: brandId })
        if (alive) setModels(modelsAll)
      } catch (err) {
        console.error(err)
      }
    })()

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
    ;(async () => {
      try {
        const citiesAll = await fetchAll(api, endpoints.cities, { region: regionId })
        if (alive) setCities(citiesAll)
      } catch (err) {
        console.error(err)
      }
    })()

  return () => { alive = false }
}, [form.region])


  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoadingFeatures(true);

        // Pull ALL features across pages
        const feats = await fetchAll(api, endpoints.features, { page_size: 200 });

        // Normalize group name from various possible shapes
        const byGroup = feats.reduce((acc, f) => {
          const gname =
            (f.group && typeof f.group === 'object' && (f.group.name || f.group.title || f.group.label)) ||
            f.group_name ||
            (typeof f.group === 'string' ? f.group : null) ||
            'Other';
          (acc[gname] ||= []).push({ id: f.id, name: f.name });
          return acc;
        }, {});

        // Sort items inside each group
        Object.keys(byGroup).forEach(g =>
          byGroup[g].sort((a, b) => a.name.localeCompare(b.name))
        );

        if (alive) {
          setFeaturesByGroup(byGroup);
          const idByKey = {};
          Object.entries(byGroup).forEach(([g, items]) => {
            items.forEach(({ id, name }) => { idByKey[`${g}|${name}`] = id; });
          });
          setFeatureIdByKey(idByKey);
        }

        console.log(
          'Features loaded (counts by group):',
          Object.fromEntries(Object.entries(byGroup).map(([g, arr]) => [g, arr.length]))
        );
      } catch (e) {
        console.error('Failed to load features:', e);
        if (alive) setFeaturesByGroup({});
      } finally {
        if (alive) setLoadingFeatures(false);
      }
    })();

    return () => { alive = false; };
  }, []);





  //======

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
    const list = Array.from(e.target.files || []);
    addFiles(list);       // append instead of overwrite
    e.target.value = '';  // let user pick the same files again later
  };

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

  try {
    setSubmitting(true)

    const payload = {
      title: (form.title || '').trim(),
      description: (form.description || '').trim(),
      price: String(form.price ?? ''),
      year: Number(form.year),
      mileage: Number(form.mileage ?? 0),
      category: Number(form.category),
      brand: Number(form.brand),
      model: Number(form.model),
      city: Number(form.city),
      fuel_type: Number(form.fuel_type),
      transmission: Number(form.transmission),
      body_type: Number(form.body_type),
      drive_type: Number(form.drive_type),
      engine_cc: Number(form.engine_cc ?? 0),
      power_hp: Number(form.power_hp ?? 0),
      color: form.color ? Number(form.color) : null,
      euro_standard: form.euro_standard || '',
      vin: form.vin || null,
      video_url: form.video_url || '',
      address: form.address || '',
      latitude: form.latitude != null ? Number(form.latitude).toFixed(6) : null,
      longitude: form.longitude != null ? Number(form.longitude).toFixed(6) : null,
      features: Array.from(selectedFeatureIds ?? []),
}



    // 2) Create the listing with ONE request (remove tryPayloads entirely)
    const { data: created } = await api.post(`${endpoints.listings}/`, payload)

    // 3) Upload images 
    if (images.length) {
      for (let i = 0; i < images.length; i++) {
        const fd = new FormData();
        fd.append('image', images[i].file);
        fd.append('order', String(i)); // optional

        await api.post(
          `${endpoints.listings}/${created.id}/upload_image/`,
          fd,
          { headers: { 'Content-Type': 'multipart/form-data' } }
        );
      }
}


    navigate(`/my-listings`)
  } catch (err) {
    console.error(err)
    const d = err?.response?.data;
    setError(formatApiErrors(d) || 'Something went wrong');
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
              <Select value={form.color} onChange={onSelect('color')} disabled={!colors.length}>
                <option value="">Select</option>
                {colors.map(c => (
                  <option key={c.id} value={String(c.id)}>{c.name}</option>
                ))}
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
            {loadingFeatures && (
              <div className="text-sm text-muted-foreground">Loading features…</div>
            )}
            {!loadingFeatures && Object.keys(featuresByGroup).length === 0 && (
              <div className="text-sm text-muted-foreground">No features available.</div>
            )}
            {Object.entries(featuresByGroup).map(([group, items]) => (
              <div key={group}>
                <div className="mb-2 text-sm font-semibold">{group}</div>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map(item => {
                    const checked = selectedFeatureIds.has(item.id)
                    return (
                      <label key={item.id} className="inline-flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleFeature(item.id)}
                        />
                        <span className="text-sm">{item.name}</span>
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
              <label className="mb-1 block text-sm font-medium">
                Photos (up to {MAX_PHOTOS})
              </label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={onFiles}
                className="block w-full text-sm file:mr-4 file:rounded-md file:border-0 file:bg-brand-600 file:px-3 file:py-2 file:font-medium file:text-white hover:file:bg-brand-700"
              />

              {images.length > 0 && (
                <>
                  <div className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
                    Selected: {images.length} / {MAX_PHOTOS}
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                    {images.map((p, idx) => (
                      <div
                        key={p.id}
                        className="relative overflow-hidden rounded-lg border bg-white/60 p-1 dark:border-gray-700 dark:bg-gray-900/60"
                      >
                        <img
                          src={p.url}
                          alt={`photo ${idx + 1}`}
                          className="h-28 w-full rounded-md object-cover"
                        />
                        <div className="mt-1 flex items-center justify-between gap-1">
                          <button
                            type="button"
                            onClick={() => removeImage(p.id)}
                            className="rounded-md border px-2 py-1 text-xs hover:bg-red-50 dark:hover:bg-red-900/30"
                            title="Remove"
                          >
                            Remove
                          </button>

                          {/* optional reorder buttons; remove if you don't want them */}
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => moveImage(p.id, 'up')}
                              disabled={idx === 0}
                              className="rounded-md border px-2 py-1 text-xs disabled:opacity-40"
                              title="Move up"
                            >
                              ↑
                            </button>
                            <button
                              type="button"
                              onClick={() => moveImage(p.id, 'down')}
                              disabled={idx === images.length - 1}
                              className="rounded-md border px-2 py-1 text-xs disabled:opacity-40"
                              title="Move down"
                            >
                              ↓
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
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
