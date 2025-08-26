import { Routes, Route } from 'react-router-dom'
import Header from '@/components/layout/Header'
import Home from '@/pages/Home'
import Search from '@/pages/Search'
import ListingDetails from '@/pages/ListingDetails'
import CreateListing from '@/pages/CreateListing'
import MyListings from '@/pages/MyListings'
import Login from '@/pages/Login'
import Register from '@/pages/Register'

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<Search />} />
          <Route path="/listing/:id" element={<ListingDetails />} />
          <Route path="/create-listing" element={<CreateListing />} />
          <Route path="/my-listings" element={<MyListings />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </main>
      <footer className="border-t text-sm text-gray-600">
        <div className="max-w-6xl mx-auto px-4 py-4">© {new Date().getFullYear()} Car Exchange</div>
      </footer>
    </div>
  )
}
