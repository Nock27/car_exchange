import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import Container from './Container'
import logo from '@/assets/autodeal_logo.png'
import ThemeToggle from '@/components/ui/ThemeToggle'

const linkBase =
  'inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors'

// add dark variants for hover/active
const linkInactive =
  'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 ' +
  'dark:text-neutral-300 dark:hover:text-white dark:hover:bg-gray-800'

const linkActive =
  'text-neutral-900 bg-neutral-100 ' +
  'dark:text-white dark:bg-gray-800'

function NavItem({ to, children, onClick }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `${linkBase} ${isActive ? linkActive : linkInactive}`
      }
      onClick={onClick}
    >
      {children}
    </NavLink>
  )
}

export default function Navbar() {
  const [open, setOpen] = useState(false)

  return (
    <header
      className="
        sticky top-0 z-40 w-full border-b bg-white/80 backdrop-blur
        dark:bg-gray-950/80 dark:border-gray-800
      "
    >
      <Container className="flex h-16 items-center justify-between">
        {/* Logo (left) */}
        <Link to="/" className="flex items-center">
          <img
            src={logo}
            alt="AutoDeal logo"
            className="w-[200px] h-[200px] object-contain"
          />
        </Link>

        {/* Desktop nav (center/right) */}
        <nav className="hidden items-center gap-1 md:flex">
          <NavItem to="/search">Browse</NavItem>
          <NavItem to="/my-listings">My Listings</NavItem>
          <NavItem to="/create-listing">
            <span className="text-brand-700 dark:text-brand-400">Post Listing</span>
          </NavItem>

          <div className="mx-3 h-6 w-px bg-neutral-200 dark:bg-gray-700" />

          <NavItem to="/login">Login</NavItem>
          <NavItem to="/register">Register</NavItem>

          {/* Theme toggle on the far right */}
          <div className="ml-2">
            <ThemeToggle />
          </div>
        </nav>

        {/* Mobile menu button (right) */}
        <button
          className="inline-flex items-center rounded-md p-2 text-neutral-700 hover:bg-neutral-100 md:hidden
                     dark:text-neutral-200 dark:hover:bg-gray-800"
          aria-label="Toggle menu"
          onClick={() => setOpen(v => !v)}
        >
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            {open ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </Container>

      {/* Mobile nav panel */}
      {open && (
        <div className="border-t bg-white md:hidden dark:border-gray-800 dark:bg-gray-950">
          <Container className="flex flex-col gap-1 py-2">
            <NavItem to="/search" onClick={() => setOpen(false)}>Browse</NavItem>
            <NavItem to="/my-listings" onClick={() => setOpen(false)}>My Listings</NavItem>
            <NavItem to="/create-listing" onClick={() => setOpen(false)}>
              <span className="text-brand-700 dark:text-brand-400">Post Listing</span>
            </NavItem>

            <div className="my-2 h-px w-full bg-neutral-200 dark:bg-gray-700" />

            <NavItem to="/login" onClick={() => setOpen(false)}>Login</NavItem>
            <NavItem to="/register" onClick={() => setOpen(false)}>Register</NavItem>

            {/* Theme toggle in mobile panel */}
            <div className="mt-2">
              <ThemeToggle />
            </div>
          </Container>
        </div>
      )}
    </header>
  )
}
