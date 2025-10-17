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
}) {
  const handleFavClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (id != null) onToggleFavorite(id, !isFavorited)
  }
  const { isAuthed } = useAuth()
  const showFavButton = Boolean(showFavorite && isAuthed)

  return (
    <Card className="p-4">
      <div className="grid grid-cols-[120px_1fr] gap-4">
        <div className="overflow-hidden rounded-xl bg-neutral-100 dark:bg-gray-800">
          {image ? (
            <img src={image} alt={title} className="h-24 w-full object-cover" />
          ) : (
            <div className="flex h-24 w-full items-center justify-center text-xs text-neutral-500">
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
