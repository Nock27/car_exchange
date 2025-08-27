import { useState } from 'react'
import Container from '@/components/layout/Container'
import SectionHeader from '@/components/ui/SectionHeader'
import Select from '@/components/ui/Select'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import ListingCard, { ListingCardSkeleton } from '@/components/ui/ListingCard'
import { Link } from 'react-router-dom'

export default function Search() {
  const [filtersOpen, setFiltersOpen] = useState(true)
  const [loading] = useState(false)

  return (
    <div className="py-6">
      <Container>
        <SectionHeader
          title="Search results"
          subtitle="Use filters to narrow down vehicles."
          actions={
            <div className="flex items-center gap-2">
              <Link to="/advanced-search" className="hidden md:inline text-sm text-info-500 hover:underline">
                Advanced search
              </Link>
              <Button
                variant="secondary"
                onClick={() => setFiltersOpen(v => !v)}
                className="px-3 py-1.5"
                aria-expanded={filtersOpen}
                aria-controls="filters-panel"
              >
                {filtersOpen ? 'Hide filters' : 'Show filters'}
              </Button>
            </div>
          }
        />

        <div className={`grid gap-6 ${filtersOpen ? 'md:grid-cols-[280px_1fr]' : 'md:grid-cols-1'}`}>
          {filtersOpen && (
            <aside
              id="filters-panel"
              className="space-y-3 rounded-2xl border border-neutral-200 bg-white/70 p-4 shadow-sm backdrop-blur dark:border-gray-800 dark:bg-gray-900/70"
            >
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">Filters</h3>

              <Select defaultValue="">
                <option value="">Main category</option>
                <option value="cars">Cars & SUVs</option>
                <option value="buses">Buses</option>
                <option value="trucks">Trucks</option>
              </Select>

              <Select defaultValue="">
                <option value="">Brand</option>
                <option>BMW</option><option>Audi</option><option>Mercedes</option><option>VW</option>
              </Select>

              <Select defaultValue="">
                <option value="">Model</option>
                <option>3 Series</option><option>A4</option><option>C Class</option><option>Golf</option>
              </Select>

              <div className="grid grid-cols-2 gap-2">
                <Input type="number" min="0" placeholder="Price from" />
                <Input type="number" min="0" placeholder="Price to" />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Select defaultValue="">
                  <option value="">Year from</option>
                  {Array.from({ length: new Date().getFullYear() - 1929 }, (_, i) => 1930 + i).map(y => (
                    <option key={`yf-${y}`} value={y}>{y}</option>
                  ))}
                </Select>
                <Select defaultValue="">
                  <option value="">Year to</option>
                  {Array.from({ length: new Date().getFullYear() - 1929 }, (_, i) => 1930 + i).map(y => (
                    <option key={`yt-${y}`} value={y}>{y}</option>
                  ))}
                </Select>
              </div>

              <Select defaultValue="">
                <option value="">Engine</option>
                <option>Gasoline</option><option>Diesel</option><option>Electric</option>
                <option>Hybrid</option><option>Plug-in hybrid</option><option>Gas</option><option>Hydrogen</option>
              </Select>

              <Select defaultValue="">
                <option value="">Gearbox</option>
                <option>Manual</option><option>Automatic</option><option>Semi-automatic</option>
              </Select>

              <Select defaultValue="">
                <option value="">Region</option>
                <option>Sofia</option><option>Plovdiv</option><option>Varna</option><option>Burgas</option>
              </Select>

              <Select defaultValue="">
                <option value="">City</option>
                <option>Sofia</option><option>Plovdiv</option><option>Varna</option><option>Burgas</option>
              </Select>

              <div className="flex gap-2 pt-1">
                <Button className="flex-1">Apply</Button>
                <Button variant="secondary" className="flex-1">Reset</Button>
              </div>

              <Link to="/advanced-search" className="block pt-2 text-sm text-info-500 hover:underline">
                Need more filters? Open Advanced search →
              </Link>
            </aside>
          )}

          <section aria-live="polite">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-sm text-neutral-600 dark:text-neutral-300">
                Showing <span className="font-medium">12</span> results
              </p>
              <Select className="w-[200px]" defaultValue="latest" aria-label="Sort results">
                <option value="latest">Latest listings</option>
                <option value="price_asc">Price ↑</option>
                <option value="price_desc">Price ↓</option>
                <option value="year_desc">Production date ↓</option>
                <option value="mileage_asc">Mileage ↑</option>
              </Select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {loading ? (
                <>
                  <ListingCardSkeleton /><ListingCardSkeleton /><ListingCardSkeleton />
                </>
              ) : (
                <>
                  <ListingCard />
                  <ListingCard title="2017 Audi A4 2.0 TDI" price="€13,200" specs="Diesel • 210,000 km • Manual" location="Plovdiv" />
                  <ListingCard title="2019 VW Golf 1.5 TSI" price="€16,450" specs="Gasoline • 95,000 km • Automatic" location="Varna" />
                  <ListingCard title="2016 Mercedes C220d" price="€17,900" specs="Diesel • 180,500 km • Automatic" location="Sofia" />
                  <ListingCard title="2015 BMW 520d" price="€18,300" specs="Diesel • 220,000 km • Automatic" location="Burgas" />
                  <ListingCard title="2020 Toyota Corolla" price="€18,900" specs="Hybrid • 60,000 km • Automatic" location="Sofia" />
                </>
              )}
            </div>

            <div className="mt-6 flex justify-center gap-2">
              <Button variant="secondary" className="px-3 py-1.5">« Prev</Button>
              <Button className="px-3 py-1.5">Next »</Button>
            </div>
          </section>
        </div>
      </Container>
    </div>
  )
}
