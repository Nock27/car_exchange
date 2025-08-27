import { useEffect, useState } from 'react'

const getInitial = () => {
  const stored = localStorage.getItem('theme')
  if (stored === 'dark') return true
  if (stored === 'light') return false
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
}

export default function ThemeToggle() {
  const [dark, setDark] = useState(getInitial)

  useEffect(() => {
    const root = document.documentElement
    if (dark) {
      root.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      root.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }, [dark])

  return (
    <button
      onClick={() => setDark(v => !v)}
      className="rounded-md border px-3 py-1 text-sm
                 border-gray-300 bg-white text-gray-700 hover:bg-gray-100
                 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
      aria-label="Toggle theme"
      title={dark ? 'Switch to light' : 'Switch to dark'}
    >
      {dark ? '🌙 Dark' : '☀️ Light'}
    </button>
  )
}
