import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'
import SkipLink from './SkipLink'

export default function Layout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SkipLink />
      <Navbar />
      <main id="main" className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
