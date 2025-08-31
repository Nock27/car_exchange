import { Routes, Route } from 'react-router-dom'
import Layout from '@/components/layout/Layout'

import Home from '@/pages/Home'
import Search from '@/pages/Search'
import AdvancedSearch from '@/pages/AdvancedSearch'
import ListingDetails from '@/pages/ListingDetails'
import CreateListing from '@/pages/CreateListing'
import MyListings from '@/pages/MyListings'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import NotFound from '@/pages/NotFound'
import RequireAuth from '@/components/routing/RequireAuth'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<Search />} />
        <Route path="/advanced-search" element={<AdvancedSearch />} />
        <Route path="/listing/:id" element={<ListingDetails />} />

        {/* Protected (seller actions) */}
        <Route element={<RequireAuth />}>
          <Route path="/create-listing" element={<CreateListing />} />
          <Route path="/my-listings" element={<MyListings />} />
        </Route>

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
