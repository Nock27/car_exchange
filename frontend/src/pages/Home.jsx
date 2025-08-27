import { Link, useNavigate } from 'react-router-dom'
import Container from '@/components/layout/Container'
import { useState } from 'react'

/**
 * Home
 * - Modern hero with responsive gradient background
 * - Short Search (simple form)
 * - Feature highlights
 * NEW: "New / Used / Damaged" behave mutually exclusive
 */

export default function Home() {
  return (
    <div className="relative overflow-hidden">
      {/* Decorative blobs (subtle, both themes) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-[-20rem] -z-10 transform-gpu blur-3xl"
      >
        <div className="mx-auto h-[36rem] w-[72rem] bg-gradient-to-tr from-brand-600 to-sky-400 opacity-20 dark:opacity-25"></div>
      </div>

      {/* HERO */}
      <section className="bg-gradient-to-b from-white to-brand-50/60 py-10 dark:from-gray-950 dark:to-gray-900">
        <Container className="grid gap-8 py-4 md:grid-cols-[1.2fr_1fr] md:items-center">
          {/* Left: Headline + CTAs */}
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white md:text-5xl">
              Find your{' '}
              <span className="bg-gradient-to-r from-brand-600 to-sky-500 bg-clip-text text-transparent dark:from-brand-400 dark:to-info-500">
                next car
              </span>
              .
            </h1>
            <p className="mt-3 max-w-2xl text-neutral-600 dark:text-neutral-300 md:text-lg">
              Advanced filters, a clean UI, and an interactive map to explore listings by location.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/search"
                className="rounded-lg bg-brand-600 px-5 py-2.5 text-white shadow hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-400"
              >
                Start browsing
              </Link>
              <Link
                to="/create-listing"
                className="rounded-lg border border-neutral-300 px-5 py-2.5 text-neutral-800 hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-200 dark:border-gray-700 dark:text-neutral-100 dark:hover:bg-gray-800 dark:focus:ring-gray-700"
              >
                Post a listing
              </Link>
            </div>
          </div>

          {/* Right: Short Search */}
          <div>
            <ShortSearchCard />
          </div>
        </Container>
      </section>

      {/* FEATURES */}
      <section className="py-10">
        <Container>
          <div className="grid gap-4 md:grid-cols-3">
            <FeatureCard
              title="Post in minutes"
              desc="Create a listing with photos, specs, and contact details."
              icon={
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
              }
            />
            <FeatureCard
              title="Advanced filters"
              desc="Filter by brand, model, price, year, engine, gearbox, and more."
              icon={
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 6h18" />
                  <path d="M7 12h10" />
                  <path d="M10 18h4" />
                </svg>
              }
            />
            <FeatureCard
              title="Map view"
              desc="See listings by location and explore regions interactively."
              icon={
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 18l-6 3V6l6-3 6 3 6-3v15l-6 3-6-3z" />
                  <path d="M9 3v15" />
                  <path d="M15 6v15" />
                </svg>
              }
            />
          </div>
        </Container>
      </section>
    </div>
  )
}

/* ----------------------------- Short Search ----------------------------- */

