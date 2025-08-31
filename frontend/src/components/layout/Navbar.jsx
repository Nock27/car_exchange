import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import Container from './Container'
import logo from '@/assets/autodeal_logo.png'
import ThemeToggle from '@/components/ui/ThemeToggle'
import { useAuth } from '@/context/AuthContext'
import Button from '@/components/ui/Button'

const linkBase =
  'inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors'

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
  const { isAuthed, user, logout } = useAuth()
  const isSeller = isAuthed && user?.role === 'seller'

  return (
    <header
      className="
        sticky top-0 z-40 w-full border-b bg-white/80 backdrop-blur
        dark:bg-gray-950/80 dark:border-gray-800
      "
    >
      <Container className="flex h-16 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center" aria-label="Go to homepage">
          <img
            src={logo}
            alt="AutoDeal logo"
            className="w-[120px] h-[120px] object-contain md:w-[200px] md:h-[200px]"
          />
        </Link>

        {/* Desktop */}
        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          <NavItem to="/search">Browse</NavItem>

          {isSeller && <NavItem to="/my-listings">My Listings</NavItem>}
          {isSeller && (
            <NavItem to="/create-listing">
              <span className="text-brand-700 dark:text-brand-400">Post Listing</span>
            </NavItem>
          )}

          {!isAuthed && (
            <>
              <NavItem to="/login">Login</NavItem>
              <NavItem to="/register">Register</NavItem>
            </>
          )}

          {isAuthed && (
            <>
              <span className="mx-2 max-w-[160px] truncate text-sm text-neutral-500 dark:text-neutral-400">
                {user?.username}
              </span>
              <Button variant="secondary" className="px-3 py-1.5" onClick={logout}>
                Logout
              </Button>
            </>
          )}

          <div className="ml-2">
            <ThemeToggle />
          </div>
        </nav>

        {/* Mobile */}
        <button
          className="inline-flex items-center rounded-md p-2 text-neutral-700 hover:bg-neutral-100 md:hidden
                     dark:text-neutral-200 dark:hover:bg-gray-800"
          aria-label="Toggle menu"
          aria-controls="mobile-menu"
          aria-expanded={open}
          onClick={() => setOpen(v => !v)}
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
            {open ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </Container>

      {open && (
        <div id="mobile-menu" className="border-t bg-white md:hidden dark:border-gray-800 dark:bg-gray-950">
          <Container className="flex flex-col gap-1 py-2">
            <NavItem to="/search" onClick={() => setOpen(false)}>Browse</NavItem>

            {isSeller && (
              <>
                <NavItem to="/my-listings" onClick={() => setOpen(false)}>My Listings</NavItem>
                <NavItem to="/create-listing" onClick={() => setOpen(false)}>
                  <span className="text-brand-700 dark:text-brand-400">Post Listing</span>
                </NavItem>
              </>
            )}

            {!isAuthed && (
              <>
                <NavItem to="/login" onClick={() => setOpen(false)}>Login</NavItem>
                <NavItem to="/register" onClick={() => setOpen(false)}>Register</NavItem>
              </>
            )}

            {isAuthed && (
              <Button variant="secondary" className="mt-1 px-3 py-1.5" onClick={() => { logout(); setOpen(false) }}>
                Logout
              </Button>
            )}

            <div className="mt-2">
              <ThemeToggle />
            </div>
          </Container>
        </div>
      )}
    </header>
  )
}
