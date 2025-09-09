import { useState, useMemo, useEffect  } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, endpoints, toArray } from '@/lib/api'
import Container from '@/components/layout/Container'
import SectionHeader from '@/components/ui/SectionHeader'
import Card from '@/components/ui/Card'
import Select from '@/components/ui/Select'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

/**
 * Advanced Search (UI only)
 * - No results here. On Apply -> navigate('/search?…')
 * - Includes large Extras groups as checkboxes
 * - Mutually exclusive condition (new/used/damaged) + independent 'parts'
 */

export default function AdvancedSearch() {
  const navigate = useNavigate()

  const [brands, setBrands] = useState([])
  const [models, setModels] = useState([])
  const [fuelTypes, setFuelTypes] = useState([])
  const [gearboxes, setGearboxes] = useState([])
  const [bodyTypes, setBodyTypes] = useState([])
  const [driveTypes, setDriveTypes] = useState([])
  const [regions, setRegions] = useState([])
  const [cities, setCities] = useState([])
  const [colors, setColors] = useState([]);

  const [form, setForm] = useState({
    // Basics
    category: 'cars', // cars | buses | trucks
    brand: '',
    model: '',
    condition: '', // 'new' | 'used' | 'damaged'
    parts: false,

    // Price & Mileage
    priceFrom: '',
    priceTo: '',
    mileageMax: '',

    // Production date
    yearFrom: '',
    yearTo: '',
    month: '',

    // Power & Displacement
    ccFrom: '',
    ccTo: '',
    powerFrom: '',
    powerTo: '',

    // Technical
    engine: '',
    gearbox: '',
    euro: '',
    categoryBody: '',
    color: '',

    // Location
    region: '',
    city: '',

    // Extras
    extras: new Set(),
  })

  const handle = (k, v) => setForm(prev => ({ ...prev, [k]: v }))
  const toggleExtra = (name) =>
    setForm(prev => {
      const s = new Set(prev.extras)
      if (s.has(name)) s.delete(name)
      else s.add(name)
      return { ...prev, extras: s }
    })
  const selectCondition = (value) => setForm(prev => ({ ...prev, condition: value }))

  const years = useMemo(
    () => Array.from({ length: new Date().getFullYear() - 1929 }, (_, i) => 1930 + i).reverse(),
    []
  )
  const months = [
    'January','February','March','April','May','June','July','August','September','October','November','December'
  ]


// Load all catalogs
  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const [
          brandsAll,
          fuelAll,
          gearboxAll,
          bodyAll,
          driveAll,
          colorsAll,
          regionsAll,
        ] = await Promise.all([
          fetchAllPages(endpoints.brands, { page_size: 500 }),
          fetchAllPages(endpoints.fueltypes, { page_size: 200 }),
          fetchAllPages(endpoints.transmissions, { page_size: 200 }),
          fetchAllPages(endpoints.bodytypes, { page_size: 200 }),
          fetchAllPages(endpoints.drivetypes, { page_size: 200 }),
          fetchAllPages(endpoints.colors, { page_size: 500 }),
          fetchAllPages(endpoints.regions, { page_size: 200 }),
        ])

        if (!alive) return
        setBrands(brandsAll)
        setFuelTypes(fuelAll)
        setGearboxes(gearboxAll)
        setBodyTypes(bodyAll)
        setDriveTypes(driveAll)
        setColors(colorsAll)
        setRegions(regionsAll)
      } catch (err) {
        console.error('Failed to load catalogs:', err)
      }
    })()
    return () => { alive = false }
  }, [])


// brand-model dependency
  useEffect(() => {
    const brandId = form.brand
    if (!brandId) {
      setModels([])
      handle('model', '')
      return
    }

    let alive = true
    ;(async () => {
      try {
        const modelsAll = await fetchAllPages(endpoints.models, { brand: brandId, page_size: 500 })
        if (alive) setModels(modelsAll)
      } catch (err) {
        console.error(err)
      }
    })()

    return () => { alive = false }
  }, [form.brand])


