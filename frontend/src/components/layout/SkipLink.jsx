export default function SkipLink() {
  return (
    <a
      href="#main"
      className="sr-only focus:not-sr-only fixed left-3 top-3 z-[100] rounded bg-neutral-900 px-3 py-2 text-sm text-white shadow
                 dark:bg-gray-200 dark:text-gray-900"
    >
      Skip to content
    </a>
  )
}
