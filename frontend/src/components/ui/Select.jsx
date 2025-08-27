export default function Select({ className = '', children, ...props }) {
  const base =
    'w-full rounded-lg border bg-white/80 px-3 py-2 text-sm text-neutral-800 shadow-sm appearance-none ' +
    'border-neutral-300 focus:outline-none focus:ring-2 focus:ring-brand-300 ' +
    'dark:border-gray-700 dark:bg-gray-900/80 dark:text-neutral-100 dark:focus:ring-brand-500'
  return (
    <div className="relative">
      <select className={`${base} ${className}`} {...props}>
        {children}
      </select>
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400">▾</span>
    </div>
  )
}