// Cities - regions dependency
  useEffect(() => {
    const regionId = form.region
    if (!regionId) {
      setCities([])
      handle('city', '')
      return
    }

    let alive = true
    ;(async () => {
      try {
        const citiesAll = await fetchAllPages(endpoints.cities, { region: regionId, page_size: 500 })
        if (alive) setCities(citiesAll)
      } catch (err) {
        console.error(err)
      }
    })()

    return () => { alive = false }
  }, [form.region])






  const submit = (e) => {
    e.preventDefault()
    const p = new URLSearchParams()

    // Basics
    if (form.category) p.set('category', form.category)
    if (form.brand) p.set('brand', form.brand)
    if (form.model) p.set('model', form.model)
    if (form.condition) p.set('condition', form.condition)
    if (form.parts) p.set('parts', '1')

    // Price & Mileage
    if (form.priceFrom) p.set('price_from', form.priceFrom)
    if (form.priceTo) p.set('price_to', form.priceTo)
    if (form.mileageMax) p.set('mileage_max', form.mileageMax)

    // Production date
    if (form.yearFrom) p.set('year_from', form.yearFrom)
    if (form.yearTo) p.set('year_to', form.yearTo)
    if (form.month) p.set('month', form.month)

    // Power & CC
    if (form.ccFrom) p.set('cc_from', form.ccFrom)
    if (form.ccTo) p.set('cc_to', form.ccTo)
    if (form.powerFrom) p.set('power_from', form.powerFrom)
    if (form.powerTo) p.set('power_to', form.powerTo)

    // Technical
    if (form.engine) p.set('engine', form.engine)
    if (form.gearbox) p.set('gearbox', form.gearbox)
    if (form.euro) p.set('euro', form.euro)
    if (form.categoryBody) p.set('body', form.categoryBody)
    if (form.color) p.set('color', form.color) // expects a Color ID (FK)

    // Location
    if (form.region) p.set('region', form.region)
    if (form.city) p.set('city', form.city)

    // Extras (multiple)
    if (form.extras.size) {
      for (const x of form.extras) p.append('extra', x)
    }

    navigate(`/search?${p.toString()}`)
  }

  const reset = () => {
    setForm({
      category: 'cars',
      brand: '',
      model: '',
      condition: '',
      parts: false,
      priceFrom: '',
      priceTo: '',
      mileageMax: '',
      yearFrom: '',
      yearTo: '',
      month: '',
      ccFrom: '',
      ccTo: '',
      powerFrom: '',
      powerTo: '',
      engine: '',
      gearbox: '',
      euro: '',
      categoryBody: '',
      color: '',
      region: '',
      city: '',
      extras: new Set(),
    })
  }

  return (
    <div className="py-6">
      <Container>
        <SectionHeader
          title="Advanced search"
          subtitle="Choose detailed filters and extras, then apply to view results."
          actions={
            <div className="hidden md:flex gap-2">
              <Button onClick={submit}>Apply filters</Button>
              <Button variant="secondary" onClick={reset}>Reset</Button>
            </div>
          }
        />

        <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          {/* Basics */}
          <Card>
            <h3 className="mb-3 text-sm font-semibold text-neutral-900 dark:text-white">Basics</h3>
            <div className="grid gap-3 md:grid-cols-2">
              <Select value={form.category} onChange={e => handle('category', e.target.value)}>
                <option value="cars">Cars & SUVs</option>
                <option value="buses">Buses</option>
                <option value="trucks">Trucks</option>
              </Select>

              <Select value={form.brand} onChange={e => handle('brand', e.target.value)}>
                <option value="">Brand</option>
                {brands.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </Select>

              <Select value={form.model} onChange={e => handle('model', e.target.value)} disabled={!form.brand}>
                <option value="">Model</option>
                {models.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </Select>

              {/* Condition (mutually exclusive) */}
              <div className="grid grid-cols-3 gap-2">
                <CheckLikeRadio
                  label="New"
                  checked={form.condition === 'new'}
                  onChange={() => selectCondition('new')}
                />
                <CheckLikeRadio
                  label="Used"
                  checked={form.condition === 'used'}
                  onChange={() => selectCondition('used')}
                />
                <CheckLikeRadio
                  label="Damaged"
                  checked={form.condition === 'damaged'}
                  onChange={() => selectCondition('damaged')}
                />
              </div>

              {/* Independent: For parts */}
              <label className="inline-flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-200">
                <input
                  type="checkbox"
                  checked={form.parts}
                  onChange={e => handle('parts', e.target.checked)}
                  className="h-4 w-4 rounded border-neutral-300 text-brand-600 focus:ring-brand-400 dark:border-gray-700"
                />
                For parts
              </label>
            </div>
          </Card>

          {/* Price & Mileage */}
          <Card>
            <h3 className="mb-3 text-sm font-semibold text-neutral-900 dark:text-white">Price & mileage</h3>
            <div className="grid gap-3 md:grid-cols-2">
              <Input type="number" min="0" placeholder="Price from" value={form.priceFrom} onChange={e => handle('priceFrom', e.target.value)} />
              <Input type="number" min="0" placeholder="Price to" value={form.priceTo} onChange={e => handle('priceTo', e.target.value)} />
              <Select value={form.mileageMax} onChange={e => handle('mileageMax', e.target.value)}>
                <option value="">Max mileage</option>
                <option>10000</option><option>20000</option><option>30000</option><option>40000</option>
                <option>50000</option><option>100000</option><option>150000</option><option>200000</option>
                <option>250000</option><option>300000</option>
              </Select>
            </div>
          </Card>

          {/* Production date */}
          <Card>
            <h3 className="mb-3 text-sm font-semibold text-neutral-900 dark:text-white">Production date</h3>
            <div className="grid gap-3 md:grid-cols-3">
              <Select value={form.yearFrom} onChange={e => handle('yearFrom', e.target.value)}>
                <option value="">Year from</option>
                {years.map(y => <option key={`yf-${y}`} value={y}>{y}</option>)}
              </Select>
              <Select value={form.yearTo} onChange={e => handle('yearTo', e.target.value)}>
                <option value="">Year to</option>
                {years.map(y => <option key={`yt-${y}`} value={y}>{y}</option>)}
              </Select>
              <Select value={form.month} onChange={e => handle('month', e.target.value)}>
                <option value="">Month</option>
                {months.map(m => <option key={m} value={m}>{m}</option>)}
              </Select>
            </div>
          </Card>

          {/* Power & Displacement */}
          <Card>
            <h3 className="mb-3 text-sm font-semibold text-neutral-900 dark:text-white">Power & displacement</h3>
            <div className="grid gap-3 md:grid-cols-2">
              <Input type="number" min="0" placeholder="Cubic capacity [cc] from" value={form.ccFrom} onChange={e => handle('ccFrom', e.target.value)} />
              <Input type="number" min="0" placeholder="Cubic capacity [cc] to" value={form.ccTo} onChange={e => handle('ccTo', e.target.value)} />
              <Input type="number" min="0" placeholder="Power from (hp)" value={form.powerFrom} onChange={e => handle('powerFrom', e.target.value)} />
              <Input type="number" min="0" placeholder="Power to (hp)" value={form.powerTo} onChange={e => handle('powerTo', e.target.value)} />
            </div>
          </Card>

          {/* Technical */}
          <Card>
            <h3 className="mb-3 text-sm font-semibold text-neutral-900 dark:text-white">Technical</h3>
            <div className="grid gap-3 md:grid-cols-2">
              <Select value={form.engine} onChange={e => handle('engine', e.target.value)}>
                <option value="">Fuel type</option>
                {fuelTypes.map(ft => (
                  <option key={ft.id} value={ft.id}>{ft.name}</option>
                ))}
              </Select>
              <Select value={form.gearbox} onChange={e => handle('gearbox', e.target.value)}>
                <option value="">Gearbox</option>
                {gearboxes.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </Select>
              <Select value={form.euro} onChange={e => handle('euro', e.target.value)}>
                <option value="">Euro standard</option>
                <option>Euro 1</option><option>Euro 2</option><option>Euro 3</option>
                <option>Euro 4</option><option>Euro 5</option><option>Euro 6</option>
              </Select>
              <Select value={form.categoryBody} onChange={e => handle('categoryBody', e.target.value)}>
                <option value="">Body type</option>
                {bodyTypes.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </Select>
              <Select value={form.drive} onChange={e => handle('drive', e.target.value)}>
                <option value="">Drive type</option>
                {driveTypes.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </Select>
              <Select value={form.color} onChange={e => handle('color', e.target.value)} disabled={!colors.length}>
                <option value="">Color</option>
                {colors.map(c => (
                <option key={c.id} value={String(c.id)}>{c.name}</option>
                ))}
              </Select>
            </div>
          </Card>

          {/* Location */}
          <Card>
            <h3 className="mb-3 text-sm font-semibold text-neutral-900 dark:text-white">Location</h3>
            <div className="grid gap-3 md:grid-cols-2">
              <Select value={form.region} onChange={e => handle('region', e.target.value)}>
                <option value="">Region</option>
                {regions.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </Select>
              <Select value={form.city} onChange={e => handle('city', e.target.value)} disabled={!form.region}>
                <option value="">City</option>
                {cities.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
            </div>
          </Card>

          {/* Extras */}
          <ExtrasCard form={form} toggleExtra={toggleExtra} />
        </form>

        {/* Sticky mobile action bar */}
        <div className="mt-6 flex justify-end gap-2 md:hidden">
          <Button onClick={submit} className="flex-1">Apply filters</Button>
          <Button variant="secondary" onClick={reset} className="flex-1">Reset</Button>
        </div>
      </Container>
    </div>
  )
}

/* ------------------------------- Subparts ------------------------------- */

function CheckLikeRadio({ label, checked, onChange }) {
  return (
    <label className="inline-flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-200">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 rounded border-neutral-300 text-brand-600 focus:ring-brand-400 dark:border-gray-700"
      />
      {label}
    </label>
  )
}

function ExtrasCard({ form, toggleExtra }) {
  // Option sets condensed from your Specs (can be expanded anytime)
  const SAFETY = [
    'GPS tracking system','Automatic stability control','Adaptive headlights',
    'ABS','Airbags - Rear','Airbags - Front','Airbags - Side','EBD','ESP',
    'Tire pressure monitoring','Parking sensors','ISOFIX','DSS','Anti-skid',
    'Pad drying system','Distance control','Descent control','Brake assist',
  ]
  const COMFORT = [
    'Auto Start Stop','Bluetooth','DVD/TV','Steptronic','Tiptronic','USB/AUX',
    'Adaptive air suspension','Keyless ignition','Differential lock','On-board computer',
    'Fast/slow speeds','Light sensor','Electric mirrors','Electric windows',
    'Suspension adjustment','Seat adjustment','Electric power steering','Air conditioning',
    'Climatronic','Multifunction steering wheel','Navigation','Steering wheel heating',
    'Stove','Windshield heating','Seat heating','Steering wheel adjustment',
    'Rain sensor','Power steering','Headlight washer system','Cruise control','Heat pump','Refrigerator compartment',
  ]
  const EXTERIOR = [
    '2(3) Doors','4(5) Doors','LED headlights','Xenon headlights','Alloy wheels',
    'Metallic','Panoramic sunroof','Roof rails','Spoilers','Towbar','Halogen headlights','Shibedah',
  ]
  const INTERIOR = ['Suede interior','Right-hand drive','Leather salon']
  const PROTECTION = ['OFFROAD package','Alarm','Armored','Casco','Winch','Central locking']
  const SPECIALIZED = ['TAXI','For people with disabilities','Hearse','Ambulance','Educational','Refrigerated','Homologation N1']
  const OTHERS = ['4x4','7 seats','Buy back','Barter','Gas system','Long base','Seized/Sold','Crashed','Short base','Leasing','Methane system','In parts','Fully serviced','New import','With registration','Service book','Tuning']

  return (
    <Card className="lg:col-span-2">
      <h3 className="mb-3 text-sm font-semibold text-neutral-900 dark:text-white">Extras & features</h3>

      <ExtrasGroup title="Safety" list={SAFETY} form={form} toggleExtra={toggleExtra} />
      <ExtrasGroup title="Comfort" list={COMFORT} form={form} toggleExtra={toggleExtra} />
      <ExtrasGroup title="Exterior" list={EXTERIOR} form={form} toggleExtra={toggleExtra} />
      <ExtrasGroup title="Interior" list={INTERIOR} form={form} toggleExtra={toggleExtra} />
      <ExtrasGroup title="Protection" list={PROTECTION} form={form} toggleExtra={toggleExtra} />
      <ExtrasGroup title="Specialized" list={SPECIALIZED} form={form} toggleExtra={toggleExtra} />
      <ExtrasGroup title="Others" list={OTHERS} form={form} toggleExtra={toggleExtra} />
    </Card>
  )
}

function ExtrasGroup({ title, list, form, toggleExtra }) {
  return (
    <div className="mb-4">
      <h4 className="mb-2 text-sm font-medium text-neutral-800 dark:text-neutral-200">{title}</h4>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {list.map(name => (
          <label key={name} className="inline-flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-200">
            <input
              type="checkbox"
              checked={form.extras.has(name)}
              onChange={() => toggleExtra(name)}
              className="h-4 w-4 rounded border-neutral-300 text-brand-600 focus:ring-brand-400 dark:border-gray-700"
            />
            {name}
          </label>
        ))}
      </div>
    </div>
  )
}

async function fetchAllPages(url, params = { page_size: 200 }) {
  const out = [];
  let nextUrl = url;
  let nextParams = { ...params };

  while (nextUrl) {
    const { data } = await api.get(nextUrl, { params: nextParams });
    const chunk = Array.isArray(data) ? data : (data?.results || []);
    out.push(...chunk);

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
