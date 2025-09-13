import { Link, useNavigate } from 'react-router-dom'
import Container from '@/components/layout/Container'
import { useState, useEffect } from 'react'
import { api, endpoints } from '@/lib/api'
import ListingCard from '@/components/ui/ListingCard'
import Card from '@/components/ui/Card'

export default function Home() {
  return (
    <div className="relative overflow-hidden">
      {/* Decorative blob */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-[-20rem] -z-10 transform-gpu blur-3xl">
        <div className="mx-auto h-[36rem] w-[72rem] bg-gradient-to-tr from-brand-600 to-sky-400 opacity-20 dark:opacity-25"></div>
      </div>

      {/* HERO */}
      <section className="bg-gradient-to-b from-white to-brand-50/60 py-10 dark:from-gray-950 dark:to-gray-900">
        <Container className="grid gap-8 py-4 md:grid-cols-[1.2fr_1fr] md:items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white md:text-5xl">
              Find your <span className="bg-gradient-to-r from-brand-600 to-sky-500 bg-clip-text text-transparent dark:from-brand-400 dark:to-info-500">next car</span>.
            </h1>
            <p className="mt-3 max-w-2xl text-neutral-600 dark:text-neutral-300 md:text-lg">
              Advanced filters, a clean UI, and an interactive map to explore listings by location.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/search" className="rounded-lg bg-brand-600 px-5 py-2.5 text-white shadow hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-400">
                Start browsing
              </Link>
              <Link to="/advanced-search" className="rounded-lg border border-neutral-300 px-5 py-2.5 text-neutral-800 hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-200 dark:border-gray-700 dark:text-neutral-100 dark:hover:bg-gray-800 dark:focus:ring-gray-700">
                Advanced search
              </Link>
              <Link to="/create-listing" className="rounded-lg border border-neutral-300 px-5 py-2.5 text-neutral-800 hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-200 dark:border-gray-700 dark:text-neutral-100 dark:hover:bg-gray-800 dark:focus:ring-gray-700">
                Post a listing
              </Link>
            </div>
          </div>
          <div>
            <ShortSearchCard />
          </div>
        </Container>
      </section>

      {/* FEATURES */}
      <section className="py-10">
        <Container>
          <div className="grid gap-4 md:grid-cols-3">
            <FeatureCard title="Post in minutes" desc="Create a listing with photos, specs, and contact details." />
            <FeatureCard title="Advanced filters" desc="Filter by brand, model, price, year, engine, gearbox, and more." />
            <FeatureCard title="Map view" desc="See listings by location and explore regions interactively." />
          </div>
        </Container>
      </section>

      {/* TRENDING LISTINGS (UI only) */}
      <section className="py-8">
        <Container>
          <div className="mb-4 flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white">Trending listings</h2>
              <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">A few picks to get you started.</p>
            </div>
            <Link to="/search" className="text-sm text-info-500 hover:underline">Browse all</Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <ListingCard />
            <ListingCard title="2017 Audi A4 2.0 TDI" price="€13,200" specs="Diesel • 210,000 km • Manual" location="Plovdiv" />
            <ListingCard title="2019 VW Golf 1.5 TSI" price="€16,450" specs="Gasoline • 95,000 km • Automatic" location="Varna" />
            <ListingCard title="2016 Mercedes C220d" price="€17,900" specs="Diesel • 180,500 km • Automatic" location="Sofia" />
            <ListingCard title="2015 BMW 520d" price="€18,300" specs="Diesel • 220,000 km • Automatic" location="Burgas" />
            <ListingCard title="2020 Toyota Corolla" price="€18,900" specs="Hybrid • 60,000 km • Automatic" location="Sofia" />
          </div>
        </Container>
      </section>
    </div>
  )
}

/* ----------------------------- Short Search ----------------------------- */

function ShortSearchCard() {
  const navigate = useNavigate()

  // catalogs
  const [categories, setCategories] = useState([])
  const [brands, setBrands] = useState([])
  const [models, setModels] = useState([])
  const [regions, setRegions] = useState([])
  const [cities, setCities] = useState([])
  const [fuelTypes, setFuelTypes] = useState([])
  const [gearboxes, setGearboxes] = useState([])

  // form (същия UI; пазим id-та за филтрите)
  const [form, setForm] = useState({
    category: '',
    brand: '',
    model: '',
    region: '',
    city: '',
    maxPrice: '',
    year: '',
    engine: '',
    gearbox: '',
    condition: 'used',
    parts: false,
  })
  const handle = (k, v) => setForm(prev => ({ ...prev, [k]: v }))
  const selectCondition = value => setForm(prev => ({ ...prev, condition: value }))

  // paginator helper
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

  // preload catalogs (вече включва categories)
  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const [categoriesAll, brandsAll, regionsAll, fuelsAll, gearAll] = await Promise.all([
          fetchAllPages(endpoints.categories, { page_size: 200 }),
          fetchAllPages(endpoints.brands, { page_size: 500 }),
          fetchAllPages(endpoints.regions, { page_size: 500 }),
          fetchAllPages(endpoints.fueltypes, { page_size: 200 }),
          fetchAllPages(endpoints.transmissions, { page_size: 200 }),
        ])
        if (!alive) return
        setCategories(categoriesAll)
        setBrands(brandsAll)
        setRegions(regionsAll)
        setFuelTypes(fuelsAll)
        setGearboxes(gearAll)
      } catch (e) {
        console.error('ShortSearch preload error:', e)
      }
    })()
    return () => { alive = false }
  }, [])

  // brand → models
  useEffect(() => {
    const brandId = form.brand
    if (!brandId) { setModels([]); return }
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
  }, [form.brand])


  // region → cities
  useEffect(() => {
    const regionId = form.region
    if (!regionId) { setCities([]); return }
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
  }, [form.region])


  // submit → /search (като Search.jsx)
  const submit = e => {
    e.preventDefault()
    const params = new URLSearchParams()

    if (form.category && /^\d+$/.test(String(form.category))) {
      params.set('category', String(form.category))
    }
    if (form.brand) params.set('brand', String(form.brand))
    if (form.model) params.set('model', String(form.model))
    if (form.region) params.set('region', String(form.region))
    if (form.city) params.set('city', String(form.city))

    if (form.engine) params.set('fuel_type', String(form.engine))
    if (form.gearbox) params.set('transmission', String(form.gearbox))

    if (form.maxPrice) params.set('price_max', String(form.maxPrice))
    if (form.year) {
      params.set('year_min', String(form.year))
      params.set('year_max', String(form.year))
    }

    params.set('ordering', '-created_at')
    params.set('page_size', '24')

    navigate(`/search?${params.toString()}`)
  }

  return (
    <Card>
      <h3 className="mb-3 text-lg font-semibold text-neutral-900 dark:text-white">Quick search</h3>
      <form onSubmit={submit} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <select className={selectCls} value={form.category} onChange={e => handle('category', e.target.value)}>
          <option value="">Category</option>
          {categories.map(c => (
            <option key={c.id} value={String(c.id)}>{c.name}</option>
          ))}
        </select>

        <select className={selectCls} value={form.brand} onChange={e => handle('brand', e.target.value)}>
          <option value="">Brand</option>
          {brands.map(b => (
            <option key={b.id} value={String(b.id)}>{b.name}</option>
          ))}
        </select>

        <select className={selectCls} value={form.model} onChange={e => handle('model', e.target.value)} disabled={!form.brand}>
          <option value="">Model</option>
          {models.map(m => (
            <option key={m.id} value={String(m.id)}>{m.name}</option>
          ))}
        </select>

        <select className={selectCls} value={form.region} onChange={e => { const v = e.target.value; handle('region', v); handle('city', ''); }}>
          <option value="">Region</option>
          {regions.map(r => (
            <option key={r.id} value={String(r.id)}>{r.name}</option>
          ))}
        </select>

        <select className={selectCls} value={form.city} onChange={e => handle('city', e.target.value)} disabled={!form.region}>
          <option value="">City</option>
          {cities.map(c => (
            <option key={c.id} value={String(c.id)}>{c.name}</option>
          ))}
        </select>

        <input
          className={inputCls}
          type="number"
          min="0"
          placeholder="Max price"
          value={form.maxPrice}
          onChange={e => handle('maxPrice', e.target.value)}
        />

        <select className={selectCls} value={form.year} onChange={e => handle('year', e.target.value)}>
          <option value="">Production year</option>
          {Array.from({ length: new Date().getFullYear() - 1929 }, (_, i) => 1930 + i).reverse().map(y => (
            <option key={y} value={String(y)}>{y}</option>
          ))}
        </select>

        <select className={selectCls} value={form.engine} onChange={e => handle('engine', e.target.value)}>
          <option value="">Engine</option>
          {fuelTypes.map(ft => (
            <option key={ft.id} value={String(ft.id)}>{ft.name}</option>
          ))}
        </select>

        <select className={selectCls} value={form.gearbox} onChange={e => handle('gearbox', e.target.value)}>
          <option value="">Gearbox</option>
          {gearboxes.map(g => (
            <option key={g.id} value={String(g.id)}>{g.name}</option>
          ))}
        </select>

        <div className="grid grid-cols-3 items-center gap-2">
          <Condition label="New" checked={form.condition === 'new'} onChange={() => selectCondition('new')} />
          <Condition label="Used" checked={form.condition === 'used'} onChange={() => selectCondition('used')} />
          <Condition label="Damaged" checked={form.condition === 'damaged'} onChange={() => selectCondition('damaged')} />
        </div>

        <div className="flex items-center gap-2">
          <FlagCheck label="For parts" checked={form.parts} onChange={() => handle('parts', !form.parts)} />
        </div>

        <div className="col-span-full mt-2 flex flex-wrap gap-3">
          <button
            type="submit"
            className="rounded-lg bg-brand-600 px-5 py-2.5 text-white shadow hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-400"
          >
            Search
          </button>
          <Link
            to="/advanced-search"
            className="rounded-lg border border-neutral-300 px-5 py-2.5 text-neutral-800 hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-200 dark:border-gray-700 dark:text-neutral-100 dark:hover:bg-gray-800 dark:focus:ring-gray-700"
          >
            Advanced search
          </Link>
        </div>
      </form>
    </Card>
  )
}



