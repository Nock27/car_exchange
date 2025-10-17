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

// Fetch all pages from a DRF endpoint
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

  // Error handling
  const [errors, setErrors] = useState({}) 
  const [touched, setTouched] = useState({})

  const markTouched = (k) => setTouched(t => ({ ...t, [k]: true }))

  const idOrNull   = (v) => (v === '' || v == null ? null : Number(v))
  const intOrNull  = (v) => (v === '' || v == null ? null : Number(v))
  const strOrEmpty = (v) => (v == null ? '' : String(v))

  const geoPayload = (form) => {
    const address = (form.address ?? '').trim();
    const hasLat = form.latitude !== '' && form.latitude != null;
    const hasLng = form.longitude !== '' && form.longitude != null;

    if (hasLat && hasLng) {
      const lat = Number(form.latitude);
      const lng = Number(form.longitude);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        return {
          address: address || null,
          latitude: Number(lat.toFixed(6)),
          longitude: Number(lng.toFixed(6)),
        };
      }
    }
    // if there are no valid coords, send only address, omit lat/lng entirely
    return { address: address || null };
  };

  // list the required fields in the project
  const REQUIRED = [
    'title',
    'price',
    'year',
    'category',
    'brand',
    'model',
    'city',
    'fuel_type',
    'transmission',
    'body_type',
    'drive_type',
    'engine_cc',
    'power_hp',
  ]

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

  //simple up/down reorder
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

  function validateCreateForm(f) {
    const e = {}
    const isEmpty = (v) => v == null || String(v).trim() === ''
    for (const k of REQUIRED) {
      if (isEmpty(f[k])) e[k] = 'This field is required.'
    }
    // numeric sanity
    if (f.price && !/^\d+(\.\d+)?$/.test(String(f.price))) e.price = 'Enter a valid number.'
    if (f.year && !/^\d+$/.test(String(f.year))) e.year = 'Enter a valid year.'
    if (f.engine_cc && Number(f.engine_cc) <= 0) e.engine_cc = 'Must be greater than 0.'
    if (f.power_hp && Number(f.power_hp) <= 0) e.power_hp = 'Must be greater than 0.'
    return e
  }

  function normalizeServerErrorsToFields(data) {
    const map = {}
    if (data && typeof data === 'object') {
      for (const [k, v] of Object.entries(data)) {
        if (Array.isArray(v)) map[k] = v.join(' ')
        else if (typeof v === 'string') map[k] = v
        else if (v && typeof v === 'object') {
          for (const [kk, vv] of Object.entries(v)) {
            map[`${k}.${kk}`] = Array.isArray(vv) ? vv.join(' ') : String(vv)
          }
        }
      }
    }
    return map
  }

  const hasError = (k) => !!errors[k] && (touched[k] || Object.keys(touched).length === 0)
  const reqMark = <span className="ml-1 text-red-500">*</span>

