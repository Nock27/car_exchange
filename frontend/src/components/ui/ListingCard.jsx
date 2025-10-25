import Card from './Card'
import Button from './Button'
import { useAuth } from '@/context/AuthContext'
import { Link } from 'react-router-dom'

export default function ListingCard({
  id = null,
  image = null,
  title = '2018 BMW 320d',
  price = '€15,900',
  specs = 'Diesel • 180,000 km • Automatic',
  location = 'Sofia, Bulgaria',
  isFavorited = false,
  onToggleFavorite = () => {},
  onView = () => {},
  showFavorite = true,
  status = null,
}) {
  const handleFavClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (id != null) onToggleFavorite(id, !isFavorited)
  }
  const { isAuthed } = useAuth()
  const showFavButton = Boolean(showFavorite && isAuthed)

  return (
    <Card className="p-4 relative">
      <div className="grid grid-cols-[120px_1fr] gap-4">
        <div className="relative overflow-hidden rounded-xl bg-neutral-100 dark:bg-gray-800">
          <div className="aspect-square" />
          {image ? (
            <img
              src={image}
              alt={title}
              loading="lazy"
              decoding="async"
              width="120"
              height="120"
              className="absolute inset-0 h-full w-full object-cover object-center"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-xs text-neutral-500">
              No image
            </div>
          )}
        </div>
        <div className="flex min-w-0 flex-col">
          <div className="flex justify-between gap-3">
            <h3 className="truncate text-base font-semibold text-neutral-900 dark:text-white">
              {title}
            </h3>
            <div className="flex items-start gap-2">
              <div className="flex items-start gap-2 shrink-0">
                <div className="text-brand-600 dark:text-brand-400 font-semibold">{price}</div>
                {showFavButton && (
                <button
                  type="button"
                  onClick={handleFavClick}
                  title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
                  aria-pressed={isFavorited}
                  aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
                  className={`text-xl leading-none select-none transition-opacity ${
                    isFavorited ? 'opacity-100' : 'opacity-60 hover:opacity-90'
                  }`}
                >
                  {isFavorited ? '❤' : '♡'}
                </button>
                )}
              </div>
            </div>
          </div>
          {/* Status badge (only shows on My Listings, where you'll pass status) */}
          {status && (
            <span
              className={`mt-1 w-fit rounded-full px-2 py-0.5 text-xs font-medium
                ${status === 'approved'
                  ? 'bg-green-100 text-green-800'
                  : status === 'pending'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-gray-200 text-gray-800'}`}>
              {status}
            </span>
          )}
          <div className="mt-1 truncate text-sm text-neutral-600 dark:text-neutral-300">{specs}</div>
          <div className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{location}</div>
          <div className="mt-3">
            <Button as={Link} to={`/listings/${id}`} className="px-3 py-1.5">
              View details
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}

export function ListingCardSkeleton() {
  return (
    <Card className="p-4 animate-pulse">
      <div className="grid grid-cols-[120px_1fr] gap-4">
        <div className="h-24 w-full rounded-xl bg-neutral-200 dark:bg-gray-800" />
        <div className="space-y-2">
          <div className="h-4 w-2/3 rounded bg-neutral-200 dark:bg-gray-800" />
          <div className="h-3 w-1/2 rounded bg-neutral-200 dark:bg-gray-800" />
          <div className="h-3 w-1/3 rounded bg-neutral-200 dark:bg-gray-800" />
          <div className="h-8 w-24 rounded-lg bg-neutral-200 dark:bg-gray-800" />
        </div>
      </div>
    </Card>
  )
}
