import { useEffect, useRef } from 'react'
import Button from '@/components/ui/Button'

/**
 * Props:
 *  - files: [{ id, file: File, preview: string }]
 *  - setFiles: function
 *  - max: number (default 15)
 *
 * Behavior:
 *  - Selecting files APPENDS to the list (no overwrite)
 *  - Dedup by name+size
 *  - Show previews
 *  - Remove (×) per file
 */
export default function PhotosPicker({ files, setFiles, max = 15 }) {
  const inputRef = useRef(null)

  useEffect(() => {
    return () => {
      files?.forEach?.((p) => p.preview && URL.revokeObjectURL(p.preview))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onPick = (e) => {
    const chosen = Array.from(e.target.files || []).filter(f => f.type.startsWith('image/'))
    if (!chosen.length) { e.target.value = ''; return }

    const existingKeys = new Set(files.map(p => `${p.file.name}::${p.file.size}`))
    const additions = []

    for (const f of chosen) {
      const key = `${f.name}::${f.size}`
      if (existingKeys.has(key)) continue
      additions.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        file: f,
        preview: URL.createObjectURL(f),
      })
    }

    const next = [...files, ...additions].slice(0, max)
    setFiles(next)
    e.target.value = '' // allow re-picking same files later
  }

  const removeId = (id) => {
    const victim = files.find(p => p.id === id)
    if (victim?.preview) URL.revokeObjectURL(victim.preview)
    setFiles(files.filter(p => p.id !== id))
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={onPick}
      />
      <div className="mb-2 flex items-center justify-between">
        <div className="text-sm text-neutral-600 dark:text-neutral-300">
          {files.length} / {max} selected
        </div>
        <Button type="button" variant="secondary" onClick={() => inputRef.current?.click()}>
          Add photos
        </Button>
      </div>

      {files.length > 0 ? (
        <ul className="grid grid-cols-3 gap-3 md:grid-cols-5">
          {files.map(p => (
            <li key={p.id} className="group relative overflow-hidden rounded-lg border">
              <img
                src={p.preview}
                alt={p.file.name}
                className="h-28 w-full object-cover"
                loading="lazy"
              />
              <button
                type="button"
                aria-label="Remove photo"
                onClick={() => removeId(p.id)}
                className="absolute right-1 top-1 rounded-full bg-black/60 px-2 py-1 text-xs text-white opacity-90 transition hover:bg-black"
                title="Remove"
              >
                ×
              </button>
              <div className="absolute bottom-0 left-0 right-0 truncate bg-black/40 px-1 py-0.5 text-[10px] text-white">
                {p.file.name}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-neutral-500">You can post without photos, or add up to {max} images.</p>
      )}
    </div>
  )
}
