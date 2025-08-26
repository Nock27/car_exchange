import { Link } from 'react-router-dom'
import { useAuth } from '@/auth/AuthContext'

export default function Header() {
  const { user, logout } = useAuth()
  return (
    <header className="border-b bg-white">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="text-xl font-semibold">Car Exchange</Link>
        <nav className="flex gap-4 text-sm">
          <Link to="/search" className="hover:underline">Search</Link>
          {user && <Link to="/create-listing" className="hover:underline">Post a Listing</Link>}
          {user && <Link to="/my-listings" className="hover:underline">My Listings</Link>}
          {!user ? (
            <>
              <Link to="/login" className="hover:underline">Login</Link>
              <Link to="/register" className="hover:underline">Register</Link>
            </>
          ) : (
            <button onClick={logout} className="hover:underline">Logout</button>
          )}
        </nav>
      </div>
    </header>
  )
}