// cleanup blob urls on unmount
useEffect(() => {
  return () => { images.forEach((p) => URL.revokeObjectURL(p.url)); };
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





  //=======

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
    e.target.value = '';
  };

  const canSubmit = useMemo(() => (
    REQUIRED.every(k => !!form[k])
  ), [form])

  const validateForm = () => {
  const errors = []

  // Price > 0
  if (form.price && Number(form.price) <= 0) {
    errors.push("Price must be greater than 0.")
  }

  // Mileage ≥ 0
  if (form.mileage && Number(form.mileage) < 0) {
    errors.push("Mileage cannot be negative.")
  }

  // Year between 1930 and current year
  const year = Number(form.year)
  const currentYear = new Date().getFullYear()
  if (form.year && (year < 1930 || year > currentYear)) {
    errors.push(`Year must be between 1930 and ${currentYear}.`)
  }

  // Engine CC sanity check
  if (form.engine_cc && Number(form.engine_cc) < 100) {
    errors.push("Engine size (cc) must be at least 100.")
  }

  // Power HP sanity check
  if (form.power_hp && Number(form.power_hp) < 10) {
    errors.push("Power must be at least 10 hp.")
  }

  return errors
  }

  const submit = async (e) => {
    e.preventDefault()
    
    setError(null)
    const fieldErrors = validateCreateForm(form)
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors)
      // mark all errored fields as touched so messages show
      setTouched(t => ({ ...t, ...Object.fromEntries(Object.keys(fieldErrors).map(k => [k, true])) }))
      // scroll to the first invalid field
      const firstKey = Object.keys(fieldErrors)[0]
      const el = document.getElementById(firstKey)
      if (el?.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    setErrors({})


    if (!isAuthed) return setError('You must be logged in to post a listing.')
    if (!canSubmit) return setError('Please fill in all required fields.')
    if (form.video_url && !YT_VIMEO_RE.test(form.video_url)) {
      return setError('Video URL must be a valid YouTube or Vimeo link.')
    }

    try {
      setSubmitting(true)

      const payload = {
        title:        strOrEmpty(form.title).trim(),
        description:  strOrEmpty(form.description).trim(),
        price:        intOrNull(form.price),      // number
        year:         intOrNull(form.year),
        mileage:      intOrNull(form.mileage),
        category:     idOrNull(form.category),
        brand:        idOrNull(form.brand),
        model:        idOrNull(form.model),
        city:         idOrNull(form.city),
        fuel_type:    idOrNull(form.fuel_type),
        transmission: idOrNull(form.transmission),
        body_type:    idOrNull(form.body_type),
        drive_type:   idOrNull(form.drive_type),
        engine_cc:    intOrNull(form.engine_cc),
        power_hp:     intOrNull(form.power_hp),
        color:        idOrNull(form.color),
        euro_standard: strOrEmpty(form.euro_standard),
        vin:           form.vin ? String(form.vin).toUpperCase() : null,
        video_url:     strOrEmpty(form.video_url),
        ...geoPayload(form),
        features:      Array.from(selectedFeatureIds ?? []),
      }



      // 2) Create the listing
      const { data: created } = await api.post(`${endpoints.listings}/`, payload)

      //Upload images 
      if (images.length) {
        for (let i = 0; i < images.length; i++) {
          const fd = new FormData();
          fd.append('image', images[i].file);
          fd.append('order', String(i));

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
    const fieldMap = normalizeServerErrorsToFields(d)
    if (Object.keys(fieldMap).length) {
      setErrors(fieldMap)
      setTouched(t => ({ ...t, ...Object.fromEntries(Object.keys(fieldMap).map(k => [k, true])) }))
      const firstKey = Object.keys(fieldMap)[0]
      const el = document.getElementById(firstKey)
      if (el?.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    } else {
      setError(formatApiErrors(d) || 'Something went wrong')
    }

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

      {Object.keys(errors).length > 0 && (
        <div className="mb-4 rounded-md border border-red-300 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/60 dark:text-red-300">
          <div className="mb-2 font-semibold">Please fix the highlighted fields:</div>
          <ul className="list-disc pl-5 space-y-1">
            {Object.entries(errors).map(([k, msg]) => (
              <li key={k}>
                <span className="font-medium capitalize">{k.replace(/_/g, ' ')}</span>: {msg}
              </li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={submit} className="grid gap-6">
        <Card className="p-4">
          <h3 className="mb-3 text-lg font-semibold">Basic info</h3>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium">
                Title {REQUIRED.includes('title') && reqMark}
              </label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => { setForm(s => ({ ...s, title: e.target.value })); markTouched('title'); }}
                onBlur={() => markTouched('title')}
                placeholder="e.g., 2017 BMW 320d xDrive"
                className={hasError('title') ? 'border-red-500 ring-2 ring-red-300' : ''}
              />
              {hasError('title') && <p className="mt-1 text-xs text-red-600">{errors.title}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium" htmlFor="price">Price (eur) {reqMark}</label>
              <Input
                id="price"
                inputMode="numeric"
                value={form.price}
                onChange={(e) => { onChangeNumber('price')(e); markTouched('price'); }}
                onBlur={() => markTouched('price')}
                placeholder="e.g., 17900"
                className={hasError('price') ? 'border-red-500 ring-2 ring-red-300' : ''}
              />
              {hasError('price') && <p className="mt-1 text-xs text-red-600">{errors.price}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium" htmlFor="mileage">Mileage (km){REQUIRED.includes('mileage') ? reqMark : null}</label>
              <Input
                id="mileage"
                inputMode="numeric"
                value={form.mileage}
                onChange={(e) => { onChangeNumber('mileage')(e); markTouched('mileage'); }}
                onBlur={() => markTouched('mileage')}
                placeholder="e.g., 145000"
                className={hasError('mileage') ? 'border-red-500 ring-2 ring-red-300' : ''}
              />
              {hasError('mileage') && <p className="mt-1 text-xs text-red-600">{errors.mileage}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium" htmlFor="year">Production year {reqMark}</label>
              <Input
                id="year"
                inputMode="numeric"
                value={form.year}
                onChange={(e) => { onChangeNumber('year')(e); markTouched('year'); }}
                onBlur={() => markTouched('year')}
                placeholder="e.g., 2017"
                className={hasError('year') ? 'border-red-500 ring-2 ring-red-300' : ''}
              />
              {hasError('year') && <p className="mt-1 text-xs text-red-600">{errors.year}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Euro standard *</label>
              <Select value={form.euro_standard} onChange={onSelect('euro_standard')}>
                <option value="">Select</option>
                {EURO_OPTIONS.map(e => <option key={e} value={e}>{e}</option>)}
              </Select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium" htmlFor="engine_cc">
                Engine (cc) {REQUIRED.includes('engine_cc') && reqMark}
              </label>
              <Input
                id="engine_cc"
                inputMode="numeric"
                value={form.engine_cc}
                onChange={(e) => { onChangeNumber('engine_cc')(e); markTouched('engine_cc'); }}
                onBlur={() => markTouched('engine_cc')}
                placeholder="e.g., 1995"
                className={hasError('engine_cc') ? 'border-red-500 ring-2 ring-red-300' : ''}
              />
              {hasError('engine_cc') && <p className="mt-1 text-xs text-red-600">{errors.engine_cc}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium" htmlFor="power_hp">
                Power (HP) {REQUIRED.includes('power_hp') && reqMark}
              </label>
              <Input
                id="power_hp"
                inputMode="numeric"
                value={form.power_hp}
                onChange={(e) => { onChangeNumber('power_hp')(e); markTouched('power_hp'); }}
                onBlur={() => markTouched('power_hp')}
                placeholder="e.g., 190"
                className={hasError('power_hp') ? 'border-red-500 ring-2 ring-red-300' : ''}
              />
              {hasError('power_hp') && <p className="mt-1 text-xs text-red-600">{errors.power_hp}</p>}
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
              <label className="mb-1 block text-sm font-medium" htmlFor="category">Category {reqMark}</label>
              <Select
                id="category"
                value={form.category}
                onChange={(e) => { onSelect('category')(e); markTouched('category'); }}
                onBlur={() => markTouched('category')}
                className={hasError('category') ? 'border-red-500 ring-2 ring-red-300' : ''}>
                <option value="">Select</option>
                {categoriesArr.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}
              </Select>
              {hasError('category') && <p className="mt-1 text-xs text-red-600">{errors.category}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium" htmlFor="brand">Brand {reqMark}</label>
              <Select
                id="brand"
                value={form.brand}
                onChange={(e) => { onSelect('brand')(e); markTouched('brand'); }}
                onBlur={() => markTouched('brand')}
                className={hasError('brand') ? 'border-red-500 ring-2 ring-red-300' : ''}>
                <option value="">Select</option>
                {brandsArr.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}
              </Select>
              {hasError('brand') && <p className="mt-1 text-xs text-red-600">{errors.brand}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium" htmlFor="model">Model {reqMark}</label>
              <Select
                id="model"
                value={form.model}
                onChange={(e) => { onSelect('model')(e); markTouched('model'); }}
                onBlur={() => markTouched('model')}
                disabled={!form.brand}
                className={hasError('model') ? 'border-red-500 ring-2 ring-red-300' : ''}>
                <option value="">Select</option>
                {modelsArr.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}
              </Select>
              {hasError('model') && <p className="mt-1 text-xs text-red-600">{errors.model}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium" htmlFor="fuel_type">Fuel type {reqMark}</label>
              <Select
                id="fuel_type"
                value={form.fuel_type}
                onChange={(e) => { onSelect('fuel_type')(e); markTouched('fuel_type'); }}
                onBlur={() => markTouched('fuel_type')}
                className={hasError('fuel_type') ? 'border-red-500 ring-2 ring-red-300' : ''}>
                <option value="">Select</option>
                {fuelArr.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}
              </Select>
              {hasError('fuel_type') && <p className="mt-1 text-xs text-red-600">{errors.fuel_type}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium" htmlFor="transmission">Gearbox {reqMark}</label>
              <Select
                id="transmission"
                value={form.transmission}
                onChange={(e) => { onSelect('transmission')(e); markTouched('transmission'); }}
                onBlur={() => markTouched('transmission')}
                className={hasError('transmission') ? 'border-red-500 ring-2 ring-red-300' : ''}>
                <option value="">Select</option>
                {transArr.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}
              </Select>
              {hasError('transmission') && <p className="mt-1 text-xs text-red-600">{errors.transmission}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium" htmlFor="body_type">
                Body type {REQUIRED.includes('body_type') && reqMark}
              </label>
              <Select
                id="body_type"
                value={form.body_type}
                onChange={(e) => { onSelect('body_type')(e); markTouched('body_type'); }}
                onBlur={() => markTouched('body_type')}
                className={hasError('body_type') ? 'border-red-500 ring-2 ring-red-300' : ''}>
                <option value="">Select</option>
                {bodyArr.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}
              </Select>
              {hasError('body_type') && <p className="mt-1 text-xs text-red-600">{errors.body_type}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium" htmlFor="drive_type">
                Drive type {reqMark}
              </label>
              <Select
                id="drive_type"
                value={form.drive_type}
                onChange={(e) => { onSelect('drive_type')(e); markTouched('drive_type'); }}
                onBlur={() => markTouched('drive_type')}
                className={hasError('drive_type') ? 'border-red-500 ring-2 ring-red-300' : ''}>
                <option value="">Select</option>
                {driveArr.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}
              </Select>
              {hasError('drive_type') && <p className="mt-1 text-xs text-red-600">{errors.drive_type}</p>}
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
              <label className="mb-1 block text-sm font-medium" htmlFor="region">Region {reqMark}</label>
              <Select
                id="region"
                value={form.region}
                onChange={(e) => { onSelect('region')(e); markTouched('region'); }}
                onBlur={() => markTouched('region')}
                className={hasError('region') ? 'border-red-500 ring-2 ring-red-300' : ''}>
                <option value="">Select</option>
                {regionsArr.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </Select>
              {hasError('region') && <p className="mt-1 text-xs text-red-600">{errors.region}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium" htmlFor="city">City {reqMark}</label>
              <Select
                id="city"
                value={form.city}
                onChange={(e) => { onSelect('city')(e); markTouched('city'); }}
                onBlur={() => markTouched('city')}
                disabled={!form.region}
                className={hasError('city') ? 'border-red-500 ring-2 ring-red-300' : ''}>
                <option value="">Select</option>
                {citiesArr.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
              {hasError('city') && <p className="mt-1 text-xs text-red-600">{errors.city}</p>}
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
          <Button type="submit" disabled={submitting || loading}>
            {submitting ? 'Publishing…' : 'Publish listing'}
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate(-1)}>Cancel</Button>
        </div>
      </form>
    </Container>
  )
}
