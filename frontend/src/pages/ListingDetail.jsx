import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import Container from '@/components/layout/Container'
import SectionHeader from '@/components/ui/SectionHeader'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { api, endpoints } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'

export default function ListingDetail() {
  const { id } = useParams() //id from the url
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const [me, setMe] = useState(null) //curent user
  const [listing, setListing] = useState(null) // the current listing
  const [names, setNames] = useState({
    category: '', brand: '', model: '',
    fuel_type: '', transmission: '', body_type: '', drive_type: '',
    color: '', region: '', city: ''
  })

  const labelTextCls = 'text-xs font-medium text-neutral-700 dark:text-neutral-300'
  const valueTextCls = 'text-sm text-neutral-900 dark:text-neutral-100'

  // helpers

  // id extractor
  const getId = (x) => {
    if (x == null || x === '') return ''
    if (typeof x === 'number') return String(x)
    if (typeof x === 'string') return /^\d+$/.test(x) ? x : ''
    if (typeof x === 'object') {
      if (x.id != null) return String(x.id)
      if (x.pk != null) return String(x.pk)
      if (x.value != null) return String(x.value)
    }
    return ''
  }
  //format the price
  const money = useMemo(
    () => new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }),
    []
  )
  //map video link URL to embed URL for iframe
  const toEmbedUrl = (raw) => {
    if (!raw) return ''
    try {
      const url = new URL(raw)
      const host = url.hostname.replace(/^www\./, '')
      if (host === 'youtube.com') {
        const v = url.searchParams.get('v')
        return v ? `https://www.youtube.com/embed/${v}` : ''
      }
      if (host === 'youtu.be') {
        const id = url.pathname.replace(/^\//, '')
        return id ? `https://www.youtube.com/embed/${id}` : ''
      }
      if (host === 'vimeo.com') {
        const id = url.pathname.replace(/^\//, '')
        return id ? `https://player.vimeo.com/video/${id}` : ''
      }
    } catch {}
    return ''
  }

  // gets first non-empty value
  const firstNonEmpty = (...vals) => vals.find(v => v != null && String(v).trim() !== '') || ''
  //extract seller contacts
  const extractContact = (listing) => {
    if (!listing) return { nickname: '', email: '', phone: '' }
    const seller  = listing.seller ?? listing.owner ?? listing.user ?? {}
    const profile = seller.profile ?? listing.seller_profile ?? listing.owner_profile ?? listing.user_profile ?? {}

    // nickname priority
    const nickname = firstNonEmpty(
      listing.seller_nickname,
      profile.nickname,
      seller.nickname,
      seller.username,
      `${seller.first_name || ''} ${seller.last_name || ''}`.trim()
    )

    const email = firstNonEmpty(listing.seller_contact_email, profile.email, seller.email)
    const phone = firstNonEmpty(listing.seller_contact_phone, profile.phone_e164, profile.phone, seller.phone)

    return { nickname, email, phone }
  }
  //construct an adrress
  const buildAddress = (listing, names) => {
    const parts = [
      listing.address,
      listing.address_line,
      listing.street,
      listing.location_address,
      listing.postal_code,
      names.city,
      names.region,
    ].filter(v => v && String(v).trim() !== '')
    return parts.join(', ')
  }

  // Maps search URL
  const mapsUrl = (addr) => addr ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}` : ''


  // images list (sorted by order)
  const images = useMemo(() => {
    const list = Array.isArray(listing?.images) ? listing.images.slice() : []
    list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || (a.id ?? 0) - (b.id ?? 0))
    return list
  }, [listing])
  //feature names if server returns features_detailwww
  const featureNames = Array.isArray(listing?.features_detail)
  ? listing.features_detail.map(f => f?.name || f?.label).filter(Boolean)
  : []

  const [activeIdx, setActiveIdx] = useState(0)

  const auth = useAuth()
  const isAuthed = !!auth?.isAuthed
  const [isFav, setIsFav] = useState(!!listing?.is_favorited)

  useEffect(() => {
    setIsFav(!!listing?.is_favorited)
  }, [listing?.is_favorited])

  async function toggleFavDetail() {
    if (!isAuthed || !listing?.id) return
    try {
      if (!isFav) await api.post(endpoints.favorite(listing.id))
      else await api.delete(endpoints.favorite(listing.id))
      setIsFav(v => !v)
    } catch (e) {
      console.error('favorite toggle failed', e)
    }
  }

  // reset to first photo when navigating to a different listing id
  useEffect(() => { setActiveIdx(0) }, [id])

  //get catalog name by id
  const fetchName = async (base, id) => {
    if (!id) return ''
    try {
      const { data } = await api.get(`${base}${id}/`)
      return data?.name ?? data?.title ?? data?.label ?? `#${id}`
    } catch {
      return `#${id}`
    }
  }

  // load me and listing details

  useEffect(() => {
    let alive = true
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const [{ data: meData }, { data: detail }] = await Promise.all([
          // me can fail if it is public page, so let's not block it
          api.get(endpoints.me).catch(() => ({ data: null })),
          api.get(`${endpoints.listings}/${id}/`),
        ])

        if (!alive) return
        setMe(meData)
        setListing(detail)

        // figure out ids for catalogs
        const categoryId    = getId(detail.category ?? detail.category_id)
        const brandId       = getId(detail.brand ?? detail.brand_id)
        const modelId       = getId(detail.model ?? detail.model_id)
        const fuelId        = getId(detail.fuel_type ?? detail.fuel_type_id)
        const transId       = getId(detail.transmission ?? detail.transmission_id)
        const bodyId        = getId(detail.body_type ?? detail.body_type_id)
        const driveId       = getId(detail.drive_type ?? detail.drive_type_id)
        const colorId       = getId(detail.color ?? detail.color_id)
        // If region missing, infer from city
        let regionId        = getId(detail.region ?? detail.region_id)
        const cityId        = getId(detail.city ?? detail.city_id)

        if (!regionId && cityId) {
          try {
            const { data: cityObj } = await api.get(`${endpoints.cities}${cityId}/`)
            if (cityObj?.region) regionId = String(cityObj.region)
          } catch {}
        }

        const [
          categoryName, brandName, modelName, fuelName, transName,
          bodyName, driveName, colorName, regionName, cityName,
        ] = await Promise.all([
          fetchName(endpoints.categories, categoryId),
          fetchName(endpoints.brands, brandId),
          fetchName(endpoints.models, modelId),
          fetchName(endpoints.fueltypes, fuelId),
          fetchName(endpoints.transmissions, transId),
          fetchName(endpoints.bodytypes, bodyId),
          fetchName(endpoints.drivetypes, driveId),
          fetchName(endpoints.colors, colorId),
          fetchName(endpoints.regions, regionId),
          fetchName(endpoints.cities, cityId),
        ])

        if (!alive) return
        setNames({
          category: categoryName,
          brand: brandName,
          model: modelName,
          fuel_type: fuelName,
          transmission: transName,
          body_type: bodyName,
          drive_type: driveName,
          color: colorName,
          region: regionName,
          city: cityName,
        })
      } catch (e) {
        console.error(e)
        if (e?.response?.status === 404) setError('Listing not found.')
        else setError('Failed to load listing.')
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [id])

  // actions
  //is the current user is owner of the listing
  const isOwner = (() => {
    if (!me || !listing) return false
    const ownerId = getId(listing.owner ?? listing.user ?? listing.created_by)
    return String(ownerId) === String(me.id ?? '')
  })()

  // render

  if (loading) {
    return (
      <div className="py-6">
        <Container>
          <SectionHeader title="Listing" subtitle="Loading…" />
        </Container>
      </div>
    )
  }

  if (error || !listing) {
    return (
      <div className="py-6">
        <Container>
          <SectionHeader title="Listing" subtitle={error || 'Error'} />
          <div className="mt-4">
            <Button variant="secondary" onClick={() => navigate(-1)}>Back</Button>
          </div>
        </Container>
      </div>
    )
  }
  const absUrl = (u) => { //abs url for images
  if (!u) return ''
  if (/^https?:\/\//i.test(u)) return u
  const base = (api?.defaults?.baseURL || '').replace(/\/api\/?$/, '')
  return `${base.replace(/\/+$/, '')}${u.startsWith('/') ? '' : '/'}${u}`
  }

  const contact = extractContact(listing)
  const addressText = buildAddress(listing, names)
  const embedUrl = toEmbedUrl(listing.video_url)
  const priceText = listing.price != null && listing.price !== '' ? money.format(listing.price) : '—'
  const mainSrc = images[activeIdx]?.image ? absUrl(images[activeIdx].image) : ''
  
  return (
    <div className="py-6">
      <Container>
        <SectionHeader
          title={listing.title || 'Listing'}
          subtitle="Full vehicle details"
          actions={<Button variant="secondary" onClick={() => navigate(-1)}>Back</Button>}
        />

        {/* Top summary */}
        <Card className="mb-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-lg font-semibold text-neutral-900 dark:text-white">
                {names.brand && names.model ? `${names.brand} ${names.model}` : (names.brand || names.model || '—')}
              </div>
              <div className="text-sm text-neutral-500 dark:text-neutral-400">
                {names.category || '—'}
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="text-2xl font-bold text-neutral-900 dark:text-white">
                {priceText} <span className="text-base font-medium opacity-70">EUR</span>
              </div>
              {me && (
              <button
                type="button"
                onClick={toggleFavDetail}
                title={isFav ? 'Remove from favorites' : 'Add to favorites'}
                aria-pressed={isFav}
                aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
                className={`text-2xl leading-none select-none transition-opacity ${
                  isFav ? 'opacity-100' : 'opacity-60 hover:opacity-90'
                }`}
              >
                {isFav ? '❤' : '♡'}
              </button>
              )}
            </div>
          </div>
        </Card>

        {/* Specs & location */}
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">

                {images.length > 0 && (
          <Card className="lg:col-span-2">
            <h3 className="mb-3 text-sm font-semibold text-neutral-900 dark:text-white">Photos</h3>

            <div className="grid gap-3 lg:grid-cols-[2fr_1fr]">
              {/* Main photo */}
              <div className="aspect-[4/3] w-full overflow-hidden rounded-lg bg-neutral-100 dark:bg-gray-800">
                {mainSrc ? (
                  <img
                    src={mainSrc}
                    alt={`${names.brand || ''} ${names.model || ''} photo`}
                    className="h-full w-full object-contain object-center"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm text-neutral-500">
                    No image
                  </div>
                )}
              </div>

              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="grid grid-cols-4 gap-3">
                  {images.map((img, i) => (
                    <button
                      key={img.id ?? i}
                      onClick={() => setActiveIdx(i)}
                      className={`aspect-square overflow-hidden rounded-lg border ${
                        i === activeIdx
                          ? 'ring-2 ring-brand-500'
                          : 'border-neutral-200 dark:border-neutral-700'
                      }`}
                      aria-label={`Show photo ${i + 1}`}
                    >
                      <img
                        src={absUrl(img.image)}
                        alt={`Thumbnail ${i + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </Card>
        )}
          <Card>
            <h3 className="mb-3 text-sm font-semibold text-neutral-900 dark:text-white">Production & specs</h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                <div>
                  <div className={labelTextCls}>Brand</div>
                  <div className={valueTextCls}>{names.brand || '—'}</div>
                </div>
                <div>
                  <div className={labelTextCls}>Model</div>
                  <div className={valueTextCls}>{names.model || '—'}</div>
                </div>
              <div>
                <div className={labelTextCls}>Year</div>
                <div className={valueTextCls}>{listing.year || '—'}</div>
              </div>
              <div>
                <div className={labelTextCls}>Mileage (km)</div>
                <div className={valueTextCls}>{listing.mileage ?? '—'}</div>
              </div>
              <div>
                <div className={labelTextCls}>Fuel type</div>
                <div className={valueTextCls}>{names.fuel_type || '—'}</div>
              </div>
              <div>
                <div className={labelTextCls}>Gearbox</div>
                <div className={valueTextCls}>{names.transmission || '—'}</div>
              </div>
              <div>
                <div className={labelTextCls}>Body type</div>
                <div className={valueTextCls}>{names.body_type || '—'}</div>
              </div>
              <div>
                <div className={labelTextCls}>Drive type</div>
                <div className={valueTextCls}>{names.drive_type || '—'}</div>
              </div>
              <div>
                <div className={labelTextCls}>Engine CC</div>
                <div className={valueTextCls}>{listing.engine_cc ?? '—'}</div>
              </div>
              <div>
                <div className={labelTextCls}>Power (hp)</div>
                <div className={valueTextCls}>{listing.power_hp ?? '—'}</div>
              </div>
              <div>
                <div className={labelTextCls}>Color</div>
                <div className={valueTextCls}>{names.color || '—'}</div>
              </div>
              <div>
                <div className={labelTextCls}>Euro Standard</div>
                <div className={valueTextCls}>{listing.euro_standard || '—'}</div>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="mb-3 text-sm font-semibold text-neutral-900 dark:text-white">Location</h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              {/* Area */}
              <div className="col-span-2">
                <div className="text-[11px] uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Area</div>
              </div>

              <div>
                <div className={labelTextCls}>Region</div>
                <div className={valueTextCls}>{names.region || '—'}</div>
              </div>
              <div>
                <div className={labelTextCls}>City</div>
                <div className={valueTextCls}>{names.city || '—'}</div>
              </div>

              {addressText && (
                <div className="col-span-2">
                  <div className={labelTextCls}>Address</div>
                  <div className={valueTextCls}>
                    <a href={mapsUrl(addressText)} target="_blank" rel="noreferrer" className="hover:underline">
                      {addressText}
                    </a>
                  </div>
                </div>
              )}

              {/* Contact */}
              {(contact.nickname || contact.phone || contact.email) && (
                <>
                  <div className="col-span-2 mt-2">
                    <div className="text-[11px] uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Seller contact</div>
                  </div>

                  {contact.nickname && (
                    <div className="col-span-2">
                      <div className={labelTextCls}>Nickname</div>
                      <div className={valueTextCls}>{contact.nickname}</div>
                    </div>
                  )}

                  {contact.phone && (
                    <div>
                      <div className={labelTextCls}>Phone</div>
                      <div className={valueTextCls}>
                        <a href={`tel:${contact.phone}`} className="hover:underline">{contact.phone}</a>
                      </div>
                    </div>
                  )}

                  {contact.email && (
                    <div>
                      <div className={labelTextCls}>Email</div>
                      <div className={valueTextCls}>
                        <a href={`mailto:${contact.email}`} className="hover:underline">{contact.email}</a>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </Card>
          {/* Extras / Features */}
          {featureNames.length > 0 && (
            <Card className="lg:col-span-2">
              <h3 className="mb-3 text-sm font-semibold text-neutral-900 dark:text-white">Extras</h3>
              <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
                {featureNames.map((name, i) => (
                  <li key={`${name}-${i}`} className="flex items-center gap-2 text-sm text-neutral-800 dark:text-neutral-100">
                    <span aria-hidden className="inline-block">✓</span>
                    <span>{name}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Description */}
          <Card className="lg:col-span-2">
            <h3 className="mb-3 text-sm font-semibold text-neutral-900 dark:text-white">Description</h3>
            <p className="text-sm leading-relaxed text-neutral-800 dark:text-neutral-100 whitespace-pre-wrap">
              {listing.description || '—'}
            </p>
          </Card>

          {/* Media */}
          {(embedUrl) && (
            <Card className="lg:col-span-2">
              <h3 className="mb-3 text-sm font-semibold text-neutral-900 dark:text-white">Video</h3>
              <div className="aspect-video w-full overflow-hidden rounded-lg">
                <iframe
                  src={embedUrl}
                  title="Listing video"
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            </Card>
          )}
        </div>
      </Container>
    </div>
  )
}