const inputBase =
  'w-full rounded-lg border bg-white/80 px-3 py-2 text-sm text-neutral-800 shadow-sm ' +
  'placeholder-neutral-400 focus:outline-none focus:ring-2 ' +
  'border-neutral-300 focus:ring-brand-300 dark:border-gray-700 ' +
  'dark:bg-gray-900/80 dark:text-neutral-100 dark:placeholder-neutral-500 dark:focus:ring-brand-500'
const inputCls = inputBase
const selectCls = inputBase + ' appearance-none'

function FlagCheck({ label, checked, onChange }) {
  return (
    <label className="inline-flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-200">
      <input type="checkbox" checked={checked} onChange={onChange} className="h-4 w-4 rounded border-neutral-300 text-brand-600 focus:ring-brand-400 dark:border-gray-700" />
      {label}
    </label>
  )
}
function Condition({ label, checked, onChange }) {
  return (
    <label className="inline-flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-200">
      <input type="checkbox" checked={checked} onChange={onChange} className="h-4 w-4 rounded border-neutral-300 text-brand-600 focus:ring-brand-400 dark:border-gray-700" />
      {label}
    </label>
  )
}

function FeatureCard({ title, desc }) {
  return (
    <Card>
      <h4 className="text-base font-semibold text-neutral-900 dark:text-white">{title}</h4>
      <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">{desc}</p>
    </Card>
  )
}
