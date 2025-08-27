import Card from './Card'
import Button from './Button'

export default function ListingCard({
  image = null,
  title = '2018 BMW 320d',
  price = '€15,900',
  specs = 'Diesel • 180,000 km • Automatic',
  location = 'Sofia, Bulgaria',
  onView = () => {},
}) {
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
            <div className="shrink-0 text-brand-600 dark:text-brand-400 font-semibold">{price}</div>
          </div>
          <div className="mt-1 truncate text-sm text-neutral-600 dark:text-neutral-300">{specs}</div>
          <div className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{location}</div>
          <div className="mt-3">
            <Button onClick={onView} className="px-3 py-1.5">View details</Button>
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
