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
import Profile from '@/pages/Profile'
import RequirePhone from '@/components/routing/RequirePhone'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="/search" element={<Search />} />

        {/* BOTH paths resolve to the advanced search page */}
        <Route path="/advanced-search" element={<AdvancedSearch />} />
        <Route path="/advanced" element={<AdvancedSearch />} />

        <Route path="/listing/:id" element={<ListingDetails />} />

        {/* Protected routes */}
        <Route element={<RequireAuth />}>
          <Route element={<RequirePhone />}>
            <Route path="/create-listing" element={<CreateListing />} />
          </Route>
          <Route path="/my-listings" element={<MyListings />} />
          <Route path="/profile" element={<Profile />} />
        </Route>

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
