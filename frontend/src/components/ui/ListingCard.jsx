import { Link } from 'react-router-dom'

export default function ListingCard({
  id,
  title,
  price,
  year,
  mileage,
  city,
  thumbnailUrl, // optional image
  brandName,
  modelName,
}) {
  return (
    <Link to={`/listing/${id}`} className="block border rounded overflow-hidden bg-white hover:shadow">
      <div className="aspect-[4/3] bg-gray-100">
        {thumbnailUrl ? (
          <img src={thumbnailUrl} alt={title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">No image</div>
        )}
      </div>
      <div className="p-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold line-clamp-1">{title}</h3>
          <div className="text-blue-700 font-bold">{price ? `${price} лв.` : '—'}</div>
        </div>
        <div className="mt-1 text-xs text-gray-600">
          {(brandName || modelName) && <span>{brandName} {modelName}</span>}
          {year && <span> · {year}</span>}
          {mileage && <span> · {Number(mileage).toLocaleString()} km</span>}
          {city && <span> · {city}</span>}
        </div>
      </div>
    </Link>
  )
}
