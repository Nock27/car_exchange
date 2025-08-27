export default function Button({
  variant = 'primary',
  className = '',
  as: Comp = 'button',
  ...props
}) {
  const base =
    'inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 transition-colors'
  const variants = {
    primary:
      'bg-brand-600 text-white hover:bg-brand-700 focus:ring-brand-400 dark:bg-brand-500 dark:hover:bg-brand-600',
    secondary:
      'border border-neutral-300 text-neutral-800 hover:bg-neutral-50 focus:ring-neutral-200 dark:border-gray-700 dark:text-neutral-100 dark:hover:bg-gray-800 dark:focus:ring-gray-700',
    ghost:
      'text-neutral-700 hover:bg-neutral-100 focus:ring-neutral-200 dark:text-neutral-200 dark:hover:bg-gray-800 dark:focus:ring-gray-700',
  }
  return <Comp className={`${base} ${variants[variant]} ${className}`} {...props} />
}
