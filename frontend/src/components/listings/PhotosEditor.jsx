import { useEffect, useRef, useState } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { api, endpoints } from '@/lib/api'

const absUrl = (u) => {
  if (!u) return ''
  if (/^https?:\/\//i.test(u)) return u
  const base = (api?.defaults?.baseURL || '').replace(/\/api\/?$/, '').replace(/\/+$/, '')
  return `${base}${u.startsWith('/') ? '' : '/'}${u}`
}

export function PhotosEditor({ listingId, initialImages = [], maxImages = 15, onChange }) {
  const [images, setImages] = useState(() =>
    (initialImages || []).slice().sort((a,b)=>(a.order??0)-(b.order??0)||(a.id??0)-(b.id??0))
  )
  const [busy, setBusy] = useState(false)
  const fileRef = useRef(null)

  useEffect(() => {
    // keep in sync if parent reloads
    setImages((initialImages || []).slice().sort((a,b)=>(a.order??0)-(b.order??0)||(a.id??0)-(b.id??0)))
  }, [initialImages])

  useEffect(() => { onChange?.(images) }, [images, onChange])

  const remaining = Math.max(0, maxImages - images.length)
  const choose = () => fileRef.current?.click()

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    const toUpload = files.slice(0, remaining)
    if (!toUpload.length) return

    setBusy(true)
    try {
      const uploaded = []
      const baseOrder = images.length ? Math.max(...images.map(x => x.order ?? 0)) : 0
      for (let i = 0; i < toUpload.length; i++) {
        const form = new FormData()
        form.append('image', toUpload[i])
        form.append('order', String(baseOrder + i + 1))
        const { data } = await api.post(
          `${endpoints.listings}/${listingId}/upload_image/`,
          form,
          { headers: { 'Content-Type': 'multipart/form-data' } }
        )
        uploaded.push({ id: data.id, image: data.image, order: data.order })
      }
      setImages(prev => {
        const next = prev.concat(uploaded)
        next.sort((a,b)=>(a.order??0)-(b.order??0)||(a.id??0)-(b.id??0))
        return next
      })
    } catch (err) {
      console.error(err)
      alert('Upload failed.')
    } finally {
      setBusy(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const remove = async (img) => {
    if (!window.confirm('Remove this photo?')) return
    setBusy(true)
    try {
      const url = `${endpoints.listings}/${listingId}/images/${img.id}/`
      const res = await api.delete(url)
      if (!res || res.status === 200 || res.status === 204) {
        setImages(prev => prev.filter(x => x.id !== img.id))
        setBusy(false)
        return
      }
      throw new Error(res.statusText || 'Delete failed')
    } catch (e) {
      const msg =
        e?.response?.data?.detail ||
        e?.response?.data?.message ||
        e?.response?.statusText ||
        e?.message ||
        'Delete failed'
      alert(`Delete failed: ${msg}`)
      console.error('Delete failed:', e?.response || e)
    } finally {
      setBusy(false)
    }
  }


  return (
    <Card className="lg:col-span-2">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">Photos</h3>
        <span className="text-xs text-neutral-500 dark:text-neutral-400">{images.length}/{maxImages}</span>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={handleFiles}
      />

      <div className="mb-4">
        <Button type="button" onClick={choose} disabled={busy || remaining <= 0}>
          {remaining > 0 ? `Add photos (${remaining} left)` : 'Max photos reached'}
        </Button>
      </div>

      {images.length === 0 ? (
        <div className="flex h-32 items-center justify-center rounded-lg bg-neutral-100 text-sm text-neutral-500 dark:bg-gray-800">
          No photos yet
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {images.map((img) => (
            <div key={img.id} className="group relative">
              <div className="aspect-[4/3] w-full overflow-hidden rounded-lg bg-neutral-100 dark:bg-gray-800">
                <img
                  src={absUrl(img.image)}
                  alt="Listing photo"
                  className="h-full w-full object-contain object-center"
                  loading="lazy"
                />
              </div>
              <button
                type="button"
                onClick={() => remove(img)}
                disabled={busy}
                className="absolute right-2 top-2 rounded-md bg-black/60 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100"
                title="Delete"
                aria-label="Delete photo"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
