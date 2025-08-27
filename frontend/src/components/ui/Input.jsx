export default function Input({ className = '', ...props }) {
  const base =
    'w-full rounded-lg border bg-white/80 px-3 py-2 text-sm text-neutral-800 shadow-sm placeholder-neutral-400 ' +
    'border-neutral-300 focus:outline-none focus:ring-2 focus:ring-brand-300 ' +
    'dark:border-gray-700 dark:bg-gray-900/80 dark:text-neutral-100 dark:placeholder-neutral-500 dark:focus:ring-brand-500'
  return <input className={`${base} ${className}`} {...props} />
}
