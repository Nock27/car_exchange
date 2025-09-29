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
      className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}
      onClick={onClick}
    >
      {children}
    </NavLink>
  )
}

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const { isAuthed, user, logout } = useAuth()

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white/80 backdrop-blur dark:bg-gray-950/80 dark:border-gray-800">
      <Container className="flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center" aria-label="Go to homepage">
          <img src={logo} alt="AutoDeal logo" className="w-[120px] h-[120px] object-contain md:w-[200px] md:h-[200px]" />
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          <NavItem to="/search">Browse</NavItem>
          <NavItem to="/advanced-search">Advanced Search</NavItem>
          <NavItem to="/map">Map search</NavItem>
          {isAuthed && (<NavLink to="/favorites" className={typeof linkCls !== 'undefined' ? linkCls : 'px-3 py-2 text-sm hover:underline'}>Favorites</NavLink>)}
          {isAuthed && <NavItem to="/my-listings">My Listings</NavItem>}
          {isAuthed && <NavItem to="/create-listing"><span className="text-brand-700 dark:text-brand-400">Post Listing</span></NavItem>}
          {isAuthed && <NavItem to="/profile">Profile</NavItem>}

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
              <Button variant="secondary" className="px-3 py-1.5" onClick={() => logout()}>
                Logout
              </Button>
            </>
          )}

          <div className="ml-2">
            <ThemeToggle />
          </div>
        </nav>

        <button
          className="inline-flex items-center rounded-md p-2 text-neutral-700 hover:bg-neutral-100 md:hidden dark:text-neutral-200 dark:hover:bg-gray-800"
          aria-label="Open menu"
          onClick={() => setOpen((o) => !o)}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
        </button>
      </Container>

      {open && (
        <div className="border-t bg-white/95 py-2 shadow-md dark:border-gray-800 dark:bg-gray-950/95 md:hidden">
          <Container className="flex flex-col">
            <NavItem to="/search" onClick={() => setOpen(false)}>Browse</NavItem>
            <NavItem to="/advanced-search" onClick={() => setOpen(false)}>Advanced Search</NavItem>
            <NavItem to="/map" onClick={() => setOpen(false)}>Map search</NavItem>

            {isAuthed && <NavItem to="/my-listings" onClick={() => setOpen(false)}>My Listings</NavItem>}
            {isAuthed && <NavItem to="/create-listing" onClick={() => setOpen(false)}><span className="text-brand-700 dark:text-brand-400">Post Listing</span></NavItem>}
            {isAuthed && <NavItem to="/profile" onClick={() => setOpen(false)}>Profile</NavItem>}

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
