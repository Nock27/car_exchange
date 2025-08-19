import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'

// Map dependencies
import 'leaflet/dist/leaflet.css'
import 'leaflet-control-geocoder/dist/Control.Geocoder.css'

function Home(){ return <h1 className="text-2xl font-semibold">Home</h1> }
function Search(){ return <h1 className="text-2xl font-semibold">Search</h1> }

function App(){
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="bg-white border-b">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <a className="font-bold" href="/">AutoSite</a>
          <nav className="flex gap-4 text-sm">
            <a className="hover:text-blue-600" href="/">Home</a>
            <a className="hover:text-blue-600" href="/search">Search</a>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Routes>
          <Route path="/" element={<Home/>} />
          <Route path="/search" element={<Search/>} />
        </Routes>
      </main>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter><App /></BrowserRouter>
)
