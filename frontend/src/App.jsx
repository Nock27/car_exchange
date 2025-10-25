import { Routes, Route } from 'react-router-dom'
import Layout from '@/components/layout/Layout'

import Home from '@/pages/Home'
import Search from '@/pages/Search'
import AdvancedSearch from '@/pages/AdvancedSearch'
import CreateListing from '@/pages/CreateListing'
import MyListings from '@/pages/MyListings'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import NotFound from '@/pages/NotFound'
import RequireAuth from '@/components/routing/RequireAuth'
import Profile from '@/pages/Profile'
import RequirePhone from '@/components/routing/RequirePhone'
import EditListing from '@/pages/EditListing'
import ListingDetail from '@/pages/ListingDetail'
import MapView from '@/pages/MapView'
import Favorites from '@/pages/Favorites'

// Non-interactive pages
import Terms from '@/pages/Terms'
import Privacy from '@/pages/Privacy'
import Contact from '@/pages/Contact'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="/map" element={<MapView />} />
        <Route path="/search" element={<Search />} />

        <Route path="/advanced-search" element={<AdvancedSearch />} />
        {/* <Route path="/advanced" element={<AdvancedSearch />} /> */}
        <Route path="/listings/:id" element={<ListingDetail />} />


        {/* Protected routes, require authentication */}
        <Route element={<RequireAuth />}>
          {/* create listing requires also phone number */}
          <Route element={<RequirePhone />}>
            <Route path="/create-listing" element={<CreateListing />} />
          </Route>
          <Route path="/my-listings" element={<MyListings />} />
          <Route path="/listings/:id/edit" element={<EditListing />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/favorites" element={<Favorites />} />
        </Route>

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<NotFound />} />

        {/* Non interactive pages */}
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/contact" element={<Contact />} />
      </Route>
    </Routes>
  )
}