function ShortSearchCard() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    category: 'cars',
    brand: '',
    model: '',
    region: '',
    city: '',
    maxPrice: '',
    year: '',
    engine: '',
    gearbox: '',
    // condition is now a SINGLE value: 'new' | 'used' | 'damaged'
    condition: 'used',
    parts: false, // "For parts" remains independent
  })

  const handle = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  // Select exactly one of: new / used / damaged
  const selectCondition = (value) =>
    setForm(prev => ({ ...prev, condition: value }))

  const submit = e => {
    e.preventDefault()
    const params = new URLSearchParams()
    // Only append non-empty values
    Object.entries({
      category: form.category,
      brand: form.brand,
      model: form.model,
      region: form.region,
      city: form.city,
      max_price: form.maxPrice,
      year: form.year,
      engine: form.engine,
      gearbox: form.gearbox,
      condition: form.condition, // single condition
    }).forEach(([k, v]) => {
      if (v) params.append(k, v)
    })
    // independent flag for parts
    if (form.parts) params.append('parts', '1')

    navigate(`/search?${params.toString()}`)
  }

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white/70 p-4 shadow-sm backdrop-blur dark:border-gray-800 dark:bg-gray-900/70 md:p-6">
      <h3 className="mb-3 text-lg font-semibold text-neutral-900 dark:text-white">
        Quick search
      </h3>
      <form onSubmit={submit} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {/* Row 1 */}
        <select
          className={selectCls}
          value={form.category}
          onChange={e => handle('category', e.target.value)}
        >
          <option value="cars">Cars & SUVs</option>
          <option value="buses">Buses</option>
          <option value="trucks">Trucks</option>
        </select>

        <select
          className={selectCls}
          value={form.brand}
          onChange={e => handle('brand', e.target.value)}
        >
          <option value="">Brand</option>
          <option>BMW</option>
          <option>Audi</option>
          <option>Mercedes</option>
          <option>VW</option>
        </select>

        {/* Row 2 */}
        <select
          className={selectCls}
          value={form.model}
          onChange={e => handle('model', e.target.value)}
        >
          <option value="">Model</option>
          <option>3 Series</option>
          <option>A4</option>
          <option>C Class</option>
          <option>Golf</option>
        </select>

        <select
          className={selectCls}
          value={form.region}
          onChange={e => handle('region', e.target.value)}
        >
          <option value="">Region</option>
          <option>Sofia</option>
          <option>Plovdiv</option>
          <option>Varna</option>
          <option>Burgas</option>
        </select>

        {/* Row 3 */}
        <select
          className={selectCls}
          value={form.city}
          onChange={e => handle('city', e.target.value)}
        >
          <option value="">City</option>
          <option>Sofia</option>
          <option>Plovdiv</option>
          <option>Varna</option>
          <option>Burgas</option>
        </select>

        <input
          className={inputCls}
          type="number"
          inputMode="numeric"
          min="0"
          placeholder="Max price"
          value={form.maxPrice}
          onChange={e => handle('maxPrice', e.target.value)}
        />

        {/* Row 4 */}
        <select
          className={selectCls}
          value={form.year}
          onChange={e => handle('year', e.target.value)}
        >
          <option value="">Production year</option>
          {Array.from({ length: new Date().getFullYear() - 1929 }, (_, i) => 1930 + i)
            .reverse()
            .map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
        </select>

        <select
          className={selectCls}
          value={form.engine}
          onChange={e => handle('engine', e.target.value)}
        >
          <option value="">Engine</option>
          <option>Gasoline</option>
          <option>Diesel</option>
          <option>Electric</option>
          <option>Hybrid</option>
          <option>Plug-in hybrid</option>
          <option>Gas</option>
          <option>Hydrogen</option>
        </select>

        {/* Row 5 */}
        <select
          className={selectCls}
          value={form.gearbox}
          onChange={e => handle('gearbox', e.target.value)}
        >
          <option value="">Gearbox</option>
          <option>Manual</option>
          <option>Automatic</option>
          <option>Semi-automatic</option>
        </select>

        {/* Condition group: (New | Used | Damaged) -> mutually exclusive */}
        <div className="grid grid-cols-3 items-center gap-2">
          <ConditionCheck
            label="New"
            checked={form.condition === 'new'}
            onChange={() => selectCondition('new')}
          />
          <ConditionCheck
            label="Used"
            checked={form.condition === 'used'}
            onChange={() => selectCondition('used')}
          />
          <ConditionCheck
            label="Damaged"
            checked={form.condition === 'damaged'}
            onChange={() => selectCondition('damaged')}
          />
        </div>

        {/* Independent: For parts */}
        <div className="flex items-center gap-2">
          <FlagCheck
            label="For parts"
            checked={form.parts}
            onChange={() => handle('parts', !form.parts)}
          />
        </div>

        {/* Actions */}
        <div className="col-span-full mt-2 flex flex-wrap gap-3">
          <button
            type="submit"
            className="rounded-lg bg-brand-600 px-5 py-2.5 text-white shadow hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-400"
          >
            Search
          </button>
          <Link
            to="/search?mode=advanced"
            className="rounded-lg border border-neutral-300 px-5 py-2.5 text-neutral-800 hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-200 dark:border-gray-700 dark:text-neutral-100 dark:hover:bg-gray-800 dark:focus:ring-gray-700"
          >
            Advanced search
          </Link>
        </div>
      </form>
    </div>
  )
}

/* ------------------------------ UI Helpers ------------------------------ */

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

function ConditionCheck({ label, checked, onChange }) {
  // Styled as checkbox, behaves like a radio
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

function FeatureCard({ title, desc, icon }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white/70 p-5 shadow-sm backdrop-blur transition-colors hover:border-brand-300 dark:border-gray-800 dark:bg-gray-900/70">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700 dark:bg-gray-800 dark:text-brand-300">
          {icon}
        </div>
        <div>
          <h4 className="text-base font-semibold text-neutral-900 dark:text-white">{title}</h4>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">{desc}</p>
        </div>
      </div>
    </div>
  )
}
