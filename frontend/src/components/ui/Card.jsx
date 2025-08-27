export default function Card({ className = '', children }) {
  const base =
    'rounded-2xl border border-neutral-200 bg-white/70 p-5 shadow-sm backdrop-blur ' +
    'dark:border-gray-800 dark:bg-gray-900/70'
  return <div className={`${base} ${className}`}>{children}</div>
}
