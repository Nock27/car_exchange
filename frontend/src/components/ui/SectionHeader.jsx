export default function SectionHeader({ title, subtitle, actions = null }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white">{title}</h2>
        {subtitle && (
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">{subtitle}</p>
        )}
      </div>
      {actions}
    </div>
  )
}
